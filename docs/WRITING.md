# Writing guide: simple English, simple story

**Player feedback:** "The English is very tough. Character names are confusing. The story is very
complicated." Many players read English as a second language. Write for them.

Every line a player can see must pass `node scripts/check-english.mjs`.

---

## 1. Language rules

1. **Short sentences.** At most 12 words in dialogue, captions and intel. At most 20 words in a SQL task
   (`prompt`). One idea per sentence.
2. **Common words.** Use the 2,000 most common English words where you can. Say "big", not "enormous".
   Say "money", not "funds". Say "guard", not "sentry".
3. **No idioms, slang or wordplay.** Not "rains the way other cities breathe", "stays put", "the plumbing",
   "darling", "technically", "kid", "mark", "grifter", "wheelman", "muscle", "heist lingo". Say exactly what you mean.
4. **Simple tenses.** Present simple, past simple, "will", "can". Avoid long phrasal verbs.
5. **Say who and what.** Use names often. In each job's briefing, give a crew member's role with their name
   the first time they speak: "Kim (our safe expert)".
6. **Numbers and times are digits.** "1:30 a.m.", "$40,000", "5 cameras".
7. **SQL tasks are clear instructions.** Start with a verb. Name the exact columns, filters and order.
   Example: "Show the name and shift of every staff member at Moretti's. Sort by name."
8. **Keep the noir mood with images and sound, not with hard words.** Rain, night and gold light do the work.

## 2. The cast (only these characters have names in the story)

| id | Name | Role (always the same words) |
|---|---|---|
| `viv` | **Vera** (Vera Stone) | The Boss. She made the plan. |
| `dex` | **Dex** (Dex Moran) | The Driver. |
| `juno` | **Kim** (Kim Park) | The Safe Expert. Gives you hints. |
| `otis` | **Sam** (Sam Brandt) | The Guard. He used to be a night guard. |
| `lena` | **Ruby** (Ruby Lane) | The Actor. She pretends to be other people. |
| `you` | **The Architect** | You. You read buildings through their records. |
| `crane` | **Mr. Crane** (Leo Crane) | The Villain. He owns half the city. |
| `calloway` | **Detective Cole** (Nina Cole) | The Detective. |
| `mia` | **Mia** (Mia Moran) | Dex's little sister. |

Minor people (Moretti, the night guard, the porter, Crane's guard boss) are called by their **job**,
not a name, in dialogue: "the night guard", "the porter", "Crane's guard boss". Names may appear in
data and query results; that is fine. **Do not give minor people `character-intro` cards.**

The ids (`viv`, `juno`, `otis`, …) never change. Only display names changed.

## 3. The story (keep it this simple)

**The big idea.** Mr. Crane is the richest man in Port Vesper. Two years ago he robbed his own bank
vault. He blamed Vera, the woman who built the vault. Vera went to prison. Now she is free. She builds a
team to get the proof, take back the money and clear her name. You are the team's data expert.

**One main twist:** Dex, the driver, is secretly working for Crane. Crane paid Dex's debts and owns his
sister's garage. **One small surprise at the end:** Ruby's secret phone calls were to Detective Cole. She
was helping the police catch Crane.

| # | Job | What we take | Why | Story after the job |
|---|---|---|---|---|
| 1 | Moretti's pawn shop | Crane's secret record book | It shows Crane paid the judge at Vera's trial | The team is happy. Crane hears about it. |
| 2 | Art gallery party | A painting with Crane's bank papers behind it | The papers name Crane's secret company, **CH Group** | Late at night, Crane calls Dex. (We see it. The team does not.) |
| 3 | Orpheum casino | Cash from the count room | Money for the next jobs | A guard was waiting for them. "Someone talked." The team is worried. |
| 4 | Rail yard | Papers from Crane's armored train | Proof that CH Group moves Crane's money | **Midpoint.** The police almost catch them. Crane calls the hideout: "I know who you are." |
| 5 | First Meridian Bank | Box 1127 | It belongs to CH Group: more proof | The team argues. Ruby makes secret phone calls. Everyone suspects Ruby. |
| 6 | Auction house | Lot 47, Crane's drawings of his own tower | We need the tower plans for the last job | Crane closes Mia's garage. Dex is very upset. |
| 7 | Crane's penthouse | The vault codes | We need them for Crane Tower | **Lowest point.** Crane's men hurt Sam. Vera says: "One of us is a spy." |
| 8 | Crane Tower | The stolen money and the proof | Clear Vera's name | You prove the spy is Dex. Dex says Crane threatened Mia. Vera gives Dex a fake plan to send to Crane. Crane waits at the wrong door. The team takes the vault. Detective Cole arrests Crane. |

**Epilogue:** Ruby's calls were to Detective Cole: she was helping the police. Vera's name is cleared.
The money goes back to the guards and to Kim's mother. Vera forgives Dex but sends him away with Mia.
Detective Cole leaves a card for the Architect: "If you ever want honest work, call me." The rain stops.

**The spy clues (seed them simply, from job 3):** job 3: Dex owes the casino money. Job 4: Dex's car is at
the rail yard gate. Job 5: an unknown phone calls Crane after every team meeting. Job 6: CH Group paid
Dex's debts. Job 7: the unknown phone is near the team's hideout. Job 8: the data proves it is Dex's phone.

## 4. Format rules

- **Briefing:** 2 pages. Page 1 is a `title-card`. Page 2 says, in 2–4 short panels: where we are,
  what we will take, why it matters.
- **`after` beats:** 1–2 pages. End with one clear line that makes the player want the next job.
- **Each panel:** at most 1 caption (1–2 sentences) and at most 2 speech bubbles (1–2 sentences each).
- **`ask`** (crew message in planning): 1–2 sentences, says what we need and why.
- **`hint`** (from Kim): one concrete tip about the SQL. Mention the key word: "Use WHERE to keep only night shifts."
- **`intel`:** what we learned, in 1–2 sentences, with the real numbers and names from the result.
- **`react`:** one short line from a crew member.
- **Play** question, option labels and details, `why` and `wrong` reasons: short and concrete.
- **Debrief headline:** a simple newspaper headline, 8 words or fewer. The headline may be in capitals.

## 5. Do not change

`sql`, `orderMatters`, `concepts`, `reveals`, blueprint geometry, ids, `play.answer`, option ids and routes,
`hubPos`, `take`. Puzzle results must stay the same. Check every `intel` against
`node scripts/verify-content.mjs --dump --job <id>`.
