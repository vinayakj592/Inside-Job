// JOB 01: The Record Book. Moretti's Pawn & Loan. Focus: SELECT · WHERE · ORDER BY · LIMIT · COUNT.
// Facts come from docs/STORY.md §Job 1; every intel line is checked against the data with
// `node scripts/verify-content.mjs --dump`.

const blueprint = {
  title: 'MORETTI PAWN & LOAN · GROUND FLOOR',
  scale: '1:100',
  layers: [
    { id: 'shell', label: 'Building shell', initial: true },
    { id: 'rooms', label: 'Rooms' },
    { id: 'staff', label: 'Night guard' },
    { id: 'cameras', label: 'Cameras' },
    { id: 'safe', label: 'Floor safe' },
    { id: 'entries', label: 'Entry points' },
  ],
  rooms: [
    { id: 'street', layer: 'shell', outdoor: true, name: 'Canal Street', x: 60, y: 580, w: 1080, h: 130 },
    { id: 'alley', layer: 'shell', outdoor: true, name: 'Alley', x: 900, y: 60, w: 150, h: 520 },
    { id: 'break', layer: 'rooms', name: 'Break room', x: 160, y: 140, w: 200, h: 100 },
    { id: 'stair', layer: 'rooms', name: 'Stair', x: 360, y: 140, w: 100, h: 100 },
    { id: 'hall', layer: 'rooms', name: 'Hall', x: 460, y: 140, w: 100, h: 100 },
    { id: 'show', layer: 'rooms', name: 'Showroom', x: 160, y: 240, w: 400, h: 280 },
    { id: 'office', layer: 'rooms', name: 'Back office', x: 560, y: 140, w: 340, h: 200 },
    { id: 'store', layer: 'rooms', name: 'Storeroom', x: 560, y: 340, w: 340, h: 180 },
  ],
  walls: [
    { layer: 'shell', x1: 160, y1: 140, x2: 900, y2: 140 },
    { layer: 'shell', x1: 900, y1: 140, x2: 900, y2: 520 },
    { layer: 'shell', x1: 900, y1: 520, x2: 160, y2: 520 },
    { layer: 'shell', x1: 160, y1: 520, x2: 160, y2: 140 },
    // showroom counter
    { layer: 'rooms', x1: 200, y1: 300, x2: 340, y2: 300 },
    // stair treads
    { layer: 'rooms', x1: 380, y1: 160, x2: 440, y2: 160 },
    { layer: 'rooms', x1: 380, y1: 180, x2: 440, y2: 180 },
    { layer: 'rooms', x1: 380, y1: 200, x2: 440, y2: 200 },
    { layer: 'rooms', x1: 380, y1: 220, x2: 440, y2: 220 },
  ],
  doors: [
    { layer: 'shell', x: 330, y: 520, w: 70, dir: 'h', label: 'Front' },
    { layer: 'shell', x: 900, y: 440, w: 50, dir: 'v', label: 'Alley door' },
    { layer: 'rooms', x: 230, y: 240, w: 50, dir: 'h' },
    { layer: 'rooms', x: 480, y: 240, w: 50, dir: 'h' },
    { layer: 'rooms', x: 460, y: 170, w: 40, dir: 'v' },
    { layer: 'rooms', x: 560, y: 160, w: 50, dir: 'v' },
    { layer: 'rooms', x: 560, y: 420, w: 50, dir: 'v' },
    { layer: 'rooms', x: 700, y: 340, w: 50, dir: 'h' },
  ],
  windows: [
    { layer: 'shell', x1: 180, y1: 520, x2: 310, y2: 520 },
    { layer: 'shell', x1: 420, y1: 520, x2: 540, y2: 520 },
    { layer: 'shell', x1: 900, y1: 200, x2: 900, y2: 270 },
  ],
  cameras: [
    { id: 'cam1', layer: 'cameras', x: 175, y: 505, dir: 320, fov: 80, range: 330, label: 'CAM 1' },
    { id: 'cam2', layer: 'cameras', x: 885, y: 155, dir: 145, fov: 70, range: 170, label: 'CAM 2 (broken)' },
    { id: 'cam3', layer: 'cameras', x: 1035, y: 380, dir: 147, fov: 44, range: 150, label: 'CAM 3' },
  ],
  guards: [
    { id: 'ruiz', layer: 'staff', name: 'F. Ruiz', path: [[220, 470], [505, 300], [505, 190], [640, 190], [725, 290], [725, 440], [590, 445], [470, 470]], loop: true, period: 14 },
  ],
  lasers: [],
  safes: [{ id: 'safe', layer: 'safe', x: 830, y: 250, r: 24, label: 'Floor safe', kind: 'safe' }],
  entries: [
    { id: 'front', layer: 'entries', x: 365, y: 548, label: 'Front door' },
    { id: 'roof', layer: 'entries', x: 650, y: 285, label: 'Roof hatch' },
    { id: 'alley', layer: 'entries', x: 950, y: 465, label: 'Alley door' },
  ],
  notes: [
    { layer: 'staff', x: 170, y: 118, text: 'Night guard: break at 01:30', rot: -2 },
    { layer: 'cameras', x: 600, y: 118, text: 'camera 2 is broken!', rot: 3 },
    { layer: 'safe', x: 770, y: 322, text: 'the record book', rot: -4 },
    { layer: 'entries', x: 572, y: 318, text: 'hatch opens here', rot: 2 },
  ],
  labels: [
    { layer: 'shell', x: 520, y: 552, text: 'SIDEWALK' },
  ],
};

