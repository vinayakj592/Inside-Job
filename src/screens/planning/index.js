// PLANNING — the light table. Blueprint (hero), crew comms, the task, the terminal,
// printouts, intel cards, the records drawer, the field manual, and CALL THE PLAY.
// Params: { jobId, puzzle?, play? } or { mode: 'sandbox' }.
import './planning.css';
import { h, sleep, money, reducedMotion } from '../../core/dom.js';
import { go } from '../../core/router.js';
import * as S from '../../core/state.js';
import { on } from '../../core/bus.js';
import { sfx, ambience } from '../../core/audio.js';
import { button, iconButton, dymo, openModal, openSettings, icon, modalOpen } from '../../ui/index.js';
import { JOBS } from '../../data/jobs.js';
import * as C from '../../data/concepts.js';
import { ready, run, catalog } from '../../sql/engine.js';
import { check } from '../../sql/check.js';
import { explainError } from '../../sql/diagnose.js';
import { createEditor } from '../../sql/editor.js';
import { highlight } from '../../sql/highlight.js';
import { blueprintToNoir } from '../../cinema/transition.js';
import { createBlueprint } from './blueprint.js';
import { createSchemaPlan } from './schemaplan.js';
import { createComms } from './comms.js';
import { createPrintout } from './printout.js';
import { createRecords } from './records.js';
import { openManual } from './manual.js';

let ctx = null;

/** A faint municipal seal stamped into the terminal glass. */
function seal() {
  const wrap = document.createElement('div');
  wrap.className = 'pl-seal';
  wrap.setAttribute('aria-hidden', 'true');
  wrap.innerHTML = `<svg viewBox="0 0 220 220"><defs><path id="pl-seal-arc" d="M110,110 m-82,0 a82,82 0 1,1 164,0 a82,82 0 1,1 -164,0"/></defs>
    <circle cx="110" cy="110" r="104"/><circle cx="110" cy="110" r="98" stroke-dasharray="2 5"/><circle cx="110" cy="110" r="66"/>
    <text><textPath href="#pl-seal-arc" startOffset="0">PORT VESPER · MUNICIPAL RECORDS · TERMINAL 07 · READ ONLY ·</textPath></text>
    <path d="M70,138 L70,96 L110,70 L150,96 L150,138 Z M84,138 L84,104 M98,138 L98,104 M122,138 L122,104 M136,138 L136,104 M62,142 L158,142"/></svg>`;
  return wrap;
}
const fill = (el, ...kids) => el.replaceChildren(...kids.flat().filter((k) => k != null && k !== false));

const OK_LINES = ['That is right.', 'Good work. That is correct.', 'Yes. That is the answer.', 'Correct. We have it.', 'That is what we needed.'];
if (import.meta.env?.DEV) window.__ijPlan = { run, check, explainError, catalog, ready };
const captionPage = (text) => ({ layout: 'full', panels: [{ shot: 'alarm', caption: text }] });

