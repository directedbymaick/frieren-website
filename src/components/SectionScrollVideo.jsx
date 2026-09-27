import { useMotionPreferences } from '../lib/motion';
import { useNearViewport } from '../hooks/useNearViewport';
import { scrollToSection } from '../lib/scroll';
import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from '../icons';

// Local H.264 asset prepared for seeking; no remote player is required.
const VIDEO_SRC = '/assets/videos/video-scroll-scrub.mp4';

// Section anatomy (within SECTION_HEIGHT):
//   - first ~6%  : entry phase  → boxed video grows to viewport-fill
//   - middle 85% : scrub phase  → currentTime tracks scroll position
//   - last ~9%   : exit phase   → video shrinks back to boxed before
//                                 chapter 05 takes over
//
// 1000vh total — entry/exit stay the same absolute distance (~60-90vh)
// but the scrub spans ~850vh. Timing uses the actual media duration,
// so replacing the clip does not change the scroll mapping.
const ENTRY_RATIO = 0.06;
const EXIT_RATIO = 0.09;
const SECTION_HEIGHT = '1000vh';

/**
 * Section 04 — scroll-controlled cinematic.
 *
 * The same boxed-to-fullscreen scale curve as Section 02 frames the entry,
 * but instead of pinning + autoplay, we drive `video.currentTime` from the
 * scroll position once the video has fully grown. Scroll down advances the
 * clip; scroll up rewinds it. The video element is paused at all times and
 * has no controls, no overlays — pure pixels controlled by the wheel.
 *
 * The latest scroll position wins once the browser finishes each seek.
 * The video loads near the section, before the cinematic enters view.
 */
