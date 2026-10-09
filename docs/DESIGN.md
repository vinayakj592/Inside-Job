# INSIDE JOB — Game Design & Build Contract

> *Every building keeps a record. Read it. Rob it.*

A story-driven heist game where SQL is your lockpick. You play **the Architect**, the crew's
data specialist. You never appear on screen; the crew only knows you by your queries.

This document is the single source of truth for every contributor. If you need to deviate,
note it at the bottom under **Change log**.

---

## 1. Pillars

1. **You are planning a heist, not doing homework.** Every query answers a question the crew
   actually needs answered (*"When does the east guard change shift?"*). The answer is diegetic:
   it draws something on the blueprint, a crew member reacts, the plan gets sharper.
2. **Two worlds, one signature moment.**
   - **Planning** = glowing cyan blueprint on a dark table: precise, calm, technical.
   - **Replay** = cel-shaded noir city: inky blacks, deep teal, warm gold, rain, hard silhouettes,
     comic-panel framing (Into the Spider-Verse framing × Persona 5 graphic confidence, copying neither).
   - Correct play → **the blueprint ignites and floods into ink → the heist plays out as comic panels.**
     That transition is the game's trademark and must feel like a payoff every time.
3. **Graphic confidence over realism.** Flat shapes, bold outlines, halftone, hard offset shadows,
   slanted layouts, huge type. Nothing should look like a SaaS dashboard: no rounded cards,
   no soft drop shadows, no pastel pills, no generic sans-serif UI.

---

## 2. Story

**Port Vesper**, a rain-soaked harbour city that never quite gets to morning. Everything in it,
from pawnshops to casinos to bank vaults, runs on the same municipal records network, and
everything in that network can be queried if you know how.

**The hook.** Six months ago **Vivian "Viv" Sable**, a security consultant, designed the vault
for **Aurelio Crane**, the man who owns half the city. Crane used her designs to rob his own
clients, pinned it on her, and she did eighteen months for it. She's out, and she's putting
a crew together to take everything Crane has. She needs someone who can read a building
through its records. She needs you.

**The crew** (portrait accent colours in brackets):

| id | Name | Role | Voice |
|---|---|---|---|
| `viv` | Vivian "Viv" Sable | Mastermind | Cool, precise, dry. Calls you "Architect". (gold) |
| `dex` | Dex Moreau | Wheelman | Cocky, fast talker, car metaphors. (teal) |
| `juno` | Juno Park | Safecracker / tech | Deadpan, nerdy, loves locks more than people. (cyan) |
| `otis` | Otis "Big O" Brandt | Muscle / inside man | Gentle giant, ex-guard, knows every union guard in town. (cream) |
| `lena` | Lena Faye | Grifter / the face | Charming, theatrical, always in costume. (gold-alt) |

**Antagonists:** `crane` Aurelio Crane (owns Crane Holdings); `calloway` Detective Ines Calloway,
who is closing in (she personifies the Heat meter).

**The twist:** someone in the crew is feeding Crane. The data has been hinting at it since job 3.
In the finale the Architect proves who with a query, and the last job becomes a double-cross
of the double-cross. (Content owner picks the mole and seeds clues; see §7.)

### The eight jobs (chapters)

Each job = briefing → 5 queries at the planning table → **Call the Play** → blueprint-to-noir transition → replay → debrief.
Concepts follow the SQL curriculum in order.

