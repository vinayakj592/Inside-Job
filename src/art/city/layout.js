// Port Vesper city plan: a street grid laid out so the main avenue runs straight at Crane Tower,
// landmarks snapped into blocks from each job's hubPos, and procedural buildings filling the rest.
import { rng, col, mixCol, clamp } from './util.js';

export const MAP_W = 900;   // world metres spanned by hubPos.x 0..1
export const MAP_D = 600;   // world metres spanned by hubPos.y 0..1

/** Where each landmark sits if the job (or its hubPos) is missing. */
export const DEFAULT_POS = {
  pawn: { x: 0.2, y: 0.66 },
  gallery: { x: 0.34, y: 0.42 },
  casino: { x: 0.58, y: 0.6 },
  rail: { x: 0.84, y: 0.76 },
  bank: { x: 0.68, y: 0.38 },
  auction: { x: 0.24, y: 0.24 },
  penthouse: { x: 0.8, y: 0.2 },
  tower: { x: 0.5, y: 0.1 },
};
export const LANDMARK_IDS = Object.keys(DEFAULT_POS);

export const hubToWorld = (p) => ({ x: (p.x - 0.5) * MAP_W, z: (p.y - 0.5) * MAP_D });

export function makePlan(jobs = []) {
  const byId = Object.fromEntries(jobs.map((j) => [j.id, j]));
  const pos = {};
  for (const id of LANDMARK_IDS) {
    const hp = byId[id]?.hubPos;
    const ok = hp && Number.isFinite(hp.x) && Number.isFinite(hp.y);
    pos[id] = hubToWorld(ok ? { x: clamp(hp.x, 0.04, 0.96), y: clamp(hp.y, 0.04, 0.96) } : DEFAULT_POS[id]);
  }
  const tower = pos.tower;
  const plan = {
    BW: 64, BD: 56, roadW: 12, aveW: 26, walk: 4,
    ax: tower.x,
    tower,
    plazaR: 44,
    xMin: -780, xMax: 780,
    zMin: Math.min(-640, tower.z - 420),
    zMax: Math.max(720, tower.z + 780),
    waterX: 600,
  };
  plan.z0 = tower.z + 50;           // first cross street just south of the plaza
  plan.aveEndZ = tower.z + 36;       // the avenue opens out of the plaza
  plan.camZ = tower.z + 640;         // home camera sits down the avenue

  const blockOf = (x, z) => {
    const kx = Math.floor((x - plan.ax) / plan.BW);
    const kz = Math.floor((z - plan.z0) / plan.BD);
    return { kx, kz, cx: plan.ax + (kx + 0.5) * plan.BW, cz: plan.z0 + (kz + 0.5) * plan.BD };
  };
  plan.blockOf = blockOf;

  // Rail yard: a 3×2-block zone, kept clear of the avenue.
  const rb = blockOf(pos.rail.x, pos.rail.z);
  let rcx = rb.cx + plan.BW / 2, rcz = rb.cz + plan.BD / 2;
  const halfW = plan.BW * 1.5, halfD = plan.BD;
  if (Math.abs(rcx - plan.ax) < halfW + plan.aveW) rcx = plan.ax + Math.sign(rcx - plan.ax || 1) * (halfW + plan.aveW);
  plan.railZone = [rcx - halfW + 2, rcz - halfD + 2, rcx + halfW - 2, rcz + halfD - 2];
  const inRail = (x, z, m = 0) => x > plan.railZone[0] - m && x < plan.railZone[2] + m && z > plan.railZone[1] - m && z < plan.railZone[3] + m;
  plan.inRail = inRail;

  // Snap the other landmarks to free blocks.
  const taken = new Set();
  const key = (kx, kz) => kx + ',' + kz;
  const sites = { tower: { x: tower.x, z: tower.z, kx: null, kz: null }, rail: { x: rcx, z: rcz } };
  const order = ['penthouse', 'bank', 'casino', 'gallery', 'auction', 'pawn'];
  for (const id of order) {
    const p = pos[id];
    const b0 = blockOf(p.x, p.z);
    let best = null;
    for (let r = 0; r < 4 && !best; r++) {
      const cands = [];
      for (let dx = -r; dx <= r; dx++) for (let dz = -r; dz <= r; dz++) {
        if (Math.max(Math.abs(dx), Math.abs(dz)) !== r) continue;
        const kx = b0.kx + dx, kz = b0.kz + dz;
        const cx = plan.ax + (kx + 0.5) * plan.BW, cz = plan.z0 + (kz + 0.5) * plan.BD;
        if (taken.has(key(kx, kz))) continue;
        if (inRail(cx, cz, 30)) continue;
        if (Math.hypot(cx - tower.x, cz - tower.z) < plan.plazaR + 50) continue;
        cands.push({ kx, kz, cx, cz, d: Math.hypot(cx - p.x, cz - p.z) });
      }
      cands.sort((a, b) => a.d - b.d);
      best = cands[0] || null;
    }
    if (!best) best = { ...b0 };
    taken.add(key(best.kx, best.kz));
    sites[id] = { x: best.cx, z: best.cz, kx: best.kx, kz: best.kz };
  }
  plan.sites = sites;
  plan.taken = taken;
  plan.key = key;
  return plan;
}

