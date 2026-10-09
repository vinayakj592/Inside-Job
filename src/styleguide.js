// Dev-only style tile: the reference every screen is built from. Open /styleguide.html
import './styles/fonts.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/ui.css';
import './styleguide.css';
import { h } from './core/dom.js';
import { button, iconButton, dymo, stamp, toast, openModal, openSettings } from './ui/index.js';

const stage = document.getElementById('stage');

const noir = h('section.sg-noir.tex-grain',
  h('div.sg-rain'),
  h('div.sg-col',
    dymo('World 01 · Noir', { tone: 'gold' }),
    h('h1.sg-h1.display.misreg-strong', 'Inside', h('br'), h('span', 'Job')),
    h('p.sg-lede', 'Every building keeps a record. ', h('em.accent', 'Read it.'), ' Rob it.'),
    h('div.sg-row', button('New heist', { variant: 'gold', size: 'lg' }), button('Continue', { variant: 'ink', cut: 'b' }), button('Safehouse', { variant: 'cream', cut: 'c' })),
    h('div.sg-row', iconButton('gear', { title: 'Settings', onClick: () => openSettings() }), iconButton('sound', { title: 'Sound' }), iconButton('book', { title: 'Manual' }), iconButton('home', { title: 'Home', className: 'chip--gold' })),
    h('div.sg-row', dymo('Job 03 · House Edge'), dymo('Heat 42', { tone: 'alarm', rot: 1 }), dymo('$120,000', { tone: 'teal', rot: -0.5 })),
    h('div.sg-tags',
      h('button.tag', h('b', 'Service lift'), 'Ride up with the laundry cart at 02:10.'),
      h('button.tag.is-picked', h('b', 'Roof hatch'), 'Drop into the dead camera’s office.'),
    ),
    h('div.sg-row', stamp('Job done', { animate: false, rot: -7 }), stamp('Blown', { tone: 'alarm', animate: false, rot: 5 })),
  ),
);

const bp = h('section.sg-bp',
  h('div.sg-col',
    dymo('World 02 · Blueprint', { tone: 'blue' }),
    h('div.sg-titleblock',
      h('div', h('small', 'Project'), h('b', 'Moretti Pawn & Loan')),
      h('div', h('small', 'Sheet'), h('b', 'A-101')),
      h('div', h('small', 'Scale'), h('b', '1:100')),
      h('div', h('small', 'Drawn'), h('b', 'The Architect')),
    ),
    h('h2.sg-h2.draft', 'Ground floor plan'),
    h('p.sg-note', 'cam 2 dead since March!'),
    h('div.sg-row', button('Run it', { variant: 'grease', size: 'lg', icon: 'play' }), button('Ask Juno', { variant: 'bp' }), button('Pull the file', { variant: 'bp', size: 'sm' })),
    h('div.sg-row', iconButton('book', { title: 'Field manual', world: 'bp' }), iconButton('history', { title: 'History', world: 'bp' }), iconButton('gear', { title: 'Settings', world: 'bp', onClick: () => openSettings({ world: 'vellum' }) })),
    h('pre.sg-sql', h('span.k', 'SELECT'), ' name, shift ', h('span.k', 'FROM'), ' staff\n', h('span.k', 'WHERE'), ' shift = ', h('span.s', "'night'"), ';'),
    h('div.sg-row',
      button('Open vellum', { variant: 'bp', size: 'sm', onClick: () => openModal({ world: 'vellum', title: 'Field manual', body: h('p', 'Tracing paper, taped over the drawing.') }) }),
      button('Open case file', { variant: 'link', onClick: () => openModal({ title: 'Case <em>file</em>', tab: 'Dossier', body: h('p', 'Typed on a manila sheet.') }) }),
      button('Toast', { variant: 'link', onClick: () => toast('Intel logged · cam 2 is dead', { kind: 'gold' }) }),
    ),
  ),
);

stage.append(h('div.sg-grid', noir, bp));
