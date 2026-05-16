"""
Delete every `.png` / `.jpg` / `.jpeg` under `public/assets/images/`
that has a sibling `.webp` of the same base name. Safe: a file is
only removed if its WebP replacement is on disk.
"""
from pathlib import Path

deleted = []
kept = []
bytes_freed = 0

for p in Path('public/assets/images').rglob('*'):
    if not p.is_file():
        continue
    if p.suffix.lower() not in {'.png', '.jpg', '.jpeg'}:
        continue
    webp = p.with_suffix('.webp')
    if webp.exists():
        bytes_freed += p.stat().st_size
        p.unlink()
        deleted.append(str(p))
    else:
        kept.append(str(p))

print(f"Deleted {len(deleted)} original image(s).")
print(f"Kept    {len(kept)} (no WebP twin):")
for k in kept:
    print(f"  {k}")
print('')
print(f"Disk freed: {bytes_freed / 1024 / 1024:.2f} MB")
