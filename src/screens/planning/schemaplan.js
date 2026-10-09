// Sandbox blueprint: the records database drawn as a floor plan. Tables are rooms that list
// their columns, foreign keys are corridors running between them.
import { s, f1, pathD, offsetPolyline } from './svg.js';
import { buildSheet, setLayerStates, drawLayers, panZoom } from './sheet.js';
import { SCHEMA, RELATIONS } from '../../data/schema.js';

const RW = 290;      // room width
const HEAD = 58;     // header height
const ROW = 27;      // column row height
const GAPX = 104, GAPY = 70;

/**
 * createSchemaPlan(catalog, { onTable(name), onColumn(name, table) }) → api
 */
export function createSchemaPlan(cat, { onTable, onColumn } = {}) {
  const meta = new Map((SCHEMA || []).map((t) => [t.name.toLowerCase(), t]));
  const rels = (RELATIONS || []).filter((r) => cat.tables.some((t) => t.name === r.from) && cat.tables.some((t) => t.name === r.to));
  const degree = new Map();
  rels.forEach((r) => { degree.set(r.from, (degree.get(r.from) || 0) + 1); degree.set(r.to, (degree.get(r.to) || 0) + 1); });

  // order: most-connected tables in the middle row(s)
  const tables = [...cat.tables].filter((t) => t.kind !== 'view' || true);
  tables.sort((a, b) => (degree.get(b.name) || 0) - (degree.get(a.name) || 0) || a.name.localeCompare(b.name));
  const n = Math.max(1, tables.length);
  let cols = 2, best = Infinity;
  for (let c = 1; c <= Math.min(8, n); c++) {
    const rows = Math.ceil(n / c);
    const w = c * RW + (c - 1) * GAPX;
    const avgH = HEAD + ROW * 6;
    const hgt = rows * avgH + (rows - 1) * GAPY;
    const score = Math.abs(w / hgt - 1.25);
    if (score < best) { best = score; cols = c; }
  }
  // snake the ordering so hubs sit centrally
  const grid = [];
  tables.forEach((t, i) => grid.push({ t, col: i % cols, row: Math.floor(i / cols) }));
  const rowsN = Math.ceil(n / cols);
  const rowH = [];
  for (let r = 0; r < rowsN; r++) rowH[r] = Math.max(...grid.filter((g) => g.row === r).map((g) => HEAD + ROW * g.t.columns.length + 14));
  const rowY = [];
  let acc = 0;
  for (let r = 0; r < rowsN; r++) { rowY[r] = acc; acc += rowH[r] + GAPY; }
  const W = cols * RW + (cols - 1) * GAPX;
  const H = acc - GAPY;
  const box = new Map();
  grid.forEach(({ t, col, row }) => {
    const h = HEAD + ROW * t.columns.length + 14;
    box.set(t.name, { x: col * (RW + GAPX), y: rowY[row], w: RW, h, t });
  });

  const sheet = buildSheet({
    content: { x: 0, y: 0, w: Math.max(W, 900), h: Math.max(H, 560) },
    meta: { project: 'Port Vesper City Records', planTitle: 'City data — all tables', title: 'All tables', sheet: 'S-000', scale: 'NTS', rev: cat.tables.length, number: '0', date: '—', file: 'NET-0000' },
  });
  const { svg, layers, ids } = sheet;
  const offX = (Math.max(W, 900) - W) / 2, offY = (Math.max(H, 560) - H) / 2;
  for (const b of box.values()) { b.x += offX; b.y += offY; }

  const corridors = s('g', { class: 'bpk bps-corridors', 'data-layer': 'schema' });
  const rooms = s('g', { class: 'bpk bps-rooms', 'data-layer': 'schema' });
  layers.append(corridors, rooms);

  // ---- corridors (foreign keys) ----
  const colY = (b, name) => {
    const i = b.t.columns.findIndex((c) => c.name === name);
    return b.y + HEAD + ROW * Math.max(0, i) + ROW / 2 + 4;
  };
  const laneUse = new Map();
  rels.forEach((r, i) => {
    const a = box.get(r.from), b = box.get(r.to);
    if (!a || !b) return;
    const ya = colY(a, r.fromCol), yb = colY(b, r.toCol);
    let path;
    const ac = a.x + a.w / 2, bc = b.x + b.w / 2;
    if (Math.abs(ac - bc) < 1) {
      // same column: loop out the right side through the gap
      const lane = (laneUse.get('c' + a.x) || 0) + 1; laneUse.set('c' + a.x, lane);
      const lx = a.x + a.w + 18 + lane * 12;
      path = [[a.x + a.w, ya], [lx, ya], [lx, yb], [b.x + b.w, yb]];
    } else {
      const right = bc > ac;
      const sx = right ? a.x + a.w : a.x, ex = right ? b.x : b.x + b.w;
      const gapKey = 'g' + Math.round(right ? sx : ex);
      const lane = (laneUse.get(gapKey) || 0); laneUse.set(gapKey, lane + 1);
      const mid = (right ? sx + 30 : ex + 30) + (lane % 6) * 12 + (right ? 0 : 0);
      const mx = Math.abs(bc - ac) > RW + GAPX + 1 ? (right ? sx + 24 + (lane % 6) * 12 : sx - 24 - (lane % 6) * 12) : mid;
      path = [[sx, ya], [mx, ya], [mx, yb], [ex, yb]];
      if (Math.abs(bc - ac) > RW + GAPX + 1) {
        // travel along the gap between rows to reach a far column
        const gy = (ya < yb ? Math.min(a.y + a.h, b.y + b.h) : Math.min(a.y, b.y)) + (ya < yb ? GAPY / 2 : -GAPY / 2) + (lane % 4) * 8;
        const ex2 = right ? ex - 24 - (lane % 6) * 10 : ex + 24 + (lane % 6) * 10;
        path = [[sx, ya], [mx, ya], [mx, gy], [ex2, gy], [ex2, yb], [ex, yb]];
      }
    }
    const g = s('g', { class: 'bps-corridor', 'data-from': r.from, 'data-to': r.to });
    const L = offsetPolyline(path, 4), R = offsetPolyline(path, -4);
    g.append(s('path', { class: 'bps-cor-fill', d: pathD(path) }));
    g.append(s('path', { class: 'dr bps-cor-ln', d: pathD(L) }), s('path', { class: 'dr bps-cor-ln', d: pathD(R) }));
    // door swing where the corridor meets the pk room
    const [ex, ey] = path[path.length - 1];
    const dirIn = Math.sign(path[path.length - 1][0] - path[path.length - 2][0]) || 1;
    g.append(s('path', { class: 'dr bps-door', d: `M${ex},${ey - 7} L${ex - dirIn * 14},${ey - 7} A14,14 0 0 ${dirIn > 0 ? 0 : 1} ${ex},${ey + 7}` }));
    g.append(s('circle', { class: 'fx bps-fk-dot', cx: path[0][0], cy: path[0][1], r: 4 }));
    corridors.append(g);
    void i;
  });

  // ---- rooms (tables) ----
  for (const b of box.values()) {
    const t = b.t;
    const m = meta.get(t.name.toLowerCase());
    const fkCols = new Set((m?.cols || []).filter((c) => c[2] === 'fk').map((c) => c[0]));
    rels.filter((r) => r.from === t.name).forEach((r) => fkCols.add(r.fromCol));
    const g = s('g', { class: 'bps-room', 'data-table': t.name, 'data-no-pan': '' });
    g.append(
      s('rect', { class: 'bps-room-bg', x: b.x, y: b.y, width: b.w, height: b.h }),
      s('rect', { class: 'dr bps-wall', x: b.x, y: b.y, width: b.w, height: b.h }),
      s('rect', { class: 'dr bps-wall-in inner', x: b.x, y: b.y, width: b.w, height: b.h, stroke: `url(#${ids.poche})` }),
      s('line', { class: 'dr bp-line-thin', x1: b.x + 8, y1: b.y + HEAD - 6, x2: b.x + b.w - 8, y2: b.y + HEAD - 6 }),
    );
    const title = s('text', { class: 'fx bps-name', x: b.x + 16, y: b.y + 36, text: t.name.toUpperCase() });
    if (t.name.length * 19.5 > b.w - 100) { title.setAttribute('textLength', b.w - 100); title.setAttribute('lengthAdjust', 'spacingAndGlyphs'); }
    g.append(title, s('text', { class: 'fx bps-count', x: b.x + b.w - 14, y: b.y + 34, text: `${t.count} rows` }));
    title.addEventListener('click', (e) => { e.stopPropagation(); onTable?.(t.name); });
    t.columns.forEach((c, i) => {
      const y = b.y + HEAD + ROW * i + ROW / 2 + 4;
      const typeLabel = (m?.cols || []).find((x) => x[0] === c.name)?.[1] || c.type || '';
      const row = s('g', { class: 'fx bps-col' + (c.pk ? ' is-pk' : '') + (fkCols.has(c.name) ? ' is-fk' : '') });
      if (c.pk) row.append(s('text', { class: 'bps-key', x: b.x + 16, y, text: 'PK' }));
      else if (fkCols.has(c.name)) row.append(s('text', { class: 'bps-key is-fk', x: b.x + 16, y, text: 'FK' }));
      const nm = s('text', { class: 'bps-cname', x: b.x + 48, y, text: c.name });
      nm.addEventListener('click', (e) => { e.stopPropagation(); onColumn?.(c.name, t.name); });
      row.append(nm, s('text', { class: 'bps-ctype', x: b.x + b.w - 14, y, text: String(typeLabel).replace(/^→\s*/, '→').slice(0, 16) }));
      g.append(row);
    });
    g.addEventListener('pointerenter', () => highlightTable(t.name));
    g.addEventListener('pointerleave', () => highlightTable(null));
    g.addEventListener('dblclick', (e) => e.stopPropagation());
    rooms.append(g);
  }

  function highlightTable(name) {
    corridors.querySelectorAll('.bps-corridor').forEach((c) => c.classList.toggle('is-hot', !!name && (c.dataset.from === name || c.dataset.to === name)));
    rooms.querySelectorAll('.bps-room').forEach((r) => r.classList.toggle('is-hot', r.dataset.table === name));
  }

  setLayerStates(sheet.el, new Set(['schema']));

  // Legibility: keep lettering at a readable on-screen size whatever the zoom. When the plan is
  // zoomed out the names grow (--ts) and the small type labels step aside (.is-compact).
  const MIN_PX = { col: 12.5, name: 16 };
  let raf = 0;
  function fitText() {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      const ctm = svg.getScreenCTM();
      if (!ctm || !svg.isConnected || !svg.clientWidth) return;
      const k = ctm.a;
      const ts = Math.min(1.9, Math.max(1, MIN_PX.col / (17 * k)));
      const tn = Math.min(1.9, Math.max(1, MIN_PX.name / (26 * k)));
      svg.style.setProperty('--ts', ts.toFixed(3));
      svg.style.setProperty('--tn', tn.toFixed(3));
      svg.classList.toggle('is-compact', ts > 1.04);
    });
  }
  const pz = panZoom(svg, sheet.viewBase, { mirror: [sheet.liveSvg], onChange: fitText });
  const ro = new ResizeObserver(fitText);
  ro.observe(svg);
  void f1;
  return {
    el: sheet.el, svg, sheet, pz,
    drawIn() { return drawLayers(sheet.el, ['schema'], { speed: 1.4 }); },
    highlightTable,
    destroy() { ro.disconnect(); cancelAnimationFrame(raf); sheet.el.remove(); },
  };
}
