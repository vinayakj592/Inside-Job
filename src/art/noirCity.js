// The noir city of Port Vesper, shared by the home screen (street level, looking down the avenue at
// Crane Tower) and the hub (a high three-quarter view with every target pinned).
//
//   const city = createNoirCity(canvas, { quality: 'high' | 'low', jobs })
//   city.setMode('street' | 'overhead', { instant, duration })
//   city.flyTo(jobId, { instant, duration })   city.clearFocus()
//   city.setHighlights({ [jobId]: 'locked' | 'available' | 'progress' | 'done' })
//   city.setHeat(0..100)          city.pointerParallax(x, y)   (-1..1)
//   city.projectJob(jobId) → { x, y, visible }   (CSS px, relative to the canvas)
//   city.snapshot(jobId, w, h) → Promise<dataURL>  (Polaroid of a landmark)
//   city.setFade(0..1)  city.flash()  city.onFrame(fn) → off   city.resize()  city.dispose()
//
// Shared instance (keeps one WebGL context alive between home and hub so the camera can crane):
//   acquireCity(hostEl, opts) → city      releaseCity()
import { sfx } from '../core/audio.js';
import * as THREE from 'three';
import { JOBS } from '../data/jobs.js';
import { sharedUniforms, facadeMaterial, groundMaterial, waterMaterial, skyMaterial, mistMaterial, beamMaterial, MAX_LAMPS } from './city/materials.js';
import { GeoBuilder } from './city/builder.js';
import { makePlan, buildGeneric, LANDMARK_IDS } from './city/layout.js';
import { buildLandmarks, buildAvenueDressing } from './city/landmarks.js';
import { buildStreet } from './city/street.js';
import { createPost } from './city/post.js';
import { createLightBatches, createRain, createCars, createBolt } from './city/fx.js';
import { noiseTexture } from './city/textures.js';
import { createFallbackCity } from './city/fallback.js';
import { col, clamp, lerp, easeInOut, easeOut } from './city/util.js';

const V3 = THREE.Vector3;

export function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGL2RenderingContext && c.getContext('webgl2'));
  } catch { return false; }
}

