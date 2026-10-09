// Shared UI primitives. See docs/DESIGN.md §4–5.
// Every primitive belongs to one of the two worlds: NOIR (paper, ink, chips, tape) or
// BLUEPRINT (drafting boxes, grease pencil, vellum). Pick the one that matches the screen.
import { h } from '../core/dom.js';
import { sfx } from '../core/audio.js';
import * as S from '../core/state.js';
import { icon } from './icons.js';

export { icon, iconSvg } from './icons.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const withSound = (el, onClick) => {
  el.addEventListener('pointerenter', () => sfx('hover'));
  el.addEventListener('click', (e) => { sfx('click'); onClick?.(e); });
  return el;
};

/**
 * Button factory.
 *  NOIR:      variant 'gold' | 'ink' | 'cream' | 'alarm'   → hand-cut paper (.cut)
 *  BLUEPRINT: variant 'bp' (alias 'cyan') | 'grease'       → drafting box (.bp-btn)
 *  EITHER:    variant 'link'                                → underlined text button
 *  size: 'sm' | 'lg';  cut: 'a' | 'b' | 'c' (which hand-cut outline, noir only)
 */
export function button(label, { variant = 'gold', icon: ic, onClick, size, title, className = '', disabled, cut } = {}) {
  let cls;
  if (variant === 'bp' || variant === 'cyan') cls = 'bp-btn';
  else if (variant === 'grease') cls = 'bp-btn bp-btn--grease';
  else if (variant === 'link') cls = 'link-btn';
  else cls = `cut cut--${variant}${cut ? ' cut--' + cut : ''}`;
  const base = cls.startsWith('bp') ? 'bp-btn' : cls.startsWith('cut') ? 'cut' : null;
  if (size && base) cls += ` ${base}--${size}`;
  const el = h('button', { type: 'button', class: `${cls} ${className}`.trim(), title, disabled: !!disabled });
  if (ic) el.append(icon(ic));
  if (label != null) el.append(h('span', label));
  if (variant === 'grease') el.append(greaseLoop());
  return withSound(el, onClick);
}

/** A wobbly hand-drawn grease-pencil loop (fresh every call so no two look identical). */
export function greaseLoop() {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('class', 'grease-loop');
  svg.setAttribute('viewBox', '0 0 100 40');
  svg.setAttribute('preserveAspectRatio', 'none');
  const p = document.createElementNS(SVG_NS, 'path');
  const pts = [];
  const turns = 1.12;
  const n = 26;
  for (let i = 0; i <= n; i++) {
    const t = (i / n) * Math.PI * 2 * turns - 0.5;
    const wob = 1 + (Math.random() - 0.5) * 0.07;
    pts.push([50 + Math.cos(t) * 47 * wob, 20 + Math.sin(t) * 17 * wob + (i / n) * 2]);
  }
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const mx = (pts[i][0] + pts[i + 1][0]) / 2, my = (pts[i][1] + pts[i + 1][1]) / 2;
    d += ` Q${pts[i][0].toFixed(1)},${pts[i][1].toFixed(1)} ${mx.toFixed(1)},${my.toFixed(1)}`;
  }
  p.setAttribute('d', d);
  p.setAttribute('pathLength', '1');
  p.setAttribute('vector-effect', 'non-scaling-stroke');
  svg.append(p);
  return svg;
}

/** Icon button. world 'noir' → casino chip; 'bp' → drafting callout bubble. */
export function iconButton(name, { title, onClick, className = '', world = 'noir' } = {}) {
  const el = h('button', { type: 'button', title, 'aria-label': title, class: `${world === 'bp' ? 'bp-mark' : 'chip'} ${className}`.trim() }, icon(name));
  return withSound(el, onClick);
}

/** Embossed label tape. tone: '' | 'teal' | 'gold' | 'alarm' | 'blue'. rot in degrees. */
export function dymo(text, { tone = '', rot } = {}) {
  const el = h(`span.dymo${tone ? '.dymo--' + tone : ''}`, text);
  if (rot != null) el.style.setProperty('--rot', rot + 'deg');
  return el;
}

/** Rubber stamp. */
export function stamp(text, { tone = '', rot, animate = true } = {}) {
  const el = h(`span.stamp${tone ? '.stamp--' + tone : ''}${animate ? '.is-in' : ''}`, text);
  if (rot != null) el.style.setProperty('--rot', rot + 'deg');
  if (animate) setTimeout(() => sfx('stamp'), 60);
  return el;
}