| # | id | Job | Target | SQL focus |
|---|---|---|---|---|
| 1 | `pawn` | Cold Open | Moretti's Pawn & Loan: grab the ledger that ties Crane to the frame job | SELECT · WHERE · ORDER BY · LIMIT · COUNT |
| 2 | `gallery` | The Gilded Frame | Galerie Lumière opening gala | DISTINCT · LIKE · IN · BETWEEN · AND/OR |
| 3 | `casino` | House Edge | The Orpheum Casino count room | JOIN · GROUP BY · COUNT/SUM/AVG |
| 4 | `rail` | Night Freight | Armoured transfer at the Vesper rail yard | HAVING · 3-table JOINs · multi-column GROUP BY |
| 5 | `bank` | Box 1127 | First Meridian Bank deposit vault | Subqueries · LEFT JOIN · IS NULL |
| 6 | `auction` | Lot 47 | Halloway & Sons auction house | CASE WHEN · COALESCE · text & date functions |
| 7 | `penthouse` | Top Floor | Crane's penthouse at the Marlowe Hotel | RANK · ROW_NUMBER · running totals · LAG |
| 8 | `tower` | Inside Job | Crane Tower vault, and unmasking the mole | CTEs · UNION · EXISTS |

---

## 3. Game flow

```
HOME (noir city, rain, title)
 ├─ New game ─► CINEMA: prologue ─► HUB
 ├─ Continue ─► HUB
 ├─ Safehouse terminal (sandbox) ─► PLANNING (mode: sandbox)
 └─ Settings

HUB (city job board: the noir city from above, targets pinned in gold)
 └─ pick job ─► CINEMA: briefing ─► PLANNING (job)

PLANNING (blueprint table + terminal + crew comms)
 ├─ solve query n ─► blueprint reveals layer(s), crew reacts, intel card added
 ├─ all 5 solved ─► CALL THE PLAY (choose 1 of 3–4 options on the blueprint)
 │     ├─ right ─► TRANSITION (blueprint → noir) ─► CINEMA: replay (success) ─► DEBRIEF ─► HUB (+ story beat)
 │     └─ wrong ─► TRANSITION ─► CINEMA: replay (failure, bails out) ─► back to PLANNING, +heat
 └─ back ─► HUB
```

### Economy and progression
- **Take ($)**: every solved query pays the crew's "prep budget"; the play pays the job's big score.
  - Query: `$1,000 × job number`. First try, no hints: +50%.
  - Job take (success): fixed per job in `jobs.js` (`take`), scaled by stars.
- **Heat** (0–100, shown as a police-light meter; Calloway's face when it's high):
  hint +3, full solution +8, wrong play +12. Heat decays by 15 after each successful job.
  Heat above 70 changes the look (more sirens in the hub, Calloway interjects in briefings).
  It never locks the player out.
- **Stars per job (1–3)**: 3 = no solutions revealed and the play right first time; 2 = solutions used
  or one wrong play; 1 = otherwise.
- **Reputation rank** by total take: Pickpocket → Lookout → Wheelman → Grifter → Safecracker →
  Fixer → Mastermind → Legend of Vesper.
- **Help** is diegetic: "Ask Juno" (hint, +3 heat) and "Pull the file" (full solution, +8 heat).
- Jobs unlock in order; Settings has "Unlock all jobs".

---

## 4. Art direction (v2: read this twice)

> **The user's #1 priority is UI and graphics. The v1 direction was rejected as "AI slop":
> generic skewed rectangles with hard offset shadows, Anton + Barlow, Persona-clone menus.
> Do not bring any of that back.** The live reference is **`/styleguide.html`** (`src/styleguide.js`).
> Open it, screenshot it, and build from it.

### The principle: everything is a physical object from the heist world
A UI element is never a generic "card" or "button". Before styling anything, ask
*what object in this world would this be?* and draw that object.

| Need | Noir world (home, hub, cinema, debrief) | Blueprint world (planning table) |
|---|---|---|
| Primary action | `.cut`: hand-cut paper shape (Saul Bass), misregistered second plate behind it | `.bp-btn--grease`: a yellow grease-pencil loop scribbled round a drafted label |
| Secondary action | `.cut--ink` / `.cut--cream` | `.bp-btn`: drafted box with registration ticks overshooting the corners, hatched (poché) on hover |
| Icon button | `.chip`: casino chip, spins on hover | `.bp-mark`: drafting callout bubble |
| Label / badge / counter | `.dymo`: embossed label-maker tape | title-block cells, dimension-line labels, hand lettering |
| Choice / option / dossier | `.tag`: manila evidence tag with an eyelet | pinned index card, or a route drawn on the plan |
| Dialog | `modal--folder`: manila case file with tab and paperclip | `modal--vellum`: tracing paper taped over the drawing |
| Status / verdict | `.stamp`: rubber stamp with ink-bleed mask | grease-pencil scribble / circled note |
| Notification | label tape slapped on (`toast()`) | same, blue tape |
| Checkbox | ink-drawn box with a stamped X (`.check`) | same |

