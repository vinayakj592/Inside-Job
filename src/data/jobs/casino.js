// JOB 03: House Edge. The Orpheum Casino count room. Focus: JOIN · GROUP BY · COUNT/SUM/AVG.
// Facts come from docs/STORY.md §Job 3; every intel line is checked against the data with
// `node scripts/verify-content.mjs --dump --job casino`.
// Spy clue: P5 shows Dex owes the casino money; the after-beat shows the new corridor guard
// ("Someone talked.") and Dex making a call in the dark. Text follows docs/WRITING.md.

const blueprint = {
  title: 'ORPHEUM CASINO · GAMING FLOOR + LOWER LEVEL',
  scale: '1:200',
  layers: [
    { id: 'shell', label: 'Building shell', initial: true },
    { id: 'count', label: 'Count room' },
    { id: 'cash', label: 'Cash drops' },
    { id: 'cameras', label: 'Cameras' },
    { id: 'guards', label: 'Guards' },
    { id: 'badge', label: 'Badge doors' },
    { id: 'vip', label: 'Rich player' },
  ],
  rooms: [
    { id: 'street', layer: 'shell', outdoor: true, name: 'Neon Row', x: 60, y: 630, w: 1080, h: 95 },
    { id: 'floor', layer: 'shell', name: 'Casino floor', x: 100, y: 70, w: 460, h: 310 },
    { id: 'vip', layer: 'shell', name: 'VIP room', x: 100, y: 380, w: 180, h: 220 },
    { id: 'lobby', layer: 'shell', name: 'Lobby', x: 280, y: 380, w: 200, h: 220 },
    { id: 'cage', layer: 'shell', name: 'Cage', x: 480, y: 380, w: 220, h: 220 },
    { id: 'secoff', layer: 'shell', name: 'Security office', x: 700, y: 380, w: 250, h: 220 },
    { id: 'staffent', layer: 'shell', name: 'Staff entrance', x: 950, y: 380, w: 150, h: 220 },
    { id: 'stair', layer: 'count', name: 'Stair', x: 560, y: 70, w: 100, h: 100 },
    { id: 'lift', layer: 'count', name: 'Service lift', x: 560, y: 170, w: 100, h: 130 },
    { id: 'count', layer: 'count', name: 'Count room', x: 660, y: 70, w: 440, h: 230 },
    { id: 'corridor', layer: 'count', name: 'Cage corridor', x: 560, y: 300, w: 540, h: 80 },
  ],
  walls: [
    { layer: 'shell', x1: 100, y1: 70, x2: 1100, y2: 70 },
    { layer: 'shell', x1: 1100, y1: 70, x2: 1100, y2: 600 },
    { layer: 'shell', x1: 1100, y1: 600, x2: 100, y2: 600 },
    { layer: 'shell', x1: 100, y1: 600, x2: 100, y2: 70 },
    // cashier counter behind the cage window
    { layer: 'shell', x1: 520, y1: 420, x2: 520, y2: 490 },
    // monitor desk
    { layer: 'shell', x1: 830, y1: 560, x2: 900, y2: 560 },
    // stair treads
    { layer: 'count', x1: 585, y1: 92, x2: 635, y2: 92 },
    { layer: 'count', x1: 585, y1: 108, x2: 635, y2: 108 },
    { layer: 'count', x1: 585, y1: 124, x2: 635, y2: 124 },
    { layer: 'count', x1: 585, y1: 140, x2: 635, y2: 140 },
    // count table
    { layer: 'count', x1: 700, y1: 110, x2: 760, y2: 110 },
  ],
  doors: [
    { layer: 'shell', x: 345, y: 600, w: 70, dir: 'h' },
    { layer: 'shell', x: 330, y: 380, w: 100, dir: 'h' },
    { layer: 'shell', x: 170, y: 380, w: 60, dir: 'h' },
    { layer: 'shell', x: 1000, y: 600, w: 60, dir: 'h' },
    { layer: 'shell', x: 950, y: 470, w: 40, dir: 'v' },
    { layer: 'count', x: 640, y: 380, w: 50, dir: 'h' },
    { layer: 'count', x: 850, y: 380, w: 50, dir: 'h' },
    { layer: 'count', x: 1020, y: 380, w: 50, dir: 'h' },
    { layer: 'count', x: 1020, y: 300, w: 60, dir: 'h' },
    { layer: 'count', x: 560, y: 100, w: 45, dir: 'v' },
    { layer: 'count', x: 560, y: 200, w: 50, dir: 'v', label: 'Staff only' },
    { layer: 'count', x: 660, y: 200, w: 50, dir: 'v' },
  ],
  windows: [
    { layer: 'shell', x1: 480, y1: 420, x2: 480, y2: 520 },
    { layer: 'shell', x1: 295, y1: 600, x2: 335, y2: 600 },
    { layer: 'shell', x1: 430, y1: 600, x2: 470, y2: 600 },
  ],
  cameras: [
    { id: 'floor-n', layer: 'cameras', x: 115, y: 85, dir: 35, fov: 50, range: 280, label: 'Floor north' },
    { id: 'floor-s', layer: 'cameras', x: 115, y: 365, dir: 325, fov: 50, range: 280, label: 'Floor south' },
    { id: 'roulette', layer: 'cameras', x: 300, y: 370, dir: 270, fov: 60, range: 170, label: 'Roulette pit' },
    { id: 'blackjack', layer: 'cameras', x: 500, y: 370, dir: 225, fov: 50, range: 170, label: 'Blackjack pit' },
    { id: 'cage', layer: 'cameras', x: 685, y: 395, dir: 160, fov: 40, range: 200, label: 'Cage window' },
    { id: 'corr-w', layer: 'cameras', x: 575, y: 340, dir: 0, fov: 20, range: 170, label: 'Corridor west' },
    { id: 'corr-m', layer: 'cameras', x: 830, y: 340, dir: 180, fov: 20, range: 150, label: 'Corridor mid' },
    { id: 'corr-e', layer: 'cameras', x: 1085, y: 340, dir: 180, fov: 20, range: 230, label: 'Corridor east' },
    { id: 'lift', layer: 'cameras', x: 575, y: 285, dir: 300, fov: 50, range: 70, label: 'Lift (dead)' },
    { id: 'vip-door', layer: 'cameras', x: 265, y: 395, dir: 150, fov: 50, range: 160, label: 'VIP door' },
    { id: 'vip-tables', layer: 'cameras', x: 115, y: 585, dir: 305, fov: 60, range: 170, label: 'VIP tables' },
    { id: 'staff', layer: 'cameras', x: 1085, y: 395, dir: 110, fov: 30, range: 180, label: 'Staff entrance' },
  ],
  guards: [
    { id: 'kessler', layer: 'guards', name: 'B. Kessler', path: [[590, 322], [1060, 322], [1060, 358], [590, 358]], loop: true, period: 18 },
    { id: 'fenn', layer: 'guards', name: 'L. Fenn', path: [[150, 190], [410, 190], [410, 330], [150, 330]], loop: true, period: 20 },
  ],
  lasers: [],
  safes: [
    { id: 'drops', layer: 'count', x: 1020, y: 150, r: 30, label: 'Night drops', kind: 'vault' },
  ],
  entries: [
    { id: 'main', layer: 'badge', x: 380, y: 622, label: 'Main doors' },
    { id: 'staff', layer: 'badge', x: 1060, y: 622, label: 'Staff entrance' },
  ],
  notes: [
    { layer: 'count', x: 880, y: 100, text: 'counters come at 04:00', rot: 2 },
    { layer: 'cash', x: 770, y: 238, text: '01:00 · $41,200', rot: -2 },
    { layer: 'cash', x: 770, y: 262, text: '02:30 · $58,600', rot: -2 },
    { layer: 'cash', x: 770, y: 288, text: '03:30 · $96,400!', rot: -2 },
    { layer: 'cameras', x: 610, y: 50, text: 'lift camera: broken', rot: -2 },
    { layer: 'cameras', x: 480, y: 180, text: 'cameras miss this corner', rot: 3 },
    { layer: 'badge', x: 935, y: 262, text: 'runner’s badge opens this', rot: -3 },
    { layer: 'vip', x: 190, y: 440, text: 'the judge owes $52,000', rot: -3 },
  ],
  labels: [
    { layer: 'shell', x: 300, y: 58, text: 'GROUND FLOOR' },
    { layer: 'count', x: 890, y: 58, text: 'DOWNSTAIRS' },
    { layer: 'shell', x: 740, y: 620, text: 'SIDEWALK' },
  ],
};

