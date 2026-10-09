// Close-ups: blueprint-closeup, hands-typing, cctv-monitor, door-keypad, safe-dial, loot, clock, newspaper.
import {
  C, glowDots, cone, reflections, figure, vignette, blinds, signText, skyline, building,
  halftone, radialR, linearR, hatch, poly, line, circ, P, R, G, n, rot, esc,
} from '../kit.js';
import { flare } from './city.js';

/* ------------------------------------------------------------------ */
/* Hand: flat cut-paper hand. (x,y) = wrist, ang = direction the fingers point (deg, 0 = up). */
export function hand(x, y, s, ang, { pose = 'flat', fill = C.ink, rim = null, sleeve = C.ink3, cuff = true } = {}) {
  const parts = [];
  // sleeve running back off the wrist
  if (sleeve) parts.push({ d: `M${n(-s * 0.36)},${n(s * 0.1)}L${n(s * 0.36)},${n(s * 0.1)}L${n(s * 0.46)},${n(s * 3)}L${n(-s * 0.46)},${n(s * 3)}Z`, fill: sleeve });
  if (cuff) parts.push({ d: `M${n(-s * 0.33)},${n(s * 0.02)}h${n(s * 0.66)}v${n(s * 0.14)}h${n(-s * 0.66)}Z`, fill: C.cream2 });
  const body = [];
  body.push(`M${n(-s * 0.3)},0L${n(-s * 0.36)},${n(-s * 0.55)}Q${n(-s * 0.36)},${n(-s * 0.72)} ${n(-s * 0.18)},${n(-s * 0.74)}L${n(s * 0.2)},${n(-s * 0.74)}Q${n(s * 0.36)},${n(-s * 0.72)} ${n(s * 0.34)},${n(-s * 0.5)}L${n(s * 0.28)},0Z`);
  const fl = { flat: [1, 1, 1, 1], point: [0.35, 1.25, 0.35, 0.3], grip: [0.55, 0.6, 0.55, 0.5], press: [0.4, 1.2, 0.4, 0.35] }[pose] || [1, 1, 1, 1];
  const fx = [-0.25, -0.08, 0.09, 0.25];
  fx.forEach((ox, i) => {
    const L = s * 0.55 * fl[i] * [0.92, 1, 0.96, 0.8][i];
    const w = s * 0.075;
    body.push(`M${n(ox * s - w)},${n(-s * 0.68)}V${n(-s * 0.68 - L)}a${n(w)},${n(w)} 0 0 1 ${n(2 * w)},0V${n(-s * 0.68)}Z`);
  });
  // thumb
  body.push(`M${n(-s * 0.28)},${n(-s * 0.3)}L${n(-s * 0.62)},${n(-s * 0.62)}a${n(s * 0.075)},${n(s * 0.075)} 0 0 1 ${n(s * 0.1)},${n(-s * 0.1)}L${n(-s * 0.18)},${n(-s * 0.52)}Z`);
  const b = body.map((d) => `<path d="${d}"/>`).join('');
  let o = `<g transform="translate(${n(x)} ${n(y)}) rotate(${n(ang)})">`;
  for (const p of parts) o += `<path d="${p.d}" fill="${p.fill}"/>`;
  if (rim) o += `<g fill="${rim.color}" transform="translate(${n(rim.dx)} ${n(rim.dy)})">${b}</g>`;
  o += `<g fill="${fill}">${b}</g></g>`;
  return o;
}

/** Back-of-head bust (someone watching, seen from behind): head, hat, round shoulders. */
export function bust(x, y, s, build = 'guard', { rim = C.t1, fill = C.ink } = {}) {
  const hat = {
    guard: `M${n(x - s * 0.24)},${n(y - s * 0.1)}C${n(x - s * 0.26)},${n(y - s * 0.42)} ${n(x + s * 0.26)},${n(y - s * 0.42)} ${n(x + s * 0.24)},${n(y - s * 0.1)}Z M${n(x - s * 0.3)},${n(y - s * 0.1)}h${n(s * 0.6)}v${n(s * 0.05)}h${n(-s * 0.6)}Z`,
    fedora: `M${n(x - s * 0.42)},${n(y - s * 0.14)}h${n(s * 0.84)}v${n(s * 0.05)}h${n(-s * 0.84)}Z M${n(x - s * 0.22)},${n(y - s * 0.12)}L${n(x - s * 0.2)},${n(y - s * 0.38)}L${n(x + s * 0.2)},${n(y - s * 0.38)}L${n(x + s * 0.22)},${n(y - s * 0.12)}Z`,
  }[build] || '';
  const body = `M${n(x - s * 0.9)},${n(y + s * 1.2)}C${n(x - s * 0.9)},${n(y + s * 0.5)} ${n(x - s * 0.6)},${n(y + s * 0.38)} ${n(x - s * 0.2)},${n(y + s * 0.32)}L${n(x - s * 0.14)},${n(y + s * 0.12)}L${n(x + s * 0.14)},${n(y + s * 0.12)}L${n(x + s * 0.2)},${n(y + s * 0.32)}C${n(x + s * 0.6)},${n(y + s * 0.38)} ${n(x + s * 0.9)},${n(y + s * 0.5)} ${n(x + s * 0.9)},${n(y + s * 1.2)}Z`;
  const head = `M${n(x - s * 0.22)},${n(y)}a${n(s * 0.22)},${n(s * 0.26)} 0 1,0 ${n(s * 0.44)},0a${n(s * 0.22)},${n(s * 0.26)} 0 1,0 ${n(-s * 0.44)},0`;
  const parts = [body, head, ...hat.split(' M').map((p, i) => (i ? 'M' + p : p))].filter(Boolean).map((d) => `<path d="${d}"/>`).join('');
  return `<g fill="${rim}" transform="translate(-2.5 -2.5)">${parts}</g><g fill="${fill}">${parts}</g>`;
}

