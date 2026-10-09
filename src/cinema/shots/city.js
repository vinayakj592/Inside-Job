// Exterior shots: city-establish, street-rain, rooftop, car-chase, getaway, police-lights.
import {
  C, sky, glowDots, cone, reflections, mirror, skyline, building, waterTower, lampPost, figure, BUILDS,
  car3q, speedLines, streaks, signText, halftone, radialR, linearR, hatch, poly, line, circ, P, R, G, n, rot,
} from '../kit.js';

const who = (ctx, fallback) => (ctx.p.who && BUILDS[ctx.p.who] ? ctx.p.who : fallback);

/* ------------------------------------------------------------------ */
/* Hero buildings for the establishing shot                            */
/* ------------------------------------------------------------------ */
function heroType(name = '') {
  const s = name.toLowerCase();
  if (/tower|crane hold/.test(s)) return 'tower';
  if (/hotel|marlowe|penthouse/.test(s)) return 'hotel';
  if (/casino|orpheum/.test(s)) return 'casino';
  if (/bank|meridian|vault/.test(s)) return 'bank';
  if (/galer|gallery|lumi|museum/.test(s)) return 'gallery';
  if (/pawn|moretti|shop|loan|bar|diner|club/.test(s)) return 'shop';
  if (/rail|freight|yard|train|dock|harbou?r|port/.test(s)) return 'rail';
  if (/auction|halloway/.test(s)) return 'auction';
  if (/^(port )?vesper$|city|skyline/.test(s)) return 'city';
  return 'generic';
}
function signName(name = '') {
  let s = name.replace(/^the\s+/i, '').trim();
  if (s.length > 16) s = s.split(/\s+/).slice(0, 2).join(' ');
  return s.toUpperCase();
}

/** Vertical neon blade sign. Returns markup. */
function blade(x, top, letters, { size = 22, color = C.gold, box = C.ink } = {}) {
  const L = [...letters.replace(/\s+/g, '')].slice(0, 9);
  const h = L.length * size * 1.02 + size * 0.6, w = size * 1.35;
  let s = P(poly([[x - w / 2, top], [x + w / 2, top], [x + w / 2, top + h], [x, top + h + size * 0.5], [x - w / 2, top + h]]), { fill: box });
  s += `<rect x="${n(x - w / 2 + 2.5)}" y="${n(top + 2.5)}" width="${n(w - 5)}" height="${n(h - 5)}" fill="none" stroke="${color}" stroke-width="1.4" opacity=".7"/>`;
  s += `<g class="a-flicker">` + L.map((c, i) => signText(x, top + size * (i + 1.05), c, { size, fill: color, ls: 0 })).join('') + `</g>`;
  return s;
}

