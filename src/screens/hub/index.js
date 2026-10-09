// HUB: Port Vesper from above. Every target is pinned in gold; its state is told by light.
// Pick a pin → the camera flies to the building and its case file slides onto the table.
import './hub.css';
import { h, sleep, money, countUp, reducedMotion } from '../../core/dom.js';
import { go } from '../../core/router.js';
import { on } from '../../core/bus.js';
import * as S from '../../core/state.js';
import * as audio from '../../core/audio.js';
import { iconButton, icon, dymo, openSettings, button, toast } from '../../ui/index.js';
import { JOBS as REAL_JOBS, EPILOGUE } from '../../data/jobs.js';
import { acquireCity, releaseCity } from '../../art/noirCity.js';
import { buildDossier } from './dossier.js';
import { demoJobs } from './demo.js';

const pad2 = (n) => String(n).padStart(2, '0');
let lastCash = null;
let ctx = null;

function jobsList() {
  if (import.meta.env.DEV && new URLSearchParams(location.search).has('hubdemo')) return demoJobs(REAL_JOBS);
  return REAL_JOBS;
}

function statusOf(job, i) {
  if (!S.isUnlocked(i)) return 'locked';
  if (S.isJobDone(job.id)) return 'done';
  if (S.solvedCount(job.id) > 0 || S.seen('briefing:' + job.id)) return 'progress';
  return 'available';
}

