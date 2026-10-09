// SQLite vocabulary for the highlighter and autocomplete.

export const KEYWORDS = [
  'SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'NOT', 'IN', 'IS', 'NULL', 'LIKE', 'GLOB', 'BETWEEN', 'EXISTS',
  'ORDER', 'BY', 'GROUP', 'HAVING', 'LIMIT', 'OFFSET', 'ASC', 'DESC', 'DISTINCT', 'ALL', 'AS', 'ON', 'USING',
  'JOIN', 'INNER', 'LEFT', 'RIGHT', 'FULL', 'OUTER', 'CROSS', 'NATURAL',
  'UNION', 'INTERSECT', 'EXCEPT', 'WITH', 'RECURSIVE', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END',
  'CAST', 'COLLATE', 'NOCASE', 'ESCAPE', 'OVER', 'PARTITION', 'ROWS', 'RANGE', 'UNBOUNDED', 'PRECEDING',
  'FOLLOWING', 'CURRENT', 'ROW', 'WINDOW', 'FILTER', 'NULLS', 'FIRST', 'LAST', 'VALUES', 'TRUE', 'FALSE',
  'INTEGER', 'TEXT', 'REAL',
];

export const FUNCTIONS = [
  'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'TOTAL', 'GROUP_CONCAT',
  'ROUND', 'ABS', 'LENGTH', 'UPPER', 'LOWER', 'TRIM', 'LTRIM', 'RTRIM', 'SUBSTR', 'SUBSTRING', 'REPLACE', 'INSTR',
  'COALESCE', 'IFNULL', 'NULLIF', 'IIF', 'TYPEOF', 'PRINTF', 'FORMAT',
  'DATE', 'TIME', 'DATETIME', 'JULIANDAY', 'STRFTIME', 'UNIXEPOCH',
  'ROW_NUMBER', 'RANK', 'DENSE_RANK', 'NTILE', 'LAG', 'LEAD', 'FIRST_VALUE', 'LAST_VALUE', 'NTH_VALUE',
  'PERCENT_RANK', 'CUME_DIST', 'RANDOM', 'CHAR', 'HEX', 'QUOTE',
];

export const KEYWORD_SET = new Set(KEYWORDS);
export const FUNCTION_SET = new Set(FUNCTIONS);

/** Multi-word phrases offered by autocomplete as one unit. */
export const PHRASES = ['ORDER BY', 'GROUP BY', 'LEFT JOIN', 'INNER JOIN', 'IS NULL', 'IS NOT NULL', 'NOT IN', 'UNION ALL', 'PARTITION BY'];
