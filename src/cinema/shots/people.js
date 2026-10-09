// People shots: face, two-shot, phone, car-interior, silhouette-reveal, title-card.
// Faces reuse the crew portraits (src/art/portraits.js) so a character reads the same everywhere.
import { portraitMarkup, portraitSilhouette } from '../../art/portraits.js';
import { CREW } from '../../data/crew.js';
import {
  C, glowDots, cone, reflections, figure, vignette, blinds, signText, skyline, speedLines, streaks,
  halftone, radialR, linearR, hatch, poly, line, circ, P, R, G, n, esc,
} from '../kit.js';
import { flare } from './city.js';

// Portrait-space landmarks (0..100 box): mouth, eyes band
const MOUTH = [61, 57];

/** Place a portrait: returns { s, map([x,y]) } with scale k and top-left (x, y); mirror flips it to face left. */
function placePortrait(ctx, id, { x, y, k, mood = 'calm', mirror = false, rim = null }) {
  const uid = ctx.gid('pp' + Math.round(x));
  const t = mirror ? `translate(${n(x + 100 * k)} ${n(y)}) scale(${n(-k)} ${n(k)})` : `translate(${n(x)} ${n(y)}) scale(${n(k)})`;
  let s = '';
  if (rim) s += `<g transform="${t} translate(${rim.dx} ${rim.dy})">${portraitSilhouette(id, rim.color, uid + 'r')}</g>`;
  s += `<g transform="${t}">${portraitMarkup(id, { mood, bg: false, uid })}</g>`;
  const map = ([px, py]) => [mirror ? x + (100 - px) * k : x + px * k, y + py * k];
  return { s, map };
}

/* ------------------------------------------------------------------ */
export function face(ctx) {
  const { W, H, r, p } = ctx;
  const id = p.who || 'viv', mood = p.mood || 'calm';
  const wide = W > H * 1.25;
  let s = R(0, 0, W, H, { fill: C.t8 });
  const k = H * (wide ? 1.12 : 0.86) / 100;
  const x = (wide ? W * 0.3 : W * 0.42) - 52 * k, y = H * 1.04 - 100 * k;
  if (mood === 'shock') {
    s = R(0, 0, W, H, { fill: C.t7 });
    s += speedLines(ctx, { cx: x + 55 * k, cy: y + 45 * k, count: 70, inner: 0.18, color: C.cream, opacity: 0.35 });
    s += glowDots(ctx, x + 55 * k, y + 45 * k, H * 0.9, { color: C.t3, max: 3, step: 11, opacity: 0.7 });
  } else if (mood === 'smirk') {
    s += blinds(ctx, { angle: -16, gap: 50, band: 24, color: C.gold, opacity: 0.2 });
    s += glowDots(ctx, W * 0.85, H * 0.2, H * 0.7, { color: C.gold, max: 2.8, step: 10, opacity: 0.35 });
  } else if (mood === 'tense') {
    s = R(0, 0, W, H, { fill: C.ink2 });
    s += blinds(ctx, { angle: -34, gap: 40, band: 14, color: C.gold, opacity: 0.2 });
    s += hatch({ w: W, h: H, gap: 8, angle: 55, stroke: C.ink, sw: 1.6, opacity: 0.6 });
  } else {
    s += blinds(ctx, { angle: -18, gap: 56, band: 24, color: C.gold, opacity: 0.16 });
  }
  const pp = placePortrait(ctx, id, { x, y, k, mood });
  s += pp.s;
  // blind shadows falling across the face too (calm / tense): the light is in the room, not on a sticker
  if (mood === 'calm' || mood === 'tense') s += blinds(ctx, { angle: mood === 'tense' ? -34 : -18, gap: mood === 'tense' ? 40 : 56, band: mood === 'tense' ? 26 : 30, color: C.ink, opacity: 0.22 });
  s += vignette(ctx, { strength: 0.9 });
  const out = mood === 'tense' ? `<g transform="rotate(-5 ${n(W / 2)} ${n(H / 2)})">${R(-W * 0.1, -H * 0.1, W * 1.2, H * 1.2, { fill: C.ink2 })}${s}</g>` : s;
  const space = wide ? [0.56, 0.06, 0.97, 0.6] : [0.04, 0.03, 0.96, 0.28];
  return { svg: out, anchors: { [id]: pp.map(MOUTH) }, space, sfxAt: wide ? [0.78, 0.7] : [0.7, 0.85], focus: [wide ? 0.3 : 0.5, 0.45] };
}

