/**
 * Bottom tab bar — the mobile app's primary navigation. Five tabs,
 * each one a `<button>` for proper keyboard / a11y semantics.
 *
 * Active-state visual is a single gold pill that *slides* between
 * tab slots rather than appearing/disappearing in place. The pill
 * is one absolutely-positioned `<span>` whose `translateX` is
 * driven by a CSS custom property (`--active-idx`), and the layout
 * (equal-width tabs in a 5-column grid) means we don't need to
 * measure pixel positions in JS — pure CSS interpolation handles
 * the motion with an Apple-style cubic-bezier curve.
 *
 * Pure presentational — receives the tabs config and the active id
 * from `<MobileApp />` and reports changes via `onTabChange`.
 */
export function MobileTabBar({ tabs, active, onTabChange }) {
  const activeIdx = Math.max(0, tabs.findIndex((t) => t.id === active));
  return (
    <nav
      className="mobile-tabbar"
      aria-label="App sections"
      style={{ '--active-idx': activeIdx }}
    >
      {/* Hidden SVG defs — an inline linearGradient that paints
          every icon stroke in the bar with a gold/ivory metallic
          shimmer (warm low → ivory mid → warm low). CSS overrides
          `stroke="currentColor"` to `url(#tab-gradient)` on each
          drawn element below, and labels use a matching CSS
          gradient via `background-clip: text` so icons + labels
          read as one material. Inline gradient — no image load,
          no URL-encoding edge cases. */}
      <svg className="mobile-tabbar__defs" aria-hidden="true" focusable="false">
        <defs>
          {/* Default — horizontal (90°), used by every tab except
              the ones with their own gradient below. */}
          <linearGradient id="tab-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#a67c3a" />
            <stop offset="35%"  stopColor="#e8d4a0" />
            <stop offset="65%"  stopColor="#b89464" />
            <stop offset="100%" stopColor="#e8d4a0" />
          </linearGradient>
          {/* Home — diagonal (45°, bottom-left → top-right). The
              CSS rule below targets `[data-tab="home"]` so this
              gradient applies only when Home is the active tab. */}
          <linearGradient id="tab-gradient-home" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#a67c3a" />
            <stop offset="35%"  stopColor="#e8d4a0" />
            <stop offset="65%"  stopColor="#b89464" />
            <stop offset="100%" stopColor="#e8d4a0" />
          </linearGradient>
        </defs>
      </svg>
      {/* Sliding glass indicator. Sits behind the buttons
          (z-index 0) while button content stays on top.
          translateX is driven by `--active-idx` × (100% + gap)
          so the pill moves one tab-slot per index change. */}
      <span className="mobile-tabbar__indicator" aria-hidden="true" />
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            aria-current={isActive ? 'page' : undefined}
            data-tab={tab.id}
            className={`mobile-tabbar__btn ${isActive ? 'is-active' : ''}`}
          >
            <span className="mobile-tabbar__icon">
              <Icon className="w-5 h-5" />
            </span>
            <span className="mobile-tabbar__label">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
