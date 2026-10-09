// Tiny pub/sub. on() returns an unsubscribe function.
const handlers = new Map();

export function on(evt, fn) {
  if (!handlers.has(evt)) handlers.set(evt, new Set());
  handlers.get(evt).add(fn);
  return () => handlers.get(evt)?.delete(fn);
}

export function emit(evt, payload) {
  handlers.get(evt)?.forEach((fn) => {
    try { fn(payload); } catch (e) { console.error(`[bus] ${evt}`, e); }
  });
}
