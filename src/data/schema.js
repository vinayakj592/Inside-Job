// Port Vesper municipal records network: ONE shared city database for every job.
// Contract: docs/DESIGN.md §6.1. Story facts planted in this data are documented in docs/STORY.md.
// Dates are TEXT 'YYYY-MM-DD HH:MM' (times alone are 'HH:MM'), so string comparison sorts correctly
// and SQLite's date functions (date, time, strftime, julianday) work on them directly.
//
// DO NOT change a row without re-running `node scripts/verify-content.mjs --dump`:
// puzzle solutions and `intel` text in src/data/jobs/*.js depend on exact values.

const q = (v) => (v === null || v === undefined ? 'NULL' : typeof v === 'number' ? String(v) : `'${String(v).replace(/'/g, "''")}'`);
const ins = (table, rows) => `INSERT INTO ${table} VALUES\n` + rows.map((r) => '  (' + r.map(q).join(', ') + ')').join(',\n') + ';\n';

/* ------------------------------------------------------------------ buildings */
const buildings = [
  // id, name, district, owner, floors, opened
  [1, "Moretti's Pawn & Loan", 'The Narrows', 'Sal Moretti', 2, 1961],
  [2, 'Galerie Lumière', 'Old Quarter', 'Crane Holdings', 3, 1924],
  [3, 'Orpheum Casino', 'Neon Row', 'Crane Holdings', 6, 1931],
  [4, 'Vesper Rail Yard', 'Ironside', 'Port Vesper Rail Co.', 1, 1898],
  [5, 'First Meridian Bank', 'Financial District', 'First Meridian Trust', 4, 1912],
  [6, 'Halloway & Sons', 'Old Quarter', 'Halloway family', 3, 1887],
  [7, 'Marlowe Hotel', 'Harbour Heights', 'Crane Holdings', 22, 1929],
  [8, 'Crane Tower', 'Crown Hill', 'Crane Holdings', 40, 2019],
  [9, 'Dockside Garage', 'Dockside', null, 2, 1952],
  [10, 'VPD Harbour Precinct', 'Dockside', 'City of Port Vesper', 3, 1938],
  [11, 'Blue Anchor Bar', 'The Narrows', 'Rosa Quint', 1, 1947],
  [12, 'Crane Holdings Depot', 'Ironside', 'Crane Holdings', 2, 2008],
];

/* ------------------------------------------------------------------ staff */
const staff = [
  // id, building_id, name, role, post, shift, break_at, age, hired, phone
  // 1 Moretti's
  [1, 1, 'Sal Moretti', 'Owner', null, 'day', null, 61, '1989-04-02', '555-0120'],
  [2, 1, 'Nico Moretti', 'Clerk', 'Counter', 'day', '13:00', 24, '2022-06-15', null],
  [3, 1, 'Frank Ruiz', 'Guard', 'Showroom', 'night', '01:30', 52, '2011-09-01', null],
  [4, 1, 'Ada Voss', 'Guard', 'Showroom', 'swing', '18:00', 38, '2019-03-11', null],
  // 2 Galerie Lumière
  [5, 2, 'Odile Marchand', 'Director', null, 'day', null, 49, '2014-02-01', null],
  [6, 2, 'Henri Pell', 'Guard', 'East Hall', 'swing', '21:10', 57, '2008-05-20', null],
  [7, 2, 'Rosa Lind', 'Guard', 'Front doors', 'swing', '20:00', 33, '2021-08-09', null],
  [8, 2, 'Carl Brecht', 'Guard', 'Loading dock', 'swing', '22:15', 45, '2017-01-30', null],
  [9, 2, 'Ines Varga', 'Curator', 'West Hall', 'day', '12:30', 41, '2016-10-03', null],
  [10, 2, 'Mara Duval', 'Caterer', 'Kitchen', 'swing', null, 27, '2025-10-06', null],
  [11, 2, 'Theo Lark', 'Caterer', 'Kitchen', 'swing', null, 35, '2023-04-12', null],
  [12, 2, 'June Okoro', 'Bartender', 'Atrium', 'swing', '21:30', 30, '2024-11-02', null],
  // 3 Orpheum Casino
  [13, 3, 'Gus Mahler', 'Security chief', 'Security office', 'night', '02:00', 58, '2003-07-19', '555-0300'],
  [14, 3, 'Nell Crowe', 'Cage runner', 'Cage', 'night', '02:45', 29, '2021-02-14', null],
  [15, 3, 'Walter Tolliver', 'Count team', 'Count room', 'night', null, 63, '1998-11-02', null],
  [16, 3, 'Pia Reyes', 'Count team', 'Count room', 'night', null, 36, '2015-06-22', null],
  [17, 3, 'Bram Kessler', 'Guard', 'Cage corridor', 'night', '03:00', 40, '2012-03-05', null],
  [18, 3, 'Lou Fenn', 'Guard', 'Casino floor', 'night', '01:15', 31, '2020-09-17', null],
  [19, 3, 'Sid Okafor', 'Pit boss', 'Casino floor', 'night', null, 47, '2009-12-01', null],
  [20, 3, 'Viktor Hale', 'Guard', 'VIP room', 'night', '00:30', 44, '2016-05-05', null],
  [21, 3, 'Cleo Marsh', 'Guard', 'Cage corridor', 'night', '04:30', 26, '2025-10-17', null],
  // 4 Vesper Rail Yard
  [22, 4, 'Hank Doyle', 'Escort', 'RC-12', 'night', null, 50, '2006-08-14', null],
  [23, 4, 'Mick Tully', 'Escort', 'AV-7', 'day', null, 39, '2018-02-11', null],
  [24, 4, 'Ezra Quill', 'Signalman', 'Signal box 9', 'night', null, 67, '1985-05-30', null],
  [25, 4, 'Pat Garrow', 'Guard', 'Main gate', 'night', '01:00', 48, '2010-01-12', null],
  [26, 4, 'Lyle Brand', 'Guard', 'Main gate', 'night', '03:00', 33, '2019-07-07', null],
  [27, 4, 'Rita Soames', 'Guard', 'Main gate', 'night', '02:00', 29, '2022-03-03', null],
  [28, 4, 'Owen Pike', 'Guard', 'Loading platform', 'night', '00:30', 41, '2013-11-11', null],
  [29, 4, 'Sam Achebe', 'Guard', 'Loading platform', 'night', '01:30', 37, '2016-04-04', null],
  [30, 4, 'Paula Kline', 'Guard', 'Loading platform', 'night', '02:30', 45, '2014-09-09', null],
  [31, 4, 'Tom Hask', 'Guard', 'Loading platform', 'night', '03:30', 52, '2007-06-06', null],
  [32, 4, 'Nadia Fox', 'Dispatcher', 'Switch tower', 'night', null, 34, '2017-10-10', null],
  [33, 4, 'Ben Orr', 'Guard', 'Main gate', 'day', '12:00', 55, '2001-02-02', null],
  [34, 4, 'Kit Lomax', 'Guard', 'Loading platform', 'day', '13:00', 28, '2023-05-05', null],
  // 5 First Meridian Bank
  [35, 5, 'Leonard Ash', 'Manager', null, 'day', null, 59, '1996-03-18', null],
  [36, 5, 'Greta Solberg', 'Vault clerk', 'Box vault', 'day', '12:00', 44, '2010-08-08', null],
  [37, 5, 'Marcus Dole', 'Guard', 'Main hall', 'night', '01:00', 50, '2005-05-05', null],
  [38, 5, 'Walt Pruitt', 'Guard', 'Records corridor', 'night', '02:00', 62, '2025-09-01', null],
  [39, 5, 'Toby Bell', 'Guard', 'Box vault', 'night', '02:40', 23, '2025-10-27', null],
  [40, 5, 'Irene Kast', 'Guard', 'Main hall', 'night', '03:30', 38, '2018-12-01', null],
  [41, 5, 'Omar Reed', 'Teller', 'Main hall', 'day', '13:00', 31, '2020-02-20', null],
  // 6 Halloway & Sons
  [42, 6, 'Ray Harris', 'Head porter', 'Stockroom', 'swing', null, 54, '2002-04-04', '555-0610'],
  [43, 6, 'Edith Halloway', 'Auctioneer', 'Rostrum', 'swing', null, 66, '1981-09-09', null],
  [44, 6, 'Felix Moon', 'Guard', 'Strongroom', 'swing', null, 46, '2012-12-12', null],
  [45, 6, 'Anika Roy', 'Porter', 'Stockroom', 'swing', '19:30', 25, '2024-02-02', null],
  [46, 6, 'Quentin Lowe', 'Clerk', 'Phone bank', 'swing', null, 34, '2019-01-15', null],
  // 7 Marlowe Hotel
  [47, 7, 'Bruno Salt', 'Guard', 'Floor 22', 'night', '23:50', 42, '2015-07-07', null],
  [48, 7, 'Marisol Vega', 'Housekeeping', 'Floors 20-22', 'swing', null, 39, '2017-03-03', null],
  [49, 7, 'Arthur Penn', 'Night manager', 'Front desk', 'night', '02:00', 55, '2004-10-10', '555-0700'],
  [50, 7, 'Gideon Rusk', 'Bodyguard', 'Penthouse', 'night', null, 38, '2020-06-06', null],
  // 8 Crane Tower
  [51, 8, 'Silas Voight', 'Security chief', 'Security office', 'night', null, 51, '2019-01-10', '555-0800'],
  [52, 8, 'Nora Quade', 'Guard', 'Lobby', 'night', '01:00', 34, '2019-02-01', null],
  [53, 8, 'Elias Brook', 'Guard', 'Lobby', 'night', '02:00', 29, '2021-05-17', null],
  [54, 8, 'Hugo Stann', 'Guard', 'Lobby', 'night', '03:00', 41, '2019-02-01', null],
  [55, 8, 'Ivo Drake', 'Guard', 'Garage ramp', 'night', '01:30', 37, '2020-08-08', null],
  [56, 8, 'Tess Wren', 'Guard', 'Garage ramp', 'night', '02:30', 32, '2022-01-20', null],
  [57, 8, 'Rook Adler', 'Guard', 'B3 vault level', 'night', '02:00', 45, '2019-02-01', null],
  [58, 8, 'Mina Salko', 'Guard', 'B3 vault level', 'night', '03:30', 39, '2020-03-03', null],
  [59, 8, 'Cal Denny', 'Guard', 'Loading bay', 'night', '01:00', 50, '2019-06-06', null],
  [60, 8, 'Petra Lusk', 'Guard', 'Floor 40', 'night', '00:30', 36, '2021-09-09', null],
  [61, 8, 'Joel Marr', 'Guard', 'Floor 40', 'night', '03:00', 27, '2023-11-11', null],
  // 10 VPD, 11 Blue Anchor, 12 Depot
  [62, 10, 'Nina Cole', 'Detective', 'Robbery', 'night', null, 44, '2004-09-01', '555-0417'],
  [63, 11, 'Rosa Quint', 'Owner', 'Bar', 'night', null, 60, '1985-01-01', '555-0910'],
  [64, 12, 'Lars Eklund', 'Depot manager', null, 'day', null, 48, '2008-03-03', null],
];

