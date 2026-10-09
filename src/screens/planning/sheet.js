// The drafting sheet: paper, grid, frame, zone ticks, title block, north arrow, drawing title,
// masking tape, plus pan/zoom and the layer reveal machinery. Content is drawn by blueprint.js
// (a job's building) or schemaplan.js (the database drawn as a floor plan).
import { s, f1, rng, cssEsc } from './svg.js';
import { reducedMotion } from '../../core/dom.js';

let uid = 0;

/**
 * buildSheet({ content: {x,y,w,h}, meta: { project, title, sheet, scale, drawn, rev, date, number } })
 * → { svg, ids, content, frame, layers, marks, live, viewBase }
 */
export function buildSheet({ content, meta }) {
  const id = 'bp' + ++uid;
  const ids = { grid: id + '-grid', gridMaj: id + '-gridM', poche: id + '-poche', hatch: id + '-hatch', glow: id + '-glow', grease: id + '-grease', arrow: id + '-arrow', chev: id + '-chev', greaseArrow: id + '-garrow' };
  const m = { l: 70, r: 70, t: 96, b: 160 };
  const frame = { x: content.x - m.l, y: content.y - m.t, w: content.w + m.l + m.r, h: content.h + m.t + m.b };
  const pad = 30;
  const viewBase = { x: frame.x - pad, y: frame.y - pad, w: frame.w + pad * 2, h: frame.h + pad * 2 };

  const svg = s('svg', { class: 'bp-svg', xmlns: 'http://www.w3.org/2000/svg', viewBox: `${viewBase.x} ${viewBase.y} ${viewBase.w} ${viewBase.h}`, preserveAspectRatio: 'xMidYMid meet', role: 'img', 'aria-label': meta.title || 'Blueprint' });

  const defs = s('defs', {},
    s('pattern', { id: ids.grid, width: 20, height: 20, patternUnits: 'userSpaceOnUse' },
      s('path', { d: 'M20 0H0V20', class: 'bp-grid-minor' })),
    s('pattern', { id: ids.gridMaj, width: 100, height: 100, patternUnits: 'userSpaceOnUse' },
      s('rect', { width: 100, height: 100, fill: `url(#${ids.grid})` }),
      s('path', { d: 'M100 0H0V100', class: 'bp-grid-major' })),
    s('pattern', { id: ids.poche, width: 7, height: 7, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' },
      s('rect', { width: 7, height: 7, class: 'bp-poche-bg' }),
      s('line', { x1: 0, y1: 0, x2: 0, y2: 7, class: 'bp-poche-ln' })),
    s('pattern', { id: ids.hatch, width: 9, height: 9, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(-35)' },
      s('line', { x1: 0, y1: 0, x2: 0, y2: 9, class: 'bp-hatch-ln' })),
    s('filter', { id: ids.glow, x: '-10%', y: '-10%', width: '120%', height: '120%' },
      s('feGaussianBlur', { in: 'SourceGraphic', stdDeviation: 2.6, result: 'b' }),
      s('feGaussianBlur', { in: 'SourceGraphic', stdDeviation: 7, result: 'b2' }),
      s('feComponentTransfer', { in: 'b2', result: 'b3' }, s('feFuncA', { type: 'linear', slope: 0.6 })),
      s('feMerge', {}, s('feMergeNode', { in: 'b3' }), s('feMergeNode', { in: 'b' }), s('feMergeNode', { in: 'SourceGraphic' }))),
    s('filter', { id: ids.grease, x: '-5%', y: '-20%', width: '110%', height: '140%' },
      s('feTurbulence', { type: 'fractalNoise', baseFrequency: 0.9, numOctaves: 1, seed: 3, result: 'n' }),
      s('feDisplacementMap', { in: 'SourceGraphic', in2: 'n', scale: 2.4, xChannelSelector: 'R', yChannelSelector: 'G', result: 'd' }),
      s('feGaussianBlur', { in: 'd', stdDeviation: 2.4, result: 'g' }),
      s('feComponentTransfer', { in: 'g', result: 'g2' }, s('feFuncA', { type: 'linear', slope: 0.55 })),
      s('feMerge', {}, s('feMergeNode', { in: 'g2' }), s('feMergeNode', { in: 'd' }))),
    s('marker', { id: ids.arrow, viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 9, markerHeight: 9, orient: 'auto-start-reverse', markerUnits: 'userSpaceOnUse' },
      s('path', { d: 'M0,1 L10,5 L0,9', class: 'bp-arrowhead' })),
    s('marker', { id: ids.chev, viewBox: '0 0 10 10', refX: 5, refY: 5, markerWidth: 12, markerHeight: 12, orient: 'auto', markerUnits: 'userSpaceOnUse' },
      s('path', { d: 'M2,1 L8,5 L2,9', class: 'bp-chev' })),
    s('marker', { id: ids.greaseArrow, viewBox: '0 0 12 12', refX: 8, refY: 6, markerWidth: 22, markerHeight: 22, orient: 'auto', markerUnits: 'userSpaceOnUse' },
      s('path', { d: 'M1,1.5 L9,6 L1.5,10.5', class: 'bp-grease-head' })),
  );
  svg.append(defs);

  // paper + grid, far larger than the sheet so panning never finds an edge
  const big = { x: viewBase.x - 3000, y: viewBase.y - 3000, w: viewBase.w + 6000, h: viewBase.h + 6000 };
  svg.append(
    s('rect', { class: 'bp-paper', x: big.x, y: big.y, width: big.w, height: big.h }),
    s('rect', { class: 'bp-gridrect', x: big.x, y: big.y, width: big.w, height: big.h, fill: `url(#${ids.gridMaj})` }),
  );

  const deco = s('g', { class: 'bp-deco' });
  const layers = s('g', { class: 'bp-layers', filter: `url(#${ids.glow})` });
  const marks = s('g', { class: 'bp-marks' });
  const top = s('g', { class: 'bp-top' });
  svg.append(deco, layers, marks, top);
  // Continuously animated things (walkers, pulses) live in a second, unfiltered SVG stacked on top,
  // so the glowing sheet only repaints when something is revealed.
  const liveSvg = s('svg', { class: 'bp-svg bp-svg--live', viewBox: svg.getAttribute('viewBox'), preserveAspectRatio: 'xMidYMid meet', 'aria-hidden': 'true' });
  const live = s('g', { class: 'bp-live' });
  liveSvg.append(live);
  const el = document.createElement('div');
  el.className = 'bp-stack';
  el.append(svg, liveSvg);

  drawFrame(deco, frame, content, meta);
  drawTape(top, frame);
  return { el, svg, liveSvg, ids, content, frame, layers, marks, live, deco, top, viewBase };
}

function drawFrame(g, fr, content, meta) {
  const r = rng(meta.project || 'x');
  // coffee ring, faint, on the paper
  const cx = fr.x + fr.w * (0.1 + r() * 0.15), cy = fr.y + fr.h * (0.12 + r() * 0.1);
  g.append(s('circle', { class: 'bp-coffee', cx: f1(cx), cy: f1(cy), r: 58, 'stroke-dasharray': '220 30 90 25', transform: `rotate(${Math.round(r() * 360)} ${f1(cx)} ${f1(cy)})` }), s('circle', { class: 'bp-coffee bp-coffee--2', cx: f1(cx + 3), cy: f1(cy - 2), r: 52 }));

  // double border
  g.append(
    s('rect', { class: 'bp-frame', x: fr.x, y: fr.y, width: fr.w, height: fr.h }),
    s('rect', { class: 'bp-frame bp-frame--in', x: fr.x + 9, y: fr.y + 9, width: fr.w - 18, height: fr.h - 18 }),
  );
  // zone ticks: numbers along top/bottom, letters down the sides
  const cols = Math.max(4, Math.round(fr.w / 240));
  const rows = Math.max(3, Math.round(fr.h / 240));
  for (let i = 0; i <= cols; i++) {
    const x = fr.x + (fr.w / cols) * i;
    if (i > 0 && i < cols) g.append(s('line', { class: 'bp-tick', x1: x, y1: fr.y, x2: x, y2: fr.y + 9 }), s('line', { class: 'bp-tick', x1: x, y1: fr.y + fr.h - 9, x2: x, y2: fr.y + fr.h }));
    if (i < cols) {
      const mx = x + fr.w / cols / 2;
      g.append(s('text', { class: 'bp-zone', x: f1(mx), y: fr.y + 7, text: i + 1 }), s('text', { class: 'bp-zone', x: f1(mx), y: fr.y + fr.h - 2, text: i + 1 }));
    }
  }
  for (let j = 0; j <= rows; j++) {
    const y = fr.y + (fr.h / rows) * j;
    if (j > 0 && j < rows) g.append(s('line', { class: 'bp-tick', x1: fr.x, y1: y, x2: fr.x + 9, y2: y }), s('line', { class: 'bp-tick', x1: fr.x + fr.w - 9, y1: y, x2: fr.x + fr.w, y2: y }));
    if (j < rows) {
      const my = y + fr.h / rows / 2 + 3;
      const L = String.fromCharCode(65 + j);
      g.append(s('text', { class: 'bp-zone', x: fr.x + 4.5, y: f1(my), text: L }), s('text', { class: 'bp-zone', x: fr.x + fr.w - 4.5, y: f1(my), text: L }));
    }
  }

  // ---- title block, bottom right ----
  const tw = 540, th = 96;
  const tx = fr.x + fr.w - 9 - tw, ty = fr.y + fr.h - 9 - th;
  const tb = s('g', { class: 'bp-tb' });
  tb.append(s('rect', { class: 'bp-tb-box', x: tx, y: ty, width: tw, height: th }));
  const cell = (x, y, w, h, label, value, big = false) => {
    tb.append(s('rect', { class: 'bp-tb-cell', x, y, width: w, height: h }));
    tb.append(s('text', { class: 'bp-tb-label', x: x + 8, y: y + 13, text: label }));
    const t = s('text', { class: 'bp-tb-value' + (big ? ' is-big' : ''), x: x + 8, y: y + h - 10, text: value });
    const est = String(value).length * (big ? 11.2 : 8.6);
    if (est > w - 16) { t.setAttribute('textLength', w - 16); t.setAttribute('lengthAdjust', 'spacingAndGlyphs'); }
    tb.append(t);
    return t;
  };
  cell(tx, ty, 300, 50, 'Project', meta.project || '', true);
  cell(tx + 300, ty, 80, 50, 'Sheet', meta.sheet || 'A-101');
  cell(tx + 380, ty, 80, 50, 'Scale', meta.scale || '1:100');
  const rev = cell(tx + 460, ty, 80, 50, 'Rev', String(meta.rev ?? 0));
  rev.classList.add('bp-tb-rev');
  cell(tx, ty + 50, 300, 46, 'Drawing', meta.title || '');
  cell(tx + 300, ty + 50, 160, 46, 'Drawn by', meta.drawn || 'The Architect');
  cell(tx + 460, ty + 50, 80, 46, 'Date', meta.date || '—');
  g.append(tb);

  // ---- legend: which layers are on the drawing (fills in as intel comes back) ----
  let legendX = tx;
  if (meta.legend?.length) {
    const lw = 330;
    legendX = tx - lw;
    const lg = s('g', { class: 'bp-legend' });
    lg.append(s('rect', { class: 'bp-tb-box', x: legendX, y: ty, width: lw, height: th }));
    lg.append(s('text', { class: 'bp-tb-label', x: legendX + 8, y: ty + 13, text: 'Map key' }));
    const perCol = Math.max(3, Math.ceil(meta.legend.length / 2));
    const rowH = Math.min(19, (th - 24) / perCol);
    meta.legend.forEach((l, i) => {
      const col = Math.floor(i / perCol), row = i % perCol;
      const x = legendX + 10 + col * (lw / 2), y = ty + 30 + row * rowH;
      const e = s('g', { class: 'bp-leg', 'data-legend': l.id, transform: `translate(${f1(x)} ${f1(y)})` });
      e.append(legendSymbol(l.kind), s('text', { class: 'bp-leg-t', x: 30, y: 4, text: l.label }));
      e.append(s('path', { class: 'bp-leg-tick', d: 'M-6,0 L-3,4 L3,-5', pathLength: 1 }));
      lg.append(e);
    });
    g.append(lg);
  }

  // ---- drawing title, bottom left: callout bubble + title + scale bar ----
  const dx = fr.x + 40, dy = fr.y + fr.h - 64;
  const dt = s('g', { class: 'bp-dtitle' });
  dt.append(
    s('circle', { class: 'bp-callout', cx: dx + 24, cy: dy, r: 24 }),
    s('line', { class: 'bp-callout-ln', x1: dx, y1: dy, x2: dx + 48, y2: dy }),
    s('text', { class: 'bp-callout-t', x: dx + 24, y: dy - 6, text: meta.number || '1' }),
    s('text', { class: 'bp-callout-t is-sm', x: dx + 24, y: dy + 16, text: meta.sheet || 'A-101' }),
  );
  const titleText = (meta.planTitle || 'Plan').toUpperCase();
  const tt = s('text', { class: 'bp-dtitle-t', x: dx + 62, y: dy - 4, text: titleText });
  const maxW = legendX - (dx + 62) - 40;
  if (titleText.length * 15 > maxW) { tt.setAttribute('textLength', maxW); tt.setAttribute('lengthAdjust', 'spacingAndGlyphs'); }
  dt.append(tt,
    s('line', { class: 'bp-dtitle-ul', x1: dx + 58, y1: dy + 6, x2: dx + 58 + Math.min(maxW, titleText.length * 15) + 8, y2: dy + 6 }),
    s('line', { class: 'bp-dtitle-ul is-thin', x1: dx + 58, y1: dy + 10, x2: dx + 58 + Math.min(maxW, titleText.length * 15) + 8, y2: dy + 10 }),
    s('text', { class: 'bp-dtitle-s', x: dx + 62, y: dy + 28, text: `SCALE ${meta.scale || '1:100'}` }),
  );
  // scale bar
  const sbx = dx + 190, sby = dy + 22;
  for (let i = 0; i < 5; i++) dt.append(s('rect', { class: 'bp-scalebar' + (i % 2 ? '' : ' is-fill'), x: sbx + i * 30, y: sby, width: 30, height: 6 }));
  ['0', '5', '10', '15', '20', '25 m'].forEach((t, i) => dt.append(s('text', { class: 'bp-scalebar-t', x: sbx + i * 30, y: sby + 17, text: t })));
  g.append(dt);

  // ---- north arrow, top right margin ----
  const nx = fr.x + fr.w - 60, ny = fr.y + 52;
  g.append(s('g', { class: 'bp-north', transform: `translate(${nx} ${ny})` },
    s('circle', { r: 26, class: 'bp-north-c' }),
    s('circle', { r: 20, class: 'bp-north-c is-thin' }),
    s('path', { d: 'M0,-30 L9,10 L0,4 Z', class: 'bp-north-fill' }),
    s('path', { d: 'M0,-30 L-9,10 L0,4 Z', class: 'bp-north-open' }),
    s('text', { y: 24, class: 'bp-north-t', text: 'N' }),
  ));
  // sheet stamp top-left
  g.append(s('text', { class: 'bp-sheetnote', x: fr.x + 26, y: fr.y + 74, text: `PORT VESPER CITY RECORDS · FILE ${meta.file || '—'}` }));
  g.append(s('text', { class: 'bp-sheetnote is-sm', x: fr.x + 26, y: fr.y + 90, text: 'COPY — NOT FOR BUILDING' }));
}

function legendSymbol(kind) {
  switch (kind) {
    case 'walls': return s('g', {}, s('rect', { class: 'bp-leg-wall', x: 2, y: -4, width: 22, height: 8 }));
    case 'rooms': return s('rect', { class: 'bp-leg-ln', x: 3, y: -6, width: 20, height: 12 });
    case 'cameras': return s('path', { class: 'bp-leg-ln', d: 'M3,0 L23,-7 A20,20 0 0 1 23,7 Z' });
    case 'guards': return s('g', {}, s('path', { class: 'bp-leg-ln is-dash', d: 'M1,0 H25' }), s('circle', { class: 'bp-leg-dot', cx: 13, cy: 0, r: 3.5 }));
    case 'lasers': return s('path', { class: 'bp-leg-ln is-dash', d: 'M1,0 H25 M1,-3 V3 M25,-3 V3' });
    case 'safes': return s('g', {}, s('circle', { class: 'bp-leg-ln', cx: 13, cy: 0, r: 7 }), s('circle', { class: 'bp-leg-ln', cx: 13, cy: 0, r: 4 }));
    case 'entries': return s('g', {}, s('circle', { class: 'bp-leg-ln', cx: 13, cy: 0, r: 7 }), s('path', { class: 'bp-leg-ln', d: 'M6,0 H20' }));
    case 'doors': return s('path', { class: 'bp-leg-ln', d: 'M4,6 V-6 A12,12 0 0 1 16,6' });
    case 'windows': return s('path', { class: 'bp-leg-ln', d: 'M2,-3 H24 M2,0 H24 M2,3 H24' });
    case 'notes': return s('path', { class: 'bp-leg-grease', d: 'M2,2 C6,-5 10,6 14,-1 S22,3 25,-3' });
    default: return s('rect', { class: 'bp-leg-ln is-dash', x: 3, y: -5, width: 20, height: 10 });
  }
}

function drawTape(g, fr) {
  const tape = (x, y, rot) => s('path', { class: 'bp-tape', transform: `translate(${f1(x)} ${f1(y)}) rotate(${rot})`, d: 'M-52,-15 L50,-13 L54,-4 L51,4 L53,15 L-50,14 L-54,5 L-51,-4 Z' });
  g.append(tape(fr.x + 6, fr.y + 4, -38), tape(fr.x + fr.w - 6, fr.y + 4, 38), tape(fr.x + 6, fr.y + fr.h - 4, 36), tape(fr.x + fr.w - 6, fr.y + fr.h - 4, -36));
}

/* ------------------------------------------------------------------ */
/* Layer reveal machinery                                              */
/* ------------------------------------------------------------------ */
const GEOM = new Set(['path', 'line', 'polyline', 'polygon', 'rect', 'circle', 'ellipse']);

/** Set the initial visible/ghost state of every [data-layer] group. */
export function setLayerStates(svg, visible) {
  svg.querySelectorAll('[data-layer]').forEach((g) => g.classList.toggle('is-ghost', !visible.has(g.dataset.layer)));
}

/**
 * Draw a set of layers in: stroke-dash animation, pop-in for text and fills, glow bloom.
 * Resolves when the animation is done.
 */
export function drawLayers(svg, layerIds, { stagger = 380, speed = 1 } = {}) {
  const fast = reducedMotion();
  let maxEnd = 0;
  layerIds.forEach((lid, li) => {
    const groups = svg.querySelectorAll(`[data-layer="${cssEsc(lid)}"]`);
    const base = li * stagger;
    groups.forEach((g) => {
      g.classList.remove('is-ghost');
      if (fast) return;
      const drs = [...g.querySelectorAll('.dr')];
      drs.forEach((el, i) => {
        if (!GEOM.has(el.tagName)) return;
        const d = base + Math.min(i * 45, 900) / speed;
        const dur = (700 + Math.min(600, (el.getTotalLength?.() || 200) * 0.9)) / speed;
        el.setAttribute('pathLength', '1');
        el.style.setProperty('--d', d + 'ms');
        el.style.setProperty('--dur', dur + 'ms');
        el.classList.add('is-drawing');
        maxEnd = Math.max(maxEnd, d + dur);
        setTimeout(() => {
          el.classList.remove('is-drawing');
          el.removeAttribute('pathLength');
        }, d + dur + 60);
      });
      g.querySelectorAll('.fx').forEach((el, i) => {
        const d = base + 350 / speed + Math.min(i * 60, 900) / speed;
        el.style.setProperty('--d', d + 'ms');
        el.classList.remove('is-popping');
        void el.getBBox;
        el.classList.add('is-popping');
        maxEnd = Math.max(maxEnd, d + 500);
        setTimeout(() => el.classList.remove('is-popping'), d + 700);
      });
      g.style.setProperty('--d', base + 'ms');
      g.classList.remove('is-bloom');
      void g.getBoundingClientRect();
      g.classList.add('is-bloom');
      setTimeout(() => g.classList.remove('is-bloom'), base + 2200);
    });
  });
  return new Promise((r) => setTimeout(r, fast ? 0 : maxEnd + 100));
}

/* ------------------------------------------------------------------ */
/* Pan / zoom                                                           */
/* ------------------------------------------------------------------ */
export function panZoom(svg, base, { onChange, mirror = [] } = {}) {
  let vb = { ...base };
  const apply = () => {
    const v = `${f1(vb.x)} ${f1(vb.y)} ${f1(vb.w)} ${f1(vb.h)}`;
    svg.setAttribute('viewBox', v);
    mirror.forEach((m) => m.setAttribute('viewBox', v));
    onChange?.(vb);
  };
  const toSvg = (cx, cy) => {
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    const p = new DOMPoint(cx, cy).matrixTransform(ctm.inverse());
    return { x: p.x, y: p.y };
  };
  const zoomAt = (factor, cx, cy) => {
    const minW = base.w / 4, maxW = base.w * 1.15;
    const nw = Math.max(minW, Math.min(maxW, vb.w * factor));
    const k = nw / vb.w;
    if (k === 1) return;
    const p = cx == null ? { x: vb.x + vb.w / 2, y: vb.y + vb.h / 2 } : toSvg(cx, cy);
    vb = { x: p.x - (p.x - vb.x) * k, y: p.y - (p.y - vb.y) * k, w: vb.w * k, h: vb.h * k };
    clamp();
    apply();
  };
  const clamp = () => {
    const mx = base.w * 0.35, my = base.h * 0.35;
    vb.x = Math.max(base.x - mx, Math.min(base.x + base.w + mx - vb.w, vb.x));
    vb.y = Math.max(base.y - my, Math.min(base.y + base.h + my - vb.h, vb.y));
  };
  const onWheel = (e) => {
    e.preventDefault();
    zoomAt(Math.exp(e.deltaY * (e.deltaMode ? 0.05 : 0.0016)), e.clientX, e.clientY);
  };
  let drag = null;
  let moved = false;
  const onDown = (e) => {
    if (e.button !== 0 || e.target.closest?.('[data-no-pan]')) return;
    drag = { x: e.clientX, y: e.clientY, vb: { ...vb } };
    moved = false;
  };
  const onMove = (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (!moved && Math.hypot(dx, dy) < 5) return;
    if (!moved) { moved = true; svg.classList.add('is-panning'); try { svg.setPointerCapture(e.pointerId); } catch { /* ignore */ } }
    const ctm = svg.getScreenCTM();
    const k = ctm ? 1 / ctm.a : 1;
    vb.x = drag.vb.x - dx * k;
    vb.y = drag.vb.y - dy * k;
    clamp();
    apply();
  };
  const onUp = () => { drag = null; svg.classList.remove('is-panning'); };
  const onClickCapture = (e) => { if (moved) { e.stopPropagation(); e.preventDefault(); moved = false; } };
  const onDbl = (e) => { if (!e.target.closest?.('[data-no-pan]')) reset(); };
  svg.addEventListener('wheel', onWheel, { passive: false });
  svg.addEventListener('pointerdown', onDown);
  svg.addEventListener('pointermove', onMove);
  svg.addEventListener('pointerup', onUp);
  svg.addEventListener('pointercancel', onUp);
  svg.addEventListener('click', onClickCapture, true);
  svg.addEventListener('dblclick', onDbl);
  function reset() { vb = { ...base }; apply(); }
  return {
    zoomIn: () => zoomAt(0.8),
    zoomOut: () => zoomAt(1.25),
    reset,
    get zoomed() { return Math.abs(vb.w - base.w) > 1; },
    /** Fit a blueprint-space box into the part of the viewport left free by insets (px). */
    frame(box, { top = 0, right = 0, bottom = 0, left = 0 } = {}, ms = 650) {
      const W = svg.clientWidth || 1, H = svg.clientHeight || 1;
      const aw = Math.max(50, W - left - right), ah = Math.max(50, H - top - bottom);
      const k = Math.min(aw / box.w, ah / box.h);
      const target = { w: W / k, h: H / k, x: box.x + box.w / 2 - (left + aw / 2) / k, y: box.y + box.h / 2 - (top + ah / 2) / k };
      return animateTo(target, ms);
    },
    /** Animate the view to focus a box (used by the play). */
    focus(box, ms = 700) {
      const target = { ...box };
      const W = svg.clientWidth || base.w, H = svg.clientHeight || base.h;
      const ratio = W / H;
      if (target.w / target.h > ratio) { const nh = target.w / ratio; target.y -= (nh - target.h) / 2; target.h = nh; } else { const nw = target.h * ratio; target.x -= (nw - target.w) / 2; target.w = nw; }
      return animateTo(target, ms);
    },
  };
  function animateTo(target, ms) {
      if (reducedMotion()) { vb = { ...target }; apply(); return Promise.resolve(); }
      const from = { ...vb };
      const t0 = performance.now();
      return new Promise((res) => {
        const step = (t) => {
          const k = Math.min(1, (t - t0) / ms);
          const e = 1 - Math.pow(1 - k, 3);
          vb = { x: from.x + (target.x - from.x) * e, y: from.y + (target.y - from.y) * e, w: from.w + (target.w - from.w) * e, h: from.h + (target.h - from.h) * e };
          apply();
          if (k < 1) requestAnimationFrame(step); else res();
        };
        requestAnimationFrame(step);
      });
  }
}
