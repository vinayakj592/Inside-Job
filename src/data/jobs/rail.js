// JOB 04: Night Freight. The bearer-bond run out of the Vesper rail yard.
// Focus: HAVING · 3-table JOINs · multi-column GROUP BY.
// Facts come from docs/STORY.md §Job 4; every intel line is checked against the data with
// `node scripts/verify-content.mjs --dump --job rail`.
// Spy clue: P5 shows Dex's own car at the yard gate before the job.
// Midpoint: the after-beat ends with Crane calling the hideout. Text follows docs/WRITING.md.

const blueprint = {
  title: 'VESPER RAIL YARD · SITE PLAN',
  scale: '1:1000',
  layers: [
    { id: 'shell', label: 'Yard and tracks', initial: true },
    { id: 'routes', label: 'RC-12 route' },
    { id: 'cargo', label: 'The bonds' },
    { id: 'staff', label: 'Night staff' },
    { id: 'cameras', label: 'Cameras' },
    { id: 'gate', label: 'Gate log' },
  ],
  rooms: [
    { id: 'road', layer: 'shell', outdoor: true, name: 'Ironside Road', x: 40, y: 660, w: 1120, h: 70 },
    { id: 'yard', layer: 'shell', outdoor: true, name: 'Vesper Rail Yard', poly: [[60, 70], [990, 70], [990, 630], [60, 630]] },
    // tracks: thin outdoor strips read as rails
    { id: 'p1', layer: 'shell', outdoor: true, name: 'Platform 1', x: 60, y: 228, w: 640, h: 14 },
    { id: 'p2', layer: 'shell', outdoor: true, name: 'Platform 2', x: 60, y: 318, w: 700, h: 14 },
    { id: 'points', layer: 'shell', outdoor: true, name: 'Points', poly: [[700, 228], [770, 318], [770, 332], [700, 242]] },
    { id: 'main', layer: 'shell', outdoor: true, name: 'Harbour line →', x: 760, y: 318, w: 430, h: 14 },
    { id: 'siding', layer: 'shell', outdoor: true, name: 'East siding', poly: [[640, 228], [880, 104], [892, 118], [652, 242]] },
    // buildings
    { id: 'shed', layer: 'shell', outdoor: false, name: 'Loading platform', x: 200, y: 180, w: 420, h: 200 },
    { id: 'office', layer: 'shell', outdoor: false, name: 'Platform office', x: 200, y: 380, w: 170, h: 80 },
    { id: 'booth', layer: 'shell', outdoor: false, name: 'Main gate', x: 150, y: 565, w: 85, h: 60 },
    { id: 'tower', layer: 'shell', outdoor: false, name: 'Switch tower', x: 710, y: 400, w: 110, h: 80 },
    { id: 'box9', layer: 'shell', outdoor: false, name: 'Signal box 9', x: 1030, y: 350, w: 120, h: 60 },
  ],
  walls: [
    // buffer stop at the end of the siding
    { layer: 'shell', x1: 876, y1: 100, x2: 898, y2: 124 },
    // platform edges inside the shed
    { layer: 'shell', x1: 240, y1: 258, x2: 300, y2: 258 },
    { layer: 'shell', x1: 520, y1: 258, x2: 580, y2: 258 },
    { layer: 'shell', x1: 240, y1: 302, x2: 300, y2: 302 },
    { layer: 'shell', x1: 520, y1: 302, x2: 580, y2: 302 },
  ],
  doors: [
    // track portals through the shed
    { layer: 'shell', x: 200, y: 222, w: 26, dir: 'v' },
    { layer: 'shell', x: 200, y: 312, w: 26, dir: 'v' },
    { layer: 'shell', x: 620, y: 222, w: 26, dir: 'v' },
    { layer: 'shell', x: 620, y: 312, w: 26, dir: 'v' },
    { layer: 'shell', x: 260, y: 380, w: 40, dir: 'h' },
    { layer: 'shell', x: 220, y: 460, w: 40, dir: 'h' },
    { layer: 'shell', x: 235, y: 580, w: 30, dir: 'v' },
    { layer: 'shell', x: 750, y: 480, w: 40, dir: 'h' },
    { layer: 'shell', x: 1150, y: 365, w: 30, dir: 'v' },
    { layer: 'shell', x: 1060, y: 350, w: 40, dir: 'h' },
  ],
  windows: [
    { layer: 'shell', x1: 300, y1: 180, x2: 360, y2: 180 },
    { layer: 'shell', x1: 460, y1: 180, x2: 520, y2: 180 },
    { layer: 'shell', x1: 300, y1: 460, x2: 350, y2: 460 },
    { layer: 'shell', x1: 170, y1: 565, x2: 215, y2: 565 },
    { layer: 'shell', x1: 710, y1: 420, x2: 710, y2: 460 },
    { layer: 'shell', x1: 820, y1: 420, x2: 820, y2: 460 },
    { layer: 'shell', x1: 1030, y1: 365, x2: 1030, y2: 395 },
  ],
  cameras: [
    { id: 'gate-booth', layer: 'cameras', x: 232, y: 570, dir: 40, fov: 50, range: 100, label: 'Gate booth' },
    { id: 'gate-road', layer: 'cameras', x: 345, y: 650, dir: 185, fov: 30, range: 160, label: 'Gate road' },
    { id: 'p1', layer: 'cameras', x: 215, y: 212, dir: 0, fov: 8, range: 390, label: 'P1' },
    { id: 'p2', layer: 'cameras', x: 605, y: 345, dir: 180, fov: 8, range: 390, label: 'P2' },
    { id: 'office', layer: 'cameras', x: 215, y: 395, dir: 40, fov: 60, range: 80, label: 'Office cam' },
    { id: 'tower', layer: 'cameras', x: 725, y: 405, dir: 260, fov: 50, range: 150, label: 'Tower cam' },
    { id: 'box9', layer: 'cameras', x: 1040, y: 360, dir: 190, fov: 40, range: 150, label: 'Box 9 (dead)' },
    { id: 'siding', layer: 'cameras', x: 905, y: 95, dir: 155, fov: 40, range: 170, label: 'East siding (dead)' },
  ],
  guards: [
    { id: 'rc12', layer: 'routes', name: 'RC-12', path: [[470, 325], [760, 325], [1185, 325]], loop: false, period: 10 },
    { id: 'gate', layer: 'staff', name: 'Gate · 3', path: [[250, 555], [330, 555], [330, 615], [250, 615]], loop: true, period: 10 },
    { id: 'outer', layer: 'staff', name: 'Kline · Hask', path: [[230, 200], [590, 200], [590, 350], [230, 350]], loop: true, period: 20 },
    { id: 'inner', layer: 'staff', name: 'Pike · Achebe', path: [[330, 265], [500, 265], [500, 295], [330, 295]], loop: true, period: 12 },
  ],
  lasers: [],
  safes: [
    { id: 'rc12', layer: 'cargo', x: 440, y: 325, r: 20, label: 'Bonds', kind: 'vault' },
  ],
  entries: [
    { id: 'gate', layer: 'gate', x: 290, y: 640, label: 'Main gate' },
    { id: 'fence', layer: 'routes', x: 1000, y: 180, label: 'Back wall' },
    { id: 'lineside', layer: 'routes', x: 1175, y: 600, label: 'Lineside path' },
  ],
  notes: [
    { layer: 'routes', x: 690, y: 292, text: 'RC-12 leaves at 02:10', rot: -3 },
    { layer: 'routes', x: 900, y: 282, text: 'goes past Signal box 9', rot: 2 },
    { layer: 'cargo', x: 470, y: 168, text: '$2,475,000 each trip', rot: -2 },
    { layer: 'staff', x: 1090, y: 442, text: 'only 1 old man', rot: 3 },
    { layer: 'cameras', x: 920, y: 402, text: 'broken since 2019', rot: -3 },
    { layer: 'gate', x: 560, y: 530, text: 'KT-2210: guard boss, Oct 23', rot: -2 },
    { layer: 'gate', x: 560, y: 562, text: 'VX-4471: Dex, Oct 21', rot: 2 },
  ],
  labels: [
    { layer: 'shell', x: 200, y: 95, text: 'Vesper Rail Yard' },
    { layer: 'shell', x: 125, y: 212, text: 'Platform 1' },
    { layer: 'shell', x: 125, y: 306, text: 'Platform 2' },
    { layer: 'shell', x: 1080, y: 306, text: 'Harbour line →' },
    { layer: 'shell', x: 735, y: 362, text: 'Points' },
    { layer: 'shell', x: 700, y: 718, text: 'Ironside Road' },
  ],
};

