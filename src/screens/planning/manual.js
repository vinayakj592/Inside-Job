// Field manual: vellum taped over the drawing. Index of concepts on the left; the open entry
// has a summary, a gotcha in grease pencil, and a live example you can edit and run.
import { h } from '../../core/dom.js';
import { sfx } from '../../core/audio.js';
import { button, openModal } from '../../ui/index.js';
import * as C from '../../data/concepts.js';
import { run } from '../../sql/engine.js';
import { createEditor } from '../../sql/editor.js';
import { explainError } from '../../sql/diagnose.js';
import { catalog } from '../../sql/engine.js';

const rich = (text) => String(text || '').split('`').map((part, i) => (i % 2 ? h('code', part) : part));

export function openManual(key, { onUse } = {}) {
  const CONCEPTS = C.CONCEPTS || {};
  const order = (C.CONCEPT_ORDER && C.CONCEPT_ORDER.length ? C.CONCEPT_ORDER : Object.keys(CONCEPTS)).filter((k) => CONCEPTS[k]);
  const index = h('nav.pl-man__index');
  const page = h('article.pl-man__page');
  const wrap = h('div.pl-man', index, page);
  let editor = null;

  order.forEach((k, i) => {
    const b = h('button.pl-man__entry', { type: 'button', dataset: { k } }, h('span', String(i + 1).padStart(2, '0')), CONCEPTS[k].title || k);
    b.addEventListener('click', () => { show(k); sfx('click'); });
    index.append(b);
  });

  function show(k) {
    const c = CONCEPTS[k];
    if (!c) return;
    [...index.children].forEach((b) => b.classList.toggle('is-on', b.dataset.k === k));
    const out = h('div.pl-man__out');
    editor = createEditor({ value: c.example || '', onRun: () => exec() });
    const exec = () => {
      const r = run(editor.value, { maxRows: 50 });
      sfx(r.ok ? 'run' : 'err');
      if (!r.ok) {
        const ex = explainError(r.error, editor.value, catalog());
        editor.markError(ex.token);
        out.replaceChildren(h('p.pl-man__err', h('b', ex.title), ' ', ex.detail));
        return;
      }
      out.replaceChildren(
        h('span.pl-man__meta', `${r.rows.length} row${r.rows.length === 1 ? '' : 's'}`),
        h('div.pl-man__tablewrap', h('table', h('thead', h('tr', r.columns.map((x) => h('th', x)))),
          h('tbody', r.rows.slice(0, 50).map((row) => h('tr', row.map((v) => h('td', { class: v === null ? 'is-null' : '' }, v === null ? 'NULL' : String(v))))))))
      );
    };
    page.replaceChildren(...[
      h('span.pl-man__kicker', 'SQL guide · ' + (order.indexOf(k) + 1)),
      h('h3.pl-man__title', c.title || k),
      h('p.pl-man__sum', rich(c.summary)),
      c.gotcha ? h('p.pl-man__gotcha', h('b', 'Be careful:'), ' ', rich(c.gotcha)) : null,
      c.syntax ? h('pre.pl-man__syntax', c.syntax) : null,
      h('div.pl-man__try',
        h('span.pl-man__lbl', 'Try it here'),
        editor.el,
        h('div.pl-man__actions',
          button('Run', { variant: 'grease', size: 'sm', icon: 'play', onClick: exec }),
          onUse ? button('Use this query', { variant: 'bp', size: 'sm', onClick: () => { onUse(editor.value); m.close(); } }) : null,
          h('small', 'Ctrl + Enter'))),
      out,
    ].filter(Boolean));
    exec();
  }

  const m = openModal({ world: 'vellum', title: 'SQL <em>guide</em>', className: 'pl-man-modal', body: wrap });
  show(key && CONCEPTS[key] ? key : order[0]);
  return m;
}