/* ------------------------------------------------------------------ */
export function twoShot(ctx) {
  const { W, H, r, p } = ctx;
  const a = p.a || 'viv', b = p.b || 'dex';
  let s = R(0, 0, W, H, { fill: C.t8 });
  // back wall: a window with the city beyond, hard lamp between them
  const wx = W * 0.5 - H * 0.28, wy = H * 0.1, ww = H * 0.56, wh = H * 0.5;
  s += R(wx, wy, ww, wh, { fill: C.t6 });
  s += skyline(ctx, { base: wy + wh, depth: 0.1, hMin: 0.12, hMax: 0.35, lit: 0.1, x0: wx, x1: wx + ww, extras: false }).replace(/<path/g, `<path clip-path="url(#${ctx.clip('win', `M${n(wx)},${n(wy)}h${n(ww)}v${n(wh)}h${n(-ww)}Z`)})"`);
  s += P(`M${n(wx + ww / 2)},${n(wy)}V${n(wy + wh)}M${n(wx)},${n(wy + wh / 2)}H${n(wx + ww)}`, { stroke: C.ink2, 'stroke-width': 6 });
  s += R(wx, wy, ww, wh, { fill: 'none', stroke: C.ink2, 'stroke-width': 8 });
  s += cone(ctx, [W * 0.5, -10], { dir: 0, spread: 36, len: H * 1.1, color: C.gold, opacity: 0.1, name: 'lamp' });
  s += P(`M${n(W * 0.5 - 22)},${n(H * 0.02)}h44l-8,-24h-28Z`, { fill: C.ink });
  // A: foreground-left, bigger, facing right; B: mid-right, mirrored to face A
  const ka = H * 1.02 / 100, kb = H * 0.84 / 100;
  const A = placePortrait(ctx, a, { x: W * 0.26 - 52 * ka, y: H * 1.06 - 100 * ka, k: ka, mood: p.moodA || 'calm' });
  const B = placePortrait(ctx, b, { x: W * 0.76 - 48 * kb, y: H * 1.02 - 100 * kb, k: kb, mood: p.moodB || 'calm', mirror: true });
  s += B.s + A.s;
  s += vignette(ctx);
  return { svg: s, anchors: { [a]: A.map(MOUTH), [b]: B.map(MOUTH) }, space: [0.3, 0.03, 0.7, 0.3], focus: [0.5, 0.45] };
}

