import { scrollToTop } from '../lib/scroll';
import { GLASS_SHADOW } from '../lib/design';
import { TrailerButton } from './TrailerButton';
import { NavSectionLinks } from './NavSectionLinks';
import { useNavExpansion } from '../hooks/useNavExpansion';

export function Navbar() {
  const { expanded, bindings } = useNavExpansion();

  return (
    <nav aria-label="Hero navigation" className="hero-nav anim-nav flex-none flex justify-center pt-5 px-4 md:px-6 w-full relative z-10">
      <div
        className="hero-nav-pill flex items-center gap-2 sm:gap-3 lg:gap-4 pl-3 sm:pl-4 lg:pl-5 pr-1 sm:pr-1.5 lg:pr-2 py-1.5 rounded-full"
        style={{
          background: 'rgba(241, 234, 217, 0.32)',
          backdropFilter: 'blur(18px) saturate(140%)',
          WebkitBackdropFilter: 'blur(18px) saturate(140%)',
          border: '1px solid rgba(255, 255, 255, 0.45)',
          boxShadow: GLASS_SHADOW,
          transition: 'box-shadow var(--duration-fast) var(--ease-smooth-out)',
        }}
        {...bindings}
      >
        {/* Wordmark */}
        <button
          type="button"
          onClick={() => scrollToTop({ duration: 1.2 })}
          aria-label="Frieren — back to top"
          className="site-nav-wordmark gold-text font-serif italic text-[14px] sm:text-[15px] lg:text-[17px] leading-none cursor-pointer transition-transform hover:scale-[1.04] active:scale-[0.98]"
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

        {/* Persistent separator (always visible, between Japanese and Trailer) */}
        <span
          className="w-px h-5 hidden sm:inline-block"
          style={{ background: 'rgba(42,39,48,0.18)' }}
          aria-hidden="true"
        />

        <NavSectionLinks expanded={expanded} />

        {/* Trailer CTA */}
        <TrailerButton compact />
      </div>
    </nav>
  );
}
