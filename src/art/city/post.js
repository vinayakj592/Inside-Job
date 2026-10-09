// Print-look post-processing, built on EffectComposer:
//   CityScenePass   renders colour + float depth (+ view normals on 'high') into its own targets
//   ShaderPass      composite: ink outlines from depth/normal discontinuities, a teal key-line plate
//                   printed off-register, gold ghost plate on the lights, mid-tone halftone screen,
//                   screen-space rain, siren sweep, lightning, vignette and grain.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { Pass } from 'three/addons/postprocessing/Pass.js';
import { col, SIREN_BLUE } from './util.js';

class CityScenePass extends Pass {
  constructor(scene, camera, { normals = true } = {}) {
    super();
    this.scene = scene;
    this.camera = camera;
    this.normals = normals;
    this.needsSwap = false;
    this.clearColor = new THREE.Color(0, 0, 0);
    const depth = new THREE.DepthTexture(4, 4, THREE.FloatType);
    this.rtColor = new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType, depthTexture: depth, depthBuffer: true });
    this.rtNormal = new THREE.WebGLRenderTarget(4, 4, { type: THREE.UnsignedByteType, depthBuffer: true });
    this.normalMat = new THREE.MeshNormalMaterial();
  }
  setSize(w, h) {
    this.rtColor.setSize(w, h);
    this.rtNormal.setSize(w, h);
  }
  render(renderer) {
    const cam = this.camera;
    const oldAuto = renderer.autoClear;
    renderer.autoClear = true;
    renderer.setClearColor(this.clearColor, 1);
    cam.layers.enableAll();
    renderer.setRenderTarget(this.rtColor);
    renderer.render(this.scene, cam);
    if (this.normals) {
      cam.layers.set(0);
      const bg = this.scene.background;
      this.scene.overrideMaterial = this.normalMat;
      renderer.setClearColor(0x000000, 1);
      renderer.setRenderTarget(this.rtNormal);
      renderer.render(this.scene, cam);
      this.scene.overrideMaterial = null;
      this.scene.background = bg;
      cam.layers.enableAll();
    }
    renderer.autoClear = oldAuto;
  }
  dispose() {
    this.rtColor.depthTexture?.dispose();
    this.rtColor.dispose();
    this.rtNormal.dispose();
    this.normalMat.dispose();
  }
}

