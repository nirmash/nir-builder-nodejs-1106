import { createServer } from 'node:http';
import { renderDemo } from './demo.mjs';
import { createMeme, renderMeme, renderMemeImage } from './meme.mjs';

createServer((request, response) => {
  const url = new URL(request.url, 'http://localhost');
  const path = url.pathname;
  response.setHeader('Content-Type', 'text/plain; charset=utf-8');
  if (path === '/health') {
    response.writeHead(200).end('OK\n');
  } else if (path === '/demo') {
    response.setHeader('Content-Type', 'text/html; charset=utf-8');
    response.writeHead(200).end(renderDemo(process.env.SAMPLE_GREETING || 'Hello from GitHub Desktop App!'));
  } else if (path === '/meme' || path === '/meme.svg') {
    const meme = createMeme(url.searchParams);
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    if (path === '/meme.svg') {
      response.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
      if (url.searchParams.get('download') === '1') {
        response.setHeader('Content-Disposition', 'attachment; filename="builder-meme.svg"');
      }
      response.writeHead(200).end(renderMemeImage(meme));
    } else {
      response.setHeader('Content-Type', 'text/html; charset=utf-8');
      response.writeHead(200).end(renderMeme(meme));
    }
  } else if (path === '/') {
    // Only this deliberately public setting is reflected; never dump process.env.
    response.writeHead(200).end(
      `App Service Builder / nodejs-web: ${process.env.SAMPLE_GREETING || 'Hello from GitHub Desktop App!'}\n`,
    );
  } else {
    response.writeHead(404).end('Not found\n');
  }
}).listen(8080, '0.0.0.0');
