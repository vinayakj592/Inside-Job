// The dossier: a manila case file that slides onto the table when you pick a target.
import { CREW } from '../../data/crew.js';
import { h, money } from '../../core/dom.js';
import { button, iconButton, dymo, stamp, icon } from '../../ui/index.js';
import * as S from '../../core/state.js';

const pad2 = (n) => String(n).padStart(2, '0');

export const STATUS_STAMP = {
  locked: { text: 'Locked', tone: 'ink' },
  available: { text: 'Open', tone: '' },
  progress: { text: 'Started', tone: '' },
  done: { text: 'Job done', tone: '' },
};

const WHO = Object.fromEntries(Object.entries(CREW).map(([k, c]) => [k, c.short]));
function crewNote(job) {
  const line = job.puzzles?.find((p) => p?.ask?.text)?.ask;
  if (!line) return null;
  return h('blockquote.ds__note', h('span.ds__label', 'The team says'), h('p', `“${line.text}”`), h('cite', `— ${WHO[line.who] || line.who}`));
}

/** Polaroid snapshots survive remounts: rendering one costs a full frame. */
const shots = new Map();

export function buildDossier(job, { status, index, total, city, onPlan, onReplay, onClose, onPrev, onNext }) {
  const jst = S.job(job.id);
  const solved = S.solvedCount(job.id);
  const stars = jst.stars || 0;
  const tools = String(job.sqlFocus || '').split('·').map((s) => s.trim()).filter(Boolean);
  const st = STATUS_STAMP[status] || STATUS_STAMP.available;
  const locked = status === 'locked';

  const img = h('img.ds-polaroid__img', { alt: `The target: ${job.target}` });
  const photo = h('figure.ds-polaroid', { dataset: { state: 'developing' } },
    h('div.ds-polaroid__frame', img, h('span.ds-polaroid__dev', 'loading…')),
    h('figcaption', job.target),
    h('div.ds__stamp', stamp(st.text, { tone: st.tone, rot: -9, animate: false })),
  );
  const cached = shots.get(job.id);
  if (cached) { img.src = cached; photo.dataset.state = 'ready'; }
  else if (city?.snapshot) {
    // let the fly-in animation start before we spend a frame on the snapshot
    setTimeout(async () => {
      try {
        const url = await city.snapshot(job.id, 520, 400);
        if (!url) { photo.dataset.state = 'none'; return; }
        shots.set(job.id, url);
        img.src = url;
        photo.dataset.state = 'ready';
      } catch (e) {
        console.warn('[hub] snapshot failed', e);
        photo.dataset.state = 'none';
      }
    }, 450);
  } else photo.dataset.state = 'none';

  const records = h('div.ds-records', { 'aria-label': `${solved} of 5 questions solved` },
    ...Array.from({ length: 5 }, (_, i) => h('span.check', { class: jst.solved[i] ? 'check is-on' : 'check' })));

  const starRow = h('div.ds-stars', { 'aria-label': `${stars} of 3 stars` },
    ...Array.from({ length: 3 }, (_, i) => h('span.ds-star', { class: i < stars ? 'ds-star is-on' : 'ds-star' }, icon('star'))));

  const takeVal = jst.take || job.take || 0;
  const plan = button(status === 'done' ? 'Play again' : solved > 0 ? 'Continue the job' : 'Start the job', {
    variant: 'gold', size: 'lg', cut: 'a', icon: locked ? 'lock' : 'play', disabled: locked, onClick: onPlan,
  });
  const replay = button('Watch the story again', { variant: 'link', onClick: onReplay });
  if (!job.briefing?.length) replay.hidden = true;

  const el = h('aside.ds', { role: 'dialog', 'aria-label': `Job ${job.number}: ${job.title}`, dataset: { status } },
    h('div.ds__tab.tex-paper', `Job ${job.number}`, h('small', `of ${total}`)),
    h('div.ds__sheet.tex-paper',
      h('div.ds__clip', { html: '<svg viewBox="0 0 26 70" width="22" height="60"><path d="M8 62V14a5 5 0 0 1 10 0v44a8 8 0 0 1-16 0V8a11 11 0 0 1 22 0v40" fill="none" stroke="#8d9396" stroke-width="2.6" stroke-linecap="round"/></svg>' }),
      h('div.ds__paper.tex-paper',
        h('div.ds__body',
          photo,
          h('div.ds__kicker', h('span', `Job ${job.number}`), h('i'), h('span', job.district || 'Port Vesper')),
          h('h2.ds__title', job.title),
          h('p.ds__target', h('span', 'Target'), job.target),
          h('p.ds__logline', job.logline || ''),
          h('div.ds__tools',
            h('div.ds__label', 'SQL you will use'),
            h('div.ds__tapes', ...tools.map((t, i) => dymo(t, { tone: i % 3 === 1 ? 'teal' : '', rot: ((i * 37) % 5) - 2 })))),
          h('div.ds__grid',
            h('div', h('div.ds__label', 'Questions solved'), records, h('div.ds__small', `${solved} of 5`)),
            h('div', h('div.ds__label', 'Stars'), starRow),
            h('div', h('div.ds__label', status === 'done' ? 'Money earned' : 'Reward'), h('div.ds__take', money(takeVal)))),
          crewNote(job),
          locked ? h('p.ds__locked', icon('lock'), `Finish Job ${job.number - 1} first.`) : null,
        ),
        h('div.ds__actions', plan, replay),
      ),
    ),
    h('div.ds__nav',
      iconButton('back', { title: 'Previous job', onClick: onPrev, className: index <= 0 ? 'is-off' : '' }),
      h('span.ds__navlabel', `${pad2(index + 1)} / ${pad2(total)}`),
      iconButton('next', { title: 'Next job', onClick: onNext, className: index >= total - 1 ? 'is-off' : '' }),
      iconButton('close', { title: 'Close', onClick: onClose, className: 'ds__close' }),
    ),
  );
  return { el, plan };
}