function heroBuilding(ctx, type, cx, base, name) {
  const { H, r } = ctx;
  const out = { s: '', lights: [], top: base - H * 0.5 };
  const nm = signName(name);
  const rimR = { color: C.gold, dx: 3, dy: 0 };
  if (type === 'tower' || type === 'city') {
    const w = H * 0.2, h = H * 0.74, x = cx - w / 2, top = base - h;
    // uplight cones hitting the facade
    out.s += cone(ctx, [cx - w * 0.9, base], { dir: 172, spread: 9, len: h * 1.1, color: C.goldHot, opacity: 0.12, dots: false, name: 'up1', core: false });
    out.s += cone(ctx, [cx + w * 0.9, base], { dir: 188, spread: 9, len: h * 1.1, color: C.goldHot, opacity: 0.12, dots: false, name: 'up2', core: false });
    // tiers
    const tiers = [[1, 0.55], [0.78, 0.25], [0.56, 0.12]];
    let yb = base;
    for (const [k, hk] of tiers) {
      const tw = w * k, th = h * hk;
      out.s += building(ctx, { x: cx - tw / 2, base: yb, w: tw, h: th, fill: C.ink2, lit: 0.2, style: 'flat', rim: rimR, cols: Math.round(tw / 13), rows: Math.round(th / 16) });
      yb -= th;
    }
    // crown: stepped sunburst + spire
    const cw = w * 0.42, cy0 = yb;
    out.s += P(poly([[cx - cw / 2, cy0], [cx - cw * 0.35, cy0 - h * 0.05], [cx - cw * 0.18, cy0 - h * 0.09], [cx, cy0 - h * 0.12], [cx + cw * 0.18, cy0 - h * 0.09], [cx + cw * 0.35, cy0 - h * 0.05], [cx + cw / 2, cy0]]), { fill: C.goldDeep });
    let rays = '';
    for (let i = -3; i <= 3; i++) rays += `M${n(cx)},${n(cy0 + 4)}L${n(cx + i * cw * 0.14)},${n(cy0 - h * 0.1 + Math.abs(i) * h * 0.012)}`;
    out.s += P(rays, { stroke: C.goldHot, 'stroke-width': 2.2, class: 'a-flicker-soft' });
    out.s += P(`M${n(cx - 2.5)},${n(cy0 - h * 0.12)}L${n(cx)},${n(cy0 - h * 0.3)}L${n(cx + 2.5)},${n(cy0 - h * 0.12)}Z`, { fill: C.ink2 });
    out.s += `<circle cx="${n(cx)}" cy="${n(cy0 - h * 0.3)}" r="3" fill="${C.goldHot}" class="a-blink"/>`;
    if (type === 'tower') out.s += blade(cx + w * 0.5 + 12, base - h * 0.5, nm.split(' ')[0].slice(0, 6), { size: H * 0.034 });
    out.top = cy0 - h * 0.3;
    out.lights.push({ x: cx - w * 0.3, w: 8 }, { x: cx + w * 0.2, w: 10 });
  } else if (type === 'hotel') {
    const w = H * 0.26, h = H * 0.6, x = cx - w / 2;
    out.s += building(ctx, { x, base, w, h, fill: C.ink2, lit: 0.28, style: 'setback', rim: rimR, cols: 8, rows: 16 });
    out.s += blade(x - 4, base - h * 0.85, nm.replace(/HOTEL\s*/, '') || 'HOTEL', { size: H * 0.035 });
    // canopy
    out.s += P(poly([[x + w * 0.2, base - H * 0.07], [x + w * 0.8, base - H * 0.07], [x + w * 0.86, base - H * 0.05], [x + w * 0.14, base - H * 0.05]]), { fill: C.ink });
    out.s += R(x + w * 0.16, base - H * 0.05, w * 0.68, 3, { fill: C.goldHot, class: 'a-flicker-soft' });
    out.s += cone(ctx, [x + w * 0.5, base - H * 0.05], { dir: 0, spread: 70, len: H * 0.06, color: C.gold, opacity: 0.3, dots: false, name: 'can' });
    out.top = base - h;
    out.lights.push({ x: x - 4, w: 14 }, { x: x + w * 0.5, w: 30 });
  } else if (type === 'casino') {
    const w = H * 0.62, h = H * 0.24, x = cx - w / 2;
    out.s += building(ctx, { x, base, w, h, fill: C.ink2, lit: 0.15, style: 'flat', rim: rimR, rows: 3 });
    // dome
    out.s += P(`M${n(cx - w * 0.2)},${n(base - h)}Q${n(cx)},${n(base - h - H * 0.16)} ${n(cx + w * 0.2)},${n(base - h)}Z`, { fill: C.ink3 });
    out.s += P(`M${n(cx - w * 0.2)},${n(base - h)}Q${n(cx)},${n(base - h - H * 0.16)} ${n(cx + w * 0.2)},${n(base - h)}`, { fill: 'none', stroke: C.gold, 'stroke-width': 2 });
    // marquee with chaser bulbs
    const my = base - h * 0.62, mw = w * 0.7, mh = H * 0.075;
    out.s += R(cx - mw / 2, my, mw, mh, { fill: C.ink });
    let bulbs = '', bulbs2 = '';
    for (let i = 0; i <= 28; i++) { const bx = cx - mw / 2 + (i / 28) * mw; const b = circ(bx, my, 2.2) + circ(bx, my + mh, 2.2); if (i % 2) bulbs += b; else bulbs2 += b; }
    out.s += P(bulbs, { fill: C.goldHot, class: 'a-chase' }) + P(bulbs2, { fill: C.goldHot, class: 'a-chase a-chase--b' });
    out.s += signText(cx, my + mh * 0.78, nm, { size: mh * 0.72, fill: C.gold, ls: 0.12 });
    out.s += blade(cx, base - h - H * 0.3, 'CASINO', { size: H * 0.026 });
    out.top = base - h - H * 0.3;
    out.lights.push({ x: cx - mw * 0.3, w: 26 }, { x: cx + mw * 0.3, w: 26 }, { x: cx, w: 12 });
  } else if (type === 'bank') {
    const w = H * 0.56, h = H * 0.3, x = cx - w / 2;
    out.s += R(x, base - h, w, h, { fill: C.ink2 });
    // pediment
    out.s += P(poly([[x - 10, base - h], [cx, base - h - H * 0.1], [x + w + 10, base - h]]), { fill: C.ink3 });
    out.s += P(line([[x - 10, base - h], [cx, base - h - H * 0.1], [x + w + 10, base - h]]), { stroke: C.gold, 'stroke-width': 2, fill: 'none' });
    out.s += R(x - 10, base - h, w + 20, H * 0.035, { fill: C.ink });
    out.s += signText(cx, base - h + H * 0.027, nm, { size: H * 0.024, fill: C.cream2, ls: 0.2 });
    // columns lit from below (hard gold slivers)
    for (let i = 0; i < 6; i++) {
      const colx = x + w * (0.08 + i * 0.168);
      out.s += R(colx, base - h + H * 0.035, w * 0.06, h - H * 0.06, { fill: C.ink3 });
      out.s += R(colx + w * 0.045, base - h + H * 0.035, w * 0.015, h - H * 0.06, { fill: C.gold, opacity: 0.8 });
    }
    // doors glowing
    out.s += R(cx - w * 0.06, base - h * 0.45, w * 0.12, h * 0.45 - H * 0.02, { fill: C.goldDeep });
    // steps
    for (let i = 0; i < 3; i++) out.s += R(x - 14 - i * 8, base - H * 0.02 + i * H * 0.008, w + 28 + i * 16, H * 0.008, { fill: i % 2 ? C.ink3 : C.ink4 });
    // clock
    out.s += `<circle cx="${n(cx)}" cy="${n(base - h - H * 0.045)}" r="${n(H * 0.025)}" fill="${C.cream2}"/><path d="M${n(cx)},${n(base - h - H * 0.045)}v${n(-H * 0.018)}M${n(cx)},${n(base - h - H * 0.045)}l${n(H * 0.012)},${n(H * 0.006)}" stroke="${C.ink}" stroke-width="2"/>`;
    out.top = base - h - H * 0.1;
    out.lights.push({ x: cx, w: 30 });
  } else if (type === 'gallery') {
    const w = H * 0.6, h = H * 0.3, x = cx - w / 2;
    out.s += R(x, base - h, w, h, { fill: C.ink2 });
    out.s += R(x - 8, base - h - H * 0.03, w + 16, H * 0.03, { fill: C.ink3 });
    out.s += P(line([[x - 8, base - h - H * 0.03], [x + w + 8, base - h - H * 0.03]]), { stroke: C.gold, 'stroke-width': 2 });
    for (let i = 0; i < 3; i++) {
      const ax = x + w * (0.14 + i * 0.29), aw = w * 0.14, ay = base - h * 0.86, ah = h * 0.72;
      out.s += P(`M${n(ax)},${n(ay + ah)}V${n(ay + aw / 2)}A${n(aw / 2)},${n(aw / 2)} 0 0 1 ${n(ax + aw)},${n(ay + aw / 2)}V${n(ay + ah)}Z`, { fill: C.gold });
      out.s += P(`M${n(ax + aw / 2)},${n(ay)}V${n(ay + ah)}M${n(ax)},${n(ay + ah * 0.45)}H${n(ax + aw)}`, { stroke: C.goldDeep, 'stroke-width': 2 });
      // silhouettes of guests inside
      out.s += figure(ax + aw * 0.35, ay + ah, ah * 0.55, { pose: 'toast', build: i === 1 ? 'gown' : 'tux', fill: C.ink2 });
    }
    // banners
    for (const bx of [x + w * 0.02, x + w * 0.9]) out.s += P(poly([[bx, base - h + 6], [bx + w * 0.08, base - h + 6], [bx + w * 0.08, base - h * 0.35], [bx + w * 0.04, base - h * 0.42], [bx, base - h * 0.35]]), { fill: C.t5 });
    out.s += signText(cx, base - h - H * 0.045, nm, { size: H * 0.03, fill: C.cream, ls: 0.24 });
    // gala searchlights
    out.s += `<g class="a-sweep" style="--a0:-18deg;--a1:14deg;--dur:5s;transform-origin:${n(x + w * 0.2)}px ${n(base)}px">${cone(ctx, [x + w * 0.2, base], { dir: 180, spread: 5, len: H * 1.2, color: C.cream, opacity: 0.1, dots: false, name: 'sl1', core: false })}</g>`;
    out.s += `<g class="a-sweep" style="--a0:16deg;--a1:-12deg;--dur:6.5s;transform-origin:${n(x + w * 0.8)}px ${n(base)}px">${cone(ctx, [x + w * 0.8, base], { dir: 180, spread: 5, len: H * 1.2, color: C.cream, opacity: 0.1, dots: false, name: 'sl2', core: false })}</g>`;
    out.top = base - h - H * 0.05;
    out.lights.push({ x: x + w * 0.21, w: 22 }, { x: cx, w: 22 }, { x: x + w * 0.79, w: 22 });
  } else if (type === 'shop') {
    const w = H * 0.34, h = H * 0.46, x = cx - w / 2;
    out.s += building(ctx, { x, base, w, h, fill: C.ink2, lit: 0.1, style: 'flat', rim: rimR, cols: 4, rows: 6 });
    // brick hatch on the facade
    const cid = ctx.clip('brick', poly([[x, base - h], [x + w, base - h], [x + w, base], [x, base]]));
    out.s += hatch({ x, y: base - h, w, h, gap: 9, angle: 0, stroke: C.ink3, sw: 1, clip: cid });
    // fire escape
    let fe = '';
    for (let i = 1; i < 4; i++) { const fy = base - h + i * h * 0.22; fe += `M${n(x + w * 0.55)},${n(fy)}H${n(x + w + 6)}M${n(x + w * 0.6)},${n(fy)}L${n(x + w * 0.95)},${n(fy + h * 0.22)}`; }
    out.s += P(fe, { stroke: C.ink, 'stroke-width': 3, fill: 'none' });
    // shopfront
    const sy = base - h * 0.3;
    out.s += R(x + w * 0.08, sy, w * 0.62, h * 0.24, { fill: C.gold });
    out.s += halftone({ x: x + w * 0.08, y: sy, w: w * 0.62, h: h * 0.24, step: 6, rFn: linearR(0, sy, 0, sy + h * 0.3, 2.6, 1.5), fill: C.goldDeep });
    out.s += R(x + w * 0.74, sy + h * 0.02, w * 0.14, h * 0.28, { fill: C.ink });
    out.s += R(x, sy - H * 0.05, w, H * 0.045, { fill: C.ink });
    out.s += signText(x + w * 0.45, sy - H * 0.015, nm, { size: H * 0.032, fill: C.cream2, ls: 0.1 });
    // neon PAWN + three balls
    out.s += `<g class="a-flicker">${signText(x + w * 0.39, sy + h * 0.14, 'PAWN', { size: H * 0.05, fill: C.goldHot, ls: 0.14, stroke: C.goldDeep, sw: 1 })}</g>`;
    const bx = x - 12, by = sy - H * 0.1;
    out.s += P(`M${n(x)},${n(by - 10)}H${n(bx)}V${n(by)}`, { stroke: C.ink, 'stroke-width': 3, fill: 'none' });
    out.s += `<circle cx="${n(bx - 8)}" cy="${n(by + 10)}" r="7" fill="${C.gold}"/><circle cx="${n(bx + 8)}" cy="${n(by + 10)}" r="7" fill="${C.gold}"/><circle cx="${n(bx)}" cy="${n(by + 23)}" r="7" fill="${C.gold}"/>`;
    out.top = base - h;
    out.lights.push({ x: x + w * 0.39, w: 40 }, { x: bx, w: 10 });
  } else if (type === 'rail') {
    const w = H * 0.9;
    // gantry crane
    const gx = cx - w * 0.2, gt = base - H * 0.42;
    out.s += P(`M${n(gx)},${n(base)}V${n(gt)}H${n(gx + w * 0.5)}V${n(base)}h-8V${n(gt + 16)}H${n(gx + 8)}V${n(base)}Z`, { fill: C.ink2 });
    let tr = '';
    for (let i = 0; i < 12; i++) tr += `M${n(gx + i * w * 0.042)},${n(gt)}l${n(w * 0.021)},16l${n(w * 0.021)},-16`;
    out.s += P(tr, { stroke: C.ink2, 'stroke-width': 3, fill: 'none' });
    out.s += P(`M${n(gx + w * 0.3)},${n(gt + 16)}v${n(H * 0.12)}`, { stroke: C.ink, 'stroke-width': 2 }) + R(gx + w * 0.27, gt + 16 + H * 0.12, w * 0.06, H * 0.03, { fill: C.ink });
    // freight cars
    for (let i = 0; i < 4; i++) {
      const fx = cx - w * 0.5 + i * w * 0.26, fw = w * 0.24, fh = H * 0.12;
      out.s += R(fx, base - fh - 8, fw, fh, { fill: i === 2 ? C.t6 : C.ink3 }) + P(`M${n(fx + fw * 0.4)},${n(base - fh - 8)}v${n(fh)}M${n(fx + fw * 0.6)},${n(base - fh - 8)}v${n(fh)}`, { stroke: C.ink, 'stroke-width': 2 });
      out.s += `<circle cx="${n(fx + fw * 0.15)}" cy="${n(base - 5)}" r="6" fill="${C.ink}"/><circle cx="${n(fx + fw * 0.85)}" cy="${n(base - 5)}" r="6" fill="${C.ink}"/>`;
    }
    // floodlight towers
    for (const fx of [cx - w * 0.42, cx + w * 0.38]) {
      out.s += P(`M${n(fx - 3)},${n(base)}V${n(base - H * 0.55)}h6V${n(base)}Z`, { fill: C.ink });
      out.s += R(fx - 16, base - H * 0.56, 32, 10, { fill: C.ink }) + R(fx - 13, base - H * 0.55 + 7, 26, 3, { fill: C.goldHot });
      out.s += cone(ctx, [fx, base - H * 0.55], { dir: fx < cx ? -18 : 18, spread: 34, len: H * 0.6, color: C.gold, opacity: 0.13, name: 'fl' + Math.round(fx) });
    }
    out.s += waterTower(cx + w * 0.2, base - H * 0.3, H * 0.12, C.ink2);
    out.s += P(`M${n(cx + w * 0.2 - H * 0.05)},${n(base - H * 0.3)}V${n(base)}M${n(cx + w * 0.2 + H * 0.05)},${n(base - H * 0.3)}V${n(base)}`, { stroke: C.ink2, 'stroke-width': 3 });
    out.s += signText(cx + w * 0.2, base - H * 0.36, nm.split(' ')[0].slice(0, 8), { size: H * 0.022, fill: C.gold, ls: 0.12 });
    out.top = base - H * 0.56;
    out.lights.push({ x: cx - w * 0.42, w: 14 }, { x: cx + w * 0.38, w: 14 });
  } else if (type === 'auction') {
    const w = H * 0.46, h = H * 0.36, x = cx - w / 2;
    out.s += building(ctx, { x, base, w, h, fill: C.ink2, lit: 0.18, style: 'flat', rim: rimR, cols: 6, rows: 5 });
    // clock tower
    const tw = w * 0.22;
    out.s += building(ctx, { x: cx - tw / 2, base: base - h, w: tw, h: H * 0.16, fill: C.ink2, lit: 0, style: 'gable', rim: rimR });
    out.s += `<circle cx="${n(cx)}" cy="${n(base - h - H * 0.07)}" r="${n(tw * 0.32)}" fill="${C.goldHot}"/><path d="M${n(cx)},${n(base - h - H * 0.07)}v${n(-tw * 0.24)}M${n(cx)},${n(base - h - H * 0.07)}l${n(tw * 0.18)},${n(tw * 0.08)}" stroke="${C.ink}" stroke-width="2.4"/>`;
    out.s += R(x + w * 0.1, base - h * 0.34, w * 0.8, H * 0.04, { fill: C.ink });
    out.s += signText(cx, base - h * 0.34 + H * 0.03, nm, { size: H * 0.028, fill: C.gold, ls: 0.1 });
    out.s += P(`M${n(cx - w * 0.07)},${n(base)}V${n(base - h * 0.2)}A${n(w * 0.07)},${n(w * 0.07)} 0 0 1 ${n(cx + w * 0.07)},${n(base - h * 0.2)}V${n(base)}Z`, { fill: C.gold });
    out.top = base - h - H * 0.16;
    out.lights.push({ x: cx, w: 24 });
  } else {
    const w = H * 0.24, h = H * 0.52, x = cx - w / 2;
    out.s += building(ctx, { x, base, w, h, fill: C.ink2, lit: 0.22, style: 'setback', rim: rimR });
    if (nm.length <= 8) out.s += blade(x + w + 10, base - h * 0.8, nm, { size: H * 0.032 });
    else { out.s += R(x - 10, base - h * 0.2, w + 20, H * 0.05, { fill: C.ink }); out.s += signText(cx, base - h * 0.2 + H * 0.037, nm, { size: H * 0.03, fill: C.gold }); }
    out.top = base - h;
    out.lights.push({ x: cx, w: 24 });
  }
  return out;
}

