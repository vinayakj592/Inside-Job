// HOME: the opening shot. Street level, rain, the avenue running straight at Crane Tower.
// The menu is a stack of stencilled words; a gold slip of cut paper and a casino chip mark your pick.
import { CREW } from '../../data/crew.js';
import './home.css';
import { h, sleep, money, reducedMotion } from '../../core/dom.js';
import { go } from '../../core/router.js';
import { on } from '../../core/bus.js';
import * as S from '../../core/state.js';
import * as audio from '../../core/audio.js';
import { openModal, openSettings, iconButton, icon, button, dymo } from '../../ui/index.js';
import { JOBS, PROLOGUE } from '../../data/jobs.js';
import { acquireCity, releaseCity } from '../../art/noirCity.js';

let audioUnlocked = false;
const markUnlocked = () => { audioUnlocked = true; };
addEventListener('pointerdown', markUnlocked, { once: true, capture: true });
addEventListener('keydown', markUnlocked, { once: true, capture: true });

let coldOpenPlayed = false;
let ctx = null; // per-mount state

const pad2 = (n) => String(n).padStart(2, '0');
const sfx = (n) => { if (audioUnlocked) audio.sfx(n); };

function caseInfo() {
  if (!S.hasSave()) return null;
  const i = S.currentJobIndex();
  const job = JOBS[i];
  const allDone = JOBS.length > 0 && JOBS.every((j) => S.isJobDone(j.id));
  return {
    job,
    number: job?.number ?? i + 1,
    title: job?.title ?? 'Unknown',
    target: job?.target ?? '',
    solved: job ? S.solvedCount(job.id) : 0,
    allDone,
    rank: S.rank(),
    cash: S.cash(),
    heat: S.heat(),
  };
}

