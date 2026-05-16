import { useCallback, useEffect, useRef, useState } from 'react';
import { Maximize, Minimize, Play } from '../icons';
import { getLenis } from '../lib/lenis';
import { isProgrammaticScrollActive } from '../lib/scroll';
import { TopLeftCorner } from './TopLeftCorner';

export function SectionVideo() {
  const sectionRef = useRef(null);
  const videoRef = useRef(null);
  const hideTimer = useRef(0);
  const exitedRef = useRef(false);

  // Visual scale: 0 = small boxed, 1 = covers viewport
  const [growth, setGrowth] = useState(0);
  // Pinned: scroll is locked, video forced to viewport-fixed fullscreen
  const [pinned, setPinned] = useState(false);

  // Player state
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [volume, setVolume] = useState(0.6);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [time, setTime] = useState(0);
  const [controlsHidden, setControlsHidden] = useState(false);

  // ── Scroll-driven growth (paused while pinned and while off-screen) ─────
  // IntersectionObserver gates the rAF: when the section is not even
  // remotely in view, we stop computing a growth value that nothing can
  // observe. A 100% rootMargin warms it up a viewport before/after so the
  // settled value is right by the time the eye reaches it.
  useEffect(() => {
    if (pinned) return;
    const sec = sectionRef.current;
    if (!sec) return;
    let raf = 0;
    let cur = growth;
    let inView = false;

    const tick = () => {
      if (!inView) { raf = 0; return; }
      const rect = sec.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const traveled = Math.min(Math.max(0, -rect.top), total);
      const target = total > 0 ? traveled / total : 0;
      cur = cur + (target - cur) * 0.16;
      setGrowth(cur);
      if (
        target >= 0.92 &&
        !exitedRef.current &&
        // Don't auto-pin while another component is actively
        // running a programmatic scrollTo through this section.
        // Otherwise clicking a nav button (e.g. "Join the guild")
        // that targets a later section would get caught here and
        // never reach its destination.
        !isProgrammaticScrollActive()
      ) {
        setPinned(true);
        getLenis()?.stop();
      }
      raf = requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        if (inView && !raf) raf = requestAnimationFrame(tick);
      },
      { rootMargin: '100% 0px 100% 0px' }
    );
    io.observe(sec);

    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pinned]);

  // Defensive cleanup — release Lenis if the section unmounts while pinned
  useEffect(() => () => { getLenis()?.start(); }, []);

  // ── Manual enter/exit (called by the always-visible resize button) ──────
  // Instead of snap-pinning instantly, we trigger a smooth scroll to the
  // position where the rAF growth loop naturally reaches its pin threshold.
  // The video grows, pads in, rounds out — then the auto-pin fires inside
  // the loop. Same easing curve as the rest of the page (Lenis), and it
  // mirrors how the exit animation already feels.
  const enterFullscreen = useCallback(() => {
    // If the user previously exited, allow auto-pin to fire again.
    exitedRef.current = false;
    const sec = sectionRef.current;
    const lenis = getLenis();
    if (!sec) {
      // Fallback: instant pin if we can't measure the section.
      setPinned(true);
      setGrowth(1);
      lenis?.stop();
      return;
    }
    const total = sec.offsetHeight - window.innerHeight;
    const target = sec.offsetTop + total;
    if (lenis) {
      lenis.scrollTo(target, { duration: 0.95 });
    } else {
      window.scrollTo({ top: target, behavior: 'smooth' });
    }
  }, []);

  const exitFullscreen = useCallback(() => {
    setPinned(false);
    exitedRef.current = true;
    const lenis = getLenis();
    lenis?.start();
    requestAnimationFrame(() => {
      const sec = sectionRef.current;
      if (!sec) return;
      // Scroll BACK to the section's top instead of past the bottom — the
      // user wants to stay in the chapter after exiting fullscreen, not be
      // teleported to chapter 03. As we travel back, the rAF growth loop
      // naturally shrinks the video to its boxed state, so the elements
      // animating back in (Opening II tab, caption) settle into a clean
      // pre-pin frame.
      const target = sec.offsetTop;
      if (lenis) {
        lenis.scrollTo(target, { duration: 1.1 });
      } else {
        window.scrollTo({ top: target, behavior: 'smooth' });
      }
    });
  }, []);

  const toggleFullscreen = () => (pinned ? exitFullscreen() : enterFullscreen());

  // ESC also exits
  useEffect(() => {
    if (!pinned) return;
    const onKey = (e) => {
      if (e.key === 'Escape') exitFullscreen();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pinned, exitFullscreen]);

  // ── Autoplay (muted) when video frame is in view ────────────────────────
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) v.play().catch(() => {});
          else v.pause();
        });
      },
      { threshold: 0.35 }
    );
    io.observe(v);
    return () => io.disconnect();
  }, []);

  // ── Player events ────────────────────────────────────────────────────────
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onTime = () => {
      setTime(v.currentTime);
      setProgress(v.duration ? v.currentTime / v.duration : 0);
    };
    const onMeta = () => setDuration(v.duration || 0);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onVol = () => {
      setMuted(v.muted);
      setVolume(v.volume);
    };
    v.addEventListener('timeupdate', onTime);
    v.addEventListener('loadedmetadata', onMeta);
    v.addEventListener('play', onPlay);
    v.addEventListener('pause', onPause);
    v.addEventListener('volumechange', onVol);
    return () => {
      v.removeEventListener('timeupdate', onTime);
      v.removeEventListener('loadedmetadata', onMeta);
      v.removeEventListener('play', onPlay);
      v.removeEventListener('pause', onPause);
      v.removeEventListener('volumechange', onVol);
    };
  }, []);

  // Sync volume → video element
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.volume = volume;
  }, [volume]);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    v.paused ? v.play() : v.pause();
  };
  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    // If unmuting from a 0 volume, bump back to a sensible default
    if (v.muted && v.volume === 0) {
      v.volume = 0.6;
    }
    v.muted = !v.muted;
  };
  const onVolumeChange = (e) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    const v = videoRef.current;
    if (!v) return;
    v.volume = newVol;
    if (newVol === 0) v.muted = true;
    else if (v.muted) v.muted = false;
  };
  const seek = (e) => {
    const v = videoRef.current;
    if (!v || !v.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    v.currentTime = ratio * v.duration;
  };
  const fmt = (s) => {
    if (!isFinite(s)) return '0:00';
    const m = Math.floor(s / 60);
    const x = Math.floor(s % 60);
    return `${m}:${String(x).padStart(2, '0')}`;
  };
  const wakeControls = () => {
    setControlsHidden(false);
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      if (!videoRef.current?.paused) setControlsHidden(true);
    }, 2200);
  };

  // ── Visual styling ───────────────────────────────────────────────────────
  const ease = (x) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);
  const g = ease(Math.min(1, Math.max(0, growth)));
  const inset = 20 * (1 - g);
  const radius = 48 * (1 - g);
  const sidePad = 5 * (1 - g);

  const wrapClass = pinned
    ? 'fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden'
    : 'sticky top-0 w-full h-screen flex items-center justify-center overflow-hidden';

  const wrapStyle = pinned
    ? { padding: 0, background: 'rgba(10,8,6,0.92)' }
    : {
        paddingLeft: `${sidePad}%`,
        paddingRight: `${sidePad}%`,
        paddingTop: `${inset}px`,
        paddingBottom: `${inset}px`,
      };

  return (
    <section
      ref={sectionRef}
      data-screen-label="02 Opening"
      className="relative w-full"
      style={{ background: 'var(--ivory)', height: '130vh' }}
    >
      <div className={wrapClass} style={wrapStyle}>
        <div
          className="relative w-full h-full"
          style={{
            borderRadius: pinned ? 0 : `${radius}px`,
            overflow: 'hidden',
            background: 'var(--ivory)',
            boxShadow: !pinned && g < 0.05 ? '0 60px 80px -30px rgba(20,15,10,0.45)' : 'none',
            isolation: 'isolate',
            transform: 'translateZ(0)',
            willChange: 'border-radius, padding',
          }}
          onMouseMove={wakeControls}
          onMouseLeave={() => {
            if (videoRef.current && !videoRef.current.paused) setControlsHidden(true);
          }}
        >
          <video
            ref={videoRef}
            className="cursor-pointer block"
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: '102%',
              height: '102%',
              transform: 'translate(-50%, -50%)',
              objectFit: 'cover',
            }}
            src="https://pub-0e689c2d21c04ec09ccaaeb008d32495.r2.dev/frieren-opening2.mp4"
            playsInline
            muted
            loop
            preload="metadata"
            onClick={togglePlay}
          />

          {/* Grimoire continuity tab — kept mounted at all times. On pin it
              translates beyond the top-left corner of the frame; the frame's
              `overflow: hidden` clips it cleanly off-stage so it reads as
              "leaving the frame", not "fading away". */}
          <TopLeftCorner
            style={{
              transform: pinned ? 'translate(-110%, -110%)' : 'translate(0, 0)',
              transition: 'transform 760ms cubic-bezier(.65, 0, .25, 1)',
            }}
          />

          {/* Top-right cluster: caption (slides up off-stage on pin) + the
              always-visible resize toggle (stays put — it's the exit
              affordance during pin). */}
          <div
            className={`vp-controls ${controlsHidden && !pinned ? 'hidden' : ''} absolute top-5 md:top-7 right-5 md:right-7 z-[10] flex items-center gap-3 overflow-visible`}
          >
            <span
              className="font-serif italic text-white/90 text-sm md:text-base drop-shadow hidden sm:inline-block"
              style={{
                // -400% (instead of -220%) is enough to clear the text AND
                // its `drop-shadow` filter past the frame's top edge — the
                // drop-shadow extends a few pixels below the glyphs and was
                // still poking into view at the previous value.
                transform: pinned ? 'translateY(-400%)' : 'translateY(0)',
                transition: 'transform 760ms cubic-bezier(.65, 0, .25, 1)',
                willChange: 'transform',
              }}
            >
              Frieren · Beyond Journey's End
            </span>
            <button
              type="button"
              onClick={toggleFullscreen}
              aria-label={pinned ? 'Exit fullscreen' : 'Enter fullscreen'}
              title={pinned ? 'Exit fullscreen (Esc)' : 'Enter fullscreen'}
              className="w-10 h-10 md:w-11 md:h-11 rounded-full flex items-center justify-center transition-transform hover:scale-105"
              style={{
                background: 'rgba(255,255,255,0.14)',
                backdropFilter: 'blur(14px)',
                WebkitBackdropFilter: 'blur(14px)',
                border: '1px solid rgba(255,255,255,0.35)',
                color: 'white',
                boxShadow: '0 8px 24px -10px rgba(0,0,0,0.45)',
              }}
            >
              {pinned ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>
          </div>

          {/* Center play (only while paused) */}
          {!playing && (
            <button
              type="button"
              onClick={togglePlay}
              className="absolute inset-0 z-[2] flex items-center justify-center group cursor-pointer"
            >
              <div
                className="rounded-full flex items-center justify-center transition-transform group-hover:scale-105"
                style={{
                  width: 'clamp(64px, 9vw, 110px)',
                  height: 'clamp(64px, 9vw, 110px)',
                  background: 'rgba(255,255,255,0.12)',
                  backdropFilter: 'blur(14px)',
                  WebkitBackdropFilter: 'blur(14px)',
                  border: '1px solid rgba(255,255,255,0.35)',
                  boxShadow: '0 20px 60px -10px rgba(0,0,0,0.5)',
                }}
              >
                <Play className="w-7 h-7 md:w-9 md:h-9 text-white" />
              </div>
            </button>
          )}

          {/* Bottom controls — bottom corners rounded to match the video frame
              radius so the dark gradient hugs the rounded shape instead of
              cutting square against the curve. */}
          <div
            className={`vp-controls ${controlsHidden ? 'hidden' : ''} absolute bottom-0 left-0 right-0 z-[2] px-5 md:px-10 pb-5 md:pb-7 pt-10`}
            style={{
              background: 'linear-gradient(0deg, rgba(0,0,0,0.55), rgba(0,0,0,0))',
              borderBottomLeftRadius: pinned ? 0 : `${radius}px`,
              borderBottomRightRadius: pinned ? 0 : `${radius}px`,
            }}
          >
            <div className="vp-progress" onClick={seek}>
              <div className="vp-fill" style={{ width: `${progress * 100}%` }}></div>
            </div>
            <div className="flex items-center gap-4 md:gap-5 mt-3 md:mt-4 text-white/90">
              <button
                type="button"
                onClick={togglePlay}
                className="w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
              >
                {playing ? (
                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                    <rect x="6" y="5" width="4" height="14" rx="1" />
                    <rect x="14" y="5" width="4" height="14" rx="1" />
                  </svg>
                ) : (
                  <Play className="w-4 h-4" />
                )}
              </button>

              {/* Volume cluster: button + slider that reveals on hover/focus */}
              <div className="group/vol flex items-center">
                <button
                  type="button"
                  onClick={toggleMute}
                  className="w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
                  aria-label={muted ? 'Unmute' : 'Mute'}
                >
                  {muted || volume === 0 ? (
                    <svg
                      viewBox="0 0 24 24"
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" stroke="none" />
                      <line x1="22" y1="9" x2="16" y2="15" />
                      <line x1="16" y1="9" x2="22" y2="15" />
                    </svg>
                  ) : (
                    <svg
                      viewBox="0 0 24 24"
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" stroke="none" />
                      {volume > 0.4 && <path d="M15.5 8.5a5 5 0 0 1 0 7" />}
                      {volume > 0.7 && <path d="M18.5 5.5a9 9 0 0 1 0 13" />}
                    </svg>
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={muted ? 0 : volume}
                  onChange={onVolumeChange}
                  aria-label="Volume"
                  className="vp-vol h-3 ml-0 w-0 opacity-0 group-hover/vol:ml-2 group-hover/vol:w-20 group-hover/vol:opacity-100 focus-visible:ml-2 focus-visible:w-20 focus-visible:opacity-100 transition-all duration-300 ease-out"
                />
              </div>

              <span
                className="text-[12px] tabular-nums tracking-wide"
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {fmt(time)} <span className="opacity-50">/ {fmt(duration)}</span>
              </span>
              <div className="ml-auto flex items-center gap-3">
                <span className="hidden md:inline text-[10px] uppercase tracking-[0.28em] opacity-70">
                  Yoasobi · 勇者
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
