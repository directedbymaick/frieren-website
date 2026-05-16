import { useState } from 'react';
import { MobileTabBar } from './MobileTabBar';
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
 * active screen is mounted at any time, so transitions stay snappy
 * and offscreen screens don't hold rAF / IntersectionObserver
 * subscriptions.
 */
export function MobileApp() {
  const [active, setActive] = useState('home');
  const tab = TABS.find((t) => t.id === active) ?? TABS[0];
  const ActiveScreen = tab.Screen;

  return (
    <div className="mobile-app">
      <main className="mobile-app__viewport">
        {/* `onNavigate` lets a screen jump to another tab from its
            own UI (e.g. Home's "Meet the party" CTA switches to
            Companions). Same signature as `onTabChange` so the tab
            bar and in-screen CTAs share one mental model. */}
        <ActiveScreen onNavigate={setActive} />
      </main>
      <MobileTabBar tabs={TABS} active={active} onTabChange={setActive} />
    </div>
  );
}
