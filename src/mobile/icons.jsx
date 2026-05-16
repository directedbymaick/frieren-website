/**
 * Mobile-app-specific icons. Kept local to the `/mobile` folder
 * because the desktop icon set is shaped around its layout
 * (chevrons, play, runes…) and the tab bar wants something more
 * pictographic. All icons render at the current text color via
 * `stroke="currentColor"` so they pick up the tab's active /
 * inactive tint automatically.
 */

const baseProps = (className = 'w-5 h-5', stroke = 1.7) => ({
  className,
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: stroke,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
});

export const HomeIcon = ({ className, ...p }) => (
  <svg {...baseProps(className)} {...p}>
    <path d="M3 11.5 12 4l9 7.5" />
    <path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" />
  </svg>
);

export const PeopleIcon = ({ className, ...p }) => (
  <svg {...baseProps(className)} {...p}>
    <circle cx="9" cy="8" r="3.2" />
    <circle cx="17" cy="9" r="2.6" />
    <path d="M3 19c0-2.8 2.7-5 6-5s6 2.2 6 5" />
    <path d="M14 19c0-1.5.7-3 1.8-3.9.6-.5 1.4-.7 2.2-.7 2 0 4 1.5 4 4" />
  </svg>
);

export const GlobeIcon = ({ className, ...p }) => (
  <svg {...baseProps(className)} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3.6 9h16.8M3.6 15h16.8" />
    <path d="M12 3c2.5 3 2.5 15 0 18M12 3c-2.5 3-2.5 15 0 18" />
  </svg>
);

export const PlayIcon = ({ className, ...p }) => (
  <svg {...baseProps(className)} {...p}>
    <path d="M8 5.5v13l11-6.5z" fill="currentColor" stroke="currentColor" strokeLinejoin="round" />
  </svg>
);

export const SparkIcon = ({ className, ...p }) => (
  <svg {...baseProps(className)} {...p}>
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8" />
  </svg>
);

export const ArrowUpRightIcon = ({ className, ...p }) => (
  <svg {...baseProps(className)} {...p}>
    {/* Diagonal stem from lower-left to upper-right, plus the
        arrowhead made of the top edge + right edge of a corner. */}
    <line x1="7" y1="17" x2="17" y2="7" />
    <polyline points="9 7 17 7 17 15" />
  </svg>
);
