// Shared drawing kit for the shot library: one visual language for every panel.
// Everything returns SVG markup strings. Coordinates are in the panel's own user space (W × H).
import { C, rng, n, poly, line, smooth, circ, at, P, R, G, halftone, radialR, linearR, hatch, rot, esc } from './svg.js';

export { C };

/* ------------------------------------------------------------------ */
/* Context: per-panel defs registry + helpers                          */
/* ------------------------------------------------------------------ */
let ctxN = 0;
export function makeCtx(W, H, params = {}, seed) {
  const id = 'k' + (++ctxN).toString(36);
  const defs = [];
  const ctx = {
    W, H, p: params, id, defs,
    r: rng(seed ?? JSON.stringify(params) + W.toFixed(0)),
    gid: (name) => `${id}${name}`,
    def: (markup) => { defs.push(markup); },
    /** vertical/any linear gradient in user space. stops: [[offset, color, opacity?], …] */
    lg(name, stops, x1, y1, x2, y2) {
      const g = ctx.gid(name);
      defs.push(`<linearGradient id="${g}" gradientUnits="userSpaceOnUse" x1="${n(x1)}" y1="${n(y1)}" x2="${n(x2)}" y2="${n(y2)}">${stopStr(stops)}</linearGradient>`);
      return `url(#${g})`;
    },
    rg(name, stops, cx, cy, r, fx, fy, gt) {
      const g = ctx.gid(name);
      defs.push(`<radialGradient id="${g}" gradientUnits="userSpaceOnUse" cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}"${fx != null ? ` fx="${n(fx)}" fy="${n(fy)}"` : ''}${gt ? ` gradientTransform="${gt}"` : ''}>${stopStr(stops)}</radialGradient>`);
      return `url(#${g})`;
    },
    clip(name, d) {
      const g = ctx.gid(name);
      defs.push(`<clipPath id="${g}"><path d="${d}"/></clipPath>`);
      return g;
    },
    mask(name, inner) {
      const g = ctx.gid(name);
      defs.push(`<mask id="${g}" maskUnits="userSpaceOnUse" x="0" y="0" width="${n(W)}" height="${n(H)}">${inner}</mask>`);
      return g;
    },
  };
  return ctx;
}
const stopStr = (stops) => stops.map(([o, c, op]) => `<stop offset="${o}" stop-color="${c}"${op != null ? ` stop-opacity="${op}"` : ''}/>`).join('');

/* ------------------------------------------------------------------ */
/* Atmosphere                                                          */
/* ------------------------------------------------------------------ */
/** Night sky: petrol at the horizon glow, ink at the top. */
export function sky(ctx, { horizon = 0.7, glow = C.t5, top = C.ink, mid = C.t8, stars = false } = {}) {
  const { W, H } = ctx;
  const fill = ctx.lg('sky', [[0, top], [0.55, mid], [1, glow]], 0, 0, 0, H * horizon);
  let s = R(0, 0, W, H, { fill });
  // fog bands: flat stripes of lighter petrol (cut paper, not gradient mush)
  const r = ctx.r;
  for (let i = 0; i < 3; i++) {
    const y = H * (horizon - 0.08 - i * 0.09 + r.jit(0.02));
    s += P(poly([[-10, y], [W + 10, y + r.jit(8)], [W + 10, y + H * 0.018], [-10, y + H * 0.024]]), { fill: C.t6, opacity: 0.35 - i * 0.08 });
  }
  if (stars) s += halftone({ w: W, h: H * 0.4, step: 23, angle: 17, rFn: () => (r() < 0.05 ? 0.9 : 0), fill: C.cream, opacity: 0.4 });
  return s;
}

/** A soft pool of sodium light made of halftone dots (never a blur). */
export function glowDots(ctx, cx, cy, R0, { color = C.gold, max = 3.2, step = 8, sy = 1, sx = 1, opacity = 0.9, angle = 45 } = {}) {
  return halftone({ x: cx - R0 * sx, y: cy - R0 * sy, w: 2 * R0 * sx, h: 2 * R0 * sy, step, angle, rFn: radialR(cx, cy, R0, max, 1.3, sx, sy), fill: color, opacity });
}

/** Hard-edged light cone from an apex. dir in degrees (0 = down), spread in degrees. */
export function cone(ctx, [ax, ay], { dir = 0, spread = 30, len = 400, color = C.gold, opacity = 0.22, dots = true, name = 'cone', core = true } = {}) {
  const d1 = ((dir - spread / 2) * Math.PI) / 180, d2 = ((dir + spread / 2) * Math.PI) / 180;
  const p1 = [ax + Math.sin(d1) * len, ay + Math.cos(d1) * len];
  const p2 = [ax + Math.sin(d2) * len, ay + Math.cos(d2) * len];
  const far = [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2];
  const fill = ctx.lg(name, [[0, color, opacity * 2.2], [0.7, color, opacity], [1, color, opacity * 0.4]], ax, ay, far[0], far[1]);
  let s = P(poly([[ax, ay], p1, p2]), { fill });
  if (core) {
    const d3 = ((dir - spread / 6) * Math.PI) / 180, d4 = ((dir + spread / 6) * Math.PI) / 180;
    s += P(poly([[ax, ay], [ax + Math.sin(d3) * len * 0.8, ay + Math.cos(d3) * len * 0.8], [ax + Math.sin(d4) * len * 0.8, ay + Math.cos(d4) * len * 0.8]]), { fill: color, opacity: opacity * 0.5 });
  }
  if (dots) {
    const cid = ctx.clip(name + 'c', poly([[ax, ay], p1, p2]));
    const minx = Math.min(ax, p1[0], p2[0]), maxx = Math.max(ax, p1[0], p2[0]);
    const miny = Math.min(ay, p1[1], p2[1]), maxy = Math.max(ay, p1[1], p2[1]);
    s += halftone({ x: minx, y: miny, w: maxx - minx, h: maxy - miny, step: 7, rFn: linearR(ax, ay, far[0], far[1], 2.4, 0.8), fill: color, opacity: 0.55, clip: cid });
  }
  return s;
}

