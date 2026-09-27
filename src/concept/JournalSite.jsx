import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Close, Menu, ArrowUpRight, ChevronLeft, ChevronRight, Play } from '../icons';
import { IconSwap } from '../components/IconSwap';
import { useModal } from '../hooks/useModal';
import { useTransitionPresence } from '../hooks/useTransitionPresence';
import { useMotionPreferences } from '../lib/motion';
import { HapticsToggle } from '../lib/haptics';
import { MOTION, surfaceTransition } from '../lib/transitionTokens';
import { COMPANIONS, PLACES, IMAGES } from './data';
import { useJournalScene } from './useJournalScene';
import './journal.css';

const Arrow = () => <ArrowUpRight className="j-icon" />;
const Star = ({ className = '' }) => <svg className={className} width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M16 2c0 10-4 14-14 14 10 0 14 4 14 14 0-10 4-14 14-14C20 16 16 12 16 2Z" stroke="currentColor" /><circle cx="16" cy="16" r="3" fill="currentColor" /></svg>;
const NAV = [['prologue', 'The story'], ['companions', 'Companions'], ['atlas', 'The world']];
function Chapter({ number, children, light = false }) { return <div className={`j-chapter${light ? ' j-chapter-light' : ''}`}><span>{number}</span><span>{children}</span><span className="j-rule" /></div>; }
function Reveal({ children, className = '', ...props }) { return <div className={`j-reveal t-stagger ${className}`} data-journal-reveal {...props}><div className="t-stagger-line">{children}</div></div>; }

function usePicker(items, prefix) {
  const [index, setIndex] = useState(0);
  const refs = useRef([]);
  const keydown = event => {
    const next = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? (index + 1) % items.length : event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? (index + items.length - 1) % items.length : event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : null;
    if (next === null) return;
    event.preventDefault(); setIndex(next); refs.current[next]?.focus({ preventScroll: true });
  };
  const tabProps = i => ({ ref: el => { refs.current[i] = el; }, id: `${prefix}-tab-${i}`, role: 'tab', 'aria-selected': index === i, 'aria-controls': `${prefix}-panel`, tabIndex: index === i ? 0 : -1, onClick: () => setIndex(i), onKeyDown: keydown, 'data-haptic': 'selection' });
  return { index, setIndex, tabProps, panelProps: { id: `${prefix}-panel`, role: 'tabpanel', 'aria-labelledby': `${prefix}-tab-${index}`, tabIndex: 0 } };
}

function Crossfade({ id, children, className = '' }) {
  const { reduced } = useMotionPreferences();
  return <AnimatePresence mode="wait" initial={false}><motion.div key={id} className={className} initial={{ opacity: 0, y: reduced ? 0 : MOTION.distance }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: reduced ? 0 : -MOTION.distance }} transition={surfaceTransition(reduced ? 0 : MOTION.fast)}>{children}</motion.div></AnimatePresence>;
}

