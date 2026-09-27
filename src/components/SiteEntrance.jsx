import { Component, Suspense, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useMotionPreferences } from '../lib/motion';
import { useTransitionPresence } from '../hooks/useTransitionPresence';
import { useModal } from '../hooks/useModal';
import { getLenis } from '../lib/lenis';

const SEEN_KEY = 'frieren-introduction-seen';
const MIN_SHOW_MS = 1200;          // long enough to read the ring filling, never an artificial wait
const preloadImage = src => {
  const image = new Image();
  image.src = src;
  return image.decode();
};

function Mounted({ onReady, children }) {
  useEffect(onReady, [onReady]);
  return children;
}

class EntryBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onReady(); }
  render() {
    if (this.state.failed) return <main className="entry-error">
      <p className="entry-eyebrow">A pause along the way</p>
      <h1>The path will be here.</h1>
      <p>The journey could not open. Please check your connection and try again.</p>
      <button type="button" onClick={() => location.reload()}>Try again ↗</button>
    </main>;
    return this.props.children;
  }
}

// ---- motion helpers ------------------------------------------------------------------------------
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const seg = (t, a, b) => clamp((t - a) / (b - a));
const lerp = (a, b, k) => a + (b - a) * k;
function bezier(x1, y1, x2, y2) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx, cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const sx = t => ((ax * t + bx) * t + cx) * t, sy = t => ((ay * t + by) * t + cy) * t, dx = t => (3 * ax * t + 2 * bx) * t + cx;
  return x => { x = clamp(x); let t = x; for (let i = 0; i < 8; i++) { const d = dx(t); if (Math.abs(d) < 1e-6) break; t -= (sx(t) - x) / d; } return sy(clamp(t)); };
}
const IO = bezier(.65, 0, .35, 1), OUTQ = bezier(.22, 1, .36, 1);

function ripple(cx, cy, r, amp, t) {
  const pts = [];
  for (let i = 0; i < 96; i++) {
    const th = i / 96 * Math.PI * 2;
    const rr = Math.max(0, r + amp * (.55 * Math.sin(5 * th + t * 5.5) + .3 * Math.sin(9 * th - t * 7.3 + 1.3) + .15 * Math.sin(14 * th + t * 3.1)));
    pts.push([cx + Math.cos(th) * rr, cy + Math.sin(th) * rr]);
  }
  return pts;
}
// ---- stardust: text is sampled glyph by glyph into golden particles ----------------------------------
// Each character is redrawn at its exact on-screen box (so wrapping and letter-spacing are respected) on a
// canvas the size of its element only, then its pixels become particles. Done ahead of the exit, never mid-motion.
function sampleText(els, budget) {
  const range = document.createRange(), pts = [];
  for (const el of els) {
    const box = el.getBoundingClientRect();
    if (!box.width || !box.height) continue;
    const pad = 12, x0 = Math.floor(box.left - pad), y0 = Math.floor(box.top - pad), w = Math.ceil(box.width + pad * 2), h = Math.ceil(box.height + pad * 2);
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    const g = cv.getContext('2d', { willReadFrequently: true });
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const cs = getComputedStyle(n.parentElement);
      if (cs.display === 'none') continue;
      g.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
      g.fillStyle = cs.color; g.textBaseline = 'alphabetic';
      const asc = g.measureText('Hg').fontBoundingBoxAscent, text = cs.textTransform === 'uppercase' ? n.data.toUpperCase() : n.data, ls = parseFloat(cs.letterSpacing) || 0;
      for (let i = 0; i < n.data.length; i++) {
        if (/\s/.test(n.data[i])) continue;
        range.setStart(n, i); range.setEnd(n, i + 1);
        const r = range.getBoundingClientRect();
        if (!r.width) continue;
        // Variable fonts (Fraunces' optical size) render narrower on the page than on a canvas:
        // squeeze each glyph to its real on-page advance so the dust lands on the real letters.
        const cw = g.measureText(text[i]).width, sx = cw > 0 ? clamp((r.width - ls) / cw, .6, 1.4) : 1;
        g.setTransform(sx, 0, 0, 1, r.left - x0, r.top - y0 + asc); g.fillText(text[i], 0, 0); g.setTransform(1, 0, 0, 1, 0, 0);
      }
    }
    const d = g.getImageData(0, 0, w, h).data;
    for (let y = 0; y < h; y += 2) for (let x = 0; x < w; x += 2) {
      const i = (y * w + x) * 4;
      if (d[i + 3] > 110) pts.push({ x: x0 + x, y: y0 + y, c: [d[i], d[i + 1], d[i + 2]] });
    }
  }
  if (pts.length > budget) {
    for (let i = pts.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [pts[i], pts[j]] = [pts[j], pts[i]]; }
    pts.length = budget;
  }
  return pts;
}
const GOLD = [255, 214, 140];
const rgb = c => `rgb(${c[0]},${c[1]},${c[2]})`;
const mixRgb = (a, b, k) => rgb(a.map((v, i) => Math.round(lerp(v, b[i], k))));
let spriteCache = null;
function glowSprite() {
  if (spriteCache) return spriteCache;
  const c = document.createElement('canvas'); c.width = c.height = 16;
  const g = c.getContext('2d'), grd = g.createRadialGradient(8, 8, 0, 8, 8, 8);
  grd.addColorStop(0, 'rgba(255,226,170,.9)'); grd.addColorStop(.35, 'rgba(255,190,110,.35)'); grd.addColorStop(1, 'rgba(255,170,80,0)');
  g.fillStyle = grd; g.fillRect(0, 0, 16, 16);
  return (spriteCache = c);
}
const bend = (ax, ay, bx, by, amount) => {       // control point of a curved path from a to b
  const dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy) || 1;
  return [(ax + bx) / 2 - dy / len * amount, (ay + by) / 2 + dx / len * amount];
};
const quad = (a, m, b, k) => (1 - k) * (1 - k) * a + 2 * (1 - k) * k * m + k * k * b;
// three colour stops per particle (own colour, halfway, gold), so no colour string is built per frame
const palette = (c, reverse) => reverse ? [rgb(GOLD), mixRgb(GOLD, c, .5), rgb(c)] : [rgb(c), mixRgb(c, GOLD, .5), rgb(GOLD)];

