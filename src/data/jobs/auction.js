// JOB 06: Lot 47. Halloway & Sons. Story: take Crane's drawings of his tower (WRITING.md §3).
// Focus: CASE WHEN · COALESCE · text & date functions.
// Facts come from docs/STORY.md §Job 6; every intel line is checked against the data with
// `node scripts/verify-content.mjs --dump --job auction`.

const blueprint = {
  title: 'HALLOWAY & SONS · SALE FLOOR + BASEMENT',
  scale: '1:100',
  layers: [
    { id: 'shell', label: 'Building shell', initial: true },
    { id: 'storage', label: 'Where lots wait' },
    { id: 'bids', label: 'The bids' },
    { id: 'crane', label: 'Phone bank' },
    { id: 'timing', label: 'Porter times' },
    { id: 'staff', label: 'Staff' },
  ],
  rooms: [
    { id: 'street', layer: 'shell', outdoor: true, name: 'Chancery Lane', x: 40, y: 626, w: 1120, h: 100 },
    // saleroom level
    { id: 'sale', layer: 'shell', name: 'Saleroom', x: 80, y: 80, w: 440, h: 400 },
    { id: 'pstair', layer: 'shell', name: 'Porters’ stair', x: 520, y: 80, w: 180, h: 100 },
    { id: 'phones', layer: 'shell', name: 'Phone bank', x: 520, y: 180, w: 180, h: 120 },
    { id: 'bstair', layer: 'shell', name: 'Back stair', x: 520, y: 300, w: 180, h: 120 },
    { id: 'foyer', layer: 'shell', name: 'Foyer', x: 520, y: 420, w: 180, h: 200 },
    { id: 'gallery', layer: 'shell', name: 'Viewing gallery', x: 80, y: 480, w: 220, h: 140 },
    { id: 'bay', layer: 'shell', name: 'Loading bay', x: 300, y: 480, w: 220, h: 140 },
    // basement (−1)
    { id: 'stock', layer: 'shell', name: 'Stockroom', x: 700, y: 80, w: 420, h: 280 },
    { id: 'cage', layer: 'shell', name: 'Cage', x: 700, y: 360, w: 200, h: 130 },
    { id: 'lobby', layer: 'shell', name: 'Lift lobby', x: 700, y: 490, w: 200, h: 130 },
    { id: 'strong', layer: 'shell', name: 'Strongroom', x: 900, y: 360, w: 220, h: 260 },
  ],
  stairs: [
    { layer: 'shell', x: 548, y: 94, w: 124, h: 64, dir: 'e', label: 'DOWN' },
    { layer: 'shell', x: 548, y: 318, w: 64, h: 90, dir: 's', label: 'DOWN' },
  ],
  walls: [
    // exterior shell
    { layer: 'shell', x1: 80, y1: 80, x2: 1120, y2: 80 },
    { layer: 'shell', x1: 1120, y1: 80, x2: 1120, y2: 620 },
    { layer: 'shell', x1: 1120, y1: 620, x2: 80, y2: 620 },
    { layer: 'shell', x1: 80, y1: 620, x2: 80, y2: 80 },
    // the rostrum
    { layer: 'shell', x1: 265, y1: 96, x2: 335, y2: 96 },
    { layer: 'shell', x1: 260, y1: 100, x2: 260, y2: 160 },
    { layer: 'shell', x1: 265, y1: 164, x2: 335, y2: 164 },
    // saleroom seating rows
    ...[250, 290, 330].flatMap((y) => [
      { layer: 'shell', x1: 120, y1: y, x2: 190, y2: y },
      { layer: 'shell', x1: 230, y1: y, x2: 300, y2: y },
      { layer: 'shell', x1: 340, y1: y, x2: 410, y2: y },
    ]),
    // strongroom shelving
    { layer: 'shell', x1: 1100, y1: 420, x2: 1100, y2: 480 },
    { layer: 'shell', x1: 1100, y1: 500, x2: 1100, y2: 560 },
  ],
  doors: [
    { layer: 'shell', x: 520, y: 108, w: 44, dir: 'v' },
    { layer: 'shell', x: 700, y: 108, w: 44, dir: 'v' },
    { layer: 'shell', x: 520, y: 220, w: 44, dir: 'v' },
    { layer: 'shell', x: 600, y: 420, w: 50, dir: 'h', label: 'Staff only' },
    { layer: 'shell', x: 700, y: 305, w: 45, dir: 'v' },
    { layer: 'shell', x: 520, y: 428, w: 44, dir: 'v' },
    { layer: 'shell', x: 570, y: 620, w: 80, dir: 'h', label: 'Front doors' },
    { layer: 'shell', x: 170, y: 480, w: 50, dir: 'h' },
    { layer: 'shell', x: 400, y: 480, w: 60, dir: 'h' },
    { layer: 'shell', x: 360, y: 620, w: 100, dir: 'h', label: 'Roller door' },
    { layer: 'shell', x: 760, y: 360, w: 50, dir: 'h' },
    { layer: 'shell', x: 760, y: 490, w: 50, dir: 'h' },
    { layer: 'shell', x: 900, y: 530, w: 60, dir: 'v' },
  ],
  windows: [
    { layer: 'shell', x1: 80, y1: 130, x2: 80, y2: 210 },
    { layer: 'shell', x1: 80, y1: 330, x2: 80, y2: 410 },
    { layer: 'shell', x1: 140, y1: 80, x2: 380, y2: 80 },
    { layer: 'shell', x1: 110, y1: 620, x2: 270, y2: 620 },
    { layer: 'shell', x1: 80, y1: 510, x2: 80, y2: 590 },
  ],
  cameras: [
    { id: 'c36', layer: 'shell', x: 505, y: 465, dir: 235, fov: 60, range: 260, label: 'Saleroom E' },
    { id: 'c37', layer: 'shell', x: 95, y: 465, dir: 305, fov: 60, range: 260, label: 'Saleroom W' },
    { id: 'c41', layer: 'shell', x: 290, y: 610, dir: 225, fov: 50, range: 130, label: 'Gallery' },
    { id: 'c40', layer: 'shell', x: 510, y: 610, dir: 215, fov: 40, range: 150, label: 'Loading bay' },
    { id: 'c38', layer: 'shell', x: 1105, y: 610, dir: 200, fov: 40, range: 190, label: 'Strongroom door' },
    { id: 'c39', layer: 'shell', x: 1105, y: 375, dir: 135, fov: 60, range: 200, label: 'Strongroom' },
  ],
  guards: [
    { id: 'porter', layer: 'timing', name: 'Porter, 20:24', path: [[900, 150], [760, 120], [310, 120], [310, 142], [760, 142]], loop: true, period: 12 },
    { id: 'moon', layer: 'staff', name: 'Guard', path: [[940, 395], [1080, 395], [1080, 590], [940, 590]], loop: true, period: 15 },
  ],
  lasers: [],
  safes: [
    { id: 'lot47', layer: 'storage', x: 1040, y: 200, r: 20, label: 'Lot 47', kind: 'safe' },
    { id: 'strong', layer: 'storage', x: 1010, y: 485, r: 32, label: 'Lots 23 · 52', kind: 'vault' },
  ],
  entries: [
    { id: 'front', layer: 'bids', x: 610, y: 650, label: 'Front doors' },
    { id: 'staffonly', layer: 'timing', x: 625, y: 420, label: 'Staff stair' },
  ],
  notes: [
    { layer: 'storage', x: 1000, y: 305, text: 'under $50,000: stockroom', rot: -2 },
    { layer: 'storage', x: 800, y: 455, text: '$50,000 and up', rot: 3 },
    { layer: 'bids', x: 250, y: 395, text: '$400,000! No name!', rot: -6 },
    { layer: 'crane', x: 610, y: 285, text: '= CRANE', rot: -4 },
    { layer: 'timing', x: 300, y: 205, text: 'sold 20:34 · porter 20:24', rot: -2 },
    { layer: 'staff', x: 840, y: 188, text: 'head porter works for Crane', rot: 3 },
  ],
  labels: [
    { layer: 'shell', x: 900, y: 100, text: 'BASEMENT · −1' },
    { layer: 'shell', x: 190, y: 132, text: 'Stage →' },
  ],
};

