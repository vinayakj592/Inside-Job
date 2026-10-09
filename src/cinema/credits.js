// End credits: Saul Bass title cards on twos. Cast with portraits, the player's record, the keyhole.
//   playCredits(root, { onDone }) → { destroy }
import { h, money } from '../core/dom.js';
import { sfx, ambience, music } from '../core/audio.js';
import * as S from '../core/state.js';
import { CREW } from '../data/crew.js';
import { JOBS } from '../data/jobs.js';
import { portrait } from '../art/portraits.js';

const CAST = ['viv', 'dex', 'juno', 'otis', 'lena'];

export function playCredits(root, { onDone } = {}) {
  root.classList.add('cx-credits');
  ambience('rain');
  if (S.settings().music) music(true);
  const done = JOBS.filter((j) => S.job(j.id).play.done).length;
  const stars = JOBS.reduce((n, j) => n + (S.job(j.id).stars || 0), 0);
  const cards = [
    () => card('a', h('span.cr-kick', 'A Port Vesper production'), h('h1.cr-big.display.misreg-strong', 'Inside', h('br'), h('span', 'Job'))),
    ...CAST.map((id, i) => () => cast(id, i)),
    () => card('b', h('span.cr-kick', 'and introducing'), h('h2.cr-mid.display', 'The ', h('em.accent', 'Architect')), h('p.cr-line', 'who never showed their face.')),
    () => card('c', h('span.cr-kick', 'with'), h('h2.cr-mid.display', CREW.crane?.name || 'Leo Crane'), h('p.cr-line', 'as the man who owned half the city'), h('h2.cr-mid.display', { style: { marginTop: '28px' } }, CREW.calloway?.name || 'Nina Cole'), h('p.cr-line', 'as the detective who almost caught you')),
    () => card('d', h('span.cr-kick', 'Your results'),
      h('div.cr-stats',
        stat(money(S.cash()), 'money'), stat(`${done}/${JOBS.length}`, 'jobs done'), stat(`${stars}`, 'stars'), stat(S.rank().name, 'rank'))),
    () => card('e', h('span.cr-kick', 'Written in'), h('h2.cr-mid.display', 'Structured ', h('em.accent', 'Query'), ' Language'), h('p.cr-line', 'No buildings were hurt. We only read their data.')),
    () => card('e', h('span.cr-kick', 'The sound of the city'),
      h('p.cr-line', '“Het kletteren van regen op straat” · Beeld en Geluid · CC BY-SA 3.0'),
      h('p.cr-line', '“Distant storm in the city” · Matucha · CC BY 3.0'),
      h('p.cr-line', '“Rain against the window” · cori · public domain'),
      h('p.cr-line', 'via Wikimedia Commons. Edited into loops.')),
    () => card('f', h('div.cr-keyhole'), h('h1.cr-big.display.misreg-strong', 'The ', h('span', 'end')), h('p.cr-line', 'Every building keeps a record.')),
  ];
  let i = -1, timer = null, dead = false;
  const holder = h('div.cr-stage');
  const hint = h('div.cr-hint', 'Click to continue · Esc to leave');
  root.append(holder, hint);
  const next = () => {
    if (dead) return;
    clearTimeout(timer);
    i++;
    if (i >= cards.length) return finish();
    const old = holder.firstChild;
    if (old) { old.classList.add('is-out'); setTimeout(() => old.remove(), 400); }
    const el = cards[i]();
    holder.append(el);
    sfx(i === 0 || i === cards.length - 1 ? 'slam' : 'whoosh');
    timer = setTimeout(next, i === cards.length - 1 ? 6500 : 3400);
  };
  const finish = () => { if (dead) return; dead = true; clearTimeout(timer); onDone?.(); };
  const onKey = (e) => { if (e.key === 'Escape') finish(); else if (e.key === ' ' || e.key === 'Enter') next(); };
  root.addEventListener('click', next);
  addEventListener('keydown', onKey);
  setTimeout(next, 300);
  return { destroy() { dead = true; clearTimeout(timer); removeEventListener('keydown', onKey); } };
}

function card(variant, ...kids) {
  return h(`div.cr-card.cr-card--${variant}`, h('i.cr-bar.cr-bar--1'), h('i.cr-bar.cr-bar--2'), h('i.cr-bar.cr-bar--3'), h('div.cr-copy', ...kids));
}
function stat(v, l) { return h('div.cr-stat', h('b.display', v), h('span.label', l)); }
function cast(id, i) {
  const c = CREW[id] || { name: id, role: '' };
  const el = card(i % 2 ? 'r' : 'l',
    h('span.cr-kick', 'starring'),
    h('h2.cr-mid.display', c.name),
    h('p.cr-line', 'as the ', h('em.accent', String(c.role || '').replace(/^the\s+/i, ''))));
  el.prepend(h('div.cr-portrait', portrait(id, { mood: 'smirk', size: 420 })));
  return el;
}
