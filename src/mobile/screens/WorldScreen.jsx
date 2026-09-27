import { useEffect, useRef, useState } from 'react';

const ICON = (n) => `/assets/images/icons/${n}?v=20260925`;
const IMG = (n) => `/assets/images/world-locations/${n}?v=20260925`;

// 15 stops, narrative order (capital → memorial → hearths →
// trade & wayfarers → trials → anomalies → north → ruin). The
// alternation on screen is purely positional (left / right
// depending on index parity); the order itself is the journey.
const STOPS = [
  {
    iconSrc: ICON('chest-icon.webp'),
    category: 'Capital',
    title: 'Granz Channel',
    description:
      'Where the Hero Party returned crowned in laurels. The bell still rings at dusk, and the statues outlast the hands that carved them.',
    imageSrc: IMG('Royal_Capital_townscape_aerial_view_EP1.webp'),
  },
  {
    iconSrc: ICON('scroll-icon.webp'),
    category: 'Memory',
    title: 'Granz, eighty years ago',
    description:
      'Before the spires, before the bell-tower. Himmel saw this skyline once, on the road out. The road back has taken longer.',
    imageSrc: IMG('Royal_Capital_former_appearance_EP10.webp'),
  },
  {
    iconSrc: ICON('staff-icon.webp'),
    category: 'Memorial',
    title: "The Hero's Statue",
    description:
      'Granz cast Himmel in bronze, facing forever west. Frieren has stood beside it on every return, and noticed each time how the bronze has weathered.',
    imageSrc: IMG('Royal_Capital_Hero_Party_statue_EP1.webp'),
  },
  {
    iconSrc: ICON('flowers-icon.webp'),
    category: 'Hearth',
    title: 'Ferst',
    description:
      'A southern village of low slate roofs. The forge that taught Stark to fear is the same forge that taught him to wait.',
    imageSrc: IMG('3Ferst_OP2.webp'),
  },
  {
    iconSrc: ICON('balance-icon.webp'),
    category: 'Highlands',
    title: 'Village of the Sword',
    description:
      'A blade rests in stone here. Stark crossed its threshold once, then walked twenty years away. The road back is always shorter.',
    imageSrc: IMG('Village_of_the_Sword_EP12.webp'),
  },
  {
    iconSrc: ICON('feather-icon.webp'),
    category: 'Pilgrim',
    title: 'The Sanctuary',
    description:
      'A glacier-locked shrine on the highland edge. Stark hesitated at the threshold once, the way men do when memory weighs more than the door.',
    imageSrc: IMG('Stark looks down at the sanctuary EP12.webp'),
  },
  {
    iconSrc: ICON('potion-icon.webp'),
    category: 'Trade',
    title: "Richter's Shop",
    description:
      "A trinket dealer with a knack for spotting magic he can't possibly afford. Frieren has emptied his shelves twice and counted both a bargain.",
    imageSrc: IMG('Richter_shop_EP22.webp'),
  },
  {
    iconSrc: ICON('suitcase-icon.webp'),
    category: 'Wayfarer',
    title: "Kraft's Farewell",
    description:
      'A warrior-monk who walks the same long roads. He measured his life in centuries before Frieren learned what a century was.',
    imageSrc: IMG('Kraft_bids_farewell_EP11.webp'),
  },
  {
    iconSrc: ICON('teacup-icon.webp'),
    category: 'Trial',
    title: 'First Class Examination',
    description:
      "Where mages are tested into the empire's highest tier. Sense passes them with a soft word and a harder gaze. Few earn either.",
    imageSrc: IMG('Sense_congratulates_the_successful_examinees_EP26.webp'),
  },
  {
    iconSrc: ICON('grimoire-icon.webp'),
    category: 'Garrison',
    title: "Genau's Hometown",
    description:
      'A garrison town where Genau learned to count cathedrals before he counted spells. Faith and discipline measure the same hour.',
    imageSrc: IMG("Genau's_hometown_church_and_garrison_EP35.webp"),
  },
  {
    iconSrc: ICON('staff-icon.webp'),
    category: 'Anomaly',
    title: "The Mirror's Garden",
    description:
      'A demon that mirrors the strongest version of whoever it duels. Fern fought herself there, and won the way only Fern can.',
    imageSrc: IMG('Spiegel_EP25.webp'),
  },
  {
    iconSrc: ICON('feather-icon.webp'),
    category: 'Marches',
    title: 'Rufen Region',
    description:
      'Open country between the empire and the snowfields. Every hill here once flew a banner. The wind has carried most of them off.',
    imageSrc: IMG('Rufen_Region_EP36.webp'),
  },
  {
    iconSrc: ICON('suitcase-icon.webp'),
    category: 'Frontier',
    title: 'Northern Lands',
    description:
      'Snowfields beyond the empire’s last waystone. Mages here are tested by mountain wind long before they are tested by Sense.',
    imageSrc: IMG('KFhl_Region_aerial_view_EP18.webp'),
  },
  {
    iconSrc: ICON('hourglass-icon.webp'),
    category: 'Ruin',
    title: "King's Tomb",
    description:
      'Halls older than the empire. Lich-light still breathes beneath the seals. Frieren remembers the seal-master by name.',
    imageSrc: IMG('Ruins_of_the_King%2527s_Tomb.webp'),
  },
];