export default {
  id: 'rail', number: 4,
  title: 'The Night Train',
  target: 'Vesper Rail Yard',
  district: 'Ironside',
  hubPos: { x: 0.90, y: 0.80 },
  take: 260000,
  sqlFocus: 'HAVING · 3-table JOINs · multi-column GROUP BY',
  logline: 'Crane’s armored train carries his papers at night. We stop it in the dark.',

  briefing: [
    { layout: 'full', panels: [
      { shot: 'title-card', params: { kicker: 'Job 04 · Ironside', title: 'The Night Train' } },
    ] },
    { layout: '4', panels: [
      { shot: 'city-establish', params: { building: 'Vesper Rail Yard' }, caption: 'Ironside. Trains, rain and long, dark tracks.' },
      { shot: 'blueprint-closeup', caption: 'Every Friday at 02:10, Crane’s armored train leaves for the bank.', lines: [{ who: 'juno', text: 'It carries bonds. Bonds are papers worth a lot of money.' }] },
      { shot: 'crew-table', lines: [{ who: 'viv', text: 'The bonds come from CH Group, Crane’s secret company.' }, { who: 'viv', text: 'If we take them, we can prove CH Group moves Crane’s money.' }] },
      { shot: 'face', params: { who: 'otis', mood: 'calm' }, caption: 'Signal box 9 is a small hut. It controls the train lights.', lines: [{ who: 'otis', text: 'My old friend works in Signal box 9. I will keep him busy.' }] },
    ] },
  ],

  puzzles: [
    {
      title: 'What Leaves Next',
      ask: { who: 'viv', text: 'What leaves the rail yard next? Tell me the time, vehicle, cargo, route and guard.' },
      prompt: "Join transfers t to vehicles v on v.plate = t.plate. Join staff s on s.id = t.escort_id. Keep t.departs on or after '2025-10-23'. Show t.departs, v.plate, v.kind, t.cargo, t.route and s.name AS escort. Sort by t.departs, earliest first.",
      sql: "SELECT t.departs, v.plate, v.kind, t.cargo, t.route, s.name AS escort FROM transfers t JOIN vehicles v ON v.plate = t.plate JOIN staff s ON s.id = t.escort_id WHERE t.departs >= '2025-10-23' ORDER BY t.departs;",
      orderMatters: true,
      hint: "Use 2 JOINs, each with its own ON. Then use WHERE t.departs >= '2025-10-23' and ORDER BY t.departs.",
      concepts: ['multijoin', 'join', 'where', 'orderby'],
      reveals: ['routes'],
      intel: 'Next out is the rail car RC-12. It leaves on October 24 at 02:10, with bearer bonds. 1 guard, Hank Doyle, rides with it. Its route: Platform 2 > Signal box 9 > Harbour line. Then the armored truck AV-7 carries cash at 10:00',
      react: { who: 'otis', text: 'Signal box 9. My old friend works there. He is 67 years old.' },
    },
    {
      title: 'The Real Money',
      ask: { who: 'dex', text: 'Train or truck? Which one carries the big money?' },
      prompt: 'Join transfers t to vehicles v on v.plate = t.plate. Group by v.plate and v.kind. Show v.plate, v.kind, COUNT(*) AS runs and AVG(t.value) AS avg_value. Keep only groups where AVG(t.value) > 1000000.',
      sql: 'SELECT v.plate, v.kind, COUNT(*) AS runs, AVG(t.value) AS avg_value FROM transfers t JOIN vehicles v ON v.plate = t.plate GROUP BY v.plate, v.kind HAVING AVG(t.value) > 1000000;',
      orderMatters: false,
      hint: 'WHERE cannot test an average, because it runs before the groups exist. Use HAVING AVG(t.value) > 1000000 after GROUP BY.',
      concepts: ['having', 'join', 'groupby', 'aggregate'],
      reveals: ['cargo'],
      intel: 'Only the train RC-12 carries more than $1,000,000 on average. It made 4 trips. On average, each trip carried $2,475,000. The truck AV-7 carries much less.',
      react: { who: 'dex', text: '$2,475,000 on each trip. Then we stop the train.' },
    },
    {
      title: 'Who Works at Night',
      ask: { who: 'otis', text: 'How many people work at each post, on each shift? I want to know who is awake at 02:00' },
      prompt: 'From staff, keep building_id = 4. Group by post and shift. Show post, shift and COUNT(*) AS staff. Sort by post, then shift.',
      sql: 'SELECT post, shift, COUNT(*) AS staff FROM staff WHERE building_id = 4 GROUP BY post, shift ORDER BY post, shift;',
      orderMatters: true,
      hint: 'GROUP BY post, shift makes one row for each post and shift. Then use ORDER BY post, shift.',
      concepts: ['groupby', 'aggregate', 'where', 'orderby'],
      reveals: ['staff'],
      intel: 'At night, 4 people work on the loading platform. 3 work at the main gate. 1 guard rides on RC-12, and 1 works in the switch tower. Only 1 man works in Signal box 9. In the day, only 3 people work.',
      react: { who: 'otis', text: '4 guards on the platform. In Signal box 9, only my old friend.' },
    },
    {
      title: 'Where It Is Dark',
      ask: { who: 'juno', text: 'Which parts of the yard have no working camera at all?' },
      prompt: "Join cameras c to zones z on z.id = c.zone_id. Join buildings b on b.id = z.building_id. Keep b.name = 'Vesper Rail Yard'. Group by z.name. Show z.name AS zone, COUNT(*) AS cameras and SUM(c.working) AS live. Keep zones where SUM(c.working) = 0. Sort by zone.",
      sql: "SELECT z.name AS zone, COUNT(*) AS cameras, SUM(c.working) AS live FROM cameras c JOIN zones z ON z.id = c.zone_id JOIN buildings b ON b.id = z.building_id WHERE b.name = 'Vesper Rail Yard' GROUP BY z.name HAVING SUM(c.working) = 0 ORDER BY z.name;",
      orderMatters: true,
      hint: 'Put the building name test in WHERE. Then use HAVING SUM(c.working) = 0 to keep the dark zones.',
      concepts: ['multijoin', 'having', 'groupby', 'aggregate', 'orderby'],
      reveals: ['cameras'],
      intel: '2 zones have no working camera. They are the East siding and Signal box 9. Each one has 1 camera, and it is broken.',
      react: { who: 'juno', text: 'The camera at Signal box 9 has not worked since 2019.' },
    },
    {
      title: 'Cars at the Gate',
      ask: { who: 'viv', text: 'Workers drive through the gate every night. Which cars came in only once?' },
      prompt: 'Join access_log a to vehicles v on v.plate = a.credential. Keep a.building_id = 4. Group by v.plate and v.owner. Show v.plate, v.owner and MIN(a.at) AS seen. Keep plates with exactly 1 entry. Sort by seen.',
      sql: 'SELECT v.plate, v.owner, MIN(a.at) AS seen FROM access_log a JOIN vehicles v ON v.plate = a.credential WHERE a.building_id = 4 GROUP BY v.plate, v.owner HAVING COUNT(*) = 1 ORDER BY seen;',
      orderMatters: true,
      hint: 'Here a car plate works like a badge. Use HAVING COUNT(*) = 1, then ORDER BY seen.',
      concepts: ['having', 'join', 'groupby', 'aggregate', 'orderby'],
      reveals: ['gate'],
      intel: '2 cars came only once. VX-4471 is Dex’s car. It came at 23:40 on October 21. KT-2210 belongs to Crane’s guard boss, Silas Voight. It came at 10:15 on October 23.',
      react: { who: 'dex', text: 'Yes, I came to look at the yard. That is my job!' },
    },
  ],

  blueprint,

  play: {
    question: 'Where do we take the bonds?',
    options: [
      { id: 'truck', label: 'Truck AV-7 on Ironside Road', detail: 'Stop the armored truck on its morning trip.', route: [[1150, 685], [800, 685], [420, 685], [180, 685]] },
      { id: 'platform', label: 'RC-12 at the platform', detail: 'Go in through the gate. Get on RC-12 at Platform 2 before it leaves.', route: [[290, 700], [290, 560], [240, 480], [240, 440], [280, 400], [280, 360], [430, 332]] },
      { id: 'signal', label: 'RC-12 at Signal box 9, 02:20', detail: 'Sam keeps his friend busy. The light turns red, and RC-12 stops in the dark.', route: [[1175, 695], [1175, 380], [1140, 380], [1080, 380], [1080, 330]] },
      { id: 'siding', label: 'Wait on the East siding', detail: 'Climb over the back wall. Wait on the dark side track for the train.', route: [[1150, 700], [1010, 600], [1000, 190], [900, 128]] },
    ],
    answer: 'signal',
    why: 'The bonds ride on RC-12, worth $2,475,000 on average. Its route goes past Signal box 9. Only 1 old man works there, and the camera is broken. The platform has 4 guards. And Crane’s guard boss visited the yard yesterday.',
    wrong: {
      truck: 'The truck carries much less than $1,000,000. The bonds went past us on the train.',
      platform: 'At night, 4 guards work on the platform. The cameras there work too. Crane’s guard boss visited the yard yesterday.',
      siding: 'It is dark there, but RC-12 never goes there. Its route is Platform 2 > Signal box 9 > Harbour line.',
    },
  },

  replay: {
    success: [
      { layout: '3a', panels: [
        { shot: 'car-interior', params: { who: 'dex' }, caption: 'Ironside, 01:50 Lights off, near the Harbour line.', lines: [{ who: 'dex', text: 'I checked this road before. It is safe.' }, { who: 'viv', text: 'Next time, tell me first.' }] },
        { shot: 'face', params: { who: 'otis', mood: 'calm' }, caption: 'Signal box 9.', lines: [{ who: 'otis', text: 'Good evening, old friend. I brought hot coffee and cards.' }] },
        { shot: 'clock', params: { time: '02:10' }, caption: '02:10 RC-12 leaves Platform 2 on time.' },
      ] },
      { layout: '3b', panels: [
        { shot: 'hands-typing', sfx: 'CLACK', lines: [{ who: 'juno', text: 'I am turning the light red. It will look like a broken light.' }] },
        { shot: 'clock', params: { time: '02:20' }, sfx: 'SKREEEE', caption: '02:20 Metal on metal. The train stops at the red light.' },
        { shot: 'cctv-monitor', params: { label: 'SIGNAL BOX 9 · NO SIGNAL' }, caption: 'The camera at Signal box 9 has not worked for years.' },
      ] },
      { layout: '2v', panels: [
        { shot: 'vault-door', sfx: 'CLANK', lines: [{ who: 'juno', text: 'This lock is very old. Old locks are easy.' }] },
        { shot: 'loot', params: { item: 'Crane’s bonds' }, caption: 'Papers worth a lot of money. The name on every one: CH Group.' },
      ] },
      { layout: '2h', panels: [
        { shot: 'getaway', sfx: 'VRRRM', lines: [{ who: 'dex', text: 'The light is green again. Let’s go!' }] },
        { shot: 'street-rain', caption: 'In Signal box 9, Sam’s old friend plays cards. He never looks out the window.' },
      ] },
    ],
    failure: [
      { layout: '2h', panels: [
        { shot: 'police-lights', sfx: 'WEE-OO', caption: 'Big white lights come on across the whole yard.' },
        { shot: 'car-interior', params: { who: 'dex' }, lines: [{ who: 'dex', text: 'They saw us! Lights off! We go back and plan again, Architect.' }] },
      ] },
    ],
  },

  debrief: {
    headline: 'BOND TRAIN STOPPED BY BROKEN SIGNAL LIGHT',
    line: { who: 'otis', text: 'My old friend won 6 card games tonight. He was very happy.' },
  },

  after: [
    { layout: '3a', panels: [
      { shot: 'police-lights', sfx: 'WEE-OO', caption: '02:31 Police cars on the Harbour line. Someone called them.' },
      { shot: 'car-chase', sfx: 'SKREEE', caption: 'Dex drives fast through the rain. The police are very close.' },
      { shot: 'face', params: { who: 'calloway', mood: 'tense' }, lines: [{ who: 'calloway', text: 'A black car. Its number plate starts with VX. Find it!' }] },
    ] },
    { layout: '3b', tint: 'ink', panels: [
      { shot: 'phone', params: { who: 'viv' }, caption: '04:00 The hideout. The phone rings. Nobody has this number.' },
      { shot: 'silhouette-reveal', params: { who: 'crane' }, lines: [{ who: 'crane', text: 'Hello, Vera. I know who you are.' }, { who: 'crane', text: 'Dex, Kim, Sam and Ruby. Say hello to them for me.' }] },
      { shot: 'face', params: { who: 'viv', mood: 'shock' }, caption: 'Mr. Crane knows every name. How?' },
    ] },
  ],
};