/* ------------------------------------------------------------------ zones (alarm zones) */
const zones = [
  // id, building_id, name, floor, alarm, armed_from, armed_to
  [1, 1, 'Showroom', 0, 'motion', '22:00', '08:00'],
  [2, 1, 'Back office', 0, null, null, null],
  [3, 1, 'Storeroom', 0, 'door contact', '22:00', '08:00'],
  [4, 1, 'Alley', 0, null, null, null],
  [5, 2, 'Atrium', 0, 'motion', '23:30', '08:00'],
  [6, 2, 'East Hall', 1, 'pressure plate', '00:00', '23:59'],
  [7, 2, 'West Hall', 1, 'pressure plate', '00:00', '23:59'],
  [8, 2, 'Service corridor', 0, null, null, null],
  [9, 2, 'Kitchen', 0, null, null, null],
  [10, 2, 'Loading dock', 0, 'door contact', '23:30', '08:00'],
  [11, 2, 'Skylight', 2, 'laser', '23:30', '08:00'],
  [12, 2, 'Front doors', 0, 'door contact', '23:30', '08:00'],
  [13, 3, 'Casino floor', 0, null, null, null],
  [14, 3, 'Cage', 0, 'motion', '00:00', '23:59'],
  [15, 3, 'Cage corridor', -1, null, null, null],
  [16, 3, 'Count room', -1, 'vault door', '06:00', '00:30'],
  [17, 3, 'Service lift', -1, null, null, null],
  [18, 3, 'VIP room', 1, null, null, null],
  [19, 3, 'Staff entrance', 0, 'door contact', '06:00', '18:00'],
  [20, 3, 'Security office', 1, null, null, null],
  [21, 4, 'Main gate', 0, null, null, null],
  [22, 4, 'Loading platform', 0, 'motion', '22:00', '06:00'],
  [23, 4, 'Signal box 9', 0, null, null, null],
  [24, 4, 'East siding', 0, null, null, null],
  [25, 4, 'Switch tower', 1, null, null, null],
  [26, 5, 'Main hall', 0, 'motion', '20:00', '07:30'],
  [27, 5, 'Box vault', -1, 'seismic', '19:00', '07:30'],
  [28, 5, 'Records room', -1, null, null, null],
  [29, 5, 'Records corridor', -1, null, null, null],
  [30, 5, 'Night depository', 0, null, null, null],
  [31, 5, 'Teller line', 0, 'motion', '20:00', '07:30'],
  [32, 6, 'Saleroom', 0, null, null, null],
  [33, 6, 'Stockroom', -1, null, null, null],
  [34, 6, 'Strongroom', -1, 'vault door', '00:00', '23:59'],
  [35, 6, 'Phone bank', 1, null, null, null],
  [36, 6, 'Loading bay', 0, 'door contact', '22:00', '07:00'],
  [37, 6, 'Viewing gallery', 1, 'motion', '22:00', '07:00'],
  [38, 7, 'Lobby', 0, null, null, null],
  [39, 7, 'Guest lifts', 0, null, null, null],
  [40, 7, 'Private lift', 0, null, null, null],
  [41, 7, 'Service stair', 0, null, null, null],
  [42, 7, 'Floor 21 corridor', 21, null, null, null],
  [43, 7, 'Penthouse', 22, 'motion', '02:00', '06:00'],
  [44, 8, 'Lobby', 0, 'motion', '23:00', '06:00'],
  [45, 8, 'Garage ramp', -1, null, null, null],
  [46, 8, 'B3 vault level', -3, 'seismic', '00:00', '23:59'],
  [47, 8, 'Maintenance shaft', -3, null, null, null],
  [48, 8, 'Loading bay', 0, 'door contact', '22:00', '06:00'],
  [49, 8, 'Floor 40', 40, 'motion', '23:00', '06:00'],
];

