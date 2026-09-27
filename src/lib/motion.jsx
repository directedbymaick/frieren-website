import { createContext, useContext, useEffect, useState } from 'react';

const MotionContext = createContext({ reduced: false });

export function MotionPreferencesProvider({ children }) {
  const [reduced, setReduced] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    const query = matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(query.matches);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    document.documentElement.dataset.reducedMotion = String(reduced);
  }, [reduced]);
  return <MotionContext.Provider value={{ reduced }}>{children}</MotionContext.Provider>;
}

export const useMotionPreferences = () => useContext(MotionContext);