export function cityEstablish(ctx) {
  const { W, H, r, p } = ctx;
  const type = heroType(p.building);
  const hz = 0.82;
  const base = H * hz;
  let s = sky(ctx, { horizon: hz, glow: C.t5 });
  // big cold moon disc behind haze, halftone (only on wide panels to keep it a graphic accent)
  const mx = W * (type === 'city' ? 0.3 : 0.22), my = H * 0.2;
  s += `<circle cx="${n(mx)}" cy="${n(my)}" r="${n(H * 0.11)}" fill="${C.t4}" opacity=".55"/>`;
  s += glowDots(ctx, mx, my, H * 0.24, { color: C.t3, max: 2.2, step: 9, opacity: 0.6 });
  // searchlights from behind the city
  s += `<g class="a-sweep" style="--a0:-24deg;--a1:10deg;--dur:7s;transform-origin:${n(W * 0.12)}px ${n(base)}px">${cone(ctx, [W * 0.12, base], { dir: 180, spread: 6, len: H * 1.3, color: C.t1, opacity: 0.08, dots: false, name: 'sa', core: false })}</g>`;
  // far and mid skyline
  s += skyline(ctx, { base: base - H * 0.03, depth: 0.05, hMin: 0.14, hMax: 0.32, wMin: 30, wMax: 80, lit: 0.04 });
  const cx = W * (W > H * 1.2 ? 0.58 : 0.5);
  s += skyline(ctx, { base, depth: 0.5, hMin: 0.12, hMax: 0.34, wMin: 40, wMax: 90, lit: 0.07 });
  // Crane Tower always looms somewhere in Vesper
  if (type !== 'tower' && type !== 'city') {
    const tx = cx < W / 2 ? W * 0.8 : W * 0.2;
    s += building(ctx, { x: tx - H * 0.05, base: base - H * 0.02, w: H * 0.1, h: H * 0.62, fill: C.t7, lit: 0.05, style: 'deco', winDim: C.t6, win: C.goldDeep });
  }
  const hero = heroBuilding(ctx, type, cx, base, p.building || '');
  // halo of city glow behind the hero (halftone, not blur)
  s += glowDots(ctx, cx, base - H * 0.12, H * 0.4, { color: C.gold, max: 2.2, step: 10, sy: 0.7, opacity: 0.35 });
  s += hero.s;
  // wet street: the whole block mirrored and broken by ripples
  const city = s;
  s += R(0, base, W, H - base, { fill: C.ink2 });
  s += mirror(ctx, city, base, { opacity: 0.35 });
  s += P(`M0,${n(base)}H${n(W)}`, { stroke: C.t4, 'stroke-width': 1.5 });
  s += reflections(ctx, hero.lights.map((L) => ({ ...L, o: 0.8 })), { y0: base + 3, y1: H });
  // near framing: a building edge on the left with ledges and a rim of sodium light
  const fl = W * 0.075;
  s += P(poly([[0, 0], [fl, 0], [fl, H], [0, H]]), { fill: C.ink });
  let ledges = '';
  for (let i = 0; i < 7; i++) ledges += `M0,${n(H * 0.08 + i * H * 0.14)}h${n(fl + 8)}v5h${n(-fl - 8)}Z`;
  s += P(ledges, { fill: C.ink });
  s += P(`M${n(fl)},0V${n(H)}`, { stroke: C.gold, 'stroke-width': 1.5, opacity: 0.4 });
  const lamp = lampPost(ctx, W * 0.93, H * 1.02, H * 0.52, { arm: -1 });
  s += cone(ctx, lamp.head, { dir: 0, spread: 40, len: H * 0.45, color: C.gold, opacity: 0.14, name: 'lampc' });
  s += lamp.s;
  return { svg: s, rain: { density: 0.9, angle: 10 }, space: [0.03, 0.04, 0.6, 0.3], focus: [cx / W, 0.5] };
}

