import { useEffect, useState } from 'react';
import { useMotionPreferences } from '../lib/motion';
import { tokenMs } from '../lib/transitionTokens';

export function useTransitionPresence(open, closeToken = '--modal-close-dur') {
  const { reduced } = useMotionPreferences();
  const [state, setState] = useState({ mounted: open, phase: 'enter' });
  useEffect(() => {
    let first = 0, second = 0, timer = 0;
    if (open) {
      setState(previous => ({ mounted: true, phase: reduced || previous.phase === 'is-closing' ? 'is-open' : previous.phase }));
      first = requestAnimationFrame(() => {
        second = requestAnimationFrame(() => setState({ mounted: true, phase: 'is-open' }));
      });
    } else {
      setState(previous => ({ ...previous, phase: 'is-closing' }));
      timer = setTimeout(() => setState({ mounted: false, phase: 'enter' }), reduced ? 0 : tokenMs(closeToken));
    }
    return () => { cancelAnimationFrame(first); cancelAnimationFrame(second); clearTimeout(timer); };
  }, [open, reduced, closeToken]);
  return { present: open || state.mounted, phase: reduced && open ? 'is-open' : state.phase };
}