References to steal **principles** from (never copy): **Saul Bass** title sequences (cut paper,
flat fields, rhythm, jagged edges), **Into the Spider-Verse** (halftone, off-register colour plates,
hatching as shading, animation on twos, comic lettering), **Catch Me If You Can / Ocean's Eleven**
openings (graphic heist cool), **Mid-century blueprints and drafting sheets** (title blocks,
dimension lines, section markers, revision clouds, hand lettering), **real heist props** (label tape,
case files, evidence tags, casino chips, key tags, Polaroids, masking tape, grease pencil).

### Palette (tokens in `src/styles/tokens.css`; always use tokens, never raw hex in components)
| Token | Use |
|---|---|
| `--ink` #07090b, `--ink-2..4` | The black of a noir print. Most of every noir screen. |
| `--teal-9 … --teal-1` (petrol) | Night air, fog, shadow tint, the misregistered second plate |
| `--gold` #f2a93b, `--gold-hot`, `--gold-deep` | Sodium streetlight. Windows, lamps, loot, primary actions. The only warm thing. |
| `--cream` #ece2c9 | Newsprint: captions, bubbles, text on ink |
| `--manila` #d6b476 | Case files and evidence tags |
| `--bp-deep` / `--bp-paper` / `--bp-paper-hi` | Light-table blueprint: dark edges, glowing centre |
| `--bp-line` / `--bp-cyan` / `--bp-dim` | Linework core / glow / grid |
| `--grease` #ffd23f | Yellow grease pencil: the crew's marks on the blueprint (routes, notes, the plan) |
| `--alarm` #d8412f | **Failure states only.** |

Rule: **blueprint world = white-cyan linework on glowing blue + yellow grease pencil;
noir world = gold and newsprint on ink and petrol.** They meet only in the transition.

### Type (self-hosted @fontsource; `src/styles/fonts.css`)
| Token | Family | Use |
|---|---|---|
| `--f-stencil` | Big Shoulders Stencil Display 900 | Logo, buttons, stamps, crate-stencil labels |
| `--f-display` | Big Shoulders Display 900 | Titles, job names, big numbers |
| `--f-ui` | Big Shoulders Text 700–800 | HUD labels, tape labels (uppercase, wide tracking) |
| `--f-serif` | Bodoni Moda italic 900 | One accent word per title ("House *rules*", "the *Architect*") |
| `--f-body` | Courier Prime | Dossier / reading text: prompts, intel, descriptions |
| `--f-type` | Special Elite | Weathered typewriter: comic captions, newspaper datelines |
| `--f-draft` | Architects Daughter | ALL blueprint lettering (labels, notes, buttons) |
| `--f-letter` | Comic Neue 700, uppercase | Speech-bubble lettering |
| `--f-sfx` | Bangers | Onomatopoeia (`KSSH`, `CLICK`) |
| `--f-mono` | JetBrains Mono | SQL and result tables |

### Craft rules
- **Never perfectly rectangular** in the noir world: use `--cut-a/b/c` clip-paths or tape/tag shapes.
  Blueprint world is the opposite: precise lines, but hand-lettered.