/* ------------------------------------------------------------------ */
export function streetRain(ctx) {
  const { W, H, r } = ctx;
  const vx = W * 0.46, vy = H * 0.46;
  let s = R(0, 0, W, H, { fill: C.t8 });
  // sky slit between buildings
  s += P(poly([[W * 0.33, 0], [W * 0.62, 0], [vx + 10, vy], [vx - 10, vy]]), { fill: ctx.lg('slit', [[0, C.t6], [1, C.t4]], 0, 0, 0, vy) });
  // left and right building walls in perspective
  const L = [[0, 0], [W * 0.33, 0], [vx - 10, vy], [vx - 10, vy + 8], [0, H * 0.84]];
  const Rr = [[W, 0], [W * 0.62, 0], [vx + 10, vy], [vx + 10, vy + 8], [W, H * 0.8]];
  s += P(poly(L), { fill: C.ink2 }) + P(poly(Rr), { fill: C.ink3 });
  // windows set into the wall planes: columns compress toward the vanishing point, floors follow the wall
  let wl = '', wd = '';
  const wall = (side, t, f) => {
    const x = side < 0 ? t * (vx - 10) : W - t * (W - vx - 10);
    const yt = (vy - 0) * t, yb = (side < 0 ? H * 0.84 : H * 0.8) + (vy + 8 - (side < 0 ? H * 0.84 : H * 0.8)) * t;
    return [x, yt + (yb - yt) * f];
  };
  for (const side of [-1, 1]) {
    for (let i = 0; i < 9; i++) {
      const t1 = 1 - Math.pow(0.8, i + 0.25), t2 = 1 - Math.pow(0.8, i + 0.75);
      for (let j = 0; j < 5; j++) {
        const f1 = 0.06 + j * 0.15, f2 = f1 + 0.08;
        const q = [wall(side, t1, f1), wall(side, t2, f1), wall(side, t2, f2), wall(side, t1, f2)];
        if (r() < 0.14) wl += poly(q); else wd += poly(q);
      }
    }
  }
  s += P(wd, { fill: C.t7, opacity: 0.8 }) + P(wl, { fill: C.gold });
  // a neon sign on the right wall
  s += `<g class="a-flicker">${P(poly([[W * 0.8, H * 0.3], [W * 0.88, H * 0.27], [W * 0.88, H * 0.47], [W * 0.8, H * 0.47]]), { fill: C.ink })}${signText(W * 0.84, H * 0.36, 'BAR', { size: H * 0.05, fill: C.goldHot, rotate: -4 })}${signText(W * 0.84, H * 0.43, 'OPEN', { size: H * 0.022, fill: C.gold })}</g>`;
  // street: wet asphalt converging
  s += P(poly([[0, H * 0.84], [vx - 10, vy + 8], [vx + 10, vy + 8], [W, H * 0.8], [W, H], [0, H]]), { fill: ctx.lg('road', [[0, C.t7], [1, C.ink]], 0, vy, 0, H) });
  s += P(line([[vx, vy + 10], [W * 0.5, H]]), { stroke: C.t4, 'stroke-width': 3, 'stroke-dasharray': '14 18' });
  // lamp in the foreground left, pool of light on the pavement
  const lamp = lampPost(ctx, W * 0.2, H * 1.0, H * 0.82, { arm: 1 });
  s += cone(ctx, lamp.head, { dir: 0, spread: 50, len: H * 0.6, color: C.gold, opacity: 0.17, name: 'lp' });
  s += `<ellipse cx="${n(lamp.head[0])}" cy="${n(H * 0.9)}" rx="${n(H * 0.3)}" ry="${n(H * 0.06)}" fill="${C.gold}" opacity=".22"/>`;
  s += lamp.s;
  // lone figure in the light, long shadow
  const fx = W * 0.36, fy = H * 0.88, fs = H * 0.4;
  s += P(poly([[fx - 16, fy], [fx + 16, fy], [fx + W * 0.25, H], [fx + W * 0.1, H]]), { fill: C.ink, opacity: 0.8 });
  const out = {};
  s += figure(fx, fy, fs, { pose: 'pockets', build: who(ctx, 'fedora'), face: 1, rim: { color: C.gold, dx: -3, dy: 0 }, out });
  s += reflections(ctx, [{ x: lamp.head[0], w: 22 }, { x: W * 0.84, w: 16 }, { x: fx, w: 8, color: C.ink }], { y0: H * 0.82, y1: H });
  // puddle ripples
  let rp = '';
  for (let i = 0; i < 7; i++) { const px = r.range(0.1, 0.9) * W, py = r.range(0.86, 0.98) * H; rp += `M${n(px - 9)},${n(py)}a9,2.4 0 1,0 18,0a9,2.4 0 1,0 -18,0`; }
  s += P(rp, { stroke: C.t2, 'stroke-width': 1, fill: 'none', opacity: 0.6, class: 'a-shimmer' });
  const anchors = {}; if (ctx.p.who) anchors[ctx.p.who] = out.mouth;
  anchors._figure = out.mouth;
  return { svg: s, rain: { density: 1, angle: 8 }, anchors, space: [0.5, 0.05, 0.95, 0.3], focus: [fx / W, 0.6] };
}

