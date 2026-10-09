// DEBRIEF: the morning after. The Vesper Evening Standard spins in with the job's headline, then the
// results are laid on the wet pavement beside it as props: JOB DONE stamp, the take on label tape,
// stars stamped on an evidence tag, the heat draining out of a police light bar, a rank stamp, and
// a crew line. params: { jobId, result: { take, stars, heatBefore, heatAfter, rankBefore, rankAfter, already } }
import './debrief.css';
import { h, sleep, money, countUp, reducedMotion } from '../../core/dom.js';
import { go } from '../../core/router.js';
import { sfx, ambience } from '../../core/audio.js';
import * as S from '../../core/state.js';
import { JOBS, EPILOGUE } from '../../data/jobs.js';
import { CREW } from '../../data/crew.js';
import { button, dymo, stamp } from '../../ui/index.js';
import { portrait } from '../../art/portraits.js';
import { renderShot } from '../../cinema/shots/index.js';
import { removeInkCover } from '../../cinema/transition.js';

let alive = false;
let cleanup = [];

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function bodyCopy(job) {
  const t = job.target || 'a building', d = job.district || 'the city';
  const s = [
    `PORT VESPER. Someone broke into ${t} in ${d} last night, police said today.`,
    `Police say the thieves knew the building very well.`,
    `Detective Cole arrived first. She did not answer any questions.`,
    `No alarm went off. The neighbours only heard the rain.`,
    `Mr. Crane owns part of the building. He said it was “not important”.`,
    `Did you see a dark car in ${d} after midnight? Please call the police.`,
    `Weather: rain tonight. More rain tomorrow.`,
  ];
  return [...s, ...s.slice(0, 4)];
}

function newspaper(job) {
  const dayName = WEEKDAYS[(job.number || 1) % 7];
  const paper = h('article.db-paper.tex-paper',
    h('div.db-paper__ears', h('span', 'Night edition'), h('span', 'Five cents'), h('span', `No. ${1200 + (job.number || 1) * 7}`)),
    h('h1.db-paper__mast', 'The Vesper Evening Standard'),
    h('div.db-paper__date', `Port Vesper · ${dayName} · Rain, then more rain`),
    h('h2.db-paper__head', job.debrief?.headline || 'NIGHT ROBBERY IN PORT VESPER'),
  );
  const photo = h('figure.db-paper__photo');
  const cap = h('figcaption', `${job.target || ''}${job.district ? ', ' + job.district : ''}, early this morning.`);
  const cols = h('div.db-paper__cols', ...bodyCopy(job).map((p) => h('p', p)));
  paper.append(h('div.db-paper__body', h('div.db-paper__lead', photo, cap), cols));
  return { paper, photo };
}

function starTag(n) {
  const slots = [0, 1, 2].map(() => h('span.db-star'));
  const tag = h('div.db-tag.tag', h('b', 'Stars'), h('div.db-stars', ...slots));
  return { tag, slots, n };
}

function heatBar(before) {
  const segs = Array.from({ length: 10 }, (_, i) => h(`span.db-heat__seg${i % 2 ? '.is-b' : ''}`));
  const val = h('b.db-heat__val', String(before));
  const bar = h('div.db-heat', h('div.db-heat__bar', ...segs), h('div.db-heat__read', h('span.label', 'Police'), val));
  const paint = (v) => segs.forEach((s, i) => s.classList.toggle('is-on', i < Math.round(v / 10)));
  paint(before);
  return { bar, paint, val };
}

