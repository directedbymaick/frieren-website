import { createContext, useContext, useEffect, useRef, useState } from 'react';

/**
 * Global state for the footer's video controls (mute + hide chrome).
 * Lives in context so the two buttons can render either inside the
 * footer card (when chrome is visible) or inside the sticky navbar pill
 * (when chrome is hidden) without losing their identity — framer-motion's
 * `layoutId` then animates the position morph between the two mounts.
 */
const FooterControlsCtx = createContext(null);

export function FooterControlsProvider({ children }) {
  // Mute defaults to true so the browser allows the autoplay.
  const [muted, setMuted] = useState(true);
  // Immersive mode for the footer's video. When true the footer's chrome
  // (topline, rule, grid, bottom bar, veil) fades and the two control
  // buttons dock into the sticky navbar.
  const [chromeHidden, setChromeHidden] = useState(false);
  // Footer's <video> ref so the mute button can flip `video.muted` from
  // wherever it's currently rendered.
  const videoRef = useRef(null);

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  };
  const toggleChrome = () => {
    setChromeHidden(!chromeHidden);
    requestAnimationFrame(() => document.querySelector(`[aria-label="${chromeHidden ? 'Hide footer content' : 'Show footer content'}"]`)?.focus({ preventScroll: true }));
  };
  useEffect(() => {
    if (!chromeHidden) return;
    const escape = event => { if (event.key === 'Escape') toggleChrome(); };
    addEventListener('keydown', escape);
    return () => removeEventListener('keydown', escape);
  }, [chromeHidden]);

  return (
    <FooterControlsCtx.Provider
      value={{ muted, chromeHidden, toggleMute, toggleChrome, videoRef }}
    >
      {children}
    </FooterControlsCtx.Provider>
  );
}

export function useFooterControls() {
  return useContext(FooterControlsCtx);
}
