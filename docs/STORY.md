# INSIDE JOB: Story Bible & Job Specs

> The contract for the job writers. **DESIGN.md §6 is the data shape; this file is the content.**
> Every fact below was run against `src/data/schema.js`. Do not invent data facts; if you need
> one that isn't here, ask the content owner. Don't edit `schema.js` yourself: the other half of
> the jobs depends on the same rows.

Workflow for each job:
1. Write `src/data/jobs/<id>.js` (copy the shape of `pawn.js`), then uncomment its line in `src/data/jobs/index.js`.
2. `node scripts/verify-content.mjs --dump --job <id>`: it must pass, and every `intel` must match the dumped rows.
3. `node scripts/preview-blueprints.mjs <id>` then
   `node scripts/shot.mjs "/home/vinayak/Inside Job/shots/content/<id>.svg" shots/content/<id>.png --base "file://" --w 1200 --h 760 --wait 300`
   and look at the PNG. Fix overlaps, and fix any route or guard loop that goes through a wall.

---

## 1. The arc

**Premise.** Leo Crane robbed his own vault and framed the woman who designed it. Vera Stone did eighteen
months. Out in September 2025, she recruits a crew and a sixth member nobody ever sees: you, the Architect.
Motif: *every building keeps a record* (the opening caption, Vera's closing line, Cole's card). Rain in every exterior.
The green ledger's page 14 recurs (pawn → tower → epilogue).

