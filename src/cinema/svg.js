// Low-level SVG helpers for the procedural comic art.
// Palette mirrors src/styles/tokens.css (SVG presentation attributes cannot read CSS variables,
// so the art keeps one JS copy here; keep it in sync with the tokens).

export const C = {
  ink: '#07090b', ink2: '#0d1316', ink3: '#141d21', ink4: '#1f2b30',
  t9: '#031417', t8: '#061f23', t7: '#0a2b30', t6: '#0d3a40', t5: '#114a51', t4: '#176068', t3: '#20787d', t2: '#3b9391', t1: '#86c2b8',
  gold: '#f2a93b', goldHot: '#ffcf5a', goldDeep: '#a8661a', goldPale: '#ffe6a6',
  cream: '#ece2c9', cream2: '#d7cbb0', creamDim: '#9d927c',
  manila: '#d6b476', manila2: '#c09a58', manilaDeep: '#8a6a33',
  alarm: '#d8412f', alarmDeep: '#6e1a12',
};

export const NS = 'http://www.w3.org/2000/svg';

/** Deterministic PRNG (mulberry32). rng() → [0,1). Helpers hang off it. */
export function rng(seed = 1) {
  let a = typeof seed === 'string' ? hash(seed) : seed >>> 0;
  const r = () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  r.range = (lo, hi) => lo + r() * (hi - lo);
  r.int = (lo, hi) => Math.floor(r.range(lo, hi + 1));
  r.pick = (arr) => arr[Math.floor(r() * arr.length)];
  r.chance = (p) => r() < p;
  r.jit = (v) => (r() - 0.5) * 2 * v;
  return r;
}
export function hash(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

/** Compact number for path data. */
export const n = (v) => (Math.round(v * 10) / 10).toString();

/** Polygon points → path "M…Z". */
export const poly = (pts) => 'M' + pts.map((p) => n(p[0]) + ',' + n(p[1])).join('L') + 'Z';
export const line = (pts) => 'M' + pts.map((p) => n(p[0]) + ',' + n(p[1])).join('L');
/** Smooth path through points (Catmull-Rom → cubic). closed? */
export function smooth(pts, closed = false, k = 0.5) {
  const P = closed ? [pts[pts.length - 1], ...pts, pts[0], pts[1]] : [pts[0], ...pts, pts[pts.length - 1]];
  let d = `M${n(P[1][0])},${n(P[1][1])}`;
  for (let i = 1; i < P.length - 2; i++) {
    const [p0, p1, p2, p3] = [P[i - 1], P[i], P[i + 1], P[i + 2]];
    const c1 = [p1[0] + ((p2[0] - p0[0]) / 6) * k * 2, p1[1] + ((p2[1] - p0[1]) / 6) * k * 2];
    const c2 = [p2[0] - ((p3[0] - p1[0]) / 6) * k * 2, p2[1] - ((p3[1] - p1[1]) / 6) * k * 2];
    d += `C${n(c1[0])},${n(c1[1])} ${n(c2[0])},${n(c2[1])} ${n(p2[0])},${n(p2[1])}`;
  }
  return closed ? d + 'Z' : d;
}
export const circ = (cx, cy, r) => `M${n(cx - r)},${n(cy)}a${n(r)},${n(r)} 0 1,0 ${n(2 * r)},0a${n(r)},${n(r)} 0 1,0 ${n(-2 * r)},0`;

/** Attribute object → string. */
export function at(o) {
  let s = '';
  for (const k in o) if (o[k] != null && o[k] !== false) s += ` ${k}="${o[k]}"`;
  return s;
}
export const P = (d, o = {}) => `<path d="${d}"${at(o)}/>`;
export const R = (x, y, w, h, o = {}) => `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}"${at(o)}/>`;
export const G = (inner, o = {}) => `<g${at(o)}>${inner}</g>`;
export const T = (x, y, txt, o = {}) => `<text x="${n(x)}" y="${n(y)}"${at(o)}>${esc(txt)}</text>`;
export const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[m]);

/**
 * Halftone field: one <path> of dots on a rotated grid. rFn(x, y) → radius (0 = no dot).
 * Real halftone: the dot SIZE carries the tone, which is what makes it read as print.
 */
