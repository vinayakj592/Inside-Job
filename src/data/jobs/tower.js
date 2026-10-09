// JOB 08: Inside Job. Crane Tower. Focus: CTEs · UNION · EXISTS. The spy is found here.
// Facts come from docs/STORY.md §Job 8; every intel line is checked against the data with
// `node scripts/verify-content.mjs --dump --job tower`.
// Story (WRITING.md §3): the queries prove the spy is Dex. Order: the unknown phone called tonight (P1) →
// Crane believed the fake plan (P2) → Dex's phone (P3) → Crane's money and Dex's car (P4) → B3 is empty (P5).

const RAMP = [
  ['Guard', [[970, 210], [1100, 210], [1100, 280], [970, 280]]],
  ['Guard', [[970, 330], [1100, 330], [1100, 400], [970, 400]]],
  ['Guard', [[970, 450], [1100, 450], [1100, 520], [970, 520]]],
  ['Guard', [[970, 570], [1100, 570], [1100, 645], [970, 645]]],
  ['Guard', [[800, 200], [930, 200], [930, 270], [800, 270]]],
  ['Guard', [[800, 330], [930, 330], [930, 400], [800, 400]]],
  ['Guard', [[800, 450], [930, 450], [930, 520], [800, 520]]],
  ['Guard', [[800, 570], [930, 570], [930, 645], [800, 645]]],
];

