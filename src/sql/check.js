// Puzzle checker: runs the reference solution (cached), compares, and explains.
import { run } from './engine.js';
import { compare } from './compare.js';
import { diagnose } from './diagnose.js';

const refCache = new Map();

/** The reference result for a SQL string (cached). */
export function expectedFor(refSql) {
  if (!refCache.has(refSql)) refCache.set(refSql, run(refSql, { maxRows: 5000 }));
  return refCache.get(refSql);
}

/**
 * check(puzzle, playerSql, playerResult) → { ok, cmp, expected, headline, notes }
 * playerResult must be a successful run() result.
 */
export function check(puzzle, playerSql, playerResult) {
  const expected = expectedFor(puzzle.sql);
  if (!expected.ok) {
    console.error('[sql] reference solution failed', puzzle.title, expected.error);
    return { ok: false, cmp: null, expected, headline: 'The reference file is corrupt.', notes: [expected.error] };
  }
  const cmp = compare(playerResult, expected, { orderMatters: !!puzzle.orderMatters });
  if (cmp.ok) return { ok: true, cmp, expected, headline: 'Checks out.', notes: [] };
  const { headline, notes } = diagnose({ sql: playerSql, refSql: puzzle.sql, cmp, orderMatters: !!puzzle.orderMatters });
  return { ok: false, cmp, expected, headline, notes };
}