export function createNoirCity(canvas, { quality = 'high', jobs = JOBS, onLightning } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, stencil: false, powerPreference: 'high-performance' });
  renderer.setClearColor(0x000000, 1);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 16 / 9, 1, 7000);
  const U = sharedUniforms();
  const plan = makePlan(jobs);
  const disposables = [];
  const keep = (x) => { disposables.push(x); return x; };

  /* ---------------- sky, ground, water, mist ---------------- */
  const skyMat = keep(skyMaterial(U));
  skyMat.depthTest = false;
  const sky = new THREE.Mesh(keep(new THREE.SphereGeometry(5000, 32, 16)), skyMat);
  sky.renderOrder = -10;
  sky.frustumCulled = false;
  sky.layers.set(1);
  scene.add(sky);

  const gw = plan.xMax - plan.xMin + 1600, gd = plan.zMax - plan.zMin + 1600;
  const groundGeo = keep(new THREE.PlaneGeometry(gw, gd));
  groundGeo.rotateX(-Math.PI / 2);
  const ground = new THREE.Mesh(groundGeo, keep(groundMaterial(U, plan)));
  ground.position.set((plan.xMin + plan.xMax) / 2, 0, (plan.zMin + plan.zMax) / 2);
  scene.add(ground);

  const waterGeo = keep(new THREE.PlaneGeometry(3000, gd));
  waterGeo.rotateX(-Math.PI / 2);
  const water = new THREE.Mesh(waterGeo, keep(waterMaterial(U)));
  water.position.set(plan.waterX + 1500 + 4, 0.2, ground.position.z);
  scene.add(water);

  const noise = keep(noiseTexture());
  const mists = [
    { y: 2.5, op: 0.32, scale: 0.006, speed: 0.006 },
    { y: 24, op: 0.16, scale: 0.0025, speed: 0.003 },
    { y: 95, op: 0.12, scale: 0.0012, speed: 0.002 },
  ].map((m) => {
    const g = keep(new THREE.PlaneGeometry(gw, gd));
    g.rotateX(-Math.PI / 2);
    const mesh = new THREE.Mesh(g, keep(mistMaterial(U, noise, { opacity: m.op, scale: m.scale, speed: m.speed })));
    mesh.position.set(ground.position.x, m.y, ground.position.z);
    mesh.layers.set(1);
    mesh.renderOrder = 6;
    scene.add(mesh);
    return mesh;
  });

  /* ---------------- buildings ---------------- */
  const gb = new GeoBuilder();
  const { lamps, avenueLots } = buildGeneric(gb, plan, { quality });
  // quay wall along the harbour
  gb.set(col('ink-3'), [0, 0, 0, 0]);
  gb.box(plan.waterX + 2, -2, ground.position.z, 4, 3.2, gd);
  for (let z = plan.zMin; z < plan.zMax; z += 60) {
    gb.set(col('ink-4'), [0, 0, 0, 0]);
    gb.box(plan.waterX + 3, 1.2, z, 0.9, 1.2, 0.9);
  }
  const cityMat = keep(facadeMaterial(U));
  const cityMesh = new THREE.Mesh(keep(gb.build()), cityMat);
  scene.add(cityMesh);

  const landmarks = buildLandmarks(U, plan);
  for (const L of Object.values(landmarks)) {
    scene.add(L.group);
    keep(L.mesh.geometry); keep(L.mat);
  }
  const dressing = buildAvenueDressing(U, plan, avenueLots);
  scene.add(dressing.group);

  const street = buildStreet(U, plan, lamps, noise);
  scene.add(street.group);

  /* ---------------- lights: glows, pools, smears ---------------- */
  const lights = createLightBatches(U, 1400);
  lights.meshes.forEach((m) => scene.add(m));
  const lampGold = col('gold-hot').lerp(col('gold'), 0.5);
  const lampPool = [];
  for (const L of lamps) {
    lights.glow(L.hx, L.hy, L.hz, 2.4, lampGold, Math.random() < 0.04 ? Math.random() * 10 + 1 : 0);
    lights.pool(L.hx, L.hz, L.plaza ? 6 : 9, 1.1);
    lights.smear(L.hx, L.hy, L.hz, 1.1, lampGold, L.hy * 4.5);
    lampPool.push(new THREE.Vector4(L.hx, L.hy, L.hz, 17));
  }
  for (const L of Object.values(landmarks)) {
    for (const p of L.lights || []) {
      if (p.y < 32 || p.big) {
        lights.glow(p.x, p.y, p.z, p.big ? 5 : 1.6, lampGold);
        lights.pool(p.x, p.z, p.r * (p.big ? 0.8 : 0.55), p.big ? 1.2 : 0.9);
        if (p.y < 32) lights.smear(p.x, p.y, p.z, 1.3, lampGold, p.y * 4);
      }
      lampPool.push(new THREE.Vector4(p.x, p.y, p.z, p.r));
    }
  }
  for (const [x, y, z, sz] of landmarks.tower.crownGlows || []) lights.glow(x, y, z, sz, col('gold'));
  // storefront spill onto the wet sidewalk under each awning
  for (let z = plan.camZ + 10; z > plan.camZ - 200; z -= 21) for (const s of [-1, 1]) {
    lights.pool(plan.ax + s * (plan.aveW / 2 + 3), z + s * 7, 4.5, 0.55);
    lights.smear(plan.ax + s * (plan.aveW / 2 + 4), 2.2, z + s * 7, 2.2, col('gold-deep'), 10);
  }
  lights.freeze();

  /* ---------------- rain, cars, lightning, beacons ---------------- */
  const rainMax = 9000;
  const rain = createRain(U, rainMax);
  scene.add(rain.mesh);
  const cars = createCars(U, plan, lights);
  scene.add(cars.group);
  const bolt = createBolt(U);
  bolt.mesh.visible = false;
  scene.add(bolt.mesh);

  const beaconGeo = keep(new THREE.CylinderGeometry(5, 3, 220, 16, 1, true));
  beaconGeo.translate(0, 110, 0);
  const beacons = {};
  const beaconFor = (id) => {
    if (beacons[id]) return beacons[id];
    const L = landmarks[id];
    const m = new THREE.Mesh(beaconGeo, keep(beamMaterial(U, col('gold'), 0.0)));
    m.position.set(L.center.x, L.top * (id === 'tower' ? 0.85 : 0.6), L.center.z);
    m.layers.set(1);
    scene.add(m);
    beacons[id] = m;
    return m;
  };

  /* ---------------- post ---------------- */
  const post = createPost(renderer, scene, camera, { quality });

  /* ---------------- camera rig ---------------- */
  const T = plan.tower;
  const cur = { pos: new V3(plan.ax + 2.6, 2.4, plan.camZ + 36), look: new V3(plan.ax - 1, 88, T.z), fov: 42 };
  const par = new THREE.Vector2(), parT = new THREE.Vector2();
  let mode = 'street', modeT0 = performance.now(), focusId = null;
  let tw = null;
  let aspect = 16 / 9;

  const streetPose = (now) => {
    const k = easeOut(clamp((now - modeT0) / 50000, 0, 1));
    const z = plan.camZ + 36 - 52 * k;
    return {
      pos: new V3(plan.ax + 2.6 + par.x * 1.4, 2.4 + par.y * 0.6, z),
      look: new V3(plan.ax - 1.5 + par.x * 5, 86 + par.y * 3, T.z),
      fov: aspect < 1.2 ? 58 : 42,
    };
  };
  // frame the bounding box of every target, from the south-south-east, high three-quarter
  const bb = new THREE.Box3();
  for (const L of Object.values(landmarks)) bb.expandByPoint(L.center);
  const bbC = bb.getCenter(new V3());
  const bbW = bb.max.x - bb.min.x + 160;
  const overheadPose = (now) => {
    const s = Math.sin(now * 0.00005) * 0.04;
    const fit = Math.max(1, (bbW / aspect) / 470);
    const D = 860 * fit;
    const pitch = 0.54, yaw = 0.2 + s + par.x * 0.03;
    const look = new V3(bbC.x + 30 + par.x * 6, 20, bbC.z - 40);
    return {
      pos: look.clone().add(new V3(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch) + par.y * 0.01, Math.cos(yaw) * Math.cos(pitch)).multiplyScalar(D)),
      look,
      fov: 40,
    };
  };
  const focusPose = (id) => {
    const L = landmarks[id];
    if (!L) return overheadPose(performance.now());
    const h = L.top;
    const dist = id === 'tower' ? 380 : id === 'penthouse' ? 250 : id === 'rail' ? 230 : 150 + h * 0.8;
    const c = L.center;
    const lookY = id === 'tower' ? 150 : id === 'penthouse' ? 90 : h * 0.4;
    // the dossier covers the right of the screen: frame the landmark left of centre
    const shift = aspect > 1.2 ? dist * 0.3 : 0;
    return {
      pos: new V3(c.x - dist * 0.16 + shift + par.x * 6, lookY + dist * 0.4 + par.y * 4, c.z + dist * 0.95),
      look: new V3(c.x + shift, lookY, c.z),
      fov: 38,
    };
  };
  const targetPose = (now) => (focusId ? focusPose(focusId) : mode === 'street' ? streetPose(now) : overheadPose(now));
  const startTween = (dur, arc = 0) => {
    tw = { from: { pos: cur.pos.clone(), look: cur.look.clone(), fov: cur.fov }, t0: performance.now(), dur, arc };
  };

  /* ---------------- state ---------------- */
  let fade = 1, fadeT = 1;
  let flashT = -1e9, nextFlash = performance.now() + 6000 + Math.random() * 6000;
  let heat = 0;
  let highlights = {};
  const frameFns = new Set();
  let raf = 0, running = false, lastT = performance.now(), lampTimer = 0;
  const start = performance.now();
  let pixelRatio = 1;

  function applyQuality(q) {
    quality = q;
    const dpr = window.devicePixelRatio || 1;
    pixelRatio = q === 'high' ? Math.min(dpr, 1.5) : Math.min(dpr, 1) * 0.7;
    rain.setCount(q === 'high' ? rainMax : 2400);
    post.setQuality(q);
    resize();
  }

  function resize() {
    const w = canvas.clientWidth || canvas.parentElement?.clientWidth || innerWidth;
    const h = canvas.clientHeight || canvas.parentElement?.clientHeight || innerHeight;
    aspect = w / h;
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(w, h, false);
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
    post.setSize(w, h, pixelRatio);
  }

  const flashEnv = (dt) => {
    if (dt < 0 || dt > 900) return 0;
    if (dt < 70) return 1;
    if (dt < 140) return 0.25;
    if (dt < 230) return 0.85;
    return 0.85 * Math.exp(-(dt - 230) / 160);
  };

  function strike() {
    flashT = performance.now();
    bolt.strike(camera, cur.look);
    onLightning?.();
    // thunder arrives after the light, like it does in life
    setTimeout(() => { if (!document.hidden) sfx('thunder'); }, 1000 + Math.random() * 1500);
  }

  const fwd = new V3();
  function pickLamps() {
    camera.getWorldDirection(fwd);
    const fp = camera.position.clone().addScaledVector(fwd, mode === 'street' && !focusId ? 40 : 120);
    fp.y = 0;
    const scored = lampPool.map((l) => [l, (l.x - fp.x) ** 2 + (l.z - fp.z) ** 2 + (l.y - 5) ** 2 * 0.2]).sort((a, b) => a[1] - b[1]);
    const n = Math.min(MAX_LAMPS, scored.length);
    for (let i = 0; i < MAX_LAMPS; i++) U.uLamps.value[i].copy(i < n ? scored[i][0] : new THREE.Vector4(0, -999, 0, 1));
    U.uLampCount.value = n;
  }

  const sirenGlows = [];
  {
    const r = [[-1, 1], [2, 2], [4, -1], [-3, -2]];
    for (const [kx, kz] of r) sirenGlows.push(new V3(plan.ax + kx * plan.BW + 3, 1.6, plan.z0 + kz * plan.BD + 3));
  }
  const red = col('alarm'), blue = new THREE.Color(0x2b5fd9);
  const beamDir = new V3();

  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.1, (now - lastT) / 1000);
    lastT = now;
    const t = (now - start) / 1000;
    U.uTime.value = t;

    // camera
    par.lerp(parT, 1 - Math.exp(-dt * 2.5));
    const tp = targetPose(now);
    if (tw) {
      const k = clamp((now - tw.t0) / tw.dur, 0, 1);
      const e = easeInOut(k);
      cur.pos.lerpVectors(tw.from.pos, tp.pos, e);
      cur.pos.y += tw.arc * Math.sin(Math.PI * e);
      cur.look.lerpVectors(tw.from.look, tp.look, e);
      cur.fov = lerp(tw.from.fov, tp.fov, e);
      if (k >= 1) tw = null;
    } else {
      const a = 1 - Math.exp(-dt * 6);
      cur.pos.lerp(tp.pos, a);
      cur.look.lerp(tp.look, a);
      cur.fov = lerp(cur.fov, tp.fov, a);
    }
    camera.position.copy(cur.pos);
    camera.lookAt(cur.look);
    if (Math.abs(camera.fov - cur.fov) > 0.01) { camera.fov = cur.fov; camera.updateProjectionMatrix(); }
    sky.position.copy(camera.position);

    // fog by altitude: thinner air when looking down from above
    const alt = clamp((camera.position.y - 10) / 400, 0, 1);
    U.uFogDensity.value = lerp(0.00125, 0.00042, alt);
    U.uFogHeight.value = lerp(60, 120, alt);
    post.uniforms.uFogDensity.value = U.uFogDensity.value;
    post.uniforms.uRainAmt.value = lerp(0.25, 1, alt);
    post.uniforms.uHalftone.value = lerp(1, 0.55, alt);
    post.uniforms.uAlt.value = alt;
    cityMat.uniforms.uLitMul.value = lerp(1, 0.5, alt);
    rain.mat.uniforms.uCenter.value.copy(camera.position);
    rain.mat.uniforms.uAlpha.value = lerp(1, 0.35, alt);

    // lightning
    if (now > nextFlash) { strike(); nextFlash = now + 9000 + Math.random() * 11000; }
    const fl = flashEnv(now - flashT);
    U.uFlash.value = fl;
    post.uniforms.uFlash.value = fl;
    bolt.mesh.visible = fl > 0.5;

    // searchlight on Crane Tower + gala lights
    for (const L of Object.values(landmarks)) {
      for (const bm of L.beams || []) {
        if (bm.userData.search) {
          bm.rotation.y = t * 0.22;
          bm.rotation.z = 0.5 + Math.sin(t * 0.13) * 0.12;
          bm.updateMatrixWorld();
          beamDir.set(0, 1, 0).applyQuaternion(bm.quaternion).normalize();
          skyMat.uniforms.uBeam.value.copy(beamDir);
          skyMat.uniforms.uBeamOn.value = 1;
        } else if (bm.userData.sway) {
          const sw = bm.userData.sway;
          bm.rotation.z = sw.base + Math.sin(t * 0.35 + sw.s) * 0.35;
          bm.rotation.x = Math.cos(t * 0.27 + sw.s * 2) * 0.12 - 0.1;
        }
      }
    }

    // dynamic lights
    lights.beginDynamic();
    cars.update(t);
    for (const [id, st] of Object.entries(highlights)) {
      const L = landmarks[id];
      if (!L) continue;
      if (st === 'available' || st === 'progress') {
        const pulse = st === 'progress' ? 0.75 + 0.25 * Math.sin(t * 4) : 1;
        lights.pool(L.center.x, L.center.z, id === 'rail' ? 90 : 34, 0.9 * pulse);
      }
    }
    if (U.uSiren.value > 0) {
      const ph = Math.floor(t * 4) % 2;
      const sz = 3.2 + alt * 16;
      sirenGlows.forEach((p, i) => {
        lights.glow(p.x - 0.5, p.y, p.z, sz, (ph + i) % 2 ? red : blue);
        lights.glow(p.x + 0.5, p.y, p.z, sz, (ph + i) % 2 ? blue : red);
      });
    }
    lights.commit();

    lampTimer -= dt;
    if (lampTimer <= 0) { pickLamps(); lampTimer = 0.2; }

    fade = lerp(fade, fadeT, 1 - Math.exp(-dt * 2.2));
    post.uniforms.uFade.value = fade;
    post.uniforms.uTime.value = t;
    post.uniforms.uSiren.value = U.uSiren.value;
    post.render();
    for (const fn of frameFns) fn(t);
  }

  function run() {
    if (running || document.hidden) return;
    running = true;
    lastT = performance.now();
    raf = requestAnimationFrame(frame);
  }
  function stop() {
    running = false;
    cancelAnimationFrame(raf);
  }
  const onVis = () => (document.hidden ? stop() : run());
  document.addEventListener('visibilitychange', onVis);
  const onResize = () => resize();
  addEventListener('resize', onResize);

  applyQuality(quality);
  pickLamps();
  run();

  const project = (v) => {
    const p = v.clone().project(camera);
    const w = canvas.clientWidth, h = canvas.clientHeight;
    return { x: ((p.x + 1) / 2) * w, y: ((1 - p.y) / 2) * h, visible: p.z < 1 && p.z > -1 && Math.abs(p.x) < 1.3 && Math.abs(p.y) < 1.3 };
  };

  const api = {
    kind: 'webgl',
    plan,
    get mode() { return mode; },
    setMode(m, { instant = false, duration } = {}) {
      const prevFocus = focusId;
      if (m === mode && !focusId && !instant) return;
      const up = m === 'overhead' && mode === 'street';
      mode = m;
      focusId = null;
      modeT0 = performance.now();
      if (instant) { tw = null; const p = targetPose(modeT0); cur.pos.copy(p.pos); cur.look.copy(p.look); cur.fov = p.fov; return; }
      startTween(duration ?? (up ? 3200 : prevFocus ? 1600 : 2600), up ? 120 : 0);
    },
    flyTo(id, { instant = false, duration = 1700 } = {}) {
      if (!landmarks[id]) return;
      const from = focusId;
      focusId = id;
      if (instant) { tw = null; const p = focusPose(id); cur.pos.copy(p.pos); cur.look.copy(p.look); cur.fov = p.fov; return; }
      startTween(duration, from ? 60 : 25);
    },
    clearFocus({ duration = 1500 } = {}) {
      if (!focusId) return;
      focusId = null;
      startTween(duration, 20);
    },
    get focus() { return focusId; },
    setHighlights(map = {}) {
      highlights = { ...map };
      for (const id of LANDMARK_IDS) {
        const L = landmarks[id];
        const st = highlights[id];
        const u = L.mat.uniforms;
        u.uLitMul.value = st === 'locked' ? 0.25 : st === 'available' || st === 'progress' ? 1.6 : 1;
        u.uDark.value = st === 'locked' ? 0.6 : 0;
        u.uHi.value = st === 'available' ? 0.35 : st === 'progress' ? 0.5 : 0;
        const on = st === 'available' || st === 'progress';
        if (on || beacons[id]) {
          const bm = beaconFor(id);
          bm.material.uniforms.uStr.value = on ? (st === 'progress' ? 0.2 : 0.15) : 0;
          bm.visible = on;
        }
        for (const s of L.signs || []) if (s.material.uniforms?.uOn) s.material.uniforms.uOn.value = st === 'locked' ? 0.25 : 1;
      }
    },
    setHeat(h) {
      heat = clamp(h, 0, 100);
      U.uSiren.value = heat > 70 ? clamp((heat - 70) / 25, 0.45, 1) : 0;
    },
    pointerParallax(x, y) { parT.set(clamp(x, -1, 1), clamp(y, -1, 1)); },
    projectJob(id) {
      const L = landmarks[id];
      return L ? project(L.anchor) : { x: 0, y: 0, visible: false };
    },
    projectPoint(x, y, z) { return project(new V3(x, y, z)); },
    debug() { return { running, hidden: document.hidden, lastT, pnow: performance.now(), twd: tw && { t0: tw.t0, dur: tw.dur, from: tw.from.pos.toArray() }, mode, focusId, tw: !!tw, cur: cur.pos.toArray(), look: cur.look.toArray(), tp: targetPose(performance.now()).pos.toArray(), par: par.toArray(), bbC: bbC.toArray(), aspect2: aspect, cam: camera.position.toArray(), aspect: camera.aspect, cw: canvas.clientWidth, ch: canvas.clientHeight, w: canvas.width, h: canvas.height, sites: plan.sites, anchor: landmarks.pawn.anchor.toArray() }; },
    landmark(id) { const L = landmarks[id]; return L ? { center: L.center.clone(), top: L.top } : null; },
    async snapshot(id, w = 560, h = 440) {
      const L = landmarks[id];
      if (!L) return null;
      const cam = new THREE.PerspectiveCamera(L.shot.fov || 50, w / h, 1, 7000);
      cam.position.set(...L.shot.pos);
      cam.lookAt(...L.shot.look);
      const rt = new THREE.WebGLRenderTarget(w, h, { type: THREE.UnsignedByteType });
      const snap = createPost(renderer, scene, cam, { quality: 'high', toScreen: false, target: rt });
      snap.setSize(w, h, 1);
      Object.assign(snap.uniforms.uFogDensity, { value: 0.0009 });
      snap.uniforms.uRainAmt.value = 0.15;
      snap.uniforms.uTime.value = U.uTime.value;
      const skyPos = sky.position.clone();
      sky.position.copy(cam.position);
      const oldFog = U.uFogDensity.value;
      U.uFogDensity.value = 0.0009;
      pickLampsAround(L.center);
      snap.render();
      sky.position.copy(skyPos);
      U.uFogDensity.value = oldFog;
      const buf = new Uint8Array(w * h * 4);
      renderer.readRenderTargetPixels(snap.composer.readBuffer, 0, 0, w, h, buf);
      renderer.setRenderTarget(null);
      snap.dispose();
      rt.dispose();
      pickLamps();
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      const g = c.getContext('2d');
      const id2 = g.createImageData(w, h);
      for (let y = 0; y < h; y++) id2.data.set(buf.subarray((h - 1 - y) * w * 4, (h - y) * w * 4), y * w * 4);
      g.putImageData(id2, 0, 0);
      return c.toDataURL('image/jpeg', 0.86);
    },
    setFade(v, { instant = false } = {}) { fadeT = clamp(v, 0, 1); if (instant) fade = fadeT; },
    flash() { strike(); nextFlash = performance.now() + 9000 + Math.random() * 9000; },
    onFrame(fn) { frameFns.add(fn); return () => frameFns.delete(fn); },
    setQuality(q) { applyQuality(q); },
    resize,
    pause: stop,
    resume: run,
    dispose() {
      stop();
      document.removeEventListener('visibilitychange', onVis);
      removeEventListener('resize', onResize);
      frameFns.clear();
      scene.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
        for (const m of mats) {
          for (const u of Object.values(m.uniforms || {})) if (u.value?.isTexture && u.value !== noise) u.value.dispose();
          m.dispose();
        }
      });
      disposables.forEach((d) => d.dispose?.());
      lights.dispose(); rain.dispose(); cars.dispose(); bolt.dispose();
      post.dispose();
      renderer.dispose();
      renderer.forceContextLoss?.();
    },
  };

  function pickLampsAround(c) {
    const scored = lampPool.map((l) => [l, (l.x - c.x) ** 2 + (l.z - c.z) ** 2]).sort((a, b) => a[1] - b[1]);
    const n = Math.min(MAX_LAMPS, scored.length);
    for (let i = 0; i < n; i++) U.uLamps.value[i].copy(scored[i][0]);
    U.uLampCount.value = n;
  }

  return api;
}

