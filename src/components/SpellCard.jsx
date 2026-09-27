import { useReveal } from '../hooks/useReveal';

/**
 * One spell entry in the grimoire grid. The icon is colour-applied via
 * mask-image so the same PNG always reads in the gold accent tone, regardless
 * of the source artwork. Keeps the spell catalogue visually cohesive.
 */
export function SpellCard({ t, s, body, icon, delay }) {
  const ref = useReveal();
  return (
    <article
      ref={ref}
      className="reveal paper-card rounded-[1.4rem] p-5 md:p-6 flex flex-col gap-3 transition-interaction duration-fast hover:-translate-y-1 group cursor-pointer relative overflow-hidden"
      style={{ '--d': `${delay}ms` }}
    >
      {/* Subtle gold halo under the icon — appears on hover */}
      <div
        className="absolute -top-8 -right-8 w-32 h-32 rounded-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-fast"
        style={{
          background: 'radial-gradient(circle, rgba(184,148,90,0.18) 0%, rgba(184,148,90,0) 70%)',
        }}
      />

      <div className="flex items-start justify-between relative z-[1]">
        <span
          className="text-[10px] uppercase tracking-[0.28em]"
          style={{ color: 'var(--ink-mute)' }}
        >
          {s}
        </span>

        {icon && (
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center transition-transform duration-fast group-hover:scale-110"
            style={{
              background: 'var(--gold-soft)',
              border: '1px solid rgba(184,148,90,0.30)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5)',
            }}
          >
            <span
              className="block w-5 h-5"
              aria-hidden="true"
              style={{
                backgroundColor: 'var(--gold)',
                WebkitMaskImage: `url(${icon})`,
                maskImage: `url(${icon})`,
                WebkitMaskSize: 'contain',
                maskSize: 'contain',
                WebkitMaskRepeat: 'no-repeat',
                maskRepeat: 'no-repeat',
                WebkitMaskPosition: 'center',
                maskPosition: 'center',
                WebkitMaskMode: 'alpha',
                maskMode: 'alpha',
              }}
            />
          </div>
        )}
      </div>

      <h3
        className="font-serif text-xl md:text-[22px] leading-snug relative z-[1]"
        style={{ color: 'var(--ink)' }}
      >
        {t}
      </h3>
      <p
        className="text-[13px] leading-relaxed mt-1 relative z-[1]"
        style={{ color: 'var(--ink-soft)' }}
      >
        {body}
      </p>
    </article>
  );
}
