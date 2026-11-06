import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { readFile } from 'node:fs/promises';
import { get } from 'node:http';
import { setTimeout as delay } from 'node:timers/promises';
import { test } from 'node:test';
import { renderDemo } from './demo.mjs';
import { createMeme, renderMeme, renderMemeImage } from './meme.mjs';

const root = new URL('./', import.meta.url);
const expectedBuilder = `components:
  - name: web
    role: web
    platform: nodejs
    platformVersion: "24"
    run:
      start: node server.mjs
      healthCheckPath: /health
`;

test('root manifests preserve the Node.js 24 startup contract with single-component defaults', async () => {
  const packageJson = JSON.parse(await readFile(new URL('package.json', root), 'utf8'));
  const lock = JSON.parse(await readFile(new URL('package-lock.json', root), 'utf8'));
  assert.equal(packageJson.private, true);
  assert.equal(packageJson.type, 'module');
  assert.deepEqual(packageJson.engines, { node: '24.x' });
  assert.equal(packageJson.scripts.start, 'node server.mjs');
  for (const key of ['dependencies', 'devDependencies', 'optionalDependencies']) {
    assert.deepEqual(packageJson[key] ?? {}, {});
  }
  assert.equal(lock.lockfileVersion, 3);
  assert.equal(lock.name, packageJson.name);
  assert.equal(lock.version, packageJson.version);
  assert.deepEqual(lock.packages, {
    '': {
      name: packageJson.name,
      version: packageJson.version,
      engines: packageJson.engines,
    },
  });
  assert.equal(await readFile(new URL('builder.yaml', root), 'utf8'), expectedBuilder);
});

// Assert the app's default binding, but use an OS-assigned port only in tests.
const testStartup = `
import assert from 'node:assert/strict';
import { Server } from 'node:http';
const listen = Server.prototype.listen;
Server.prototype.listen = function (port, host) {
  assert.equal(port, 8080);
  assert.equal(host, '0.0.0.0');
  this.once('listening', () => process.send(this.address().port));
  return listen.call(this, 0, host);
};
await import('./server.mjs');
`;

function request(port, path, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = get(`http://127.0.0.1:${port}${path}`, { headers }, (response) => {
      let body = '';
      response.setEncoding('utf8');
      response.on('data', (chunk) => { body += chunk; });
      response.on('error', reject);
      response.on('end', () => resolve({
        status: response.statusCode,
        type: response.headers['content-type'],
        body,
      }));
    });
    req.on('error', reject);
    req.setTimeout(1000, () => req.destroy(new Error(`Timed out requesting ${path}`)));
  });
}

async function waitForServer(child, port, getStderr) {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    assert.equal(child.exitCode, null, `Server exited: ${getStderr()}`);
    try {
      await request(port, '/health');
      return;
    } catch (error) {
      if (error.code !== 'ECONNREFUSED') throw error;
      await delay(100);
    }
  }
  throw new Error(`Server did not become ready: ${getStderr()}`);
}