- **No blurred drop shadows on UI.** Depth comes from misregistered plates, paper layers, light and
  glow (blueprint lines glow; that's light, not shadow). Physical props (folder, sheet) may cast one
  large soft shadow onto the table.
- **No border-radius** except objects that are round in reality (chips, eyelets, callout bubbles, stamps).
- **Texture on everything:** paper grain (`.tex-paper`), halftone (`.tex-halftone`), hatch, film grain
  (global). Flat untextured fills look like a web app.
- **Light tells the story:** noir screens are lit by pools of sodium gold with petrol falloff;
  the blueprint table is lit from underneath (hot centre, dark edges).
- **Motion:** props are *placed* (slap, slide, stamp, snap), not faded. Loops in the noir world
  run on twos (`steps()`), blueprint lines *draw themselves* (stroke-dash). Respect reduced motion.
- **Hierarchy through scale contrast:** enormous display type against small tracked labels.
  Avoid the mid-size everything look of dashboards.
- Screenshot your work (`node scripts/shot.mjs`) and compare it with `/styleguide.html`. If it could
  pass for a SaaS dashboard or a generic "gaming UI kit", it is not done.

### The two worlds
**Blueprint table.** A light table in a dark safehouse: the blueprint glows from below
(`--bp-paper-hi` centre, `--bp-deep` edges, heavy vignette), fine 20px grid plus 100px major grid,
a drafting **title block** in the corner (project, sheet no., scale, "drawn by The Architect"),
dimension lines with arrowheads, north arrow, section markers. Linework in `--bp-line` with a cyan glow,
*drawn in* with stroke-dash animation as it is revealed. Unrevealed parts are faint ghosted dashes.
Cameras = cones with hatching, guard routes = dash-dot paths with a travelling marker, lasers = thin
pulsing lines, vault = double-lined circle with a cross. The crew's own marks are **yellow grease pencil**:
circled rooms, scrawled notes in `--f-draft`, arrows, and the route of the chosen play. Props on the
table edge (masking tape, a Polaroid of the target, index cards) add life.

**Noir.** Ink black, petrol teal fog and shadow tint, sodium gold for every light source (windows,
lamps, neon, headlights, flashlight beams, loot). Rain everywhere. Wet streets reflect gold as
vertical smears. Strong silhouettes, rim light, halftone in the mid-tones, hatching for shade,
off-register plates on big type. Comic captions on newsprint in Special Elite, speech bubbles in
Comic Neue caps, onomatopoeia in Bangers with gold fill and ink outline.

---

## 5. Architecture

Vanilla ES modules, bundled by Vite. No framework. `npm run dev` for dev, `npm run build` for production.

```
index.html                  shell: #stage (screens), #fx-layer, #overlay-layer, #toast-layer
src/main.js                 boot: fonts, styles, state, audio, sql engine, register screens, go('home')
src/core/bus.js             tiny pub/sub: on(evt, fn) → off, emit(evt, payload)
src/core/state.js           persistent save (localStorage) + economy helpers   ← OWNER: lead
src/core/router.js          screen registry and transitions                   ← OWNER: lead
src/core/audio.js           WebAudio sfx + ambience                           ← OWNER: lead
src/core/dom.js             $, h(), escapeHtml, sleep, reduced-motion flag    ← OWNER: lead
src/ui/*                    buttons, modal, toast, icons, settings modal      ← OWNER: lead
src/styles/*                tokens, base, ui primitives                       ← OWNER: lead

src/data/*                  schema + seed SQL, jobs, crew, story, concepts    ← OWNER: content agent
scripts/verify-content.mjs  runs every solution against sql.js, checks clues  ← OWNER: content agent

src/screens/home/*          title screen                                      ← OWNER: world agent
src/screens/hub/*           job board                                         ← OWNER: world agent
src/art/noirCity.js         Three.js cel-shaded rain city (home + hub)        ← OWNER: world agent

src/sql/*                   sql.js engine, compare, highlight, editor, autocomplete ← OWNER: planning agent
src/screens/planning/*      blueprint, terminal, results, comms, call-the-play, field manual ← OWNER: planning agent

src/cinema/*                comic panel engine, shot library, blueprint→noir transition ← OWNER: cinema agent
src/art/portraits.js        crew portraits (SVG)                              ← OWNER: cinema agent
src/screens/cinema/*        cinema screen (prologue, briefings, replays, story beats) ← OWNER: cinema agent
src/screens/debrief/*       post-job results screen                           ← OWNER: cinema agent
```

**Rule:** only edit files you own. If you need a change in a file you don't own (e.g. a new token or
sound), prefer a local solution inside your own files. If you must, make a *minimal additive* edit
and list it in your final report.