/* ------------------------------------------------------------------ */
export function safeDial(ctx) {
  const { W, H, r } = ctx;
  const cx = W * 0.44, cy = H * 0.54, R0 = H * 0.42;
  let s = R(0, 0, W, H, { fill: C.ink3 });
  // brushed steel door: fine hatch + rivets + a hard gold light slash
  s += hatch({ w: W, h: H, gap: 5, angle: -12, stroke: C.ink2, sw: 1.2 });
  s += P(poly([[W * 0.62, 0], [W * 0.8, 0], [W * 0.46, H], [W * 0.28, H]]), { fill: C.gold, opacity: 0.07 });
  for (let i = 0; i < 6; i++) { const rx = W * (0.06 + i * 0.18), ry = H * 0.07; s += `<circle cx="${n(rx)}" cy="${n(ry)}" r="7" fill="${C.ink2}"/><circle cx="${n(rx - 2)}" cy="${n(ry - 2)}" r="2.5" fill="${C.t3}"/>`; }
  // dial shadow + bezel
  s += `<circle cx="${n(cx + 10)}" cy="${n(cy + 12)}" r="${n(R0 * 1.08)}" fill="${C.ink}" opacity=".7"/>`;
  s += `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(R0 * 1.08)}" fill="${C.ink4}"/>`;
  s += `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(R0 * 1.02)}" fill="${C.ink}"/>`;
  // the rotating face: ticks and numbers
  let ticks = '', nums = '';
  for (let i = 0; i < 100; i++) {
    const a = (i / 100) * Math.PI * 2 - Math.PI / 2;
    const L = i % 10 === 0 ? 0.16 : i % 5 === 0 ? 0.1 : 0.06;
    ticks += `M${n(cx + Math.cos(a) * R0 * 0.97)},${n(cy + Math.sin(a) * R0 * 0.97)}L${n(cx + Math.cos(a) * R0 * (0.97 - L))},${n(cy + Math.sin(a) * R0 * (0.97 - L))}`;
    if (i % 10 === 0) {
      const tx = cx + Math.cos(a) * R0 * 0.68, ty = cy + Math.sin(a) * R0 * 0.68;
      nums += `<text x="${n(tx)}" y="${n(ty)}" font-family="Big Shoulders Display" font-weight="900" font-size="${n(R0 * 0.13)}" fill="${C.cream}" text-anchor="middle" dominant-baseline="central" transform="rotate(${n((i / 100) * 360)} ${n(tx)} ${n(ty)})">${i}</text>`;
    }
  }
  s += `<g class="a-dial" style="transform-origin:${n(cx)}px ${n(cy)}px"><circle cx="${n(cx)}" cy="${n(cy)}" r="${n(R0 * 0.98)}" fill="${C.ink2}"/><path d="${ticks}" stroke="${C.cream}" stroke-width="2"/>${nums}
    <circle cx="${n(cx)}" cy="${n(cy)}" r="${n(R0 * 0.44)}" fill="${C.ink3}"/>${(() => { let k = ''; for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2; k += `M${n(cx + Math.cos(a) * R0 * 0.36)},${n(cy + Math.sin(a) * R0 * 0.36)}L${n(cx + Math.cos(a) * R0 * 0.44)},${n(cy + Math.sin(a) * R0 * 0.44)}`; } return `<path d="${k}" stroke="${C.ink}" stroke-width="3"/>`; })()}
    <circle cx="${n(cx)}" cy="${n(cy)}" r="${n(R0 * 0.3)}" fill="${C.ink4}"/></g>`;
  // halftone shade on the lower-left of the dial (form, printed)
  s += halftone({ x: cx - R0, y: cy - R0, w: R0 * 2, h: R0 * 2, step: 7, rFn: (px, py) => { const d = Math.hypot(px - cx, py - cy); if (d > R0 * 0.98) return 0; const k = ((cx - px) + (py - cy)) / (R0 * 1.4); return Math.max(0, k) * 3; }, fill: C.ink, opacity: 0.8 });
  // index mark (fixed) and the gold rim light across the upper-right edge
  s += P(`M${n(cx - 9)},${n(cy - R0 * 1.1)}h18l-9,16Z`, { fill: C.goldHot });
  s += `<path d="M${n(cx + Math.cos(-1.45) * R0 * 1.05)},${n(cy + Math.sin(-1.45) * R0 * 1.05)}A${n(R0 * 1.05)},${n(R0 * 1.05)} 0 0 1 ${n(cx + Math.cos(0.25) * R0 * 1.05)},${n(cy + Math.sin(0.25) * R0 * 1.05)}" stroke="${C.goldHot}" stroke-width="${n(R0 * 0.035)}" fill="none" stroke-linecap="round"/>`;
  s += `<path d="M${n(cx + Math.cos(-1.2) * R0 * 1.05)},${n(cy + Math.sin(-1.2) * R0 * 1.05)}A${n(R0 * 1.05)},${n(R0 * 1.05)} 0 0 1 ${n(cx + Math.cos(-0.1) * R0 * 1.05)},${n(cy + Math.sin(-0.1) * R0 * 1.05)}" stroke="#fff3cf" stroke-width="${n(R0 * 0.012)}" fill="none"/>`;
  // fingertips gripping the knob from the right, rim-lit
  const hx = cx + R0 * 0.78, hy = cy + R0 * 0.5;
  s += hand(hx, hy, R0 * 0.66, -58, { pose: 'grip', fill: C.ink, rim: { color: C.goldHot, dx: -2, dy: -3 }, sleeve: C.ink2 });
  // listening: a stethoscope cable sneaking in
  s += P(`M${n(W)},${n(H * 0.18)}C${n(W * 0.8)},${n(H * 0.12)} ${n(cx + R0 * 0.7)},${n(cy - R0 * 0.9)} ${n(cx + R0 * 0.55)},${n(cy - R0 * 0.55)}`, { stroke: C.ink, 'stroke-width': 5, fill: 'none' });
  s += `<circle cx="${n(cx + R0 * 0.55)}" cy="${n(cy - R0 * 0.55)}" r="${n(R0 * 0.08)}" fill="${C.ink4}" stroke="${C.gold}" stroke-width="2"/>`;
  s += vignette(ctx, { strength: 1.1 });
  return { svg: s, space: [0.68, 0.3, 0.98, 0.95], sfxAt: [0.8, 0.36], focus: [0.44, 0.54], anchors: { juno: [W * 0.85, H * 0.9], _figure: [W * 0.85, H * 0.9] } };
}

