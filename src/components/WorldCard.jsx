import { useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Maximize, Minimize } from '../icons';
import { useMotionPreferences } from '../lib/motion';
import { usePointerTilt } from '../hooks/usePointerTilt';
import { MOTION, surfaceTransition } from '../lib/transitionTokens';
import { IconSwap } from './IconSwap';

// Direction-aware slide variants — `dir` is +1 for next, -1 for prev. New
// content enters from the side the navigation is going TO, old content
// leaves to the opposite side with the shared page fade and blur.
const slideVariants = {
  enter: (dir) => ({ x: dir > 0 ? MOTION.distance : -MOTION.distance, opacity: 0, filter: `blur(${MOTION.blur}px)` }),
  center: { x: 0, opacity: 1, filter: 'blur(0px)' },
  exit: (dir) => ({ x: dir > 0 ? -MOTION.distance : MOTION.distance, opacity: 0, filter: `blur(${MOTION.blur}px)` }),
};


/**
 * Single world-location card with a full-bleed scene image, 3D cursor tilt,
 * gold glow tracking the mouse, and prev/next nav arrows built into the
 * card. The card FRAME is mounted permanently — only the inner content
 * (image + scrim + eyebrow + body) slides horizontally on navigation.
 *
 * Mouse tracking is attached imperatively via useEffect + ref instead of
 * React's synthetic onMouseMove. That avoids any edge-case where a child's
 * 3D transform / preserve-3d combination disrupts event delivery, and
 * keeps the tilt live while the cursor is over the nav arrows.
 */
