// Canvas-generated textures: tileable noise for mist, neon/painted signs.
import * as THREE from 'three';
import { palette } from './util.js';

/** Tileable value-noise fbm, 256². */
export function noiseTexture(size = 256, seed = 7) {
  const data = new Uint8Array(size * size * 4);
  const grid = (n) => {
    const g = new Float32Array(n * n);
    let s = seed * 9301 + n * 49297;
    for (let i = 0; i < g.length; i++) { s = (s * 16807) % 2147483647; g[i] = s / 2147483647; }
    return g;
  };
  const octs = [4, 8, 16, 32].map((n) => ({ n, g: grid(n) }));
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let v = 0, amp = 0.5, tot = 0;
      for (const { n, g } of octs) {
        const fx = (x / size) * n, fy = (y / size) * n;
        const x0 = Math.floor(fx), y0 = Math.floor(fy);
        const tx = fx - x0, ty = fy - y0;
        const sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
        const at = (i, j) => g[((j % n) + n) % n * n + ((i % n) + n) % n];
        const a = at(x0, y0), b = at(x0 + 1, y0), c = at(x0, y0 + 1), d = at(x0 + 1, y0 + 1);
        v += amp * (a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy);
        tot += amp;
        amp *= 0.5;
      }
      const k = (y * size + x) * 4;
      const val = Math.round((v / tot) * 255);
      data[k] = data[k + 1] = data[k + 2] = val;
      data[k + 3] = 255;
    }
  }
  const t = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.magFilter = THREE.LinearFilter;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.generateMipmaps = true;
  t.needsUpdate = true;
  return t;
}

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}

function tex(c) {
  const t = new THREE.CanvasTexture(c);
  t.anisotropy = 4;
  t.needsUpdate = true;
  return t;
}

/**
 * Neon letters on a transparent ground (tube glow baked in).
 * vertical: stack letters top→bottom.
 */
export function neonTexture(text, { vertical = false, color, font = 'Big Shoulders Display', weight = 900, board = true } = {}) {
  const P = palette();
  const colr = color || P.gold;
  const letters = [...text];
  const L = 128;
  const W = vertical ? 200 : Math.max(256, letters.length * 92 + 80);
  const H = vertical ? letters.length * L + 70 : 200;
  const c = canvas(W, H);
  const g = c.getContext('2d');
  if (board) {
    g.fillStyle = P.ink;
    g.fillRect(0, 0, W, H);
    g.strokeStyle = colr;
    g.globalAlpha = 0.5;
    g.lineWidth = 4;
    g.strokeRect(10, 10, W - 20, H - 20);
    g.globalAlpha = 1;
  }
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.font = `${weight} ${vertical ? 124 : 150}px "${font}", "Arial Narrow", sans-serif`;
  const draw = (pass) => {
    letters.forEach((ch, i) => {
      const x = vertical ? W / 2 : 40 + (i + 0.5) * ((W - 80) / letters.length);
      const y = vertical ? 35 + (i + 0.5) * L + 6 : H / 2 + 6;
      if (pass === 'glow') { g.shadowColor = colr; g.shadowBlur = 26; g.strokeStyle = colr; g.lineWidth = 10; g.strokeText(ch, x, y); }
      else { g.shadowBlur = 0; g.strokeStyle = '#fff4d6'; g.lineWidth = 3.5; g.strokeText(ch, x, y); }
    });
  };
  draw('glow');
  draw('glow');
  draw('core');
  return { texture: tex(c), aspect: W / H };
}

/** Painted sign / billboard (flat print, lit from below). */
export function paintedTexture(lines, { w = 512, h = 256, bg, fg, sub } = {}) {
  const P = palette();
  const c = canvas(w, h);
  const g = c.getContext('2d');
  g.fillStyle = bg || P.cream;
  g.fillRect(0, 0, w, h);
  g.fillStyle = fg || P.ink;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  const n = lines.length;
  lines.forEach((ln, i) => {
    const size = i === 0 ? h * 0.42 / Math.max(1, n * 0.7) : h * 0.16;
    g.font = `${i === 0 ? 900 : 700} ${size}px "${i === 0 ? 'Big Shoulders Display' : 'Big Shoulders Text'}", sans-serif`;
    g.fillText(ln.toUpperCase(), w / 2, h * ((i + 0.6) / (n + 0.2)));
  });
  if (sub) { g.fillStyle = sub; g.fillRect(0, h - 14, w, 14); }
  // print grain
  const id = g.getImageData(0, 0, w, h);
  for (let i = 0; i < id.data.length; i += 4) {
    const k = (Math.random() - 0.5) * 26;
    id.data[i] += k; id.data[i + 1] += k; id.data[i + 2] += k;
  }
  g.putImageData(id, 0, 0);
  return tex(c);
}

/** Soft-edged vertical gradient (for light shafts) */
export function dotTexture() {
  const c = canvas(64, 64);
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,255,255,1)');
  gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr;
  g.fillRect(0, 0, 64, 64);
  return tex(c);
}
