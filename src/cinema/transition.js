// THE SIGNATURE TRANSITION: blueprint → noir.
//   blueprintToNoir(svgEl, { focus: {x, y}, route: [[x,y],…] }) → Promise<void>
//     Coordinates are blueprint user space (1200 × 760). Over the live planning screen:
//       1. the chosen route draws itself in yellow grease pencil, the linework surges;
//       2. the camera pushes toward the focus point;
//       3. the cyan lines THICKEN and BLEED into black ink (a live SVG filter on the blueprint),
//          keeping a hairline gold core: cyan-on-blue flips to gold-on-black;
//       4. halftone dots bloom out from the focus and swallow everything, a gold dot-front leading;
//       5. hard flash, panel gutters slam in; the screen is ink. Resolves, leaving `.ink-cover`.
//   removeInkCover() → the cinema calls it once its first page is on screen.
//   inkOut() → Promise: quick halftone flood to ink (used before swapping screens).
//   noirToBlueprint() → reverse, after the table is mounted under the ink: cyan grid draws over the ink,
//     then the ink breaks into shrinking dots and the blueprint shows through.
import './transition.css';
import { sfx, duck } from '../core/audio.js';
import { reducedMotion, sleep } from '../core/dom.js';

const FX = () => document.getElementById('fx-layer');
const INK = '#07090b', GOLD = '#f2a93b', GOLD_HOT = '#ffcf5a', GREASE = '#ffd23f', CYAN = '#56d9ff', LINE = '#cdf3ff';
const TWO = 1000 / 12; // animate on twos

const ease = { in: (t) => t * t * t, out: (t) => 1 - Math.pow(1 - t, 3), io: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2) };
const clamp01 = (v) => Math.max(0, Math.min(1, v));
const seg = (t, a, b) => clamp01((t - a) / (b - a));

function toScreen(svgEl, x, y) {
  try {
    const m = svgEl.getScreenCTM();
    if (m) { const p = new DOMPoint(x, y).matrixTransform(m); return [p.x, p.y]; }
  } catch { /* fall through */ }
  const r = svgEl?.getBoundingClientRect?.() || { left: 0, top: 0, width: innerWidth, height: innerHeight };
  return [r.left + (x / 1200) * r.width, r.top + (y / 760) * r.height];
}

/** A little hand wobble so the route looks drawn, not plotted. */
function wobblePath(pts) {
  if (pts.length < 2) return '';
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
    const L = Math.hypot(x1 - x0, y1 - y0);
    const nx = -(y1 - y0) / (L || 1), ny = (x1 - x0) / (L || 1);
    const bow = Math.min(18, L * 0.06) * (i % 2 ? 1 : -1);
    const mx = (x0 + x1) / 2 + nx * bow, my = (y0 + y1) / 2 + ny * bow;
    d += ` Q${mx.toFixed(1)},${my.toFixed(1)} ${x1.toFixed(1)},${y1.toFixed(1)}`;
  }
  return d;
}

function loopAround([x, y], r) {
  let d = '';
  const n = 22;
  for (let i = 0; i <= n; i++) {
    const t = (i / n) * Math.PI * 2 * 1.15 - 0.6;
    const rr = r * (1 + Math.sin(i * 1.7) * 0.06);
    const px = x + Math.cos(t) * rr * 1.25, py = y + Math.sin(t) * rr + i * 0.4;
    d += (i ? 'L' : 'M') + px.toFixed(1) + ',' + py.toFixed(1);
  }
  return d;
}