// Sampled while the full ring glows (static beat before the exit), so the motion itself never hitches.
function prepareStardust(node) {
  const circle = node.querySelector('.entry-circle'), cr = circle.getBoundingClientRect();
  const cx = cr.left + cr.width / 2, cy = cr.top + cr.height / 2, R0 = cr.width * 378 / 840;
  const texts = [...node.querySelectorAll('.entry-wordmark, .entry-edition, .entry-eyebrow, .entry-title, .entry-sub, .entry-thought, .entry-count, #entry-status, .entry-skip-label')];
  const out = sampleText(texts, 3400);
  let minX = innerWidth, maxX = 0;
  out.forEach(p => { minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x); });
  out.forEach(p => {
    p.d = (p.x - minX) / Math.max(1, maxX - minX) * 520 + Math.random() * 180;
    p.lx = (Math.random() - .5) * 40; p.ly = -14 - Math.random() * 34;
    const a = Math.atan2(p.y - cy, p.x - cx) + .9 + Math.random() * .5;
    p.tx = cx + Math.cos(a) * R0; p.ty = cy + Math.sin(a) * R0; p.b = (Math.random() < .5 ? -1 : 1) * (60 + Math.random() * 120);
    p.pal = palette(p.c, false); p.glow = Math.random() < .45;
  });
  const heroTitle = document.querySelector('.hero-intro h1, .mobile-home__title');
  let into = [];
  if (heroTitle) {
    into = sampleText([heroTitle], 3200);
    let hx0 = innerWidth, hx1 = 0;
    into.forEach(p => { hx0 = Math.min(hx0, p.x); hx1 = Math.max(hx1, p.x); });
    into.forEach(p => {
      const a = Math.random() * Math.PI * 2; p.sx = cx + Math.cos(a) * R0; p.sy = cy + Math.sin(a) * R0;
      p.d = (p.x - hx0) / Math.max(1, hx1 - hx0) * 520 + Math.random() * 180;
      [p.mx, p.my] = bend(p.sx, p.sy, p.x, p.y, (Math.random() < .5 ? -1 : 1) * (40 + Math.random() * 110));
      p.pal = palette(p.c, true); p.glow = Math.random() < .45;
    });
  }
  // Pre-warm: a half-pixel hole makes the browser prepare the clip and raster the hero now, not when the lens opens.
  const W = innerWidth, H = innerHeight;
  node.querySelector('.entry-stage').style.clipPath = `path(evenodd, "M0 0H${W}V${H}H0Z M${cx - .5} ${cy} L${cx} ${cy - .5} L${cx + .5} ${cy} L${cx} ${cy + .5} Z")`;
  return { cx, cy, R0, out, into, heroTitle };
}

