import { useLayoutEffect } from 'react';
import { getLenis } from '../lib/lenis';

const FOCUSABLE = 'button:not([disabled]), a[href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

export function useModal(open, ref, returnFocusSelector) {
  useLayoutEffect(() => {
    if (!open || !ref.current) return;
    const dialog = ref.current;
    const previous = document.activeElement;
    const previousSection = previous?.closest('section');
    const previousLabel = previous?.getAttribute('aria-label');
    const hidden = [];
    let branch = dialog;
    while (branch.parentElement && branch !== document.body) {
      for (const sibling of branch.parentElement.children) {
        if (sibling !== branch && !sibling.inert) { sibling.inert = true; hidden.push(sibling); }
      }
      branch = branch.parentElement;
    }
    const overflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    getLenis()?.stop();
    const controls = () => [...dialog.querySelectorAll(FOCUSABLE)].filter(el => el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden');
    (controls()[0] || dialog).focus({ preventScroll: true });
    const trap = event => {
      if (event.key !== 'Tab') return;
      const items = controls();
      const index = items.indexOf(document.activeElement);
      if (!items.length) { event.preventDefault(); dialog.focus(); }
      else if (event.shiftKey && index <= 0) { event.preventDefault(); items.at(-1).focus(); }
      else if (!event.shiftKey && (index === -1 || index === items.length - 1)) { event.preventDefault(); items[0].focus(); }
    };
    document.addEventListener('keydown', trap, true);
    return () => {
      document.removeEventListener('keydown', trap, true);
      hidden.forEach(el => { el.inert = false; });
      document.documentElement.style.overflow = overflow;
      getLenis()?.start();
      requestAnimationFrame(() => {
        const target = previous?.isConnected && previous !== document.body ? previous : (previousLabel && previousSection?.querySelector(`[aria-label="${CSS.escape(previousLabel)}"]`)) || (returnFocusSelector && document.querySelector(returnFocusSelector));
        target?.focus({ preventScroll: true });
      });
    };
  }, [open, ref, returnFocusSelector]);
}
