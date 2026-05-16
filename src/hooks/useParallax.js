import { useEffect } from 'react';

/**
 * Smooth parallax driver. Reads `data-parallax` (speed coefficient) on each
 * element and writes a lerp'd vertical translate into the `--py` custom prop,
 * which the matching CSS rule consumes via translate3d.
 *
 * One rAF loop drives all participants — much cheaper than per-element scroll
 * listeners.
 */
export function useParallax() {
  useEffect(() => {
    let raf = 0;
    const cur = new WeakMap();
    const tick = () => {
      const y = window.scrollY;
      document.querySelectorAll('[data-parallax]').forEach((el) => {
        const speed = parseFloat(el.dataset.parallax) || 0;
        const target = y * speed;
        const c = cur.get(el);
        const next = c === undefined ? target : c + (target - c) * 0.12;
        cur.set(el, next);
        el.style.setProperty('--py', `${next.toFixed(2)}px`);
      });
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, []);
}
