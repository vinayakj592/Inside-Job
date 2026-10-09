// Job blueprint renderer (DESIGN.md §6.4). Coordinate space 1200 × 760.
// Walls are poché bands with bright edges, rooms are hand-lettered, doors swing, windows are
// triple lines, cameras cast hatched cones, guards walk dash-dot routes, lasers pulse,
// safes and vaults are double circles, entries are callouts, crew notes are grease pencil.
import { s, f1, pathD, rng, scribbleLoop, shakyPath } from './svg.js';
import { buildSheet, setLayerStates, drawLayers, panZoom } from './sheet.js';
import { reducedMotion } from '../../core/dom.js';

const OUTDOOR = /street|alley|yard|lot|dock|road|roof|avenue|plaza|court|garden|canal|lane|quay|pier|platform|track|terrace|park|square|sidewalk|parking|wharf/i;
const ORDER = ['rooms', 'stairs', 'walls', 'windows', 'doors', 'cameras', 'lasers', 'safes', 'guards', 'entries', 'labels', 'notes'];
const U = 20; // drawing units per metre (for dimension text)

/**
 * createBlueprint(job, { visible: Set<layerId>, rev }) → api
 */
export function createBlueprint(job, { visible, rev = 0 } = {}) {
  const bp = job.blueprint || { layers: [] };
  const layerKind = (id) => {
    for (const k of ['safes', 'cameras', 'guards', 'lasers', 'entries', 'rooms', 'walls', 'doors', 'windows', 'notes', 'labels']) {
      if ((bp[k] || []).some((e) => e.layer === id)) return k;
    }
    return 'other';
  };
  const sheet = buildSheet({
    content: { x: 0, y: 0, w: 1200, h: 760 },
    meta: {
      project: job.target, planTitle: bp.title || job.target, title: bp.title || job.target,
      sheet: `A-${100 + (job.number || 1)}`, scale: bp.scale || '1:100', rev, number: String(job.number || 1),
      date: `0${job.number || 1}.11.47`.slice(-8),
      legend: (bp.layers || []).map((l) => ({ id: l.id, label: l.label || l.id, kind: layerKind(l.id) })),
      file: `${String(job.id).toUpperCase()}-${(job.number || 1) * 1127 % 9000 + 1000}`,
    },
  });
  const { svg, ids, layers, marks, live } = sheet;
  const root = sheet.el;
  const layerIds = (bp.layers || []).map((l) => l.id);
  const groupFor = new Map(); // `${kind}|${layer}` → g
  const G = (kind, layer) => {
    const k = kind + '|' + layer;
    if (!groupFor.has(k)) {
      const g = s('g', { class: `bpk bpk-${kind}`, 'data-layer': layer });
      groupFor.set(k, g);
    }
    return groupFor.get(k);
  };

  const all = (k) => (Array.isArray(bp[k]) ? bp[k] : []);
  const bbox = contentBox(bp);
  const shellBox = (() => {
    const ws = all('walls').filter((w) => Math.hypot(w.x2 - w.x1, w.y2 - w.y1) >= 80);
    if (!ws.length) return bbox;
    const xs = ws.flatMap((w) => [w.x1, w.x2]), ys = ws.flatMap((w) => [w.y1, w.y2]);
    const x = Math.min(...xs), y = Math.min(...ys);
    return { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y };
  })();
  const centre = { x: bbox.x + bbox.w / 2, y: bbox.y + bbox.h / 2 };

  /* --------- cut mask: door and window openings punch through walls/partitions --------- */
  const maskId = ids.glow.replace('glow', 'cut');
  const mask = s('mask', { id: maskId, maskUnits: 'userSpaceOnUse', x: -2000, y: -2000, width: 5200, height: 4800 },
    s('rect', { x: -2000, y: -2000, width: 5200, height: 4800, fill: '#fff' }));
  for (const d of all('doors')) {
    const [a, b] = doorEnds(d);
    mask.append(s('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], stroke: '#000', 'stroke-width': 20, 'stroke-linecap': 'butt' }));
  }
  for (const w of all('windows')) mask.append(s('line', { x1: w.x1, y1: w.y1, x2: w.x2, y2: w.y2, stroke: '#000', 'stroke-width': 20 }));
  svg.querySelector('defs').append(mask);

  /* ---------------- rooms ---------------- */
  const labelTexts = new Set(all('labels').map((l) => String(l.text || '').toUpperCase().trim()));
  for (const r of all('rooms')) {
    const g = G('rooms', r.layer);
    const poly = r.poly || [[r.x, r.y], [r.x + r.w, r.y], [r.x + r.w, r.y + r.h], [r.x, r.y + r.h]];
    const outdoor = r.outdoor != null ? !!r.outdoor : (OUTDOOR.test(r.name || '') || OUTDOOR.test(r.id || ''));
    const c = polyCentroid(poly);
    const bw = Math.max(...poly.map((p) => p[0])) - Math.min(...poly.map((p) => p[0]));
    const bh = Math.max(...poly.map((p) => p[1])) - Math.min(...poly.map((p) => p[1]));
    if (outdoor) {
      g.append(s('path', { class: 'dr bp-room-out', d: pathD(poly, true), 'data-room': r.id }));
    } else {
      const wall = s('g', { mask: `url(#${maskId})` },
        s('path', { class: 'dr bp-part', d: pathD(poly, true) }),
        s('path', { class: 'dr bp-part-in inner', d: pathD(poly, true), stroke: `url(#${ids.poche})` }));
      g.append(wall);
    }
    const name = String(r.name || '').toUpperCase();
    const named = !labelTexts.has(name.trim()); // an explicit label may already name this space
    const fs = Math.max(11, Math.min(20, (bw - 20) / Math.max(4, name.length) * 1.55));
    if (named) g.append(s('text', { class: 'fx bp-room-name' + (outdoor ? ' is-out' : ''), x: f1(c[0]), y: f1(c[1]), style: `--fs:${f1(fs)}px`, text: name }));
    if (!outdoor && bh > 70 && bw > 90) {
      g.append(s('text', { class: 'fx bp-room-dim', x: f1(c[0]), y: f1(c[1] + fs * 0.9 + 4), text: `${(bw / U).toFixed(1)} × ${(bh / U).toFixed(1)} m` }));
    }
  }

  /* ---------------- stairs (optional) ---------------- */
  for (const st of all('stairs')) {
    const g = G('stairs', st.layer);
    const { x, y, w = 60, h = 100 } = st;
    const vertical = (st.dir || 'n') === 'n' || st.dir === 's';
    g.append(s('rect', { class: 'dr bp-line-thin', x, y, width: w, height: h }));
    const n = Math.max(4, Math.round((vertical ? h : w) / 12));
    for (let i = 1; i < n; i++) {
      if (vertical) g.append(s('line', { class: 'dr bp-line-thin', x1: x, y1: y + (h / n) * i, x2: x + w, y2: y + (h / n) * i }));
      else g.append(s('line', { class: 'dr bp-line-thin', x1: x + (w / n) * i, y1: y, x2: x + (w / n) * i, y2: y + h }));
    }
    const up = st.dir === 's' ? [[x + w / 2, y + 8], [x + w / 2, y + h - 8]] : st.dir === 'e' ? [[x + 8, y + h / 2], [x + w - 8, y + h / 2]] : st.dir === 'w' ? [[x + w - 8, y + h / 2], [x + 8, y + h / 2]] : [[x + w / 2, y + h - 8], [x + w / 2, y + 8]];
    g.append(s('path', { class: 'dr bp-line', d: pathD(up), 'marker-end': `url(#${ids.arrow})` }));
    g.append(s('text', { class: 'fx bp-label', x: x + w / 2, y: y + h + 16, text: st.label || 'UP' }));
  }

  /* ---------------- walls: poché band with bright edges ---------------- */
  const wallsByLayer = new Map();
  for (const w of all('walls')) {
    if (!wallsByLayer.has(w.layer)) wallsByLayer.set(w.layer, []);
    wallsByLayer.get(w.layer).push(w);
  }
  const initialLayers = new Set((bp.layers || []).filter((l) => l.initial).map((l) => l.id));
  for (const [layer, ws] of wallsByLayer) {
    const g = G('walls', layer);
    const inner = s('g', { mask: `url(#${maskId})` });
    const outerWall = initialLayers.has(layer) || layerIds[0] === layer;
    const len = (w) => Math.hypot(w.x2 - w.x1, w.y2 - w.y1);
    // shell walls are thick poché; interior walls partition weight; short runs (treads, counters) are plain lines
    const heavy = ws.filter((w) => len(w) >= 80);
    const light = ws.filter((w) => len(w) < 80);
    heavy.forEach((w) => inner.append(s('line', { class: 'dr ' + (outerWall ? 'bp-wall' : 'bp-wall is-int'), x1: w.x1, y1: w.y1, x2: w.x2, y2: w.y2 })));
    heavy.forEach((w) => inner.append(s('line', { class: 'dr inner ' + (outerWall ? 'bp-wall-in' : 'bp-wall-in is-int'), x1: w.x1, y1: w.y1, x2: w.x2, y2: w.y2, stroke: `url(#${ids.poche})` })));
    light.forEach((w) => g.append(s('line', { class: 'dr bp-line', x1: w.x1, y1: w.y1, x2: w.x2, y2: w.y2 })));
    g.append(inner);
  }

  /* ---------------- dimension lines (from the initial shell) ---------------- */
  const dimLayer = (bp.layers || []).find((l) => l.initial)?.id || layerIds[0] || 'shell';
  const dimBands = drawDimensions(G('walls', dimLayer), bp);

  /* ---------------- windows: triple lines ---------------- */
  for (const w of all('windows')) {
    const g = G('windows', w.layer);
    const len = Math.hypot(w.x2 - w.x1, w.y2 - w.y1) || 1;
    const nx = -(w.y2 - w.y1) / len, ny = (w.x2 - w.x1) / len;
    for (const o of [-5, 0, 5]) g.append(s('line', { class: 'dr ' + (o ? 'bp-line-thin' : 'bp-line'), x1: f1(w.x1 + nx * o), y1: f1(w.y1 + ny * o), x2: f1(w.x2 + nx * o), y2: f1(w.y2 + ny * o) }));
    for (const [x, y] of [[w.x1, w.y1], [w.x2, w.y2]]) g.append(s('line', { class: 'dr bp-line', x1: f1(x + nx * 7), y1: f1(y + ny * 7), x2: f1(x - nx * 7), y2: f1(y - ny * 7) }));
  }

  /* ---------------- doors: swing arcs ---------------- */
  for (const d of all('doors')) {
    const g = G('doors', d.layer);
    const [a, b] = doorEnds(d);
    const w = d.w || 50;
    let leaf;
    if (d.dir === 'v') {
      const sx = d.x > centre.x ? -1 : 1;
      leaf = [a[0] + sx * w, a[1]];
      g.append(s('path', { class: 'dr bp-line-thin', d: `M${f1(leaf[0])},${f1(leaf[1])} A${w},${w} 0 0 ${sx > 0 ? 1 : 0} ${f1(b[0])},${f1(b[1])}` }));
    } else {
      const sy = d.y > centre.y ? -1 : 1;
      leaf = [a[0], a[1] + sy * w];
      g.append(s('path', { class: 'dr bp-line-thin', d: `M${f1(leaf[0])},${f1(leaf[1])} A${w},${w} 0 0 ${sy > 0 ? 0 : 1} ${f1(b[0])},${f1(b[1])}` }));
    }
    g.append(s('line', { class: 'dr bp-line', x1: a[0], y1: a[1], x2: f1(leaf[0]), y2: f1(leaf[1]) }));
    // jambs
    const jl = 7;
    const [jx, jy] = d.dir === 'v' ? [jl, 0] : [0, jl];
    for (const p of [a, b]) g.append(s('line', { class: 'dr bp-line', x1: p[0] - jx, y1: p[1] - jy, x2: p[0] + jx, y2: p[1] + jy }));
    if (d.label) {
      const lx = d.dir === 'v' ? a[0] + (d.x > centre.x ? 14 : -14) : (a[0] + b[0]) / 2;
      const ly = d.dir === 'v' ? (a[1] + b[1]) / 2 : a[1] + (d.y > centre.y ? 24 : -14);
      g.append(s('text', { class: 'fx bp-label', x: f1(lx), y: f1(ly), 'text-anchor': d.dir === 'v' ? (d.x > centre.x ? 'start' : 'end') : 'middle', text: String(d.label).toUpperCase() }));
    }
  }

  /* ---------------- cameras: hatched view cones ---------------- */
  for (const c of all('cameras')) {
    const g = G('cameras', c.layer);
    const dir = (c.dir || 0) * Math.PI / 180, half = ((c.fov || 60) / 2) * Math.PI / 180, R = c.range || 160;
    const p1 = [c.x + Math.cos(dir - half) * R, c.y + Math.sin(dir - half) * R];
    const p2 = [c.x + Math.cos(dir + half) * R, c.y + Math.sin(dir + half) * R];
    const large = half * 2 > Math.PI ? 1 : 0;
    const cone = `M${c.x},${c.y} L${f1(p1[0])},${f1(p1[1])} A${R},${R} 0 ${large} 1 ${f1(p2[0])},${f1(p2[1])} Z`;
    const dead = /dead|off|broken|down/i.test(c.label || '');
    g.append(s('path', { class: 'fx bp-cone-fill' + (dead ? ' is-dead' : ''), d: cone, fill: `url(#${ids.hatch})` }));
    g.append(s('path', { class: 'dr bp-cone' + (dead ? ' is-dead' : ''), d: cone }));
    // range arcs
    for (const k of [0.5, 0.75]) {
      const a1 = [c.x + Math.cos(dir - half) * R * k, c.y + Math.sin(dir - half) * R * k];
      const a2 = [c.x + Math.cos(dir + half) * R * k, c.y + Math.sin(dir + half) * R * k];
      g.append(s('path', { class: 'fx bp-cone-arc', d: `M${f1(a1[0])},${f1(a1[1])} A${R * k},${R * k} 0 ${large} 1 ${f1(a2[0])},${f1(a2[1])}` }));
    }
    const deg = c.dir || 0;
    g.append(s('g', { class: 'fx bp-cam', transform: `translate(${c.x} ${c.y}) rotate(${deg})` },
      s('rect', { x: -6, y: -6, width: 16, height: 12, class: 'bp-cam-body' }),
      s('path', { d: 'M10,-4 L16,-7 L16,7 L10,4 Z', class: 'bp-cam-body' }),
      s('circle', { r: 2.5, class: 'bp-cam-dot' })));
    if (c.label) {
      const lx = c.x - Math.cos(dir) * 16, ly = c.y - Math.sin(dir) * 16;
      g.append(s('text', { class: 'fx bp-cam-label' + (dead ? ' is-dead' : ''), x: f1(lx), y: f1(ly + (Math.sin(dir) > 0.3 ? -6 : 16)), 'text-anchor': Math.cos(dir) > 0.3 ? 'end' : Math.cos(dir) < -0.3 ? 'start' : 'middle', text: String(c.label).toUpperCase() }));
    }
  }

  /* ---------------- lasers ---------------- */
  for (const l of all('lasers')) {
    const g = G('lasers', l.layer);
    live.append(s('g', { class: 'bpk', 'data-layer': l.layer }, s('line', { class: 'fx bp-laser-glow', x1: l.x1, y1: l.y1, x2: l.x2, y2: l.y2 })));
    g.append(s('line', { class: 'dr bp-laser', x1: l.x1, y1: l.y1, x2: l.x2, y2: l.y2 }));
    for (const [x, y] of [[l.x1, l.y1], [l.x2, l.y2]]) g.append(s('rect', { class: 'fx bp-laser-emit', x: x - 4, y: y - 4, width: 8, height: 8 }));
  }

  /* ---------------- safes & vaults ---------------- */
  for (const sf of all('safes')) {
    const g = G('safes', sf.layer);
    const r = sf.r || 30;
    const vault = sf.kind === 'vault';
    g.append(s('circle', { class: 'dr bp-line', cx: sf.x, cy: sf.y, r }), s('circle', { class: 'dr bp-line-thin', cx: sf.x, cy: sf.y, r: r - 6 }));
    if (vault) {
      g.append(s('circle', { class: 'fx bp-vault-ring', cx: sf.x, cy: sf.y, r: r - 3, stroke: `url(#${ids.hatch})` }));
      const k = (r - 6) * 0.7071;
      g.append(s('path', { class: 'dr bp-line', d: `M${f1(sf.x - k)},${f1(sf.y - k)} L${f1(sf.x + k)},${f1(sf.y + k)} M${f1(sf.x + k)},${f1(sf.y - k)} L${f1(sf.x - k)},${f1(sf.y + k)}` }));
      g.append(s('circle', { class: 'dr bp-line', cx: sf.x, cy: sf.y, r: r * 0.22 }));
    } else {
      let ticks = '';
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2, r1 = r * 0.38, r2 = r * (i % 4 ? 0.5 : 0.58);
        ticks += `M${f1(sf.x + Math.cos(a) * r1)},${f1(sf.y + Math.sin(a) * r1)} L${f1(sf.x + Math.cos(a) * r2)},${f1(sf.y + Math.sin(a) * r2)} `;
      }
      g.append(s('path', { class: 'fx bp-line-thin', d: ticks }), s('circle', { class: 'fx bp-line', cx: sf.x, cy: sf.y, r: r * 0.2 }));
    }
    if (sf.label) g.append(s('text', { class: 'fx bp-safe-label', x: sf.x, y: sf.y + r + 20, text: String(sf.label).toUpperCase() }));
  }

  /* ---------------- guards: dash-dot routes + walkers ---------------- */
  for (const gd of all('guards')) {
    const g = G('guards', gd.layer);
    const path = gd.path || [];
    if (path.length < 2) continue;
    const d = pathD(path, gd.loop !== false);
    g.append(s('path', { class: 'dr bp-guard-path', d }));
    g.append(s('path', { class: 'fx bp-guard-dash', d, 'marker-mid': `url(#${ids.chev})` }));
    const [sx, sy] = path[0];
    // a static name at the start of the route, laid out with everything else (it hides if it would collide)
    const nx = path.length > 1 ? (path[0][0] + path[1][0]) / 2 : sx, ny = path.length > 1 ? (path[0][1] + path[1][1]) / 2 : sy;
    g.append(s('text', { class: 'fx bp-guard-name', x: f1(nx), y: f1(ny - 10), text: String(gd.name || gd.id || 'Guard').toUpperCase() }));
    // walker (in the unfiltered live layer)
    const walker = s('g', { class: 'bp-walker', 'data-layer': gd.layer },
      s('circle', { r: 14, class: 'bp-walker-halo' }),
      s('circle', { r: 8, class: 'bp-walker-dot' }),
      s('circle', { r: 3, class: 'bp-walker-core' }),
    );
    if (!reducedMotion()) {
      walker.append(s('animateMotion', { dur: `${gd.period || 12}s`, repeatCount: 'indefinite', path: d, rotate: '0', calcMode: 'paced' }));
    } else walker.setAttribute('transform', `translate(${sx} ${sy})`);
    live.append(walker);
  }

  /* ---------------- entries: callouts ---------------- */
  all('entries').forEach((e, i) => {
    const g = G('entries', e.layer);
    const r = rng(e.id || i);
    const right = e.x < 1050;
    const up = e.y > 90;
    const bx = e.x + (right ? 44 : -44), by = e.y + (up ? -40 : 40);
    g.append(
      s('circle', { class: 'dr bp-entry-pt', cx: e.x, cy: e.y, r: 9 }),
      s('path', { class: 'dr bp-line-thin', d: `M${e.x - 14},${e.y} L${e.x + 14},${e.y} M${e.x},${e.y - 14} L${e.x},${e.y + 14}` }),
      s('path', { class: 'dr bp-line-thin', d: `M${f1(e.x + (right ? 7 : -7))},${f1(e.y + (up ? -7 : 7))} L${f1(bx + (right ? -11 : 11))},${f1(by + (up ? 11 : -11))}` }),
      s('circle', { class: 'dr bp-callout', cx: bx, cy: by, r: 16 }),
      s('text', { class: 'fx bp-entry-id', x: bx, y: by + 5, text: `E${i + 1}` }),
      s('text', { class: 'fx bp-entry-label', x: bx + (right ? 24 : -24), y: by + 5, 'text-anchor': right ? 'start' : 'end', text: String(e.label || '').toUpperCase() }),
    );
    void r;
  });

  /* ---------------- labels & notes ---------------- */
  for (const l of all('labels')) G('labels', l.layer).append(s('text', { class: 'fx bp-tech', x: l.x, y: l.y, text: String(l.text).toUpperCase() }));
  const hitsAny = (r, list) => list.some((o) => r.x < o.x + o.w && r.x + r.w > o.x && r.y < o.y + o.h && r.y + r.h > o.y);
  const placedNotes = [];
  all('notes').forEach((n0, i) => {
    // nudge grease notes off the dimension strings and off each other
    const w0 = Math.min(420, String(n0.text).length * 10.5);
    const box = (y) => ({ x: n0.x - w0 / 2, y: y - 20, w: w0, h: 30 });
    let ny = n0.y;
    const obstacles = [...dimBands, ...placedNotes];
    if (hitsAny(box(ny), obstacles)) {
      // move away from the building first (up if the note sits above its middle, down otherwise)
      const dir = n0.y < centre.y ? -1 : 1;
      const tries = [];
      for (let k = 1; k <= 16; k++) tries.push(n0.y + dir * k * 8);
      for (let k = 1; k <= 16; k++) tries.push(n0.y - dir * k * 8);
      const free = tries.find((y) => !hitsAny(box(y), obstacles));
      if (free != null) ny = free;
    }
    placedNotes.push(box(ny));
    const n = { ...n0, y: ny };
    const g = G('notes', n.layer);
    const rot = n.rot ?? ((i % 2 ? 1 : -1) * 3);
    const t = s('text', { class: 'fx bp-note', x: n.x, y: n.y, transform: `rotate(${rot} ${n.x} ${n.y})`, filter: `url(#${ids.grease})`, text: n.text });
    const w = Math.min(420, String(n.text).length * 10.5);
    g.append(t, s('path', { class: 'dr bp-note-ul', d: shakyPath([[n.x - w / 2, n.y + 9], [n.x + w / 2, n.y + 7]], i + 3, 1.5), transform: `rotate(${rot} ${n.x} ${n.y})`, filter: `url(#${ids.grease})` }));
  });

  // assemble in drawing order
  for (const kind of ORDER) {
    for (const [k, g] of groupFor) if (k.startsWith(kind + '|')) layers.append(g);
  }
  // grease circles around the targets, belonging to the safe's layer
  for (const sf of all('safes')) {
    const r = (sf.r || 30) + 20;
    const g = s('g', { class: 'bpk bpk-circle', 'data-layer': sf.layer });
    g.append(s('path', { class: 'dr bp-grease-loop', d: scribbleLoop(sf.x, sf.y, r * 1.25, r, sf.id || 7), filter: `url(#${ids.grease})` }));
    marks.append(g);
  }

  const setLegend = (set) => root.querySelectorAll('[data-legend]').forEach((e) => e.classList.toggle('is-on', set.has(e.dataset.legend)));
  setLayerStates(root, visible);
  setLegend(visible);
  /* ---------------- legibility: text floor + collision-free labels ---------------- */
  // priority order; movable labels try alternate anchors, others hide if they collide
  const PRI = [['.bp-room-name', 6, true], ['.bp-note', 5, true], ['.bp-safe-label', 4, true], ['.bp-guard-name', 3.5, true], ['.bp-cam-label', 3, true],
    ['.bp-entry-label', 2, true], ['.bp-label', 1.6, true], ['.bp-tech', 1, true], ['.bp-room-dim', 0.5, false], ['.bp-dim-t', 0.3, false]];
  let layoutTimer = null;
  function layoutLabels() {
    const ctm = svg.getScreenCTM();
    if (!ctm || !svg.isConnected || !svg.clientWidth) return;
    const k = ctm.a, u = 1 / k;
    for (const el of [svg, sheet.liveSvg]) { el.style.setProperty('--u', u.toFixed(4)); el.classList.toggle('is-small', k < 0.62); }
    const items = [];
    PRI.forEach(([sel, p, movable]) => root.querySelectorAll('.bp-layers ' + sel).forEach((el) => {
      el.removeAttribute('dx'); el.removeAttribute('dy'); el.classList.remove('is-bumped');
      if (el.closest('.is-ghost')) return;
      items.push({ el, p, movable });
    }));
    for (const it of items) { const r = it.el.getBoundingClientRect(); it.r = { x: r.left, y: r.top, w: r.width, h: r.height }; }
    // tags (play) are fixed obstacles
    const placed = [...root.querySelectorAll('.bp-tag .bp-tag-body')].map((t) => { const r = t.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; });
    const free = (r) => !placed.some((q) => r.x < q.x + q.w + 3 && r.x + r.w + 3 > q.x && r.y < q.y + q.h && r.y + r.h > q.y);
    for (const it of items) {
      const { w, h } = it.r;
      if (!w || getComputedStyle(it.el).display === 'none') continue;
      const cands = it.movable ? [[0, 0], [0, -h * 0.95], [0, h * 0.95], [w * 0.3, 0], [-w * 0.3, 0], [0, -h * 1.9], [0, h * 1.9], [w * 0.3, -h * 0.95], [-w * 0.3, h * 0.95]] : [[0, 0]];
      const hit = cands.find(([dx, dy]) => free({ x: it.r.x + dx, y: it.r.y + dy, w, h }));
      if (!hit) { it.el.classList.add('is-bumped'); continue; }
      placed.push({ x: it.r.x + hit[0], y: it.r.y + hit[1], w, h });
      if (hit[0] || hit[1]) { it.el.setAttribute('dx', f1(hit[0] * u)); it.el.setAttribute('dy', f1(hit[1] * u)); }
    }
  }
  const relayout = () => { clearTimeout(layoutTimer); layoutTimer = setTimeout(layoutLabels, 90); };
  const ro = new ResizeObserver(relayout);
  ro.observe(svg);
  const pz = panZoom(svg, sheet.viewBase, { mirror: [sheet.liveSvg], onChange: relayout });

  /* ---------------- routes for CALL THE PLAY ---------------- */
  const routesG = s('g', { class: 'bp-routes' });
  marks.append(routesG);
  let routeEls = new Map();

  /** Where each option's manila tag hangs: outside the building, clear of the other tags. */
  function placeTags(options) {
    const b = shellBox;
    const placed = [];
    // visible lettering on the plan (room names, notes...) that a tag must not cover
    const text = [];
    const rootInv = svg.getCTM()?.inverse();
    svg.querySelectorAll('.bp-layers text, .bp-marks .bp-grease-loop, .bp-north, .bp-tb, .bp-legend').forEach((t) => {
      if (t.closest('.is-ghost')) return;
      let b;
      try { b = t.getBBox(); } catch { return; }
      if (!b || b.width < 1 || getComputedStyle(t).display === 'none') return;
      // into sheet space (accounts for rotated notes and translated groups)
      const m = rootInv && t.getCTM() ? rootInv.multiply(t.getCTM()) : null;
      const pts = [[b.x, b.y], [b.x + b.width, b.y], [b.x, b.y + b.height], [b.x + b.width, b.y + b.height]]
        .map(([x, y]) => (m ? new DOMPoint(x, y).matrixTransform(m) : { x, y }));
      const xs = pts.map((p) => p.x), ys = pts.map((p) => p.y);
      const x = Math.min(...xs), y = Math.min(...ys);
      text.push({ x: x - 4, y: y - 4, w: Math.max(...xs) - x + 8, h: Math.max(...ys) - y + 8 });
    });
    const out = new Map();
    const overlaps = (r, p, mx = 10, my = 8) => r.x < p.x + p.w + mx && r.x + r.w + mx > p.x && r.y < p.y + p.h + my && r.y + r.h + my > p.y;
    const hit = (r) => placed.some((p) => overlaps(r, p, 14, 16)) || text.some((p) => overlaps(r, p, 2, 2));
    options.forEach((o, i) => {
      const route = o.route || [];
      if (!route.length) return;
      const [x0, y0] = route[0];
      const label = String(o.label || o.id).toUpperCase();
      const w = Math.max(150, label.length * 13.4 + 70), hgt = 48;
      const inside = x0 > b.x && x0 < b.x + b.w && y0 > b.y && y0 < b.y + b.h;
      const primary = inside || y0 <= b.y ? 'up' : y0 >= b.y + b.h ? 'down' : x0 >= b.x + b.w ? 'right' : 'left';
      const order = [primary, ...['up', 'right', 'down', 'left'].filter((x) => x !== primary)];
      const cand = (sd, ring, off) => {
        if (sd === 'up') return { x: x0 - w / 2 + 40 + off, y: b.y - 70 - hgt / 2 - ring * (hgt + 12), w, h: hgt };
        if (sd === 'down') return { x: x0 - 20 + off, y: Math.max(y0, b.y + b.h) + 44 + ring * (hgt + 12), w, h: hgt };
        if (sd === 'right') return { x: Math.max(x0, b.x + b.w) + 40 + ring * 30, y: y0 - hgt / 2 + off * 0.7, w, h: hgt };
        return { x: Math.min(x0, b.x) - 40 - w - ring * 30, y: y0 - hgt / 2 + off * 0.7, w, h: hgt };
      };
      const inSheet = (c) => c.x > -60 && c.x + c.w < 1260 && c.y > -80 && c.y + c.h < 820;
      let r = null, side = primary;
      for (const sd of order) {
        for (let ring = 0; ring < 5 && !r; ring++) {
          for (const off of [0, -70, 70, -140, 140]) {
            const c = cand(sd, ring, off);
            if (inSheet(c) && !hit(c)) { r = c; side = sd; break; }
          }
        }
        if (r) break;
      }
      if (!r) r = cand(primary, placed.length, 0);
      placed.push(r);
      out.set(o.id, { ...r, side, x0, y0, rot: (rng('tag' + o.id)() - 0.5) * 4, label, i });
    });
    return out;
  }

  function showRoutes(options, { wrong = [], onHover, onPick } = {}) {
    routesG.replaceChildren();
    routeEls = new Map();
    svg.classList.add('is-play'); // hides secondary lettering before tags are placed around what's left
    layoutLabels();
    const tagsG = s('g', { class: 'bp-tags' });
    const spots = placeTags(options);
    options.forEach((o, i) => {
      const route = o.route || [];
      const spot = spots.get(o.id);
      if (!spot) return;
      const d = route.length > 1 ? shakyPath(route, i * 13 + 5, 3) : '';
      const g = s('g', { class: 'bp-route' + (wrong.includes(o.id) ? ' is-wrong' : ''), 'data-id': o.id, 'data-no-pan': '' });
      if (d) {
        g.append(s('path', { class: 'bp-route-faint', d }));
        g.append(s('path', { class: 'bp-route-hit', d }));
        g.append(s('path', { class: 'bp-route-hot', d, filter: `url(#${ids.grease})`, 'marker-end': `url(#${ids.greaseArrow})` }));
      }
      const { x0, y0 } = spot;
      const [xe, ye] = route[route.length - 1];
      g.append(s('circle', { class: 'bp-route-start', cx: x0, cy: y0, r: 10 }));
      g.append(s('path', { class: 'bp-route-end', d: scribbleLoop(xe, ye, 30, 24, i * 7 + 2), filter: `url(#${ids.grease})` }));
      const { x: tx, y: ty, w: tw, h: th, rot, label } = spot;
      const tag = s('g', { class: 'bp-tag' + (wrong.includes(o.id) ? ' is-wrong' : ''), transform: `translate(${f1(tx)} ${f1(ty + th / 2)}) rotate(${f1(rot)})`, 'data-id': o.id, 'data-no-pan': '' },
        s('path', { class: 'bp-tag-body', d: `M12,-${th / 2} L${f1(tw)},-${th / 2} L${f1(tw)},${th / 2} L12,${th / 2} L0,${th / 2 - 12} L0,-${th / 2 - 12} Z` }),
        s('circle', { class: 'bp-tag-eye', cx: 16, cy: 0, r: 5.5 }),
        s('text', { class: 'bp-tag-letter', x: 34, y: 8, text: String.fromCharCode(65 + i) }),
        s('text', { class: 'bp-tag-text', x: 58, y: 8, text: label }),
        wrong.includes(o.id) ? s('path', { class: 'bp-tag-strike', d: `M50,2 Q${f1(tw / 2)},-3 ${f1(tw - 10)},1` }) : null,
      );
      // the string: from the eyelet to the route start, sagging a little
      const rr = rot * Math.PI / 180;
      const ex = tx + Math.cos(rr) * 16, ey = ty + th / 2 + Math.sin(rr) * 16;
      const sag = Math.max(ey, y0) + 22;
      g.append(s('path', { class: 'bp-tag-string', d: `M${f1(ex)},${f1(ey)} Q${f1((ex + x0) / 2)},${f1(sag)} ${x0},${y0}` }));
      tagsG.append(tag);
      routesG.append(g);
      routeEls.set(o.id, { g, tag });
      for (const el of [g, tag]) {
        el.addEventListener('pointerenter', () => onHover?.(o.id));
        el.addEventListener('pointerleave', () => onHover?.(null));
        el.addEventListener('click', () => onPick?.(o.id));
      }
    });
    routesG.append(tagsG);
    svg.classList.add('is-play');
    // the box that holds the building, every route and every tag
    const xs = [bbox.x, bbox.x + bbox.w], ys = [bbox.y, bbox.y + bbox.h];
    for (const o of options) (o.route || []).forEach(([x, y]) => { xs.push(x); ys.push(y); });
    for (const t of spots.values()) { xs.push(t.x, t.x + t.w); ys.push(t.y, t.y + t.h); }
    const x = Math.min(...xs) - 30, y = Math.min(...ys) - 30;
    return { x, y, w: Math.max(...xs) + 30 - x, h: Math.max(...ys) + 30 - y };
  }
  function hotRoute(id) {
    for (const [rid, { g, tag }] of routeEls) {
      const on = rid === id;
      if (on && !g.classList.contains('is-hot')) {
        const hot = g.querySelector('.bp-route-hot');
        if (hot && !reducedMotion()) {
          hot.setAttribute('pathLength', '1');
          hot.classList.remove('is-drawing');
          void hot.getBBox();
          hot.classList.add('is-drawing');
          setTimeout(() => { hot.classList.remove('is-drawing'); hot.removeAttribute('pathLength'); }, 700);
        }
      }
      g.classList.toggle('is-hot', on);
      tag.classList.toggle('is-hot', on);
    }
  }
  function pickRoute(id) {
    for (const [rid, { g, tag }] of routeEls) {
      g.classList.toggle('is-picked', rid === id);
      tag.classList.toggle('is-picked', rid === id);
    }
    svg.classList.toggle('has-pick', !!id);
    if (id) hotRoute(id);
  }
  function clearRoutes() {
    routesG.replaceChildren();
    routeEls = new Map();
    svg.classList.remove('is-play', 'has-pick');
  }

  return {
    el: root,
    svg,
    sheet,
    pz,
    layerIds,
    setVisible(set) { setLayerStates(root, set); setLegend(set); relayout(); },
    drawIn(ids, opts) {
      const on = new Set([...root.querySelectorAll('.bp-leg.is-on')].map((e) => e.dataset.legend).concat(ids));
      setLegend(on);
      const p = drawLayers(root, ids, opts);
      layoutTimer = setTimeout(layoutLabels, 30); // lay out as soon as the labels exist, again when drawn
      p.then(relayout);
      return p;
    },
    relayout: layoutLabels,
    setRev(n) { const t = svg.querySelector('.bp-tb-rev'); if (t) t.textContent = String(n); },
    showRoutes, hotRoute, pickRoute, clearRoutes,
    /** Blueprint-space box around a set of layers (for focusing). */
    boxOf(layerId) { return layerBox(bp, layerId); },
    destroy() { ro.disconnect(); clearTimeout(layoutTimer); root.remove(); },
  };
}

/* ------------------------------------------------------------------ */
function doorEnds(d) {
  const w = d.w || 50;
  return d.dir === 'v' ? [[d.x, d.y], [d.x, d.y + w]] : [[d.x, d.y], [d.x + w, d.y]];
}
function polyCentroid(poly) {
  let x = 0, y = 0;
  poly.forEach(([a, b]) => { x += a; y += b; });
  return [x / poly.length, y / poly.length];
}
function contentBox(bp) {
  const xs = [], ys = [];
  for (const r of bp.rooms || []) {
    if (r.poly) r.poly.forEach(([x, y]) => { xs.push(x); ys.push(y); });
    else { xs.push(r.x, r.x + r.w); ys.push(r.y, r.y + r.h); }
  }
  for (const w of bp.walls || []) { xs.push(w.x1, w.x2); ys.push(w.y1, w.y2); }
  if (!xs.length) return { x: 0, y: 0, w: 1200, h: 760 };
  const x = Math.min(...xs), y = Math.min(...ys);
  return { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y };
}
export function layerBox(bp, layerId) {
  const xs = [], ys = [];
  const add = (x, y) => { if (Number.isFinite(x) && Number.isFinite(y)) { xs.push(x); ys.push(y); } };
  for (const r of bp.rooms || []) if (r.layer === layerId) { if (r.poly) r.poly.forEach(([x, y]) => add(x, y)); else { add(r.x, r.y); add(r.x + r.w, r.y + r.h); } }
  for (const k of ['walls', 'windows', 'lasers']) for (const w of bp[k] || []) if (w.layer === layerId) { add(w.x1, w.y1); add(w.x2, w.y2); }
  for (const k of ['cameras', 'safes', 'entries', 'notes', 'labels', 'doors']) for (const e of bp[k] || []) if (e.layer === layerId) add(e.x, e.y);
  for (const gd of bp.guards || []) if (gd.layer === layerId) (gd.path || []).forEach(([x, y]) => add(x, y));
  if (!xs.length) return null;
  const x = Math.min(...xs), y = Math.min(...ys);
  return { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y };
}

/** Overall and chained dimension lines along the top and left of the building. */
function drawDimensions(g, bp) {
  const walls = (bp.walls || []).filter((w) => Math.hypot(w.x2 - w.x1, w.y2 - w.y1) >= 80);
  const rects = (bp.rooms || []).filter((r) => !r.poly && !(r.outdoor != null ? r.outdoor : OUTDOOR.test(r.name || '')));
  const xs = [], ys = [];
  walls.forEach((w) => { xs.push(w.x1, w.x2); ys.push(w.y1, w.y2); });
  if (!xs.length) rects.forEach((r) => { xs.push(r.x, r.x + r.w); ys.push(r.y, r.y + r.h); });
  if (!xs.length) return [];
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);

  // Put each dimension string on the side with the least going on (notes, labels, entries, cameras).
  const stuff = [];
  for (const n of bp.notes || []) { const w = Math.min(420, String(n.text).length * 10.5); stuff.push({ x: n.x - w / 2, y: n.y - 20, w, h: 28, k: 3 }); }
  for (const l of bp.labels || []) { const w = String(l.text).length * 11; stuff.push({ x: l.x - w / 2, y: l.y - 14, w, h: 18, k: 1 }); }
  for (const e of [...(bp.entries || []), ...(bp.cameras || [])]) stuff.push({ x: e.x - 30, y: e.y - 50, w: 90, h: 70, k: 1 });
  const load = (r) => stuff.reduce((a, o) => a + (o.x < r.x + r.w && o.x + o.w > r.x && o.y < r.y + r.h && o.y + o.h > r.y ? o.k : 0), 0);
  const W = maxX - minX, H = maxY - minY;
  const top = { x: minX, y: minY - 80, w: W, h: 76 }, bottom = { x: minX, y: maxY + 4, w: W, h: 76 };
  const left = { x: minX - 80, y: minY, w: 76, h: H }, right = { x: maxX + 4, y: minY, w: 76, h: H };
  const hSide = load(top) > 0 && load(bottom) === 0 && maxY + 80 < 760 ? 1 : -1;
  const vSide = load(left) > 0 && load(right) === 0 && maxX + 80 < 1200 ? 1 : -1;

  const hEdge = hSide < 0 ? minY : maxY, vEdge = vSide < 0 ? minX : maxX;
  const chainX = [...new Set(rects.filter((r) => Math.abs((hSide < 0 ? r.y : r.y + r.h) - hEdge) < 2).flatMap((r) => [r.x, r.x + r.w]).concat([minX, maxX]).filter((x) => x >= minX - 1 && x <= maxX + 1))].sort((a, b) => a - b);
  const chainY = [...new Set(rects.filter((r) => Math.abs((vSide < 0 ? r.x : r.x + r.w) - vEdge) < 2).flatMap((r) => [r.y, r.y + r.h]).concat([minY, maxY]).filter((y) => y >= minY - 1 && y <= maxY + 1))].sort((a, b) => a - b);
  const h1 = hEdge + hSide * 34, h2 = hEdge + hSide * 64;
  const v1 = vEdge + vSide * 34, v2 = vEdge + vSide * 64;
  const hdim = (x1, x2, y, tier) => {
    g.append(s('line', { class: 'dr bp-dim', x1, y1: y, x2, y2: y }));
    for (const x of [x1, x2]) g.append(s('line', { class: 'dr bp-dim', x1: x - 5, y1: y + 5, x2: x + 5, y2: y - 5 }));
    if (x2 - x1 > 34) g.append(s('text', { class: 'fx bp-dim-t' + (tier ? ' is-major' : ''), x: (x1 + x2) / 2, y: y - 6, text: ((x2 - x1) / U).toFixed(2) }));
  };
  const vdim = (y1, y2, x, tier) => {
    g.append(s('line', { class: 'dr bp-dim', x1: x, y1, x2: x, y2 }));
    for (const y of [y1, y2]) g.append(s('line', { class: 'dr bp-dim', x1: x - 5, y1: y + 5, x2: x + 5, y2: y - 5 }));
    if (y2 - y1 > 34) g.append(s('text', { class: 'fx bp-dim-t' + (tier ? ' is-major' : ''), x: x - 7, y: (y1 + y2) / 2, transform: `rotate(-90 ${x - 7} ${(y1 + y2) / 2})`, text: ((y2 - y1) / U).toFixed(2) }));
  };
  const hOuter = chainX.length > 2 ? h2 : h1, vOuter = chainY.length > 2 ? v2 : v1;
  for (const x of chainX) g.append(s('line', { class: 'dr bp-dim is-ext', x1: x, y1: hEdge + hSide * 10, x2: x, y2: ((x === minX || x === maxX) ? hOuter : h1) + hSide * 6 }));
  for (const y of chainY) g.append(s('line', { class: 'dr bp-dim is-ext', x1: vEdge + vSide * 10, y1: y, x2: ((y === minY || y === maxY) ? vOuter : v1) + vSide * 6, y2: y }));
  if (chainX.length > 2) for (let i = 1; i < chainX.length; i++) hdim(chainX[i - 1], chainX[i], h1, 0);
  hdim(minX, maxX, hOuter, 1);
  if (chainY.length > 2) for (let i = 1; i < chainY.length; i++) vdim(chainY[i - 1], chainY[i], v1, 0);
  vdim(minY, maxY, vOuter, 1);
  // the bands the dimension strings occupy (for keeping notes off them)
  const hy = Math.min(hEdge, hOuter) - 22, hh = Math.abs(hOuter - hEdge) + 26;
  const vx = Math.min(vEdge, vOuter) - 20, vw = Math.abs(vOuter - vEdge) + 24;
  return [{ x: minX - 10, y: hy, w: W + 20, h: hh }, { x: vx, y: minY - 10, w: vw, h: H + 20 }];
}