// ---- exit: letters turn to stardust and feed the circle; the circle opens as a lens onto the site;
//      the stardust leaves the ring again and condenses into the hero title ------------------------------
const EXIT = { lens: [1150, 2000], open: [2000, 3000], leave: [2100, 3000], travel: [1450, 2950], heroDust: [1700, 3450] };
const OUT_LIFT = 380, OUT_TRAVEL = 1100, IN_TRAVEL = 1300;
function playExit(node, prep, onOpen, onDone) {
  const W = innerWidth, H = innerHeight;
  const { cx, cy, R0, out, into, heroTitle } = prep || prepareStardust(node);
  const stage = node.querySelector('.entry-stage'), circle = node.querySelector('.entry-circle'), guardian = node.querySelector('.entry-guardian');
  const maxR = Math.hypot(Math.max(cx, W - cx), Math.max(cy, H - cy)) * 1.08;
  const thread = node.querySelector('.entry-thread'), poly = thread.querySelector('polygon');
  thread.setAttribute('viewBox', `0 0 ${W} ${H}`);
  circle.style.transformOrigin = '50% 50%';
  node.classList.add('is-dissolving');
  if (heroTitle) { heroTitle.style.webkitMaskImage = heroTitle.style.maskImage = 'linear-gradient(90deg, #000 -40%, transparent -8%)'; }
  const dust = document.createElement('canvas');
  dust.setAttribute('aria-hidden', 'true');
  Object.assign(dust.style, { position: 'fixed', inset: '0', width: '100%', height: '100%', zIndex: '30001', pointerEvents: 'none' });
  dust.width = W; dust.height = H;                  // 1× is plenty for sparks, and halves the fill cost on retina
  document.body.appendChild(dust);
  const dg = dust.getContext('2d'), sprite = glowSprite();
  // Phones: the hero shows the same portrait, so she travels into it (object-fit: cover, 30 % from the top).
  const heroArt = document.querySelector('.mobile-home__art-img');
  let travel = null;
  if (heroArt && heroArt.getClientRects().length) {
    const box = heroArt.getBoundingClientRect(), g0 = guardian.getBoundingClientRect(), sc = Math.max(box.width / 1280, box.height / 1281);
    travel = { dx: box.left + (box.width - 1280 * sc) / 2 - g0.left, dy: box.top + (box.height - 1281 * sc) * .3 - g0.top, s: 1280 * sc / g0.width };
    guardian.style.transformOrigin = '0 0';
  }
  const glowX = new Float32Array(out.length + into.length), glowY = new Float32Array(out.length + into.length), glowA = new Float32Array(out.length + into.length);
  let opened = false, loaderDone = false, shown = 0, frame = 0;
  const END = EXIT.heroDust[1] + 700;
  const t0 = performance.now();
  const tick = now => {
    const ms = now - t0, s = ms / 1000;
    dg.setTransform(1, 0, 0, 1, 0, 0); dg.clearRect(0, 0, W, H);
    let ng = 0, absorbed = 0;
    // stardust out: lift, then spiral onto the ring; the ring brightens as it drinks it in
    for (const p of out) {
      const u = ms - p.d;
      if (u < 0) { dg.globalAlpha = 1; dg.fillStyle = p.pal[0]; dg.fillRect(p.x, p.y, 2, 2); continue; }
      const lift = OUTQ(clamp(u / OUT_LIFT)), k = IO(clamp((u - OUT_LIFT * .6) / OUT_TRAVEL));
      if (k >= 1) { absorbed++; continue; }
      const bx = p.x + p.lx * lift, by = p.y + p.ly * lift, [mx, my] = bend(bx, by, p.tx, p.ty, p.b);
      const x = quad(bx, mx, p.tx, k), y = quad(by, my, p.ty, k), mix = Math.min(1, lift * .6 + k), a = 1 - clamp((k - .8) / .2), sz = lerp(2, 1.4, k);
      dg.globalAlpha = a; dg.fillStyle = p.pal[mix < .33 ? 0 : mix < .7 ? 1 : 2]; dg.fillRect(x, y, sz, sz);
      if (p.glow && lift > .2) { glowX[ng] = x; glowY[ng] = y; glowA[ng++] = a * .55; }
    }
    node.style.setProperty('--ring-charge', (absorbed / Math.max(1, out.length)).toFixed(3));
    // stardust in: from the ring to the hero title's glyphs, then the real text takes over
    if (heroTitle && ms > EXIT.heroDust[0]) {
      // The real title is revealed left to right on the same front as the dust (arrival time depends on x),
      // with a wide feather; each grain dissolves into its letter over the last stretch of its flight.
      const front = (ms - EXIT.heroDust[0] - IN_TRAVEL * .82) / (520 + 180), feather = .32;
      const pos = clamp(front, -feather, 1 + feather) * 100, fw = feather * 100;
      const mask = front >= 1 + feather ? '' : `linear-gradient(90deg, #000 ${pos - fw}%, transparent ${pos}%)`;
      heroTitle.style.webkitMaskImage = heroTitle.style.maskImage = mask;
      heroTitle.style.visibility = '';
      for (const p of into) {
        const u = ms - EXIT.heroDust[0] - p.d;
        if (u < 0) continue;
        const k = IO(clamp(u / IN_TRAVEL));
        if (k >= 1) continue;
        const x = quad(p.sx, p.mx, p.x, k), y = quad(p.sy, p.my, p.y, k), mix = clamp((k - .6) / .4), sz = lerp(2, 1.5, k);
        dg.globalAlpha = Math.min(1, u / 160) * (1 - clamp((k - .72) / .28)); dg.fillStyle = p.pal[mix < .33 ? 0 : mix < .7 ? 1 : 2]; dg.fillRect(x, y, sz, sz);
        if (p.glow && k < .9) { glowX[ng] = x; glowY[ng] = y; glowA[ng++] = .5 * (1 - k); }
      }
    }
    // all halos in one additive pass (no per-particle state switching)
    dg.globalCompositeOperation = 'lighter';
    for (let i = 0; i < ng; i++) { dg.globalAlpha = glowA[i]; dg.drawImage(sprite, glowX[i] - 4, glowY[i] - 4, 8, 8); }
    dg.globalCompositeOperation = 'source-over'; dg.globalAlpha = 1;
    // the lens, then the opening
    if (!loaderDone) {
      const lens = IO(seg(ms, ...EXIT.lens)), open = IO(seg(ms, ...EXIT.open));
      if (lens > 0 && !opened) { opened = true; onOpen(); node.classList.add('is-opening'); }
      const R = open > 0 ? lerp(R0, maxR, open) : R0 * lens;
      const amp = open > 0 ? Math.sin(Math.PI * open) * 44 : Math.sin(Math.PI * lens) * Math.min(14, R * .1);
      if (lens > 0) {
        const hole = ripple(cx, cy, R, amp, s);
        stage.style.clipPath = `path(evenodd, "M0 0H${W}V${H}H0Z M${hole.map(p => p.map(v => v.toFixed(1)).join(' ')).join(' L')} Z")`;
        thread.style.visibility = 'visible';
        poly.setAttribute('points', hole.map(p => p.map(v => v.toFixed(1)).join(',')).join(' '));
      }
      circle.style.transform = `scale(${Math.max(1, R / R0)})`;
      if (travel) {
        const k = IO(seg(ms, ...EXIT.travel));
        guardian.style.transform = `translate(${travel.dx * k}px, ${travel.dy * k}px) scale(${lerp(1, travel.s, k)})`;
      } else guardian.style.transform = `translateY(${IO(seg(ms, ...EXIT.leave)) * 105}vh)`;
      if (ms >= EXIT.open[1]) {
        loaderDone = true;
        const before = heroTitle?.getBoundingClientRect();
        node.hidden = true;                               // the scrollbar gutter returns: the hero may reflow a few px
        const after = heroTitle?.getBoundingClientRect();
        if (before && after && (before.left !== after.left || before.top !== after.top)) {
          const dx = after.left - before.left, dy = after.top - before.top;
          into.forEach(p => { p.x += dx; p.y += dy; p.mx += dx; p.my += dy; });
        }
      }
    }
    if (ms < END) frame = requestAnimationFrame(tick);
    else { if (heroTitle) { heroTitle.style.visibility = ''; heroTitle.style.webkitMaskImage = heroTitle.style.maskImage = ''; } dust.remove(); onDone(); }
  };
  frame = requestAnimationFrame(tick);
  return () => { cancelAnimationFrame(frame); dust.remove(); if (heroTitle) { heroTitle.style.visibility = ''; heroTitle.style.webkitMaskImage = heroTitle.style.maskImage = ''; } };
}