const blueprint = {
  title: 'CRANE TOWER · STREET, GARAGE & LEVEL B3',
  scale: '1:100',
  layers: [
    { id: 'shell', label: 'Building shell', initial: true },
    { id: 'leak', label: 'Unknown phone' },
    { id: 'crane', label: 'Crane’s calls' },
    { id: 'cameras', label: 'Cameras' },
    { id: 'mole', label: 'The spy' },
    { id: 'shaft', label: 'Old shaft' },
    { id: 'guards', label: 'Tonight’s guards' },
  ],
  rooms: [
    { id: 'street', layer: 'shell', outdoor: true, name: 'Crown Hill Avenue', x: 40, y: 14, w: 1120, h: 62 },
    { id: 'shaft', layer: 'shaft', name: 'Maintenance shaft', x: 80, y: 140, w: 60, h: 540 },
    // street level
    { id: 'lobby', layer: 'shell', name: 'Lobby', x: 140, y: 140, w: 280, h: 120 },
    { id: 'bay', layer: 'shell', name: 'Loading bay', x: 420, y: 140, w: 220, h: 120 },
    { id: 'sec', layer: 'shell', name: 'Security', x: 640, y: 140, w: 140, h: 120 },
    { id: 'ramp', layer: 'shell', name: 'Garage ramp', x: 780, y: 140, w: 340, h: 540 },
    // level −1
    { id: 'plant', layer: 'shell', name: 'Plant room', x: 140, y: 260, w: 160, h: 180 },
    { id: 'core', layer: 'shell', name: 'Lifts', x: 300, y: 260, w: 80, h: 180 },
    { id: 'garage', layer: 'shell', name: 'Garage', x: 380, y: 260, w: 400, h: 180 },
    // level B3
    { id: 'b3', layer: 'shell', name: 'B3 vault level', x: 140, y: 440, w: 420, h: 240 },
    { id: 'vault', layer: 'shell', name: 'B3 vault', x: 560, y: 440, w: 220, h: 240 },
  ],
  stairs: [
    { layer: 'shaft', x: 94, y: 172, w: 32, h: 400, dir: 's', label: 'LADDER' },
  ],
  walls: [
    // exterior shell
    { layer: 'shell', x1: 80, y1: 140, x2: 1120, y2: 140 },
    { layer: 'shell', x1: 1120, y1: 140, x2: 1120, y2: 680 },
    { layer: 'shell', x1: 1120, y1: 680, x2: 80, y2: 680 },
    { layer: 'shell', x1: 80, y1: 680, x2: 80, y2: 140 },
    // spiral ramp median
    { layer: 'shell', x1: 950, y1: 190, x2: 950, y2: 630 },
    // parking bays
    ...[430, 480, 530, 580, 630, 680, 730].map((x) => ({ layer: 'shell', x1: x, y1: 392, x2: x, y2: 438 })),
    // vault cages
    { layer: 'shell', x1: 590, y1: 470, x2: 650, y2: 470 },
    { layer: 'shell', x1: 690, y1: 470, x2: 750, y2: 470 },
    { layer: 'shell', x1: 590, y1: 650, x2: 650, y2: 650 },
    { layer: 'shell', x1: 690, y1: 650, x2: 750, y2: 650 },
  ],
  doors: [
    { layer: 'shaft', x: 90, y: 140, w: 40, dir: 'h' },
    { layer: 'shaft', x: 140, y: 600, w: 50, dir: 'v' },
    { layer: 'shell', x: 240, y: 140, w: 80, dir: 'h' },
    { layer: 'shell', x: 470, y: 140, w: 110, dir: 'h' },
    { layer: 'shell', x: 640, y: 180, w: 50, dir: 'v' },
    { layer: 'shell', x: 780, y: 180, w: 50, dir: 'v' },
    { layer: 'shell', x: 880, y: 140, w: 120, dir: 'h' },
    { layer: 'shell', x: 320, y: 260, w: 40, dir: 'h' },
    { layer: 'shell', x: 380, y: 330, w: 50, dir: 'v' },
    { layer: 'shell', x: 780, y: 300, w: 100, dir: 'v' },
    { layer: 'shell', x: 320, y: 440, w: 40, dir: 'h' },
    { layer: 'shell', x: 560, y: 530, w: 70, dir: 'v', label: 'Vault door' },
  ],
  windows: [
    { layer: 'shell', x1: 160, y1: 140, x2: 225, y2: 140 },
    { layer: 'shell', x1: 335, y1: 140, x2: 405, y2: 140 },
    { layer: 'shell', x1: 660, y1: 140, x2: 760, y2: 140 },
  ],
  cameras: [
    { id: 'c51', layer: 'cameras', x: 270, y: 152, dir: 90, fov: 50, range: 90, label: 'Doors' },
    { id: 'c50', layer: 'cameras', x: 155, y: 250, dir: 330, fov: 50, range: 110, label: 'Turnstiles' },
    { id: 'c52', layer: 'cameras', x: 405, y: 250, dir: 210, fov: 50, range: 90, label: 'Lifts' },
    { id: 'c53', layer: 'cameras', x: 405, y: 152, dir: 150, fov: 50, range: 100, label: 'Desk' },
    { id: 'c59', layer: 'cameras', x: 630, y: 250, dir: 215, fov: 40, range: 120, label: 'Bay' },
    { id: 'c56', layer: 'cameras', x: 1110, y: 150, dir: 150, fov: 50, range: 160, label: 'Gate' },
    { id: 'c54', layer: 'cameras', x: 790, y: 150, dir: 60, fov: 50, range: 150, label: 'Ramp top' },
    { id: 'c55', layer: 'cameras', x: 1110, y: 670, dir: 235, fov: 50, range: 200, label: 'Ramp bottom' },
    { id: 'c57', layer: 'cameras', x: 548, y: 455, dir: 150, fov: 40, range: 200, label: 'Vault door' },
    { id: 'c58', layer: 'cameras', x: 340, y: 455, dir: 90, fov: 60, range: 130, label: 'B3 lift lobby' },
  ],
  guards: [
    ...RAMP.map(([name, path], i) => ({ id: `ramp${i}`, layer: 'guards', name, path, loop: true, period: 9 + (i % 4) * 2 })),
    { id: 'quade', layer: 'guards', name: 'Lobby guard', path: [[160, 175], [285, 175], [285, 235], [160, 235]], loop: true, period: 12 },
    { id: 'brook', layer: 'guards', name: 'Lobby guard', path: [[300, 185], [395, 185], [395, 240], [300, 240]], loop: true, period: 10 },
  ],
  lasers: [],
  safes: [
    { id: 'vault', layer: 'shell', x: 670, y: 560, r: 42, label: 'Cash · gold · file', kind: 'vault' },
  ],
  entries: [
    { id: 'grate', layer: 'shaft', x: 110, y: 110, label: 'Grate' },
    { id: 'lobby', layer: 'guards', x: 280, y: 110, label: 'Lobby' },
    { id: 'ramp', layer: 'crane', x: 940, y: 110, label: 'Ramp' },
  ],
  notes: [
    { layer: 'leak', x: 232, y: 36, text: 'unknown phone: 6 calls · last TONIGHT', rot: -1 },
    { layer: 'crane', x: 712, y: 174, text: '23:49 →', rot: -4 },
    { layer: 'crane', x: 1070, y: 44, text: 'he heard “ramp”', rot: 2 },
    { layer: 'mole', x: 432, y: 306, text: 'DEX', rot: -8 },
    { layer: 'mole', x: 640, y: 300, text: 'his car came here 2 times', rot: 2 },
    { layer: 'shaft', x: 222, y: 322, text: '← old shaft', rot: -3 },
    { layer: 'shaft', x: 222, y: 422, text: 'on Crane’s old drawings', rot: 2 },
    { layer: 'guards', x: 230, y: 520, text: 'B3 guards: 2 → 0', rot: -3 },
    { layer: 'guards', x: 950, y: 668, text: 'ramp guards: 2 → 8', rot: -2 },
  ],
  labels: [
    { layer: 'shaft', x: 262, y: 128, text: 'Maintenance shaft' },
    { layer: 'shell', x: 220, y: 282, text: 'Level −1' },
    { layer: 'shell', x: 200, y: 470, text: 'Level B3' },
  ],
};