/* ------------------------------------------------------------------ */
export function rooftop(ctx) {
  const { W, H, r } = ctx;
  const hz = 0.66;
  let s = sky(ctx, { horizon: hz + 0.1, glow: C.t4 });
  s += `<g class="a-sweep" style="--a0:-30deg;--a1:22deg;--dur:6s;transform-origin:${n(W * 0.75)}px ${n(H * 0.8)}px">${cone(ctx, [W * 0.75, H * 0.8], { dir: 180, spread: 7, len: H * 1.3, color: C.cream, opacity: 0.1, dots: false, name: 'sr', core: false })}</g>`;
  s += skyline(ctx, { base: H * hz + 20, depth: 0.1, hMin: 0.1, hMax: 0.3, lit: 0.05 });
  s += building(ctx, { x: W * 0.7, base: H * hz + 20, w: H * 0.1, h: H * 0.56, fill: C.t7, style: 'deco', lit: 0.1, winDim: C.t6, win: C.goldDeep });
  s += skyline(ctx, { base: H * hz + 50, depth: 0.45, hMin: 0.06, hMax: 0.2, lit: 0.1 });
  s += glowDots(ctx, W * 0.6, H * hz, H * 0.5, { color: C.gold, max: 1.8, step: 11, sy: 0.4, opacity: 0.3 });
  // roof deck (we're on it, low angle)
  const deck = H * 0.8;
  s += P(poly([[0, deck], [W, deck - H * 0.04], [W, H], [0, H]]), { fill: C.ink2 });
  s += P(poly([[0, deck - H * 0.035], [W, deck - H * 0.075], [W, deck - H * 0.04], [0, deck]]), { fill: C.ink3 });
  s += P(line([[0, deck - H * 0.035], [W, deck - H * 0.075]]), { stroke: C.gold, 'stroke-width': 2, opacity: 0.7 });
  // water tower + vent hatch in silhouette
  s += waterTower(W * 0.13, deck - H * 0.02, H * 0.62, C.ink);
  s += R(W * 0.58, deck - H * 0.1, H * 0.16, H * 0.07, { fill: C.ink }) + R(W * 0.58, deck - H * 0.1, H * 0.16, 3, { fill: C.t3 });
  // crouched figure on the parapet, rim-lit by the city
  const out = {};
  s += figure(W * 0.4, deck - H * 0.055, H * 0.5, { pose: 'crouch', build: who(ctx, 'viv'), face: 1, rim: { color: C.gold, dx: 2.5, dy: -1.5 }, out });
  const anchors = { _figure: out.mouth }; if (ctx.p.who) anchors[ctx.p.who] = out.mouth;
  return { svg: s, rain: { density: 0.8, angle: 14 }, anchors, space: [0.05, 0.04, 0.6, 0.3], focus: [0.4, 0.6] };
}

