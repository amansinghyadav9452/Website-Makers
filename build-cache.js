const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = path.join(__dirname, 'frontend');
const indexPath = path.join(root, 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');

for (const asset of ['style.css', 'script.js']) {
  const file = path.join(root, asset);
  const hash = crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex').slice(0, 12);
  const re = new RegExp(asset.replace('.', '\\.') + '(?:\\?v=[a-f0-9]+)?', 'g');
  html = html.replace(re, `${asset}?v=${hash}`);
}

fs.writeFileSync(indexPath, html);
console.log('Cache-busted frontend assets.');
