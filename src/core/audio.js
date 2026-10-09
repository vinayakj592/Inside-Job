// All sound is synthesised with WebAudio: no audio files. See docs/DESIGN.md §5.3.
import { settings } from './state.js';
import { on } from './bus.js';

let ctx = null;
let master, sfxBus, ambBus, musicBus;
let noiseBuf = null;

function ac() {
  if (!ctx) {
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch {
      return null;
    }
    master = ctx.createGain();
    master.gain.value = 0.9;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -8;
    comp.ratio.value = 2;
    comp.knee.value = 12;
    comp.attack.value = 0.02;
    comp.release.value = 0.4;
    master.connect(comp).connect(ctx.destination);
    sfxBus = gain(0.8, master);
    ambBus = gain(0.0, master);
    musicBus = gain(0.0, master);
    noiseBuf = makeNoise(2);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

/** Call from the first user gesture so audio can start. */
export function unlock() {
  const c = ac();
  if (!c) return;
  if (pendingAmbience !== undefined) ambience(pendingAmbience);
  if (settings().music && !musicTimer) music(true);
}
addEventListener('pointerdown', unlock, { once: true, capture: true });
addEventListener('keydown', unlock, { once: true, capture: true });

function gain(v, dest) {
  const g = ctx.createGain();
  g.gain.value = v;
  if (dest) g.connect(dest);
  return g;
}
function makeNoise(seconds) {
  const b = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return b;
}
function env(g, t, a, peak, d, sus = 0.0001) {
  g.gain.cancelScheduledValues(t);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + a);
  g.gain.exponentialRampToValueAtTime(Math.max(sus, 0.0001), t + a + d);
}
function tone({ f = 440, to = null, type = 'sine', t = 0, a = 0.005, d = 0.2, v = 0.3, dest = sfxBus, filter = null }) {
  const c = ctx, now = c.currentTime + t;
  const o = c.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(f, now);
  if (to) o.frequency.exponentialRampToValueAtTime(to, now + a + d);
  const g = c.createGain();
  env(g, now, a, v, d);
  let node = o;
  if (filter) {
    const bq = c.createBiquadFilter();
    bq.type = filter.type || 'lowpass';
    bq.frequency.value = filter.f;
    bq.Q.value = filter.q || 0.7;
    node.connect(bq);
    node = bq;
  }
  node.connect(g).connect(dest);
  o.start(now);
  o.stop(now + a + d + 0.05);
}
function burst({ t = 0, d = 0.2, v = 0.3, type = 'bandpass', f = 1200, to = null, q = 1, dest = sfxBus, a = 0.003 }) {
  const c = ctx, now = c.currentTime + t;
  const s = c.createBufferSource();
  s.buffer = noiseBuf;
  const bq = c.createBiquadFilter();
  bq.type = type;
  bq.frequency.setValueAtTime(f, now);
  if (to) bq.frequency.exponentialRampToValueAtTime(to, now + d);
  bq.Q.value = q;
  const g = c.createGain();
  env(g, now, a, v, d);
  s.connect(bq).connect(g).connect(dest);
  s.start(now, Math.random() * 1.5);
  s.stop(now + a + d + 0.05);
}

const SFX = {
  click: () => { tone({ f: 1800, to: 900, type: 'square', d: 0.03, v: 0.05, filter: { f: 3000 } }); },
  hover: () => { tone({ f: 2400, type: 'sine', d: 0.025, v: 0.025 }); },
  type: () => { burst({ f: 3000 + Math.random() * 1500, d: 0.018, v: 0.07, q: 4 }); },
  run: () => {
    tone({ f: 180, to: 90, type: 'square', d: 0.12, v: 0.1, filter: { f: 900 } });
    burst({ f: 5000, to: 1500, d: 0.18, v: 0.08, q: 2 });
  },
  ok: () => {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone({ f, type: 'triangle', t: i * 0.06, d: 0.5, v: 0.13 }));
  },
  bad: () => {
    tone({ f: 220, to: 150, type: 'sawtooth', d: 0.22, v: 0.09, filter: { f: 700 } });
    tone({ f: 233, to: 155, type: 'sawtooth', t: 0.01, d: 0.22, v: 0.07, filter: { f: 700 } });
  },
  err: () => {
    tone({ f: 110, type: 'square', d: 0.08, v: 0.1, filter: { f: 500 } });
    tone({ f: 110, type: 'square', t: 0.12, d: 0.08, v: 0.1, filter: { f: 500 } });
  },
  reveal: () => {
    tone({ f: 880, to: 1760, type: 'sine', d: 0.35, v: 0.06 });
    burst({ type: 'highpass', f: 6000, d: 0.5, v: 0.04 });
  },
  stamp: () => {
    tone({ f: 90, to: 40, type: 'sine', d: 0.18, v: 0.5 });
    burst({ type: 'lowpass', f: 900, d: 0.12, v: 0.4 });
  },
  whoosh: () => { burst({ f: 300, to: 3000, d: 0.35, v: 0.18, q: 0.8, a: 0.12 }); },
  slam: () => {
    tone({ f: 70, to: 30, type: 'sine', d: 0.35, v: 0.7 });
    burst({ type: 'lowpass', f: 1400, to: 200, d: 0.25, v: 0.5 });
  },
  alarm: () => {
    for (let i = 0; i < 4; i++) {
      tone({ f: 740, type: 'square', t: i * 0.36, d: 0.16, v: 0.07, filter: { f: 2000 } });
      tone({ f: 587, type: 'square', t: i * 0.36 + 0.18, d: 0.16, v: 0.07, filter: { f: 2000 } });
    }
  },
  cash: () => {
    burst({ type: 'highpass', f: 4000, d: 0.06, v: 0.12 });
    [1318.5, 1760, 2637].forEach((f, i) => tone({ f, type: 'triangle', t: 0.05 + i * 0.07, d: 0.35, v: 0.08 }));
  },
  lock: () => { burst({ f: 2500, d: 0.03, v: 0.2, q: 6 }); tone({ f: 300, type: 'square', t: 0.03, d: 0.04, v: 0.05, filter: { f: 1200 } }); },
  unlock: () => {
    burst({ f: 2200, d: 0.03, v: 0.2, q: 6 });
    burst({ f: 1600, t: 0.09, d: 0.05, v: 0.25, q: 5 });
    tone({ f: 120, to: 60, t: 0.09, d: 0.15, v: 0.25 });
  },
  'rain-drop': () => { tone({ f: 2400 + Math.random() * 1600, d: 0.02, v: 0.02 }); },
  thunder: () => thunder(),
  siren: () => {
    const c = ctx, now = c.currentTime;
    const o = c.createOscillator();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(600, now);
    for (let i = 0; i < 4; i++) {
      o.frequency.linearRampToValueAtTime(950, now + i * 0.6 + 0.3);
      o.frequency.linearRampToValueAtTime(600, now + i * 0.6 + 0.6);
    }
    const bq = c.createBiquadFilter();
    bq.type = 'lowpass';
    bq.frequency.value = 1400;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.06, now + 0.3);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 2.4);
    o.connect(bq).connect(g).connect(sfxBus);
    o.start(now);
    o.stop(now + 2.5);
  },
};

