// The comic engine: plays Page[] scripts full-screen as comic spreads.
//   new ComicPlayer(root, pages, { skippable, onFirstPage, onDone }).start()
// Panels slam in one at a time; captions and bubbles type themselves; SFX pop in off-register.
// Advance: click / Space / Enter / → (finish typing → next beat → next panel → next page).
// Skip: Esc, or hold the matchbook. Auto-advance per beat (panel.hold overrides the last beat).
import { h, sleep, reducedMotion } from '../core/dom.js';
import { sfx, duck } from '../core/audio.js';
import * as S from '../core/state.js';
import { CREW } from '../data/crew.js';
import { portrait } from '../art/portraits.js';
import { renderShot } from './shots/index.js';
import { layoutPanels, centroid } from './layouts.js';
import { n, hash } from './svg.js';

const HEAVY = new Set(['alarm', 'police-lights', 'car-chase', 'getaway', 'vault-door']);
const SFX_SOUND = [
  [/CLICK|CLACK|TICK|KLIK|CHK/, 'unlock'],
  [/BRR|RING|WEE|WOO|ALARM/, 'alarm'],
  [/VR+O*M|SCREE|SKR|ZOOM|WHOOSH|SWISH|FWOO|KSSH|SHH/, 'whoosh'],
  [/BANG|BOOM|SLAM|THUD|WHAM|CRASH|KRA/, 'slam'],
  [/CHING|KA-?CHING|CASH/, 'cash'],
  [/BEEP|BOOP|BLIP|DING/, 'ok'],
];



const READ_SHOTS = new Set(['character-intro', 'title-card', 'newspaper']);
export class ComicPlayer {
  constructor(root, pages, { skippable = true, onFirstPage, onDone } = {}) {
    this.root = root;
    this.pages = (pages || []).filter((p) => p && Array.isArray(p.panels) && p.panels.length);
    this.opts = { skippable, onFirstPage, onDone };
    this.pi = -1;
    this.dead = false;
    this.timers = new Set();
    this.typing = null;
    this.busy = false;
    this.beats = [];
    this.bi = 0;
  }

  start() {
    const r = this.root;
    r.classList.add('cx-root');
    this.stageEl = h('div.cx-stage');
    this.hud = h('div.cx-hud');
    this.counter = h('span.dymo.cx-counter', '');
    this.nextHint = h('button.cx-next', { type: 'button', 'aria-label': 'Next' }, h('i'), h('span', 'Click or Space to continue'));
    this.hud.append(this.counter, this.nextHint);
    if (this.opts.skippable) this.hud.append(this.skipProp());
    r.append(this.stageEl, this.hud);
    this.onKey = (e) => {
      if (e.repeat) return;
      if (e.key === 'Escape' && this.opts.skippable) { e.preventDefault(); this.skip(); }
      else if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowRight') { e.preventDefault(); this.advance(); }
    };
    this.onClick = (e) => { if (e.target.closest('.cx-skip')) return; this.advance(); };
    this.onResize = () => { clearTimeout(this.rz); this.rz = setTimeout(() => this.relayout(), 160); };
    addEventListener('keydown', this.onKey);
    r.addEventListener('click', this.onClick);
    addEventListener('resize', this.onResize);
    if (!this.pages.length) { this.finish(); return; }
    this.gotoPage(0);
  }

  destroy() {
    this.dead = true;
    this.clearTimers();
    removeEventListener('keydown', this.onKey);
    removeEventListener('resize', this.onResize);
    this.root.removeEventListener('click', this.onClick);
    clearInterval(this.typing?.iv);
  }

  clearTimers() { this.timers.forEach(clearTimeout); this.timers.clear(); }
  later(fn, ms) { const t = setTimeout(() => { this.timers.delete(t); if (!this.dead) fn(); }, ms); this.timers.add(t); return t; }

  /* ---------------- page building ---------------- */
  pageBox() {
    const vw = this.root.clientWidth || innerWidth, vh = this.root.clientHeight || innerHeight;
    const m = Math.round(Math.max(14, Math.min(vw, vh) * 0.035));
    return { x: m, y: m, w: vw - 2 * m, h: vh - 2 * m - Math.min(40, vh * 0.04) };
  }

