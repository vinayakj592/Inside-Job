// Screenshot helper for visual QA.
//   node scripts/shot.mjs "<url path+query>" out.png [--w 1600 --h 900 --wait 2500 --click "selector" --eval "js" --gl]
// Requires the dev server: npm run dev (http://127.0.0.1:5173).
// Examples:
//   node scripts/shot.mjs "/" shots/home.png --wait 3000
//   node scripts/shot.mjs "/?screen=planning&job=pawn" shots/plan.png
//   node scripts/shot.mjs "/?screen=cinema&job=pawn&script=briefing" shots/cine.png --click ".cinema" --wait 1500
import { chromium } from 'playwright-core';

const args = process.argv.slice(2);
const url = args[0] || '/';
const out = args[1] || 'shot.png';
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const all = (k) => args.flatMap((a, i) => (a === '--' + k ? [args[i + 1]] : []));
const W = +opt('w', 1600), H = +opt('h', 900), WAIT = +opt('wait', 2500);
const base = opt('base', 'http://127.0.0.1:5173');

const browser = await chromium.launch({
  executablePath: process.env.CHROME || '/usr/bin/google-chrome',
  headless: true,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'],
});
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
const logs = [];
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') logs.push(`[${m.type()}] ${m.text()}`); });
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));
if (opt('save')) await page.addInitScript((s) => localStorage.setItem('inside-job/save/v1', s), opt('save'));
await page.goto(base + url, { waitUntil: 'networkidle' });
await page.waitForTimeout(WAIT);
for (const sel of all('click')) {
  await page.click(sel, { timeout: 5000 }).catch((e) => logs.push('[click failed] ' + sel + ' ' + e.message.split('\n')[0]));
  await page.waitForTimeout(+opt('after', 1200));
}
for (const js of all('eval')) {
  await page.evaluate(js).catch((e) => logs.push('[eval failed] ' + e.message));
  await page.waitForTimeout(+opt('after', 1200));
}
await page.screenshot({ path: out });
console.log('saved', out);
if (logs.length) console.log(logs.join('\n'));
await browser.close();