let lastType = 0;
export function sfx(name) {
  if (!settings().sound) return;
  if (!ac()) return;
  if (name === 'type') {
    const t = performance.now();
    if (t - lastType < 30) return;
    lastType = t;
  }
  try { SFX[name]?.(); } catch (e) { console.warn('[audio]', e); }
}

/* ---------------- ambience: recorded rain ----------------
   Field recordings (see public/audio/CREDITS.md), not synthesis: synthesised rain sounds like
   static or boiling water. Each loop has its seam crossfaded, so it repeats without a click.
     rain       home + hub: a real shower on a city street
     noir       cinematics: the same street, a little darker and further away
     blueprint  planning table: rain lashing a window, muffled, quiet */
const AUDIO_BASE = `${import.meta.env.BASE_URL}audio/`;
const SAMPLES = {
  street: 'rain-street.mp3',
  window: 'rain-window.mp3',
  thunder1: 'thunder-1.mp3',
  thunder2: 'thunder-2.mp3',
};
const raw = {};     // name → Promise<ArrayBuffer> (fetched early, before the first gesture)
const decoded = {}; // name → Promise<AudioBuffer>
Object.entries(SAMPLES).forEach(([k, file]) => {
  raw[k] = fetch(AUDIO_BASE + file).then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(file)))).catch((e) => { console.warn('[audio] missing', e.message); return null; });
});
function sample(name) {
  if (!decoded[name]) {
    decoded[name] = raw[name].then((ab) => (ab ? new Promise((res) => ctx.decodeAudioData(ab.slice(0), res, () => res(null))) : null));
  }
  return decoded[name];
}

