// DEV-only (?hubdemo): fills the board with placeholder cases for any job the content agent
// hasn't written yet, so the hub can be art-directed with all eight pins on it.
import { DEFAULT_POS } from '../../art/city/layout.js';

const STUB = {
  pawn: ['Cold Open', "Moretti's Pawn & Loan", 'The Narrows', 'SELECT · WHERE · ORDER BY · LIMIT · COUNT', 40000],
  gallery: ['The Gilded Frame', 'Galerie Lumière', 'Gallery Row', 'DISTINCT · LIKE · IN · BETWEEN · AND/OR', 90000],
  casino: ['House Edge', 'The Orpheum Casino', 'The Strip', 'JOIN · GROUP BY · COUNT/SUM/AVG', 160000],
  rail: ['Night Freight', 'Vesper Rail Yard', 'The Docks', 'HAVING · 3-table JOINs · multi-column GROUP BY', 260000],
  bank: ['Box 1127', 'First Meridian Bank', 'Financial District', 'Subqueries · LEFT JOIN · IS NULL', 420000],
  auction: ['Lot 47', 'Halloway & Sons', 'Old Town', 'CASE WHEN · COALESCE · text & date functions', 650000],
  penthouse: ['Top Floor', 'The Marlowe Hotel', 'Uptown', 'RANK · ROW_NUMBER · running totals · LAG', 1000000],
  tower: ['Inside Job', 'Crane Tower', 'Crane Plaza', 'CTEs · UNION · EXISTS', 2500000],
};

export function demoJobs(real) {
  return Object.keys(STUB).map((id, i) => {
    const r = real.find((j) => j.id === id);
    if (r) return r;
    const [title, target, district, sqlFocus, take] = STUB[id];
    return { id, number: i + 1, title, target, district, hubPos: DEFAULT_POS[id], take, sqlFocus, logline: 'Placeholder case: the content agent is still writing this one.', briefing: [], puzzles: [] };
  });
}