/* ------------------------------------------------------------------ cameras */
const cameras = [
  // id, building_id, zone_id, spot, model, working, last_service
  [1, 1, 1, 'Showroom', 'Argus-2', 1, '2025-08-14'],
  [2, 1, 2, 'Back office', 'Argus-2', 0, '2024-11-02'],
  [3, 1, 4, 'Alley door', 'Argus-1', 1, '2025-05-30'],
  [4, 2, 12, 'Front doors', 'Lynx HD', 1, '2025-09-20'],
  [5, 2, 5, 'Atrium', 'Lynx HD', 1, '2025-09-20'],
  [6, 2, 5, 'Main stair', 'Lynx HD', 1, '2025-09-20'],
  [7, 2, 7, 'West Hall', 'Lynx HD', 1, '2025-09-20'],
  [8, 2, 8, 'Service corridor', 'Argus-1', 0, null],
  [9, 2, 10, 'Loading dock', 'Argus-2', 1, '2025-02-11'],
  [10, 3, 13, 'Floor north', 'Orion 4K', 1, '2025-10-01'],
  [11, 3, 13, 'Floor south', 'Orion 4K', 1, '2025-10-01'],
  [12, 3, 13, 'Roulette pit', 'Orion 4K', 1, '2025-10-01'],
  [13, 3, 13, 'Blackjack pit', 'Orion 4K', 1, '2025-10-01'],
  [14, 3, 14, 'Cage window', 'Orion 4K', 1, '2025-10-01'],
  [15, 3, 15, 'Corridor west', 'Orion 4K', 1, '2025-10-01'],
  [16, 3, 15, 'Corridor mid', 'Orion 4K', 1, '2025-10-01'],
  [17, 3, 15, 'Corridor east', 'Orion 4K', 1, '2025-10-01'],
  [18, 3, 17, 'Service lift car', 'Argus-2', 0, '2023-06-30'],
  [19, 3, 18, 'VIP door', 'Orion 4K', 1, '2025-10-01'],
  [20, 3, 18, 'VIP tables', 'Orion 4K', 1, '2025-10-01'],
  [21, 3, 19, 'Staff entrance', 'Argus-2', 1, null],
  [22, 4, 21, 'Gate booth', 'Argus-1', 1, '2025-04-04'],
  [23, 4, 21, 'Gate road', 'Argus-1', 1, '2025-04-04'],
  [24, 4, 22, 'Platform 1', 'Argus-2', 1, '2025-07-12'],
  [25, 4, 22, 'Platform 2', 'Argus-2', 1, '2025-07-12'],
  [26, 4, 22, 'Platform office', 'Argus-2', 1, '2025-07-12'],
  [27, 4, 23, 'Signal box 9', 'Argus-1', 0, '2019-10-02'],
  [28, 4, 24, 'East siding', 'Argus-1', 0, null],
  [29, 4, 25, 'Switch tower', 'Argus-2', 1, '2025-07-12'],
  [30, 5, 26, 'Main hall north', 'Sentinel', 1, '2025-09-01'],
  [31, 5, 26, 'Main hall south', 'Sentinel', 1, '2025-09-01'],
  [32, 5, 26, 'Main doors', 'Sentinel', 1, '2025-09-01'],
  [33, 5, 27, 'Vault door', 'Sentinel', 1, '2025-09-01'],
  [34, 5, 27, 'Box aisle', 'Sentinel', 1, '2025-09-01'],
  [35, 5, 31, 'Teller line', 'Sentinel', 1, '2025-09-01'],
  [36, 6, 32, 'Saleroom east', 'Lynx HD', 1, '2025-06-15'],
  [37, 6, 32, 'Saleroom west', 'Lynx HD', 1, '2025-06-15'],
  [38, 6, 34, 'Strongroom door', 'Lynx HD', 1, '2025-06-15'],
  [39, 6, 34, 'Strongroom interior', 'Lynx HD', 1, '2025-06-15'],
  [40, 6, 36, 'Loading bay', 'Argus-1', 1, null],
  [41, 6, 37, 'Viewing gallery', 'Lynx HD', 1, '2025-06-15'],
  [42, 7, 38, 'Lobby desk', 'Orion 4K', 1, '2025-08-01'],
  [43, 7, 38, 'Lobby doors', 'Orion 4K', 1, '2025-08-01'],
  [44, 7, 38, 'Lobby bar', 'Orion 4K', 1, '2025-08-01'],
  [45, 7, 39, 'Guest lift A', 'Orion 4K', 1, '2025-08-01'],
  [46, 7, 39, 'Guest lift B', 'Orion 4K', 1, '2025-08-01'],
  [47, 7, 40, 'Private lift car', 'Orion 4K', 1, '2025-08-01'],
  [48, 7, 40, 'Private lift lobby', 'Orion 4K', 1, '2025-08-01'],
  [49, 7, 42, 'Floor 21 corridor', 'Argus-2', 1, '2024-12-12'],
  [50, 8, 44, 'Lobby turnstiles', 'Orion 4K', 1, '2025-11-01'],
  [51, 8, 44, 'Lobby doors', 'Orion 4K', 1, '2025-11-01'],
  [52, 8, 44, 'Lobby lifts', 'Orion 4K', 1, '2025-11-01'],
  [53, 8, 44, 'Lobby desk', 'Orion 4K', 1, '2025-11-01'],
  [54, 8, 45, 'Ramp top', 'Orion 4K', 1, '2025-11-01'],
  [55, 8, 45, 'Ramp bottom', 'Orion 4K', 1, '2025-11-01'],
  [56, 8, 45, 'Garage gate', 'Orion 4K', 1, '2025-11-01'],
  [57, 8, 46, 'Vault door', 'Orion 4K', 1, '2025-11-01'],
  [58, 8, 46, 'B3 lift lobby', 'Orion 4K', 1, '2025-11-01'],
  [59, 8, 48, 'Loading bay', 'Argus-2', 1, null],
  [60, 8, 49, 'Floor 40 lifts', 'Orion 4K', 1, '2025-11-01'],
  [61, 8, 49, 'Crane office door', 'Orion 4K', 1, '2025-11-01'],
];

/* ------------------------------------------------------------------ access_log (badge swipes + plate reads) */
const log = [];
const L = (building, door, credential, staffId, at, direction = 'in') => log.push([log.length + 1, building, door, credential, staffId, at, direction]);

// Moretti's: Ruiz's break-room swipes (job 1), shop hours, the day the ledger went in the safe.
['2025-09-26 01:30', '2025-09-27 01:31', '2025-09-28 01:30', '2025-09-29 01:29', '2025-09-30 01:30', '2025-10-01 01:32', '2025-10-02 01:30']
  .forEach((at) => L(1, 'Break room', 'B-0103', 3, at));
L(1, 'Floor safe', 'B-0101', 1, '2025-09-10 09:15');
L(1, 'Front door', 'B-0101', 1, '2025-10-02 09:02');
L(1, 'Front door', 'B-0102', 2, '2025-10-02 09:10');
L(1, 'Front door', 'B-0104', 4, '2025-10-02 14:00');
L(1, 'Front door', 'B-0102', 2, '2025-10-02 18:00', 'out');
L(1, 'Alley door', 'B-0103', 3, '2025-10-02 22:00');
L(1, 'Front door', 'B-0104', 4, '2025-10-02 22:01', 'out');
L(1, 'Front door', 'B-0101', 1, '2025-10-02 22:04', 'out');
L(1, 'Alley door', 'B-0103', 3, '2025-10-03 06:00', 'out');

// Galerie Lumière: the doors on the badge system (the kitchen door is not one of them).
L(2, 'Staff entrance', 'GL-06', 6, '2025-10-09 16:00');
L(2, 'Staff entrance', 'GL-08', 8, '2025-10-09 16:02');
L(2, 'Front doors', 'GL-07', 7, '2025-10-09 16:05');
L(2, 'Service corridor', 'GL-11', 11, '2025-10-09 17:30');
L(2, 'Loading dock', 'GL-08', 8, '2025-10-09 18:10');
L(2, 'Front doors', 'GL-05', 5, '2025-10-09 18:30', 'out');
L(2, 'Staff entrance', 'GL-09', 9, '2025-10-10 09:00');
L(2, 'Front doors', 'GL-05', 5, '2025-10-10 09:05');
L(2, 'Staff entrance', 'GL-06', 6, '2025-10-10 16:00');
L(2, 'Service corridor', 'GL-10', 10, '2025-10-10 17:00');
L(2, 'Service corridor', 'GL-11', 11, '2025-10-10 17:05');
L(2, 'Loading dock', 'GL-08', 8, '2025-10-10 18:00');

