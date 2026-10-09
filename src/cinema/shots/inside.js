// Interior shots: crew-table, corridor-camera, laser-hall, guard-patrol, vent-crawl, vault-door, gala-crowd, alarm.
import {
  C, glowDots, cone, reflections, figure, BUILDS, vignette, blinds, signText,
  halftone, radialR, linearR, hatch, poly, line, circ, P, R, G, n, rot,
} from '../kit.js';
import { flare } from './city.js';

const who = (ctx, fallback) => (ctx.p.who && BUILDS[ctx.p.who] ? ctx.p.who : fallback);

/** One-point-perspective box interior. Returns { s, vp, back: [x0,y0,x1,y1] }. */
function corridor(ctx, { vx, vy, bw, bh, wallL = C.ink2, wallR = C.ink3, ceil = C.ink, floor = C.t8, seams = 7, r = ctx.r }) {
  const { W, H } = ctx;
  const b = [vx - bw / 2, vy - bh / 2, vx + bw / 2, vy + bh / 2];
  let s = '';
  s += P(poly([[0, 0], [b[0], b[1]], [b[0], b[3]], [0, H]]), { fill: wallL });
  s += P(poly([[W, 0], [b[2], b[1]], [b[2], b[3]], [W, H]]), { fill: wallR });
  s += P(poly([[0, 0], [W, 0], [b[2], b[1]], [b[0], b[1]]]), { fill: ceil });
  s += P(poly([[0, H], [W, H], [b[2], b[3]], [b[0], b[3]]]), { fill: floor });
  s += R(b[0], b[1], bw, bh, { fill: C.ink });
  // wall seams compressing toward the vanishing point
  let d = '';
  for (let i = 1; i <= seams; i++) {
    const t = 1 - Math.pow(0.72, i);
    const lx = t * b[0], ly0 = t * b[1], ly1 = H + (b[3] - H) * t;
    const rx = W + (b[2] - W) * t;
    d += `M${n(lx)},${n(ly0)}V${n(ly1)}M${n(rx)},${n(ly0)}V${n(ly1)}`;
  }
  s += P(d, { stroke: C.ink, 'stroke-width': 2, opacity: 0.7 });
  return { s, b, depth: (t) => ({ lx: t * b[0], rx: W + (b[2] - W) * t, top: t * b[1], bot: H + (b[3] - H) * t }) };
}

/* ------------------------------------------------------------------ */
/* crew-table: overhead, the lamp pool, the plan, the crew's hands      */
/* ------------------------------------------------------------------ */
const TOP_HAIR = {
  viv: { hair: C.ink, cap: null, coat: C.ink3 },
  dex: { hair: C.ink, cap: null, coat: C.ink2, pomp: true },
  juno: { hair: C.t5, cap: C.t4, coat: C.t7 },
  otis: { hair: C.t6, cap: C.t8, coat: C.ink3, big: true },
  lena: { hair: '#5a2a1c', cap: C.t5, coat: C.ink2 },
  crane: { hair: C.cream2, cap: null, coat: C.ink3 },
  calloway: { hair: C.ink, cap: null, coat: C.t6 },
};
function personTop(x, y, s, ang, id, handsTo) {
  const t = TOP_HAIR[id] || { hair: C.ink, coat: C.ink3 };
  const k = t.big ? 1.35 : 1;
  const tr = `translate(${n(x)} ${n(y)}) rotate(${n(ang)})`;
  let o = `<g transform="${tr}">`;
  // arms reaching toward the table centre (drawn in local space: +y = toward table)
  for (const side of [-1, 1]) {
    o += `<path d="M${n(side * s * 0.7 * k)},${n(s * 0.1)}L${n(side * s * 0.5)},${n(s * (handsTo + 0.1))}" stroke="${t.coat}" stroke-width="${n(s * 0.34 * k)}" stroke-linecap="round"/>`;
    o += `<circle cx="${n(side * s * 0.48)}" cy="${n(s * (handsTo + 0.18))}" r="${n(s * 0.16)}" fill="#8c6a55"/>`;
  }
  o += `<path d="M${n(-s * 0.98 * k)},${n(s * 0.2)}Q${n(-s * 1.0 * k)},${n(-s * 0.42 * k)} 0,${n(-s * 0.45 * k)}Q${n(s * 1.0 * k)},${n(-s * 0.42 * k)} ${n(s * 0.98 * k)},${n(s * 0.2)}Q0,${n(s * 0.34)} ${n(-s * 0.98 * k)},${n(s * 0.2)}Z" fill="${t.coat}"/>`;
  o += `<path d="M${n(-s * 0.9 * k)},${n(s * 0.18)}Q0,${n(s * 0.32)} ${n(s * 0.9 * k)},${n(s * 0.18)}" stroke="${C.gold}" stroke-width="2" fill="none" opacity=".55"/>`;
  o += `<circle cx="0" cy="${n(s * 0.06)}" r="${n(s * 0.38 * (t.big ? 1.15 : 1))}" fill="${t.hair}"/>`;
  if (t.cap) o += `<circle cx="0" cy="${n(s * 0.04)}" r="${n(s * 0.33 * (t.big ? 1.2 : 1))}" fill="${t.cap}"/>`;
  if (t.pomp) o += `<ellipse cx="0" cy="${n(s * 0.3)}" rx="${n(s * 0.22)}" ry="${n(s * 0.16)}" fill="${C.ink}"/>`;
  o += `<path d="M${n(-s * 0.3)},${n(s * 0.2)}A${n(s * 0.38)},${n(s * 0.38)} 0 0 0 ${n(s * 0.3)},${n(s * 0.2)}" stroke="${C.goldHot}" stroke-width="2" fill="none" opacity=".7"/>`;
  return o + '</g>';
}

