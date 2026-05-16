import { useEffect } from 'react';
import Snap from 'lenis/snap';
import { useParallax } from './hooks/useParallax';
import { BackToTop } from './components/BackToTop';
import { Hero } from './components/Hero';
import { FooterGuardian } from './components/FooterGuardian';
import { SectionContinuity } from './components/SectionContinuity';
import { SectionVideo } from './components/SectionVideo';
import { SectionThree } from './components/SectionThree';
import { SectionInterlude } from './components/SectionInterlude';
import { SectionScrollVideo } from './components/SectionScrollVideo';
import { SectionFive } from './components/SectionFive';
import { Footer } from './components/Footer';
import { StickyNav } from './components/StickyNav';
import { getLenis } from './lib/lenis';
import { FooterControlsProvider } from './lib/footerControls';
import { useIsMobile } from './mobile/useIsMobile';
import { MobileApp } from './mobile/MobileApp';

/**
 * Top-level switch: on mobile viewports (or with `?mobile=1`) we
 * render the mobile-app experience and skip the desktop tree
 * entirely. The two trees are independent — the desktop's Lenis
 * scroll, parallax effects, scroll-snap, FooterGuardians, etc.
 * never mount in the mobile path.
 */
export default function App() {
  const isMobile = useIsMobile();
  if (isMobile) return <MobileApp />;
  return <DesktopSite />;
}

function DesktopSite() {
  useParallax();

  // Proximity-based section snap.
  //   • Doesn't fight active scroll — `type: 'proximity'` only engages
  //     once the user's wheel velocity has dropped under the threshold,
  //     so the Lenis deceleration plays out untouched.
  //   • At that point, if the nearest section is within range, Snap
  //     finishes the journey for you — same easing curve as the main
  //     Lenis scroll, so the transition reads as one continuous decel.
  //   • Mid-scroll-scrub (SectionScrollVideo) it stays quiet because the
  //     user is never near a section top while scrubbing.
  useEffect(() => {
    const lenis = getLenis();
    if (!lenis) return;
    const snap = new Snap(lenis, {
      type: 'proximity',
      velocityThreshold: 0.5,
      duration: 0.9,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    });
    document
      .querySelectorAll('[data-screen-label]')
      .forEach((el) => snap.add(el, { align: ['start'] }));
    return () => snap.destroy();
  }, []);

  return (
    <FooterControlsProvider>
      <main style={{ background: 'var(--ivory)' }}>
        <Hero />
        <SectionContinuity />
        <SectionVideo />
        <SectionThree />
        <SectionInterlude
          dataLabel="Interlude · Marshes"
          imageSrc={encodeURI('/assets/images/world-locations/Saum Marshes.webp')}
          phraseWords={[
            { word: 'The' },
            { word: 'road' },
            { word: 'remembers', accent: true },
            { word: 'what' },
            { word: 'the' },
            { word: 'walker' },
            { word: 'forgets.' },
          ]}
          japaneseColumns={['勇者ヒンメルの', '死から29年後', '北側諸国', 'ザオム湿原']}
        />
        <SectionInterlude
          dataLabel="Interlude · Lake Port"
          imageSrc={encodeURI('/assets/images/world-locations/Port at the Lake.webp')}
          japaneseColumns={['勇者ヒンメルの', '死から29年後', '西部諸国', '湖畔の港町']}
        />
        <SectionInterlude
          dataLabel="Interlude · Bier"
          imageSrc={encodeURI('/assets/images/world-locations/Bier Region.webp')}
          japaneseColumns={['勇者ヒンメルの', '死から29年後', '北部高原', 'ビーア地方']}
        />
        <SectionScrollVideo />
        {/* Shared backdrop wrapper for the Epilogue + Footer block.
            The stark red/peach gradient inside spans BOTH sections so
            the colour cast continues from the epilogue down behind
            the footer card. The mask softens the gradient into the
            scroll-video section at the top AND into the page bottom
            at the bottom, so the band of warmth feels like a single
            continuous atmospheric beat rather than two stacked
            blocks. */}
        <div className="relative">
          <div
            className="absolute inset-0 pointer-events-none overflow-hidden"
            aria-hidden="true"
          >
            <img
              src="/assets/images/characters/companions%20imgs/red%20peach%20gradient%20stark.webp"
              alt=""
              loading="lazy"
              decoding="async"
              className="absolute inset-0 w-full h-full object-cover"
              style={{
                opacity: 0.22,
                maskImage:
                  'linear-gradient(to bottom, transparent 0%, black 25%, black 88%, transparent 100%)',
                WebkitMaskImage:
                  'linear-gradient(to bottom, transparent 0%, black 25%, black 88%, transparent 100%)',
              }}
            />
          </div>

          <SectionFive />
          {/* Macht (left) and Solitär (right) emerge into the bottom
              corners as the user exits the scroll-video and lands in
              the Footer. Mounted BEFORE the <Footer /> so document
              order puts them below the footer card in z-stacking —
              the card's opaque background hides their bodies while
              their upper bodies extend above the card's top edge. */}
          <FooterGuardian
            src="/assets/images/characters/macht-full-body-no-background.webp"
            side="left"
            offsetVw={-8}
            heightVh={158}
            anchorRatio={0.48}
            cutBelowAnchor={0.07}
          />
          <FooterGuardian
            src="/assets/images/characters/solitar-full-body-no-background.webp"
            side="right"
            heightVh={85}
            anchorRatio={0.82}
            offsetVw={6}
          />
          <Footer />
        </div>
        <StickyNav />
        <BackToTop />
      </main>
    </FooterControlsProvider>
  );
}
