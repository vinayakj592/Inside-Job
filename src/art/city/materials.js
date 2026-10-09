// Noir city shaders. Toon-stepped light, procedural lit windows with venetian blinds,
// petrol fog, wet roads with gold smears, rain, sky with clouds + moon + lightning.
// All colours come from the design tokens (see util.palette()).
import * as THREE from 'three';
import { col } from './util.js';

export const MAX_LAMPS = 12;

/** Uniforms shared by every city material: update once per frame. */
export function sharedUniforms() {
  return {
    uTime: { value: 0 },
    uFlash: { value: 0 },
    uFogColor: { value: col('teal-7').lerp(col('teal-6'), 0.35) },
    uFogDensity: { value: 0.0012 },
    uFogHeight: { value: 60 },
    uMoonDir: { value: new THREE.Vector3(-0.35, 0.55, -0.76).normalize() },
    uMoonCol: { value: col('teal-2').multiplyScalar(0.55) },
    uAmbient: { value: col('teal-4').multiplyScalar(0.55) },
    uSky: { value: col('teal-5') },
    uGold: { value: col('gold') },
    uGoldHot: { value: col('gold-hot') },
    uGoldDeep: { value: col('gold-deep') },
    uCream: { value: col('cream') },
    uLamps: { value: Array.from({ length: MAX_LAMPS }, () => new THREE.Vector4(0, -999, 0, 1)) },
    uLampCount: { value: 0 },
    uSiren: { value: 0 },
  };
}

const HASH = /* glsl */ `
float hash12(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float hash11(float p){ p = fract(p * .1031); p *= p + 33.33; p *= p + p; return fract(p); }
float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f);
  return mix(mix(hash12(i), hash12(i+vec2(1,0)), f.x), mix(hash12(i+vec2(0,1)), hash12(i+vec2(1,1)), f.x), f.y); }
float fbm(vec2 p){ float a = .5, s = 0.; for (int i = 0; i < 4; i++){ s += a * vnoise(p); p = p * 2.03 + 17.1; a *= .5; } return s; }
`;

const FOG = /* glsl */ `
uniform vec3 uFogColor; uniform float uFogDensity; uniform float uFogHeight;
vec3 applyFog(vec3 c, vec3 wp, float keep){
  float d = distance(wp, cameraPosition);
  float f = 1.0 - exp(-d * uFogDensity);
  float hf = exp(-max(wp.y, 0.) / uFogHeight);
  f = clamp(f * (0.5 + 0.5 * hf) * keep, 0., 1.);
  return mix(c, uFogColor * (0.85 + 0.3 * hf), f);
}
`;

