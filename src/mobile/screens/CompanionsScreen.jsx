import { useEffect, useRef, useState } from 'react';

// Roster mirrors the desktop SectionContinuity order — present-day
// party → old party → ancestor → empire's first-class → demonic
// adversaries. Lean shape (no gradients/tint strengths/hover images
// — mobile uses a single composed look). The Enemy flag drives the
// red "foe" badge.
const CHARACTERS = [
  {
    name: 'Frieren',
    role: 'The Mage',
    era: 'Eternal',
    desc: 'The elven mage who outlived her companions. She walks south to where heroes are said to go after death, learning slowly what they meant to her.',
    image: '/assets/images/characters/companions imgs/frieren.webp',
    enemy: false,
  },
  {
    name: 'Fern',
    role: 'The Apprentice',
    era: 'Long Road',
    desc: "Heiter's orphan and Frieren's quiet apprentice. Her precision with magic hides a heart that worries about everyone but herself.",
    image: '/assets/images/characters/companions imgs/fern.webp',
    enemy: false,
  },
  {
    name: 'Stark',
    role: 'The Successor',
    era: 'Long Road',
    desc: "Eisen's apprentice · terrified of his own strength. The first axe of a new age, swung with a reluctant courage.",
    image: '/assets/images/characters/companions imgs/stark01.webp',
    enemy: false,
  },
  {
    name: 'Sein',
    role: 'The Priest',
    era: 'Long Road',
    desc: "A priest in no hurry to be anywhere. Beneath the easy smile, a friend's grave he keeps walking past on the way to nowhere in particular.",
    image: '/assets/images/characters/companions imgs/sein.webp',
    enemy: false,
  },
  {
    name: 'Himmel · Heiter · Eisen',
    role: 'The Original Party',
    era: 'Age of Heroes',
    desc: 'The party that slew the Demon King. A handful of years to them was a heartbeat to her · long enough to leave a thousand-year ache.',
    image: '/assets/images/characters/companions imgs/himmel-heiter-eisen.webp',
    enemy: false,
  },
  {
    name: 'Flamme',
    role: 'The Ancestor',
    era: 'Age of Legend',
    desc: "Frieren's master and the first human ever befriended by an elf. She wagered a whole life on the chance that elves could one day mourn humans.",
    image: '/assets/images/characters/companions imgs/flamme de dos.webp',
    enemy: false,
  },
  {
    name: 'Denken',
    role: 'The Elder',
    era: 'First Class',
    desc: 'A first-class mage of the empire, gentle for an elder. Once felled a dragon, mostly while complaining about his back.',
    image: '/assets/images/characters/companions imgs/Denken.webp',
    enemy: false,
  },
  {
    name: 'Méthode · Genau',
    role: 'First Class',
    era: 'Imperial',
    desc: "Two of the empire's coldest first-class mages · assigned to the demon-hunt because the throne still trusts no one else. Polished, lethal, uneasy.",
    image: '/assets/images/characters/companions imgs/methode-genau.webp',
    enemy: false,
  },
  {
    name: 'Macht',
    role: 'The Adversary',
    era: 'Demonic',
    desc: 'A demon who studied human kindness for centuries, and never once felt it. The most dangerous adversary is the one who can imitate the heart.',
    image: '/assets/images/characters/companions imgs/Macht.webp',
    enemy: true,
  },
  {
    name: 'Aura',
    role: 'The Guillotine',
    era: 'Demonic',
    desc: "A demon-general of the Seven Sages. Undone by the one number she didn't bother to count: the depth of an elf's suppressed mana.",
    image: '/assets/images/characters/companions imgs/Aura.webp',
    enemy: true,
  },
  {
    name: 'Solitär',
    role: 'The Watcher',
    era: 'Ancient Demonic',
    desc: 'A demon old enough to remember Flamme. To her, Frieren is a wound she has waited centuries to settle · and she will wait centuries more.',
    image: '/assets/images/characters/companions imgs/Solitär.webp',
    enemy: true,
  },
];

