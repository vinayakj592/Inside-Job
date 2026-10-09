// Screen registry + transitions. See docs/DESIGN.md §5.1.
import { emit } from './bus.js';
import { sleep, reducedMotion } from './dom.js';

const screens = new Map();
let current = null; // { def, root, params }
let navigating = Promise.resolve();

export function register(def) {
  screens.set(def.id, def);
}

export const currentScreen = () => current?.def.id ?? null;

/**
 * Navigate to a screen.
 * @param {string} id
 * @param {object} params
 * @param {{transition?: 'fade'|'cut'|'wipe'|'none'}} opts
 */
export function go(id, params = {}, opts = {}) {
  navigating = navigating.then(() => swap(id, params, opts)).catch((e) => console.error('[router]', e));
  return navigating;
}

async function swap(id, params, { transition = 'fade' } = {}) {
  const def = screens.get(id);
  if (!def) throw new Error(`Unknown screen: ${id}`);
  const stage = document.getElementById('stage');
  const fast = reducedMotion();

  let wipe = null;
  if (transition === 'wipe' && !fast) {
    wipe = document.createElement('div');
    wipe.className = 'wipe is-in';
    document.body.append(wipe);
    await sleep(320);
  }

  if (current) {
    const old = current;
    current = null;
    try { old.def.unmount?.(); } catch (e) { console.error(`[router] unmount ${old.def.id}`, e); }
    if (transition === 'fade' && !fast) {
      old.root.classList.add('is-leaving');
      await sleep(190);
    }
    old.root.remove();
  }

  const root = document.createElement('section');
  root.className = `screen scr-${id}`;
  root.dataset.screen = id;
  if (transition === 'fade') root.classList.add('is-entering');
  stage.append(root);
  current = { def, root, params };
  document.body.dataset.screen = id;
  emit('screen', { id, params });

  try {
    await def.mount(root, params);
  } catch (e) {
    console.error(`[router] mount ${id}`, e);
  }

  if (wipe) {
    wipe.className = 'wipe is-out';
    setTimeout(() => wipe.remove(), 400);
  }
  setTimeout(() => root.classList.remove('is-entering'), 400);
}
