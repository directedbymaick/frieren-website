import { useEffect, useRef, useState } from 'react';

const PARTY = [
  { name: 'Fern',    src: '/assets/images/characters/fern.webp' },
  { name: 'Frieren', src: '/assets/images/characters/frieren.webp' },
  { name: 'Himmel',  src: '/assets/images/characters/himmel.webp' },
  { name: 'Heiter',  src: '/assets/images/characters/heiter.webp' },
  { name: 'Eisen',   src: '/assets/images/characters/eisen.webp' },
  { name: 'Stark',   src: '/assets/images/characters/stark.webp' },
  { name: 'Flamme',  src: '/assets/images/characters/flamme.webp' },
];

const ROTATE_MS = 8400;        // dwell on each portrait (~8.4s)
const FADE_MS = 1100;          // crossfade length
// Apple-style out-expo curve — strong deceleration, very smooth landing
const FADE_EASE = 'cubic-bezier(.16, 1, 0.3, 1)';

/**
 * Auto-rotating Fern-corner portrait. Cycles through the party every
 * ROTATE_MS, with a long, slow opacity crossfade between members.
 *
 * Click is still supported as a "skip ahead" affordance and resets the
 * timer so we never auto-advance immediately after a manual click.
 *
 * Visual finish:
 *   - `mask-image: radial-gradient` for the upper crop (soft circle, no
 *     hard edge anywhere) layered with a downward linear-gradient that
 *     fades the chin/neck area into transparent — gives the icon a
 *     "ghosting out at the bottom" look instead of a clipped-in-half feel.
 */
export function CharacterCarousel() {
  const [idx, setIdx] = useState(0);
  const timerRef = useRef(0);

  // Auto-advance on a stable interval. Clicking resets it (via the effect
  // re-running on `idx` change).
  useEffect(() => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setIdx((i) => (i + 1) % PARTY.length);
    }, ROTATE_MS);
    return () => clearInterval(timerRef.current);
  }, [idx]);

  const tiltDeg = idx % 2 === 0 ? -3.5 : 3.5;
  const member = PARTY[idx];
  const next = () => setIdx((i) => (i + 1) % PARTY.length);

  // Combined mask: soft radial circle for the head shape + a SHORT linear
  // gradient that only takes the bottom ~25% into a fade. Previously the
  // linear faded over half the icon which felt too aggressive — now it
  // just softens the chin/neck edge.
  const FADE_MASK =
    'radial-gradient(ellipse 65% 70% at 50% 38%, black 60%, transparent 95%), linear-gradient(to top, transparent 0%, black 28%)';

  return (
    <div
      className="anim-fern absolute select-none
                 top-24 md:top-28 left-6 md:left-12 lg:left-20
                 w-20 md:w-28 lg:w-32 hidden md:block"
      style={{ zIndex: 6 }}
    >
      <button
        type="button"
        onClick={next}
        aria-label={`Show next character (current: ${member.name})`}
        className="fern-tilt block w-full p-0 m-0 bg-transparent border-0 cursor-pointer"
        style={{ '--tilt': `${tiltDeg}deg` }}
      >
        <div className="relative w-full aspect-square">
          {PARTY.map((p, i) => (
            <img
              key={p.name}
              src={p.src}
              alt={p.name}
              draggable={false}
              decoding="async"
              loading={i === 0 ? 'eager' : 'lazy'}
              className="absolute inset-0 w-full h-full"
              style={{
                objectFit: 'cover',
                objectPosition: 'center top',
                // Soft radial head + linear bottom-fade so the silhouette
                // dissolves at the chin/neck instead of clipping flat.
                WebkitMaskImage: FADE_MASK,
                maskImage: FADE_MASK,
                WebkitMaskComposite: 'source-in',
                maskComposite: 'intersect',
                filter: 'drop-shadow(0 12px 18px rgba(60,40,20,0.18))',
                opacity: i === idx ? 0.98 : 0,
                transition: `opacity ${FADE_MS}ms ${FADE_EASE}`,
                pointerEvents: 'none',
              }}
            />
          ))}

          {/* Subtle grain overlay — sits on top of the icon, masked the
              same way so it follows the silhouette and fades into the
              bottom transition. Very low-intensity radial-gradient noise
              (the same recipe as the .grain class on the hero). */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: [
                'radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)',
                'radial-gradient(rgba(20,15,10,0.06) 1px, transparent 1px)',
              ].join(','),
              backgroundSize: '3px 3px, 5px 5px',
              backgroundPosition: '0 0, 1px 2px',
              mixBlendMode: 'overlay',
              WebkitMaskImage: FADE_MASK,
              maskImage: FADE_MASK,
              WebkitMaskComposite: 'source-in',
              maskComposite: 'intersect',
              opacity: 0.65,
            }}
          />
        </div>
      </button>
    </div>
  );
}
