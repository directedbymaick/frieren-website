import { useEffect, useState } from 'react';
import { ChevronUp } from '../icons';
import { GLASS_SHADOW } from '../lib/design';
import { scrollToTop } from '../lib/scroll';

/**
 * Floating "scroll to top" affordance. Hidden until the user has scrolled
 * past ~60% of the first viewport height; clicks trigger a Lenis smooth
 * scroll back to 0 so the easing matches the rest of the page (with a
 * native fallback if Lenis hasn't initialised).
 *
 * Also hides once the footer is in view — the footer's bottom bar already
 * carries a "Back to top ↑" text affordance in the same corner, so showing
 * both would feel redundant.
 *
 * `passive: true` on the scroll listener keeps the read off the main
 * thread; the appearance transitions on transform + opacity, so no
 * layout work happens per frame.
 */
export function BackToTop() {
  const [scrolledFar, setScrolledFar] = useState(false);
  const [footerInView, setFooterInView] = useState(false);
  // Scroll-position fallback: the IntersectionObserver below normally
  // catches the footer fine, but the footer section is now 160vh tall
  // and HMR / Lenis edge-cases can race the initial observer setup.
  // We treat "within ~1.5 viewports of the document bottom" as a hard
  // guarantee that we're inside the footer area.
  const [nearBottom, setNearBottom] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const sy = window.scrollY;
      const vh = window.innerHeight;
      const dh = document.documentElement.scrollHeight;
      setScrolledFar(sy > vh * 0.6);
      setNearBottom(dh - sy - vh < vh * 1.6);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  // Watch the footer's intersection with the viewport so we can hide the
  // floating button the moment the in-footer "Back to top ↑" appears.
  // Defer the lookup until after mount + a microtask — the footer is
  // rendered as a sibling, but in case of HMR ordering or async children,
  // a tiny rAF guard keeps the query reliable.
  useEffect(() => {
    let io;
    const attach = () => {
      const footer = document.querySelector('[data-screen-label="Footer"]');
      if (!footer) return false;
      io = new IntersectionObserver(
        ([entry]) => setFooterInView(entry.isIntersecting),
        { threshold: 0 }
      );
      io.observe(footer);
      return true;
    };
    if (!attach()) {
      // Footer not in the DOM yet — try once more on the next frame.
      const raf = requestAnimationFrame(attach);
      return () => cancelAnimationFrame(raf);
    }
    return () => io?.disconnect();
  }, []);

  const visible = scrolledFar && !footerInView && !nearBottom;

  const handleClick = () => {
    // Use the shared helper so the Opening section's auto-pin
    // doesn't catch the scroll on the way back up to the top.
    scrollToTop({ duration: 1.5 });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = visible
          ? 'translateY(0) scale(1.08)'
          : 'translateY(20px) scale(1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = visible
          ? 'translateY(0) scale(1)'
          : 'translateY(20px) scale(1)';
      }}
      aria-label="Back to top"
      title="Back to top"
      className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-[100] w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center active:scale-95 group"
      style={{
        // More transparent than before — reads as glass, not as a coloured pill
        background: 'rgba(241, 234, 217, 0.32)',
        backdropFilter: 'blur(16px) saturate(140%)',
        WebkitBackdropFilter: 'blur(16px) saturate(140%)',
        border: '1px solid rgba(255, 255, 255, 0.45)',
        boxShadow: GLASS_SHADOW,
        color: 'var(--ink)',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0) scale(1)' : 'translateY(20px) scale(1)',
        pointerEvents: visible ? 'auto' : 'none',
        transition:
          'opacity var(--duration-fast) var(--ease-smooth-out), transform var(--duration-fast) var(--ease-smooth-out), background var(--duration-fast) var(--ease-smooth-out), box-shadow var(--duration-fast) var(--ease-smooth-out)',
        willChange: 'opacity, transform',
      }}
    >
      <ChevronUp
        className="w-5 h-5 md:w-6 md:h-6"
        strokeWidth={1.8}
      />
    </button>
  );
}
