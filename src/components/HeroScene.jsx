import { useEffect, useRef } from 'react';
import { useMotionPreferences } from '../lib/motion';

/**
 * Living painting behind the hero: Fern washing Frieren's hair by the river.
 * One WebGL shader over the graded artwork, driven by painted maps
 * (R foliage sway, G water, B depth, A foreground matte):
 *  - the river flows toward the viewer (flow-map advection, two offset phases, glints riding the current);
 *  - foliage and grass sway with travelling gusts, each plant on its own tempo (near = slower, wider);
 *  - depth parallax on the pointer; Fern's arm rises and falls gently in Frieren's hair.
 * The same shader runs twice: the full scene under the hero text, and only the foreground trees
 * above it (identical pixels, masked), so the title sits between the branches.
 */
const IMG_BIG = '/assets/images/hero-scene/river-2560.webp';
const IMG_SMALL = '/assets/images/hero-scene/river-1920.webp';
const MAPS = '/assets/images/hero-scene/river-maps.webp';
const ARM = '/assets/images/hero-scene/river-fern-arm.png';
const ZOOM = 1, FOCUS = [.495, .5];

const VERT = `attribute vec2 p; void main(){ gl_Position = vec4(p, 0., 1.); }`;
const FRAG = `
precision highp float;
uniform sampler2D uImg, uMap, uArm;
uniform vec2 uRes, uMouse, uFocus;
uniform float uT, uScale, uLayer;
const vec2 IMG = vec2(1920., 1080.);
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3. - 2. * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y); }
// Fern's arm is its own layer (cut from the painting, background rebuilt under it): it pivots at the shoulder,
// so only the arm moves: the hands rise and fall a few pixels in Frieren's hair, nothing else is warped.
const vec4 ARM = vec4(1190., 640., 140., 85.);   // layer rect in image px
const vec2 PIVOT = vec2(1305., 658.);
vec4 armLayer(vec2 P, float t){
  float stroke = sin(t * 2.4) * .8 + sin(t * 4.8 + 1.) * .2;   // a scrubbing rhythm, not a metronome
  float a = stroke * .028, c = cos(a), s = sin(a);   // hands travel ~3 px: reads as washing, reveals almost nothing
  vec2 d = P - PIVOT, q = PIVOT + vec2(c * d.x + s * d.y, -s * d.x + c * d.y);
  vec2 luv = (q - ARM.xy) / ARM.zw;
  if (luv.x < 0. || luv.y < 0. || luv.x > 1. || luv.y > 1.) return vec4(0.);
  return texture2D(uArm, luv);
}
void main(){
  vec2 frag = gl_FragCoord.xy; frag.y = uRes.y - frag.y;
  // cover the frame with a 48 px safety margin, and keep the window inside the painting: nothing is ever sampled
  // outside it (the motion below displaces by less than the margin), so the edges never smear
  float cover = max(uRes.x / (IMG.x - 96.), uRes.y / (IMG.y - 96.)) * uScale;
  vec2 hs = uRes * .5 / cover, c = clamp(uFocus * IMG, hs + 48., IMG - hs - 48.);
  vec2 uv = ((frag - uRes * .5) / cover + c) / IMG;
  vec4 m = texture2D(uMap, uv);
  uv += (m.b - .4) * uMouse * vec2(-16., -10.) / (IMG * cover);          // depth parallax (px on screen)
  vec2 uvStill = uv;
  m = texture2D(uMap, uv);
  float t = uT;
  // wind
  float gust = .55 + .45 * sin(t * .4 - uv.x * 4. + sin(t * .11) * 2.) * (.75 + .25 * noise(vec2(t * .2, uv.y * 3.)));
  float near = smoothstep(.55, 1., m.b), tempo = mix(1., .6, near);
  float sway = (sin(t * 1.8 * tempo + uv.x * 23. + uv.y * 7.) * .55 + sin(t * 3.1 * tempo + uv.x * 49. - uv.y * 17.) * .3
              + (noise(vec2(uv.x * 20. - t * .8, uv.y * 12.)) - .5) * .8) * gust;
  // branches: a slow swing of the whole bough (low frequency, large), grows toward the canopy
  float bough = (sin(t * .85 + uv.x * 5.5 + uv.y * 2.) * .7 + sin(t * 1.35 - uv.x * 3.1) * .3) * gust;
  float canopy = smoothstep(.62, .12, uv.y);
  vec2 wind = vec2(sway, sway * .2 - abs(sway) * .08) * mix(1.3, 4.5, near) + vec2(bough, bough * .35) * canopy * mix(3.2, 5.5, near);
  uv += wind * m.r * (1. - m.g) / IMG;
  // river: the bed drifts toward the viewer (away from the source near the rocks), two phases cross-faded
  vec3 col;
  if (m.g > .01) {
    vec2 flow = normalize(uv - vec2(.56, .63)) * vec2(1., .55);
    float off = noise(uv * 6.) * .6, sp = .45;
    float p0 = fract(t * sp + off), p1 = fract(t * sp + off + .5);
    vec2 rip = (vec2(noise(vec2(uv.x * 26. - t * .9, uv.y * 60. - t * 1.3)), noise(vec2(uv.x * 22. + 3., uv.y * 55. - t * 1.1))) - .5) * vec2(5., 3.) / IMG;
    vec2 d = flow * 14. / IMG * m.g;
    vec2 s0 = uv - d * p0 + rip, s1 = uv - d * p1 + rip;
    // only water may travel: a sample that lands on a stone or the bank falls back to the pixel itself
    float w0 = step(.5, texture2D(uMap, s0).g), w1 = step(.5, texture2D(uMap, s1).g);
    vec3 base = texture2D(uImg, uv).rgb;
    vec3 c0 = mix(base, texture2D(uImg, s0).rgb, w0), c1 = mix(base, texture2D(uImg, s1).rgb, w1);
    vec3 flowing = mix(c0, c1, abs(.5 - p0) * 2.);
    col = mix(base, flowing, m.g);
    // glints riding the current
    vec2 q = uv * IMG - flow * t * 38.;
    float g = smoothstep(.91, .98, noise(q * vec2(.09, .22))) * smoothstep(.5, .75, noise(q * .012 + t * .05));
    col += vec3(.9, 1., 1.) * g * m.g * .38 * smoothstep(.45, .75, dot(col, vec3(.3, .5, .2)));
  } else col = texture2D(uImg, uv).rgb;
  // soft light breathing in the haze
  col += vec3(1., .97, .86) * (1. - m.b) * .025 * (.5 + .5 * sin(t * .5 + uv.x * 3.));
  vec4 al = armLayer(uvStill * IMG, t); col = mix(col, al.rgb, al.a);
  float a = uLayer > .5 ? m.a : 1.;
  gl_FragColor = vec4(col * a, a);
}`;