// Orpheum: count room door and service lift, three nights before the job (early hours of 15th–17th).
for (const d of ['2025-10-15', '2025-10-16', '2025-10-17']) {
  L(3, 'Service lift', 'OR-14', 14, `${d} 00:58`);
  L(3, 'Count room', 'OR-14', 14, `${d} 01:00`);
  L(3, 'Service lift', 'OR-14', 14, `${d} 02:28`);
  L(3, 'Count room', 'OR-14', 14, `${d} 02:30`);
  L(3, 'Service lift', 'OR-14', 14, `${d} 03:28`);
  L(3, 'Count room', 'OR-14', 14, `${d} 03:30`);
  L(3, 'Count room', 'OR-16', 16, `${d} 04:00`);
  L(3, 'Count room', 'OR-15', 15, `${d} 04:00`);
  L(3, 'Count room', 'OR-15', 15, `${d} 05:10`, 'out');
}
L(3, 'Staff entrance', 'OR-21', 21, '2025-10-17 22:00');

// Rail yard main gate: plate reads (credential = plate, staff_id NULL).
[
  ['AV-7', '2025-10-15 09:40'], ['PG-118', '2025-10-15 21:50'], ['LB-302', '2025-10-15 21:55'], ['HV-330', '2025-10-16 22:30'],
  ['OP-505', '2025-10-16 21:45'], ['AV-7', '2025-10-17 09:35'], ['RS-771', '2025-10-17 21:58'], ['NC-640', '2025-10-17 21:40'],
  ['PG-118', '2025-10-19 21:52'], ['LB-302', '2025-10-19 21:56'], ['AV-7', '2025-10-20 05:30'], ['HV-330', '2025-10-20 22:25'],
  ['OP-505', '2025-10-20 21:44'], ['VX-4471', '2025-10-21 23:40'], ['NC-640', '2025-10-21 21:41'], ['AV-7', '2025-10-22 09:38'],
  ['PG-118', '2025-10-22 21:49'], ['LB-302', '2025-10-22 21:57'], ['RS-771', '2025-10-22 21:59'], ['KT-2210', '2025-10-23 10:15'],
  ['HV-330', '2025-10-23 22:28'], ['AV-7', '2025-10-23 09:36'],
].forEach(([plate, at]) => L(4, 'Main gate', plate, null, at));

// First Meridian: night staff swipes (Pruitt never swipes), box openings by the signatory.
L(5, 'Box 1131', 'SIG R. VANCE', null, '2025-03-02 10:00');
L(5, 'Box 1127', 'SIG R. VANCE', null, '2025-10-25 11:20');
for (const d of ['2025-10-29', '2025-10-30']) {
  L(5, 'Staff entrance', 'FM-37', 37, `${d} 22:00`);
  L(5, 'Staff entrance', 'FM-40', 40, `${d} 22:01`);
  L(5, 'Staff entrance', 'FM-39', 39, `${d} 22:03`);
  L(5, 'Box vault anteroom', 'FM-39', 39, `${d} 22:10`);
}

// Marlowe: penthouse door (in = into the penthouse) and the floor-22 guard's stair checks.
const P = (cred, staffId, at, dir) => L(7, 'Penthouse', cred, staffId, at, dir);
P('AC-0001', null, '2025-11-10 19:05', 'in'); P('GR-50', 50, '2025-11-10 19:06', 'in');
P('AC-0001', null, '2025-11-10 21:50', 'out'); P('GR-50', 50, '2025-11-10 21:51', 'out');
P('AC-0001', null, '2025-11-11 01:05', 'in'); P('GR-50', 50, '2025-11-11 01:06', 'in'); P('GR-50', 50, '2025-11-11 01:20', 'out');
P('AC-0001', null, '2025-11-11 19:15', 'in'); P('GR-50', 50, '2025-11-11 19:16', 'in');
P('AC-0001', null, '2025-11-11 22:00', 'out'); P('GR-50', 50, '2025-11-11 22:01', 'out');
P('AC-0001', null, '2025-11-12 01:12', 'in'); P('GR-50', 50, '2025-11-12 01:13', 'in'); P('GR-50', 50, '2025-11-12 01:25', 'out');
P('AC-0001', null, '2025-11-12 19:00', 'in'); P('GR-50', 50, '2025-11-12 19:01', 'in');
P('AC-0001', null, '2025-11-12 21:45', 'out'); P('GR-50', 50, '2025-11-12 21:46', 'out');
P('AC-0001', null, '2025-11-13 00:58', 'in'); P('GR-50', 50, '2025-11-13 00:59', 'in'); P('GR-50', 50, '2025-11-13 01:15', 'out');
P('MV-48', 48, '2025-11-13 18:05', 'in'); P('MV-48', 48, '2025-11-13 18:35', 'out');
P('AC-0001', null, '2025-11-13 19:10', 'in'); P('GR-50', 50, '2025-11-13 19:11', 'in');
P('AC-0001', null, '2025-11-13 21:55', 'out'); P('GR-50', 50, '2025-11-13 22:05', 'out');
P('MV-48', 48, '2025-11-13 23:30', 'in'); P('MV-48', 48, '2025-11-13 23:45', 'out');
P('AC-0001', null, '2025-11-14 01:10', 'in'); P('GR-50', 50, '2025-11-14 01:11', 'in'); P('GR-50', 50, '2025-11-14 01:25', 'out');
['2025-11-13 22:10', '2025-11-13 22:30', '2025-11-13 22:50', '2025-11-13 23:10', '2025-11-13 23:30', '2025-11-13 23:50',
  '2025-11-14 00:50', '2025-11-14 01:10', '2025-11-14 01:30'].forEach((at) => L(7, 'Service stair 22', 'BS-47', 47, at));

// Crane Tower: garage gate plate reads, then the guards' midnight roll call, last night vs tonight.
L(8, 'Garage gate', 'KT-2210', null, '2025-10-15 21:30');
L(8, 'Garage gate', 'VX-4471', null, '2025-10-15 22:10');
L(8, 'Garage gate', 'AC-0001', null, '2025-10-15 22:15');
L(8, 'Garage gate', 'VX-4471', null, '2025-11-07 00:30');
L(8, 'Garage gate', 'AC-0001', null, '2025-11-20 18:40');
const lastNight = { 52: 'Lobby', 53: 'Lobby', 54: 'Lobby', 55: 'Garage ramp', 56: 'Garage ramp', 57: 'B3 vault level', 58: 'B3 vault level', 59: 'Loading bay', 60: 'Floor 40', 61: 'Floor 40' };
const tonight = { 52: 'Lobby', 53: 'Lobby', 54: 'Garage ramp', 55: 'Garage ramp', 56: 'Garage ramp', 57: 'Garage ramp', 58: 'Garage ramp', 59: 'Garage ramp', 60: 'Garage ramp', 61: 'Garage ramp' };
for (const [id, door] of Object.entries(lastNight)) L(8, door, `CT-${id}`, +id, '2025-11-21 00:00');
for (const [id, door] of Object.entries(tonight)) L(8, door, `CT-${id}`, +id, '2025-11-22 00:10');

