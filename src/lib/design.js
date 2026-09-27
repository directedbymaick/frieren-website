/**
 * Shared design tokens that two or more components reach for. Lives
 * outside `components/` and `styles/globals.css` because these values are
 * read by JS-driven inline styles (the box-shadow recipe is too granular
 * for a CSS variable, and the easing string is used as a transition
 * fragment in motion props).
 */

/**
 * The wet-edge glass recipe used by every "frosted pill / round button"
 * on the page: navbar, sticky pill nav, BackToTop, BottomLeftCard. Five
 * inset highlights + one drop shadow give the surface a believable depth
 * under the parchment palette. Concatenated into a single CSS value so
 * it slots straight into an inline `boxShadow`.
 */
export const GLASS_SHADOW = [
  '0 14px 36px -14px rgba(60, 45, 30, 0.40)',
  'inset 2px 2px 0 -2px rgba(255, 255, 255, 0.85)',
  'inset -2px -2px 0 -2px rgba(255, 255, 255, 0.65)',
  'inset 1px 1px 1px -0.5px rgba(255, 255, 255, 0.55)',
  'inset -1px -1px 1px -0.5px rgba(255, 255, 255, 0.55)',
  'inset 0 1px 0 rgba(255, 255, 255, 0.5)',
].join(',');

/**
 * Out-quint. Even gentler than out-expo on the tail — pill animations
 * arrive at rest with imperceptible final velocity instead of feeling
 * like they bumped a wall. Used as the easing fragment in CSS
 * `transition` strings.
 */
export const EASE_OUT_QUINT = 'var(--ease-smooth-out)';

/**
 * Page sections users can jump to from any nav surface. Each label
 * matches an actual `data-screen-label` on the page; rendering a nav
 * straight off this list keeps Navbar + StickyNav + Footer in lockstep.
 */
export const SECTION_NAV = [
  { label: 'Companions', section: '01 Companions' },
  { label: 'World',      section: '03 The World' },
  { label: 'Memory',     section: '04 ScrollVideo' },
  { label: 'Epilogue',   section: '05 Epilogue' },
];
