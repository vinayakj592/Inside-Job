// Dev harness for the signature transition: ?dev=transition[&auto=1][&job=pawn][&handoff=1]
// Renders a stand-in planning table (blueprint from the job data + a fake terminal), then runs
// blueprintToNoir → ComicPlayer(replay.success) → removeInkCover, exactly like the real flow.
import { h } from '../core/dom.js';
import { blueprintToNoir, removeInkCover, inkOut, noirToBlueprint } from './transition.js';

export async function transitionHarness(root, q) {
  const { JOBS } = await import('../data/jobs.js');
  const job = JOBS.find((j) => j.id === (q.get('job') || 'pawn')) || JOBS[0];
  const bp = job.blueprint;
  const play = job.play;
  const opt = play.options.find((o) => o.id === play.answer) || play.options[0];
  const route = opt.route;
  const target = (bp.safes && bp.safes[0]) || { x: route[route.length - 1][0], y: route[route.length - 1][1] };

  const wrap = h('div', { style: { position: 'absolute', inset: '0', display: 'grid', gridTemplateColumns: '1fr 380px', background: 'radial-gradient(ellipse 60% 60% at 40% 45%, #12407a, #041630 75%)' } });
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 1200 760');
  svg.style.cssText = 'width:100%;height:100%;display:block';
  let s = '<defs><filter id="bpglow"><feGaussianBlur stdDeviation="2.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>';
  s += '<pattern id="g20" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke="#3b78ad" stroke-opacity=".35" stroke-width=".6"/></pattern>';
  s += '<pattern id="g100" width="100" height="100" patternUnits="userSpaceOnUse"><path d="M100 0H0V100" fill="none" stroke="#3b78ad" stroke-opacity=".7" stroke-width="1"/></pattern></defs>';
  s += '<rect width="1200" height="760" fill="#0a2a52"/><rect width="1200" height="760" fill="url(#g20)"/><rect width="1200" height="760" fill="url(#g100)"/>';
  s += '<g filter="url(#bpglow)" stroke="#cdf3ff" fill="none" stroke-width="2.2">';
  for (const r of bp.rooms || []) if (r.w) s += `<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" stroke-width="1.4"/><text x="${r.x + 12}" y="${r.y + 26}" fill="#cdf3ff" stroke="none" font-family="Architects Daughter" font-size="18">${(r.name || '').toUpperCase()}</text>`;
  for (const w of bp.walls || []) s += `<path d="M${w.x1},${w.y1}L${w.x2},${w.y2}" stroke-width="5"/>`;
  for (const c of bp.cameras || []) {
    const a1 = ((c.dir - c.fov / 2) * Math.PI) / 180, a2 = ((c.dir + c.fov / 2) * Math.PI) / 180;
    s += `<path d="M${c.x},${c.y}L${c.x + Math.cos(a1) * c.range},${c.y + Math.sin(a1) * c.range}A${c.range},${c.range} 0 0 1 ${c.x + Math.cos(a2) * c.range},${c.y + Math.sin(a2) * c.range}Z" stroke="#56d9ff" stroke-dasharray="6 5" stroke-width="1.4"/>`;
  }
  for (const sf of bp.safes || []) s += `<circle cx="${sf.x}" cy="${sf.y}" r="${sf.r}"/><circle cx="${sf.x}" cy="${sf.y}" r="${sf.r - 7}"/><path d="M${sf.x - sf.r},${sf.y}h${sf.r * 2}M${sf.x},${sf.y - sf.r}v${sf.r * 2}"/>`;
  for (const e of bp.entries || []) s += `<path d="M${e.x - 10},${e.y - 10}l20,20M${e.x + 10},${e.y - 10}l-20,20" stroke="#56d9ff"/>`;
  s += '</g>';
  for (const n of bp.notes || []) s += `<text x="${n.x}" y="${n.y}" fill="#ffd23f" font-family="Architects Daughter" font-size="22" transform="rotate(${n.rot || 0} ${n.x} ${n.y})">${n.text}</text>`;
  s += `<g font-family="Architects Daughter" fill="#cdf3ff"><rect x="860" y="660" width="320" height="80" fill="none" stroke="#56d9ff"/><text x="876" y="690" font-size="16">${bp.title || ''}</text><text x="876" y="720" font-size="14">SCALE ${bp.scale || ''} · DRAWN BY THE ARCHITECT</text></g>`;
  svg.innerHTML = s;
  const term = h('div', { style: { background: 'rgba(4,22,48,.92)', borderLeft: '2px solid #56d9ff', padding: '28px', font: '400 15px/1.6 var(--f-mono)', color: '#cdf3ff' } },
    h('div', { style: { font: '400 24px/1 var(--f-draft)', marginBottom: '20px', color: '#ffd23f' } }, 'CALL THE PLAY'),
    h('pre', { style: { margin: 0 } }, 'SELECT name, shift\nFROM staff\nWHERE shift = \'night\';'),
    h('p', { style: { marginTop: '30px', font: '400 18px/1.3 var(--f-draft)' } }, `▸ ${opt.label}`));
  const go = h('button.bp-btn.bp-btn--grease.bp-btn--lg', { style: { position: 'absolute', right: '60px', bottom: '60px' } }, h('span', 'Run the play'));
  wrap.append(svg, term);
  root.append(wrap, go);

  const run = async () => {
    go.remove();
    window.__txStart = performance.now();
    await blueprintToNoir(svg, { focus: { x: target.x, y: target.y }, route });
    window.__txEnd = performance.now();
    if (q.get('handoff') === '0') return;
    wrap.remove();
    const { ComicPlayer } = await import('./engine.js');
    const p = new ComicPlayer(root, job.replay.success, { onFirstPage: () => removeInkCover(), onDone: async () => { await inkOut(); p.destroy(); root.innerHTML = ''; root.append(wrap); noirToBlueprint(); } });
    window.__player = p;
    p.start();
  };
  go.addEventListener('click', run);
  window.__runTx = run;
  window.__runRev2 = () => { go.remove(); const c = document.createElement('div'); c.className = 'ink-cover'; document.getElementById('fx-layer').append(c); noirToBlueprint(); };
  window.__runRev = async () => { go.remove(); await inkOut(); noirToBlueprint(); };
  if (q.get('auto')) setTimeout(run, 400);
}