/* ------------------------------------------------------------------ */
/* Generic buildings                                                   */
/* ------------------------------------------------------------------ */
const WALLS = () => [
  col('ink-3'), col('ink-4'), col('teal-8'), col('teal-7'), mixCol('ink-4', 'teal-6', 0.5), mixCol('ink-3', 'teal-7', 0.5), col('ink-2'),
];

/** Height field: a downtown ridge around Crane Tower, low Narrows and waterfront. */
function heightAt(plan, x, z, r) {
  const t = plan.tower;
  const dT = Math.hypot(x - t.x, (z - t.z) * 1.2);
  const down = Math.exp(-((dT / 330) ** 2));
  let h = 11 + 48 * down + r() * (14 + 30 * down);
  if (r() < 0.05 + 0.22 * down) h *= 1.6 + r() * 1.0;
  const pawn = plan.sites.pawn;
  if (pawn) { const d = Math.hypot(x - pawn.x, z - pawn.z); if (d < 170) h *= 0.45 + 0.55 * (d / 170); }
  if (x > plan.waterX - 120) h *= 0.6;
  if (plan.inRail(x, z, 80)) h *= 0.55;
  // keep a low forecourt south of every landmark so its facade and signs face the camera
  for (const [id, site] of Object.entries(plan.sites)) {
    if (id === 'tower' || id === 'rail') continue;
    const dz = z - site.z, dx = Math.abs(x - site.x);
    if (dz > 15 && dz < 150 && dx < 60) h = Math.min(h, 9 + (dz - 15) * 0.14 + dx * 0.15);
  }
  // nothing may rival the tower
  const near = Math.hypot(x - t.x, z - t.z);
  if (near < 160) h = Math.min(h, 55 + near * 0.3);
  // keep the sightline down the avenue clean so the tower owns the skyline
  const dzc = plan.camZ - z, dxc = Math.abs(x - plan.ax);
  if (dzc > 160 && dxc < dzc * 0.24) h = Math.min(h, 34 + (dxc / (dzc * 0.24)) * 30 + dzc * 0.03);
  if (z < t.z + 20 && Math.abs(x - t.x) < 260) h = Math.min(h, 48 + Math.abs(x - t.x) * 0.15);
  return clamp(h, 7, 175);
}

