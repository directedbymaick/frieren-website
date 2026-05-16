/**
 * Common chrome that every mobile screen sits inside:
 *
 *   ┌──────────────────────────┐
 *   │  top bar (title)         │  ← `mobile-screen__top`
 *   ├──────────────────────────┤
 *   │                          │
 *   │  scrollable content      │  ← `mobile-screen__body`
 *   │                          │
 *   └──────────────────────────┘
 *
 * The body is the only scroll container in the app — the outer
 * `<MobileApp>` shell is fixed-height (100dvh) so the bottom tab
 * bar doesn't move out of view as content scrolls.
 */
export function MobileScreenShell({ title, children }) {
  return (
    <section className="mobile-screen" aria-label={title}>
      <header className="mobile-screen__top">
        <h1 className="mobile-screen__title">{title}</h1>
      </header>
      <div className="mobile-screen__body">{children}</div>
    </section>
  );
}