export default {
  id: 'pawn', number: 1,
  title: 'The Record Book',
  target: "Moretti's Pawn & Loan",
  district: 'The Narrows',
  hubPos: { x: 0.16, y: 0.74 },
  take: 40000,
  sqlFocus: 'SELECT · WHERE · ORDER BY · LIMIT · COUNT',
  logline: 'A small pawn shop keeps Crane’s secret record book. We take the book.',

  briefing: [
    { layout: 'full', panels: [
      { shot: 'title-card', params: { kicker: 'Job 01 · The Narrows', title: 'The Record Book' } },
    ] },
    { layout: '4', panels: [
      { shot: 'city-establish', params: { building: 'Moretti\'s Pawn & Loan' }, caption: 'The Narrows. A small pawn shop on a wet street.' },
      { shot: 'crew-table', lines: [{ who: 'viv', text: 'The shop owner keeps a secret record book for Mr. Crane.' }, { who: 'viv', text: 'It lists every secret payment Crane makes.' }] },
      { shot: 'face', params: { who: 'viv', mood: 'tense' }, lines: [{ who: 'viv', text: 'I think Crane paid the judge at my trial. This book can prove it.' }] },
      { shot: 'blueprint-closeup', lines: [{ who: 'viv', text: 'Kim, our safe expert, will open the safe.' }, { who: 'juno', text: 'But first, Architect, read the shop’s records for us.' }] },
    ] },
  ],

  puzzles: [
    {
      title: 'All the Buildings',
      ask: { who: 'viv', text: 'Let’s start with the network, Architect. Show me every building on it.' },
      prompt: 'Show the id, name and district of every building in the buildings table.',
      sql: 'SELECT id, name, district FROM buildings;',
      orderMatters: false,
      hint: 'Use SELECT with 3 columns and no filter: SELECT id, name, district FROM buildings.',
      concepts: ['select'],
      reveals: ['rooms'],
      intel: 'There are 12 buildings on the network. Moretti’s Pawn & Loan is building 1, in The Narrows.',
      react: { who: 'dex', text: '12 buildings. I know the fastest road to every one.' },
    },
    {
      title: 'The Night Guard',
      ask: { who: 'otis', text: 'Who works at the pawn shop? I want the night guard and his break time.' },
      prompt: 'Show the name, role, shift and break_at of every staff member at building 1 (building_id = 1).',
      sql: 'SELECT name, role, shift, break_at FROM staff WHERE building_id = 1;',
      orderMatters: false,
      hint: 'The staff table has people from every building. Use WHERE building_id = 1 to keep this shop.',
      concepts: ['select', 'where'],
      reveals: ['staff'],
      intel: 'Frank Ruiz is the only night guard. His break is at 01:30.',
      react: { who: 'otis', text: 'A guard’s break is 30 minutes. So he is away until 02:00.' },
    },
    {
      title: 'The Cameras',
      ask: { who: 'juno', text: 'Which cameras are in the shop? And which ones work?' },
      prompt: 'Show the spot, model and working columns for cameras at building 1. Sort by spot, A to Z.',
      sql: 'SELECT spot, model, working FROM cameras WHERE building_id = 1 ORDER BY spot;',
      orderMatters: true,
      hint: 'Use WHERE building_id = 1, then ORDER BY spot. working = 0 means the camera is broken.',
      concepts: ['where', 'orderby'],
      reveals: ['cameras'],
      intel: 'There are 3 cameras. The showroom and alley door cameras work. The back office camera is broken (working = 0).',
      react: { who: 'juno', text: 'A broken camera in the back office. I like this shop.' },
    },
    {
      title: 'The Newest Item',
      ask: { who: 'viv', text: 'The shop lists everything in its safes. The book went in a few weeks ago. Find the newest item.' },
      prompt: 'Show the item, location and stored_at of the newest item at building 1. Show only 1 row.',
      sql: 'SELECT item, location, stored_at FROM valuables WHERE building_id = 1 ORDER BY stored_at DESC LIMIT 1;',
      orderMatters: true,
      hint: 'Use ORDER BY stored_at DESC to put the newest item first. Then LIMIT 1 keeps only that row.',
      concepts: ['orderby', 'limit'],
      reveals: ['safe'],
      intel: 'The newest item is the green ledger, Crane’s record book. It went into the back office floor safe on 2025-09-10.',
      react: { who: 'viv', text: 'That was 2 days before I left prison. He knew I was coming.' },
    },
    {
      title: 'Every Night the Same',
      ask: { who: 'otis', text: 'A break time on paper is not enough. Count how many times the guard used the break room door.' },
      prompt: "Count the rows in access_log where door is 'Break room'. Return one number in a column named breaks.",
      sql: "SELECT COUNT(*) AS breaks FROM access_log WHERE door = 'Break room';",
      orderMatters: false,
      hint: "COUNT(*) counts rows. Add WHERE door = 'Break room', and use AS breaks to name the column.",
      concepts: ['where', 'aggregate'],
      reveals: ['entries'],
      intel: 'The break room door has 7 entries. Frank Ruiz takes his 01:30 break every night.',
      react: { who: 'dex', text: '7 nights out of 7. He is never late.' },
    },
  ],

  blueprint,

  play: {
    question: 'How do we get in, and at what time?',
    options: [
      { id: 'front', label: 'Front door, 01:30', detail: 'Open the front door lock during the guard’s break.', route: [[365, 650], [365, 500], [470, 452], [600, 445], [725, 420], [725, 330], [812, 262]] },
      { id: 'alley', label: 'Alley door, 01:30', detail: 'Go in by the alley door, through the storeroom.', route: [[975, 650], [975, 465], [880, 465], [740, 420], [725, 330], [812, 262]] },
      { id: 'early', label: 'Roof hatch, 00:15', detail: 'Climb down into the back office early. Take our time.', route: [[650, 285], [740, 275], [812, 256]] },
      { id: 'roof', label: 'Roof hatch, 01:30', detail: 'Climb down into the back office during the guard’s break.', route: [[650, 285], [740, 275], [812, 256]] },
    ],
    answer: 'roof',
    why: 'The book is in the back office floor safe. The back office camera is broken. The guard is in the break room at 01:30 every night. The roof hatch takes us right into the back office.',
    wrong: {
      front: 'CAM 1 watches the showroom, and it works. It will see us.',
      alley: 'CAM 3 watches the alley door, and it works. It will see us.',
      early: 'At 00:15 the guard is still walking around the shop. He walks right under the hatch.',
    },
  },

  replay: {
    success: [
      { layout: '3b', panels: [
        { shot: 'rooftop', caption: '01:29. Rain on the roof of the pawn shop. We wait.' },
        { shot: 'clock', params: { time: '01:30' }, sfx: 'TIK' },
        { shot: 'guard-patrol', caption: 'The night guard goes to the break room. Right on time.' },
      ] },
      { layout: '2v', panels: [
        { shot: 'vent-crawl', sfx: 'KSSH', caption: 'The old roof hatch opens. We climb down.' },
        { shot: 'cctv-monitor', params: { label: 'CAM 2 · BACK OFFICE · NO SIGNAL' }, lines: [{ who: 'juno', text: 'Camera 2 is off. Nobody can see us.' }] },
      ] },
      { layout: '2h', panels: [
        { shot: 'safe-dial', sfx: 'CLICK', lines: [{ who: 'juno', text: 'The safe is open.' }] },
        { shot: 'loot', params: { item: 'The green record book' }, caption: 'The green record book. Crane’s name is on page 14.' },
      ] },
      { layout: 'full', panels: [
        { shot: 'getaway', sfx: 'VRRRM', lines: [{ who: 'dex', text: 'Everyone is in the car. We will be home by 02:00.' }] },
      ] },
    ],
    failure: [
      { layout: '2h', panels: [
        { shot: 'alarm', sfx: 'BRRRING', caption: 'A red light comes on. The alarm rings.' },
        { shot: 'car-interior', params: { who: 'dex' }, lines: [{ who: 'dex', text: 'Stop! Everybody out! We need a new plan, Architect.' }] },
      ] },
    ],
  },

  debrief: {
    headline: 'PAWN SHOP ROBBED, BUT NOTHING TAKEN, OWNER SAYS',
    line: { who: 'viv', text: 'He says nothing was taken. Crane knows that is not true.' },
  },

  after: [
    { layout: '4', panels: [
      { shot: 'street-rain', caption: 'Morning. There is police tape around the pawn shop.' },
      { shot: 'face', params: { who: 'calloway', mood: 'calm' }, caption: 'Detective Cole talks to the shop owner.', lines: [{ who: 'calloway', text: 'You say nothing was taken. So why are you so scared?' }] },
      { shot: 'loot', params: { item: 'The green record book, page 14' }, caption: 'Back at the garage, the team reads the book.', lines: [{ who: 'otis', text: 'Look, Vera. Page 14. Crane paid the judge at your trial.' }] },
      { shot: 'crew-table', lines: [{ who: 'dex', text: 'Our first job, and it was perfect!' }, { who: 'viv', text: 'This is our first proof. Keep it safe.' }] },
    ] },
    { layout: 'full', tint: 'gold', panels: [
      { shot: 'phone', params: { who: 'crane' }, caption: 'That night, in his tower, Mr. Crane gets a phone call.', lines: [{ who: 'crane', text: 'Vera has a team. Find out who they are.' }, { who: 'crane', text: 'Then find out what they love.' }] },
    ] },
  ],
};