/** Wet-street reflections: each light breaks into a column of short horizontal slivers (ripples). */
export function reflections(ctx, lights, { y0, y1, r = ctx.r } = {}) {
  let s = '';
  for (const L of lights) {
    const w = L.w ?? 10, color = L.color ?? C.gold;
    let y = y0, d = '';
    while (y < y1) {
      const t = (y - y0) / (y1 - y0);
      const h = r.range(1.2, 3.2) * (1 + t * 1.5);
      const ww = w * r.range(0.35, 1.25) * (1 + t * 0.9);
      if (r() > t * 0.55) d += `M${n(L.x - ww / 2 + r.jit(w * 0.3))},${n(y)}h${n(ww)}v${n(h)}h${n(-ww)}Z`;
      y += h + r.range(1.5, 5) * (1 + t);
    }
    s += `<path d="${d}" fill="${color}" opacity="${n(L.o ?? 0.75)}"/>`;
  }
  return G(s, { class: 'a-shimmer' });
}

/** Mirror some markup across a horizontal line (wet street), darkened and broken by ripple bands. */
export function mirror(ctx, markup, axisY, { opacity = 0.28, name = 'mir' } = {}) {
  const { W, H } = ctx;
  const cid = ctx.clip(name, `M0,${n(axisY)}H${n(W)}V${n(H)}H0Z`);
  let bands = '';
  for (let y = axisY + 3; y < H; y += 5 + (y - axisY) * 0.06) bands += `M0,${n(y)}H${n(W)}v${n(1.4 + (y - axisY) * 0.02)}H0Z`;
  return `<g clip-path="url(#${cid})"><g opacity="${opacity}" transform="translate(0 ${n(2 * axisY)}) scale(1 -1)">${markup}</g><path d="${bands}" fill="${C.ink}" opacity=".55"/></g>`;
}

/** Static rain streaks (the animated rain overlay is added by the renderer). */
export function rainStreaks(ctx, { count = 90, angle = 12, color = C.t1, opacity = 0.35, len = [20, 60], y0 = 0, y1 = ctx.H } = {}) {
  const r = ctx.r, a = (angle * Math.PI) / 180;
  let d = '';
  for (let i = 0; i < count; i++) {
    const x = r.range(-40, ctx.W + 40), y = r.range(y0, y1), L = r.range(len[0], len[1]);
    d += `M${n(x)},${n(y)}l${n(-Math.sin(a) * L)},${n(Math.cos(a) * L)}`;
  }
  return P(d, { stroke: color, 'stroke-width': 1.2, opacity, fill: 'none' });
}

/** Vignette: a hard-edged ink frame fading in halftone (print vignette, not blur). */
export function vignette(ctx, { strength = 1, color = C.ink } = {}) {
  const { W, H } = ctx;
  const fill = ctx.rg('vig', [[0.55, color, 0], [1, color, 0.85 * strength]], W / 2, H / 2, Math.hypot(W, H) / 2);
  return R(0, 0, W, H, { fill });
}

/** Venetian-blind light stripes (the noir cliché, used with intent). */
export function blinds(ctx, { x = 0, y = 0, w = ctx.W, h = ctx.H, angle = -18, gap = 46, band = 20, color = C.gold, opacity = 0.16 } = {}) {
  const cx = x + w / 2, cy = y + h / 2, L = Math.hypot(w, h);
  let d = '';
  for (let v = -L; v < L; v += gap) d += poly([[cx - L, cy + v], [cx + L, cy + v], [cx + L, cy + v + band], [cx - L, cy + v + band]]);
  return `<path d="${d}" fill="${color}" opacity="${opacity}" transform="rotate(${angle} ${n(cx)} ${n(cy)})"/>`;
}

/* ------------------------------------------------------------------ */
/* City                                                                */
/* ------------------------------------------------------------------ */
/** One building mass with a window grid. Returns markup. */
export function building(ctx, { x, base, w, h, fill = C.ink2, lit = 0.12, win = C.gold, cols, rows, style = 'flat', rim = null, r = ctx.r, winDim = C.t7, crown = null }) {
  let s = '';
  const top = base - h;
  let outline;
  if (style === 'setback') {
    const s1 = w * 0.12, h1 = h * 0.18;
    outline = [[x, base], [x, top + h1], [x + s1, top + h1], [x + s1, top], [x + w - s1, top], [x + w - s1, top + h1], [x + w, top + h1], [x + w, base]];
  } else if (style === 'deco') {
    const s1 = w * 0.1, s2 = w * 0.22, h1 = h * 0.14, h2 = h * 0.07;
    outline = [[x, base], [x, top + h1 + h2], [x + s1, top + h1 + h2], [x + s1, top + h1], [x + s2, top + h1], [x + w / 2, top - h * 0.12], [x + w - s2, top + h1], [x + w - s1, top + h1], [x + w - s1, top + h1 + h2], [x + w, top + h1 + h2], [x + w, base]];
  } else if (style === 'gable') {
    outline = [[x, base], [x, top + h * 0.15], [x + w / 2, top], [x + w, top + h * 0.15], [x + w, base]];
  } else {
    outline = [[x, base], [x, top], [x + w, top], [x + w, base]];
  }
  if (rim) s += P(poly(outline.map(([a, b]) => [a + rim.dx, b + rim.dy])), { fill: rim.color });
  s += P(poly(outline), { fill });
  // windows
  cols = cols ?? Math.max(2, Math.round(w / 22));
  rows = rows ?? Math.max(3, Math.round(h / 30));
  const mx = w * 0.12, my = h * 0.08;
  const cw = (w - 2 * mx) / cols, rh = (h - 2 * my) / rows;
  const ww = cw * 0.5, wh = rh * 0.52;
  let dl = '', dd = '';
  const y0 = top + (style === 'deco' ? h * 0.24 : style === 'setback' ? h * 0.22 : my);
  for (let j = 0; j < rows; j++) {
    const y = y0 + j * rh;
    if (y + wh > base - my * 0.5) break;
    for (let i = 0; i < cols; i++) {
      const wx = x + mx + i * cw + (cw - ww) / 2;
      if (r() < lit) dl += `M${n(wx)},${n(y)}h${n(ww)}v${n(wh)}h${n(-ww)}Z`;
      else if (r() < 0.55) dd += `M${n(wx)},${n(y)}h${n(ww)}v${n(wh)}h${n(-ww)}Z`;
    }
  }
  if (dd) s += P(dd, { fill: winDim, opacity: 0.55 });
  if (dl) s += P(dl, { fill: win });
  if (crown) s += crown;
  return s;
}