  buildPage(idx) {
    const page = this.pages[idx];
    const box = this.pageBox();
    const seed = hash(JSON.stringify(page).slice(0, 400)) ^ idx;
    const gutter = Math.max(10, Math.round(Math.min(box.w, box.h) * 0.017));
    const polys = layoutPanels(page.layout || 'full', page.panels.length, box.w, box.h, { gutter, seed });
    const el = h(`div.cx-page${page.tint ? '.cx-page--' + page.tint : ''}`, { style: { left: box.x + 'px', top: box.y + 'px', width: box.w + 'px', height: box.h + 'px' } });
    const frames = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    frames.setAttribute('class', 'cx-frames');
    frames.setAttribute('viewBox', `0 0 ${box.w} ${box.h}`);
    const letters = h('div.cx-letters');
    const panels = page.panels.map((pn, i) => {
      const poly = polys[i] || polys[polys.length - 1];
      const xs = poly.map((p) => p[0]), ys = poly.map((p) => p[1]);
      const bx = Math.min(...xs), by = Math.min(...ys), bw = Math.max(...xs) - bx, bh = Math.max(...ys) - by;
      const clip = `polygon(${poly.map(([x, y]) => `${n(x - bx)}px ${n(y - by)}px`).join(',')})`;
      const pel = h('div.cx-panel', { style: { left: bx + 'px', top: by + 'px', width: bw + 'px', height: bh + 'px', clipPath: clip } });
      return { def: pn, poly, box: { x: bx, y: by, w: bw, h: bh }, el: pel, art: null };
    });
    el.append(...panels.map((p) => p.el), frames, letters);
    if (page.tint) el.append(h('div.cx-tint'));
    return { el, panels, frames, letters, box, page };
  }

  gotoPage(idx) {
    this.clearTimers();
    const old = this.cur;
    this.pi = idx;
    this.cur = this.buildPage(idx);
    this.stageEl.append(this.cur.el);
    this.counter.textContent = `Page ${idx + 1} / ${this.pages.length}`;
    if (old) {
      old.el.classList.add('is-out');
      setTimeout(() => old.el.remove(), 420);
    }
    // beats: for each panel → show (with caption) then one beat per speech line
    this.beats = [];
    this.cur.panels.forEach((p, i) => {
      this.beats.push({ type: 'panel', i });
      (p.def.lines || []).forEach((ln, li) => this.beats.push({ type: 'line', i, li }));
    });
    this.bi = 0;
    if (idx === 0) this.opts.onFirstPage?.();
    this.later(() => this.runBeat(), old ? 260 : 120);
  }

  relayout() {
    if (this.dead || this.pi < 0) return;
    const shown = this.bi;
    const old = this.cur;
    this.cur = this.buildPage(this.pi);
    old.el.replaceWith(this.cur.el);
    for (let b = 0; b < shown; b++) this.execBeat(this.beats[b], { instant: true });
  }

  /* ---------------- beats ---------------- */
  async runBeat() {
    if (this.dead || this.busy) return;
    const beat = this.beats[this.bi];
    if (!beat) return this.nextPage();
    this.bi++;
    this.busy = true;
    this.rush = false;
    this.setWaiting(false);
    const text = await this.execBeat(beat, {});
    this.busy = false;
    if (this.dead || this.finishing) return;
    this.scheduleAuto(beat, text);
  }

  async execBeat(beat, { instant = false }) {
    const P = this.cur.panels[beat.i];
    if (beat.type === 'panel') {
      this.showPanel(P, beat.i, instant);
      if (P.def.caption) {
        if (!instant) await this.pause(this.cur.panels.length > 1 ? 280 : 420);
        const cap = this.caption(P);
        await this.type(cap.querySelector('.cx-typed'), P.def.caption, instant);
        return P.def.caption;
      }
      // shots that carry their own words (name cards, headlines, title cards) also wait for the reader
      return READ_SHOTS.has(P.def.shot) ? (P.def.params?.tagline || P.def.params?.headline || P.def.params?.title || ' ') : '';
    }
    const line = P.def.lines[beat.li];
    const b = this.bubble(P, line, beat.li);
    if (!instant) sfx('click');
    await this.type(b.querySelector('.cx-typed'), line.text, instant);
    return line.text;
  }

  /** Show every remaining beat of the current page at once (dev + screenshots). */
  async revealPage() {
    this.clearTimers();
    this.rush = true;
    this.typing?.finish();
    this.pauseRes?.();
    await new Promise((r) => setTimeout(r, 60));
    while (this.bi < this.beats.length) this.execBeat(this.beats[this.bi++], { instant: true });
    this.setWaiting(true);
  }