/* ---------------- toast (label tape) ---------------- */
export function toast(msg, { kind = '', ms = 2800 } = {}) {
  const layer = document.getElementById('toast-layer');
  const tone = { gold: 'gold', alarm: 'alarm', cyan: 'blue', teal: 'teal' }[kind] || '';
  const t = dymo(msg, { tone, rot: (Math.random() * 3 - 1.5).toFixed(1) });
  t.classList.add('toast');
  layer.append(t);
  while (layer.children.length > 3) layer.firstChild.remove();
  setTimeout(() => { t.classList.add('is-out'); setTimeout(() => t.remove(), 240); }, ms);
  return t;
}

/* ---------------- modal ---------------- */
const openModals = [];
/**
 * openModal({ title, body, world: 'folder' | 'vellum', tab, className, onClose, dismissable })
 *  'folder' (default) = manila case file for the noir world; `tab` is the folder-tab label.
 *  'vellum'           = tracing paper taped over the blueprint.
 */
export function openModal({ title, body, world = 'folder', tab = 'File', className = '', onClose, dismissable = true } = {}) {
  const layer = document.getElementById('overlay-layer');
  const box = h('div', { class: `modal modal--${world} ${className}`.trim(), role: 'dialog', 'aria-modal': 'true' });
  const content = h('div.modal__body');
  if (title) content.append(h('h2.modal__title', { html: title }));
  if (body) content.append(...[].concat(body));

  const close = () => {
    const i = openModals.indexOf(api);
    if (i < 0) return;
    openModals.splice(i, 1);
    scrim.classList.add('is-closing');
    setTimeout(() => scrim.remove(), 170);
    onClose?.();
  };
  const closeBtn = dismissable ? iconButton('close', { title: 'Close', onClick: close, className: 'modal__close', world: world === 'vellum' ? 'bp' : 'noir' }) : null;

  if (world === 'folder') {
    const paper = h('div.modal__paper.tex-paper', content);
    if (closeBtn) paper.append(closeBtn);
    const clip = h('div.modal__clip', { html: '<svg viewBox="0 0 26 70" width="26" height="70"><path d="M8 62V14a5 5 0 0 1 10 0v44a8 8 0 0 1-16 0V8a11 11 0 0 1 22 0v40" fill="none" stroke="#8d9396" stroke-width="2.4" stroke-linecap="round"/></svg>' });
    box.append(h('div.modal__tab.tex-paper', tab), h('div.modal__sheet.tex-paper', clip, paper));
  } else {
    box.append(content);
    if (closeBtn) box.append(closeBtn);
  }

  const scrim = h('div.modal-scrim', box);
  if (dismissable) scrim.addEventListener('pointerdown', (e) => { if (e.target === scrim) close(); });
  layer.append(scrim);
  sfx('whoosh');
  const api = { close, el: box, body: content };
  openModals.push(api);
  return api;
}
export const modalOpen = () => openModals.length > 0;
addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && openModals.length) { e.stopPropagation(); openModals[openModals.length - 1].close(); }
}, true);

/* ---------------- settings (a typed form in a case file) ---------------- */
export function openSettings({ onReset, world = 'folder' } = {}) {
  const row = (key, label, sub) => {
    const box = h('span.check', { role: 'checkbox' });
    const isOn = () => (key === 'quality' ? S.settings().quality === 'high' : !!S.settings()[key]);
    const paint = () => { box.classList.toggle('is-on', isOn()); box.setAttribute('aria-checked', String(isOn())); };
    const el = h('label.form-row', box, h('div', h('b', label), h('small', sub)));
    el.addEventListener('click', (e) => {
      e.preventDefault();
      sfx('stamp');
      if (key === 'quality') S.setSetting('quality', isOn() ? 'low' : 'high');
      else S.setSetting(key, !isOn());
      paint();
    });
    paint();
    return el;
  };
  const resetBtn = button('Delete my progress', {
    variant: 'alarm', size: 'sm', cut: 'b',
    onClick: () => {
      if (!confirm('Delete all your jobs, money and Police level, and start again?')) return;
      S.reset();
      m.close();
      onReset?.();
    },
  });
  const m = openModal({
    title: '<em>Settings</em>',
    tab: 'Settings',
    world,
    className: 'settings-modal',
    body: [
      row('sound', 'Sound', 'Sound effects and rain.'),
      row('music', 'Music', 'Soft jazz music.'),
      row('typewriter', 'Typewriter text', 'Words appear one letter at a time.'),
      row('quality', 'Best graphics', '3D city and rain. Turn this off on a slow computer.'),
      row('unlockAll', 'Unlock every job', 'Play any job, in any order.'),
      h('div', { style: { marginTop: '22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' } },
        h('small', { style: { font: '400 14px/1.3 var(--f-body)', color: '#5b5343' } }, 'Your progress saves on this computer.'),
        resetBtn),
    ],
  });
  return m;
}