export function buildGeneric(b, plan, { detailRadius = 420, quality = 'high' } = {}) {
  const r = rng(1947);
  const walls = WALLS();
  const { ax, BW, BD, roadW, aveW, walk } = plan;
  const kx0 = Math.floor((plan.xMin - ax) / BW), kx1 = Math.floor((plan.xMax - ax) / BW);
  const kz0 = Math.floor((plan.zMin - plan.z0) / BD), kz1 = Math.floor((plan.zMax - plan.z0) / BD);
  const camX = ax, camZ = plan.camZ;
  const avenueLots = []; // lots flanking the avenue (fire escapes, billboards)
  const lamps = [];
  const parked = [];

  for (let kx = kx0; kx <= kx1; kx++) {
    for (let kz = kz0; kz <= kz1; kz++) {
      const x0 = ax + kx * BW, x1 = x0 + BW, z0 = plan.z0 + kz * BD, z1 = z0 + BD;
      const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
      if (plan.taken.has(plan.key(kx, kz))) continue;
      if (plan.inRail(cx, cz, 20)) continue;
      if (cx > plan.waterX - 10) continue;
      const southOfPlaza = z0 > plan.aveEndZ - 1;
      const leftHalf = kx === 0 && southOfPlaza ? aveW / 2 : roadW / 2;
      const rightHalf = kx === -1 && southOfPlaza ? aveW / 2 : roadW / 2;
      const ix0 = x0 + leftHalf + walk, ix1 = x1 - rightHalf - walk;
      const iz0 = z0 + roadW / 2 + walk, iz1 = z1 - roadW / 2 - walk;
      const onAve = (kx === 0 || kx === -1) && southOfPlaza;
      const dCam = Math.hypot(cx - camX, (cz - camZ) * 0.5);
      const dMap = Math.max(Math.abs(cx) - MAP_W / 2, Math.abs(cz) - MAP_D / 2, 0);
      const detail = onAve || dMap < 60 || dCam < detailRadius;
      const far = dMap > 320 && !onAve;

      const lots = [];
      if (onAve) {
        // avenue blocks: the half facing the avenue is cut into narrow frontages (the canyon walls)
        const aveSideIsLeft = kx === 0;
        const mid = (ix0 + ix1) / 2;
        const faceX0 = aveSideIsLeft ? ix0 : mid, faceX1 = aveSideIsLeft ? mid : ix1;
        const backX0 = aveSideIsLeft ? mid : ix0, backX1 = aveSideIsLeft ? ix1 : mid;
        let z = iz0;
        while (z < iz1 - 4) {
          const w = Math.min(iz1 - z, 8 + r() * 11);
          lots.push({ x0: faceX0, x1: faceX1, z0: z, z1: z + w, ave: true });
          z += w;
        }
        lots.push({ x0: backX0, x1: backX1, z0: iz0, z1: (iz0 + iz1) / 2 });
        lots.push({ x0: backX0, x1: backX1, z0: (iz0 + iz1) / 2, z1: iz1 });
      } else if (far) {
        lots.push({ x0: ix0, x1: (ix0 + ix1) / 2, z0: iz0, z1: iz1 });
        lots.push({ x0: (ix0 + ix1) / 2, x1: ix1, z0: iz0, z1: iz1 });
      } else {
        const zm = (iz0 + iz1) / 2;
        for (const [za, zb] of [[iz0, zm], [zm, iz1]]) {
          let x = ix0;
          while (x < ix1 - 4) {
            const w = Math.min(ix1 - x, 9 + r() * 12);
            lots.push({ x0: x, x1: x + w, z0: za, z1: zb });
            x += w;
          }
        }
      }

      for (const lot of lots) {
        // keep the plaza clear
        const lx = (lot.x0 + lot.x1) / 2, lz = (lot.z0 + lot.z1) / 2;
        if (Math.hypot(lx - plan.tower.x, lz - plan.tower.z) < plan.plazaR + 8) continue;
        let h = heightAt(plan, lx, lz, r);
        if (lot.ave) {
          const dz = plan.camZ - lz;
          if (dz < 140) h = clamp(h, 16, 46);           // mid-rise walls near the camera frame the shot
          else h = clamp(h, 18, 110);
        }
        const inset = lot.ave ? 0.2 : 0.4 + r() * 0.8;
        const lotW = lot.x1 - lot.x0 - inset * 2, lotD = lot.z1 - lot.z0 - inset * 2;
        if (lotW < 3 || lotD < 3) continue;
        const wall = r.pick(walls).clone().multiplyScalar(0.8 + r() * 0.5);
        const nearCam = lot.ave && plan.camZ - lz < 90;
        building(b, r, { x: lx, z: lz, w: lotW, d: lotD, h, wall, detail, far, ave: lot.ave, aveSide: lot.ave ? (kx === 0 ? -1 : 1) : 0, litMul: nearCam ? 0.35 : 1 });
        if (lot.ave) avenueLots.push({ x: lx, z: lz, w: lotW, d: lotD, h, side: kx === 0 ? -1 : 1 });
      }
    }
  }

  // Streetlamps: a steady rhythm down both sides of the avenue …
  for (let z = plan.aveEndZ + 14, i = 0; z < plan.camZ + 60; z += 25, i++) {
    for (const s of [-1, 1]) {
      const zz = z + (s > 0 ? 12 : 0);
      lamps.push({ x: ax + s * (aveW / 2 + 1.2), z: zz, arm: -s, ave: true });
    }
  }
  // … and at street corners across the map.
  for (let kx = kx0; kx <= kx1; kx++) {
    for (let kz = kz0; kz <= kz1; kz++) {
      if (kx === 0) continue;
      const x = ax + kx * BW, z = plan.z0 + kz * BD;
      if (Math.abs(x) > MAP_W / 2 + 180 || z < plan.zMin + 40 || z > plan.zMax - 40 || x > plan.waterX - 20) continue;
      if (plan.inRail(x, z, 6)) continue;
      if (Math.hypot(x - plan.tower.x, z - plan.tower.z) < plan.plazaR + 6) continue;
      if (r() < 0.55) {
        const sx = r() < 0.5 ? 1 : -1, sz = r() < 0.5 ? 1 : -1;
        lamps.push({ x: x + sx * (roadW / 2 + 1.2), z: z + sz * (roadW / 2 + 1.2), arm: -sx, ave: false });
      }
    }
  }
  // plaza lamps ring the tower
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 + 0.3;
    lamps.push({ x: plan.tower.x + Math.cos(a) * (plan.plazaR - 4), z: plan.tower.z + Math.sin(a) * (plan.plazaR - 4), arm: 0, ave: false, plaza: true });
  }
  for (const L of lamps) lampPost(b, L);

  // parked cars near the camera give the street its scale
  for (let z = plan.camZ - 260; z < plan.camZ + 30; z += 11 + r() * 16) {
    if (r() < 0.45) continue;
    const s = r() < 0.5 ? -1 : 1;
    parked.push({ x: ax + s * (aveW / 2 - 1.4), z, rot: 0 });
  }
  parked.length = 0; // parked cars now come from street.js (proper silhouettes)

  return { lamps, avenueLots };
}