export function WorldCard({
  location,
  direction = 0,
  onPrev,
  onNext,
  isFullscreen = false,
  expanding = false,
  fill = false,
  onToggleFullscreen,
}) {
  const wrapperRef = useRef(null);
  const { reduced } = useMotionPreferences();

  const cardRef = useRef(null);
  usePointerTilt(wrapperRef, cardRef, expanding || isFullscreen || reduced);

  return (
    <div ref={wrapperRef} className="site-world-tilt t-tilt" data-static={String(reduced)}>
    <div
      ref={cardRef}
      style={{
        transformStyle: reduced ? 'flat' : 'preserve-3d',
        width: '100%',
        height: fill || isFullscreen ? '100%' : undefined,
        // `overflow:hidden` alone isn't enough to clip the gold lens
        // (mix-blend-mode child) — blend-mode forces a separate
        // compositing buffer that's rendered as a full rectangle, and
        // `preserve-3d` defeats overflow's rounded clip at composite
        // time, so the buffer's sharp corners leak past the rounded
        // edge of the card in all 4 corners. `clip-path` runs at the
        // composite stage and DOES respect the rounded geometry for
        // blend-mode and 3D-transformed descendants alike.
        clipPath: 'inset(0 round 1.6rem)',
      }}
      className={`t-tilt-card relative rounded-[1.6rem] overflow-hidden ${fill || isFullscreen ? '' : 'aspect-[3/2]'}`}
    >
      {/* ── Persistent chrome — never unmounts, never crossfades ───────── */}

      {/* Soft parchment substrate so we never see the page background
          through the gap while the new card is sliding in. */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'var(--ivory-warm)' }}
        aria-hidden="true"
      />

      {/* Mouse-tracked gold glow */}
      <div className="t-tilt-glare pointer-events-none absolute inset-0 z-[3]" />

      {/* Card edge — thin warm + dark inset strokes */}
      <div
        className="pointer-events-none absolute inset-0 rounded-[1.6rem] z-[4]"
        style={{
          boxShadow:
            'inset 0 0 0 1px rgba(255,255,255,0.18), inset 0 0 0 2px rgba(0,0,0,0.18)',
        }}
      />

      {/* Nav arrows */}
      <NavArrow side="left" onClick={onPrev} label="Previous location">
        <ChevronLeft className="w-5 h-5" strokeWidth={1.7} />
      </NavArrow>
      <NavArrow side="right" onClick={onNext} label="Next location">
        <ChevronRight className="w-5 h-5" strokeWidth={1.7} />
      </NavArrow>

      {/* Fullscreen toggle — top-right of the card. */}
      {onToggleFullscreen && (
        <button
          type="button"
          onClick={onToggleFullscreen}
          data-haptic="impact"
          aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          className="group absolute top-4 right-4 md:top-5 md:right-5 z-[6] w-11 h-11 rounded-full flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0 focus-visible:ring-[#b8945a]"
          style={{
            background: 'rgba(20,15,30,0.42)',
            backdropFilter: 'blur(12px) saturate(140%)',
            WebkitBackdropFilter: 'blur(12px) saturate(140%)',
            border: '1px solid rgba(255,255,255,0.28)',
            color: 'rgba(255,255,255,0.95)',
            boxShadow:
              '0 10px 24px -12px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.30)',
          }}
        >
          <span className="grid place-items-center transition-transform duration-fast group-hover:scale-110 group-active:scale-95">
            <IconSwap active={isFullscreen} first={<Maximize className="w-4 h-4" strokeWidth={1.7} />} second={<Minimize className="w-4 h-4" strokeWidth={1.7} />} />
          </span>
        </button>
      )}


      {/* ── Sliding content — image + scrim + text slide as a single sheet ── */}
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={location.title}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={surfaceTransition()}
          className="absolute inset-0 z-[2] pointer-events-none"
        >
          {/* Full-bleed scene */}
          <img
            src={location.imageSrc}
            alt={location.imageAlt}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover select-none"
            draggable={false}
          />

          {/* Bottom gradient scrim — anchors the title block */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'linear-gradient(180deg, rgba(20,15,30,0) 0%, rgba(20,15,30,0) 42%, rgba(20,15,30,0.55) 78%, rgba(20,15,30,0.92) 100%)',
            }}
          />
          {/* Top scrim — keeps the eyebrow legible against bright skies */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'linear-gradient(180deg, rgba(20,15,30,0.40) 0%, rgba(20,15,30,0) 28%)',
            }}
          />

          {/* Eyebrow — glass chip with the untinted PNG icon */}
          <div
            className="absolute top-5 left-5 flex items-center gap-2 px-3 py-1.5 rounded-full"
            style={{
              background: 'rgba(20,15,30,0.42)',
              backdropFilter: 'blur(10px) saturate(120%)',
              WebkitBackdropFilter: 'blur(10px) saturate(120%)',
              border: '1px solid rgba(255,255,255,0.20)',
              transform: 'translateZ(40px)',
            }}
          >
            <img
              src={location.iconSrc}
              alt=""
              aria-hidden="true"
              className="w-4 h-4 object-contain select-none"
              draggable={false}
            />
            <span
              className="text-[10px] uppercase tracking-[0.28em] font-medium"
              style={{ color: 'rgba(255,255,255,0.92)' }}
            >
              {location.category}
            </span>
          </div>

          {/* Headline + body */}
          <div
            className="world-card-copy absolute left-6 right-24 bottom-6 md:left-8 md:right-28 md:bottom-8"
            style={{ transform: 'translateZ(30px)' }}
          >
            <h3
              className="font-serif text-xl sm:text-2xl md:text-3xl lg:text-4xl font-light leading-[1.05] tracking-[-0.02em]"
              style={{
                color: 'rgba(255,255,255,0.97)',
                textShadow: '0 2px 14px rgba(0,0,0,0.55)',
              }}
            >
              {location.title}
            </h3>
            <p
              className="mt-2 sm:mt-3 text-[11px] sm:text-[12px] md:text-[13px] lg:text-sm leading-relaxed max-w-[80%]"
              style={{
                color: 'rgba(255,255,255,0.82)',
                textShadow: '0 1px 8px rgba(0,0,0,0.55)',
              }}
            >
              {location.description}
            </p>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
    </div>
  );
}

function NavArrow({ side, onClick, label, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-haptic="selection"
      aria-label={label}
      className={`group absolute top-1/2 ${side === 'left' ? 'left-4 md:left-5' : 'right-4 md:right-5'} z-[6] w-11 h-11 rounded-full flex items-center justify-center transition-colors`}
      style={{
        transform: 'translateY(-50%)',
        background: 'rgba(20,15,30,0.42)',
        backdropFilter: 'blur(12px) saturate(140%)',
        WebkitBackdropFilter: 'blur(12px) saturate(140%)',
        border: '1px solid rgba(255,255,255,0.28)',
        color: 'rgba(255,255,255,0.95)',
        boxShadow:
          '0 10px 24px -12px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.30)',
      }}
    >
      <span className="grid place-items-center transition-transform duration-fast group-hover:scale-110 group-active:scale-95">
        {children}
      </span>
    </button>
  );
}
