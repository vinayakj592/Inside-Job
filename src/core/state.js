// Persistent game state + economy. See docs/DESIGN.md §3 and §5.2.
import { emit } from './bus.js';
import { JOBS } from '../data/jobs.js';

const KEY = 'inside-job/save/v1';
const HINT_HEAT = 3;
const SOLUTION_HEAT = 8;
const WRONG_PLAY_HEAT = 12;
const HEAT_DECAY = 15;

export const RANKS = [
  [0, 'Beginner'],
  [15000, 'Helper'],
  [60000, 'Team Member'],
  [150000, 'Planner'],
  [400000, 'Expert'],
  [900000, 'Top Expert'],
  [2000000, 'Master Planner'],
  [4000000, 'City Legend'],
];

const fresh = () => ({
  version: 1,
  started: false,
  cash: 0,
  heat: 0,
  jobs: {},
  seen: {},
  sandbox: { draft: '', history: [] },
  stats: { runs: 0, errors: 0 },
  settings: { sound: true, music: true, typewriter: true, unlockAll: false, quality: 'high' },
});

let S = load();
let saveTimer = null;

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return fresh();
    const data = JSON.parse(raw);
    const base = fresh();
    return { ...base, ...data, settings: { ...base.settings, ...data.settings }, sandbox: { ...base.sandbox, ...data.sandbox }, stats: { ...base.stats, ...data.stats } };
  } catch {
    return fresh();
  }
}

export function save() {
  clearTimeout(saveTimer);
  try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { /* storage unavailable: play on without saving */ }
}
function touch() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(save, 250);
}

export const get = () => S;
export const hasSave = () => S.started;

/* ---------------- settings ---------------- */
export const settings = () => S.settings;
export function setSetting(key, value) {
  S.settings[key] = value;
  touch();
  emit('settings', { key, value });
}

/* ---------------- story flags ---------------- */
export const seen = (key) => !!S.seen[key];
export function markSeen(key) { S.seen[key] = true; touch(); }
export function start() { S.started = true; touch(); }

/* ---------------- jobs ---------------- */
export const jobIndex = (jobId) => JOBS.findIndex((j) => j.id === jobId);
export const jobDef = (jobId) => JOBS.find((j) => j.id === jobId);

export function job(jobId) {
  if (!S.jobs[jobId]) {
    S.jobs[jobId] = { solved: [false, false, false, false, false], attempts: {}, play: { done: false, wrong: [] }, stars: 0, take: 0, completedAt: null };
  }
  return S.jobs[jobId];
}

export function attempt(jobId, pi) {
  const j = job(jobId);
  if (!j.attempts[pi]) j.attempts[pi] = { tries: 0, hints: 0, solution: false, draft: '', history: [] };
  return j.attempts[pi];
}

export const solvedCount = (jobId) => job(jobId).solved.filter(Boolean).length;
export const allQueriesSolved = (jobId) => solvedCount(jobId) === 5;
export const isJobDone = (jobId) => !!job(jobId).play.done;

export function isUnlocked(index) {
  if (S.settings.unlockAll || index <= 0) return true;
  const prev = JOBS[index - 1];
  return !!prev && isJobDone(prev.id);
}

/** Index of the job the player should do next (first unfinished unlocked job). */
export function currentJobIndex() {
  const i = JOBS.findIndex((j) => !isJobDone(j.id));
  return i === -1 ? JOBS.length - 1 : i;
}

export function recordRun(ok) {
  S.stats.runs++;
  if (!ok) S.stats.errors++;
  touch();
}

export function solveQuery(jobId, pi) {
  const j = job(jobId);
  const a = attempt(jobId, pi);
  if (j.solved[pi]) return { paid: 0, firstTry: false, already: true };
  const n = jobDef(jobId)?.number ?? 1;
  const firstTry = a.tries <= 1 && a.hints === 0 && !a.solution;
  const paid = Math.round(1000 * n * (firstTry ? 1.5 : 1) * (a.solution ? 0.25 : 1));
  j.solved[pi] = true;
  addCash(paid);
  touch();
  emit('query:solved', { jobId, pi, paid, firstTry });
  return { paid, firstTry, already: false };
}

export function useHint(jobId, pi) {
  const a = attempt(jobId, pi);
  a.hints++;
  addHeat(HINT_HEAT);
}

export function useSolution(jobId, pi) {
  const a = attempt(jobId, pi);
  if (a.solution) return;
  a.solution = true;
  addHeat(SOLUTION_HEAT);
}

export function wrongPlay(jobId, optionId) {
  const j = job(jobId);
  if (!j.play.wrong.includes(optionId)) j.play.wrong.push(optionId);
  addHeat(WRONG_PLAY_HEAT);
}

export function completeJob(jobId) {
  const def = jobDef(jobId);
  const j = job(jobId);
  const heatBefore = S.heat;
  const rankBefore = rank();
  const usedSolution = Object.values(j.attempts).some((a) => a.solution);
  const stars = !usedSolution && j.play.wrong.length === 0 ? 3 : j.play.wrong.length <= 1 ? 2 : 1;
  const already = j.play.done;
  const take = already ? 0 : Math.round((def?.take ?? 0) * (stars === 3 ? 1 : stars === 2 ? 0.8 : 0.6));
  j.play.done = true;
  j.stars = Math.max(j.stars, stars);
  j.take = Math.max(j.take, take);
  j.completedAt = j.completedAt || Date.now();
  if (take) addCash(take);
  S.heat = Math.max(0, S.heat - HEAT_DECAY);
  emit('heat', S.heat);
  touch();
  emit('job:complete', { jobId });
  return { take, stars, heatBefore, heatAfter: S.heat, rankBefore, rankAfter: rank(), already };
}

/* ---------------- economy ---------------- */
export const cash = () => S.cash;
export const heat = () => S.heat;

function addCash(n) {
  S.cash += n;
  emit('cash', S.cash);
}
function addHeat(n) {
  S.heat = Math.min(100, S.heat + n);
  touch();
  emit('heat', S.heat);
}

export function rank(total = S.cash) {
  let index = 0;
  RANKS.forEach(([min], i) => { if (total >= min) index = i; });
  const [min, name] = RANKS[index];
  const next = RANKS[index + 1];
  return {
    index,
    name,
    next: next ? next[1] : null,
    nextAt: next ? next[0] : null,
    progress: next ? (total - min) / (next[0] - min) : 1,
  };
}

/* ---------------- sandbox ---------------- */
export const sandbox = () => S.sandbox;

/* ---------------- reset ---------------- */
export function reset() {
  const keepSettings = S.settings;
  S = fresh();
  S.settings = keepSettings;
  save();
  emit('cash', 0);
  emit('heat', 0);
}

addEventListener('beforeunload', save);