/* ------------------------------------------------------------------ */
export function phone(ctx) {
  const { W, H, r, p } = ctx;
  const id = p.who || 'viv';
  const wide = W > H * 1.25;
  let s = R(0, 0, W, H, { fill: C.t9 });
  // phone booth glass: panes, rain-streaked, a neon sign smeared across it
  s += glowDots(ctx, W * 0.75, H * 0.3, H * 0.6, { color: C.gold, max: 3, step: 11, opacity: 0.4 });
  s += `<g class="a-flicker">${signText(W * 0.8, H * 0.36, 'HOTEL', { size: H * 0.12, fill: C.gold, ls: 0.2, rotate: 0 })}</g>`;
  s += R(0, 0, W, H, { fill: C.t6, opacity: 0.25 });
  let fr = '';
  for (const fx of [0.02, 0.52, 0.98]) fr += R(W * fx - 8, 0, 16, H, {});
  fr += R(0, H * 0.18, W, 12, {}) + R(0, H * 0.74, W, 12, {});
  s += `<g fill="${C.ink}">${fr}</g>`;
  // drops on the glass
  let dr = '';
  for (let i = 0; i < 60; i++) { const x = r.range(0, W), y = r.range(0, H), rr = r.range(1.5, 4.5); dr += circ(x, y, rr); }
  s += P(dr, { fill: C.t1, opacity: 0.28 });
  const k = H * 1.05 / 100;
  const x = (wide ? W * 0.3 : W * 0.46) - 52 * k, y = H * 1.04 - 100 * k;
  const pp = placePortrait(ctx, id, { x, y, k, mood: p.mood || 'calm' });
  s += pp.s;
  // the handset: earpiece at the back of the head, mouthpiece at the chin; cord coiling off-frame
  const E = pp.map([37, 44]), M = pp.map([58, 68]);
  const dx = M[0] - E[0], dy = M[1] - E[1], L = Math.hypot(dx, dy), ang = (Math.atan2(dy, dx) * 180) / Math.PI;
  s += `<g transform="translate(${n(E[0])} ${n(E[1])}) rotate(${n(ang)})">
    <path d="M${n(-L * 0.12)},${n(-L * 0.16)}Q${n(L * 0.5)},${n(L * 0.02)} ${n(L * 1.1)},${n(-L * 0.16)}L${n(L * 1.12)},${n(L * 0.14)}Q${n(L * 0.5)},${n(L * 0.3)} ${n(-L * 0.12)},${n(L * 0.14)}Z" fill="${C.gold}" transform="translate(-3 -3)"/>
    <path d="M${n(-L * 0.12)},${n(-L * 0.16)}Q${n(L * 0.5)},${n(L * 0.02)} ${n(L * 1.1)},${n(-L * 0.16)}L${n(L * 1.12)},${n(L * 0.14)}Q${n(L * 0.5)},${n(L * 0.3)} ${n(-L * 0.12)},${n(L * 0.14)}Z" fill="${C.ink}"/>
    <ellipse cx="${n(-L * 0.04)}" cy="0" rx="${n(L * 0.14)}" ry="${n(L * 0.24)}" fill="${C.ink}"/><ellipse cx="${n(L * 1.02)}" cy="0" rx="${n(L * 0.14)}" ry="${n(L * 0.24)}" fill="${C.ink}"/>
  </g>`;
  let cord = `M${n(M[0])},${n(M[1] + L * 0.2)}`;
  for (let i = 0; i < 14; i++) cord += `c${n(-L * 0.12)},${n(L * 0.02)} ${n(-L * 0.12)},${n(L * 0.12)} 0,${n(L * 0.1)}`;
  s += P(cord, { stroke: C.ink, 'stroke-width': 5, fill: 'none' });
  s += vignette(ctx);
  return { svg: s, anchors: { [id]: pp.map(MOUTH) }, space: wide ? [0.56, 0.05, 0.97, 0.55] : [0.04, 0.03, 0.96, 0.26], focus: [0.3, 0.45] };
}