/** One procedural building with a silhouette archetype picked by height. */
export function building(b, r, o) {
  const { x, z, w, d, h, wall, detail, far } = o;
  const seed = r() * 97;
  const tall = h > 62, mid = h > 24 && !tall;
  const style = tall ? (r() < 0.6 ? 1 : 2) : mid ? (r() < 0.75 ? 0 : 3) : r() < 0.5 ? 3 : 0;
  const lit = (tall ? 0.05 + r() * 0.08 : 0.06 + r() * 0.14) * (o.litMul ?? 1);
  const win = [lit, seed, style, 0];
  b.set(wall, win);
  if (far) { b.box(x, 0, z, w, h, d); return; }

  if (tall) {
    // art-deco setbacks: three stages and a crown
    const h1 = h * (0.55 + r() * 0.1), h2 = h * (0.24 + r() * 0.06), h3 = h - h1 - h2;
    b.box(x, 0, z, w, h1, d);
    b.box(x, h1, z, w * 0.94, 0.9, d * 0.94);
    b.box(x, h1, z, w * 0.76, h2, d * 0.76);
    b.box(x, h1 + h2, z, w * 0.52, h3, d * 0.52);
    const top = h;
    const crown = r();
    b.set(wall.clone().multiplyScalar(0.8), [0, seed, 0, 0]);
    if (crown < 0.35) {
      b.frustum(x, top, z, w * 0.52, d * 0.52, w * 0.2, d * 0.2, h * 0.08);
      b.set(wall, [0, seed, 0, 0]);
      b.beam([x, top + h * 0.08, z], [x, top + h * 0.08 + 14 + r() * 10, z], 0.35);
      b.set(wall, [0, 0, 0, 1]);
      b.box(x, top + h * 0.08 + 12, z, 0.9, 0.9, 0.9);
    } else if (crown < 0.65) {
      // stepped ziggurat crown
      for (let i = 0; i < 3; i++) b.box(x, top + i * 3, z, w * (0.46 - i * 0.12), 3, d * (0.46 - i * 0.12));
      b.beam([x, top + 9, z], [x, top + 26, z], 0.3);
    } else {
      b.box(x + w * 0.1, top, z, w * 0.2, 5, d * 0.2);
      b.beam([x - w * 0.12, top, z], [x - w * 0.12, top + 18 + r() * 12, z], 0.3);
    }
    return;
  }

  // mid and low rise
  let top = h;
  if (mid && r() < 0.4) {
    const h1 = h * (0.72 + r() * 0.1);
    b.box(x, 0, z, w, h1, d);
    b.box(x, h1, z, w * 1.02, 0.7, d * 1.02, { bottom: true });
    b.box(x, h1 + 0.7, z, w * 0.72, h - h1, d * 0.72);
  } else {
    b.box(x, 0, z, w, h, d);
  }
  // cornice
  b.set(wall.clone().multiplyScalar(0.7), [0, seed, 0, 0]);
  b.box(x, top, z, w + 0.6, 0.8, d + 0.6, { bottom: true });
  if (!detail) return;
  const roofC = wall.clone().multiplyScalar(0.9);
  // rooftop clutter
  if (r() < (mid ? 0.4 : 0.3)) waterTower(b, x + (r() - 0.5) * w * 0.4, top + 0.8, z + (r() - 0.5) * d * 0.4, 1.6 + r() * 0.8, roofC);
  const nAc = r.int(0, 2);
  b.set(roofC, [0, 0, 0, 0]);
  for (let i = 0; i < nAc; i++) b.box(x + (r() - 0.5) * w * 0.6, top + 0.8, z + (r() - 0.5) * d * 0.6, 1.5 + r() * 2, 1 + r(), 1.5 + r() * 2);
  if (r() < 0.25) b.beam([x + w * 0.3, top, z - d * 0.3], [x + w * 0.3, top + 6 + r() * 8, z - d * 0.3], 0.18);
  // fire escape on the street face of walk-ups by the avenue
  if (o.ave && h < 40 && r() < 0.55) fireEscape(b, x + (o.aveSide * w) / 2, z, h, o.aveSide, Math.min(d * 0.6, 6), wall);
}

