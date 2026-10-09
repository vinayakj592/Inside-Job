// JOB 02: The Painting. Galerie Lumière opening gala. Focus: DISTINCT · LIKE · IN · BETWEEN · AND/OR.
// Facts come from docs/STORY.md §Job 2; every intel line is checked against the data with
// `node scripts/verify-content.mjs --dump --job gallery`.

const blueprint = {
  title: 'GALERIE LUMIÈRE · GROUND & FIRST FLOOR',
  scale: '1:150',
  layers: [
    { id: 'shell', label: 'Building shell', initial: true },
    { id: 'badge', label: 'Badge readers' },
    { id: 'art', label: 'The paintings' },
    { id: 'cameras', label: 'Cameras' },
    { id: 'staff', label: 'Guards' },
    { id: 'entries', label: 'Ways out' },
  ],
  rooms: [
    { id: 'street', layer: 'shell', outdoor: true, name: 'Rue Lumière', x: 60, y: 600, w: 1080, h: 110 },
    { id: 'lane', layer: 'shell', outdoor: true, name: 'Service lane', x: 985, y: 40, w: 150, h: 560 },
    { id: 'west', layer: 'shell', name: 'West Hall', x: 120, y: 90, w: 240, h: 290 },
    { id: 'atrium', layer: 'shell', name: 'Atrium', x: 360, y: 90, w: 280, h: 370 },
    { id: 'east', layer: 'shell', name: 'East Hall', x: 640, y: 90, w: 240, h: 240 },
    { id: 'dock', layer: 'shell', outdoor: false, name: 'Loading dock', x: 880, y: 90, w: 80, h: 240 },
    { id: 'corridor', layer: 'shell', name: 'Service corridor', x: 640, y: 330, w: 320, h: 70 },
    { id: 'kitchen', layer: 'shell', name: 'Kitchen', x: 760, y: 400, w: 200, h: 160 },
    { id: 'cloak', layer: 'shell', name: 'Cloakroom', x: 640, y: 400, w: 120, h: 160 },
    { id: 'lobby', layer: 'shell', name: 'Front doors', x: 360, y: 460, w: 280, h: 100 },
    { id: 'staffroom', layer: 'shell', name: 'Staff room', x: 120, y: 380, w: 240, h: 180 },
  ],
  walls: [
    { layer: 'shell', x1: 120, y1: 90, x2: 960, y2: 90 },
    { layer: 'shell', x1: 960, y1: 90, x2: 960, y2: 560 },
    { layer: 'shell', x1: 960, y1: 560, x2: 120, y2: 560 },
    { layer: 'shell', x1: 120, y1: 560, x2: 120, y2: 90 },
    // atrium bar counter
    { layer: 'shell', x1: 390, y1: 400, x2: 450, y2: 400 },
    // kitchen pass and range
    { layer: 'shell', x1: 790, y1: 440, x2: 840, y2: 440 },
    { layer: 'shell', x1: 790, y1: 530, x2: 850, y2: 530 },
    // cloakroom rail
    { layer: 'shell', x1: 670, y1: 430, x2: 670, y2: 500 },
  ],
  stairs: [
    { layer: 'shell', x: 380, y: 110, w: 60, h: 110, dir: 'n', label: 'TO HALLS' },
  ],
  doors: [
    { layer: 'shell', x: 460, y: 560, w: 80, dir: 'h' },
    { layer: 'shell', x: 470, y: 460, w: 60, dir: 'h' },
    { layer: 'shell', x: 170, y: 560, w: 50, dir: 'h', label: 'Staff entrance' },
    { layer: 'shell', x: 360, y: 400, w: 40, dir: 'v' },
    { layer: 'shell', x: 360, y: 210, w: 60, dir: 'v' },
    { layer: 'shell', x: 640, y: 180, w: 60, dir: 'v' },
    { layer: 'shell', x: 640, y: 345, w: 40, dir: 'v' },
    { layer: 'shell', x: 825, y: 330, w: 45, dir: 'h' },
    { layer: 'shell', x: 895, y: 330, w: 50, dir: 'h' },
    { layer: 'shell', x: 960, y: 170, w: 80, dir: 'v' },
    { layer: 'shell', x: 860, y: 400, w: 50, dir: 'h' },
    { layer: 'shell', x: 960, y: 470, w: 50, dir: 'v' },
    { layer: 'shell', x: 640, y: 505, w: 40, dir: 'v' },
  ],
  windows: [
    { layer: 'shell', x1: 380, y1: 560, x2: 440, y2: 560 },
    { layer: 'shell', x1: 560, y1: 560, x2: 620, y2: 560 },
    { layer: 'shell', x1: 250, y1: 560, x2: 330, y2: 560 },
    { layer: 'shell', x1: 120, y1: 440, x2: 120, y2: 510 },
    { layer: 'shell', x1: 120, y1: 130, x2: 120, y2: 190 },
    { layer: 'shell', x1: 120, y1: 280, x2: 120, y2: 340 },
  ],
  cameras: [
    { id: 'cam-front', layer: 'cameras', x: 378, y: 510, dir: 0, fov: 30, range: 200, label: 'Front doors' },
    { id: 'cam-atrium', layer: 'cameras', x: 625, y: 105, dir: 130, fov: 60, range: 250, label: 'Atrium' },
    { id: 'cam-stair', layer: 'cameras', x: 625, y: 445, dir: 235, fov: 26, range: 350, label: 'Main stair' },
    { id: 'cam-west', layer: 'cameras', x: 345, y: 105, dir: 135, fov: 60, range: 230, label: 'West Hall' },
    { id: 'cam-corr', layer: 'cameras', x: 945, y: 365, dir: 180, fov: 12, range: 290, label: 'Corridor (broken)' },
    { id: 'cam-dock', layer: 'cameras', x: 920, y: 100, dir: 90, fov: 20, range: 225, label: 'Loading dock' },
  ],
  guards: [
    { id: 'pell', layer: 'staff', name: 'H. Pell', path: [[665, 125], [750, 125], [750, 300], [665, 300]], loop: true, period: 16 },
    { id: 'lind', layer: 'staff', name: 'R. Lind', path: [[400, 480], [600, 480], [600, 540], [400, 540]], loop: true, period: 12 },
    { id: 'brecht', layer: 'staff', name: 'C. Brecht', path: [[895, 125], [945, 125], [945, 300], [895, 300]], loop: true, period: 14 },
  ],
  lasers: [
    { layer: 'cameras', x1: 460, y1: 130, x2: 595, y2: 130 },
    { layer: 'cameras', x1: 460, y1: 150, x2: 595, y2: 150 },
    { layer: 'cameras', x1: 460, y1: 170, x2: 595, y2: 170 },
  ],
  safes: [
    { id: 'harbour', layer: 'art', x: 850, y: 205, r: 22, label: 'The Drowned Harbour', kind: 'safe' },
    { id: 'study', layer: 'art', x: 240, y: 150, r: 16, label: 'Harbour Study No. 3', kind: 'safe' },
  ],
  entries: [
    { id: 'front', layer: 'entries', x: 505, y: 584, label: 'Front doors' },
    { id: 'dock', layer: 'entries', x: 1010, y: 210, label: 'Loading dock' },
    { id: 'kitchen', layer: 'entries', x: 1010, y: 495, label: 'Kitchen door' },
  ],
  notes: [
    { layer: 'badge', x: 990, y: 548, text: 'no badge reader!', rot: -3 },
    { layer: 'art', x: 765, y: 112, text: 'the real one', rot: -4 },
    { layer: 'art', x: 170, y: 300, text: 'wrong painting', rot: 3 },
    { layer: 'cameras', x: 655, y: 392, text: 'camera broken', rot: -2 },
    { layer: 'staff', x: 650, y: 76, text: 'Guard: break at 21:10', rot: -2 },
    { layer: 'entries', x: 775, y: 505, text: 'Ruby = Mara Duval', rot: -3 },
  ],
  labels: [
    { layer: 'shell', x: 760, y: 586, text: 'SIDEWALK' },
    { layer: 'cameras', x: 528, y: 194, text: 'SKYLIGHT' },
    { layer: 'art', x: 755, y: 322, text: 'PRESSURE PLATES' },
    { layer: 'badge', x: 600, y: 586, text: 'READER' },
    { layer: 'badge', x: 195, y: 586, text: 'READER' },
    { layer: 'badge', x: 1050, y: 165, text: 'READER' },
    { layer: 'badge', x: 700, y: 352, text: 'READER' },
  ],
};