/* ------------------------------------------------------------------ */
export function doorKeypad(ctx) {
  const { W, H, r, p } = ctx;
  const code = String(p.code ?? '').replace(/\s+/g, '') || '····';
  let s = R(0, 0, W, H, { fill: C.t8 });
  s += hatch({ w: W, h: H, gap: 22, angle: 90, stroke: C.t9, sw: 3 });
  s += P(poly([[0, 0], [W * 0.35, 0], [W * 0.1, H], [0, H]]), { fill: C.gold, opacity: 0.06 });
  // the panel, slight dutch tilt
  const pw = H * 0.62, ph = H * 0.86, px = W * 0.5 - pw / 2, py = H * 0.07;
  let k = '';
  k += R(px + 12, py + 14, pw, ph, { fill: C.ink, opacity: 0.7 });
  k += R(px, py, pw, ph, { fill: C.ink3 });
  k += R(px, py, pw, 4, { fill: C.gold, opacity: 0.7 });
  for (const [sx, sy] of [[0.06, 0.04], [0.94, 0.04], [0.06, 0.96], [0.94, 0.96]]) k += `<circle cx="${n(px + pw * sx)}" cy="${n(py + ph * sy)}" r="5" fill="${C.ink2}"/><path d="M${n(px + pw * sx - 3)},${n(py + ph * sy)}h6" stroke="${C.t3}" stroke-width="1.5"/>`;
  // LCD with the code
  const lx = px + pw * 0.1, ly = py + ph * 0.08, lw = pw * 0.8, lh = ph * 0.14;
  k += R(lx, ly, lw, lh, { fill: C.ink }) + R(lx + 5, ly + 5, lw - 10, lh - 10, { fill: '#1d1606' });
  const digits = [...code].slice(0, 8).join(' ');
  k += `<text x="${n(lx + lw / 2)}" y="${n(ly + lh * 0.72)}" font-family="JetBrains Mono" font-weight="600" font-size="${n(lh * 0.56)}" fill="${C.goldHot}" text-anchor="middle" letter-spacing="2">${esc(digits)}</text>`;
  k += halftone({ x: lx, y: ly, w: lw, h: lh, step: 4, angle: 0, rFn: () => 0.7, fill: C.ink, opacity: 0.35 });
  // keys
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'];
  const kx0 = px + pw * 0.12, ky0 = py + ph * 0.3, kw = pw * 0.22, kh = ph * 0.13, gx = pw * 0.05, gy = ph * 0.03;
  const pressed = code.match(/\d/g)?.slice(-1)[0] ?? '5';
  let pk = null;
  keys.forEach((c, i) => {
    const x = kx0 + (i % 3) * (kw + gx), y = ky0 + Math.floor(i / 3) * (kh + gy);
    const isP = c === pressed && !pk;
    if (isP) pk = [x + kw / 2, y + kh / 2];
    k += R(x + 3, y + 4, kw, kh, { fill: C.ink });
    k += R(x, y + (isP ? 3 : 0), kw, kh, { fill: isP ? C.gold : C.ink4 });
    k += R(x, y + (isP ? 3 : 0), kw, 3, { fill: isP ? C.goldHot : C.t4 });
    k += `<text x="${n(x + kw / 2)}" y="${n(y + kh * 0.72 + (isP ? 3 : 0))}" font-family="Big Shoulders Display" font-weight="900" font-size="${n(kh * 0.62)}" fill="${isP ? C.ink : C.cream}" text-anchor="middle">${c}</text>`;
  });
  k += `<circle cx="${n(px + pw * 0.88)}" cy="${n(py + ph * 0.26)}" r="6" fill="${C.goldHot}" class="a-blink"/>`;
  s += `<g transform="rotate(-5 ${n(W / 2)} ${n(H / 2)})">${k}`;
  // index finger pressing
  s += `<g class="a-press">${hand(pk[0] + H * 0.02, pk[1] + H * 0.36, H * 0.34, -12, { pose: 'press', fill: C.ink, rim: { color: C.gold, dx: -2.5, dy: -1 }, sleeve: C.ink2 })}</g></g>`;
  s += vignette(ctx);
  return { svg: s, space: [0.02, 0.05, 0.28, 0.6], sfxAt: [0.8, 0.3], focus: [0.5, 0.5] };
}

/* ------------------------------------------------------------------ */
export function cctvMonitor(ctx) {
  const { W, H, r, p } = ctx;
  const label = String(p.label || 'CAM 1').toUpperCase();
  const dead = /NO SIGNAL|DEAD|OFFLINE|DOWN/.test(label);
  let s = R(0, 0, W, H, { fill: C.ink });
  // the rack
  const cols = W > H * 1.3 ? 3 : 2;
  const mw = W * 0.9 / cols, mh = H * 0.42;
  const x0 = W * 0.05, y0 = H * 0.11;
  const feed = (x, y, w, h, i) => {
    let f = R(x, y, w, h, { fill: C.t8 });
    const id = ctx.clip('scr' + i, `M${n(x)},${n(y)}h${n(w)}v${n(h)}h${n(-w)}Z`);
    let inner = '';
    if (i === 0 && !dead) {
      // the live feed: corridor + a figure mid-step, in monochrome teal
      const vx = x + w * 0.55, vy = y + h * 0.48;
      inner += P(poly([[x, y], [vx - w * 0.08, vy - h * 0.12], [vx - w * 0.08, vy + h * 0.14], [x, y + h]]), { fill: C.t6 });
      inner += P(poly([[x + w, y], [vx + w * 0.08, vy - h * 0.12], [vx + w * 0.08, vy + h * 0.14], [x + w, y + h]]), { fill: C.t5 });
      inner += P(poly([[x, y + h], [vx - w * 0.08, vy + h * 0.14], [vx + w * 0.08, vy + h * 0.14], [x + w, y + h]]), { fill: C.t4 });
      inner += R(vx - w * 0.08, vy - h * 0.12, w * 0.16, h * 0.26, { fill: C.t7 });
      inner += figure(x + w * 0.38, y + h * 0.92, h * 0.62, { pose: 'sneak', build: ctx.p.who || 'viv', face: 1, fill: C.t9 });
    } else {
      inner += halftone({ x, y, w, h, step: 5, angle: 0, rFn: () => (r() < 0.45 ? r.range(0.4, 1.6) : 0), fill: C.t2, opacity: 0.6, cls: 'a-static' });
    }
    // scanlines + rolling bar
    let sl = '';
    for (let yy = y; yy < y + h; yy += 4) sl += `M${n(x)},${n(yy)}h${n(w)}`;
    inner += P(sl, { stroke: C.ink, 'stroke-width': 1.4, opacity: 0.5 });
    inner += `<g class="a-scan" style="transform-origin:0 0">${R(x, y + h * 0.4, w, h * 0.12, { fill: C.t1, opacity: 0.1 })}</g>`;
    f += `<g clip-path="url(#${id})">${inner}</g>`;
    f += `<text x="${n(x + w * 0.05)}" y="${n(y + h * 0.13)}" font-family="JetBrains Mono" font-weight="600" font-size="${n(Math.min(h * 0.085, (w * 0.9) / Math.max(8, (i === 0 ? label : 'CAM 0').length * 0.62)))}" fill="${C.cream}">${esc(i === 0 ? label : 'CAM ' + (i + 2))}</text>`;
    if (i === 0 && dead) f += `<rect x="${n(x + w * 0.3)}" y="${n(y + h * 0.42)}" width="${n(w * 0.4)}" height="${n(h * 0.16)}" fill="${C.ink}"/><text x="${n(x + w / 2)}" y="${n(y + h * 0.53)}" font-family="JetBrains Mono" font-weight="600" font-size="${n(h * 0.08)}" fill="${C.goldHot}" text-anchor="middle" class="a-blink">NO SIGNAL</text>`;
    if (i === 0 && !dead) {
      f += `<circle cx="${n(x + w * 0.9)}" cy="${n(y + h * 0.1)}" r="${n(h * 0.03)}" fill="${C.alarm}" class="a-blink"/><text x="${n(x + w * 0.86)}" y="${n(y + h * 0.13)}" font-family="JetBrains Mono" font-size="${n(h * 0.07)}" fill="${C.cream}" text-anchor="end">REC</text>`;
      f += `<text x="${n(x + w * 0.95)}" y="${n(y + h * 0.93)}" font-family="JetBrains Mono" font-size="${n(h * 0.07)}" fill="${C.cream}" text-anchor="end">${esc(p.time || '02:47:13')}</text>`;
    }
    return f;
  };
  // big main monitor + smaller ones
  const bigW = cols === 3 ? mw * 2 - 10 : mw * 2 - 10, bigH = mh * 1.35;
  s += R(x0 - 8, y0 - 8, bigW + 16, bigH + 16, { fill: C.ink3 });
  s += feed(x0, y0, bigW, bigH, 0);
  if (cols === 3) {
    s += R(x0 + mw * 2 - 2, y0 - 8, mw * 0.9 + 12, mh * 0.62, { fill: C.ink3 }) + feed(x0 + mw * 2 + 4, y0, mw * 0.9, mh * 0.55, 1);
    s += R(x0 + mw * 2 - 2, y0 + mh * 0.7 - 8, mw * 0.9 + 12, mh * 0.62, { fill: C.ink3 }) + feed(x0 + mw * 2 + 4, y0 + mh * 0.7, mw * 0.9, mh * 0.55, 2);
  }
  // cold light on the desk + back of the watching guard's head
  s += P(poly([[0, H * 0.72], [W, H * 0.7], [W, H], [0, H]]), { fill: C.ink2 });
  s += glowDots(ctx, W * 0.45, H * 0.72, H * 0.5, { color: C.t2, max: 2.2, step: 9, sy: 0.35, opacity: 0.5 });
  s += `<circle cx="${n(W * 0.2)}" cy="${n(H * 0.83)}" r="${n(H * 0.06)}" fill="${C.cream2}"/><circle cx="${n(W * 0.2)}" cy="${n(H * 0.83)}" r="${n(H * 0.045)}" fill="#2a1a10"/>`;
  const gx = W * 0.8, gy = H * 0.64;
  s += bust(gx, gy, H * 0.5, 'guard', { rim: C.t1 });
  s += vignette(ctx, { strength: 0.8 });
  return { svg: s, space: [0.05, 0.64, 0.5, 0.95], focus: [0.35, 0.3], anchors: { guard: [gx - H * 0.1, gy + H * 0.02], ruiz: [gx - H * 0.1, gy + H * 0.02] } };
}