export function halftone({ x = 0, y = 0, w, h, step = 9, angle = 45, rFn, fill = C.ink, opacity = 1, clip, max = 9000, cls }) {
  const a = (angle * Math.PI) / 180, ca = Math.cos(a), sa = Math.sin(a);
  const cx = x + w / 2, cy = y + h / 2;
  const R0 = Math.hypot(w, h) / 2 + step;
  let d = '';
  let count = 0;
  for (let v = -R0; v <= R0; v += step) {
    for (let u = -R0; u <= R0; u += step) {
      const px = cx + u * ca - v * sa, py = cy + u * sa + v * ca;
      if (px < x - step || px > x + w + step || py < y - step || py > y + h + step) continue;
      const r = rFn(px, py);
      if (r < 0.35) continue;
      d += circ(px, py, Math.min(r, step * 0.75));
      if (++count > max) break;
    }
    if (count > max) break;
  }
  return d ? `<path d="${d}" fill="${fill}"${at({ opacity: opacity !== 1 ? opacity : null, 'clip-path': clip ? `url(#${clip})` : null, class: cls })}/>` : '';
}

/** Radial falloff helper for halftone: big dots near (cx,cy) fading to none at radius R. */
export const radialR = (cx, cy, R, maxR, gamma = 1.4, sx = 1, sy = 1) => (px, py) => {
  const d = Math.hypot((px - cx) / sx, (py - cy) / sy) / R;
  return d >= 1 ? 0 : maxR * Math.pow(1 - d, gamma);
};
/** Linear falloff along a direction: dots grow from t0 to t1 along (dx,dy). */
export const linearR = (x0, y0, x1, y1, maxR, gamma = 1.2) => (px, py) => {
  const vx = x1 - x0, vy = y1 - y0, L2 = vx * vx + vy * vy;
  const t = ((px - x0) * vx + (py - y0) * vy) / L2;
  return t <= 0 ? 0 : maxR * Math.pow(Math.min(1, t), gamma);
};

/** Parallel hatch lines across a box (clip to a shape with `clip`). */
export function hatch({ x = 0, y = 0, w, h, gap = 7, angle = -45, stroke = C.ink, sw = 1.2, opacity = 1, clip, jitter = 0, r }) {
  const a = (angle * Math.PI) / 180, ca = Math.cos(a), sa = Math.sin(a);
  const cx = x + w / 2, cy = y + h / 2, R0 = Math.hypot(w, h) / 2;
  let d = '';
  for (let v = -R0; v <= R0; v += gap) {
    const j = jitter && r ? r.jit(jitter) : 0;
    const x1 = cx - R0 * ca - (v + j) * sa, y1 = cy - R0 * sa + (v + j) * ca;
    const x2 = cx + R0 * ca - (v + j) * sa, y2 = cy + R0 * sa + (v + j) * ca;
    d += `M${n(x1)},${n(y1)}L${n(x2)},${n(y2)}`;
  }
  return `<path d="${d}" stroke="${stroke}" stroke-width="${sw}" fill="none"${at({ opacity: opacity !== 1 ? opacity : null, 'clip-path': clip ? `url(#${clip})` : null })}/>`;
}

/** Wobbly hand-cut polygon (Saul Bass paper): jitter each vertex a little. */
export function cutPoly(pts, r, amt = 3) {
  return poly(pts.map(([x, y]) => [x + r.jit(amt), y + r.jit(amt)]));
}

/** Rotate a point around a centre. */
export function rot([x, y], [cx, cy], deg) {
  const a = (deg * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a);
  return [cx + (x - cx) * c - (y - cy) * s, cy + (x - cx) * s + (y - cy) * c];
}

/** Build an SVG element from markup. */
export function svgEl(inner, { w, h, cls = '', attrs = '' } = {}) {
  const s = document.createElementNS(NS, 'svg');
  s.setAttribute('viewBox', `0 0 ${n(w)} ${n(h)}`);
  s.setAttribute('preserveAspectRatio', 'xMidYMid slice');
  if (cls) s.setAttribute('class', cls);
  s.innerHTML = inner;
  return s;
}

let uidN = 0;
export const uid = (p = 'u') => `${p}${(++uidN).toString(36)}`;