export default {
  id: 'home',

  async mount(root, params = {}) {
    const offs = [];
    const timers = [];
    const later = (ms, fn) => timers.push(setTimeout(fn, ms));
    ctx = { offs, timers, root, leaving: false };

    const { city, reused } = acquireCity(root, { quality: S.settings().quality, jobs: JOBS });
    ctx.city = city;
    city.setHighlights({});
    city.setHeat(0);

    const info = caseInfo();
    const cold = !coldOpenPlayed && !reused && !reducedMotion();
    coldOpenPlayed = true;

    /* ---------------- layout ---------------- */
    const scrim = h('div.hm-scrim');
    const dateline = h('div.hm-dateline', h('span.hm-dateline__dot'), 'Port Vesper', h('i', '·'), '1:47 a.m.', h('i', '·'), 'Rain all night');

    const title = h('h1.hm-title', { 'aria-label': 'Inside Job' },
      h('span.hm-title__ln.hm-title__ln--a', { 'data-t': 'Inside' }, 'Inside'),
      h('span.hm-title__ln.hm-title__ln--b', { 'data-t': 'Job' }, 'Job'),
    );
    const accent = h('p.hm-accent', 'Every building keeps a record.');
    const tagline = h('p.hm-tagline', h('span', 'Read it.'), h('span.hm-tagline__rule'), h('span', 'Rob it.'));

    const items = [];
    if (info && !info.allDone) {
      items.push({ id: 'continue', label: 'Continue', note: `Job ${info.number} · ${info.title}`, act: doContinue });
    } else if (info && info.allDone) {
      items.push({ id: 'continue', label: 'Back to the city', note: 'All jobs done', act: doContinue });
    }
    items.push({ id: 'new', label: 'New game', note: info ? 'Delete progress and start again' : 'Start at the pawn shop', act: doNew });
    items.push({ id: 'sandbox', label: 'Practice SQL', note: 'Try any query · no police', act: doSandbox });
    items.push({ id: 'settings', label: 'Settings', note: 'Sound · graphics · jobs', act: doSettings });

    const chip = h('i.hm-chip', { 'aria-hidden': 'true' });
    const menu = h('nav.hm-menu', { role: 'menu', 'aria-label': 'Main menu' }, chip);
    const btns = items.map((it, i) => {
      const b = h('button.hm-item', { type: 'button', role: 'menuitem', dataset: { id: it.id } },
        h('span.hm-item__no', `No. ${i + 1}`),
        h('span.hm-item__label', { 'data-t': it.label }, it.label),
        h('span.hm-item__note', it.note),
      );
      b.addEventListener('pointerenter', () => focusItem(i, { sound: true }));
      b.addEventListener('focus', () => focusItem(i, { sound: false }));
      b.addEventListener('click', () => choose(i));
      menu.append(b);
      return b;
    });

    const caseTag = info ? buildCaseTag(info) : null;

    const soundChip = iconButton(S.settings().sound ? 'sound' : 'mute', {
      title: 'Sound',
      className: 'hm-sound',
      onClick: () => S.setSetting('sound', !S.settings().sound),
    });
    const soundHint = dymo('Click anywhere for sound', { rot: -1.5 });
    soundHint.classList.add('hm-sound-hint');
    if (audioUnlocked || !S.settings().sound) soundHint.hidden = true;
    const corner = h('div.hm-corner', soundHint, soundChip);

    const billing = h('footer.hm-billing',
      h('span.hm-billing__row',
        ...['viv', 'dex', 'juno', 'otis', 'lena'].map((id) => h('b', CREW[id].name))),
      h('span.hm-billing__row.hm-billing__row--small',
        'and ', h('em', 'you'), ' as the Architect', h('i', '·'), '8 jobs', h('i', '·'), '1 city'),
    );

    const left = h('div.hm-left', title, accent, tagline, h('div.hm-row', menu));
    root.append(scrim, h('div.hm-letterbox.hm-letterbox--t'), h('div.hm-letterbox.hm-letterbox--b'), dateline, left, caseTag, corner, billing);
    root.classList.add(cold ? 'is-cold' : reused ? 'is-return' : 'is-warm');

    /* ---------------- focus + choose ---------------- */
    let focus = -1;
    function focusItem(i, { sound = true } = {}) {
      if (i === focus || ctx?.leaving) return;
      focus = i;
      btns.forEach((b, k) => b.classList.toggle('is-focus', k === i));
      const b = btns[i];
      chip.style.transform = `translate(0, ${b.offsetTop + b.offsetHeight / 2 - 22}px) rotate(${i * 90 + 30}deg)`;
      chip.classList.add('is-on');
      if (caseTag) caseTag.classList.toggle('is-lit', items[i].id === 'continue');
      if (sound) sfx('lock');
    }
    function choose(i) {
      if (ctx?.leaving) return;
      focusItem(i, { sound: false });
      const b = btns[i];
      b.classList.remove('is-press');
      void b.offsetWidth;
      b.classList.add('is-press');
      sfx('stamp');
      items[i].act();
    }

    async function leave(fn, { keepCity = false } = {}) {
      if (ctx.leaving) return;
      ctx.leaving = true;
      root.classList.add('is-leaving-ui');
      sfx('whoosh');
      if (!keepCity) city.setFade(0.2);
      await sleep(keepCity ? 380 : 420);
      fn();
    }
    function doContinue() {
      city.setMode('overhead', { duration: 3000 });
      leave(() => go('hub', {}, { transition: 'none' }), { keepCity: true });
    }
    function startNew() {
      S.reset();
      S.start();
      leave(() => go('cinema', { script: PROLOGUE, next: { screen: 'hub', params: {} } }, { transition: 'wipe' }));
    }
    function doNew() {
      if (!S.hasSave()) return startNew();
      const m = openModal({
        tab: 'New game',
        title: 'Start a <em>new</em> game?',
        className: 'hm-burn',
        body: [
          h('p.hm-burn__lede', 'This deletes all your jobs, your money and your Police level. You start again at job 1, the pawn shop.'),
          h('ul.hm-burn__list',
            h('li', h('span', 'Rank'), h('b', info.rank.name)),
            h('li', h('span', 'Money'), h('b', money(info.cash))),
            h('li', h('span', 'Next job'), h('b', `Job ${info.number} · ${info.title}`))),
          h('div.hm-burn__actions',
            button('Delete my progress', { variant: 'alarm', cut: 'b', onClick: () => { m.close(); startNew(); } }),
            button('Keep my progress', { variant: 'ink', cut: 'c', onClick: () => m.close() })),
        ],
      });
      setTimeout(() => m.el.querySelector('.hm-burn__actions .cut--ink')?.focus(), 60);
    }
    function doSandbox() {
      leave(() => go('planning', { mode: 'sandbox' }, { transition: 'wipe' }));
    }
    function doSettings() {
      openSettings({ onReset: () => go('home', {}, { transition: 'fade' }) });
    }

    /* ---------------- input ---------------- */
    const onKey = (e) => {
      if (ctx?.leaving || document.querySelector('.modal-scrim')) return;
      const k = e.key;
      if (k === 'ArrowDown' || k === 's' || k === 'S') { e.preventDefault(); focusItem((focus + 1 + items.length) % items.length); btns[focus].focus({ preventScroll: true }); }
      else if (k === 'ArrowUp' || k === 'w' || k === 'W') { e.preventDefault(); focusItem((Math.max(focus, 0) - 1 + items.length) % items.length); btns[focus].focus({ preventScroll: true }); }
      else if ((k === 'Enter' || k === ' ') && document.activeElement?.closest?.('.hm-menu') == null && focus >= 0) { e.preventDefault(); choose(focus); }
      else if (/^[1-9]$/.test(k) && +k <= items.length) choose(+k - 1);
    };
    addEventListener('keydown', onKey);
    offs.push(() => removeEventListener('keydown', onKey));

    const onMove = (e) => {
      const x = (e.clientX / innerWidth) * 2 - 1, y = (e.clientY / innerHeight) * 2 - 1;
      city.pointerParallax(x, y);
      root.style.setProperty('--px', x.toFixed(3));
      root.style.setProperty('--py', y.toFixed(3));
    };
    root.addEventListener('pointermove', onMove);

    const onFirst = () => {
      soundHint.classList.add('is-peel');
      later(400, () => { soundHint.hidden = true; });
      audio.ambience('rain');
    };
    if (!audioUnlocked) {
      addEventListener('pointerdown', onFirst, { once: true });
      addEventListener('keydown', onFirst, { once: true });
      offs.push(() => { removeEventListener('pointerdown', onFirst); removeEventListener('keydown', onFirst); });
    }
    audio.ambience('rain');
    audio.music(S.settings().music);

    offs.push(on('settings', ({ key, value }) => {
      if (key === 'sound') {
        soundChip.replaceChildren(icon(value ? 'sound' : 'mute'));
        soundChip.classList.toggle('is-off', !value);
        if (!value) soundHint.hidden = true;
      }
      if (key === 'quality') city.setQuality?.(value);
    }));
    soundChip.classList.toggle('is-off', !S.settings().sound);

    /* ---------------- the opening shot ---------------- */
    if (cold) {
      city.setMode('street', { instant: true });
      city.setFade(0, { instant: true });
      later(700, () => { city.setFade(0.85, { instant: true }); city.flash(); });
      later(860, () => city.setFade(0, { instant: true }));
      later(1250, () => city.setFade(1));
      later(1750, () => { root.classList.add('is-title'); sfx('slam'); });
      later(2500, () => root.classList.add('is-menu'));
      later(3300, () => { root.classList.add('is-settled'); if (focus < 0) focusItem(0, { sound: false }); });
    } else if (reused) {
      city.setFade(1);
      city.setMode('street', { duration: 2600 });
      root.classList.add('is-title');
      later(900, () => root.classList.add('is-menu'));
      later(1500, () => { root.classList.add('is-settled'); if (focus < 0) focusItem(0, { sound: false }); });
    } else {
      city.setMode('street', { instant: true });
      city.setFade(0, { instant: true });
      later(60, () => city.setFade(1));
      later(200, () => root.classList.add('is-title'));
      later(600, () => root.classList.add('is-menu'));
      later(1100, () => { root.classList.add('is-settled'); if (focus < 0) focusItem(0, { sound: false }); });
    }
  },

  unmount() {
    if (!ctx) return;
    ctx.offs.forEach((f) => f());
    ctx.timers.forEach(clearTimeout);
    releaseCity();
    ctx = null;
  },
};

