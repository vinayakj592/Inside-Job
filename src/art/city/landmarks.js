// The eight targets of INSIDE JOB, each a recognisable silhouette, plus the avenue dressing.
// Every landmark gets its own facade material so the hub can light it by job state.
import * as THREE from 'three';
import { GeoBuilder } from './builder.js';
import { facadeMaterial, signMaterial, beamMaterial } from './materials.js';
import { neonTexture, paintedTexture } from './textures.js';
import { col, mixCol, rng, palette } from './util.js';
import { waterTower, lampPost } from './layout.js';

const W = (lit, seed, style, emi = 0) => [lit, seed, style, emi];
const NOWIN = [0, 0, 0, 0];
const GLOW = (e = 1) => [0, 0, 0, e];

/** Flat sign plane (neon or painted) positioned in world space. */
function signPlane(shared, texture, w, h, { x, y, z, ry = 0, flicker = 0, strength = 1.2 }) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), signMaterial(shared, texture, { flicker, strength }));
  m.position.set(x, y, z);
  m.rotation.y = ry;
  m.renderOrder = 2;
  m.layers.set(1);
  return m;
}

function finish(id, b, shared, extras = {}) {
  const mat = facadeMaterial(shared);
  const mesh = new THREE.Mesh(b.build(), mat);
  const group = new THREE.Group();
  group.add(mesh);
  group.name = 'landmark:' + id;
  return { id, group, mesh, mat, ...extras };
}

/* ---------------- 1 · Moretti's Pawn & Loan ---------------- */
function pawn(shared, cx, cz) {
  const b = new GeoBuilder();
  const brick = mixCol('ink-4', 'gold-deep', 0.12).multiplyScalar(0.9);
  const side = col('teal-8');
  const signs = [];
  const lights = [];
  b.at(cx, 0, cz, 0, () => {
    b.set(side, W(0.35, 3.1, 0));
    b.box(-15, 0, 4, 13, 17, 26);
    b.set(col('ink-4'), W(0.3, 8.2, 3));
    b.box(15, 0, 4, 13, 13, 26);
    b.set(brick, W(0.25, 5.5, 0));
    b.box(0, 0, 5, 16, 8.5, 24);
    b.set(brick.clone().multiplyScalar(0.7), NOWIN);
    b.box(0, 8.5, 5, 16.6, 0.8, 24.6, { bottom: true });
    // lit shop window + door
    b.set(col('gold-deep'), GLOW(0.55));
    b.box(-2.5, 0.9, 17.05, 9, 2.8, 0.1);
    b.set(col('ink'), NOWIN);
    b.box(5, 0, 17.05, 2.2, 3.2, 0.1);
    // awning
    b.set(col('teal-5'), NOWIN);
    b.quad([-7.5, 3.9, 17], [5.5, 3.9, 17], [5.5, 3.1, 19.4], [-7.5, 3.1, 19.4], [0, 0.95, 0.3]);
    b.box(-1, 2.7, 19.4, 13, 0.45, 0.08, { bottom: true });
    // three-ball pawnbroker sign on a bracket
    b.set(col('ink-4'), NOWIN);
    b.beam([7.8, 6.2, 17], [7.8, 6.2, 20.2], 0.16);
    b.beam([7.8, 6.2, 20.2], [7.8, 5.4, 20.2], 0.08);
    b.set(col('gold'), GLOW(0.9));
    b.sphere(7.2, 4.9, 20.2, 0.55, 10);
    b.sphere(8.4, 4.9, 20.2, 0.55, 10);
    b.sphere(7.8, 3.95, 20.2, 0.55, 10);
    // walk-up fire escape
    b.set(col('ink-3'), NOWIN);
    for (let i = 0; i < 4; i++) b.box(-15, 4.5 + i * 3.2, 17.6, 5, 0.12, 1.4);
    waterTower(b, -16, 17, 0, 1.8, col('ink-4'));
    b.set(col('ink-4'), NOWIN);
    b.box(15, 13, 0, 3, 1.5, 3);
  });
  const neon = neonTexture('PAWN', { vertical: true });
  signs.push(signPlane(shared, neon.texture, 1.9, 1.9 / neon.aspect, { x: cx + 7.2, y: 9.5 + 3, z: cz + 17.4, flicker: 0.3 }));
  b.set(col('ink'), NOWIN);
  lights.push({ x: cx + 7.8, y: 4.6, z: cz + 20.2, r: 12 }, { x: cx - 2.5, y: 2, z: cz + 18.5, r: 10 });
  const L = finish('pawn', b, shared, { signs, lights });
  L.top = 17;
  L.shot = { pos: [cx + 15, 3.2, cz + 30.5], look: [cx - 2, 7.5, cz + 12], fov: 62 };
  return L;
}

