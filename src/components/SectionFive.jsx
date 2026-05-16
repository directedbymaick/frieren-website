import { useReveal } from '../hooks/useReveal';
import { RuneMark } from '../icons';

/**
 * Closing chapter — sits after the scroll-scrub video so the frame has
 * somewhere to "land" once it's closed back to box mode.
 */
export function SectionFive() {
  const ref = useReveal();
  return (
    <section
      data-screen-label="05 Epilogue"
      className="relative w-full"
      style={{ background: 'transparent' }}
    >
      <div
        ref={ref}
        className="reveal-rise relative max-w-[1536px] mx-auto px-6 md:px-12 pt-28 md:pt-36 pb-32 md:pb-40 text-center"
      >
        <div className="flex items-center justify-center gap-4 mb-6">
          <span className="rune-line"></span>
          <span
            className="text-[11px] tracking-[0.32em] uppercase font-medium"
            style={{ color: 'var(--ink-mute)' }}
          >
            Chapter V · Epilogue
          </span>
          <RuneMark className="w-3.5 h-3.5" style={{ color: 'var(--gold)' }} />
        </div>

        <h2
          className="font-serif text-4xl sm:text-5xl md:text-7xl font-light tracking-[-0.02em] leading-[1.04] mb-6 mx-auto max-w-[18ch]"
          style={{ color: 'var(--ink)' }}
        >
          And so the road bends{' '}
          <em className="italic" style={{ color: 'var(--gold)' }}>forward</em>.
        </h2>
        <p
          className="font-serif italic text-lg leading-relaxed max-w-xl mx-auto"
          style={{ color: 'var(--ink-soft)' }}
        >
          Some chapters do not end · they simply walk on, unhurried,
          carrying the names of those they cannot quite forget.
        </p>
      </div>
    </section>
  );
}
