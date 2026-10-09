// Simple-English checker for every line a player can read. See docs/WRITING.md.
//   node scripts/check-english.mjs            → summary + failures, exit 1 on any failure
//   node scripts/check-english.mjs --job pawn → one job (or 'prologue' / 'epilogue')
//   node scripts/check-english.mjs --words    → also list long words per job (advisory)
import { JOBS, PROLOGUE, EPILOGUE } from '../src/data/jobs.js';
import { CREW } from '../src/data/crew.js';

const args = process.argv.slice(2);
const only = args.includes('--job') ? args[args.indexOf('--job') + 1] : null;
const showWords = args.includes('--words');

const LIMIT = { default: 12, prompt: 20, headline: 8, note: 8 };
const MIN_EASE = 80; // Flesch reading ease per job (80+ ≈ easy for second-language readers)

// Slang, idioms and hard words players flagged or are likely to trip on. Lower-case, whole words/phrases.
const BANNED = [
  'darling', 'technically', 'grifter', 'wheelman', 'mastermind', 'muscle', 'the mark', 'kid', 'stays put',
  'the plumbing', 'breathe', 'rents out', 'gonna', 'wanna', 'gotta', 'ain\'t', 'y\'all', 'reckon',
  'skedaddle', 'scram', 'heist lingo', 'mark\'s', 'cased', 'casing', 'fence', 'fenced', 'the score', 'make a score',
  'ledger-man', 'pinch', 'nab', 'swag', 'loot', 'goons', 'patsy', 'stoolie', 'rat', 'squeal', 'snitch', 'the feds',
  'escalate', 'obsequious', 'sardonic', 'wheedle', 'consignor', 'provenance', 'clandestine', 'surreptitious',
  'impeccable', 'nefarious', 'labyrinth', 'ostensibly', 'notwithstanding', 'whereupon', 'heretofore',
  'velvet', 'menace', 'insouciant', 'ephemeral', 'serendipity', 'sotto voce', 'verbatim', 'ergo', 'vis-à-vis',
  'nevertheless', 'nonetheless', 'furthermore', 'moreover', 'henceforth', 'thereby', 'whilst', 'amongst',
];
// words that are fine even though they are long (domain words, names)
const ALLOW = new Set([
  'architect', 'detective', 'security', 'camera', 'cameras', 'elevator', 'penthouse', 'actually', 'everybody', 'everyone',
  'everything', 'information', 'auction', 'gallery', 'casino', 'municipal', 'ivory', 'american', 'january', 'february',
  'certificate', 'combination', 'available', 'emergency', 'alarm', 'alarms', 'immediately', 'company', 'companies',
  'secretary', 'operator', 'delivery', 'deliveries', 'necessary', 'interesting', 'material', 'electricity', 'documents',
  'identity', 'activity', 'directory', 'category', 'library', 'territory', 'ordinary', 'military', 'machinery',
]);
const NAMES = new Set(Object.values(CREW).flatMap((c) => `${c.name} ${c.short}`.toLowerCase().split(/\W+/)).filter(Boolean));

function syllables(w) {
  w = w.toLowerCase().replace(/[^a-z]/g, '');
  if (!w) return 0;
  if (w.length <= 3) return 1;
  w = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '').replace(/^y/, '');
  const m = w.match(/[aeiouy]{1,2}/g);
  return Math.max(1, m ? m.length : 1);
}
const isTech = (w) => /[_.()*=<>]/.test(w) || /^[A-Z_]{2,}$/.test(w) || /\d/.test(w);

function sentences(text) {
  const t = String(text)
    .replace(/\b(Mr|Mrs|Ms|Dr|Det|St|No|vs|etc)\./g, '$1')
    .replace(/\b([ap])\.m\./gi, '$1m')
    .replace(/(\d)\.(\d)/g, '$1,$2')
    .replace(/…/g, '.');
  return t.split(/(?<=[.!?])\s+|\n+/).map((s) => s.trim()).filter((s) => /[a-z]/i.test(s));
}
const words = (s) => s.split(/\s+/).map((w) => w.replace(/^[^\w$]+|[^\w%]+$/g, '')).filter((w) => /[a-z0-9]/i.test(w));

