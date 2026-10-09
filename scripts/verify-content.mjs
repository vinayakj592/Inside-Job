// Content verifier. Run: node scripts/verify-content.mjs [--dump] [--job <id>]
// Loads SETUP_SQL into sql.js, runs every puzzle solution and concept example, and checks the
// structural rules of docs/DESIGN.md §6–7 plus docs/STORY.md. Exits 1 on any failure.
import initSqlJs from 'sql.js';
import { SETUP_SQL, SCHEMA, RELATIONS } from '../src/data/schema.js';
import { JOBS, PROLOGUE, EPILOGUE } from '../src/data/jobs.js';
import { CREW } from '../src/data/crew.js';
import { CONCEPTS, CONCEPT_ORDER } from '../src/data/concepts.js';

const args = process.argv.slice(2);
const DUMP = args.includes('--dump');
const ONLY = args.includes('--job') ? args[args.indexOf('--job') + 1] : null;

const SHOTS = new Set(['city-establish', 'street-rain', 'car-interior', 'car-chase', 'rooftop', 'face', 'two-shot', 'crew-table',
  'blueprint-closeup', 'hands-typing', 'cctv-monitor', 'corridor-camera', 'laser-hall', 'guard-patrol', 'vent-crawl', 'door-keypad',
  'safe-dial', 'vault-door', 'loot', 'clock', 'phone', 'gala-crowd', 'alarm', 'police-lights', 'getaway', 'newspaper', 'title-card',
  'silhouette-reveal', 'character-intro']);
const LAYOUTS = { full: 1, '2h': 2, '2v': 2, '3a': 3, '3b': 3, '4': 4, strip: [2, 5] };
const MOODS = new Set(['calm', 'smirk', 'tense', 'shock']);
const W = 1200, H = 760;
// Job number in which each concept is introduced (DESIGN.md §2). A puzzle may only use concepts introduced up to its job.
const INTRO = { select: 1, where: 1, orderby: 1, limit: 1, aggregate: 1, distinct: 2, like: 2, inlist: 2, between: 2, andor: 2,
  join: 3, groupby: 3, having: 4, multijoin: 4, subquery: 5, leftjoin: 5, nulls: 5, casewhen: 6, strings: 6, dates: 6,
  window: 7, rownum: 7, cte: 8, union: 8, exists: 8 };
const MAX_LINE = 140;

const errors = [];
const warns = [];
const fail = (where, msg) => errors.push(`✗ ${where}: ${msg}`);
const warn = (where, msg) => warns.push(`! ${where}: ${msg}`);

const SQL = await initSqlJs();
const db = new SQL.Database();
try { db.run(SETUP_SQL); } catch (e) { console.error('SETUP_SQL failed:', e.message); process.exit(1); }

const run = (sql) => {
  const res = db.exec(sql);
  const r = res[res.length - 1];
  return r ? { columns: r.columns, values: r.values } : { columns: [], values: [] };
};

/* ---------------- schema ---------------- */
const tables = new Map();
for (const [name] of run("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name").values) {
  tables.set(name, run(`PRAGMA table_info(${name})`).values.map((r) => r[1]));
}
for (const t of SCHEMA) {
  if (!tables.has(t.name)) { fail('SCHEMA', `table ${t.name} not in SETUP_SQL`); continue; }
  const real = tables.get(t.name);
  const doc = t.cols.map((c) => c[0]);
  if (real.join() !== doc.join()) fail('SCHEMA', `${t.name} columns [${doc}] ≠ actual [${real}]`);
  if (!t.blurb) fail('SCHEMA', `${t.name} missing blurb`);
}
for (const name of tables.keys()) if (!SCHEMA.find((t) => t.name === name)) fail('SCHEMA', `table ${name} undocumented`);
for (const r of RELATIONS) {
  if (!tables.get(r.from)?.includes(r.fromCol)) fail('RELATIONS', `${r.from}.${r.fromCol} missing`);
  if (!tables.get(r.to)?.includes(r.toCol)) fail('RELATIONS', `${r.to}.${r.toCol} missing`);
}

