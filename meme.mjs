import { randomInt } from 'node:crypto';

const captions = [
  ['IT WORKS ON MY MACHINE', 'SO WE DEPLOYED MY MACHINE'],
  ['JUST ONE SMALL CHANGE', 'FORTY-SEVEN OPEN TABS LATER'],
  ['THE BUILD IS GREEN', 'MY COFFEE IS STILL COMPILING'],
  ['I FIXED THE BUG', 'IT HAS EVOLVED INTO A FEATURE'],
  ['PUSHED TO MAIN', 'TIME TO STARE AT THE DEPLOYMENT'],
  ['ME: I WILL GO TO BED EARLY', 'ALSO ME: ONE MORE COMMIT'],
  ['NO THOUGHTS', 'ONLY SUCCESSFUL HEALTH CHECKS'],
  ['WHEN THE DEMO WORKS FIRST TRY', 'ACT NATURAL'],
];

const scenes = [
  {
    name: 'Cat at a laptop', background: '#d3f786',
    drawing: `<ellipse cx="400" cy="505" rx="228" ry="28" fill="#18271e" opacity=".15"/>
      <path d="M253 300 L246 159 L343 218 Q400 194 457 218 L554 159 L547 300 Q560 421 400 431 Q240 421 253 300" fill="#e99753" stroke="#18271e" stroke-width="9"/>
      <path d="M265 188 L276 249 L318 226 M535 188 L524 249 L482 226" fill="#f3b8a5"/>
      <ellipse cx="336" cy="296" rx="20" ry="27" fill="#18271e"/><ellipse cx="464" cy="296" rx="20" ry="27" fill="#18271e"/>
      <path d="M387 332 L413 332 L400 346 Z M370 355 Q385 376 400 350 Q415 376 430 355" fill="#18271e" stroke="#18271e" stroke-width="5"/>
      <path d="M246 332 L306 340 M242 358 L306 355 M494 340 L554 332 M494 355 L558 358" stroke="#18271e" stroke-width="5"/>
      <path d="M265 388 L535 388 L510 505 L290 505 Z" fill="#384f45" stroke="#18271e" stroke-width="8"/>
      <circle cx="400" cy="447" r="15" fill="#d3f786"/><path d="M251 508 H549" stroke="#18271e" stroke-width="12" stroke-linecap="round"/>`,
  },
  {
    name: 'Robot with coffee', background: '#b8d9ff',
    drawing: `<ellipse cx="400" cy="508" rx="198" ry="25" fill="#18271e" opacity=".15"/>
      <path d="M400 174 V216" stroke="#18271e" stroke-width="10"/><circle cx="400" cy="168" r="16" fill="#f69da1" stroke="#18271e" stroke-width="7"/>
      <rect x="260" y="215" width="280" height="191" rx="38" fill="#f3f5ef" stroke="#18271e" stroke-width="9"/>
      <rect x="284" y="250" width="232" height="83" rx="20" fill="#18271e"/>
      <path d="M315 292 H350 M450 292 H485" stroke="#d3f786" stroke-width="12" stroke-linecap="round"/>
      <path d="M354 367 H446" stroke="#18271e" stroke-width="9" stroke-linecap="round"/>
      <path d="M307 411 V494 H493 V411" fill="#769fd4" stroke="#18271e" stroke-width="9"/>
      <path d="M266 431 L225 460 M534 431 L563 454" stroke="#18271e" stroke-width="18" stroke-linecap="round"/>
      <path d="M542 438 H606 V489 Q574 515 542 489 Z" fill="#f69da1" stroke="#18271e" stroke-width="7"/>
      <path d="M607 449 Q644 448 635 476 Q630 488 607 479 M559 414 Q547 398 561 384 M584 414 Q572 398 586 384" fill="none" stroke="#18271e" stroke-width="6"/>`,
  },
  {
    name: 'Very confident duck', background: '#ffd59f',
    drawing: `<ellipse cx="400" cy="500" rx="235" ry="35" fill="#66b6c1"/>
      <path d="M243 362 Q266 469 423 473 Q554 476 567 370 L501 388 Q490 337 428 336 Z" fill="#ffe36c" stroke="#18271e" stroke-width="9"/>
      <circle cx="337" cy="290" r="89" fill="#ffe36c" stroke="#18271e" stroke-width="9"/>
      <path d="M257 299 L180 318 L260 343" fill="#f08e48" stroke="#18271e" stroke-width="8" stroke-linejoin="round"/>
      <path d="M271 264 H395 L380 304 H347 L331 280 L315 304 H282 Z" fill="#18271e"/>
      <path d="M354 388 Q417 355 473 407 Q426 452 354 420" fill="#f5c549" stroke="#18271e" stroke-width="7"/>
      <path d="M202 505 H264 M540 505 H605 M296 535 H491" stroke="#18271e" stroke-width="5" stroke-linecap="round"/>`,
  },
  {
    name: 'Sleepy space explorer', background: '#c9b9ef',
    drawing: `<circle cx="194" cy="241" r="9" fill="#fff"/><circle cx="610" cy="340" r="7" fill="#fff"/>
      <path d="M592 201 V237 M574 219 H610 M202 410 V438 M188 424 H216" stroke="#fff" stroke-width="7"/>
      <ellipse cx="400" cy="514" rx="177" ry="25" fill="#18271e" opacity=".15"/>
      <path d="M302 369 L276 475 L341 496 L366 441 H434 L459 496 L524 475 L498 369" fill="#f3f5ef" stroke="#18271e" stroke-width="9"/>
      <circle cx="400" cy="294" r="123" fill="#f3f5ef" stroke="#18271e" stroke-width="9"/>
      <rect x="308" y="231" width="184" height="135" rx="57" fill="#384f45" stroke="#18271e" stroke-width="7"/>
      <path d="M334 293 Q351 310 368 293 M432 293 Q449 310 466 293" fill="none" stroke="#d3f786" stroke-width="8" stroke-linecap="round"/>
      <ellipse cx="400" cy="333" rx="12" ry="16" fill="#d3f786"/>
      <rect x="374" y="402" width="52" height="32" rx="5" fill="#f69da1" stroke="#18271e" stroke-width="6"/>`,
  },
];

