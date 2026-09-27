// JavaScript timers and Motion share the CSS source of truth.
export function tokenMs(name) {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value.endsWith('ms') ? parseFloat(value) : parseFloat(value) * 1000;
}

export const MOTION = {
  quick: tokenMs('--duration-quick'),
  fast: tokenMs('--duration-fast'),
  medium: tokenMs('--duration-medium'),
  slow: tokenMs('--duration-slow'),
  reveal: tokenMs('--duration-very-slow'),
  stagger: tokenMs('--duration-stagger'),
  intent: tokenMs('--duration-micro'),
  distance: parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--distance-base')),
  blur: parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--blur-medium')),
  ease: getComputedStyle(document.documentElement).getPropertyValue('--ease-smooth-out').match(/[\d.]+/g).map(Number),
};

export const surfaceTransition = (duration = MOTION.fast) => ({ duration: duration / 1000, ease: MOTION.ease });
