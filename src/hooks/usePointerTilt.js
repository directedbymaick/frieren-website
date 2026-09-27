import { useEffect } from 'react';

// transitions.dev card-tilt: the hit area stays flat while its child tilts.
export function usePointerTilt(wrapperRef, cardRef, disabled) {
  useEffect(() => {
    const wrapper = wrapperRef.current, card = cardRef.current;
    if (!wrapper || !card) return;
    const reset = () => {
      wrapper.classList.remove('is-hover');
      card.classList.remove('is-tilting');
      card.style.setProperty('--tilt-rx', '0deg');
      card.style.setProperty('--tilt-ry', '0deg');
    };
    reset();
    if (disabled) return;
    const track = event => {
      if (event.pointerType !== 'mouse') return;
      const rect = wrapper.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
      const y = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
      wrapper.classList.add('is-hover');
      card.classList.add('is-tilting');
      card.style.setProperty('--tilt-rx', `${(0.5 - y) * 6}deg`);
      card.style.setProperty('--tilt-ry', `${(x - 0.5) * 6}deg`);
      card.style.setProperty('--tilt-gx', `${x * 100}%`);
      card.style.setProperty('--tilt-gy', `${y * 100}%`);
    };
    wrapper.addEventListener('pointermove', track);
    wrapper.addEventListener('pointerleave', reset);
    wrapper.addEventListener('pointercancel', reset);
    return () => { wrapper.removeEventListener('pointermove', track); wrapper.removeEventListener('pointerleave', reset); wrapper.removeEventListener('pointercancel', reset); reset(); };
  }, [wrapperRef, cardRef, disabled]);
}
