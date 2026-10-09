// Shared helpers for the noir city: seeded RNG, easing, palette read from CSS tokens.
import * as THREE from 'three';

/** Deterministic PRNG so the city is the same every visit. */
export function rng(seed = 1) {
  let a = seed >>> 0;
  const r = () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  r.range = (lo, hi) => lo + r() * (hi - lo);
  r.int = (lo, hi) => Math.floor(lo + r() * (hi - lo + 1));
  r.pick = (arr) => arr[Math.floor(r() * arr.length)];
  r.chance = (p) => r() < p;
  return r;
}

export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const smooth = (t) => t * t * (3 - 2 * t);
export const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const easeOut = (t) => 1 - Math.pow(1 - t, 3);
export const easeInOutQuint = (t) => (t < 0.5 ? 16 * t ** 5 : 1 - Math.pow(-2 * t + 2, 5) / 2);

/** Palette: read from the CSS design tokens so WebGL never drifts from the UI. */
const FALLBACK = {
  ink: '#07090b', 'ink-2': '#0d1316', 'ink-3': '#141d21', 'ink-4': '#1f2b30',
  'teal-9': '#031417', 'teal-8': '#061f23', 'teal-7': '#0a2b30', 'teal-6': '#0d3a40', 'teal-5': '#114a51',
  'teal-4': '#176068', 'teal-3': '#20787d', 'teal-2': '#3b9391', 'teal-1': '#86c2b8',
  gold: '#f2a93b', 'gold-hot': '#ffcf5a', 'gold-deep': '#a8661a',
  cream: '#ece2c9', 'cream-dim': '#9d927c', manila: '#d6b476', alarm: '#d8412f',
};
let PAL = null;
export function palette() {
  if (PAL) return PAL;
  const cs = typeof getComputedStyle === 'function' ? getComputedStyle(document.documentElement) : null;
  PAL = {};
  for (const [k, fb] of Object.entries(FALLBACK)) {
    const v = cs?.getPropertyValue('--' + k).trim();
    PAL[k] = v && v.startsWith('#') ? v : fb;
  }
  return PAL;
}
/** THREE.Color (linear working space) of a token. */
export const col = (token) => new THREE.Color(palette()[token] || token);
/** Mix two tokens → THREE.Color */
export const mixCol = (a, b, t) => col(a).lerp(col(b), t);

/** A police blue for the siren sweep only. Not a design token on purpose: it only exists when Heat > 70. */
export const SIREN_BLUE = '#2b5fd9';
