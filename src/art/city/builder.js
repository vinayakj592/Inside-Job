// GeoBuilder: collects boxes, cylinders, frustums and prisms into one merged BufferGeometry.
// Every vertex carries:
//   aCol  vec3  base albedo (linear)
//   aWin  vec4  x: lit-window ratio (0 = no windows), y: seed, z: window style, w: emissive gold 0..1
import * as THREE from 'three';

const _v = new THREE.Vector3();
const _n = new THREE.Vector3();

export class GeoBuilder {
  constructor() {
    this.pos = [];
    this.nor = [];
    this.col = [];
    this.win = [];
    this.idx = [];
    this.m = null; // optional transform (Matrix4)
    this.nm = null;
    this.c = [0.02, 0.03, 0.03];
    this.w = [0, 0, 0, 0];
  }

  /** Set current material attributes for subsequent shapes. c: THREE.Color, win: [lit, seed, style, emissive] */
  set(c, win = [0, 0, 0, 0]) {
    this.c = [c.r, c.g, c.b];
    this.w = win;
    return this;
  }

  /** Run fn with a transform (translate x,y,z + rotate ry around Y). Nestable-free on purpose (one level). */
  at(x, y, z, ry, fn) {
    const prev = this.m;
    this.m = new THREE.Matrix4().makeRotationY(ry || 0).setPosition(x, y, z);
    this.nm = new THREE.Matrix3().getNormalMatrix(this.m);
    fn();
    this.m = prev;
    this.nm = prev ? new THREE.Matrix3().getNormalMatrix(prev) : null;
  }

  vert(x, y, z, nx, ny, nz) {
    _v.set(x, y, z);
    _n.set(nx, ny, nz);
    if (this.m) { _v.applyMatrix4(this.m); _n.applyMatrix3(this.nm).normalize(); }
    this.pos.push(_v.x, _v.y, _v.z);
    this.nor.push(_n.x, _n.y, _n.z);
    this.col.push(this.c[0], this.c[1], this.c[2]);
    this.win.push(this.w[0], this.w[1], this.w[2], this.w[3]);
    return this.pos.length / 3 - 1;
  }

  /** quad a,b,c,d counter-clockwise seen from the normal side */
  quad(a, b, c, d, n) {
    const i0 = this.vert(a[0], a[1], a[2], n[0], n[1], n[2]);
    this.vert(b[0], b[1], b[2], n[0], n[1], n[2]);
    this.vert(c[0], c[1], c[2], n[0], n[1], n[2]);
    this.vert(d[0], d[1], d[2], n[0], n[1], n[2]);
    this.idx.push(i0, i0 + 1, i0 + 2, i0, i0 + 2, i0 + 3);
  }

  tri(a, b, c) {
    const e1 = new THREE.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
    const e2 = new THREE.Vector3(c[0] - a[0], c[1] - a[1], c[2] - a[2]);
    const n = e1.cross(e2).normalize();
    const i0 = this.vert(a[0], a[1], a[2], n.x, n.y, n.z);
    this.vert(b[0], b[1], b[2], n.x, n.y, n.z);
    this.vert(c[0], c[1], c[2], n.x, n.y, n.z);
    this.idx.push(i0, i0 + 1, i0 + 2);
  }

