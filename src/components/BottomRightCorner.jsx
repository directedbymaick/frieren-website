import { BookOpen, ChevronRight } from '../icons';

export function BottomRightCorner() {
  return (
    <div
      className="anim-br absolute -bottom-[2px] -right-[2px] z-[5]
                 p-3 pt-5 pl-8 sm:p-4 sm:pt-6 sm:pl-10 md:p-6 md:pt-8 md:pl-14
                 rounded-tl-[1.5rem] md:rounded-tl-[3rem]
                 flex items-center gap-3 sm:gap-4 md:gap-6"
      style={{ background: 'var(--ivory)' }}
    >
      <div
        className="absolute -top-[1.5rem] md:-top-[3rem] right-0 w-[1.5rem] md:w-[3rem] h-[1.5rem] md:h-[3rem] pointer-events-none"
        style={{ marginBottom: '-1px', boxShadow: '0 1px 0 0 var(--ivory)' }}
      >
        <svg width="100%" height="100%" viewBox="0 0 56 56" fill="none" preserveAspectRatio="none">
          <path d="M56 56V0C56 30.9279 30.9279 56 0 56H56Z" fill="var(--ivory)" />
        </svg>
      </div>
      <div
        className="absolute bottom-0 -left-[1.5rem] md:-left-[3rem] w-[1.5rem] md:w-[3rem] h-[1.5rem] md:h-[3rem] pointer-events-none"
        style={{ boxShadow: '1px 0 0 0 var(--ivory)' }}
      >
        <svg width="100%" height="100%" viewBox="0 0 56 56" fill="none" preserveAspectRatio="none">
          <path d="M56 56H0C30.9279 56 56 30.9279 56 0V56Z" fill="var(--ivory)" />
        </svg>
      </div>

      <div
        className="w-10 h-10 md:w-14 md:h-14 rounded-full flex items-center justify-center shrink-0"
        style={{ background: 'var(--gold-soft)', border: '1px solid rgba(184,148,90,0.25)' }}
      >
        <BookOpen className="w-4 h-4 md:w-5 md:h-5" style={{ color: 'var(--gold)' }} />
      </div>

      <div className="flex flex-col">
        <span
          className="font-serif text-[18px] md:text-[24px] leading-tight"
          style={{ color: 'var(--ink)' }}
        >
          The Grimoire
        </span>
        <div
          className="flex items-center gap-1 cursor-pointer hover:opacity-70 transition-opacity mt-0.5"
          style={{ color: 'var(--ink-mute)' }}
        >
          <span className="text-[12px] md:text-[14px] uppercase tracking-[0.22em]">Open codex</span>
          <ChevronRight className="w-3.5 h-3.5 md:w-4 md:h-4" />
        </div>
      </div>
    </div>
  );
}
