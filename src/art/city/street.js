// Foreground dressing for the home shot: the first 250 m of the avenue is where the camera looks,
// so it gets the illustrator's attention. Hydrants, news boxes, awnings with lit shop signs,
// proper car silhouettes, lamp light cones, manhole steam and fog cards between depth planes.
import * as THREE from 'three';
import { GeoBuilder } from './builder.js';
import { facadeMaterial, beamMaterial, signMaterial } from './materials.js';
import { paintedTexture } from './textures.js';
import { col, mixCol, rng, palette } from './util.js';

const NOWIN = [0, 0, 0, 0];
const GLOW = (e) => [0, 0, 0, e];

/** A 1940s sedan: fenders, tapered cabin, chrome, tail lights. Faces +z. */
export function sedan(b, x, z, rot, body) {
  b.at(x, 0, z, rot, () => {
    const chrome = col('cream-dim').multiplyScalar(0.6);
    b.set(body, NOWIN);
    b.box(0, 0.42, 0, 1.9, 0.62, 5.0);                  // body
    b.frustum(0, 1.04, -0.35, 1.8, 2.5, 1.5, 1.7, 0.66); // cabin, tapered
    b.box(0, 0.42, 1.95, 1.6, 0.75, 1.1);                // bonnet crown
    for (const sx of [-1, 1]) {                           // fenders swell over the wheels
      b.box(sx * 0.93, 0.35, 1.55, 0.34, 0.66, 1.3);
      b.box(sx * 0.93, 0.35, -1.55, 0.34, 0.66, 1.3);
    }
    b.set(col('ink'), NOWIN);
    for (const [sx, sz] of [[1, 1.55], [-1, 1.55], [1, -1.55], [-1, -1.55]]) b.box(sx * 0.9, 0.0, sz, 0.3, 0.7, 0.72);
    b.set(chrome, NOWIN);
    b.box(0, 0.3, 2.55, 1.95, 0.14, 0.12);                 // bumpers
    b.box(0, 0.3, -2.55, 1.95, 0.14, 0.12);
    b.box(0, 0.62, 2.52, 0.9, 0.3, 0.06);                  // grille
    b.set(col('teal-6'), NOWIN);
    b.box(0, 1.1, 0.88, 1.5, 0.5, 0.06);                   // windscreen
    b.set(col('alarm').multiplyScalar(0.7), GLOW(0.35));
    b.box(-0.75, 0.62, -2.53, 0.22, 0.18, 0.05);
    b.box(0.75, 0.62, -2.53, 0.22, 0.18, 0.05);
    b.set(col('cream'), GLOW(0.2));
    b.box(-0.7, 0.7, 2.53, 0.24, 0.24, 0.05);
    b.box(0.7, 0.7, 2.53, 0.24, 0.24, 0.05);
  });
}

