import { getLenis } from './lenis';

// Tracks whether a programmatic `scrollTo` is currently in flight.
// Scroll-tied sections that auto-pin (e.g. SectionVideo's Opening at
// 92% progress) read this flag so they don't intercept a long
// programmatic scroll that's only passing through them on its way
// to a later destination (e.g. clicking "Join the guild" in the
// Hero should fly all the way to the Footer, not get caught by the
// Opening's auto-pin halfway down).
let _programmaticScrollUntil = 0;

export function isProgrammaticScrollActive() {
  return performance.now() < _programmaticScrollUntil;
}

/**
 * Smooth-scroll to the section identified by a `data-screen-label` attribute.
 * Uses Lenis for premium easing when available, falls back to native
 * `scrollIntoView` otherwise. Returns true if the target was found.
 */
export function scrollToSection(label, { duration = 1.2, offset = 0 } = {}) {
  const el = document.querySelector(`[data-screen-label="${label}"]`);
  if (!el) return false;
  // Buffer the deadline a touch past `duration` so any auto-pin
  // logic that ticks on the final frame of the animation still
  // sees the flag.
  _programmaticScrollUntil = performance.now() + duration * 1000 + 120;
  const lenis = getLenis();
  if (lenis) {
    lenis.scrollTo(el, { duration, offset });
  } else {
    const top = el.getBoundingClientRect().top + window.scrollY + offset;
    window.scrollTo({ top, behavior: 'smooth' });
  }
  return true;
}

/**
 * Smooth-scroll back to the top of the page. Goes through the same
 * programmatic-scroll guard so the Opening's auto-pin doesn't catch
 * users on the way up.
 */
export function scrollToTop({ duration = 1.4 } = {}) {
  _programmaticScrollUntil = performance.now() + duration * 1000 + 120;
  const lenis = getLenis();
  if (lenis) {
    lenis.scrollTo(0, { duration });
  } else {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