function JournalDialog({ content, close }) {
  const previous = useRef(content);
  if (content) previous.current = content;
  const item = content || previous.current;
  const ref = useRef(null), video = useRef(null);
  const { present, phase } = useTransitionPresence(Boolean(content));
  useModal(present, ref);
  useEffect(() => { if (!content) video.current?.pause(); }, [content]);
  useEffect(() => {
    if (!present) return;
    const onKey = event => { if (event.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [present, close]);
  if (!present || !item) return null;
  return createPortal(<div className={`journal-site j-overlay ${phase}`} onClick={event => { if (event.currentTarget === event.target) close(); }}>
    <section className={`j-dialog t-modal ${phase}${item.film ? ' j-dialog-film' : ''}`} ref={ref} role="dialog" aria-modal="true" aria-labelledby="journal-dialog-title" tabIndex={-1}>
      <div className="j-dialog-top"><span className="j-eyebrow">A page from the journal</span><button className="j-round" type="button" onClick={close} aria-label="Close journal"><Close className="j-icon" /></button></div>
      <h2 id="journal-dialog-title">{item.title}</h2>
      {item.film ? <><video ref={video} controls autoPlay playsInline preload="metadata" poster="/assets/images/posters/opening.webp" src="/assets/videos/opening-v2.mp4" /><p className="j-film-caption">A moment from the world of Frieren. Original media belongs to its respective rights holders.</p></> : <><p>{item.body}</p></>}
    </section>
  </div>, document.body);
}

export default function JournalSite() {
  const root = useRef(null);
  const [menu, setMenu] = useState(false);
  const [compact, setCompact] = useState(() => matchMedia('(max-width: 760px)').matches);
  useEffect(() => {
    const query = matchMedia('(max-width: 760px)');
    const update = () => { setCompact(query.matches); if (!query.matches) setMenu(false); };
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  const [dialog, setDialog] = useState(null);
  const [activeSection, setActiveSection] = useState('');
  const { reduced } = useMotionPreferences();
  const cast = usePicker(COMPANIONS, 'journal-cast'), atlas = usePicker(PLACES, 'journal-atlas');
  const companion = COMPANIONS[cast.index], place = PLACES[atlas.index];
  useJournalScene(root);
  useEffect(() => {
    const title = document.title;
    document.title = 'Frieren — A journal of the journey';
    return () => { document.title = title; };
  }, []);
  useEffect(() => {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) setActiveSection(entry.target.id); }), { rootMargin: '-15% 0px -55% 0px' });
    root.current.querySelectorAll('section[id]').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    let frame = 0;
    const restoreChapter = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const target = document.getElementById(location.hash.slice(1));
        if (target && root.current?.contains(target)) target.scrollIntoView({ behavior: 'instant', block: 'start' });
      });
    };
    restoreChapter();
    addEventListener('popstate', restoreChapter);
    return () => { cancelAnimationFrame(frame); removeEventListener('popstate', restoreChapter); };
  }, []);
  const navigate = (event, id) => {
    event.preventDefault(); setMenu(false);
    const target = document.getElementById(id);
    if (!target) return;
    if (location.hash !== `#${id}`) history.pushState(null, '', `?concept=journal#${id}`);
    target.focus({ preventScroll: true });
    target.scrollIntoView({ behavior: reduced ? 'instant' : 'smooth', block: 'start' });
  };
  const showFilm = () => setDialog({ title: 'Let the journey begin.', film: true });
  return <div className="journal-site" ref={root}>
    <a className="j-skip" href="#journal-main">Skip to the journal</a>
    <header className="j-header">
      <a className="j-wordmark" href="#journal-top" onClick={e => navigate(e, 'journal-top')} aria-label="Frieren — back to the beginning">frieren<span>BEYOND JOURNEY’S END</span></a>
      <nav className={`j-nav${menu ? ' is-open' : ''}`} aria-label="Journal chapters" onKeyDown={event => { if (event.key === 'Escape') { setMenu(false); document.getElementById('journal-menu-toggle')?.focus(); } }}>
        {NAV.map(([id, label], i) => <a href={`#${id}`} key={id} onClick={e => navigate(e, id)} aria-current={activeSection === id ? 'location' : undefined}><span aria-hidden="true">0{i + 1}</span>{label}</a>)}
      </nav>
      <button className="j-watch-nav" aria-label="Watch the film" onClick={showFilm}><span className="j-play-small"><Play className="j-icon" /></span><span>Watch the film</span></button>
      <button id="journal-menu-toggle" className="j-menu-toggle j-round" aria-label={menu ? 'Close chapter menu' : 'Open chapter menu'} aria-expanded={menu} onClick={() => setMenu(value => !value)}><IconSwap active={menu} first={<Menu className="j-icon" />} second={<Close className="j-icon" />} /></button>
    </header>
    <main id="journal-main" tabIndex={-1}>
      <section className="j-hero" id="journal-top" tabIndex={-1} aria-labelledby="journal-title" data-journal-scene>
        <div className="j-hero-meta"><span>A journal of the journey</span><span>葬送のフリーレン</span><span>Est. in the age of heroes</span></div>
        <div className="j-hero-grid">
          <div className="j-hero-copy t-stagger" data-journal-reveal>
            <div className="j-eyebrow t-stagger-line t-stagger-line--1"><span className="j-small-star">✧</span> Every ending leaves a story.</div>
            <h1 id="journal-title" className="t-stagger-line t-stagger-line--2">Life,<br /><em>after</em><br />the end.</h1>
            <p className="j-hero-description t-stagger-line t-stagger-line--3">The world was saved.<br />Now, it’s time to understand it.</p>
            <div className="t-stagger-line t-stagger-line--4"><a className="j-primary" href="#prologue" onClick={e => navigate(e, 'prologue')}>Turn the first page <span>↓</span></a></div>
          </div>
          <figure className="j-hero-art">
            <div className="j-hero-landscape"><img src={IMAGES.bridge} alt="A sunlit stone bridge beneath the trees" fetchpriority="high" decoding="async" /></div>
            <div className="j-hero-portrait"><img src={COMPANIONS[0].image} alt="Frieren resting beneath an old tree with a book" fetchpriority="high" decoding="async" /><div className="j-portrait-line" /></div>
            <div className="j-hero-seal" aria-hidden="true"><Star /><span>TAKE THE<br />LONG WAY.</span></div>
            <figcaption><span>FIELD NOTES — 001</span><span>A little further.<br />A little closer.</span></figcaption>
          </figure>
          <span className="j-vertical-note" aria-hidden="true">A THOUSAND YEARS · A THOUSAND LITTLE THINGS</span>
        </div>
        <div className="j-hero-foot"><span><span className="j-status-dot" /> The journey continues</span><a href="#companions" onClick={e => navigate(e, 'companions')}><span className="j-tiny-portraits">{COMPANIONS.slice(0,3).map(c => <img key={c.name} src={c.image} alt="" loading="lazy" />)}</span>Better, together <Arrow /></a><span>SCROLL TO WANDER ↓</span></div>
      </section>

      <section className="j-prologue j-section" id="prologue" tabIndex={-1} aria-labelledby="prologue-title">
        <Chapter number="01">The quiet after the adventure</Chapter>
        <div className="j-prologue-grid"><Reveal className="j-side-note"><Star /><p>Ten years to save the world.<br />A lifetime to understand<br />what it meant.</p><span className="j-eyebrow">Beyond the hero’s story</span></Reveal>
          <Reveal><h2 id="prologue-title">For her, it was<br />only a <em>moment.</em></h2><div className="j-prologue-body"><p>For an elf who has lived for more than a thousand years, a ten-year adventure seems almost impossibly brief. Until the people who shared it begin to disappear.</p><p>Frieren sets out again. Not to save the world this time, but to see it differently. To listen a little longer. To discover what she missed along the way.</p></div></Reveal></div>
        <div className="j-time-line"><span>1,000<span> YEARS OF LIFE</span></span><div><i /><span>10 years. Everything changed.</span></div><span>∞<span> THINGS TO DISCOVER</span></span></div>
      </section>

      <section className="j-companions j-section" id="companions" tabIndex={-1} aria-labelledby="companions-title">
        <Chapter number="02">The people who make the journey</Chapter>
        <div className="j-section-heading"><Reveal><h2 id="companions-title">No one walks<br /><em>alone.</em></h2></Reveal><p>Some walk beside us.<br />Some stay with us long after.</p></div>
        <div className="j-cast-layout">
          <div className="j-cast-tabs" role="tablist" aria-label="Choose a companion" aria-orientation={compact ? 'horizontal' : 'vertical'}>
            {COMPANIONS.map((c, i) => <button type="button" key={c.name} {...cast.tabProps(i)}><span className="j-cast-index">{c.number}</span><span><strong>{c.name}</strong><small>{c.role}</small></span><Arrow /></button>)}
            <div className="j-cast-footnote"><Star /><p>It’s the people<br />we remember.</p></div>
          </div>
          <div className="j-cast-panel" {...cast.panelProps}>
            <div className="j-cast-image"><Crossfade id={cast.index}><img src={companion.image} alt={`${companion.name} — ${companion.role}`} style={{ objectPosition: companion.position }} loading="lazy" decoding="async" /></Crossfade><span className="j-image-index">{companion.number} / 04</span></div>
            <div className="j-cast-story"><Crossfade id={cast.index}><span className="j-eyebrow">{companion.subtitle}</span><h3>{companion.name}</h3><p>{companion.description}</p><p className="j-cast-note">{companion.note}</p><button className="j-text-link" onClick={() => setDialog({ title: companion.name, body: companion.detail })}>A closer look <Arrow /></button></Crossfade></div>
          </div>
        </div>
      </section>

      <section className="j-memory" id="memory" aria-labelledby="memory-title" data-journal-scene>
        <div className="j-memory-sticky"><img className="j-memory-landscape" src={IMAGES.marshes} alt="" loading="lazy" decoding="async" /><div className="j-memory-shade" /><div className="j-memory-top"><span>INTERLUDE</span><span>PAUSE HERE, FOR A MOMENT.</span></div>
          <Reveal className="j-memory-copy"><Star /><p className="j-eyebrow">The things that stay</p><h2 id="memory-title">Not every moment<br />needs to be <em>extraordinary.</em></h2><p>A flower. A conversation. The same sky, fifty years later.<br />Sometimes the smallest things take the longest to understand.</p></Reveal>
          <div className="j-memory-bottom"><span>THE WORLD KEEPS TURNING.</span><span>WE LEARN TO LOOK A LITTLE CLOSER.</span></div>
        </div>
      </section>

      <section className="j-atlas j-section" id="atlas" tabIndex={-1} aria-labelledby="atlas-title">
        <Chapter number="03">An atlas of small wonders</Chapter>
        <div className="j-section-heading"><Reveal><h2 id="atlas-title">The long way<br /><em>is the way.</em></h2></Reveal><p>No destination without the detours.<br />Four places worth remembering.</p></div>
        <div className="j-atlas-tabs" role="tablist" aria-label="Choose a place">{PLACES.map((p,i) => <button key={p.name} {...atlas.tabProps(i)}><span>0{i+1}</span>{p.name}<i /></button>)}</div>
        <div className="j-atlas-panel" {...atlas.panelProps}>
          <div className="j-atlas-image" data-journal-scene><Crossfade id={atlas.index}><img src={place.image} alt={place.label} loading="lazy" decoding="async" /></Crossfade><span className="j-place-coordinate">NORTHWARD, ALWAYS.</span><div className="j-atlas-arrows"><button className="j-round" aria-label="Previous place" data-haptic="selection" onClick={() => atlas.setIndex(i => (i+PLACES.length-1)%PLACES.length)}><ChevronLeft className="j-icon" /></button><button className="j-round" aria-label="Next place" data-haptic="selection" onClick={() => atlas.setIndex(i => (i+1)%PLACES.length)}><ChevronRight className="j-icon" /></button></div></div>
          <div className="j-atlas-caption"><span className="j-map-marker">✧<span>0{atlas.index+1}</span></span><div><span className="j-eyebrow">{place.region}</span><h3>{place.name}</h3></div><p>{place.description}</p></div>
        </div>
      </section>

      <section className="j-film j-section" id="film" tabIndex={-1} aria-labelledby="film-title">
        <Chapter number="04">There’s a whole world waiting</Chapter>
        <div className="j-film-layout"><div><span className="j-eyebrow">A glimpse beyond the page</span><h2 id="film-title">Some stories<br />are meant<br />to be <em>felt.</em></h2><button className="j-primary" onClick={showFilm}>Watch the film <Play className="j-icon" /></button><a className="j-text-link" href="https://www.netflix.com/fr/title/81726714" target="_blank" rel="noopener noreferrer">Discover the series <Arrow /></a></div><button className="j-film-poster" aria-label="Play the Frieren film" data-haptic="impact" onClick={showFilm}><img src="/assets/images/posters/opening.webp" alt="" loading="lazy" /><span className="j-film-play"><Play className="j-icon" /></span><span className="j-film-label">FRIEREN — BEYOND JOURNEY’S END<span>PLAY FILM ↗</span></span></button></div>
      </section>

      <footer className="j-footer"><div className="j-footer-top"><span className="j-eyebrow">The last page. For now.</span><Star /><a href="#journal-top" onClick={e=>navigate(e,'journal-top')}>Back to the beginning ↑</a></div><h2>There’s always<br /><em>another chapter.</em></h2><div className="j-footer-bottom"><div className="j-footer-credit"><strong>frieren</strong><p>An unofficial love letter to the journey.<br />A fan concept by Mad Makers.</p></div><div className="j-footer-links"><a href="https://mad-makers.fr" target="_blank" rel="noopener noreferrer">Mad Makers <Arrow /></a><button onClick={()=>setDialog({title:'About this journal',body:'An independent fan concept inspired by Frieren: Beyond Journey’s End. Characters, illustrations, animation and music belong to their respective rights holders. This project is not affiliated with the official production or its publishers.'})}>Credits & project</button><a href="/">View the original concept <Arrow /></a></div><div className="j-footer-preferences"><span className="j-eyebrow">At your own pace</span><HapticsToggle /></div></div><div className="j-colophon"><span>MADE OF MEMORIES, MAGIC & SMALL MOMENTS.</span><span>THANK YOU FOR WANDERING.</span></div></footer>
    </main>
    <JournalDialog content={dialog} close={() => setDialog(null)} />
  </div>;
}

