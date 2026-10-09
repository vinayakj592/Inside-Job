// Context-aware SQL autocomplete: keywords, functions, tables, columns, aliases.
import { tokenize } from './highlight.js';
import { KEYWORDS, FUNCTIONS, KEYWORD_SET, PHRASES } from './lexicon.js';

/** Scan the whole query for table references, aliases, CTE names and column aliases. */
export function scanQuery(text) {
  const toks = tokenize(text).filter((t) => t.type !== 'ws' && t.type !== 'comment');
  const aliases = new Map(); // alias(lower) → table name
  const used = new Set();    // tables referenced (lower)
  const ctes = new Set();
  const colAliases = new Set();
  const word = (t) => t && (t.type === 'ident' || t.type === 'ident-q' || t.type === 'keyword' || t.type === 'function') ? t.text.replace(/^["`[]|["`\]]$/g, '') : null;
  for (let i = 0; i < toks.length; i++) {
    const t = toks[i];
    const U = t.text.toUpperCase();
    if ((U === 'FROM' || U === 'JOIN') || (t.text === ',' && lastClause(toks, i) === 'FROM')) {
      const nameTok = toks[i + 1];
      if (!nameTok || (nameTok.type !== 'ident' && nameTok.type !== 'ident-q')) continue;
      const name = word(nameTok);
      used.add(name.toLowerCase());
      let j = i + 2;
      if (toks[j] && toks[j].text.toUpperCase() === 'AS') j++;
      const a = toks[j];
      if (a && (a.type === 'ident' || a.type === 'ident-q') && !KEYWORD_SET.has(a.text.toUpperCase())) aliases.set(word(a).toLowerCase(), name);
    }
    if (U === 'AS' && toks[i + 1]?.text === '(' && toks[i - 1]?.type === 'ident') ctes.add(toks[i - 1].text);
    if (U === 'AS' && toks[i + 1] && toks[i + 1].type === 'ident' && toks[i + 2]?.text !== '(') {
      if (lastClause(toks, i) === 'SELECT') colAliases.add(toks[i + 1].text);
    }
  }
  return { aliases, used, ctes, colAliases };
}

function lastClause(toks, i) {
  let depth = 0;
  for (let k = i - 1; k >= 0; k--) {
    const x = toks[k].text;
    if (x === ')') depth++;
    else if (x === '(') { if (depth === 0) return null; depth--; }
    else if (depth === 0 && toks[k].type === 'keyword') {
      const U = x.toUpperCase();
      if (['SELECT', 'FROM', 'WHERE', 'GROUP', 'ORDER', 'HAVING', 'ON', 'JOIN', 'LIMIT', 'SET'].includes(U)) return U;
    }
  }
  return null;
}

const matchCase = (label, prefix) => (prefix && prefix === prefix.toLowerCase() && /[a-z]/.test(prefix) ? label.toLowerCase() : label);

/**
 * suggest(text, caret, catalog, { force }) → null | { from, to, items: [{ label, kind, insert, caretBack?, detail? }] }
 */
export function suggest(text, caret, cat, { force = false } = {}) {
  const before = text.slice(0, caret);
  // no suggestions inside strings or comments
  const tail = tokenize(before).pop();
  if (tail?.type === 'comment' && !(tail.text.startsWith('/*') && tail.text.endsWith('*/') && tail.text.length > 3)) return null;
  if (tail?.type === 'string' && (tail.text.length < 2 || !tail.text.endsWith("'"))) return null;
  if (tail?.type === 'ident-q' && tail.text.length < 2) return null;
  const m = before.match(/(?:([A-Za-z_][\w$]*)\.)?([A-Za-z_][\w$]*)?$/);
  const qual = m?.[1] || null;
  const prefix = m?.[2] || '';
  if (!qual && !prefix && !force) return null;
  if (!qual && prefix && /\d/.test(before[before.length - prefix.length - 1] || '')) return null;
  const from = caret - prefix.length;
  // extend replacement over the rest of the word under the caret
  let to = caret;
  while (to < text.length && /[\w$]/.test(text[to])) to++;

  const scan = scanQuery(text);
  const tables = cat?.tables || [];
  const colsOf = (name) => cat?.columnsByTable?.get(String(name).toLowerCase()) || [];
  const lower = prefix.toLowerCase();
  const pick = (label) => label.toLowerCase().startsWith(lower) && label.toLowerCase() !== lower;
  const items = [];
  const seen = new Set();
  let exact = false;
  const add = (label, kind, extra = {}) => {
    if (label.toLowerCase() === lower) exact = true;
    const key = kind + ':' + label.toLowerCase();
    if (seen.has(key) || !pick(label)) return;
    seen.add(key);
    items.push({ label, kind, insert: label, ...extra });
  };

  if (qual) {
    const table = scan.aliases.get(qual.toLowerCase()) || tables.find((t) => t.name.toLowerCase() === qual.toLowerCase())?.name;
    if (!table) return null;
    for (const c of colsOf(table)) add(c, 'col', { detail: table });
    if (!items.length || (exact && !force)) return null;
    return { from, to, items: items.slice(0, 40) };
  }

  // context: the last keyword before the word
  const toks = tokenize(before.slice(0, from)).filter((t) => t.type !== 'ws' && t.type !== 'comment');
  const prev = toks[toks.length - 1];
  const prevU = prev?.text.toUpperCase();
  const clause = lastClause(toks, toks.length);
  const wantTable = prevU === 'FROM' || prevU === 'JOIN' || (prev?.text === ',' && clause === 'FROM');

  const usedCols = [];
  for (const t of scan.used) for (const c of colsOf(t)) usedCols.push([c, t]);

  if (wantTable) {
    for (const t of tables) add(t.name, 'table', { detail: `${t.count} rows` });
    for (const c of scan.ctes) add(c, 'table', { detail: 'CTE' });
  } else {
    for (const [c, t] of usedCols) add(c, 'col', { detail: t });
    for (const a of scan.aliases.keys()) add(a, 'alias', { detail: scan.aliases.get(a) });
    for (const a of scan.colAliases) add(a, 'alias', { detail: 'alias' });
    for (const f of FUNCTIONS) add(matchCase(f, prefix), 'fn', { insert: matchCase(f, prefix) + '()', caretBack: 1 });
    for (const p of PHRASES) add(matchCase(p, prefix), 'kw');
    for (const k of KEYWORDS) add(matchCase(k, prefix), 'kw');
    for (const t of tables) add(t.name, 'table', { detail: `${t.count} rows` });
    for (const c of scan.ctes) add(c, 'table', { detail: 'CTE' });
    // columns from any table, last resort
    for (const t of tables) for (const c of t.columns) add(c.name, 'col', { detail: t.name });
  }
  // the word is already complete (e.g. `staff`): don't hijack Enter with `staff_id`
  if (!items.length || (exact && !force)) return null;
  return { from, to, items: items.slice(0, 40) };
}
