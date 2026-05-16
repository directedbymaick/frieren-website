import { useEffect, useRef, useState } from 'react';

// Local re-encode: 720p H.264 with keyframe at every frame (`-g 1`). The
// original on R2 was 4K AV1 with default ~10s GOPs, which made every seek
// trigger a multi-second decode chain. The all-keyframe build means any
// `currentTime` set seeks instantly. Re-upload to a CDN later if hosting
// from `/public` becomes a bandwidth issue.
const VIDEO_SRC = '/assets/videos/video-scroll-scrub.mp4';

// Section anatomy (within SECTION_HEIGHT):
//   - first ~6%  : entry phase  → boxed video grows to viewport-fill
//   - middle 85% : scrub phase  → currentTime tracks scroll position
//   - last ~9%   : exit phase   → video shrinks back to boxed before
//                                 chapter 05 takes over
//
// 1000vh total — entry/exit stay the same absolute distance (~60-90vh)
// but the scrub spans ~850vh for the 27.5s clip → ~31vh per second of
// video. Fast wheels still advance, but a slow drift now gives every
// frame room to breathe.
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
 * `currentTime` updates are lerped so wheel jolts don't translate into
 * jerky frame jumps. `preload="auto"` lets us seek to any time without
 * waiting for buffering chunks.
 */
export function SectionScrollVideo() {
  const sectionRef = useRef(null);
  const videoRef = useRef(null);
  const [growth, setGrowth] = useState(0);
  const [duration, setDuration] = useState(0);

  // Capture duration once metadata loads — we need it to map scroll to time.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onMeta = () => setDuration(v.duration || 0);
    v.addEventListener('loadedmetadata', onMeta);
    if (v.readyState >= 1 && v.duration) onMeta();
    return () => v.removeEventListener('loadedmetadata', onMeta);
  }, []);

  // Single rAF loop. Growth animates every frame for a smooth scale curve.
  // The video seek is throttled by `seeking` state — we don't issue a new
  // seek until the previous one's frame has been decoded and presented
  // (signalled by `requestVideoFrameCallback` or the `seeked` event). This
  // is the only reliable way to keep H.264 scrubbing smooth without
  // re-encoding the source with all-keyframes.
  useEffect(() => {
    let raf = 0;
    let curGrowth = 0;
    let pendingSeekTo = null;
    let isSeeking = false;
    const v = videoRef.current;

    // Modern browsers expose this — fires when a new video frame is ready
    // to display. Used to drive the next seek without overlap.
    const hasRVFC = v && typeof v.requestVideoFrameCallback === 'function';

    const issueSeek = (target) => {
      if (!v) return;
      isSeeking = true;
      v.currentTime = target;
      if (hasRVFC) {
        v.requestVideoFrameCallback(() => {
          isSeeking = false;
          if (pendingSeekTo !== null) {
            const next = pendingSeekTo;
            pendingSeekTo = null;
            issueSeek(next);
          }
        });
      } else {
        // Fallback: rely on the `seeked` event
        const onSeeked = () => {
          isSeeking = false;
          v.removeEventListener('seeked', onSeeked);
          if (pendingSeekTo !== null) {
            const next = pendingSeekTo;
            pendingSeekTo = null;
            issueSeek(next);
          }
        };
        v.addEventListener('seeked', onSeeked);
      }
    };

    const tick = () => {
      const sec = sectionRef.current;
      if (sec) {
        const rect = sec.getBoundingClientRect();
        const totalScroll = Math.max(1, rect.height - window.innerHeight);
        const scrolled = Math.min(Math.max(0, -rect.top), totalScroll);
        const progress = scrolled / totalScroll; // 0..1 over the section

        const entryEnd = ENTRY_RATIO;
        const scrubEnd = 1 - EXIT_RATIO;

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
        curGrowth = curGrowth + (targetGrowth - curGrowth) * 0.16;
        setGrowth(curGrowth);

        // ── Scrub ───────────────────────────────────────────────────────
        // currentTime maps 0 → duration during the scrub phase only;
        // holds at duration during exit so the closing animation shows
        // the final frame.
        if (v && duration > 0) {
          let scrubProgress;
          if (progress < entryEnd) {
            scrubProgress = 0;
          } else if (progress < scrubEnd) {
            scrubProgress = (progress - entryEnd) / (scrubEnd - entryEnd);
          } else {
            scrubProgress = 1;
          }
          const targetTime = scrubProgress * duration;

          if (Math.abs(v.currentTime - targetTime) > 0.05) {
            if (isSeeking) {
              pendingSeekTo = targetTime;
            } else {
              issueSeek(targetTime);
            }
          }
        }
      }
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [duration]);

  // Same scale curve recipe as SectionVideo — keeps the entry visual
  // language consistent across the two video sections.
  const ease = (x) =>
    x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
  const g = ease(Math.min(1, Math.max(0, growth)));
  const inset = 20 * (1 - g);
  const radius = 48 * (1 - g);
  const sidePad = 5 * (1 - g);

  return (
    <section
      ref={sectionRef}
      data-screen-label="04 ScrollVideo"
      className="relative w-full"
      style={{ background: 'var(--ivory)', height: SECTION_HEIGHT }}
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
            background: 'var(--ivory)',
            isolation: 'isolate',
            transform: 'translateZ(0)',
            willChange: 'border-radius, padding',
          }}
        >
          <video
            ref={videoRef}
            // Pixels only. No controls, no native HUD ever.
            playsInline
            muted
            preload="auto"
            disablePictureInPicture
            disableRemotePlayback
            src={VIDEO_SRC}
            className="absolute inset-0 w-full h-full object-cover block"
            style={{
              // Force GPU layer so seeks repaint cleanly.
              transform: 'translateZ(0)',
            }}
          />
        </div>
      </div>
    </section>
  );
}
