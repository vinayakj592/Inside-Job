// Moving parts of the city: rain, cars with sweeping headlights, lightning, glow/pool/smear batches.
import * as THREE from 'three';
import { rainMaterial, glowMaterial, poolMaterial, smearMaterial, beamMaterial, facadeMaterial } from './materials.js';
import { GeoBuilder } from './builder.js';
import { sedan } from './street.js';
import { col, rng } from './util.js';

/** A batch of camera-facing / ground quads driven by per-instance attributes. */
export function quadBatch(material, count, attrs, { smear = false } = {}) {
  const base = new THREE.PlaneGeometry(1, 1);
  if (smear) base.translate(0, 0.5, 0);
  const g = new THREE.InstancedBufferGeometry();
  g.index = base.index;
  g.setAttribute('position', base.getAttribute('position'));
  g.setAttribute('uv', base.getAttribute('uv'));
  const out = {};
  for (const [name, size] of Object.entries(attrs)) {
    const a = new THREE.InstancedBufferAttribute(new Float32Array(count * size), size);
    a.setUsage(THREE.DynamicDrawUsage);
    g.setAttribute(name, a);
    out[name] = a;
  }
  g.instanceCount = 0;
  const mesh = new THREE.Mesh(g, material);
  mesh.frustumCulled = false;
  mesh.layers.set(1);
  return { mesh, attrs: out, capacity: count, geometry: g };
}

/** Static + dynamic light sprites (glow billboards, ground pools, road reflection smears). */
export function createLightBatches(shared, capacity = 900) {
  const glows = quadBatch(glowMaterial(shared), capacity, { iPos: 4, iCol: 4 });
  const pools = quadBatch(poolMaterial(shared), capacity, { iPos: 4 });
  const smears = quadBatch(smearMaterial(shared), capacity, { iPos: 4, iCol: 4 }, { smear: true });
  glows.mesh.renderOrder = 5;
  pools.mesh.renderOrder = 1;
  smears.mesh.renderOrder = 1;
  let nStaticG = 0, nStaticP = 0, nStaticS = 0;
  let nG = 0, nP = 0, nS = 0;
  const api = {
    meshes: [glows.mesh, pools.mesh, smears.mesh],
    glow(x, y, z, size, c, flicker = 0) {
      if (nG >= capacity) return;
      glows.attrs.iPos.setXYZW(nG, x, y, z, size);
      glows.attrs.iCol.setXYZW(nG, c.r, c.g, c.b, flicker);
      nG++;
    },
    pool(x, z, r, intensity = 1) {
      if (nP >= capacity) return;
      pools.attrs.iPos.setXYZW(nP, x, z, r, intensity);
      nP++;
    },
    smear(x, y, z, width, c, len) {
      if (nS >= capacity) return;
      smears.attrs.iPos.setXYZW(nS, x, y, z, width);
      smears.attrs.iCol.setXYZW(nS, c.r, c.g, c.b, len);
      nS++;
    },
    /** everything added so far is static; later additions are rebuilt each frame */
    freeze() { nStaticG = nG; nStaticP = nP; nStaticS = nS; api.commit(); },
    beginDynamic() { nG = nStaticG; nP = nStaticP; nS = nStaticS; },
    commit() {
      glows.geometry.instanceCount = nG; pools.geometry.instanceCount = nP; smears.geometry.instanceCount = nS;
      for (const b of [glows, pools, smears]) for (const a of Object.values(b.attrs)) a.needsUpdate = true;
    },
    dispose() { for (const b of [glows, pools, smears]) { b.geometry.dispose(); b.mesh.material.dispose(); } },
  };
  return api;
}

/** Instanced rain streaks that wrap around the camera. */
export function createRain(shared, count) {
  const base = new THREE.PlaneGeometry(1, 1);
  base.translate(0, 0.5, 0);
  const g = new THREE.InstancedBufferGeometry();
  g.index = base.index;
  g.setAttribute('position', base.getAttribute('position'));
  const off = new Float32Array(count * 4);
  const r = rng(99);
  for (let i = 0; i < count; i++) { off[i * 4] = r(); off[i * 4 + 1] = r(); off[i * 4 + 2] = r(); off[i * 4 + 3] = r(); }
  g.setAttribute('aOff', new THREE.InstancedBufferAttribute(off, 4));
  g.instanceCount = count;
  const mat = rainMaterial(shared);
  const mesh = new THREE.Mesh(g, mat);
  mesh.frustumCulled = false;
  mesh.layers.set(1);
  mesh.renderOrder = 8;
  return {
    mesh, mat,
    setCount(n) { g.instanceCount = Math.min(n, count); },
    dispose() { g.dispose(); mat.dispose(); },
  };
}

