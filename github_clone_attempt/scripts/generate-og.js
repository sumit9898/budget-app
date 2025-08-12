// Generates a small placeholder PNG at public/og.png (1x1)
const fs = require('fs');
const path = require('path');

const base64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Vt0x1QAAAAASUVORK5CYII=';
const buf = Buffer.from(base64, 'base64');
const out = path.join(process.cwd(), 'public', 'og.png');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, buf);
console.log('Wrote', out);