  pause(ms) {
    if (this.rush) return Promise.resolve();
    return new Promise((res) => { this.pauseRes = res; setTimeout(res, ms); });
  }

  scheduleAuto(beat, text) {
    const P = this.cur.panels[beat.i];
    const lastOfPanel = !this.beats[this.bi] || this.beats[this.bi].i !== beat.i;
    // Words wait for the reader: any beat with text (caption, speech, intro card) holds until the
    // player clicks or presses Space. Only wordless art beats flow on by themselves.
    this.setWaiting(true);
    if (text) return;
    let hold = P.def.sfx ? 1500 : 1300;
    if (lastOfPanel && P.def.hold) hold = Math.min(P.def.hold, 2500);
    this.autoT = this.later(() => this.runBeat(), hold);
  }

  setWaiting(on) { this.nextHint.classList.toggle('is-on', on); }

  advance() {
    if (this.dead || this.finishing || this.pi < 0) return;
    if (this.busy) {
      // first press finishes what is being lettered; it doesn't skip content
      this.rush = true;
      this.typing?.finish();
      this.pauseRes?.();
      return;
    }
    this.clearTimers();
    this.runBeat();
  }

  nextPage() {
    if (this.pi + 1 >= this.pages.length) return this.finish();
    sfx('whoosh');
    this.gotoPage(this.pi + 1);
  }

  skip() {
    if (this.finishing) return;
    sfx('whoosh');
    this.finish();
  }

  finish() {
    if (this.finishing) return;
    this.finishing = true;
    this.clearTimers();
    clearInterval(this.typing?.iv);
    this.typing = null;
    duck(1);
    this.opts.onDone?.();
  }

