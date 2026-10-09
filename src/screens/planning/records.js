// Records drawer: a file drawer that slides out over the table's left edge. Tables are file
// tabs; the open file lists columns with types and PK/FK marks and a peek at the first rows.
// Clicking any name inserts it into the terminal.
import { h } from '../../core/dom.js';
import { sfx } from '../../core/audio.js';
import { iconButton } from '../../ui/index.js';
import { catalog, peek } from '../../sql/engine.js';
import { SCHEMA, RELATIONS } from '../../data/schema.js';

export function createRecords({ onInsert } = {}) {
  const cat = catalog();
  const meta = new Map((SCHEMA || []).map((t) => [t.name.toLowerCase(), t]));
  const tabs = h('nav.pl-rec__tabs');
  const file = h('div.pl-rec__file');
  const closeBtn = iconButton('close', { world: 'bp', title: 'Close (Esc)', className: 'pl-rec__close', onClick: () => close() });
  const panel = h('div.pl-rec__panel',
    h('header.pl-rec__head', h('span.pl-rec__kicker', 'Tables'), h('h3', 'City data'), closeBtn),
    h('p.pl-rec__tip', 'Click a name to add it to your query.'),
    tabs, file);
  const handle = h('button.pl-rec__handle', { type: 'button', title: 'Tables' }, h('span', 'Tables'), h('small', `${cat.tables.length} tables`));
  const el = h('div.pl-rec', handle, panel);
  handle.addEventListener('click', () => toggle());

  let active = null;
  cat.tables.forEach((t) => {
    const b = h('button.pl-rec__tab', { type: 'button', dataset: { t: t.name } }, t.name);
    b.addEventListener('click', () => { select(t.name); sfx('click'); });
    b.addEventListener('dblclick', () => onInsert?.(t.name));
    tabs.append(b);
  });

  function select(name) {
    active = name;
    [...tabs.children].forEach((b) => b.classList.toggle('is-on', b.dataset.t === name));
    const t = cat.tables.find((x) => x.name === name);
    if (!t) return;
    const m = meta.get(name.toLowerCase());
    const fks = new Map((RELATIONS || []).filter((r) => r.from === name).map((r) => [r.fromCol, `${r.to}.${r.toCol}`]));
    (m?.cols || []).filter((c) => c[2] === 'fk').forEach((c) => { if (!fks.has(c[0])) fks.set(c[0], String(c[1]).replace(/^→\s*/, '')); });
    const refs = (RELATIONS || []).filter((r) => r.to === name).map((r) => `${r.from}.${r.fromCol}`);
    const title = h('button.pl-rec__tname', { type: 'button', title: 'Add the table name to your query' }, t.name);
    title.addEventListener('click', () => onInsert?.(t.name));
    const cols = h('div.pl-rec__cols', t.columns.map((c) => {
      const type = (m?.cols || []).find((x) => x[0] === c.name)?.[1] || c.type || '';
      const fk = fks.get(c.name);
      const row = h('button.pl-rec__col', { type: 'button', title: 'Add the column name to your query' },
        h('i', { class: c.pk ? 'is-pk' : fk ? 'is-fk' : '' }, c.pk ? 'PK' : fk ? 'FK' : ''),
        h('b', c.name),
        h('small', fk && !/→/.test(type) ? `→ ${fk}` : type));
      row.addEventListener('click', () => onInsert?.(c.name));
      return row;
    }));
    const pk = peek(name, 5);
    const peekEl = pk.ok ? h('div.pl-rec__peek',
      h('span.pl-rec__lbl', `First ${pk.rows.length} of ${t.count} rows`),
      h('div.pl-rec__peekwrap', h('table', h('thead', h('tr', pk.columns.map((c) => h('th', c)))), h('tbody', pk.rows.map((r) => h('tr', r.map((v) => h('td', { class: v === null ? 'is-null' : '' }, v === null ? 'NULL' : String(v))))))))) : null;
    file.replaceChildren(...[
      h('div.pl-rec__filehead', title, h('span.pl-rec__count', `${t.count} rows`)),
      m?.blurb ? h('p.pl-rec__blurb', m.blurb) : null,
      cols,
      refs.length ? h('p.pl-rec__refs', 'Other tables link here: ', refs.join(', ')) : null,
      peekEl,
    ].filter(Boolean));
  }

  function open(name) {
    if (!active || name) select(name || cat.tables[0]?.name);
    if (!el.classList.contains('is-open')) sfx('whoosh');
    el.classList.add('is-open');
  }
  function close() {
    if (!el.classList.contains('is-open')) return false;
    el.classList.remove('is-open');
    return true;
  }
  function toggle() { if (el.classList.contains('is-open')) close(); else open(); }

  return { el, open, close, toggle, get isOpen() { return el.classList.contains('is-open'); } };
}
