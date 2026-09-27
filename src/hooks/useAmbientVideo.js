import { useEffect, useState } from 'react';
import { useNearViewport } from './useNearViewport';
import { useMotionPreferences } from '../lib/motion';

export function useAmbientVideo(ref, { delay = 0 } = {}) {
  const near = useNearViewport(ref, '0px');
  const { reduced } = useMotionPreferences();
  const [ready, setReady] = useState(delay === 0);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setReady(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);
  useEffect(() => {
    if (near && ready && !reduced) setLoaded(true);
  }, [near, ready, reduced]);
  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const update = () => {
      if (near && loaded && !reduced && !document.hidden) video.play().catch(() => {});
      else video.pause();
    };
    update();
    document.addEventListener('visibilitychange', update);
    return () => { video.pause(); document.removeEventListener('visibilitychange', update); };
  }, [ref, near, loaded, reduced]);
  return loaded;
}
