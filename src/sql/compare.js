// Result-set checker. Compares a player's result with the reference solution.
// Column names are ignored; column count, values and (optionally) order are checked.

/** Normalise a value so that 5, 5.0 and '5' match, floats compare to 4 dp, and NULL is its own thing. */
export function norm(v) {
  if (v === null || v === undefined) return '∅';
  if (typeof v === 'number') return numKey(v);
  if (typeof v === 'string') {
    const t = v.trim();
    if (/^-?\d+(\.\d+)?$/.test(t)) return numKey(Number(t));
    return 's:' + v;
  }
  return 's:' + String(v);
}
function numKey(x) {
  if (!Number.isFinite(x)) return 'n:' + String(x);
  if (Number.isInteger(x)) return 'n:' + x;
  const r = Math.round(x * 1e4) / 1e4;
  return 'n:' + (Object.is(r, -0) ? 0 : r);
}
const rowKey = (row) => row.map(norm).join('␟');
const sortedRowKey = (row) => row.map(norm).sort().join('␟');

function countMap(keys) {
  const m = new Map();
  for (const k of keys) m.set(k, (m.get(k) || 0) + 1);
  return m;
}

/**
 * compare(player, expected, { orderMatters })
 *   player/expected: { columns: string[], rows: any[][] }
 * → {
 *     ok, colMismatch, playerCols, expectedCols, playerRows, expectedRows,
 *     marks: ('ok'|'extra'|'moved')[]   one per player row
 *     missing: any[][]                   expected rows the player did not return
 *     orderOnly, colsPermuted, dupesOnly
 *   }
 */
export function compare(player, expected, { orderMatters = false } = {}) {
  const pc = player.columns.length, ec = expected.columns.length;
  const P = player.rows, E = expected.rows;
  const res = {
    ok: false, colMismatch: pc !== ec, playerCols: pc, expectedCols: ec,
    playerRows: P.length, expectedRows: E.length,
    marks: P.map(() => 'ok'), missing: [], orderOnly: false, colsPermuted: false, dupesOnly: false,
  };

  if (res.colMismatch) {
    res.marks = P.map(() => 'extra');
    res.missing = [];
    return res;
  }

  const pk = P.map(rowKey), ek = E.map(rowKey);
  // multiset match
  const need = countMap(ek);
  const marks = pk.map((k) => {
    const c = need.get(k) || 0;
    if (c > 0) { need.set(k, c - 1); return 'ok'; }
    return 'extra';
  });
  const missing = [];
  const left = new Map(need);
  E.forEach((row, i) => {
    const c = left.get(ek[i]) || 0;
    if (c > 0) { missing.push(row); left.set(ek[i], c - 1); }
  });
  const sameSet = missing.length === 0 && !marks.includes('extra');

  if (sameSet) {
    if (!orderMatters || pk.every((k, i) => k === ek[i])) {
      res.ok = true;
      return res;
    }
    res.orderOnly = true;
    res.marks = pk.map((k, i) => (k === ek[i] ? 'ok' : 'moved'));
    return res;
  }

  res.marks = marks;
  res.missing = missing;

  // Right data, columns in a different order?
  if (P.length === E.length) {
    const a = countMap(P.map(sortedRowKey)), b = countMap(E.map(sortedRowKey));
    if (a.size === b.size && [...a].every(([k, v]) => b.get(k) === v)) res.colsPermuted = true;
  }
  // Same distinct rows, different multiplicities (duplicates)?
  const ps = new Set(pk), es = new Set(ek);
  if (ps.size === es.size && [...ps].every((k) => es.has(k)) && P.length !== E.length) res.dupesOnly = true;
  return res;
}