/* ---------------- 2 · Galerie Lumière ---------------- */
function gallery(shared, cx, cz) {
  const b = new GeoBuilder();
  const stone = mixCol('cream-dim', 'teal-7', 0.55).multiplyScalar(0.28);
  const signs = [], lights = [], beams = [];
  b.at(cx, 0, cz, 0, () => {
    b.set(stone.clone().multiplyScalar(0.85), NOWIN);
    b.box(0, 0, 0, 41, 4, 31);
    b.set(stone, W(0.7, 2.2, 3));
    b.box(0, 4, 0, 40, 12, 30);
    b.set(stone.clone().multiplyScalar(0.8), NOWIN);
    b.box(0, 16, 0, 41.5, 1.2, 31.5, { bottom: true });
    for (let x = -17.5; x <= 17.6; x += 5) b.box(x, 4, 15.2, 0.9, 12, 0.5);
    // glass pyramid skylight, glowing from the party inside
    b.set(col('gold-deep'), GLOW(0.45));
    b.frustum(0, 17.2, 0, 16, 16, 0, 0, 10);
    b.set(stone, NOWIN);
    // steps
    for (let i = 0; i < 3; i++) b.box(0, 0, 16 + i * 1.1, 16 - i * 0, 1.2 - i * 0.4, 2.2);
    // gala banners
    b.set(col('cream').multiplyScalar(0.55), NOWIN);
    b.box(-11, 5.5, 15.6, 2.2, 9, 0.2);
    b.box(11, 5.5, 15.6, 2.2, 9, 0.2);
    // entrance glow
    b.set(col('gold'), GLOW(0.7));
    b.box(0, 0.6, 15.3, 6, 3.4, 0.1);
  });
  const neon = neonTexture('GALERIE', { color: palette().cream });
  signs.push(signPlane(shared, neon.texture, 12, 12 / neon.aspect, { x: cx, y: 6.6, z: cz + 15.5, flicker: 0, strength: 0.9 }));
  lights.push({ x: cx, y: 2, z: cz + 19, r: 16 }, { x: cx - 11, y: 1, z: cz + 17, r: 9 }, { x: cx + 11, y: 1, z: cz + 17, r: 9 });
  // premiere searchlights crossing over the gala
  for (const s of [-1, 1]) {
    const g = new THREE.CylinderGeometry(4.5, 0.5, 260, 16, 1, true);
    g.translate(0, 130, 0);
    const m = new THREE.Mesh(g, beamMaterial(shared, col('cream'), 0.12));
    m.position.set(cx + s * 12, 1, cz + 22);
    m.userData.sway = { s, base: s * 0.28 };
    m.layers.set(1);
    beams.push(m);
  }
  const L = finish('gallery', b, shared, { signs, lights, beams });
  L.top = 27;
  L.shot = { pos: [cx - 17, 3, cz + 30.5], look: [cx + 1, 12, cz + 6], fov: 64 };
  return L;
}

