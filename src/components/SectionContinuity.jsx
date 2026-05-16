import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useReveal } from '../hooks/useReveal';
import { ChevronLeft, ChevronRight, RuneMark } from '../icons';
import { getLenis } from '../lib/lenis';
import { LiquidGlassCapsule } from './LiquidGlassCapsule';

/**
 * Triptych slider for the Companions chapter. Four panels total, three
 * visible at any time. The user-supplied JPGs fill each card edge-to-edge —
 * no gradient backgrounds — and a bottom-up vignette keeps the caption
 * legible. The centre pill is the LiquidGlassCapsule and is the primary
 * advance affordance; arrows at the extremes are kept but dimmed.
 *
 * Macht is included as the deliberate adversary — same triptych language so
 * he reads as part of Frieren's gallery of significant figures, but tagged
 * "Foe" with red trim to set him apart from companions.
 */

// Each entry pairs the full-bleed portrait with a gradient texture used as
// a colour-tint overlay (and on the engraved name in earlier passes).
//
// Roster order is thematic, walking outward from Frieren's present-day
// party → her old party → her ancient master → the imperial mages of her
// current era → the demons that hunt or oppose her.
const CHARACTERS = [
  // ── Frieren's current journey ──────────────────────────────────────────
  {
    name: 'Frieren',
    role: 'The Mage',
    era: 'Eternal',
    desc: 'The elven mage who outlived her companions. She walks south to where heroes are said to go after death, learning slowly what they meant to her.',
    image: '/assets/images/characters/companions imgs/frieren.webp',
    nameGradient: '/assets/images/characters/companions imgs/texture gradient white frieren.webp',
    enemy: false,
  },
  {
    name: 'Fern',
    role: 'The Apprentice',
    era: 'Long Road',
    desc: "Heiter's orphan and Frieren's quiet apprentice. Her precision with magic hides a heart that worries about everyone but herself.",
    image: '/assets/images/characters/companions imgs/fern.webp',
    nameGradient: '/assets/images/characters/companions imgs/gradient purple fern.webp',
    // Fern's purple gradient was overpowering the portrait — same
    // treatment as Flamme's fire palette, dial the tint down so the
    // colour reads as a whisper instead of a wash.
    tintStrength: 0.22,
    enemy: false,
  },
  {
    name: 'Stark',
    role: 'The Successor',
    era: 'Long Road',
    desc: "Eisen's apprentice · terrified of his own strength. The first axe of a new age, swung with a reluctant courage.",
    image: '/assets/images/characters/companions imgs/stark01.webp',
    nameGradient: '/assets/images/characters/companions imgs/red peach gradient stark.webp',
    enemy: false,
  },
  {
    name: 'Sein',
    role: 'The Priest',
    era: 'Long Road',
    desc: "A priest in no hurry to be anywhere. Beneath the easy smile, a friend's grave he keeps walking past on the way to nowhere in particular.",
    image: '/assets/images/characters/companions imgs/sein.webp',
    nameGradient: '/assets/images/characters/companions imgs/green-white-gradient-sein.webp',
    enemy: false,
  },

  // ── The past she carries ───────────────────────────────────────────────
  {
    name: 'Himmel · Heiter · Eisen',
    role: 'The Original Party',
    era: 'Age of Heroes',
    desc: 'The party that slew the Demon King. A handful of years to them was a heartbeat to her · long enough to leave a thousand-year ache.',
    image: '/assets/images/characters/companions imgs/himmel-heiter-eisen.webp',
    nameGradient: '/assets/images/characters/companions imgs/gray gradient silver himmel heiter eisen.webp',
    enemy: false,
  },
  {
    name: 'Flamme',
    role: 'The Ancestor',
    era: 'Age of Legend',
    desc: "Frieren's master and the first human ever befriended by an elf. She wagered a whole life on the chance that elves could one day mourn humans.",
    image: '/assets/images/characters/companions imgs/flamme de dos.webp',
    hoverImage: '/assets/images/characters/companions imgs/flamme de dos2.webp',
    // Anchor the hover frame to the top of the image so the head/shoulders
    // stay fully visible instead of getting cropped by the centred crop.
    hoverImagePosition: 'center top',
    nameGradient: '/assets/images/characters/companions imgs/flammes red white gradient.webp',
    // Below the default 0.40 — fire palette stays a whisper rather than
    // a wash on Flamme's already warm portrait.
    tintStrength: 0.3,
    enemy: false,
  },

  // ── The Empire's first-class mages ─────────────────────────────────────
  {
    name: 'Denken',
    role: 'The Elder',
    era: 'First Class',
    desc: 'A first-class mage of the empire, gentle for an elder. Once felled a dragon, mostly while complaining about his back.',
    image: '/assets/images/characters/companions imgs/Denken.webp',
    nameGradient: '/assets/images/characters/companions imgs/gray gradient silver denken.webp',
    enemy: false,
  },
  {
    name: 'Méthode · Genau',
    role: 'First Class',
    era: 'Imperial',
    desc: "Two of the empire's coldest first-class mages · assigned to the demon-hunt because the throne still trusts no one else. Polished, lethal, uneasy.",
    image: '/assets/images/characters/companions imgs/methode-genau.webp',
    nameGradient: '/assets/images/characters/companions imgs/texture gradient white geneau methode.webp',
    enemy: false,
  },

  // ── The demons that oppose her ─────────────────────────────────────────
  {
    name: 'Macht',
    role: 'The Adversary',
    era: 'Demonic',
    desc: 'A demon who studied human kindness for centuries, and never once felt it. The most dangerous adversary is the one who can imitate the heart.',
    image: '/assets/images/characters/companions imgs/Macht.webp',
    nameGradient: '/assets/images/characters/companions imgs/black purple gradient macht-Aura.webp',
    enemy: true,
  },
  {
    name: 'Aura',
    role: 'The Guillotine',
    era: 'Demonic',
    desc: "A demon-general of the Seven Sages. Undone by the one number she didn't bother to count: the depth of an elf's suppressed mana.",
    image: '/assets/images/characters/companions imgs/Aura.webp',
    nameGradient: '/assets/images/characters/companions imgs/black purple gradient macht-Aura.webp',
    enemy: true,
    // 3D flip on hover (in addition to the scale): image rotates around its
    // horizontal axis, which reads as her literal undoing — head over heels.
    flipY: true,
  },
  {
    name: 'Solitär',
    role: 'The Watcher',
    era: 'Ancient Demonic',
    desc: 'A demon old enough to remember Flamme. To her, Frieren is a wound she has waited centuries to settle · and she will wait centuries more.',
    image: '/assets/images/characters/companions imgs/Solitär.webp',
    nameGradient: '/assets/images/characters/companions imgs/texture gradient white solitar.webp',
    enemy: true,
  },
];