/** A layered skyline band. depth 0 = far (foggy petrol) … 1 = near (ink). */
export function skyline(ctx, { base, depth = 0.5, hMin = 0.2, hMax = 0.5, wMin = 40, wMax = 120, lit, x0 = -20, x1 = ctx.W + 20, gap = [0, 10], rim = null, extras = true } = {}) {
  const { H } = ctx, r = ctx.r;
  const fills = [C.t6, C.t7, C.t8, C.ink3, C.ink2, C.ink];
  const fill = fills[Math.min(fills.length - 1, Math.round(depth * (fills.length - 1)))];
  const winDim = depth < 0.4 ? C.t5 : C.t7;
  let s = '';
  let x = x0;
  while (x < x1) {
    const w = r.range(wMin, wMax), h = H * r.range(hMin, hMax);
    const style = r.pick(['flat', 'flat', 'setback', 'flat', 'gable', 'deco'].slice(0, depth > 0.7 ? 4 : 6));
    s += building(ctx, { x, base, w, h, fill, lit: lit ?? (0.05 + depth * 0.12), style, winDim, rim, win: depth < 0.3 ? C.goldDeep : C.gold });
    if (extras && r() < 0.35) {
      // rooftop clutter: water tower or antenna
      const tx = x + r.range(0.2, 0.7) * w, ty = base - h;
      if (r() < 0.5) s += waterTower(tx, ty, Math.min(26, w * 0.28), fill);
      else s += P(`M${n(tx)},${n(ty)}v${n(-r.range(20, 60))}`, { stroke: fill, 'stroke-width': 3 });
    }
    x += w + r.range(gap[0], gap[1]);
  }
  return s;
}

export function waterTower(x, y, s, fill) {
  // tank on stilts: legs with cross-bracing, a barrel with a conical cap
  const tw = s * 0.62, th = s * 0.52, legH = s * 0.42, top = y - legH;
  let d = `M${n(x - tw * 0.42)},${n(y)}L${n(x - tw * 0.36)},${n(top)}M${n(x + tw * 0.42)},${n(y)}L${n(x + tw * 0.36)},${n(top)}M${n(x - tw * 0.12)},${n(y)}L${n(x - tw * 0.1)},${n(top)}M${n(x + tw * 0.12)},${n(y)}L${n(x + tw * 0.1)},${n(top)}`;
  d += `M${n(x - tw * 0.4)},${n(y - legH * 0.1)}L${n(x + tw * 0.38)},${n(top + legH * 0.1)}M${n(x + tw * 0.4)},${n(y - legH * 0.1)}L${n(x - tw * 0.38)},${n(top + legH * 0.1)}M${n(x - tw * 0.4)},${n(y - legH * 0.5)}H${n(x + tw * 0.4)}`;
  let o = `<path d="${d}" stroke="${fill}" stroke-width="${n(Math.max(1.5, s * 0.025))}" fill="none"/>`;
  o += `<path d="M${n(x - tw / 2)},${n(top)}L${n(x - tw * 0.47)},${n(top - th)}L${n(x + tw * 0.47)},${n(top - th)}L${n(x + tw / 2)},${n(top)}Z" fill="${fill}"/>`;
  o += `<path d="M${n(x - tw * 0.53)},${n(top - th)}L${n(x)},${n(top - th - s * 0.22)}L${n(x + tw * 0.53)},${n(top - th)}Z" fill="${fill}"/>`;
  o += `<path d="M${n(x - tw * 0.48)},${n(top - th * 0.35)}H${n(x + tw * 0.48)}M${n(x - tw * 0.48)},${n(top - th * 0.7)}H${n(x + tw * 0.48)}" stroke="${C.ink}" stroke-width="1.2" opacity=".6"/>`;
  return o;
}

/** Street lamp: post + head + light. Returns { s, head:[x,y] }. */
export function lampPost(ctx, x, base, h, { color = C.gold, fill = C.ink, arm = 1 } = {}) {
  const top = base - h;
  let s = P(`M${n(x - 3)},${n(base)}V${n(top + 20)}q0,-20 ${n(arm * 22)},-20h${n(arm * 14)}v6h${n(-arm * 14)}q${n(-arm * 16)},0 ${n(-arm * 16)},14V${n(base)}Z`, { fill });
  const hx = x + arm * 34, hy = top + 4;
  s += P(`M${n(hx - 13)},${n(hy)}h26l-6,10h-14Z`, { fill });
  s += P(`M${n(hx - 8)},${n(hy + 10)}h16l-2,4h-12Z`, { fill: C.goldHot, class: 'a-flicker-soft' });
  return { s, head: [hx, hy + 12] };
}