/* ------------------------------------------------------------------ */
export function carInterior(ctx) {
  const { W, H, r, p } = ctx;
  const id = p.who || 'dex';
  let s = R(0, 0, W, H, { fill: C.ink });
  // windshield (right) with the night road rushing at us; streetlights pass on twos
  const ws = [[W * 0.46, H * 0.06], [W * 1.02, H * 0.02], [W * 1.02, H * 0.64], [W * 0.5, H * 0.6]];
  const wid = ctx.clip('ws', poly(ws));
  let road = R(0, 0, W, H, { fill: C.t7 });
  road += skyline(ctx, { base: H * 0.42, depth: 0.15, hMin: 0.06, hMax: 0.26, lit: 0.12, x0: W * 0.4 });
  road += P(poly([[W * 0.45, H * 0.64], [W * 0.78, H * 0.42], [W * 0.8, H * 0.42], [W * 1.1, H * 0.64]]), { fill: C.ink2 });
  road += P(line([[W * 0.79, H * 0.43], [W * 0.72, H * 0.64]]), { stroke: C.gold, 'stroke-width': 3, 'stroke-dasharray': '12 14' });
  let lamps = '';
  for (let i = 0; i < 4; i++) lamps += `<circle cx="${n(W * (0.6 + i * 0.16))}" cy="${n(H * 0.14)}" r="${n(H * 0.02)}" fill="${C.goldHot}"/>` + streaks(ctx, { y0: H * 0.12, y1: H * 0.16, count: 2, color: C.gold, opacity: 0.6 });
  road += `<g class="a-pass" style="--pass:-40%">${lamps}${lamps.replace(/cx="([\d.]+)"/g, (m0, v) => `cx="${n(+v + W * 0.64)}"`)}</g>`;
  // rain on glass
  let dr = '';
  for (let i = 0; i < 50; i++) dr += circ(r.range(W * 0.45, W), r.range(0, H * 0.64), r.range(1.2, 3.5));
  road += P(dr, { fill: C.t1, opacity: 0.35 });
  s += `<g clip-path="url(#${wid})">${road}</g>`;
  // A-pillar + roof liner + mirror
  s += P(poly([[W * 0.4, 0], [W * 0.5, 0], [W * 0.54, H * 0.64], [W * 0.47, H * 0.66]]), { fill: C.ink2 });
  s += R(W * 0.66, H * 0.04, H * 0.26, H * 0.06, { fill: C.ink2 }) + R(W * 0.67, H * 0.05, H * 0.24, H * 0.04, { fill: C.t5 });
  // dashboard: gold dials glow from below
  s += P(poly([[W * 0.3, H * 0.66], [W * 1.02, H * 0.6], [W * 1.02, H], [W * 0.3, H]]), { fill: C.ink2 });
  for (let i = 0; i < 3; i++) { const dx = W * (0.62 + i * 0.1), dy = H * 0.76; s += `<circle cx="${n(dx)}" cy="${n(dy)}" r="${n(H * 0.045)}" fill="${C.goldDeep}"/><circle cx="${n(dx)}" cy="${n(dy)}" r="${n(H * 0.038)}" fill="${C.ink}"/><path d="M${n(dx)},${n(dy)}l${n(H * 0.025)},${n(-H * 0.02)}" stroke="${C.goldHot}" stroke-width="2"/>`; }
  s += glowDots(ctx, W * 0.72, H * 0.76, H * 0.3, { color: C.gold, max: 2, step: 8, opacity: 0.4 });
  // the driver, facing the road; dash light catches the jaw
  const k = H * 1.1 / 100;
  const x = W * 0.24 - 52 * k, y = H * 1.1 - 100 * k;
  const pp = placePortrait(ctx, id, { x, y, k, mood: p.mood || 'smirk', rim: { color: C.gold, dx: 2, dy: 2 } });
  s += pp.s;
  // steering wheel rim crossing the frame
  s += `<ellipse cx="${n(W * 0.44)}" cy="${n(H * 1.04)}" rx="${n(H * 0.44)}" ry="${n(H * 0.3)}" fill="none" stroke="${C.ink}" stroke-width="${n(H * 0.05)}"/>`;
  s += `<path d="M${n(W * 0.44 - H * 0.36)},${n(H * 0.88)}A${n(H * 0.44)},${n(H * 0.3)} 0 0 1 ${n(W * 0.44 + H * 0.1)},${n(H * 0.74)}" stroke="${C.gold}" stroke-width="2.5" fill="none"/>`;
  return { svg: s, rain: false, anchors: { [id]: pp.map(MOUTH) }, space: [0.52, 0.66, 0.98, 0.98], focus: [0.25, 0.45] };
}