**Stakes (planted in the PROLOGUE's character-intro cards, paid off in the EPILOGUE):**
| Who | Stake | Arc |
|---|---|---|
| Vera | Her name, and the truth on the record | Revenge vs crew. She uses everyone, Ruby included, to catch the leak, and hates it. Ends by giving the money back and keeping only the file. |
| Dex | $38,000 in markers, and his kid sister **Mia**'s garage on a Crane lease | Crane buys him through Mia (gallery after). He betrays the crew out of fear, not greed. Exposed in job 8; Vera leaves Mia the deed. "Keep the car. Lose my number." |
| Kim | Crane evicted her mother's shop, Park Lock & Key | Loves locks more than people; she's the one who says "it's one of us". Ends reopening the shop. |
| Sam | Crane's frame job emptied the guards' pension fund: 400 names | The crew's heart. Beaten by Voight's men after job 7 (the lowest point). Ends reading that the pension is repaid. |
| Ruby | Cole holds an old warrant with her real name on it | Red herring: her late calls go to VPD. Her deal is Crane for the warrant. Twist: she refused to give Cole the Architect. |
| Crane | Escalates every job | "Find out what they love" (1) → buys Dex (2) → knows the crew, calls Vera (4) → has Sam beaten, wants the Architect (7) → arrested in his own garage (8). |
| Cole | Nine years on Crane; never liked how neat the Stone case was | Hunter → grudging ally. Close call at the rail yard; recruits Ruby; ends with a card: "To the Architect. When you want honest work." |

**Structure (what each `after` beat does):**
- Prologue: recruitment montage, with a character-intro card and stake line for Vera, Dex (+Mia), Kim, Sam, Ruby, then Crane and Cole.
- Jobs 1–2, setup, the crew clicks: pawn after = page 14 names Vera's judge, and Crane: "find out what they love". Gallery after = the celebration, then **Crane calls Dex about his sister's lease** (the hook).
- Job 3, first crack: an extra guard knew. The crew bickers, and suspicion lands on Sam. **Dramatic irony:** the audience sees Dex's silhouette step out to make a call.
- Job 4, **midpoint reversal**: police at the Harbour line, and Cole gets half of Dex's plate. At the diner: "one of yours calls my desk". Then **Crane rings the safehouse**: "Tell the wheelman I admire his car." He knows them all.
- Jobs 5–6, turning inward: the bank fight ("where do you go after meetings, Ruby?"), then Ruby on a payphone to "Detective". Auction: Crane finds the drawer empty and orders Sam hurt. Dex swears on his sister. Crane padlocks Mia's garage.
- Job 7, **lowest point**: Voight's men put Sam in hospital. Cole: "This is Crane's war now." Kim: "It's one of us." Ruby: "Time I told you where I go." Crane: "Next time it's the girl with the glasses. Bring me your Architect."
- Job 8, reveal and double-cross: Ruby confesses to calling a cop, never Crane. Vera plants "garage ramp, 02:00" at the table. The queries prove Dex. The crew takes B3 through the shaft while Crane waits on his ramp.
- Epilogue: Cole takes Crane. **Ruby's deal**, and she wouldn't give up the Architect. **Vera's sting:** she read Ruby's calls in week one and let the mole watch Ruby instead of her. Dex and the deed. Everyone's stake repaid ("mystery donor"). Cole's card to the Architect.

**The mole (data).** Dex. Crane Holdings' switchboard calls him on 10-14. His markers are settled by the shell CH Group on 10-15.
After every crew meeting he calls Crane from an unlisted burner (**555-0199**) in cell **DOCK-2**, and Crane calls the next
target's security within minutes. Ruby's late calls go to VPD Robbery (555-0417) from NARROWS-1.

### Timeline (all 2025; used by the data)

| Date | Event |
|---|---|
| 09-10 09:15 | Moretti puts the green ledger in his floor safe; he calls Crane at 08:50 |
| 09-12 | Vera released |
| 10-03 ~01:30 | **Job 1** pawn |
| 10-11 ~21:10 | **Job 2** gallery gala |
| 10-14 21:05 | Crane Holdings switchboard (555-0010) calls Dex for 3 minutes (**first hook**) |
| 10-15 22:10 | Dex's Charger (VX-4471) enters the Crane Tower garage; 22:40 his markers are settled by CH Group |
| 10-16 evening | Crew meeting (casino). **23:47 burner → Crane.** 23:58 Crane → Orpheum security |
| 10-17 | Orpheum hires an extra cage-corridor guard (Cleo Marsh) |
| 10-17/18 night | **Job 3** casino (03:40) |
| 10-21 23:40 | Dex's car at the rail yard gate ("recon") |
| 10-22 evening | Crew meeting. **10-23 00:05 burner → Crane.** 00:14 Crane → Tower security (Voight) |
| 10-23 10:15 | Voight's Lincoln (KT-2210) visits the rail yard |
| 10-24 02:20 | **Job 4** rail (RC-12 at Signal box 9) |
| 10-25 11:20 | Crane's man puts the "second set" ledger in Box 1127 |
| 10-27 | Rookie guard Toby Bell hired at First Meridian |
| 10-30 evening | Crew meeting: the table hears "night depository, 03:00". **23:52 burner → Crane.** 23:59 Crane → First Meridian night desk |
| 10-31 02:40 | **Job 5** bank (records room, not the depository) |
| 11-06 evening | Meeting. **23:44 burner → Crane.** 23:55 Crane → Ray Harris (head porter) |
| 11-07 00:30 | Dex's car at the Crane Tower garage again |
| 11-08 20:15 | **Job 6** auction (Lot 47 swap) |
| 11-13 evening | Meeting (Vera tells the table "Saturday"). **23:38 burner → Crane.** 23:46 Crane → Marlowe front desk |
| 11-14 23:55 | **Job 7** penthouse (Friday, not Saturday) |
| 11-21 evening | Last meeting: Vera's fake plan "garage ramp 02:00". **23:41 burner → Crane.** 23:49 Crane → Tower security, 23:52 → Marlowe |
| 11-22 00:10 | Tower roll call: 8 guards on the garage ramp |
| 11-22 02:00 | **Job 8** tower (maintenance shaft) |

Cell towers in `calls.cell`: `DOCK-2` (the safehouse block, Dockside; Kim lives upstairs),
`NARROWS-1`, `IRON-4` (Sam's home, rail yard), `OLDQ-3`, `HARB-5` (Harbour Heights: the Marlowe, Vera's flat),
`CROWN-1` (Crane Tower), `NEON-2`.

### Mole clue trail (what the player sees, in order)

| Job | Clue in a query result | Crew's cover story |
|---|---|---|
| 3 | P5: Dex Moran owes the Orpheum **$38,000** in markers | Dex: "Old news. Paid it off." (true: someone else paid it) |
| 3 after | An extra guard, hired the day of the job, was on the cage corridor | "Somebody knew." Suspicion falls on Sam (he knows the guards) |
| 4 | P5: one-time plates at the yard gate: **VX-4471, Dex Moran, 10-21 23:40**, and Crane's security chief two days later | Dex: "Recon. It's literally my job." |
| 5 | P5: an **unlisted number (555-0199)** called Crane's private line 3×, each on a crew-meeting night, all from DOCK-2 | Vera: "Somebody's talking." The depository plan is burned |
| 6 | P5: Dex's markers were **paid by CH Group**, the same shell that owns Box 1127 (job 5) | Dex: "I paid those." Vera says nothing. |
| 7 | P5: every burner call pinged **DOCK-2**, our block, one week apart, the night before each job | Kim: "That's our block." Vera: "Then it's one of us." |
| 8 | P3: crew phones in the burner's cell within 15 min of every call: **Dex 6/6**, Kim 5/6, Sam 1/6. P4: only Dex has both a CH Group payoff and a car at Crane Tower | Proof |

Hindsight clues in the sandbox: calls #5 (Crane Holdings → Dex, 10-14), Dex's plate at the Crane Tower garage
(10-15, 11-07), the settlement row in `ledger` (10-15 22:40), and the CH Group deposit "retainer from Crane Holdings".

---

## 2. Voices

| id | Voice rules | Sample |
|---|---|---|
| viv | Cool, precise, dry. Short declaratives. Calls the player "Architect". Never exclaims. | "Two days before they let me out. He was expecting me." |
| dex | Cocky, fast, car metaphors. Jokes to deflect. **As the mole: over-explains, changes the subject to cars, volunteers alibis nobody asked for.** Never lies about data the player can check; spins it. | "Seven for seven. Man's more reliable than my transmission." |
| juno | Deadpan, literal, nerdy. Loves locks more than people. "Technically…" | "A dead camera in the room with the safe. I think I'm in love." |
| otis | Gentle giant. Plain, warm. Knows guards as people and union rules by heart (breaks are 30 min). | "Frankie Ruiz. Union break's thirty minutes, and Frankie never gives one back." |
| lena | Theatrical, charming, a little wicked. "Darling." Always in costume. Secretive about her phone. | "Darling, don't look at me. I read people." |
| crane | Velvet menace. Amused, patient. People are property. Never swears. | "Stone's out. Find out who she's hired." |
| calloway | Weary, sardonic. Asks questions she knows the answer to. | "Nothing taken. So why are you shaking, Sal?" |
| mia | Dex's kid sister, a mechanic. Blunt, tired, loves him, doesn't trust him. | "They said you'd understand, Dex. Do you?" |
| minor (`moretti`, `ruiz`, `voight`, `harris`, `guard`) | One-liners only. First appearance gets a `character-intro { who, tagline }` card. | |

Rules: lines under 140 characters (the verifier warns). No exposition dumps. Captions read like a noir novel
(present tense, concrete, one image per caption); dialogue reads like a heist film. The Architect (`you`) never speaks.
`ask` is in character: the crew's need and why. `prompt` is the exact spec (columns, order, aliases, filters).
`hint` is always Kim's voice (it's the "Ask Kim" button), whoever asked.

---

## 3. Conventions (all jobs)

- **Puzzles**: exactly 5. Use only concepts introduced up to this job (verifier enforces). Keys:
  job1 `select where orderby limit aggregate` · job2 `distinct like inlist between andor` · job3 `join groupby` ·
  job4 `having multijoin` · job5 `subquery leftjoin nulls` · job6 `casewhen strings dates` · job7 `window rownum` · job8 `cte union exists`.
  List the concepts each puzzle actually exercises, including earlier ones where they matter.
- **prompt** names exact columns, order, aliases. When `orderMatters: true`, the prompt must state the sort.
  Use the SQL below verbatim as `sql` (you may reformat whitespace). If you change a query, re-dump and fix the intel.
- **Money** in intel: write `$96,400`. Times as `01:30`.
- **Pages**: layouts `full`(1 panel) `2h`/`2v`(2) `3a`/`3b`(3) `4`(4) `strip`(2–5). Shots only from DESIGN.md §6.5.
  Briefing 2–3 pages, first panel `title-card` `{ kicker: 'Job 0N · <District>', title }`. Success replay 3–4 pages
  that play the chosen route beat by beat; failure 1–2 pages, generic (alarm / police-lights / getaway / car-interior).
  `face` needs `{ who, mood }`, mood ∈ calm/smirk/tense/shock.
