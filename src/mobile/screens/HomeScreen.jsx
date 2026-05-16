import { ArrowUpRightIcon, PlayIcon } from '../icons';

const NETFLIX_URL = 'https://www.netflix.com/fr/title/81726714';
const HERO_IMAGE = '/assets/images/characters/frieren.webp';

/**
 * App "home" screen. Single static Frieren portrait at the top —
 * dissolves softly into the title block via a mask on the image
 * itself. No rotation, no shake — calm landing.
 */
export function HomeScreen({ onNavigate }) {
  return (
    <div className="mobile-home">
      <div className="mobile-home__art">
        <img
          src={HERO_IMAGE}
          alt=""
          aria-hidden="true"
          draggable={false}
          loading="eager"
          decoding="async"
          className="mobile-home__art-img is-active"
        />
        <span className="mobile-home__art-fade" aria-hidden="true" />
      </div>

      <div className="mobile-home__content">
        <span className="mobile-home__eyebrow anim-fadeup anim-fadeup--d1">
          A concept piece
        </span>
        <h1 className="mobile-home__title anim-fadeup anim-fadeup--d2">
          Beyond <em>Journey's</em> End
        </h1>
        <p className="mobile-home__subtitle anim-fadeup anim-fadeup--d3">
          An elf, a grimoire, and the long quiet after the Demon King fell.
        </p>

        <div className="mobile-home__cta anim-fadeup anim-fadeup--d4">
          <a
            className="mobile-cta mobile-cta--primary"
            href={NETFLIX_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="mobile-cta__icon">
              <PlayIcon className="w-3.5 h-3.5" />
            </span>
            <span>Watch on Netflix</span>
          </a>
          <button
            type="button"
            className="mobile-cta mobile-cta--secondary"
            onClick={() => onNavigate('companions')}
          >
            <span>Meet the party</span>
            <ArrowUpRightIcon className="w-3.5 h-3.5" />
          </button>
        </div>

        <span className="mobile-home__credit anim-fadeup anim-fadeup--d5">
          Mad Makers · fan concept
        </span>
      </div>
    </div>
  );
}