/* ------------------------------------------------------------------ */
export function carChase(ctx) {
  const { W, H, r } = ctx;
  const vx = W * 0.78, vy = H * 0.4;
  let s = R(0, 0, W, H, { fill: C.t8 });
  let inner = '';
  inner += skyline(ctx, { base: vy + 6, depth: 0.15, hMin: 0.1, hMax: 0.32, lit: 0.08, x0: -W * 0.3, x1: W * 1.3 });
  inner += P(poly([[-W * 0.3, vy + 6], [W * 1.3, vy + 6], [W * 1.3, H * 1.4], [-W * 0.3, H * 1.4]]), { fill: ctx.lg('road', [[0, C.t7], [0.5, C.ink2], [1, C.ink]], 0, vy, 0, H) });
  inner += speedLines(ctx, { cx: vx, cy: vy, count: 80, inner: 0.1, color: C.t2, opacity: 0.3 });
  inner += speedLines(ctx, { cx: vx, cy: vy, count: 14, inner: 0.25, color: C.gold, opacity: 0.35 });
  // police cruiser behind, sirens
  const pc = car3q(ctx, W * 0.6, H * 0.66, H * 0.13, { face: -1, rim: C.t1 });
  inner += pc.s;
  const [rx, ry] = pc.roof;
  inner += `<g class="a-siren">${flare(rx - H * 0.02, ry - 4, H * 0.07, '#ffb3a6', '')}</g><g class="a-siren a-siren--b">${flare(rx + H * 0.03, ry - 6, H * 0.07, '#e6fffb', '')}</g>`;
  // our car, big and close, nose toward camera-left
  const cs = H * 0.36;
  const car = car3q(ctx, W * 0.14, H * 0.97, cs, { face: -1, rim: C.gold });
  for (const [lx, ly] of car.lights) inner += cone(ctx, [lx, ly], { dir: 58, spread: 24, len: W * 0.6, color: C.goldHot, opacity: 0.1, dots: false, name: 'hl' + Math.round(lx) });
  let tail = '';
  for (let i = 0; i < 16; i++) { const y = H * 0.97 - cs * r.range(0.1, 0.8), x = W * 0.14 + cs * r.range(2.0, 2.3); tail += poly([[x, y], [W * 1.3, y - 4], [W * 1.3, y + 4]]); }
  inner += P(tail, { fill: C.cream, opacity: 0.28 });
  inner += car.s;
  inner += `<g clip-path="url(#${ctx.clip('drv', poly(car.window))})">${figure(car.window[0][0] + cs * 0.3, car.window[0][1] + cs * 0.95, cs * 1.05, { pose: 'stand', build: who(ctx, 'dex'), face: -1, fill: C.ink })}</g>`;
  for (const [lx, ly] of car.lights) inner += flare(lx, ly, H * 0.12);
  inner += halftone({ x: W * 0.3, y: H * 0.75, w: W * 0.6, h: H * 0.3, step: 8, rFn: radialR(W * 0.55, H * 0.97, W * 0.3, 2.4, 1, 1, 0.35), fill: C.t1, opacity: 0.45 });
  s += `<g transform="rotate(-8 ${n(W / 2)} ${n(H / 2)})">${inner}</g>`;
  return { svg: s, rain: { density: 0.8, angle: 40 }, space: [0.04, 0.04, 0.5, 0.3], sfxAt: [0.66, 0.26], focus: [0.3, 0.7] };
}