/* ------------------------------------------------------------------ */
/* Facade: every building, prop and landmark                           */
/* ------------------------------------------------------------------ */
export function facadeMaterial(shared, extra = {}) {
  return new THREE.ShaderMaterial({
    uniforms: {
      ...shared,
      uLitMul: { value: 1 },
      uHi: { value: 0 },
      uDark: { value: 0 },
      ...extra,
    },
    vertexShader: /* glsl */ `
      attribute vec3 aCol; attribute vec4 aWin;
      varying vec3 vCol; varying vec4 vWin; varying vec3 vWP; varying vec3 vN;
      void main(){
        vec4 wp = modelMatrix * vec4(position, 1.);
        vWP = wp.xyz; vN = normalize(mat3(modelMatrix) * normal);
        vCol = aCol; vWin = aWin;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,
    fragmentShader: /* glsl */ `
      uniform float uTime, uFlash, uLitMul, uHi, uDark, uSiren;
      uniform vec3 uMoonDir, uMoonCol, uAmbient, uSky, uGold, uGoldHot, uGoldDeep, uCream;
      uniform vec4 uLamps[${MAX_LAMPS}]; uniform int uLampCount;
      varying vec3 vCol; varying vec4 vWin; varying vec3 vWP; varying vec3 vN;
      ${HASH}
      ${FOG}
      void main(){
        vec3 N = normalize(vN);
        vec3 V = normalize(cameraPosition - vWP);
        float ndl = dot(N, uMoonDir);
        float band = ndl > 0.5 ? 1.0 : (ndl > 0.08 ? 0.45 : 0.0);           // stepped moon ramp
        vec3 base = vCol;
        vec3 c = base * (uAmbient + uMoonCol * band * 2.2);
        c += base * uSky * max(N.y, 0.) * 1.4 + uMoonCol * 0.1 * max(N.y, 0.); // roofs catch the sky
        // warm street bounce: the bottom floors glow sodium, stepped not smooth
        float gb = 1.0 - smoothstep(2.0, 18.0, vWP.y);
        c += uGoldDeep * (step(0.35, gb) * 0.010 + step(0.75, gb) * 0.012) * step(abs(N.y), 0.5);
        // streetlamps nearest the camera paint gold pools onto facades
        vec3 lamp = vec3(0.);
        for (int i = 0; i < ${MAX_LAMPS}; i++){
          if (i >= uLampCount) break;
          vec3 d = uLamps[i].xyz - vWP; float dist = length(d);
          float a = clamp(1.0 - dist / uLamps[i].w, 0., 1.);
          float l = max(dot(N, d / dist), 0.);
          float s = a * a * (0.25 + 0.75 * l);
          lamp += uGold * (step(0.06, s) * 0.010 + step(0.2, s) * 0.022 + step(0.45, s) * 0.05);
        }
        c += lamp;
        float keep = 1.0;
        // windows
        if (vWin.x > 0. && abs(N.y) < 0.5){
          float style = vWin.z, seed = vWin.y;
          float u = abs(N.x) > 0.5 ? vWP.z * sign(N.x) : -vWP.x * sign(N.z);
          float v = vWP.y;
          vec2 cs = style < 0.5 ? vec2(3.3, 3.5) : style < 1.5 ? vec2(1.9, 3.5) : style < 2.5 ? vec2(4.4, 3.3) : vec2(2.6, 3.9);
          vec2 m  = style < 0.5 ? vec2(.24, .26) : style < 1.5 ? vec2(.32, .10) : style < 2.5 ? vec2(.05, .30) : vec2(.2, .18);
          vec2 g = vec2(u, v - 4.4) / cs; vec2 cell = floor(g); vec2 f = fract(g);
          float inW = step(m.x, f.x) * step(f.x, 1. - m.x) * step(m.y, f.y) * step(f.y, 1. - m.y) * step(0., g.y);
          float h1 = hash12(cell + seed * 17.3), h2 = hash12(cell * 1.7 + seed * 3.1 + 5.), h3 = hash12(cell * 2.3 + seed + 11.);
          float lit = step(h1, vWin.x * uLitMul);
          if (h2 < 0.06) lit = step(0.5, hash12(vec2(floor(uTime / (4.0 + h3 * 9.0) + h3 * 40.), seed + cell.x + cell.y * 3.)));
          float fl = 1.0;
          if (h2 > 0.975) fl = 0.35 + 0.65 * step(0.3, hash12(vec2(floor(uTime * 12.), cell.y + seed)));
          float camD = distance(vWP, cameraPosition);
          float near = 1.0 - smoothstep(60.0, 160.0, camD);
          float fw = 0.045 * near;
          float glassIn = step(m.x + fw, f.x) * step(f.x, 1. - m.x - fw) * step(m.y + fw, f.y) * step(f.y, 1. - m.y - fw);
          float wx = (f.x - m.x) / (1. - 2. * m.x), wy = (f.y - m.y) / (1. - 2. * m.y);
          float mull = style < 0.5 ? step(abs(wx - 0.5), 0.035) + step(abs(wy - 0.66), 0.03) : style > 2.5 ? step(abs(wy - 0.7), 0.03) : 0.0;
          mull = clamp(mull, 0., 1.) * near;
          float blind = 1.0;
          if (h3 > 0.55) blind = 0.62 + 0.38 * step(0.45, fract(wy * 7.0));
          if (h3 > 0.8) blind = wy > 0.5 ? 0.45 + 0.3 * step(0.5, fract(wy * 9.0)) : 1.0;
          float sil = 0.0;
          if (h2 > 0.5 && h2 < 0.53) {
            vec2 q = vec2(wx - 0.5 - (h3 - 0.5) * 0.3, wy);
            sil = max(step(length((q - vec2(0., 0.62)) * vec2(1., 0.8)), 0.1), step(abs(q.x), 0.2 - q.y * 0.1) * step(q.y, 0.48));
          }
          vec3 warm = mix(uGoldDeep, uGoldHot, h3 * 0.8);
          if (h1 < 0.012) warm = uCream * 0.55;
          else if (h2 > 0.9 && h2 < 0.93) warm = vec3(0.12, 0.32, 0.3);
          else if (h3 < 0.2) warm *= 0.5;
          vec3 wc = warm * (0.7 + 0.5 * wy) * blind * fl * (1.0 - 0.85 * sil);
          vec3 glass = c * 0.45 + uSky * 0.014 * (1. + h3) + uSky * 0.02 * step(0.8, fract(wx + wy * 0.6 + h3)) * near;
          vec3 frameC = c * 1.8 + uGoldDeep * 0.006;
          vec3 winC = lit > 0.5 ? wc * 1.25 : glass;
          winC = mix(winC, frameC * (lit > 0.5 ? 0.6 : 1.0), mull);
          c = mix(c, mix(frameC, winC, glassIn), inW);
          float sill = step(m.y - 0.07, f.y) * step(f.y, m.y - 0.015) * step(m.x - 0.06, f.x) * step(f.x, 1. - m.x + 0.06);
          c += (uMoonCol * 0.02 + uGoldDeep * 0.004) * sill * near;
          c *= 1.0 - 0.25 * step(0.965, f.y) * near * step(0., g.y);
          keep = 1.0 - 0.45 * inW * lit * glassIn;
          if (inW < 0.5) {
            float brick = step(0.9, fract(v * 3.2)) + step(0.94, fract(u * 1.6 + 0.5 * step(0.5, fract(v * 1.6)))) * step(fract(v * 3.2), 0.9);
            c *= 1.0 - 0.18 * clamp(brick, 0., 1.) * near * step(style, 2.5);
            float hatch = step(0.78, fract((u * 0.7 + v * 0.7) * 2.2));
            c *= 1.0 - 0.45 * hatch * near * step(ndl, 0.08);
          }
          // ground-floor shopfronts
          if (v < 4.2 && v > 0.7){
            float sc = floor(u / 7.0); float sf = fract(u / 7.0);
            float shop = step(0.08, sf) * step(sf, 0.92) * step(1.0, v) * step(v, 3.4) * (1.0 - step(0.94, fract(sf * 3.0)));
            float sl = step(hash12(vec2(sc, seed * 9.1)), 0.22 * uLitMul);
            vec3 sh = mix(uGoldDeep, uGold, 0.4) * (0.35 + 0.4 * (v - 1.0) / 2.4);
            c = mix(c, sl > 0.5 ? sh : c * 0.6 + uSky * 0.01, shop);
            keep = min(keep, 1.0 - 0.4 * shop * sl);
          }
        }
        // emissive gold (crowns, lamp heads, neon trims)
        c = mix(c, uGold * 1.25 + uGoldHot * 0.35, vWin.w);
        keep = min(keep, 1.0 - 0.6 * vWin.w);
        // landmark state
        float fres = pow(1.0 - abs(dot(N, V)), 2.5);
        c += uGold * uHi * (0.03 + 0.5 * fres) * (0.75 + 0.25 * sin(uTime * 3.0));
        c += uGoldDeep * uHi * 0.06 * step(0.5, N.y);
        c *= 1.0 - uDark * 0.55;
        // lightning: moon-facing planes flare cold
        c += uCream * uFlash * 0.05 * max(ndl, 0.);
        c = applyFog(c, vWP, keep);
        gl_FragColor = vec4(c, 1.);
      }`,
  });
}

/* ------------------------------------------------------------------ */
/* Ground: streets, sidewalks, wet asphalt, tram rails, crosswalks     */
/* ------------------------------------------------------------------ */
export function groundMaterial(shared, plan) {
  return new THREE.ShaderMaterial({
    uniforms: {
      ...shared,
      uGrid: { value: new THREE.Vector4(plan.ax, plan.BW, plan.z0, plan.BD) },
      uRoad: { value: new THREE.Vector3(plan.roadW, plan.aveW, plan.walk) },
      uPlaza: { value: new THREE.Vector4(plan.tower.x, plan.tower.z, plan.plazaR, plan.aveEndZ) },
      uZone: { value: new THREE.Vector4(...plan.railZone) },
      uInk2: { value: col('ink-2') },
      uInk3: { value: col('ink-3') },
      uInk4: { value: col('ink-4') },
      uCreamDim: { value: col('cream-dim') },
      uTeal1: { value: col('teal-1') },
    },
    vertexShader: /* glsl */ `
      varying vec3 vWP;
      void main(){ vec4 wp = modelMatrix * vec4(position, 1.); vWP = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`,
    fragmentShader: /* glsl */ `
      uniform float uTime, uFlash;
      uniform vec4 uGrid, uPlaza, uZone; uniform vec3 uRoad;
      uniform vec3 uInk2, uInk3, uInk4, uCreamDim, uTeal1, uSky, uGold, uCream;
      varying vec3 vWP;
      ${HASH}
      ${FOG}
      void main(){
        vec2 p = vWP.xz;
        float kx = floor((p.x - uGrid.x) / uGrid.y + 0.5);
        float dx = p.x - (uGrid.x + kx * uGrid.y);
        float kz = floor((p.y - uGrid.z) / uGrid.w + 0.5);
        float dz = p.y - (uGrid.z + kz * uGrid.w);
        bool ave = abs(kx) < 0.5 && p.y > uPlaza.w;
        float wx = (ave ? uRoad.y : uRoad.x) * 0.5;
        float wz = uRoad.x * 0.5;
        float roadX = step(abs(dx), wx), roadZ = step(abs(dz), wz);
        float road = max(roadX, roadZ);
        float walk = max(step(abs(dx), wx + uRoad.z), step(abs(dz), wz + uRoad.z)) * (1. - road);
        vec2 toPlaza = p - uPlaza.xy;
        float plaza = step(length(toPlaza), uPlaza.z) ;
        float rail = step(uZone.x, p.x) * step(p.x, uZone.z) * step(uZone.y, p.y) * step(p.y, uZone.w);
        road *= (1. - plaza) * (1. - rail);
        walk *= (1. - plaza) * (1. - rail);

        vec3 V = normalize(cameraPosition - vWP);
        float fres = pow(1.0 - clamp(V.y, 0., 1.), 5.0);
        float puddle = smoothstep(0.52, 0.6, fbm(p * 0.09));
        vec3 c = uInk2 * 0.9;                                    // lots / courtyards
        if (road > 0.5){
          c = uInk2 * 0.55;
          float wet = 0.35 + 0.65 * puddle;
          c += uSky * (0.02 + 0.5 * fres) * wet;                 // wet asphalt mirrors the sky
          // puddles: a darker, glassier mirror with rain rings rippling across it
          float nearG = 1.0 - smoothstep(30.0, 110.0, distance(vWP, cameraPosition));
          c = mix(c, uSky * (0.03 + 0.9 * fres), puddle * 0.55);
          vec2 rc = floor(p * 0.7); vec2 rf = fract(p * 0.7) - 0.5;
          float rh = hash12(rc); float rt = fract(uTime * 0.9 + rh);
          float ring = 1.0 - smoothstep(0.0, 0.035, abs(length(rf + (rh - 0.5) * 0.3) - rt * 0.42));
          c += uCream * 0.05 * ring * (1.0 - rt) * puddle * nearG;
          // avenue: dashed centre line + tram rails
          if (ave && roadZ < 0.5){
            float dash = step(abs(dx), 0.14) * step(0.5, fract(p.y / 9.0));
            c = mix(c, uCreamDim * 0.22, dash);
            float railL = step(abs(abs(dx) - 3.6), 0.07) + step(abs(abs(dx) - 5.1), 0.07);
            c = mix(c, uTeal1 * (0.05 + 0.4 * fres), clamp(railL, 0., 1.));
          } else if (roadX > 0.5 && roadZ < 0.5){
            c = mix(c, uCreamDim * 0.12, step(abs(dx), 0.1) * step(0.55, fract(p.y / 6.0)));
          }
          // crosswalk zebra at the mouth of each intersection
          float zx = step(wx, abs(dz) - wz) ;
          float nearX = roadX * step(abs(dz), wz + 5.5) * step(wz + 1.0, abs(dz));
          float nearZ = roadZ * step(abs(dx), wx + 5.5) * step(wx + 1.0, abs(dx));
          float stripeX = step(0.5, fract(dx / 1.4)) * nearX;
          float stripeZ = step(0.5, fract(dz / 1.4)) * nearZ;
          c = mix(c, uCreamDim * 0.1 + uSky * 0.05 * fres, clamp(stripeX + stripeZ, 0., 1.));
        } else if (walk > 0.5){
          c = uInk3 * 0.8;
          float tile = step(0.94, fract(p.x / 2.2)) + step(0.94, fract(p.y / 2.2));
          c *= 1.0 - 0.25 * clamp(tile, 0., 1.);
          // curb edge catches light
          float curb = step(abs(abs(dx) - wx), 0.18) * step(wz, abs(dz)) + step(abs(abs(dz) - wz), 0.18) * step(wx, abs(dx));
          c = mix(c, uInk4 * 1.6, clamp(curb, 0., 1.));
          c += uSky * 0.12 * fres * puddle;
        }
        if (plaza > 0.5){
          float r = length(toPlaza), a = atan(toPlaza.y, toPlaza.x);
          float ring = step(0.9, fract(r / 6.0)) + step(0.94, fract(a * 6.0 / 3.14159));
          c = uInk3 * (1.0 - 0.3 * clamp(ring, 0., 1.)) + uSky * 0.3 * fres;
        }
        if (rail > 0.5){
          c = uInk2 * (0.7 + 0.5 * vnoise(p * 1.7)) + uSky * 0.05 * fres;
        }
        c += uCream * uFlash * 0.02 * fres;
        c = applyFog(c, vWP, 1.0);
        gl_FragColor = vec4(c, 1.);
      }`,
  });
}

/* ------------------------------------------------------------------ */
/* Harbour water                                                       */
/* ------------------------------------------------------------------ */
export function waterMaterial(shared) {
  return new THREE.ShaderMaterial({
    uniforms: { ...shared, uInk: { value: col('ink') } },
    vertexShader: /* glsl */ `varying vec3 vWP; void main(){ vec4 wp = modelMatrix * vec4(position,1.); vWP = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`,
    fragmentShader: /* glsl */ `
      uniform float uTime, uFlash; uniform vec3 uInk, uSky, uCream;
      varying vec3 vWP;
      ${HASH}
      ${FOG}
      void main(){
        vec3 V = normalize(cameraPosition - vWP);
        float fres = pow(1.0 - clamp(V.y, 0., 1.), 4.0);
        float w = fbm(vWP.xz * vec2(0.02, 0.08) + vec2(uTime * 0.03, uTime * 0.01));
        float band = step(0.55, fract(w * 7.0));
        vec3 c = uInk * 0.6 + uSky * (0.04 + 0.35 * fres) * (0.6 + 0.6 * band);
        c += uCream * uFlash * 0.05 * fres;
        gl_FragColor = vec4(applyFog(c, vWP, 1.0), 1.);
      }`,
  });
}

/* ------------------------------------------------------------------ */
/* Sky: petrol gradient, sodium city-glow, drifting clouds, moon       */
/* ------------------------------------------------------------------ */
export function skyMaterial(shared) {
  return new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      ...shared,
      uZenith: { value: col('ink').lerp(col('teal-9'), 0.6) },
      uHorizon: { value: col('teal-6').lerp(col('teal-5'), 0.3) },
      uCloud: { value: col('teal-8') },
      uCloudLit: { value: col('teal-4') },
      uMoon: { value: new THREE.Vector3(0.13, 0.36, -0.92).normalize() },
      uBeam: { value: new THREE.Vector3(0, 1, 0) },
      uBeamOn: { value: 0 },
    },
    vertexShader: /* glsl */ `varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = (projectionMatrix * modelViewMatrix * vec4(position,1.)).xyww; }`,
    fragmentShader: /* glsl */ `
      uniform float uTime, uFlash, uBeamOn;
      uniform vec3 uZenith, uHorizon, uCloud, uCloudLit, uGoldDeep, uGold, uCream, uMoon, uBeam;
      varying vec3 vDir;
      ${HASH}
      void main(){
        vec3 d = normalize(vDir);
        float y = d.y;
        vec3 c = mix(uHorizon, uZenith, smoothstep(-0.05, 0.55, y));
        c += uGoldDeep * 0.05 * exp(-max(y, 0.) * 18.0);            // sodium haze on the low cloud
        // clouds
        vec2 cp = d.xz / (max(y, 0.0) + 0.18) * 1.1 + vec2(uTime * 0.006, uTime * 0.002);
        float cl = fbm(cp) * 0.7 + fbm(cp * 3.1 + 4.0) * 0.3;
        float cm = smoothstep(0.42, 0.62, cl) * smoothstep(-0.02, 0.12, y);
        float md = dot(d, uMoon);
        float moonLight = pow(max(md, 0.), 24.0);
        vec3 cc = mix(uCloud, uCloudLit, clamp(moonLight * 1.5 + 0.1, 0., 1.));
        // moon: flat disc, cloud-cut, with a stepped halo
        float disc = smoothstep(0.99955, 0.99965, md);
        float halo = step(0.9965, md) * 0.08 + step(0.985, md) * 0.04;
        c += uCream * (disc * 0.55 + halo * 0.5);
        c = mix(c, cc, cm * (0.85 - 0.5 * disc));
        // rim light on cloud edges near the moon
        c += uCloudLit * smoothstep(0.42, 0.5, cl) * (1. - smoothstep(0.5, 0.6, cl)) * moonLight * 0.9 * step(0.0, y);
        // searchlight hits the cloud deck
        float bh = pow(max(dot(d, uBeam), 0.), 400.0) * uBeamOn;
        c += uCream * bh * 0.25 * (0.4 + cm);
        // lightning
        c = mix(c, uCream * (0.35 + 0.65 * cm) + uCloudLit * 0.4, uFlash * (0.35 + 0.65 * cm) * smoothstep(-0.05, 0.2, y));
        gl_FragColor = vec4(c, 1.);
      }`,
  });
}

/* ------------------------------------------------------------------ */
/* Instanced billboards: lamp glows, headlights, beacons               */
/* ------------------------------------------------------------------ */
export function glowMaterial(shared) {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { ...shared },
    vertexShader: /* glsl */ `
      attribute vec4 iPos; attribute vec4 iCol;  // iPos.w = size, iCol.a = flicker seed
      varying vec2 vUv; varying vec3 vC; varying float vF; varying vec3 vWP;
      uniform float uTime;
      float h11(float p){ p = fract(p * .1031); p *= p + 33.33; p *= p + p; return fract(p); }
      void main(){
        vUv = position.xy * 2.0;
        vC = iCol.rgb;
        float fl = 1.0;
        if (iCol.a > 0.0) fl = 0.45 + 0.55 * step(0.2, h11(floor(uTime * 10.0) + iCol.a * 91.0));
        vF = fl;
        vWP = iPos.xyz;
        vec4 mv = viewMatrix * vec4(iPos.xyz, 1.0);
        mv.xy += position.xy * iPos.w;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uFogColor; uniform float uFogDensity;
      varying vec2 vUv; varying vec3 vC; varying float vF; varying vec3 vWP;
      void main(){
        float r = length(vUv);
        if (r > 1.0) discard;
        float core = 1.0 - smoothstep(0.12, 0.18, r);
        float halo = exp(-r * r * 6.0) * 0.35;
        float d = distance(vWP, cameraPosition);
        float fog = exp(-d * uFogDensity * 0.7);
        gl_FragColor = vec4(vC * (core * 1.6 + halo) * vF * fog, 1.0);
      }`,
  });
}

/* Ground pools of lamplight: stepped rings (cel light), additive */
export function poolMaterial(shared) {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
    uniforms: { ...shared },
    vertexShader: /* glsl */ `
      attribute vec4 iPos; // x, z, radius, intensity
      varying vec2 vUv; varying float vI; varying vec3 vWP;
      void main(){
        vUv = position.xy * 2.0; vI = iPos.w;
        vec3 wp = vec3(iPos.x + position.x * iPos.z * 2.0, 0.04, iPos.y + position.y * iPos.z * 2.0);
        vWP = wp;
        gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uGold, uGoldDeep; uniform float uFogDensity;
      varying vec2 vUv; varying float vI; varying vec3 vWP;
      void main(){
        float r = length(vUv);
        if (r > 1.0) discard;
        float s = step(r, 0.32) * 0.5 + step(r, 0.62) * 0.3 + step(r, 1.0) * 0.12;
        vec3 c = mix(uGoldDeep, uGold, step(r, 0.62)) * s * 0.16 * vI;
        float fog = exp(-distance(vWP, cameraPosition) * uFogDensity * 0.9);
        gl_FragColor = vec4(c * fog, 1.0);
      }`,
  });
}

/* Wet-road reflection smears: quads laid on the road, stretched toward the camera */
export function smearMaterial(shared) {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3,
    uniforms: { ...shared },
    vertexShader: /* glsl */ `
      attribute vec4 iPos;   // x, height, z, width
      attribute vec4 iCol;   // rgb, length
      varying vec2 vUv; varying vec3 vC; varying vec3 vWP;
      void main(){
        vec2 to = cameraPosition.xz - iPos.xz;
        float dist = length(to);
        vec2 d = to / max(dist, 0.001);
        vec2 perp = vec2(-d.y, d.x);
        float len = min(iCol.a, dist * 0.8);
        vec2 xz = iPos.xz + perp * position.x * iPos.w + d * (position.y * len);
        vUv = vec2(position.x * 2.0, position.y);
        vC = iCol.rgb;
        vec3 wp = vec3(xz.x, 0.05, xz.y);
        vWP = wp;
        gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      uniform float uTime; uniform float uFogDensity;
      varying vec2 vUv; varying vec3 vC; varying vec3 vWP;
      ${HASH}
      void main(){
        float across = abs(vUv.x);
        float core = 1.0 - smoothstep(0.15, 1.0, across);
        float along = vUv.y;
        float fall = (1.0 - along) * smoothstep(0.0, 0.08, along);
        // broken by ripples: horizontal bands that shimmer
        float rip = step(0.38, vnoise(vec2(vWP.x * 0.6 + across * 3.0, (vWP.z + vWP.x) * 1.4 + uTime * 1.3)));
        float fog = exp(-distance(vWP, cameraPosition) * uFogDensity * 0.8);
        gl_FragColor = vec4(vC * core * fall * (0.35 + 0.65 * rip) * 0.55 * fog, 1.0);
      }`,
  });
}

/* ------------------------------------------------------------------ */
/* Rain: streaks that wrap around the camera, gold near lamps          */
/* ------------------------------------------------------------------ */
export function rainMaterial(shared) {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: {
      ...shared,
      uBox: { value: new THREE.Vector3(90, 60, 90) },
      uCenter: { value: new THREE.Vector3() },
      uSpeed: { value: 38 },
      uLen: { value: 1.6 },
      uWidth: { value: 0.035 },
      uWind: { value: new THREE.Vector2(-0.12, 0.05) },
      uRainCol: { value: col('teal-1') },
      uAlpha: { value: 1 },
    },
    vertexShader: /* glsl */ `
      attribute vec4 aOff;
      uniform float uTime, uSpeed, uLen, uWidth; uniform vec3 uBox, uCenter; uniform vec2 uWind;
      uniform vec4 uLamps[${MAX_LAMPS}]; uniform int uLampCount;
      varying float vA; varying float vX; varying float vWarm;
      void main(){
        vec3 p = aOff.xyz * uBox;
        float sp = uSpeed * (0.8 + 0.4 * aOff.w);
        p.y = mod(p.y - uTime * sp, uBox.y);
        vec3 vel = normalize(vec3(uWind.x, -1.0, uWind.y));
        p.xz = mod(p.xz - uCenter.xz + uBox.xz * 0.5 - vel.xz * (uTime * sp), uBox.xz) + uCenter.xz - uBox.xz * 0.5;
        p.y += uCenter.y - uBox.y * 0.5;
        vec3 toCam = normalize(cameraPosition - p);
        vec3 side = normalize(cross(vel, toCam));
        vec3 wp = p + side * position.x * uWidth * (1.0 + 0.02 * distance(p, cameraPosition)) + vel * position.y * uLen;
        float warm = 0.0;
        for (int i = 0; i < ${MAX_LAMPS}; i++){
          if (i >= uLampCount) break;
          float d = distance(uLamps[i].xyz, p);
          warm = max(warm, 1.0 - smoothstep(0.0, uLamps[i].w * 0.55, d));
        }
        vWarm = warm;
        float dc = distance(wp, cameraPosition);
        vA = smoothstep(1.5, 5.0, dc) * (1.0 - smoothstep(uBox.x * 0.25, uBox.x * 0.5, dc));
        vX = position.x * 2.0;
        gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uRainCol, uGold; uniform float uAlpha;
      varying float vA; varying float vX; varying float vWarm;
      void main(){
        float a = (1.0 - abs(vX)) * vA * uAlpha;
        vec3 c = mix(uRainCol * 0.10, uGold * 0.55, vWarm);
        gl_FragColor = vec4(c * a, 1.0);
      }`,
  });
}

/* ------------------------------------------------------------------ */
/* Volumetric beams (searchlight, headlights, job-marker light shafts) */
/* ------------------------------------------------------------------ */
export function beamMaterial(shared, colour, strength = 0.2) {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { ...shared, uCol: { value: colour.clone ? colour.clone() : colour }, uStr: { value: strength } },
    vertexShader: /* glsl */ `
      varying vec3 vN; varying vec3 vWP; varying float vT;
      void main(){ vec4 wp = modelMatrix * vec4(position,1.); vWP = wp.xyz; vN = normalize(mat3(modelMatrix) * normal); vT = uv.y;
        gl_Position = projectionMatrix * viewMatrix * wp; }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uCol; uniform float uStr, uFogDensity;
      varying vec3 vN; varying vec3 vWP; varying float vT;
      void main(){
        vec3 V = normalize(cameraPosition - vWP);
        float edge = pow(abs(dot(normalize(vN), V)), 1.6);
        float along = pow(1.0 - vT, 1.4);
        float fog = exp(-distance(vWP, cameraPosition) * uFogDensity * 0.6);
        gl_FragColor = vec4(uCol * edge * along * uStr * fog, 1.0);
      }`,
  });
}

/* Neon / sign faces: a canvas texture, flat emissive, occasional stutter */
export function signMaterial(shared, texture, { flicker = 0.0, strength = 1.0 } = {}) {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    uniforms: { ...shared, uTex: { value: texture }, uFlick: { value: flicker }, uStr: { value: strength }, uOn: { value: 1 } },
    vertexShader: /* glsl */ `varying vec2 vUv; varying vec3 vWP; void main(){ vUv = uv; vec4 wp = modelMatrix * vec4(position,1.); vWP = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`,
    fragmentShader: /* glsl */ `
      uniform sampler2D uTex; uniform float uTime, uFlick, uStr, uOn, uFogDensity;
      varying vec2 vUv; varying vec3 vWP;
      ${HASH}
      void main(){
        vec4 t = texture2D(uTex, vUv);
        float st = 1.0;
        if (uFlick > 0.0){
          float k = hash12(vec2(floor(uTime * 9.0), uFlick * 13.0));
          float seg = hash12(vec2(floor(vUv.y * 7.0), floor(uTime * 3.0) + uFlick));
          st = (k < 0.07) ? 0.25 : (seg < 0.04 ? 0.35 : 1.0);
        }
        float fog = exp(-distance(vWP, cameraPosition) * uFogDensity * 0.55);
        vec3 c = t.rgb * t.rgb * uStr * st * uOn * fog; // texture is sRGB-ish: square to linear
        gl_FragColor = vec4(c, t.a);
      }`,
  });
}

/* Low mist sheets: scrolling noise texture, petrol tint */
export function mistMaterial(shared, noiseTex, { opacity = 0.35, scale = 0.004, speed = 0.004 } = {}) {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { ...shared, uNoise: { value: noiseTex }, uOp: { value: opacity }, uScale: { value: scale }, uSpeed: { value: speed } },
    vertexShader: /* glsl */ `varying vec3 vWP; void main(){ vec4 wp = modelMatrix * vec4(position,1.); vWP = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`,
    fragmentShader: /* glsl */ `
      uniform sampler2D uNoise; uniform float uTime, uOp, uScale, uSpeed, uFlash; uniform vec3 uFogColor, uCream;
      varying vec3 vWP;
      void main(){
        vec2 p = vWP.xz * uScale;
        float n = texture2D(uNoise, p + vec2(uTime * uSpeed, uTime * uSpeed * 0.4)).r;
        float n2 = texture2D(uNoise, p * 2.3 - vec2(uTime * uSpeed * 1.7, 0.)).r;
        float m = smoothstep(0.35, 0.8, n * 0.65 + n2 * 0.35);
        float d = distance(vWP, cameraPosition);
        float nearFade = smoothstep(8.0, 60.0, d);
        vec3 c = uFogColor * 1.5 + uCream * uFlash * 0.08;
        gl_FragColor = vec4(c, m * uOp * nearFade);
      }`,
  });
}