/* ------------------------------------------------------------------ */
export function silhouetteReveal(ctx) {
  const { W, H, r, p } = ctx;
  const id = p.who || 'crane';
  let s = R(0, 0, W, H, { fill: C.ink });
  // the doorway behind: blown-out light, halftone falloff into the room
  const dw = H * 0.62, dh = H * 1.0, dx = W * 0.5 - dw / 2, dy = H * 0.02;
  s += R(dx, dy, dw, dh, { fill: C.goldPale });
  s += halftone({ x: dx, y: dy, w: dw, h: dh, step: 8, rFn: (px, py) => Math.max(0, (Math.hypot(px - (dx + dw / 2), py - (dy + dh * 0.3)) / (dh * 0.55) - 0.35)) * 4, fill: C.gold });
  // light spilling across the floor, hard-edged
  s += P(poly([[dx, H * 0.98], [dx + dw, H * 0.98], [W * 0.95, H], [W * 0.05, H]]), { fill: C.gold, opacity: 0.4 });
  // smoke curling in the light
  s += `<path class="a-smoke" d="M${n(W * 0.6)},${n(H * 0.45)}c20,-20 -14,-34 6,-60c16,-22 -10,-40 8,-64" stroke="${C.cream}" stroke-width="5" fill="none" opacity=".4"/>`;
  // the figure: pure silhouette, rim-lit, only the eyes caught in a slit of light
  const k = H * 1.12 / 100;
  const x = W * 0.5 - 52 * k, y = H * 1.06 - 100 * k;
  const t = `translate(${n(x)} ${n(y)}) scale(${n(k)})`;
  const uid = ctx.gid('sr');
  s += `<g transform="${t} translate(-1.4 -1)">${portraitSilhouette(id, C.goldHot, uid + 'a')}</g>`;
  s += `<g transform="${t} translate(1.4 -1)">${portraitSilhouette(id, C.goldHot, uid + 'b')}</g>`;
  s += `<g transform="${t}">${portraitSilhouette(id, C.ink, uid + 'c')}</g>`;
  const band = ctx.clip('eyes', `M0,${n(y + 34 * k)}H${n(W)}V${n(y + 44 * k)}H0Z`);
  s += `<g clip-path="url(#${band})"><g transform="${t}">${portraitMarkup(id, { mood: p.mood || 'calm', bg: false, uid: uid + 'd' })}</g></g>`;
  s += R(0, y + 34 * k - 2, W, 2, { fill: C.goldHot, opacity: 0.25 }) + R(0, y + 44 * k, W, 2, { fill: C.goldHot, opacity: 0.25 });
  s += vignette(ctx, { strength: 0.8 });
  return { svg: s, anchors: { [id]: [x + MOUTH[0] * k, y + MOUTH[1] * k] }, space: [0.02, 0.04, 0.3, 0.5], focus: [0.5, 0.4] };
}

