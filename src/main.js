import './styles/fonts.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/ui.css';

import { register, go } from './core/router.js';
import { sleep, nextFrame } from './core/dom.js';
import * as S from './core/state.js';
import { initSql } from './sql/engine.js';

import home from './screens/home/index.js';
import hub from './screens/hub/index.js';
import planning from './screens/planning/index.js';
import cinema from './screens/cinema/index.js';
import debrief from './screens/debrief/index.js';

[home, hub, planning, cinema, debrief].forEach(register);

async function boot() {
  const bootEl = document.getElementById('boot');
  // SQL engine boots in the background; the planning screen awaits it.
  initSql().catch((e) => console.error('[sql] failed to boot', e));
  // Reveal the boot logo only once its stencil face is ready, so it never flashes in a fallback font.
  const fontsReady = Promise.race([
    Promise.all(['900 72px "Big Shoulders Stencil Display"', '900 40px "Big Shoulders Display"'].map((f) => document.fonts?.load(f))),
    sleep(1500),
  ]).catch(() => {});
  await fontsReady;
  bootEl?.classList.add('is-fonts');
  await document.fonts?.ready;
  const params = new URLSearchParams(location.search);
  // Dev deep links: ?screen=planning&job=pawn  |  ?screen=cinema&job=pawn&script=briefing
  const scr = params.get('screen');
  if (scr) await go(scr, devParams(scr, params), { transition: 'none' });
  else await go('home', {}, { transition: 'none' });
  // Let the first screen paint (WebGL city, title) before crossfading away from the boot card.
  await nextFrame();
  await nextFrame();
  await sleep(200);
  bootEl?.classList.add('is-done');
  setTimeout(() => bootEl?.remove(), 800);
}

function devParams(scr, p) {
  const jobId = p.get('job') || 'pawn';
  if (scr === 'planning') return p.get('mode') === 'sandbox' ? { mode: 'sandbox' } : { jobId, puzzle: +(p.get('puzzle') || 0) };
  if (scr === 'debrief') return { jobId, result: { take: 40000, stars: 3, heatBefore: 20, heatAfter: 5, rankBefore: S.rank(0), rankAfter: S.rank(40000) } };
  if (scr === 'cinema') return { devJob: jobId, devScript: p.get('script') || 'briefing', next: { screen: 'hub', params: {} } };
  return {};
}

boot();

// Expose for debugging in the console.
window.__ij = { S, go };
