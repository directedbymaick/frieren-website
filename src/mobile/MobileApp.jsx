import { useEffect, useRef, useState } from 'react';
import { MobileTabBar } from './MobileTabBar';
import { ScreenTransition } from './ScreenTransition';
import { HomeScreen } from './screens/HomeScreen';
import { CompanionsScreen } from './screens/CompanionsScreen';
import { WorldScreen } from './screens/WorldScreen';
import { WatchScreen } from './screens/WatchScreen';
import { AboutScreen } from './screens/AboutScreen';
import {
  HomeIcon,
  PeopleIcon,
  GlobeIcon,
  PlayIcon,
  SparkIcon,
} from './icons';

const TABS = [
  { id: 'home',       label: 'Home',       icon: HomeIcon,   Screen: HomeScreen },
  { id: 'companions', label: 'Cast',       icon: PeopleIcon, Screen: CompanionsScreen },
  { id: 'world',      label: 'World',      icon: GlobeIcon,  Screen: WorldScreen },
  { id: 'watch',      label: 'Watch',      icon: PlayIcon,   Screen: WatchScreen },
  { id: 'about',      label: 'About',      icon: SparkIcon,  Screen: AboutScreen },
];

/**
 * The mobile-only counterpart of the desktop site. Completely
 * separate component tree from `<App />` — same content, different
 * navigation model: five tabs at the bottom, each one a full-
 * viewport screen.
 *
 * Selection is via plain React state (one of the tab ids); only the
 * active screen remains mounted after the outgoing transition completes,
 * so offscreen subscriptions are released promptly.
 */
export function MobileApp() {
  const readTab = () => TABS.find(tab => tab.id === location.hash.slice(1))?.id || 'home';
  const [active, setActive] = useState(readTab);
  const mainRef = useRef(null);
  const mounted = useRef(false);
  const navigate = (id) => {
    if (id === active) return;
    history.pushState(null, '', `#${id}`);
    setActive(id);
  };
  useEffect(() => {
    const sync = () => setActive(readTab());
    addEventListener('popstate', sync);
    addEventListener('hashchange', sync);
    return () => { removeEventListener('popstate', sync); removeEventListener('hashchange', sync); };
  }, []);
  useEffect(() => {
    document.title = `${TABS.find(tab => tab.id === active).label} · Frieren — Beyond Journey's End`;
    if (mounted.current) mainRef.current?.focus({ preventScroll: true });
    mounted.current = true;
  }, [active]);
  const tab = TABS.find((t) => t.id === active) ?? TABS[0];

  return (
    <div className="mobile-app">
      <main ref={mainRef} tabIndex={-1} aria-label={tab.label} className="mobile-app__viewport">
        {/* `onNavigate` lets a screen jump to another tab from its
            own UI (e.g. Home's "Meet the party" CTA switches to
            Companions). Same signature as `onTabChange` so the tab
            bar and in-screen CTAs share one mental model. */}
        <ScreenTransition tab={tab} onNavigate={navigate} />
      </main>
      <MobileTabBar tabs={TABS} active={active} onTabChange={navigate} />
    </div>
  );
}