const VISIBLE = 3;
const N = CHARACTERS.length; // 6
// Render the character roster three times in a row. Idx lives in the
// MIDDLE copy [N, 2N) at rest; clicks may push it temporarily into the
// neighbouring copies, after which a useEffect snaps it back to the
// equivalent position in the middle. This produces a true infinite scroll
// in BOTH directions without ever showing the user a hard rewind.
const TRIPLE = [...CHARACTERS, ...CHARACTERS, ...CHARACTERS];
// Slide animation duration must match the CSS transition below; used to
// time the snap and the click lock.
const SLIDE_MS = 700;

function CompanionPanel({ c, isCenter }) {
  // The IMAGE is grayscaled when this card isn't the centre and isn't hovered;
  // the colour-gradient overlay sits on top and re-tints the grayscale via
  // `mix-blend-mode: color` so the silhouette already reads in the
  // character's palette. On hover the image transitions back to full colour
  // AND the gradient fades out — revealing the original portrait.
  const desaturated = !isCenter;
  const grayscaleClasses = desaturated
    ? 'grayscale group-hover:grayscale-0 transition-[filter] duration-700 ease-out'
    : '';

  return (
    <div
      className="group companion-card relative w-full h-full overflow-hidden rounded-[0.8rem] sm:rounded-[1rem] md:rounded-[1.4rem]"
      style={{
        // No box-shadow on the panel: with `px-1.5` padding around each
        // panel inside the track, the ~20px shadow bled into the gap and
        // at the slider's left/right edges, looking like dark bands.
        // Force a fresh stacking context + GPU layer so the inner image's
        // hover scale-1.06 transform stays inside the rounded clip.
        isolation: 'isolate',
        transform: 'translateZ(0)',
      }}
    >
      {/* Full-bleed character photo — subtle scale on hover for that
          dynamic, alive feel. Cubic-bezier easing keeps the move buttery
          (no linear jank) and 800ms duration is slow enough that it reads
          as breath, not a snap.

          `flipY` (Aura) and `hoverImage` (Flamme) both fade out on hover
          so an alternate layer can fade in on top — see the conditional
          renders below. */}
      <img
        src={c.image}
        alt={c.name}
        loading="lazy"
        decoding="async"
        className={`absolute inset-0 w-full h-full object-cover object-center select-none pointer-events-none transition-[transform,opacity,filter] duration-[800ms] ease-out group-hover:scale-[1.06] ${grayscaleClasses} ${
          c.flipY || c.hoverImage ? 'group-hover:opacity-0' : ''
        }`}
        style={{ transitionTimingFunction: 'cubic-bezier(.2, .7, .2, 1)' }}
        draggable={false}
      />

      {/* Vertically-mirrored overlay (Aura) — same image flipped via
          scaleY(-1), cross-fades in on hover. No 3D rotation: the
          orientation change is sold purely by the opacity swap. */}
      {c.flipY && (
        <img
          src={c.image}
          alt=""
          aria-hidden="true"
          loading="lazy"
          decoding="async"
          className={`companion-flip-y absolute inset-0 w-full h-full object-cover object-center select-none pointer-events-none opacity-0 group-hover:opacity-100 ${grayscaleClasses}`}
          draggable={false}
        />
      )}

      {/* Optional swap image (Flamme) — different image entirely, fades in
          on hover with the same scale so the swap feels like one motion.
          `hoverImagePosition` lets a character override the default centre
          crop when the swap image is framed differently from the main one. */}
      {c.hoverImage && (
        <img
          src={c.hoverImage}
          alt=""
          aria-hidden="true"
          loading="lazy"
          decoding="async"
          className={`absolute inset-0 w-full h-full object-cover select-none pointer-events-none opacity-0 transition-[transform,opacity,filter] duration-[800ms] ease-out group-hover:opacity-100 group-hover:scale-[1.06] ${grayscaleClasses}`}
          style={{
            transitionTimingFunction: 'cubic-bezier(.2, .7, .2, 1)',
            objectPosition: c.hoverImagePosition || 'center',
          }}
          draggable={false}
        />
      )}

      {/* Per-character gradient tint — fades in for the centre card and on
          hover. Strength is per-character via the `--tint-on` CSS variable
          (Flamme dials hers up so her fire palette really reads). */}
      {c.nameGradient && (
        <div
          className={`tint-overlay absolute inset-0 pointer-events-none ${
            isCenter ? 'is-center' : ''
          }`}
          style={{
            backgroundImage: `url("${c.nameGradient}")`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            mixBlendMode: 'overlay',
            ['--tint-on']: c.tintStrength ?? 0.4,
          }}
          aria-hidden="true"
        />
      )}

      {/* Bottom frosted-glass blur — back to the simple recipe: the layer
          itself has matching rounded-bottom corners + overflow:hidden so the
          backdrop-filter stays inside the card. Top fade via mask-image. */}
      <div
        className="absolute inset-x-0 bottom-0 pointer-events-none rounded-b-[0.8rem] sm:rounded-b-[1rem] md:rounded-b-[1.4rem] overflow-hidden"
        style={{
          height: '24%',
          backdropFilter: 'blur(10px) saturate(1.05)',
          WebkitBackdropFilter: 'blur(10px) saturate(1.05)',
          WebkitMaskImage:
            'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 100%)',
          maskImage:
            'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 100%)',
        }}
      />

      {/* Soft dark vignette under the caption — supports text contrast on top
          of the frosted blur. Stays inside the card too. */}
      <div
        className="absolute inset-x-0 bottom-0 h-[42%] pointer-events-none rounded-b-[0.8rem] sm:rounded-b-[1rem] md:rounded-b-[1.4rem]"
        style={{
          background:
            'linear-gradient(0deg, rgba(10,8,6,0.55) 0%, rgba(10,8,6,0.25) 50%, rgba(10,8,6,0) 100%)',
        }}
      />

      {/* Caption */}
      <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4 md:p-5 text-white pointer-events-none">
        <div className="flex items-baseline justify-between gap-2 mb-1">
          <span
            className={`text-[9px] sm:text-[10px] uppercase tracking-[0.32em] ${c.enemy ? 'text-[#f5b8a8]' : 'opacity-75'}`}
          >
            {c.era}
          </span>
          {c.enemy && (
            <span
              className="text-[8px] sm:text-[9px] uppercase tracking-[0.28em] px-2 py-0.5 rounded-full"
              style={{
                background: 'rgba(255,80,80,0.22)',
                border: '1px solid rgba(255,140,120,0.55)',
                color: '#ffd6cc',
              }}
            >
              Foe
            </span>
          )}
        </div>
        <span
          className="companion-name block font-serif italic text-2xl sm:text-3xl md:text-[34px] leading-tight"
        >
          {c.name}
        </span>
        <span className="block text-[10px] sm:text-[11px] uppercase tracking-[0.28em] mt-1.5 mb-2 opacity-85">
          {c.role}
        </span>
        <p className="text-[11px] sm:text-[12px] md:text-[13px] leading-snug text-white/85 max-w-[95%]">
          {c.desc}
        </p>
      </div>
    </div>
  );
}