/* ---------------- 3 · The Orpheum Casino ---------------- */
function casino(shared, cx, cz) {
  const b = new GeoBuilder();
  const wall = mixCol('ink-4', 'teal-6', 0.35);
  const signs = [], lights = [];
  b.at(cx, 0, cz, 0, () => {
    b.set(wall, W(0.3, 4.4, 2));
    b.box(0, 0, 0, 42, 20, 32);
    b.set(wall.clone().multiplyScalar(0.7), NOWIN);
    b.box(0, 20, 0, 43, 1.4, 33, { bottom: true });
    // deco pilasters
    b.set(wall.clone().multiplyScalar(1.2), NOWIN);
    for (let x = -18; x <= 18; x += 6) b.box(x, 0, 16.2, 1.2, 21.4, 0.6);
    // dome at the back
    b.set(col('teal-6').multiplyScalar(0.6), NOWIN);
    const R = 10;
    for (let i = 0; i < 6; i++) {
      const a0 = (i / 6) * Math.PI / 2, a1 = ((i + 1) / 6) * Math.PI / 2;
      b.cyl(0, 21.4 + Math.sin(a0) * R * 0.8, -5, Math.cos(a0) * R, (Math.sin(a1) - Math.sin(a0)) * R * 0.8, 20, { r1: Math.cos(a1) * R, top: i === 5 });
    }
    b.set(col('gold'), GLOW(0.8));
    b.cone(0, 21.4 + R * 0.8, -5, 0.8, 4, 6);
    // marquee canopy with bulb strips
    b.set(col('ink-3'), NOWIN);
    b.box(0, 5, 20, 28, 1.6, 8, { bottom: true });
    b.set(col('gold-hot'), GLOW(1));
    b.box(0, 5.1, 24.05, 28, 0.25, 0.1);
    b.box(0, 6.35, 24.05, 28, 0.25, 0.1);
    b.box(-14.05, 5.1, 20, 0.1, 0.25, 8);
    b.box(14.05, 5.1, 20, 0.1, 0.25, 8);
    b.set(col('gold'), GLOW(0.6));
    b.box(0, 0.4, 16.2, 16, 4, 0.1);
    // blade sign board
    b.set(col('ink'), NOWIN);
    b.box(0, 8, 16.9, 5.2, 32, 1.1, { bottom: true });
    b.set(col('gold-hot'), GLOW(1));
    b.frustum(0, 40, 16.9, 3, 1, 0, 0, 3.5);
  });
  const neon = neonTexture('ORPHEUM', { vertical: true });
  signs.push(signPlane(shared, neon.texture, 4.6, 4.6 / neon.aspect, { x: cx, y: 8 + 16, z: cz + 17.5, flicker: 0.7, strength: 1.35 }));
  const mq = neonTexture('CASINO', { color: palette().cream, board: true });
  signs.push(signPlane(shared, mq.texture, 16, 16 / mq.aspect, { x: cx, y: 5.8, z: cz + 24.15, flicker: 0 }));
  lights.push({ x: cx, y: 4, z: cz + 25, r: 22 }, { x: cx, y: 20, z: cz + 19, r: 16 });
  const L = finish('casino', b, shared, { signs, lights });
  L.top = 42;
  L.shot = { pos: [cx + 14, 2.4, cz + 30.5], look: [cx - 1, 20, cz + 10], fov: 66 };
  return L;
}

