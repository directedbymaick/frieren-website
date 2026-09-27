import { useEffect } from 'react';

export function useParallax(reduced = false) {
  useEffect(() => {
    const elements = [...document.querySelectorAll('[data-parallax]')];
    if (reduced) { elements.forEach(el => el.style.removeProperty('--py')); return; }
    const current = new WeakMap();
    let frame = 0;
    const tick = () => {
      frame = 0;
      let moving = false;
      for (const el of elements) {
        const target = scrollY * (Number(el.dataset.parallax) || 0);
        const previous = current.get(el) ?? target;
        const next = Math.abs(target - previous) < 0.1 ? target : previous + (target - previous) * 0.12;
        current.set(el, next);
        el.style.setProperty('--py', `${next.toFixed(2)}px`);
        moving ||= next !== target;
      }
      if (moving) frame = requestAnimationFrame(tick);
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(tick); };
    onScroll();
    addEventListener('scroll', onScroll, { passive: true });
    return () => { removeEventListener('scroll', onScroll); cancelAnimationFrame(frame); };
  }, [reduced]);
}