export function SectionScrollVideo() {
  const sectionRef = useRef(null);
  const videoRef = useRef(null);
  const { reduced } = useMotionPreferences();
  const near = useNearViewport(sectionRef, "100%");
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { if (near && !reduced) setLoaded(true); }, [near, reduced]);
  const [growth, setGrowth] = useState(0);
  const growthRef = useRef(0);
  const [duration, setDuration] = useState(0);

  // Capture duration once metadata loads — we need it to map scroll to time.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onMeta = () => setDuration(Number.isFinite(v.duration) ? v.duration : 0);
    v.addEventListener('loadedmetadata', onMeta);
    if (v.readyState >= 1 && v.duration) onMeta();
    return () => v.removeEventListener('loadedmetadata', onMeta);
  }, []);

  // A paused or offscreen video need not present a new frame after every seek.
  // Use the media element's seeking flag, never a frame-presentation callback,
  // to release the next update. Intermediate scroll targets are discarded.
  useEffect(() => {
    if (!near || reduced) return;
    let raf = 0;
    let lastFrame = 0;
    const v = videoRef.current;
    let started = false;
    let frameVisible = false;
    const onSeeked = () => { if (started && v.currentTime > 0) frameVisible = true; };
    v?.addEventListener('seeked', onSeeked);
    v?.pause();

    const tick = now => {
      const elapsed = lastFrame ? Math.min(64, now - lastFrame) : 16;
      lastFrame = now;
      if (document.hidden) { raf = requestAnimationFrame(tick); return; }
      const sec = sectionRef.current;
      if (sec) {
        const rect = sec.getBoundingClientRect();
        const totalScroll = Math.max(1, rect.height - window.innerHeight);
        const scrolled = Math.min(Math.max(0, -rect.top), totalScroll);
        const progress = scrolled / totalScroll; // 0..1 over the section

        const entryEnd = ENTRY_RATIO;
        const scrubEnd = 1 - EXIT_RATIO;
        started = progress > entryEnd;
        if (!started) frameVisible = false;

        // ── Growth ──────────────────────────────────────────────────────
        // Three phases:
        //   progress < entryEnd  → ramp 0 → 1
        //   entryEnd..scrubEnd   → hold at 1
        //   progress > scrubEnd  → ramp 1 → 0  (visually closes the frame)
        let targetGrowth;
        if (progress < entryEnd) {
          targetGrowth = entryEnd > 0 ? progress / entryEnd : 0;
        } else if (progress < scrubEnd) {
          targetGrowth = 1;
        } else {
          const exitProgress = (progress - scrubEnd) / (1 - scrubEnd);
          targetGrowth = 1 - Math.min(1, exitProgress);
        }
        const difference = targetGrowth - growthRef.current;
        if (Math.abs(difference) > 0.0001) {
          growthRef.current = Math.abs(difference) < 0.001
            ? targetGrowth
            : growthRef.current + difference * (1 - Math.exp(-elapsed / 100));
          setGrowth(growthRef.current);
        }

        // ── Scrub ───────────────────────────────────────────────────────
        // currentTime maps 0 → duration during the scrub phase only;
        // holds at duration during exit so the closing animation shows
        // the final frame.
        if (v && duration > 0 && v.readyState >= 2 && !v.seeking) {
          let scrubProgress;
          if (progress < entryEnd) {
            scrubProgress = 0;
          } else if (progress < scrubEnd) {
            scrubProgress = (progress - entryEnd) / (scrubEnd - entryEnd);
          } else {
            scrubProgress = 1;
          }
          // Stay inside the final frame instead of seeking to the end boundary.
          const targetTime = Math.min(scrubProgress * duration, Math.max(0, duration - 1 / 60));
          if (Math.abs(v.currentTime - targetTime) > (started ? 1 / 30 : 0.001)) v.currentTime = targetTime;
          else if (started && v.currentTime > 0) frameVisible = true;
        }
        if (v) v.style.visibility = started && frameVisible ? 'visible' : 'hidden';
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      v?.removeEventListener('seeked', onSeeked);
      if (v) v.style.visibility = 'hidden';
    };
  }, [duration, near, reduced]);

  // Same scale curve recipe as SectionVideo — keeps the entry visual
  // language consistent across the two video sections.
  const ease = (x) =>
    x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
  const g = reduced ? 0 : ease(Math.min(1, Math.max(0, growth)));
  const inset = 20 * (1 - g);
  const radius = 48 * (1 - g);
  const sidePad = 5 * (1 - g);

  return (
    <section
      ref={sectionRef}
      data-screen-label="04 ScrollVideo"
      className="relative w-full"
      style={{ background: 'var(--ivory)', height: reduced ? "100vh" : SECTION_HEIGHT }}
    >
      <div
        className="sticky top-0 w-full h-screen flex items-center justify-center overflow-hidden"
        style={{
          paddingLeft: `${sidePad}%`,
          paddingRight: `${sidePad}%`,
          paddingTop: `${inset}px`,
          paddingBottom: `${inset}px`,
        }}
      >
        <div
          className="relative w-full h-full"
          style={{
            borderRadius: `${radius}px`,
            overflow: 'hidden',
            background: '#000',
            isolation: 'isolate',
            transform: 'translateZ(0)',
            willChange: 'border-radius, padding',
          }}
        >
          <button type="button" className="skip-cinematic" aria-label="Continue to the epilogue" data-haptic="selection" onClick={() => scrollToSection("05 Epilogue")}>
            <span className="skip-cinematic-label" aria-hidden="true">Continue to the epilogue</span>
            <span className="skip-cinematic-arrows" aria-hidden="true"><ChevronDown /><ChevronDown /></span>
          </button>
          <video
            ref={videoRef}
            // Pixels only. No controls, no native HUD ever.
            playsInline
            muted
            preload={loaded ? 'auto' : 'none'}
            disablePictureInPicture
            disableRemotePlayback
            src={loaded ? VIDEO_SRC : undefined}
            className="absolute inset-0 w-full h-full object-cover block"
            style={{
              // Force GPU layer so seeks repaint cleanly.
              transform: 'translateZ(0)',
              visibility: 'hidden',
            }}
          />
        </div>
      </div>
    </section>
  );
}