- **Blueprint** (1200×760): `doors` use `x, y` = **start** of the opening, running `w` along +x (`dir:'h'`) or +y (`dir:'v'`).
  Rooms outside the building (street, alley, yard, rails) get `outdoor: true` (the verifier won't treat their edges as walls;
  renderers should draw them dashed). Every room name should match the `zones.name` it represents, so queries and plan agree.
  Camera `dir` in degrees, 0 = east, clockwise (90 = south). Keep cones inside their room. Guard `path` = closed loop
  through doors. Play `route`s may cross walls only at doors (verifier enforces); a vent/roof/shaft route starts at its
  entry point inside the room. The correct route must visibly avoid live cones and guard loops; wrong routes cross them.
  `shell` is the only initial layer; each puzzle reveals 1–2 layers; every layer should be revealed by some puzzle.
- **Take**: 1 pawn 40,000 · 2 gallery 90,000 · 3 casino 180,000 · 4 rail 260,000 · 5 bank 400,000 · 6 auction 550,000 · 7 penthouse 800,000 · 8 tower 1,500,000.
- **hubPos**: pawn (0.16, 0.74) · gallery (0.34, 0.50) · casino (0.60, 0.64) · rail (0.90, 0.80) · bank (0.64, 0.38) · auction (0.26, 0.32) · penthouse (0.80, 0.22) · tower (0.50, 0.12).

---

## 4. Jobs

### Job 1 · `pawn` · Cold Open (DONE: `src/data/jobs/pawn.js`, use as the reference)
Moretti's Pawn & Loan (building 1), The Narrows. Goal: the green ledger in the back office floor safe.
Play: **Roof hatch at 01:30** (back office camera dead, Ruiz on break). After: Cole questions Moretti; Crane: "Find out who she's hired."

---

