import fs from 'node:fs/promises';

const url = 'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..700;1,9..144,300..700&family=Inter:wght@300..700&display=swap';
const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36' } });
if (!response.ok) throw new Error(`Font stylesheet: ${response.status}`);
const css = await response.text();
const blocks = [...css.matchAll(/\/\* latin \*\/\s*(@font-face\s*\{[^}]+\})/g)];
if (blocks.length < 3) throw new Error('Expected Latin font faces');
await fs.mkdir('public/assets/fonts', { recursive: true });
const result = [];
for (const [, block] of blocks) {
  const family = block.match(/font-family:\s*'([^']+)'/)[1].toLowerCase();
  const style = block.match(/font-style:\s*([^;]+)/)[1];
  const source = block.match(/url\(([^)]+)\)/)[1];
  const name = `${family}-${style}.woff2`;
  const file = await fetch(source);
  if (!file.ok) throw new Error(`Font file: ${file.status}`);
  await fs.writeFile(`public/assets/fonts/${name}`, Buffer.from(await file.arrayBuffer()));
  result.push(block.replace(source, `/assets/fonts/${name}`));
}
await fs.writeFile('src/styles/fonts.css', [...new Set(result)].join('\n'));
for (const family of ['fraunces', 'inter']) {
  const license = await fetch(`https://raw.githubusercontent.com/google/fonts/main/ofl/${family}/OFL.txt`);
  if (!license.ok) throw new Error(`Missing font license: ${family}`);
  await fs.writeFile(`public/assets/fonts/${family}-LICENSE.txt`, await license.text());
}
console.log('Vendored font faces:', result.length);
