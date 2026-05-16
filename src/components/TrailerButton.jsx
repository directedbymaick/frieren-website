import { useEffect, useRef, useState } from 'react';
import { Play } from '../icons';
import { scrollToSection } from '../lib/scroll';

const TRAILER_SRC = 'https://pub-0e689c2d21c04ec09ccaaeb008d32495.r2.dev/frieren-opening2.mp4';

/**
 * Watch Trailer button that, on hover, stretches a video preview tooltip out
 * from beneath itself. Click scrolls the page to the pinned video section.
 *
 * `compact` prop tightens padding for inline use inside the pill navbar.
 */
export function TrailerButton({ compact = false }) {
  const [open, setOpen] = useState(false);
  const videoRef = useRef(null);
  const closeTimer = useRef(0);

  const handleClick = () => {
    scrollToSection('02 Opening', { duration: 1.4 });
  };

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (open) {
      v.currentTime = 0;
      v.play().catch(() => {});
    } else {
      v.pause();
    }
  }, [open]);

  // Tiny delay on close prevents flicker when crossing the gap between the
  // button and the tooltip with the cursor.
  const handleEnter = () => {
    clearTimeout(closeTimer.current);
    setOpen(true);
  };
  const handleLeave = () => {
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpen(false), 80);
  };

  return (
    <div
      className="relative"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onFocus={handleEnter}
      onBlur={handleLeave}
    >
      <button
        type="button"
        onClick={handleClick}
        className={`btn-press flex items-center text-white rounded-full gap-2 group ${
          compact
            ? 'pl-1.5 pr-3 py-1 text-[12px]'
            : 'pl-2 pr-4 md:pr-6 py-1.5 md:py-2 md:gap-3 text-xs md:text-sm'
        }`}
        style={{
          background: 'var(--ink)',
          boxShadow: '0 8px 24px -10px rgba(42,39,48,0.45)',
        }}
        aria-label="Watch trailer"
        aria-expanded={open}
      >
        <span
          className={`bg-white/15 rounded-full flex items-center justify-center ${
            compact ? 'p-1' : 'p-1 md:p-1.5'
          }`}
        >
          <Play className={compact ? 'w-2.5 h-2.5 text-white' : 'w-3 h-3 md:w-3.5 md:h-3.5 text-white'} />
        </span>
        <span className="font-medium tracking-wide whitespace-nowrap">
          {compact ? 'Trailer' : 'Watch Trailer'}
        </span>
      </button>

      <div className={`trailer-tip ${open ? 'open' : ''}`} aria-hidden={!open}>
        <div className="relative aspect-video w-full bg-black">
          <video
            ref={videoRef}
            src={TRAILER_SRC}
            muted
            loop
            playsInline
            preload="metadata"
            className="absolute inset-0 w-full h-full object-cover"
          />
          {/* Soft top vignette so the caption stays readable on bright frames */}
          <div
            className="absolute inset-x-0 top-0 h-12 pointer-events-none"
            style={{
              background:
                'linear-gradient(180deg, rgba(20,15,10,0.45) 0%, rgba(20,15,10,0) 100%)',
            }}
          />
          <div className="absolute top-2.5 left-3 flex items-center gap-2">
            <span
              className="text-[9px] uppercase tracking-[0.28em] text-white/85 drop-shadow"
            >
              Opening II
            </span>
          </div>
        </div>
        <div className="px-4 py-3 flex items-center justify-between">
          <span
            className="font-serif italic text-[15px]"
            style={{ color: 'var(--ink)' }}
          >
            Haru yo, Koi
          </span>
          <span
            className="text-[10px] uppercase tracking-[0.24em]"
            style={{ color: 'var(--ink-mute)' }}
          >
            Yoasobi · 勇者
          </span>
        </div>
      </div>
    </div>
  );
}
