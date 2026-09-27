import { HeroScene } from './HeroScene';
import { useRef } from 'react';
import { ArrowUpRight, Play } from '../icons';
import { scrollToSection } from '../lib/scroll';
import { Navbar } from './Navbar';
import { Dust } from './Dust';
import { CharacterCarousel } from './CharacterCarousel';
import { BottomLeftCard } from './BottomLeftCard';
import { BottomRightCorner } from './BottomRightCorner';
import { useReveal } from '../hooks/useReveal';

const NETFLIX_URL = 'https://www.netflix.com/fr/title/81726714';


export function Hero() {

  const sceneFront = useRef(null);
  const introRef = useReveal();

  return (
    <div
      className="hero-shell w-full h-screen flex items-center justify-center p-3 md:p-5"
      style={{ background: 'var(--ivory)' }}
    >
      <section
        data-screen-label="Hero"
        className="hero-frame relative w-full h-full overflow-clip flex flex-col items-center grain"
        style={{ background: 'var(--ivory-warm) url(/assets/images/hero-scene/river-1920.webp) center / cover' }}
      >
        {/* Living painting — slowest parallax layer (far) */}
        <div className="hero-backdrop absolute inset-0 z-0 overflow-clip" aria-hidden="true">
          <div data-parallax="0.35" className="absolute inset-0"><HeroScene foreground={sceneFront} /></div>
        </div>

        {/* Cinematic grade: keeps the painting's own colours; a night-tinted fall-off at the top and bottom
            carries the nav and the corner cards, and a soft vignette frames the lake. */}
        <div className="hero-grade absolute inset-0 z-[1] pointer-events-none" aria-hidden="true" />

        {/* Sparkle dust */}
        <Dust count={22} />

        {/* Content layer */}
        <div className="hero-content relative z-10 w-full h-full min-h-0 flex-none flex flex-col items-center">
          <Navbar />


          <div
            data-parallax="-0.12"
            ref={introRef} className="hero-intro t-stagger w-full flex flex-col items-center pt-6 md:pt-10 px-6 text-center max-w-5xl"
          >
            <h1
              className="t-stagger-line t-stagger-line--2 font-serif text-4xl sm:text-5xl md:text-[56px] lg:text-[96px] font-light tracking-[-0.02em] leading-[1] mb-4 mx-auto whitespace-nowrap"
              style={{ color: 'var(--ink)' }}
            >
              Beyond <em className="italic" style={{ color: 'var(--gold-text)' }}>Journey's</em> End
            </h1>

            <p
              className="t-stagger-line t-stagger-line--3 font-serif italic text-sm sm:text-base md:text-lg leading-relaxed max-w-xl"
              style={{ color: 'var(--ink-soft)' }}
            >
              An elf, a grimoire, and the long quiet after the Demon King fell.
              <br className="hidden md:inline" /> Walk the road of memory once more.
            </p>

            <div className="t-stagger-line t-stagger-line--4 hero-cta-group mt-7 flex items-center gap-3 md:gap-4 flex-wrap justify-center">
              {/* Primary CTA — ink → Netflix red on hover; Play mirrors
                  direction; copy crossfades to "on Netflix". */}
              <a
                href={NETFLIX_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="hero-cta hero-cta-primary"
              >
                <span className="cta-text">
                  <span className="cta-text-default">Watch on Netflix</span>
                  <span className="cta-text-hover">on Netflix</span>
                </span>
                <span className="cta-icon" aria-hidden="true">
                  <Play className="w-3.5 h-3.5" />
                </span>
              </a>

              {/* Secondary CTA — parchment glass → ink on hover; arrow
                  rotates 45° as the container slides to the left. */}
              <button
                type="button"
                onClick={() => scrollToSection('01 Companions', { duration: 1.4 })}
                className="hero-cta hero-cta-secondary"
              >
                <span className="cta-text">Meet the party</span>
                <span className="cta-icon" aria-hidden="true">
                  <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={1.9} />
                </span>
              </button>
            </div>
          </div>

          {/* Fern peeking — click cycles through party portraits, tilt alternates direction */}
          <CharacterCarousel />

          <div
            data-parallax="-0.18"
            className="absolute inset-0 pointer-events-none z-[5]"
          >
            <BottomLeftCard />
          </div>
          {/* Grimoire label stays anchored — no parallax. It's the visual hinge between hero & section 01. */}
          <BottomRightCorner />
        </div>

        {/* The foreground trees of the painting, drawn again above the title so it sits between the branches. */}
        <div className="hero-backdrop hero-backdrop--front absolute inset-0 overflow-clip pointer-events-none" aria-hidden="true">
          <div data-parallax="0.35" className="absolute inset-0"><canvas ref={sceneFront} className="hero-scene-canvas" /></div>
        </div>

      </section>
    </div>
  );
}
