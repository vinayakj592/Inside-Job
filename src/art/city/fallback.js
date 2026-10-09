// No-WebGL fallback: a layered cut-paper skyline (SVG) with CSS rain, and a printed street map
// for the overhead view. Same API as createNoirCity so screens never need to care.
import { rng, palette } from './util.js';
import { hubToWorld, DEFAULT_POS, MAP_W, MAP_D } from './layout.js';

const NS = 'http://www.w3.org/2000/svg';
let styleInjected = false;

function injectStyle() {
  if (styleInjected) return;
  styleInjected = true;
  const s = document.createElement('style');
  s.textContent = `
  .noir-city--paper { position: absolute; inset: 0; overflow: hidden;
    background: radial-gradient(ellipse 70% 50% at 50% 78%, var(--teal-6), transparent 70%), linear-gradient(180deg, var(--ink) 0%, var(--teal-8) 62%, var(--teal-7) 74%, var(--ink) 100%); }
  .noir-city--paper .pc-layer { position: absolute; left: -4%; width: 108%; bottom: 0; transition: transform 2.4s cubic-bezier(.65,0,.35,1), opacity 1.6s; }
  .noir-city--paper .pc-moon { position: absolute; width: 16vh; height: 16vh; border-radius: 50%; left: 56%; top: 9%; background: var(--cream); opacity: .5;
    box-shadow: 0 0 0 3vh rgba(236,226,201,.05), 0 0 0 7vh rgba(236,226,201,.03); }
  .noir-city--paper .pc-rain { position: absolute; inset: -20%; pointer-events: none; opacity: .4;
    background-image: repeating-linear-gradient(100deg, transparent 0 14px, rgba(134,194,184,.35) 14px 15px, transparent 15px 44px);
    background-size: 100% 140px; animation: pc-rain .45s linear infinite; }
  @keyframes pc-rain { to { background-position: -24px 140px; } }
  .noir-city--paper .pc-map { position: absolute; inset: 0; opacity: 0; transition: opacity 1.4s; }
  .noir-city--paper.is-overhead .pc-map { opacity: 1; }
  .noir-city--paper.is-overhead .pc-layer { transform: translateY(40%) scale(1.1); opacity: .25; }
  .noir-city--paper .pc-flash { position: absolute; inset: 0; background: var(--cream); opacity: 0; pointer-events: none; }
  .noir-city--paper .pc-flash.is-on { animation: pc-flash .6s ease-out; }
  @keyframes pc-flash { 0% { opacity: .5; } 12% { opacity: .05; } 22% { opacity: .4; } 100% { opacity: 0; } }
  .noir-city--paper .pc-fade { position: absolute; inset: 0; background: var(--ink); pointer-events: none; transition: opacity 1.4s; }
  @media (prefers-reduced-motion: reduce) { .noir-city--paper .pc-rain { animation: none; } }
  `;
  document.head.append(s);
}

function skyline(r, { base, height, color, windows, tower, seed }) {
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 1600 600');
  svg.setAttribute('preserveAspectRatio', 'xMidYMax slice');
  svg.setAttribute('class', 'pc-layer');
  svg.style.height = height;
  const P = palette();
  let x = 0, d = 'M0 600';
  const wins = [];
  while (x < 1600) {
    const w = 40 + r() * 90;
    const h = base + r() * base * 1.4;
    const y = 600 - h;
    d += ` L${x.toFixed(0)} ${y.toFixed(0)}`;
    if (r() < 0.35) { // setback
      const sx = x + w * 0.2, sw = w * 0.6, sh = h * (0.12 + r() * 0.2);
      d += ` L${sx} ${y} L${sx} ${y - sh} L${sx + sw} ${y - sh} L${sx + sw} ${y}`;
      if (r() < 0.4) d += ` L${sx + sw / 2 - 2} ${y - sh} L${sx + sw / 2} ${y - sh - 40} L${sx + sw / 2 + 2} ${y - sh}`;
    }
    d += ` L${(x + w).toFixed(0)} ${y.toFixed(0)}`;
    if (windows) for (let wy = y + 12; wy < 590; wy += 16) for (let wx = x + 8; wx < x + w - 8; wx += 12) if (r() < windows) wins.push([wx, wy]);
    x += w;
  }
  d += ' L1600 600 Z';
  const path = document.createElementNS(NS, 'path');
  path.setAttribute('d', d);
  path.setAttribute('fill', color);
  svg.append(path);
  if (tower) {
    const t = document.createElementNS(NS, 'path');
    t.setAttribute('d', 'M760 600 L760 190 L772 190 L772 140 L784 140 L784 96 L792 96 L800 0 L808 96 L816 96 L816 140 L828 140 L828 190 L840 190 L840 600 Z');
    t.setAttribute('fill', P['ink-3']);
    t.setAttribute('stroke', P['teal-4']);
    t.setAttribute('stroke-width', '1.5');
    svg.append(t);
    for (let wy = 200; wy < 590; wy += 14) for (let wx = 766; wx < 836; wx += 10) if (r() < 0.14) { const w = document.createElementNS(NS, 'rect'); w.setAttribute('x', wx); w.setAttribute('y', wy); w.setAttribute('width', 4); w.setAttribute('height', 7); w.setAttribute('fill', P.gold); svg.append(w); }
    const crown = document.createElementNS(NS, 'path');
    crown.setAttribute('d', 'M772 190 L828 190 L828 184 L772 184 Z M784 140 L816 140 L816 132 L784 132 Z M788 118 L812 118 L812 112 L788 112 Z M792 100 L808 100 L808 96 L792 96 Z');
    crown.setAttribute('fill', P.gold);
    svg.append(crown);
  }
  for (const [wx, wy] of wins) {
    const rct = document.createElementNS(NS, 'rect');
    rct.setAttribute('x', wx); rct.setAttribute('y', wy); rct.setAttribute('width', 5); rct.setAttribute('height', 7);
    rct.setAttribute('fill', r() < 0.8 ? P.gold : P['gold-hot']);
    rct.setAttribute('opacity', (0.5 + r() * 0.5).toFixed(2));
    svg.append(rct);
  }
  return svg;
}

