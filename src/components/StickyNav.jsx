import { Fragment, useEffect, useState } from 'react';
import { scrollToSection, scrollToTop } from '../lib/scroll';
import { EASE_OUT_QUINT, GLASS_SHADOW, SECTION_NAV } from '../lib/design';
import { useFooterControls } from '../lib/footerControls';
import { FooterControls } from './FooterControls';
import { TrailerButton } from './TrailerButton';

/**
 * Sticky pill nav. Two independent state machines:
 *   1. Scroll-driven visibility (slides in from above past 120px scroll).
 *   2. Hover-driven expansion of the nav items (collapsed by default).
 */
export function StickyNav() {
  const [pastHero, setPastHero] = useState(false);
  const [idle, setIdle] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const { chromeHidden } = useFooterControls();

  // Tracks whether we're out of the Hero (scrollY > 120). The pill is
  // never shown inside the Hero so this gate also doubles as the
  // "is the Hero behind us?" check the idle-hide rule depends on.
  useEffect(() => {
    const onScroll = () => {
      setPastHero(window.scrollY > 120);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Idle auto-hide: after 3s without a scroll / pointer / key / touch
  // event, the pill slides off the top. Any of those events resets it.
  // Hero is exempt because the pill is hidden there anyway via pastHero.
  useEffect(() => {
    let timer = 0;
    const reset = () => {
      setIdle(false);
      clearTimeout(timer);
      timer = setTimeout(() => setIdle(true), 3000);
    };
    reset();
    const events = ['mousemove', 'scroll', 'wheel', 'touchstart', 'keydown', 'pointerdown'];
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    return () => {
      clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, reset));
    };
  }, []);

  const visible = pastHero && !idle;

  return (
    <nav
      aria-label="Page navigation"
      className="fixed top-5 left-1/2 z-[90] hidden md:flex items-center gap-2 sm:gap-3 lg:gap-4 pl-3 sm:pl-4 lg:pl-5 pr-1 sm:pr-1.5 lg:pr-2 py-1.5 rounded-full"
      style={{
        background: 'rgba(241, 234, 217, 0.32)',
        backdropFilter: 'blur(18px) saturate(140%)',
        WebkitBackdropFilter: 'blur(18px) saturate(140%)',
        border: '1px solid rgba(255, 255, 255, 0.45)',
        boxShadow: GLASS_SHADOW,
        opacity: visible ? 1 : 0,
        transform: visible
          ? 'translate(-50%, 0)'
          : 'translate(-50%, -120%)',
        pointerEvents: visible ? 'auto' : 'none',
        transition:
          'opacity 500ms cubic-bezier(.2,.7,.2,1), transform 500ms cubic-bezier(.2,.7,.2,1)',
        willChange: 'opacity, transform',
      }}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      <button
        type="button"
        onClick={() => scrollToTop({ duration: 1.2 })}
        aria-label="Back to top"
        className="gold-text font-serif italic text-[15px] lg:text-[17px] leading-none cursor-pointer transition-transform hover:scale-[1.04] active:scale-[0.98]"
        style={{ backgroundColor: 'transparent', border: 'none', padding: '0 0.25rem' }}
      >
        Frieren
      </button>

      <span
        className="hidden lg:inline-block text-[9px] tracking-[0.32em] uppercase whitespace-nowrap"
        style={{ color: 'var(--ink-mute)' }}
      >
        ・葬送の・
      </span>

      {/* Persistent separator */}
      <span
        className="w-px h-5"
        style={{ background: 'rgba(42,39,48,0.18)' }}
        aria-hidden="true"
      />

      {/* Collapsing items wrapper — same recipe as Navbar. Negative
          `margin-left` cancels the parent's flex `gap` so the first
          nav item ("Companions") sits flush against the separator. */}
      <div
        className="flex items-center overflow-hidden -ml-2 sm:-ml-3 lg:-ml-4"
        style={{
          maxWidth: expanded ? '380px' : '0',
          opacity: expanded ? 1 : 0,
          transition: `max-width 850ms ${EASE_OUT_QUINT}, opacity 420ms ease ${expanded ? '180ms' : '0ms'}`,
        }}
      >
        <ul
          className="flex items-center gap-2 lg:gap-3 px-2 lg:px-4 whitespace-nowrap text-[12px] lg:text-[13px] font-medium"
          style={{ color: 'var(--ink-soft)' }}
        >
          {SECTION_NAV.map((it, idx) => (
            <Fragment key={it.label}>
              {idx > 0 && (
                <li
                  aria-hidden="true"
                  className="select-none leading-none"
                  style={{ color: 'var(--ink-mute)' }}
                >
                  ·
                </li>
              )}
              <li className="tracking-[0.04em]">
                <button
                  type="button"
                  onClick={() => scrollToSection(it.section, { duration: 1.4 })}
                  className="cursor-pointer hover:opacity-60 transition-opacity bg-transparent border-0 p-0"
                  style={{ color: 'inherit', font: 'inherit' }}
                >
                  {it.label}
                </button>
              </li>
            </Fragment>
          ))}
        </ul>
        <span
          className="w-px h-5"
          style={{ background: 'rgba(42,39,48,0.18)' }}
          aria-hidden="true"
        />
      </div>

      {/* Use the shared TrailerButton so the hover-preview tooltip
          (video + caption) is identical to the one in the Hero
          navbar. Previously this slot was a plain button with no
          preview, which is why hovering the trailer pill in the
          sticky nav did nothing outside the Hero. */}
      <div className="ml-1">
        <TrailerButton compact />
      </div>

      {/* Footer video controls — dock here only when the user has
          activated immersive mode. Their `layoutId` makes them fly in
          from the footer card position when this happens. */}
      {chromeHidden && (
        <div className="flex items-center gap-1.5 ml-1">
          <FooterControls />
        </div>
      )}
    </nav>
  );
}
