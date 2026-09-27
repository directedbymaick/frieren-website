import { ArrowUpRight } from '../icons';
import { scrollToSection } from '../lib/scroll';

export function BottomLeftCard() {
  return (
    <div
      className="hero-about-card anim-bl ambient-float pointer-events-auto absolute bottom-28 right-4 left-auto md:left-6 md:right-auto md:bottom-6 lg:bottom-10 lg:left-10
                 p-4 md:p-5 lg:p-6 rounded-[1.2rem] md:rounded-[1.6rem] lg:rounded-[2rem] paper-card
                 flex flex-col gap-3 min-w-[180px] md:min-w-[200px] lg:min-w-[230px] w-fit"
    >
      <div className="flex items-baseline gap-2">
        <span
          className="font-serif text-4xl md:text-5xl lg:text-[56px] leading-none tracking-tight"
          style={{ color: 'var(--ink)' }}
        >
          1000<span style={{ color: 'var(--gold)' }}>+</span>
        </span>
      </div>
      <div className="flex flex-col">
        <span
          className="text-[11px] md:text-[11px] uppercase tracking-[0.28em] font-medium"
          style={{ color: 'var(--ink-mute)' }}
        >
          Years of memory
        </span>
        <span
          className="font-serif italic text-[13px] md:text-[14px] mt-1 leading-snug"
          style={{ color: 'var(--ink-soft)' }}
        >
          “A journey only begins<br />once it ends.”
        </span>
      </div>

      <button
        type="button"
        onClick={() => scrollToSection('Footer', { duration: 1.4 })}
        className="hero-cta hero-cta-card self-start"
      >
        <span className="cta-text">About the project</span>
        <span className="cta-icon" aria-hidden="true">
          <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={1.9} />
        </span>
      </button>
    </div>
  );
}
