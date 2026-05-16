import { useMemo } from 'react';

export function Dust({ count = 18 }) {
  const particles = useMemo(() => {
    return Array.from({ length: count }).map((_, i) => {
      const dur = 14 + Math.random() * 18;
      const left = Math.random() * 100;
      const delay = -Math.random() * dur;
      const dx = (Math.random() - 0.5) * 40;
      const size = 2 + Math.random() * 4;
      const opacity = 0.35 + Math.random() * 0.5;
      return { i, dur, left, delay, dx, size, opacity };
    });
  }, [count]);

  return (
    <div className="absolute inset-0 pointer-events-none z-[2] overflow-hidden">
      {particles.map((p) => (
        <span
          key={p.i}
          className="dust"
          style={{
            left: `${p.left}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            opacity: p.opacity,
            animationDuration: `${p.dur}s`,
            animationDelay: `${p.delay}s`,
            '--dx': `${p.dx}px`,
          }}
        />
      ))}
    </div>
  );
}