export function crewTable(ctx) {
  const { W, H, r } = ctx;
  const cx = W / 2, cy = H * 0.52;
  let s = R(0, 0, W, H, { fill: C.ink });
  // table (a slab of dark wood) with grain hatching
  const tw = Math.min(W * 0.78, H * 1.5), th = H * 0.78;
  const tbl = [[cx - tw / 2, cy - th / 2], [cx + tw / 2, cy - th / 2 - 6], [cx + tw / 2 + 4, cy + th / 2], [cx - tw / 2 - 3, cy + th / 2 + 4]];
  s += P(poly(tbl), { fill: C.ink3 });
  s += hatch({ x: cx - tw / 2, y: cy - th / 2, w: tw, h: th, gap: 11, angle: -2, stroke: C.ink2, sw: 1.4, clip: ctx.clip('tbl', poly(tbl)), jitter: 3, r });
  // lamp pool: posterised rings of sodium light (hard edges, not a blur)
  const R0 = H * 0.46;
  s += `<ellipse cx="${n(cx)}" cy="${n(cy)}" rx="${n(R0 * 1.3)}" ry="${n(R0)}" fill="${C.gold}" opacity=".07"/>`;
  s += `<ellipse cx="${n(cx)}" cy="${n(cy)}" rx="${n(R0 * 1.0)}" ry="${n(R0 * 0.78)}" fill="${C.gold}" opacity=".08"/>`;
  s += `<ellipse cx="${n(cx)}" cy="${n(cy)}" rx="${n(R0 * 0.72)}" ry="${n(R0 * 0.56)}" fill="${C.gold}" opacity=".1"/>`;
  s += halftone({ x: cx - R0 * 1.4, y: cy - R0 * 1.1, w: R0 * 2.8, h: R0 * 2.2, step: 9, rFn: (px, py) => { const d = Math.hypot((px - cx) / 1.3, py - cy) / R0; return d > 1.1 || d < 0.85 ? 0 : 2.4 * (1 - Math.abs(d - 0.97) / 0.13); }, fill: C.gold, opacity: 0.35 });
  // the plan: a blueprint print under the lamp, grease-pencil circle round the target
  const pw = H * 0.62, ph = H * 0.42;
  s += `<g transform="rotate(-6 ${n(cx)} ${n(cy)})">`;
  s += R(cx - pw / 2 + 5, cy - ph / 2 + 6, pw, ph, { fill: C.ink, opacity: 0.6 });
  s += R(cx - pw / 2, cy - ph / 2, pw, ph, { fill: C.t5 });
  s += hatch({ x: cx - pw / 2, y: cy - ph / 2, w: pw, h: ph, gap: 12, angle: 0, stroke: C.t4, sw: 0.6 }) + hatch({ x: cx - pw / 2, y: cy - ph / 2, w: pw, h: ph, gap: 12, angle: 90, stroke: C.t4, sw: 0.6 });
  const L = (x1, y1, x2, y2) => `M${n(cx - pw / 2 + x1 * pw)},${n(cy - ph / 2 + y1 * ph)}L${n(cx - pw / 2 + x2 * pw)},${n(cy - ph / 2 + y2 * ph)}`;
  s += P(L(0.1, 0.15, 0.9, 0.15) + L(0.9, 0.15, 0.9, 0.85) + L(0.9, 0.85, 0.1, 0.85) + L(0.1, 0.85, 0.1, 0.15) + L(0.55, 0.15, 0.55, 0.6) + L(0.55, 0.6, 0.9, 0.6) + L(0.1, 0.5, 0.35, 0.5), { stroke: C.cream, 'stroke-width': 2.2, fill: 'none', opacity: 0.85 });
  s += `<ellipse cx="${n(cx + pw * 0.22)}" cy="${n(cy - ph * 0.1)}" rx="${n(pw * 0.14)}" ry="${n(ph * 0.2)}" fill="none" stroke="${C.goldHot}" stroke-width="3" pathLength="1" class="a-draw"/>`;
  s += P(`M${n(cx - pw * 0.35)},${n(cy + ph * 0.3)}C${n(cx - pw * 0.1)},${n(cy + ph * 0.1)} ${n(cx)},${n(cy + ph * 0.05)} ${n(cx + pw * 0.14)},${n(cy - ph * 0.05)}`, { stroke: C.goldHot, 'stroke-width': 2.5, fill: 'none', 'stroke-dasharray': '8 6' });
  s += '</g>';
  // props: coffee cups, ashtray + smoke, a bundle of cash
  const cup = (x, y) => `<circle cx="${n(x)}" cy="${n(y)}" r="${n(H * 0.035)}" fill="${C.cream2}"/><circle cx="${n(x)}" cy="${n(y)}" r="${n(H * 0.026)}" fill="#2a1a10"/><circle cx="${n(x - H * 0.008)}" cy="${n(y - H * 0.008)}" r="${n(H * 0.006)}" fill="${C.goldHot}" opacity=".7"/>`;
  s += cup(cx - pw * 0.72, cy - ph * 0.5) + cup(cx + pw * 0.75, cy + ph * 0.55);
  s += `<circle cx="${n(cx + pw * 0.7)}" cy="${n(cy - ph * 0.55)}" r="${n(H * 0.04)}" fill="${C.ink4}"/><path d="M${n(cx + pw * 0.7)},${n(cy - ph * 0.55)}l${n(H * 0.05)},-2" stroke="${C.cream}" stroke-width="2"/><circle cx="${n(cx + pw * 0.7 + H * 0.05)}" cy="${n(cy - ph * 0.55 - 2)}" r="2" fill="${C.goldHot}" class="a-ember"/>`;
  s += `<path d="M${n(cx + pw * 0.75)},${n(cy - ph * 0.6)}c10,-14 -8,-22 4,-36c10,-12 -4,-20 6,-30" stroke="${C.cream2}" stroke-width="2" fill="none" opacity=".35" class="a-smoke"/>`;
  s += `<g transform="rotate(12 ${n(cx - pw * 0.65)} ${n(cy + ph * 0.55)})">${R(cx - pw * 0.72, cy + ph * 0.5, H * 0.12, H * 0.06, { fill: C.t3 })}${R(cx - pw * 0.68, cy + ph * 0.5, H * 0.02, H * 0.06, { fill: C.manila })}</g>`;
  // the crew around the table, seen from above
  const sz = H * 0.16;
  const seats = [
    ['viv', cx - tw * 0.18, cy - th * 0.55, 0],
    ['lena', cx + tw * 0.22, cy - th * 0.55, 8],
    ['otis', cx + tw * 0.53, cy + th * 0.05, 95],
    ['juno', cx + tw * 0.05, cy + th * 0.6, 180],
    ['dex', cx - tw * 0.53, cy + th * 0.08, -90],
  ];
  const anchors = {};
  for (const [id, x, y, a] of seats) {
    s += personTop(x, y, sz, a, id, 0.9);
    anchors[id] = [x, y];
  }
  s += vignette(ctx, { strength: 1.1 });
  return { svg: s, anchors, space: [0.02, 0.02, 0.42, 0.28], focus: [0.5, 0.5] };
}