/* ------------------------------------------------------------------ */
export function titleCard(ctx) {
  const { W, H, r, p } = ctx;
  const kicker = String(p.kicker || '').toUpperCase();
  const title = String(p.title || 'Inside Job');
  let s = R(0, 0, W, H, { fill: C.ink });
  // cut-paper bars sliding in on twos (Saul Bass rhythm)
  const bars = [
    [W * 0.06, C.t5, 0.05, 'l'], [W * 0.11, C.gold, 0.012, 'l'], [W * 0.14, C.cream, 0.03, 'l'],
    [W * 0.78, C.t4, 0.09, 'r'], [W * 0.9, C.gold, 0.02, 'r'], [W * 0.93, C.t6, 0.05, 'r'],
  ];
  bars.forEach(([bx, col, bw, dir], i) => {
    const w = W * bw, jag = r.range(-H * 0.06, H * 0.06);
    s += `<g class="a-slide-${dir}" style="animation-delay:${(0.05 * i).toFixed(2)}s"><path d="${poly([[bx, -10], [bx + w, -10 + jag], [bx + w + r.jit(6), H + 10], [bx + r.jit(6), H + 10 - jag]])}" fill="${col}"/></g>`;
  });
  // a keyhole cut from a gold slab: the game's mark
  const kx = W * 0.84, ky = H * 0.44, kr = H * 0.11;
  s += `<g class="a-pop" style="transform-origin:${n(kx)}px ${n(ky)}px;animation-delay:.25s"><path d="${poly([[kx - H * 0.15, ky - H * 0.27], [kx + H * 0.17, ky - H * 0.25], [kx + H * 0.15, ky + H * 0.29], [kx - H * 0.17, ky + H * 0.26]])}" fill="${C.gold}"/>`;
  s += `<path d="M${n(kx - kr)},${n(ky - kr * 0.6)}a${n(kr)},${n(kr)} 0 1,1 ${n(kr * 2)},0 l${n(-kr * 0.45)},${n(kr * 0.6)} l${n(kr * 0.25)},${n(kr * 1.9)} h${n(-kr * 1.6)} l${n(kr * 0.25)},${n(-kr * 1.9)}Z" fill="${C.ink}"/></g>`;
  // type: kicker on a strip, the title enormous with off-register plates; last word in the serif accent
  const words = title.split(/\s+/);
  const last = words.length > 1 ? words.pop() : null;
  const main = words.join(' ').toUpperCase();
  const fs = Math.min(H * 0.28, (W * 0.56) / Math.max(4, main.length * 0.47 + (last ? last.length * 0.62 + 0.3 : 0)));
  const tx = W * 0.19, ty = H * 0.64;
  if (kicker) {
    const kw = kicker.length * H * 0.034 + H * 0.08;
    s += `<g class="a-slide-l" style="animation-delay:.15s"><path d="${poly([[tx - 4, ty - fs * 0.98 - H * 0.1], [tx + kw, ty - fs * 0.98 - H * 0.104], [tx + kw - 6, ty - fs * 0.98 - H * 0.03], [tx, ty - fs * 0.98 - H * 0.026]])}" fill="${C.cream}"/>`;
    s += `<text x="${n(tx + H * 0.03)}" y="${n(ty - fs * 0.98 - H * 0.047)}" font-family="Big Shoulders Text" font-weight="800" font-size="${n(H * 0.045)}" letter-spacing="${n(H * 0.012)}" fill="${C.ink}">${esc(kicker)}</text></g>`;
  }
  const typeRun = (dx, dy, col) => `<text x="${n(tx + dx)}" y="${n(ty + dy)}" font-family="Big Shoulders Display" font-weight="900" font-size="${n(fs)}" fill="${col}">${esc(main)}${last ? `<tspan font-family="Bodoni Moda" font-style="italic" font-weight="900" font-size="${n(fs * 0.92)}" dx="${n(fs * 0.12)}" fill="${col === C.cream ? C.gold : col}">${esc(last)}</tspan>` : ''}</text>`;
  s += `<g class="a-pop" style="transform-origin:${n(tx)}px ${n(ty)}px;animation-delay:.1s">${typeRun(-fs * 0.045, fs * 0.03, C.t4)}${typeRun(fs * 0.03, -fs * 0.02, 'rgba(242,169,59,.55)')}${typeRun(0, 0, C.cream)}</g>`;
  // a rule and a tiny credit line
  s += R(tx, ty + fs * 0.18, W * 0.3, 4, { fill: C.gold });
  s += `<text x="${n(tx)}" y="${n(ty + fs * 0.18 + H * 0.06)}" font-family="Special Elite" font-size="${n(H * 0.03)}" fill="${C.creamDim}" letter-spacing="2">PORT VESPER · AFTER MIDNIGHT</text>`;
  s += halftone({ w: W, h: H, step: 9, rFn: linearR(0, H * 0.5, 0, H * 1.1, 2, 1.4), fill: C.t7, opacity: 0.6 });
  return { svg: s, space: [0.04, 0.78, 0.5, 0.97], focus: [0.4, 0.55] };
}

