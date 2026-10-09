// Feedback heuristics: turn a failed comparison or a SQLite error into short, useful notes
// (they are scrawled in pencil on the printout, so keep every line terse).
import { maskSql } from './engine.js';

const has = (m, rx) => rx.test(m);
const up = (sql) => maskSql(sql).replace(/\s+/g, ' ').toUpperCase();

/**
 * diagnose({ sql, refSql, cmp, orderMatters }) → { headline, notes: string[] }
 */
export function diagnose({ sql, refSql, cmp, orderMatters }) {
  const m = up(sql);
  const r = up(refSql || '');
  const notes = [];
  let headline = 'Not quite.';

  if (cmp.colMismatch) {
    headline = `Wrong shape: ${cmp.playerCols} column${cmp.playerCols === 1 ? '' : 's'}, they want ${cmp.expectedCols}.`;
    if (/SELECT\s+(DISTINCT\s+)?\*/.test(m) && !/SELECT\s+(DISTINCT\s+)?\*/.test(r)) notes.push('SELECT * brings every column. Name only the ones the task asks for.');
    else if (cmp.playerCols > cmp.expectedCols) notes.push('Too many columns. Re-read the task: which columns, in what order?');
    else notes.push('Missing a column. Re-read the task: which columns, in what order?');
    if (/COUNT\s*\(/.test(r) && !/COUNT\s*\(/.test(m)) notes.push('They want a count, not the rows themselves: COUNT(*).');
    return { headline, notes };
  }

  if (cmp.orderOnly) {
    headline = 'Right rows. Wrong order.';
    if (!/ORDER BY/.test(m)) notes.push('Order matters here and you have no ORDER BY. Without one, SQL returns rows in any order it likes.');
    else {
      const pd = /\bDESC\b/.test(m), rd = /\bDESC\b/.test(r);
      if (pd !== rd) notes.push(rd ? 'Check the direction: biggest first needs DESC.' : 'Check the direction: ASC (the default) sorts smallest first.');
      else notes.push('Check which column you ORDER BY, and any tie-breaker the task names.');
    }
    return { headline, notes };
  }

  if (cmp.colsPermuted) {
    headline = 'Right data, columns shuffled.';
    notes.push('List the columns in the exact order the task gives.');
    return { headline, notes };
  }

  const extra = cmp.marks.filter((x) => x === 'extra').length;
  const missing = cmp.missing.length;
  const single = cmp.playerRows === 1 && cmp.expectedRows === 1;
  if (single && cmp.expectedCols === 1) headline = 'Wrong number.';
  else if (single) headline = 'Wrong row.';
  else if (cmp.playerRows === 0) headline = 'Nothing came back.';
  else if (extra && !missing) headline = `${extra} row${extra === 1 ? '' : 's'} too many.`;
  else if (missing && !extra) headline = `${missing} row${missing === 1 ? '' : 's'} missing.`;
  else headline = `${extra} wrong row${extra === 1 ? '' : 's'}, ${missing} missing.`;

  if (cmp.dupesOnly && /DISTINCT/.test(r) && !/DISTINCT/.test(m)) notes.push('Duplicates. SELECT DISTINCT keeps one of each.');
  else if (cmp.dupesOnly) notes.push('Same rows, but the counts differ: duplicates crept in or got squashed.');

  if (cmp.playerRows === 0 && /'[^']*'/.test(sql)) notes.push("Zero rows. Text matches are exact: check the spelling and case ('night' ≠ 'Night').");
  if (/=\s*NULL\b|<>\s*NULL\b|!=\s*NULL\b/.test(m)) notes.push('Nothing equals NULL, not even NULL. Use IS NULL / IS NOT NULL.');
  if (/\bLIKE\s+'[^%_']*'/.test(maskSql(sql).toUpperCase()) && /LIKE\s+'[^']*'/i.test(sql) && !/LIKE\s+'[^']*[%_][^']*'/i.test(sql)) notes.push('LIKE without % or _ is just =. Add a wildcard: \'%word%\'.');

  if (/\bAND\b/.test(m) && /\bOR\b/.test(m) && !/\(([^()]*\bOR\b[^()]*)\)/.test(m)) notes.push('AND binds tighter than OR. Wrap the OR choices in parentheses.');
  if (/\bLEFT JOIN\b/.test(r) && !/\bLEFT JOIN\b/.test(m) && /\bJOIN\b/.test(m) && missing) notes.push('Rows vanished. A plain JOIN drops rows with no match; LEFT JOIN keeps them.');
  if (!/\bLEFT JOIN\b/.test(r) && /\bLEFT JOIN\b/.test(m) && extra) notes.push('LEFT JOIN keeps unmatched rows (with NULLs). Did you want only the matches?');
  if (/\bHAVING\b/.test(r) && !/\bHAVING\b/.test(m) && /\bGROUP BY\b/.test(m)) notes.push('Filtering on a total? That goes in HAVING, after GROUP BY. WHERE runs before the grouping.');
  if (/\bGROUP BY\b/.test(r) && !/\bGROUP BY\b/.test(m) && /\b(COUNT|SUM|AVG|MIN|MAX)\s*\(/.test(r)) notes.push('One row per group? That needs GROUP BY.');
  if (/\bLIMIT\b/.test(r) && !/\bLIMIT\b/.test(m) && extra) notes.push('They want only the top of the list: ORDER BY … LIMIT n.');
  if (/\bLIMIT\b/.test(m) && !/ORDER BY/.test(m) && /ORDER BY/.test(r)) notes.push('LIMIT without ORDER BY gives you some rows, not the right rows.');
  if (/ORDER BY/.test(m) && /ORDER BY/.test(r) && /\bLIMIT\b/.test(r) && /\bDESC\b/.test(m) !== /\bDESC\b/.test(r)) notes.push(/\bDESC\b/.test(r) ? 'Top of the list = biggest or latest first: ORDER BY … DESC.' : 'Check the direction: ASC (the default) puts the smallest first.');
  if (/\bDISTINCT\b/.test(r) && !/\bDISTINCT\b/.test(m) && extra && !cmp.dupesOnly) notes.push('Repeats in the list? SELECT DISTINCT.');
  if (/\bWHERE\b/.test(r) && !/\bWHERE\b/.test(m) && !/\bHAVING\b/.test(m) && !/\bJOIN\b/.test(m) && extra) notes.push(single && cmp.expectedCols === 1 ? 'No WHERE: you counted everything. Filter first, then count.' : 'No WHERE: you got every row. Filter down to the ones asked for.');
  if (/\bBETWEEN\b/.test(m)) notes.push('BETWEEN includes both ends.');
  if (/\bCOUNT\s*\(\s*[A-Z_.]+\s*\)/.test(m) && /\bCOUNT\s*\(\s*\*\s*\)/.test(r)) notes.push('COUNT(column) skips NULLs; COUNT(*) counts every row.');
  if (/\bAVG\s*\(/.test(r) && /\bROUND\s*\(/.test(r) && !/\bROUND\s*\(/.test(m)) notes.push('Round it the way the task says: ROUND(x, 2).');

  if (!notes.length) {
    if (orderMatters && !/ORDER BY/.test(m)) notes.push('And order matters: add an ORDER BY.');
    notes.push(extra ? 'Tighten the filter: some rows shouldn’t be here.' : 'Loosen the filter: some rows are missing.');
  }
  return { headline, notes: notes.slice(0, 3) };
}

/* ------------------------------------------------------------------ */
/* Friendly SQLite errors                                              */
/* ------------------------------------------------------------------ */

function lev(a, b) {
  a = a.toLowerCase(); b = b.toLowerCase();
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
  }
  return dp[a.length][b.length];
}
function closest(word, list) {
  let best = null, bd = Infinity;
  for (const c of list) {
    const d = lev(word, c);
    if (d < bd) { bd = d; best = c; }
  }
  return bd <= Math.max(2, Math.floor(word.length / 3)) ? best : null;
}

/**
 * explainError(message, sql, catalog) → { title, detail, token? }
 * token: a piece of the SQL to underline in the editor.
 */
export function explainError(message, sql, cat) {
  const msg = String(message || '');
  const tables = (cat?.tables || []).map((t) => t.name);
  const cols = [...(cat?.allColumns || [])];
  let x;

  if ((x = msg.match(/no such table: (?:main\.)?([\w.]+)/i))) {
    const guess = closest(x[1], tables);
    return { title: `No table called “${x[1]}”.`, detail: guess ? `Did you mean ${guess}? Open the records drawer for the full list.` : `The records have: ${tables.slice(0, 8).join(', ')}${tables.length > 8 ? '…' : ''}.`, token: x[1] };
  }
  if ((x = msg.match(/no such column: ([\w.]+)/i))) {
    const name = x[1].split('.').pop();
    const guess = closest(name, cols);
    const quoted = /'/.test(sql) ? '' : ' Text values need single quotes: \'night\', not night.';
    const detail = x[1].includes('.')
      ? `Check the table or alias before the dot, and the column name.${guess && guess !== name ? ` Did you mean ${guess}?` : ''}`
      : guess ? `Did you mean ${guess}?` : `That column isn’t in the tables you’re reading.${quoted}`;
    return { title: `No column called “${x[1]}”.`, detail, token: x[1] };
  }
  if ((x = msg.match(/ambiguous column name: ([\w.]+)/i))) {
    return { title: `“${x[1]}” is ambiguous.`, detail: `More than one table has a ${x[1]}. Say which: table.${x[1]} (or alias.${x[1]}).`, token: x[1] };
  }
  if (/misuse of aggregate/i.test(msg)) {
    return { title: 'Aggregate in the wrong place.', detail: 'COUNT/SUM/AVG can’t go in WHERE. Filter groups with HAVING, after GROUP BY.', token: (msg.match(/aggregate(?: function)?:? (\w+)/i) || [])[1] };
  }
  if (/a GROUP BY clause is required before HAVING/i.test(msg)) {
    return { title: 'HAVING without GROUP BY.', detail: 'HAVING filters groups. Add a GROUP BY first, or use WHERE for plain rows.', token: 'HAVING' };
  }
  if ((x = msg.match(/near "([^"]+)": syntax error/i))) {
    const t = x[1];
    const T = t.toUpperCase();
    let detail = 'Check commas, quotes and clause order: SELECT … FROM … WHERE … GROUP BY … HAVING … ORDER BY … LIMIT.';
    if (T === 'FROM') detail = 'Something’s off just before FROM. A trailing comma after the last column?';
    else if (['WHERE', 'GROUP', 'HAVING', 'ORDER', 'LIMIT'].includes(T)) detail = `Clause order matters: SELECT … FROM … WHERE … GROUP BY … HAVING … ORDER BY … LIMIT. Is ${T} in the right place?`;
    else if (T === ',') detail = 'A stray comma. Two commas in a row, or one right before a keyword?';
    else if (T === ')') detail = 'A bracket closes with nothing useful inside, or one too many.';
    else if (T === '=') detail = 'An = with something missing on one side?';
    else if (/^[A-Za-z]+$/.test(t)) detail = `SQLite didn’t expect “${t}” there. Missing a comma before it, or a misspelt keyword?`;
    return { title: `Syntax error near “${t}”.`, detail, token: t };
  }
  if (/incomplete input/i.test(msg)) return { title: 'The query stops mid-sentence.', detail: 'An unclosed quote or bracket, or a clause with nothing after it.' };
  if ((x = msg.match(/unrecognized token: "?([^"]+)"?/i))) return { title: 'Unclosed quote or odd character.', detail: 'Text goes in single quotes, and every quote needs a partner.', token: x[1].slice(0, 12) };
  if ((x = msg.match(/no such function: (\w+)/i))) return { title: `No function called ${x[1]}.`, detail: 'SQLite has its own set. Check the field manual.', token: x[1] };
  if ((x = msg.match(/wrong number of arguments to function (\w+)/i))) return { title: `${x[1]} got the wrong number of arguments.`, detail: 'Check the commas inside its brackets.', token: x[1] };
  if (/do not have the same number of result columns/i.test(msg)) return { title: 'UNION halves don’t line up.', detail: 'Both SELECTs in a UNION need the same number of columns.', token: 'UNION' };
  if (/sub-select returns (\d+) columns - expected 1/i.test(msg)) return { title: 'Subquery returns too many columns.', detail: 'A subquery used as a value (or with IN) must return exactly one column.' };
  if (/term out of range/i.test(msg)) return { title: 'Column number out of range.', detail: 'ORDER BY 3 means the third selected column. You don’t have that many.' };
  if (/only a single result allowed|row value misused/i.test(msg)) return { title: 'Too many values in one spot.', detail: 'Check your brackets around the list of values.' };
  if (/read-only|empty/i.test(msg)) return { title: 'Access denied.', detail: msg };
  return { title: 'SQLite rejected it.', detail: msg };
}
