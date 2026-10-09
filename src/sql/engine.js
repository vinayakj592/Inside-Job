// sql.js engine: boots the city database, runs player queries read-only, introspects the schema.
// Contract (DESIGN.md §5):
//   initSql(): Promise<Database>   boots sql.js and loads SETUP_SQL
//   ready():   Promise<Database>   resolves once booted
//   exec(sql): QueryExecResult[]   raw sql.js exec, throws on SQL error (internal/trusted use)
//   run(sql):  { ok, columns, rows, ms, statements, truncated, error }  guarded player entry point
import initSqlJs from 'sql.js';
import wasmUrl from 'sql.js/dist/sql-wasm-browser.wasm?url';
import { SETUP_SQL } from '../data/schema.js';

let dbPromise = null;
let db = null;
let catalogCache = null;

export function initSql() {
  if (!dbPromise) {
    dbPromise = initSqlJs({ locateFile: () => wasmUrl }).then((SQL) => {
      const d = new SQL.Database();
      d.run(SETUP_SQL);
      db = d;
      return d;
    });
  }
  return dbPromise;
}
export const ready = () => initSql();
export const isReady = () => !!db;
export const getDb = () => db;

/** Raw exec for trusted SQL (reference solutions, introspection). Throws on error. */
export function exec(sql) {
  if (!db) throw new Error('SQL engine not ready');
  return db.exec(sql);
}

/* ------------------------------------------------------------------ */
/* SQL text utilities                                                  */
/* ------------------------------------------------------------------ */

/** Replace comments with spaces and string/identifier literals with placeholders, preserving length. */
export function maskSql(sql) {
  let out = '';
  let i = 0;
  const n = sql.length;
  while (i < n) {
    const c = sql[i], d = sql[i + 1];
    if (c === '-' && d === '-') {
      const j = sql.indexOf('\n', i);
      const end = j < 0 ? n : j;
      out += ' '.repeat(end - i);
      i = end;
    } else if (c === '/' && d === '*') {
      const j = sql.indexOf('*/', i + 2);
      const end = j < 0 ? n : j + 2;
      out += sql.slice(i, end).replace(/[^\n]/g, ' ');
      i = end;
    } else if (c === "'") {
      let j = i + 1;
      while (j < n) {
        if (sql[j] === "'" && sql[j + 1] === "'") { j += 2; continue; }
        if (sql[j] === "'") break;
        j++;
      }
      const end = Math.min(n, j + 1);
      out += "'" + 's'.repeat(Math.max(0, end - i - 2)) + (end - i > 1 ? "'" : '');
      i = end;
    } else {
      out += c;
      i++;
    }
  }
  return out;
}

/** Split into statements on top-level semicolons. Returns non-empty trimmed statements. */
export function splitStatements(sql) {
  const masked = maskSql(sql);
  const parts = [];
  let start = 0;
  for (let i = 0; i < masked.length; i++) {
    if (masked[i] === ';') {
      parts.push([start, i]);
      start = i + 1;
    }
  }
  parts.push([start, masked.length]);
  return parts
    .filter(([a, b]) => masked.slice(a, b).trim().length > 0)
    .map(([a, b]) => sql.slice(a, b).trim());
}

