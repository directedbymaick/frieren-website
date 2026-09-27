import { useMotionPreferences } from '../lib/motion';
import { useEffect, useRef } from 'react';

// Same easing the Footer uses for its growth, so position + scale
// here animate in lockstep with the card's grow.
const ease = (x) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);

/**
 * Full-body character mounted behind the footer card. The anchor
 * point of the figure (e.g. the waist) is pinned to the card's top
 * edge, so the upper body peeks above the card and the lower body
 * sits hidden behind the card's opaque background (this component
 * is rendered BEFORE the <Footer/> in App.jsx, so document order
 * puts it below the card).
 *
 * Position and scale are applied via direct ref-based style writes
 * inside the rAF tick — NOT React state — so 60 fps updates don't
 * trigger reconciliation churn. Position is a `transform: translate`
 * (composited on the GPU) instead of `top` (layout-triggering), and
 * scale lives on the same `transform` rather than animating
 * `height` (also layout-triggering). The combination removes the
 * scroll judder that appeared once both guardians were on screen
 * during the epilogue → footer transition.
 *
 * Opacity is the one-shot entrance fade tied to the
 * SectionScrollVideo's exit phase — invisible until the cinematic
 * starts pulling back from fullscreen, then resolves to 1 over a
 * short scroll distance.
 *
 * Props:
 *   src              — image path
 *   side             — `'right'` or `'left'`
 *   heightVh         — base height in vh; scale multiplies this
 *   anchorRatio      — fraction of image height where the pin sits
 *   offsetVw         — distance from the chosen viewport edge in vw
 *   cutBelowAnchor   — optional clip below the anchor (fraction of
 *                      image height to keep before clipping)
 */