### Job 2 · `gallery` · The Gilded Frame
**Target** Galerie Lumière (building 2), Old Quarter · **Goal** during the opening gala, swap *The Drowned Harbour*
(Crane's prize, $1.2M, hangs in the East Hall) for Kim's forgery and wheel the original out on a catering cart.
Ruby plays the new agency caterer. Crane attends the gala. **logline** idea: "Crane's favourite painting, his favourite party. Bring a cart."

| # | Question (who asks) | Concepts | SQL | True answer |
|---|---|---|---|---|
| 1 | Which doors are on the badge system? (juno) | distinct, where, orderby | `SELECT DISTINCT door FROM access_log WHERE building_id = 2 ORDER BY door;` (orderMatters true) | 4 doors: Front doors, Loading dock, Service corridor, Staff entrance. **The kitchen door is not on the badge system.** |
| 2 | Which one's the harbour painting? (viv) | like | `SELECT item, location, owner, value FROM valuables WHERE item LIKE '%Harbour%';` | The Drowned Harbour (E. Vasquez), East Hall, Crane Holdings, $1,200,000. Also Harbour Study No. 3, West Hall, Galerie Lumière, $85,000 (the wrong one). |
| 3 | Cameras on our exits? (dex) | inlist, andor | `SELECT spot, working FROM cameras WHERE building_id = 2 AND spot IN ('Front doors', 'Service corridor', 'Loading dock', 'Kitchen door') ORDER BY spot;` (orderMatters true) | Front doors 1, Loading dock 1, Service corridor **0**. Kitchen door returns no row: **there is no camera on it.** |
| 4 | Who's on break during the speech, 21:00–21:30? (otis) | between, andor | `SELECT name, role, post, break_at FROM staff WHERE building_id = 2 AND break_at BETWEEN '21:00' AND '21:30' ORDER BY break_at;` (orderMatters true) | Henri Pell, Guard, **East Hall, 21:10**; June Okoro, Bartender, Atrium, 21:30. |
| 5 | Ruby needs a face nobody knows: new caterers or bartenders (lena) | andor | `SELECT name, role, hired FROM staff WHERE building_id = 2 AND (role = 'Caterer' OR role = 'Bartender') AND hired >= '2025-10-01';` | Mara Duval, Caterer, hired 2025-10-06 (agency temp; Ruby becomes "Mara"). |

**Play** "How does The Drowned Harbour leave the gala?"
- a `front`: under Ruby's coat, out the front doors at 21:10. ✗ Front doors camera is live (P3).
- b `cart` ✔: catering cart, East Hall → service corridor → kitchen door, **21:10**. Pell is on break (P4), the corridor camera is dead (P3), the kitchen door has no camera and no badge reader (P1, P3), Ruby is the new caterer (P5), the right painting is in the East Hall (P2).
- c `early`: same cart route at 20:40. ✗ Pell is still at his East Hall post until his 21:10 break (P4).
- d `dock`: freight route out the loading dock at 21:10. ✗ Loading dock camera is live (P3).

**Blueprint** GALERIE LUMIÈRE · GROUND & FIRST FLOOR (draw as one plan). Rooms (zone names): Atrium, East Hall, West Hall,
Service corridor, Kitchen, Loading dock, Front doors (lobby). Street "Rue Lumière" outdoor at the bottom, service lane outdoor at one side.
Layers: shell · `badge` (doors with readers, P1) · `art` (the painting as a `safes` entry, kind 'safe', label "The Drowned Harbour", plus the study in the West Hall, P2) · `cameras` (P3) · `staff` (Pell's loop in the East Hall, P4) · `entries` (kitchen door, front doors, loading dock, P5).
Pressure plate: East Hall zone alarm is "pressure plate" (Kim's counterweight, flavour only). No camera in the East Hall.

**Mole clue**: none yet (Crane doesn't know who's on the crew yet).
**After**: Crane in the gallery, looking at the forgery (silhouette-reveal crane) → `phone` Dex in the garage, a call he takes
outside: "Wrong number." (this is Crane Holdings' switchboard, 10-14 21:05; do not name it). Keep it tiny and ambiguous.
**Debrief** headline idea: "GALA GUESTS PRAISE 'FLAWLESS' VASQUEZ; EXPERT CALLS IT 'SUSPICIOUSLY WET'".

---

### Job 3 · `casino` · House Edge
**Target** Orpheum Casino (building 3), Neon Row · **Goal** empty the count room between the last cash drop and the count team.
The runner Nell Crowe's badge opens it (Ruby lifts it). The service lift runs from the cage level to the count room.

| # | Question | Concepts | SQL | True answer |
|---|---|---|---|---|
| 1 | Who walks into the count room, and when? (viv) | join, where, orderby | `SELECT s.name, s.role, a.at FROM access_log a JOIN staff s ON s.id = a.staff_id WHERE a.door = 'Count room' AND a.at BETWEEN '2025-10-17 00:00' AND '2025-10-17 06:00' AND a.direction = 'in' ORDER BY a.at, s.name;` (orderMatters true) | Last night: runner Nell Crowe at 01:00, 02:30, 03:30; count team **Pia Reyes and Walter Tolliver at 04:00**. |
| 2 | Which drop is the fat one? (dex) | groupby, aggregate | `SELECT memo AS run, COUNT(*) AS nights, AVG(amount) AS avg_take FROM ledger WHERE building_id = 3 AND kind = 'drop' GROUP BY memo ORDER BY avg_take DESC;` (orderMatters true) | 03:30 drop averages **$96,400**; 02:30 $58,600; 01:00 $41,200 (5 nights each). After 03:30 the room holds about $196,200. |
| 3 | How many eyes per zone, and how many work? (juno) | join, groupby, aggregate | `SELECT z.name AS zone, COUNT(*) AS cameras, SUM(c.working) AS live FROM cameras c JOIN zones z ON z.id = c.zone_id WHERE z.building_id = 3 GROUP BY z.name ORDER BY z.name;` (orderMatters true) | Cage 1/1, Cage corridor 3/3, Casino floor 4/4, **Service lift 1/0**, Staff entrance 1/1, VIP room 2/2. |
| 4 | Whose badge opens that door most? (lena) | join, groupby, aggregate | `SELECT s.name, s.role, COUNT(*) AS swipes FROM access_log a JOIN staff s ON s.id = a.staff_id WHERE a.door = 'Count room' AND a.direction = 'in' GROUP BY s.name, s.role ORDER BY swipes DESC, s.name;` (orderMatters true) | **Nell Crowe, 9 swipes** (3 a night); Reyes 3, Tolliver 3. Ruby lifts Crowe's badge. |
| 5 | Who owes the house? Whales keep the pit boss busy. (lena or viv) | groupby, aggregate | `SELECT party, SUM(amount) AS owed FROM ledger WHERE kind = 'marker' GROUP BY party ORDER BY owed DESC;` (orderMatters true) | Judge Amos Harlan $52,000; **Dex Moran $38,000**; Vic Lomond $21,000; Ray Harris $9,500; Celeste Morrow $7,500. |

P5 plan use: Harlan is Ruby's mark (distraction in the VIP room). **Mole clue**: Dex is on the list. React: Dex, quickly: "Old news. Paid it off. Next question." Sam or Kim gives him a look.

**Play** "When and how do we hit the count room?"
- a `corridor`: cage corridor at 03:40. ✗ Three live cameras in the corridor (P3).
- b `lift` ✔: service lift at **03:40** with Crowe's badge. The last drop is in (P1, P2), the count team isn't due until 04:00 (P1), the lift camera is dead (P3), Crowe's badge opens the door (P4).
- c `lift-early`: service lift at 02:45. ✗ The 03:30 drop, the biggest (avg $96,400), isn't in yet (P2).
- d `lift-late`: service lift at 04:15. ✗ Reyes and Tolliver are inside counting from 04:00 (P1).

**Blueprint** ORPHEUM CASINO · LOWER LEVEL. Rooms: Casino floor (drawn at the top as the "above" band or as a stair-connected room), Cage,
Cage corridor, Count room, Service lift, Staff entrance, Security office, VIP room. Street "Neon Row" outdoor.
Layers: shell · `count` (count room + safe-kind 'vault', P1) · `cash` (notes on drop times, P2) · `cameras` (P3) · `badge` (P4) · `vip` (VIP room + Harlan note, P5).
Put cameras exactly where the data says: 3 in the corridor, 1 (dead) in the lift, 1 at the cage window, 2 in VIP, 4 on the floor, 1 staff entrance.
Optional guard loop: Bram Kessler in the cage corridor (break 03:00). Extra guard **Cleo Marsh** (hired 2025-10-17) also on the corridor: draw two loops there if you like.

**After** (mole seed): Sam: "Cage corridor had two guards tonight. New girl, hired this morning." Vera: "Somebody knew." Ruby: "Sam knows every guard in town." Sam, hurt: "I'd never." Dex changes the subject (car talk).
**Debrief** headline idea: "ORPHEUM COUNT ROOM 'LIGHTER' THAN USUAL, MANAGEMENT SAYS".

---

### Job 4 · `rail` · Night Freight
**Target** Vesper Rail Yard (building 4), Ironside (map edge) · **Goal** take the Friday bearer-bond run (armoured rail car RC-12)
where it stops at Signal box 9 on the Harbour line. Sam knows the signalman (Ezra Quill, 67).

| # | Question | Concepts | SQL | True answer |
|---|---|---|---|---|
| 1 | What moves next, on what, with whom? (viv) | multijoin, join | `SELECT t.departs, v.plate, v.kind, t.cargo, t.route, s.name AS escort FROM transfers t JOIN vehicles v ON v.plate = t.plate JOIN staff s ON s.id = t.escort_id WHERE t.departs >= '2025-10-23' ORDER BY t.departs;` (orderMatters true) | **2025-10-24 02:10, RC-12, rail car, Bearer bonds, Platform 2 > Signal box 9 > Harbour line, escort Hank Doyle**; then 10:00 AV-7 armoured truck, Cash, Harbour road, Mick Tully. |
| 2 | Which vehicle carries the real money? (dex) | having, join, groupby | `SELECT v.plate, v.kind, COUNT(*) AS runs, AVG(t.value) AS avg_value FROM transfers t JOIN vehicles v ON v.plate = t.plate GROUP BY v.plate, v.kind HAVING AVG(t.value) > 1000000;` | Only **RC-12**: 4 runs, average **$2,475,000**. (The AV-7 truck averages far less.) |
| 3 | How many bodies at each post, by shift? (otis) | groupby (multi-column), aggregate | `SELECT post, shift, COUNT(*) AS staff FROM staff WHERE building_id = 4 GROUP BY post, shift ORDER BY post, shift;` (orderMatters true) | Nights: **Loading platform 4**, Main gate 3, RC-12 1 (escort), **Signal box 9 1** (the signalman), Switch tower 1. Days: AV-7 1, Loading platform 1, Main gate 1. |
| 4 | Which zones have no live camera? (juno) | multijoin, having | `SELECT z.name AS zone, COUNT(*) AS cameras, SUM(c.working) AS live FROM cameras c JOIN zones z ON z.id = c.zone_id JOIN buildings b ON b.id = z.building_id WHERE b.name = 'Vesper Rail Yard' GROUP BY z.name HAVING SUM(c.working) = 0 ORDER BY z.name;` (orderMatters true) | **East siding** (1 cam, 0 live) and **Signal box 9** (1 cam, 0 live). |
| 5 | Which cars came through the gate only once? Strangers. (viv) | having, join | `SELECT v.plate, v.owner, MIN(a.at) AS seen FROM access_log a JOIN vehicles v ON v.plate = a.credential WHERE a.building_id = 4 GROUP BY v.plate, v.owner HAVING COUNT(*) = 1 ORDER BY seen;` (orderMatters true) | **VX-4471, Dex Moran, 2025-10-21 23:40**; **KT-2210, Silas Voight (Crane's security chief), 2025-10-23 10:15**. |

P5 plan use: Voight walked the yard the morning after the crew meeting, so Crane is watching the platform. **Mole clue**: Dex's own car.
React: Dex: "Recon. It's literally my job. You're welcome." Vera: "Next time, tell me first."

**Play** "Where do we take the bonds?"
- a `truck`: hold up AV-7 on the harbour road. ✗ AV-7 averages under $1M; the bonds ride RC-12 (P1, P2).
- b `platform`: take RC-12 at the loading platform before it leaves. ✗ Four guards on the platform at night (P3), its cameras are live (P4), and Voight has just walked it (P5).
- c `signal` ✔: stop RC-12 at **Signal box 9 at 02:20**: one old signalman (P3), no live camera (P4), on the bonds' route (P1).
- d `siding`: ambush at the East siding. ✗ It's dark (P4) but RC-12 never passes it; the route is Platform 2 > Signal box 9 > Harbour line (P1).

**Blueprint** VESPER RAIL YARD · SITE PLAN. Mostly outdoor: tracks as `walls` in a `tracks` layer or as outdoor rooms; buildings:
Gate booth (Main gate), Platform office + Loading platform (Platform 1, Platform 2), Switch tower, Signal box 9 (small hut by the Harbour line),
East siding (a spur that branches away). Label "HARBOUR LINE →", "IRONSIDE ROAD".
Layers: shell · `routes` (the RC-12 route drawn as a note/label chain, P1) · `cargo` (RC-12 as a safes-kind 'vault' marker, P2) · `staff` (guard loops at gate and platform, P3) · `cameras` (P4) · `gate` (gate + notes on the plates, P5).

**After**: Cole finds Vera at an all-night diner (two-shot calloway/viv). Cole: "One of yours calls my desk, Vera. Late. Always after midnight." Vera: "Wrong number." Seeds the Ruby red herring.
**Debrief** headline idea: "BOND TRAIN HALTED BY 'FAULTY SIGNAL'; RAIL CO. BLAMES AGE".

---

### Job 5 · `bank` · Box 1127
**Target** First Meridian Bank (building 5), Financial District · **Goal** Box 1127 (Crane's second ledger) **and** Box 1131 (Vera's original vault drawings,
stolen by Crane). At the meeting the crew said "night depository, 03:00"; that plan is burned by the burner call.

| # | Question | Concepts | SQL | True answer |
|---|---|---|---|---|
| 1 | Box 1127's owner: what else do they keep here? (viv) | subquery | `SELECT location, item, stored_at FROM valuables WHERE owner = (SELECT owner FROM valuables WHERE location = 'Box 1127') ORDER BY location;` (orderMatters true) | Owner **CH Group**: Box 1127 "Ledger, second set" (stored 2025-10-25 11:20) and **Box 1131 "Stone vault drawings (originals)"** (2025-03-02). Two boxes to drill. |
| 2 | Which zones have no camera at all? (juno) | leftjoin, nulls | `SELECT z.name, z.alarm FROM zones z LEFT JOIN cameras c ON c.zone_id = z.id WHERE z.building_id = 5 AND c.id IS NULL ORDER BY z.name;` (orderMatters true) | **Night depository, Records corridor, Records room**, all with no alarm (NULL). The records room shares a wall with the box vault. |
| 3 | Who's the newest guard? (otis) | subquery | `SELECT name, post, break_at, hired FROM staff WHERE building_id = 5 AND hired = (SELECT MAX(hired) FROM staff WHERE building_id = 5);` | **Toby Bell**, Box vault, break **02:40**, hired 2025-10-27. Sam: rookies take their full thirty. |
| 4 | Who's on the night roster but never shows? (otis or lena) | leftjoin, nulls | `SELECT s.name, s.post FROM staff s LEFT JOIN access_log a ON a.staff_id = s.id WHERE s.building_id = 5 AND s.shift = 'night' AND a.id IS NULL;` | **Walt Pruitt, Records corridor**: never swiped in. A ghost on the payroll; the corridor is empty. |
| 5 | Did anyone unlisted call Crane before tonight? (viv) | leftjoin, nulls | `SELECT c.caller, c.at, c.cell FROM calls c LEFT JOIN phones p ON p.number = c.caller WHERE c.callee = '555-0001' AND p.number IS NULL AND c.at < '2025-10-31' ORDER BY c.at;` (orderMatters true) | **555-0199** (not in the directory) three times: 2025-10-16 23:47, 2025-10-23 00:05, 2025-10-30 23:52 (tonight), all from **DOCK-2**. Each a crew-meeting night. |

555-0001 is Crane's private line (you can reveal it in the ask: "Moretti's ledger had Crane's private number: 555-0001").
**Mole clue**: the burner. Vera (react): "Somebody's talking. The depository's burned."

**Play** "How do we reach boxes 1127 and 1131?"
- a `depository`: night depository at 03:00 (the table's plan). ✗ The burner called Crane at 23:52 tonight, after the meeting; the depository will be waiting (P5). Tempting because it has no camera (P2).
- b `records` ✔: through the records corridor and the records-room wall at **02:40**. No cameras (P2), Pruitt never shows (P4), Bell is on break (P3), long enough for two boxes (P1).
- c `records-early`: same route at 01:30. ✗ Bell is at his box-vault post until 02:40 (P3).
- d `hall`: main hall to the vault door. ✗ The main hall has three live cameras and is not on the no-camera list (P2); the vault is on a seismic alarm until 07:30.

**Blueprint** FIRST MERIDIAN BANK · LOWER LEVEL + BANKING HALL. Rooms: Main hall, Teller line, Night depository (street-side chute), Box vault (rows of boxes; mark 1127 and 1131),
Records room (sharing a wall with the Box vault), Records corridor, stair. Street "Meridian Avenue" outdoor.
Layers: shell · `boxes` (two safes-kind 'safe', P1) · `cameras` (P2) · `staff` (Bell's loop at the box vault, Dole/Kast in the main hall, P3) · `ghost` (Pruitt's post with a "never shows" note, P4) · `leak` (a grease note on the depository: "BURNED", P5).

**After**: Vera alone with Box 1131, unrolling her own drawings. Then `phone` crane: "Your crew leaks, Vera. Like a sieve." Vera: "So does your bank."
**Debrief** headline idea: "BANK VAULT BREACHED THROUGH RECORDS ROOM WALL; ONLY TWO BOXES OPENED".

---

### Job 6 · `auction` · Lot 47
**Target** Halloway & Sons (building 6), Old Quarter · **Goal** the 1924 walnut writing desk, Lot 47; its secret drawer holds the key to Crane's penthouse safe.
Crane is bidding anonymously and will do anything to get it back. Swap it for a replica in the stockroom before the porter carries it up.

| # | Question | Concepts | SQL | True answer |
|---|---|---|---|---|
| 1 | Where does each lot wait before the sale? (juno) | casewhen | `SELECT lot_no, title, estimate, CASE WHEN estimate >= 250000 THEN 'Strongroom' WHEN estimate >= 50000 THEN 'Cage' ELSE 'Stockroom' END AS storage FROM lots ORDER BY lot_no;` (orderMatters true) | 11 lots. **Lot 47, Walnut writing desk (1924), $38,000 → Stockroom.** Strongroom: lots 23, 52 (The Crane Emerald, $1.4M). |
| 2 | Who's bidding on Lot 47? (lena) | nulls, subquery | `SELECT COALESCE(paddle, 'NO PADDLE') AS paddle, COALESCE(bidder, 'undisclosed') AS bidder, method, amount FROM bids WHERE lot_id = (SELECT id FROM lots WHERE lot_no = 47) ORDER BY amount DESC;` (orderMatters true) | NO PADDLE / undisclosed / commission / **$400,000** (ten times the estimate); P-208 Vic Lomond phone $45,000; P-114 Mrs. E. Carrow commission $42,000. |
| 3 | Whose number is on that undisclosed bid? (viv) | strings, join | `SELECT b.amount, b.callback, p.number, p.owner FROM bids b JOIN phones p ON REPLACE(p.number, '-', '') = b.callback WHERE b.lot_id = (SELECT id FROM lots WHERE lot_no = 47);` | 400000, callback 5550001 = 555-0001 = **Leo Crane**. |
| 4 | When does Lot 47 go under the hammer, and when does the porter fetch it? (dex) | dates, between | `SELECT lot_no, title, strftime('%H:%M', sale_at) AS hammer, strftime('%H:%M', sale_at, '-10 minutes') AS pickup FROM lots WHERE lot_no BETWEEN 46 AND 48 ORDER BY lot_no;` (orderMatters true) | Lot 46 20:31/20:21; **Lot 47 hammer 20:34, pickup 20:24**; Lot 48 20:38/20:28. (Porters fetch lots 10 minutes before.) |
| 5 | Whose gambling debts did someone else pay? (otis) | casewhen, nulls, groupby | `SELECT party, SUM(amount) AS total, CASE WHEN settled_by IS NULL THEN 'open' WHEN settled_by = party THEN 'self' ELSE settled_by END AS paid_by FROM ledger WHERE kind = 'marker' GROUP BY party, paid_by ORDER BY party;` (orderMatters true) | Celeste Morrow $7,500 self; **Dex Moran $38,000 CH Group**; Judge Amos Harlan $52,000 open; **Ray Harris $9,500 CH Group**; Vic Lomond $21,000 open. |

P5 plan use: Ray Harris is the head porter, and Crane's shell paid his debts, so he's Crane's man. **Mole clue**: Dex's markers were paid by the
same shell that owns Box 1127 (job 5). React: Dex: "I paid those. Cash. Ask anyone." Vera: silent panel (face viv calm).

**Play** "How do we get Lot 47?"
- a `strongroom`: crack the strongroom at 20:00. ✗ Lot 47 isn't there; estimates under $50,000 wait in the stockroom (P1).
- b `bid`: Ruby simply buys it. ✗ An undisclosed $400,000 commission bid (P2), and it's Crane's own number (P3).
- c `porter`: pay the head porter, Ray Harris, to carry our replica up. ✗ CH Group paid Harris's debts: he's Crane's (P5).
- d `swap` ✔: swap in the **stockroom at 20:15**, before the porter's 20:24 pickup (P1, P4).

**Blueprint** HALLOWAY & SONS · SALEROOM LEVEL + BASEMENT. Rooms: Saleroom (with rostrum), Phone bank, Viewing gallery, Stockroom, Strongroom, Loading bay, back stair.
Street "Chancery Lane" outdoor. Layers: shell · `storage` (lot markers: strongroom/cage/stockroom, P1) · `bids` (grease notes: "$400k!!", P2) · `crane` (phone bank highlighted, P3) · `timing` (porter route stockroom→rostrum as a guard loop, P4) · `staff` (Harris, P5).
Cameras (not queried; place per data): Saleroom 2, Strongroom 2, Loading bay 1, Viewing gallery 1; **no camera in the stockroom**.

**After**: car-interior dex with viv. Dex: "I paid those markers, Vera. With my own money." Vera: "I know you did." (She doesn't.) Then a `phone` lena panel in shadow: "Detective. It's me." (Red herring; seen by the player only.)
**Debrief** headline idea: "LOT 47 SELLS FOR $400,000; BUYER DISCOVERS DRAWER EMPTY".

---

### Job 7 · `penthouse` · Top Floor
**Target** Crane's penthouse at the Marlowe Hotel (building 7, floor 22), Harbour Heights · **Goal** the penthouse safe, which holds the **current Tower vault codes**
(Lot 47's key opens it). Vera tells the table "Saturday"; the real job is **Friday 11-14 at 23:55**, known only to her and the Architect.
Ruby is already checked in as "Mme Odette Vire" in room 2104 (sandbox detail in `guests`).

| # | Question | Concepts | SQL | True answer |
|---|---|---|---|---|
| 1 | When does Crane come home each night? (viv) | rownum, window, dates, subquery | `SELECT night, at AS home FROM (SELECT date(at, '-12 hours') AS night, at, ROW_NUMBER() OVER (PARTITION BY date(at, '-12 hours') ORDER BY at DESC) AS rn FROM access_log WHERE door = 'Penthouse' AND credential = 'AC-0001' AND direction = 'in') WHERE rn = 1 ORDER BY night;` (orderMatters true) | Last entry per night: 11-10 → 01:05; 11-11 → 01:12; 11-12 → **00:58** (earliest); 11-13 → 01:10. So we must be out before 00:58. |
| 2 | How many people are in the penthouse, minute by minute? (juno) | window, casewhen | `SELECT at, credential, direction, SUM(CASE WHEN direction = 'in' THEN 1 ELSE -1 END) OVER (ORDER BY at) AS inside FROM access_log WHERE door = 'Penthouse' AND at BETWEEN '2025-11-13 18:00' AND '2025-11-14 02:00' ORDER BY at;` (orderMatters true) | Running headcount last night: **empty from 22:05** (Rusk leaves) **to 01:10**, except housekeeping MV-48 **23:30–23:45** (turndown). |
| 3 | How long between the floor guard's stair checks? (otis) | window, dates | `SELECT at, CAST(ROUND((julianday(at) - julianday(LAG(at) OVER (ORDER BY at))) * 1440) AS INTEGER) AS gap_min FROM access_log WHERE door = 'Service stair 22' ORDER BY at;` (orderMatters true) | Bruno Salt checks every **20 min** (22:10 … 23:50), then a **60-minute gap 23:50 → 00:50** (his break), then 20 again. |
| 4 | Rank the ways up by live cameras (dex) | window, leftjoin, groupby | `SELECT z.name AS zone, COUNT(c.id) AS live_cams, RANK() OVER (ORDER BY COUNT(c.id)) AS rnk FROM zones z LEFT JOIN cameras c ON c.zone_id = z.id AND c.working = 1 WHERE z.building_id = 7 GROUP BY z.name ORDER BY rnk, zone;` (orderMatters true) | Penthouse 0 (rank 1), **Service stair 0 (rank 1)**, Floor 21 corridor 1 (3), Guest lifts 2 (4), **Private lift 2** (4), Lobby 3 (6). (Note the RANK tie and gap.) |
| 5 | Line up the burner's calls, each with the one before (juno) | window | `SELECT at, cell, LAG(at) OVER (ORDER BY at) AS previous FROM calls WHERE caller = '555-0199' AND at < '2025-11-14' ORDER BY at;` (orderMatters true) | 5 calls, 10-16 23:47 → 11-13 23:38, **every one from DOCK-2**, about a week apart, each the night before a job. |

**Mole clue**: DOCK-2 is our block. Kim: "That's our block. That's our garage." Vera: "Then it's one of us." (Big turn, `react` from viv.)

**Play** "When do we go up, and how?"
- a `lift`: private lift at 23:30. ✗ Housekeeping is inside 23:30–23:45 (P2), and the private lift has two live cameras (P4).
- b `stair` ✔: service stair at **23:55**. Salt's hour-long break started at 23:50 (P3), the penthouse is empty (P2), there are no cameras on the stair (P4), and we're out before Crane's earliest return at 00:58 (P1).
- c `late`: service stair at 01:20. ✗ Crane is home by then; his earliest return is 00:58 (P1).
- d `early`: service stair at 22:40. ✗ Salt checks the stair door every 20 minutes until 23:50 (P3).

**Blueprint** THE MARLOWE · FLOOR 22 (PENTHOUSE). Rooms: Penthouse (study with safe, bedroom, salon), Private lift, Service stair, Floor 22 corridor, Guest lifts, suite 2201 (Harlan).
Roof terrace outdoor. Layers: shell · `crane` (note on return times, P1) · `occupancy` (P2) · `staff` (Salt's corridor loop, P3) · `cameras` (P4) · `leak` (grease note "DOCK-2 = US", P5).

**After**: Vera and the Architect only (face viv calm + hands-typing). Vera: "Next table, I'll say the garage ramp at two. You and I know it's the shaft." Then Crane, holding the empty safe's door open: silhouette-reveal crane: "Let them come."
**Debrief** headline idea: "MARLOWE PENTHOUSE BURGLED; HOTEL DENIES MR. CRANE WAS 'EVER THERE'".

---

### Job 8 · `tower` · Inside Job
**Target** Crane Tower (building 8), Crown Hill · **Goal** the B3 vault (cash reserve $14M, 40 gold bars, and "File: the Stone case"), and unmasking the mole.
Vera's fake plan: "garage ramp, 02:00". The real plan: down Vera's original **maintenance shaft** (from her drawings in Box 1131) into B3.

| # | Question | Concepts | SQL | True answer |
|---|---|---|---|---|
| 1 | Summarise the burner, all of it (viv) | cte, aggregate | `WITH burner AS (SELECT at, cell FROM calls WHERE caller = '555-0199') SELECT COUNT(*) AS calls, MIN(at) AS first, MAX(at) AS last, COUNT(DISTINCT cell) AS cells FROM burner;` | **6 calls**, first 2025-10-16 23:47, **last 2025-11-21 23:41 (tonight)**, **1 cell** (DOCK-2). The mole called tonight. |
| 2 | What did Crane do after tonight's call? In and out, one timeline (juno) | union | `SELECT at, 'in' AS dir, caller AS other FROM calls WHERE callee = '555-0001' AND at LIKE '2025-11-21%' UNION SELECT at, 'out', callee FROM calls WHERE caller = '555-0001' AND at LIKE '2025-11-21%' ORDER BY at;` (orderMatters true) | 17:20 in 555-0010 (his switchboard); **23:41 in 555-0199**; **23:49 out 555-0800 (Tower security)**; 23:52 out 555-0700 (Marlowe). He took the bait. |
| 3 | Whose phone was in the burner's cell within 15 minutes of every call? (viv to you) | cte, join, groupby, dates | `WITH burner AS (SELECT at, cell FROM calls WHERE caller = '555-0199'), crew AS (SELECT p.owner, c.at, c.cell FROM calls c JOIN phones p ON p.number = c.caller WHERE p.owner IN ('Vera Stone', 'Dex Moran', 'Kim Park', 'Sam Brandt', 'Ruby Lane')) SELECT crew.owner, COUNT(DISTINCT burner.at) AS matches FROM burner JOIN crew ON crew.cell = burner.cell AND ABS(julianday(crew.at) - julianday(burner.at)) * 1440 <= 15 GROUP BY crew.owner ORDER BY matches DESC;` (orderMatters true) | **Dex Moran 6 of 6**, Kim Park 5 (she was in OLDQ-3 on 10-30), Sam Brandt 1. Vera and Ruby 0 (Ruby's late calls all came from NARROWS-1). |
| 4 | Corroborate: which crew member was paid off by CH Group **and** drove into Crane Tower? (otis, heavy) | exists | `SELECT p.owner FROM phones p WHERE p.owner IN ('Vera Stone', 'Dex Moran', 'Kim Park', 'Sam Brandt', 'Ruby Lane') AND EXISTS (SELECT 1 FROM ledger l WHERE l.party = p.owner AND l.settled_by = 'CH Group') AND EXISTS (SELECT 1 FROM vehicles v JOIN access_log a ON a.credential = v.plate WHERE v.owner = p.owner AND a.building_id = 8);` | **Dex Moran.** (His Charger, VX-4471, entered the Crane Tower garage on 10-15 22:10 and 11-07 00:30.) |
| 5 | Where are Crane's guards tonight vs last night? (otis) | cte, leftjoin, nulls | `WITH last_night AS (SELECT door, COUNT(*) AS n FROM access_log WHERE building_id = 8 AND staff_id IS NOT NULL AND at LIKE '2025-11-21 00:%' GROUP BY door), tonight AS (SELECT door, COUNT(*) AS n FROM access_log WHERE building_id = 8 AND staff_id IS NOT NULL AND at LIKE '2025-11-22 00:%' GROUP BY door) SELECT l.door, l.n AS last_night, COALESCE(t.n, 0) AS tonight FROM last_night l LEFT JOIN tonight t ON t.door = l.door ORDER BY l.door;` (orderMatters true) | Midnight roll call: **B3 vault level 2 → 0**, Floor 40 2 → 0, **Garage ramp 2 → 8**, Loading bay 1 → 0, Lobby 3 → 2. |

Dramatic order suggestion: P1 (it was tonight), P2 (Crane bit), P3 (Dex; the crew goes silent), P4 (confirmation; Dex's reaction), P5 (the double-cross worked).
Dex's reactions should turn from jokes to silence: P3 react could be **dex**: "…It's not what it looks like." P4 react **viv**: "It's exactly what it looks like."

**Play** "Last job. How do we take the Tower?"
- a `garage`: the garage ramp at 02:00, Dex driving (the plan the table heard). ✗ Crane heard it at 23:41 (P1, P2); eight guards are on the ramp (P5).
- b `shaft` ✔: **Vera's maintenance shaft into B3 at 02:00, Sam drives; Dex stays at the table with the garage story.** B3 is empty tonight (P5); Dex is the leak (P3, P4), so he must not know.
- c `shaft-dex`: the same shaft, Dex driving. ✗ Dex is the mole (P3, P4); the burner is live tonight (P1). He'd call it in.
- d `lobby`: Ruby's lawyer act through the lobby. ✗ The lobby is the one post Crane didn't strip: two guards still hold it (P5), and after 23:41 he knows we're coming tonight (P1, P2). (Flavour: four live lobby cameras, cameras 50–53.)

**Blueprint** CRANE TOWER · LEVEL B3 + GARAGE (section-style plan). Rooms: Garage ramp (big), Garage, B3 vault level corridor, B3 vault (vault-kind), Maintenance shaft (narrow, from street level), Loading bay, lobby (small inset).
Street "Crown Hill Avenue" outdoor. Layers: shell · `leak` (grease: burner summary, P1) · `crane` (P2 timeline note) · `mole` (a circled "DEX" note, P3/P4) · `guards` (8 loops crowding the ramp, empty B3, P5) · `shaft` (the maintenance shaft entry, revealed with P5 or P4).
Cameras per data: lobby 4, garage ramp 3, B3 2 (Vault door, B3 lift lobby; the shaft lands out of their cones), loading bay 1, Floor 40 2 (not on this plan).

**Replay (success)** should show: the crew in the shaft; the empty B3; the vault; Crane in the garage with eight guards and nobody coming; Cole's lights at the ramp mouth.
**After**: none (the EPILOGUE follows).
**Debrief** headline idea: "CRANE ARRESTED IN OWN GARAGE; 'SABLE FILE' REOPENED".

### Epilogue (`src/data/jobs/epilogue.js`, written)
6 pages. (1) Crane waits at the foot of his ramp. Police lights. Cole has the Stone file and page 14. (2) Ruby's desk
calls, her deal: the warrant is burned; she wouldn't give up the Architect. (3) Vera's sting: she read Ruby's calls in week one
and used her as bait ("I used everyone. That was the part I hated."). (4) Dockside dawn: Dex apologises; Vera leaves Mia the
deed to the garage. (5) Newspaper "SABLE CLEARED; MYSTERY DONOR REPAYS CRANE'S VICTIMS", then the payoffs for Sam, Kim and Ruby.
(6) Vera: "Every building keeps a record, Architect. Now it keeps the right one." Cole's card. "The End?"

---

## 5. Data cheat-sheet (for flavour and sandbox; don't contradict it)

- Crane's private line **555-0001**; Crane Holdings switchboard 555-0010; Tower security (Voight) 555-0800; VPD Robbery / Cole 555-0417.
- Crew phones: Vera 555-0101, Dex 555-0102, Kim 555-0103, Sam 555-0104, Ruby 555-0105. Burner **555-0199** (unlisted).
- Plates: Dex **VX-4471** black 1970 Dodge Charger; Sam OB-1956 cream Ford panel van; Crane AC-0001 Rolls-Royce Phantom; Voight KT-2210 black Lincoln.
- Badge credentials: Crane `AC-0001`; Rusk (bodyguard) `GR-50`; housekeeping Vega `MV-48`; Marlowe floor guard Salt `BS-47`.
- CH Group = Crane's shell (ledger: "retainer from Crane Holdings", settled_by 'Crane Holdings').
- Cameras: see `cameras` table; blueprint camera counts per zone must match the data where a puzzle queries them.
