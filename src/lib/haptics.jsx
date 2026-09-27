import { createContext, useContext, useEffect, useState } from 'react';
import { useMotionPreferences } from './motion';

const KEY = 'frieren-haptics';
const PATTERNS = { selection: [8], light: [12], impact: [18], confirm: [10, 35, 14] };
const HapticsContext = createContext(null);

export function HapticsProvider({ children }) {
  const { reduced } = useMotionPreferences();
  const [enabled, setEnabled] = useState(() => {
    try { return localStorage.getItem(KEY) !== 'off'; } catch { return true; }
  });
  const supported = typeof navigator.vibrate === 'function' && navigator.maxTouchPoints > 0;
  useEffect(() => {
    if (!supported || !enabled || reduced) return;
    let last = -Infinity;
    const vibrate = pattern => { try { navigator.vibrate(pattern); } catch { /* Optional device feedback must never interrupt navigation. */ } };
    const feedback = event => {
      if (!event.isTrusted || document.hidden) return;
      const control = event.target.closest?.('button, a[href], summary, input[type="range"]');
      if (!control || control.disabled || control.closest('[inert], [aria-disabled="true"], [data-haptic="none"]')) return;
      if (event.type === 'click' && control.matches('input')) return;
      if (control.matches('[aria-current="page"], [aria-selected="true"], .carousel-dot[aria-pressed="true"], .mobile-companions__dot[aria-pressed="true"]')) return;
      const now = performance.now();
      if (now - last < 100) return;
      last = now;
      vibrate(PATTERNS[control.dataset.haptic] || PATTERNS.light);
    };
    const cancel = () => { if (document.hidden) vibrate(0); };
    document.addEventListener('click', feedback, true);
    document.addEventListener('change', feedback, true);
    document.addEventListener('visibilitychange', cancel);
    return () => {
      document.removeEventListener('click', feedback, true);
      document.removeEventListener('change', feedback, true);
      document.removeEventListener('visibilitychange', cancel);
      vibrate(0);
    };
  }, [supported, enabled, reduced]);
  const toggle = () => setEnabled(value => {
    try { localStorage.setItem(KEY, value ? 'off' : 'on'); } catch { /* Keep a session preference when storage is unavailable. */ }
    return !value;
  });
  return <HapticsContext.Provider value={{ supported, enabled, reduced, toggle }}>{children}</HapticsContext.Provider>;
}

export function HapticsToggle() {
  const { supported, enabled, reduced, toggle } = useContext(HapticsContext);
  if (!supported) return null;
  return <button type="button" className="motion-toggle" aria-label="Haptic feedback" aria-pressed={enabled && !reduced} disabled={reduced} data-haptic="none" onClick={toggle}>
    Haptics {enabled && !reduced ? 'on' : 'off'}
  </button>;
}