export function FooterGuardian({
  src,
  side = 'right',
  heightVh = 144,
  anchorRatio = 0.5,
  offsetVw = 3,
  cutBelowAnchor = null,
}) {
  const { reduced } = useMotionPreferences();
  const imgRef = useRef(null);

  useEffect(() => {
    const footer = document.querySelector('[data-screen-label="Footer"]');
    const card = footer ? footer.querySelector('.ff-footer') : null;
    const scrollVid = document.querySelector(
      '[data-screen-label="04 ScrollVideo"]'
    );
    if (!footer || !card) return;

    if (reduced) { if (imgRef.current) imgRef.current.style.opacity = '0'; return; }
    let raf = 0;
    let inView = false;
    let lastTranslateY = NaN;
    let lastScale = NaN;
    let lastOpacity = NaN;
    let lastEffectiveHeightVh = NaN;

    const tick = () => {
      if (!inView) {
        raf = 0;
        return;
      }
      const img = imgRef.current;
      if (!img) {
        raf = requestAnimationFrame(tick);
        return;
      }

      const cardRect = card.getBoundingClientRect();
      const sectionRect = footer.getBoundingClientRect();
      const vh = window.innerHeight;

      // Parallax-style scale, driven by the Footer's growth formula
      // so the size animates in lockstep with the card's
      // box-to-fullscreen transition.
      const GROWTH_COMPLETE = 0.85;
      const progress = (vh - sectionRect.top) / (sectionRect.height * GROWTH_COMPLETE);
      const g = ease(Math.max(0, Math.min(1, progress)));
      const scale = 0.97 + g * 0.06;

      // Responsive size factor — `heightVh` is the desktop value.
      // Instead of stepping at discrete breakpoints we linearly
      // interpolate the scale across viewport width, so the figure
      // shrinks/grows continuously at every pixel of resize. Below
      // `MIN_W` the figure clamps at `MIN_SCALE`; above `MAX_W` it
      // clamps at 1. Image `width: auto` follows the height, so the
      // aspect ratio is preserved and the figure never overflows.
      const vw = window.innerWidth;
      const MIN_W = 360;
      // Extended past common laptop widths so the figure keeps
      // scaling all the way up through 1080p / 1440p displays.
      // Previously clamped at 1280 px, which meant viewports
      // between ~1275 and ~1700 px hit the cap and stopped
      // responding to resize.
      const MAX_W = 1920;
      const MIN_SCALE = 0.4;
      const t = Math.max(0, Math.min(1, (vw - MIN_W) / (MAX_W - MIN_W)));
      const sizeScale = MIN_SCALE + t * (1 - MIN_SCALE);
      const effectiveHeightVh = heightVh * sizeScale;

      // Translate the image so its anchor (anchorRatio fraction of
      // image height from the top) lands at the card's top edge in
      // the viewport. Image is rendered with `top: 0`, so the
      // translateY needed is `cardRect.top − anchorRatio * heightPx`.
      const heightPx = (vh * effectiveHeightVh) / 100;
      const translateY = cardRect.top - anchorRatio * heightPx;

      // Entrance opacity — triggers at the moment the cinematic
      // starts pulling back from fullscreen, resolves over ~140 px.
      let opacity = 1;
      if (scrollVid) {
        const ssvBottom = scrollVid.getBoundingClientRect().bottom;
        const fadeStart = vh * 0.9;
        const fadeEnd = fadeStart - 140;
        if (ssvBottom >= fadeStart) opacity = 0;
        else if (ssvBottom <= fadeEnd) opacity = 1;
        else opacity = (fadeStart - ssvBottom) / (fadeStart - fadeEnd);
      }

      // Write directly to the DOM, skipping React's reconciliation.
      // Only touch the style if the value actually changed — saves
      // a layer recomposite on idle frames. translate3d forces the
      // image onto a GPU layer so transforms stay paint-cheap.
      if (
        translateY !== lastTranslateY ||
        scale !== lastScale ||
        effectiveHeightVh !== lastEffectiveHeightVh
      ) {
        img.style.transform = `translate3d(0, ${translateY.toFixed(2)}px, 0) scale(${scale.toFixed(4)})`;
        if (effectiveHeightVh !== lastEffectiveHeightVh) {
          // Height also drives the responsive size scaling, so we
          // update it from the rAF too (cheap; only writes when
          // `vw` crosses a breakpoint).
          img.style.height = `${effectiveHeightVh}vh`;
          lastEffectiveHeightVh = effectiveHeightVh;
        }
        lastTranslateY = translateY;
        lastScale = scale;
      }
      if (opacity !== lastOpacity) {
        img.style.opacity = opacity.toFixed(4);
        lastOpacity = opacity;
      }

      raf = requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        if (inView && !raf) raf = requestAnimationFrame(tick);
      },
      { rootMargin: '120% 0px 50% 0px' }
    );
    io.observe(footer);
    if (scrollVid) io.observe(scrollVid);

    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [heightVh, anchorRatio, reduced]);

  // Static styling that doesn't change per frame.
  const sideStyle =
    side === 'left' ? { left: `${offsetVw}vw` } : { right: `${offsetVw}vw` };

  const clipStyle =
    cutBelowAnchor !== null
      ? {
          clipPath: `inset(0 0 ${Math.max(
            0,
            (1 - (anchorRatio + cutBelowAnchor)) * 100
          )}% 0)`,
        }
      : null;

  // Scale around the anchor so the pin point doesn't drift during
  // the parallax. The horizontal half of the origin sits on the
  // chosen viewport edge (left or right) so the figure also doesn't
  // creep inward/outward as it scales.
  const transformOrigin = `${side === 'left' ? '0%' : '100%'} ${anchorRatio * 100}%`;

  return (
    <img
      ref={imgRef}
      src={src}
      alt=""
      loading="lazy"
      decoding="async"
      fetchPriority="low"
      className="fixed pointer-events-none select-none block"
      style={{
        top: 0,
        ...sideStyle,
        height: `${heightVh}vh`,
        width: 'auto',
        transformOrigin,
        // Start invisible. The first rAF tick will overwrite these
        // values, so there's no React-managed transition; if the
        // tick hasn't fired yet the figure simply isn't visible.
        opacity: 0,
        transform: 'translate3d(0, 100vh, 0) scale(0.95)',
        willChange: 'transform, opacity',
        ...clipStyle,
      }}
      aria-hidden="true"
      draggable={false}
    />
  );
}
