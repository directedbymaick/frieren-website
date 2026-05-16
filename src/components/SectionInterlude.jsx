import { useEffect, useMemo, useRef, useState } from 'react';

const FADE_RANGE = 0.18;
const START_SPAN = 1 - FADE_RANGE;
// Japanese caption rides the monotonic scrollNorm (not the triangular
// `progress`), so once a glyph reveals it stays revealed for the rest
// of the section instead of fading back out. Tuned so the first glyph
// starts as soon as the caption enters the viewport (~scrollNorm 0.10)
// and the last glyph is fully resolved before the section centers.
const JP_START_DELAY = 0.08;
const JP_SPAN = 0.20;
const JP_FADE = 0.14;

/**
 * Stillness beat. Renders a full-bleed background image with ivory
 * fade overlays at top and bottom, plus a sentence that reveals
 * letter-by-letter as the user scrolls through the section. Optionally
 * renders a vertical Japanese caption in the top-right corner
 * (tategaki, columns reading right→left), mimicking the show's
 * scene-establishing captions.
 *
 * Made reusable so a single component can serve every interlude
 * placed between heavier sections of the page.
 *
 * Props:
 *   dataLabel        — value for `data-screen-label` (unique per instance)
 *   imageSrc         — path to the background image
 *   phraseWords      — array of { word, accent? } describing the headline
 *   japaneseColumns  — optional array of vertical columns (right→left)
 *                       of Japanese characters; omit for instances
 *                       without a caption
 */
