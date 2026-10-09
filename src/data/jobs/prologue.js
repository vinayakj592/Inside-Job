// PROLOGUE: New game → this → hub. The story so far, then the team: one character-intro card each for
// Vera, Dex, Kim, Sam and Ruby (role + why they join), then Mr. Crane and Detective Cole.
// Simple English rules: docs/WRITING.md (checked by scripts/check-english.mjs).
export const PROLOGUE = [
  { layout: 'full', tint: 'teal', panels: [
    { shot: 'city-establish', params: { building: 'Crane Tower' }, caption: 'Port Vesper. Night. The rain never stops in this city.' },
  ] },
  { layout: '3b', panels: [
    { shot: 'newspaper', params: { headline: 'CRANE TOWER VAULT ROBBED' }, caption: 'Two years ago, someone robbed the bank vault in Crane Tower.' },
    { shot: 'silhouette-reveal', params: { who: 'crane' }, caption: 'The robber was Mr. Crane. He robbed his own bank.' },
    { shot: 'face', params: { who: 'viv', mood: 'tense' }, caption: 'Then he blamed Vera, the woman who built the vault. Vera went to prison.' },
  ] },
  { layout: '2h', panels: [
    { shot: 'street-rain', caption: 'September. The prison gate opens. Vera is free.' },
    { shot: 'character-intro', params: { who: 'viv', tagline: 'The Boss. She makes the plan.' }, lines: [{ who: 'viv', text: 'Crane stole the money and blamed me. I want the proof, the money and my name back.' }] },
  ] },
  { layout: '3a', panels: [
    { shot: 'car-interior', params: { who: 'dex' }, caption: 'Dex is the fastest driver in the city.' },
    { shot: 'character-intro', params: { who: 'dex', tagline: 'The Driver.' }, lines: [{ who: 'dex', text: 'I owe a lot of money. I need this job.' }] },
    { shot: 'two-shot', params: { a: 'dex', b: 'mia' }, caption: 'Mia is his little sister. She fixes cars in her garage.', lines: [{ who: 'mia', text: 'Dex, we cannot pay the rent. We will lose the garage.' }, { who: 'dex', text: 'Don’t worry, Mia. I will get the money.' }] },
  ] },
  { layout: '4', panels: [
    { shot: 'safe-dial', sfx: 'tik… tik… CLICK', caption: 'Kim lives above the garage. She can open any lock.' },
    { shot: 'character-intro', params: { who: 'juno', tagline: 'The Safe Expert.' }, lines: [{ who: 'juno', text: 'Crane closed my mother’s lock shop. I want to stop him.' }] },
    { shot: 'guard-patrol', caption: 'Sam was a night guard for 20 years.' },
    { shot: 'character-intro', params: { who: 'otis', tagline: 'The Guard.' }, lines: [{ who: 'otis', text: 'Crane stole the savings of 400 guards. They were my friends.' }] },
  ] },
  { layout: '2v', panels: [
    { shot: 'gala-crowd', caption: 'Ruby is an actor. She can pretend to be anyone.' },
    { shot: 'character-intro', params: { who: 'lena', tagline: 'The Actor.' }, lines: [{ who: 'lena', text: 'Why do I want to fight Crane? I have my own reasons.' }] },
  ] },
  { layout: '4', panels: [
    { shot: 'crew-table', caption: 'Mia’s garage. 5 chairs, and 1 cup of coffee for you.', lines: [{ who: 'viv', text: 'Every building in this city keeps its records in one computer network.' }] },
    { shot: 'face', params: { who: 'juno', mood: 'smirk' }, lines: [{ who: 'juno', text: 'Doors, cameras, guards, phones. It is all in there.' }] },
    { shot: 'hands-typing', sfx: 'CLAK', caption: 'This is you. You can read those records with SQL.' },
    { shot: 'face', params: { who: 'viv', mood: 'calm' }, lines: [{ who: 'viv', text: 'We will call you the Architect. Welcome to the team.' }, { who: 'viv', text: 'Rule 1: we never lie to each other.' }] },
  ] },
  { layout: '4', tint: 'ink', panels: [
    { shot: 'character-intro', params: { who: 'crane', tagline: 'The Villain. He owns half the city.' }, lines: [{ who: 'crane', text: 'Vera is free? Let her try. This city is mine.' }] },
    { shot: 'character-intro', params: { who: 'calloway', tagline: 'The Detective.' }, lines: [{ who: 'calloway', text: 'I have tried to catch Crane for 9 years. I will not stop.' }] },
    { shot: 'face', params: { who: 'viv', mood: 'smirk' }, lines: [{ who: 'viv', text: 'Get ready, everyone. Our first job is tonight.' }] },
    { shot: 'title-card', params: { kicker: 'Port Vesper', title: 'Inside Job' } },
  ] },
];