/* ------------------------------------------------------------------ */
export function corridorCamera(ctx) {
  const { W, H, r } = ctx;
  const vx = W * 0.6, vy = H * 0.5;
  const cor = corridor(ctx, { vx, vy, bw: H * 0.2, bh: H * 0.28, wallL: C.ink3, wallR: C.ink2, floor: C.t8 });
  let s = cor.s;
  // ceiling lights receding (gold slabs), and their pools on the floor
  for (let i = 1; i <= 5; i++) {
    const t = 1 - Math.pow(0.66, i), d = cor.depth(t);
    const x = vx + (W * 0.6 - vx) * (1 - t) * 0.0, w = (d.rx - d.lx) * 0.18, y = d.top + (vy - d.top) * 0.02;
    s += R(x - w / 2, y, w, Math.max(2, 10 * (1 - t)), { fill: C.goldHot, opacity: 0.9 - i * 0.1 });
    s += `<ellipse cx="${n(x)}" cy="${n(d.bot - (d.bot - vy) * 0.08)}" rx="${n(w * 1.2)}" ry="${n(w * 0.18)}" fill="${C.gold}" opacity="${n(0.2 - i * 0.02)}"/>`;
  }
  s += reflections(ctx, [{ x: vx, w: 18, o: 0.4 }], { y0: vy + H * 0.16, y1: H });
  // crew member flattened against the right wall, in the dark
  const out = {};
  s += figure(W * 0.84, H * 0.97, H * 0.72, { pose: 'stand', build: who(ctx, 'viv'), face: -1, rim: { color: C.t2, dx: -2, dy: 0 }, out });
  // the camera: big, top-left, sweeping its cold cone across the floor
  const px = W * 0.02, py = H * 0.16;
  const cam = `<g class="a-sweep" style="--a0:-8deg;--a1:14deg;--dur:4.5s;transform-origin:${n(px + H * 0.2)}px ${n(py)}px">
    ${cone(ctx, [px + H * 0.44, py + H * 0.1], { dir: -40, spread: 34, len: W * 0.75, color: C.t1, opacity: 0.1, dots: true, name: 'camc' })}
    <path d="${poly([[px + H * 0.16, py - H * 0.08], [px + H * 0.44, py - H * 0.02], [px + H * 0.44, py + H * 0.14], [px + H * 0.16, py + H * 0.08]])}" fill="${C.ink3}"/>
    <path d="${poly([[px + H * 0.16, py - H * 0.08], [px + H * 0.44, py - H * 0.02], [px + H * 0.46, py - H * 0.05], [px + H * 0.18, py - H * 0.11]])}" fill="${C.ink4}"/>
    <path d="M${n(px + H * 0.18)},${n(py - H * 0.11)}L${n(px + H * 0.46)},${n(py - H * 0.05)}" stroke="${C.gold}" stroke-width="2.5"/>
    <ellipse cx="${n(px + H * 0.45)}" cy="${n(py + H * 0.06)}" rx="${n(H * 0.03)}" ry="${n(H * 0.07)}" fill="${C.ink}"/>
    <ellipse cx="${n(px + H * 0.455)}" cy="${n(py + H * 0.06)}" rx="${n(H * 0.018)}" ry="${n(H * 0.045)}" fill="${C.t3}"/>
    <circle cx="${n(px + H * 0.45)}" cy="${n(py + H * 0.04)}" r="${n(H * 0.008)}" fill="${C.cream}"/>
    <circle cx="${n(px + H * 0.2)}" cy="${n(py - H * 0.05)}" r="${n(H * 0.012)}" fill="${C.goldHot}" class="a-blink"/>
  </g>`;
  s += P(`M${n(px - 10)},${n(py - H * 0.02)}H${n(px + H * 0.2)}V${n(py + H * 0.02)}H${n(px - 10)}Z`, { fill: C.ink });
  s += cam;
  s += vignette(ctx);
  return { svg: s, anchors: { _figure: out.mouth, [ctx.p.who || 'viv']: out.mouth }, space: [0.35, 0.04, 0.8, 0.3], sfxAt: [0.3, 0.55], focus: [0.2, 0.2] };
}