/* ------------------------------------------------------------------ */
/* Figures: a flat, cut-paper puppet with poses                         */
/* ------------------------------------------------------------------ */
// angles in degrees: 0 = hanging straight down, + = rotated toward the facing direction.
export const POSES = {
  stand:    { lean: 0,   neck: 0,  far: { arm: [-4, 4],  leg: [-3, 1] },   near: { arm: [5, -4],   leg: [4, -1] } },
  pockets:  { lean: -2,  neck: 4,  far: { arm: [-12, 40], leg: [-4, 1] },  near: { arm: [12, -40], leg: [6, -2] } },
  walk:     { lean: 5,   neck: 4,  far: { arm: [-24, 20], leg: [-20, -14] }, near: { arm: [26, 18],  leg: [24, -6] } },
  run:      { lean: 20,  neck: 6,  far: { arm: [-55, 85], leg: [-38, -55] }, near: { arm: [60, 85],  leg: [62, -78] } },
  crouch:   { lean: 40,  neck: 24, far: { arm: [12, 30],  leg: [22, -110] }, near: { arm: [34, -26], leg: [86, -92] } },
  sneak:    { lean: 24,  neck: 12, far: { arm: [-10, 40], leg: [-22, -30] }, near: { arm: [40, 50],  leg: [40, -52] } },
  contort:  { lean: 62,  neck: 34, far: { arm: [60, 30],  leg: [-112, -8] }, near: { arm: [150, 30], leg: [4, -2] } },
  limbo:    { lean: -58, neck: -24, far: { arm: [-100, -30], leg: [30, -95] }, near: { arm: [-70, -40], leg: [62, -100] } },
  flashlight: { lean: 3, neck: 6,  far: { arm: [-8, 12],  leg: [-10, -6] }, near: { arm: [78, 6],   leg: [14, -4] } },
  point:    { lean: 2,   neck: 0,  far: { arm: [-6, 10],  leg: [-6, 0] },   near: { arm: [98, -4],  leg: [8, -2] } },
  reach:    { lean: 24,  neck: 10, far: { arm: [58, 22],  leg: [-14, -8] }, near: { arm: [72, 14],  leg: [22, -18] } },
  handsup:  { lean: -3,  neck: -6, far: { arm: [-165, 0], leg: [-6, 0] },   near: { arm: [165, 0],  leg: [7, -1] } },
  lean:     { lean: -8,  neck: 8,  far: { arm: [-20, 60], leg: [-2, 0] },   near: { arm: [16, -60], leg: [26, -40] } },
  toast:    { lean: 0,   neck: -4, far: { arm: [-6, 8],   leg: [-3, 1] },   near: { arm: [40, 110], leg: [4, -1] } },
  smoke:    { lean: -3,  neck: 2,  far: { arm: [-10, 40], leg: [-4, 1] },   near: { arm: [22, 125], leg: [7, -2] } },
  jump:     { lean: 14,  neck: 4,  far: { arm: [-120, 30], leg: [-40, -60] }, near: { arm: [130, 30], leg: [70, -95] } },
};

/** Character builds for silhouettes (heads/hats match the portraits). */
export const BUILDS = {
  viv:      { head: 'bob', coat: 'trench', w: 0.94, h: 1.04, collar: true },
  dex:      { head: 'slick', coat: 'jacket', w: 0.95 },
  juno:     { head: 'updo', coat: 'jacket', w: 1.0, h: 0.88 },
  otis:     { head: 'none', coat: 'jacket', w: 1.5, h: 1.08 },
  lena:     { head: 'short', coat: 'dress', w: 0.9, collar: true },
  crane:    { head: 'slick', coat: 'suit', w: 1.14, h: 1.04, beard: true },
  calloway: { head: 'short', coat: 'trench', w: 0.96, collar: true },
  moretti:  { head: 'none', coat: 'jacket', w: 1.18, h: 0.9 },
  ruiz:     { head: 'cap', coat: 'jacket', w: 1.2, h: 0.95 },
  voight:   { head: 'short', coat: 'jacket', w: 1.25, h: 1.05 },
  harris:   { head: 'slick', coat: 'trench', w: 0.88, h: 1.02 },
  guard:    { head: 'cap', coat: 'jacket', w: 1.12 },
  mia:      { head: 'beanie', coat: 'jacket', w: 0.92, h: 0.9 },
  fedora:   { head: 'fedora', coat: 'trench', w: 1.05, collar: true },
  gown:     { head: 'updo', coat: 'dress', w: 0.9 },
  tux:      { head: 'slick', coat: 'suit', w: 1.05 },
};

/**
 * Draw a silhouette figure. (x, ground) = point between the feet; s = standing height.
 * opts: pose, face (1 right | -1 left), build (key or object), fill, rim {color, dx, dy}
 * Returns markup; also fills opts.out with key joint positions (head, hand…).
 */