/**
 * Horizontal swipe stack — one full-screen card per character,
 * paginated via CSS scroll-snap. Native-feeling on touch (the OS
 * handles momentum and the snap), no JS scroll listeners needed
 * for the actual pagination.
 *
 * An IntersectionObserver on each card tracks which one is in view
 * (50% threshold) to keep the page-dot indicator in sync.
 */
export function CompanionsScreen() {
  const railRef = useRef(null);
  const [activeIdx, setActiveIdx] = useState(0);
  // Per-screen "show the portrait fullscreen" mode. Active card's
  // image grows to fill the card area, the beige body slides off,
  // and a close affordance appears. Resets every time the user
  // moves to a different card so they don't land on an unfamiliar
  // companion in zoomed-in mode.
  const [expanded, setExpanded] = useState(false);
  useEffect(() => {
    setExpanded(false);
  }, [activeIdx]);

  // Track which card is centered in the rail. One IO per card with
  // a 0.55 threshold — fires when the card crosses half-visible in
  // either direction, which lines up cleanly with snap behavior.
  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    const cards = rail.querySelectorAll('[data-companion-idx]');
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && e.intersectionRatio > 0.55) {
            setActiveIdx(Number(e.target.dataset.companionIdx));
          }
        }
      },
      { root: rail, threshold: [0, 0.55, 1] }
    );
    cards.forEach((c) => io.observe(c));
    return () => io.disconnect();
  }, []);

  // Tapping a dot scrolls the rail to the matching card. Smooth
  // behaviour is native — the same snap takes over once the
  // animation lands inside the card's bounds.
  const goTo = (i) => {
    const rail = railRef.current;
    const card = rail?.querySelector(`[data-companion-idx="${i}"]`);
    card?.scrollIntoView({
      behavior: 'smooth',
      inline: 'start',
      block: 'nearest',
    });
  };

  // Desktop affordance only — on a phone the native horizontal
  // swipe + scroll-snap handles everything and this effect is
  // inert (mousedown never fires from a finger tap). On desktop
  // we let the user click-and-drag the rail like a carousel, then
  // snap to the nearest card on release. Without this, a mouse
  // user has no way to page the rail other than the dots.
  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;

    let isDown = false;
    let startX = 0;
    let startScroll = 0;
    let moved = false;

    const onDown = (e) => {
      // Ignore right-click and any non-primary button.
      if (e.button !== 0) return;
      isDown = true;
      moved = false;
      startX = e.pageX;
      startScroll = rail.scrollLeft;
      // NOTE: don't add `is-dragging` here. Adding it on bare
      // mousedown disables pointer-events on the rail's children
      // before the matching mouseup, which swallows React click
      // events (the chip / tap-to-expand was dead because of
      // this). Only flip into drag mode once the cursor has
      // actually moved past the threshold below.
    };
    const onMove = (e) => {
      if (!isDown) return;
      const dx = e.pageX - startX;
      if (!moved && Math.abs(dx) > 4) {
        moved = true;
        rail.classList.add('is-dragging');
      }
      if (moved) rail.scrollLeft = startScroll - dx;
    };
    const onUp = () => {
      if (!isDown) return;
      isDown = false;
      if (!moved) return;
      rail.classList.remove('is-dragging');
      // Snap to the nearest card. scroll-snap-type alone won't
      // resolve here because we drove scrollLeft imperatively.
      const cardWidth = rail.clientWidth;
      const idx = Math.round(rail.scrollLeft / cardWidth);
      rail.scrollTo({
        left: idx * cardWidth,
        behavior: 'smooth',
      });
    };

    rail.addEventListener('mousedown', onDown);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      rail.removeEventListener('mousedown', onDown);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, []);

  // Vertical-gesture expand / collapse. Scrolling DOWN on the
  // cast screen (wheel on desktop, finger swipe on mobile) lifts
  // the beige body off and shows the portrait fullscreen;
  // scrolling UP brings the text back. We listen on the rail so
  // horizontal swipes between cards still feel native — only the
  // dominant vertical component triggers the toggle, and a short
  // debounce prevents an inertial wheel from flipping back and
  // forth across the threshold. Re-bound each time `expanded`
  // changes so the closure stays in sync with React state.
  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;

    let lock = false;
    const trigger = (downward) => {
      if (lock) return;
      lock = true;
      setTimeout(() => { lock = false; }, 600);
      setExpanded(downward);
    };

    const onWheel = (e) => {
      // Only act on dominantly-vertical wheel motion. Horizontal
      // wheels are reserved for the carousel itself.
      if (Math.abs(e.deltaY) < 24) return;
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      trigger(e.deltaY > 0);
    };

    let touchStartY = 0;
    let touchStartX = 0;
    const onTouchStart = (e) => {
      const t = e.touches[0];
      touchStartY = t.pageY;
      touchStartX = t.pageX;
    };
    const onTouchEnd = (e) => {
      const t = e.changedTouches[0];
      const dy = t.pageY - touchStartY;
      const dx = t.pageX - touchStartX;
      if (Math.abs(dy) < 40) return;
      if (Math.abs(dx) > Math.abs(dy)) return;
      // Swipe DOWN (finger moves down, dy > 0) → expand.
      trigger(dy > 0);
    };

    rail.addEventListener('wheel', onWheel, { passive: true });
    rail.addEventListener('touchstart', onTouchStart, { passive: true });
    rail.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      rail.removeEventListener('wheel', onWheel);
      rail.removeEventListener('touchstart', onTouchStart);
      rail.removeEventListener('touchend', onTouchEnd);
    };
  }, []);

  return (
    <div className="mobile-companions">
      <div ref={railRef} className="mobile-companions__rail">
        {CHARACTERS.map((c, i) => (
          <article
            key={c.name}
            data-companion-idx={i}
            className={`mobile-companion-card${
              i === activeIdx ? ' is-active' : ''
            }${i === activeIdx && expanded ? ' is-expanded' : ''}`}
          >
            <button
              type="button"
              className="mobile-companion-card__art"
              onClick={
                i === activeIdx
                  ? () => setExpanded((v) => !v)
                  : undefined
              }
              aria-label={
                expanded ? `Collapse portrait` : `Expand portrait of ${c.name}`
              }
              aria-pressed={i === activeIdx && expanded}
              tabIndex={i === activeIdx ? 0 : -1}
            >
              <img
                src={c.image}
                alt=""
                aria-hidden="true"
                draggable={false}
                loading={i < 2 ? 'eager' : 'lazy'}
                decoding="async"
              />
              <span className="mobile-companion-card__art-fade" />
              {c.enemy && (
                <span className="mobile-companion-card__foe">Foe</span>
              )}
              {/* Expand / collapse affordance — visible only on the
                  currently active card. Chevrons-out when collapsed,
                  chevrons-in when expanded. Pure visual hint; the
                  whole image area is the actual hit target. */}
              {i === activeIdx && (
                <span
                  className="mobile-companion-card__zoom"
                  aria-hidden="true"
                >
                  {expanded ? (
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 4 4 4 4 9" />
                      <polyline points="15 4 20 4 20 9" />
                      <polyline points="9 20 4 20 4 15" />
                      <polyline points="15 20 20 20 20 15" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="4 9 4 4 9 4" />
                      <polyline points="20 9 20 4 15 4" />
                      <polyline points="4 15 4 20 9 20" />
                      <polyline points="20 15 20 20 15 20" />
                    </svg>
                  )}
                </span>
              )}
            </button>
            <div className="mobile-companion-card__body">
              <span className="mobile-companion-card__era">{c.era}</span>
              <h2 className="mobile-companion-card__name">{c.name}</h2>
              <span className="mobile-companion-card__role">{c.role}</span>
              <p className="mobile-companion-card__desc">{c.desc}</p>
            </div>
          </article>
        ))}
      </div>

      {/* Page indicator — gold pill for active, dim dot for the
          rest. Tap any dot to jump straight to that companion. */}
      <div className="mobile-companions__dots" role="tablist">
        {CHARACTERS.map((c, i) => (
          <button
            key={c.name}
            type="button"
            role="tab"
            aria-selected={i === activeIdx}
            aria-label={`Go to ${c.name}`}
            onClick={() => goTo(i)}
            className={`mobile-companions__dot${
              i === activeIdx ? ' is-active' : ''
            }`}
          />
        ))}
      </div>
    </div>
  );
}