/* ------------------------------------------------------------------ valuables */
const valuables = [
  // id, building_id, location, item, owner, value, stored_at
  [1, 1, 'Showroom case', 'Gold pocket watch', 'Sal Moretti', 1200, '2025-08-02 11:00'],
  [2, 1, 'Showroom case', 'Leica rangefinder camera', 'Sal Moretti', 2400, '2025-07-19 15:30'],
  [3, 1, 'Showroom case', 'Silver cigarette case', 'Sal Moretti', 450, '2025-09-01 10:20'],
  [4, 1, 'Back office floor safe', 'Diamond engagement ring', 'Sal Moretti', 6500, '2025-06-11 16:45'],
  [5, 1, 'Back office floor safe', 'Colt revolver (1927)', 'Sal Moretti', 3100, '2025-03-04 12:00'],
  [6, 1, 'Back office floor safe', 'Green ledger (Crane account)', 'Sal Moretti', null, '2025-09-10 09:15'],
  [7, 2, 'East Hall', 'The Drowned Harbour (E. Vasquez)', 'Crane Holdings', 1200000, '2025-10-01 10:00'],
  [8, 2, 'West Hall', 'Harbour Study No. 3 (E. Vasquez)', 'Galerie Lumière', 85000, '2023-05-14 10:00'],
  [9, 2, 'West Hall', 'Portrait of a Widow (A. Lunde)', 'Galerie Lumière', 240000, '2021-02-02 10:00'],
  [10, 2, 'Atrium', 'Night Ferry (bronze)', 'Galerie Lumière', 60000, '2019-09-09 10:00'],
  [11, 5, 'Box 1102', 'Bearer bonds (municipal)', 'Halloway family', 400000, '2024-12-01 10:00'],
  [12, 5, 'Box 1127', 'Ledger, second set', 'CH Group', null, '2025-10-25 11:20'],
  [13, 5, 'Box 1131', 'Stone vault drawings (originals)', 'CH Group', null, '2025-03-02 10:00'],
  [14, 5, 'Box 1140', 'Pearl necklace', 'Mrs. E. Carrow', 95000, '2022-07-07 14:00'],
  [15, 5, 'Box 1188', 'Deed: Pier 9', 'Port Vesper Rail Co.', 750000, '2018-04-04 09:30'],
  [16, 7, 'Penthouse safe', 'Tower vault codes (current)', 'Leo Crane', null, '2025-11-01 12:00'],
  [17, 7, 'Penthouse safe', 'Platinum wristwatch', 'Leo Crane', 85000, '2024-01-15 20:00'],
  [18, 7, 'Penthouse safe', 'Cash, sealed envelopes', 'Leo Crane', 250000, '2025-11-10 23:00'],
  [19, 8, 'B3 vault', 'Crane Holdings cash reserve', 'Crane Holdings', 14000000, '2025-06-30 06:00'],
  [20, 8, 'B3 vault', 'Gold bullion (40 bars)', 'Crane Holdings', 3200000, '2024-09-12 06:00'],
  [21, 8, 'B3 vault', 'File: the Stone case', 'Leo Crane', null, '2024-03-15 18:00'],
];

/* ------------------------------------------------------------------ vehicles */
const vehicles = [
  // plate, make, colour, owner, kind
  ['VX-4471', 'Dodge Charger (1970)', 'black', 'Dex Moran', 'car'],
  ['OB-1956', 'Ford panel van', 'cream', 'Sam Brandt', 'van'],
  ['AC-0001', 'Rolls-Royce Phantom', 'black', 'Leo Crane', 'car'],
  ['KT-2210', 'Lincoln Continental', 'black', 'Silas Voight', 'car'],
  ['AV-7', 'Armoured truck', 'grey', 'Crane Holdings', 'armoured truck'],
  ['RC-12', 'Armoured rail car', 'grey', 'Crane Holdings', 'rail car'],
  ['RC-4', 'Freight wagon', 'rust', 'Port Vesper Rail Co.', 'rail car'],
  ['PG-118', 'Chevrolet Nova', 'blue', 'Pat Garrow', 'car'],
  ['LB-302', 'Honda Civic', 'white', 'Lyle Brand', 'car'],
  ['RS-771', 'Vespa scooter', 'red', 'Rita Soames', 'scooter'],
  ['OP-505', 'Ford pickup', 'green', 'Owen Pike', 'truck'],
  ['NC-640', 'Volvo 240', 'brown', 'Nadia Fox', 'car'],
  ['HV-330', 'Buick Riviera', 'maroon', 'Hank Doyle', 'car'],
  ['VPD-17', 'Crown Victoria (unmarked)', 'grey', 'VPD Harbour Precinct', 'car'],
];

/* ------------------------------------------------------------------ transfers */
const transfers = [
  // id, plate, from_id, to_id, cargo, value, departs, arrives, route, escort_id
  [1, 'RC-12', 12, 5, 'Bearer bonds', 2400000, '2025-10-03 02:10', '2025-10-03 03:05', 'Platform 2 > Signal box 9 > Harbour line', 22],
  [2, 'AV-7', 12, 5, 'Cash', 220000, '2025-10-03 10:00', '2025-10-03 10:40', 'Harbour road', 23],
  [3, 'AV-7', 3, 5, 'Casino cash', 480000, '2025-10-06 06:00', '2025-10-06 06:30', 'Neon Row > Harbour road', 23],
  [4, 'RC-4', 4, 12, 'Machine parts', 60000, '2025-10-08 23:00', '2025-10-08 23:40', 'Platform 1 > East siding', null],
  [5, 'RC-12', 12, 5, 'Bearer bonds', 2400000, '2025-10-10 02:10', '2025-10-10 03:02', 'Platform 2 > Signal box 9 > Harbour line', 22],
  [6, 'AV-7', 12, 5, 'Cash', 190000, '2025-10-10 10:00', '2025-10-10 10:45', 'Harbour road', 23],
  [7, 'AV-7', 3, 5, 'Casino cash', 510000, '2025-10-13 06:00', '2025-10-13 06:28', 'Neon Row > Harbour road', 23],
  [8, 'RC-4', 12, 4, 'Empty crates', 0, '2025-10-15 23:00', '2025-10-15 23:35', 'East siding > Platform 1', null],
  [9, 'RC-12', 12, 5, 'Bearer bonds', 2600000, '2025-10-17 02:10', '2025-10-17 03:04', 'Platform 2 > Signal box 9 > Harbour line', 22],
  [10, 'AV-7', 12, 5, 'Cash', 240000, '2025-10-17 10:00', '2025-10-17 10:41', 'Harbour road', 23],
  [11, 'AV-7', 3, 5, 'Casino cash', 130000, '2025-10-20 06:00', '2025-10-20 06:31', 'Neon Row > Harbour road', 23],
  [12, 'RC-12', 12, 5, 'Bearer bonds', 2500000, '2025-10-24 02:10', null, 'Platform 2 > Signal box 9 > Harbour line', 22],
  [13, 'AV-7', 12, 5, 'Cash', 210000, '2025-10-24 10:00', null, 'Harbour road', 23],
];

/* ------------------------------------------------------------------ phones (directory) */
const phones = [
  // number, owner, kind
  ['555-0001', 'Leo Crane', 'mobile'],
  ['555-0010', 'Crane Holdings switchboard', 'landline'],
  ['555-0101', 'Vera Stone', 'mobile'],
  ['555-0102', 'Dex Moran', 'mobile'],
  ['555-0103', 'Kim Park', 'mobile'],
  ['555-0104', 'Sam Brandt', 'mobile'],
  ['555-0105', 'Ruby Lane', 'mobile'],
  ['555-0120', "Moretti's Pawn & Loan", 'landline'],
  ['555-0300', 'Orpheum security desk', 'desk'],
  ['555-0417', 'VPD Robbery (Det. N. Cole)', 'desk'],
  ['555-0500', 'First Meridian night desk', 'desk'],
  ['555-0610', 'Ray Harris', 'mobile'],
  ['555-0700', 'Marlowe front desk', 'desk'],
  ['555-0800', 'Crane Tower security', 'desk'],
  ['555-0900', 'Moran Motors', 'landline'],
  ['555-0910', 'Blue Anchor Bar', 'landline'],
  ['555-0920', 'Vesper 24h Lock & Key', 'landline'],
  ['555-0930', 'Mrs. H. Park', 'landline'],
];