  /** Axis-aligned box: centre x,z, bottom y0, size w (x), h (y), d (z). bottom face skipped unless opts.bottom */
  box(x, y0, z, w, h, d, { bottom = false, top = true } = {}) {
    const x0 = x - w / 2, x1 = x + w / 2, z0 = z - d / 2, z1 = z + d / 2, y1 = y0 + h;
    this.quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], [0, 0, 1]); // south (+z)
    this.quad([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [0, 0, -1]); // north
    this.quad([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [1, 0, 0]); // east
    this.quad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], [-1, 0, 0]); // west
    if (top) this.quad([x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], [0, 1, 0]);
    if (bottom) this.quad([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], [0, -1, 0]);
  }

  /** Frustum (truncated pyramid) from w0×d0 at y0 to w1×d1 at y0+h. w1=d1=0 gives a pyramid. */
  frustum(x, y0, z, w0, d0, w1, d1, h) {
    const y1 = y0 + h;
    const b = [[x - w0 / 2, y0, z + d0 / 2], [x + w0 / 2, y0, z + d0 / 2], [x + w0 / 2, y0, z - d0 / 2], [x - w0 / 2, y0, z - d0 / 2]];
    const t = [[x - w1 / 2, y1, z + d1 / 2], [x + w1 / 2, y1, z + d1 / 2], [x + w1 / 2, y1, z - d1 / 2], [x - w1 / 2, y1, z - d1 / 2]];
    for (let i = 0; i < 4; i++) {
      const j = (i + 1) % 4;
      if (w1 === 0 && d1 === 0) this.tri(b[i], b[j], t[i]);
      else { this.tri(b[i], b[j], t[j]); this.tri(b[i], t[j], t[i]); }
    }
    if (w1 > 0 && d1 > 0) this.quad(t[0], t[1], t[2], t[3], [0, 1, 0]);
  }

  /** Cylinder (smooth or faceted), optional top cap. */
  cyl(x, y0, z, r, h, seg = 12, { smoothN = true, top = true, r1 = r } = {}) {
    const y1 = y0 + h;
    for (let i = 0; i < seg; i++) {
      const a0 = (i / seg) * Math.PI * 2, a1 = ((i + 1) / seg) * Math.PI * 2;
      const c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1);
      if (smoothN) {
        const i0 = this.vert(x + c0 * r, y0, z + s0 * r, c0, 0, s0);
        this.vert(x + c1 * r, y0, z + s1 * r, c1, 0, s1);
        this.vert(x + c1 * r1, y1, z + s1 * r1, c1, 0, s1);
        this.vert(x + c0 * r1, y1, z + s0 * r1, c0, 0, s0);
        this.idx.push(i0, i0 + 2, i0 + 1, i0, i0 + 3, i0 + 2);
      } else {
        const am = (a0 + a1) / 2;
        const n = [Math.cos(am), 0, Math.sin(am)];
        this.quad([x + c1 * r, y0, z + s1 * r], [x + c0 * r, y0, z + s0 * r], [x + c0 * r1, y1, z + s0 * r1], [x + c1 * r1, y1, z + s1 * r1], n);
      }
      if (top && r1 > 0) this.tri([x, y1, z], [x + c1 * r1, y1, z + s1 * r1], [x + c0 * r1, y1, z + s0 * r1]);
    }
  }

  sphere(x, y, z, r, seg = 10) {
    const rows = Math.max(4, Math.round(seg / 2));
    const base = this.count;
    for (let i = 0; i <= rows; i++) {
      const v = i / rows, phi = v * Math.PI;
      for (let j = 0; j <= seg; j++) {
        const th = (j / seg) * Math.PI * 2;
        const nx = Math.sin(phi) * Math.cos(th), ny = Math.cos(phi), nz = Math.sin(phi) * Math.sin(th);
        this.vert(x + nx * r, y + ny * r, z + nz * r, nx, ny, nz);
      }
    }
    for (let i = 0; i < rows; i++) for (let j = 0; j < seg; j++) {
      const a = base + i * (seg + 1) + j, bb = a + seg + 1;
      this.idx.push(a, a + 1, bb, a + 1, bb + 1, bb);
    }
  }

  cone(x, y0, z, r, h, seg = 10) {
    for (let i = 0; i < seg; i++) {
      const a0 = (i / seg) * Math.PI * 2, a1 = ((i + 1) / seg) * Math.PI * 2;
      this.tri([x + Math.cos(a1) * r, y0, z + Math.sin(a1) * r], [x + Math.cos(a0) * r, y0, z + Math.sin(a0) * r], [x, y0 + h, z]);
    }
  }

  /** Triangular prism roof / pediment along X: width w, depth d, ridge height h */
  gable(x, y0, z, w, d, h) {
    const x0 = x - w / 2, x1 = x + w / 2, z0 = z - d / 2, z1 = z + d / 2, y1 = y0 + h;
    this.tri([x0, y0, z1], [x1, y0, z1], [x1, y1, z]);
    this.tri([x0, y0, z1], [x1, y1, z], [x0, y1, z]);
    this.tri([x1, y0, z0], [x0, y0, z0], [x0, y1, z]);
    this.tri([x1, y0, z0], [x0, y1, z], [x1, y1, z]);
    this.tri([x0, y0, z0], [x0, y0, z1], [x0, y1, z]);
    this.tri([x1, y0, z1], [x1, y0, z0], [x1, y1, z]);
  }

  /** Thin beam between two points (square section s). Used for fire escapes, gantries, antennas. */
  beam(a, b, s = 0.25) {
    const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b);
    const len = A.distanceTo(B);
    const mid = A.clone().add(B).multiplyScalar(0.5);
    const dir = B.clone().sub(A).normalize();
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    const m = new THREE.Matrix4().compose(mid, q, new THREE.Vector3(1, 1, 1));
    const prev = this.m, prevN = this.nm;
    this.m = prev ? prev.clone().multiply(m) : m;
    this.nm = new THREE.Matrix3().getNormalMatrix(this.m);
    this.box(0, -len / 2, 0, s, len, s, { bottom: true });
    this.m = prev;
    this.nm = prevN;
  }

  get count() { return this.pos.length / 3; }

  build() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.nor, 3));
    g.setAttribute('aCol', new THREE.Float32BufferAttribute(this.col, 3));
    g.setAttribute('aWin', new THREE.Float32BufferAttribute(this.win, 4));
    const n = this.count;
    g.setIndex(n > 65535 ? new THREE.Uint32BufferAttribute(this.idx, 1) : new THREE.Uint16BufferAttribute(this.idx, 1));
    g.computeBoundingSphere();
    g.computeBoundingBox();
    return g;
  }
}