/* ---------------- concepts ---------------- */
for (const [key, c] of Object.entries(CONCEPTS)) {
  for (const f of ['title', 'summary', 'example', 'gotcha']) if (!c[f]) fail(`concept ${key}`, `missing ${f}`);
  try { if (!run(c.example).values.length) fail(`concept ${key}`, 'example returns 0 rows'); } catch (e) { fail(`concept ${key}`, `example errors: ${e.message}`); }
  if (!CONCEPT_ORDER.includes(key)) fail(`concept ${key}`, 'not in CONCEPT_ORDER');
}
for (const key of CONCEPT_ORDER) if (!CONCEPTS[key]) fail('CONCEPT_ORDER', `unknown key ${key}`);
for (const key of Object.keys(INTRO)) if (!CONCEPTS[key]) fail('CONCEPTS', `missing entry for ${key}`);

/* ---------------- crew ---------------- */
for (const [id, c] of Object.entries(CREW)) for (const f of ['name', 'short', 'role', 'accent', 'bio', 'look']) if (!c[f]) fail(`crew ${id}`, `missing ${f}`);

/* ---------------- cinema pages ---------------- */
const checkWho = (where, who) => { if (!CREW[who]) fail(where, `who "${who}" not in CREW`); };
const checkText = (where, text) => { if (typeof text !== 'string' || !text.trim()) fail(where, 'empty text'); else if (text.length > MAX_LINE) warn(where, `${text.length} chars (> ${MAX_LINE}): "${text.slice(0, 50)}…"`); };
function checkPages(where, pages, { min = 1, max = 99 } = {}) {
  if (!Array.isArray(pages)) return fail(where, 'not an array of pages');
  if (pages.length < min || pages.length > max) fail(where, `${pages.length} pages (want ${min}–${max})`);
  pages.forEach((pg, i) => {
    const w = `${where}[${i}]`;
    const want = LAYOUTS[pg.layout];
    if (!want) return fail(w, `unknown layout "${pg.layout}"`);
    const n = pg.panels?.length || 0;
    if (Array.isArray(want) ? n < want[0] || n > want[1] : n !== want) fail(w, `layout ${pg.layout} has ${n} panels`);
    if (pg.tint && !['teal', 'gold', 'ink'].includes(pg.tint)) fail(w, `bad tint ${pg.tint}`);
    (pg.panels || []).forEach((p, j) => {
      const pw = `${w}.${j}`;
      if (!SHOTS.has(p.shot)) fail(pw, `shot "${p.shot}" not in shot library`);
      const pr = p.params || {};
      if (['face', 'car-interior', 'phone', 'silhouette-reveal'].includes(p.shot) && pr.who) checkWho(pw, pr.who);
      if (p.shot === 'character-intro') { checkWho(pw, pr.who); if (!pr.tagline) fail(pw, 'character-intro needs params.tagline'); else checkText(pw + ' tagline', pr.tagline); }
      if (['face', 'silhouette-reveal'].includes(p.shot) && !pr.who) fail(pw, `${p.shot} needs params.who`);
      if (p.shot === 'face' && pr.mood && !MOODS.has(pr.mood)) fail(pw, `bad mood ${pr.mood}`);
      if (p.shot === 'two-shot') { checkWho(pw, pr.a); checkWho(pw, pr.b); }
      if (p.shot === 'title-card' && !pr.title) fail(pw, 'title-card needs params.title');
      if (p.shot === 'newspaper' && !pr.headline) fail(pw, 'newspaper needs params.headline');
      if (p.shot === 'clock' && !/^\d\d:\d\d$/.test(pr.time || '')) fail(pw, 'clock needs params.time HH:MM');
      if (p.shot === 'loot' && !pr.item) fail(pw, 'loot needs params.item');
      if (p.caption) checkText(pw + ' caption', p.caption);
      (p.lines || []).forEach((l) => { checkWho(pw, l.who); checkText(pw + ' line', l.text); });
    });
  });
}
checkPages('PROLOGUE', PROLOGUE, { min: 2 });
if (EPILOGUE.length) checkPages('EPILOGUE', EPILOGUE);