/* ------------------------------------------------------------------ */
export function blueprintCloseup(ctx) {
  const { W, H, r } = ctx;
  let s = R(0, 0, W, H, { fill: C.ink });
  // the sheet, filling the frame at a low raking angle
  let b = R(-W * 0.1, -H * 0.1, W * 1.2, H * 1.2, { fill: C.t5 });
  b += hatch({ x: -W * 0.1, y: -H * 0.1, w: W * 1.2, h: H * 1.2, gap: 20, angle: 0, stroke: C.t4, sw: 0.8 }) + hatch({ x: -W * 0.1, y: -H * 0.1, w: W * 1.2, h: H * 1.2, gap: 20, angle: 90, stroke: C.t4, sw: 0.8 });
  const L = (pts, sw = 3) => P(line(pts.map(([a, c]) => [a * W, c * H])), { stroke: C.cream, 'stroke-width': sw, fill: 'none' });
  b += L([[0.05, 0.12], [0.95, 0.12], [0.95, 0.9], [0.05, 0.9], [0.05, 0.12]], 5);
  b += L([[0.5, 0.12], [0.5, 0.55], [0.95, 0.55]]) + L([[0.05, 0.5], [0.3, 0.5]]) + L([[0.3, 0.5], [0.3, 0.9]]);
  // door swings + dimension line
  b += P(`M${n(W * 0.5)},${n(H * 0.3)}a${n(H * 0.1)},${n(H * 0.1)} 0 0 1 ${n(H * 0.1)},${n(H * 0.1)}`, { stroke: C.cream, 'stroke-width': 1.5, fill: 'none', 'stroke-dasharray': '4 4' });
  b += P(`M${n(W * 0.05)},${n(H * 0.05)}H${n(W * 0.5)}M${n(W * 0.05)},${n(H * 0.03)}v${n(H * 0.04)}M${n(W * 0.5)},${n(H * 0.03)}v${n(H * 0.04)}`, { stroke: C.cream2, 'stroke-width': 1.2 });
  b += `<text x="${n(W * 0.27)}" y="${n(H * 0.04)}" font-family="Architects Daughter" font-size="${n(H * 0.035)}" fill="${C.cream2}" text-anchor="middle">12'-6"</text>`;
  b += `<text x="${n(W * 0.2)}" y="${n(H * 0.3)}" font-family="Architects Daughter" font-size="${n(H * 0.05)}" fill="${C.cream}" letter-spacing="3">SHOWROOM</text>`;
  b += `<text x="${n(W * 0.62)}" y="${n(H * 0.72)}" font-family="Architects Daughter" font-size="${n(H * 0.045)}" fill="${C.cream}" letter-spacing="3">STORE</text>`;
  // camera cone drawn on the plan
  b += P(poly([[W * 0.06, H * 0.13], [W * 0.3, H * 0.3], [W * 0.18, H * 0.42]]), { fill: C.cream, opacity: 0.12 });
  // target room circled in grease pencil, drawing itself
  const tx = W * 0.73, ty = H * 0.32;
  b += `<path d="M${n(tx + H * 0.2)},${n(ty - H * 0.02)}C${n(tx + H * 0.22)},${n(ty - H * 0.2)} ${n(tx - H * 0.26)},${n(ty - H * 0.2)} ${n(tx - H * 0.24)},${n(ty + H * 0.02)}C${n(tx - H * 0.22)},${n(ty + H * 0.2)} ${n(tx + H * 0.24)},${n(ty + H * 0.18)} ${n(tx + H * 0.22)},${n(ty - H * 0.06)}" stroke="${C.goldHot}" stroke-width="6" fill="none" stroke-linecap="round" pathLength="1" class="a-draw"/>`;
  b += `<text x="${n(tx - H * 0.08)}" y="${n(ty + H * 0.03)}" font-family="Architects Daughter" font-size="${n(H * 0.07)}" fill="${C.goldHot}" transform="rotate(-6 ${n(tx)} ${n(ty)})">SAFE</text>`;
  b += P(`M${n(W * 0.2)},${n(H * 0.84)}C${n(W * 0.35)},${n(H * 0.7)} ${n(W * 0.5)},${n(H * 0.62)} ${n(tx - H * 0.2)},${n(ty + H * 0.12)}`, { stroke: C.goldHot, 'stroke-width': 4, fill: 'none', 'stroke-dasharray': '14 10' });
  s += `<g transform="rotate(-9 ${n(W / 2)} ${n(H / 2)}) skewX(-8)">${b}</g>`;
  // lamp light: hot pool top-left, halftone falloff into shadow at the bottom-right
  s += P(poly([[0, 0], [W, 0], [W, H], [0, H]]), { fill: ctx.rg('pool', [[0, C.gold, 0.18], [0.6, C.gold, 0.04], [1, C.ink, 0.5]], W * 0.4, H * 0.3, W * 0.8) });
  s += halftone({ w: W, h: H, step: 9, rFn: linearR(W * 0.4, H * 0.3, W * 1.05, H * 1.1, 3.4, 1.6), fill: C.ink, opacity: 0.85 });
  // hand with the grease pencil, rim-lit
  const hx = tx + H * 0.3, hy = ty + H * 0.5;
  s += P(`M${n(tx + H * 0.16)},${n(ty + H * 0.02)}L${n(hx - H * 0.02)},${n(hy - H * 0.26)}`, { stroke: C.goldHot, 'stroke-width': 9, 'stroke-linecap': 'round' });
  s += hand(hx, hy, H * 0.36, -34, { pose: 'grip', fill: C.ink, rim: { color: C.gold, dx: -3, dy: -2 }, sleeve: C.ink3 });
  return { svg: s, space: [0.03, 0.62, 0.45, 0.96], focus: [0.7, 0.35], anchors: { viv: [W * 0.95, H * 0.95] } };
}

