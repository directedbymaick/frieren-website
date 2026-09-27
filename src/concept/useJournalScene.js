import { useEffect } from 'react';
import { useMotionPreferences } from '../lib/motion';

export function useJournalScene(ref) {
  const { reduced } = useMotionPreferences();
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const reveals = [...root.querySelectorAll('[data-journal-reveal]')];
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('is-shown'); observer.unobserve(entry.target); }
    }), { threshold: 0.12 });
    reveals.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, [ref]);
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const scenes = [...root.querySelectorAll('[data-journal-scene]')];
    let frame = 0;
    const paint = () => {
      frame = 0;
      for (const scene of scenes) {
        const rect = scene.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > innerHeight) continue;
        const progress = Math.max(-1, Math.min(1, (innerHeight / 2 - rect.top - rect.height / 2) / innerHeight));
        scene.style.setProperty('--j-drift', reduced ? '0px' : `${(progress * 48).toFixed(2)}px`);
      }
      const max = document.documentElement.scrollHeight - innerHeight;
      root.style.setProperty('--j-progress', max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(paint); };
    if (reduced) scenes.forEach(scene => scene.style.setProperty('--j-drift', '0px'));
    schedule();
    addEventListener('scroll', schedule, { passive: true });
    addEventListener('resize', schedule);
    return () => { cancelAnimationFrame(frame); removeEventListener('scroll', schedule); removeEventListener('resize', schedule); };
  }, [ref, reduced]);
}
