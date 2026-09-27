import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { useMotionPreferences } from '../lib/motion';
import { tokenMs, MOTION } from '../lib/transitionTokens';

// Keep one card mounted, including its image and controls, through both directions.
export function useCardExpansion() {
  const slotRef = useRef(null);
  const cardRef = useRef(null);
  const backdropRef = useRef(null);
  const animations = useRef([]);
  const { reduced } = useMotionPreferences();
  const [expanded, setExpanded] = useState(false);
  const [active, setActive] = useState(false);
  const toggle = useCallback(() => {
    setActive(true);
    setExpanded(value => !value);
  }, []);
  const close = useCallback(() => setExpanded(false), []);

  useLayoutEffect(() => {
    if (!active) return;
    const card = cardRef.current;
    const backdrop = backdropRef.current;
    const animate = () => {
      // Read the displayed rectangle BEFORE cancelling an interrupted animation.
      const from = card.getBoundingClientRect();
      const opacity = getComputedStyle(backdrop).opacity;
      if (card.style.position !== 'fixed') {
        card.style.setProperty('--world-copy-width', `${card.querySelector('.world-card-copy').getBoundingClientRect().width}px`);
      }
      animations.current.forEach(animation => animation.cancel());
      const margin = innerWidth * 0.035;
      const to = expanded
        ? { left: margin, top: margin, width: innerWidth - margin * 2, height: innerHeight - margin * 2 }
        : slotRef.current.getBoundingClientRect();
      const frame = rect => ({ left: `${rect.left}px`, top: `${rect.top}px`, width: `${rect.width}px`, height: `${rect.height}px` });
      Object.assign(card.style, { position: 'fixed', zIndex: '10000', ...frame(to) });
      backdrop.style.opacity = expanded ? '1' : '0';
      const finish = () => {
        if (!expanded) {
          for (const property of ['position', 'z-index', 'left', 'top', 'width', 'height']) card.style.removeProperty(property);
          card.style.removeProperty('--world-copy-width');
          setActive(false);
        }
      };
      if (reduced) { finish(); return; }
      const timing = { duration: tokenMs(expanded ? '--duration-slow' : '--duration-medium'), easing: `cubic-bezier(${MOTION.ease.join(',')})` };
      const movement = card.animate([frame(from), frame(to)], timing);
      const fade = backdrop.animate([{ opacity }, { opacity: expanded ? 1 : 0 }], timing);
      animations.current = [movement, fade];
      movement.onfinish = finish;
    };
    animate();
    window.addEventListener('resize', animate);
    return () => window.removeEventListener('resize', animate);
  }, [expanded, active, reduced]);

  useLayoutEffect(() => () => animations.current.forEach(animation => animation.cancel()), []);
  return { slotRef, cardRef, backdropRef, expanded, active, toggle, close };
}