function streetMap(jobs) {
  const P = palette();
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', 'pc-map');
  svg.setAttribute('viewBox', '0 0 1000 640');
  svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');
  const r = rng(3);
  let s = `<rect width="1000" height="640" fill="${P['teal-9']}"/>`;
  for (let x = 20; x < 1000; x += 64) for (let y = 20; y < 640; y += 56) {
    s += `<rect x="${x}" y="${y}" width="${46 + r() * 4}" height="${38}" fill="${r() < 0.5 ? P['ink-3'] : P['teal-8']}"/>`;
  }
  s += `<rect x="880" y="0" width="120" height="640" fill="${P.ink}"/>`;
  svg.innerHTML = s;
  return svg;
}

export function createFallbackCity(el, { jobs = [] } = {}) {
  injectStyle();
  const r = rng(11);
  const P = palette();
  el.append(Object.assign(document.createElement('div'), { className: 'pc-moon' }));
  el.append(streetMap(jobs));
  el.append(skyline(r, { base: 140, height: '78%', color: P['teal-6'], windows: 0.03 }));
  el.append(skyline(r, { base: 110, height: '70%', color: P['teal-8'], windows: 0.05, tower: true }));
  el.append(skyline(r, { base: 60, height: '48%', color: P['ink-2'], windows: 0.08 }));
  el.append(Object.assign(document.createElement('div'), { className: 'pc-rain' }));
  const flashEl = Object.assign(document.createElement('div'), { className: 'pc-flash' });
  const fadeEl = Object.assign(document.createElement('div'), { className: 'pc-fade' });
  fadeEl.style.opacity = '0';
  el.append(flashEl, fadeEl);
  let mode = 'street', focus = null;
  const pos = (id) => {
    const j = jobs.find((x) => x.id === id);
    const p = j?.hubPos || DEFAULT_POS[id];
    return p || { x: 0.5, y: 0.5 };
  };
  const frameFns = new Set();
  let raf = 0;
  const loop = (t) => { raf = requestAnimationFrame(loop); frameFns.forEach((fn) => fn(t / 1000)); };
  raf = requestAnimationFrame(loop);
  const timer = setInterval(() => { if (Math.random() < 0.3) api.flash(); }, 9000);
  const api = {
    kind: 'paper',
    get mode() { return mode; },
    setMode(m) { mode = m; focus = null; el.classList.toggle('is-overhead', m === 'overhead'); },
    flyTo(id) { focus = id; },
    clearFocus() { focus = null; },
    get focus() { return focus; },
    setHighlights() {},
    setHeat() {},
    pointerParallax() {},
    projectJob(id) {
      const w = el.clientWidth, h = el.clientHeight;
      if (mode === 'street') return { x: w / 2, y: h * 0.2, visible: id === 'tower' };
      const p = pos(id);
      const wp = hubToWorld(p);
      return { x: (0.08 + ((wp.x + MAP_W / 2) / MAP_W) * 0.84) * w, y: (0.14 + ((wp.z + MAP_D / 2) / MAP_D) * 0.76) * h, visible: true };
    },
    projectPoint() { return { x: 0, y: 0, visible: false }; },
    landmark() { return null; },
    async snapshot() { return null; },
    setFade(v) { fadeEl.style.opacity = String(1 - v); },
    flash() { flashEl.classList.remove('is-on'); void flashEl.offsetWidth; flashEl.classList.add('is-on'); },
    onFrame(fn) { frameFns.add(fn); return () => frameFns.delete(fn); },
    setQuality() {},
    resize() {},
    pause() {},
    resume() {},
    dispose() { cancelAnimationFrame(raf); clearInterval(timer); frameFns.clear(); el.innerHTML = ''; },
  };
  return api;
}
