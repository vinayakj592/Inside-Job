// EPILOGUE: played after the tower debrief. Crane is arrested; Ruby's secret calls were to Detective Cole;
// Vera's name is cleared; the money goes back; Dex leaves with Mia; Cole's card; the rain stops.
// Simple English rules: docs/WRITING.md (checked by scripts/check-english.mjs).
export const EPILOGUE = [
  { layout: '3a', tint: 'teal', panels: [
    { shot: 'silhouette-reveal', params: { who: 'crane' }, caption: 'The next day. Mr. Crane sits in a police cell.' },
    { shot: 'face', params: { who: 'calloway', mood: 'smirk' }, lines: [{ who: 'calloway', text: 'Nine years, Mr. Crane. Now a judge will see the proof.' }] },
    { shot: 'face', params: { who: 'crane', mood: 'shock' }, lines: [{ who: 'crane', text: 'Who gave you all of this?' }] },
  ] },
  { layout: '3a', panels: [
    { shot: 'phone', params: { who: 'lena' }, caption: 'Remember Ruby’s secret phone calls? They all went to Detective Cole.' },
    { shot: 'two-shot', params: { a: 'viv', b: 'lena' }, lines: [{ who: 'viv', text: 'So you were helping the police.' }, { who: 'lena', text: 'Yes. I wanted Crane in prison too.' }] },
    { shot: 'face', params: { who: 'calloway', mood: 'calm' }, lines: [{ who: 'calloway', text: 'Ruby helped me catch Crane. She never told me about the Architect.' }] },
  ] },
  { layout: '4', panels: [
    { shot: 'newspaper', params: { headline: 'VERA STONE DID NOT ROB THE VAULT' }, caption: 'The whole city reads the truth. Vera’s name is clear.' },
    { shot: 'face', params: { who: 'otis', mood: 'calm' }, caption: 'The stolen money goes back to the guards.', lines: [{ who: 'otis', text: '400 guards get their savings back. I checked every name.' }] },
    { shot: 'face', params: { who: 'juno', mood: 'smirk' }, caption: 'Kim’s mother gets her money back too. Her lock shop opens again.', lines: [{ who: 'juno', text: 'My mother has her shop again. That is all I wanted.' }] },
    { shot: 'two-shot', params: { a: 'viv', b: 'dex' }, caption: 'Morning. The garage.', lines: [{ who: 'dex', text: 'I am sorry, Vera. Crane said he would hurt Mia.' }, { who: 'viv', text: 'I forgive you, Dex. But you cannot stay with us.' }] },
  ] },
  { layout: 'strip', panels: [
    { shot: 'getaway', caption: 'Dex and Mia drive out of the city. They will start again.' },
    { shot: 'hands-typing', caption: 'Detective Cole leaves a card under your door.', lines: [{ who: 'calloway', text: 'If you ever want honest work, call me.' }] },
    { shot: 'face', params: { who: 'viv', mood: 'calm' }, lines: [{ who: 'viv', text: 'Thank you, Architect. We did it together.' }] },
    { shot: 'city-establish', params: { building: 'Port Vesper' }, caption: 'Over Port Vesper, the rain stops. The sun comes up.' },
    { shot: 'title-card', params: { kicker: 'Port Vesper', title: 'The End' } },
  ] },
];
