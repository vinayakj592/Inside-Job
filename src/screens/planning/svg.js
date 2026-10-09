// Tiny SVG helpers shared by the blueprint and schema-plan renderers.
export const NS = 'http://www.w3.org/2000/svg';

/** s('path', { d, class: 'x' }, ...children) */
export function s(tag, attrs = {}, ...kids) {
  const el = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'text') el.textContent = v;
    else el.setAttribute(k, v);
  }
  for (const c of kids.flat(Infinity)) {
    if (c == null || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}

export const f1 = (n) => (Math.round(n * 10) / 10).toString();
export const pts = (list) => list.map(([x, y]) => `${f1(x)},${f1(y)}`).join(' ');
export const pathD = (list, close = false) => list.map(([x, y], i) => `${i ? 'L' : 'M'}${f1(x)},${f1(y)}`).join(' ') + (close ? ' Z' : '');

/** Seeded PRNG so hand-drawn wobble is stable per element. */
export function rng(seed) {
  let t = typeof seed === 'number' ? seed : [...String(seed)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

/** A wobbly hand-drawn loop (grease-pencil circle) around an ellipse. */
export function scribbleLoop(cx, cy, rx, ry, seed = 1, turns = 1.18) {
  const r = rng(seed);
  const n = 28;
  const p = [];
  const start = r() * Math.PI * 2;
  for (let i = 0; i <= n; i++) {
    const t = start + (i / n) * Math.PI * 2 * turns;
    const w = 1 + (r() - 0.5) * 0.08;
    const drift = (i / n) * 0.06;
    p.push([cx + Math.cos(t) * rx * (w + drift), cy + Math.sin(t) * ry * (w - drift * 0.5)]);
  }
  let d = `M${f1(p[0][0])},${f1(p[0][1])}`;
  for (let i = 1; i < p.length - 1; i++) {
    const mx = (p[i][0] + p[i + 1][0]) / 2, my = (p[i][1] + p[i + 1][1]) / 2;
    d += ` Q${f1(p[i][0])},${f1(p[i][1])} ${f1(mx)},${f1(my)}`;
  }
  return d;
}

/** A slightly shaky hand-drawn line through points (for grease routes). */
export function shakyPath(list, seed = 1, amp = 2.2) {
  const r = rng(seed);
  if (list.length < 2) return '';
  let d = `M${f1(list[0][0])},${f1(list[0][1])}`;
  for (let i = 1; i < list.length; i++) {
    const [x0, y0] = list[i - 1], [x1, y1] = list[i];
    const mx = (x0 + x1) / 2 + (r() - 0.5) * amp * 2, my = (y0 + y1) / 2 + (r() - 0.5) * amp * 2;
    d += ` Q${f1(mx)},${f1(my)} ${f1(x1)},${f1(y1)}`;
  }
  return d;
}

/** Offset an open polyline by d (positive = left of travel direction). */
export function offsetPolyline(list, d) {
  const segs = [];
  for (let i = 1; i < list.length; i++) {
    const [x0, y0] = list[i - 1], [x1, y1] = list[i];
    const len = Math.hypot(x1 - x0, y1 - y0) || 1;
    const nx = -(y1 - y0) / len * d, ny = (x1 - x0) / len * d;
    segs.push([[x0 + nx, y0 + ny], [x1 + nx, y1 + ny]]);
  }
  const out = [segs[0][0]];
  for (let i = 1; i < segs.length; i++) {
    const [a, b] = segs[i - 1], [c, e] = segs[i];
    const p = intersect(a, b, c, e);
    out.push(p || b);
  }
  out.push(segs[segs.length - 1][1]);
  return out;
}
function intersect([x1, y1], [x2, y2], [x3, y3], [x4, y4]) {
  const den = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
  if (Math.abs(den) < 1e-6) return null;
  const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / den;
  return [x1 + t * (x2 - x1), y1 + t * (y2 - y1)];
}

export const cssEsc = (v) => (window.CSS?.escape ? CSS.escape(String(v)) : String(v).replace(/["\\]/g, '\\$&'));