/** Star flare for headlights and glints. */
export function flare(x, y, s, color = C.goldPale, cls = 'a-flare') {
  const d = `M${n(x - s)},${n(y)}L${n(x - s * 0.08)},${n(y - s * 0.06)}L${n(x)},${n(y - s * 0.55)}L${n(x + s * 0.08)},${n(y - s * 0.06)}L${n(x + s)},${n(y)}L${n(x + s * 0.08)},${n(y + s * 0.06)}L${n(x)},${n(y + s * 0.55)}L${n(x - s * 0.08)},${n(y + s * 0.06)}Z`;
  return `<g class="${cls}" style="transform-origin:${n(x)}px ${n(y)}px"><circle cx="${n(x)}" cy="${n(y)}" r="${n(s * 0.22)}" fill="${C.goldHot}" opacity=".5"/><path d="${d}" fill="${color}"/><circle cx="${n(x)}" cy="${n(y)}" r="${n(s * 0.1)}" fill="#fff8e0"/></g>`;
}

/* ------------------------------------------------------------------ */
export function getaway(ctx) {
  const { W, H, r } = ctx;
  const hz = H * 0.48;
  let s = R(0, 0, W, H, { fill: C.t8 });
  const bg = skyline(ctx, { base: hz, depth: 0.25, hMin: 0.12, hMax: 0.38, lit: 0.1 });
  s += bg;
  s += streaks(ctx, { y0: H * 0.12, y1: hz, count: 36, color: C.gold, opacity: 0.3, dir: 1 });
  s += R(0, hz, W, H - hz, { fill: ctx.lg('rd', [[0, C.t7], [0.35, C.ink2], [1, C.ink]], 0, hz, 0, H) });
  s += mirror(ctx, bg, hz, { opacity: 0.25, name: 'gm' });
  // the car: nose at camera-left, rushing past us
  const cs = Math.min(H * 0.44, W * 0.26);
  const fx = W * 0.46 - cs * 0.95, fy = H * 0.93;
  const car = car3q(ctx, fx, fy, cs, { face: -1, rim: C.gold });
  s += P(poly([[car.lights[0][0], fy - 4], [-20, H * 0.82], [-20, H + 10], [car.lights[1][0] + cs * 0.3, H + 10]]), { fill: C.gold, opacity: 0.1 });
  for (const [lx, ly] of car.lights) s += cone(ctx, [lx, ly], { dir: 62, spread: 20, len: W * 0.55, color: C.goldHot, opacity: 0.09, dots: false, name: 'g' + Math.round(lx) });
  let sl = '';
  for (let i = 0; i < 20; i++) { const y = fy - cs * r.range(0.08, 0.72), x = fx + cs * r.range(2.0, 2.4); sl += poly([[x, y], [W + 20, y - 3], [W + 20, y + 3]]); }
  s += P(sl, { fill: C.cream, opacity: 0.3 });
  s += car.s;
  s += `<g clip-path="url(#${ctx.clip('win', poly(car.window))})">${figure(car.window[0][0] + cs * 0.3, car.window[0][1] + cs * 0.95, cs * 1.05, { pose: 'stand', build: who(ctx, 'dex'), face: -1, fill: C.ink })}</g>`;
  for (const [lx, ly] of car.lights) s += flare(lx, ly, cs * 0.42);
  // spray off the rear tyre
  s += halftone({ x: fx + cs * 1.3, y: fy - cs * 0.5, w: cs * 1.4, h: cs * 0.6, step: 7, rFn: radialR(fx + cs * 1.9, fy - cs * 0.05, cs * 0.7, 2.6, 1.1, 1.3, 0.5), fill: C.t1, opacity: 0.55 });
  const head = [car.window[0][0] + cs * 0.3, car.window[0][1] + cs * 0.05];
  return { svg: s, rain: { density: 0.9, angle: 26 }, space: [0.04, 0.05, 0.6, 0.32], sfxAt: [0.72, 0.3], focus: [0.5, 0.7], anchors: { _figure: head, [ctx.p.who || 'dex']: head } };
}

