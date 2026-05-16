import { useEffect, useState } from 'react';

/**
 * Returns `true` when the app should render the mobile experience
 * instead of the desktop site. Decision rules, in order:
 *
 *   1. URL param `?mobile=1` forces the mobile version (no matter
 *      the viewport). Useful for previewing on desktop without
 *      resizing the browser.
 *   2. URL param `?mobile=0` forces the desktop version.
 *   3. Otherwise: mobile when the viewport is narrower than 640 px.
 *
 * Re-evaluates automatically on viewport resize when no URL override
 * is in effect.
 */
const QUERY = typeof window !== 'undefined' ? window.location.search : '';
const FORCE_MOBILE = /[?&]mobile=1\b/.test(QUERY);
const FORCE_DESKTOP = /[?&]mobile=0\b/.test(QUERY);

const MOBILE_QUERY = '(max-width: 639px)';

function read() {
  if (FORCE_MOBILE) return true;
  if (FORCE_DESKTOP) return false;
  if (typeof window === 'undefined') return false;
  return window.matchMedia(MOBILE_QUERY).matches;
}

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(read);

  useEffect(() => {
    // Locked by URL param — no listener needed.
    if (FORCE_MOBILE || FORCE_DESKTOP) return;
    const mql = window.matchMedia(MOBILE_QUERY);
    const handler = (e) => setIsMobile(e.matches);
    // Modern browsers use addEventListener; older Safari used
    // addListener. Cover both for safety.
    if (mql.addEventListener) {
      mql.addEventListener('change', handler);
      return () => mql.removeEventListener('change', handler);
    }
    mql.addListener(handler);
    return () => mql.removeListener(handler);
  }, []);

  return isMobile;
}
