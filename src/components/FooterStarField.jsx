import { useEffect, useRef } from 'react';
import { useMotionPreferences } from '../lib/motion';
import { createStarField } from '../lib/starField';

// Gold ✦ grid inside the footer video layer (under the scanlines and veil, screen-blended). Driven by the footer card's pointer
// moves; purely decorative, off for touch, Save-Data and reduced motion.
// It only lives between the two hairlines (below .ff-rule, above .ff-bottom), fading out softly towards each line.
const FADE = 72;

export function FooterStarField() {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const { reduced } = useMotionPreferences();

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = canvas?.closest('.ff-footer');
    if (!canvas || !host || reduced) return undefined;
    const controller = new AbortController();
    const cleanup = createStarField(host, canvas, controller.signal);
    return () => {
      controller.abort();
      cleanup();
    };
  }, [reduced]);

  // Keep the visible band aligned with the hairlines as the footer grows and resizes.
  useEffect(() => {
    const wrap = wrapRef.current;
    const host = wrap?.closest('.ff-footer');
    if (!wrap || !host) return undefined;
    const place = () => {
      const box = host.getBoundingClientRect();
      const rule = host.querySelector('.ff-rule')?.getBoundingClientRect();
      const bottom = host.querySelector('.ff-bottom')?.getBoundingClientRect();
      const top = rule ? rule.bottom - box.top : 0;
      const end = bottom ? bottom.top - box.top : box.height;
      wrap.style.setProperty('--stars-top', `${Math.round(top)}px`);
      wrap.style.setProperty('--stars-end', `${Math.round(end)}px`);
    };
    const observer = new ResizeObserver(place);
    observer.observe(host);
    const bottom = host.querySelector('.ff-bottom');
    if (bottom) observer.observe(bottom);
    place();
    return () => observer.disconnect();
  }, []);

  const mask = `linear-gradient(to bottom, transparent var(--stars-top, 0px), #000 calc(var(--stars-top, 0px) + ${FADE}px), #000 calc(var(--stars-end, 100%) - ${FADE}px), transparent var(--stars-end, 100%))`;

  return (
    <div
      ref={wrapRef}
      className="ff-stars absolute inset-0 pointer-events-none"
      style={{ mixBlendMode: 'screen', WebkitMaskImage: mask, maskImage: mask }}
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
}