const CompositeShader = {
  uniforms: {
    tColor: { value: null }, tDepth: { value: null }, tNormal: { value: null },
    uRes: { value: new THREE.Vector2(1, 1) },
    uPx: { value: 1 },
    uNear: { value: 1 }, uFar: { value: 6000 },
    uTime: { value: 0 }, uFlash: { value: 0 }, uSiren: { value: 0 }, uAlt: { value: 0 },
    uExposure: { value: 1 }, uFade: { value: 1 },
    uUseNormal: { value: 1 }, uHalftone: { value: 1 }, uReg: { value: 1 }, uRainAmt: { value: 0.35 },
    uFogDensity: { value: 0.0012 },
    uInk: { value: new THREE.Color() }, uTeal: { value: new THREE.Color() }, uFog: { value: new THREE.Color() },
    uGold: { value: new THREE.Color() }, uCream: { value: new THREE.Color() },
    uRed: { value: new THREE.Color() }, uBlue: { value: new THREE.Color() },
  },
  vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: /* glsl */ `
    #include <packing>
    uniform sampler2D tColor, tDepth, tNormal;
    uniform vec2 uRes; uniform float uAlt, uPx, uNear, uFar, uTime, uFlash, uSiren, uExposure, uFade, uUseNormal, uHalftone, uReg, uRainAmt, uFogDensity;
    uniform vec3 uInk, uTeal, uFog, uGold, uCream, uRed, uBlue;
    varying vec2 vUv;

    float hash12(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
    vec3 toSRGB(vec3 c){ c = max(c, 0.0); return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c)); }
    vec3 toLin(vec3 c){ return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(0.04045, c)); }

    float viewDist(vec2 uv){
      float d = texture2D(tDepth, uv).x;
      if (d >= 0.999999) return 1e6;
      return -perspectiveDepthToViewZ(d, uNear, uFar);
    }
    float invz(vec2 uv){ float d = viewDist(uv); return d > 9e5 ? 0.0 : 1.0 / d; }

    float edgeAt(vec2 uv){
      vec2 px = uPx / uRes;
      float c = invz(uv);
      float l = invz(uv - vec2(px.x, 0.)), r = invz(uv + vec2(px.x, 0.));
      float u = invz(uv + vec2(0., px.y)), d = invz(uv - vec2(0., px.y));
      float lap = abs(l + r + u + d - 4.0 * c);
      float e = smoothstep(0.035, 0.09, lap / max(max(c, max(max(l, r), max(u, d))), 1e-5));
      if (uUseNormal > 0.5){
        vec3 n0 = texture2D(tNormal, uv).xyz * 2. - 1.;
        vec3 n1 = texture2D(tNormal, uv + vec2(px.x, 0.)).xyz * 2. - 1.;
        vec3 n2 = texture2D(tNormal, uv + vec2(0., px.y)).xyz * 2. - 1.;
        vec3 n3 = texture2D(tNormal, uv - vec2(px.x, 0.)).xyz * 2. - 1.;
        vec3 n4 = texture2D(tNormal, uv - vec2(0., px.y)).xyz * 2. - 1.;
        float nd = (1. - dot(n0, n1)) + (1. - dot(n0, n2)) + (1. - dot(n0, n3)) + (1. - dot(n0, n4));
        e = max(e, smoothstep(0.35, 0.8, nd));
      }
      return e;
    }

    float rainLayer(vec2 fc, float scale, float speed, float seed){
      vec2 p = fc / uPx;
      p.x += p.y * 0.14;
      float cw = 7.0 * scale;
      float cx = floor(p.x / cw);
      float r = hash12(vec2(cx, seed));
      if (r > 0.3) return 0.0;
      float y = p.y / (90.0 * scale) + uTime * speed * (0.8 + r * 0.5) + r * 17.0;
      float f = fract(y);
      float len = 0.2 + 0.2 * r;
      float s = smoothstep(0.0, 0.03, f) * (1.0 - smoothstep(len * 0.3, len, f));
      float xf = abs(fract(p.x / cw) - 0.5) * cw;
      return s * (1.0 - smoothstep(0.2 * scale, 0.9 * scale, xf));
    }

    void main(){
      // lines boil on twos: a sub-pixel wobble that steps 8×/s
      float tick = floor(uTime * 8.0);
      vec2 wob = (vec2(hash12(vUv * 91.0 + tick), hash12(vUv * 57.0 - tick)) - 0.5) * 0.6 / uRes;
      vec2 uv = vUv;
      vec3 c = texture2D(tColor, uv).rgb * uExposure;
      float dist = viewDist(uv);
      bool sky = dist > 9e5;

      vec3 s = toSRGB(c);
      float L = dot(s, vec3(0.299, 0.587, 0.114));

      // --- halftone screen in the mid-tones (45°, dots grow as tones darken) ---
      float cell = 4.0 * uPx;
      vec2 hp = mat2(0.7071, -0.7071, 0.7071, 0.7071) * gl_FragCoord.xy / cell;
      float dd = length(fract(hp) - 0.5) * 1.414;
      float band = smoothstep(0.035, 0.09, L) * (1.0 - smoothstep(0.42, 0.7, L));
      float v = clamp((L - 0.035) / 0.5, 0.0, 1.0);
      float on = step(dd, sqrt(v) * 1.05);
      vec3 hs = on > 0.5 ? s * 1.22 : s * 0.5;
      s = mix(s, hs, band * 0.75 * uHalftone);

      // --- gold plate printed off-register: warm lights leave a ghost fringe ---
      vec2 og = vec2(-2.2, 1.4) * uPx * uReg / uRes;
      vec3 cg = toSRGB(texture2D(tColor, uv + og).rgb * uExposure);
      float warmG = clamp((cg.r - cg.b) * 1.6 - 0.25, 0.0, 1.0);
      float warmHere = clamp((s.r - s.b) * 1.6 - 0.25, 0.0, 1.0);
      s += uGold * max(warmG - warmHere, 0.0) * 0.3;

      // --- ink key line + a teal plate printed off-register beneath it ---
      float e = edgeAt(uv + wob);
      vec2 ot = vec2(1.8, -1.3) * uPx * uReg / uRes;
      float et = edgeAt(uv + ot + wob);
      float fogK = sky ? 0.0 : exp(-dist * uFogDensity * 1.25);
      float fogT = exp(-(sky ? 1e6 : dist) * uFogDensity * 0.9);
      s = mix(s, uTeal, et * 0.5 * fogT * (1.0 - e));
      vec3 lineC = mix(uFog * 0.9, uInk, fogK);
      s = mix(s, lineC, e * (0.35 + 0.65 * fogK));

      // --- lightning: the city goes flat black against a lit sky ---
      if (!sky) s = mix(mix(s, s * 0.35 + uInk * 0.2, uFlash * 0.8), s + uCream * uFlash * 0.07 * (0.4 + L * 3.0), uAlt);

      // --- screen rain for depth on the overhead view ---
      float rn = rainLayer(gl_FragCoord.xy, 1.0, 1.6, 1.0) * 0.6 + rainLayer(gl_FragCoord.xy + 13.0, 1.7, 1.1, 7.0) * 0.4;
      s += uCream * rn * 0.11 * uRainAmt;

      // --- sirens: red/blue light sweeping across rooftops (Heat > 70 only) ---
      if (uSiren > 0.0 && !sky){
        float t = uTime * 0.55;
        float x = vUv.x + vUv.y * 0.25;
        float bandR = smoothstep(0.22, 0.0, abs(fract(x - t) - 0.5) - 0.12);
        float bandB = smoothstep(0.22, 0.0, abs(fract(x - t + 0.5) - 0.5) - 0.12);
        float strobe = 0.6 + 0.4 * step(0.5, fract(uTime * 2.2));
        s += (uRed * bandR + uBlue * bandB) * 0.17 * uSiren * strobe * (0.5 + L * 2.0);
      }

      // --- vignette, grain, fade ---
      vec2 q = (vUv - 0.5) * vec2(uRes.x / uRes.y, 1.0);
      s *= mix(1.0, 0.42, smoothstep(0.42, 1.15, length(q)));
      float g = hash12(gl_FragCoord.xy + floor(uTime * 12.0) * vec2(17.0, 31.0));
      s += (g - 0.5) * 0.035;
      s = mix(uInk, s, uFade);
      gl_FragColor = vec4(clamp(s, 0.0, 1.0), 1.0);
    }`,
};