/* ---------------- 4 · Vesper rail yard ---------------- */
function rail(shared, zone) {
  const b = new GeoBuilder();
  const [x0, z0, x1, z1] = zone;
  const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
  const w = x1 - x0, d = z1 - z0;
  const r = rng(77);
  const lights = [];
  const railC = col('teal-3').multiplyScalar(0.7);
  const tracks = [];
  for (let i = 0; i < 7; i++) tracks.push(z0 + 10 + i * ((d - 20) / 6));
  b.set(railC, NOWIN);
  for (const tz of tracks) {
    b.box(cx, 0, tz - 0.75, w - 6, 0.18, 0.12);
    b.box(cx, 0, tz + 0.75, w - 6, 0.18, 0.12);
  }
  // freight cars
  const cars = [col('ink-4'), col('teal-7'), mixCol('gold-deep', 'ink-3', 0.7), col('ink-3'), mixCol('alarm', 'ink-3', 0.82)];
  tracks.forEach((tz, i) => {
    if (i === 3) return;
    let x = x0 + 8 + r() * 20;
    while (x < x1 - 20) {
      if (r() < 0.2) { x += 16; continue; }
      const len = 12 + r() * 3;
      b.set(r.pick(cars), NOWIN);
      b.box(x + len / 2, 0.9, tz, len, 3.4, 3.1);
      b.set(col('ink'), NOWIN);
      b.box(x + len / 2, 0.3, tz, len - 2, 0.6, 2.4);
      x += len + 1.2;
    }
  });
  // locomotive on the centre track with a headlight
  const lx = x0 + w * 0.35, lt = tracks[3];
  b.set(col('ink-4'), NOWIN);
  b.box(lx, 0.9, lt, 16, 3.2, 3.2);
  b.box(lx + 5, 4.1, lt, 5, 1.6, 3.2);
  b.set(col('gold-hot'), GLOW(1));
  b.box(lx + 8.05, 3, lt, 0.1, 0.7, 0.7);
  lights.push({ x: lx + 10, y: 3, z: lt, r: 14 });
  // gantry crane straddling the tracks
  const gx = x0 + w * 0.68;
  b.set(mixCol('gold-deep', 'ink-4', 0.6), NOWIN);
  for (const sz of [z0 + 6, z1 - 6]) {
    b.beam([gx - 4, 0, sz], [gx - 4, 24, sz], 0.9);
    b.beam([gx + 4, 0, sz], [gx + 4, 24, sz], 0.9);
    b.beam([gx - 4, 4, sz], [gx + 4, 20, sz], 0.35);
    b.beam([gx + 4, 4, sz], [gx - 4, 20, sz], 0.35);
  }
  b.box(gx, 24, cz, 10, 2.6, d - 8);
  b.box(gx, 21.5, cz + 8, 6, 2.5, 5);
  b.beam([gx, 21.5, cz + 8], [gx, 9, cz + 8], 0.12);
  b.set(col('ink-3'), NOWIN);
  b.box(gx, 7.5, cz + 8, 6, 1.5, 12);
  // signal tower
  b.set(col('ink-4'), W(0.9, 6.6, 3));
  b.box(x0 + 12, 0, z1 - 8, 8, 12, 8);
  b.set(col('ink-3'), NOWIN);
  b.frustum(x0 + 12, 12, z1 - 8, 10, 10, 3, 3, 3);
  // shed along the north edge
  b.set(col('teal-8'), W(0.15, 9.1, 2));
  b.box(cx - 10, 0, z0 - 1, w * 0.6, 9, 5);
  // floodlight masts
  for (const fx of [x0 + 30, cx + 18, x1 - 16]) {
    const fz = fx > cx ? z1 - 2 : z0 + 3;
    b.set(col('ink-4'), NOWIN);
    b.beam([fx, 0, fz], [fx, 28, fz], 0.5);
    b.box(fx, 28, fz, 4, 0.4, 1.2);
    b.set(col('gold-hot'), GLOW(1));
    b.box(fx, 28.4, fz, 3.6, 0.9, 0.9);
    lights.push({ x: fx, y: 28, z: fz, r: 46, big: true });
  }
  const L = finish('rail', b, shared, { lights });
  L.top = 28;
  L.cx = cx; L.cz = cz;
  L.shot = { pos: [x0 - 8, 26, z1 + 20], look: [cx + 10, 2, cz], fov: 56 };
  return L;
}

