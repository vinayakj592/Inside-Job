// Jobs, prologue and epilogue. Contract: docs/DESIGN.md §6.3. Story bible: docs/STORY.md.
// Each job lives in its own module under ./jobs/<id>.js (default export = one job object).
// To add a job: uncomment its line in ./jobs/index.js. That's it; JOBS is sorted by `number`.
import * as ALL from './jobs/index.js';
export { PROLOGUE } from './jobs/prologue.js';
export { EPILOGUE } from './jobs/epilogue.js';

export const JOBS = Object.values(ALL).filter((j) => j && j.id).sort((a, b) => a.number - b.number);
