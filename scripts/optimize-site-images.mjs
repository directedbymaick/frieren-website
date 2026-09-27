import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';

const root = path.resolve('public/assets/images');
const backupRoot = path.resolve('assets/optimization-originals');
const files = (await fs.readdir(root, { recursive: true })).filter(file => file.endsWith('.webp'));
const hashes = new Map();
const replacements = new Map();
let before = 0, after = 0;
for (const file of files) {
  const original = path.join(backupRoot, file);
  const target = path.join(root, file);
  await fs.mkdir(path.dirname(original), { recursive: true });
  try { await fs.copyFile(target, original, fs.constants.COPYFILE_EXCL); } catch (error) { if (error.code !== 'EEXIST') throw error; }
  const data = await fs.readFile(original);
  const hash = crypto.createHash('sha256').update(data).digest('hex');
  const url = '/assets/images/' + file.replaceAll('\\', '/');
  const canonical = hashes.get(hash) || url;
  hashes.set(hash, canonical);
  const texture = /gradient|texture/.test(file);
  const icon = file.includes('icons');
  const maxWidth = icon ? 128 : texture ? 1200 : 1600;
  const optimized = await sharp(data).resize({ width: maxWidth, withoutEnlargement: true }).webp({ quality: texture ? 85 : 90, effort: 5 }).toBuffer();
  const output = optimized.length < data.length ? optimized : data;
  await fs.writeFile(target, output);
  const version = crypto.createHash('sha256').update(output).digest('hex').slice(0, 8);
  replacements.set(url, `${canonical}?v=${version}`);
  before += data.length; after += output.length;
}
// Versioned URLs invalidate assets cached by the previous immutable policy.
for (const file of await fs.readdir('src', { recursive: true })) {
  if (!/\.(jsx?|css)$/.test(file)) continue;
  const location = path.join('src', file);
  let source = await fs.readFile(location, 'utf8');
  for (const [from, to] of replacements) {
    for (const encode of [value => value, encodeURI]) {
      source = source.split(encode(from) + "'").join(encode(to) + "'");
      source = source.split(encode(from) + '"').join(encode(to) + '"');
    }
  }
  await fs.writeFile(location, source);
}
await sharp(path.join(root, 'icons/staff-icon.webp')).resize(48, 48).png().toFile('public/favicon.png');
await sharp(path.join(root, 'icons/staff-icon.webp')).resize(180, 180).png().toFile('public/apple-touch-icon.png');
console.log(JSON.stringify({ before, after, saved: before - after }, null, 2));
