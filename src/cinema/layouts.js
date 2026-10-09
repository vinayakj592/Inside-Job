// Comic page layouts. A page area (W × H px) is cut into slanted panels by recursive half-plane
// splits with an ink gutter. Returns polygons in reading order.
import { rng } from './svg.js';

export const LAYOUT_SLOTS = { full: 1, '2h': 2, '2v': 2, '3a': 3, '3b': 3, '4': 4 };

export function centroid(p) {
  return [p.reduce((s, q) => s + q[0], 0) / p.length, p.reduce((s, q) => s + q[1], 0) / p.length];
}

/** Clip a convex polygon to one side of the line p1→p2, pulled back by off px. side = 1 | -1 */
function half(poly, p1, p2, side, off) {
  const dx = p2[0] - p1[0], dy = p2[1] - p1[1];
  const L = Math.hypot(dx, dy) || 1;
  const nx = (-dy / L) * side, ny = (dx / L) * side;
  const d = (p) => (p[0] - p1[0]) * nx + (p[1] - p1[1]) * ny - off;
  const out = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length];
    const da = d(a), db = d(b);
    if (da >= 0) out.push(a);
    if ((da >= 0) !== (db >= 0)) {
      const t = da / (da - db);
      out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
    }
  }
  return out;
}

/** Split into [first, second] in reading order: left before right for steep cuts, top before bottom for flat. */
function cut(poly, p1, p2, g) {
  const a = half(poly, p1, p2, 1, g / 2), b = half(poly, p1, p2, -1, g / 2);
  const steep = Math.abs(p2[1] - p1[1]) > Math.abs(p2[0] - p1[0]);
  const ca = centroid(a), cb = centroid(b);
  return (steep ? ca[0] <= cb[0] : ca[1] <= cb[1]) ? [a, b] : [b, a];
}

/**
 * @param {string} layout full | 2h | 2v | 3a | 3b | 4 | strip
 * @param {number} count number of panels on the page
 * @returns {Array<Array<[number,number]>>} polygons (px, page space), reading order
 */
export function layoutPanels(layout, count, W, H, { gutter = 14, seed = 1 } = {}) {
  const r = rng(seed);
  const g = gutter;
  const rect = [[0, 0], [W, 0], [W, H], [0, H]];
  const slant = (v) => v + r.jit(0.012);
  let L = layout;
  let polys;
  if (L === 'strip') polys = strip(count, W, H, g, r);
  else {
    if (!LAYOUT_SLOTS[L] || LAYOUT_SLOTS[L] !== count) {
      L = count <= 1 ? 'full' : count === 2 ? (L === '2v' ? '2v' : '2h') : count === 3 ? (L === '3b' ? '3b' : '3a') : count === 4 ? '4' : 'many';
    }
    if (L === 'full') polys = [rect];
    else if (L === '2h') polys = cut(rect, [slant(0.55) * W, 0], [slant(0.47) * W, H], g);
    else if (L === '2v') polys = cut(rect, [0, slant(0.56) * H], [W, slant(0.47) * H], g);
    else if (L === '3a') {
      const [lft, rgt] = cut(rect, [slant(0.6) * W, 0], [slant(0.55) * W, H], g);
      polys = [lft, ...cut(rgt, [0, slant(0.53) * H], [W, slant(0.45) * H], g)];
    } else if (L === '3b') {
      const [top, bot] = cut(rect, [0, slant(0.55) * H], [W, slant(0.49) * H], g);
      polys = [top, ...cut(bot, [slant(0.53) * W, 0], [slant(0.45) * W, H], g)];
    } else if (L === '4') {
      const [top, bot] = cut(rect, [0, slant(0.53) * H], [W, slant(0.47) * H], g);
      polys = [...cut(top, [slant(0.63) * W, 0], [slant(0.58) * W, H], g), ...cut(bot, [slant(0.41) * W, 0], [slant(0.36) * W, H], g)];
    } else {
      const topN = Math.ceil(count / 2), botN = count - topN;
      const [t, bt] = cut(rect, [0, slant(0.52) * H], [W, slant(0.48) * H], g);
      polys = [...columns(t, topN, W, H, g, r), ...columns(bt, botN, W, H, g, r)];
    }
  }
  // hand-cut irregularity: nudge every vertex a touch
  const j = Math.min(W, H) * 0.004;
  return polys.map((p) => p.map(([x, y]) => [x + r.jit(j), y + r.jit(j)]));
}

function columns(poly, n, W, H, g, r) {
  let rest = poly;
  const out = [];
  for (let i = 1; i < n; i++) {
    const x = (i / n) * W;
    const [l, rr] = cut(rest, [x + W * 0.02 + r.jit(W * 0.01), 0], [x - W * 0.02, H], g);
    out.push(l);
    rest = rr;
  }
  out.push(rest);
  return out;
}

/** Cinemascope band of N slanted slices. */
function strip(n, W, H, g, r) {
  const y0 = H * 0.17, y1 = H * 0.83;
  const band = [[0, y0], [W, y0 - H * 0.015], [W, y1], [0, y1 + H * 0.015]];
  if (n <= 1) return [band];
  return columns(band, n, W, H, g, r);
}