export default {
  id: 'planning',
  async mount(root, params = {}) {
    const offs = [];
    const timers = new Set();
    const later = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); fn(); }, ms); timers.add(t); return t; };
    ctx = { offs, timers, alive: true };
    const alive = () => ctx && ctx.alive && root.isConnected;

    root.append(h('div.pl-boot', h('span', 'Loading the plans…')));
    await ready();
    if (!alive()) return;
    root.replaceChildren();

    const sandbox = params.mode === 'sandbox';
    const job = sandbox ? null : (JOBS.find((j) => j.id === params.jobId) || JOBS[0]);
    const cat = catalog();
    const conceptsMap = C.CONCEPTS || {};

    /* ================================================================ */
    /* HUD                                                               */
    /* ================================================================ */
    const cashTape = dymo(money(S.cash()), { tone: 'blue', rot: -1 });
    const heatTape = dymo('', { rot: 1.2 });
    const heatFill = h('i.pl-heat__fill');
    const heatMeter = h('span.pl-heat__meter', { title: 'Hints, answers and wrong plans make the police come closer.' }, heatFill, ...Array.from({ length: 9 }, (_, i) => h('b', { style: { left: `${(i + 1) * 10}%` } })));
    const paintHeat = () => {
      const v = Math.round(S.heat());
      heatTape.textContent = `Police ${v}`;
      heatTape.className = 'dymo' + (v > 70 ? ' dymo--alarm' : '');
      heatTape.style.setProperty('--rot', '1.2deg');
      heatFill.style.width = Math.min(100, v) + '%';
      heatMeter.classList.toggle('is-hot', v > 70);
    };
    paintHeat();
    const soundBtn = iconButton(S.settings().sound ? 'sound' : 'mute', { world: 'bp', title: 'Sound', onClick: () => {
      S.setSetting('sound', !S.settings().sound);
    } });
    const hud = h('header.pl-hud',
      h('div.pl-hud__left',
        iconButton('back', { world: 'bp', title: sandbox ? 'Back to the main menu' : 'Back to the city map', onClick: () => leave() }),
        sandbox
          ? h('div.pl-hud__title', h('span.pl-hud__kicker', 'Practice · no job'), h('b', 'Practice SQL'))
          : h('div.pl-hud__title',
            h('span.pl-hud__kicker', `Job ${String(job.number).padStart(2, '0')} · ${job.district || ''}`),
            h('b', job.title), h('span.pl-hud__target', job.target))),
      h('div.pl-hud__right',
        h('div.pl-hud__money', h('span.pl-hud__lbl', 'Money'), cashTape),
        h('div.pl-heat', { title: 'Hints, answers and wrong plans make the police come closer.' }, h('span.pl-hud__lbl', 'Police'), heatTape, heatMeter),
        h('div.pl-hud__marks',
          iconButton('book', { world: 'bp', title: 'SQL guide', onClick: () => openManual(null, { onUse: (sql) => { editor.value = sql; editor.focus(); } }) }),
          iconButton('gear', { world: 'bp', title: 'Settings', onClick: () => openSettings({ world: 'vellum' }) }),
          soundBtn)));
    offs.push(on('cash', () => { cashTape.textContent = money(S.cash()); }));
    offs.push(on('heat', paintHeat));
    offs.push(on('settings', ({ key } = {}) => {
      if (key === 'sound') { soundBtn.replaceChildren(icon(S.settings().sound ? 'sound' : 'mute')); if (S.settings().sound) ambience('blueprint'); }
    }));

    /* ================================================================ */
    /* TABLE + DESK                                                      */
    /* ================================================================ */
    const bpHost = h('div.pl-bp');
    const tabs = h('nav.pl-tabs');
    const intel = h('div.pl-intel');
    const playQ = h('div.pl-playq', { hidden: true });
    const zoom = h('div.pl-zoom',
      h('button.pl-zoom__b', { type: 'button', title: 'Zoom in', onclick: () => view.pz.zoomIn() }, '+'),
      h('button.pl-zoom__b', { type: 'button', title: 'Zoom out', onclick: () => view.pz.zoomOut() }, '−'),
      h('button.pl-zoom__b.is-fit', { type: 'button', title: 'Show the whole plan (or double-click it)', onclick: () => view.pz.reset() }, 'Fit'));
    const printout = createPrintout({ onClose: () => {} });
    const records = createRecords({ onInsert: (t) => { editor.insert(t); editor.focus(); sfx('click'); } });
    const table = h('div.pl-table', bpHost, h('div.pl-light'), h('div.pl-vignette'), tabs, playQ, zoom, intel, printout.el, records.el);
    const comms = createComms();
    const task = h('section.pl-task');
    const playPanel = h('section.pl-play', { hidden: true });
    const desk = h('aside.pl-desk', comms.el, task, playPanel);
    root.append(h('div.pl-room'), hud, h('div.pl-main', table, desk));
    root.classList.toggle('is-sandbox', sandbox);

    /* ================================================================ */
    /* BLUEPRINT                                                          */
    /* ================================================================ */
    const visible = new Set();
    let view;
    if (sandbox) {
      view = createSchemaPlan(cat, {
        onTable: (t) => { records.open(t); editor.insert(t); editor.focus(); },
        onColumn: (c) => { editor.insert(c); editor.focus(); },
      });
      bpHost.append(view.el);
      later(() => { sfx('reveal'); view.drawIn(); }, 250);
    } else {
      const layers = job.blueprint?.layers || [];
      layers.filter((l) => l.initial).forEach((l) => visible.add(l.id));
      if (!layers.some((l) => l.initial) && layers[0]) visible.add(layers[0].id);
      job.puzzles.forEach((p, i) => { if (S.job(job.id).solved[i]) (p.reveals || []).forEach((l) => visible.add(l)); });
      view = createBlueprint(job, { visible: new Set(), rev: S.solvedCount(job.id) });
      bpHost.append(view.el);
      later(() => startDraw(), 250);
    }
    let drawnIn = false;
    function startDraw() {
      if (drawnIn || sandbox) return;
      drawnIn = true;
      sfx('reveal');
      view.drawIn([...(job.blueprint?.layers || []).map((l) => l.id).filter((id) => visible.has(id))], { stagger: 160, speed: 1.3 });
    }

    /* ================================================================ */
    /* TERMINAL                                                           */
    /* ================================================================ */
    let draftTimer = null;
    let pi = 0;
    const store = () => (sandbox ? S.sandbox() : S.attempt(job.id, pi));
    const editor = createEditor({
      placeholder: '-- Write your query here',
      onChange: (v) => {
        store().draft = v;
        clearTimeout(draftTimer);
        draftTimer = setTimeout(() => S.save(), 600);
      },
      onRun: () => runQuery(),
    });
    const runBtn = button('Run', { variant: 'grease', size: 'lg', icon: 'play', className: 'pl-run', onClick: () => runQuery() });
    const nextBtn = button('Next', { variant: 'grease', size: 'lg', className: 'pl-next', onClick: () => nextAction() });
    nextBtn.hidden = true;
    const askBtn = button('Ask Kim', { variant: 'bp', size: 'sm', icon: 'bulb', className: 'pl-ask', onClick: () => askJuno() });
    const fileBtn = button('Show answer', { variant: 'bp', size: 'sm', icon: 'file', className: 'pl-file', onClick: () => pullFile() });
    const histBtn = iconButton('history', { world: 'bp', title: 'Query history', className: 'pl-mini', onClick: () => openHistory() });
    const helpBox = h('div.pl-term__help', askBtn, fileBtn);
    // the receipt stub: what the last run said, and a way to pull the printout back out
    const stub = h('button.pl-stub', { type: 'button', title: 'Show the result again' });
    let lastPrint = null;
    stub.addEventListener('click', () => { if (lastPrint) { sfx('whoosh'); printout.show(lastPrint); } });
    function paintStub(kind, text, meta) {
      stub.className = 'pl-stub is-' + kind;
      fill(stub,
        h('span.pl-stub__mark', kind === 'ok' ? '✓' : kind === 'bad' || kind === 'err' ? '✗' : kind === 'free' ? '▸' : '—'),
        h('span.pl-stub__txt', text),
        meta ? h('span.pl-stub__meta', meta) : null);
    }
    function stubFromHistory() {
      const last = (store().history || [])[0];
      lastPrint = null;
      if (!last) paintStub('none', 'You have not run a query yet.', `${navigator.platform?.includes('Mac') ? '⌘' : 'Ctrl'} + ↵ to run`);
      else paintStub(last.ok ? (sandbox ? 'free' : 'ok') : 'bad', last.ok ? (sandbox ? 'Your last query ran.' : 'Your last query was correct.') : 'Your last query was not correct.', last.rows != null ? `${last.rows} row${last.rows === 1 ? '' : 's'}` : 'error');
    }
    const recBtn = h('button.pl-term__rec', { type: 'button', title: 'Tables' }, icon('file'), 'Tables');
    recBtn.addEventListener('click', () => { records.toggle(); sfx('click'); });
    const term = h('section.pl-term',
      h('header.pl-term__head',
        h('span.pl-term__title', 'Your query'),
        h('span.pl-term__sub', sandbox ? 'Read only · not checked' : 'Read only'),
        sandbox ? null : h('span.pl-term__kbd', h('kbd', navigator.platform?.includes('Mac') ? '⌘' : 'Ctrl'), '+', h('kbd', '↵')),
        recBtn, histBtn),
      editor.el,
      stub,
      h('footer.pl-term__foot',
        h('div.pl-term__primary', runBtn, nextBtn),
        sandbox ? h('span.pl-term__kbd', h('kbd', navigator.platform?.includes('Mac') ? '⌘' : 'Ctrl'), '+', h('kbd', '↵'), ' to run') : helpBox));
    term.append(seal());
    desk.insertBefore(term, playPanel);

    /* ================================================================ */
    /* PUZZLES                                                            */
    /* ================================================================ */
    let busy = false;
    let mode = 'solve';

    function renderTabs() {
      tabs.replaceChildren();
      if (sandbox) {
        tabs.append(h('div.pl-tab.is-on.is-static', h('span.pl-tab__n', 'S-0'), h('span.pl-tab__t', 'All tables')));
        return;
      }
      const j = S.job(job.id);
      job.puzzles.forEach((p, i) => {
        const on = mode === 'solve' && i === pi;
        const t = h('button.pl-tab', { type: 'button', title: `${String(i + 1).padStart(2, '0')} · ${p.title}`, dataset: { i } },
          h('span.pl-tab__n', String(i + 1).padStart(2, '0')), on ? h('span.pl-tab__t', p.title) : null);
        if (j.solved[i]) t.append(tick(i));
        t.classList.toggle('is-solved', !!j.solved[i]);
        t.classList.toggle('is-on', mode === 'solve' && i === pi);
        t.addEventListener('click', () => { if (!busy) { sfx('click'); selectPuzzle(i); } });
        tabs.append(t);
      });
      const n = S.solvedCount(job.id);
      const all = n === job.puzzles.length;
      const pt = h('button.pl-tab.pl-tab--play', { type: 'button', title: all ? 'Choose the plan' : 'Solve all 5 questions to choose the plan' },
        h('span.pl-tab__n', all ? icon('star') : icon('lock')), h('span.pl-tab__t', all ? 'The plan' : `The plan · ${n}/${job.puzzles.length}`));
      pt.classList.toggle('is-locked', !all);
      pt.classList.toggle('is-on', mode === 'play');
      pt.addEventListener('click', () => { if (!busy && all) { sfx('click'); enterPlay(); } else if (!all) sfx('bad'); });
      tabs.append(pt);
    }
    function tick(i) {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('class', 'pl-tick');
      svg.setAttribute('viewBox', '0 0 30 24');
      const d = i % 2 ? 'M3,13 C6,15 8,18 10,21 C14,12 20,6 28,2' : 'M2,12 C5,14 8,17 11,21 C15,11 21,5 27,3';
      svg.innerHTML = `<path d="${d}" pathLength="1"/>`;
      return svg;
    }

    function renderIntel({ fresh = -1 } = {}) {
      intel.replaceChildren();
      if (sandbox) return;
      const j = S.job(job.id);
      job.puzzles.forEach((p, i) => {
        if (!j.solved[i]) return;
        const rot = ((i * 37) % 7) - 3;
        const card = h('div.pl-card', { style: { '--rot': rot + 'deg' }, tabindex: 0 },
          h('i.pl-card__pin'),
          h('span.pl-card__k', `Clue ${i + 1} · ${p.title}`),
          h('p', p.intel));
        if (i === fresh) card.classList.add('is-fresh');
        intel.append(card);
      });
    }

    function renderTask() {
      const p = job.puzzles[pi];
      const j = S.job(job.id);
      const solved = !!j.solved[pi];
      const chips = (p.concepts || []).filter((k) => conceptsMap[k]).map((k) => {
        const c = h('button.pl-chip', { type: 'button', title: 'Open the SQL guide' }, h('span', '§'), conceptsMap[k].title || k);
        c.addEventListener('click', () => { sfx('click'); openManual(k, { onUse: (sql) => { editor.value = sql; editor.focus(); } }); });
        return c;
      });
      fill(task, 
        h('div.pl-task__top',
          h('span.pl-task__wo', `Task ${pi + 1} of ${job.puzzles.length}`),
          p.orderMatters ? h('span.pl-task__order', 'order matters') : null,
          h('div.pl-task__chips', chips)),
        h('h2.pl-task__title', p.title, solved ? h('span.pl-task__solved', h('span', 'Solved'), tickBig()) : null),
        h('p.pl-task__prompt', p.prompt),
      );
      task.classList.toggle('is-solved', solved);
    }
    function tickBig() {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', '0 0 60 40');
      svg.innerHTML = '<path d="M4,22 C9,25 14,31 19,37 C27,20 40,8 57,3" pathLength="1"/>';
      return svg;
    }

    function paintActions() {
      if (sandbox) { nextBtn.hidden = true; runBtn.hidden = false; return; }
      const j = S.job(job.id);
      const solved = !!j.solved[pi];
      const a = S.attempt(job.id, pi);
      const all = S.allQueriesSolved(job.id);
      nextBtn.hidden = !solved;
      helpBox.hidden = solved;
      if (solved) {
        const nxt = nextUnsolved();
        nextBtn.querySelector('span').textContent = all ? 'Choose the plan' : nxt != null ? `Next: task ${nxt + 1}` : 'Next';
        runBtn.querySelector('span').textContent = 'Run again';
      } else runBtn.querySelector('span').textContent = 'Run';
      runBtn.classList.toggle('is-demoted', solved);
      runBtn.classList.toggle('bp-btn--grease', !solved);
      runBtn.querySelector('.grease-loop')?.toggleAttribute('hidden', solved);
      askBtn.querySelector('span').textContent = a.hints ? 'Kim’s hint' : 'Ask Kim';
      setCost(askBtn, a.hints ? '' : '+3 Police');
      fileBtn.querySelector('span').textContent = a.solution ? 'See answer' : 'Show answer';
      setCost(fileBtn, a.solution ? '' : '+8 Police');
    }
    function setCost(btn, text) {
      let c = btn.querySelector('.cost');
      if (!text) { c?.remove(); return; }
      if (!c) { c = h('span.cost'); btn.append(c); }
      c.textContent = text;
    }
    function nextUnsolved() {
      const j = S.job(job.id);
      for (let k = 1; k <= job.puzzles.length; k++) { const i = (pi + k) % job.puzzles.length; if (!j.solved[i]) return i; }
      return null;
    }
    function nextAction() {
      if (busy) return;
      sfx('click');
      if (S.allQueriesSolved(job.id)) enterPlay();
      else { const n = nextUnsolved(); if (n != null) selectPuzzle(n); }
    }

    function selectPuzzle(i, { say = true } = {}) {
      if (mode === 'play') exitPlay();
      pi = Math.max(0, Math.min(job.puzzles.length - 1, i));
      const a = S.attempt(job.id, pi);
      editor.value = a.draft || '';
      printout.hide();
      stubFromHistory();
      renderTabs();
      renderTask();
      paintActions();
      if (say) {
        const p = job.puzzles[pi];
        if (p.ask) comms.say(p.ask.who, p.ask.text, { mood: 'calm', kind: 'ask' });
      }
      later(() => editor.focus(), 60);
    }

    /* ================================================================ */
    /* RUN                                                                */
    /* ================================================================ */
    function pushHistory(sql, ok, rows) {
      const st = store();
      st.history = st.history || [];
      if (st.history[0]?.sql === sql) st.history[0] = { sql, ok, rows, at: Date.now() };
      else st.history.unshift({ sql, ok, rows, at: Date.now() });
      if (st.history.length > 30) st.history.length = 30;
      S.save();
    }

    async function runQuery() {
      if (busy || mode === 'play') return;
      const sel = editor.selectedText();
      const sql = (sel.trim() ? sel : editor.value).trim();
      runBtn.classList.remove('is-drawing'); void runBtn.offsetWidth; runBtn.classList.add('is-drawing');
      if (!sql) {
        sfx('bad');
        printout.show({ error: 'EMPTY QUERY', explain: { title: 'Nothing to run.', detail: 'Write a SELECT query first.' } });
        return;
      }
      sfx('run');
      const res = run(sql);
      S.recordRun(res.ok);
      if (!res.ok) {
        const ex = explainError(res.error, sql, cat);
        editor.markError(ex.token);
        lastPrint = { error: res.error, explain: ex, sql };
        printout.show(lastPrint);
        paintStub('err', ex.title, 'error');
        pushHistory(sql, false, null);
        sfx('err');
        return;
      }
      if (sandbox) {
        lastPrint = { result: res, sql, sandbox: true };
        printout.show(lastPrint);
        paintStub('free', `${res.columns.length} column${res.columns.length === 1 ? '' : 's'} shown.`, `${res.rows.length} row${res.rows.length === 1 ? '' : 's'} · ${res.ms.toFixed(1)}ms`);
        pushHistory(sql, true, res.rows.length);
        return;
      }
      const p = job.puzzles[pi];
      const j = S.job(job.id);
      const already = !!j.solved[pi];
      const a = S.attempt(job.id, pi);
      if (!already) a.tries++;
      const v = check(p, sql, res);
      pushHistory(sql, v.ok, res.rows.length);
      lastPrint = { result: res, verdict: v, sql, orderMatters: p.orderMatters, okLine: OK_LINES[pi % OK_LINES.length] };
      printout.show(lastPrint);
      paintStub(v.ok ? 'ok' : 'bad', v.ok ? 'Correct.' : v.headline, `${res.rows.length} row${res.rows.length === 1 ? '' : 's'}`);
      if (!v.ok) { sfx('bad'); return; }
      sfx('ok');
      if (!already) await solved();
    }

    async function solved() {
      busy = true;
      root.classList.add('is-busy');
      const p = job.puzzles[pi];
      const { paid, firstTry } = S.solveQuery(job.id, pi);
      renderTabs();
      renderTask();
      await sleep(1100);
      if (!alive()) return;
      printout.tuck();
      view.pz.reset();
      const newLayers = (p.reveals || []).filter((l) => !visible.has(l));
      newLayers.forEach((l) => visible.add(l));
      view.setRev(S.solvedCount(job.id));
      if (newLayers.length) sfx('reveal');
      const drawn = view.drawIn(newLayers, { stagger: 420 });
      await sleep(reducedMotion() ? 0 : 700);
      if (!alive()) return;
      renderIntel({ fresh: pi });
      payTape(paid, firstTry);
      sfx('cash');
      if (p.react) comms.say(p.react.who, p.react.text, { mood: 'smirk', kind: 'react' });
      await drawn;
      if (!alive()) return;
      paintActions();
      nextBtn.classList.add('is-drawing');
      busy = false;
      root.classList.remove('is-busy');
      if (S.allQueriesSolved(job.id)) {
        later(() => comms.say('viv', 'All 5 questions are done, Architect. Now choose the plan.', { mood: 'calm', kind: 'play' }), 400);
      }
    }

    function payTape(paid, firstTry) {
      const t = dymo(`+ ${money(paid)}`, { tone: 'gold', rot: -3 });
      t.classList.add('pl-pay');
      const wrap = h('div.pl-paywrap', t, firstTry ? dymo('First try +50%', { tone: 'blue', rot: 2 }) : null);
      hud.append(wrap);
      later(() => wrap.classList.add('is-out'), 2600);
      later(() => wrap.remove(), 3000);
    }

    /* ================================================================ */
    /* HELP                                                               */
    /* ================================================================ */
    function askJuno() {
      if (busy || sandbox) return;
      const p = job.puzzles[pi];
      const a = S.attempt(job.id, pi);
      if (!a.hints) S.useHint(job.id, pi);
      comms.say('juno', p.hint || 'Read the task again, slowly.', { mood: 'calm', kind: 'hint' });
      paintActions();
    }

    function pullFile() {
      if (busy || sandbox) return;
      const a = S.attempt(job.id, pi);
      if (a.solution) return showFile();
      const m = openModal({
        world: 'vellum', title: 'Show the <em>answer</em>?', className: 'pl-file-modal',
        body: [
          h('p', 'Kim can show you the full query. But it has a cost.'),
          h('ul.pl-file__cost', h('li', h('b', '+8 Police'), ' the police come closer'), h('li', h('b', 'Less money'), ' this question pays only 1/4'), h('li', h('b', 'Fewer stars'), ' for this job')),
          h('div.pl-file__actions',
            button('Show answer', { variant: 'grease', icon: 'file', onClick: () => { m.close(); S.useSolution(job.id, pi); paintActions(); sfx('alarm'); showFile(); } }),
            button('Not yet', { variant: 'bp', size: 'sm', onClick: () => m.close() })),
        ],
      });
    }
    function showFile() {
      const p = job.puzzles[pi];
      const pre = h('pre.pl-file__sql', { html: highlight(p.sql, { tables: new Set(cat.tables.map((t) => t.name.toLowerCase())) }) });
      const m = openModal({
        world: 'vellum', title: `<em>Answer</em> · Task ${pi + 1}`, className: 'pl-file-modal',
        body: [
          h('p.pl-file__lede', p.title + ' — ', h('span', p.prompt)),
          pre,
          h('div.pl-file__actions',
            button('Use this query', { variant: 'grease', icon: 'terminal', onClick: () => { editor.value = p.sql; m.close(); editor.focus(); sfx('type'); } }),
            button('Close', { variant: 'bp', size: 'sm', onClick: () => m.close() })),
        ],
      });
    }

    function openHistory() {
      const hist = store().history || [];
      const list = hist.length
        ? h('ol.pl-hist', hist.map((e) => {
          const b = h('button.pl-hist__item', { type: 'button' },
            h('span.pl-hist__mark', { class: e.ok ? 'is-ok' : 'is-bad' }, e.ok ? '✓' : '✗'),
            h('pre', { html: highlight(e.sql) }),
            h('small', `${new Date(e.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}${e.rows != null ? ` · ${e.rows} rows` : ''}`));
          b.addEventListener('click', () => { editor.value = e.sql; m.close(); editor.focus(); sfx('type'); });
          return b;
        }))
        : h('p', 'You have not run a query yet.');
      const m = openModal({ world: 'vellum', title: 'Query <em>history</em>', className: 'pl-hist-modal', body: list });
    }

    /* ================================================================ */
    /* CALL THE PLAY                                                      */
    /* ================================================================ */
    let picked = null;
    function enterPlay() {
      if (sandbox || !job.play) return;
      mode = 'play';
      picked = null;
      startDraw(); // lettering must be on the sheet before tags are placed around it
      root.classList.add('is-play');
      printout.hide();
      records.close();
      term.hidden = true;
      task.hidden = true;
      playPanel.hidden = false;
      renderTabs();
      renderIntel();
      const wrong = S.job(job.id).play.wrong || [];
      const box = view.showRoutes(job.play.options, { wrong, onHover: (id) => hover(id), onPick: (id) => pick(id) });
      playQ.hidden = false;
      fill(playQ, h('span.pl-playq__k', 'Choose the plan'), h('h2', job.play.question), underline());
      later(() => {
        if (!alive() || mode !== 'play') return;
        const top = playQ.offsetTop + playQ.offsetHeight + 8;
        const cards = intel.querySelector('.pl-card');
        const bottom = cards ? cards.offsetHeight + 12 : 30;
        view.pz.frame(box, { top, bottom, left: 60, right: 40 });
      }, 40);
      const tags = job.play.options.map((o, i) => {
        const isWrong = wrong.includes(o.id);
        const t = h('button.tag.pl-opt', { type: 'button', dataset: { id: o.id }, disabled: isWrong },
          h('span.pl-opt__l', String.fromCharCode(65 + i)), h('b', o.label), o.detail || '');
        if (isWrong) t.append(h('span.pl-opt__blown', 'Failed'));
        t.addEventListener('pointerenter', () => hover(o.id));
        t.addEventListener('pointerleave', () => hover(null));
        t.addEventListener('click', () => pick(o.id));
        return t;
      });
      const callBtn = button('Go with this plan', { variant: 'grease', size: 'lg', icon: 'play', className: 'pl-callit', disabled: true, onClick: () => callPlay() });
      fill(playPanel, 
        h('span.pl-play__k', 'The plan'),
        h('p.pl-play__hint', wrong.length ? `${wrong.length} plan${wrong.length === 1 ? '' : 's'} failed. Read the clues again.` : 'Every way in is on the map. Your clues show which ones fail. Pick one.'),
        h('div.pl-play__opts', tags),
        h('div.pl-play__foot', callBtn, button('Back to the questions', { variant: 'link', onClick: () => { sfx('click'); selectPuzzle(pi, { say: false }); } })),
      );
      comms.say('viv', wrong.length ? 'The police are closer now. Choose again, Architect. Be careful.' : 'All 5 done. Here is the building. Which way do we go in?', { mood: wrong.length ? 'tense' : 'calm', kind: 'play' });
    }
    function underline() {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', '0 0 400 16');
      svg.setAttribute('preserveAspectRatio', 'none');
      svg.innerHTML = '<path d="M4,10 C80,4 180,13 260,7 C310,4 360,9 396,6" pathLength="1"/>';
      return svg;
    }
    function hover(id) {
      if (mode !== 'play' || busy) return;
      view.hotRoute(id || picked);
      playPanel.querySelectorAll('.pl-opt').forEach((t) => t.classList.toggle('is-hot', t.dataset.id === id));
      if (id && id !== picked) sfx('hover');
    }
    function pick(id) {
      if (mode !== 'play' || busy) return;
      if ((S.job(job.id).play.wrong || []).includes(id)) { sfx('bad'); return; }
      picked = picked === id ? null : id;
      sfx('stamp');
      view.pickRoute(picked);
      playPanel.querySelectorAll('.pl-opt').forEach((t) => t.classList.toggle('is-picked', t.dataset.id === picked));
      const cb = playPanel.querySelector('.pl-callit');
      if (cb) { cb.disabled = !picked; if (picked) { cb.classList.remove('is-drawing'); void cb.offsetWidth; cb.classList.add('is-drawing'); } }
    }
    async function callPlay() {
      if (!picked || busy) return;
      busy = true;
      root.classList.add('is-busy');
      const opt = job.play.options.find((o) => o.id === picked);
      const route = opt.route || [];
      const last = route[route.length - 1] || [600, 380];
      const right = picked === job.play.answer;
      sfx('slam');
      const xs = route.map((p) => p[0]), ys = route.map((p) => p[1]);
      if (xs.length) await view.pz.focus({ x: Math.min(...xs) - 160, y: Math.min(...ys) - 120, w: Math.max(...xs) - Math.min(...xs) + 320, h: Math.max(...ys) - Math.min(...ys) + 240 }, 650);
      await sleep(250);
      if (!alive()) return;
      if (right) {
        const result = S.completeJob(job.id);
        await blueprintToNoir(view.svg, { focus: { x: last[0], y: last[1] }, route });
        go('cinema', { script: job.replay?.success || [], next: { screen: 'debrief', params: { jobId: job.id, result } } }, { transition: 'none' });
      } else {
        S.wrongPlay(job.id, picked);
        await blueprintToNoir(view.svg, { focus: { x: last[0], y: last[1] }, route });
        go('cinema', { script: [captionPage(job.play.wrong?.[picked] || 'It all goes wrong, very fast.'), ...(job.replay?.failure || [])], next: { screen: 'planning', params: { jobId: job.id, play: true } } }, { transition: 'none' });
      }
    }
    function exitPlay() {
      mode = 'solve';
      picked = null;
      root.classList.remove('is-play');
      view.clearRoutes();
      view.pz.reset();
      playQ.hidden = true;
      term.hidden = false;
      task.hidden = false;
      playPanel.hidden = true;
    }

    /* ================================================================ */
    /* SANDBOX DESK                                                       */
    /* ================================================================ */
    function renderSandboxTask() {
      const examples = [
        ['All buildings', 'SELECT * FROM buildings;'],
        ...Object.values(conceptsMap).filter((c) => c.example).slice(0, 5).map((c) => [c.title, c.example]),
      ];
      fill(task, 
        h('div.pl-task__top', h('span.pl-task__wo', 'Practice · nothing is checked')),
        h('h2.pl-task__title', 'All the city data'),
        h('p.pl-task__prompt', `All the data in Port Vesper: ${cat.tables.length} tables. Nothing here is checked. Try any query you like.`),
        h('div.pl-task__chips.is-examples', examples.map(([t, sql]) => {
          const c = h('button.pl-chip', { type: 'button', title: sql }, h('span', '▸'), t);
          c.addEventListener('click', () => { editor.value = sql; editor.focus(); sfx('type'); });
          return c;
        })),
      );
    }

    /* ================================================================ */
    /* NAV + KEYS                                                         */
    /* ================================================================ */
    function leave() {
      sfx('click');
      if (sandbox) go('home'); else go('hub', { focusJob: job.id });
    }
    const onKey = (e) => {
      if (!alive()) return;
      if (modalOpen()) return;
      if (e.key === 'Escape') {
        if (records.close()) return;
        if (printout.open) { printout.hide(); return; }
        if (mode === 'play' && picked) { pick(picked); return; }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && document.activeElement !== editor.textarea) {
        e.preventDefault();
        runQuery();
      }
    };
    addEventListener('keydown', onKey);
    offs.push(() => removeEventListener('keydown', onKey));
    offs.push(() => { comms.destroy(); printout.destroy(); editor.destroy(); clearTimeout(draftTimer); S.save(); });

    /* ================================================================ */
    /* START                                                              */
    /* ================================================================ */
    ambience('blueprint');
    renderTabs();
    if (sandbox) {
      editor.value = S.sandbox().draft || '';
      stubFromHistory();
      renderSandboxTask();
      comms.say('juno', 'This is practice. You can read every table in the city. You cannot break anything.', { mood: 'smirk', kind: 'sys' });
      later(() => editor.focus(), 300);
      return;
    }
    renderIntel();
    const j = S.job(job.id);
    // the channel already has history: the crew's last words on what you've solved
    comms.history(job.puzzles.filter((p, i) => j.solved[i] && p.react).slice(-2).map((p) => ({ who: p.react.who, text: p.react.text })));
    const all = S.allQueriesSolved(job.id);
    const firstOpen = j.solved.findIndex((x) => !x);
    pi = params.puzzle != null ? +params.puzzle : firstOpen >= 0 ? firstOpen : 0;
    if (params.play || (all && params.puzzle == null)) {
      selectPuzzle(pi, { say: false });
      enterPlay();
    } else {
      selectPuzzle(pi);
    }
  },

  unmount() {
    if (!ctx) return;
    ctx.alive = false;
    ctx.offs.forEach((f) => { try { f(); } catch { /* ignore */ } });
    ctx.timers.forEach((t) => clearTimeout(t));
    ctx = null;
  },
};

