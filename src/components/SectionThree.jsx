import { useEffect, useState } from 'react';
import { useReveal } from '../hooks/useReveal';
import { RuneMark } from '../icons';
import { useModal } from '../hooks/useModal';
import { WorldCard } from './WorldCard';
import { useCardExpansion } from '../hooks/useCardExpansion';

const ICON = (n) => `/assets/images/icons/${n}?v=20260925`;
const IMG = (n) => `/assets/images/world-locations/${n}?v=20260925`;

// Narrative-leaning order: present capital → memory of capital →
// hearths & highlands → trade & wayfarers → trials & anomalies → north & tomb.
const LOCATIONS = [
  {
    iconSrc: ICON('chest-icon.webp'),
    category: 'Capital',
    title: 'Granz Channel',
    description:
      'Where the Hero Party returned crowned in laurels. The bell still rings at dusk, and the statues outlast the hands that carved them.',
    imageSrc: IMG('Royal_Capital_townscape_aerial_view_EP1.webp'),
    imageAlt: 'Aerial view of the Royal Capital townscape',
  },
  {
    iconSrc: ICON('scroll-icon.webp'),
    category: 'Memory',
    title: 'Granz, eighty years ago',
    description:
      'Before the spires, before the bell-tower. Himmel saw this skyline once, on the road out. The road back has taken longer.',
    imageSrc: IMG('Royal_Capital_former_appearance_EP10.webp'),
    imageAlt: 'The Royal Capital as it was eighty years ago',
  },
  {
    iconSrc: ICON('staff-icon.webp'),
    category: 'Memorial',
    title: "The Hero's Statue",
    description:
      'Granz cast Himmel in bronze, facing forever west. Frieren has stood beside it on every return, and noticed each time how the bronze has weathered.',
    imageSrc: IMG('Royal_Capital_Hero_Party_statue_EP1.webp'),
    imageAlt: 'Bronze statue of the Hero Party in the Royal Capital',
  },
  {
    iconSrc: ICON('flowers-icon.webp'),
    category: 'Hearth',
    title: 'Ferst',
    description:
      'A southern village of low slate roofs. The forge that taught Stark to fear is the same forge that taught him to wait.',
    imageSrc: IMG('3Ferst_OP2.webp'),
    imageAlt: 'The village of Ferst',
  },
  {
    iconSrc: ICON('balance-icon.webp'),
    category: 'Highlands',
    title: 'Village of the Sword',
    description:
      'A blade rests in stone here. Stark crossed its threshold once, then walked twenty years away. The road back is always shorter.',
    imageSrc: IMG('Village_of_the_Sword_EP12.webp'),
    imageAlt: 'The Village of the Sword from above',
  },
  {
    iconSrc: ICON('feather-icon.webp'),
    category: 'Pilgrim',
    title: 'The Sanctuary',
    description:
      'A glacier-locked shrine on the highland edge. Stark hesitated at the threshold once, the way men do when memory weighs more than the door.',
    imageSrc: IMG('Stark looks down at the sanctuary EP12.webp'),
    imageAlt: 'Stark looking down at the sanctuary',
  },
  {
    iconSrc: ICON('potion-icon.webp'),
    category: 'Trade',
    title: "Richter's Shop",
    description:
      "A trinket dealer with a knack for spotting magic he can't possibly afford. Frieren has emptied his shelves twice and counted both a bargain.",
    imageSrc: IMG('Richter_shop_EP22.webp'),
    imageAlt: "Inside Richter's shop",
  },
  {
    iconSrc: ICON('suitcase-icon.webp'),
    category: 'Wayfarer',
    title: "Kraft's Farewell",
    description:
      'A warrior-monk who walks the same long roads. He measured his life in centuries before Frieren learned what a century was.',
    imageSrc: IMG('Kraft_bids_farewell_EP11.webp'),
    imageAlt: 'Kraft bidding farewell on the road',
  },
  {
    iconSrc: ICON('teacup-icon.webp'),
    category: 'Trial',
    title: 'First Class Examination',
    description:
      "Where mages are tested into the empire's highest tier. Sense passes them with a soft word and a harder gaze. Few earn either.",
    imageSrc: IMG('Sense_congratulates_the_successful_examinees_EP26.webp'),
    imageAlt: 'Sense congratulating the successful examinees',
  },
  {
    iconSrc: ICON('grimoire-icon.webp'),
    category: 'Garrison',
    title: "Genau's Hometown",
    description:
      'A garrison town where Genau learned to count cathedrals before he counted spells. Faith and discipline measure the same hour.',
    imageSrc: IMG("Genau's_hometown_church_and_garrison_EP35.webp"),
    imageAlt: "Genau's hometown · the church and garrison",
  },
  {
    iconSrc: ICON('staff-icon.webp'),
    category: 'Anomaly',
    title: "The Mirror's Garden",
    description:
      'A demon that mirrors the strongest version of whoever it duels. Fern fought herself there, and won the way only Fern can.',
    imageSrc: IMG('Spiegel_EP25.webp'),
    imageAlt: 'Spiegel, the mirror demon',
  },
  {
    iconSrc: ICON('feather-icon.webp'),
    category: 'Marches',
    title: 'Rufen Region',
    description:
      'Open country between the empire and the snowfields. Every hill here once flew a banner. The wind has carried most of them off.',
    imageSrc: IMG('Rufen_Region_EP36.webp'),
    imageAlt: 'The Rufen Region',
  },
  {
    iconSrc: ICON('suitcase-icon.webp'),
    category: 'Frontier',
    title: 'Northern Lands',
    description:
      'Snowfields beyond the empire’s last waystone. Mages here are tested by mountain wind long before they are tested by Sense.',
    imageSrc: IMG('KFhl_Region_aerial_view_EP18.webp'),
    imageAlt: 'Aerial view of the Kühl Region in winter',
  },
  {
    iconSrc: ICON('hourglass-icon.webp'),
    category: 'Ruin',
    title: "King's Tomb",
    description:
      'Halls older than the empire. Lich-light still breathes beneath the seals. Frieren remembers the seal-master by name.',
    // Literal `%27` in the filename → URL must encode the `%` as `%25`
    // so the dev server decodes it back to the on-disk name.
    imageSrc: IMG('Ruins_of_the_King%2527s_Tomb.webp'),
    imageAlt: "Ruins of the King's Tomb",
  },
];