/* ---------------- geometry helpers ---------------- */
const inside = (x, y) => Number.isFinite(x) && Number.isFinite(y) && x >= 0 && x <= W && y >= 0 && y <= H;
function segX(a, b, c, d) { // proper intersection point of segments ab and cd, or null
  const r = [b[0] - a[0], b[1] - a[1]], s = [d[0] - c[0], d[1] - c[1]];
  const den = r[0] * s[1] - r[1] * s[0];
  if (Math.abs(den) < 1e-9) return null;
  const t = ((c[0] - a[0]) * s[1] - (c[1] - a[1]) * s[0]) / den;
  const u = ((c[0] - a[0]) * r[1] - (c[1] - a[1]) * r[0]) / den;
  if (t <= 1e-6 || t >= 1 - 1e-6 || u < 0 || u > 1) return null;
  return [a[0] + t * r[0], a[1] + t * r[1]];
}
function wallSegments(bp) {
  const segs = [...(bp.walls || []).map((w) => [[w.x1, w.y1], [w.x2, w.y2]])];
  for (const r of bp.rooms || []) {
    if (r.outdoor) continue;
    const pts = r.poly || [[r.x, r.y], [r.x + r.w, r.y], [r.x + r.w, r.y + r.h], [r.x, r.y + r.h]];
    pts.forEach((p, i) => segs.push([p, pts[(i + 1) % pts.length]]));
  }
  return segs;
}
const onDoor = (bp, p) => (bp.doors || []).some((d) => d.dir === 'h'
  ? Math.abs(p[1] - d.y) <= 4 && p[0] >= d.x - 2 && p[0] <= d.x + d.w + 2
  : Math.abs(p[0] - d.x) <= 4 && p[1] >= d.y - 2 && p[1] <= d.y + d.w + 2);

