import { MOTION } from '../lib/transitionTokens';
import { useMotionPreferences } from '../lib/motion';
import { useEffect, useRef, useState } from 'react';
import { RuneMark } from '../icons';

/**
 * Vertical pill that floats over the centre of the triptych. Pure glass — the
 * underlying card image stays visible through the capsule. Four premium
 * touches:
 *
 *  1. Liquid distortion via an SVG `<filter>` referenced by `backdrop-filter:
 *     url(#…)`. fractalNoise + displacementMap warps whatever sits behind the
 *     capsule like rippled water glass. Falls back to a plain blur on browsers
 *     that don't yet support `backdrop-filter: url()`.
 *
 *  2. Embedded-into-surface depth: a stronger inset top-shadow stack reads as
 *     the depression interior catching shadow from above; subtle outer rim
 *     hints at the carved socket lip. The wet-edge shimmer is kept but toned
 *     down so the pill no longer reads as floating-above.
 *
 *  3. Magnetic hover: CSS transitions follow the pointer and return home
 *     using the shared follow/return motion tokens. The transform
 *     is written directly on the button via ref (no React reconciliation per
 *     frame) so the inner click animation can compose without conflict.
 *
 *  4. Click feedback — "interrupteur": the rune glyph toggles colour
 *     between white and black on each click while a brief white halo flares
 *     around it for one fast motion token. CSS transitions handle the smooth ramp on both
 *     `color` and `filter`. No layout-shifting shake — feedback lives on the
 *     symbol, not the shell.
 *
 *  The unique SVG filter id (`liquid-glass-${randId}`) avoids collisions if
 *  multiple capsules ever live on the same page.
 */