export function SectionContinuity() {
  const titleRef = useReveal();
  // idx lives in [N, 2N) at rest. During an animation it may briefly sit
  // at idx-1 or 2N (one panel beyond either edge of the middle copy); the
  // post-transition useEffect snaps it back to the equivalent middle slot.
  const [idx, setIdx] = useState(N);
  const [transitionOn, setTransitionOn] = useState(true);
  const [isHovering, setIsHovering] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  // Index of the image currently shown inside the fullscreen overlay.
  // For characters with a single image this stays at 0. For characters
  // with both `image` and `hoverImage` (currently Flamme), the side
  // arrows / keyboard arrows step through this index.
  const [fsImageIdx, setFsImageIdx] = useState(0);
  // Direction of the most recent image step (+1 next, -1 prev) — fed
  // into the AnimatePresence crossfade so the new image enters from
  // the side the user is going toward.
  const [fsImageDir, setFsImageDir] = useState(0);
  const lockRef = useRef(false);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((v) => !v);
  }, []);

  // Build the list of images for the centre character. Filters out
  // missing slots so we don't render a broken second image for cards
  // that only have one. Memoised on the centre character so a slider
  // move recomputes it cleanly.
  const centerChar = TRIPLE[idx + 1];
  const fsImageList = useMemo(() => {
    return [centerChar.image, centerChar.hoverImage].filter(Boolean);
  }, [centerChar.image, centerChar.hoverImage]);

  // Reset the image index whenever the centre character changes (the
  // slider moved) OR fullscreen opens — both cases want to start from
  // the primary image of whatever character is on display.
  useEffect(() => {
    setFsImageIdx(0);
    setFsImageDir(0);
  }, [idx, isFullscreen]);

  const fsImageNext = useCallback(() => {
    setFsImageDir(1);
    setFsImageIdx((i) => (i + 1) % fsImageList.length);
  }, [fsImageList.length]);
  const fsImagePrev = useCallback(() => {
    setFsImageDir(-1);
    setFsImageIdx(
      (i) => (i - 1 + fsImageList.length) % fsImageList.length
    );
  }, [fsImageList.length]);

  // Keyboard nav while fullscreen: ESC closes, arrows step through
  // images (no-op for single-image cards).
  useEffect(() => {
    if (!isFullscreen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') toggleFullscreen();
      else if (fsImageList.length > 1 && e.key === 'ArrowRight') fsImageNext();
      else if (fsImageList.length > 1 && e.key === 'ArrowLeft') fsImagePrev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isFullscreen, toggleFullscreen, fsImageList.length, fsImageNext, fsImagePrev]);

  // Pause page scroll while fullscreen so the slider can't slide behind
  // the overlay. Same recipe used for the WorldCard fullscreen in
  // Chapter II so the two interactions feel identical.
  useEffect(() => {
    const lenis = getLenis();
    if (!lenis) return;
    if (isFullscreen) lenis.stop();
    else lenis.start();
    return () => lenis.start();
  }, [isFullscreen]);

  // Single entry-point — guards against rapid clicks that would push idx
  // beyond the rendered triple-copy window.
  const advanceTo = (newIdx) => {
    if (lockRef.current) return;
    lockRef.current = true;
    setTransitionOn(true);
    setIdx(newIdx);
    setTimeout(() => {
      lockRef.current = false;
    }, SLIDE_MS + 30);
  };

  const next = () => advanceTo(idx + 1);
  const prev = () => advanceTo(idx - 1);
  const goTo = (charIdx) => advanceTo(N + charIdx);

  // Snap back to the middle copy after the slide finishes.
  useEffect(() => {
    if (idx >= 2 * N || idx < N) {
      const t = setTimeout(() => {
        setTransitionOn(false);
        const wrapped = N + (((idx - N) % N) + N) % N;
        setIdx(wrapped);
      }, SLIDE_MS);
      return () => clearTimeout(t);
    }
  }, [idx]);

  // Re-arm the CSS transition on the very next paint after a snap so the
  // following click animates again.
  useEffect(() => {
    if (!transitionOn) {
      const r1 = requestAnimationFrame(() => {
        const r2 = requestAnimationFrame(() => setTransitionOn(true));
        return () => cancelAnimationFrame(r2);
      });
      return () => cancelAnimationFrame(r1);
    }
  }, [transitionOn]);

  // Auto-advance every 6.2s. The effect depends on `idx` (so manual moves
  // reset the countdown) AND on `isHovering` (so the timer pauses while
  // the cursor is anywhere over the slider — no autoplay racing the user).
  useEffect(() => {
    if (isHovering || isFullscreen) return;
    const t = setInterval(() => {
      advanceTo(idx + 1);
    }, 6200);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, isHovering, isFullscreen]);

  // Track holds 3N panels each at (100/3N)% of track width; track itself is
  // (3N/VISIBLE)*100% wide so VISIBLE panels exactly fill the viewport frame.
  const trackWidth = (TRIPLE.length / VISIBLE) * 100; // 600% for 18/3
  const stepPct = 100 / TRIPLE.length; // 5.555% per step on the track
  const activeDot = (((idx - N) % N) + N) % N;

  return (
    <section
      data-screen-label="01 Companions"
      className="relative w-full"
      style={{ background: 'var(--ivory)' }}
    >
      <div
        ref={titleRef}
        className="reveal-rise relative max-w-[1536px] mx-auto px-6 md:px-12 pt-20 md:pt-28 pb-24 md:pb-32"
      >
        <div className="flex items-center gap-4 mb-6">
          <span className="rune-line"></span>
          <span
            className="text-[11px] tracking-[0.32em] uppercase font-medium"
            style={{ color: 'var(--ink-mute)' }}
          >
            Chapter I · Companions
          </span>
          <RuneMark className="w-3.5 h-3.5" style={{ color: 'var(--gold)' }} />
        </div>

        <div className="md:flex md:items-end md:justify-between md:gap-12 mb-10 md:mb-14">
          <h2
            className="font-serif text-4xl sm:text-5xl md:text-7xl font-light tracking-[-0.02em] leading-[1.02] max-w-[18ch]"
            style={{ color: 'var(--ink)' }}
          >
            Where the road has{' '}
            <em className="italic" style={{ color: 'var(--gold)' }}>companions</em>.
          </h2>
          <p
            className="font-serif italic mt-5 md:mt-0 max-w-md text-lg leading-relaxed"
            style={{ color: 'var(--ink-soft)' }}
          >
            Frieren walked a thousand years before she learned to walk with another.
            These are the few who slowed an elf's long step · and the one who refused
            to learn from his.
          </p>
        </div>

        {/* Triptych frame — always fills the section width. 16:9 sets the
            natural height on narrow screens; on tall viewports the height
            is capped so the whole section stays visible, and the frame
            simply becomes wider-than-16:9 (cards crop via object-cover,
            no distortion). */}
        <div
          className="relative w-full"
          style={{
            aspectRatio: '16 / 9',
            maxHeight: '58vh',
          }}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          <div
            className={`absolute inset-0 overflow-hidden rounded-[1rem] md:rounded-[1.4rem] ${
              transitionOn ? '' : 'snap-frozen'
            }`}
          >
            <div
              className="flex h-full"
              style={{
                width: `${trackWidth}%`,
                transform: `translateX(-${idx * stepPct}%)`,
                transition: transitionOn
                  ? `transform ${SLIDE_MS}ms cubic-bezier(.2,.7,.2,1)`
                  : 'none',
              }}
            >
              {TRIPLE.map((c, i) => (
                <div
                  key={`${c.name}-${i}`}
                  className="flex-shrink-0 px-1 sm:px-1 md:px-1.5"
                  style={{ width: `${stepPct}%` }}
                >
                  {/* Centre of the visible window is at idx+1 (window =
                      [idx, idx+1, idx+2]). Cards there stay full colour;
                      side cards desaturate. */}
                  <CompanionPanel c={c} isCenter={i === idx + 1} />
                </div>
              ))}
            </div>
          </div>

          {/* Liquid-glass focal capsule — now a fullscreen TOGGLE rather
              than the advance control. Wrapped in a `motion.div` with a
              shared `layoutId` so it morphs (FLIPs) to the bottom-right
              of the fullscreen overlay when the user opens it, and
              springs back to the slider centre when they close it.
              Only renders in this slot when NOT fullscreen — the
              counterpart at the corner of the overlay shares the same
              layoutId and is the morph target. */}
          {!isFullscreen && (
            <motion.div
              layoutId="continuity-pill"
              transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
              className="absolute z-[3]"
              style={{
                top: '50%',
                left: '50%',
                width: 'clamp(48px, 5.5vw, 78px)',
                height: 'clamp(78px, 9vw, 130px)',
                marginLeft: 'calc(clamp(48px, 5.5vw, 78px) / -2)',
                marginTop: 'calc(clamp(78px, 9vw, 130px) / -2)',
              }}
            >
              <LiquidGlassCapsule
                onClick={toggleFullscreen}
                ariaLabel="View companion in fullscreen"
              />
            </motion.div>
          )}

          {/* Arrows at extremities — kept for direction control, dimmed so the
              capsule reads as the primary affordance */}
          <button
            type="button"
            onClick={prev}
            aria-label="Previous companions"
            className="absolute left-3 sm:left-4 md:left-6 top-1/2 -translate-y-1/2 z-[4] w-11 h-11 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 opacity-55 hover:opacity-100"
            style={{
              background: 'rgba(241,234,217,0.55)',
              backdropFilter: 'blur(14px)',
              WebkitBackdropFilter: 'blur(14px)',
              border: '1px solid rgba(184,148,90,0.25)',
              color: 'var(--ink)',
              boxShadow: '0 6px 18px -10px rgba(0,0,0,0.35)',
            }}
          >
            <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" strokeWidth={1.8} />
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Next companions"
            className="absolute right-3 sm:right-4 md:right-6 top-1/2 -translate-y-1/2 z-[4] w-11 h-11 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 opacity-55 hover:opacity-100"
            style={{
              background: 'rgba(241,234,217,0.55)',
              backdropFilter: 'blur(14px)',
              WebkitBackdropFilter: 'blur(14px)',
              border: '1px solid rgba(184,148,90,0.25)',
              color: 'var(--ink)',
              boxShadow: '0 6px 18px -10px rgba(0,0,0,0.35)',
            }}
          >
            <ChevronRight className="w-4 h-4 md:w-5 md:h-5" strokeWidth={1.8} />
          </button>
        </div>

        {/* Position dots — one per character (the leftmost visible card) */}
        <div className="flex items-center justify-center gap-2 mt-6">
          {CHARACTERS.map((c, i) => (
            <button
              key={c.name}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Show ${c.name}`}
              className="h-1.5 rounded-full transition-all duration-300"
              style={{
                width: i === activeDot ? '28px' : '8px',
                background: i === activeDot ? 'var(--gold)' : 'rgba(42,39,48,0.25)',
              }}
            />
          ))}
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────
          Fullscreen overlay — opens when the user clicks the focal pill.
          Shows the current centre character's portrait at full viewport
          scale; the pill morphs to the bottom-right corner via the
          shared `layoutId` and re-toggles fullscreen off when clicked.
          Click anywhere on the dim backdrop also dismisses. ESC works
          via the keydown effect above.
         ──────────────────────────────────────────────────────────────── */}
      {isFullscreen && (
        <>
          {/* Dimmed blurred backdrop — click to dismiss. */}
          <button
            type="button"
            aria-label="Close fullscreen"
            onClick={toggleFullscreen}
            className="fixed inset-0 z-[9998] cursor-pointer"
            style={{
              background: 'rgba(20, 15, 30, 0.78)',
              backdropFilter: 'blur(14px) saturate(120%)',
              WebkitBackdropFilter: 'blur(14px) saturate(120%)',
              border: 'none',
              animation: 'f-fadeIn 280ms ease-out both',
            }}
          />

          {/* Full-bleed portrait of the current centre character.
              `inset: 3.5vw` mirrors the WorldCard fullscreen so the
              two interactions feel like one design language. */}
          {/* Image at native aspect ratio. Uses flex centering on a
              full-bleed wrapper so the <img> shrinks to fit while
              keeping its original proportions — no cropping, no
              forced 16:9 frame. The caption is anchored to the
              image's own bottom edge (it's a sibling inside the
              `relative` <img>-wrapper) so it always sits flush on
              the portrait rather than floating on the backdrop. */}
          <motion.div
            layoutId="continuity-fullscreen-image"
            transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
            className="fixed z-[9999] flex items-center justify-center pointer-events-none"
            style={{
              top: '3.5vw',
              right: '3.5vw',
              bottom: '3.5vw',
              left: '3.5vw',
            }}
          >
            <div className="relative max-w-full max-h-full inline-flex pointer-events-auto">
              {/* AnimatePresence crossfades between images when the
                  character has more than one variant (Flamme has a
                  back-pose alt; future characters could too). The
                  `key` is the src so swapping the index swaps the
                  element identity and runs the enter/exit motion. */}
              <AnimatePresence mode="wait" initial={false} custom={fsImageDir}>
                <motion.img
                  key={fsImageList[fsImageIdx]}
                  src={fsImageList[fsImageIdx]}
                  alt={centerChar.name}
                  custom={fsImageDir}
                  initial={{ opacity: 0, x: fsImageDir * 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: fsImageDir * -24 }}
                  transition={{ duration: 0.45, ease: [0.32, 0.72, 0, 1] }}
                  className="max-w-full max-h-full object-contain select-none rounded-[1.6rem]"
                  style={{ maxHeight: 'calc(100vh - 7vw)' }}
                  draggable={false}
                />
              </AnimatePresence>
              {/* Bottom-up scrim — sits inside the image-shaped
                  wrapper so it follows the portrait, not the
                  letterbox area. */}
              <div
                className="absolute inset-x-0 bottom-0 pointer-events-none rounded-b-[1.6rem]"
                style={{
                  height: '38%',
                  background:
                    'linear-gradient(0deg, rgba(10,8,6,0.72) 0%, rgba(10,8,6,0.30) 55%, rgba(10,8,6,0) 100%)',
                }}
              />
              <div className="absolute inset-x-0 bottom-0 p-6 md:p-10 text-white pointer-events-none">
                <span
                  className={`block text-[11px] uppercase tracking-[0.32em] mb-2 ${
                    centerChar.enemy ? 'text-[#f5b8a8]' : 'opacity-75'
                  }`}
                >
                  {centerChar.era}
                </span>
                <span className="block font-serif italic text-4xl md:text-6xl leading-tight">
                  {centerChar.name}
                </span>
                <span className="block text-[11px] md:text-[12px] uppercase tracking-[0.28em] mt-2 opacity-85">
                  {centerChar.role}
                </span>
              </div>

              {/* Image-step controls — only mounted when the centre
                  character has more than one image variant. Anchored
                  to the image-shaped wrapper (not the viewport), so
                  they sit on the portrait's edges rather than
                  floating in the letterbox area, matching how the
                  slider arrows hug the triptych. */}
              {fsImageList.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={fsImagePrev}
                    aria-label="Previous variant"
                    className="absolute left-4 md:left-5 top-1/2 -translate-y-1/2 z-[2] w-11 h-11 rounded-full flex items-center justify-center transition-transform duration-300 hover:scale-110 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0 focus-visible:ring-[#b8945a]"
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
                    <ChevronLeft className="w-5 h-5" strokeWidth={1.7} />
                  </button>
                  <button
                    type="button"
                    onClick={fsImageNext}
                    aria-label="Next variant"
                    className="absolute right-4 md:right-5 top-1/2 -translate-y-1/2 z-[2] w-11 h-11 rounded-full flex items-center justify-center transition-transform duration-300 hover:scale-110 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0 focus-visible:ring-[#b8945a]"
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
                    <ChevronRight className="w-5 h-5" strokeWidth={1.7} />
                  </button>
                  {/* Dot indicators — small, bottom-center, tinted
                      gold for the active image. */}
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-4 md:bottom-6 z-[2] flex items-center gap-1.5 pointer-events-none">
                    {fsImageList.map((_, i) => (
                      <span
                        key={i}
                        className="h-1.5 rounded-full transition-all duration-300"
                        style={{
                          width: i === fsImageIdx ? '20px' : '6px',
                          background:
                            i === fsImageIdx
                              ? 'var(--gold)'
                              : 'rgba(255,255,255,0.45)',
                        }}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </motion.div>

          {/* Fullscreen pill — morph target for the slider pill. Smaller
              size than the slider variant so the layout transition
              reads as "the pill shrank and tucked into the corner". */}
          <motion.div
            layoutId="continuity-pill"
            transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
            className="fixed z-[10000]"
            style={{
              bottom: '5.5vw',
              right: '5.5vw',
              width: 'clamp(34px, 3.8vw, 54px)',
              height: 'clamp(56px, 6.2vw, 90px)',
            }}
          >
            <LiquidGlassCapsule
              onClick={toggleFullscreen}
              ariaLabel="Exit fullscreen"
            />
          </motion.div>
        </>
      )}
    </section>
  );
}