export function figure(x, ground, s, opts = {}) {
  const pose = typeof opts.pose === 'object' ? opts.pose : POSES[opts.pose || 'stand'];
  const b = typeof opts.build === 'object' ? opts.build : BUILDS[opts.build || 'fedora'] || BUILDS.fedora;
  const f = opts.face ?? 1;
  const u = (s / 7.6) * (b.h || 1);
  const W = b.w || 1;
  const dir = (deg) => { const a = (deg * Math.PI) / 180; return [Math.sin(a) * f, Math.cos(a)]; };
  const add = (p, d, L) => [p[0] + d[0] * L, p[1] + d[1] * L];
  // skeleton with hip at origin
  const hip = [0, 0];
  const up = dir(180 - pose.lean); // torso axis pointing up
  const neckBase = add(hip, [up[0], up[1]], 2.85 * u);
  const perp = [-up[1] * f, up[0] * f]; // across the body
  const headDir = dir(180 - pose.lean - pose.neck);
  const headC = add(neckBase, headDir, 0.95 * u);
  const shW = 1.02 * u * W, hipW = 0.46 * u * W;
  const sh = { far: add(neckBase, perp, -shW * 0.72), near: add(neckBase, perp, shW * 0.72) };
  // pull shoulders slightly below neck base
  sh.far = add(sh.far, up, -0.25 * u); sh.near = add(sh.near, up, -0.25 * u);
  const hp = { far: add(hip, perp, -hipW), near: add(hip, perp, hipW) };
  const limb = (root, a1, a2, L1, L2) => {
    const j = add(root, dir(a1), L1);
    const e = add(j, dir(a1 + a2), L2);
    return [root, j, e];
  };
  const arm = {}, leg = {};
  for (const side of ['far', 'near']) {
    arm[side] = limb(sh[side], pose[side].arm[0], pose[side].arm[1], 1.42 * u, 1.34 * u);
    leg[side] = limb(hp[side], pose[side].leg[0], pose[side].leg[1], 2.02 * u, 2.05 * u);
  }
  // ground: lowest point of feet (or of knees when kneeling)
  const pts = [...leg.far, ...leg.near];
  const low = Math.max(...pts.map((p) => p[1])) + 0.12 * u;
  const midX = (leg.far[2][0] + leg.near[2][0]) / 2;
  const ox = x - midX * (opts.anchorFeet === false ? 0 : 1), oy = ground - low;
  const T = ([px, py]) => [px + ox, py + oy];

  const seg = (a, bb, w1, w2) => {
    const A = T(a), B = T(bb);
    const dx = B[0] - A[0], dy = B[1] - A[1], L = Math.hypot(dx, dy) || 1;
    const nx = -dy / L, ny = dx / L;
    return poly([[A[0] + nx * w1, A[1] + ny * w1], [B[0] + nx * w2, B[1] + ny * w2], [B[0] - nx * w2, B[1] - ny * w2], [A[0] - nx * w1, A[1] - ny * w1]]) + circ(B[0], B[1], w2 * 1.02) + circ(A[0], A[1], w1);
  };
  let d = '';
  const armW = W * u, legW = Math.max(0.9, W * 0.95) * u;
  const drawArm = (side) => {
    const [a, j, e] = arm[side];
    d += seg(a, j, 0.26 * armW, 0.2 * armW) + seg(j, e, 0.2 * armW, 0.15 * armW);
    const E = T(e); d += circ(E[0], E[1], 0.2 * u);
  };
  const drawLeg = (side) => {
    const [a, k, e] = leg[side];
    d += seg(a, k, 0.36 * legW, 0.25 * legW) + seg(k, e, 0.25 * legW, 0.16 * legW);
    const E = T(e);
    // shoe: points forward
    d += poly([[E[0] - f * 0.2 * u, E[1] - 0.18 * u], [E[0] + f * 0.62 * u, E[1] + 0.02 * u], [E[0] + f * 0.6 * u, E[1] + 0.14 * u], [E[0] - f * 0.25 * u, E[1] + 0.14 * u]]);
  };
  drawArm('far'); drawLeg('far'); drawLeg('near');
  // torso
  const tA = T(sh.far), tB = T(sh.near), hA = T(hp.far), hB = T(hp.near);
  const waistIn = 0.12 * u;
  d += poly([tA, tB, [hB[0] + perp[0] * waistIn * 0, hB[1]], hA]);
  // coat / jacket / dress
  const kneeF = T(leg.far[1]), kneeN = T(leg.near[1]);
  const footF = T(leg.far[2]), footN = T(leg.near[2]);
  // long coats would smear into wedges on athletic poses: cut them to jacket length
  const extreme = Math.abs(pose.lean) > 30 || ['far', 'near'].some((k) => Math.abs(pose[k].leg[0]) > 50);
  const coat = extreme && (b.coat === 'trench' || b.coat === 'dress') ? 'jacket' : b.coat;
  if (coat === 'trench' || coat === 'dress') {
    const longT = coat === 'dress' ? 0.95 : 0.35;
    const hemF = [kneeF[0] + (footF[0] - kneeF[0]) * longT, kneeF[1] + (footF[1] - kneeF[1]) * longT];
    const hemN = [kneeN[0] + (footN[0] - kneeN[0]) * longT, kneeN[1] + (footN[1] - kneeN[1]) * longT];
    const flare = coat === 'dress' ? 0.8 * u : 0.5 * u;
    // order the hem so the flare goes outward
    const lft = hemF[0] < hemN[0] ? hemF : hemN, rgt = hemF[0] < hemN[0] ? hemN : hemF;
    const hl = [lft[0] - flare, lft[1] + 0.05 * u], hr = [rgt[0] + flare, rgt[1] + 0.12 * u];
    const hipL = hA[0] < hB[0] ? hA : hB, hipR = hA[0] < hB[0] ? hB : hA;
    d += poly([tA[0] < tB[0] ? tA : tB, tA[0] < tB[0] ? tB : tA, [hipR[0] + 0.25 * u, hipR[1]], hr, [(hl[0] + hr[0]) / 2, Math.max(hl[1], hr[1]) - (coat === 'dress' ? 0 : 0.25 * u)], hl, [hipL[0] - 0.25 * u, hipL[1]]]);
  } else if (coat === 'jacket' || coat === 'suit') {
    const hipL = hA[0] < hB[0] ? hA : hB, hipR = hA[0] < hB[0] ? hB : hA;
    const dy = coat === 'suit' ? 0.55 * u : 0.3 * u;
    d += poly([tA[0] < tB[0] ? tA : tB, tA[0] < tB[0] ? tB : tA, [hipR[0] + 0.18 * u, hipR[1] + dy], [hipL[0] - 0.18 * u, hipL[1] + dy]]);
  }
  // shoulders: rounded caps
  d += circ(tA[0], tA[1], 0.27 * u * Math.min(W, 1.15)) + circ(tB[0], tB[1], 0.27 * u * Math.min(W, 1.15));
  // neck + head
  const NB = T(neckBase), HC = T(headC);
  d += seg(neckBase, add(neckBase, headDir, 0.5 * u), 0.24 * u, 0.22 * u);
  d += headShape(HC, u, b, f, headDir);
  if (b.collar) {
    const cx = NB[0], cy = NB[1];
    d += poly([[cx - 0.62 * u, cy + 0.3 * u], [cx - 0.5 * u, cy - 0.55 * u], [cx - 0.1 * u, cy + 0.1 * u]]) + poly([[cx + 0.62 * u, cy + 0.3 * u], [cx + 0.5 * u, cy - 0.55 * u], [cx + 0.1 * u, cy + 0.1 * u]]);
  }
  drawArm('near');
  if (opts.out) {
    opts.out.head = HC; opts.out.hand = T(arm.near[2]); opts.out.handFar = T(arm.far[2]); opts.out.u = u; opts.out.neck = NB;
    opts.out.mouth = [HC[0] + f * 0.25 * u, HC[1] + 0.2 * u];
  }
  const fill = opts.fill || C.ink;
  // one element per sub-shape: overlapping sub-paths in a single path can punch holes (winding),
  // separate elements always union into a solid silhouette.
  const body = d.split(/(?=M)/).filter(Boolean).map((sp) => `<path d="${sp}"/>`).join('');
  let out = '';
  if (opts.rim) {
    const rim = opts.rim;
    out += `<g fill="${rim.color}" transform="translate(${n(rim.dx)} ${n(rim.dy)})"${rim.opacity ? ` opacity="${rim.opacity}"` : ''}>${body}</g>`;
  }
  out += `<g fill="${fill}">${body}</g>`;
  if (b.cigar && opts.cigar !== false) {
    const cx = HC[0] + f * 0.6 * u, cy = HC[1] + 0.3 * u;
    out += `<path d="M${n(HC[0] + f * 0.3 * u)},${n(cy)}h${n(f * 0.4 * u)}" stroke="${fill}" stroke-width="${n(0.14 * u)}"/>` + `<circle cx="${n(cx + f * 0.05 * u)}" cy="${n(cy)}" r="${n(0.09 * u)}" fill="${C.goldHot}" class="a-ember"/>`;
  }
  return out;
}