/* ------------------------------------------------------------------ calls (cell = tower the CALLER pinged) */
const calls = [
  // id, caller, callee, at, seconds, cell
  [1, '555-0120', '555-0001', '2025-09-10 08:50', 120, 'NARROWS-1'],
  [2, '555-0102', '555-0900', '2025-10-02 17:15', 60, 'DOCK-2'],
  [3, '555-0101', '555-0104', '2025-10-02 20:30', 90, 'HARB-5'],
  [4, '555-0105', '555-0417', '2025-10-12 09:30', 40, 'NARROWS-1'],
  [5, '555-0010', '555-0102', '2025-10-14 21:05', 180, 'CROWN-1'],
  [6, '555-0666', '555-0300', '2025-10-16 01:15', 30, 'NEON-2'],
  [7, '555-0102', '555-0910', '2025-10-16 23:39', 35, 'DOCK-2'],
  [8, '555-0105', '555-0417', '2025-10-16 23:45', 70, 'NARROWS-1'],
  [9, '555-0199', '555-0001', '2025-10-16 23:47', 48, 'DOCK-2'],
  [10, '555-0104', '555-0910', '2025-10-16 23:50', 20, 'IRON-4'],
  [11, '555-0103', '555-0920', '2025-10-16 23:55', 45, 'DOCK-2'],
  [12, '555-0001', '555-0300', '2025-10-16 23:58', 95, 'HARB-5'],
  [13, '555-0102', '555-0900', '2025-10-21 23:45', 30, 'IRON-4'],
  [14, '555-0103', '555-0930', '2025-10-22 23:56', 300, 'DOCK-2'],
  [15, '555-0199', '555-0001', '2025-10-23 00:05', 51, 'DOCK-2'],
  [16, '555-0102', '555-0101', '2025-10-23 00:12', 25, 'DOCK-2'],
  [17, '555-0001', '555-0800', '2025-10-23 00:14', 140, 'HARB-5'],
  [18, '555-0101', '555-0104', '2025-10-23 00:40', 60, 'HARB-5'],
  [19, '555-0800', '555-0001', '2025-10-23 11:02', 85, 'IRON-4'],
  [20, '555-0103', '555-0920', '2025-10-30 23:49', 50, 'OLDQ-3'],
  [21, '555-0105', '555-0417', '2025-10-30 23:50', 65, 'NARROWS-1'],
  [22, '555-0199', '555-0001', '2025-10-30 23:52', 40, 'DOCK-2'],
  [23, '555-0102', '555-0104', '2025-10-30 23:58', 30, 'DOCK-2'],
  [24, '555-0001', '555-0500', '2025-10-30 23:59', 110, 'HARB-5'],
  [25, '555-0101', '555-0103', '2025-11-04 18:20', 45, 'HARB-5'],
  [26, '555-0102', '555-0910', '2025-11-06 23:36', 40, 'DOCK-2'],
  [27, '555-0199', '555-0001', '2025-11-06 23:44', 62, 'DOCK-2'],
  [28, '555-0103', '555-0930', '2025-11-06 23:50', 200, 'DOCK-2'],
  [29, '555-0001', '555-0610', '2025-11-06 23:55', 75, 'HARB-5'],
  [30, '555-0610', '555-0001', '2025-11-08 20:40', 30, 'OLDQ-3'],
  [31, '555-0102', '555-0101', '2025-11-13 23:30', 20, 'DOCK-2'],
  [32, '555-0199', '555-0001', '2025-11-13 23:38', 45, 'DOCK-2'],
  [33, '555-0104', '555-0910', '2025-11-13 23:40', 30, 'IRON-4'],
  [34, '555-0105', '555-0417', '2025-11-13 23:41', 55, 'NARROWS-1'],
  [35, '555-0103', '555-0920', '2025-11-13 23:44', 35, 'DOCK-2'],
  [36, '555-0001', '555-0700', '2025-11-13 23:46', 60, 'NEON-2'],
  [37, '555-0417', '555-0105', '2025-11-15 10:00', 240, 'DOCK-2'],
  [38, '555-0010', '555-0001', '2025-11-21 17:20', 90, 'CROWN-1'],
  [39, '555-0104', '555-0105', '2025-11-21 23:30', 25, 'DOCK-2'],
  [40, '555-0103', '555-0930', '2025-11-21 23:35', 120, 'DOCK-2'],
  [41, '555-0199', '555-0001', '2025-11-21 23:41', 57, 'DOCK-2'],
  [42, '555-0102', '555-0104', '2025-11-21 23:48', 15, 'DOCK-2'],
  [43, '555-0001', '555-0800', '2025-11-21 23:49', 130, 'HARB-5'],
  [44, '555-0001', '555-0700', '2025-11-21 23:52', 40, 'HARB-5'],
];

/* ------------------------------------------------------------------ ledger (money: casino drops, markers, transfers) */
const ledger = [];
const G = (building, kind, party, amount, at, memo = null, settledBy = null) => ledger.push([ledger.length + 1, building, kind, party, amount, at, memo, settledBy]);
const drops = { '01:00 drop': [40100, 42300, 39800, 43500, 40300], '02:30 drop': [57200, 60100, 58000, 59300, 58400], '03:30 drop': [94800, 97900, 96100, 98300, 94900] };
['2025-10-13', '2025-10-14', '2025-10-15', '2025-10-16', '2025-10-17'].forEach((d, i) => {
  for (const [memo, amounts] of Object.entries(drops)) G(3, 'drop', 'Cage', amounts[i], `${d} ${memo.slice(0, 5)}`, memo);
});
G(3, 'marker', 'Judge Amos Harlan', 30000, '2025-09-05 02:10', 'VIP baccarat');
G(3, 'marker', 'Judge Amos Harlan', 22000, '2025-10-10 01:40', 'VIP baccarat');
G(3, 'marker', 'Dex Moran', 12000, '2025-08-30 03:15', 'Blackjack', 'CH Group');
G(3, 'marker', 'Dex Moran', 15000, '2025-09-19 02:50', 'Blackjack', 'CH Group');
G(3, 'marker', 'Dex Moran', 11000, '2025-10-04 03:30', 'Craps', 'CH Group');
G(3, 'marker', 'Vic Lomond', 21000, '2025-09-27 00:45', 'Roulette');
G(3, 'marker', 'Ray Harris', 9500, '2025-08-16 23:30', 'Blackjack', 'CH Group');
G(3, 'marker', 'Celeste Morrow', 7500, '2025-09-12 22:15', 'Baccarat', 'Celeste Morrow');
G(3, 'settlement', 'Dex Moran', -38000, '2025-10-15 22:40', 'markers cleared', 'CH Group');
G(3, 'settlement', 'Ray Harris', -9500, '2025-09-01 12:00', 'markers cleared', 'CH Group');
G(5, 'deposit', 'CH Group', 250000, '2025-10-14 09:30', 'retainer from Crane Holdings', 'Crane Holdings');
G(5, 'deposit', 'Halloway family', 18000, '2025-10-20 11:00', 'consignment float');
G(5, 'withdrawal', 'CH Group', -40000, '2025-10-15 21:00', 'cash', null);