export function SiteEntrance({ isMobile, journal, children }) {
  const { reduced } = useMotionPreferences();
  const [initial] = useState(() => ({ isMobile, journal }));
  const [appReady, setAppReady] = useState(false);
  const [settled, setSettled] = useState(0);
  const [assetCount, setAssetCount] = useState(1);
  const [opening, setOpening] = useState(true);
  const [entering, setEntering] = useState(true);
  const [timedOut, setTimedOut] = useState(false);
  const [filled, setFilled] = useState(false);
  const ready = useCallback(() => setAppReady(true), []);
  const dialog = useRef(null);
  const prep = useRef(null);
  // The loader is painted by index.html; take it over instead of re-rendering it.
  useLayoutEffect(() => { dialog.current = document.getElementById('journey-loader'); }, []);
  const { present } = useTransitionPresence(opening && Boolean(dialog.current ?? document.getElementById('journey-loader')), '--entry-exit-duration');
  useModal(present, dialog, '#site-entry-content');
  const total = assetCount + 1;                                   // assets + the app itself
  const completed = settled + Number(appReady);

  useEffect(() => {
    let cancelled = false;
    const images = initial.journal
      ? ['/assets/images/world-locations/the%20hero%20party%20bridge%20sunlight.webp?v=journal1', '/assets/images/characters/companions%20imgs/frieren.webp?v=journal1']
      : initial.isMobile
        ? ['/assets/images/characters/frieren.webp?v=0264ea1d', '/assets/images/icons/staff-icon.webp?v=75820dad']
        : [innerWidth * Math.min(devicePixelRatio || 1, 2) > 2000 ? '/assets/images/hero-scene/river-2560.webp' : '/assets/images/hero-scene/river-1920.webp', '/assets/images/hero-scene/river-maps.webp'];
    const assets = [...images.map(preloadImage), Promise.all([
      document.fonts.load('300 1em Fraunces'), document.fonts.load('italic 300 1em Fraunces'),
    ])];
    setAssetCount(assets.length);
    const settle = () => { if (!cancelled) setSettled(count => count + 1); };
    assets.forEach(asset => asset.then(settle, settle));
    const timeout = setTimeout(() => setTimedOut(true), 8000);
    return () => { cancelled = true; clearTimeout(timeout); };
  }, [initial]);

  const enter = useCallback(() => {
    if (!appReady) return;
    setOpening(false);
    try { sessionStorage.setItem(SEEN_KEY, 'yes'); } catch { /* Storage is optional. */ }
  }, [appReady]);

  // Leave as soon as the ring is full (plus a short beat), or when the road is slow but the app is ready.
  useEffect(() => {
    if (!appReady) return;
    if (filled) {
      // Sample the stardust during the static beat of the full ring, so the exit never starts with a hitch.
      // The site's arrival styles also switch on here (hidden behind the loader), with their animations delayed
      // to the lens (--arrive), so the style recalculation of the whole page never lands mid-motion.
      const sample = setTimeout(() => { if (!reduced && dialog.current && !prep.current) prep.current = prepareStardust(dialog.current); setEntering(false); }, 60);
      const timer = setTimeout(enter, reduced ? 0 : 420);
      return () => { clearTimeout(sample); clearTimeout(timer); };
    }
    if (timedOut) enter();
  }, [appReady, filled, timedOut, reduced, enter]);
  useEffect(() => { if (present && appReady) getLenis()?.stop(); }, [present, appReady]);

  // Live parts of the static loader.
  const failed = timedOut && !appReady;
  const actions = useRef({});
  actions.current = { enter, failed };
  const progress = useRef({ target: 0 });
  progress.current.target = completed / total;
  useEffect(() => {
    const node = dialog.current;
    if (!node) { setEntering(false); return; }
    const button = node.querySelector('.entry-skip');
    const click = () => (actions.current.failed ? location.reload() : actions.current.enter());
    const key = event => { if (event.key === 'Escape') actions.current.enter(); };
    button.addEventListener('click', click);
    node.addEventListener('keydown', key);
    // Sky: the footer's own night footage, looped at its real speed (paused for reduced motion).
    const video = node.querySelector('.entry-sky-video');
    if (video) { if (reduced) video.pause(); else video.play().catch(() => { /* the poster stays */ }); }
    // Ring + counter follow the real progress, eased so the number never jumps.
    const arc = node.querySelector('.entry-arc'), head = node.querySelector('.entry-arc-head');
    const num = node.querySelector('.entry-count-num'), bar = node.querySelector('.entry-count'), status = node.querySelector('#entry-status');
    const STEPS = ['Opening the grimoire…', 'Gathering the companions…', 'Lighting the stars…', 'Unfolding the map…', 'The journey awaits.'];
    const started = performance.now();
    let shown = 0, last = started, frame = 0, done = false, lastPct = -1;
    const loop = now => {
      const dt = Math.min(100, now - last); last = now;
      const target = progress.current.target;
      shown = reduced ? target : Math.min(target, shown + (target - shown) * (1 - Math.exp(-dt / 260)) + dt * .00004);
      if (target >= 1 && shown > .996) shown = 1;
      const pct = Math.round(shown * 100);
      if (pct !== lastPct) {
        lastPct = pct; num.textContent = String(pct); bar.setAttribute('aria-valuenow', String(pct));
        const step = STEPS[pct >= 100 ? 4 : Math.min(3, Math.floor(pct / 25))];   // the words follow the ring
        if (!actions.current.failed && status.textContent !== step) status.textContent = step;
      }
      arc.setAttribute('stroke-dasharray', `${shown} 1`);
      const a = -Math.PI / 2 + shown * Math.PI * 2;
      head.setAttribute('cx', (420 + Math.cos(a) * 378).toFixed(2)); head.setAttribute('cy', (420 + Math.sin(a) * 378).toFixed(2));
      if (!done && shown === 1 && now - started >= MIN_SHOW_MS) { done = true; node.classList.add('is-complete'); setFilled(true); }
      if (!node.hidden && !(reduced && done)) frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(frame); button.removeEventListener('click', click); node.removeEventListener('keydown', key); };
  }, [reduced]);
  useEffect(() => {
    const node = dialog.current;
    if (!node) return;
    if (failed) node.querySelector('#entry-status').textContent = 'The road is taking a little longer…';
    const button = node.querySelector('.entry-skip');
    button.disabled = !appReady && !failed;
    button.querySelector('.entry-skip-label').textContent = failed ? 'Try again' : 'Enter the journey';
  }, [completed, total, failed, appReady]);

  // Exit: continuous choreography into the hero; reduced motion simply removes the loader.
  useEffect(() => {
    const node = dialog.current;
    if (opening || !node) return;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#f1ead9');
    if (reduced) { node.hidden = true; setEntering(false); return; }
    return playExit(node, prep.current, () => setEntering(false), () => node.querySelector('.entry-sky-video')?.pause());   // no-op if already switched on
  }, [opening, reduced]);

  return <div id="site-entry-content" tabIndex={-1} className="site-entry-content" data-entering={entering}
    inert={present ? '' : undefined} aria-hidden={present ? true : undefined}>
    <EntryBoundary onReady={ready}>
      <Suspense fallback={null}><Mounted onReady={ready}>{children}</Mounted></Suspense>
    </EntryBoundary>
  </div>;
}