/* ------------------------------------------------------------------ */
export function laserHall(ctx) {
  const { W, H, r } = ctx;
  const vx = W * 0.5, vy = H * 0.45;
  const cor = corridor(ctx, { vx, vy, bw: H * 0.22, bh: H * 0.3, wallL: C.ink2, wallR: C.ink3, floor: C.ink2, seams: 8 });
  let s = cor.s;
  // far door glowing
  s += R(vx - H * 0.035, vy - H * 0.06, H * 0.07, H * 0.19, { fill: C.goldDeep, opacity: 0.55 });
  // beams at several depths: thin gold lines, glow sleeve, emitters, faint floor reflections
  let beams = '', glow = '', ems = '', refl = '';
  const depths = [0.12, 0.3, 0.45, 0.58, 0.7, 0.8];
  depths.forEach((t, i) => {
    const d = cor.depth(t);
    const k = 1 - t * 0.8;
    const hA = r.range(0.25, 0.85), hB = hA + r.range(-0.25, 0.25);
    const y1 = d.top + (d.bot - d.top) * hA, y2 = d.top + (d.bot - d.top) * Math.min(0.9, Math.max(0.15, hB));
    const cross = i % 3 === 1;
    const seg = cross ? `M${n(d.lx)},${n(y1)}L${n(d.rx)},${n(y2)}M${n(d.lx)},${n(y2 - 30 * k)}L${n(d.rx)},${n(y1 + 20 * k)}` : `M${n(d.lx)},${n(y1)}L${n(d.rx)},${n(y2)}`;
    beams += `<path d="${seg}" stroke="${C.goldPale}" stroke-width="${n(1.2 + 1.6 * k)}" class="${i % 2 ? 'a-pulse' : ''}"/>`;
    glow += `<path d="${seg}" stroke="${C.gold}" stroke-width="${n(6 + 10 * k)}" opacity=".2"/>`;
    ems += `<circle cx="${n(d.lx)}" cy="${n(y1)}" r="${n(2 + 4 * k)}" fill="${C.goldHot}"/><circle cx="${n(d.rx)}" cy="${n(y2)}" r="${n(2 + 4 * k)}" fill="${C.goldHot}"/>`;
    refl += `<path d="M${n(d.lx)},${n(d.bot + (H - d.bot) * 0.1)}L${n(d.rx)},${n(d.bot + (H - d.bot) * 0.1)}" stroke="${C.gold}" stroke-width="${n(1 + 2 * k)}" opacity=".18"/>`;
  });
  s += refl + glow;
  // dust in the beams: sparse halftone specks
  s += halftone({ w: W, h: H, step: 17, angle: 23, rFn: () => (r() < 0.08 ? r.range(0.6, 1.4) : 0), fill: C.goldHot, opacity: 0.45 });
  // the contortionist, mid-depth, threading between beams
  const d = cor.depth(0.5);
  const out = {};
  s += figure(vx - H * 0.02, d.bot - 2, (d.bot - d.top) * 0.52, { pose: 'contort', build: who(ctx, 'lena'), face: 1, rim: { color: C.goldHot, dx: 0, dy: -2.5 }, out });
  s += beams + ems;
  s += vignette(ctx, { strength: 1.1 });
  return { svg: s, anchors: { _figure: out.mouth, [ctx.p.who || 'lena']: out.mouth }, space: [0.03, 0.03, 0.4, 0.25], sfxAt: [0.72, 0.28], focus: [0.5, 0.5] };
}

/* ------------------------------------------------------------------ */
export function guardPatrol(ctx) {
  const { W, H, r } = ctx;
  let s = R(0, 0, W, H, { fill: C.ink2 });
  // high warehouse windows throwing cold moonlight shafts
  for (let i = 0; i < 3; i++) {
    const x = W * (0.3 + i * 0.22), y = H * 0.06, w = H * 0.12, h = H * 0.2;
    s += R(x, y, w, h, { fill: C.t4 });
    s += P(`M${n(x + w / 2)},${n(y)}V${n(y + h)}M${n(x)},${n(y + h / 2)}H${n(x + w)}`, { stroke: C.ink2, 'stroke-width': 4 });
    s += P(poly([[x, y + h], [x + w, y + h], [x + w + H * 0.5, H * 0.95], [x + H * 0.4, H * 0.95]]), { fill: C.t3, opacity: 0.08 });
  }
  s += R(0, H * 0.78, W, H * 0.22, { fill: C.ink });
  s += P(`M0,${n(H * 0.78)}H${n(W)}`, { stroke: C.t5, 'stroke-width': 2 });
  // shelving silhouettes
  for (let i = 0; i < 4; i++) { const x = W * (0.05 + i * 0.12); s += R(x, H * 0.35, W * 0.08, H * 0.43, { fill: C.ink3 }) + P(`M${n(x)},${n(H * 0.5)}h${n(W * 0.08)}M${n(x)},${n(H * 0.64)}h${n(W * 0.08)}`, { stroke: C.ink2, 'stroke-width': 3 }); }
  // the guard, cap and flashlight, sweeping
  const gx = W * 0.72, gy = H * 0.94, gs = H * 0.78;
  const out = {};
  const gfig = figure(gx, gy, gs, { pose: 'flashlight', build: 'guard', face: -1, rim: { color: C.t1, dx: 2.5, dy: -1 }, out });
  const [hx, hy] = out.hand;
  s += `<g class="a-sweep" style="--a0:-10deg;--a1:12deg;--dur:3.4s;transform-origin:${n(hx)}px ${n(hy)}px">${cone(ctx, [hx, hy], { dir: -78, spread: 22, len: W * 0.7, color: C.goldHot, opacity: 0.18, name: 'fl' })}</g>`;
  s += gfig;
  s += flare(hx, hy, H * 0.07);
  // foreground crate with our crew member hiding: only the rim of a head and one eye glint
  const cx0 = W * 0.02, cw = W * 0.26, ctop = H * 0.62;
  const crew = figure(cx0 + cw * 0.72, H * 1.02, H * 0.55, { pose: 'crouch', build: who(ctx, 'dex'), face: 1, fill: C.ink, rim: { color: C.gold, dx: 2, dy: -2 } });
  s += crew;
  s += P(poly([[cx0 - 20, ctop], [cx0 + cw, ctop + 6], [cx0 + cw, H + 5], [cx0 - 20, H + 5]]), { fill: C.ink });
  s += P(`M${n(cx0)},${n(ctop + H * 0.05)}L${n(cx0 + cw)},${n(H)}M${n(cx0 + cw)},${n(ctop + H * 0.05)}L${n(cx0)},${n(H)}`, { stroke: C.ink3, 'stroke-width': 4 });
  s += P(`M${n(cx0 - 20)},${n(ctop)}L${n(cx0 + cw)},${n(ctop + 6)}`, { stroke: C.gold, 'stroke-width': 2, opacity: 0.6 });
  s += vignette(ctx);
  return { svg: s, anchors: { guard: out.mouth, _figure: out.mouth }, space: [0.28, 0.35, 0.6, 0.6], sfxAt: [0.4, 0.4], focus: [0.6, 0.5] };
}

