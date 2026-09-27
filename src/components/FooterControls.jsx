import { motion } from 'framer-motion';
import { useFooterControls } from '../lib/footerControls';
import { surfaceTransition } from '../lib/transitionTokens';
import { IconSwap } from './IconSwap';

// Apple "settle" curve — slow start, smooth coast, gentle landing, ZERO
// overshoot. Springs always overshoot a tiny bit no matter how damped, so
// for the iOS-icon-level smoothness the user is asking for we use a pure
// tween with the same curve Apple uses for sheets and modal cards.
const TRANSITION = surfaceTransition();

/**
 * The two video controls (mute + hide-chrome). Rendered from a single
 * place (Footer or StickyNav) at any time; `layoutId` lets framer-motion
 * animate the position morph between the two mounts when the user toggles
 * immersive mode.
 *
 * The buttons also re-skin themselves during the transit — in the footer
 * card they read as ink-glass (semi-transparent over the video); when
 * they dock into the navbar they match the Trailer button's solid ink
 * exactly, so the pill stays visually unified.
 */
export function FooterControls() {
  const { muted, chromeHidden, toggleMute, toggleChrome } = useFooterControls();

  // Animated skin — framer-motion interpolates between these values over
  // the same tween as the position morph, so the two land in lockstep.
  const skin = chromeHidden
    ? {
        backgroundColor: 'rgb(42, 39, 48)', // = var(--ink), same as Trailer
        borderColor: 'rgba(255, 255, 255, 0.10)',
        boxShadow: '0 6px 16px -8px rgba(42, 39, 48, 0.55)',
      }
    : {
        backgroundColor: 'rgba(20, 15, 30, 0.45)',
        borderColor: 'rgba(255, 255, 255, 0.20)',
        boxShadow: '0 0 0 0 rgba(42, 39, 48, 0)',
      };

  return (
    <>
      <motion.button
        layoutId="footer-mute-btn"
        type="button"
        onClick={toggleMute}
        aria-label={muted ? 'Unmute video' : 'Mute video'}
        title={muted ? 'Unmute' : 'Mute'}
        className="ff-control-btn"
        style={{
          backdropFilter: chromeHidden ? 'none' : 'blur(10px) saturate(120%)',
          WebkitBackdropFilter: chromeHidden ? 'none' : 'blur(10px) saturate(120%)',
        }}
        animate={skin}
        transition={TRANSITION}
        whileHover={{ y: -1 }}
      >
        <IconSwap active={!muted} first={<MutedIcon />} second={<SoundIcon />} />
      </motion.button>
      <motion.button
        layoutId="footer-hide-btn"
        type="button"
        onClick={toggleChrome}
        aria-label={chromeHidden ? 'Show footer content' : 'Hide footer content'}
        title={chromeHidden ? 'Show content' : 'Hide content'}
        className="ff-control-btn"
        style={{
          backdropFilter: chromeHidden ? 'none' : 'blur(10px) saturate(120%)',
          WebkitBackdropFilter: chromeHidden ? 'none' : 'blur(10px) saturate(120%)',
        }}
        animate={skin}
        transition={TRANSITION}
        whileHover={{ y: -1 }}
      >
        <IconSwap active={chromeHidden} first={<EyeOffIcon />} second={<EyeIcon />} />
      </motion.button>
    </>
  );
}

function SoundIcon() {
  return (
    <svg
      viewBox="0 0 24 24" width="16" height="16"
      fill="none" stroke="currentColor" strokeWidth="1.7"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
    >
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" stroke="none" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7" />
      <path d="M18.5 5.5a9 9 0 0 1 0 13" />
    </svg>
  );
}
function MutedIcon() {
  return (
    <svg
      viewBox="0 0 24 24" width="16" height="16"
      fill="none" stroke="currentColor" strokeWidth="1.7"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
    >
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" stroke="none" />
      <line x1="22" y1="9" x2="16" y2="15" />
      <line x1="16" y1="9" x2="22" y2="15" />
    </svg>
  );
}
function EyeIcon() {
  return (
    <svg
      viewBox="0 0 24 24" width="16" height="16"
      fill="none" stroke="currentColor" strokeWidth="1.7"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
function EyeOffIcon() {
  return (
    <svg
      viewBox="0 0 24 24" width="16" height="16"
      fill="none" stroke="currentColor" strokeWidth="1.7"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
    >
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 19c-6.5 0-10-7-10-7a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c6.5 0 10 7 10 7a18.5 18.5 0 0 1-2.16 3.19" />
      <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}