### 5.1 Screen contract
```js
// src/screens/<name>/index.js
export default {
  id: 'home',
  // root is an empty <section class="screen"> already attached to #stage.
  // params: whatever router.go() was called with.
  async mount(root, params) {},
  // Called before root is removed. Stop RAF loops, remove listeners, dispose WebGL.
  unmount() {},
};
```
Navigate with `import { go } from '../../core/router.js'; go('planning', { jobId: 'pawn' })`.
`go(id, params, { transition: 'cut' | 'fade' | 'wipe' | 'none' })`, default `fade`.
Screens own their CSS: `import './planning.css'` at the top of the screen module (Vite injects it).
Scope every selector under the screen root class (`.scr-planning …`) to avoid collisions.

Screen ids and params:
| id | params |
|---|---|
| `home` | – |
| `hub` | `{ focusJob?: jobId }` |
| `cinema` | `{ script: Page[], next: { screen, params } , skippable?: true }` (see §6) |
| `planning` | `{ jobId, puzzle?: 0-4 }` or `{ mode: 'sandbox' }` |
| `debrief` | `{ jobId, result }` (result from `state.completeJob`) |

The replay flow from planning:
```js
import { blueprintToNoir } from '../../cinema/transition.js';
await blueprintToNoir(blueprintSvgEl, { focus: {x, y}, route: [[x,y],...] }); // resolves once the screen is ink
go('cinema', { script: job.replay.success, next: { screen: 'debrief', params: { jobId, result } } }, { transition: 'none' });
```

### 5.2 State API (`src/core/state.js`)
```js
import * as S from '../../core/state.js';
S.get()                          // the whole save object (read-only by convention)
S.settings()                     // { sound, music, typewriter, unlockAll, quality: 'high'|'low' }
S.setSetting(key, value)
S.job(jobId)                     // { solved:[b,b,b,b,b], attempts:{[pi]:{tries,hints,solution,draft,history}}, play:{done,wrong:[]}, stars, take }
S.attempt(jobId, pi)             // attempt record (created on demand)
S.isUnlocked(jobIndex)
S.solveQuery(jobId, pi)          // → { paid, firstTry }, adds cash, emits 'query:solved'
S.useHint(jobId, pi) / S.useSolution(jobId, pi)   // adds heat, emits 'heat'
S.wrongPlay(jobId, optionId)     // adds heat
S.completeJob(jobId)             // → { take, stars, heatBefore, heatAfter, rankBefore, rankAfter }
S.cash(), S.heat(), S.rank()     // rank → { index, name, next, progress }
S.markSeen(key), S.seen(key)     // one-off story beats
S.sandbox()                      // { draft, history }
S.save()                         // persist (debounced autosave also happens on every mutation)
S.reset()
```
Bus events: `query:solved {jobId, pi}`, `job:complete {jobId}`, `cash`, `heat`, `settings`.

### 5.3 Audio (`src/core/audio.js`)
`sfx(name)` with names: `click hover type run ok bad err reveal stamp whoosh slam alarm
cash lock unlock rain-drop siren`. `ambience('rain' | 'blueprint' | 'noir' | null)` starts or stops a
loop, crossfading. `music(on)` for a low bass-and-brush noir loop. UI sfx and music are synthesised with WebAudio;
rain ambience and thunder are **field recordings** in `public/audio/` (credits in `public/audio/CREDITS.md`).
Synthesised rain was tried twice and rejected (it reads as TV static or boiling water). Don't bring it back.