/** Cars: a body, two headlight cones, glows + a moving pool, following a looping polyline. */
export function createCars(shared, plan, lights) {
  const b = new GeoBuilder();
  // one body mesh per car so we can move them independently
  const bodyGeo = (() => { sedan(b, 0, 0, 0, col('ink-3')); return b.build(); })();
  const mat = facadeMaterial(shared);
  const beamMat = beamMaterial(shared, col('cream').lerp(col('gold-hot'), 0.4), 0.16);
  const beamGeo = new THREE.CylinderGeometry(3.6, 0.22, 26, 14, 1, true);
  beamGeo.translate(0, 13, 0);
  beamGeo.rotateX(Math.PI / 2 + 0.07);
  const head = col('gold-hot').lerp(col('cream'), 0.35);
  const tail = col('alarm').multiplyScalar(0.8);
  const group = new THREE.Group();
  const cars = [];
  const add = (path, speed, { loop = true, delay = 0, beams = true } = {}) => {
    const m = new THREE.Group();
    const body = new THREE.Mesh(bodyGeo, mat);
    m.add(body);
    if (beams) for (const sx of [-0.7, 0.7]) {
      const bm = new THREE.Mesh(beamGeo, beamMat);
      bm.position.set(sx, 0.75, 2.4);
      bm.layers.set(1);
      m.add(bm);
    }
    group.add(m);
    const segs = [];
    let total = 0;
    for (let i = 0; i < path.length - 1; i++) {
      const a = path[i], c = path[i + 1];
      const len = Math.hypot(c[0] - a[0], c[1] - a[1]);
      segs.push({ a, c, len, start: total });
      total += len;
    }
    cars.push({ m, segs, total, speed, loop, delay, visible: true });
  };
  const { ax, camZ, aveEndZ } = plan;
  // oncoming car down the avenue: its beams sweep across the lens
  add([[ax - 5, aveEndZ + 20], [ax - 5, camZ + 60]], 17, { delay: 2 });
  // one heading away toward the tower
  add([[ax + 5, camZ + 20], [ax + 5, aveEndZ + 10]], 12, { delay: 0 });
  // a cross-street car whose beams rake over the avenue
  const crossZ = plan.z0 + Math.round((camZ - 170 - plan.z0) / plan.BD) * plan.BD;
  add([[ax + 260, crossZ - 3], [ax - 260, crossZ - 3]], 15, { delay: 5 });
  // city traffic for the overhead view
  const r = rng(5);
  for (let i = 0; i < 9; i++) {
    const kx = r.int(-6, 6), kz = r.int(-5, 6);
    const horizontal = r() < 0.5;
    const x = ax + kx * plan.BW, z = plan.z0 + kz * plan.BD;
    const lane = r() < 0.5 ? 3 : -3;
    const L = 300 + r() * 200;
    const dir = r() < 0.5 ? 1 : -1;
    if (horizontal) add([[x - (dir * L) / 2, z + lane], [x + (dir * L) / 2, z + lane]], 10 + r() * 8, { delay: r() * 10 });
    else add([[x + lane, z - (dir * L) / 2], [x + lane, z + (dir * L) / 2]], 10 + r() * 8, { delay: r() * 10 });
  }
  const tmp = new THREE.Vector3();
  return {
    group,
    update(t) {
      for (const c of cars) {
        const period = c.total / c.speed + 4;
        let tt = (t - c.delay) % period;
        if (tt < 0) tt += period;
        const d = tt * c.speed;
        if (d > c.total) { c.m.visible = false; continue; }
        c.m.visible = true;
        const s = c.segs.find((sg) => d <= sg.start + sg.len) || c.segs[c.segs.length - 1];
        const k = (d - s.start) / s.len;
        const x = s.a[0] + (s.c[0] - s.a[0]) * k, z = s.a[1] + (s.c[1] - s.a[1]) * k;
        const ang = Math.atan2(s.c[0] - s.a[0], s.c[1] - s.a[1]);
        c.m.position.set(x, 0, z);
        c.m.rotation.y = ang;
        const fx = Math.sin(ang), fz = Math.cos(ang);
        const rx = Math.cos(ang), rz = -Math.sin(ang);
        for (const sx of [-0.7, 0.7]) {
          lights.glow(x + fx * 2.45 + rx * sx, 0.75, z + fz * 2.45 + rz * sx, 1.5, head);
          lights.glow(x - fx * 2.45 + rx * sx, 0.8, z - fz * 2.45 + rz * sx, 0.7, tail);
        }
        lights.pool(x + fx * 9, z + fz * 9, 6, 0.9);
        lights.smear(x + fx * 2.5, 0.75, z + fz * 2.5, 1.2, head, 7);
      }
      tmp.set(0, 0, 0);
    },
    dispose() { bodyGeo.dispose(); mat.dispose(); beamMat.dispose(); beamGeo.dispose(); },
  };
}

/** A jagged lightning bolt ribbon, rebuilt for every strike. */
export function createBolt(shared) {
  const mat = new THREE.MeshBasicMaterial({ color: col('cream'), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(new THREE.BufferGeometry(), mat);
  mesh.layers.set(1);
  mesh.frustumCulled = false;
  mesh.renderOrder = -5;
  return {
    mesh,
    strike(camera, target) {
      const r = Math.random;
      const dir = new THREE.Vector3().subVectors(target, camera.position).setY(0).normalize();
      const right = new THREE.Vector3(dir.z, 0, -dir.x);
      const dist = 1500 + r() * 600;
      const origin = camera.position.clone().addScaledVector(dir, dist).addScaledVector(right, (r() - 0.5) * dist * 0.9);
      const pts = [];
      let p = origin.clone().setY(camera.position.y + 900);
      const bottomY = 60;
      const steps = 18;
      for (let i = 0; i <= steps; i++) {
        pts.push(p.clone());
        p = p.clone().add(new THREE.Vector3(0, -(p.y - bottomY) / (steps - i + 1), 0)).addScaledVector(right, (r() - 0.5) * 70);
      }
      const pos = [];
      const wdt = 3.5;
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i], b = pts[i + 1];
        const w0 = wdt * (1 - i / pts.length), w1 = wdt * (1 - (i + 1) / pts.length);
        const a0 = a.clone().addScaledVector(right, -w0), a1 = a.clone().addScaledVector(right, w0);
        const b0 = b.clone().addScaledVector(right, -w1), b1 = b.clone().addScaledVector(right, w1);
        pos.push(...a0.toArray(), ...a1.toArray(), ...b1.toArray(), ...a0.toArray(), ...b1.toArray(), ...b0.toArray());
      }
      mesh.geometry.dispose();
      mesh.geometry = new THREE.BufferGeometry();
      mesh.geometry.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    },
    dispose() { mesh.geometry.dispose(); mat.dispose(); },
  };
}