export default {
  id: 'casino', number: 3,
  title: 'The Count Room',
  target: 'Orpheum Casino',
  district: 'Neon Row',
  hubPos: { x: 0.60, y: 0.64 },
  take: 180000,
  sqlFocus: 'JOIN · GROUP BY · COUNT/SUM/AVG',
  logline: 'Crane’s casino counts its cash at 04:00 We take it first.',

  briefing: [
    { layout: 'full', panels: [
      { shot: 'title-card', params: { kicker: 'Job 03 · Neon Row', title: 'The Count Room' } },
    ] },
    { layout: '4', panels: [
      { shot: 'city-establish', params: { building: 'Orpheum Casino' }, caption: 'Neon Row. Rain and red lights. The Orpheum Casino belongs to Mr. Crane.' },
      { shot: 'blueprint-closeup', caption: 'All night, a worker carries cash down to the count room.', lines: [{ who: 'viv', text: 'We need money for the next jobs. We will take Crane’s money.' }] },
      { shot: 'crew-table', lines: [{ who: 'viv', text: 'Ruby, you are our actor. Take the cash runner’s badge.' }, { who: 'lena', text: 'Easy. She will never know it is gone.' }] },
      { shot: 'face', params: { who: 'dex', mood: 'tense' }, caption: 'Dex, our driver, looks at the floor.', lines: [{ who: 'dex', text: 'I know this casino. Let’s be fast in there.' }] },
    ] },
  ],

  puzzles: [
    {
      title: 'Who Goes In',
      ask: { who: 'viv', text: 'Who goes into the count room at night, and when? I want names, not badge numbers.' },
      prompt: "Join access_log a to staff s on s.id = a.staff_id. Keep door 'Count room' and direction 'in'. Keep a.at between '2025-10-17 00:00' and '2025-10-17 06:00'. Show s.name, s.role and a.at. Sort by a.at, then s.name.",
      sql: "SELECT s.name, s.role, a.at FROM access_log a JOIN staff s ON s.id = a.staff_id WHERE a.door = 'Count room' AND a.at BETWEEN '2025-10-17 00:00' AND '2025-10-17 06:00' AND a.direction = 'in' ORDER BY a.at, s.name;",
      orderMatters: true,
      hint: 'Use JOIN staff s ON s.id = a.staff_id to put a name on each row. Use BETWEEN for the time.',
      concepts: ['join', 'where', 'between', 'orderby'],
      reveals: ['count'],
      intel: 'The cash runner, Nell Crowe, went in 3 times last night. At 1:00, 2:30 and 03:30, she brought cash. At 04:00, the 2 counters came in together.',
      react: { who: 'viv', text: 'From 3:30 to 04:00, the room is full of money. And nobody is in it.' },
    },
    {
      title: 'The Biggest Drop',
      ask: { who: 'dex', text: 'Each night the runner brings 3 bags of cash, called drops. Which drop is the biggest?' },
      prompt: "From ledger, keep building_id = 3 and kind 'drop'. Group by memo. Show memo AS run, COUNT(*) AS nights and AVG(amount) AS avg_take. Sort by avg_take, biggest first.",
      sql: "SELECT memo AS run, COUNT(*) AS nights, AVG(amount) AS avg_take FROM ledger WHERE building_id = 3 AND kind = 'drop' GROUP BY memo ORDER BY avg_take DESC;",
      orderMatters: true,
      hint: 'Use GROUP BY memo to get one row for each drop time. Then use ORDER BY avg_take DESC.',
      concepts: ['groupby', 'aggregate', 'where', 'orderby'],
      reveals: ['cash'],
      intel: 'Over 5 nights, the 03:30 drop brings $96,400 on average. The 2:30 drop brings $58,600, and the 1:00 drop $41,200. After 3:30, the room holds about $196,200.',
      react: { who: 'dex', text: '$96,400 in one bag. That is the one we want.' },
    },
    {
      title: 'Which Cameras Work',
      ask: { who: 'juno', text: 'I need to know which cameras work. Count the cameras in each zone, and the working ones.' },
      prompt: 'Join cameras c to zones z on z.id = c.zone_id. Keep z.building_id = 3. Group by z.name. Show z.name AS zone, COUNT(*) AS cameras and SUM(c.working) AS live. Sort by zone.',
      sql: 'SELECT z.name AS zone, COUNT(*) AS cameras, SUM(c.working) AS live FROM cameras c JOIN zones z ON z.id = c.zone_id WHERE z.building_id = 3 GROUP BY z.name ORDER BY z.name;',
      orderMatters: true,
      hint: 'working is 1 or 0, so SUM(c.working) counts the working cameras. Use GROUP BY z.name.',
      concepts: ['join', 'groupby', 'aggregate', 'orderby'],
      reveals: ['cameras', 'guards'],
      intel: 'The casino has 12 cameras, and 11 work. The cage corridor has 3, and all 3 work. The only broken camera is in the service lift.',
      react: { who: 'juno', text: 'A broken camera in the lift. I like that lift.' },
    },
    {
      title: 'The Best Badge',
      ask: { who: 'lena', text: 'Tonight I will take one worker’s badge. Which badge opens the count room most often?' },
      prompt: "Join access_log a to staff s on s.id = a.staff_id. Keep door 'Count room' and direction 'in'. Group by s.name and s.role. Show s.name, s.role and COUNT(*) AS swipes. Sort by swipes, most first, then by s.name.",
      sql: "SELECT s.name, s.role, COUNT(*) AS swipes FROM access_log a JOIN staff s ON s.id = a.staff_id WHERE a.door = 'Count room' AND a.direction = 'in' GROUP BY s.name, s.role ORDER BY swipes DESC, s.name;",
      orderMatters: true,
      hint: 'Use the same JOIN as before, with no time filter. Then GROUP BY s.name, s.role and ORDER BY swipes DESC, s.name.',
      concepts: ['join', 'groupby', 'aggregate', 'orderby'],
      reveals: ['badge'],
      intel: 'The cash runner, Nell Crowe, used her badge 9 times. That is 3 times a night. The 2 counters used theirs 3 times each.',
      react: { who: 'lena', text: 'Then I take the cash runner’s badge. The door knows it best.' },
    },
    {
      title: 'Who Owes the Casino',
      ask: { who: 'viv', text: 'Ruby needs a rich player to keep the floor manager busy. Who owes the casino the most money?' },
      prompt: "From ledger, keep kind 'marker'. Group by party. Show party and SUM(amount) AS owed. Sort by owed, biggest first.",
      sql: "SELECT party, SUM(amount) AS owed FROM ledger WHERE kind = 'marker' GROUP BY party ORDER BY owed DESC;",
      orderMatters: true,
      hint: 'A marker is money a player owes the casino. Use GROUP BY party and SUM(amount), then ORDER BY owed DESC.',
      concepts: ['groupby', 'aggregate', 'orderby'],
      reveals: ['vip'],
      intel: 'Judge Amos Harlan owes the most: $52,000. Second is our driver, Dex Moran: $38,000. Then Vic Lomond ($21,000), Ray Harris ($9,500) and Celeste Morrow ($7,500).',
      react: { who: 'dex', text: 'That is old news. I paid it back. Next question.' },
    },
  ],

  blueprint,

  play: {
    question: 'When and how do we get into the count room?',
    options: [
      { id: 'corridor', label: 'Cage corridor, 03:40', detail: 'Use the runner’s badge at the staff door. Walk down the corridor.', route: [[1040, 690], [1040, 470], [1045, 345], [1050, 250], [1030, 185]] },
      { id: 'lift', label: 'Service lift, 03:40', detail: 'Go through the staff door on the casino floor. Take the lift down with the runner’s badge.', route: [[480, 215], [530, 225], [600, 225], [700, 225], [760, 140], [988, 150]] },
      { id: 'lift-early', label: 'Service lift, 02:45', detail: 'The same lift, 1 hour earlier. We have more time before the counters come.', route: [[480, 215], [530, 225], [600, 225], [700, 225], [760, 140], [988, 150]] },
      { id: 'lift-late', label: 'Service lift, 04:15', detail: 'The same lift, after all the cash is in the room.', route: [[480, 215], [530, 225], [600, 225], [700, 225], [760, 140], [988, 150]] },
    ],
    answer: 'lift',
    why: 'At 03:40 the big 3:30 drop is in the room. The counters come at 4:00. The lift camera is broken. The runner’s badge opens the door. And Ruby and the judge keep the floor manager busy.',
    wrong: {
      corridor: 'The cage corridor has 3 cameras, and all 3 work. A guard walks there all night.',
      'lift-early': 'At 02:45, the big drop is not there yet. We only got the small money.',
      'lift-late': 'From 04:00, the 2 counters are in the room. The lift door opened, and they saw us.',
    },
  },

  replay: {
    success: [
      { layout: '3b', panels: [
        { shot: 'city-establish', params: { building: 'Orpheum Casino' }, caption: '03:20 The Orpheum never closes. It only gets quieter.' },
        { shot: 'face', params: { who: 'lena', mood: 'smirk' }, lines: [{ who: 'lena', text: 'One more game, Judge. Stay with me.' }] },
        { shot: 'guard-patrol', caption: 'The floor manager walks to the VIP room. He must watch the judge.' },
      ] },
      { layout: '3a', panels: [
        { shot: 'clock', params: { time: '03:40' }, sfx: 'TIK' },
        { shot: 'door-keypad', params: { code: 'OR-14' }, sfx: 'BEEP', caption: 'The cash runner’s badge. She is at the bar. She does not know it is gone.' },
        { shot: 'cctv-monitor', params: { label: 'SERVICE LIFT · NO SIGNAL' }, lines: [{ who: 'juno', text: 'The lift camera is broken. Nobody can see us.' }] },
      ] },
      { layout: '2h', panels: [
        { shot: 'vault-door', sfx: 'KA-CHUNK', lines: [{ who: 'juno', text: 'The badge opens the door. I do the rest.' }] },
        { shot: 'loot', params: { item: 'Three bags of cash' }, caption: '3 bags of cash. Nobody has counted them yet. Nobody will.' },
      ] },
      { layout: '2h', panels: [
        { shot: 'getaway', sfx: 'VRRRM', lines: [{ who: 'dex', text: 'The bags are in the car. Hold on!' }] },
        { shot: 'clock', params: { time: '04:00' }, caption: '04:00 The counters open the count room. It is empty.' },
      ] },
    ],
    failure: [
      { layout: '2h', panels: [
        { shot: 'alarm', sfx: 'WHOOP', caption: 'All the lights come on. Every game in the casino stops.' },
        { shot: 'car-interior', params: { who: 'dex' }, lines: [{ who: 'dex', text: 'Leave the bags! Get out! We go back and plan again, Architect.' }] },
      ] },
    ],
  },

  debrief: {
    headline: 'CASH TAKEN FROM ORPHEUM CASINO COUNT ROOM',
    line: { who: 'viv', text: 'Crane’s own money will pay for the next job. I like that.' },
  },

  after: [
    { layout: '3a', panels: [
      { shot: 'crew-table', caption: 'The hideout, 05:00 Bags of money on the table. Nobody smiles.', lines: [{ who: 'otis', text: 'There was a new guard by the count room tonight. She started yesterday.' }] },
      { shot: 'face', params: { who: 'viv', mood: 'tense' }, lines: [{ who: 'viv', text: 'They knew we were coming. Someone talked.' }] },
      { shot: 'two-shot', params: { a: 'lena', b: 'otis' }, lines: [{ who: 'lena', text: 'Sam knows every guard in this city.' }, { who: 'otis', text: 'Are you saying it was me, Ruby?' }] },
    ] },
    { layout: '2v', tint: 'ink', panels: [
      { shot: 'face', params: { who: 'dex', mood: 'smirk' }, lines: [{ who: 'dex', text: 'Hey, we got the money! Let’s eat first. We can fight later.' }] },
      { shot: 'silhouette-reveal', params: { who: 'dex' }, caption: 'Later, outside the hideout. Dex makes a phone call in the dark. Nobody sees him.' },
    ] },
  ],
};