/* ------------------------------------------------------------------ */
export function ventCrawl(ctx) {
  const { W, H, r } = ctx;
  const vx = W * 0.5, vy = H * 0.5;
  let s = R(0, 0, W, H, { fill: C.t9 });
  // nested duct ribs (square rings receding), lit from the far grille
  const far = { w: H * 0.26, h: H * 0.18 };
  const rings = 9;
  for (let i = 0; i < rings; i++) {
    const t = Math.pow(i / rings, 1.6);
    const w = W * 1.05 + (far.w - W * 1.05) * t, h = H * 1.05 + (far.h - H * 1.05) * t;
    const shade = [C.ink, C.t9, C.t8, C.t8, C.t7, C.t7, C.t6, C.t6, C.t5][i];
    s += R(vx - w / 2, vy - h / 2, w, h, { fill: shade });
    s += R(vx - w / 2, vy - h / 2, w, h, { fill: 'none', stroke: C.ink, 'stroke-width': 3 - t * 2 });
  }
  // corner creases
  s += P(`M0,0L${n(vx - far.w / 2)},${n(vy - far.h / 2)}M${n(W)},0L${n(vx + far.w / 2)},${n(vy - far.h / 2)}M0,${n(H)}L${n(vx - far.w / 2)},${n(vy + far.h / 2)}M${n(W)},${n(H)}L${n(vx + far.w / 2)},${n(vy + far.h / 2)}`, { stroke: C.ink, 'stroke-width': 2, opacity: 0.8 });
  // far grille: the light source, slats in ink
  s += R(vx - far.w / 2, vy - far.h / 2, far.w, far.h, { fill: C.goldHot });
  let sl = '';
  for (let i = 0; i < 7; i++) sl += `M${n(vx - far.w / 2)},${n(vy - far.h / 2 + (i + 0.5) * far.h / 7)}h${n(far.w)}`;
  s += P(sl, { stroke: C.ink, 'stroke-width': n(far.h / 16) });
  // slat light stripes thrown along the duct floor toward us
  let st = '';
  for (let i = 0; i < 5; i++) {
    const a = vx - far.w / 2 + (i + 0.2) * far.w / 5, b = a + far.w / 12;
    const A = [a + (a - vx) * 0.0, vy + far.h / 2], B = [b, vy + far.h / 2];
    st += poly([A, B, [vx + (b - vx) * 5, H], [vx + (a - vx) * 5, H]]);
  }
  s += P(st, { fill: C.gold, opacity: 0.12 });
  // the crawler, coming toward us, backlit by the grille
  const out = {};
  const bw = who(ctx, 'juno');
  const hx = vx - H * 0.02, hy = vy + H * 0.02, u = H * 0.09;
  let fig = '';
  // shoulders + arms reaching forward onto the duct floor (front view)
  fig += `<path d="M${n(hx - u * 1.8)},${n(hy + u * 2.2)}Q${n(hx - u * 1.7)},${n(hy + u * 0.6)} ${n(hx)},${n(hy + u * 0.55)}Q${n(hx + u * 1.7)},${n(hy + u * 0.6)} ${n(hx + u * 1.8)},${n(hy + u * 2.2)}Z"/>`;
  fig += `<path d="M${n(hx - u * 1.5)},${n(hy + u * 1.2)}L${n(hx - u * 3.1)},${n(hy + u * 3.4)}L${n(hx - u * 2.5)},${n(hy + u * 3.8)}L${n(hx - u * 0.9)},${n(hy + u * 1.9)}Z"/>`;
  fig += `<path d="M${n(hx + u * 1.5)},${n(hy + u * 1.2)}L${n(hx + u * 2.6)},${n(hy + u * 3.3)}L${n(hx + u * 3.3)},${n(hy + u * 3.1)}L${n(hx + u * 0.9)},${n(hy + u * 1.9)}Z"/>`;
  fig += `<ellipse cx="${n(hx - u * 2.9)}" cy="${n(hy + u * 3.7)}" rx="${n(u * 0.5)}" ry="${n(u * 0.3)}"/><ellipse cx="${n(hx + u * 3.05)}" cy="${n(hy + u * 3.35)}" rx="${n(u * 0.5)}" ry="${n(u * 0.3)}"/>`;
  fig += `<circle cx="${n(hx)}" cy="${n(hy)}" r="${n(u * 0.62)}"/>`;
  const hairs = { juno: `<path d="M${n(hx - u * 0.7)},${n(hy - u * 0.05)}C${n(hx - u * 0.8)},${n(hy - u * 1.3)} ${n(hx + u * 0.8)},${n(hy - u * 1.3)} ${n(hx + u * 0.7)},${n(hy - u * 0.05)}Z"/>`, viv: `<path d="M${n(hx - u * 0.75)},${n(hy + u * 0.5)}L${n(hx - u * 0.8)},${n(hy - u * 0.5)}Q${n(hx)},${n(hy - u * 1.1)} ${n(hx + u * 0.8)},${n(hy - u * 0.5)}L${n(hx + u * 0.75)},${n(hy + u * 0.5)}Z"/>`, otis: `<path d="M${n(hx - u * 0.9)},${n(hy - u * 0.25)}Q${n(hx)},${n(hy - u * 1.1)} ${n(hx + u * 0.9)},${n(hy - u * 0.25)}Z"/>` };
  fig += hairs[bw] || '';
  s += `<g fill="${C.goldHot}" transform="translate(0 -3)">${fig}</g><g fill="${C.ink}">${fig}</g>`;
  // flashlight in the hand, pointed at us
  s += flare(hx + u * 3.05, hy + u * 3.25, H * 0.12);
  // the near grille we look through: heavy slats top and bottom edge
  let ng = '';
  for (let i = 0; i < 3; i++) ng += R(-5, i * H * 0.045, W + 10, H * 0.026, {}) + R(-5, H - (i + 1) * H * 0.045, W + 10, H * 0.026, {});
  s += `<g fill="${C.ink}">${ng}</g>`;
  s += vignette(ctx, { strength: 1.2 });
  out.mouth = [hx + u * 0.2, hy + u * 0.3];
  return { svg: s, anchors: { _figure: out.mouth, [bw]: out.mouth }, space: [0.03, 0.1, 0.35, 0.35], sfxAt: [0.75, 0.3], focus: [0.5, 0.5] };
}