export function buildStreet(shared, plan, lamps, noiseTex) {
  const P = palette();
  const r = rng(404);
  const b = new GeoBuilder();
  const group = new THREE.Group();
  const { ax, aveW, camZ } = plan;
  const curbX = aveW / 2;
  const walkX = curbX + 2.2;
  const zNear = camZ + 30, zFar = camZ - 260;

  // --- sidewalk furniture ---
  for (const s of [-1, 1]) {
    for (let z = zNear - 8; z > zFar; z -= 9 + r() * 14) {
      const x = ax + s * (curbX + 0.9);
      const k = r();
      if (k < 0.2) { // hydrant (ochre paint)
        b.set(mixCol('gold-deep', 'ink-3', 0.35), NOWIN);
        b.cyl(x, 0, z, 0.2, 0.7, 10);
        b.cyl(x, 0.7, z, 0.24, 0.1, 10);
        b.cone(x, 0.8, z, 0.2, 0.18, 10);
        b.box(x, 0.45, z, 0.62, 0.12, 0.12);
      } else if (k < 0.38) { // newspaper box with a lit front
        b.set(col('teal-5'), NOWIN);
        b.box(x, 0, z, 0.52, 1.05, 0.5);
        b.set(col('cream'), GLOW(0.22));
        b.box(x - s * 0.265, 0.6, z, 0.02, 0.3, 0.36);
      } else if (k < 0.52) { // trash can
        b.set(col('ink-4'), NOWIN);
        b.cyl(x, 0, z, 0.32, 0.95, 12, { r1: 0.36 });
        b.cyl(x, 0.95, z, 0.38, 0.06, 12);
      } else if (k < 0.62) { // mailbox
        b.set(col('teal-6'), NOWIN);
        b.box(x, 0.35, z, 0.5, 0.75, 0.55);
        b.cyl(x, 1.1, z, 0.25, 0.02, 10);
        b.beam([x, 0, z], [x, 0.35, z], 0.2);
      }
    }
  }

  // --- awnings + lit shop signs on the storefronts nearest the camera ---
  const SIGNS = ['Deli', 'Tailor', 'Barber', 'Liquor', 'Cafe', 'Shoes', 'Hotel Argo', 'Pharmacy', 'Radio Repair', 'Diner'];
  const signMeshes = [];
  let si = 0;
  const awnC = [col('teal-5'), mixCol('alarm', 'ink-3', 0.5), col('ink-4'), mixCol('gold-deep', 'ink-3', 0.3)];
  for (const s of [-1, 1]) {
    for (let z = zNear - 20; z > camZ - 190; z -= 16 + r() * 12) {
      const fx = ax + s * (walkX + 2.0);         // the storefront plane (lots are inset from the walk)
      const w = 6 + r() * 3;
      const c = r.pick(awnC);
      b.set(c, NOWIN);
      // slanted canvas awning with a valance
      b.at(fx, 0, z, 0, () => {
        const out = -s * 2.4;
        b.quad([0, 3.7, z - z + w / 2], [0, 3.7, -w / 2], [out, 3.0, -w / 2], [out, 3.0, w / 2], [-s * 0.3, 0.95, 0]);
        b.quad([0, 3.7, -w / 2], [0, 3.7, w / 2], [out, 3.0, w / 2], [out, 3.0, -w / 2], [s * 0.3, -0.95, 0]);
        b.box(out, 2.7, 0, 0.06, 0.32, w, { bottom: true });
      });
      if (si < SIGNS.length && r() < 0.8) {
        const tex = paintedTexture([SIGNS[si++]], { w: 512, h: 128, bg: P.ink, fg: r() < 0.5 ? P.cream : P.gold });
        const sw = Math.min(w - 0.6, 5.2);
        const m = new THREE.Mesh(new THREE.PlaneGeometry(sw, sw / 4), signMaterial(shared, tex, { strength: 1.1 }));
        m.position.set(fx - s * 0.08, 4.35, z);
        m.rotation.y = -s * Math.PI / 2;
        m.layers.set(1);
        signMeshes.push(m);
        group.add(m);
      }
    }
  }

  // --- parked cars with proper silhouettes ---
  const bodies = [col('ink-3'), col('teal-7'), mixCol('gold-deep', 'ink-3', 0.72), col('ink-4'), mixCol('alarm', 'ink-3', 0.8)];
  const tails = [];
  for (let z = camZ - 14; z > camZ - 230; z -= 10 + r() * 18) {
    if (r() < 0.35) continue;
    const s = r() < 0.5 ? -1 : 1;
    const x = ax + s * (curbX - 1.35);
    sedan(b, x, z, r() < 0.8 ? 0 : Math.PI, r.pick(bodies));
    tails.push([x, z]);
  }

  const mesh = new THREE.Mesh(b.build(), facadeMaterial(shared));
  group.add(mesh);

  // --- light cones under the avenue lamps nearest the camera ---
  const coneMat = beamMaterial(shared, col('gold-hot').lerp(col('cream'), 0.3), 0.085);
  for (const L of lamps) {
    if (!L.ave || L.hz < camZ - 320 || L.hz > camZ + 20) continue;
    const g2 = new THREE.CylinderGeometry(0.35, 4.6, 6.6, 20, 1, true);
    g2.translate(0, -3.3, 0);
    const uvA = g2.getAttribute('uv');
    for (let i = 0; i < uvA.count; i++) uvA.setY(i, 1 - uvA.getY(i)); // brightest at the lamp
    const m = new THREE.Mesh(g2, coneMat);
    m.position.set(L.hx, L.hy, L.hz);
    m.layers.set(1);
    m.renderOrder = 4;
    group.add(m);
  }

  // --- manhole steam: billboards with scrolling noise, lit gold near lamps ---
  const steamMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { ...shared, uNoise: { value: noiseTex } },
    vertexShader: /* glsl */ `
      varying vec2 vUv; varying vec3 vWP;
      void main(){
        vUv = uv;
        vec3 c = (modelMatrix * vec4(0., 0., 0., 1.)).xyz;
        vec3 right = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]);
        vec3 wp = c + right * position.x + vec3(0., 1., 0.) * position.y;
        vWP = wp;
        gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.);
      }`,
    fragmentShader: /* glsl */ `
      uniform sampler2D uNoise; uniform float uTime; uniform vec3 uFogColor, uGold, uCream;
      uniform vec4 uLamps[12]; uniform int uLampCount;
      varying vec2 vUv; varying vec3 vWP;
      void main(){
        vec2 p = vec2(vUv.x * 0.8 + sin(vUv.y * 3. + uTime * 0.7) * 0.08, vUv.y * 0.9 - uTime * 0.18);
        float n = texture2D(uNoise, p).r * 0.6 + texture2D(uNoise, p * 2.1 + 3.1).r * 0.4;
        float shape = smoothstep(0.5, 0.1, abs(vUv.x - 0.5) * (1.4 - vUv.y * 0.6)) * smoothstep(0.0, 0.12, vUv.y) * (1.0 - smoothstep(0.55, 1.0, vUv.y));
        float a = smoothstep(0.42, 0.72, n) * shape;
        a = floor(a * 3.0 + 0.5) / 3.0;                       // stepped, like cel paint
        float warm = 0.0;
        for (int i = 0; i < 12; i++){ if (i >= uLampCount) break; warm = max(warm, 1.0 - smoothstep(0.0, uLamps[i].w * 0.8, distance(uLamps[i].xyz, vWP))); }
        vec3 c = mix(uFogColor * 2.2 + uCream * 0.02, uGold * 0.45, warm);
        gl_FragColor = vec4(c, a * 0.55);
      }`,
  });
  const steamGeo = new THREE.PlaneGeometry(5, 9);
  steamGeo.translate(0, 4.5, 0);
  const steamSpots = [[ax - 2.5, camZ - 38], [ax + 5.5, camZ - 95], [ax - 6, camZ - 160]];
  for (const [x, z] of steamSpots) {
    const m = new THREE.Mesh(steamGeo, steamMat);
    m.position.set(x, 0, z);
    m.layers.set(1);
    m.renderOrder = 7;
    m.frustumCulled = false;
    group.add(m);
    b.set(col('ink'), NOWIN);
  }
  // manhole covers
  const mh = new GeoBuilder();
  mh.set(col('ink-4'), NOWIN);
  for (const [x, z] of steamSpots) mh.cyl(x, 0.02, z, 0.8, 0.04, 16);
  group.add(new THREE.Mesh(mh.build(), facadeMaterial(shared)));

  // --- fog cards: vertical sheets across the avenue at depth planes ---
  const fogMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    uniforms: { ...shared, uNoise: { value: noiseTex } },
    vertexShader: /* glsl */ `varying vec2 vUv; varying vec3 vWP; void main(){ vUv = uv; vec4 wp = modelMatrix * vec4(position, 1.); vWP = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`,
    fragmentShader: /* glsl */ `
      uniform sampler2D uNoise; uniform float uTime; uniform vec3 uFogColor;
      varying vec2 vUv; varying vec3 vWP;
      void main(){
        float n = texture2D(uNoise, vec2(vUv.x * 1.6 + uTime * 0.01, vUv.y * 0.5)).r;
        float band = smoothstep(0.0, 0.25, vUv.y) * (1.0 - smoothstep(0.35, 0.9, vUv.y));
        float a = smoothstep(0.35, 0.75, n) * band;
        gl_FragColor = vec4(uFogColor * 1.35, a * 0.28);
      }`,
  });
  for (const dz of [70, 150, 260, 400]) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(140, 60), fogMat);
    m.position.set(ax, 24, camZ - dz);
    m.layers.set(1);
    m.renderOrder = 6;
    group.add(m);
  }

  return { group, tails };
}
