import { RuneMark } from '../icons';

export function HeroBadge() {
  return (
    <div className="anim-badge flex items-center gap-3 px-4 py-1.5 rounded-full paper-card mx-auto mb-4 w-fit">
      <RuneMark className="w-3.5 h-3.5" style={{ color: 'var(--gold)' }} />
      <span
        className="text-[12px] tracking-[0.28em] uppercase font-medium"
        style={{ color: 'var(--ink-soft)' }}
      >
        An elven tale
      </span>
      <span className="rune-line"></span>
    </div>
  );
}
