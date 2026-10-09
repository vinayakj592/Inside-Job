// JOB 07: Top Floor. Crane's penthouse at the Marlowe. Focus: RANK · ROW_NUMBER · running totals · LAG.
// Facts come from docs/STORY.md §Job 7; every intel line is checked against the data with
// `node scripts/verify-content.mjs --dump --job penthouse`.
// Story (WRITING.md §3): take the vault codes. Spy clue: the unknown phone is near our hideout.
// After: Crane's men hurt Sam, the lowest point. Puzzle order climbs in difficulty; the short LAG
// on the unknown phone stays last because it carries the spy clue.

const blueprint = {
  title: 'THE MARLOWE · FLOOR 22 (PENTHOUSE)',
  scale: '1:100',
  layers: [
    { id: 'shell', label: 'Building shell', initial: true },
    { id: 'cameras', label: 'Cameras' },
    { id: 'occupancy', label: 'Who’s inside' },
    { id: 'staff', label: 'Floor guard' },
    { id: 'crane', label: 'Crane’s hours' },
    { id: 'leak', label: 'Unknown phone' },
  ],
  rooms: [
    { id: 'terrace', layer: 'shell', outdoor: true, name: 'Roof terrace', poly: [[884, 80], [1160, 80], [1160, 720], [420, 720], [420, 664], [884, 664]] },
    // hotel side
    { id: 'suite', layer: 'shell', name: 'Suite 2201', x: 80, y: 80, w: 320, h: 210 },
    { id: 'corr', layer: 'shell', name: 'Floor 22 corridor', x: 80, y: 290, w: 320, h: 90 },
    { id: 'lifts', layer: 'shell', name: 'Guest lifts', x: 80, y: 380, w: 140, h: 280 },
    { id: 'stair', layer: 'shell', name: 'Service stair', x: 220, y: 380, w: 180, h: 280 },
    // the penthouse
    { id: 'bed', layer: 'shell', name: 'Bedroom', x: 400, y: 80, w: 300, h: 210 },
    { id: 'salon', layer: 'shell', name: 'Penthouse', x: 400, y: 290, w: 300, h: 370 },
    { id: 'study', layer: 'shell', name: 'Study', x: 700, y: 80, w: 180, h: 300 },
    { id: 'dress', layer: 'shell', name: 'Dressing room', x: 700, y: 380, w: 180, h: 160 },
    { id: 'plift', layer: 'shell', name: 'Private lift', x: 700, y: 540, w: 180, h: 120 },
  ],
  stairs: [
    { layer: 'shell', x: 250, y: 440, w: 64, h: 120, dir: 'n', label: 'UP FROM 21' },
  ],
  walls: [
    // exterior shell
    { layer: 'shell', x1: 80, y1: 80, x2: 880, y2: 80 },
    { layer: 'shell', x1: 880, y1: 80, x2: 880, y2: 660 },
    { layer: 'shell', x1: 880, y1: 660, x2: 80, y2: 660 },
    { layer: 'shell', x1: 80, y1: 660, x2: 80, y2: 80 },
    // guest lift cars
    { layer: 'shell', x1: 80, y1: 520, x2: 150, y2: 520 },
    { layer: 'shell', x1: 150, y1: 400, x2: 150, y2: 470 },
    { layer: 'shell', x1: 150, y1: 570, x2: 150, y2: 640 },
    // private lift car (door gap 575–625)
    { layer: 'shell', x1: 780, y1: 540, x2: 780, y2: 575 },
    { layer: 'shell', x1: 780, y1: 625, x2: 780, y2: 660 },
    // study desk
    { layer: 'shell', x1: 715, y1: 250, x2: 755, y2: 250 },
  ],
  doors: [
    { layer: 'shell', x: 280, y: 380, w: 60, dir: 'h', label: 'Stair door' },
    { layer: 'shell', x: 150, y: 380, w: 50, dir: 'h' },
    { layer: 'shell', x: 180, y: 290, w: 50, dir: 'h' },
    { layer: 'shell', x: 400, y: 310, w: 50, dir: 'v', label: 'Penthouse' },
    { layer: 'shell', x: 500, y: 290, w: 50, dir: 'h' },
    { layer: 'shell', x: 700, y: 310, w: 50, dir: 'v' },
    { layer: 'shell', x: 700, y: 440, w: 50, dir: 'v' },
    { layer: 'shell', x: 700, y: 580, w: 50, dir: 'v' },
    { layer: 'shell', x: 520, y: 660, w: 80, dir: 'h', label: 'Terrace' },
    { layer: 'shell', x: 880, y: 130, w: 44, dir: 'v' },
  ],
  windows: [
    { layer: 'shell', x1: 430, y1: 80, x2: 670, y2: 80 },
    { layer: 'shell', x1: 720, y1: 80, x2: 860, y2: 80 },
    { layer: 'shell', x1: 880, y1: 210, x2: 880, y2: 360 },
    { layer: 'shell', x1: 880, y1: 400, x2: 880, y2: 520 },
    { layer: 'shell', x1: 430, y1: 660, x2: 500, y2: 660 },
    { layer: 'shell', x1: 620, y1: 660, x2: 690, y2: 660 },
    { layer: 'shell', x1: 110, y1: 80, x2: 370, y2: 80 },
    { layer: 'shell', x1: 80, y1: 110, x2: 80, y2: 260 },
  ],
  cameras: [
    { id: 'c45', layer: 'cameras', x: 95, y: 395, dir: 45, fov: 60, range: 90, label: 'Lift A' },
    { id: 'c46', layer: 'cameras', x: 95, y: 645, dir: 315, fov: 60, range: 90, label: 'Lift B' },
    { id: 'c47', layer: 'cameras', x: 865, y: 645, dir: 210, fov: 50, range: 80, label: 'Lift car' },
    { id: 'c48', layer: 'cameras', x: 715, y: 552, dir: 60, fov: 50, range: 70, label: 'Lift lobby' },
  ],
  guards: [
    { id: 'salt', layer: 'staff', name: 'Floor guard', path: [[100, 320], [380, 320], [380, 350], [325, 350], [325, 420], [295, 420], [295, 350], [100, 350]], loop: true, period: 14 },
    { id: 'vega', layer: 'occupancy', name: 'Housekeeping', path: [[430, 110], [670, 110], [670, 260], [430, 260]], loop: true, period: 12 },
  ],
  lasers: [],
  safes: [
    { id: 'safe', layer: 'shell', x: 800, y: 150, r: 22, label: 'Penthouse safe', kind: 'safe' },
  ],
  entries: [
    { id: 'stair', layer: 'staff', x: 380, y: 640, label: 'Service stair' },
    { id: 'plift', layer: 'cameras', x: 830, y: 600, label: 'Private lift' },
  ],
  notes: [
    { layer: 'cameras', x: 300, y: 606, text: '0 cameras', rot: -3 },
    { layer: 'occupancy', x: 550, y: 400, text: 'empty 22:05 → 01:10', rot: -2 },
    { layer: 'occupancy', x: 550, y: 238, text: 'housekeeping 23:30–23:45', rot: 2 },
    { layer: 'staff', x: 240, y: 250, text: 'guard: every 20 minutes', rot: -2 },
    { layer: 'staff', x: 240, y: 216, text: 'break 23:50 → 00:50', rot: 2 },
    { layer: 'crane', x: 1020, y: 190, text: 'Crane home: 00:58 or later', rot: -3 },
    { layer: 'leak', x: 1020, y: 400, text: 'DOCK-2 = OUR STREET', rot: -6 },
    { layer: 'leak', x: 1020, y: 440, text: '5 calls, 1 each week', rot: 2 },
  ],
  labels: [
    { layer: 'shell', x: 240, y: 120, text: 'Long-stay guest' },
    { layer: 'shell', x: 1020, y: 610, text: 'Roof terrace' },
    { layer: 'shell', x: 760, y: 700, text: 'Harbour side ↓' },
  ],
};