/* ------------------------------------------------------------------ */
/* The ink-bleed filter, animated by attribute on twos.                */
/* ------------------------------------------------------------------ */
function makeFilter(id) {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('class', 'ij-tx__defs');
  svg.setAttribute('width', '0');
  svg.setAttribute('height', '0');
  svg.innerHTML = `<defs><filter id="${id}" x="-5%" y="-5%" width="110%" height="110%" color-interpolation-filters="sRGB">
    <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1.1 1.1 1.1 0 -1.25" result="lines"/>
    <feMorphology in="lines" operator="dilate" radius="0" result="fat" data-k="dilate"/>
    <feTurbulence type="fractalNoise" baseFrequency="0.028" numOctaves="2" seed="7" result="noise"/>
    <feDisplacementMap in="fat" in2="noise" scale="0" xChannelSelector="R" yChannelSelector="G" result="bled" data-k="disp"/>
    <feGaussianBlur in="bled" stdDeviation="0" result="soft" data-k="blur"/>
    <feComponentTransfer in="soft" result="inkmask"><feFuncA type="discrete" tableValues="0 0 1 1 1"/></feComponentTransfer>
    <feFlood flood-color="${INK}" result="inkc"/>
    <feComposite in="inkc" in2="inkmask" operator="in" result="ink"/>
    <feFlood flood-color="${GOLD_HOT}" flood-opacity="0" result="goldc" data-k="gold"/>
    <feComposite in="goldc" in2="lines" operator="in" result="goldlines"/>
    <feComponentTransfer in="SourceGraphic" result="paper"><feFuncR type="linear" slope="1" data-k="pr"/><feFuncG type="linear" slope="1" data-k="pg"/><feFuncB type="linear" slope="1" data-k="pb"/></feComponentTransfer>
    <feMerge><feMergeNode in="paper"/><feMergeNode in="ink"/><feMergeNode in="goldlines"/></feMerge>
  </filter></defs>`;
  const q = (k) => svg.querySelector(`[data-k="${k}"]`);
  return {
    svg,
    set(t) { // t: 0..1 bleed amount
      q('dilate').setAttribute('radius', (Math.sqrt(t) * 7.5).toFixed(2));
      q('disp').setAttribute('scale', (Math.sqrt(t) * 26).toFixed(1));
      q('blur').setAttribute('stdDeviation', (t * 3.2).toFixed(2));
      q('gold').setAttribute('flood-opacity', seg(t, 0.35, 0.8).toFixed(2));
      const slope = (1 - 0.72 * t).toFixed(3);
      ['pr', 'pg', 'pb'].forEach((k, i) => q(k).setAttribute('slope', i === 2 ? (1 - 0.85 * t).toFixed(3) : slope));
    },
  };
}

/* ------------------------------------------------------------------ */
/* Halftone bloom on a canvas: dots swell from the focus outward.      */
/* ------------------------------------------------------------------ */
function bloom(canvas, focus, { dur = 900, spread = 620, reverse = false, step = 15, goldFront = true } = {}) {
  const dpr = Math.min(2, devicePixelRatio || 1);
  const W = innerWidth, H = innerHeight;
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  const g = canvas.getContext('2d');
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  const D = Math.max(...[[0, 0], [W, 0], [0, H], [W, H]].map(([x, y]) => Math.hypot(x - focus[0], y - focus[1])));
  const maxR = step * 0.76;
  const grow = Math.max(120, dur - spread);
  const ang = Math.PI / 4, ca = Math.cos(ang), sa = Math.sin(ang);
  const R0 = Math.hypot(W, H);
  const dots = [];
  for (let v = -R0; v <= R0; v += step) for (let u = -R0; u <= R0; u += step) {
    const x = W / 2 + u * ca - v * sa, y = H / 2 + u * sa + v * ca;
    if (x < -step || y < -step || x > W + step || y > H + step) continue;
    dots.push([x, y, (Math.hypot(x - focus[0], y - focus[1]) / D) * spread]);
  }
  return (t) => { // t in ms since start; returns true when complete
    g.clearRect(0, 0, W, H);
    let done = true;
    g.fillStyle = INK;
    g.beginPath();
    const gold = [];
    for (const [x, y, delay] of dots) {
      let k = clamp01((t - delay) / grow);
      if (reverse) k = 1 - k;
      if (k < 1) done = false;
      if (k <= 0) continue;
      const r = maxR * ease.out(k);
      if (goldFront && k < 0.45 && !reverse) { gold.push(x, y, r * 0.9); continue; }
      g.moveTo(x + r, y);
      g.arc(x, y, r, 0, Math.PI * 2);
    }
    g.fill();
    if (gold.length) {
      g.fillStyle = GOLD;
      g.beginPath();
      for (let i = 0; i < gold.length; i += 3) { g.moveTo(gold[i] + gold[i + 2], gold[i + 1]); g.arc(gold[i], gold[i + 1], gold[i + 2], 0, Math.PI * 2); }
      g.fill();
    }
    if (done && !reverse) { g.fillStyle = INK; g.fillRect(0, 0, W, H); }
    return done;
  };
}