/* ---------------- 5 · First Meridian Bank ---------------- */
function bank(shared, cx, cz) {
  const b = new GeoBuilder();
  const stone = mixCol('cream-dim', 'ink-3', 0.72);
  const signs = [], lights = [];
  b.at(cx, 0, cz, 0, () => {
    b.set(stone.clone().multiplyScalar(0.8), NOWIN);
    for (let i = 0; i < 3; i++) b.box(0, i * 0.5, 2 - i * 0.6, 40 - i * 1.2, 0.5, 34 - i * 1.2);
    b.set(stone, NOWIN);
    b.box(0, 1.5, -1, 38, 18, 26);
    // columns of the portico
    b.set(stone.clone().multiplyScalar(1.3), NOWIN);
    for (let i = 0; i < 8; i++) {
      const x = -15.75 + i * 4.5;
      b.box(x, 1.5, 14, 2.6, 0.6, 2.6);
      b.cyl(x, 2.1, 14, 1.05, 14.4, 14, { r1: 0.9 });
      b.box(x, 16.5, 14, 2.4, 0.6, 2.4);
    }
    b.set(stone.clone().multiplyScalar(1.1), NOWIN);
    b.box(0, 17.1, 7.5, 39, 2.8, 16, { bottom: true });
    b.set(stone.clone().multiplyScalar(0.9), NOWIN);
    b.gable(0, 19.9, 12.5, 39, 6, 5.2);
    b.box(0, 19.9, 1, 39, 1, 17);
    // vault-door glow behind the columns
    b.set(col('gold-deep'), GLOW(0.4));
    b.box(0, 1.5, 12.05, 5, 7, 0.1);
    // office tower behind the banking hall
    b.set(mixCol('ink-4', 'teal-7', 0.4), W(0.18, 7.7, 0));
    b.box(0, 0, -7, 24, 58, 14);
    b.set(col('ink-3'), NOWIN);
    b.box(0, 58, -7, 25, 1, 15, { bottom: true });
    b.frustum(0, 59, -7, 14, 8, 6, 3, 5);
  });
  const band = paintedTexture(['FIRST MERIDIAN'], { w: 1024, h: 96, bg: palette()['ink-3'], fg: palette()['gold-deep'] });
  signs.push(signPlane(shared, band, 30, 2.4, { x: cx, y: 18.5, z: cz + 15.6, strength: 1.4 }));
  for (let i = 0; i < 8; i += 2) lights.push({ x: cx - 15.75 + (i + 0.5) * 4.5, y: 1.6, z: cz + 17, r: 12 });
  const L = finish('bank', b, shared, { signs, lights });
  L.top = 64;
  L.shot = { pos: [cx - 16, 2.6, cz + 30.5], look: [cx + 2, 16, cz + 6], fov: 64 };
  return L;
}

/* ---------------- 6 · Halloway & Sons, auctioneers ---------------- */
function auction(shared, cx, cz) {
  const b = new GeoBuilder();
  const brick = mixCol('ink-4', 'alarm', 0.08);
  const signs = [], lights = [];
  b.at(cx, 0, cz, 0, () => {
    b.set(brick, W(0.35, 1.9, 3));
    b.box(0, 0, 0, 36, 17, 28);
    b.set(brick.clone().multiplyScalar(0.7), NOWIN);
    b.box(0, 17, 0, 37, 0.8, 29, { bottom: true });
    // mansard roof with dormers
    b.set(col('ink-3'), NOWIN);
    b.frustum(0, 17.8, 0, 36, 28, 30, 22, 6);
    for (let x = -12; x <= 12; x += 8) {
      b.set(col('ink-4'), W(0.6, 3.3 + x, 3));
      b.box(x, 18.6, 12.2, 3, 3, 2.4);
      b.set(col('ink-3'), NOWIN);
      b.gable(x, 21.6, 12.2, 3.4, 2.8, 1.4);
    }
    // clock tower
    b.set(brick.clone().multiplyScalar(1.1), NOWIN);
    b.box(0, 23.8, 6, 8, 11, 8);
    b.set(col('ink-3'), NOWIN);
    b.frustum(0, 34.8, 6, 9, 9, 0, 0, 7);
    b.beam([0, 41.8, 6], [0, 46, 6], 0.15);
    // entrance
    b.set(col('gold'), GLOW(0.55));
    b.box(0, 0.4, 14.05, 5, 4, 0.1);
    b.set(col('teal-6'), NOWIN);
    b.box(0, 4.6, 15.6, 9, 0.5, 3.2, { bottom: true });
  });
  const clock = paintedTexture(['XII'], { w: 256, h: 256, bg: palette().cream, fg: palette().ink });
  const face = new THREE.Mesh(new THREE.CircleGeometry(2.6, 28), signMaterial(shared, clock, { strength: 0.85 }));
  face.position.set(cx, 29.5, cz + 10.08);
  face.layers.set(1);
  signs.push(face);
  const band = paintedTexture(['HALLOWAY & SONS'], { w: 1024, h: 128, bg: palette()['ink-3'], fg: palette().manila });
  signs.push(signPlane(shared, band, 14, 1.75, { x: cx, y: 5.95, z: cz + 17.25, strength: 1.2 }));
  lights.push({ x: cx, y: 3, z: cz + 17, r: 13 });
  const L = finish('auction', b, shared, { signs, lights });
  L.top = 44;
  L.shot = { pos: [cx + 15, 3, cz + 30.5], look: [cx - 1, 20, cz + 6], fov: 64 };
  return L;
}

