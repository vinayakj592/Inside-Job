// Shot library registry + renderer. Every name in docs/DESIGN.md §6.5 maps to a procedural illustration.
//   renderShot(name, params, { w, h }) → { el: HTMLElement (.cx-art), anchors, space, sfxAt, focus }
// anchors: { [who]: [x, y] } normalised 0..1 (where speech-bubble tails point).
// space:   [x0, y0, x1, y1] normalised free area for captions/bubbles (negative space in the composition).
import { makeCtx, C } from '../kit.js';
import { n } from '../svg.js';
import * as city from './city.js';
import * as inside from './inside.js';
import * as close from './close.js';
import * as people from './people.js';

export const SHOTS = {
  'city-establish': city.cityEstablish,
  'street-rain': city.streetRain,
  'car-interior': people.carInterior,
  'car-chase': city.carChase,
  rooftop: city.rooftop,
  face: people.face,
  'two-shot': people.twoShot,
  'crew-table': inside.crewTable,
  'blueprint-closeup': close.blueprintCloseup,
  'hands-typing': close.handsTyping,
  'cctv-monitor': close.cctvMonitor,
  'corridor-camera': inside.corridorCamera,
  'laser-hall': inside.laserHall,
  'guard-patrol': inside.guardPatrol,
  'vent-crawl': inside.ventCrawl,
  'door-keypad': close.doorKeypad,
  'safe-dial': close.safeDial,
  'vault-door': inside.vaultDoor,
  loot: close.loot,
  clock: close.clock,
  phone: people.phone,
  'gala-crowd': inside.galaCrowd,
  alarm: inside.alarm,
  'police-lights': city.policeLights,
  getaway: city.getaway,
  newspaper: close.newspaper,
  'title-card': people.titleCard,
  'silhouette-reveal': people.silhouetteReveal,
  'character-intro': people.characterIntro,
};
export const SHOT_NAMES = Object.keys(SHOTS);

/** Unit height of every panel's drawing space; width follows the panel aspect. */
const UNIT_H = 600;

export function renderShot(name, params = {}, { w = 1600, h = 900, seed } = {}) {
  const aspect = Math.max(0.3, Math.min(5, w / h));
  const H = UNIT_H, W = UNIT_H * aspect;
  const ctx = makeCtx(W, H, params || {}, seed ?? `${name}|${JSON.stringify(params || {})}|${Math.round(aspect * 10)}`);
  const fn = SHOTS[name] || SHOTS['street-rain'];
  let res;
  try {
    res = fn(ctx);
  } catch (e) {
    console.error(`[cinema] shot "${name}" failed`, e);
    res = { svg: `<rect width="${n(W)}" height="${n(H)}" fill="${C.ink2}"/>` };
  }
  if (typeof res === 'string') res = { svg: res };
  const el = document.createElement('div');
  el.className = `cx-art cx-art--${name}`;
  el.innerHTML = `<svg class="cx-svg" viewBox="0 0 ${n(W)} ${n(H)}" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg"><defs>${ctx.defs.join('')}</defs><g class="cx-scene">${res.svg}</g></svg>`;
  if (res.rain) el.append(rainLayer(res.rain));
  const norm = (pt) => (pt ? [pt[0] / W, pt[1] / H] : null);
  const anchors = {};
  for (const k in res.anchors || {}) if (res.anchors[k]) anchors[k] = norm(res.anchors[k]);
  return { el, anchors, space: res.space || null, sfxAt: res.sfxAt || null, focus: res.focus || [0.5, 0.5], W, H };
}

/** Animated rain: two tiled streak layers translated on twos (compositor-only). */
function rainLayer({ density = 1, angle = 10, color = '#86c2b8' } = {}) {
  const wrap = document.createElement('div');
  wrap.className = 'cx-rain';
  wrap.style.setProperty('--rain-angle', `${angle}deg`);
  wrap.style.setProperty('--rain-o', String(Math.min(1, 0.35 + density * 0.4)));
  for (const k of ['near', 'far']) {
    const L = document.createElement('i');
    L.className = `cx-rain__${k}`;
    wrap.append(L);
  }
  return wrap;
}