export function waterTower(b, x, y, z, rad, c) {
  b.set(c, [0, 0, 0, 0]);
  const legH = 3.2;
  for (const [sx, sz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) b.beam([x + sx * rad * 0.7, y, z + sz * rad * 0.7], [x + sx * rad * 0.7, y + legH, z + sz * rad * 0.7], 0.2);
  b.cyl(x, y + legH, z, rad, rad * 2.1, 10, { smoothN: false });
  b.cone(x, y + legH + rad * 2.1, z, rad * 1.08, rad * 0.9, 10);
}

/** Zig-zag fire escape stuck to a facade (side: -1 → faces +x? we pass the facade normal x sign) */
export function fireEscape(b, fx, z, h, side, width, wall) {
  const nX = side; // facade normal points toward the avenue
  const c = wall.clone().multiplyScalar(0.55);
  b.set(c, [0, 0, 0, 0]);
  const floors = Math.floor((h - 5) / 3.5);
  const dx = nX * 0.9;
  for (let i = 0; i < floors; i++) {
    const y = 5 + i * 3.5;
    b.box(fx + dx, y, z, 1.6, 0.14, width);
    b.beam([fx + nX * 1.65, y, z - width / 2], [fx + nX * 1.65, y + 1.0, z - width / 2], 0.07);
    b.beam([fx + nX * 1.65, y, z + width / 2], [fx + nX * 1.65, y + 1.0, z + width / 2], 0.07);
    b.beam([fx + nX * 1.65, y + 1.0, z - width / 2], [fx + nX * 1.65, y + 1.0, z + width / 2], 0.07);
    if (i < floors - 1) {
      const s = i % 2 ? 1 : -1;
      b.beam([fx + dx, y + 0.1, z + s * width * 0.4], [fx + dx, y + 3.5, z - s * width * 0.4], 0.28);
    }
  }
  // drop ladder
  b.beam([fx + nX * 1.4, 2.2, z + width * 0.35], [fx + nX * 1.4, 5, z + width * 0.35], 0.07);
}

export function lampPost(b, L) {
  const c = col('ink-4');
  b.set(c, [0, 0, 0, 0]);
  const H = L.plaza ? 5 : 7;
  // fluted base, collar, tapering shaft
  b.cyl(L.x, 0, L.z, 0.42, 0.9, 10, { smoothN: false, r1: 0.3 });
  b.cyl(L.x, 0.9, L.z, 0.34, 0.14, 10, { smoothN: false });
  b.cyl(L.x, 1.04, L.z, 0.14, H - 1.2, 8, { r1: 0.1 });
  b.cyl(L.x, H * 0.62, L.z, 0.2, 0.12, 8, { smoothN: false });
  let hx = L.x, hz = L.z;
  if (L.arm) {
    hx = L.x + L.arm * 1.8;
    b.beam([L.x, H - 0.15, L.z], [hx, H + 0.05, L.z], 0.12);
    b.beam([L.x, H - 0.9, L.z], [L.x + L.arm * 0.9, H - 0.05, L.z], 0.07); // scroll brace
  }
  // bell hood, glowing glass, finial
  b.set(c, [0, 0, 0, 0]);
  b.frustum(hx, H + 0.2, hz, 1.05, 1.05, 0.2, 0.2, 0.42);
  b.cone(hx, H + 0.62, hz, 0.1, 0.35, 6);
  b.box(hx, H + 0.05, hz, 1.1, 0.15, 1.1, { bottom: true });
  b.set(col('gold-hot'), [0, 0, 0, 1]);
  b.frustum(hx, H - 0.55, hz, 0.42, 0.42, 0.8, 0.8, 0.6);
  L.hx = hx; L.hy = H - 0.45; L.hz = hz;
}

export function carBody(b, x, z, rot, r) {
  const body = r ? r.pick([col('ink-3'), col('teal-8'), col('ink-4')]) : col('ink-3');
  b.at(x, 0, z, rot, () => {
    b.set(body, [0, 0, 0, 0]);
    b.box(0, 0.35, 0, 2.0, 0.85, 4.8);
    b.box(0, 1.2, 0.3, 1.8, 0.7, 2.4);
    b.set(col('ink'), [0, 0, 0, 0]);
    for (const [sx, sz] of [[1, 1.5], [-1, 1.5], [1, -1.5], [-1, -1.5]]) b.box(sx * 0.95, 0, sz, 0.3, 0.6, 0.7);
  });
}
