import { getLenis } from './lenis';

// Navigation accelerates and settles gradually; wheel input stays independently responsive.
const navigationEase = t => (1 - Math.cos(Math.PI * t)) / 2;
const navigationDuration = (duration, distance) => Math.min(2.4, Math.max(duration * 1.2, 1.5 + Math.abs(distance) / 14000));

export function scrollToSection(label, { duration = 1.2, offset = 0 } = {}) {
  const el = [...document.querySelectorAll('[data-screen-label]')].find(item => item.dataset.screenLabel === label);
  if (!el) return false;
  const reduced = document.documentElement.dataset.reducedMotion === 'true';
  const lenis = getLenis();
  if (lenis && !reduced) lenis.scrollTo(el, { duration: navigationDuration(duration, el.getBoundingClientRect().top), easing: navigationEase, offset });
  else window.scrollTo({ top: el.getBoundingClientRect().top + scrollY + offset, behavior: reduced ? 'instant' : 'smooth' });
  return true;
}

export function scrollToTop({ duration = 1.4 } = {}) {
  const reduced = document.documentElement.dataset.reducedMotion === 'true';
  const lenis = getLenis();
  if (lenis && !reduced) lenis.scrollTo(0, { duration: navigationDuration(duration, scrollY), easing: navigationEase });
  else window.scrollTo({ top: 0, behavior: reduced ? 'instant' : 'smooth' });
}