  /* ---------------- panel ---------------- */
  showPanel(P, i, instant) {
    const d = P.def;
    const res = renderShot(d.shot, d.params || {}, { w: P.box.w, h: P.box.h, seed: `${d.shot}|${JSON.stringify(d.params || {})}|${this.pi}|${i}` });
    P.art = res;
    res.el.classList.add('cx-drift');
    const rr = (hash(d.shot + i) % 100) / 100;
    res.el.style.setProperty('--drift-x', `${(rr - 0.5) * 3}%`);
    res.el.style.setProperty('--drift-y', `${(0.5 - rr) * 1.6}%`);
    res.el.style.setProperty('--drift-s', `${1.035 + rr * 0.03}`);
    P.el.append(res.el);
    P.el.classList.add('is-on');
    // frame keyline + misregistered plate
    const pts = P.poly.map((p) => `${n(p[0])},${n(p[1])}`).join(' ');
    const ns = 'http://www.w3.org/2000/svg';
    const plate = document.createElementNS(ns, 'polygon');
    plate.setAttribute('points', pts);
    plate.setAttribute('class', 'cx-frame cx-frame--plate');
    const key = document.createElementNS(ns, 'polygon');
    key.setAttribute('points', pts);
    key.setAttribute('class', 'cx-frame');
    this.cur.frames.append(plate, key);
    if (!instant && !reducedMotion()) {
      const rot = ((hash(d.shot + this.pi + i) % 7) - 3) * 0.6;
      const [cx, cy] = centroid(P.poly);
      P.el.style.transformOrigin = `${n(cx - P.box.x)}px ${n(cy - P.box.y)}px`;
      P.el.animate([
        { transform: `scale(1.14) rotate(${rot}deg)`, filter: 'brightness(2.2)', opacity: 0 },
        { transform: `scale(0.985) rotate(${-rot * 0.2}deg)`, filter: 'brightness(1.2)', opacity: 1, offset: 0.55 },
        { transform: 'scale(1) rotate(0deg)', filter: 'brightness(1)', opacity: 1 },
      ], { duration: 340, easing: 'cubic-bezier(.2,.9,.3,1)' });
      [key, plate].forEach((f) => f.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 120, delay: 60, fill: 'backwards' }));
      this.cur.el.animate([{ transform: 'translate(0,0)' }, { transform: 'translate(2px,-3px)' }, { transform: 'translate(-2px,2px)' }, { transform: 'translate(0,0)' }], { duration: 180, easing: 'steps(3)' });
      sfx(i === 0 || d.sfx ? 'slam' : 'whoosh');
    }
    duck(HEAVY.has(d.shot) || d.sfx ? 0.35 : 1);
    if (d.sfx) this.sfxWord(P, d.sfx, instant);
  }

  /** Free space for lettering inside a panel, in page px. */
  space(P) {
    const s = P.art?.space || [0.04, 0.04, 0.96, 0.34];
    const pad = Math.max(14, P.box.w * 0.025);
    return {
      x0: P.box.x + Math.max(pad, s[0] * P.box.w), y0: P.box.y + Math.max(pad, s[1] * P.box.h),
      x1: P.box.x + Math.min(P.box.w - pad, s[2] * P.box.w), y1: P.box.y + Math.min(P.box.h - pad, s[3] * P.box.h),
    };
  }

  /** Safe lettering area of a panel (bbox inset so slanted edges never clip text). */
  bounds(P) {
    const pad = Math.max(14, Math.min(P.box.w, P.box.h) * 0.035);
    const slant = P.box.h * 0.045;
    return { x0: P.box.x + pad + slant, y0: P.box.y + pad, x1: P.box.x + P.box.w - pad - slant, y1: P.box.y + P.box.h - pad };
  }

  /** Shrink an element's type (never below 14px) until it fits the panel's safe area. */
  fitType(el, B) {
    let fs = parseFloat(getComputedStyle(el).fontSize);
    let guard = 12;
    while (guard-- > 0 && fs > 14 && (el.offsetHeight > (B.y1 - B.y0) * 0.9 || el.offsetWidth > B.x1 - B.x0)) {
      fs = Math.max(14, fs - 1);
      el.style.fontSize = fs + 'px';
    }
  }

  /** Pick the first candidate spot that stays inside the panel and clears everything placed so far. */
  placeRect(P, w, h, cands) {
    const B = this.bounds(P);
    P.placed = P.placed || [];
    let best = null;
    for (const c of cands) {
      const x = Math.max(B.x0, Math.min(c[0], B.x1 - w)), y = Math.max(B.y0, Math.min(c[1], B.y1 - h));
      let ov = 0;
      for (const q of P.placed) {
        const ox = Math.min(x + w, q.x + q.w) - Math.max(x, q.x), oy = Math.min(y + h, q.y + q.h) - Math.max(y, q.y);
        if (ox > 0 && oy > 0) ov += ox * oy;
      }
      if (c[2]) ov += c[2]; // soft penalty (e.g. covering the speaker's face)
      if (!best || ov < best.ov) best = { x, y, ov };
      if (ov === 0) break;
    }
    P.placed.push({ x: best.x, y: best.y, w, h: h + 10 });
    return best;
  }

  caption(P) {
    const sp = this.space(P), B = this.bounds(P);
    const el = h('div.cx-caption', h('span.cx-typed'));
    el.style.maxWidth = Math.min(B.x1 - B.x0, Math.max(240, Math.min(sp.x1 - sp.x0, 480))) + 'px';
    el.style.setProperty('--rot', `${((hash(P.def.caption) % 5) - 2) * 0.4}deg`);
    el.style.visibility = 'hidden';
    this.cur.letters.append(el);
    const t = el.querySelector('.cx-typed');
    t.textContent = P.def.caption;
    this.fitType(el, B);
    const w = el.offsetWidth, hh = el.offsetHeight;
    const pos = this.placeRect(P, w, hh, [[sp.x0, sp.y0], [sp.x0, sp.y1 - hh], [B.x0, B.y0], [B.x1 - w, B.y0], [B.x0, B.y1 - hh], [B.x1 - w, B.y1 - hh]]);
    el.style.left = pos.x + 'px';
    el.style.top = pos.y + 'px';
    el.style.visibility = '';
    t.textContent = '';
    return el;
  }

  bubble(P, line, li) {
    const who = line.who;
    const crew = CREW[who];
    const sp = this.space(P), B = this.bounds(P);
    const anchorN = P.art?.anchors?.[who] || null;
    const onPanel = !!anchorN;
    const maxW = Math.min(380, Math.max(200, sp.x1 - sp.x0), B.x1 - B.x0);
    const tag = h('span.cx-bubble__tag', crew?.short || who || '');
    const el = h(`div.cx-bubble${onPanel ? '' : '.cx-bubble--off'}`, h('span.cx-typed'), tag);
    if (!onPanel && who) tag.prepend(portrait(who, { mood: 'calm', size: 34 }));
    el.style.maxWidth = maxW + 'px';
    el.style.visibility = 'hidden';
    this.cur.letters.append(el);
    const typed = el.querySelector('.cx-typed');
    typed.textContent = line.text;
    this.fitType(el, B);
    const bw = el.offsetWidth, bh = el.offsetHeight;
    const ax = onPanel ? P.box.x + anchorN[0] * P.box.w : null, ay = onPanel ? P.box.y + anchorN[1] * P.box.h : null;
    const last = P.placed?.[P.placed.length - 1];
    const below = last ? last.y + last.h + 6 : sp.y0;
    const cands = [];
    if (onPanel) {
      const nearX = ax - bw * 0.62;
      cands.push([nearX, Math.min(below, ay - bh - 34)], [nearX, ay - bh - 34], [ax + 30, ay - bh - 20], [ax - bw - 30, ay - bh - 20]);
    }
    cands.push([sp.x0 + li * 18, below], [sp.x0, sp.y0], [sp.x1 - bw, sp.y0], [sp.x0, sp.y1 - bh], [sp.x1 - bw, sp.y1 - bh],
      [B.x0, B.y0], [B.x1 - bw, B.y0], [B.x0, B.y1 - bh], [B.x1 - bw, B.y1 - bh], [(B.x0 + B.x1 - bw) / 2, B.y0], [(B.x0 + B.x1 - bw) / 2, B.y1 - bh]);
    // don't sit on the speaker's mouth: penalise candidates covering the anchor
    const scored = cands.map(([x, y]) => {
      const cx = Math.max(B.x0, Math.min(x, B.x1 - bw)), cy = Math.max(B.y0, Math.min(y, B.y1 - bh));
      const covers = onPanel && ax > cx - 10 && ax < cx + bw + 10 && ay > cy - 10 && ay < cy + bh + 10;
      return [x, y, covers ? bw * bh * 0.6 : 0];
    });
    const pos = this.placeRect(P, bw, bh, scored);
    const x = pos.x, y = pos.y;
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    el.prepend(this.balloonSvg(bw, bh, onPanel ? [ax - x, ay - y] : null, who));
    el.style.visibility = '';
    typed.textContent = '';
    return el;
  }

  /** Balloon + tail as one inked shape (stroke pass, then fill pass, so the outline merges). */
  balloonSvg(w, hgt, tip, who) {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('class', 'cx-bubble__shape');
    svg.setAttribute('width', w);
    svg.setAttribute('height', hgt);
    svg.setAttribute('viewBox', `0 0 ${w} ${hgt}`);
    // superellipse-ish balloon slightly larger than the text box
    const cx = w / 2, cy = hgt / 2, a = w / 2 + 6, b = hgt / 2 + 5, ex = 2.6;
    let d = '';
    const seed = hash(who + w);
    for (let i = 0; i <= 48; i++) {
      const t = (i / 48) * Math.PI * 2, c = Math.cos(t), s = Math.sin(t);
      const wob = 1 + (((seed >> (i % 16)) & 3) - 1.5) * 0.004;
      const x = cx + a * wob * Math.sign(c) * Math.pow(Math.abs(c), 2 / ex), y = cy + b * wob * Math.sign(s) * Math.pow(Math.abs(s), 2 / ex);
      d += (i ? 'L' : 'M') + n(x) + ',' + n(y);
    }
    d += 'Z';
    let tail = '';
    let tx, ty;
    if (tip) {
      const dx = tip[0] - cx, dy = tip[1] - cy;
      const dist = Math.hypot(dx, dy) || 1;
      const edge = Math.abs(dx / dist) * a + Math.abs(dy / dist) * b;
      const len = Math.min(Math.max(dist - edge - 46, 16), 70);
      const ux = dx / dist, uy = dy / dist;
      tx = cx + ux * (edge + len);
      ty = cy + uy * (edge + len);
    } else {
      tx = cx - a * 0.5 - 28; ty = hgt + 30;
    }
    // tail: a curved wedge whose base straddles the balloon edge, perpendicular to its direction
    const ddx = tx - cx, ddy = ty - cy, dl = Math.hypot(ddx, ddy) || 1;
    const ux = ddx / dl, uy = ddy / dl, px = -uy, py = ux;
    const inset = (Math.abs(ux) * a + Math.abs(uy) * b) * 0.72;
    const bx = cx + ux * inset, by = cy + uy * inset;
    const wBase = Math.min(30, Math.max(16, Math.min(w, hgt) * 0.34));
    const bend = 0.18 * Math.min(dl, 140) * (ux > 0 ? 1 : -1);
    const mx = (bx + tx) / 2 + px * bend, my = (by + ty) / 2 + py * bend;
    tail = `M${n(bx + px * wBase / 2)},${n(by + py * wBase / 2)}Q${n(mx + px * wBase * 0.18)},${n(my + py * wBase * 0.18)} ${n(tx)},${n(ty)}Q${n(mx - px * wBase * 0.3)},${n(my - py * wBase * 0.3)} ${n(bx - px * wBase / 2)},${n(by - py * wBase / 2)}Z`;
    svg.innerHTML = `<g class="cx-ink"><path d="${d}"/><path d="${tail}"/></g><g class="cx-paper"><path d="${d}"/><path d="${tail}"/></g>`;
    return svg;
  }

  sfxWord(P, word, instant) {
    const at = P.art?.sfxAt || [0.7, 0.3];
    const size = Math.max(40, Math.min(P.box.h * 0.3, P.box.w * 0.22, 190));
    const el = h('div.cx-sfx', { 'data-text': word }, word);
    el.style.left = P.box.x + at[0] * P.box.w + 'px';
    el.style.top = P.box.y + at[1] * P.box.h + 'px';
    el.style.fontSize = size + 'px';
    el.style.setProperty('--rot', `${((hash(word) % 13) - 6) * 1.5}deg`);
    this.cur.letters.append(el);
    // reserve the word's footprint so captions and bubbles are placed clear of it
    const sw = String(word).length * size * 0.56, sx = P.box.x + at[0] * P.box.w - sw / 2, sy = P.box.y + at[1] * P.box.h - size * 0.55;
    (P.placed = P.placed || []).push({ x: sx, y: sy, w: sw, h: size * 1.1 });
    if (instant) el.classList.add('is-static');
    else {
      const up = String(word).toUpperCase();
      const snd = SFX_SOUND.find(([re]) => re.test(up));
      this.later(() => sfx(snd ? snd[1] : 'slam'), 60);
    }
  }

  /* ---------------- typewriter ---------------- */
  type(el, text, instant) {
    const on = S.settings().typewriter && !instant && !this.rush && !reducedMotion();
    if (!on) { el.textContent = text; return Promise.resolve(); }
    const chars = [...String(text)];
    el.textContent = '';
    const spans = chars.map((c) => { const s = document.createElement('span'); s.textContent = c; s.className = 'cx-ch'; el.append(s); return s; });
    return new Promise((res) => {
      let i = 0;
      const done = () => { clearInterval(job.iv); spans.forEach((s) => s.classList.add('is-on')); if (this.typing === job) this.typing = null; res(); };
      const job = {
        iv: setInterval(() => {
          if (this.dead) return done();
          for (let k = 0; k < 2 && i < spans.length; k++, i++) spans[i].classList.add('is-on');
          if (i % 4 === 0) sfx('type');
          if (i >= spans.length) done();
        }, 32),
        finish: done,
      };
      this.typing = job;
    });
  }

  /* ---------------- skip prop ---------------- */
  skipProp() {
    const el = h('button.cx-skip', { type: 'button', title: 'Hold to skip (Esc)' },
      h('span.cx-skip__book',
        h('span.cx-skip__strike'),
        h('span.cx-skip__label', h('b', 'Hold'), ' to skip'),
        h('span.cx-skip__match', h('i.cx-skip__fuse'), h('i.cx-skip__head'))),
      h('kbd', 'Esc'));
    let t = null;
    const start = (e) => {
      e.preventDefault(); e.stopPropagation();
      el.classList.add('is-holding');
      sfx('hover');
      t = setTimeout(() => { el.classList.add('is-lit'); this.skip(); }, 750);
    };
    const stop = () => { clearTimeout(t); el.classList.remove('is-holding'); };
    el.addEventListener('pointerdown', start);
    el.addEventListener('pointerup', stop);
    el.addEventListener('pointerleave', stop);
    el.addEventListener('click', (e) => e.stopPropagation());
    return el;
  }
}