### 5.4 UI primitives (`src/ui/index.js`, styles in `src/styles/ui.css`, demo at `/styleguide.html`)
- `button(label, { variant, size, icon, cut, onClick })`: variant `'gold'|'ink'|'cream'|'alarm'` → noir `.cut`;
  `'bp'|'grease'` → blueprint; `'link'` → text link. size `'sm'|'lg'`. cut `'a'|'b'|'c'` picks the hand-cut outline.
- `iconButton(icon, { world: 'noir'|'bp', title, onClick })` → casino chip or callout bubble.
- `dymo(text, { tone: ''|'teal'|'gold'|'alarm'|'blue', rot })`, `stamp(text, { tone, rot, animate })`.
- `openModal({ title, body, world: 'folder'|'vellum', tab })` → `{ close, el, body }`. Titles accept HTML (`<em>` = serif accent).
- `openSettings({ world })`, `toast(msg, { kind: 'gold'|'alarm'|'cyan'|'teal' })`, `icon(name)`, `greaseLoop()`.
- CSS helpers: `.tex-paper .tex-halftone .tex-hatch .tex-grain .misreg .misreg-strong .display .stencil .accent .label .draft .typed .mono .tag .check`.

---

## 6. Data contracts (`src/data/`)

### 6.1 `schema.js`
`export const SETUP_SQL` (CREATE TABLE + INSERT for the entire city database) and
`export const SCHEMA` (array of `{ name, blurb, cols: [[name, typeLabel, 'pk'|'fk'?]] }`) and
`export const RELATIONS` (`[{ from, fromCol, to, toCol }]`). One shared city database across all jobs
(so the sandbox can query everything and the finale can cross-reference earlier jobs).

### 6.2 `crew.js`
`export const CREW = { viv: { name, short, role, accent: 'gold'|'teal'|'cyan'|'cream', bio }, … , crane, calloway, … }`

### 6.3 `jobs.js`
```js
export const JOBS = [{
  id: 'pawn', number: 1,
  title: 'Cold Open',                 // chapter title
  target: "Moretti's Pawn & Loan",    // building name
  district: 'The Narrows',            // city district (hub label)
  hubPos: { x: 0.18, y: 0.62 },       // normalized position on the hub city map (0..1)
  take: 40000,                        // $ on success
  sqlFocus: 'SELECT · WHERE · ORDER BY · LIMIT · COUNT',
  logline: 'One sentence the hub shows.',
  briefing: Page[],                   // cinema script played before planning
  puzzles: [{                         // exactly 5
    title: 'Who Works Nights',
    ask: { who: 'viv', text: 'The crew line: what we need and why.' },   // shown as a comms message
    prompt: 'Precise task statement: columns, filters, order.',            // shown under the ask
    sql: 'SELECT …',                  // reference solution (the checker compares result sets)
    orderMatters: false,
    hint: 'Juno-voiced hint text',
    concepts: ['select'],             // keys of CONCEPTS
    reveals: ['rooms', 'staff'],      // blueprint layer ids revealed on solve
    intel: 'What we learned, one or two sentences, for the intel board.',
    react: { who: 'dex', text: 'Crew reaction line after solving.' },
  }],
  blueprint: Blueprint,               // see 6.4
  play: {                             // CALL THE PLAY
    question: 'How do we get in?',
    options: [{ id: 'a', label: 'Short label', detail: 'One line', route: [[x,y],…] }],  // 3-4 options
    answer: 'b',
    why: 'Why it works, citing the intel.',
    wrong: { a: 'What goes wrong if you pick a (used in the failure replay caption).', … },
  },
  replay: { success: Page[], failure: Page[] },  // failure is generic enough to fit any wrong option
  debrief: { headline: 'NEWSPAPER HEADLINE', line: { who: 'viv', text: '…' } },
  after: Page[] | null,               // optional story beat played after debrief (twists, mole seeds)
}];
export const PROLOGUE = Page[]; export const EPILOGUE = Page[];
```

