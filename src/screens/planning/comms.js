// Crew comms: a radio log on the desk with the speaker's Polaroid taped over the table edge.
// Lines type themselves out (typewriter setting); click the log to finish a line.
import { h, sleep, reducedMotion } from '../../core/dom.js';
import { sfx } from '../../core/audio.js';
import * as S from '../../core/state.js';
import { CREW } from '../../data/crew.js';
import { portrait } from '../../art/portraits.js';

const KIND_LABEL = { ask: 'asks', react: 'says', hint: 'hint', sys: 'info', warn: 'warning', play: 'your choice' };

export function createComms() {
  const stack = h('div.pl-polaroids');
  const log = h('div.pl-comms__log', { 'aria-live': 'polite' });
  const meter = h('span.pl-comms__meter', ...Array.from({ length: 7 }, () => h('i')));
  const el = h('section.pl-comms',
    stack,
    h('header.pl-comms__head',
      h('span.pl-comms__ch', 'Team chat'),
      h('span.pl-comms__freq', 'CH 07 · 462.575'),
      meter),
    log);

  let typing = null; // { finish }
  let current = null;
  let queue = Promise.resolve();
  let alive = true;

  log.addEventListener('click', () => typing?.finish());

  function polaroid(who, mood) {
    if (current?.who === who && current?.mood === mood) return;
    const crew = CREW[who] || { short: who, accent: 'cyan' };
    let art;
    try { art = portrait(who, { mood, size: 120 }); } catch { art = h('div'); }
    const rot = (Math.random() * 6 - 3 - 2).toFixed(1);
    const p = h('figure.pl-polaroid', { style: { '--rot': rot + 'deg' }, dataset: { accent: crew.accent || 'cyan' } },
      h('i.pl-polaroid__tape'),
      h('div.pl-polaroid__img', art),
      h('figcaption', crew.short || crew.name || who));
    stack.append(p);
    if (stack.children.length > 3) stack.firstChild.remove();
    [...stack.children].forEach((c, i, arr) => c.classList.toggle('is-under', i < arr.length - 1));
    current = { who, mood };
  }

  /** Queue a line. Resolves when it's fully on screen. */
  function say(who, text, { mood = 'calm', kind = 'ask' } = {}) {
    queue = queue.then(() => alive && sayNow(who, text, { mood, kind }));
    return queue;
  }

  async function sayNow(who, text, { mood, kind }) {
    const crew = CREW[who] || { short: who, accent: 'cyan' };
    polaroid(who, mood);
    [...log.children].forEach((m) => m.classList.add('is-old'));
    while (log.children.length > 3) log.firstChild.remove();
    const body = h('span.pl-msg__txt');
    const msg = h(`div.pl-msg.is-${kind}`, { dataset: { accent: crew.accent || 'cyan' } },
      h('span.pl-msg__who', (crew.short || who).toUpperCase(), h('small', KIND_LABEL[kind] || '')),
      body);
    log.append(msg);
    log.scrollTop = log.scrollHeight;
    sfx('click');
    const typewriter = S.settings().typewriter && !reducedMotion();
    if (!typewriter) { body.textContent = text; return; }
    el.classList.add('is-live');
    let i = 0;
    let done = false;
    await new Promise((resolve) => {
      typing = { finish: () => { done = true; } };
      const tick = () => {
        if (!alive) return resolve();
        if (done) i = text.length;
        i = Math.min(text.length, i + (text[i] === ' ' ? 2 : 1));
        body.textContent = text.slice(0, i);
        if (i % 3 === 0) sfx('type');
        log.scrollTop = log.scrollHeight;
        if (i >= text.length) return resolve();
        setTimeout(tick, /[.,!?—]/.test(text[i - 1]) ? 90 : 20);
      };
      tick();
    });
    typing = null;
    el.classList.remove('is-live');
    await sleep(80);
  }

  /** Earlier lines on the channel, placed instantly (no typing, no Polaroid swap). */
  function history(lines) {
    for (const { who, text, kind = 'react' } of lines) {
      const crew = CREW[who] || { short: who, accent: 'cyan' };
      log.append(h(`div.pl-msg.is-${kind}.is-old`, { dataset: { accent: crew.accent || 'cyan' } },
        h('span.pl-msg__who', (crew.short || who).toUpperCase(), h('small', KIND_LABEL[kind] || '')),
        h('span.pl-msg__txt', text)));
    }
    while (log.children.length > 3) log.firstChild.remove();
  }

  return {
    el,
    say,
    history,
    clear() { log.replaceChildren(); },
    destroy() { alive = false; },
  };
}
