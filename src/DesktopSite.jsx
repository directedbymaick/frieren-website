import { useEffect } from 'react';
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
import { initLenis, destroyLenis } from './lib/lenis';
import { FooterControlsProvider } from './lib/footerControls';

import { MotionConfig } from 'framer-motion';
import { useMotionPreferences } from './lib/motion';
import 'lenis/dist/lenis.css';

export default function DesktopSite() {
  const { reduced } = useMotionPreferences();
  useParallax(reduced);

  // Let the visitor stop anywhere; section navigation is always explicit.
  useEffect(() => {
    if (reduced) return;
    initLenis();
    return destroyLenis;
  }, [reduced]);

  return (
    <MotionConfig reducedMotion={reduced ? "always" : "never"}><FooterControlsProvider>
      <a className="skip-link" href="#companions">Skip to companions</a>
      <main id="main-content" style={{ background: 'var(--ivory)' }}>
        <Hero />
        <SectionContinuity />
        <SectionVideo />
        <SectionThree />
        <SectionInterlude
          dataLabel="Interlude · Marshes"
          imageSrc={encodeURI('/assets/images/world-locations/Saum Marshes.webp?v=18f9e5d7')}
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
          imageSrc={encodeURI('/assets/images/world-locations/Port at the Lake.webp?v=fce4d92f')}
          japaneseColumns={['勇者ヒンメルの', '死から29年後', '西部諸国', '湖畔の港町']}
        />
        <SectionInterlude
          dataLabel="Interlude · Bier"
          imageSrc={encodeURI('/assets/images/world-locations/Bier Region.webp?v=73277141')}
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
              src="/assets/images/characters/companions%20imgs/red%20peach%20gradient%20stark.webp?v=c9e28589"
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
            src="/assets/images/characters/macht-full-body-no-background.webp?v=5ff81bf7"
            side="left"
            offsetVw={-8}
            heightVh={158}
            anchorRatio={0.48}
            cutBelowAnchor={0.07}
          />
          <FooterGuardian
            src="/assets/images/characters/solitar-full-body-no-background.webp?v=59e01adf"
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
    </FooterControlsProvider></MotionConfig>
  );
}