// A statement that starts with SELECT/VALUES cannot write in SQLite; WITH can wrap a DML statement.
const WRITE_IN_WITH = /\b(INSERT\s+(?:OR\s+\w+\s+)?INTO|REPLACE\s+INTO|UPDATE\s+(?:OR\s+\w+\s+)?[\w"]+\s+SET|DELETE\s+FROM)\b/i;

/** null when the SQL is a read-only query; otherwise a short in-world explanation. */
export function readOnlyViolation(sql) {
  const stmts = splitStatements(sql);
  if (!stmts.length) return 'The terminal is empty. Write a SELECT.';
  for (const s of stmts) {
    const m = maskSql(s).trim();
    const first = (m.match(/^[A-Za-z]+/) || [''])[0].toUpperCase();
    if (first !== 'SELECT' && first !== 'WITH' && first !== 'VALUES') {
      return `The records network is read-only. Only SELECT (or WITH …) queries go through${first ? `, not ${first}` : ''}.`;
    }
    const w = first === 'WITH' && m.match(WRITE_IN_WITH);
    if (w) return `The records network is read-only: ${w[1].split(/\s+/)[0].toUpperCase()} is blocked. Only SELECT (or WITH …) queries go through.`;
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* Guarded run                                                          */
/* ------------------------------------------------------------------ */

/**
 * Run player SQL. Never throws.
 * @returns {{ ok: boolean, columns: string[], rows: any[][], ms: number, statements: number, truncated: boolean, error?: string, blocked?: boolean }}
 */
export function run(sql, { maxRows = 1000 } = {}) {
  const t0 = performance.now();
  const base = { ok: false, columns: [], rows: [], ms: 0, statements: 0, truncated: false };
  if (!db) return { ...base, error: 'The records network is still connecting. Try again in a second.' };
  const blocked = readOnlyViolation(sql);
  if (blocked) return { ...base, error: blocked, blocked: true };
  const stmts = splitStatements(sql);
  let last = null;
  try {
    for (const text of stmts) {
      const st = db.prepare(text);
      try {
        const columns = st.getColumnNames();
        const rows = [];
        let truncated = false;
        const deadline = performance.now() + 2500;
        while (st.step()) {
          if (rows.length >= maxRows) { truncated = true; break; }
          rows.push(st.get().map(cleanValue));
          if ((rows.length & 255) === 0 && performance.now() > deadline) { truncated = true; break; }
        }
        last = { columns, rows, truncated };
      } finally {
        st.free();
      }
    }
  } catch (e) {
    return { ...base, ms: performance.now() - t0, statements: stmts.length, error: String(e?.message || e) };
  }
  return { ok: true, ...last, ms: performance.now() - t0, statements: stmts.length };
}

function cleanValue(v) {
  if (v instanceof Uint8Array) return `<blob ${v.length}b>`;
  return v;
}

/* ------------------------------------------------------------------ */
/* Schema introspection                                                 */
/* ------------------------------------------------------------------ */

/**
 * { tables: [{ name, columns: [{ name, type, pk }] }], columnsByTable: Map, allColumns: Set }
 * Cached; the database is read-only so it never changes.
 */
export function catalog() {
  if (catalogCache) return catalogCache;
  if (!db) return { tables: [], columnsByTable: new Map(), allColumns: new Set() };
  const tables = [];
  const res = db.exec("SELECT name, type FROM sqlite_master WHERE type IN ('table','view') AND name NOT LIKE 'sqlite_%' ORDER BY name");
  for (const [name, type] of res[0]?.values || []) {
    const info = db.exec(`PRAGMA table_info("${String(name).replace(/"/g, '""')}")`)[0];
    const columns = (info?.values || []).map((r) => ({ name: r[1], type: r[2] || '', pk: !!r[5] }));
    let count = 0;
    try { count = db.exec(`SELECT COUNT(*) FROM "${String(name).replace(/"/g, '""')}"`)[0].values[0][0]; } catch { /* ignore */ }
    tables.push({ name, kind: type, columns, count });
  }
  const columnsByTable = new Map(tables.map((t) => [t.name.toLowerCase(), t.columns.map((c) => c.name)]));
  const allColumns = new Set(tables.flatMap((t) => t.columns.map((c) => c.name)));
  catalogCache = { tables, columnsByTable, allColumns };
  return catalogCache;
}

/** First n rows of a table for the records "peek". */
export function peek(table, n = 6) {
  const safe = String(table).replace(/"/g, '""');
  return run(`SELECT * FROM "${safe}" LIMIT ${n | 0}`);
}