export default {
  id: 'auction', number: 6,
  title: 'Lot 47',
  target: 'Halloway & Sons',
  district: 'Old Quarter',
  hubPos: { x: 0.26, y: 0.32 },
  take: 550000,
  sqlFocus: 'CASE WHEN · COALESCE · text & date functions',
  logline: 'An old desk is for sale tonight. Inside it are the plans of Crane Tower.',

  briefing: [
    { layout: 'full', panels: [
      { shot: 'title-card', params: { kicker: 'Job 06 · Old Quarter', title: 'Lot 47' } },
    ] },
    { layout: '4', panels: [
      { shot: 'city-establish', params: { building: 'Halloway & Sons' }, caption: 'Halloway & Sons, an old auction house. Tonight there is a big sale.' },
      { shot: 'face', params: { who: 'viv', mood: 'calm' }, caption: 'Vera (the Boss) has the plan.', lines: [{ who: 'viv', text: 'Lot 47 is an old desk. Crane sold it by mistake.' }, { who: 'viv', text: 'His drawings of Crane Tower are still in a secret drawer.' }] },
      { shot: 'crew-table', lines: [{ who: 'viv', text: 'Our last job is Crane Tower. We need those drawings.' }, { who: 'dex', text: 'And now Crane wants his desk back, I bet.' }] },
      { shot: 'two-shot', params: { a: 'viv', b: 'lena' }, caption: 'Vera still does not trust Ruby (the Actor).', lines: [{ who: 'viv', text: 'Ruby, where do you go at night?' }, { who: 'lena', text: 'Not now, Vera. I will tell you after the job.' }] },
    ] },
  ],

  puzzles: [
    {
      title: 'Where It Waits',
      ask: { who: 'juno', text: 'The auction house keeps each lot in a room by its price. Where does Lot 47 wait?' },
      prompt: "Show lot_no, title, estimate and storage for every lot. Sort by lot_no. storage is 'Strongroom' if estimate is 250000 or more. It is 'Cage' if estimate is 50000 or more. Otherwise it is 'Stockroom'.",
      sql: "SELECT lot_no, title, estimate, CASE WHEN estimate >= 250000 THEN 'Strongroom' WHEN estimate >= 50000 THEN 'Cage' ELSE 'Stockroom' END AS storage FROM lots ORDER BY lot_no;",
      orderMatters: true,
      hint: "Use CASE WHEN, and test the biggest price first. CASE WHEN estimate >= 250000 THEN 'Strongroom' WHEN … ELSE 'Stockroom' END AS storage.",
      concepts: ['casewhen', 'orderby'],
      reveals: ['storage'],
      intel: 'There are 11 lots. Lot 47 is a walnut writing desk from 1924. Its estimate is $38,000, so it waits in the Stockroom. Only lots 23 and 52 go to the Strongroom.',
      react: { who: 'juno', text: '$38,000 is cheap here. So the desk waits in the stockroom. Good for us.' },
    },
    {
      title: 'No Name',
      ask: { who: 'lena', text: 'I can just buy the desk. Who will bid against me?' },
      prompt: "Show paddle, bidder, method and amount for every bid on Lot 47. Find the lot id with a subquery on lots. Show a NULL paddle as 'NO PADDLE' and a NULL bidder as 'undisclosed'. Sort by amount, highest first.",
      sql: "SELECT COALESCE(paddle, 'NO PADDLE') AS paddle, COALESCE(bidder, 'undisclosed') AS bidder, method, amount FROM bids WHERE lot_id = (SELECT id FROM lots WHERE lot_no = 47) ORDER BY amount DESC;",
      orderMatters: true,
      hint: "Use COALESCE to replace a NULL: COALESCE(paddle, 'NO PADDLE') AS paddle. Get the id with (SELECT id FROM lots WHERE lot_no = 47).",
      concepts: ['nulls', 'subquery', 'orderby'],
      reveals: ['bids'],
      intel: 'The top bid on Lot 47 is $400,000. It has no paddle and no name. That is over 10 times the estimate. The next bids are $45,000 and $42,000.',
      react: { who: 'lena', text: '$400,000 for an old desk? Someone knows about the drawer.' },
    },
    {
      title: 'The Phone Number',
      ask: { who: 'viv', text: 'A secret bidder leaves a phone number. Whose number is on the $400,000 bid?' },
      prompt: "Join bids b to phones p ON REPLACE(p.number, '-', '') = b.callback. Callback numbers have no dashes, but phone numbers do. Keep Lot 47 only. Show b.amount, b.callback, p.number and p.owner.",
      sql: "SELECT b.amount, b.callback, p.number, p.owner FROM bids b JOIN phones p ON REPLACE(p.number, '-', '') = b.callback WHERE b.lot_id = (SELECT id FROM lots WHERE lot_no = 47);",
      orderMatters: false,
      hint: "Use REPLACE to remove the dashes. REPLACE(p.number, '-', '') turns 555-0001 into 5550001. Then compare it with b.callback in the ON.",
      concepts: ['strings', 'join', 'subquery'],
      reveals: ['crane'],
      intel: 'The $400,000 bid has the number 5550001. That is 555-0001, the phone of Leo Crane. Crane wants to buy back his own desk.',
      react: { who: 'viv', text: 'He will pay anything. Nobody must open that drawer.' },
    },
    {
      title: 'The Clock',
      ask: { who: 'dex', text: 'When is Lot 47 sold? And when does the porter carry it upstairs?' },
      prompt: "For lots 46 to 48, show lot_no, title, hammer and pickup. Sort by lot_no. hammer is sale_at as HH:MM. pickup is 10 minutes before sale_at, as HH:MM.",
      sql: "SELECT lot_no, title, strftime('%H:%M', sale_at) AS hammer, strftime('%H:%M', sale_at, '-10 minutes') AS pickup FROM lots WHERE lot_no BETWEEN 46 AND 48 ORDER BY lot_no;",
      orderMatters: true,
      hint: "Use strftime for clock times: strftime('%H:%M', sale_at). Add '-10 minutes' as a third argument for the pickup. Use BETWEEN 46 AND 48.",
      concepts: ['dates', 'between', 'orderby'],
      reveals: ['timing'],
      intel: 'Lot 47 is sold at 20:34. The porter takes it from the stockroom at 20:24. Lot 46: sold 20:31, pickup 20:21. Lot 48: sold 20:38, pickup 20:28.',
      react: { who: 'dex', text: 'The porter comes at 20:24. We must be done before that.' },
    },
    {
      title: 'Who Paid',
      ask: { who: 'otis', text: 'Some people here owe the casino money. Who paid their debts?' },
      prompt: "From ledger, keep rows where kind = 'marker'. Show party, SUM(amount) AS total and paid_by. paid_by is 'open' if settled_by is NULL, 'self' if settled_by = party, else settled_by. Group by party and paid_by. Sort by party.",
      sql: "SELECT party, SUM(amount) AS total, CASE WHEN settled_by IS NULL THEN 'open' WHEN settled_by = party THEN 'self' ELSE settled_by END AS paid_by FROM ledger WHERE kind = 'marker' GROUP BY party, paid_by ORDER BY party;",
      orderMatters: true,
      hint: "Use CASE WHEN, and test settled_by IS NULL first. Then test settled_by = party. You can GROUP BY the alias paid_by.",
      concepts: ['casewhen', 'nulls', 'groupby', 'aggregate'],
      reveals: ['staff'],
      intel: 'CH Group is Crane’s secret company. It paid $9,500 for Ray Harris, the head porter. It also paid $38,000 for Dex Moran.',
      react: { who: 'dex', text: 'I paid those debts myself. With cash. Ask anyone.' },
    },
  ],

  blueprint,

  play: {
    question: 'How do we get Lot 47?',
    options: [
      { id: 'strongroom', label: 'Strongroom, 20:00', detail: 'Open the strongroom before the sale. Take the desk from there.', route: [[605, 700], [605, 560], [615, 400], [640, 340], [770, 340], [785, 390], [785, 530], [850, 560], [990, 560], [1010, 510]] },
      { id: 'bid', label: 'Ruby buys it', detail: 'Ruby bids for the desk in the sale room. It is legal.', route: [[590, 700], [590, 560], [560, 450], [470, 450], [290, 365]] },
      { id: 'porter', label: 'Pay the head porter', detail: 'Pay the head porter. He carries our copy of the desk upstairs.', route: [[1040, 200], [760, 132], [320, 132]] },
      { id: 'swap', label: 'Stockroom swap, 20:15', detail: 'Go down the staff stair. Put our copy in. Take the real desk out.', route: [[635, 700], [635, 560], [630, 400], [650, 330], [770, 322], [1015, 212]] },
    ],
    answer: 'swap',
    why: 'Lot 47 waits in the stockroom. The porter comes for it at 20:24. At 20:15 we swap it for our copy. Crane pays $400,000 for an empty desk.',
    wrong: {
      strongroom: 'Lot 47 is not in the strongroom. Lots under $50,000 wait in the stockroom.',
      bid: 'The $400,000 bid is Crane’s. Ruby cannot beat it, and Crane will see her.',
      porter: 'CH Group paid the head porter’s debts. He works for Crane. He calls him.',
    },
  },

  replay: {
    success: [
      { layout: '3a', panels: [
        { shot: 'city-establish', params: { building: 'Halloway & Sons' }, caption: '20:00. Rain in the Old Quarter. Rich people arrive under black umbrellas.' },
        { shot: 'gala-crowd', caption: 'The sale room. A man waits by the phones for Crane’s call.' },
        { shot: 'face', params: { who: 'lena', mood: 'smirk' }, lines: [{ who: 'lena', text: 'Tonight I am a rich old lady. Nobody looks twice.' }] },
      ] },
      { layout: '3b', panels: [
        { shot: 'clock', params: { time: '20:15' }, sfx: 'TIK' },
        { shot: 'guard-patrol', caption: 'The porters are upstairs. The stockroom is dark and quiet.' },
        { shot: 'face', params: { who: 'otis', mood: 'calm' }, lines: [{ who: 'otis', text: 'I wear a porter’s coat. Nobody ever looks at a porter.' }] },
      ] },
      { layout: '2h', panels: [
        { shot: 'safe-dial', sfx: 'CLICK', lines: [{ who: 'juno', text: 'A secret drawer. Old and simple. Open.' }] },
        { shot: 'loot', params: { item: 'Crane Tower drawings' }, caption: 'Crane’s drawings of his tower. Every floor, every door. Our copy goes in. 20:22.' },
      ] },
      { layout: '2h', panels: [
        { shot: 'gala-crowd', sfx: 'BANG', caption: '20:34. “Lot 47. Sold for $400,000.”' },
        { shot: 'getaway', sfx: 'VRRRM', lines: [{ who: 'dex', text: '$400,000 for an empty desk. Thank you, Mr. Crane.' }] },
      ] },
    ],
    failure: [
      { layout: '2h', panels: [
        { shot: 'alarm', sfx: 'BRRRING', caption: 'An alarm rings. Guards run to every door.' },
        { shot: 'car-interior', params: { who: 'dex' }, lines: [{ who: 'dex', text: 'Everyone in the van! Architect, we need a better plan.' }] },
      ] },
    ],
  },

  debrief: {
    headline: 'OLD DESK SELLS FOR $400,000. THE DRAWER IS EMPTY.',
    line: { who: 'lena', text: 'He paid $400,000 for a copy. I almost feel sorry for him.' },
  },

  after: [
    { layout: '4', panels: [
      { shot: 'face', params: { who: 'crane', mood: 'shock' }, caption: 'Midnight. Crane opens the secret drawer. It is empty.' },
      { shot: 'face', params: { who: 'crane', mood: 'tense' }, lines: [{ who: 'crane', text: 'Vera’s driver has a sister. She has a garage. Close it.' }] },
      { shot: 'car-interior', params: { who: 'dex' }, caption: 'Dex drives Vera home in the rain.', lines: [{ who: 'dex', text: 'I paid those debts myself, Vera. With my own money.' }] },
      { shot: 'face', params: { who: 'viv', mood: 'calm' }, caption: 'Vera does not believe him. She says nothing.' },
    ] },
    { layout: '3a', tint: 'ink', panels: [
      { shot: 'street-rain', caption: 'Morning. Mia’s garage. Mia is Dex’s little sister. There is a new lock on the door.' },
      { shot: 'two-shot', params: { a: 'mia', b: 'dex' }, lines: [{ who: 'mia', text: 'Crane’s men closed my garage, Dex.' }, { who: 'mia', text: 'They said you would understand. Do you?' }] },
      { shot: 'face', params: { who: 'dex', mood: 'shock' }, caption: 'Dex understands. He stands in the rain for a long time.' },
    ] },
  ],
};