/* ------------------------------------------------------------------ */
export function policeLights(ctx) {
  const { W, H, r } = ctx;
  let s = R(0, 0, W, H, { fill: C.ink2 });
  const bg = skyline(ctx, { base: H * 0.62, depth: 0.3, hMin: 0.22, hMax: 0.52, lit: 0.06 });
  s += bg;
  s += R(0, H * 0.62, W, H * 0.38, { fill: ctx.lg('pv', [[0, C.t7], [1, C.ink]], 0, H * 0.62, 0, H) });
  s += mirror(ctx, bg, H * 0.62, { opacity: 0.2, name: 'pm' });
  // alternating washes: the whole street flips red / cold on twos
  s += `<rect width="${n(W)}" height="${n(H)}" fill="${C.alarm}" class="a-wash-red"/>`;
  s += `<rect width="${n(W)}" height="${n(H)}" fill="${C.t1}" class="a-wash-cold"/>`;
  // a cruiser at the kerb in the distance
  const far = car3q(ctx, W * 0.1, H * 0.7, H * 0.08, { face: 1, rim: C.t2 });
  s += far.s + `<circle cx="${n(far.roof[0])}" cy="${n(far.roof[1] - 4)}" r="${n(H * 0.016)}" fill="${C.alarm}" class="a-siren"/>`;
  // Calloway, backlit, coat collar up
  const out = {};
  s += P(poly([[W * 0.66, H * 0.92], [W * 0.74, H * 0.92], [W * 0.5, H], [W * 0.38, H]]), { fill: C.ink, opacity: 0.7 });
  s += figure(W * 0.7, H * 0.92, H * 0.64, { pose: 'pockets', build: 'calloway', face: -1, rim: { color: C.t1, dx: 3, dy: -1 }, out });
  // the light bar: huge, foreground, cropped by the frame (low angle off the cruiser roof)
  const bx = -W * 0.04, by = H * 0.78, bw = W * 0.5, bh = H * 0.1;
  s += P(`M${n(bx - 20)},${n(H + 5)}L${n(bx)},${n(by + bh)}H${n(bx + bw)}Q${n(bx + bw + W * 0.1)},${n(by + bh)} ${n(bx + bw + W * 0.16)},${n(H + 5)}Z`, { fill: C.ink });
  s += P(`M${n(bx)},${n(by + bh)}V${n(by + bh * 0.35)}Q${n(bx)},${n(by)} ${n(bx + bh * 0.4)},${n(by)}H${n(bx + bw - bh * 0.4)}Q${n(bx + bw)},${n(by)} ${n(bx + bw)},${n(by + bh * 0.35)}V${n(by + bh)}Z`, { fill: C.ink3 });
  const dome = (x, col, pale, b) => {
    const cx = x, cy = by + bh * 0.45;
    const beam = (deg) => cone(ctx, [cx, cy], { dir: deg, spread: 16, len: W * 0.9, color: col, opacity: 0.1, dots: false, core: false, name: 'b' + Math.round(x) + deg });
    return `<g class="a-rotor" style="transform-origin:${n(cx)}px ${n(cy)}px;${b ? 'animation-delay:-.6s' : ''}">${beam(120)}${beam(300)}</g>` +
      `<g class="a-siren${b ? ' a-siren--b' : ''}"><path d="M${n(cx - bw * 0.2)},${n(by + bh * 0.8)}V${n(by + bh * 0.3)}Q${n(cx - bw * 0.2)},${n(by + 2)} ${n(cx - bw * 0.1)},${n(by + 2)}H${n(cx + bw * 0.1)}Q${n(cx + bw * 0.2)},${n(by + 2)} ${n(cx + bw * 0.2)},${n(by + bh * 0.3)}V${n(by + bh * 0.8)}Z" fill="${col}"/>${flare(cx, cy, H * 0.26, pale, '')}</g>`;
  };
  s += dome(bx + bw * 0.27, C.alarm, '#ffc2b6', false) + dome(bx + bw * 0.73, C.t1, '#effffc', true);
  s += reflections(ctx, [{ x: W * 0.3, w: 24, color: C.alarm, o: 0.5 }, { x: W * 0.52, w: 24, color: C.t1, o: 0.5 }], { y0: H * 0.64, y1: H * 0.78 });
  return { svg: s, rain: { density: 0.9, angle: 10 }, anchors: { calloway: out.mouth, _figure: out.mouth }, space: [0.04, 0.05, 0.55, 0.35], focus: [0.6, 0.5] };
}
