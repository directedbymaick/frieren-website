import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight } from '../icons';
import { scrollToSection, scrollToTop } from '../lib/scroll';
import { useFooterControls } from '../lib/footerControls';
import { FooterControls } from './FooterControls';
import { useAmbientVideo } from '../hooks/useAmbientVideo';
import { useMotionPreferences } from '../lib/motion';
import { PROJECT_NOTES } from '../data/project';
import { ProjectInfoDialog } from './ProjectInfoDialog';
import { FooterStarField } from './FooterStarField';

const VIDEO_SRC =
  '/assets/videos/journey-v2.mp4';

const NAV = [
  { label: 'Home',       section: 'Hero' },
  { label: 'Companions', section: '01 Companions' },
  { label: 'World',      section: '03 The World' },
  { label: 'Memory',     section: '04 ScrollVideo' },
  { label: 'Epilogue',   section: '05 Epilogue' },
];

const SECONDARY = [
  {
    id: 'about-credits',
    title: 'About & credits',
    body: 'An independent fan concept celebrating Frieren: Beyond Journey’s End, created by Kanehito Yamada and Tsukasa Abe. Concept, design and development by Mad Makers. Characters, artwork, animation and music belong to their respective rights holders. This project is not affiliated with them and does not grant permission to reuse their work.',
  },
  ...PROJECT_NOTES.filter(({ id }) => id === 'privacy' || id === 'accessibility'),
];

const backToTop = (e) => {
  e?.preventDefault();
  scrollToTop({ duration: 1.4 });
};

const handleNavClick = (section) => (e) => {
  e.preventDefault();
  if (section === 'Hero') {
    backToTop();
  } else {
    scrollToSection(section, { duration: 1.4 });
  }
};

/**
 * Cinematic outro footer. Inherits the same scroll-grow recipe as
 * SectionVideo — the section is taller than the viewport, the visible
 * footer card is `sticky top-0` and animates its padding + border-radius
 * from "boxed-in" (matching the page's parchment frame) to fullscreen as
 * the user scrolls through the section.
 */
