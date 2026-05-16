import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Play } from '../icons';
import { scrollToSection } from '../lib/scroll';
import { Navbar } from './Navbar';
import { StaffExpander } from './StaffExpander';
import { Dust } from './Dust';
import { CharacterCarousel } from './CharacterCarousel';
import { BottomLeftCard } from './BottomLeftCard';
import { BottomRightCorner } from './BottomRightCorner';

const NETFLIX_URL = 'https://www.netflix.com/fr/title/81726714';

const VIDEO_SRC = 'https://pub-0e689c2d21c04ec09ccaaeb008d32495.r2.dev/hero-bg.mp4';
const FRIEREN_HANDING = '/assets/images/characters/frieren-handing-potion.webp';
const FRIEREN_DRINKING = '/assets/images/characters/frieren-drinking-potion.webp';
const FRIEREN_DIZZY = '/assets/images/characters/frieren-dizzy-after-drinking-potion.webp';

export function Hero() {
  const videoRef = useRef(null);
  const [videoFailed, setVideoFailed] = useState(false);

  // ── Frieren potion interaction ──────────────────────────────────────────
  // State machine:
  //   - idle:       handing-pose visible, no menu
  //   - hovering:   handing-pose + floating choice menu
  //   - drinking:   drinking-pose locked in (no menu, no return)
  //   - dizzy:      ~2s after drink — swap to dizzy pose + floating
  //                 "You poisoned Frieren..." message
  //
  // mouseLeave hides the menu without committing; "Don't drink" hides it
  // while the cursor is still over Frieren. Because the browser only fires
  // mouseEnter on a fresh entry, the user must move out and back in to make
  // the menu reappear.
  const [drinking, setDrinking] = useState(false);
  const [dizzy, setDizzy] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showPoison, setShowPoison] = useState(false);
  const dizzyTimer = useRef(0);

  const onFrierenEnter = () => {
    if (drinking) return;
    setShowMenu(true);
  };
  const onFrierenLeave = () => {
    setShowMenu(false);
  };
  const onDrink = (e) => {
    e.stopPropagation();
    setDrinking(true);
    setShowMenu(false);
    // 2s after she drinks, swap to the dizzy pose and float the
    // "You poisoned Frieren..." note in.
    clearTimeout(dizzyTimer.current);
    dizzyTimer.current = setTimeout(() => {
      setDizzy(true);
      setShowPoison(true);
    }, 2000);
  };
  const onDontDrink = (e) => {
    e.stopPropagation();
    setShowMenu(false);
  };

  // Cleanup the timer on unmount so it doesn't fire after the component
  // is gone (HMR, route change, etc.).
  useEffect(() => () => clearTimeout(dizzyTimer.current), []);

  // Native streaming: the video element starts playback as soon as enough bytes
  // are buffered, instead of waiting for a full blob download.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onError = () => setVideoFailed(true);
    v.addEventListener('error', onError);
    return () => v.removeEventListener('error', onError);
  }, []);

  return (
    <div
      className="w-full h-screen flex items-center justify-center p-3 md:p-5"
      style={{ background: 'var(--ivory)' }}
    >
      <section
        data-screen-label="Hero"
        className="relative w-full h-full rounded-[1.5rem] md:rounded-[3rem] overflow-hidden flex flex-col items-center grain"
        style={{ background: 'var(--ivory-warm)' }}
      >
        {/* Background video — slowest parallax layer (far) */}
        {!videoFailed && (
          <div data-parallax="0.35" className="absolute inset-0 z-0 overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              src={VIDEO_SRC}
              className="absolute inset-0 w-full h-full object-cover scale-[1.18]"
              style={{ opacity: 0.9 }}
            />
          </div>
        )}

        {/* Frieren-themed gradient filter — pulled from the companions
            assets folder. Sits directly above the video, beneath the
            watercolor wash and content. `overlay` blends bidirection-
            ally (lifts highlights, deepens shadows, picks up the
            gradient's tonal cast) so the filter actually reads on
            screen instead of disappearing the way `soft-light` did. */}
        <div
          className="absolute inset-0 z-[1] pointer-events-none"
          style={{
            backgroundImage:
              "url('/assets/images/characters/companions%20imgs/flammes%20red%20white%20gradient.webp')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            mixBlendMode: 'multiply',
            opacity: 0.35,
          }}
          aria-hidden="true"
        />

        {/* Warm watercolor wash on top of the video — softened so the video
            reads more clearly underneath the parchment palette. */}
        <div
          className="absolute inset-0 z-[1] pointer-events-none"
          style={{
            background: `
              radial-gradient(120% 80% at 80% 110%, rgba(184,148,90,0.02) 0%, rgba(184,148,90,0) 55%),
              radial-gradient(80% 60% at 10% 0%, rgba(241,234,217,0.05) 0%, rgba(241,234,217,0) 60%),
              linear-gradient(180deg, rgba(241,234,217,0.025) 0%, rgba(241,234,217,0.01) 40%, rgba(241,234,217,0.05) 100%)
            `,
          }}
        />

        {/* Sparkle dust */}
        <Dust count={22} />

        {/* Content layer */}
        <div className="relative z-10 w-full h-full flex flex-col items-center">
          <Navbar />


          <div
            data-parallax="-0.12"
            className="w-full flex flex-col items-center pt-6 md:pt-10 px-6 text-center max-w-5xl"
          >
            <div className="anim-badge mb-4">
              <StaffExpander />
            </div>

            <h1
              className="anim-h1 font-serif text-4xl sm:text-5xl md:text-[56px] lg:text-[96px] font-light tracking-[-0.02em] leading-[1] mb-4 mx-auto whitespace-nowrap"
              style={{ color: 'var(--ink)' }}
            >
              Beyond <em className="italic" style={{ color: 'var(--gold)' }}>Journey's</em> End
            </h1>

            <p
              className="anim-p font-serif italic text-sm sm:text-base md:text-lg leading-relaxed max-w-xl"
              style={{ color: 'var(--ink-soft)' }}
            >
              An elf, a grimoire, and the long quiet after the Demon King fell.
              <br className="hidden md:inline" /> Walk the road of memory once more.
            </p>

            <div className="anim-cta mt-7 flex items-center gap-3 md:gap-4 flex-wrap justify-center">
              {/* Primary CTA — ink → Netflix red on hover; Play mirrors
                  direction; copy crossfades to "on Netflix". */}
              <a
                href={NETFLIX_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="hero-cta hero-cta-primary"
              >
                <span className="cta-text">
                  <span className="cta-text-default">Begin the saga</span>
                  <span className="cta-text-hover">on Netflix</span>
                </span>
                <span className="cta-icon" aria-hidden="true">
                  <Play className="w-3.5 h-3.5" />
                </span>
              </a>

              {/* Secondary CTA — parchment glass → ink on hover; arrow
                  rotates 45° as the container slides to the left. */}
              <button
                type="button"
                onClick={() => scrollToSection('01 Companions', { duration: 1.4 })}
                className="hero-cta hero-cta-secondary"
              >
                <span className="cta-text">Meet the party</span>
                <span className="cta-icon" aria-hidden="true">
                  <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={1.9} />
                </span>
              </button>
            </div>
          </div>

          {/* Frieren — placed in the OUTER wrapper, behind the rounded hero
              card. Her bust-cut sits behind the section's beige border so
              the rounded edge masks the crop while she breathes. Hovering
              the handing-pose surfaces a floating choice menu; clicking
              "Drink" commits to the drinking-pose. */}
          <div
            className="anim-frieren ambient-breathe absolute select-none
                       right-4 sm:right-12 md:right-20 lg:right-32
                       h-[22vh] sm:h-[32vh] md:h-[42vh] lg:h-[52vh] max-h-[560px] w-auto z-[2]"
            style={{ bottom: '-6vh' }}
            onMouseEnter={onFrierenEnter}
            onMouseLeave={onFrierenLeave}
          >
            <img
              src={FRIEREN_HANDING}
              alt="Frieren handing the potion"
              fetchpriority="high"
              decoding="async"
              loading="eager"
              className={`frieren-img h-full w-auto select-none transition-opacity duration-[700ms] ease-out ${drinking ? 'opacity-0' : 'opacity-100'}`}
              style={{ objectFit: 'contain', objectPosition: 'bottom right' }}
              draggable={false}
            />
            <img
              src={FRIEREN_DRINKING}
              alt="Frieren drinking the potion"
              decoding="async"
              loading="lazy"
              className={`frieren-img absolute bottom-0 right-0 h-full w-auto select-none transition-opacity duration-[700ms] ease-out ${drinking && !dizzy ? 'opacity-100' : 'opacity-0'}`}
              style={{
                objectFit: 'contain',
                objectPosition: 'bottom right',
                transform: 'translateX(-18px)',
              }}
              draggable={false}
            />
            {/* Dizzy pose — wrapped so opacity + shake live on the wrapper
                while the inner img keeps its own scale/translate to match
                the other Frierens' size and anchor. The dizzy artwork has
                significant padding around the character (and a darker
                vignette), so we scale 1.55× from the bottom-right corner
                so her silhouette lines up with the drinking pose. */}
            <div
              className={`absolute bottom-0 right-0 h-full pointer-events-none transition-opacity duration-[700ms] ease-out ${dizzy ? 'opacity-100 dizzy-shake' : 'opacity-0'}`}
            >
              <img
                src={FRIEREN_DIZZY}
                alt="Frieren dizzy after the potion"
                decoding="async"
                loading="lazy"
                className="frieren-img h-full w-auto select-none block"
                style={{
                  objectFit: 'contain',
                  objectPosition: 'right bottom',
                  transform: 'translateX(-18px) scale(1.25)',
                  transformOrigin: 'right bottom',
                }}
                draggable={false}
              />
            </div>

            {/* Floating choice menu — sits inside the Frieren container so
                mouse movement between Frieren and the buttons doesn't fire
                a mouseLeave. */}
            <div
              className={`choice-menu absolute top-[12%] left-2 sm:left-4 md:left-6 z-[10] ${showMenu ? 'choice-visible' : ''}`}
              aria-hidden={!showMenu}
            >
              <div className="choice-float">
                <div
                  className="paper-card rounded-[1.2rem] p-3 flex flex-col gap-2 min-w-[160px]"
                  style={{ boxShadow: '0 18px 36px -16px rgba(60,45,30,0.35)' }}
                >
                  <span
                    className="text-[10px] uppercase tracking-[0.30em] text-center pb-1.5 border-b"
                    style={{ color: 'var(--ink-mute)', borderColor: 'rgba(184,148,90,0.20)' }}
                  >
                    What do you do?
                  </span>
                  <button
                    type="button"
                    onClick={onDrink}
                    className="btn-press w-full flex items-center justify-center gap-2 rounded-full text-white text-[13px] font-medium tracking-wide py-2 px-4"
                    style={{
                      background: 'var(--ink)',
                      boxShadow: '0 8px 20px -8px rgba(42,39,48,0.55)',
                    }}
                  >
                    <span aria-hidden="true">✦</span>
                    Drink
                  </button>
                  <button
                    type="button"
                    onClick={onDontDrink}
                    className="btn-press w-full text-center rounded-full text-[12px] font-medium tracking-wide py-1.5 px-4 transition-colors"
                    style={{
                      background: 'transparent',
                      color: 'var(--plum)',
                      border: '1px solid rgba(90, 74, 106, 0.28)',
                    }}
                  >
                    Don't drink !
                  </button>
                </div>
              </div>
            </div>

            {/* "You poisoned Frieren..." — appears 2s after Drink, in sync
                with the dizzy-pose crossfade. Uses .poison-menu (1.2s
                blur-out → blur-in) for a slow, fluid reveal that reads as
                a consequence dawning rather than a UI popping in. */}
            <div
              className={`poison-menu absolute top-[12%] left-2 sm:left-4 md:left-6 z-[10] ${showPoison ? 'poison-visible' : ''}`}
              aria-live="polite"
              aria-hidden={!showPoison}
            >
              <div className="choice-float">
                <div
                  className="paper-card rounded-[1.2rem] px-4 py-3 flex items-center gap-3 min-w-[210px]"
                  style={{
                    boxShadow:
                      '0 18px 36px -16px rgba(60,15,30,0.45), inset 0 0 0 1px rgba(150,40,60,0.18)',
                  }}
                >
                  <span
                    className="inline-flex items-center justify-center w-7 h-7 rounded-full text-[14px]"
                    style={{
                      background: 'rgba(150, 40, 60, 0.14)',
                      color: '#a23a4d',
                      border: '1px solid rgba(150, 40, 60, 0.28)',
                    }}
                    aria-hidden="true"
                  >
                    ☠
                  </span>
                  <span
                    className="font-serif italic text-[15px] leading-snug"
                    style={{ color: '#5a1f2a' }}
                  >
                    You poisoned Frieren…
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Fern peeking — click cycles through party portraits, tilt alternates direction */}
          <CharacterCarousel />

          <div
            data-parallax="-0.18"
            className="absolute inset-0 pointer-events-none z-[5]"
          >
            <BottomLeftCard />
          </div>
          {/* Grimoire label stays anchored — no parallax. It's the visual hinge between hero & section 01. */}
          <BottomRightCorner />
        </div>
      </section>
    </div>
  );
}