function frameLoop(fn) {
  return new Promise((res) => {
    const t0 = performance.now();
    let last = -1;
    const tick = (now) => {
      // dev hooks: window.__txFreeze = ms holds the frame (for screenshots); __txTimeScale slows time
      let t = (now - t0) * (window.__txTimeScale ?? 1);
      if (window.__txFreeze != null) t = Math.min(t, window.__txFreeze);
      const stepT = Math.floor(t / TWO);
      let done = false;
      if (stepT !== last) { last = stepT; done = fn(stepT * TWO, t); } // on twos
      if (done && window.__txFreeze == null) return res();
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

function makeCover() {
  const cover = document.createElement('div');
  cover.className = 'ink-cover';
  // safety net: if no screen ever claims the cover (an error, a dropped navigation), lift it anyway
  setTimeout(() => { if (cover.isConnected) removeInkCover(); }, 9000);
  return cover;
}

/* ------------------------------------------------------------------ */
export async function blueprintToNoir(svgEl, { focus, route } = {}) {
  const fx = FX();
  const stage = document.getElementById('stage');
  const fast = reducedMotion();
  const fp = focus && svgEl ? toScreen(svgEl, focus.x, focus.y) : [innerWidth / 2, innerHeight / 2];
  const pts = (route || []).map(([x, y]) => (svgEl ? toScreen(svgEl, x, y) : [x, y]));

  if (fast) {
    const cover = makeCover();
    fx.append(cover);
    await sleep(120);
    return;
  }

  duck(0.3);
  const root = document.createElement('div');
  root.className = 'ij-tx';
  const zoom = document.createElement('div');
  zoom.className = 'ij-tx__zoom';
  const ns = 'http://www.w3.org/2000/svg';
  const rsvg = document.createElementNS(ns, 'svg');
  rsvg.setAttribute('class', 'ij-tx__route');
  rsvg.setAttribute('viewBox', `0 0 ${innerWidth} ${innerHeight}`);
  const rd = wobblePath(pts.length > 1 ? pts : [[fp[0] - 200, fp[1] + 120], fp]);
  const last = pts[pts.length - 1] || fp;
  const prev = pts[pts.length - 2] || [last[0] - 100, last[1] + 60];
  const a = Math.atan2(last[1] - prev[1], last[0] - prev[0]);
  const ah = (s) => `M${(last[0] - Math.cos(a - 0.45) * s).toFixed(1)},${(last[1] - Math.sin(a - 0.45) * s).toFixed(1)}L${last[0].toFixed(1)},${last[1].toFixed(1)}L${(last[0] - Math.cos(a + 0.45) * s).toFixed(1)},${(last[1] - Math.sin(a + 0.45) * s).toFixed(1)}`;
  rsvg.innerHTML = `
    <path class="ij-tx__halo" d="${rd}" pathLength="1"/>
    <path class="ij-tx__grease" d="${rd}" pathLength="1"/>
    <path class="ij-tx__grease ij-tx__grease--head" d="${ah(22)}" pathLength="1"/>
    <path class="ij-tx__grease ij-tx__grease--loop" d="${loopAround(fp, 46)}" pathLength="1"/>`;
  zoom.append(rsvg);
  const canvas = document.createElement('canvas');
  canvas.className = 'ij-tx__dots';
  const flash = document.createElement('div');
  flash.className = 'ij-tx__flash';
  root.append(zoom, canvas, flash);
  fx.append(root);

  const filterId = 'ij-inkbleed-' + Math.random().toString(36).slice(2, 7);
  const filt = makeFilter(filterId);
  root.append(filt.svg);
  const prevFilter = svgEl?.style.filter || '';
  const prevStage = { transform: stage.style.transform, origin: stage.style.transformOrigin, transition: stage.style.transition };
  const origin = `${fp[0].toFixed(1)}px ${fp[1].toFixed(1)}px`;
  stage.style.transformOrigin = origin;
  zoom.style.transformOrigin = origin;
  const draw = bloom(canvas, fp, { dur: 1050, spread: 700, step: Math.max(12, Math.round(Math.min(innerWidth, innerHeight) / 58)) });

  sfx('reveal');
  root.classList.add('is-drawing');
  let surged = false, whooshed = false;
  const T_ZOOM0 = 250, T_ZOOM1 = 1500, T_INK0 = 620, T_INK1 = 1450, T_DOT0 = 980, T_FLASH = 2030;
  await frameLoop((t) => {
    // 1. surge: linework brightens and glows
    if (!surged && svgEl) { surged = true; svgEl.style.filter = 'brightness(1.5) saturate(1.35) drop-shadow(0 0 5px rgba(86,217,255,.9))'; }
    // 2. push-in toward the focus
    const z = 1 + 0.55 * ease.in(seg(t, T_ZOOM0, T_ZOOM1)) + 0.04 * seg(t, 0, T_ZOOM0);
    const tf = `scale(${z.toFixed(4)}) rotate(${(-1.2 * ease.in(seg(t, T_ZOOM0, T_ZOOM1))).toFixed(3)}deg)`;
    stage.style.transform = tf;
    zoom.style.transform = tf;
    // 3. ink bleed: the blueprint's own lines swell into black ink with a gold core
    const k = ease.io(seg(t, T_INK0, T_INK1));
    if (svgEl && t >= T_INK0) {
      if (svgEl.style.filter.indexOf(filterId) < 0) svgEl.style.filter = `url(#${filterId})`;
      filt.set(k);
    }
    if (t >= T_INK0 && !whooshed) { whooshed = true; sfx('whoosh'); root.classList.add('is-inking'); }
    // 4. halftone bloom from the focus
    if (t >= T_DOT0) draw(t - T_DOT0);
    return t >= T_FLASH;
  });
  // 5. flash + gutters slam; the screen is ink underneath
  const cover = makeCover();
  cover.innerHTML = `<svg class="ink-cover__gutters" viewBox="0 0 100 100" preserveAspectRatio="none">
      <polygon class="p" points="3.5,4.5 57,4 55,95 3.2,95.5"/><polygon class="p" points="59.5,4 96.8,4.6 96.5,48 58.4,49.5"/><polygon class="p" points="58.2,52 96.5,50.6 96.9,95.3 57.5,95"/>
      <polygon class="k" points="3.5,4.5 57,4 55,95 3.2,95.5"/><polygon class="k" points="59.5,4 96.8,4.6 96.5,48 58.4,49.5"/><polygon class="k" points="58.2,52 96.5,50.6 96.9,95.3 57.5,95"/></svg>`;
  fx.append(cover);
  flash.classList.add('is-on');
  sfx('slam');
  // restore the table underneath (it is hidden by ink now)
  stage.style.transform = prevStage.transform;
  stage.style.transformOrigin = prevStage.origin;
  if (svgEl) svgEl.style.filter = prevFilter;
  cover.classList.add('is-slam');
  await sleep(260);
  root.remove();
  await sleep(140);
}

export function removeInkCover() {
  document.querySelectorAll('#fx-layer .ink-cover').forEach((el) => {
    if (el.classList.contains('is-leaving')) return;
    el.classList.add('is-leaving');
    setTimeout(() => el.remove(), 520);
  });
}

/** Quick halftone flood to ink (e.g. before swapping screens). Leaves `.ink-cover`. */
export async function inkOut({ focus } = {}) {
  const fx = FX();
  if (reducedMotion()) { fx.append(makeCover()); return; }
  const root = document.createElement('div');
  root.className = 'ij-tx';
  const canvas = document.createElement('canvas');
  canvas.className = 'ij-tx__dots';
  root.append(canvas);
  fx.append(root);
  const fp = focus || [innerWidth / 2, innerHeight / 2];
  const draw = bloom(canvas, fp, { dur: 560, spread: 380, goldFront: true });
  sfx('whoosh');
  await frameLoop((t) => draw(t));
  fx.append(makeCover());
  root.remove();
}

/** Reverse: the table is already mounted beneath the ink. Blueprint grid draws on the ink, then the ink breaks up. */
export async function noirToBlueprint() {
  const fx = FX();
  fx.querySelectorAll('.ink-cover').forEach((el) => el.remove());
  if (reducedMotion()) return;
  const root = document.createElement('div');
  root.className = 'ij-tx ij-tx--rev';
  const canvas = document.createElement('canvas');
  canvas.className = 'ij-tx__dots';
  const grid = document.createElement('canvas');
  grid.className = 'ij-tx__grid';
  root.append(canvas, grid);
  fx.append(root);
  const W = innerWidth, H = innerHeight;
  const dpr = Math.min(2, devicePixelRatio || 1);
  grid.width = W * dpr; grid.height = H * dpr;
  const gg = grid.getContext('2d');
  gg.setTransform(dpr, 0, 0, dpr, 0, 0);
  const fp = [W / 2, H / 2];
  const draw = bloom(canvas, fp, { dur: 820, spread: 520, reverse: true, goldFront: false });
  draw(0);
  sfx('reveal');
  await frameLoop((t) => {
    // cyan drafting lines race across the ink (major grid every 100px)
    const k = ease.out(seg(t, 0, 380));
    gg.clearRect(0, 0, W, H);
    gg.strokeStyle = CYAN; gg.lineWidth = 1.2; gg.shadowColor = CYAN; gg.shadowBlur = 8;
    gg.globalAlpha = 1 - seg(t, 520, 900);
    gg.beginPath();
    for (let x = 0; x <= W; x += 100) { gg.moveTo(x, 0); gg.lineTo(x, H * k); }
    for (let y = 0; y <= H; y += 100) { gg.moveTo(0, y); gg.lineTo(W * k, y); }
    gg.stroke();
    gg.strokeStyle = LINE; gg.lineWidth = 2.5;
    gg.beginPath(); gg.moveTo(fp[0] - 260 * k, fp[1]); gg.lineTo(fp[0] + 260 * k, fp[1]); gg.moveTo(fp[0], fp[1] - 160 * k); gg.lineTo(fp[0], fp[1] + 160 * k); gg.stroke();
    const done = t > 300 ? draw(t - 300) : false;
    return done && t > 900;
  });
  root.remove();
}

export { GREASE };