export function Footer() {
  const sectionRef = useRef(null);
  const { chromeHidden, videoRef } = useFooterControls();
  const [growth, setGrowth] = useState(0);
  const loadVideo = useAmbientVideo(videoRef);
  const [note, setNote] = useState(null);
  const { reduced } = useMotionPreferences();

  // Scroll-driven growth 0 → 1.
  //   • 0 when section.top === viewport-height   (section just entering from below)
  //   • 1 when ~85 % of the section has scrolled past — well BEFORE the
  //     document's last scroll position, so the footer is already fully
  //     full-screen by the time the user actually hits the page bottom.
  //
  // The rAF only runs while the section is in viewport — an
  // IntersectionObserver flips an `inView` flag so we don't burn CPU
  // computing a growth value that nothing can see. A generous rootMargin
  // wakes it up a viewport early so the value is settled by the time the
  // section actually enters.
  const GROWTH_COMPLETE = 0.85;
  useEffect(() => {
    if (reduced) return;
    const sec = sectionRef.current;
    if (!sec) return;
    let raf = 0;
    let cur = 0;
    let inView = false;

    const tick = () => {
      if (!inView) {
        raf = 0;
        return;
      }
      const rect = sec.getBoundingClientRect();
      const vh = window.innerHeight;
      const progress = (vh - rect.top) / (rect.height * GROWTH_COMPLETE);
      const target = Math.max(0, Math.min(1, progress));
      cur = cur + (target - cur) * 0.2;
      if (Math.abs(target - cur) < 0.004) cur = target;
      setGrowth(cur);
      raf = requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        if (inView && !raf) raf = requestAnimationFrame(tick);
      },
      { rootMargin: '100% 0px 100% 0px' }
    );
    io.observe(sec);

    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [reduced]);

  const ease = (x) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);
  const g = reduced ? 0 : ease(Math.min(1, Math.max(0, growth)));
  const inset = 20 * (1 - g);
  const radius = 48 * (1 - g);
  const sidePad = 5 * (1 - g);

  return (
    <section
      ref={sectionRef}
      data-screen-label="Footer"
      className="ff-section relative w-full"
      // Background intentionally NOT set here — the parent <main>
      // already has `var(--ivory)` so the page colour is unchanged,
      // but leaving this section transparent lets the <MachtGuardian/>
      // (rendered earlier in <App />, hence below the footer in
      // document/stacking order) show through the area around the
      // sticky footer card. If you re-add a background here, Macht
      // will be hidden by it.
    >
      <div
        className="ff-stage sticky top-0 h-screen w-full flex items-stretch overflow-hidden"
        style={{
          paddingLeft: `${sidePad}%`,
          paddingRight: `${sidePad}%`,
          paddingTop: `${inset}px`,
          paddingBottom: `${inset}px`,
          willChange: 'padding',
        }}
      >
        <footer
          className={`ff-footer relative overflow-hidden flex flex-col justify-end ${chromeHidden ? 'chrome-hidden' : ''}`}
          style={{
            borderRadius: `${radius}px`,
            willChange: 'border-radius',
          }}
        >
          {/* Background video — the source asset is authored as a clean
              seamless loop, so native `loop` is enough; no JS gymnastics.
              The CRT scanline overlay lives INSIDE this same z-stack
              level so it composites directly on top of the video and
              nothing else (text/links/topline are all in the default
              layer above and stay completely untouched). */}
          <div className="absolute inset-0" style={{ zIndex: -2 }} aria-hidden="true">
            <video
              ref={videoRef}
              muted
              loop
              playsInline
              preload="none"
              src={loadVideo ? VIDEO_SRC : undefined}
              poster="/assets/images/posters/footer.webp"
              className="w-full h-full object-cover"
            >

            </video>
            <FooterStarField />
            <div
              className="ff-tv-overlay absolute inset-0 pointer-events-none overflow-hidden"
              aria-hidden="true"
            >
              <img
                src="/assets/images/characters/companions%20imgs/gray%20gradient%20silver%20denken.webp?v=f369d0f5"
                alt=""
                loading="lazy"
                decoding="async"
              />
            </div>
          </div>
          <div className="ff-veil absolute inset-0" style={{ zIndex: -1 }} aria-hidden="true" />

          {/* Topline + hairline rule (desktop only) */}
          <div className="ff-topline">
            <div className="ff-chapter">
              <span className="ff-rune" />
              <span>End of the road · for now.</span>
              <span className="ff-glyph">✦</span>
            </div>
          </div>
          <div className="ff-rule" />

          {/* Video controls — rendered HERE only when chrome is shown. When
              the user toggles immersive mode, this wrapper unmounts and
              the same buttons re-mount inside the StickyNav; framer-motion
              uses `layoutId` to animate the position morph between the
              two mount points. */}
          {!chromeHidden && (
            <div className="ff-controls">
              <FooterControls />
            </div>
          )}

          {/* Main grid */}
          <div className="ff-grid" inert={chromeHidden ? '' : undefined} aria-hidden={chromeHidden || undefined}>
            <div className="ff-cols">
              <nav className="ff-navigation" aria-label="Footer navigation">
                <ul className="ff-primary">
                  {NAV.map((item) => (
                    <li key={item.label}>
                      <a href="#" onClick={handleNavClick(item.section)}>
                        {item.label}
                      </a>
                    </li>
                  ))}
                </ul>

                <ul className="ff-secondary">
                  {SECONDARY.map((item) => (
                    <li key={item.id}>
                      <button type="button" onClick={() => setNote(item)}>
                        {item.title}
                      </button>
                    </li>
                  ))}
                </ul>

              </nav>

              <div className="ff-brand">
                <div className="ff-name font-serif">
                  Beyond <em>Journey's</em> End
                </div>
                <div className="ff-copy">
                  An independent fan tribute. Original works belong to their
                  respective creators.
                </div>
              </div>
            </div>

            <aside className="ff-credit">
              <div className="ff-credit-label">Crafted at</div>
              <h3 className="ff-credit-title font-serif">
                Mad Makers · <em>a studio</em> for ambitious digital craft.
              </h3>
              <p className="ff-credit-body">
                We imagined, designed and built this journey. We bring the
                same care to websites, brand identities and product interfaces
                for studios and founders who care about the details as much
                as we do.
              </p>
              <div className="ff-credit-links">
                <a
                  className="ff-credit-link"
                  href="https://mad-makers.fr"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="ff-host font-serif">
                    Visit the studio
                  </span>
                  <span className="ff-arrow">
                    <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={1.8} />
                  </span>
                </a>
                <a
                  className="ff-credit-link"
                  href="https://pro.mad-makers.fr"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="ff-host font-serif">
                    Selected work
                  </span>
                  <span className="ff-arrow">
                    <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={1.8} />
                  </span>
                </a>
              </div>
              <div className="ff-socials" aria-label="Social links">
                <a
                  href="https://www.linkedin.com/company/113270995"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn · Mad Makers"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M4.98 3.5a2.5 2.5 0 1 1 .02 5.001A2.5 2.5 0 0 1 4.98 3.5zM3 9h4v12H3V9zm7 0h3.8v1.7h.05c.53-1 1.84-2.05 3.78-2.05 4.04 0 4.79 2.66 4.79 6.11V21h-4v-5.4c0-1.29-.02-2.95-1.8-2.95-1.8 0-2.07 1.4-2.07 2.85V21h-4V9z" />
                  </svg>
                </a>
                <a
                  href="https://x.com/madmakersstudio"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="X · @madmakersstudio"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.451-6.231zm-1.161 17.52h1.833L7.084 4.126H5.117l11.966 15.644z" />
                  </svg>
                </a>
              </div>
            </aside>
          </div>

          <div className="ff-bottom" inert={chromeHidden ? '' : undefined} aria-hidden={chromeHidden || undefined}>
            <div>© 2026 Mad Makers · Website design &amp; development</div>
            <div>
              <a href="#top" onClick={backToTop}>
                Back to top ↑
              </a>
            </div>
          </div>
        </footer>
      </div>
      <ProjectInfoDialog note={note} onClose={() => setNote(null)} />
    </section>
  );
}
