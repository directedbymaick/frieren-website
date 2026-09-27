import { useEffect, useState } from 'react';
import { scrollToTop } from '../lib/scroll';
import { GLASS_SHADOW } from '../lib/design';
import { useFooterControls } from '../lib/footerControls';
import { FooterControls } from './FooterControls';
import { TrailerButton } from './TrailerButton';
import { NavSectionLinks } from './NavSectionLinks';
import { useNavExpansion } from '../hooks/useNavExpansion';

/**
 * Sticky pill nav. Two independent state machines:
 *   1. Scroll-driven visibility (slides in from above past 120px scroll).
 *   2. Hover-driven expansion of the nav items (collapsed by default).
 */
export function StickyNav() {
  const [pastHero, setPastHero] = useState(false);
  const [idle, setIdle] = useState(false);
  const { expanded, hasFocus, bindings } = useNavExpansion();
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

  const visible = pastHero && (!idle || expanded || hasFocus);

  return (
    <nav
      aria-label="Page navigation"
      inert={visible ? undefined : ""}
      aria-hidden={!visible}
      className="sticky-nav-pill fixed top-5 left-1/2 z-[90] hidden sm:flex items-center gap-2 sm:gap-3 lg:gap-4 pl-3 sm:pl-4 lg:pl-5 pr-1 sm:pr-1.5 lg:pr-2 py-1.5 rounded-full"
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
          `opacity var(${visible ? '--panel-open-dur' : '--panel-close-dur'}) var(--ease-smooth-out), transform var(${visible ? '--panel-open-dur' : '--panel-close-dur'}) var(--ease-smooth-out)`,
        willChange: 'opacity, transform',
      }}
      {...bindings}
    >
      <button
        type="button"
        onClick={() => scrollToTop({ duration: 1.2 })}
        aria-label="Frieren — back to top"
        className="site-nav-wordmark gold-text font-serif italic text-[15px] lg:text-[17px] leading-none cursor-pointer transition-transform hover:scale-[1.04] active:scale-[0.98]"
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

      <NavSectionLinks expanded={expanded} />

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