function escapeMarkup(value) {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]);
}

export function createMeme(params) {
  const shuffle = params.has('shuffle');
  const image = params.get('image');
  const pair = captions[randomInt(captions.length)];
  return {
    image: !shuffle && /^[0-3]$/.test(image ?? '') ? Number(image) : randomInt(scenes.length),
    top: !shuffle && params.has('top') ? cleanCaption(params.get('top')) : pair[0],
    bottom: !shuffle && params.has('bottom') ? cleanCaption(params.get('bottom')) : pair[1],
  };
}

function cleanCaption(text) {
  return Array.from(text.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\ufffe\uffff]/g, '')).slice(0, 100).join('');
}

function captionLines(text) {
  const lines = [''];
  for (const word of text.split(/\s+/).filter(Boolean)) {
    for (const piece of word.match(/.{1,24}/gu) ?? []) {
      const last = lines.length - 1;
      if (Array.from(`${lines[last]} ${piece}`.trim()).length > 24) lines.push(piece);
      else lines[last] = `${lines[last]} ${piece}`.trim();
    }
  }
  return lines;
}

export function renderMemeImage(meme) {
  const scene = scenes[meme.image];
  const caption = (text, start) => captionLines(text).map((line, index) =>
    `<text x="400" y="${start + index * 36}">${escapeMarkup(line)}</text>`).join('');
  const bottomLines = captionLines(meme.bottom);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800" role="img" aria-labelledby="title">
    <title id="title">${escapeMarkup(`${scene.name}: ${meme.top} / ${meme.bottom}`)}</title>
    <rect width="800" height="800" fill="${scene.background}"/>
    <g transform="translate(0 56)">${scene.drawing}</g>
    <g font-family="Impact, Arial, sans-serif" font-size="32" font-weight="900" text-anchor="middle" fill="white" stroke="#18271e" stroke-width="5" paint-order="stroke" stroke-linejoin="round">
      ${caption(meme.top, 45)}
      ${caption(meme.bottom, 770 - (bottomLines.length - 1) * 36)}
    </g>
  </svg>`;
}

export function renderMeme(meme) {
  const query = new URLSearchParams({ image: String(meme.image), top: meme.top, bottom: meme.bottom });
  const imageUrl = escapeMarkup(`/meme.svg?${query}`);
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light">
  <link rel="icon" href="data:,">
  <title>Meme lab | App Service Builder</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; background: #f3f5ef; color: #18271e; font-family: Arial, Helvetica, sans-serif; }
    a { color: inherit; text-underline-offset: 4px; }
    header, main { max-width: 1120px; margin: auto; padding: 24px; }
    header { display: flex; justify-content: space-between; gap: 20px; border-bottom: 1px solid #c9d1c5; }
    h1 { font-size: clamp(36px, 6vw, 64px); letter-spacing: -.05em; margin: 12px 0; }
    .intro, .note { color: #4a5b4f; line-height: 1.6; }
    .workbench { display: grid; grid-template-columns: minmax(0, 1.3fr) minmax(260px, 1fr); gap: 32px; align-items: start; margin-top: 24px; }
    figure { margin: 0; }
    img { display: block; width: 100%; height: auto; border: 2px solid #18271e; border-radius: 16px; }
    figcaption { margin-top: 12px; color: #4a5b4f; font-size: 13px; }
    form { background: white; border: 1px solid #c9d1c5; padding: 24px; border-radius: 16px; }
    h2 { margin-top: 0; font-size: 22px; }
    label { display: block; font-size: 14px; font-weight: 700; margin-bottom: 8px; }
    textarea, select { width: 100%; font: inherit; padding: 12px; border: 1px solid #718477; border-radius: 6px; margin-bottom: 20px; background: white; color: #18271e; }
    textarea { min-height: 84px; resize: vertical; }
    button, .download { display: block; width: 100%; padding: 14px 18px; border: 2px solid #18271e; border-radius: 6px; background: #18271e; color: white; font: bold 15px Arial, sans-serif; text-align: center; cursor: pointer; text-decoration: none; margin-top: 12px; }
    button[name="shuffle"] { background: #d3f786; color: #18271e; }
    .download { background: transparent; color: #18271e; }
    :focus-visible { outline: 3px solid #477412; outline-offset: 4px; }
    .note { font-size: 13px; margin-bottom: 0; }
    @media (max-width: 700px) { .workbench { grid-template-columns: 1fr; gap: 24px; } header, main { padding: 20px; } }
  </style>
</head>
<body>
  <header><strong>App Service Builder / Meme lab</strong><a href="/demo">Back to demo</a></header>
  <main>
    <h1>Ship code. Make memes.</h1>
    <p class="intro">Random pictures. Questionable wisdom. One excellent use of a deployment.</p>
    <div class="workbench">
      <figure>
        <img src="${imageUrl}" width="800" height="800" alt="${escapeMarkup(`${scenes[meme.image].name}. ${meme.top}. ${meme.bottom}`)}">
        <figcaption>Original illustrations, served by this app. No external image service.</figcaption>
      </figure>
      <form action="/meme" method="get">
        <h2>Make it yours</h2>
        <label for="image">Picture</label>
        <select id="image" name="image">${scenes.map((scene, index) =>
          `<option value="${index}"${index === meme.image ? ' selected' : ''}>${scene.name}</option>`).join('')}</select>
        <label for="top">Top caption</label>
        <textarea id="top" name="top" maxlength="100">${escapeMarkup(meme.top)}</textarea>
        <label for="bottom">Bottom caption</label>
        <textarea id="bottom" name="bottom" maxlength="100">${escapeMarkup(meme.bottom)}</textarea>
        <button type="submit">Apply captions</button>
        <button type="submit" name="shuffle" value="1">Surprise me</button>
        <a class="download" href="${imageUrl}&amp;download=1" download="builder-meme.svg">Download meme (SVG)</a>
        <p class="note">Surprise me picks a random picture and caption pair. Captions are public text, not a place for secrets.</p>
      </form>
    </div>
  </main>
</body>
</html>`;
}