/* ------------------------------------------------------------------ */
export function handsTyping(ctx) {
  const { W, H, r } = ctx;
  let s = R(0, 0, W, H, { fill: C.ink });
  // the terminal screen, top, angled: SQL lines glowing
  const sx = W * 0.14, sy = -H * 0.06, sw = W * 0.72, sh = H * 0.5;
  s += P(poly([[sx - 14, sy], [sx + sw + 14, sy], [sx + sw - 10, sy + sh + 16], [sx + 10, sy + sh + 16]]), { fill: C.ink3 });
  s += P(poly([[sx, sy], [sx + sw, sy], [sx + sw - 24, sy + sh], [sx + 24, sy + sh]]), { fill: C.t8 });
  const code = ['SELECT name, shift', 'FROM staff', "WHERE shift = 'night'", '_'];
  code.forEach((l, i) => {
    s += `<text x="${n(sx + 50)}" y="${n(sy + sh * 0.3 + i * sh * 0.13)}" font-family="JetBrains Mono" font-weight="600" font-size="${n(sh * 0.085)}" fill="${i === 3 ? C.goldHot : C.t1}"${i === 3 ? ' class="a-blink"' : ''}>${esc(l)}</text>`;
  });
  s += hatch({ x: sx, y: sy, w: sw, h: sh, gap: 4, angle: 0, stroke: C.ink, sw: 1.2, opacity: 0.4 });
  // screen glow spilling down onto the keyboard (cold)
  s += P(poly([[sx + 24, sy + sh], [sx + sw - 24, sy + sh], [W, H], [0, H]]), { fill: C.t2, opacity: 0.1 });
  // keyboard in steep perspective
  const ky = H * 0.56;
  s += P(poly([[W * 0.02, H], [W * 0.98, H], [W * 0.84, ky], [W * 0.16, ky]]), { fill: C.ink3 });
  let keys = '';
  for (let row = 0; row < 5; row++) {
    const t0 = row / 5, t1 = (row + 0.8) / 5;
    const y0 = ky + (H - ky) * t0 + 6, y1 = ky + (H - ky) * t1 + 2;
    const xl0 = W * 0.16 - (W * 0.14) * t0, xr0 = W * 0.84 + (W * 0.14) * t0;
    const xl1 = W * 0.16 - (W * 0.14) * t1, xr1 = W * 0.84 + (W * 0.14) * t1;
    const nk = 12;
    for (let i = 0; i < nk; i++) {
      const a = (i + 0.1) / nk, b2 = (i + 0.9) / nk;
      keys += poly([[xl0 + (xr0 - xl0) * a, y0], [xl0 + (xr0 - xl0) * b2, y0], [xl1 + (xr1 - xl1) * b2, y1], [xl1 + (xr1 - xl1) * a, y1]]);
    }
  }
  s += P(keys, { fill: C.ink4 });
  s += P(keys, { fill: 'none', stroke: C.t3, 'stroke-width': 0.8, opacity: 0.6 });
  // two hands, from below, rim-lit by the screen; the right one taps on twos
  s += hand(W * 0.3, H * 1.02, H * 0.46, 18, { pose: 'flat', fill: C.ink, rim: { color: C.t1, dx: 0, dy: -3 }, sleeve: C.ink2 });
  s += `<g class="a-press">${hand(W * 0.66, H * 1.04, H * 0.46, -14, { pose: 'press', fill: C.ink, rim: { color: C.t1, dx: 0, dy: -3 }, sleeve: C.ink2 })}</g>`;
  s += vignette(ctx);
  return { svg: s, space: [0.02, 0.5, 0.3, 0.8], sfxAt: [0.82, 0.62], focus: [0.5, 0.3], anchors: { you: [W * 0.5, H * 0.9] } };
}

/* ------------------------------------------------------------------ */
function itemKind(item = '') {
  const s = item.toLowerCase();
  if (/ledger|book|diary|journal|notebook/.test(s)) return 'ledger';
  if (/file|dossier|paper|record|document|letter|contract|deed|photo/.test(s)) return 'file';
  if (/paint|canvas|portrait|art|picture|frame/.test(s)) return 'painting';
  if (/cash|money|bills|dollar|\$|payroll|take/.test(s)) return 'cash';
  if (/diamond|jewel|gem|necklace|ring|pearl|ruby|emerald|stone/.test(s)) return 'gem';
  if (/chip|casino/.test(s)) return 'chips';
  if (/key|card/.test(s)) return 'key';
  if (/tape|reel|film|drive|disk|recording|cassette/.test(s)) return 'reel';
  if (/gold|bar|bullion|ingot/.test(s)) return 'bars';
  if (/box|deposit|case/.test(s)) return 'box';
  return 'case';
}