export default {
  id: 'debrief',
  async mount(root, params = {}) {
    alive = true;
    cleanup = [];
    removeInkCover();
    ambience('noir');
    const job = JOBS.find((j) => j.id === params.jobId) || JOBS[0];
    const res = params.result || { take: 0, stars: 1, heatBefore: S.heat(), heatAfter: S.heat(), rankBefore: S.rank(), rankAfter: S.rank() };
    const idx = JOBS.indexOf(job);
    const nextJob = JOBS[idx + 1];
    const isLast = idx === JOBS.length - 1;
    const fast = reducedMotion();

    // ---- scene ----
    const bg = h('div.db-bg');
    const rain = h('div.db-rain');
    const { paper, photo } = newspaper(job);
    const paperWrap = h('div.db-paperwrap', paper);
    const props = h('div.db-props');
    root.append(bg, rain, paperWrap, props);

    // the photo: a halftoned establishing shot of the target
    requestAnimationFrame(() => {
      const r = photo.getBoundingClientRect();
      const shot = renderShot('city-establish', { building: job.target }, { w: Math.max(200, r.width), h: Math.max(140, r.height) });
      shot.el.querySelector('.cx-rain')?.remove();
      photo.append(shot.el, h('i.db-paper__dots'));
    });

    // skip-ahead: any click / key finishes the sequence instantly
    let hurry = false;
    const wait = (ms) => (hurry || fast ? Promise.resolve() : sleep(ms));
    const onHurry = (e) => { if (e.type === 'keydown' && ![' ', 'Enter', 'Escape'].includes(e.key)) return; hurry = true; root.classList.add('is-hurry'); };
    root.addEventListener('pointerdown', onHurry);
    addEventListener('keydown', onHurry);
    cleanup.push(() => { root.removeEventListener('pointerdown', onHurry); removeEventListener('keydown', onHurry); });

    sfx('whoosh');
    paperWrap.classList.add('is-in');
    await wait(1150);
    if (!alive) return;

    // JOB DONE stamp slammed across the front page
    paperWrap.append(h('div.db-done', stamp(res.already ? 'Done again' : 'Job done', { rot: -9 })));
    await wait(450);

    // the take on label tape
    const takeTape = dymo('$0', { tone: 'gold', rot: -2 });
    takeTape.classList.add('db-take__tape');
    const take = h('div.db-take', h('span.label', res.already ? 'Money · already paid' : 'Money'), takeTape);
    props.append(take);
    await wait(200);
    if (hurry || fast) takeTape.textContent = money(res.take);
    else {
      const ticker = setInterval(() => sfx('type'), 70);
      await countUp(takeTape, res.take, { dur: 1100, fmt: (v) => money(v) });
      clearInterval(ticker);
    }
    if (res.take) sfx('cash');
    await wait(350);

    // stars stamped one by one
    const st = starTag(res.stars);
    props.append(st.tag);
    await wait(300);
    for (let i = 0; i < 3; i++) {
      if (!alive) return;
      if (i < res.stars) { st.slots[i].classList.add('is-on'); sfx('stamp'); }
      await wait(330);
    }

    // heat cools: the light bar drains
    const hb = heatBar(res.heatBefore);
    const heatRow = h('div.db-heatrow', hb.bar, portrait('calloway', { mood: res.heatAfter > 70 ? 'tense' : res.heatAfter > 35 ? 'calm' : 'smirk', size: 64 }));
    props.append(heatRow);
    await wait(350);
    if (hurry || fast) { hb.paint(res.heatAfter); hb.val.textContent = `${res.heatBefore} → ${res.heatAfter}`; }
    else {
      await countUp(hb.val, res.heatAfter, { from: res.heatBefore, dur: 1000, fmt: (v) => { hb.paint(v); return String(Math.round(v)); } });
      hb.val.textContent = `${res.heatBefore} → ${res.heatAfter}`;
    }
    await wait(250);

    // rank: promotion stamp, or the tape with progress
    const promoted = res.rankAfter && res.rankBefore && res.rankAfter.index > res.rankBefore.index;
    const rankName = h('div.db-rank__name.display.misreg', res.rankAfter?.name || S.rank().name);
    const rank = h('div.db-rank', h('span.label', promoted ? 'New rank' : 'Rank'), h('div', rankName));
    if (res.rankAfter?.next) rank.append(h('div.db-rank__prog', h('i', { style: { width: Math.round((res.rankAfter.progress || 0) * 100) + '%' } }), h('small', `Next: ${res.rankAfter.next}`)));
    props.append(rank);
    if (promoted) { await wait(200); rankName.append(h('div.db-rank__stamp', stamp('Promoted', { rot: 8 }))); }
    await wait(450);

    // the crew line
    const line = job.debrief?.line;
    if (line) {
      const who = line.who;
      const quote = h('p.db-quote__text');
      const card = h('div.db-quote', portrait(who, { mood: 'smirk', size: 92 }), h('div', h('span.dymo.db-quote__who', CREW[who]?.short || who), quote));
      props.append(card);
      if (S.settings().typewriter && !hurry && !fast) {
        for (const ch of line.text) { if (!alive) return; quote.textContent += ch; if (quote.textContent.length % 3 === 0) sfx('type'); await sleep(hurry ? 0 : 24); }
      } else quote.textContent = line.text;
    }

    // continue
    const label = isLast ? 'Watch the credits' : job.after ? 'What happens next' : 'Back to the city map';
    const cont = button(label, {
      variant: 'gold', size: 'lg', cut: 'b',
      onClick: () => {
        if (isLast) go('cinema', { script: [...(job.after || []), ...(EPILOGUE || [])], next: { screen: 'cinema', params: { credits: true, next: { screen: 'home', params: {} } } } }, { transition: 'wipe' });
        else if (job.after && job.after.length) go('cinema', { script: job.after, next: { screen: 'hub', params: { focusJob: nextJob?.id } } }, { transition: 'wipe' });
        else go('hub', { focusJob: nextJob?.id }, { transition: 'wipe' });
      },
    });
    props.append(h('div.db-cont', cont));
    cont.focus({ preventScroll: true });
  },
  unmount() {
    alive = false;
    cleanup.forEach((f) => f());
    cleanup = [];
  },
};