const PAD = (n) => String(n).padStart(2, '0');

/**
 * "The Journey" — a vertical scrolling map of the continent's
 * waypoints. Different metaphor from Cast (horizontal swipe
 * stack) and from the generic full-bleed reels pattern: a single
 * winding path runs down the middle of the screen, each location
 * sits as a "stop" off to one side, alternating left/right. When
 * a stop centres in the viewport (via IntersectionObserver) it
 * EXPANDS inline — thumbnail grows, body unfolds — instead of
 * routing to a separate detail view. Scrolling itself is the
 * narrative: read the locations the way Frieren walks them.
 */
export function WorldScreen() {
  const scrollerRef = useRef(null);
  const [activeIdx, setActiveIdx] = useState(0);

  // Track which stop is centred in the viewport. Lower threshold
  // (0.6) than Cast because each stop is shorter than a card, so
  // the "active band" wants to be narrower for snappy switching.
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const stops = scroller.querySelectorAll('[data-stop-idx]');
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && e.intersectionRatio > 0.6) {
            setActiveIdx(Number(e.target.dataset.stopIdx));
          }
        }
      },
      {
        root: scroller,
        // Bias the "active" band toward the centre of the
        // viewport — root margin shrinks the top + bottom so a
        // stop must be roughly mid-screen to qualify.
        rootMargin: '-30% 0px -30% 0px',
        threshold: [0, 0.6, 1],
      }
    );
    stops.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, []);

  // Desktop affordance — click-and-drag the journey to scroll
  // vertically. On a phone the native touch scroll handles it and
  // this effect is inert (mousedown doesn't fire from a tap).
  // Added because mouse-wheel-only navigation through a 3000+ px
  // page is awkward, and the equivalent gesture works on Cast so
  // the carousel + the journey share one mental model.
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    let isDown = false;
    let startY = 0;
    let startScroll = 0;
    let moved = false;

    const onDown = (e) => {
      if (e.button !== 0) return;
      isDown = true;
      moved = false;
      startY = e.pageY;
      startScroll = scroller.scrollTop;
    };
    const onMove = (e) => {
      if (!isDown) return;
      const dy = e.pageY - startY;
      if (!moved && Math.abs(dy) > 4) {
        moved = true;
        scroller.classList.add('is-dragging');
      }
      if (moved) scroller.scrollTop = startScroll - dy;
    };
    const onUp = () => {
      if (!isDown) return;
      isDown = false;
      if (!moved) return;
      scroller.classList.remove('is-dragging');
    };

    scroller.addEventListener('mousedown', onDown);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      scroller.removeEventListener('mousedown', onDown);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, []);

  return (
    <div className="mobile-world">
      <div className="mobile-world__sky" aria-hidden="true" />

      <div className="mobile-world__counter" aria-live="polite">
        <span className="mobile-world__counter-cur">
          {PAD(activeIdx + 1)}
        </span>
        <span className="mobile-world__counter-sep"> / </span>
        <span className="mobile-world__counter-total">
          {PAD(STOPS.length)}
        </span>
      </div>

      <div ref={scrollerRef} className="mobile-world__scroll" tabIndex={0} role="region" aria-label="World locations">
        {/* Header — sits above the first stop, eases the user in
            with a title and a one-line context for the journey. */}
        <header className="mobile-world__intro">
          <span className="mobile-world__intro-eyebrow">A long road</span>
          <h1 className="mobile-world__intro-title">The Journey South</h1>
          <p className="mobile-world__intro-blurb">
            Fourteen places that mark the route between the capital
            and the edge of the world.
          </p>
        </header>

        {/* One large image card per stop — full-width 3:2 landscape
            scene, glass chip with the category overlaid top-left,
            title written across the bottom over a soft scrim,
            description revealed inline when the card centres in
            the viewport. */}
        <div className="mobile-world__feed">
          {STOPS.map((stop, i) => {
            const isActive = i === activeIdx;
            return (
              <article
                key={stop.title}
                data-stop-idx={i}
                className={`mobile-world-stop${isActive ? ' is-active' : ''}`}
              >
                <div className="mobile-world-stop__photo">
                  <img
                    src={stop.imageSrc}
                    alt=""
                    aria-hidden="true"
                    loading={i < 2 ? 'eager' : 'lazy'}
                    decoding="async"
                    draggable={false}
                  />
                  <span className="mobile-world-stop__scrim" aria-hidden="true" />
                  <span className="mobile-world-stop__chip">
                    {stop.category}
                  </span>
                  <h2 className="mobile-world-stop__title">{stop.title}</h2>
                </div>
                <p className="mobile-world-stop__desc">{stop.description}</p>
              </article>
            );
          })}
        </div>

        <footer className="mobile-world__outro">
          <span className="mobile-world__outro-mark">·</span>
          <span className="mobile-world__outro-text">end of the road</span>
        </footer>
      </div>
    </div>
  );
}