export function loot(ctx) {
  const { W, H, r, p } = ctx;
  const kind = itemKind(p.item);
  const cx = W * 0.5, cy = H * 0.62;
  let s = R(0, 0, W, H, { fill: C.ink });
  // spotlight from above: hard cone + pool
  s += cone(ctx, [cx, -H * 0.1], { dir: 0, spread: 34, len: H * 0.95, color: C.gold, opacity: 0.12, name: 'spot' });
  s += `<ellipse cx="${n(cx)}" cy="${n(cy + H * 0.12)}" rx="${n(H * 0.46)}" ry="${n(H * 0.1)}" fill="${C.gold}" opacity=".22"/>`;
  s += `<ellipse cx="${n(cx)}" cy="${n(cy + H * 0.12)}" rx="${n(H * 0.3)}" ry="${n(H * 0.065)}" fill="${C.goldHot}" opacity=".18"/>`;
  // plinth / table edge
  s += P(poly([[0, cy + H * 0.2], [W, cy + H * 0.2], [W, H], [0, H]]), { fill: C.ink2 });
  s += P(`M0,${n(cy + H * 0.2)}H${n(W)}`, { stroke: C.gold, 'stroke-width': 2, opacity: 0.5 });
  const u = H * 0.2;
  let o = '';
  const glints = [];
  if (kind === 'ledger' || kind === 'file') {
    // a bound ledger lying open, pages fanning; cover in dark leather
    o += P(poly([[cx - u * 1.6, cy + u * 0.55], [cx + u * 1.6, cy + u * 0.55], [cx + u * 1.45, cy - u * 0.3], [cx - u * 1.45, cy - u * 0.3]]), { fill: kind === 'file' ? C.manila2 : '#3a1f14' });
    o += P(poly([[cx - u * 1.5, cy + u * 0.45], [cx - u * 0.04, cy + u * 0.5], [cx - u * 0.04, cy - u * 0.36], [cx - u * 1.36, cy - u * 0.4]]), { fill: C.cream });
    o += P(poly([[cx + u * 1.5, cy + u * 0.45], [cx + u * 0.04, cy + u * 0.5], [cx + u * 0.04, cy - u * 0.36], [cx + u * 1.36, cy - u * 0.4]]), { fill: C.cream2 });
    let lines = '';
    for (let i = 0; i < 9; i++) { const yy = cy - u * 0.28 + i * u * 0.085; lines += `M${n(cx - u * 1.3)},${n(yy)}h${n(u * r.range(0.8, 1.1))}M${n(cx + u * 0.15)},${n(yy)}h${n(u * r.range(0.7, 1.1))}`; }
    o += P(lines, { stroke: C.ink4, 'stroke-width': 2 });
    // one line circled in grease pencil: the name
    o += `<ellipse cx="${n(cx + u * 0.65)}" cy="${n(cy - u * 0.02)}" rx="${n(u * 0.62)}" ry="${n(u * 0.1)}" stroke="${C.goldHot}" stroke-width="3" fill="none" pathLength="1" class="a-draw"/>`;
    glints.push([cx + u * 1.3, cy - u * 0.4]);
  } else if (kind === 'painting') {
    o += R(cx - u * 1.2, cy - u * 1.4, u * 2.4, u * 1.9, { fill: C.goldDeep });
    o += R(cx - u * 1.05, cy - u * 1.25, u * 2.1, u * 1.6, { fill: C.t6 });
    o += `<circle cx="${n(cx + u * 0.3)}" cy="${n(cy - u * 0.6)}" r="${n(u * 0.35)}" fill="${C.gold}"/>` + P(poly([[cx - u * 1.05, cy + u * 0.35], [cx - u * 0.2, cy - u * 0.5], [cx + u * 0.5, cy + u * 0.1], [cx + u * 1.05, cy - u * 0.2], [cx + u * 1.05, cy + u * 0.35]]), { fill: C.t4 });
    o += R(cx - u * 1.2, cy - u * 1.4, u * 2.4, u * 1.9, { fill: 'none', stroke: C.goldHot, 'stroke-width': 3 });
    glints.push([cx - u * 1.2, cy - u * 1.4], [cx + u * 1.2, cy + u * 0.5]);
  } else if (kind === 'cash') {
    for (let i = 0; i < 7; i++) {
      const bx = cx - u * 1.3 + (i % 4) * u * 0.62 + (i > 3 ? u * 0.3 : 0), by = cy + u * 0.2 - (i > 3 ? u * 0.34 : 0);
      o += R(bx, by, u * 0.58, u * 0.32, { fill: C.t3 }) + R(bx, by, u * 0.58, u * 0.05, { fill: C.t2 }) + R(bx + u * 0.22, by, u * 0.12, u * 0.32, { fill: C.manila });
    }
    glints.push([cx + u * 0.5, cy - u * 0.2]);
  } else if (kind === 'gem') {
    const gy = cy - u * 0.2, g = u * 0.8;
    o += P(poly([[cx - g, gy], [cx - g * 0.55, gy - g * 0.5], [cx + g * 0.55, gy - g * 0.5], [cx + g, gy], [cx, gy + g * 1.1]]), { fill: C.t1 });
    o += P(poly([[cx - g, gy], [cx + g, gy], [cx, gy + g * 1.1]]), { fill: C.t2 });
    o += P(poly([[cx - g * 0.55, gy - g * 0.5], [cx - g * 0.2, gy], [cx - g, gy]]), { fill: '#d6f1ec' });
    o += P(`M${n(cx - g * 0.2)},${n(gy)}L${n(cx)},${n(gy + g * 1.1)}L${n(cx + g * 0.2)},${n(gy)}M${n(cx - g * 0.2)},${n(gy)}L${n(cx)},${n(gy - g * 0.5)}L${n(cx + g * 0.2)},${n(gy)}`, { stroke: C.t4, 'stroke-width': 2, fill: 'none' });
    o += `<ellipse cx="${n(cx)}" cy="${n(cy + u * 0.55)}" rx="${n(u * 1.1)}" ry="${n(u * 0.18)}" fill="${C.ink4}"/>`;
    glints.push([cx - g * 0.5, gy - g * 0.4], [cx + g * 0.7, gy - g * 0.1]);
  } else if (kind === 'chips') {
    for (let st = 0; st < 3; st++) for (let i = 0; i < 6 - st; i++) {
      const bx = cx - u * 0.8 + st * u * 0.8, by = cy + u * 0.4 - i * u * 0.12;
      o += `<ellipse cx="${n(bx)}" cy="${n(by)}" rx="${n(u * 0.36)}" ry="${n(u * 0.12)}" fill="${[C.gold, C.t3, C.cream][st]}" stroke="${C.ink}" stroke-width="2"/>`;
    }
    glints.push([cx + u * 0.5, cy - u * 0.3]);
  } else if (kind === 'bars') {
    const bar = (bx, by) => P(poly([[bx, by], [bx + u * 0.9, by], [bx + u * 0.78, by - u * 0.3], [bx + u * 0.12, by - u * 0.3]]), { fill: C.gold }) + P(poly([[bx + u * 0.12, by - u * 0.3], [bx + u * 0.78, by - u * 0.3], [bx + u * 0.72, by - u * 0.36], [bx + u * 0.18, by - u * 0.36]]), { fill: C.goldHot });
    o += bar(cx - u * 1.4, cy + u * 0.5) + bar(cx - u * 0.45, cy + u * 0.5) + bar(cx + u * 0.5, cy + u * 0.5) + bar(cx - u * 0.95, cy + u * 0.14) + bar(cx, cy + u * 0.14) + bar(cx - u * 0.45, cy - u * 0.22);
    glints.push([cx + u * 0.2, cy - u * 0.5], [cx - u * 1.1, cy + u * 0.1]);
  } else if (kind === 'reel') {
    o += `<circle cx="${n(cx)}" cy="${n(cy - u * 0.2)}" r="${n(u * 0.9)}" fill="${C.ink3}"/><circle cx="${n(cx)}" cy="${n(cy - u * 0.2)}" r="${n(u * 0.62)}" fill="${C.ink}"/>`;
    for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 2; o += `<circle cx="${n(cx + Math.cos(a) * u * 0.42)}" cy="${n(cy - u * 0.2 + Math.sin(a) * u * 0.42)}" r="${n(u * 0.16)}" fill="${C.ink4}"/>`; }
    o += `<circle cx="${n(cx)}" cy="${n(cy - u * 0.2)}" r="${n(u * 0.1)}" fill="${C.gold}"/>`;
    glints.push([cx + u * 0.6, cy - u * 0.8]);
  } else if (kind === 'key') {
    o += `<circle cx="${n(cx - u * 0.8)}" cy="${n(cy)}" r="${n(u * 0.4)}" fill="none" stroke="${C.gold}" stroke-width="${n(u * 0.16)}"/>`;
    o += R(cx - u * 0.42, cy - u * 0.08, u * 1.6, u * 0.16, { fill: C.gold }) + R(cx + u * 0.8, cy, u * 0.14, u * 0.3, { fill: C.gold }) + R(cx + u * 1.02, cy, u * 0.14, u * 0.22, { fill: C.gold });
    glints.push([cx - u * 0.9, cy - u * 0.3]);
  } else if (kind === 'box') {
    o += P(poly([[cx - u * 1.2, cy + u * 0.5], [cx + u * 1.2, cy + u * 0.5], [cx + u * 1.2, cy - u * 0.2], [cx - u * 1.2, cy - u * 0.2]]), { fill: C.ink4 });
    o += P(poly([[cx - u * 1.2, cy - u * 0.2], [cx + u * 1.2, cy - u * 0.2], [cx + u * 1.0, cy - u * 0.5], [cx - u * 1.0, cy - u * 0.5]]), { fill: C.goldHot });
    o += R(cx - u * 0.9, cy - u * 0.45, u * 0.7, u * 0.24, { fill: C.cream }) + R(cx - u * 0.1, cy - u * 0.42, u * 0.5, u * 0.2, { fill: C.t3 });
    o += R(cx - u * 0.18, cy + u * 0.05, u * 0.36, u * 0.12, { fill: C.cream2 });
    glints.push([cx + u * 0.8, cy - u * 0.5]);
  } else {
    // open attaché case, glowing from inside
    o += P(poly([[cx - u * 1.3, cy + u * 0.5], [cx + u * 1.3, cy + u * 0.5], [cx + u * 1.3, cy], [cx - u * 1.3, cy]]), { fill: C.ink3 });
    o += P(poly([[cx - u * 1.3, cy], [cx + u * 1.3, cy], [cx + u * 1.1, cy - u * 1.1], [cx - u * 1.1, cy - u * 1.1]]), { fill: C.ink4 });
    o += P(poly([[cx - u * 1.2, cy - u * 0.02], [cx + u * 1.2, cy - u * 0.02], [cx + u * 1.02, cy - u * 1.0], [cx - u * 1.02, cy - u * 1.0]]), { fill: C.goldHot, opacity: 0.85 });
    glints.push([cx, cy - u * 0.5]);
  }
  s += o;
  for (const [gx, gy] of glints) s += `<g class="a-twinkle" style="transform-origin:${n(gx)}px ${n(gy)}px">${flare(gx, gy, u * 0.45, C.goldPale, '')}</g>`;
  // evidence tag on a string, with the item's name
  if (p.item) {
    const tw = Math.min(W * 0.42, 60 + String(p.item).length * H * 0.02), th = H * 0.1;
    let tx = cx + u * 1.9, ty = cy + u * 0.1;
    if (tx + tw + th * 0.4 > W - 8) { tx = Math.max(8, W - tw - th * 0.6 - 8); ty = cy + u * 0.95; }
    s += P(`M${n(cx + u * 1.1)},${n(cy + u * 0.3)}Q${n(tx - 10)},${n(ty + th)} ${n(tx + 8)},${n(ty + th / 2)}`, { stroke: C.cream2, 'stroke-width': 1.5, fill: 'none' });
    s += `<g transform="rotate(-8 ${n(tx)} ${n(ty)})"><path d="M${n(tx)},${n(ty + th / 2)}l${n(th * 0.4)},${n(-th / 2)}h${n(tw)}v${n(th)}h${n(-tw)}Z" fill="${C.manila}"/><circle cx="${n(tx + th * 0.42)}" cy="${n(ty + th / 2)}" r="${n(th * 0.14)}" fill="${C.ink}"/>`;
    s += `<text x="${n(tx + th * 0.72)}" y="${n(ty + th * 0.64)}" font-family="Special Elite" font-size="${n(th * 0.36)}" fill="${C.ink}">${esc(String(p.item).slice(0, 28))}</text></g>`;
  }
  s += vignette(ctx, { strength: 1.2 });
  return { svg: s, space: [0.03, 0.04, 0.4, 0.3], sfxAt: [0.25, 0.5], focus: [0.5, 0.6] };
}

