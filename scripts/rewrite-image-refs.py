"""
Rewrite every `.png` / `.jpg` / `.jpeg` reference in the source tree
to `.webp` when a matching WebP exists on disk under
`public/assets/images/`. Handles two patterns:

  1. Full-path references in any file:
       `/assets/images/world-locations/foo.png`
  2. Bare filenames in string literals (used by helpers like
     `IMG('foo.png')` / `ICON('bar.png')` that prepend the
     `/assets/images/.../` prefix in code):
       `IMG('Royal_Capital_townscape_aerial_view_EP1.png')`

Safe to re-run.
"""
import re
from pathlib import Path
from urllib.parse import unquote


def main():
    roots = ['src']
    exts = {'.jsx', '.js', '.tsx', '.ts', '.css'}

    webp_files = set()      # 'assets/images/.../foo.webp' (URL-style)
    webp_basenames = set()  # 'foo.webp' (basename only)
    for p in Path('public/assets/images').rglob('*.webp'):
        rel = str(p.relative_to('public')).replace('\\', '/')
        webp_files.add(rel)
        webp_basenames.add(p.name)

    # Pass 1 — full-path matches, scoped under `/assets/images/`.
    full_path_pat = re.compile(
        r'(/assets/images/[^\'\")<>?#]+?)\.(png|jpe?g)\b',
        re.IGNORECASE,
    )

    # Pass 2 — bare filenames inside string literals. Catches
    # `IMG('foo.png')` and `ICON('bar.png')` patterns where the
    # `/assets/images/.../` prefix lives in a different string. A
    # filename is only rewritten if its basename has a `.webp` twin
    # on disk, so non-image strings ending in `.png` are untouched.
    # Match any character that ISN'T the opening quote and isn't a
    # newline — so a filename inside a `'...'` literal can contain
    # spaces and a `"` (and vice-versa), which is needed for cases
    # like `"Genau's_hometown_..."` (apostrophe inside double-quoted)
    # and `'Stark looks down at the sanctuary EP12.png'` (spaces).
    bare_pat = re.compile(
        r'([\'"])((?:(?!\1)[^\n/])+?)\.(png|jpe?g)\1',
        re.IGNORECASE,
    )

    total_files_changed = 0
    total_refs_rewritten = 0
    total_refs_skipped = 0

    for root in roots:
        for f in Path(root).rglob('*'):
            if f.suffix.lower() not in exts:
                continue
            text = f.read_text(encoding='utf-8')
            counters = {'rewritten': 0, 'skipped': 0}

            def replace_full(m, _counters=counters):
                base = m.group(1)
                decoded = unquote(base).lstrip('/')
                on_disk = decoded + '.webp'
                if on_disk in webp_files:
                    _counters['rewritten'] += 1
                    return base + '.webp'
                _counters['skipped'] += 1
                return m.group(0)

            def replace_bare(m, _counters=counters):
                quote = m.group(1)
                stem = m.group(2)
                # Decode in case the bare name is also URL-encoded.
                basename = unquote(stem) + '.webp'
                if basename in webp_basenames:
                    _counters['rewritten'] += 1
                    return f'{quote}{stem}.webp{quote}'
                _counters['skipped'] += 1
                return m.group(0)

            new_text = full_path_pat.sub(replace_full, text)
            new_text = bare_pat.sub(replace_bare, new_text)

            if new_text != text:
                f.write_text(new_text, encoding='utf-8')
                total_files_changed += 1
                total_refs_rewritten += counters['rewritten']
                total_refs_skipped += counters['skipped']
                print(
                    f"  {f}: rewrote {counters['rewritten']}, "
                    f"skipped {counters['skipped']}"
                )
            else:
                total_refs_skipped += counters['skipped']

    print('')
    print(f"Files changed: {total_files_changed}")
    print(f"References rewritten: {total_refs_rewritten}")
    print(f"References skipped (no matching .webp): {total_refs_skipped}")


if __name__ == '__main__':
    main()
