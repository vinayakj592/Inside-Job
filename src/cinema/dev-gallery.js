// Dev shot gallery: ?screen=cinema&dev=gallery[&only=name,name][&cols=4][&aspect=1.6]
import { h } from '../core/dom.js';
import { renderShot, SHOT_NAMES } from './shots/index.js';

const SAMPLE = {
  'city-establish': { building: 'Crane Tower' },
  'car-interior': { who: 'dex' },
  face: { who: 'viv', mood: 'smirk' },
  'two-shot': { a: 'viv', b: 'crane' },
  'cctv-monitor': { label: 'CAM 2' },
  'door-keypad': { code: '4711' },
  loot: { item: 'The Moretti ledger' },
  clock: { time: '02:47' },
  phone: { who: 'juno' },
  newspaper: { headline: 'PAWNSHOP BURGLED; NOTHING OF VALUE TAKEN' },
  'title-card': { kicker: 'Job 01', title: 'Cold Open' },
  'silhouette-reveal': { who: 'crane' },
  rooftop: { who: 'viv' },
  'character-intro': { who: 'dex', tagline: 'Drives like the road owes him money.' },
};

export function gallery(root, q) {
  const only = q.get('only') ? q.get('only').split(',') : null;
  const cols = +(q.get('cols') || 4);
  const aspect = +(q.get('aspect') || 1.6);
  const names = only || SHOT_NAMES;
  const vw = innerWidth - 20 - (cols - 1) * 10;
  const cw = vw / cols, ch = cw / aspect;
  const grid = h('div.cx-gal', { style: { gridTemplateColumns: `repeat(${cols}, ${cw}px)`, gridAutoRows: `${ch}px` } });
  for (const name of names) {
    let params = SAMPLE[name] || {};
    const pq = q.get('p');
    if (pq && only && only.length === 1) params = { ...params, ...JSON.parse(pq) };
    const { el } = renderShot(name, params, { w: cw, h: ch });
    grid.append(h('div.cx-gal__cell', el, h('span.cx-gal__name', name)));
  }
  root.append(grid);
}

// Pose sheet: ?dev=poses
export async function poses(root) {
  const { figure, POSES, BUILDS, C } = await import('./kit.js');
  const names = Object.keys(POSES), builds = Object.keys(BUILDS);
  const W = 1580, row = 190;
  let s = `<rect width="${W}" height="${row * 3}" fill="${C.t7}"/>`;
  names.forEach((p, i) => {
    const x = 60 + (i % 16) * 96, y = 170;
    s += figure(x, y, 150, { pose: p, build: 'fedora', rim: { color: C.gold, dx: 2, dy: -1 } });
    s += `<text x="${x}" y="${y + 16}" font-size="11" fill="#fff" text-anchor="middle">${p}</text>`;
  });
  builds.forEach((b, i) => {
    const x = 60 + i * 130, y = 170 + row * 1.3;
    s += figure(x, y, 190, { pose: 'stand', build: b, rim: { color: C.gold, dx: 2, dy: -1 } });
    s += figure(x + 55, y, 190, { pose: 'walk', build: b, face: -1 });
    s += `<text x="${x + 20}" y="${y + 16}" font-size="11" fill="#fff" text-anchor="middle">${b}</text>`;
  });
  root.innerHTML = `<svg viewBox="0 0 ${W} ${row * 3}" style="width:100%;display:block">${s}</svg>`;
}

// ?dev=intros[&aspect=1.8] — character-intro for the whole cast
export function intros(root, q) {
  const ids = (q.get('ids') || 'viv,dex,juno,otis,lena,crane,calloway,moretti').split(',');
  const aspect = +(q.get('aspect') || 1.8), cols = +(q.get('cols') || 2);
  const cw = (innerWidth - 20 - (cols - 1) * 10) / cols, ch = cw / aspect;
  const grid = h('div.cx-gal', { style: { gridTemplateColumns: `repeat(${cols}, ${cw}px)`, gridAutoRows: `${ch}px` } });
  for (const who of ids) grid.append(h('div.cx-gal__cell', renderShot('character-intro', { who, tagline: 'Designed the vault. Did the time. Wants it back, with interest.' }, { w: cw, h: ch }).el));
  root.append(grid);
}