/** Head + hair/hat silhouettes. c = centre, u = head unit. */
function headShape([cx, cy], u, b, f, hd) {
  const r = 0.5 * u;
  let d = `M${n(cx - r * 0.86)},${n(cy - r * 0.1)}C${n(cx - r * 0.9)},${n(cy - r * 1.2)} ${n(cx + r * 0.9)},${n(cy - r * 1.2)} ${n(cx + r * 0.88)},${n(cy - r * 0.1)}C${n(cx + r * 0.86)},${n(cy + r * 0.8)} ${n(cx + r * 0.3)},${n(cy + r * 1.12)} ${n(cx)},${n(cy + r * 1.12)}C${n(cx - r * 0.3)},${n(cy + r * 1.12)} ${n(cx - r * 0.86)},${n(cy + r * 0.8)} ${n(cx - r * 0.86)},${n(cy - r * 0.1)}Z`;
  // nose bump toward facing
  d += poly([[cx + f * r * 0.75, cy - r * 0.1], [cx + f * r * 1.06, cy + r * 0.28], [cx + f * r * 0.72, cy + r * 0.42]]);
  const top = cy - r * 0.95;
  switch (b.head) {
    case 'fedora':
      d += poly([[cx - r * 1.75, top + r * 0.38], [cx + r * 1.75, top + r * 0.3], [cx + r * 1.6, top + r * 0.56], [cx - r * 1.6, top + r * 0.62]]);
      d += poly([[cx - r * 0.95, top + r * 0.42], [cx - r * 0.82, top - r * 0.55], [cx - r * 0.2, top - r * 0.62], [cx, top - r * 0.42], [cx + r * 0.2, top - r * 0.64], [cx + r * 0.84, top - r * 0.52], [cx + r * 0.98, top + r * 0.38]]);
      break;
    case 'cap':
      d += poly([[cx - r * 0.98, top + r * 0.5], [cx - r * 1.05, top - r * 0.35], [cx + r * 1.05, top - r * 0.45], [cx + r * 1.0, top + r * 0.45]]);
      d += poly([[cx + f * r * 0.4, top + r * 0.35], [cx + f * r * 1.55, top + r * 0.62], [cx + f * r * 0.4, top + r * 0.62]]);
      break;
    case 'flatcap':
      d += poly([[cx - r * 1.05, top + r * 0.55], [cx - r * 0.95, top - r * 0.12], [cx + r * 0.2, top - r * 0.3], [cx + f * r * 1.35, top + r * 0.22], [cx + f * r * 1.4, top + r * 0.5]]);
      break;
    case 'beanie':
      d += `M${n(cx - r * 1.02)},${n(top + r * 0.62)}C${n(cx - r * 1.1)},${n(top - r * 1.1)} ${n(cx + r * 1.1)},${n(top - r * 1.1)} ${n(cx + r * 1.02)},${n(top + r * 0.62)}Z`;
      // headset band + cup
      d += circ(cx - f * r * 0.95, cy, r * 0.32);
      break;
    case 'bob':
      d += poly([[cx - r * 1.08, cy + r * 0.72], [cx - r * 1.12, cy - r * 0.6], [cx - r * 0.6, top - r * 0.2], [cx + r * 0.3, top - r * 0.26], [cx + r * 1.08, cy - r * 0.62], [cx + r * 1.12, cy + r * 0.66], [cx + f * r * 0.6, cy + r * 0.72], [cx + f * r * 0.7, cy - r * 0.3], [cx - f * r * 0.2, cy - r * 0.55], [cx - f * r * 0.7, cy + r * 0.74]]);
      break;
    case 'pomp':
      d += `M${n(cx - r * 0.92)},${n(cy - r * 0.2)}C${n(cx - r * 1.0)},${n(top - r * 0.4)} ${n(cx + f * r * 0.2)},${n(top - r * 1.1)} ${n(cx + f * r * 1.3)},${n(top - r * 0.62)}C${n(cx + f * r * 1.2)},${n(top - r * 0.2)} ${n(cx + f * r * 1.0)},${n(top + r * 0.1)} ${n(cx + f * r * 0.9)},${n(cy - r * 0.3)}Z`;
      break;
    case 'beret':
      d += poly([[cx - r * 1.25, top + r * 0.32], [cx - r * 0.9, top - r * 0.38], [cx + r * 0.9, top - r * 0.48], [cx + f * r * 1.5, top + r * 0.02], [cx + r * 1.0, top + r * 0.36]]);
      d += poly([[cx - r * 1.1, cy - r * 0.2], [cx - r * 1.38, cy + r * 0.7], [cx - r * 1.0, cy + r * 1.3], [cx - r * 0.5, cy + r * 0.5]]);
      d += poly([[cx + r * 1.1, cy - r * 0.2], [cx + r * 1.38, cy + r * 0.7], [cx + r * 1.0, cy + r * 1.3], [cx + r * 0.5, cy + r * 0.5]]);
      break;
    case 'slick':
      d += `M${n(cx - r * 0.9)},${n(cy)}C${n(cx - r * 1.05)},${n(top - r * 0.5)} ${n(cx + r * 0.6)},${n(top - r * 0.5)} ${n(cx + r * 0.95)},${n(cy - r * 0.2)}Z`;
      break;
    case 'updo':
      d += circ(cx - f * r * 0.2, top - r * 0.2, r * 0.55);
      break;
    case 'short':
      d += `M${n(cx - r * 0.95)},${n(cy + r * 0.1)}C${n(cx - r * 1.05)},${n(top - r * 0.3)} ${n(cx + r * 1.05)},${n(top - r * 0.3)} ${n(cx + r * 0.95)},${n(cy + r * 0.1)}Z`;
      break;
    default: break;
  }
  if (b.beard) d += `M${n(cx - r * 0.9)},${n(cy)}C${n(cx - r * 1.0)},${n(cy + r * 1.6)} ${n(cx + r * 1.0)},${n(cy + r * 1.6)} ${n(cx + r * 0.9)},${n(cy)}Z`;
  return d;
}