/* ------------------------------------------------------------------ */
export function vaultDoor(ctx) {
  const { W, H, r } = ctx;
  let s = R(0, 0, W, H, { fill: C.ink3 });
  // concrete wall panels + floor
  s += hatch({ w: W, h: H * 0.75, gap: 16, angle: 90, stroke: C.ink2, sw: 2 });
  const fl = H * 0.75;
  s += R(0, fl, W, H - fl, { fill: C.ink2 });
  // the opening: blazing interior, deposit boxes in silhouette
  const ox = W * 0.42, oy = H * 0.44, orad = H * 0.3;
  s += `<circle cx="${n(ox)}" cy="${n(oy)}" r="${n(orad * 1.08)}" fill="${C.ink}"/>`;
  s += `<circle cx="${n(ox)}" cy="${n(oy)}" r="${n(orad)}" fill="${C.goldHot}"/>`;
  const vc = ctx.clip('vo', `M${n(ox - orad)},${n(oy)}a${n(orad)},${n(orad)} 0 1,0 ${n(orad * 2)},0a${n(orad)},${n(orad)} 0 1,0 ${n(-orad * 2)},0`);
  let boxes = '';
  for (let j = 0; j < 7; j++) for (let i = 0; i < 9; i++) boxes += `M${n(ox - orad + i * orad * 0.24 + 4)},${n(oy - orad + j * orad * 0.3 + 4)}h${n(orad * 0.2)}v${n(orad * 0.24)}h${n(-orad * 0.2)}Z`;
  s += `<g clip-path="url(#${vc})"><path d="${boxes}" fill="${C.gold}"/>${halftone({ x: ox - orad, y: oy - orad, w: orad * 2, h: orad * 2, step: 7, rFn: (px, py) => Math.max(0, (Math.hypot(px - ox, py - oy) / orad - 0.55)) * 5, fill: C.goldDeep, opacity: 0.8 })}</g>`;
  // light spilling onto the floor toward us: hard-edged wedge
  s += P(poly([[ox - orad * 0.8, fl], [ox + orad * 0.8, fl], [ox + orad * 2.4, H], [ox - orad * 1.6, H]]), { fill: C.gold, opacity: 0.35 });
  s += P(poly([[ox - orad * 0.45, fl], [ox + orad * 0.45, fl], [ox + orad * 1.3, H], [ox - orad * 0.9, H]]), { fill: C.goldHot, opacity: 0.25 });
  s += glowDots(ctx, ox, oy, orad * 1.9, { color: C.gold, max: 2.4, step: 9, opacity: 0.35 });
  // the figure in the doorway, small against the light, long shadow toward us
  const out = {};
  s += P(poly([[ox - 8, oy + orad * 0.95], [ox + 8, oy + orad * 0.95], [ox + orad * 0.5, H], [ox - orad * 0.2, H]]), { fill: C.ink, opacity: 0.85 });
  s += figure(ox, oy + orad * 0.95, orad * 1.15, { pose: 'stand', build: who(ctx, 'juno'), face: 1, out });
  // the door: a huge disc swung open toward us on the right, seen edge-on-ish
  const dx = ox + orad * 1.55, dy = oy, drx = orad * 0.42, dry = orad * 1.1;
  s += `<ellipse cx="${n(dx + drx * 0.35)}" cy="${n(dy)}" rx="${n(drx)}" ry="${n(dry)}" fill="${C.ink}"/>`;
  s += `<ellipse cx="${n(dx)}" cy="${n(dy)}" rx="${n(drx)}" ry="${n(dry)}" fill="${C.ink4}"/>`;
  s += `<ellipse cx="${n(dx)}" cy="${n(dy)}" rx="${n(drx * 0.78)}" ry="${n(dry * 0.8)}" fill="none" stroke="${C.ink2}" stroke-width="4"/>`;
  s += `<ellipse cx="${n(dx)}" cy="${n(dy)}" rx="${n(drx * 0.5)}" ry="${n(dry * 0.5)}" fill="none" stroke="${C.ink2}" stroke-width="3"/>`;
  // bolts along the rim, catching the vault light
  for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 2; const bx = dx - Math.cos(a) * drx * 0.95, by = dy + Math.sin(a) * dry * 0.95; s += `<rect x="${n(bx - 10)}" y="${n(by - 4)}" width="14" height="8" fill="${C.ink}"/><rect x="${n(bx - 10)}" y="${n(by - 4)}" width="14" height="2.5" fill="${C.gold}"/>`; }
  // handle wheel
  s += `<ellipse cx="${n(dx)}" cy="${n(dy)}" rx="${n(drx * 0.28)}" ry="${n(dry * 0.28)}" fill="none" stroke="${C.cream2}" stroke-width="4"/>`;
  s += P(`M${n(dx)},${n(dy - dry * 0.28)}V${n(dy + dry * 0.28)}M${n(dx - drx * 0.28)},${n(dy)}H${n(dx + drx * 0.28)}`, { stroke: C.cream2, 'stroke-width': 3 });
  // rim light down the door's left edge
  s += `<path d="M${n(dx)},${n(dy - dry)}A${n(drx)},${n(dry)} 0 0 0 ${n(dx)},${n(dy + dry)}" stroke="${C.goldHot}" stroke-width="4" fill="none"/>`;
  s += vignette(ctx);
  return { svg: s, anchors: { _figure: out.mouth, [ctx.p.who || 'juno']: out.mouth }, space: [0.03, 0.03, 0.45, 0.25], sfxAt: [0.75, 0.2], focus: [0.42, 0.44] };
}