/* ------------------------------------------------------------------ */
/* One city shared by home and hub                                     */
/* ------------------------------------------------------------------ */
let sharedCity = null;

export function acquireCity(host, opts = {}) {
  if (sharedCity) {
    clearTimeout(sharedCity.timer);
    host.prepend(sharedCity.el);
    sharedCity.city.resize();
    sharedCity.city.resume?.();
    if (opts.quality && opts.quality !== sharedCity.quality) { sharedCity.city.setQuality?.(opts.quality); sharedCity.quality = opts.quality; }
    return { city: sharedCity.city, reused: true };
  }
  let city, el;
  if (webglAvailable()) {
    el = document.createElement('canvas');
    el.className = 'noir-city';
    Object.assign(el.style, { position: 'absolute', inset: '0', width: '100%', height: '100%', display: 'block' });
    host.prepend(el);
    try {
      city = createNoirCity(el, opts);
    } catch (e) {
      console.warn('[noirCity] WebGL failed, using the paper fallback', e);
      el.remove();
      city = null;
    }
  }
  if (!city) {
    el = document.createElement('div');
    el.className = 'noir-city noir-city--paper';
    host.prepend(el);
    city = createFallbackCity(el, opts);
  }
  sharedCity = { city, el, timer: null, quality: opts.quality };
  if (import.meta.env.DEV) window.__city = city;
  return { city, reused: false };
}

/** Let go of the shared city. It is kept alive briefly so the next screen can pick it up. */
export function releaseCity({ keepMs = 1800 } = {}) {
  if (!sharedCity) return;
  const s = sharedCity;
  s.city.pause?.();
  s.timer = setTimeout(() => {
    if (sharedCity !== s) return;
    sharedCity = null;
    try { s.city.dispose(); } catch (e) { console.warn(e); }
    s.el.remove();
  }, keepMs);
}