/* ------------------------------------------------------------------ */
export function clock(ctx) {
  const { W, H, r, p } = ctx;
  const m = String(p.time || '02:47').match(/(\d{1,2})[:.](\d{2})(?:\s*([ap])\.?m?)?/i) || [0, '2', '47'];
  let hh = +m[1] % 12, mm = +m[2];
  let s = R(-W * 0.1, -H * 0.1, W * 1.2, H * 1.2, { fill: C.t8 });
  s += blinds(ctx, { angle: -24, gap: 58, band: 26, color: C.gold, opacity: 0.1 });
  const cx = W * 0.5, cy = H * 0.5, R0 = H * 0.4;
  // hard cast shadow, bezel, face
  s += `<circle cx="${n(cx + R0 * 0.14)}" cy="${n(cy + R0 * 0.12)}" r="${n(R0 * 1.06)}" fill="${C.ink}" opacity=".75"/>`;
  s += `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(R0 * 1.06)}" fill="${C.ink3}"/>`;
  s += `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(R0 * 0.98)}" fill="${C.cream}"/>`;
  s += halftone({ x: cx - R0, y: cy - R0, w: R0 * 2, h: R0 * 2, step: 7, rFn: (px, py) => { const d = Math.hypot(px - cx, py - cy); if (d > R0 * 0.97) return 0; return Math.max(0, ((px - cx) + (py - cy)) / (R0 * 1.4)) * 3.2; }, fill: C.cream2 });
  let tk = '', nums = '';
  const roman = ['XII', 'I', 'II', 'III', 'IIII', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
  for (let i = 0; i < 60; i++) {
    const a = (i / 60) * Math.PI * 2 - Math.PI / 2, L = i % 5 === 0 ? 0.08 : 0.035;
    tk += `M${n(cx + Math.cos(a) * R0 * 0.92)},${n(cy + Math.sin(a) * R0 * 0.92)}L${n(cx + Math.cos(a) * R0 * (0.92 - L))},${n(cy + Math.sin(a) * R0 * (0.92 - L))}`;
    if (i % 5 === 0) { const tx = cx + Math.cos(a) * R0 * 0.72, ty = cy + Math.sin(a) * R0 * 0.72; nums += `<text x="${n(tx)}" y="${n(ty)}" font-family="Bodoni Moda" font-style="italic" font-weight="700" font-size="${n(R0 * 0.14)}" fill="${C.ink}" text-anchor="middle" dominant-baseline="central">${roman[i / 5]}</text>`; }
  }
  s += P(tk, { stroke: C.ink, 'stroke-width': 2.5 }) + nums;
  const hand2 = (ang, len, w, col) => { const a = (ang - 90) * Math.PI / 180; return `<path d="M${n(cx - Math.cos(a) * len * 0.18)},${n(cy - Math.sin(a) * len * 0.18)}L${n(cx + Math.cos(a + 1.57) * w)},${n(cy + Math.sin(a + 1.57) * w)}L${n(cx + Math.cos(a) * len)},${n(cy + Math.sin(a) * len)}L${n(cx - Math.cos(a + 1.57) * w)},${n(cy - Math.sin(a + 1.57) * w)}Z" fill="${col}"/>`; };
  s += hand2((hh + mm / 60) * 30, R0 * 0.5, R0 * 0.05, C.ink) + hand2(mm * 6, R0 * 0.8, R0 * 0.035, C.ink);
  s += `<g class="a-tick" style="transform-origin:${n(cx)}px ${n(cy)}px">${P(`M${n(cx)},${n(cy + R0 * 0.15)}V${n(cy - R0 * 0.86)}`, { stroke: C.gold, 'stroke-width': 2.5 })}</g>`;
  s += `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(R0 * 0.05)}" fill="${C.gold}"/>`;
  // glass glint + gold rim on the lit edge
  s += `<path d="M${n(cx - R0 * 0.7)},${n(cy - R0 * 0.35)}A${n(R0 * 0.8)},${n(R0 * 0.8)} 0 0 1 ${n(cx - R0 * 0.2)},${n(cy - R0 * 0.78)}" stroke="#fff" stroke-width="${n(R0 * 0.04)}" fill="none" opacity=".45" stroke-linecap="round"/>`;
  s += `<path d="M${n(cx - R0 * 1.06)},${n(cy)}A${n(R0 * 1.06)},${n(R0 * 1.06)} 0 0 1 ${n(cx)},${n(cy - R0 * 1.06)}" stroke="${C.goldHot}" stroke-width="${n(R0 * 0.03)}" fill="none"/>`;
  // the time, typed small in the corner like a timecode
  s += `<text x="${n(W * 0.9)}" y="${n(H * 0.86)}" font-family="Big Shoulders Display" font-weight="900" font-size="${n(H * 0.08)}" fill="${C.gold}" text-anchor="end" letter-spacing="4">${esc(String(p.time || '02:47').toUpperCase())}</text>`;
  s += vignette(ctx);
  return { svg: `<g transform="rotate(-6 ${n(W / 2)} ${n(H / 2)})">${s}</g>`, space: [0.02, 0.04, 0.3, 0.4], sfxAt: [0.8, 0.3], focus: [0.5, 0.5] };
}

/* ------------------------------------------------------------------ */
export function wrapWords(text, maxChars) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > maxChars && cur) { lines.push(cur); cur = w; } else cur = (cur + ' ' + w).trim();
  }
  if (cur) lines.push(cur);
  return lines;
}