/* ------------------------------------------------------------------ lots + bids (Halloway & Sons, sale of 2025-11-08) */
const lots = [
  // id, building_id, lot_no, title, estimate, reserve, consignor, sale_at
  [1, 6, 12, 'Bronze harbour bell', 18000, 15000, 'Port Vesper Rail Co.', '2025-11-08 19:22'],
  [2, 6, 18, 'Portrait of a Harbour Master', 42000, null, 'Estate of M. Lowell', '2025-11-08 19:34'],
  [3, 6, 23, 'Diamond rivière necklace', 310000, 280000, null, '2025-11-08 19:44'],
  [4, 6, 31, 'Sapphire brooch', 145000, 120000, 'Mrs. E. Carrow', '2025-11-08 20:00'],
  [5, 6, 38, 'Art deco cocktail cabinet', 22000, null, 'Halloway family', '2025-11-08 20:14'],
  [6, 6, 44, 'Ming-style vase', 95000, 80000, 'Estate of M. Lowell', '2025-11-08 20:26'],
  [7, 6, 46, 'First edition: The Long Tide', 12000, null, null, '2025-11-08 20:31'],
  [8, 6, 47, 'Walnut writing desk (1924)', 38000, null, null, '2025-11-08 20:34'],
  [9, 6, 48, 'Vesper Yacht Club gold cup', 60000, 50000, 'Vesper Yacht Club', '2025-11-08 20:38'],
  [10, 6, 52, 'The Crane Emerald', 1400000, 1200000, 'Crane Holdings', '2025-11-08 20:50'],
  [11, 6, 60, 'Harbour at Dusk (oil)', 26000, null, 'Halloway family', '2025-11-08 21:10'],
];
const bids = [
  // id, lot_id, paddle, bidder, method, amount, placed_at, callback (digits only)
  [1, 8, null, null, 'commission', 400000, '2025-11-07 09:10', '5550001'],
  [2, 8, 'P-114', 'Mrs. E. Carrow', 'commission', 42000, '2025-11-05 15:00', null],
  [3, 8, 'P-208', 'Vic Lomond', 'phone', 45000, '2025-11-06 12:30', '5550950'],
  [4, 10, 'P-301', 'Judge Amos Harlan', 'phone', 1250000, '2025-11-06 16:00', '5550333'],
  [5, 10, null, null, 'commission', 1300000, '2025-11-07 09:12', '5550010'],
  [6, 3, 'P-114', 'Mrs. E. Carrow', 'commission', 290000, '2025-11-05 15:05', null],
  [7, 4, 'P-122', 'Celeste Morrow', 'commission', 150000, '2025-11-04 10:00', null],
  [8, 6, 'P-208', 'Vic Lomond', 'phone', 82000, '2025-11-06 12:35', '5550950'],
  [9, 9, 'P-301', 'Judge Amos Harlan', 'commission', 55000, '2025-11-06 16:05', null],
  [10, 2, 'P-140', 'Odile Marchand', 'commission', 44000, '2025-11-03 11:00', null],
  [11, 11, 'P-122', 'Celeste Morrow', 'phone', 30000, '2025-11-04 10:05', '5550122'],
  [12, 1, 'P-155', null, 'commission', 16000, '2025-11-02 09:00', null],
];

/* ------------------------------------------------------------------ guests (Marlowe Hotel register) */
const guests = [
  // id, building_id, name, room, floor, check_in, check_out, rate, notes
  [1, 7, 'Leo Crane', 'Penthouse', 22, '2019-06-01 12:00', null, 0, 'owner; private lift'],
  [2, 7, 'Judge Amos Harlan', '2201', 22, '2025-09-01 14:00', null, 1200, 'long stay'],
  [3, 7, 'Mrs. E. Carrow', '1804', 18, '2025-11-05 15:00', '2025-11-12 11:00', 640, null],
  [4, 7, 'Vic Lomond', '1210', 12, '2025-11-06 18:20', '2025-11-09 11:00', 420, 'late checkout requested'],
  [5, 7, 'Mme Odette Vire', '2104', 21, '2025-11-12 16:00', null, 980, 'no housekeeping'],
  [6, 7, 'Celeste Morrow', '2102', 21, '2025-11-10 13:00', '2025-11-16 11:00', 980, null],
  [7, 7, 'Dr. Felix Amari', '2106', 21, '2025-11-11 19:30', '2025-11-14 11:00', 760, 'medical conference'],
  [8, 7, 'Mr. & Mrs. Yusuf', '1502', 15, '2025-11-13 14:00', '2025-11-15 11:00', 510, 'anniversary'],
  [9, 7, 'Silas Voight', '0907', 9, '2025-11-01 22:00', '2025-11-02 07:00', 0, 'comp'],
  [10, 7, 'Hollis Brandt-Weir', '1720', 17, '2025-11-12 12:00', null, 560, null],
  [11, 7, 'Nadia Farrow', '1106', 11, '2025-11-09 16:40', '2025-11-13 11:00', 410, null],
  [12, 7, 'Mme Odette Vire', '2104', 21, '2025-10-02 16:00', '2025-10-04 11:00', 980, null],
];

export const SETUP_SQL = `
CREATE TABLE buildings (id INTEGER PRIMARY KEY, name TEXT, district TEXT, owner TEXT, floors INTEGER, opened INTEGER);
CREATE TABLE staff (id INTEGER PRIMARY KEY, building_id INTEGER REFERENCES buildings(id), name TEXT, role TEXT, post TEXT, shift TEXT, break_at TEXT, age INTEGER, hired TEXT, phone TEXT);
CREATE TABLE zones (id INTEGER PRIMARY KEY, building_id INTEGER REFERENCES buildings(id), name TEXT, floor INTEGER, alarm TEXT, armed_from TEXT, armed_to TEXT);
CREATE TABLE cameras (id INTEGER PRIMARY KEY, building_id INTEGER REFERENCES buildings(id), zone_id INTEGER REFERENCES zones(id), spot TEXT, model TEXT, working INTEGER, last_service TEXT);
CREATE TABLE access_log (id INTEGER PRIMARY KEY, building_id INTEGER REFERENCES buildings(id), door TEXT, credential TEXT, staff_id INTEGER REFERENCES staff(id), at TEXT, direction TEXT);
CREATE TABLE valuables (id INTEGER PRIMARY KEY, building_id INTEGER REFERENCES buildings(id), location TEXT, item TEXT, owner TEXT, value INTEGER, stored_at TEXT);
CREATE TABLE vehicles (plate TEXT PRIMARY KEY, make TEXT, colour TEXT, owner TEXT, kind TEXT);
CREATE TABLE transfers (id INTEGER PRIMARY KEY, plate TEXT REFERENCES vehicles(plate), from_id INTEGER REFERENCES buildings(id), to_id INTEGER REFERENCES buildings(id), cargo TEXT, value INTEGER, departs TEXT, arrives TEXT, route TEXT, escort_id INTEGER REFERENCES staff(id));
CREATE TABLE phones (number TEXT PRIMARY KEY, owner TEXT, kind TEXT);
CREATE TABLE calls (id INTEGER PRIMARY KEY, caller TEXT, callee TEXT, at TEXT, seconds INTEGER, cell TEXT);
CREATE TABLE ledger (id INTEGER PRIMARY KEY, building_id INTEGER REFERENCES buildings(id), kind TEXT, party TEXT, amount INTEGER, at TEXT, memo TEXT, settled_by TEXT);
CREATE TABLE lots (id INTEGER PRIMARY KEY, building_id INTEGER REFERENCES buildings(id), lot_no INTEGER, title TEXT, estimate INTEGER, reserve INTEGER, consignor TEXT, sale_at TEXT);
CREATE TABLE bids (id INTEGER PRIMARY KEY, lot_id INTEGER REFERENCES lots(id), paddle TEXT, bidder TEXT, method TEXT, amount INTEGER, placed_at TEXT, callback TEXT);
CREATE TABLE guests (id INTEGER PRIMARY KEY, building_id INTEGER REFERENCES buildings(id), name TEXT, room TEXT, floor INTEGER, check_in TEXT, check_out TEXT, rate INTEGER, notes TEXT);
${ins('buildings', buildings)}${ins('staff', staff)}${ins('zones', zones)}${ins('cameras', cameras)}${ins('access_log', log)}${ins('valuables', valuables)}${ins('vehicles', vehicles)}${ins('transfers', transfers)}${ins('phones', phones)}${ins('calls', calls)}${ins('ledger', ledger)}${ins('lots', lots)}${ins('bids', bids)}${ins('guests', guests)}`;