### 6.4 Blueprint
Coordinate space **1200 × 760**, origin top-left.
```js
{
  title: 'MORETTI PAWN & LOAN — GROUND FLOOR',
  scale: '1:100',
  layers: [
    { id: 'shell', label: 'Building shell', initial: true },   // visible from the start
    { id: 'rooms', label: 'Rooms' }, { id: 'cameras', label: 'Cameras' }, …
  ],
  // every entity has `layer`. Rooms/walls are lines; the renderer draws walls from rects and polys.
  rooms:   [{ id, layer, name, x, y, w, h }]  or { id, layer, name, poly: [[x,y],…] },
  walls:   [{ layer, x1, y1, x2, y2 }],
  doors:   [{ layer, x, y, w, dir: 'h'|'v', label? }],
  windows: [{ layer, x1, y1, x2, y2 }],
  cameras: [{ id, layer, x, y, dir /*deg, 0 = east, clockwise*/, fov /*deg*/, range, label? }],
  guards:  [{ id, layer, name, path: [[x,y],…], loop: true, period: 12 /*seconds per loop*/ }],
  lasers:  [{ layer, x1, y1, x2, y2 }],
  safes:   [{ id, layer, x, y, r, label, kind: 'safe'|'vault' }],
  entries: [{ id, layer, x, y, label }],       // possible entry points (vent, roof, loading dock…)
  notes:   [{ layer, x, y, text, rot? }],      // handwritten annotations
  labels:  [{ layer, x, y, text }],            // small caps technical labels
}
```

### 6.5 Cinema `Page` / `Panel`
A **page** is one comic spread shown full-screen; its panels appear one at a time on click, space or auto-advance.
```js
Page = { layout: 'full'|'2h'|'2v'|'3a'|'3b'|'4'|'strip', panels: Panel[], tint?: 'teal'|'gold'|'ink' }
Panel = {
  shot: ShotName,           // art preset (list below)
  params?: { … },           // shot-specific, e.g. { who: 'viv' } for face shots, { time: '02:47' } for clock
  caption?: string,         // narration box (cream, Special Elite)
  lines?: [{ who: crewId, text }],   // speech bubbles
  sfx?: 'CLICK',            // onomatopoeia
  hold?: ms                 // auto-advance override
}
```
**Shot library** (the cinema agent implements all of these procedurally; content uses only these names):
`city-establish` (params `{ building }`), `street-rain`, `car-interior` (`{ who }`), `car-chase`, `rooftop`,
`face` (`{ who, mood: 'calm'|'smirk'|'tense'|'shock' }`), `two-shot` (`{ a, b }`), `crew-table`,
`blueprint-closeup`, `hands-typing`, `cctv-monitor` (`{ label }`), `corridor-camera`, `laser-hall`,
`guard-patrol`, `vent-crawl`, `door-keypad` (`{ code }`), `safe-dial`, `vault-door`, `loot` (`{ item }`),
`clock` (`{ time }`), `phone` (`{ who }`), `gala-crowd`, `alarm`, `police-lights`, `getaway`,
`newspaper` (`{ headline }`), `title-card` (`{ kicker, title }`), `silhouette-reveal` (`{ who }`).

---

## 7. Content rules (for the story & data agent)
- Five queries per job; every one must have one unambiguous correct result set, verified in
  `scripts/verify-content.mjs` (loads `SETUP_SQL` into sql.js, runs every `sql`, fails if empty,
  errored, or if two puzzles in a job share an identical result).
- `prompt` must name the exact columns and order so a player can hit the result set exactly.
- `intel` text must be *true to the data*: numbers and names in it must match the query result.
- The **play** must be answerable only by combining the job's five intel findings.
  The wrong options should be plausible and ruled out by specific findings.
- Seed the mole from job 3 onward with small data anomalies the player can notice;
  the finale's queries prove it.
- Tone: witty, terse, cinematic. Lines under ~140 characters. No exposition dumps.

---

## Change log
- v1: initial contract.
- v2: art direction rewritten (diegetic props, Saul Bass × Spider-Verse, new type system). v1 visuals rejected by the user.