function buildCaseTag(info) {
  const heatPips = Array.from({ length: 10 }, (_, i) => h('i', { class: i < Math.round(info.heat / 10) ? 'is-on' : '' }));
  const pct = Math.round((info.rank.progress || 0) * 100);
  const tag = h('aside.hm-case', { 'aria-label': 'Current job' },
    h('span.hm-case__pin'),
    h('span.hm-case__string', { html: '<svg viewBox="0 0 40 70" preserveAspectRatio="none"><path d="M20 2 C 8 22, 32 38, 20 68" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>' }),
    h('div.hm-case__tag.tex-paper',
      h('span.hm-case__eyelet'),
      h('div.hm-case__k', info.allDone ? 'All jobs done' : 'Current job'),
      h('div.hm-case__no', h('small', 'Job'), pad2(info.number)),
      h('div.hm-case__title', info.title),
      h('div.hm-case__target', info.target),
      h('div.hm-case__recs', h('span', 'Questions solved'), h('b', `${info.solved}/5`)),
      h('dl.hm-case__dl',
        h('div', h('dt', 'Rank'), h('dd', info.rank.name)),
        h('div', h('dt', 'Money'), h('dd', money(info.cash))),
        h('div', h('dt', 'Police'), h('dd.hm-case__heat', ...heatPips))),
      h('div.hm-case__bar', h('i', { style: { width: pct + '%' } }), h('span', info.rank.next ? `${pct}% to ${info.rank.next}` : 'Top rank')),
    ),
  );
  return tag;
}
