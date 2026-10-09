// Dev-only harnesses (reached via ?screen=cinema&dev=gallery|portraits|transition|page).
// Never used by the game flow.
import { h } from '../core/dom.js';
import { portrait, PORTRAIT_IDS, MOODS } from '../art/portraits.js';

export async function mountDev(root, kind, q) {
  root.classList.add('cx-dev');
  if (kind === 'portraits') return portraitsSheet(root, q);
  if (kind === 'gallery') {
    const { gallery } = await import('./dev-gallery.js');
    return gallery(root, q);
  }
  if (kind === 'script') return devScript(root, q);
  if (kind === 'debrief') return devDebrief(root, q);
  if (kind === 'credits') return devCredits(root, q);
  if (kind === 'intros') { const { intros } = await import('./dev-gallery.js'); return intros(root, q); }
  if (kind === 'poses') { const { poses } = await import('./dev-gallery.js'); return poses(root); }
  if (kind === 'transition') {
    const { transitionHarness } = await import('./dev-transition.js');
    return transitionHarness(root, q);
  }
  root.append(h('p', 'unknown dev harness ' + kind));
}

function portraitsSheet(root, q) {
  const size = +(q.get('size') || 150);
  const ids = [...PORTRAIT_IDS, 'stranger'];
  const grid = h('div', { style: { display: 'grid', gridTemplateColumns: `90px repeat(${MOODS.length}, ${size}px) 60px 60px 40px`, gap: '14px', padding: '20px', alignItems: 'center', background: '#0b0f12', minHeight: '100vh', overflow: 'auto', height: '100vh' } });
  grid.append(h('div'), ...MOODS.map((m) => h('div.label', { style: { color: '#9d927c' } }, m)), h('div.label', '64'), h('div.label', '48'), h('div.label', '32'));
  for (const id of ids) {
    grid.append(h('div.label', { style: { color: '#ece2c9' } }, id));
    for (const m of MOODS) grid.append(portrait(id, { mood: m, size }));
    grid.append(portrait(id, { mood: 'calm', size: 64 }), portrait(id, { mood: 'calm', size: 48 }), portrait(id, { mood: 'smirk', size: 32 }));
  }
  root.append(grid);
}

/** ?dev=script&job=pawn&script=briefing — play a script inside the isolated lab. */
export async function devScript(root, q) {
  const { JOBS, PROLOGUE, EPILOGUE } = await import('../data/jobs.js');
  const { ComicPlayer } = await import('./engine.js');
  const which = q.get('script') || 'briefing';
  const job = JOBS.find((j) => j.id === (q.get('job') || 'pawn')) || JOBS[0];
  const pick = { prologue: PROLOGUE, epilogue: EPILOGUE, success: job.replay?.success, failure: job.replay?.failure, after: job.after, briefing: job.briefing }[which] || [];
  let pages = pick;
  if (q.get('page')) pages = pages.slice(+q.get('page'));
  const p = new ComicPlayer(root, pages, { onDone: () => { root.append(h('p', { style: { color: '#fff', position: 'absolute', top: '10px', left: '10px' } }, 'DONE')); } });
  p.start();
  window.__player = p;
}

/** ?dev=debrief&job=pawn&stars=2&promo=1 — the debrief screen inside the lab. */
export async function devDebrief(root, q) {
  const S = await import('../core/state.js');
  const m = await import('../screens/debrief/index.js');
  root.className = 'screen scr-debrief';
  const promo = q.get('promo') === '1';
  const result = { take: 40000, stars: +(q.get('stars') || 3), heatBefore: +(q.get('heat') || 44), heatAfter: +(q.get('heat') || 44) - 15, rankBefore: S.rank(promo ? 0 : 20000), rankAfter: S.rank(promo ? 40000 : 60000), already: false };
  m.default.mount(root, { jobId: q.get('job') || 'pawn', result });
}

export async function devCredits(root, q) {
  const { playCredits } = await import('./credits.js');
  window.__credits = playCredits(root, { onDone: () => root.append(h('p', { style: { color: '#fff', position: 'absolute', top: '10px' } }, 'DONE')) });
}