export function createPost(renderer, scene, camera, { quality = 'high', toScreen = true, target } = {}) {
  const composer = new EffectComposer(renderer, target);
  composer.renderToScreen = toScreen;
  const scenePass = new CityScenePass(scene, camera, { normals: quality === 'high' });
  const comp = new ShaderPass(CompositeShader, null);
  const u = comp.uniforms;
  u.tColor.value = scenePass.rtColor.texture;
  u.tDepth.value = scenePass.rtColor.depthTexture;
  u.tNormal.value = scenePass.rtNormal.texture;
  u.uUseNormal.value = quality === 'high' ? 1 : 0;
  // colours are compared in sRGB inside the shader: hand them over as sRGB triplets
  const srgb = (token) => { const c = col(token); return new THREE.Color().setRGB(...c.clone().convertLinearToSRGB().toArray()); };
  u.uInk.value = srgb('ink');
  u.uTeal.value = srgb('teal-4');
  u.uFog.value = srgb('teal-6');
  u.uGold.value = srgb('gold');
  u.uCream.value = srgb('cream');
  u.uRed.value = srgb('alarm');
  u.uBlue.value = new THREE.Color(SIREN_BLUE);
  composer.addPass(scenePass);
  composer.addPass(comp);

  return {
    composer, scenePass, uniforms: u,
    setSize(w, h, pr) {
      composer.setPixelRatio(pr);
      composer.setSize(w, h);
      u.uRes.value.set(w * pr, h * pr);
      u.uPx.value = Math.max(1, (h * pr) / 820);
    },
    setQuality(q) {
      scenePass.normals = q === 'high';
      u.uUseNormal.value = q === 'high' ? 1 : 0;
    },
    render() {
      u.uNear.value = camera.near;
      u.uFar.value = camera.far;
      composer.render();
    },
    dispose() {
      scenePass.dispose();
      comp.material.dispose();
      comp.fsQuad?.dispose();
      composer.renderTarget1.dispose();
      composer.renderTarget2.dispose();
    },
  };
}