export function LiquidGlassCapsule({ onClick, ariaLabel = 'Next companion' }) {
  const { reduced } = useMotionPreferences();
  const buttonRef = useRef(null);
  const glowTimer = useRef(0);
  const glowFrames = useRef([0, 0]);
  // Symbol color toggles every click (white ↔ black). Starts white so it
  // reads against the dark embedded-glass interior on first paint.
  const [isLight, setIsLight] = useState(true);
  // Halo around the symbol; pulses on each click for one fast motion token.
  const [glowing, setGlowing] = useState(false);
  // Stable per-mount filter id — keeps the SVG def name unique across instances
  const filterId = useRef(`liquid-glass-${Math.random().toString(36).slice(2, 8)}`).current;

  // CSS motion tokens keep cursor tracking and return timing consistent.
  useEffect(() => {
    if (buttonRef.current) buttonRef.current.style.transform = 'none';
  }, [reduced]);
  useEffect(() => () => {
    clearTimeout(glowTimer.current);
    glowFrames.current.forEach(cancelAnimationFrame);
  }, []);

  const onMouseMove = (e) => {
    const el = buttonRef.current;
    if (!el || reduced || e.pointerType !== 'mouse') return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = Math.max(-24, Math.min(24, (e.clientX - cx) * 0.28));
    const dy = Math.max(-30, Math.min(30, (e.clientY - cy) * 0.28));
    el.style.transition = 'transform var(--tilt-follow) var(--tilt-follow-ease)';
    el.style.transform = `translate(${dx}px, ${dy}px)`;
  };
  const onMouseLeave = () => {
    const el = buttonRef.current;
    if (!el) return;
    el.style.transition = 'transform var(--tilt-return) var(--tilt-return-ease)';
    el.style.transform = 'translate(0, 0)';
  };

  // Toggle the symbol colour and pulse the halo. Double-rAF off→on trick
  // forces React to commit the false state so a rapid click sequence
  // re-triggers the CSS transition each time.
  const handleClick = () => {
    clearTimeout(glowTimer.current);
    setIsLight((prev) => !prev);
    setGlowing(false);
    glowFrames.current.forEach(cancelAnimationFrame);
    glowFrames.current[0] = requestAnimationFrame(() => {
      glowFrames.current[1] = requestAnimationFrame(() => {
        setGlowing(true);
        glowTimer.current = setTimeout(() => setGlowing(false), MOTION.fast);
      });
    });
    onClick?.();
  };

  // Embedded-glass shadow recipe — strong inset top shadow + subtle socket
  // outline. Same numbers tuned in the previous pass.
  const embeddedShadow = [
    '0 -1px 3px rgba(0, 0, 0, 0.20)',
    '0 1px 2px rgba(0, 0, 0, 0.10)',
    'inset 0 7px 14px rgba(0, 0, 0, 0.42)',
    'inset 0 1px 0 rgba(0, 0, 0, 0.18)',
    'inset 0 -1px 0 rgba(255, 255, 255, 0.14)',
    'inset 2px 2px 0 -2px rgba(255, 255, 255, 0.85)',
    'inset -2px -2px 0 -2px rgba(255, 255, 255, 0.65)',
    'inset 1px 1px 1px -0.5px rgba(255, 255, 255, 0.5)',
    'inset -1px -1px 1px -0.5px rgba(255, 255, 255, 0.5)',
  ].join(',');

  // Same number of drop-shadow layers in both states so CSS can interpolate
  // the values smoothly. Two of them are zero-sized + transparent in the
  // base state and only "wake up" during glow.
  const baseFilter =
    'drop-shadow(0 0 0 transparent) drop-shadow(0 0 0 transparent) drop-shadow(0 1px 3px rgba(0,0,0,0.55))';
  const glowFilter =
    'drop-shadow(0 0 14px rgba(255,255,255,0.90)) drop-shadow(0 0 5px rgba(255,255,255,0.75)) drop-shadow(0 1px 3px rgba(0,0,0,0.45))';

  return (
    <>
      {/* Hidden SVG filter def — referenced by backdrop-filter below */}
      <svg className="absolute w-0 h-0" aria-hidden="true">
        <defs>
          <filter id={filterId} x="0%" y="0%" width="100%" height="100%" colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="0.05 0.05" numOctaves="1" seed="3" result="turbulence" />
            <feGaussianBlur in="turbulence" stdDeviation="2" result="blurredNoise" />
            <feDisplacementMap in="SourceGraphic" in2="blurredNoise" scale="60" xChannelSelector="R" yChannelSelector="B" result="displaced" />
            <feGaussianBlur in="displaced" stdDeviation="1.5" result="finalBlur" />
            <feComposite in="finalBlur" in2="finalBlur" operator="over" />
          </filter>
        </defs>
      </svg>

      <button
        ref={buttonRef}
        type="button"
        onClick={handleClick}
        onPointerMove={onMouseMove}
        onPointerLeave={onMouseLeave} onPointerCancel={onMouseLeave}
        aria-label={ariaLabel}
        aria-pressed={!isLight}
        // Sizing + positioning now live on whatever parent renders this
        // capsule (so the same component can be a centred slider focal
        // point or a corner fullscreen toggle of any size). The button
        // fills 100% of its wrapper, and the magnetic transform above
        // composes from there.
        className="relative w-full h-full flex items-center justify-center rounded-full cursor-pointer group"
        style={{
          background: 'transparent',
          border: 'none',
          padding: 0,
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        {/* Recording-style red dot above the pill — pulses softly to read
            as a "live indicator". `translateX(-50%)` is set inside the
            keyframes so the pulse `transform: scale()` doesn't fight it. */}
        <span
          className="record-dot absolute -top-2 left-1/2 w-1.5 h-1.5 rounded-full pointer-events-none z-[3]"
          style={{ background: '#ff3c32' }}
        />

        {/* Visual shell — distortion + wet-edge shimmer + embedded depth */}
        <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
          {/* Liquid distortion behind the pill via SVG filter */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              backdropFilter: `url(#${filterId}) blur(2px) saturate(1.1)`,
              WebkitBackdropFilter: 'blur(8px) saturate(1.1)',
            }}
            aria-hidden="true"
          />
          {/* Embedded depth + wet-edge shimmer */}
          <div
            className="absolute inset-0 rounded-full transition-transform duration-fast group-hover:scale-[1.02]"
            style={{ boxShadow: embeddedShadow }}
          />
        </div>

        {/* Rune symbol — sits on top, free to animate its own colour and
            halo without competing with the shell. */}
        <div className="relative z-[2] flex items-center justify-center pointer-events-none">
          <RuneMark
            className="w-5 h-5 md:w-6 md:h-6"
            style={{
              color: isLight ? 'rgba(255, 255, 255, 0.96)' : 'rgba(10, 10, 14, 0.92)',
              filter: glowing ? glowFilter : baseFilter,
              // Both properties animated; matched easing so the swap and the
              // halo crest together. Filter ramps a touch faster so the
              // illumination peak hits before the colour finishes settling.
              transition:
                'color var(--duration-fast) var(--ease-in-out), filter var(--duration-fast) var(--ease-in-out)',
              willChange: 'color, filter',
            }}
          />
        </div>
      </button>
    </>
  );
}