/* ------------------------------------------------------------------ */
export function galaCrowd(ctx) {
  const { W, H, r } = ctx;
  let s = R(0, 0, W, H, { fill: C.t8 });
  // columns and tall mirrors
  for (let i = 0; i < 6; i++) {
    const x = (i / 5) * W;
    s += R(x - H * 0.04, 0, H * 0.08, H, { fill: C.t7 }) + R(x - H * 0.055, H * 0.08, H * 0.11, H * 0.03, { fill: C.goldDeep });
    if (i < 5) s += P(`M${n(x + W * 0.06)},${n(H * 0.7)}V${n(H * 0.3)}A${n(W * 0.04)},${n(W * 0.04)} 0 0 1 ${n(x + W * 0.14)},${n(H * 0.3)}V${n(H * 0.7)}Z`, { fill: C.t6 });
  }
  // chandelier: tiers of gold drops, twinkling
  const cx = W * 0.5, cy = H * 0.14;
  s += glowDots(ctx, cx, cy + H * 0.05, H * 0.5, { color: C.gold, max: 3, step: 10, opacity: 0.45, sy: 0.8 });
  s += P(`M${n(cx)},-5V${n(cy - H * 0.06)}`, { stroke: C.goldDeep, 'stroke-width': 3 });
  for (let t = 0; t < 3; t++) {
    const w = H * (0.34 - t * 0.09), y = cy - H * 0.04 + t * H * 0.06;
    s += `<ellipse cx="${n(cx)}" cy="${n(y)}" rx="${n(w)}" ry="${n(w * 0.12)}" fill="none" stroke="${C.gold}" stroke-width="3"/>`;
    let drops = '';
    for (let i = 0; i < 12 - t * 3; i++) { const a = (i / (12 - t * 3)) * Math.PI * 2; const dx = cx + Math.cos(a) * w, dy = y + Math.sin(a) * w * 0.12; drops += `M${n(dx)},${n(dy)}l-3,7l3,7l3,-7Z`; }
    s += P(drops, { fill: C.goldHot });
  }
  for (let i = 0; i < 5; i++) { const x = cx + r.range(-H * 0.3, H * 0.3), y = cy + r.range(-H * 0.04, H * 0.12); s += `<g class="a-twinkle" style="transform-origin:${n(x)}px ${n(y)}px;animation-delay:${(-i * 0.37).toFixed(2)}s">${flare(x, y, H * 0.04, C.goldPale, '')}</g>`; }
  // crowd: three depth rows of silhouettes
  const rows = [[H * 0.74, H * 0.3, C.t6, 12], [H * 0.9, H * 0.46, C.ink3, 8], [H * 1.5, H * 0.9, C.ink, 5]];
  const anchors = {};
  rows.forEach(([gy, fs, fill, count], ri) => {
    for (let i = 0; i < count; i++) {
      const x = (i + 0.5 + r.jit(0.25)) * (W / count);
      if (ri === 1 && Math.abs(x - W * 0.5) < W * 0.08) continue; // leave room for the star
      const build = r.pick(['tux', 'gown', 'tux', 'gown', 'crane']);
      const pose = r.pick(['stand', 'toast', 'pockets', 'toast']);
      const o = {};
      s += figure(x, gy, fs * r.range(0.9, 1.08), { pose, build, face: r.chance(0.5) ? 1 : -1, fill, out: o });
      if (pose === 'toast' && ri < 2) s += `<path d="M${n(o.hand[0] - 5)},${n(o.hand[1] - 16)}h10l-5,10z" fill="${C.cream}" opacity="${ri === 0 ? 0.5 : 0.85}"/>`;
    }
    if (ri === 1) {
      // the star of the room: Lena, gown, rim-lit, glass raised, in her own pool of light
      const o = {};
      s += cone(ctx, [W * 0.5, -10], { dir: 0, spread: 22, len: gy + 10, color: C.goldHot, opacity: 0.14, name: 'star' });
      s += `<ellipse cx="${n(W * 0.5)}" cy="${n(gy)}" rx="${n(fs * 0.5)}" ry="${n(fs * 0.07)}" fill="${C.gold}" opacity=".35"/>`;
      s += figure(W * 0.5, gy, fs * 1.2, { pose: 'toast', build: 'lena', face: 1, rim: { color: C.goldHot, dx: 3, dy: -2 }, fill: C.ink, out: o });
      s += `<path d="M${n(o.hand[0] - 6)},${n(o.hand[1] - 18)}h12l-6,12z" fill="${C.goldPale}"/><path d="M${n(o.hand[0])},${n(o.hand[1] - 6)}v8" stroke="${C.goldPale}" stroke-width="1.5"/>`;
      anchors.lena = o.mouth; anchors._figure = o.mouth;
    }
  });
  s += vignette(ctx, { strength: 0.9 });
  return { svg: s, anchors, space: [0.03, 0.03, 0.34, 0.3], focus: [0.5, 0.55] };
}