function compile(gl, type, src) {
  const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
  return s;
}
const loadImage = src => new Promise((ok, ko) => { const i = new Image(); i.onload = () => ok(i); i.onerror = ko; i.src = src; });
// Same cover + zoom + focus maths as the shader, for the still image shown before (and instead of) WebGL.
function frameStill(img, box) {
  const r = box.getBoundingClientRect(), sc = Math.max(r.width / (1920 - 96), r.height / (1080 - 96)) * ZOOM;
  const hx = r.width / 2 / sc, hy = r.height / 2 / sc;
  const cx = Math.min(Math.max(FOCUS[0] * 1920, hx + 48), 1920 - hx - 48), cy = Math.min(Math.max(FOCUS[1] * 1080, hy + 48), 1080 - hy - 48);
  Object.assign(img.style, { width: `${1920 * sc}px`, height: `${1080 * sc}px`, left: `${r.width / 2 - cx * sc}px`, top: `${r.height / 2 - cy * sc}px` });
}

function makeRenderer(cv, layer, img, maps, arm) {
  const gl = cv.getContext('webgl', { antialias: false, premultipliedAlpha: true, alpha: layer === 1, powerPreference: 'high-performance' });
  if (!gl) return null;
  const prog = gl.createProgram();
  gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT)); gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog); gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  [img, maps, arm].forEach((im, i) => {
    gl.activeTexture(gl.TEXTURE0 + i); gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, i ? gl.RGBA : gl.RGB, i ? gl.RGBA : gl.RGB, gl.UNSIGNED_BYTE, im);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  });
  const U = n => gl.getUniformLocation(prog, n);
  gl.uniform1i(U('uImg'), 0); gl.uniform1i(U('uMap'), 1); gl.uniform1i(U('uArm'), 2); gl.uniform1f(U('uLayer'), layer);
  gl.uniform1f(U('uScale'), ZOOM); gl.uniform2f(U('uFocus'), FOCUS[0], FOCUS[1]);
  const uRes = U('uRes'), uT = U('uT'), uMouse = U('uMouse');
  return {
    size(w, h) { cv.width = w; cv.height = h; gl.viewport(0, 0, w, h); },
    draw(t, mx, my) { gl.uniform2f(uRes, cv.width, cv.height); gl.uniform1f(uT, t); gl.uniform2f(uMouse, mx, my); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); gl.drawArrays(gl.TRIANGLES, 0, 3); },
  };
}

