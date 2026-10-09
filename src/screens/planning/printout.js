// Results as a continuous-feed dot-matrix printout that slides out from under the terminal
// onto the table. Mismatches get struck through / circled in red pencil with notes;
// a correct result gets a big tick. "Show expected" feeds a reference sheet beside it.
import { h, reducedMotion } from '../../core/dom.js';
import { sfx } from '../../core/audio.js';
import { button, iconButton } from '../../ui/index.js';
import { norm } from '../../sql/compare.js';
import { rng, scribbleLoop, shakyPath } from './svg.js';

const MAX_ROWS = 200;
let queryNo = 40 + Math.floor(Math.random() * 30);

export function createPrintout({ onClose } = {}) {
  const sheets = h('div.pl-print__sheets');
  const expBtn = button('Show correct result', { variant: 'bp', size: 'sm', className: 'pl-print__exp', onClick: () => toggleExpected() });
  const tearBtn = iconButton('close', { world: 'bp', title: 'Close (Esc)', className: 'pl-print__tear', onClick: () => hide() });
  const handle = h('button.pl-print__handle', { type: 'button', title: 'Show the result again' }, h('span', 'Result'));
  const ctl = h('div.pl-print__ctl', expBtn, tearBtn);
  const el = h('div.pl-print', { hidden: true }, handle, ctl, sheets);
  handle.addEventListener('click', () => untuck());

  let last = null;
  let showingExpected = false;
  let printTimer = null;

  function show(data) {
    last = data;
    showingExpected = false;
    el.hidden = false;
    el.classList.remove('is-tucked', 'has-expected', 'is-in');
    sheets.replaceChildren(mainSheet(data));
    const cols = data.result?.columns.length || 2;
    el.style.setProperty('--cols', Math.max(3, Math.min(10, cols)));
    const canExpect = !!data.verdict && !data.verdict.ok && data.verdict.expected?.ok;
    expBtn.hidden = !canExpect;
    expBtn.querySelector('span').textContent = 'Show correct result';
    void el.offsetWidth;
    el.classList.add('is-in');
    printSound(Math.min(24, (data.result?.rows.length || 3) + 4));
    setTimeout(() => drawMarks(sheets.querySelector('.pl-sheet--main'), data), 60);
  }

  function printSound(lines) {
    clearInterval(printTimer);
    if (reducedMotion()) return;
    let n = 0;
    printTimer = setInterval(() => { sfx('type'); if (++n > lines * 1.4) clearInterval(printTimer); }, 34);
  }

  function toggleExpected() {
    if (!last?.verdict?.expected) return;
    showingExpected = !showingExpected;
    el.classList.toggle('has-expected', showingExpected);
    expBtn.querySelector('span').textContent = showingExpected ? 'Hide correct result' : 'Show correct result';
    const ref = sheets.querySelector('.pl-sheet--ref');
    if (showingExpected && !ref) {
      const r = refSheet(last);
      sheets.prepend(r);
      printSound(Math.min(20, last.verdict.expected.rows.length + 3));
      setTimeout(() => drawRefMarks(r, last), 60);
    } else if (!showingExpected && ref) ref.remove();
  }

  function hide() {
    if (el.hidden) return false;
    clearInterval(printTimer);
    el.classList.remove('is-in');
    el.classList.add('is-out');
    setTimeout(() => { el.hidden = true; el.classList.remove('is-out', 'is-tucked'); onClose?.(); }, 260);
    return true;
  }
  function tuck() { if (!el.hidden) el.classList.add('is-tucked'); }
  function untuck() { el.classList.remove('is-tucked'); sfx('whoosh'); }

  return {
    el, show, hide, tuck, untuck,
    get open() { return !el.hidden && !el.classList.contains('is-tucked'); },
    destroy() { clearInterval(printTimer); },
  };
}

/* ------------------------------------------------------------------ */
function stamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