/* ------------------------------------------------------------------ */
/* Vehicles                                                            */
/* ------------------------------------------------------------------ */
/**
 * A 1950s saloon in 3/4 front view, built from flat planes. (x, y) = ground under the near front corner.
 * face -1: nose toward the left (body recedes to the right); face 1: mirrored. s ≈ half the car length.
 * Returns { s, lights: [[x,y],[x,y]], window: pts (side glass, for a driver silhouette), len }.
 */
export function car3q(ctx, x, y, s, { face = -1, fill = C.ink2, rim = C.gold, lightsOn = true, tone = 0 } = {}) {
  const M = ([lx, ly]) => [x - face * lx * s, y + ly * s];
  const Q = (pts) => poly(pts.map(M));
  const add = (a, b, k = 1) => [a[0] + b[0] * k, a[1] + b[1] * k];
  const side = [1.58, -0.2], sideB = [1.6, -0.2];
  const FLb = [0, -0.07], FRb = [0.42, -0.1], FRt = [0.45, -0.37], FLt = [0.03, -0.34];
  const RRb = add(FRb, sideB), RRt = add(FRt, side);
  const WBr = add(FRt, side, 0.3), WBl = add(FLt, side, 0.3);
  const lift = [0.2, -0.22], RFr = add(WBr, lift), RFl = add(WBl, lift);
  const BBr = add(FRt, side, 0.74), RRr = add(BBr, [-0.1, -0.2]), RRl = add(RRr, [-0.42, 0.03]);
  const cSide = tone ? C.ink3 : fill, cFront = C.ink3, cHood = C.ink4;
  let o = '';
  // wheel wells + far wheel
  o += `<ellipse cx="${n(M([0.1, -0.06])[0])}" cy="${n(M([0.1, -0.06])[1])}" rx="${n(0.07 * s)}" ry="${n(0.09 * s)}" fill="${C.ink}"/>`;
  // rim-light plate (offset silhouette)
  const hull = [FLb, FRb, RRb, add(RRt, [0.02, -0.06]), BBr, RRr, RRl, RFl, WBl, FLt];
  o += `<path d="${Q(hull)}" fill="${rim}" transform="translate(${n(face * 2.5)} -2.5)"/>`;
  // side plane
  o += `<path d="${Q([FRb, RRb, add(RRt, [0.02, -0.06]), FRt])}" fill="${cSide}"/>`;
  // greenhouse (side glass) + pillars
  const glass = [add(WBr, [0.05, -0.01]), add(RFr, [0.03, 0.02]), add(RRr, [-0.03, 0.02]), add(BBr, [-0.05, 0])];
  o += `<path d="${Q([WBr, RFr, RRr, BBr])}" fill="${C.ink}"/>`;
  o += `<path d="${Q(glass)}" fill="${C.t6}"/>`;
  const bp = add(glass[0], [ (glass[3][0] - glass[0][0]) * 0.52, (glass[3][1] - glass[0][1]) * 0.52 ]);
  o += `<path d="${Q([bp, add(bp, [0.02, -0.19]), add(bp, [0.06, -0.19]), add(bp, [0.04, 0])])}" fill="${C.ink}"/>`;
  // roof + windshield + hood + front
  o += `<path d="${Q([RFl, RFr, RRr, RRl])}" fill="${C.ink3}"/>`;
  o += `<path d="${Q([WBl, WBr, RFr, RFl])}" fill="${C.t5}"/>`;
  o += `<path d="${Q([add(WBl, [0.05, -0.02]), add(WBl, [0.12, -0.02]), add(RFl, [0.1, 0.02]), add(RFl, [0.05, 0.02])])}" fill="${C.t2}" opacity=".6"/>`;
  o += `<path d="${Q([FLt, FRt, WBr, WBl])}" fill="${cHood}"/>`;
  o += `<path d="${Q([add(FLt, side, 0.08), add(FRt, side, 0.08), add(FRt, side, 0.12), add(FLt, side, 0.12)])}" fill="${C.t3}" opacity=".5"/>`;
  o += `<path d="${Q([FLb, FRb, FRt, FLt])}" fill="${cFront}"/>`;
  // grille + chrome bumper
  let g = '';
  for (let i = 0; i < 7; i++) { const a = add(FLb, [0.12 + i * 0.03, -0.07 - i * 0.002]); const [ax, ay] = M(a); g += `M${n(ax)},${n(ay)}v${n(-0.11 * s)}`; }
  o += `<path d="${g}" stroke="${C.t3}" stroke-width="${n(Math.max(1, 0.012 * s))}"/>`;
  o += `<path d="${Q([add(FLb, [-0.02, 0.01]), add(FRb, [0.02, 0.0]), add(FRb, [0.03, -0.035]), add(FLb, [-0.02, -0.03])])}" fill="${C.cream2}" opacity=".75"/>`;
  o += `<path d="${Q([FRb, add(FRb, sideB, 0.12), add(FRb, sideB, 0.12), add(add(FRb, sideB, 0.12), [0, -0.03]), add(FRb, [0.01, -0.035])])}" fill="${C.cream2}" opacity=".5"/>`;
  // chrome body strip + fender line
  const [s1x, s1y] = M(add(FRt, [0.02, 0.12])), [s2x, s2y] = M(add(RRt, [0, 0.1]));
  o += `<path d="M${n(s1x)},${n(s1y)}L${n(s2x)},${n(s2y)}" stroke="${C.t3}" stroke-width="${n(Math.max(1, 0.014 * s))}"/>`;
  // wheels (near side), squashed ellipses
  const wheel = (pt, r) => { const [wx, wy] = M(pt); return `<ellipse cx="${n(wx)}" cy="${n(wy)}" rx="${n(r * 0.78 * s)}" ry="${n(r * s)}" fill="${C.ink}"/><ellipse cx="${n(wx - face * r * 0.1 * s)}" cy="${n(wy)}" rx="${n(r * 0.38 * s)}" ry="${n(r * 0.5 * s)}" fill="${C.ink4}"/><ellipse cx="${n(wx - face * r * 0.1 * s)}" cy="${n(wy)}" rx="${n(r * 0.14 * s)}" ry="${n(r * 0.2 * s)}" fill="${C.t3}"/>`; };
  o += wheel(add(FRb, sideB, 0.17), 0.14) + wheel(add(FRb, sideB, 0.8), 0.125);
  // rim light along the roofline and the shoulder of the car
  o += `<path d="M${M(WBr).map(n).join(',')}L${M(RFr).map(n).join(',')}L${M(RRr).map(n).join(',')}L${M(BBr).map(n).join(',')}L${M(add(RRt, [0.02, -0.06])).map(n).join(',')}" stroke="${rim}" stroke-width="${n(Math.max(1.5, 0.02 * s))}" fill="none"/>`;
  o += `<path d="M${M(FLt).map(n).join(',')}L${M(FRt).map(n).join(',')}" stroke="${rim}" stroke-width="${n(Math.max(1, 0.012 * s))}" opacity=".6"/>`;
  // headlamps
  const lights = [M(add(FLb, [0.06, -0.19])), M(add(FRb, [-0.05, -0.19]))];
  for (const [lx, ly] of lights) o += `<circle cx="${n(lx)}" cy="${n(ly)}" r="${n(0.05 * s)}" fill="${C.ink}"/><circle cx="${n(lx)}" cy="${n(ly)}" r="${n(0.04 * s)}" fill="${lightsOn ? C.goldPale : C.t3}"/>`;
  return { s: o, lights, window: glass.map(M), len: 2.05 * s, roof: M(RFr) };
}

