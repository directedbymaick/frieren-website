import { useEffect, useState } from 'react';

export function useNearViewport(ref, rootMargin = '400px') {
  const [near, setNear] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(([entry]) => setNear(entry.isIntersecting), { rootMargin });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ref, rootMargin]);
  return near;
}