export function SectionThree() {
  const ref = useReveal();
  // Pair index + direction so the slide animation always knows which way
  // to enter from. Direction is +1 for next (new comes from the right),
  // -1 for prev (new comes from the left).
  const [{ index, direction }, setState] = useState({ index: 0, direction: 0 });
  const count = LOCATIONS.length;
  const location = LOCATIONS[index];

  const goPrev = () =>
    setState(({ index: i }) => ({ index: (i - 1 + count) % count, direction: -1 }));
  const goNext = () =>
    setState(({ index: i }) => ({ index: (i + 1) % count, direction: 1 }));

  const { slotRef, cardRef, backdropRef, expanded, active, toggle: toggleFullscreen, close } = useCardExpansion();
  useModal(active, cardRef, '#world [aria-label="Enter fullscreen"]');

  // ESC to exit fullscreen
  useEffect(() => {
    if (!active) return;
    const onKey = (e) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, close]);

  return (
    <section
      id="world" data-screen-label="03 The World"
      className="relative w-full"
      style={{ background: 'var(--ivory)' }}
    >
      <div
        ref={ref}
        className="world-section-content relative max-w-[1536px] mx-auto px-6 md:px-12 pt-20 md:pt-28 pb-24 md:pb-32"
      >
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-14 items-start">
          <div className="md:col-span-5 md:sticky md:top-24 md:self-start">
            <div className="flex items-center gap-4 mb-6">
              <span className="rune-line"></span>
              <span
                className="text-[11px] tracking-[0.32em] uppercase font-medium"
                style={{ color: 'var(--ink-mute)' }}
              >
                Chapter II
              </span>
              <RuneMark className="w-3.5 h-3.5" style={{ color: 'var(--gold)' }} />
            </div>
            <h2
              className="font-serif text-4xl sm:text-5xl md:text-6xl font-light tracking-[-0.02em] leading-[1.05] mb-6"
              style={{ color: 'var(--ink)' }}
            >
              A continent still <em className="italic" style={{ color: 'var(--gold-text)' }}>remembering</em>.
            </h2>
            <p
              className="font-serif italic text-lg leading-relaxed mb-8"
              style={{ color: 'var(--ink-soft)' }}
            >
              From the Royal Capital to the frozen north, every road on this map
              once carried the Hero Party. Eighty years later, the same roads
              carry a smaller, slower band · and the world they walk
              through is still half the war it was.
            </p>
            <button type="button" onClick={toggleFullscreen} aria-label="Explore world locations" className="flex items-center gap-3 cursor-pointer group">
              <span
                className="text-[11px] uppercase tracking-[0.28em]"
                style={{ color: 'var(--gold-text)' }}
              >
                Unfold the map
              </span>
              <span
                className="w-8 h-px transition-interaction duration-fast group-hover:w-14"
                style={{ background: 'var(--gold)' }}
              ></span>
            </button>
          </div>

          <div ref={slotRef} className="world-card-slot md:col-span-7">
              <div ref={cardRef} className="world-card-shell" data-expanded={active}
                role={active ? 'dialog' : undefined} aria-modal={active || undefined}
                aria-label={active ? 'World locations' : undefined} tabIndex={active ? -1 : undefined}>
                <WorldCard
                  location={location}
                  direction={direction}
                  onPrev={goPrev}
                  onNext={goNext}
                  isFullscreen={expanded}
                  expanding={active}
                  fill
                  onToggleFullscreen={toggleFullscreen}
                />
                {active && <button ref={backdropRef} type="button"
                  aria-label="Close fullscreen" onClick={close} className="world-card-backdrop" />}
              </div>
          </div>
        </div>
      </div>

    </section>
  );
}