test('HTTP routes and public greeting work with no external services', { timeout: 30000 }, async (t) => {
  for (const greeting of [undefined, 'Welcome', '', '<script>alert("x")</script> & \'hello\'', 'A'.repeat(500)]) {
    await t.test(`SAMPLE_GREETING=${greeting === undefined ? '(unset)' : JSON.stringify(greeting)}`, async () => {
      const env = { ...process.env };
      env.PRIVATE_TEST_VALUE = 'must-not-appear-in-demo';
      delete env.SAMPLE_GREETING;
      if (greeting !== undefined) env.SAMPLE_GREETING = greeting;
      const child = spawn(process.execPath, ['--input-type=module', '--eval', testStartup], {
        cwd: root,
        env,
        stdio: ['ignore', 'ignore', 'pipe', 'ipc'],
      });
      let stderr = '';
      child.stderr.setEncoding('utf8');
      child.stderr.on('data', (chunk) => { stderr += chunk; });
      const exited = once(child, 'exit');
      try {
        const port = await Promise.race([
          once(child, 'message').then(([port]) => port),
          exited.then(([code, signal]) => {
            throw new Error(`Server exited before listening (${code ?? signal}): ${stderr}`);
          }),
          delay(5000, undefined, { ref: false }).then(() => {
            throw new Error(`Server did not start listening: ${stderr}`);
          }),
        ]);
        assert.equal(Number.isInteger(port) && port > 0 && port <= 65535, true);
        await waitForServer(child, port, () => stderr);
        assert.deepEqual(await request(port, '/'), {
          status: 200,
          type: 'text/plain; charset=utf-8',
          body: `App Service Builder / nodejs-web: ${greeting || 'Hello from GitHub Desktop App!'}\n`,
        });
        assert.deepEqual(await request(port, '/', { Accept: 'text/html' }), {
          status: 200,
          type: 'text/plain; charset=utf-8',
          body: `App Service Builder / nodejs-web: ${greeting || 'Hello from GitHub Desktop App!'}\n`,
        });
        const demo = await request(port, '/demo');
        assert.equal(demo.status, 200);
        assert.equal(demo.type, 'text/html; charset=utf-8');
        assert.equal(demo.body, renderDemo(greeting || 'Hello from GitHub Desktop App!'));
        assert.ok(!demo.body.includes(env.PRIVATE_TEST_VALUE));
        assert.match(demo.body, /<html lang="en">/);
        assert.match(demo.body, /name="viewport"/);
        assert.match(demo.body, /href="\/health"/);
        assert.match(demo.body, /href="\/meme"/);
        if (greeting === undefined) {
          const query = new URLSearchParams({ image: '2', top: 'SHIP IT', bottom: 'ONE MORE COMMIT' });
          const meme = await request(port, `/meme?${query}`);
          assert.equal(meme.status, 200);
          assert.equal(meme.type, 'text/html; charset=utf-8');
          assert.match(meme.body, /Ship code\. Make memes\./);
          assert.match(meme.body, /Very confident duck/);
          assert.match(meme.body, /SHIP IT/);
          assert.match(meme.body, /name="shuffle"/);
          assert.ok(!meme.body.includes(env.PRIVATE_TEST_VALUE));
          const image = await request(port, `/meme.svg?${query}`);
          assert.equal(image.status, 200);
          assert.equal(image.type, 'image/svg+xml; charset=utf-8');
          assert.equal(image.body, renderMemeImage(createMeme(query)));
          assert.equal((await request(port, `/meme.svg?${query}&download=1`)).body, image.body);
          assert.equal((await request(port, '/meme')).status, 200);
          assert.equal((await request(port, '/meme?shuffle=1')).status, 200);
        }
        assert.deepEqual(await request(port, '/health'), {
          status: 200,
          type: 'text/plain; charset=utf-8',
          body: 'OK\n',
        });

        assert.deepEqual(await request(port, '/not-found'), {
          status: 404,
          type: 'text/plain; charset=utf-8',
          body: 'Not found\n',
        });
      } finally {
        if (child.exitCode === null) child.kill('SIGTERM');
        await exited;
      }
    });
  }
});

test('demo renders public greeting only as escaped text', () => {
  const html = renderDemo('<script>alert("x")</script> & \'hello\'');
  assert.ok(html.includes('&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &amp; &#39;hello&#39;'));
  assert.ok(!html.includes('<script>'));
  assert.ok(!html.includes('<script src='));
});

test('meme generator selects valid random scenes and supports custom captions', () => {
  for (let index = 0; index < 32; index += 1) {
    const meme = createMeme(new URLSearchParams());
    assert.ok(Number.isInteger(meme.image) && meme.image >= 0 && meme.image < 4);
    assert.ok(meme.top.length > 0 && meme.bottom.length > 0);
    assert.match(renderMemeImage(meme), /<svg xmlns=/);
  }
  const params = new URLSearchParams({ image: '3', top: '', bottom: 'Custom caption' });
  assert.deepEqual(createMeme(params), { image: 3, top: '', bottom: 'Custom caption' });
  params.set('shuffle', '1');
  assert.notEqual(createMeme(params).bottom, 'Custom caption');
});

test('meme captions are bounded, XML-safe, escaped, and preserved in image URLs', () => {
  const dangerous = '</textarea><script>alert("x")</script> & \'hello\'';
  const meme = createMeme(new URLSearchParams({ image: '0', top: dangerous, bottom: 'A'.repeat(200) }));
  assert.equal(meme.bottom.length, 100);
  const html = renderMeme(meme);
  assert.ok(html.includes('&lt;/textarea&gt;&lt;script&gt;'));
  assert.ok(!html.includes('<script>'));
  assert.ok(!renderMemeImage(meme).includes('<script>'));
  const source = html.match(/<img src="([^"]+)"/)[1].replaceAll('&amp;', '&');
  assert.deepEqual(createMeme(new URL(source, 'http://localhost').searchParams), meme);
  const cleaned = createMeme(new URLSearchParams({ top: '\u0000Hello\u0001', bottom: '😸'.repeat(150) }));
  assert.equal(cleaned.top, 'Hello');
  assert.equal(Array.from(cleaned.bottom).length, 100);
});