/* ---------------- 7 · The Marlowe Hotel (Crane's penthouse) ---------------- */
function penthouse(shared, cx, cz) {
  const b = new GeoBuilder();
  const wall = mixCol('ink-4', 'teal-6', 0.45);
  const signs = [], lights = [];
  b.at(cx, 0, cz, 0, () => {
    b.set(wall, W(0.3, 12.1, 0));
    b.box(0, 0, 0, 30, 104, 26);
    b.set(wall.clone().multiplyScalar(0.7), NOWIN);
    b.box(0, 104, 0, 31, 1, 27, { bottom: true });
    b.set(wall, W(0.22, 12.7, 1));
    b.box(0, 105, 0, 23, 30, 19);
    b.set(wall.clone().multiplyScalar(0.7), NOWIN);
    b.box(0, 135, 0, 24, 0.8, 20, { bottom: true });
    // the penthouse: a lit glass box
    b.set(col('gold-deep'), W(0.96, 13.3, 2, 0.1));
    b.box(-2, 135.8, 1, 17, 7, 13);
    b.set(col('ink-3'), NOWIN);
    b.box(-2, 142.8, 1, 18, 0.6, 14, { bottom: true });
    // terrace pergola
    for (let x = 8; x <= 10.5; x += 2.5) for (const z of [-5, 0, 5]) b.beam([x, 135.8, z], [x, 139.5, z], 0.14);
    b.box(9.2, 139.5, 0, 3.6, 0.2, 11);
    waterTower(b, -6, 143.4, -2, 1.8, col('ink-4'));
    b.set(col('ink'), NOWIN);
    b.box(13.2, 50, 13.6, 3.4, 44, 0.8, { bottom: true });
    // canopy
    b.set(col('ink-3'), NOWIN);
    b.box(0, 4.5, 16, 10, 0.6, 6, { bottom: true });
    b.set(col('gold'), GLOW(0.6));
    b.box(0, 0.4, 13.05, 6, 3.6, 0.1);
  });
  const neon = neonTexture('MARLOWE', { vertical: true, color: palette()['teal-1'] });
  signs.push(signPlane(shared, neon.texture, 3.1, 3.1 / neon.aspect, { x: cx + 13.2, y: 72, z: cz + 14.05, flicker: 0.45, strength: 1.3 }));
  lights.push({ x: cx - 2, y: 139, z: cz + 9, r: 18 }, { x: cx, y: 3, z: cz + 18, r: 12 });
  const L = finish('penthouse', b, shared, { signs, lights });
  L.top = 150;
  L.shot = { pos: [cx + 46, 122, cz + 62], look: [cx - 2, 132, cz], fov: 46 };
  return L;
}