function tableFor(columns, rows, marks) {
  const tbl = h('table.pl-dm');
  const head = h('tr', columns.map((c) => h('th', String(c))));
  tbl.append(h('thead', head));
  const body = h('tbody');
  rows.slice(0, MAX_ROWS).forEach((r, i) => {
    const tr = h('tr', { style: { '--i': Math.min(i, 30) } }, r.map((v) => h('td', { class: v === null ? 'is-null' : typeof v === 'number' ? 'is-num' : '' }, v === null ? 'NULL' : String(v))));
    if (marks?.[i] && marks[i] !== 'ok') tr.classList.add('is-' + marks[i]);
    body.append(tr);
  });
  tbl.append(body);
  return tbl;
}

function mainSheet(data) {
  const { result, verdict, error, explain, sandbox } = data;
  queryNo++;
  const sheet = h('article.pl-sheet.pl-sheet--main');
  const headLines = [
    'PORT VESPER CITY RECORDS',
    `QUERY #${String(queryNo).padStart(4, '0')}   ${stamp()}   TERM 07`,
  ];
  const head = h('header.pl-sheet__head', h('pre', headLines.join('\n')));
  sheet.append(head);
  const body = h('div.pl-sheet__body');
  sheet.append(body);

  if (error) {
    body.append(h('pre.pl-dm-err', `*** QUERY ERROR ***\n${error}`));
    const notes = h('div.pl-pencil.is-red',
      h('b.pl-pencil__head', explain?.title || 'Error.'),
      explain?.detail ? h('p', explain.detail) : null);
    sheet.insertBefore(notes, body);
    sheet.classList.add('is-error');
    return sheet;
  }

  const cols = result.columns.length;
  const n = result.rows.length;
  body.append(h('pre.pl-dm-meta', `${n} ROW${n === 1 ? '' : 'S'} · ${cols} COL${cols === 1 ? '' : 'S'} · ${result.ms.toFixed(1)}MS${result.statements > 1 ? ` · LAST OF ${result.statements} QUERIES` : ''}${result.truncated ? ' · NOT ALL ROWS SHOWN' : ''}`));
  if (n === 0) body.append(h('pre.pl-dm-empty', cols ? `${result.columns.join('  ')}\n\n   — NO ROWS MATCH —` : '   — NO ROWS —'));
  else body.append(tableFor(result.columns, result.rows, verdict?.cmp?.marks));
  if (n > MAX_ROWS) body.append(h('pre.pl-dm-more', `… ${n - MAX_ROWS} MORE ROWS NOT SHOWN`));
  body.append(h('pre.pl-dm-end', '— END —'));

  if (verdict) {
    if (verdict.ok) {
      sheet.classList.add('is-ok');
      sheet.insertBefore(h('div.pl-pencil.is-ok', h('b.pl-pencil__head', 'Correct.'), h('p', data.okLine || 'That is right.')), body);
    } else {
      sheet.classList.add('is-bad');
      const c = verdict.cmp;
      const notes = h('div.pl-pencil.is-red', h('b.pl-pencil__head', verdict.headline));
      verdict.notes.forEach((t) => notes.append(h('p', t)));
      if (c && !c.colMismatch && c.missing.length && !c.orderOnly) {
        const miss = h('div.pl-missing', h('span.pl-missing__lbl', `missing rows (${c.missing.length}):`));
        c.missing.slice(0, 3).forEach((r) => miss.append(h('code', r.map((v) => (v === null ? 'NULL' : String(v))).join(' · '))));
        if (c.missing.length > 3) miss.append(h('code', `+ ${c.missing.length - 3} more`));
        notes.append(miss);
      }
      sheet.insertBefore(notes, body);
    }
  } else if (sandbox) {
    sheet.classList.add('is-free');
  }
  return sheet;
}

function refSheet(data) {
  const exp = data.verdict.expected;
  const sheet = h('article.pl-sheet.pl-sheet--ref');
  sheet.append(h('header.pl-sheet__head', h('pre', `CORRECT RESULT\nWHAT THE TASK NEEDS${data.orderMatters ? '  (IN THIS ORDER)' : ''}`)));
  const body = h('div.pl-sheet__body');
  body.append(h('pre.pl-dm-meta', `${exp.rows.length} ROW${exp.rows.length === 1 ? '' : 'S'} · ${exp.columns.length} COL${exp.columns.length === 1 ? '' : 'S'}`));
  const missingKeys = new Map();
  (data.verdict.cmp?.missing || []).forEach((r) => { const k = r.map(norm).join('|'); missingKeys.set(k, (missingKeys.get(k) || 0) + 1); });
  const marks = exp.rows.map((r) => {
    const k = r.map(norm).join('|');
    const c = missingKeys.get(k) || 0;
    if (c > 0) { missingKeys.set(k, c - 1); return 'missing'; }
    return 'ok';
  });
  body.append(tableFor(exp.columns.map((_, i) => `col ${i + 1}`), exp.rows, marks));
  body.append(h('pre.pl-dm-end', '— END —'));
  sheet.append(body);
  return sheet;
}