export function SectionInterlude({
  dataLabel = 'Interlude',
  imageSrc,
  phraseWords = null,
  japaneseColumns = null,
}) {
  const sectionRef = useRef(null);
  const [progress, setProgress] = useState(0);
  // Monotonic 0→1 as the section scrolls past the viewport. Drives
  // the parallax dezoom on the background image — separate from
  // `progress` (which is the triangular reveal envelope).
  const [scrollNorm, setScrollNorm] = useState(0);

  // Group headline characters by word, with a flat per-character
  // index so the stagger calculation still scales across the whole
  // phrase. Each word becomes its own inline-block in the render so
  // (a) characters within a word can never split across lines and
  // (b) the parent can use real spaces between words, which DO break
  // at the line edge on mobile where a single-line nowrap would
  // otherwise overflow the viewport.
  // Returns null when no headline is provided so the central text
  // block can be skipped entirely for image-only interludes.
  const wordGroups = useMemo(() => {
    if (!phraseWords) return null;
    let charIdx = 0;
    const groups = phraseWords.map((w, wIdx) => {
      const direction = wIdx % 2 === 0 ? -1 : 1;
      const chars = Array.from(w.word).map((char) => {
        const entry = { char, accent: !!w.accent, direction, idx: charIdx };
        charIdx += 1;
        return entry;
      });
      return { chars };
    });
    return { groups, totalChars: charIdx };
  }, [phraseWords]);


  // Flatten Japanese caption in reading order (right column first, top
  // to bottom; then middle column; then left). The reading-order index
  // drives the per-character reveal stagger.
  const japaneseChars = useMemo(() => {
    if (!japaneseColumns) return null;
    const list = [];
    let g = 0;
    japaneseColumns.forEach((col, colIdx) => {
      Array.from(col).forEach((char, charIdx) => {
        list.push({ char, colIdx, charIdx, globalIdx: g });
        g += 1;
      });
    });
    return list;
  }, [japaneseColumns]);

  useEffect(() => {
    const sec = sectionRef.current;
    if (!sec) return;
    let raf = 0;
    let inView = false;

    const tick = () => {
      if (!inView) { raf = 0; return; }
      const rect = sec.getBoundingClientRect();
      const top = rect.top;
      const height = rect.height;
      const vh = window.innerHeight;

      const sPos = vh - top;
      // Peak is the scroll position at which the section is exactly
      // centered in the viewport — that's when the headline text sits
      // dead-centre on screen and the reveal must be complete. The
      // earlier `vh + height / 2` was a precedence bug that pushed
      // peak way past centre, so the headline kept appearing as the
      // section was already leaving the viewport.
      const peak = (vh + height) / 2;

      // Short plateau, longer ramp — text finishes appearing right
      // around the centre of the section, holds for an instant, then
      // immediately starts fading as the section moves past centre.
      const halfWindow = vh * 0.40;
      const halfPlateau = vh * 0.03;
      const rampLen = halfWindow - halfPlateau;
      const t0 = peak - halfWindow;
      const t1 = peak - halfPlateau;
      const t2 = peak + halfPlateau;
      const t3 = peak + halfWindow;

      // One-way reveal: ramp 0→1 as the section approaches centre,
      // then hold at 1 forever. The previous trapezoid faded the
      // headline back to 0 as the section left the viewport, which
      // read as the text "disappearing too soon". Now once the
      // headline is fully revealed it stays revealed.
      let linear;
      if (sPos < t0) linear = 0;
      else if (sPos < t1) linear = (sPos - t0) / rampLen;
      else linear = 1;

      const eased = linear * linear * (3 - 2 * linear);
      setProgress(eased);

      // Parallax dezoom — 0 when section first enters from the bottom
      // (top === vh), 1 when its bottom edge clears the top of the
      // viewport (top === -height). Linear; the camera-pullback feel
      // comes from the small scale delta over a long scroll.
      const through = Math.max(0, Math.min(1, (vh - top) / (vh + height)));
      setScrollNorm(through);

      raf = requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        if (inView && !raf) raf = requestAnimationFrame(tick);
      },
      { rootMargin: '60% 0px 60% 0px' }
    );
    io.observe(sec);

    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);

  // Single full-height ivory overlay covering the entire image stage.
  //
  // Why one overlay instead of two: two separate top/bottom overlay
  // divs each had their own DOM box boundary where the gradient
  // terminated. Even with alpha 0 at that boundary, the box edge
  // itself produced a sub-pixel rendering line — one at the top
  // overlay's bottom edge and one at the bottom overlay's top edge.
  // With a single overlay covering 100% of the stage and a gradient
  // shaped ivory → transparent → ivory, there are no mid-stage box
  // edges, so no visible bands.
  //
  // Curve: smoothstep-style ease applied symmetrically. Alpha rolls
  // off gradually at both ends so no single percentage "knee" reads
  // as a horizontal line. The fully-transparent middle (45%-55%) is
  // the visible image; the section background shows through above
  // and below as the alpha climbs back to 1.
  const ivoryFade =
    'linear-gradient(180deg,' +
    ' rgba(241, 234, 217, 1) 0%,' +
    ' rgba(241, 234, 217, 0.972) 2%,' +
    ' rgba(241, 234, 217, 0.896) 5%,' +
    ' rgba(241, 234, 217, 0.784) 7%,' +
    ' rgba(241, 234, 217, 0.648) 10%,' +
    ' rgba(241, 234, 217, 0.500) 14%,' +
    ' rgba(241, 234, 217, 0.352) 18%,' +
    ' rgba(241, 234, 217, 0.216) 20%,' +
    ' rgba(241, 234, 217, 0.104) 22%,' +
    ' rgba(241, 234, 217, 0.028) 25%,' +
    ' rgba(241, 234, 217, 0) 28%,' +
    ' rgba(241, 234, 217, 0) 72%,' +
    ' rgba(241, 234, 217, 0.028) 75%,' +
    ' rgba(241, 234, 217, 0.104) 78%,' +
    ' rgba(241, 234, 217, 0.216) 80%,' +
    ' rgba(241, 234, 217, 0.352) 82%,' +
    ' rgba(241, 234, 217, 0.500) 86%,' +
    ' rgba(241, 234, 217, 0.648) 90%,' +
    ' rgba(241, 234, 217, 0.784) 93%,' +
    ' rgba(241, 234, 217, 0.896) 95%,' +
    ' rgba(241, 234, 217, 0.972) 98%,' +
    ' rgba(241, 234, 217, 1) 100%)';

  return (
    <section
      ref={sectionRef}
      data-screen-label={dataLabel}
      className="relative w-full overflow-hidden"
      style={{ background: 'var(--ivory)', minHeight: '138vh' }}
    >
      {/* Image stage — 115vh tall, vertically centred inside the
          138vh section via direct positioning. The previous version
          used `top: 50%` + `translateY(-50%)`; transforms create a
          stacking context that's sub-pixel anti-aliased at the
          overflow-hidden boundary, which on the user's screen was
          rendering as a visible 1-px line at both the top and
          bottom edges of the image stage. Static `top` avoids that. */}
      <div
        className="absolute left-0 right-0 overflow-hidden pointer-events-none"
        style={{
          top: '11.5vh',
          height: '115vh',
        }}
        aria-hidden="true"
      >
        <div className="absolute inset-0 overflow-hidden">
          <img
            src={imageSrc}
            alt=""
            loading="lazy"
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover select-none"
            draggable={false}
            style={{
              // Dezoom parallax — exaggerated for a more cinematic
              // camera-pullback feel. Starts at 1.55× (image cropped
              // heavily, looks "close") and eases out to 1.08× (image
              // almost-but-not-quite at native scale). Stays > 1
              // throughout so the overflow-hidden clip never reveals
              // an empty pixel along the edges.
              transform: `scale(${1.55 - 0.47 * scrollNorm})`,
              transformOrigin: 'center center',
              willChange: 'transform',
            }}
          />
          <div className="absolute inset-0 grain" />
        </div>

        {/* Ivory fade — single full-height overlay (ivory → clear →
            ivory). One element instead of two, so there's no mid-stage
            div boundary that could render as a band. */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: ivoryFade }}
        />

        {/* Central darkening vignette — only rendered when there IS a
            headline to read. For image-only interludes the dim disc
            in the middle was darkening the scene without serving any
            legibility purpose. */}
        {wordGroups && (
          <div
            className="absolute inset-x-0 pointer-events-none"
            style={{
              top: '30%',
              bottom: '30%',
              background:
                'radial-gradient(60% 65% at 50% 50%, rgba(20,15,30,0.35) 0%, rgba(20,15,30,0) 70%)',
            }}
          />
        )}

        {/* Japanese tategaki caption — top-right of the image stage.
            Columns read right → left, each column reads top to bottom.
            Per-character reveal in reading order, slides in from the
            right as it fades in. Renders after the ivory fades so it
            sits above them in z-order. */}
        {japaneseChars && (
          <div
            className="absolute pointer-events-none"
            style={{
              top: '11%',
              right: '5%',
              writingMode: 'vertical-rl',
              fontFamily:
                "'Noto Serif JP', 'Hiragino Mincho ProN', 'Yu Mincho', serif",
              fontSize: 'clamp(11px, 1.3vw, 17px)',
              fontWeight: 400,
              letterSpacing: '0.06em',
              // Caption styling tuned to "belong to" the image rather
              // than sit crisply on top of it: a warmer off-white,
              // overall transparency in the high-70s, and a soft
              // double-shadow (one tight, one wide-halo) so the text
              // bleeds into the underlying scene the way anime
              // establishing captions do — closer to inked-on-cel
              // than vector-on-photo.
              color: 'rgba(250, 242, 224, 0.78)',
              textShadow:
                '0 1px 3px rgba(20, 14, 8, 0.45),' +
                ' 0 0 10px rgba(20, 14, 8, 0.22),' +
                ' 0 0 1px rgba(250, 242, 224, 0.5)',
              mixBlendMode: 'screen',
            }}
          >
            {japaneseColumns.map((col, colIdx) => (
              // In `writing-mode: vertical-rl`, block-level siblings
              // stack along the block axis (horizontal RTL). So each
              // `<p>` becomes one vertical column, and the three
              // columns lay out right→left automatically. `marginLeft`
              // adds horizontal space between them — it's the physical
              // left edge in vertical-rl, which is the gap toward the
              // next column.
              <p
                key={colIdx}
                style={{
                  margin: 0,
                  padding: 0,
                  marginLeft: colIdx > 0 ? '0.55em' : 0,
                }}
              >
                {Array.from(col).map((char, charIdx) => {
                  const item = japaneseChars.find(
                    (c) => c.colIdx === colIdx && c.charIdx === charIdx
                  );
                  const start =
                    JP_START_DELAY +
                    (item.globalIdx / japaneseChars.length) * JP_SPAN;
                  // Drive opacity from `scrollNorm` (monotonic 0→1
                  // across the section) instead of the triangular
                  // `progress`, so each glyph stays visible once it
                  // has appeared.
                  const t = Math.max(
                    0,
                    Math.min(1, (scrollNorm - start) / JP_FADE)
                  );
                  return (
                    <span
                      key={charIdx}
                      style={{
                        display: 'inline-block',
                        opacity: t,
                        transform: `translateX(${(1 - t) * 8}px)`,
                        willChange: 'opacity, transform',
                      }}
                    >
                      {char}
                    </span>
                  );
                })}
              </p>
            ))}
          </div>
        )}
      </div>

      {/* English headline — centred in the section, scrolls naturally
          with the page, letters reveal one by one as scroll progresses.
          Only rendered when phraseWords were provided; image-only
          interludes skip this block entirely.

          Each word is wrapped in its own inline-block container so
          characters within a word never split across lines. Between
          words the JSX inserts a real space character — which acts
          as a line-break opportunity on narrow viewports where the
          single-line `nowrap` would overflow. From `md:` up the
          parent reverts to `whitespace-nowrap` to keep the cinematic
          single-line read. */}
      {wordGroups && (
        <div
          className="absolute left-0 right-0 flex items-center justify-center px-6"
          style={{
            top: '50%',
            height: '100vh',
            transform: 'translateY(-50%)',
          }}
        >
          <p
            className="font-serif italic font-light text-center whitespace-normal md:whitespace-nowrap"
            style={{
              fontSize: 'clamp(18px, 3.6vw, 56px)',
              lineHeight: 1.12,
              letterSpacing: '-0.02em',
              color: 'rgba(255, 248, 232, 0.97)',
              textShadow:
                '0 2px 18px rgba(20, 15, 30, 0.65), 0 1px 6px rgba(20, 15, 30, 0.55)',
            }}
          >
            {wordGroups.groups.map((group, wIdx) => (
              <span key={wIdx}>
                {wIdx > 0 && ' '}
                <span style={{ display: 'inline-block' }}>
                  {group.chars.map(({ char, accent, direction, idx }) => {
                    const start = (idx / wordGroups.totalChars) * START_SPAN;
                    const t = Math.max(
                      0,
                      Math.min(1, (progress - start) / FADE_RANGE)
                    );
                    return (
                      <span
                        key={idx}
                        style={{
                          display: 'inline-block',
                          opacity: t,
                          transform: `translateY(${(1 - t) * 18 * direction}px) scale(${1 + (1 - t)})`,
                          transformOrigin: 'center center',
                          willChange: 'opacity, transform',
                        }}
                      >
                        {/* Accent letters wear the gold texture via
                            `gold-text` (background-clip: text on the
                            inner inline-block letter). Each glyph
                            shows its own crop of the texture — fine
                            here because the spans are tight and the
                            texture is a near-uniform gold-on-gold,
                            so adjacent letters read as one ribbon. */}
                        <span
                          className={`interlude-letter-bob${accent ? ' gold-text' : ''}`}
                          style={{ animationDelay: `${-start * 8}s` }}
                        >
                          {char}
                        </span>
                      </span>
                    );
                  })}
                </span>
              </span>
            ))}
          </p>
        </div>
      )}
    </section>
  );
}