export default {
  id: 'gallery', number: 2,
  title: 'The Painting',
  target: 'Galerie Lumière',
  district: 'Old Quarter',
  hubPos: { x: 0.34, y: 0.50 },
  take: 90000,
  sqlFocus: 'DISTINCT · LIKE · IN · BETWEEN · AND/OR',
  logline: 'Crane’s favourite painting hangs at a big party. We take it.',

  briefing: [
    { layout: 'full', panels: [
      { shot: 'title-card', params: { kicker: 'Job 02 · Old Quarter', title: 'The Painting' } },
    ] },
    { layout: '4', panels: [
      { shot: 'gala-crowd', caption: 'Galerie Lumière, an art gallery. Tonight there is a big party here.' },
      { shot: 'face', params: { who: 'viv', mood: 'calm' }, lines: [{ who: 'viv', text: 'Crane’s favourite painting hangs here. It is called The Drowned Harbour.' }, { who: 'viv', text: 'He hides bank papers behind it. We want those papers.' }] },
      { shot: 'two-shot', params: { a: 'juno', b: 'lena' }, lines: [{ who: 'juno', text: 'I painted a copy. We take the real one and hang my copy.' }, { who: 'lena', text: 'And I will be a caterer. I serve food, and nobody looks at me.' }] },
      { shot: 'silhouette-reveal', params: { who: 'crane' }, caption: 'Mr. Crane will be at the party. He gives a speech at 21:00.' },
    ] },
  ],

  puzzles: [
    {
      title: 'Badge Doors',
      ask: { who: 'juno', text: 'Some doors have badge readers. Each one sends a record to the network. Which doors are they?' },
      prompt: 'List each door at building 2 in access_log, with no repeats, as one column named door. Sort A to Z.',
      sql: 'SELECT DISTINCT door FROM access_log WHERE building_id = 2 ORDER BY door;',
      orderMatters: true,
      hint: 'Each badge swipe is one row, so doors repeat. Use SELECT DISTINCT door to remove repeats. Then WHERE, then ORDER BY.',
      concepts: ['distinct', 'where', 'orderby'],
      reveals: ['badge'],
      intel: '4 doors use badges: Front doors, Loading dock, Service corridor, Staff entrance. The kitchen door has no badge reader.',
      react: { who: 'juno', text: 'No reader on the kitchen door. Nobody will know when it opens.' },
    },
    {
      title: 'Two Harbour Paintings',
      ask: { who: 'viv', text: 'Crane’s painting has the word “Harbour” in its name. Find every item with that word.' },
      prompt: 'Show the item, location, owner and value from valuables for every item with the word Harbour in its name.',
      sql: "SELECT item, location, owner, value FROM valuables WHERE item LIKE '%Harbour%';",
      orderMatters: false,
      hint: "Use LIKE with % on both sides. It finds the word anywhere in the name: WHERE item LIKE '%Harbour%'.",
      concepts: ['like'],
      reveals: ['art'],
      intel: 'The Drowned Harbour is owned by Crane Holdings. It is worth $1,200,000 and hangs in the East Hall.',
      react: { who: 'juno', text: 'There are 2 Harbour paintings. The one in the West Hall is the wrong one.' },
    },
    {
      title: 'Cameras on the Exits',
      ask: { who: 'dex', text: 'We have 4 ways out: front, corridor, dock and kitchen. Which ones have working cameras?' },
      prompt: "Show spot and working for cameras at building 2 in these spots: 'Front doors', 'Service corridor', 'Loading dock', 'Kitchen door'. Sort by spot, A to Z.",
      sql: "SELECT spot, working FROM cameras WHERE building_id = 2 AND spot IN ('Front doors', 'Service corridor', 'Loading dock', 'Kitchen door') ORDER BY spot;",
      orderMatters: true,
      hint: "Use IN ('Front doors', 'Service corridor', …) instead of 4 ORs. Add building_id = 2 with AND.",
      concepts: ['where', 'inlist', 'andor', 'orderby'],
      reveals: ['cameras'],
      intel: 'The front doors and loading dock cameras work. The corridor camera is broken, and the kitchen door has no camera.',
      react: { who: 'dex', text: 'We asked for 4 spots and got 3 rows. Nobody watches the kitchen door.' },
    },
    {
      title: 'Breaks During the Speech',
      ask: { who: 'otis', text: 'Crane speaks from 21:00 to 21:30. Guards still take their breaks. Who is away then?' },
      prompt: "Show name, role, post and break_at for staff at building 2 with break_at between '21:00' and '21:30'. Sort by break_at, earliest first.",
      sql: "SELECT name, role, post, break_at FROM staff WHERE building_id = 2 AND break_at BETWEEN '21:00' AND '21:30' ORDER BY break_at;",
      orderMatters: true,
      hint: "Use BETWEEN '21:00' AND '21:30'. It includes both times. Add building_id = 2 with AND.",
      concepts: ['between', 'andor', 'orderby'],
      reveals: ['staff'],
      intel: 'The East Hall guard, Henri Pell, goes on break at 21:10. The Atrium bartender, June Okoro, goes at 21:30.',
      react: { who: 'otis', text: 'A break is 30 minutes. From 21:10, nobody guards the East Hall.' },
    },
    {
      title: 'A New Face',
      ask: { who: 'lena', text: 'Find me a new caterer or bartender to play. She must be new, so nobody knows her face.' },
      prompt: "Show name, role and hired for staff at building 2. Keep only a Caterer or Bartender hired on or after '2025-10-01'.",
      sql: "SELECT name, role, hired FROM staff WHERE building_id = 2 AND (role = 'Caterer' OR role = 'Bartender') AND hired >= '2025-10-01';",
      orderMatters: false,
      hint: "Put the OR inside brackets: building_id = 2 AND (role = 'Caterer' OR role = 'Bartender') AND hired >= '2025-10-01'.",
      concepts: ['where', 'andor'],
      reveals: ['entries'],
      intel: 'Only one person is new: Mara Duval, a caterer, hired 2025-10-06. Tonight, Ruby will be Mara.',
      react: { who: 'lena', text: 'Mara started only 5 days ago. Nobody knows her face yet.' },
    },
  ],

  blueprint,

  play: {
    question: 'How do we get the painting out of the party?',
    options: [
      { id: 'front', label: 'Front doors, 21:10', detail: 'Ruby walks out with it under her coat during the speech.', route: [[850, 232], [700, 215], [600, 215], [520, 330], [505, 470], [500, 650]] },
      { id: 'cart', label: 'Food cart, 21:10', detail: 'Ruby’s food cart goes from the East Hall to the kitchen door.', route: [[850, 232], [848, 365], [885, 365], [885, 460], [1060, 495]] },
      { id: 'early', label: 'Food cart, 20:40', detail: 'The same cart, 30 minutes early, before the room is full.', route: [[850, 232], [848, 365], [885, 365], [885, 460], [1060, 495]] },
      { id: 'dock', label: 'Loading dock, 21:10', detail: 'Put it in a box and send it out with the trucks.', route: [[850, 232], [848, 365], [920, 365], [920, 210], [1060, 210]] },
    ],
    answer: 'cart',
    why: 'The real painting is in the East Hall. At 21:10 its guard is on break. The corridor camera is broken. The kitchen door has no camera and no badge reader. Ruby is the new caterer, so her cart looks normal.',
    wrong: {
      front: 'The front doors camera works. And a big painting under a coat is easy to see.',
      early: 'At 20:40 the East Hall guard is still there. His break starts at 21:10.',
      dock: 'The loading dock camera works. It will see the box.',
    },
  },

  replay: {
    success: [
      { layout: '3a', panels: [
        { shot: 'gala-crowd', caption: '21:00. Music, drinks, and Mr. Crane at the microphone.' },
        { shot: 'two-shot', params: { a: 'lena', b: 'crane' }, lines: [{ who: 'lena', text: 'Some food, Mr. Crane?' }, { who: 'crane', text: 'Thank you.' }] },
        { shot: 'clock', params: { time: '21:10' }, sfx: 'TIK' },
      ] },
      { layout: '3b', panels: [
        { shot: 'guard-patrol', caption: 'The East Hall guard looks at his watch. He goes on his break.' },
        { shot: 'face', params: { who: 'juno', mood: 'tense' }, lines: [{ who: 'juno', text: 'The floor has an alarm. I will stop it. Now go!' }] },
        { shot: 'loot', params: { item: 'The Drowned Harbour' }, sfx: 'SHNK', caption: '12 seconds. The real painting comes down. Kim’s copy goes up.' },
      ] },
      { layout: '2v', panels: [
        { shot: 'corridor-camera', caption: 'The service corridor. The broken camera sees nothing.' },
        { shot: 'street-rain', sfx: 'CREAK', caption: 'The kitchen door opens to the lane. No alarm. Only rain.' },
      ] },
      { layout: '2h', panels: [
        { shot: 'getaway', lines: [{ who: 'dex', text: 'The painting is in the van. Let’s go!' }] },
        { shot: 'gala-crowd', caption: 'Inside, Crane smiles at his painting. It is Kim’s copy.' },
      ] },
    ],
    failure: [
      { layout: '2h', panels: [
        { shot: 'alarm', sfx: 'BRRRING', caption: 'A camera sees us. A guard turns. The music stops.' },
        { shot: 'car-interior', params: { who: 'dex' }, lines: [{ who: 'dex', text: 'Leave the painting and run! We need a new plan, Architect.' }] },
      ] },
    ],
  },

  debrief: {
    headline: 'GREAT NIGHT AT THE GALLERY, GUESTS SAY',
    line: { who: 'viv', text: 'Crane is looking at a copy now. He does not know it yet.' },
  },

  after: [
    { layout: '4', panels: [
      { shot: 'gala-crowd', caption: '23:00. Crane stops in front of his painting. He looks for a long time.' },
      { shot: 'face', params: { who: 'crane', mood: 'tense' }, lines: [{ who: 'crane', text: 'The paint is still wet. This is not my painting.' }] },
      { shot: 'loot', params: { item: 'Bank papers: CH Group' }, caption: 'At the garage, the team finds the papers behind the painting.' },
      { shot: 'face', params: { who: 'viv', mood: 'smirk' }, lines: [{ who: 'viv', text: 'The papers name a company: CH Group. It is Crane’s secret company.' }, { who: 'viv', text: 'Now he knows about us. Be careful.' }] },
    ] },
    { layout: '3b', tint: 'ink', panels: [
      { shot: 'car-interior', params: { who: 'dex' }, caption: '3 nights later. Late at night. Dex is alone in the garage.' },
      { shot: 'phone', params: { who: 'dex' }, lines: [{ who: 'dex', text: 'Hello? Who is this?' }] },
      { shot: 'silhouette-reveal', params: { who: 'crane' }, lines: [{ who: 'crane', text: 'Good evening, Dex. I own your sister’s garage.' }, { who: 'crane', text: 'And I know about your money problems. Let’s talk.' }] },
    ] },
  ],
};