/** Speed lines radiating from / streaking past a point. */
export function speedLines(ctx, { cx, cy, count = 60, inner = 0.3, color = C.cream, opacity = 0.5, sw = [1, 5], r = ctx.r } = {}) {
  const { W, H } = ctx, R0 = Math.hypot(W, H);
  let d = '';
  for (let i = 0; i < count; i++) {
    const a = r.range(0, Math.PI * 2), a2 = a + r.range(0.004, 0.012) * r.range(sw[0], sw[1]);
    const r0 = R0 * r.range(inner, inner + 0.25);
    d += poly([[cx + Math.cos(a) * r0, cy + Math.sin(a) * r0], [cx + Math.cos(a) * R0, cy + Math.sin(a) * R0], [cx + Math.cos(a2) * R0, cy + Math.sin(a2) * R0]]);
  }
  return P(d, { fill: color, opacity });
}

/** Horizontal motion streaks (for panning / speed). */
export function streaks(ctx, { y0 = 0, y1 = ctx.H, count = 30, color = C.cream, opacity = 0.35, r = ctx.r, dir = 1 } = {}) {
  let d = '';
  for (let i = 0; i < count; i++) {
    const y = r.range(y0, y1), x = r.range(-100, ctx.W), L = r.range(60, 380), h = r.range(1, 4);
    d += poly([[x, y], [x + L * dir, y - h / 2], [x + L * dir, y + h / 2]]);
  }
  return P(d, { fill: color, opacity });
}

/** Big-type helper for inside-art lettering (signs, labels). */
export function signText(x, y, txt, { size = 20, fill = C.gold, font = 'Big Shoulders Display', weight = 900, anchor = 'middle', ls = 0.06, rotate = 0, stroke, sw = 0, cls } = {}) {
  return `<text x="${n(x)}" y="${n(y)}" font-family="${font}" font-weight="${weight}" font-size="${n(size)}" letter-spacing="${n(size * ls)}" text-anchor="${anchor}" fill="${fill}"${stroke ? ` stroke="${stroke}" stroke-width="${sw}" paint-order="stroke"` : ''}${rotate ? ` transform="rotate(${rotate} ${n(x)} ${n(y)})"` : ''}${cls ? ` class="${cls}"` : ''}>${esc(String(txt).toUpperCase())}</text>`;
}

export { halftone, radialR, linearR, hatch, poly, line, smooth, circ, at, P, R, G, n, rot, esc };
