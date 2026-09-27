import Lenis from 'lenis';

/**
 * Singleton Lenis instance for the whole app.
 *
 * Why a singleton: only one element should drive the page scroll, and Lenis
 * keeps a rAF loop running. Spinning up a second instance would create
 * conflicting scroll deltas.
 *
 * Use `getLenis()` from anywhere to call `.stop()` / `.start()` / `.scrollTo()`.
 * The instance is created lazily on first import + initLenis() call from the
 * app entry.
 */

let _lenis = null;
let _raf = 0;

export function initLenis() {
  if (_lenis) return _lenis;

  _lenis = new Lenis({
    // A gentle wheel response without the exponential curve's initial surge.
    duration: 1.35,
    easing: (t) => 1 - Math.pow(1 - t, 3),
    smoothWheel: true,
    // Native touch on mobile — smoothing trackpad/mouse-wheel feels great,
    // smoothing finger drags feels laggy.
    smoothTouch: false,
    wheelMultiplier: 0.85,
    touchMultiplier: 1,
  });

  const tick = (time) => {
    _lenis.raf(time);
    _raf = requestAnimationFrame(tick);
  };
  _raf = requestAnimationFrame(tick);

  return _lenis;
}

export function getLenis() {
  return _lenis;
}

export function destroyLenis() {
  if (_raf) cancelAnimationFrame(_raf);
  if (_lenis) _lenis.destroy();
  _lenis = null;
  _raf = 0;
}