/* ---------------- collect every player-visible string ---------------- */
const items = []; // { src, field, text, kind }
const add = (src, field, text, kind = 'default') => { if (text && typeof text === 'string') items.push({ src, field, text, kind }); };
function pages(src, ps, label) {
  (ps || []).forEach((pg, pi) => (pg.panels || []).forEach((p, i) => {
    const f = `${label} p${pi + 1}.${i + 1}`;
    add(src, `${f} caption`, p.caption);
    (p.lines || []).forEach((l) => add(src, `${f} ${l.who}`, l.text));
    const q = p.params || {};
    add(src, `${f} tagline`, q.tagline);
    add(src, `${f} headline`, q.headline, 'headline');
    add(src, `${f} title`, q.title, 'headline');
    add(src, `${f} item`, q.item, 'note');
  }));
}
if (!only || only === 'prologue') pages('prologue', PROLOGUE, 'prologue');
if (!only || only === 'epilogue') pages('epilogue', EPILOGUE, 'epilogue');
for (const j of JOBS) {
  if (only && only !== j.id) continue;
  add(j.id, 'logline', j.logline);
  pages(j.id, j.briefing, 'briefing');
  pages(j.id, j.replay?.success, 'success');
  pages(j.id, j.replay?.failure, 'failure');
  pages(j.id, j.after, 'after');
  (j.puzzles || []).forEach((p, i) => {
    const f = `Q${i + 1}`;
    add(j.id, `${f} ask`, p.ask?.text);
    add(j.id, `${f} prompt`, p.prompt, 'prompt');
    add(j.id, `${f} hint`, p.hint, 'prompt');
    add(j.id, `${f} intel`, p.intel);
    add(j.id, `${f} react`, p.react?.text);
  });
  const pl = j.play || {};
  add(j.id, 'play question', pl.question);
  (pl.options || []).forEach((o) => { add(j.id, `play ${o.id} label`, o.label, 'note'); add(j.id, `play ${o.id} detail`, o.detail); });
  add(j.id, 'play why', pl.why);
  Object.entries(pl.wrong || {}).forEach(([k, v]) => add(j.id, `play wrong ${k}`, v));
  add(j.id, 'debrief headline', j.debrief?.headline, 'headline');
  add(j.id, 'debrief line', j.debrief?.line?.text);
  (j.blueprint?.notes || []).forEach((n, i) => add(j.id, `note ${i + 1}`, n.text, 'note'));
}

/* ---------------- check ---------------- */
const fails = [];
const stats = new Map(); // src → { words, sents, syl, long:Set }
for (const it of items) {
  const st = stats.get(it.src) || { words: 0, sents: 0, syl: 0, long: new Map() };
  stats.set(it.src, st);
  const low = ` ${it.text.toLowerCase().replace(/[’']/g, '\'')} `;
  for (const b of BANNED) {
    if (new RegExp(`[^a-z]${b.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^a-z]`).test(low)) fails.push({ ...it, why: `hard word / slang: "${b}"` });
  }
  const limit = LIMIT[it.kind] ?? LIMIT.default;
  for (const s of sentences(it.text)) {
    const ws = words(s);
    if (ws.length > limit) fails.push({ ...it, why: `sentence has ${ws.length} words (max ${limit}): "${s}"` });
    if (it.kind === 'prompt') continue; // SQL wording is technical; it doesn't count toward the reading score
    st.sents++;
    for (const w of ws) {
      st.words++;
      if (isTech(w) || NAMES.has(w.toLowerCase())) { st.syl += 1; continue; }
      const n = syllables(w);
      st.syl += n;
      if (n >= 4 && !ALLOW.has(w.toLowerCase())) st.long.set(w.toLowerCase(), (st.long.get(w.toLowerCase()) || 0) + 1);
    }
  }
}

const ease = (st) => (st.sents && st.words ? 206.835 - 1.015 * (st.words / st.sents) - 84.6 * (st.syl / st.words) : 100);
console.log('source       strings  words/sent  ease  long-words');
for (const [src, st] of stats) {
  const e = ease(st);
  const flag = e < MIN_EASE ? '  ✗' : '';
  if (e < MIN_EASE) fails.push({ src, field: 'overall', text: '', why: `reading ease ${e.toFixed(0)} < ${MIN_EASE}` });
  console.log(`${src.padEnd(12)} ${String(items.filter((i) => i.src === src).length).padStart(7)}  ${(st.words / Math.max(1, st.sents)).toFixed(1).padStart(10)}  ${e.toFixed(0).padStart(4)}  ${String(st.long.size).padStart(10)}${flag}`);
  if (showWords && st.long.size) console.log('   ', [...st.long.keys()].join(', '));
}
if (fails.length) {
  console.log(`\n${fails.length} problem(s):`);
  for (const f of fails.slice(0, 400)) console.log(`  [${f.src}] ${f.field}: ${f.why}`);
  process.exit(1);
}
console.log('\nOK: all player-facing text is simple English.');
