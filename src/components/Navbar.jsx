import { Fragment, useState } from 'react';
import { scrollToSection, scrollToTop } from '../lib/scroll';
import { EASE_OUT_QUINT, GLASS_SHADOW, SECTION_NAV } from '../lib/design';
import { TrailerButton } from './TrailerButton';

export function Navbar() {
  const [expanded, setExpanded] = useState(false);

  return (
    <nav className="anim-nav flex justify-center pt-5 px-4 md:px-6 w-full relative z-10">
      <div
        className="flex items-center gap-2 sm:gap-3 lg:gap-4 pl-3 sm:pl-4 lg:pl-5 pr-1 sm:pr-1.5 lg:pr-2 py-1.5 rounded-full"
        style={{
          background: 'rgba(241, 234, 217, 0.32)',
          backdropFilter: 'blur(18px) saturate(140%)',
          WebkitBackdropFilter: 'blur(18px) saturate(140%)',
          border: '1px solid rgba(255, 255, 255, 0.45)',
          boxShadow: GLASS_SHADOW,
          // Smooth pill width morph as items expand/collapse on hover
          transition: 'box-shadow 300ms ease',
        }}
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
      >
        {/* Wordmark */}
        <button
          type="button"
          onClick={() => scrollToTop({ duration: 1.2 })}
          aria-label="Back to top"
          className="gold-text font-serif italic text-[14px] sm:text-[15px] lg:text-[17px] leading-none cursor-pointer transition-transform hover:scale-[1.04] active:scale-[0.98]"
          style={{ backgroundColor: 'transparent', border: 'none', padding: '0 0.25rem' }}
        >
          Frieren
        </button>

        <span
          className="hidden sm:inline-block text-[9px] tracking-[0.32em] uppercase whitespace-nowrap"
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

        {/* Collapsing items wrapper — width + opacity morph on hover.
            `max-width` lets us animate to a value the items naturally fit
            inside, with `overflow:hidden` clipping during the transition.
            The trailing separator lives INSIDE the wrapper so it
            disappears with the items when collapsed. */}
        <div
          className="hidden md:flex items-center overflow-hidden"
          style={{
            maxWidth: expanded ? '380px' : '0',
            opacity: expanded ? 1 : 0,
            transition: `max-width 850ms ${EASE_OUT_QUINT}, opacity 420ms ease ${expanded ? '180ms' : '0ms'}`,
          }}
        >
          <ul
            className="flex items-center gap-2 lg:gap-3 pr-2 sm:pr-3 lg:pr-4 whitespace-nowrap text-[12px] lg:text-[13px] font-medium"
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
                    className="cursor-pointer hover:opacity-60 transition-opacity bg-transparent border-0 p-0 font-inherit"
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

        {/* Trailer CTA */}
        <TrailerButton compact />
      </div>
    </nav>
  );
}
