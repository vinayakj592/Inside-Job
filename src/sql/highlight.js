// SQL tokenizer + highlighter. Output HTML uses .tk-* classes styled by the planning screen.
import { escapeHtml } from '../core/dom.js';
import { KEYWORD_SET, FUNCTION_SET } from './lexicon.js';

/**
 * tokenize(sql) → [{ type, text, start, end }]
 * types: ws, comment, string, ident-q (quoted identifier), number, keyword, function, ident, op, punct, other
 */
export function tokenize(sql) {
  const out = [];
  let i = 0;
  const n = sql.length;
  const push = (type, start, end) => out.push({ type, text: sql.slice(start, end), start, end });
  while (i < n) {
    const c = sql[i];
    const d = sql[i + 1];
    const s = i;
    if (/\s/.test(c)) {
      while (i < n && /\s/.test(sql[i])) i++;
      push('ws', s, i);
    } else if (c === '-' && d === '-') {
      while (i < n && sql[i] !== '\n') i++;
      push('comment', s, i);
    } else if (c === '/' && d === '*') {
      const j = sql.indexOf('*/', i + 2);
      i = j < 0 ? n : j + 2;
      push('comment', s, i);
    } else if (c === "'") {
      i++;
      while (i < n) {
        if (sql[i] === "'" && sql[i + 1] === "'") { i += 2; continue; }
        if (sql[i] === "'") { i++; break; }
        i++;
      }
      push('string', s, i);
    } else if (c === '"' || c === '`' || c === '[') {
      const close = c === '[' ? ']' : c;
      i++;
      while (i < n && sql[i] !== close) i++;
      i = Math.min(n, i + 1);
      push('ident-q', s, i);
    } else if (/[0-9]/.test(c) || (c === '.' && /[0-9]/.test(d || ''))) {
      while (i < n && /[0-9.eE]/.test(sql[i])) {
        if ((sql[i] === 'e' || sql[i] === 'E') && /[+-]/.test(sql[i + 1] || '')) i++;
        i++;
      }
      push('number', s, i);
    } else if (/[A-Za-z_]/.test(c)) {
      while (i < n && /[A-Za-z0-9_$]/.test(sql[i])) i++;
      const word = sql.slice(s, i);
      const up = word.toUpperCase();
      let j = i;
      while (j < n && sql[j] === ' ') j++;
      const isCall = sql[j] === '(';
      let type = 'ident';
      if (FUNCTION_SET.has(up) && isCall) type = 'function';
      else if (KEYWORD_SET.has(up)) type = 'keyword';
      else if (FUNCTION_SET.has(up)) type = 'function';
      push(type, s, i);
    } else if (/[=<>!|+\-*/%]/.test(c)) {
      while (i < n && /[=<>!|]/.test(sql[i]) && i - s < 2) i++;
      if (i === s) i++;
      push('op', s, i);
    } else if (/[(),;.]/.test(c)) {
      i++;
      push('punct', s, i);
    } else {
      i++;
      push('other', s, i);
    }
  }
  return out;
}

/**
 * highlight(sql, { tables?: Set<lowercase>, errorAt?: [start, end] }) → HTML string
 */
export function highlight(sql, { tables, errorAt } = {}) {
  let html = '';
  for (const t of tokenize(sql)) {
    let cls = t.type;
    if (t.type === 'ident' && tables?.has(t.text.toLowerCase())) cls = 'table';
    let text = escapeHtml(t.text);
    if (errorAt && t.start < errorAt[1] && t.end > errorAt[0] && t.type !== 'ws') {
      html += `<span class="tk-${cls} tk-err">${text}</span>`;
    } else if (t.type === 'ws') {
      html += text;
    } else {
      html += `<span class="tk-${cls}">${text}</span>`;
    }
  }
  return html;
}