export default {
  id: 'penthouse', number: 7,
  title: 'Top Floor',
  target: 'Marlowe Hotel',
  district: 'Harbour Heights',
  hubPos: { x: 0.80, y: 0.22 },
  take: 800000,
  sqlFocus: 'RANK · ROW_NUMBER · running totals · LAG',
  logline: 'Crane lives on the top floor of a hotel. His safe holds the vault codes.',

  briefing: [
    { layout: 'full', panels: [
      { shot: 'title-card', params: { kicker: 'Job 07 · Harbour Heights', title: 'Top Floor' } },
    ] },
    { layout: '4', panels: [
      { shot: 'city-establish', params: { building: 'The Marlowe' }, caption: 'The Marlowe Hotel. 22 floors. Crane lives on the top floor.' },
      { shot: 'crew-table', caption: 'The hideout. Vera (the Boss) talks to the whole team.', lines: [{ who: 'viv', text: 'Crane’s safe has the codes for the Tower vault.' }, { who: 'viv', text: 'We go into his home on Saturday.' }] },
      { shot: 'face', params: { who: 'lena', mood: 'smirk' }, caption: 'Ruby (the Actor) is already inside the hotel.', lines: [{ who: 'lena', text: 'I am in room 2104, on floor 21. Everyone thinks I am a rich lady.' }] },
      { shot: 'face', params: { who: 'viv', mood: 'calm' }, caption: 'Later, Vera speaks only to you.', lines: [{ who: 'viv', text: 'It is not Saturday, Architect. It is Friday.' }, { who: 'viv', text: 'Only you and I know that.' }] },
    ] },
  ],

  puzzles: [
    {
      title: 'Ways Up',
      ask: { who: 'dex', text: 'There are many ways up to Crane’s floor. Which ones have the fewest cameras?' },
      prompt: 'For every zone in building 7, show zone (the name), live_cams and rnk. Sort by rnk, then zone. LEFT JOIN cameras c, with c.working = 1 inside the ON. live_cams counts those cameras. rnk is RANK() by live_cams, lowest first.',
      sql: 'SELECT z.name AS zone, COUNT(c.id) AS live_cams, RANK() OVER (ORDER BY COUNT(c.id)) AS rnk FROM zones z LEFT JOIN cameras c ON c.zone_id = z.id AND c.working = 1 WHERE z.building_id = 7 GROUP BY z.name ORDER BY rnk, zone;',
      orderMatters: true,
      hint: 'GROUP BY z.name and use COUNT(c.id). Then use RANK() OVER (ORDER BY COUNT(c.id)). Equal counts get the same rank.',
      concepts: ['window', 'leftjoin', 'groupby', 'aggregate'],
      reveals: ['cameras'],
      intel: 'The Penthouse and the Service stair have 0 working cameras. They share rank 1. Floor 21 corridor has 1 (rank 3). Guest lifts and Private lift have 2 (rank 4). Lobby has 3 (rank 6).',
      react: { who: 'juno', text: 'Rank 1, rank 1, then rank 3. RANK skips a number when 2 zones share a rank.' },
    },
    {
      title: 'Who Is Inside',
      ask: { who: 'juno', text: 'The penthouse door records everyone who goes in or out. When is nobody inside?' },
      prompt: "Show at, credential, direction and inside for door 'Penthouse', from '2025-11-13 18:00' to '2025-11-14 02:00'. Sort by at. inside is a running total: +1 for each 'in', −1 for each 'out'.",
      sql: "SELECT at, credential, direction, SUM(CASE WHEN direction = 'in' THEN 1 ELSE -1 END) OVER (ORDER BY at) AS inside FROM access_log WHERE door = 'Penthouse' AND at BETWEEN '2025-11-13 18:00' AND '2025-11-14 02:00' ORDER BY at;",
      orderMatters: true,
      hint: "Use CASE WHEN direction = 'in' THEN 1 ELSE -1 END. Put it inside SUM( … ) OVER (ORDER BY at) for a running total.",
      concepts: ['window', 'casewhen', 'between', 'orderby'],
      reveals: ['occupancy'],
      intel: 'Last night, Crane’s bodyguard (GR-50) left at 22:05. Then nobody was inside until Crane came home at 01:10. Only housekeeping (MV-48) came in, from 23:30 to 23:45.',
      react: { who: 'juno', text: '0 people inside. That is my favourite number.' },
    },
    {
      title: 'The Stair Door',
      ask: { who: 'otis', text: 'The floor guard checks the stair door on his rounds. How many minutes between checks?' },
      prompt: "For door 'Service stair 22', show at and gap_min. Sort by at. gap_min is the minutes since the swipe before. Use LAG(at) OVER (ORDER BY at) and julianday. Multiply the difference by 1440, then ROUND it and CAST it AS INTEGER.",
      sql: "SELECT at, CAST(ROUND((julianday(at) - julianday(LAG(at) OVER (ORDER BY at))) * 1440) AS INTEGER) AS gap_min FROM access_log WHERE door = 'Service stair 22' ORDER BY at;",
      orderMatters: true,
      hint: 'LAG(at) OVER (ORDER BY at) gives the swipe before. julianday(a) - julianday(b) gives days. Times 1440 gives minutes.',
      concepts: ['window', 'dates', 'orderby'],
      reveals: ['staff'],
      intel: 'From 22:10 to 23:50, the guard checks the door every 20 minutes. Then there is a gap of 60 minutes, until 00:50. After that, every 20 minutes again.',
      react: { who: 'otis', text: 'That 60-minute gap is his break. Guards always take the full hour.' },
    },
    {
      title: 'Coming Home',
      ask: { who: 'viv', text: 'Crane always comes home late. How late? I need his last entry each night.' },
      prompt: "Use door 'Penthouse' rows with credential 'AC-0001' and direction 'in'. night is date(at, '-12 hours'). In a subquery, number each night's rows newest first with ROW_NUMBER() AS rn. Keep rn = 1. Show night and home (the at). Sort by night.",
      sql: "SELECT night, at AS home FROM (SELECT date(at, '-12 hours') AS night, at, ROW_NUMBER() OVER (PARTITION BY date(at, '-12 hours') ORDER BY at DESC) AS rn FROM access_log WHERE door = 'Penthouse' AND credential = 'AC-0001' AND direction = 'in') WHERE rn = 1 ORDER BY night;",
      orderMatters: true,
      hint: "In the subquery, use ROW_NUMBER() OVER (PARTITION BY date(at, '-12 hours') ORDER BY at DESC) AS rn. Outside it, use WHERE rn = 1.",
      concepts: ['rownum', 'window', 'dates', 'subquery'],
      reveals: ['crane'],
      intel: 'Crane came home at 01:05, 01:12, 00:58 and 01:10. The earliest was 00:58.',
      react: { who: 'viv', text: 'So we must be out before 00:58. Not one minute later.' },
    },
    {
      title: 'Same Street',
      ask: { who: 'juno', text: 'Look at the unknown phone again. List its calls, each one next to the call before.' },
      prompt: "Show at, cell and previous for every call from '555-0199' before '2025-11-14'. Sort by at. previous is the time of the call before: LAG(at) OVER (ORDER BY at).",
      sql: "SELECT at, cell, LAG(at) OVER (ORDER BY at) AS previous FROM calls WHERE caller = '555-0199' AND at < '2025-11-14' ORDER BY at;",
      orderMatters: true,
      hint: 'Use LAG(at) OVER (ORDER BY at) AS previous. The first call has no call before it, so it shows NULL.',
      concepts: ['window', 'where', 'orderby'],
      reveals: ['leak'],
      intel: 'The unknown phone called 5 times, from 10-16 23:47 to 11-13 23:38. The calls are about 1 week apart, each after a team meeting. Every call came from DOCK-2, the phone tower on our street.',
      react: { who: 'juno', text: 'DOCK-2? That is our street. That is our hideout.' },
    },
  ],

  blueprint,

  play: {
    question: 'When do we go up, and which way?',
    options: [
      { id: 'lift', label: 'Private lift, 23:30', detail: 'Ride Crane’s own lift up to his rooms.', route: [[830, 620], [740, 605], [680, 605], [560, 450], [690, 338], [720, 335], [800, 175]] },
      { id: 'stair', label: 'Service stair, 23:55', detail: 'Walk up 1 floor from Ruby’s room. Go in the front door.', route: [[310, 520], [310, 340], [380, 335], [440, 335], [660, 335], [740, 335], [800, 175]] },
      { id: 'late', label: 'Service stair, 01:20', detail: 'The same stair, late, when the hotel is asleep.', route: [[318, 520], [318, 345], [380, 344], [440, 344], [660, 344], [740, 344], [806, 178]] },
      { id: 'early', label: 'Service stair, 22:40', detail: 'The same stair, early. We have lots of time.', route: [[302, 520], [302, 328], [380, 326], [440, 326], [660, 326], [740, 326], [794, 172]] },
    ],
    answer: 'stair',
    why: 'At 23:55 the floor guard is on his break. Housekeeping left at 23:45. The stair has no cameras. Crane never comes home before 00:58.',
    wrong: {
      lift: 'Housekeeping is inside from 23:30 to 23:45. And the private lift has 2 working cameras.',
      late: 'At 01:20 Crane is home. He came home by 01:12 every night.',
      early: 'At 22:40 the floor guard checks the stair door every 20 minutes. He sees us.',
    },
  },

  replay: {
    success: [
      { layout: '3a', panels: [
        { shot: 'city-establish', params: { building: 'Marlowe Hotel' }, caption: 'Friday night. Rain on the harbour. The hotel expects trouble on Saturday.' },
        { shot: 'clock', params: { time: '23:50' }, sfx: 'TIK' },
        { shot: 'guard-patrol', caption: 'The floor guard checks the stair door. Then he goes on his break.' },
      ] },
      { layout: '3b', panels: [
        { shot: 'face', params: { who: 'lena', mood: 'smirk' }, caption: '23:55. Room 2104.', lines: [{ who: 'lena', text: 'Up 1 floor, everyone. Walk quietly.' }] },
        { shot: 'door-keypad', params: { code: '2200' }, sfx: 'BEEP', lines: [{ who: 'juno', text: 'Crane’s door lock. Old and easy.' }] },
        { shot: 'rooftop', caption: 'Floor 22. Dark glass. The harbour far below. Nobody is home.' },
      ] },
      { layout: '2h', panels: [
        { shot: 'safe-dial', sfx: 'CLICK', caption: 'Kim (the Safe Expert) listens to the dial. Click. Click. Open.' },
        { shot: 'loot', params: { item: 'Crane Tower vault codes' }, caption: 'The codes for the Crane Tower vault. New this month.' },
      ] },
      { layout: '2h', panels: [
        { shot: 'clock', params: { time: '00:20' }, caption: 'Down the stair again. 38 minutes before Crane can be home.' },
        { shot: 'getaway', sfx: 'VRRRM', lines: [{ who: 'dex', text: 'Friday? Nobody told me it was Friday.' }] },
      ] },
    ],
    failure: [
      { layout: '2h', panels: [
        { shot: 'alarm', sfx: 'BRRRING', caption: 'An alarm rings on floor 22.' },
        { shot: 'car-interior', params: { who: 'dex' }, lines: [{ who: 'dex', text: 'Get out! Everyone out! Architect, think again.' }] },
      ] },
    ],
  },

  debrief: {
    headline: 'MARLOWE BREAK-IN: CRANE SAYS NOTHING WAS TAKEN',
    line: { who: 'viv', text: 'Of course he says that. He cannot tell them what we took.' },
  },

  after: [
    { layout: '3a', tint: 'ink', panels: [
      { shot: 'street-rain', caption: 'Saturday, 01:40. Rain. Sam (the Guard) walks home alone, like every night.' },
      { shot: 'silhouette-reveal', params: { who: 'voight' }, caption: '4 men wait in a doorway. Crane’s guard boss puts on his gloves.' },
      { shot: 'face', params: { who: 'otis', mood: 'shock' }, sfx: 'CRACK', caption: 'They hurt Sam. They hurt him badly.' },
    ] },
    { layout: '4', panels: [
      { shot: 'two-shot', params: { a: 'calloway', b: 'viv' }, caption: 'The hospital, 03:10. Detective Cole is there.', lines: [{ who: 'calloway', text: 'Sam has 2 broken ribs and a broken arm. Crane did this.' }, { who: 'viv', text: 'Crane knew where Sam walks. Someone told him.' }] },
      { shot: 'crew-table', caption: 'The hideout. Sam’s chair is empty.', lines: [{ who: 'juno', text: 'Every call from the unknown phone came from our street.' }] },
      { shot: 'face', params: { who: 'viv', mood: 'tense' }, lines: [{ who: 'viv', text: 'Then one of us is a spy.' }] },
      { shot: 'phone', params: { who: 'crane' }, caption: 'Then the phone rings. It is Crane.', lines: [{ who: 'crane', text: 'Next time I hurt Kim, Vera. Give me your Architect.' }] },
    ] },
  ],
};