/** Newspaper front page markup in its own box (px, py, pw, ph). Reused by the debrief. */
export function frontPage(ctx, px, py, pw, ph, { headline = 'CITY HOLDS ITS BREATH', dateline = 'PORT VESPER · LATE CITY EDITION', photo = 'city' } = {}) {
  const r = ctx.r;
  let s = R(px, py, pw, ph, { fill: C.cream });
  s += halftone({ x: px, y: py, w: pw, h: ph, step: 6, rFn: linearR(px, py, px + pw, py + ph, 0.9, 1.5), fill: C.cream2 });
  const m = pw * 0.05;
  s += `<text x="${n(px + pw / 2)}" y="${n(py + ph * 0.11)}" font-family="Bodoni Moda" font-style="italic" font-weight="900" font-size="${n(Math.min(ph * 0.085, pw * 0.066))}" fill="${C.ink}" text-anchor="middle" textLength="${n(pw - 2 * m)}" lengthAdjust="spacingAndGlyphs">The Vesper Evening Standard</text>`;
  s += P(`M${n(px + m)},${n(py + ph * 0.135)}H${n(px + pw - m)}M${n(px + m)},${n(py + ph * 0.175)}H${n(px + pw - m)}`, { stroke: C.ink, 'stroke-width': 2 });
  s += `<text x="${n(px + pw / 2)}" y="${n(py + ph * 0.163)}" font-family="Special Elite" font-size="${n(ph * 0.024)}" fill="${C.ink}" text-anchor="middle" letter-spacing="2">${esc(dateline)}</text>`;
  // fit the whole headline in at most three lines by shrinking the type, never by dropping words
  const base = Math.max(10, Math.round(pw / (ph * 0.052)));
  let maxC = base, lines = wrapWords(String(headline).toUpperCase(), maxC);
  while (lines.length > 3 && maxC < base * 3) { maxC += 2; lines = wrapWords(String(headline).toUpperCase(), maxC); }
  const fs = ph * 0.1 * Math.min(1, base / maxC) * (lines.length > 2 ? 0.88 : 1);
  lines.forEach((l, i) => { s += `<text x="${n(px + pw / 2)}" y="${n(py + ph * 0.27 + i * fs * 0.98)}" font-family="Big Shoulders Display" font-weight="900" font-size="${n(fs)}" fill="${C.ink}" text-anchor="middle" textLength="${l.length > maxC * 0.7 ? n(pw - 2 * m) : ''}" lengthAdjust="spacingAndGlyphs">${esc(l)}</text>`.replace(' textLength=""', ''); });
  const top = py + ph * 0.27 + (lines.length - 1) * fs * 0.98 + ph * 0.05;
  // halftone photo: a little rain-city scene
  const phx = px + m, phw = pw * 0.56, phh = ph * 0.9 - (top - py) - ph * 0.06;
  s += R(phx, top, phw, phh, { fill: C.cream2 });
  const pid = ctx.clip('photo' + Math.round(px), `M${n(phx)},${n(top)}h${n(phw)}v${n(phh)}h${n(-phw)}Z`);
  let ph2 = '';
  let bx = phx;
  while (bx < phx + phw) { const bw = phw * r.range(0.1, 0.22), bh = phh * r.range(0.3, 0.85); ph2 += R(bx, top + phh - bh, bw, bh, { fill: C.ink }); bx += bw + 3; }
  ph2 += halftone({ x: phx, y: top, w: phw, h: phh, step: 5, rFn: linearR(phx, top, phx, top + phh, 2.4, 0.8), fill: C.ink });
  if (photo === 'figure') ph2 += figure(phx + phw * 0.5, top + phh, phh * 0.8, { pose: 'pockets', build: 'calloway', face: -1, fill: C.ink });
  s += `<g clip-path="url(#${pid})">${ph2}</g>`;
  s += R(phx, top, phw, phh, { fill: 'none', stroke: C.ink, 'stroke-width': 2 });
  // columns of body text
  let cols = '';
  const cx0 = phx + phw + m * 0.6, cw = px + pw - m - cx0;
  for (let y = top + 4; y < py + ph * 0.94; y += ph * 0.026) cols += `M${n(cx0)},${n(y)}h${n(cw * r.range(0.7, 1))}`;
  for (let y = top + phh + ph * 0.03; y < py + ph * 0.94; y += ph * 0.026) cols += `M${n(phx)},${n(y)}h${n(phw * r.range(0.7, 1))}`;
  s += P(cols, { stroke: C.ink4, 'stroke-width': n(ph * 0.009), opacity: 0.8 });
  return s;
}

export function newspaper(ctx) {
  const { W, H, r, p } = ctx;
  let s = R(0, 0, W, H, { fill: C.ink2 });
  s += glowDots(ctx, W * 0.5, H * 0.45, H * 0.7, { color: C.gold, max: 2.6, step: 11, opacity: 0.3 });
  s += hatch({ w: W, h: H, gap: 34, angle: -8, stroke: C.ink, sw: 2 });
  const ph = H * 0.86, pw = Math.min(W * 0.62, ph * 0.78);
  const px = W / 2 - pw / 2, py = H / 2 - ph / 2;
  s += `<g class="a-spin-in" style="transform-origin:${n(W / 2)}px ${n(H / 2)}px">`;
  s += R(px + 12, py + 14, pw, ph, { fill: C.ink, opacity: 0.8 });
  s += frontPage(ctx, px, py, pw, ph, { headline: p.headline || 'CITY HOLDS ITS BREATH', dateline: p.dateline || 'PORT VESPER · LATE CITY EDITION' });
  s += `</g>`;
  return { svg: s, rain: { density: 0.5, angle: 8 }, space: [0.02, 0.02, 0.2, 0.3], focus: [0.5, 0.5] };
}
