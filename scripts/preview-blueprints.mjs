// Renders each job's blueprint (all layers) to a plain SVG for layout QA.
//   node scripts/preview-blueprints.mjs [jobId]  →  shots/content/<job>.svg
// Then: node scripts/shot.mjs "$PWD/shots/content/<job>.svg" shots/content/<job>.png --base "file://" --w 1200 --h 760 --wait 300
// Legend: white = shell/rooms, cyan = cameras, orange dash = guard loops, red = lasers,
// yellow = notes, green = correct route, magenta dashed = wrong routes.
import { mkdirSync, writeFileSync } from 'node:fs';
import { JOBS } from '../src/data/jobs.js';

const only = process.argv[2];
mkdirSync('shots/content', { recursive: true });
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const rad = (d) => (d * Math.PI) / 180;

for (const job of JOBS) {
  if (only && job.id !== only) continue;
  const bp = job.blueprint;
  const o = [];
  o.push(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="760" viewBox="0 0 1200 760" font-family="monospace">`);
  o.push('<rect width="1200" height="760" fill="#0d2a4a"/>');
  for (let x = 0; x <= 1200; x += 100) o.push(`<line x1="${x}" y1="0" x2="${x}" y2="760" stroke="#1d4470" stroke-width="1"/>`);
  for (let y = 0; y <= 760; y += 100) o.push(`<line x1="0" y1="${y}" x2="1200" y2="${y}" stroke="#1d4470" stroke-width="1"/>`);
  for (const r of bp.rooms || []) {
    const dash = r.outdoor ? ' stroke-dasharray="6 6"' : '';
    if (r.poly) o.push(`<polygon points="${r.poly.map((p) => p.join(',')).join(' ')}" fill="none" stroke="#cfe8ff" stroke-width="2"${dash}/>`);
    else o.push(`<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" fill="none" stroke="#cfe8ff" stroke-width="2"${dash}/>`);
    const [cx, cy] = r.poly ? r.poly.reduce((a, p) => [a[0] + p[0] / r.poly.length, a[1] + p[1] / r.poly.length], [0, 0]) : [r.x + r.w / 2, r.y + r.h / 2];
    o.push(`<text x="${cx}" y="${cy}" fill="#9cc7ee" font-size="13" text-anchor="middle">${esc(r.name)} [${r.layer}]</text>`);
  }
  for (const w of bp.walls || []) o.push(`<line x1="${w.x1}" y1="${w.y1}" x2="${w.x2}" y2="${w.y2}" stroke="#ffffff" stroke-width="4"/>`);
  for (const w of bp.windows || []) o.push(`<line x1="${w.x1}" y1="${w.y1}" x2="${w.x2}" y2="${w.y2}" stroke="#7fdcff" stroke-width="8" opacity=".6"/>`);
  for (const d of bp.doors || []) {
    const [x2, y2] = d.dir === 'h' ? [d.x + d.w, d.y] : [d.x, d.y + d.w];
    o.push(`<line x1="${d.x}" y1="${d.y}" x2="${x2}" y2="${y2}" stroke="#0d2a4a" stroke-width="8"/>`);
    o.push(`<line x1="${d.x}" y1="${d.y}" x2="${x2}" y2="${y2}" stroke="#ffb86b" stroke-width="2" stroke-dasharray="3 3"/>`);
    if (d.label) o.push(`<text x="${(d.x + x2) / 2}" y="${(d.y + y2) / 2 - 8}" fill="#ffb86b" font-size="11" text-anchor="middle">${esc(d.label)}</text>`);
  }
  for (const c of bp.cameras || []) {
    const a1 = rad(c.dir - c.fov / 2), a2 = rad(c.dir + c.fov / 2);
    const p1 = [c.x + c.range * Math.cos(a1), c.y + c.range * Math.sin(a1)], p2 = [c.x + c.range * Math.cos(a2), c.y + c.range * Math.sin(a2)];
    const dead = /dead/i.test(c.label || '');
    o.push(`<path d="M${c.x},${c.y} L${p1.join(',')} A${c.range},${c.range} 0 0 1 ${p2.join(',')} Z" fill="${dead ? 'none' : '#35e0ff'}" fill-opacity=".18" stroke="#35e0ff" stroke-width="1.5"${dead ? ' stroke-dasharray="4 4"' : ''}/>`);
    o.push(`<circle cx="${c.x}" cy="${c.y}" r="6" fill="#35e0ff"/><text x="${c.x + 8}" y="${c.y - 8}" fill="#35e0ff" font-size="11">${esc(c.label || c.id)} [${c.layer}]</text>`);
  }
  for (const g of bp.guards || []) {
    const pts = (g.loop !== false ? [...g.path, g.path[0]] : g.path).map((p) => p.join(',')).join(' ');
    o.push(`<polyline points="${pts}" fill="none" stroke="#ff9d3b" stroke-width="2" stroke-dasharray="10 4 2 4"/>`);
    o.push(`<text x="${g.path[0][0]}" y="${g.path[0][1] + 16}" fill="#ff9d3b" font-size="11">${esc(g.name)} [${g.layer}]</text>`);
  }
  for (const l of bp.lasers || []) o.push(`<line x1="${l.x1}" y1="${l.y1}" x2="${l.x2}" y2="${l.y2}" stroke="#ff4d6d" stroke-width="1.5"/>`);
  for (const s of bp.safes || []) {
    o.push(`<circle cx="${s.x}" cy="${s.y}" r="${s.r}" fill="none" stroke="#fff" stroke-width="2"/><circle cx="${s.x}" cy="${s.y}" r="${s.r - 5}" fill="none" stroke="#fff"/>`);
    o.push(`<line x1="${s.x - s.r}" y1="${s.y}" x2="${s.x + s.r}" y2="${s.y}" stroke="#fff"/><line x1="${s.x}" y1="${s.y - s.r}" x2="${s.x}" y2="${s.y + s.r}" stroke="#fff"/>`);
    o.push(`<text x="${s.x}" y="${s.y + s.r + 14}" fill="#fff" font-size="11" text-anchor="middle">${esc(s.label)}</text>`);
  }
  for (const e of bp.entries || []) o.push(`<rect x="${e.x - 7}" y="${e.y - 7}" width="14" height="14" fill="none" stroke="#7dff9b" stroke-width="2" transform="rotate(45 ${e.x} ${e.y})"/><text x="${e.x + 10}" y="${e.y + 4}" fill="#7dff9b" font-size="11">${esc(e.label)}</text>`);
  for (const opt of job.play?.options || []) {
    const ok = opt.id === job.play.answer;
    o.push(`<polyline points="${opt.route.map((p) => p.join(',')).join(' ')}" fill="none" stroke="${ok ? '#39ff6a' : '#ff4dd2'}" stroke-width="${ok ? 4 : 2}" ${ok ? '' : 'stroke-dasharray="8 5"'} opacity=".85"/>`);
    const [lx, ly] = opt.route[0];
    o.push(`<text x="${lx + 6}" y="${ly - 6}" fill="${ok ? '#39ff6a' : '#ff4dd2'}" font-size="12">${esc(opt.id)}</text>`);
  }
  for (const n of bp.notes || []) o.push(`<text x="${n.x}" y="${n.y}" fill="#ffd23f" font-size="16" font-style="italic" transform="rotate(${n.rot || 0} ${n.x} ${n.y})">${esc(n.text)}</text>`);
  for (const l of bp.labels || []) o.push(`<text x="${l.x}" y="${l.y}" fill="#cfe8ff" font-size="14" letter-spacing="3" text-anchor="middle">${esc(l.text)}</text>`);
  o.push(`<text x="20" y="740" fill="#cfe8ff" font-size="14">${esc(bp.title)} · ${esc(bp.scale)}</text>`);
  o.push('</svg>');
  writeFileSync(`shots/content/${job.id}.svg`, o.join('\n'));
  console.log(`wrote shots/content/${job.id}.svg`);
}
