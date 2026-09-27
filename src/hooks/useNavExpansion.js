import { useEffect, useRef, useState } from 'react';
import { tokenMs } from '../lib/transitionTokens';
import { useMotionPreferences } from '../lib/motion';

export function useNavExpansion() {
  const [expanded, setExpanded] = useState(false);
  const [hasFocus, setHasFocus] = useState(false);
  const timer = useRef(0);
  const { reduced } = useMotionPreferences();
  useEffect(() => () => clearTimeout(timer.current), []);
  const open = () => { clearTimeout(timer.current); setExpanded(true); };
  const close = () => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setExpanded(false), reduced ? 0 : tokenMs('--duration-quick'));
  };
  return {
    expanded,
    hasFocus,
    bindings: {
      'data-expanded': expanded,
      onFocusCapture: () => { setHasFocus(true); open(); },
      onBlurCapture: event => {
        if (!event.currentTarget.contains(event.relatedTarget)) { setHasFocus(false); close(); }
      },
      onPointerEnter: event => {
        if (event.pointerType === 'touch') return;
        clearTimeout(timer.current);
        timer.current = setTimeout(open, reduced ? 0 : tokenMs('--duration-micro'));
      },
      onPointerLeave: event => {
        clearTimeout(timer.current);
        if (!event.currentTarget.contains(document.activeElement)) close();
      },
      onKeyDown: event => {
        if (event.key !== 'Escape') return;
        event.currentTarget.querySelector('button')?.focus({ preventScroll: true });
        clearTimeout(timer.current);
        setExpanded(false);
      },
    },
  };
}