let ambNodes = [];
let ambName = null;
let pendingAmbience; // requested before the first gesture
let ambToken = 0;
let brownBuf = null;

function makeBrownBuffer(seconds = 10) {
  const sr = ctx.sampleRate, len = Math.floor(sr * seconds);
  const buf = ctx.createBuffer(1, len, sr);
  const d = buf.getChannelData(0);
  let b = 0;
  for (let i = 0; i < len; i++) { b = (b + 0.02 * (Math.random() * 2 - 1)) / 1.02; d[i] = b * 3.2; }
  return buf;
}

function filter(type, f, q = 0.7) {
  const b = ctx.createBiquadFilter();
  b.type = type; b.frequency.value = f; b.Q.value = q;
  return b;
}

/** Start a looping sample into `dest`. mp3 decoders pad the start/end, so loop just inside those edges. */
function loopSample(buffer, dest, { offset = 0, rate = 1 } = {}) {
  const s = ctx.createBufferSource();
  s.buffer = buffer;
  s.loop = true;
  s.loopStart = 0.06;
  s.loopEnd = buffer.duration - 0.06;
  s.playbackRate.value = rate;
  s.connect(dest);
  s.start(ctx.currentTime, 0.06 + (offset % (buffer.duration - 0.2)));
  ambNodes.push(s);
  return dest; // callers keep chaining from the end of the filter
}

/** Slow swell on a layer's gain, like gusts moving the rain around. */
function gust(param, depth, rate = 0.05) {
  const o = ctx.createOscillator();
  o.frequency.value = rate * (0.8 + Math.random() * 0.4);
  const g = gain(depth);
  o.connect(g).connect(param);
  o.start();
  ambNodes.push(o);
}

export function ambience(name) {
  pendingAmbience = name;
  if (!ctx) return;
  if (name === ambName) return;
  ambName = name;
  const token = ++ambToken;
  const now = ctx.currentTime;
  const old = ambNodes;
  ambNodes = [];
  const oldBus = ambBus;
  oldBus.gain.setTargetAtTime(0.0001, now, 0.5);
  setTimeout(() => { old.forEach((n) => { try { n.stop?.(); n.disconnect(); } catch { /* ignore */ } }); oldBus.disconnect(); }, 2500);
  ambBus = gain(0.0001, master);
  if (!name || !settings().sound) return;
  const bus = ambBus;

  const which = name === 'blueprint' ? 'window' : 'street';
  sample(which).then((buf) => {
    if (!buf || token !== ambToken) return; // a newer ambience took over while decoding
    const t = ctx.currentTime;
    if (name === 'rain') {
      // the street, close and full, with a second pass offset in time for density and width
      const main = gain(0.85);
      loopSample(buf, filter('highpass', 60)).connect(main).connect(bus);
      gust(main.gain, 0.08, 0.04);
      const far = gain(0.3);
      loopSample(buf, filter('lowpass', 1800), { offset: 29 }).connect(far).connect(bus);
      gust(far.gain, 0.1, 0.027);
      bus.gain.setTargetAtTime(0.9, t, 1.4);
    } else if (name === 'noir') {
      // cinematics: the same rain, darker and a step back so dialogue sits on top
      const main = gain(0.8);
      loopSample(buf, filter('lowpass', 5200), { offset: 12 }).connect(main).connect(bus);
      gust(main.gain, 0.08, 0.035);
      bus.gain.setTargetAtTime(0.7, t, 1.2);
    } else {
      // the safehouse: rain on the window pane, muffled by the glass, well under the room
      const pane = gain(0.8);
      loopSample(buf, filter('lowpass', 3200)).connect(filter('highpass', 90)).connect(pane).connect(bus);
      gust(pane.gain, 0.08, 0.03);
      bus.gain.setTargetAtTime(0.45, t, 1.6);
    }
  });
}