/* ---------------- 8 · Crane Tower (the hero) ---------------- */
function tower(shared, cx, cz) {
  const b = new GeoBuilder();
  const wall = mixCol('ink-3', 'teal-6', 0.35);
  const fin = mixCol('ink-4', 'teal-5', 0.35);
  const lights = [], beams = [];
  b.at(cx, 0, cz, 0, () => {
    // podium with a deco entrance
    b.set(wall.clone().multiplyScalar(0.8), W(0.35, 21.2, 2));
    b.box(0, 0, 0, 62, 16, 52);
    b.set(col('gold'), GLOW(0.75));
    b.box(0, 0.5, 26.05, 10, 9, 0.1);
    b.set(wall.clone().multiplyScalar(0.6), NOWIN);
    b.box(0, 16, 0, 63, 1, 53, { bottom: true });
    // stepped shaft
    const stages = [[46, 17, 118], [36, 118, 172], [27, 172, 206], [18, 206, 226]];
    stages.forEach(([s, y0, y1], i) => {
      b.set(wall, W(0.2 - i * 0.03, 30 + i, 1));
      b.box(0, y0, 0, s, y1 - y0, s);
      // vertical fins: the deco pinstripes that make the silhouette sing
      b.set(fin, NOWIN);
      const n = i < 2 ? 5 : 3;
      for (let k = 0; k < n; k++) {
        const t = (k / (n - 1) - 0.5) * (s - 3);
        b.box(t, y0, s / 2 + 0.35, 0.9, y1 - y0 + 1.5, 0.7);
        b.box(t, y0, -s / 2 - 0.35, 0.9, y1 - y0 + 1.5, 0.7);
        b.box(s / 2 + 0.35, y0, t, 0.7, y1 - y0 + 1.5, 0.9);
        b.box(-s / 2 - 0.35, y0, t, 0.7, y1 - y0 + 1.5, 0.9);
      }
      b.set(wall.clone().multiplyScalar(0.7), NOWIN);
      b.box(0, y1, 0, s + 1.2, 1.2, s + 1.2, { bottom: true });
    });
    // the gold crown: three stepped tiers of lit sunburst fins
    const tiers = [[14, 227.2, 8], [10, 235.2, 7], [6.5, 242.2, 6]];
    tiers.forEach(([s, y0, h], i) => {
      b.set(col('ink-3'), NOWIN);
      b.box(0, y0, 0, s, h, s);
      b.set(col('gold'), GLOW(0.85 - i * 0.1));
      const n = 5 - i;
      for (let k = 0; k < n; k++) {
        const t = (k / (n - 1) - 0.5) * (s - 1.2);
        const hh = h * (1 - Math.abs(t) / s * 0.9);
        for (const [fx, fz, rx, rz] of [[t, s / 2 + 0.1, 0.7, 0.2], [t, -s / 2 - 0.1, 0.7, 0.2], [s / 2 + 0.1, t, 0.2, 0.7], [-s / 2 - 0.1, t, 0.2, 0.7]]) {
          b.box(fx, y0, fz, rx, hh, rz);
        }
      }
    });
    // needle spire
    b.set(col('ink-4'), NOWIN);
    b.cyl(0, 248.2, 0, 1.6, 6, 8, { smoothN: false, r1: 1.1 });
    b.cone(0, 254.2, 0, 1.1, 36, 8);
    b.set(col('gold-hot'), GLOW(1));
    b.sphere(0, 290.5, 0, 0.7, 8);
  });
  // searchlight from the crown
  const g = new THREE.CylinderGeometry(22, 1.2, 900, 24, 1, true);
  g.translate(0, 450, 0);
  const beam = new THREE.Mesh(g, beamMaterial(shared, col('cream').lerp(col('gold-hot'), 0.25), 0.22));
  beam.position.set(cx, 244, cz);
  beam.layers.set(1);
  beam.rotation.order = 'YXZ';
  beam.userData.search = true;
  beams.push(beam);
  lights.push({ x: cx, y: 2, z: cz + 30, r: 26 }, { x: cx, y: 228, z: cz + 12, r: 36, high: true });
  const crownGlows = [[0, 232, 9.5, 46], [0, 243, 6, 30], [0, 250, 4, 18], [0, 290.5, 0, 16]];
  const L = finish('tower', b, shared, { lights, beams, signs: [], crownGlows: crownGlows.map(([x, y, z, sz]) => [cx + x, y, cz + z, sz]) });
  L.top = 292;
  L.shot = { pos: [cx + 7, 3, cz + 150], look: [cx, 160, cz], fov: 62 };
  return L;
}

/** Build every landmark at its planned site. */
export function buildLandmarks(shared, plan) {
  const S = plan.sites;
  const out = {
    pawn: pawn(shared, S.pawn.x, S.pawn.z),
    gallery: gallery(shared, S.gallery.x, S.gallery.z),
    casino: casino(shared, S.casino.x, S.casino.z),
    rail: rail(shared, plan.railZone),
    bank: bank(shared, S.bank.x, S.bank.z),
    auction: auction(shared, S.auction.x, S.auction.z),
    penthouse: penthouse(shared, S.penthouse.x, S.penthouse.z),
    tower: tower(shared, S.tower.x, S.tower.z),
  };
  for (const [id, L] of Object.entries(out)) {
    const cx = L.cx ?? S[id].x, cz = L.cz ?? S[id].z;
    L.center = new THREE.Vector3(cx, 0, cz);
    L.anchor = id === 'tower' ? new THREE.Vector3(cx, 150, cz + 12) : id === 'rail' ? new THREE.Vector3(cx, 30, cz) : new THREE.Vector3(cx, Math.min(L.top, 60) * 0.85 + 2, cz + 6);
    for (const s of L.signs || []) L.group.add(s);
    for (const bm of L.beams || []) L.group.add(bm);
  }
  return out;
}

