import { Play } from '../icons';

export function TopLeftCorner({ style: styleProp = {} }) {
  return (
    <div
      className="absolute -top-[2px] -left-[2px] z-[5]
                 p-3 pb-5 pr-8 sm:p-4 sm:pb-6 sm:pr-10 md:p-6 md:pb-8 md:pr-14
                 rounded-br-[1.5rem] md:rounded-br-[3rem]
                 flex items-center gap-3 sm:gap-4 md:gap-6"
      style={{ background: 'var(--ivory)', willChange: 'transform', ...styleProp }}
    >
      <div
        className="absolute -bottom-[1.5rem] md:-bottom-[3rem] left-0 w-[1.5rem] md:w-[3rem] h-[1.5rem] md:h-[3rem] pointer-events-none"
        style={{ boxShadow: '0 -1px 0 0 var(--ivory)' }}
      >
        <svg width="100%" height="100%" viewBox="0 0 56 56" fill="none" preserveAspectRatio="none">
          <path d="M0 0V56C0 25.0721 25.0721 0 56 0H0Z" fill="var(--ivory)" />
        </svg>
      </div>
      <div
        className="absolute top-0 -right-[1.5rem] md:-right-[3rem] w-[1.5rem] md:w-[3rem] h-[1.5rem] md:h-[3rem] pointer-events-none"
        style={{ boxShadow: '-1px 0 0 0 var(--ivory)' }}
      >
        <svg width="100%" height="100%" viewBox="0 0 56 56" fill="none" preserveAspectRatio="none">
          <path d="M0 0H56C25.0721 0 0 25.0721 0 56V0Z" fill="var(--ivory)" />
        </svg>
      </div>
      <div
        className="w-10 h-10 md:w-14 md:h-14 rounded-full flex items-center justify-center shrink-0"
        style={{ background: 'var(--gold-soft)', border: '1px solid rgba(184,148,90,0.25)' }}
      >
        <Play className="w-4 h-4 md:w-5 md:h-5" style={{ color: 'var(--gold)', fill: 'var(--gold)' }} />
      </div>
      <div className="flex flex-col">
        <span
          className="font-serif text-[18px] md:text-[24px] leading-tight"
          style={{ color: 'var(--ink)' }}
        >
          Opening II
        </span>
        <div className="flex items-center gap-1 mt-0.5" style={{ color: 'var(--ink-mute)' }}>
          <span
            className="text-[12px] md:text-[14px] italic font-serif"
            style={{ textTransform: 'none', letterSpacing: '0.06em' }}
          >
            Haru yo, Koi
          </span>
        </div>
      </div>
    </div>
  );
}