export default {
  id: 'tower', number: 8,
  title: 'Inside Job',
  target: 'Crane Tower',
  district: 'Crown Hill',
  hubPos: { x: 0.50, y: 0.12 },
  take: 1500000,
  sqlFocus: 'CTEs · UNION · EXISTS',
  logline: 'The last job. Find the spy. Then take the money and the proof.',

  briefing: [
    { layout: 'full', panels: [
      { shot: 'title-card', params: { kicker: 'Job 08 · Crown Hill', title: 'Inside Job' } },
    ] },
    { layout: '4', panels: [
      { shot: 'city-establish', params: { building: 'Crane Tower' }, caption: 'Crane Tower. Glass and gold light in the rain. Vera built its vault.' },
      { shot: 'crew-table', caption: 'The hideout, 21:00. Vera (the Boss) tells the whole team the plan.', lines: [{ who: 'viv', text: 'We go in by the garage ramp at 02:00.' }, { who: 'viv', text: 'Dex drives. Kim opens the vault.' }] },
      { shot: 'face', params: { who: 'dex', mood: 'calm' }, caption: 'Dex (the Driver) smiles.', lines: [{ who: 'dex', text: 'The garage ramp at 02:00. I will be ready.' }] },
      { shot: 'face', params: { who: 'viv', mood: 'tense' }, caption: 'Later, Vera speaks only to you.', lines: [{ who: 'viv', text: 'That plan is fake, Architect. Only the spy will send it to Crane.' }, { who: 'viv', text: 'Find the spy. We have until 02:00.' }] },
    ] },
  ],

  puzzles: [
    {
      title: 'The Last Call',
      ask: { who: 'viv', text: 'Start with the unknown phone. Show me all its calls in one row.' },
      prompt: "Make a CTE named burner with at and cell for every call from '555-0199'. From burner, show calls (COUNT(*)), first (MIN(at)), last (MAX(at)) and cells (COUNT(DISTINCT cell)).",
      sql: "WITH burner AS (SELECT at, cell FROM calls WHERE caller = '555-0199') SELECT COUNT(*) AS calls, MIN(at) AS first, MAX(at) AS last, COUNT(DISTINCT cell) AS cells FROM burner;",
      orderMatters: false,
      hint: 'Start with WITH burner AS (SELECT at, cell FROM calls WHERE …). Then use SELECT … FROM burner, like a table.',
      concepts: ['cte', 'aggregate', 'distinct'],
      reveals: ['leak'],
      intel: 'The unknown phone made 6 calls, all from 1 phone tower: DOCK-2. The first was on 2025-10-16 at 23:47. The last was tonight, 2025-11-21 at 23:41, after our meeting.',
      react: { who: 'dex', text: '6 calls from 1 tower. So what? Lots of people live on our street.' },
    },
    {
      title: 'Crane Answers',
      ask: { who: 'juno', text: 'Who called Crane tonight, and who did he call? Put both lists in one timeline.' },
      prompt: "Join two SELECTs with UNION. Use only 2025-11-21 (at LIKE '2025-11-21%'). First: calls to '555-0001', showing at, 'in' AS dir, caller AS other. Second: calls from '555-0001', showing at, 'out', callee. Sort by at.",
      sql: "SELECT at, 'in' AS dir, caller AS other FROM calls WHERE callee = '555-0001' AND at LIKE '2025-11-21%' UNION SELECT at, 'out', callee FROM calls WHERE caller = '555-0001' AND at LIKE '2025-11-21%' ORDER BY at;",
      orderMatters: true,
      hint: 'Put UNION between the two SELECTs. Both need 3 columns in the same order. Put one ORDER BY at the very end.',
      concepts: ['union', 'like', 'orderby'],
      reveals: ['crane', 'cameras'],
      intel: 'At 17:20 Crane’s office called him (555-0010). At 23:41 the unknown phone called him (555-0199). At 23:49 Crane called his tower guards (555-0800). At 23:52 he called the Marlowe (555-0700).',
      react: { who: 'juno', text: 'The spy called at 23:41. 8 minutes later, Crane called his guards.' },
    },
    {
      title: 'Near the Phone',
      ask: { who: 'viv', text: 'Architect, check our 5 phones. Whose phone was near the unknown phone every time?' },
      prompt: "CTE burner: at and cell of calls from '555-0199'. CTE crew: owner, at and cell of calls c joined to phones p ON p.number = c.caller. In crew, keep owner IN ('Vera Stone', 'Dex Moran', 'Kim Park', 'Sam Brandt', 'Ruby Lane'). Join burner to crew on the same cell, 15 minutes apart or less. Show owner and matches (COUNT(DISTINCT burner.at)). Sort by matches, highest first.",
      sql: "WITH burner AS (SELECT at, cell FROM calls WHERE caller = '555-0199'), crew AS (SELECT p.owner, c.at, c.cell FROM calls c JOIN phones p ON p.number = c.caller WHERE p.owner IN ('Vera Stone', 'Dex Moran', 'Kim Park', 'Sam Brandt', 'Ruby Lane')) SELECT crew.owner, COUNT(DISTINCT burner.at) AS matches FROM burner JOIN crew ON crew.cell = burner.cell AND ABS(julianday(crew.at) - julianday(burner.at)) * 1440 <= 15 GROUP BY crew.owner ORDER BY matches DESC;",
      orderMatters: true,
      hint: 'Use WITH once, then 2 CTEs with a comma. JOIN ON the same cell AND ABS(julianday(crew.at) - julianday(burner.at)) * 1440 <= 15.',
      concepts: ['cte', 'join', 'groupby', 'dates', 'inlist'],
      reveals: ['mole'],
      intel: 'Dex Moran: 6 of 6. His phone was near the unknown phone every time. Kim Park: 5. She lives above the hideout, but on 10-30 she was away. Sam Brandt: 1. Vera and Ruby: 0.',
      react: { who: 'dex', text: 'No. Wait. It is not what it looks like.' },
    },
    {
      title: 'Money and a Car',
      ask: { who: 'otis', text: 'A phone is not enough for me. Who took Crane’s money and also drove to Crane Tower?' },
      prompt: "From phones p, show owner. Keep only the team: owner IN ('Vera Stone', 'Dex Moran', 'Kim Park', 'Sam Brandt', 'Ruby Lane'). Use EXISTS for a ledger row with party = owner and settled_by = 'CH Group'. Use AND EXISTS for an access_log row at building 8 whose credential is the plate of that owner's vehicle.",
      sql: "SELECT p.owner FROM phones p WHERE p.owner IN ('Vera Stone', 'Dex Moran', 'Kim Park', 'Sam Brandt', 'Ruby Lane') AND EXISTS (SELECT 1 FROM ledger l WHERE l.party = p.owner AND l.settled_by = 'CH Group') AND EXISTS (SELECT 1 FROM vehicles v JOIN access_log a ON a.credential = v.plate WHERE v.owner = p.owner AND a.building_id = 8);",
      orderMatters: false,
      hint: 'Use 2 EXISTS tests joined by AND. Each one must check p.owner: EXISTS (SELECT 1 FROM ledger l WHERE l.party = p.owner AND …).',
      concepts: ['exists', 'subquery', 'join', 'inlist'],
      reveals: ['shaft'],
      intel: 'Only 1 name has both: Dex Moran. CH Group, Crane’s company, paid his debts. His car, VX-4471, went into the Crane Tower garage 2 times. That was on 10-15 at 22:10 and 11-07 at 00:30.',
      react: { who: 'viv', text: 'It is exactly what it looks like, Dex.' },
    },
    {
      title: 'Wrong Door',
      ask: { who: 'otis', text: 'Crane’s guards are counted at midnight. Compare last night with tonight. Where did they go?' },
      prompt: "Make 2 CTEs of building 8 staff swipes (staff_id IS NOT NULL). Each has door and COUNT(*) AS n, grouped by door. last_night uses at LIKE '2025-11-21 00:%'. tonight uses at LIKE '2025-11-22 00:%'. LEFT JOIN tonight to last_night on door. Show door, last_night and tonight (0 if missing). Sort by door.",
      sql: "WITH last_night AS (SELECT door, COUNT(*) AS n FROM access_log WHERE building_id = 8 AND staff_id IS NOT NULL AND at LIKE '2025-11-21 00:%' GROUP BY door), tonight AS (SELECT door, COUNT(*) AS n FROM access_log WHERE building_id = 8 AND staff_id IS NOT NULL AND at LIKE '2025-11-22 00:%' GROUP BY door) SELECT l.door, l.n AS last_night, COALESCE(t.n, 0) AS tonight FROM last_night l LEFT JOIN tonight t ON t.door = l.door ORDER BY l.door;",
      orderMatters: true,
      hint: 'Write FROM last_night l LEFT JOIN tonight t ON t.door = l.door. Use COALESCE(t.n, 0) to turn a missing count into 0.',
      concepts: ['cte', 'leftjoin', 'nulls', 'groupby'],
      reveals: ['guards'],
      intel: 'Guards at midnight, last night → tonight. B3 vault level: 2 → 0. Floor 40: 2 → 0. Garage ramp: 2 → 8. Loading bay: 1 → 0. Lobby: 3 → 2. Nobody guards B3 tonight.',
      react: { who: 'otis', text: '8 guards on the ramp. Nobody at the vault. Crane is guarding the wrong door.' },
    },
  ],

  blueprint,

  play: {
    question: 'Last job. How do we get into the vault?',
    options: [
      { id: 'garage', label: 'Garage ramp, 02:00', detail: 'The plan the team heard. Dex drives us down the ramp.', route: [[940, 40], [940, 160], [870, 290], [830, 350], [700, 355], [395, 355], [340, 400], [340, 470], [450, 560], [580, 565], [650, 560]] },
      { id: 'shaft', label: 'Old shaft, Sam drives', detail: 'Climb down the old shaft from Crane’s drawings. Dex stays at the hideout.', route: [[110, 40], [110, 160], [110, 620], [200, 645], [470, 660], [540, 600], [580, 585], [645, 570]] },
      { id: 'shaft-dex', label: 'Old shaft, Dex drives', detail: 'The same shaft. Dex waits outside in his car.', route: [[240, 40], [122, 60], [122, 160], [122, 612], [200, 634], [470, 650], [540, 594], [580, 578], [645, 562]] },
      { id: 'lobby', label: 'Front door, Ruby acts', detail: 'Ruby walks us through the lobby. She plays Crane’s new lawyer.', route: [[280, 40], [280, 200], [340, 245], [340, 300], [340, 470], [450, 560], [580, 565], [650, 560]] },
    ],
    answer: 'shaft',
    why: 'Crane believed the fake plan. 8 guards wait on the ramp, and nobody guards B3. Dex is the spy, so he must not know the real plan.',
    wrong: {
      garage: 'Crane heard “garage ramp” at 23:41. Now 8 guards wait for us there.',
      'shaft-dex': 'Dex is the spy. He tells Crane about the shaft, and the guards wait for us.',
      lobby: '2 guards and 4 cameras watch the lobby. And Crane knows we come tonight.',
    },
  },

  replay: {
    success: [
      { layout: '4', tint: 'ink', panels: [
        { shot: 'crew-table', caption: '01:00. The hideout. Vera puts your results on the table.', lines: [{ who: 'viv', text: 'Your phone, Dex. 6 calls out of 6. Crane’s money. Your car at his tower.' }] },
        { shot: 'face', params: { who: 'dex', mood: 'shock' }, lines: [{ who: 'dex', text: 'Crane said he would hurt Mia. My little sister, Vera.' }, { who: 'dex', text: 'What could I do?' }] },
        { shot: 'face', params: { who: 'viv', mood: 'tense' }, lines: [{ who: 'viv', text: 'You can help us now. Call Crane.' }, { who: 'viv', text: 'Tell him we still come by the ramp at 02:00.' }] },
        { shot: 'phone', params: { who: 'dex' }, caption: 'Dex makes one last call. This time, Vera chose the words.', lines: [{ who: 'dex', text: 'It is still the ramp, Mr. Crane. 02:00.' }] },
      ] },
      { layout: 'strip', panels: [
        { shot: 'street-rain', caption: '02:00. An old grate in the street. We found it in Crane’s drawings from Lot 47.' },
        { shot: 'vent-crawl', sfx: 'CLANG', caption: 'A long ladder goes straight down to B3.' },
        { shot: 'cctv-monitor', params: { label: 'B3 · VAULT LEVEL · 0 GUARDS' }, lines: [{ who: 'otis', text: 'Nobody is here. All his guards are on the ramp.' }] },
        { shot: 'vault-door', sfx: 'KA-CHUNK', lines: [{ who: 'juno', text: 'The codes from his safe. The door opens.' }] },
      ] },
      { layout: '3a', tint: 'gold', panels: [
        { shot: 'loot', params: { item: 'The Stone case file' }, caption: '$14 million in cash. 40 gold bars. And 1 thin file: the proof.' },
        { shot: 'face', params: { who: 'viv', mood: 'calm' }, lines: [{ who: 'viv', text: 'The file first, Sam. It proves Crane robbed his own vault.' }] },
        { shot: 'face', params: { who: 'otis', mood: 'smirk' }, lines: [{ who: 'otis', text: 'My arm is broken, Vera. But the other one works.' }] },
      ] },
      { layout: 'strip', panels: [
        { shot: 'silhouette-reveal', params: { who: 'crane' }, caption: 'The garage. Crane waits at the bottom of his ramp with 8 guards.', lines: [{ who: 'crane', text: '02:00. Vera is never late.' }] },
        { shot: 'clock', params: { time: '02:40' }, caption: 'Nobody comes down the ramp.' },
        { shot: 'police-lights', sfx: 'WEEOO', caption: '02:55. Lights at the top of the ramp. It is the police.' },
        { shot: 'two-shot', params: { a: 'calloway', b: 'crane' }, sfx: 'CLICK', caption: 'Detective Cole puts handcuffs on Crane.', lines: [{ who: 'calloway', text: 'Leo Crane, you are under arrest.' }] },
      ] },
    ],
    failure: [
      { layout: '2h', panels: [
        { shot: 'alarm', sfx: 'BRRRING', caption: 'Alarms on every floor. Crane was ready for us.' },
        { shot: 'car-interior', params: { who: 'otis' }, lines: [{ who: 'otis', text: 'He knew! Everyone out! Architect, someone told him the plan.' }] },
      ] },
    ],
  },

  debrief: {
    headline: 'POLICE ARREST LEO CRANE IN HIS OWN GARAGE',
    line: { who: 'viv', text: 'He took 18 months of my life. We took him in 8 jobs.' },
  },

  after: null,
};