export default {
  id: 'hub',

  async mount(root, params = {}) {
    const JOBS = jobsList();
    const offs = [];
    const timers = [];
    const later = (ms, fn) => timers.push(setTimeout(fn, ms));
    ctx = { offs, timers, leaving: false };
    let autoTimer = null;
    const fast = reducedMotion();

    const { city, reused } = acquireCity(root, { quality: S.settings().quality, jobs: JOBS });
    ctx.city = city;
    const statuses = () => Object.fromEntries(JOBS.map((j, i) => [j.id, statusOf(j, i)]));
    city.setHighlights(statuses());
    city.setHeat(S.heat());
    city.setFade(1);
    if (reused) {
      if (city.mode !== 'overhead') city.setMode('overhead', { duration: 3000 });
    } else {
      city.setFade(0, { instant: true });
      city.setMode('overhead', { instant: true });
      later(30, () => city.setFade(1));
    }
    audio.ambience('rain');

    /* ---------------- HUD ---------------- */
    const cashEl = h('b.hb-cash__v', money(lastCash ?? S.cash()));
    const cash = h('div.hb-cash', h('span.hb-label', 'Money'), h('div.hb-cash__tape', cashEl));

    const rankName = h('b.hb-rank__name');
    const rankBar = h('i.hb-rank__fill');
    const rankNext = h('span.hb-rank__next');
    const rank = h('div.hb-rank', h('span.hb-label', 'Rank'), rankName, h('div.hb-rank__bar', rankBar), rankNext);

    const heatSegs = Array.from({ length: 10 }, (_, i) => h('i', { dataset: { i } }));
    const heatVal = h('b.hb-heat__v');
    const calloway = h('div.hb-calloway', h('span.hb-label', 'Police are close'), h('em', 'Detective Cole'));
    const heat = h('div.hb-heat', { title: 'Hints, answers and wrong plans make the police come closer.' }, h('span.hb-label', 'Police'), h('div.hb-heat__bar', h('span.hb-heat__cap'), ...heatSegs, h('span.hb-heat__cap')), heatVal, calloway);

    const soundChip = iconButton(S.settings().sound ? 'sound' : 'mute', { title: 'Sound', onClick: () => S.setSetting('sound', !S.settings().sound) });
    soundChip.classList.toggle('is-off', !S.settings().sound);
    const hud = h('header.hb-hud',
      h('div.hb-hud__l',
        iconButton('home', { title: 'Main menu', className: 'chip--gold', onClick: goHome }),
        h('div.hb-mark', h('b', 'Inside Job'), h('span', 'Port Vesper · city map')),
      ),
      h('div.hb-hud__c', cash, rank, heat),
      h('div.hb-hud__r',
        iconButton('terminal', { title: 'Practice SQL', onClick: () => leave(() => go('planning', { mode: 'sandbox' }, { transition: 'wipe' })) }),
        iconButton('gear', { title: 'Settings', onClick: () => openSettings({ onReset: () => go('home', {}, { transition: 'fade' }) }) }),
        soundChip,
      ),
    );

    function paintRank() {
      const r = S.rank();
      rankName.textContent = r.name;
      rankBar.style.width = Math.round((r.progress || 0) * 100) + '%';
      rankNext.textContent = r.next ? `Next: ${r.next}` : 'Top rank';
    }
    function paintHeat(v = S.heat()) {
      const n = Math.ceil(v / 10);
      heatSegs.forEach((s, i) => s.classList.toggle('is-on', i < n));
      heatVal.textContent = String(Math.round(v));
      root.classList.toggle('is-hot', v > 70);
      city.setHeat(v);
    }
    paintRank();
    paintHeat();
    const target = S.cash();
    if (lastCash != null && lastCash !== target) {
      later(900, () => { audio.sfx('cash'); countUp(cashEl, target, { from: lastCash, dur: 1400, fmt: (v) => money(v) }); });
    }
    lastCash = target;
    offs.push(on('cash', (v) => { countUp(cashEl, v, { from: lastCash ?? v, dur: 900, fmt: (x) => money(x) }); lastCash = v; paintRank(); }));
    offs.push(on('heat', (v) => paintHeat(v)));
    offs.push(on('settings', ({ key, value }) => {
      if (key === 'sound') { soundChip.replaceChildren(icon(value ? 'sound' : 'mute')); soundChip.classList.toggle('is-off', !value); }
      if (key === 'quality') city.setQuality?.(value);
      if (key === 'unlockAll') refresh();
    }));

    /* ---------------- pins ---------------- */
    const pinLayer = h('div.hb-pins');
    const pins = JOBS.map((job, i) => {
      const el = h('button.hb-pin', { type: 'button', dataset: { id: job.id }, 'aria-label': `Job ${job.number}: ${job.target}` },
        h('span.hb-pin__ring'),
        h('span.hb-pin__needle'),
        h('span.hb-pin__head'),
        h('span.hb-pin__tape', h('b', pad2(job.number)), h('span', job.target), h('em.hb-pin__prog'), h('span.hb-pin__stamp', 'Done')),
      );
      el.style.setProperty('--d', `${i * 90}ms`);
      el.addEventListener('pointerenter', () => { audio.sfx('hover'); el.classList.add('is-hover'); });
      el.addEventListener('pointerleave', () => el.classList.remove('is-hover'));
      el.addEventListener('click', (e) => { e.stopPropagation(); select(i); });
      pinLayer.append(el);
      return el;
    });
    function paintPins() {
      const st = statuses();
      pins.forEach((el, i) => {
        const s = st[JOBS[i].id];
        el.dataset.state = s;
        el.querySelector('.hb-pin__prog').textContent = s === 'progress' ? `${S.solvedCount(JOBS[i].id)}/5` : '';
        delete el.querySelector('.hb-pin__tape').dataset.w;
      });
    }
    paintPins();
    // label tapes dodge each other: try right, left, then stepped rows; keep last slot while free
    const SLOTS = [[0, 0], [1, 0], [0, -30], [1, -30], [0, 30], [1, 30], [0, -60], [1, -60], [0, 60], [1, 60]];
    const slotOf = pins.map(() => 0);
    const widths = pins.map(() => 0);
    const offFrame = city.onFrame(() => {
      const placed = [];
      const vis = [];
      for (let i = 0; i < pins.length; i++) {
        const p = city.projectJob(JOBS[i].id);
        const el = pins[i];
        if (!p.visible || p.y < 118 || p.y > innerHeight + 60) { el.style.visibility = 'hidden'; continue; }
        el.style.visibility = '';
        el.style.transform = `translate3d(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px, 0)`;
        el.style.zIndex = String(Math.round(p.y));
        vis.push({ i, x: p.x, y: p.y });
        placed.push({ l: p.x - 11, t: p.y - 60, r: p.x + 11, b: p.y, own: i }); // heads + needles are obstacles too
      }
      // selected first, then top-to-bottom
      vis.sort((a, b) => (pins[b.i].classList.contains('is-sel') - pins[a.i].classList.contains('is-sel')) || a.y - b.y);
      const hit = (r, me) => placed.some((q) => q.own !== me && r.l < q.r + 5 && r.r > q.l - 5 && r.t < q.b + 3 && r.b > q.t - 3);
      for (const { i, x, y } of vis) {
        const tape = pins[i].querySelector('.hb-pin__tape');
        if (!tape.dataset.w) { widths[i] = tape.offsetWidth || 180; tape.dataset.w = '1'; }
        const w = widths[i] * 1.08, hgt = 26;
        const rectFor = (k) => {
          const [side, dy] = SLOTS[k];
          const l = side ? x - 16 - w : x + 16;
          return { l, t: y - 66 + dy, r: l + w, b: y - 66 + dy + hgt, side, dy };
        };
        let k = slotOf[i];
        if (k && !hit(rectFor(0), i)) k = 0;
        if (hit(rectFor(k), i)) { k = SLOTS.findIndex((_, n) => !hit(rectFor(n), i)); if (k < 0) k = 0; }
        slotOf[i] = k;
        const r = rectFor(k);
        placed.push(r);
        tape.style.left = (r.side ? -16 - widths[i] : 16) + 'px';
        tape.style.top = (-64 + r.dy) + 'px';
        tape.style.transformOrigin = r.side ? '100% 50%' : '0 50%';
      }
    });
    offs.push(offFrame);

    /* ---------------- case index (bottom) ---------------- */
    const ALL = ['pawn', 'gallery', 'casino', 'rail', 'bank', 'auction', 'penthouse', 'tower'];
    const idxTags = ALL.map((id, k) => {
      const i = JOBS.findIndex((j) => j.id === id);
      const job = JOBS[i];
      const t = h('button.hb-idx__tag', { type: 'button', dataset: { id }, disabled: !job, title: job ? `${job.title} · ${job.target}` : 'Not ready yet' },
        h('span.hb-idx__eye'), h('b', pad2(job?.number ?? k + 1)));
      if (job) t.addEventListener('click', () => select(i));
      return t;
    });
    const index = h('nav.hb-idx', { 'aria-label': 'Jobs' }, h('span.hb-label', 'Jobs'), h('div.hb-idx__row', ...idxTags));
    function paintIndex() {
      const st = statuses();
      idxTags.forEach((t) => { t.dataset.state = st[t.dataset.id] || 'missing'; });
    }
    paintIndex();

    const allDone = JOBS.length >= 8 && JOBS.every((j) => S.isJobDone(j.id));
    const epilogue = allDone && EPILOGUE?.length
      ? h('div.hb-epilogue', button('Watch the ending', { variant: 'gold', size: 'lg', icon: 'play', onClick: () => leave(() => go('cinema', { script: EPILOGUE, next: { screen: 'hub', params: {} } }, { transition: 'wipe' })) }), h('em', 'The end of the story.'))
      : null;

    const hint = h('div.hb-hint', 'Click a pin, or use', h('kbd', '←'), h('kbd', '→'), ' to see each job');

    /* ---------------- dossier ---------------- */
    const dossierHost = h('div.hb-dossier');
    let current = -1;
    let dossier = null;

    function select(i, { sound = true } = {}) {
      if (ctx?.leaving || i < 0 || i >= JOBS.length) return;
      autoTimer && clearTimeout(autoTimer);
      const job = JOBS[i];
      const st = statusOf(job, i);
      const same = i === current;
      current = i;
      pins.forEach((p, k) => p.classList.toggle('is-sel', k === i));
      idxTags.forEach((t) => t.classList.toggle('is-sel', t.dataset.id === job.id));
      root.classList.add('has-dossier');
      if (!same) city.flyTo(job.id);
      if (sound) audio.sfx(same ? 'click' : 'whoosh');
      const d = buildDossier(job, {
        status: st, index: i, total: JOBS.length, city,
        onPlan: () => planJob(job),
        onReplay: () => leave(() => go('cinema', { script: job.briefing, next: { screen: 'hub', params: { focusJob: job.id } } }, { transition: 'wipe' })),
        onClose: closeDossier,
        onPrev: () => select(i - 1),
        onNext: () => select(i + 1),
      });
      if (dossier) {
        const old = dossier.el;
        old.classList.add('is-out');
        setTimeout(() => old.remove(), 320);
      }
      dossier = d;
      dossierHost.append(d.el);
      setTimeout(() => { if (st !== 'locked') audio.sfx('stamp'); d.el.classList.add('is-stamped'); }, 520);
    }
    function closeDossier() {
      if (!dossier) return;
      const old = dossier.el;
      dossier = null;
      current = -1;
      old.classList.add('is-out');
      setTimeout(() => old.remove(), 320);
      pins.forEach((p) => p.classList.remove('is-sel'));
      idxTags.forEach((t) => t.classList.remove('is-sel'));
      root.classList.remove('has-dossier');
      city.clearFocus();
      audio.sfx('whoosh');
    }
    function planJob(job) {
      if (!S.seen('briefing:' + job.id) && job.briefing?.length) {
        S.markSeen('briefing:' + job.id);
        leave(() => go('cinema', { script: job.briefing, next: { screen: 'planning', params: { jobId: job.id } } }, { transition: 'wipe' }));
      } else {
        S.markSeen('briefing:' + job.id);
        leave(() => go('planning', { jobId: job.id }, { transition: 'wipe' }));
      }
    }
    function refresh() {
      city.setHighlights(statuses());
      paintPins();
      paintIndex();
      if (current >= 0) select(current, { sound: false });
    }

    async function leave(fn) {
      if (ctx.leaving) return;
      ctx.leaving = true;
      root.classList.add('is-leaving-ui');
      await sleep(260);
      fn();
    }
    function goHome() {
      if (ctx.leaving) return;
      ctx.leaving = true;
      root.classList.add('is-leaving-ui');
      city.setHighlights({});
      city.setHeat(0);
      city.setMode('street', { duration: 2800 });
      audio.sfx('whoosh');
      setTimeout(() => go('home', {}, { transition: 'none' }), 320);
    }

    /* ---------------- input ---------------- */
    const onKey = (e) => {
      if (ctx?.leaving || document.querySelector('.modal-scrim')) return;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') { e.preventDefault(); select(current < 0 ? 0 : Math.min(JOBS.length - 1, current + 1)); }
      else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') { e.preventDefault(); select(current < 0 ? 0 : Math.max(0, current - 1)); }
      else if (e.key === 'Escape' && dossier) { e.preventDefault(); closeDossier(); }
      else if (e.key === 'Enter' && dossier && !document.activeElement?.closest?.('button')) { e.preventDefault(); dossier.plan.click(); }
      else if (/^[1-8]$/.test(e.key) && +e.key <= JOBS.length) select(+e.key - 1);
    };
    addEventListener('keydown', onKey);
    offs.push(() => removeEventListener('keydown', onKey));
    const onMove = (e) => city.pointerParallax((e.clientX / innerWidth) * 2 - 1, (e.clientY / innerHeight) * 2 - 1);
    root.addEventListener('pointermove', onMove);
    const catcher = h('div.hb-catch');
    catcher.addEventListener('click', () => { if (dossier) closeDossier(); });

    root.append(catcher, h('div.hb-scrim'), pinLayer, hud, index, hint, dossierHost, epilogue);
    root.classList.add(reused ? 'is-crane' : 'is-cut');

    /* ---------------- arrival ---------------- */
    const focusId = params.focusJob && JOBS.some((j) => j.id === params.focusJob) ? params.focusJob : null;
    const firstOpen = JOBS.findIndex((j) => !S.isJobDone(j.id));
    const defaultIdx = focusId ? JOBS.findIndex((j) => j.id === focusId) : firstOpen < 0 ? JOBS.length - 1 : firstOpen;
    const reveal = reused ? (fast ? 300 : 2300) : 500;
    later(reveal, () => root.classList.add('is-in'));
    if (JOBS.length) {
      autoTimer = setTimeout(() => { if (current < 0 && !ctx?.leaving) select(defaultIdx); }, focusId ? reveal - 200 : reveal + 1400);
      timers.push(autoTimer);
    }
    if (!JOBS.length) toast('No jobs yet', { kind: 'teal' });
  },

  unmount() {
    if (!ctx) return;
    ctx.offs.forEach((f) => f());
    ctx.timers.forEach(clearTimeout);
    releaseCity();
    ctx = null;
  },
};
