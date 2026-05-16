import { useState } from 'react';

/**
 * Staff icon that, on hover, fans 10 sibling icons out from BEHIND the
 * staff with an Apple-style overshoot easing. All side-icons share the
 * staff's centre point at rest (translate(-50%, -50%) + opacity 0 +
 * scale(0.55)) — visually stacked under the staff. On hover they spring
 * outward to their target slots; on un-hover they retract back behind it.
 *
 * Layout uses absolute positioning so collapsing genuinely returns to the
 * centre (a flex-width animation only collapses the SLOT, leaving each
 * icon at the side it would expand from). Per-icon `transition-delay`
 * cascades from inner→outer for the wave effect.
 */

const STAFF = '/assets/images/icons/staff-icon.webp';

// 5 icons per half. The full visual order LEFT → RIGHT is:
// [ balance, teacup, scroll, hourglass, grimoire, STAFF, feather, flowers,
//   potion, chest, suitcase ]
const SIDE_ICONS = [
  { name: 'balance', src: '/assets/images/icons/balance-icon.webp' },
  { name: 'teacup', src: '/assets/images/icons/teacup-icon.webp' },
  { name: 'scroll', src: '/assets/images/icons/scroll-icon.webp' },
  { name: 'hourglass', src: '/assets/images/icons/hourglass-icon.webp' },
  { name: 'grimoire', src: '/assets/images/icons/grimoire-icon.webp' },
  // Staff lives between these two halves
  { name: 'feather', src: '/assets/images/icons/feather-icon.webp' },
  { name: 'flowers', src: '/assets/images/icons/flowers-icon.webp' },
  { name: 'potion', src: '/assets/images/icons/potion-icon.webp' },
  { name: 'chest', src: '/assets/images/icons/chest-icon.webp' },
  { name: 'suitcase', src: '/assets/images/icons/suitcase-icon.webp' },
];

const ICON_SIZE = 32;       // px – side icon dimension
const STAFF_SIZE = 40;      // px – centre anchor
const SLOT_WIDTH = 44;      // px – distance between icon centres when expanded

const SPRING = 'cubic-bezier(.34, 1.56, 0.64, 1)';

function SideIcon({ icon, signedDistance, expanded }) {
  // signedDistance: -5..-1 (left half) or 1..5 (right half), 0 reserved for staff.
  // delay scales with how far this icon is from the staff (inner = early).
  const distance = Math.abs(signedDistance);
  const delay = (distance - 1) * 50;
  const targetX = signedDistance * SLOT_WIDTH;

  return (
    <button
      type="button"
      aria-label={icon.name}
      tabIndex={expanded ? 0 : -1}
      className="absolute flex items-center justify-center group/icon"
      style={{
        // All icons are anchored at the parent's centre; we offset them
        // outward via transform on expand. translate(-50%, -50%) keeps the
        // box centred on its own dimensions; the +Xpx adds the slot offset.
        left: '50%',
        top: '50%',
        width: `${ICON_SIZE}px`,
        height: `${ICON_SIZE}px`,
        transform: expanded
          ? `translate(calc(-50% + ${targetX}px), -50%) scale(1)`
          : 'translate(-50%, -50%) scale(0.55)',
        opacity: expanded ? 1 : 0,
        // Lower than the staff so the rest-state stack actually sits BEHIND
        zIndex: 1,
        transition: `
          transform 640ms ${SPRING} ${delay}ms,
          opacity 320ms ease-out ${delay + 60}ms
        `,
        background: 'transparent',
        border: 'none',
        padding: 0,
        willChange: 'transform, opacity',
      }}
    >
      <img
        src={icon.src}
        alt=""
        loading="lazy"
        decoding="async"
        className="w-full h-full object-contain transition-transform duration-200 ease-out group-hover/icon:scale-110 group-active/icon:scale-95"
        draggable={false}
      />
    </button>
  );
}

export function StaffExpander() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="relative flex items-center justify-center select-none"
      style={{ width: `${STAFF_SIZE}px`, height: `${STAFF_SIZE}px` }}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      {/* All side icons — absolutely positioned, all start at the centre
          (behind the staff via z-index) and spring outward on hover. */}
      {SIDE_ICONS.slice(0, 5).map((icon, i) => (
        <SideIcon
          key={icon.name}
          icon={icon}
          signedDistance={-(5 - i)}
          expanded={expanded}
        />
      ))}
      {SIDE_ICONS.slice(5).map((icon, i) => (
        <SideIcon
          key={icon.name}
          icon={icon}
          signedDistance={i + 1}
          expanded={expanded}
        />
      ))}

      {/* Staff in centre — on top of the stack so the others tuck behind it */}
      <img
        src={STAFF}
        alt="Reveal companion icons"
        loading="eager"
        decoding="async"
        className="relative z-[2] w-full h-full object-contain transition-transform duration-300 hover:scale-105 cursor-pointer"
        draggable={false}
      />
    </div>
  );
}