/* ------------------------------------------------------------------ */
export function alarm(ctx) {
  const { W, H, r } = ctx;
  let s = R(0, 0, W, H, { fill: C.alarmDeep });
  s += R(0, 0, W, H, { fill: C.ink, opacity: 0.55 });
  // rotating beacon beams sweeping the room (on twos)
  const bx = W * 0.62, by = H * 0.1;
  s += `<g class="a-rotor" style="transform-origin:${n(bx)}px ${n(by)}px">${cone(ctx, [bx, by], { dir: 60, spread: 26, len: W * 1.2, color: C.alarm, opacity: 0.2, dots: true, name: 'bm1' })}${cone(ctx, [bx, by], { dir: 240, spread: 26, len: W * 1.2, color: C.alarm, opacity: 0.2, dots: false, name: 'bm2' })}</g>`;
  s += `<path d="M${n(bx - 18)},${n(by + 14)}V${n(by - 6)}Q${n(bx)},${n(by - 26)} ${n(bx + 18)},${n(by - 6)}V${n(by + 14)}Z" fill="${C.alarm}"/>${R(bx - 24, by + 14, 48, 8, { fill: C.ink })}`;
  // the bell: big, dutch-tilted, shaking
  const cx = W * 0.36, cy = H * 0.5, R0 = H * 0.3;
  s += `<g transform="rotate(-10 ${n(cx)} ${n(cy)})">`;
  // shock rings
  let rings = '';
  for (let i = 0; i < 3; i++) rings += `<path d="M${n(cx - R0 * (1.25 + i * 0.22))},${n(cy - R0 * 0.3)}A${n(R0 * (1.25 + i * 0.22))},${n(R0 * (1.25 + i * 0.22))} 0 0 1 ${n(cx - R0 * 0.2)},${n(cy - R0 * (1.25 + i * 0.22))}" stroke="${C.alarm}" stroke-width="${6 - i * 1.5}" fill="none"/><path d="M${n(cx + R0 * (1.25 + i * 0.22))},${n(cy + R0 * 0.3)}A${n(R0 * (1.25 + i * 0.22))},${n(R0 * (1.25 + i * 0.22))} 0 0 1 ${n(cx + R0 * 0.2)},${n(cy + R0 * (1.25 + i * 0.22))}" stroke="${C.alarm}" stroke-width="${6 - i * 1.5}" fill="none"/>`;
  s += `<g class="a-pulse">${rings}</g>`;
  s += `<g class="a-shake" style="transform-origin:${n(cx)}px ${n(cy)}px">`;
  s += `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(R0)}" fill="${C.ink}"/>`;
  s += `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(R0 * 0.94)}" fill="${C.alarm}"/>`;
  s += `<path d="M${n(cx - R0 * 0.94)},${n(cy)}A${n(R0 * 0.94)},${n(R0 * 0.94)} 0 0 1 ${n(cx + R0 * 0.94)},${n(cy)}Z" fill="#f06a52"/>`;
  s += halftone({ x: cx - R0, y: cy - R0, w: R0 * 2, h: R0 * 2, step: 7, rFn: (px, py) => { const d = Math.hypot(px - cx, py - cy); return d > R0 * 0.92 ? 0 : Math.max(0, (py - cy) / R0) * 3; }, fill: C.alarmDeep });
  s += `<path d="M${n(cx - R0 * 0.55)},${n(cy - R0 * 0.62)}A${n(R0 * 0.8)},${n(R0 * 0.8)} 0 0 1 ${n(cx + R0 * 0.1)},${n(cy - R0 * 0.8)}" stroke="#ffd0c4" stroke-width="${n(R0 * 0.06)}" fill="none" stroke-linecap="round"/>`;
  s += `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(R0 * 0.12)}" fill="${C.ink}"/><rect x="${n(cx + R0 * 0.2)}" y="${n(cy + R0 * 0.5)}" width="${n(R0 * 0.22)}" height="${n(R0 * 0.22)}" fill="${C.ink}"/>`;
  s += `</g></g>`;
  // a doorway on the right, its frame catching the red
  s += R(W * 0.8, H * 0.22, W * 0.14, H * 0.78, { fill: C.ink }) + P(`M${n(W * 0.8)},${n(H)}V${n(H * 0.22)}H${n(W * 0.94)}V${n(H)}`, { stroke: C.alarm, 'stroke-width': 3, fill: 'none', class: 'a-siren' });
  s += vignette(ctx, { strength: 1.2 });
  return { svg: s, space: [0.55, 0.04, 0.97, 0.3], sfxAt: [0.62, 0.62], focus: [0.36, 0.5] };
}
