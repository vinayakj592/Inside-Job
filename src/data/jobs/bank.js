// JOB 05: Box 1127. First Meridian Bank. Focus: subqueries · LEFT JOIN · IS NULL.
// Facts come from docs/STORY.md §Job 5; every intel line is checked against the data with
// `node scripts/verify-content.mjs --dump --job bank`.
// Puzzle order differs from the bible table (P2 and P3 swapped) so difficulty climbs:
// two scalar subqueries first, then three LEFT JOIN … IS NULL anti-joins of rising complexity.
// Spy clue: P5 finds an unknown phone that calls Crane after every team meeting.
// After-beat: the team argues and Ruby makes a secret call (to Cole, revealed in the epilogue).

const blueprint = {
  title: 'FIRST MERIDIAN BANK · BANKING HALL + LOWER LEVEL',
  scale: '1:100',
  layers: [
    { id: 'shell', label: 'Building shell', initial: true },
    { id: 'boxes', label: 'Deposit boxes' },
    { id: 'staff', label: 'Night guards' },
    { id: 'cameras', label: 'Cameras' },
    { id: 'ghost', label: 'Empty post' },
    { id: 'leak', label: 'The phone calls' },
  ],
  rooms: [
    { id: 'street', layer: 'shell', outdoor: true, name: 'Meridian Avenue', x: 40, y: 604, w: 1120, h: 116 },
    { id: 'lane', layer: 'shell', outdoor: true, name: 'Meridian Lane', x: 1064, y: 80, w: 100, h: 520 },
    // lower level (−1)
    { id: 'vault', layer: 'shell', name: 'Box vault', x: 80, y: 80, w: 500, h: 240 },
    { id: 'records', layer: 'shell', name: 'Records room', x: 580, y: 80, w: 330, h: 240 },
    { id: 'rcorr', layer: 'shell', name: 'Records corridor', x: 910, y: 80, w: 150, h: 240 },
    // banking hall (ground)
    { id: 'vstair', layer: 'shell', name: 'Vault stair', x: 80, y: 320, w: 320, h: 140 },
    { id: 'depo', layer: 'shell', name: 'Night depository', x: 80, y: 460, w: 320, h: 140 },
    { id: 'teller', layer: 'shell', name: 'Teller line', x: 400, y: 320, w: 510, h: 80 },
    { id: 'hall', layer: 'shell', name: 'Main hall', x: 400, y: 400, w: 510, h: 200 },
    { id: 'bstair', layer: 'shell', name: 'Back stair', x: 910, y: 320, w: 150, h: 150 },
    { id: 'desk', layer: 'shell', name: 'Night desk', x: 910, y: 470, w: 150, h: 130 },
  ],
  stairs: [
    { layer: 'shell', x: 950, y: 338, w: 70, h: 104, dir: 'n', label: 'DOWN TO −1' },
    { layer: 'shell', x: 96, y: 336, w: 60, h: 104, dir: 'n', label: 'DOWN' },
  ],
  walls: [
    // exterior shell
    { layer: 'shell', x1: 80, y1: 80, x2: 1060, y2: 80 },
    { layer: 'shell', x1: 1060, y1: 80, x2: 1060, y2: 600 },
    { layer: 'shell', x1: 1060, y1: 600, x2: 80, y2: 600 },
    { layer: 'shell', x1: 80, y1: 600, x2: 80, y2: 80 },
    // the slab between the banking hall and the lower level
    { layer: 'shell', x1: 80, y1: 320, x2: 1060, y2: 320 },
    // records shelving
    { layer: 'shell', x1: 660, y1: 236, x2: 660, y2: 304 },
    { layer: 'shell', x1: 710, y1: 236, x2: 710, y2: 304 },
    { layer: 'shell', x1: 760, y1: 236, x2: 760, y2: 304 },
    { layer: 'shell', x1: 810, y1: 236, x2: 810, y2: 304 },
    { layer: 'shell', x1: 860, y1: 236, x2: 860, y2: 304 },
    // deposit-box banks: west wall, and the east wall that backs onto the records room
    { layer: 'boxes', x1: 110, y1: 96, x2: 110, y2: 304 },
    { layer: 'boxes', x1: 550, y1: 96, x2: 550, y2: 304 },
    ...[116, 136, 156, 176, 196, 216, 236, 256, 276, 296].flatMap((y) => [
      { layer: 'boxes', x1: 80, y1: y, x2: 110, y2: y },
      { layer: 'boxes', x1: 550, y1: y, x2: 580, y2: y },
    ]),
  ],
  doors: [
    { layer: 'shell', x: 1060, y: 365, w: 50, dir: 'v' },
    { layer: 'shell', x: 960, y: 320, w: 50, dir: 'h' },
    { layer: 'shell', x: 910, y: 410, w: 45, dir: 'v' },
    { layer: 'shell', x: 910, y: 520, w: 45, dir: 'v' },
    { layer: 'shell', x: 910, y: 170, w: 50, dir: 'v' },
    { layer: 'shell', x: 440, y: 400, w: 50, dir: 'h' },
    { layer: 'shell', x: 615, y: 600, w: 80, dir: 'h', label: 'Main doors' },
    { layer: 'shell', x: 400, y: 408, w: 44, dir: 'v' },
    { layer: 'shell', x: 210, y: 320, w: 60, dir: 'h' },
    { layer: 'shell', x: 150, y: 460, w: 50, dir: 'h' },
    { layer: 'shell', x: 120, y: 600, w: 50, dir: 'h' },
  ],
  windows: [
    { layer: 'shell', x1: 430, y1: 600, x2: 590, y2: 600 },
    { layer: 'shell', x1: 720, y1: 600, x2: 880, y2: 600 },
    { layer: 'shell', x1: 930, y1: 600, x2: 1040, y2: 600 },
    { layer: 'shell', x1: 1060, y1: 490, x2: 1060, y2: 580 },
  ],
  cameras: [
    { id: 'c30', layer: 'cameras', x: 415, y: 412, dir: 35, fov: 60, range: 200, label: 'Hall N' },
    { id: 'c31', layer: 'cameras', x: 898, y: 590, dir: 220, fov: 60, range: 200, label: 'Hall S' },
    { id: 'c32', layer: 'cameras', x: 655, y: 412, dir: 90, fov: 40, range: 170, label: 'Main doors' },
    { id: 'c35', layer: 'cameras', x: 898, y: 360, dir: 180, fov: 20, range: 200, label: 'Teller line' },
    { id: 'c33', layer: 'cameras', x: 128, y: 304, dir: 340, fov: 36, range: 180, label: 'Vault door' },
    { id: 'c34', layer: 'cameras', x: 530, y: 98, dir: 105, fov: 36, range: 205, label: 'Box aisle' },
  ],
  guards: [
    { id: 'bell', layer: 'staff', name: 'T. Bell', path: [[240, 430], [240, 295], [520, 295], [520, 110], [140, 110], [140, 295], [225, 295]], loop: true, period: 16 },
    { id: 'dole', layer: 'staff', name: 'M. Dole', path: [[430, 425], [880, 425], [880, 580], [430, 580]], loop: true, period: 18 },
    { id: 'kast', layer: 'staff', name: 'I. Kast', path: [[810, 545], [500, 545], [500, 470], [810, 470]], loop: true, period: 13 },
  ],
  lasers: [],
  safes: [
    { id: 'b1127', layer: 'boxes', x: 565, y: 150, r: 13, label: 'Box 1127', kind: 'safe' },
    { id: 'b1131', layer: 'boxes', x: 565, y: 255, r: 13, label: 'Box 1131', kind: 'safe' },
  ],
  entries: [
    { id: 'staff', layer: 'ghost', x: 1088, y: 390, label: 'Staff entrance' },
    { id: 'chute', layer: 'leak', x: 145, y: 625, label: 'Night chute' },
  ],
  notes: [
    { layer: 'boxes', x: 300, y: 150, text: 'CH Group owns 2 boxes', rot: -3 },
    { layer: 'boxes', x: 626, y: 200, text: 'back of the boxes!', rot: -90 },
    { layer: 'staff', x: 322, y: 444, text: 'new guard: break 02:40', rot: -2 },
    { layer: 'staff', x: 655, y: 452, text: 'hall guard breaks: 1:00, 3:30', rot: 2 },
    { layer: 'cameras', x: 760, y: 140, text: 'no cameras down here', rot: -2 },
    { layer: 'ghost', x: 985, y: 116, text: 'his post', rot: 3 },
    { layer: 'ghost', x: 985, y: 148, text: 'he never comes', rot: -3 },
    { layer: 'leak', x: 330, y: 506, text: 'NOT SAFE', rot: -8 },
    { layer: 'leak', x: 300, y: 664, text: 'unknown phone called Crane, 23:52', rot: -2 },
  ],
  labels: [
    { layer: 'shell', x: 760, y: 104, text: 'LOWER LEVEL · −1' },
  ],
};