/* ------------------------------------------------------------------ */
/* character-intro { who, tagline }: freeze-frame name card (Snatch / Ocean's, in cut paper) */
const SPECIALTY = {
  viv: 'makes the plan', dex: 'drives the getaway car', juno: 'opens any lock or safe',
  otis: 'knows every night guard', lena: 'pretends to be anyone', crane: 'owns half the city',
  calloway: 'police detective', moretti: 'pawn shop owner', ruiz: 'night guard',
  voight: 'Crane’s guard boss', mia: 'fixes cars', harris: 'auction house porter', guard: 'on night duty',
};
export function characterIntro(ctx) {
  const { W, H, r, p } = ctx;
  const id = p.who || 'viv';
  const crew = CREW[id] || { name: String(id), role: '' };
  const acc = { gold: C.gold, teal: C.t2, cyan: '#56d9ff', cream: C.cream, alarm: C.alarm }[crew.accent] || C.gold;
  const villain = id === 'crane' || id === 'calloway' || id === 'voight';
  let s = R(0, 0, W, H, { fill: villain ? C.ink2 : C.t8 });
  // freeze-frame backdrop: a torn slab of accent colour + halftone burst behind the figure
  const px = W * (W > H * 1.2 ? 0.3 : 0.5);
  s += P(poly([[px - H * 0.55, -10], [px + H * 0.2, -10], [px + H * 0.62, H + 10], [px - H * 0.2, H + 10]]), { fill: acc, opacity: 0.9 });
  s += halftone({ x: px - H * 0.7, y: 0, w: H * 1.4, h: H, step: 10, rFn: radialR(px, H * 0.45, H * 0.75, 3.6, 1.1), fill: C.ink, opacity: 0.55 });
  s += speedLines(ctx, { cx: px, cy: H * 0.4, count: 44, inner: 0.25, color: C.ink, opacity: 0.35 });
  // the portrait, big, rim-lit, slightly dutch
  const wide = W > H * 1.2;
  const k = H * (wide ? 1.0 : 0.66) / 100;
  const x = px - 50 * k, y = (wide ? H * 1.03 : H * 1.02) - 100 * k;
  const pp = placePortrait(ctx, id, { x, y, k, mood: p.mood || (villain ? 'calm' : 'smirk'), rim: { color: C.ink, dx: 2.5, dy: 2 } });
  s += `<g transform="rotate(-3 ${n(px)} ${n(H / 2)})">${pp.s}</g>`;
  // freeze-frame flash: an off-register cream plate + ink offset of the frame edge
  s += R(0, 0, W, H, { fill: C.cream, opacity: 0.0, class: 'a-freeze' });
  // type block
  const name = String(crew.name || id).toUpperCase();
  const parts = name.split(/\s+/);
  const first = parts.length > 1 ? parts.slice(0, -1).join(' ') : '';
  const last = parts[parts.length - 1];
  const tx = W > H * 1.2 ? Math.max(W * 0.58, px + H * 0.52) : W * 0.06;
  const avail = W - tx - W * 0.04;
  const fsBig = Math.min(H * (wide ? 0.22 : 0.16), avail / Math.max(3, last.length * 0.58));
  const ty = wide ? H * 0.6 : H * 0.1 + (first ? fsBigPre(H, last, W) * 1.3 : fsBigPre(H, last, W) * 0.9);
  const typeRun = (dx, dy, col) => `<text x="${n(tx + dx)}" y="${n(ty + dy)}" font-family="Big Shoulders Stencil Display" font-weight="900" font-size="${n(fsBig)}" letter-spacing="${n(fsBig * 0.02)}" fill="${col}">${esc(last)}</text>`;
  if (first) s += `<text x="${n(tx)}" y="${n(ty - fsBig * 0.86)}" font-family="Big Shoulders Display" font-weight="900" font-size="${n(Math.min(fsBig * 0.36, avail / Math.max(3, first.length * 0.5)))}" letter-spacing="${n(fsBig * 0.03)}" fill="${C.cream}">${esc(first)}</text>`;
  s += `<g class="a-slide-r">${typeRun(-fsBig * 0.04, fsBig * 0.03, C.t4)}${typeRun(fsBig * 0.025, -fsBig * 0.02, 'rgba(242,169,59,.6)')}${typeRun(0, 0, C.cream)}</g>`;
  // role on label tape
  const role = String(crew.role || '').toUpperCase();
  const rfs = Math.max(H * 0.045, 16), rw = role.length * rfs * 0.72 + rfs * 1.6, ry = ty + fsBig * 0.16;
  s += `<g transform="rotate(-2 ${n(tx)} ${n(ry)})"><path d="M${n(tx)},${n(ry)}h${n(rw)}l${n(-rfs * 0.3)},${n(rfs * 0.7)}l${n(rfs * 0.3)},${n(rfs * 0.7)}h${n(-rw)}l${n(rfs * 0.3)},${n(-rfs * 0.7)}Z" fill="${villain ? C.alarmDeep : C.ink}"/>`;
  s += `<text x="${n(tx + rfs * 0.8)}" y="${n(ry + rfs * 1.02)}" font-family="Big Shoulders Text" font-weight="800" font-size="${n(rfs)}" letter-spacing="${n(rfs * 0.24)}" fill="${villain ? C.cream : C.gold}">${esc(role)}</text></g>`;
  // tagline in Bodoni italic
  const tag = p.tagline || '';
  if (tag) {
    const room = (wide ? H * 0.97 : H * 0.44) - (ry + rfs * 2.6);
    let tfs = Math.max(H * 0.05, 17), lines = wrapText(tag, Math.max(14, Math.floor(avail / (tfs * 0.5))));
    while (tfs > 14 && lines.length * tfs * 1.12 + tfs * 0.4 > room) { tfs -= 1; lines = wrapText(tag, Math.max(14, Math.floor(avail / (tfs * 0.5)))); }
    const tl = lines.slice(0, 3);
    const tw = Math.max(...tl.map((l) => l.length)) * tfs * 0.46 + tfs;
    s += P(poly([[tx - tfs * 0.4, ry + rfs * 2.6 + tfs * 0.1], [tx + tw, ry + rfs * 2.6], [tx + tw + 4, ry + rfs * 2.6 + tfs * (0.5 + tl.length * 1.12)], [tx - tfs * 0.4, ry + rfs * 2.6 + tfs * (0.45 + tl.length * 1.12)]]), { fill: C.ink, opacity: 0.82 });
    tl.forEach((l, i) => { s += `<text x="${n(tx)}" y="${n(ry + rfs * 2.6 + tfs * (1 + i * 1.12))}" font-family="Bodoni Moda" font-style="italic" font-weight="700" font-size="${n(tfs)}" fill="${C.cream2}">${esc(l)}</text>`; });
  }
  // scribbled specialty note in grease pencil
  const note = p.specialty || SPECIALTY[id] || '';
  if (note) {
    const nfs = Math.min(Math.max(H * 0.04, 15), (W - (W > H * 1.2 ? tx : W * 0.5) - W * 0.05) / ((note.length + 11) * 0.46));
    const nx = tx, ny = wide ? ty - fsBig * (first ? 1.3 : 0.95) : H * 0.96;
    s += `<g transform="rotate(-4 ${n(nx)} ${n(ny)})"><text x="${n(nx)}" y="${n(ny)}" font-family="Architects Daughter" font-size="${n(nfs)}" fill="${C.goldHot}">specialty: ${esc(note)}</text>`;
    s += `<path d="M${n(nx - 4)},${n(ny + nfs * 0.35)}q${n(avail * 0.3)},${n(nfs * 0.25)} ${n(Math.min(avail, note.length * nfs * 0.5 + nfs * 4))},0" stroke="${C.goldHot}" stroke-width="2" fill="none"/></g>`;
  }
  // freeze-frame corner ticks + "FREEZE" frame counter
  const m = H * 0.04;
  s += P(`M${n(m)},${n(m + 30)}V${n(m)}H${n(m + 30)}M${n(W - m - 30)},${n(m)}H${n(W - m)}V${n(m + 30)}M${n(W - m)},${n(H - m - 30)}V${n(H - m)}H${n(W - m - 30)}M${n(m + 30)},${n(H - m)}H${n(m)}V${n(H - m - 30)}`, { stroke: C.cream, 'stroke-width': 3, fill: 'none', opacity: 0.8 });
  s += vignette(ctx, { strength: 0.7 });
  return { svg: s, anchors: { [id]: pp.map([68, 72]) }, space: wide ? [0.56, 0.04, 0.98, 0.3] : [0.5, 0.5, 0.97, 0.75], focus: [px / W, 0.45] };
}
function fsBigPre(H, last, W) { return Math.min(H * 0.16, (W * 0.9) / Math.max(3, last.length * 0.58)); }
function wrapText(t, max) { const w = String(t).split(/\s+/), out = []; let c = ''; for (const x of w) { if ((c + ' ' + x).trim().length > max && c) { out.push(c); c = x; } else c = (c + ' ' + x).trim(); } if (c) out.push(c); return out; }
