/**
 * Walks `public/assets/images/` and writes a `.webp` next to every
 * `.png` / `.jpg` / `.jpeg` above 50 KB. The original is left in
 * place so we can revert by reverting code changes; remove the
 * originals manually after verifying the WebP versions look right.
 *
 * Usage: `node scripts/convert-to-webp.mjs`
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve('public/assets/images');
const MIN_BYTES = 50 * 1024;

// Quality tuning. Photos can take more compression before artifacts
// show; smooth gradient ramps are more sensitive to banding.
const PHOTO_QUALITY = 80;
const GRADIENT_QUALITY = 82;
// "gradient" or "texture" in the path → treat as gradient.
const isGradientLike = (p) =>
  /gradient|texture/i.test(p);

let bytesIn = 0;
let bytesOut = 0;
let filesConverted = 0;
let filesSkipped = 0;

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(full);
      continue;
    }
    const ext = path.extname(entry.name).toLowerCase();
    if (!['.png', '.jpg', '.jpeg'].includes(ext)) continue;
    const stat = await fs.stat(full);
    if (stat.size < MIN_BYTES) {
      filesSkipped++;
      continue;
    }
    const outPath = full.replace(/\.(png|jpe?g)$/i, '.webp');
    const quality = isGradientLike(full) ? GRADIENT_QUALITY : PHOTO_QUALITY;
    try {
      // `lossless: false` + `effort: 6` = best balance of size / time.
      // PNG transparency is preserved automatically by sharp.
      const info = await sharp(full)
        .webp({ quality, effort: 6, smartSubsample: true })
        .toFile(outPath);
      bytesIn += stat.size;
      bytesOut += info.size;
      filesConverted++;
      const pct = ((1 - info.size / stat.size) * 100).toFixed(1);
      const rel = path.relative(process.cwd(), full);
      console.log(
        `  ${(stat.size / 1024).toFixed(0).padStart(6)} KB → ${(info.size / 1024).toFixed(0).padStart(6)} KB  (-${pct.padStart(5)}%)  ${rel}`
      );
    } catch (err) {
      console.error(`  FAILED: ${full} — ${err.message}`);
    }
  }
}

console.log('Converting images in', ROOT);
console.log('');
await walk(ROOT);
console.log('');
console.log(`Files converted: ${filesConverted} (skipped ${filesSkipped} under ${MIN_BYTES / 1024} KB)`);
console.log(
  `Total: ${(bytesIn / 1024 / 1024).toFixed(2)} MB → ${(bytesOut / 1024 / 1024).toFixed(2)} MB (-${((1 - bytesOut / bytesIn) * 100).toFixed(1)}%)`
);
