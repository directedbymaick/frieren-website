import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { SECTION_NAV } from '../lib/design';
import { scrollToSection } from '../lib/scroll';

export function NavSectionLinks({ expanded }) {
  const content = useRef(null);
  const bar = useRef(null);
  const pill = useRef(null);
  const positioned = useRef(false);
  const [width, setWidth] = useState(0);
  const [active, setActive] = useState(null);
  const [hovered, setHovered] = useState(null);
  const [focused, setFocused] = useState(null);
  const highlighted = hovered ?? focused ?? active;

  useEffect(() => {
    const sections = SECTION_NAV.map(item =>
      [...document.querySelectorAll('[data-screen-label]')].find(el => el.dataset.screenLabel === item.section));
    let frame = 0;
    const update = () => {
      frame = 0;
      let current = null;
      sections.forEach((section, index) => {
        if (section && section.getBoundingClientRect().top <= innerHeight * 0.25) current = index;
      });
      setActive(current);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, []);

  useLayoutEffect(() => {
    const measure = () => { setWidth(content.current.offsetWidth); positioned.current = false; };
    const observer = new ResizeObserver(measure);
    observer.observe(content.current);
    measure();
    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    if (!expanded) { setHovered(null); setFocused(null); positioned.current = false; return; }
    const target = bar.current.querySelectorAll('button')[highlighted];
    if (!target) { positioned.current = false; return; }
    const indicator = pill.current;
    if (!positioned.current) indicator.style.transition = 'none';
    indicator.style.transform = `translateX(${target.offsetLeft}px)`;
    indicator.style.width = `${target.offsetWidth}px`;
    if (!positioned.current) {
      void indicator.offsetWidth;
      indicator.style.transition = '';
      positioned.current = true;
    }
  }, [expanded, highlighted, width]);

  const onKeyDown = event => {
    const buttons = [...bar.current.querySelectorAll('button')];
    const index = buttons.indexOf(document.activeElement);
    if (index < 0) return;
    const next = { ArrowRight: (index + 1) % buttons.length, ArrowLeft: (index + buttons.length - 1) % buttons.length, Home: 0, End: buttons.length - 1 }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    buttons[next].focus({ preventScroll: true });
  };

  return <div className="site-nav-links t-resize" data-expanded={expanded}
    inert={expanded ? undefined : ''} aria-hidden={!expanded} style={{ width: expanded ? width : 0 }}>
    <div ref={content} className="site-nav-content">
      <div ref={bar} className="site-nav-tabs t-tabs" onPointerLeave={() => setHovered(null)}
        onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(null); }} onKeyDown={onKeyDown}>
        <span ref={pill} className="site-nav-indicator t-tabs-pill" data-visible={expanded && highlighted !== null} aria-hidden="true" />
        {SECTION_NAV.map((item, index) => <button key={item.label} type="button"
          className="site-nav-link t-tab" data-highlighted={highlighted === index}
          aria-current={active === index ? 'location' : undefined} data-haptic="selection"
          onPointerEnter={event => { if (event.pointerType !== 'touch') setHovered(index); }}
          onFocus={() => setFocused(index)} onClick={() => scrollToSection(item.section, { duration: 1.4 })}>
          {item.label}
        </button>)}
      </div>
      <span className="site-nav-divider" aria-hidden="true" />
    </div>
  </div>;
}
