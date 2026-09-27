import { lazy } from 'react';
import { useIsMobile } from './mobile/useIsMobile';
import { MotionPreferencesProvider } from './lib/motion';
import { HapticsProvider } from './lib/haptics';
import { SiteEntrance } from './components/SiteEntrance';

const JournalSite = lazy(() => import('./concept/JournalSite'));
const DesktopSite = lazy(() => import('./DesktopSite'));
const MobileApp = lazy(() => import('./mobile/MobileApp').then(module => ({ default: module.MobileApp })));

export default function App() {
  const isMobile = useIsMobile();
  const journal = new URLSearchParams(location.search).get('concept') === 'journal';
  return <MotionPreferencesProvider><HapticsProvider>
    <SiteEntrance isMobile={isMobile} journal={journal}>
      {journal ? <JournalSite /> : isMobile ? <MobileApp /> : <DesktopSite />}
    </SiteEntrance>
  </HapticsProvider></MotionPreferencesProvider>;
}