/* ------------------------------------------------------------------ */
/* pencil marks drawn over the rows                                     */
/* ------------------------------------------------------------------ */
const NS = 'http://www.w3.org/2000/svg';
function overlay(sheet) {
  const body = sheet.querySelector('.pl-sheet__body');
  let svg = body.querySelector('svg.pl-marks');
  if (!svg) {
    svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'pl-marks');
    body.append(svg);
  }
  svg.setAttribute('width', body.scrollWidth);
  svg.setAttribute('height', body.scrollHeight);
  return { svg, body };
}
function mark(svg, cls, d, delay) {
  const p = document.createElementNS(NS, 'path');
  p.setAttribute('d', d);
  p.setAttribute('class', cls);
  p.setAttribute('pathLength', '1');
  p.style.setProperty('--d', delay + 'ms');
  svg.append(p);
  return p;
}

function drawMarks(sheet, data) {
  if (!sheet?.isConnected) return;
  const v = data.verdict;
  const { svg, body } = overlay(sheet);
  const base = body.getBoundingClientRect();
  const rows = [...sheet.querySelectorAll('tbody tr')];
  const r = rng(Date.now());
  const printDelay = Math.min(30, rows.length) * 28 + 200;
  if (v?.ok) {
    const tbl = sheet.querySelector('table, .pl-dm-empty');
    if (tbl) {
      const b = tbl.getBoundingClientRect();
      const x = b.right - base.left + 18, y = b.top - base.top + 10;
      mark(svg, 'pl-mk pl-mk--ok', `M${x},${y + 26} L${x + 12},${y + 42} L${x + 44},${y - 4}`, printDelay);
    }
    return;
  }
  if (!v?.cmp) return;
  rows.forEach((tr, i) => {
    const b = tr.getBoundingClientRect();
    const y = b.top - base.top + b.height / 2;
    const x0 = b.left - base.left - 4, x1 = b.right - base.left + 4;
    if (tr.classList.contains('is-extra')) {
      mark(svg, 'pl-mk pl-mk--red', shakyPath([[x0, y + 1], [(x0 + x1) / 2, y - 1], [x1, y + 2]], i + 1, 1.2), printDelay + i * 30);
    } else if (tr.classList.contains('is-moved')) {
      mark(svg, 'pl-mk pl-mk--red is-thin', scribbleLoop((x0 + x1) / 2, y, (x1 - x0) / 2 + 6, b.height / 2 + 5, i + 9, 1.05), printDelay + i * 30);
    }
  });
  if (v.cmp.colMismatch) {
    const th = sheet.querySelector('thead tr');
    if (th) {
      const b = th.getBoundingClientRect();
      const y = b.top - base.top + b.height / 2;
      mark(svg, 'pl-mk pl-mk--red', scribbleLoop((b.left + b.right) / 2 - base.left, y, b.width / 2 + 12, b.height / 2 + 8, 4, 1.1), printDelay);
    }
  }
  void r;
}

function drawRefMarks(sheet) {
  if (!sheet?.isConnected) return;
  const { svg, body } = overlay(sheet);
  const base = body.getBoundingClientRect();
  [...sheet.querySelectorAll('tbody tr.is-missing')].forEach((tr, i) => {
    const b = tr.getBoundingClientRect();
    const y = b.top - base.top + b.height / 2;
    const x0 = b.left - base.left - 4, x1 = b.right - base.left + 4;
    mark(svg, 'pl-mk pl-mk--red is-thin', scribbleLoop((x0 + x1) / 2, y, (x1 - x0) / 2 + 6, b.height / 2 + 5, i + 21, 1.05), 300 + i * 40);
  });
}

