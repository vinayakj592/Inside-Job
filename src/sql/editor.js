// SQL editor: a textarea over a highlighted <pre>, with a line gutter, indent handling,
// Ctrl/Cmd+Enter to run, and autocomplete. Styled by the host (classes .sqled*, .tk-*).
import { h } from '../core/dom.js';
import { sfx } from '../core/audio.js';
import { highlight } from './highlight.js';
import { suggest } from './autocomplete.js';
import { catalog } from './engine.js';

const INDENT = '  ';

function insertText(ta, text) {
  ta.focus();
  // execCommand keeps the native undo stack intact
  const ok = document.execCommand && document.execCommand('insertText', false, text);
  if (!ok) {
    ta.setRangeText(text, ta.selectionStart, ta.selectionEnd, 'end');
    ta.dispatchEvent(new Event('input', { bubbles: true }));
  }
}

/**
 * createEditor({ value, placeholder, onChange(value), onRun(), getCatalog? })
 * → { el, value (get/set), focus(), insert(text), selectedText(), markError(token), clearError(), destroy() }
 */
export function createEditor({ value = '', placeholder = '', onChange, onRun, getCatalog = catalog, className = '' } = {}) {
  const gutter = h('div.sqled__gutter', { 'aria-hidden': 'true' });
  const pre = h('pre.sqled__hl', { 'aria-hidden': 'true' });
  const ta = h('textarea.sqled__ta', { spellcheck: 'false', autocapitalize: 'off', autocomplete: 'off', autocorrect: 'off', wrap: 'off', 'aria-label': 'SQL editor' });
  const measure = h('span.sqled__measure', { 'aria-hidden': 'true' }, 'MMMMMMMMMM');
  const ac = h('div.sqled__ac', { hidden: true, role: 'listbox' });
  const scroller = h('div.sqled__scroll', pre, ta, measure);
  const el = h(`div.sqled${className ? '.' + className : ''}`, gutter, scroller, ac);
  ta.value = value;

  let errorAt = null;
  let acState = null; // { from, to, items, index }
  let lastInputType = '';
  let tablesLower = new Set();
  let cw = 0, lh = 0;

  const refreshTables = () => {
    const cat = getCatalog();
    tablesLower = new Set((cat?.tables || []).map((t) => t.name.toLowerCase()));
  };

  function render() {
    const v = ta.value;
    if (!tablesLower.size) refreshTables();
    pre.innerHTML = v ? highlight(v, { tables: tablesLower, errorAt }) + '\n' : `<span class="sqled__ph">${placeholder.replace(/[<&]/g, (c) => (c === '<' ? '&lt;' : '&amp;'))}</span>\n`;
    const lines = v.split('\n').length;
    if (gutter.childElementCount !== lines) {
      gutter.replaceChildren(...Array.from({ length: lines }, (_, i) => h('span', String(i + 1).padStart(2, '0'))));
    }
    syncScroll();
  }
  function syncScroll() {
    pre.style.transform = `translate(${-ta.scrollLeft}px, ${-ta.scrollTop}px)`;
    gutter.style.transform = `translateY(${-ta.scrollTop}px)`;
    if (acState) placeAc();
  }
  function metrics() {
    if (!cw) {
      const r = measure.getBoundingClientRect();
      cw = r.width / 10 || 8.4;
      lh = parseFloat(getComputedStyle(ta).lineHeight) || 21;
    }
  }

  /* ---------------- autocomplete ---------------- */
  function openAc(force = false) {
    const res = suggest(ta.value, ta.selectionStart, getCatalog(), { force });
    if (!res || ta.selectionStart !== ta.selectionEnd) return closeAc();
    acState = { ...res, index: 0 };
    ac.replaceChildren(...res.items.slice(0, 8).map((it, i) => {
      const row = h('div.sqled__opt', { role: 'option', dataset: { i, kind: it.kind } },
        h('i', { class: 'k-' + it.kind }, { kw: 'kw', fn: 'fn', table: 'tbl', col: 'col', alias: 'as' }[it.kind]),
        h('b', it.label), it.detail ? h('small', it.detail) : null);
      row.addEventListener('pointerdown', (e) => { e.preventDefault(); acState.index = i; accept(); });
      return row;
    }));
    ac.hidden = false;
    paintAc();
    placeAc();
  }
  function closeAc() {
    acState = null;
    ac.hidden = true;
  }
  function paintAc() {
    [...ac.children].forEach((c, i) => c.classList.toggle('is-on', i === acState?.index));
  }
  function placeAc() {
    if (!acState) return;
    metrics();
    const before = ta.value.slice(0, acState.from);
    const line = before.split('\n').length - 1;
    const col = before.length - before.lastIndexOf('\n') - 1;
    const cs = getComputedStyle(ta);
    const x = parseFloat(cs.paddingLeft) + col * cw - ta.scrollLeft + gutter.offsetWidth;
    const y = parseFloat(cs.paddingTop) + (line + 1) * lh - ta.scrollTop + 4;
    const maxX = el.clientWidth - 280;
    ac.style.left = Math.max(0, Math.min(maxX, x - 6)) + 'px';
    // flip above the line when there is no room below
    const below = el.clientHeight - y;
    if (below < 150 && y > 160) { ac.style.top = ''; ac.style.bottom = (el.clientHeight - y + lh + 8) + 'px'; }
    else { ac.style.bottom = ''; ac.style.top = y + 'px'; }
  }
  function accept() {
    if (!acState) return false;
    const it = acState.items[acState.index];
    ta.setSelectionRange(acState.from, acState.to);
    closeAc();
    insertText(ta, it.insert);
    if (it.caretBack) { const p = ta.selectionStart - it.caretBack; ta.setSelectionRange(p, p); }
    sfx('type');
    return true;
  }

  /* ---------------- keys ---------------- */
  function lineBounds(v, a, b) {
    const start = v.lastIndexOf('\n', a - 1) + 1;
    let end = v.indexOf('\n', b > a && v[b - 1] === '\n' ? b - 1 : b);
    if (end < 0) end = v.length;
    return [start, end];
  }
  function indentLines(dedent) {
    const v = ta.value;
    const a = ta.selectionStart, b = ta.selectionEnd;
    const [s, e] = lineBounds(v, a, b);
    const lines = v.slice(s, e).split('\n');
    const out = lines.map((l) => (dedent ? l.replace(/^ {1,2}/, '') : INDENT + l)).join('\n');
    ta.setSelectionRange(s, e);
    insertText(ta, out);
    ta.setSelectionRange(s, s + out.length);
  }
  function toggleComment() {
    const v = ta.value;
    const [s, e] = lineBounds(v, ta.selectionStart, ta.selectionEnd);
    const lines = v.slice(s, e).split('\n');
    const all = lines.every((l) => /^\s*--/.test(l) || !l.trim());
    const out = lines.map((l) => (all ? l.replace(/^(\s*)-- ?/, '$1') : l.trim() ? '-- ' + l : l)).join('\n');
    ta.setSelectionRange(s, e);
    insertText(ta, out);
    ta.setSelectionRange(s, s + out.length);
  }

  ta.addEventListener('keydown', (e) => {
    const mod = e.ctrlKey || e.metaKey;
    if (acState) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const n = Math.min(8, acState.items.length);
        acState.index = (acState.index + (e.key === 'ArrowDown' ? 1 : -1) + n) % n;
        paintAc();
        return;
      }
      if ((e.key === 'Enter' && !mod) || e.key === 'Tab') { e.preventDefault(); accept(); return; }
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); closeAc(); return; }
    }
    if (mod && e.key === 'Enter') { e.preventDefault(); closeAc(); onRun?.(); return; }
    if (mod && (e.key === ' ' || e.code === 'Space')) { e.preventDefault(); openAc(true); return; }
    if (mod && e.key === '/') { e.preventDefault(); toggleComment(); return; }
    if (e.key === 'Tab') {
      e.preventDefault();
      if (e.shiftKey || ta.value.slice(ta.selectionStart, ta.selectionEnd).includes('\n')) indentLines(e.shiftKey);
      else insertText(ta, INDENT);
      return;
    }
    if (e.key === 'Enter' && !mod && !e.shiftKey) {
      e.preventDefault();
      const v = ta.value;
      const ls = v.lastIndexOf('\n', ta.selectionStart - 1) + 1;
      const indent = (v.slice(ls).match(/^ */) || [''])[0];
      const extra = /\(\s*$/.test(v.slice(ls, ta.selectionStart)) ? INDENT : '';
      insertText(ta, '\n' + indent + extra);
      return;
    }
    if (e.key === 'Backspace' && ta.selectionStart === ta.selectionEnd) {
      const v = ta.value, p = ta.selectionStart;
      const ls = v.lastIndexOf('\n', p - 1) + 1;
      const head = v.slice(ls, p);
      if (head.length >= 2 && /^ +$/.test(head) && head.length % 2 === 0) {
        e.preventDefault();
        ta.setSelectionRange(p - 2, p);
        insertText(ta, '');
      }
    }
  });
  ta.addEventListener('beforeinput', (e) => { lastInputType = e.inputType || ''; });
  ta.addEventListener('input', () => {
    if (errorAt) errorAt = null;
    render();
    onChange?.(ta.value);
    const typed = lastInputType === 'insertText' || lastInputType === 'deleteContentBackward';
    lastInputType = '';
    if (typed) {
      const ch = ta.value[ta.selectionStart - 1];
      if (ch && /[\w.]/.test(ch)) openAc();
      else closeAc();
    }
  });
  ta.addEventListener('scroll', syncScroll);
  ta.addEventListener('blur', () => setTimeout(closeAc, 120));
  ta.addEventListener('click', closeAc);
  el.addEventListener('pointerdown', (e) => { if (e.target === el || e.target === gutter) { e.preventDefault(); ta.focus(); } });

  render();

  return {
    el,
    textarea: ta,
    get value() { return ta.value; },
    set value(v) { ta.value = v ?? ''; errorAt = null; closeAc(); render(); onChange?.(ta.value); },
    focus() { ta.focus(); },
    /** Insert text at the caret (with sensible spacing). */
    insert(text) {
      const v = ta.value, p = ta.selectionStart;
      const pre = p > 0 && /[\w)]/.test(v[p - 1]) ? ' ' : '';
      insertText(ta, pre + text);
    },
    selectedText() { return ta.value.slice(ta.selectionStart, ta.selectionEnd); },
    markError(token) {
      if (!token) return;
      const v = ta.value;
      const esc = String(token).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const m = new RegExp(/^\w/.test(token) ? `\\b${esc}` : esc, 'i').exec(v);
      if (!m) return;
      errorAt = [m.index, m.index + m[0].length];
      render();
    },
    clearError() { errorAt = null; render(); },
    refresh() { refreshTables(); cw = 0; render(); },
    destroy() { closeAc(); },
  };
}