/** Avenue dressing for the home shot: blade signs and a Crane Holdings billboard. */
export function buildAvenueDressing(shared, plan, avenueLots) {
  const group = new THREE.Group();
  const b = new GeoBuilder();
  const P = palette();
  const picks = [
    { text: 'HOTEL', side: -1, dz: 70, color: P.gold, flicker: 0.2 },
    { text: 'BAR', side: 1, dz: 175, color: P['teal-1'], flicker: 0.9 },
    { text: 'DINER', side: -1, dz: 150, color: P.cream, flicker: 0 },
    { text: 'LOANS', side: 1, dz: 250, color: P.gold, flicker: 0.5 },
  ];
  for (const p of picks) {
    const z = plan.camZ - p.dz;
    const lot = avenueLots.filter((l) => l.side === p.side).sort((a, b2) => Math.abs(a.z - z) - Math.abs(b2.z - z))[0];
    if (!lot) continue;
    const fx = lot.x + (lot.side * lot.w) / 2 + lot.side * 1.9;
    const neon = neonTexture(p.text, { vertical: true, color: p.color });
    const hgt = Math.min(lot.h - 6, 2.6 * p.text.length + 2);
    const w = hgt * neon.aspect;
    const y = Math.max(5.5, lot.h - hgt - 4) + hgt / 2;
    const ry = -lot.side * 0.12; // blade signs face down the street, toward the camera
    b.set(col('ink'), NOWIN);
    b.at(fx, y - hgt / 2 - 0.3, lot.z, ry, () => { b.box(0, 0, 0, w + 0.5, hgt + 0.6, 0.5); });
    b.set(col('ink-4'), NOWIN);
    b.beam([lot.x + (lot.side * lot.w) / 2, y + hgt / 2 - 0.5, lot.z], [fx, y + hgt / 2 - 0.5, lot.z], 0.12);
    b.beam([lot.x + (lot.side * lot.w) / 2, y - hgt / 2 + 0.5, lot.z], [fx, y - hgt / 2 + 0.5, lot.z], 0.12);
    const m = signPlane(shared, neon.texture, w, hgt, { x: fx, y, z: lot.z, ry, flicker: p.flicker, strength: 1.25 });
    m.translateZ(0.28);
    group.add(m);
  }
  // Crane Holdings billboard on a rooftop, lit from below: the man owns the skyline
  const bl = avenueLots.filter((l) => l.side === 1 && plan.camZ - l.z > 110 && plan.camZ - l.z < 190).sort((a, c) => a.h - c.h)[0];
  if (bl) {
    const tex = paintedTexture(['CRANE HOLDINGS', 'BUILDING TOMORROW, TODAY'], { w: 1024, h: 384, bg: P.cream, fg: P.ink, sub: P['gold-deep'] });
    const bw = 16, bh = 6;
    const y = bl.h + 3.4 + bh / 2;
    b.set(col('ink-4'), NOWIN);
    for (const s of [-1, 1]) b.beam([bl.x, bl.h, bl.z + s * 5], [bl.x, y + 1, bl.z + s * 5], 0.3);
    const m = signPlane(shared, tex, bw, bh, { x: bl.x - 0.6, y, z: bl.z, ry: -Math.PI / 2 + 0.45, strength: 0.6 });
    group.add(m);
    b.set(col('gold-hot'), GLOW(1));
    b.box(bl.x - 2, y - bh / 2 - 0.7, bl.z, 0.6, 0.4, 12);
  }
  const mesh = new THREE.Mesh(b.build(), facadeMaterial(shared));
  group.add(mesh);
  return { group, mesh };
}

export { lampPost };