/* ---------------- jobs ---------------- */
const summary = [];
const ids = new Set();
JOBS.forEach((job, ji) => {
  if (ONLY && job.id !== ONLY) return;
  const J = `job ${job.id}`;
  if (ids.has(job.id)) fail(J, 'duplicate id'); ids.add(job.id);
  if (job.number !== ji + 1) warn(J, `number ${job.number} at position ${ji + 1}`);
  for (const f of ['title', 'target', 'district', 'sqlFocus', 'logline']) if (!job[f]) fail(J, `missing ${f}`);
  if (!(job.take > 0)) fail(J, 'take must be > 0');
  if (!job.hubPos || !(job.hubPos.x >= 0 && job.hubPos.x <= 1 && job.hubPos.y >= 0 && job.hubPos.y <= 1)) fail(J, 'hubPos must be within 0..1');
  checkPages(`${J} briefing`, job.briefing, { min: 2, max: 3 });
  if (job.briefing?.[0]?.panels?.[0]?.shot !== 'title-card') fail(`${J} briefing`, 'must start with a title-card');

  const bp = job.blueprint || {};
  const layerIds = new Set((bp.layers || []).map((l) => l.id));
  if (!bp.layers?.some((l) => l.id === 'shell' && l.initial)) fail(`${J} blueprint`, "needs layer 'shell' with initial: true");
  if (!bp.title || !bp.scale) fail(`${J} blueprint`, 'missing title/scale');
  const ents = ['rooms', 'walls', 'doors', 'windows', 'cameras', 'guards', 'lasers', 'safes', 'entries', 'notes', 'labels'];
  for (const kind of ents) {
    (bp[kind] || []).forEach((e, i) => {
      const w = `${J} blueprint.${kind}[${i}]`;
      if (!layerIds.has(e.layer)) fail(w, `layer "${e.layer}" not declared`);
      const pts = [];
      if (kind === 'rooms') { if (e.poly) pts.push(...e.poly); else pts.push([e.x, e.y], [e.x + e.w, e.y + e.h]); if (!e.name) fail(w, 'room needs a name'); }
      else if (kind === 'walls' || kind === 'lasers' || kind === 'windows') pts.push([e.x1, e.y1], [e.x2, e.y2]);
      else if (kind === 'doors') pts.push([e.x, e.y], e.dir === 'h' ? [e.x + e.w, e.y] : [e.x, e.y + e.w]);
      else if (kind === 'guards') { pts.push(...(e.path || [])); if ((e.path || []).length < 3) fail(w, 'guard path needs ≥ 3 points'); }
      else pts.push([e.x, e.y]);
      if (kind === 'doors' && !['h', 'v'].includes(e.dir)) fail(w, "door dir must be 'h' or 'v'");
      if (kind === 'cameras') { if (!(e.fov > 0 && e.range > 0)) fail(w, 'camera needs fov and range'); if (e.dir < 0 || e.dir >= 360) warn(w, 'dir outside 0..359'); }
      if (kind === 'safes' && !['safe', 'vault'].includes(e.kind)) fail(w, "safe kind must be 'safe' or 'vault'");
      for (const [x, y] of pts) if (!inside(x, y)) fail(w, `point (${x}, ${y}) outside ${W}×${H}`);
    });
  }
  // guard loops must not walk through walls
  const segs = wallSegments(bp);
  const pathThroughWalls = (path, closed) => {
    const bad = [];
    const n = closed ? path.length : path.length - 1;
    for (let i = 0; i < n; i++) {
      const a = path[i], b = path[(i + 1) % path.length];
      for (const [c, d] of segs) { const p = segX(a, b, c, d); if (p && !onDoor(bp, p)) bad.push(`(${Math.round(p[0])}, ${Math.round(p[1])})`); }
    }
    return [...new Set(bad)];
  };
  (bp.guards || []).forEach((g) => { const bad = pathThroughWalls(g.path || [], g.loop !== false); if (bad.length) fail(`${J} guard ${g.id}`, `path crosses a wall at ${bad.join(', ')}`); });

  // puzzles
  const P = job.puzzles || [];
  if (P.length !== 5) fail(J, `${P.length} puzzles (need exactly 5)`);
  const seen = new Map();
  const revealed = new Set(['shell']);
  const rows = [];
  P.forEach((p, i) => {
    const w = `${J} P${i + 1} "${p.title}"`;
    for (const f of ['title', 'prompt', 'sql', 'hint', 'intel']) if (!p[f]) fail(w, `missing ${f}`);
    if (typeof p.orderMatters !== 'boolean') fail(w, 'orderMatters must be boolean');
    if (p.orderMatters && !/order\s+by/i.test(p.sql)) warn(w, 'orderMatters but the SQL has no ORDER BY');
    if (!p.ask?.who || !p.ask?.text) fail(w, 'ask needs who + text'); else { checkWho(w, p.ask.who); checkText(w + ' ask', p.ask.text); }
    if (!p.react?.who || !p.react?.text) fail(w, 'react needs who + text'); else { checkWho(w, p.react.who); checkText(w + ' react', p.react.text); }
    checkText(w + ' hint', p.hint || '');
    if (!p.concepts?.length) fail(w, 'no concepts');
    for (const c of p.concepts || []) {
      if (!CONCEPTS[c]) fail(w, `unknown concept "${c}"`);
      else if (INTRO[c] > job.number) fail(w, `concept "${c}" is introduced in job ${INTRO[c]}, too early for job ${job.number}`);
    }
    if (!p.reveals?.length) fail(w, 'reveals nothing');
    for (const l of p.reveals || []) { if (!layerIds.has(l)) fail(w, `reveals unknown layer "${l}"`); revealed.add(l); }
    let res;
    try { res = run(p.sql); } catch (e) { fail(w, `SQL error: ${e.message}`); rows.push('ERR'); return; }
    if (!res.values.length) fail(w, 'solution returns 0 rows');
    const key = JSON.stringify(p.orderMatters ? res.values : [...res.values].map((r) => JSON.stringify(r)).sort());
    if (seen.has(key)) fail(w, `identical result to P${seen.get(key) + 1}`);
    seen.set(key, i);
    rows.push(res.values.length);
    if (DUMP) {
      console.log(`\n── ${job.id} P${i + 1} ${p.title}  [${p.concepts.join(', ')}]  ${res.values.length} row(s)`);
      console.log('   ' + res.columns.join(' | '));
      for (const r of res.values.slice(0, 6)) console.log('   ' + r.map((v) => (v === null ? 'NULL' : v)).join(' | '));
      if (res.values.length > 6) console.log(`   … ${res.values.length - 6} more`);
      console.log(`   intel: ${p.intel}`);
    }
  });
  for (const l of layerIds) if (!revealed.has(l)) warn(`${J} blueprint`, `layer "${l}" is never revealed by a puzzle`);

  // play
  const play = job.play || {};
  const opts = play.options || [];
  if (!play.question) fail(`${J} play`, 'missing question');
  if (opts.length < 3 || opts.length > 4) fail(`${J} play`, `${opts.length} options (want 3–4)`);
  if (!opts.find((o) => o.id === play.answer)) fail(`${J} play`, `answer "${play.answer}" is not an option`);
  if (!play.why) fail(`${J} play`, 'missing why');
  opts.forEach((o) => {
    const w = `${J} play option ${o.id}`;
    if (!o.label || !o.detail) fail(w, 'needs label and detail');
    if (o.id !== play.answer && !play.wrong?.[o.id]) fail(w, 'wrong option has no `wrong` reason');
    if (!Array.isArray(o.route) || o.route.length < 2) fail(w, 'route needs ≥ 2 points');
    for (const [x, y] of o.route || []) if (!inside(x, y)) fail(w, `route point (${x}, ${y}) outside ${W}×${H}`);
    const bad = pathThroughWalls(o.route || [], false);
    if (bad.length) fail(w, `route crosses a wall (not at a door) at ${bad.join(', ')}`);
  });
  for (const k of Object.keys(play.wrong || {})) if (!opts.find((o) => o.id === k)) fail(`${J} play`, `wrong.${k} is not an option`);

  checkPages(`${J} replay.success`, job.replay?.success, { min: 3, max: 4 });
  checkPages(`${J} replay.failure`, job.replay?.failure, { min: 1, max: 2 });
  if (!job.debrief?.headline) fail(`${J} debrief`, 'missing headline');
  if (!job.debrief?.line?.who) fail(`${J} debrief`, 'missing line'); else checkWho(`${J} debrief`, job.debrief.line.who);
  if (job.after) checkPages(`${J} after`, job.after);

  summary.push([job.number, job.id, job.title, rows.join(' / '), opts.length, play.answer]);
});

/* ---------------- report ---------------- */
console.log('\n#  job        title                rows per puzzle          play');
for (const [n, id, title, rows, nopt, ans] of summary) {
  console.log(`${String(n).padEnd(2)} ${id.padEnd(10)} ${title.padEnd(20)} ${rows.padEnd(24)} ${nopt} opts → ${ans}`);
}
console.log(`\n${JOBS.length} job(s), ${Object.keys(CONCEPTS).length} concepts, ${SCHEMA.length} tables, ${Object.keys(CREW).length} characters.`);
if (warns.length) console.log('\nWarnings:\n' + warns.join('\n'));
if (errors.length) {
  console.log(`\nFAILED with ${errors.length} error(s):\n` + errors.join('\n'));
  process.exit(1);
}
console.log('\nOK: all content checks passed.');
