import { useEffect, useRef, useState } from 'react';
import { useMotionPreferences } from '../lib/motion';
import { MOTION } from '../lib/transitionTokens';

// Two slots let the outgoing screen finish its transition, then unmount it.
export function ScreenTransition({ tab, onNavigate }) {
  const { reduced } = useMotionPreferences();
  const ref = useRef(null);
  const [state, setState] = useState({ id: tab.id, slots: [tab, null], target: 0, visible: 0 });
  if (state.id !== tab.id) {
    const target = 1 - state.target;
    const slots = [...state.slots];
    slots[target] = tab;
    setState({ id: tab.id, slots, target, visible: reduced ? target : state.visible });
  }
  useEffect(() => {
    let first = 0, second = 0, timer = 0;
    ref.current?.querySelectorAll('[inert] video').forEach(video => video.pause());
    const key = state.id;
    const activate = () => {
      setState(current => current.id === key ? { ...current, visible: current.target } : current);
      timer = setTimeout(() => setState(current => current.id === key ? { ...current, slots: current.slots.map((slot, i) => i === current.target ? slot : null) } : current), reduced ? 0 : MOTION.fast);
    };
    if (reduced) activate();
    else first = requestAnimationFrame(() => { second = requestAnimationFrame(activate); });
    return () => { cancelAnimationFrame(first); cancelAnimationFrame(second); clearTimeout(timer); };
  }, [state.id, reduced]);
  return <div ref={ref} className="mobile-screen-transition t-page-slide" data-page={state.visible + 1}>
    {state.slots.map((slot, index) => {
      if (!slot) return null;
      const Screen = slot.Screen;
      const inactive = slot.id !== tab.id;
      return <div key={slot.id} className="t-page" data-page-id={index + 1} aria-hidden={inactive} inert={inactive ? '' : undefined}>
        <Screen onNavigate={onNavigate} />
      </div>;
    })}
  </div>;
}