const T = 'TEXT', I = 'INTEGER';
export const SCHEMA = [
  { name: 'buildings', blurb: 'Every address on the municipal records network, and who owns it.', cols: [['id', I, 'pk'], ['name', T], ['district', T], ['owner', 'TEXT · NULL = no owner on file'], ['floors', I], ['opened', 'INTEGER · year']] },
  { name: 'staff', blurb: 'Everyone on a payroll: post, shift and when they take their break.', cols: [['id', I, 'pk'], ['building_id', '→ buildings.id', 'fk'], ['name', T], ['role', T], ['post', 'TEXT · where they stand (NULL = no fixed post)'], ['shift', "'day' | 'swing' | 'night'"], ['break_at', "'HH:MM' · NULL = no break"], ['age', I], ['hired', "'YYYY-MM-DD'"], ['phone', '→ phones.number · NULL', 'fk']] },
  { name: 'zones', blurb: 'Alarm zones inside each building and when they are armed.', cols: [['id', I, 'pk'], ['building_id', '→ buildings.id', 'fk'], ['name', T], ['floor', 'INTEGER · negative = basement'], ['alarm', 'TEXT · NULL = no alarm'], ['armed_from', "'HH:MM' · NULL"], ['armed_to', "'HH:MM' · NULL"]] },
  { name: 'cameras', blurb: 'Every security camera, where it points, and whether it works.', cols: [['id', I, 'pk'], ['building_id', '→ buildings.id', 'fk'], ['zone_id', '→ zones.id', 'fk'], ['spot', T], ['model', T], ['working', '1 = live · 0 = dead'], ['last_service', "'YYYY-MM-DD' · NULL = never"]] },
  { name: 'access_log', blurb: 'Badge swipes and licence-plate reads at every reader in town.', cols: [['id', I, 'pk'], ['building_id', '→ buildings.id', 'fk'], ['door', T], ['credential', 'TEXT · badge id or plate'], ['staff_id', '→ staff.id · NULL = not staff', 'fk'], ['at', "'YYYY-MM-DD HH:MM'"], ['direction', "'in' | 'out'"]] },
  { name: 'valuables', blurb: 'What sits in the safes, cases, walls and boxes, and whose it is.', cols: [['id', I, 'pk'], ['building_id', '→ buildings.id', 'fk'], ['location', T], ['item', T], ['owner', T], ['value', 'INTEGER · $ · NULL = not appraised'], ['stored_at', "'YYYY-MM-DD HH:MM'"]] },
  { name: 'vehicles', blurb: 'Registered plates: cars, armoured trucks and rail cars.', cols: [['plate', T, 'pk'], ['make', T], ['colour', T], ['owner', T], ['kind', T]] },
  { name: 'transfers', blurb: 'Scheduled movements of cash and cargo between buildings.', cols: [['id', I, 'pk'], ['plate', '→ vehicles.plate', 'fk'], ['from_id', '→ buildings.id', 'fk'], ['to_id', '→ buildings.id', 'fk'], ['cargo', T], ['value', 'INTEGER · $'], ['departs', "'YYYY-MM-DD HH:MM'"], ['arrives', "'YYYY-MM-DD HH:MM' · NULL = not yet"], ['route', T], ['escort_id', '→ staff.id · NULL = unescorted', 'fk']] },
  { name: 'phones', blurb: 'The phone directory. Unlisted numbers are not in it.', cols: [['number', "TEXT · '555-0000'", 'pk'], ['owner', T], ['kind', "'mobile' | 'landline' | 'desk'"]] },
  { name: 'calls', blurb: 'Call records: who rang whom, when, and which cell tower the caller hit.', cols: [['id', I, 'pk'], ['caller', '→ phones.number', 'fk'], ['callee', '→ phones.number', 'fk'], ['at', "'YYYY-MM-DD HH:MM'"], ['seconds', I], ['cell', "TEXT · caller's cell tower"]] },
  { name: 'ledger', blurb: 'Money moving: casino drops, gambling markers, settlements, deposits.', cols: [['id', I, 'pk'], ['building_id', '→ buildings.id', 'fk'], ['kind', "'drop' | 'marker' | 'settlement' | 'deposit' | 'withdrawal'"], ['party', T], ['amount', 'INTEGER · $'], ['at', "'YYYY-MM-DD HH:MM'"], ['memo', 'TEXT · NULL'], ['settled_by', 'TEXT · who paid · NULL = unpaid']] },
  { name: 'lots', blurb: 'Halloway & Sons catalogue for the November sale.', cols: [['id', I, 'pk'], ['building_id', '→ buildings.id', 'fk'], ['lot_no', I], ['title', T], ['estimate', 'INTEGER · $'], ['reserve', 'INTEGER · $ · NULL = no reserve'], ['consignor', 'TEXT · NULL = anonymous'], ['sale_at', "'YYYY-MM-DD HH:MM' · hammer time"]] },
  { name: 'bids', blurb: 'The bid book: commission and phone bids left before the sale.', cols: [['id', I, 'pk'], ['lot_id', '→ lots.id', 'fk'], ['paddle', 'TEXT · NULL = none'], ['bidder', 'TEXT · NULL = undisclosed'], ['method', "'commission' | 'phone'"], ['amount', 'INTEGER · $'], ['placed_at', "'YYYY-MM-DD HH:MM'"], ['callback', 'TEXT · digits only · NULL']] },
  { name: 'guests', blurb: 'Marlowe Hotel register: who is in which room.', cols: [['id', I, 'pk'], ['building_id', '→ buildings.id', 'fk'], ['name', T], ['room', T], ['floor', I], ['check_in', "'YYYY-MM-DD HH:MM'"], ['check_out', "'YYYY-MM-DD HH:MM' · NULL = still here"], ['rate', 'INTEGER · $ per night'], ['notes', 'TEXT · NULL']] },
];

export const RELATIONS = [
  { from: 'staff', fromCol: 'building_id', to: 'buildings', toCol: 'id' },
  { from: 'staff', fromCol: 'phone', to: 'phones', toCol: 'number' },
  { from: 'zones', fromCol: 'building_id', to: 'buildings', toCol: 'id' },
  { from: 'cameras', fromCol: 'building_id', to: 'buildings', toCol: 'id' },
  { from: 'cameras', fromCol: 'zone_id', to: 'zones', toCol: 'id' },
  { from: 'access_log', fromCol: 'building_id', to: 'buildings', toCol: 'id' },
  { from: 'access_log', fromCol: 'staff_id', to: 'staff', toCol: 'id' },
  { from: 'valuables', fromCol: 'building_id', to: 'buildings', toCol: 'id' },
  { from: 'transfers', fromCol: 'plate', to: 'vehicles', toCol: 'plate' },
  { from: 'transfers', fromCol: 'from_id', to: 'buildings', toCol: 'id' },
  { from: 'transfers', fromCol: 'to_id', to: 'buildings', toCol: 'id' },
  { from: 'transfers', fromCol: 'escort_id', to: 'staff', toCol: 'id' },
  { from: 'calls', fromCol: 'caller', to: 'phones', toCol: 'number' },
  { from: 'calls', fromCol: 'callee', to: 'phones', toCol: 'number' },
  { from: 'ledger', fromCol: 'building_id', to: 'buildings', toCol: 'id' },
  { from: 'lots', fromCol: 'building_id', to: 'buildings', toCol: 'id' },
  { from: 'bids', fromCol: 'lot_id', to: 'lots', toCol: 'id' },
  { from: 'guests', fromCol: 'building_id', to: 'buildings', toCol: 'id' },
];