export function HeroScene({ foreground }) {
  const wrap = useRef(null), canvas = useRef(null), still = useRef(null);
  const { reduced } = useMotionPreferences();
  useEffect(() => {
    const box = wrap.current, img = still.current, fit = () => frameStill(img, box);
    fit(); const ro = new ResizeObserver(fit); ro.observe(box); return () => ro.disconnect();
  }, []);
  useEffect(() => {
    const box = wrap.current;
    let raf = 0, visible = true, alive = true, cleanup = () => {};
    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    const big = innerWidth * Math.min(devicePixelRatio || 1, 2) > 2000;
    Promise.all([loadImage(big ? IMG_BIG : IMG_SMALL), loadImage(MAPS), loadImage(ARM)]).then(([img, maps, arm]) => {
      if (!alive) return;
      const layers = [makeRenderer(canvas.current, 0, img, maps, arm), foreground?.current && makeRenderer(foreground.current, 1, img, maps, arm)].filter(Boolean);
      if (!layers.length) return;
      const size = () => {
        const dpr = Math.min(devicePixelRatio || 1, 1.5), r = box.getBoundingClientRect();
        layers.forEach(l => l.size(Math.round(r.width * dpr), Math.round(r.height * dpr)));
      };
      size();
      const ro = new ResizeObserver(size); ro.observe(box);
      const t0 = performance.now();
      const loader = document.getElementById('journey-loader');
      let drewOnce = false;
      const draw = now => {
        // While the loader's portal is opening, the scene holds its first frame: the GPU is left to the transition.
        if (drewOnce && loader && !loader.hidden) { raf = requestAnimationFrame(draw); return; }
        drewOnce = true;
        const t = reduced ? 0 : (now - t0) / 1000;
        mouse.x += (mouse.tx - mouse.x) * .05; mouse.y += (mouse.ty - mouse.y) * .05;
        layers.forEach(l => l.draw(t, reduced ? 0 : mouse.x, reduced ? 0 : mouse.y));
        canvas.current.dataset.ready = 'true'; if (foreground?.current) foreground.current.dataset.ready = 'true';
        if (!reduced && visible) raf = requestAnimationFrame(draw);
      };
      const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible && !reduced) { cancelAnimationFrame(raf); raf = requestAnimationFrame(draw); } });
      io.observe(box);
      const move = e => { mouse.tx = (e.clientX / innerWidth - .5) * 2; mouse.ty = (e.clientY / innerHeight - .5) * 2; };
      addEventListener('pointermove', move, { passive: true });
      raf = requestAnimationFrame(draw);
      cleanup = () => { ro.disconnect(); io.disconnect(); removeEventListener('pointermove', move); };
    }).catch(() => { /* the still image stays */ });
    return () => { alive = false; cancelAnimationFrame(raf); cleanup(); };
  }, [reduced, foreground]);

  return <div ref={wrap} className="hero-scene absolute inset-0" aria-hidden="true">
    <img ref={still} className="hero-scene-still" src={IMG_BIG} srcSet={`${IMG_SMALL} 1920w, ${IMG_BIG} 2560w`} sizes="100vw" alt="" fetchpriority="high" decoding="async" />
    <canvas ref={canvas} className="hero-scene-canvas" />
  </div>;
}