export default {
  id: 'bank', number: 5,
  title: 'Box 1127',
  target: 'First Meridian Bank',
  district: 'Financial District',
  hubPos: { x: 0.64, y: 0.38 },
  take: 400000,
  sqlFocus: 'Subqueries · LEFT JOIN · IS NULL',
  logline: 'Crane hides a second record book in a bank box. But someone tells him our plans.',

  briefing: [
    { layout: 'full', panels: [
      { shot: 'title-card', params: { kicker: 'Job 05 · Financial District', title: 'Box 1127' } },
    ] },
    { layout: '4', panels: [
      { shot: 'crew-table', caption: 'The hideout. Crane knows who they are now. Nobody sits down.', lines: [{ who: 'viv', text: 'So we must move fast. Next is First Meridian Bank, Box 1127.' }] },
      { shot: 'face', params: { who: 'juno', mood: 'tense' }, caption: 'Kim, our safe expert, has read about the box.', lines: [{ who: 'juno', text: 'Crane keeps a second record book in it. It shows where his money goes.' }] },
      { shot: 'face', params: { who: 'viv', mood: 'calm' }, lines: [{ who: 'viv', text: 'Here is the plan. We go in through the night depository at 03:00' }, { who: 'viv', text: 'That is the slot where people leave money at night.' }] },
      { shot: 'face', params: { who: 'lena', mood: 'calm' }, caption: 'Ruby, our actor, gets up first.', lines: [{ who: 'lena', text: 'Good plan. Now I must go. I have a phone call to make.' }] },
    ] },
  ],

  puzzles: [
    {
      title: 'Two Boxes',
      ask: { who: 'viv', text: 'Box 1127 belongs to someone. Find the owner, and everything else they keep in this bank.' },
      prompt: "Use a subquery to find the owner of location 'Box 1127' in valuables. Show location, item, owner and stored_at for everything with that owner. Sort by location.",
      sql: "SELECT location, item, owner, stored_at FROM valuables WHERE owner = (SELECT owner FROM valuables WHERE location = 'Box 1127') ORDER BY location;",
      orderMatters: true,
      hint: "Write the inner query first: SELECT owner FROM valuables WHERE location = 'Box 1127'. Put it in brackets after WHERE owner =.",
      concepts: ['subquery', 'where', 'orderby'],
      reveals: ['boxes'],
      intel: 'Box 1127 belongs to CH Group, Crane’s secret company. It holds “Ledger, second set”: a second record book. CH Group also owns Box 1131. It holds “Stone vault drawings (originals)”: Vera’s own drawings.',
      react: { who: 'viv', text: 'My drawings. He kept them. We take both boxes.' },
    },
    {
      title: 'The New Guard',
      ask: { who: 'otis', text: 'A bank often puts its newest guard near the vault. Find the newest guard at First Meridian.' },
      prompt: 'From staff, keep building_id = 5. Show name, post, break_at and hired for the person with the latest hired date. Find that date with a subquery using MAX(hired).',
      sql: 'SELECT name, post, break_at, hired FROM staff WHERE building_id = 5 AND hired = (SELECT MAX(hired) FROM staff WHERE building_id = 5);',
      orderMatters: false,
      hint: 'The subquery (SELECT MAX(hired) FROM staff WHERE building_id = 5) gives one date. Use WHERE hired = ( … ) to match it.',
      concepts: ['subquery', 'aggregate', 'where'],
      reveals: ['staff'],
      intel: 'The newest guard is Toby Bell, hired on October 27. He works in the Box vault. His break is at 02:40',
      react: { who: 'otis', text: 'New guards always take their full 30-minute break. They follow every rule.' },
    },
    {
      title: 'No Cameras',
      ask: { who: 'juno', text: 'Do not tell me where the cameras are. Tell me where they are not.' },
      prompt: 'Use a LEFT JOIN from zones z to cameras c on c.zone_id = z.id. Keep z.building_id = 5 and c.id IS NULL. Show z.name and z.alarm. Sort by z.name.',
      sql: 'SELECT z.name, z.alarm FROM zones z LEFT JOIN cameras c ON c.zone_id = z.id WHERE z.building_id = 5 AND c.id IS NULL ORDER BY z.name;',
      orderMatters: true,
      hint: 'LEFT JOIN keeps every zone. A zone with no camera gets NULL on the camera side, so use WHERE c.id IS NULL.',
      concepts: ['leftjoin', 'nulls', 'orderby'],
      reveals: ['cameras'],
      intel: '3 zones have no camera at all. They are the Night depository, the Records corridor and the Records room. None of them has an alarm (NULL).',
      react: { who: 'juno', text: 'The Records room is right behind the box vault. And nobody watches it.' },
    },
    {
      title: 'The Missing Guard',
      ask: { who: 'lena', text: 'Some guards get paid but never come to work. Is there one at this bank?' },
      prompt: "Use a LEFT JOIN from staff s to access_log a on a.staff_id = s.id. Keep s.building_id = 5, s.shift = 'night' and a.id IS NULL. Show s.name and s.post.",
      sql: "SELECT s.name, s.post FROM staff s LEFT JOIN access_log a ON a.staff_id = s.id WHERE s.building_id = 5 AND s.shift = 'night' AND a.id IS NULL;",
      orderMatters: false,
      hint: 'This is the same LEFT JOIN idea. A guard who never used a badge gets NULL, so use WHERE a.id IS NULL.',
      concepts: ['leftjoin', 'nulls', 'where'],
      reveals: ['ghost'],
      intel: 'Walt Pruitt is the night guard for the Records corridor. He has never used his badge. So the corridor is empty all night.',
      react: { who: 'otis', text: 'I know him. He is old and his knees hurt. He gets paid and stays home.' },
    },
    {
      title: 'The Unknown Phone',
      ask: { who: 'viv', text: 'The record book from the pawn shop had Crane’s private number: 555-0001. Did an unknown phone call it?' },
      prompt: "Use a LEFT JOIN from calls c to phones p on p.number = c.caller. Keep c.callee = '555-0001', c.at before '2025-10-31' and p.number IS NULL. Show c.caller, c.at and c.cell. Sort by c.at.",
      sql: "SELECT c.caller, c.at, c.cell FROM calls c LEFT JOIN phones p ON p.number = c.caller WHERE c.callee = '555-0001' AND p.number IS NULL AND c.at < '2025-10-31' ORDER BY c.at;",
      orderMatters: true,
      hint: 'The phones table is the phone book. A caller who is not in it gets NULL, so use WHERE p.number IS NULL.',
      concepts: ['leftjoin', 'nulls', 'andor', 'orderby'],
      reveals: ['leak'],
      intel: 'An unknown phone, 555-0199, called Crane 3 times. It called on October 16 and October 23. The last call came at 23:52 tonight. Each call came right after a team meeting. All 3 used the same phone tower: DOCK-2.',
      react: { who: 'viv', text: 'Someone tells Crane our plans. We cannot use the night depository now.' },
    },
  ],

  blueprint,

  play: {
    question: 'How do we reach Box 1127 and Box 1131?',
    options: [
      { id: 'depository', label: 'Night depository, 03:00', detail: 'Our plan from the meeting. Go in through the night slot. It has no cameras.', route: [[145, 700], [145, 540], [175, 500], [175, 400], [240, 360], [240, 250], [530, 215]] },
      { id: 'hall', label: 'Main doors, 02:40', detail: 'Walk across the main hall. Go down the stairs to the vault door.', route: [[655, 700], [655, 540], [520, 470], [420, 432], [370, 432], [300, 380], [230, 330], [230, 250], [520, 220]] },
      { id: 'records-early', label: 'Records room, 01:30', detail: 'Staff door, back stairs, then cut through the Records room wall. Go early, while it is quiet.', route: [[1110, 400], [995, 400], [995, 305], [995, 205], [880, 205], [590, 210]] },
      { id: 'records', label: 'Records room, 02:40', detail: 'Staff door, back stairs, Records corridor. Cut through the wall into the back of the boxes.', route: [[1110, 390], [985, 390], [985, 300], [985, 195], [880, 195], [590, 200]] },
    ],
    answer: 'records',
    why: 'The Records corridor and the Records room have no cameras. The night guard there never comes to work. At 02:40, the new guard leaves the vault. Both boxes are on the wall we cut.',
    wrong: {
      depository: 'The unknown phone called Crane at 23:52, right after our meeting. Crane’s men were waiting at the night slot.',
      hall: 'The main hall has 3 working cameras. And the vault door has an alarm until 07:30',
      'records-early': 'At 01:30 the new guard is still in the vault. He heard us cut the wall.',
    },
  },

  replay: {
    success: [
      { layout: '3a', panels: [
        { shot: 'street-rain', caption: '02:38 Meridian Lane. Rain on the bank’s back door.' },
        { shot: 'clock', params: { time: '02:40' }, sfx: 'TIK' },
        { shot: 'guard-patrol', caption: 'The new guard leaves the vault for his break. He will take all 30 minutes.' },
      ] },
      { layout: '2h', panels: [
        { shot: 'door-keypad', params: { code: '0240' }, sfx: 'BEEP', lines: [{ who: 'juno', text: 'The staff door is open. Tonight, I am staff.' }] },
        { shot: 'face', params: { who: 'otis', mood: 'calm' }, caption: 'The Records corridor. One empty chair.', lines: [{ who: 'otis', text: 'This guard never comes. His chair is cold.' }] },
      ] },
      { layout: '3b', panels: [
        { shot: 'safe-dial', sfx: 'HSSSSS', caption: 'A very hot tool cuts through the back of the boxes. The alarm does not hear it.' },
        { shot: 'cctv-monitor', params: { label: 'BOX AISLE · ALL QUIET' }, lines: [{ who: 'juno', text: 'Their camera watches the front of the boxes. We came in the back.' }] },
        { shot: 'loot', params: { item: 'Crane’s second record book' }, caption: 'Box 1127. The secret book of CH Group. More proof.' },
      ] },
      { layout: '2h', panels: [
        { shot: 'loot', params: { item: 'Vera’s vault drawings' }, caption: 'Box 1131. Vera’s own drawings of the vault.' },
        { shot: 'getaway', sfx: 'VRRRM', lines: [{ who: 'dex', text: 'The Records room? Why did nobody tell me the new plan?' }] },
      ] },
    ],
    failure: [
      { layout: '2h', panels: [
        { shot: 'alarm', sfx: 'BRRRING', caption: 'Someone was waiting for us. Again.' },
        { shot: 'car-interior', params: { who: 'dex' }, lines: [{ who: 'dex', text: 'Lights on every floor! Hold on, Architect. We are leaving.' }] },
      ] },
    ],
  },

  debrief: {
    headline: 'THIEVES CUT INTO BANK THROUGH RECORDS ROOM WALL',
    line: { who: 'viv', text: 'We opened 2 boxes. One of them was mine.' },
  },

  after: [
    { layout: '3a', panels: [
      { shot: 'crew-table', caption: 'The hideout. The fight starts over nothing.', lines: [{ who: 'juno', text: 'An unknown phone calls Crane after every meeting. Who is it?' }] },
      { shot: 'two-shot', params: { a: 'dex', b: 'lena' }, lines: [{ who: 'dex', text: 'Ruby, where do you go after our meetings?' }, { who: 'lena', text: 'Out. Where do you go, Dex?' }] },
      { shot: 'face', params: { who: 'otis', mood: 'tense' }, lines: [{ who: 'otis', text: 'Stop it! Listen to us. We sound like Crane’s men.' }] },
    ] },
    { layout: '2h', tint: 'ink', panels: [
      { shot: 'phone', params: { who: 'lena' }, caption: 'Later. A pay phone in the rain. Ruby looks around, then calls.', lines: [{ who: 'lena', text: 'It is me. I need more time.' }] },
      { shot: 'face', params: { who: 'viv', mood: 'tense' }, caption: 'Across the street, Vera watches her.', lines: [{ who: 'viv', text: 'Who are you calling, Ruby?' }] },
    ] },
  ],
};