/** Thunder: a real recorded roll when available, a synthesised rumble otherwise. */
function thunder() {
  const pick = Math.random() < 0.5 ? 'thunder1' : 'thunder2';
  sample(pick).then((buf) => {
    const c = ctx, now = c.currentTime;
    if (buf) {
      const s = c.createBufferSource();
      s.buffer = buf;
      s.playbackRate.value = 0.92 + Math.random() * 0.16; // no two rolls identical
      const g = gain(0.75 + Math.random() * 0.25);
      s.connect(g).connect(sfxBus);
      s.start(now);
      return;
    }
    if (!brownBuf) brownBuf = makeBrownBuffer();
    const len = 4.5;
    const s = c.createBufferSource();
    s.buffer = brownBuf;
    const lp = filter('lowpass', 300);
    lp.frequency.exponentialRampToValueAtTime(90, now + len);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.7, now + 0.3);
    g.gain.exponentialRampToValueAtTime(0.0001, now + len);
    s.connect(lp).connect(g).connect(sfxBus);
    s.start(now, Math.random() * 4);
    s.stop(now + len + 0.1);
  });
}

/* ---------------- music: slow noir walking bass, brushes, rhodes ---------------- */
let musicOn = false;
let musicTimer = null;
let beat = 0;
let nextTime = 0;
const BPM = 76;
// Dm9 | Bbmaj7 | Gm9 | A7b9, bass roots + walking notes (Hz)
const BASS = [
  [73.42, 87.31, 110.0, 103.83], [58.27, 69.3, 87.31, 82.41],
  [49.0, 58.27, 73.42, 69.3], [55.0, 69.3, 82.41, 77.78],
];
const CHORDS = [
  [293.66, 349.23, 440.0, 523.25, 659.25], [233.08, 293.66, 349.23, 440.0],
  [196.0, 233.08, 293.66, 349.23, 440.0], [220.0, 277.18, 329.63, 392.0, 466.16],
];

function scheduleMusic() {
  const c = ctx;
  const spb = 60 / BPM;
  while (nextTime < c.currentTime + 0.4) {
    const bar = Math.floor(beat / 4) % 4;
    const b = beat % 4;
    // walking bass
    tone({ f: BASS[bar][b], type: 'triangle', t: nextTime - c.currentTime, a: 0.01, d: spb * 0.9, v: 0.22, dest: musicBus, filter: { f: 420 } });
    // brushes: swish on 2 and 4, tap on the swung and-of
    if (b === 1 || b === 3) burst({ t: nextTime - c.currentTime, f: 3200, d: 0.22, v: 0.05, q: 0.6, a: 0.05, dest: musicBus });
    burst({ t: nextTime - c.currentTime + spb * 0.66, f: 5000, d: 0.05, v: 0.025, q: 1, dest: musicBus });
    // rhodes chord on beat 1 (and a ghost on 3 every other bar)
    if (b === 0 || (b === 2 && bar % 2 === 1)) {
      CHORDS[bar].forEach((f, i) => tone({ f, type: 'sine', t: nextTime - c.currentTime + i * 0.012, a: 0.02, d: spb * 3, v: b === 0 ? 0.035 : 0.02, dest: musicBus }));
    }
    nextTime += spb;
    beat++;
  }
}

export function music(on) {
  musicOn = on;
  if (!ctx) return;
  const now = ctx.currentTime;
  if (on && settings().sound) {
    musicBus.gain.setTargetAtTime(0.55, now, 1.2);
    if (!musicTimer) {
      nextTime = ctx.currentTime + 0.1;
      musicTimer = setInterval(scheduleMusic, 100);
    }
  } else {
    musicBus.gain.setTargetAtTime(0.0001, now, 0.6);
    clearInterval(musicTimer);
    musicTimer = null;
  }
}

/** Duck music (e.g. during cinematics with heavy sfx). 0..1 */
export function duck(level = 0.35) {
  if (!ctx || !musicOn) return;
  musicBus.gain.setTargetAtTime(0.55 * level, ctx.currentTime, 0.3);
}

on('settings', ({ key, value }) => {
  if (key === 'music') music(value);
  if (key === 'sound') {
    if (!value) { music(false); const n = ambName; ambName = '__off'; ambience(null); pendingAmbience = n; }
    else { ambName = null; ambience(pendingAmbience); if (settings().music) music(true); }
  }
});

// Dev-only handle for automated audio checks (stripped from production builds).
if (import.meta.env.DEV) window.__ijAudio = { get ctx() { return ctx; }, get master() { return master; }, get ambience() { return ambName; } };
