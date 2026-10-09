// Cast. accent maps to palette tokens: gold | teal | cyan | cream | alarm
// `look` is one line an illustrator can draw from: silhouette, hair, clothing, signature prop.
// `voice` is for writers (not rendered). Minor characters share the same shape.
export const CREW = {
  viv: {
    name: 'Vera Stone', short: 'Vera', role: 'The Boss', accent: 'gold',
    bio: 'She built the vault in Crane Tower. Crane robbed it and blamed her. She went to prison for 18 months. Now she wants the truth out.',
    look: 'Tall, narrow silhouette; sharp black bob with one silver streak; long charcoal trench over a turtleneck; drafting pencil behind her ear.',
    voice: 'Cool, precise, dry. Short declaratives. Calls you “Architect”. Never raises her voice.',
  },
  dex: {
    name: 'Dex Moran', short: 'Dex', role: 'The Driver', accent: 'teal',
    bio: 'The fastest driver in the city. He owes a lot of money, and his little sister Mia rents her garage from Crane.',
    look: 'Wiry, loose-limbed; slicked-back hair with one curl that won’t stay down; cropped leather racing jacket with a torn sleeve stripe; spins a key ring on one finger.',
    voice: 'Cocky, fast, car metaphors. Deflects with jokes. Too quick to explain himself.',
  },
  juno: {
    name: 'Kim Park', short: 'Kim', role: 'The Safe Expert', accent: 'cyan',
    bio: "She can open any lock. Crane closed her mother's lock shop.",
    look: 'Small and compact; blunt fringe and a messy topknot; oversized cardigan over overalls; round wire glasses, stethoscope around her neck.',
    voice: 'Deadpan, nerdy, literal. Loves locks more than people. The one who says “technically”.',
  },
  otis: {
    name: 'Sam Brandt', short: 'Sam', role: 'The Guard', accent: 'cream',
    bio: "A big, kind man. He worked as a night guard for 20 years. Crane stole the guards' savings.",
    look: 'Huge, round-shouldered block of a man; shaved head, grey stubble; cable-knit sweater under a guard’s old pea coat; steel thermos in one hand.',
    voice: 'Gentle giant. Slow, warm, plain words. Knows guards as people. Quotes union rules.',
  },
  lena: {
    name: 'Ruby Lane', short: 'Ruby', role: 'The Actor', accent: 'gold',
    bio: 'She can pretend to be anyone. She keeps one secret from the team.',
    look: 'Hourglass silhouette that changes with every costume; red finger-waved hair (or a wig); fitted evening coat with fur collar; cigarette holder she never lights.',
    voice: 'Charming, theatrical, a little wicked. Calls people “darling”. Always in character, even with the crew.',
  },
  you: {
    name: 'The Architect', short: 'You', role: 'The Data Expert', accent: 'cyan',
    bio: 'You read buildings through their records. The team never sees your face.',
    look: 'Never shown: only hands over a keyboard in the glow of a light table, a signet ring, a cold coffee.',
    voice: 'Silent. The player.',
  },

  crane: {
    name: 'Leo Crane', short: 'Mr. Crane', role: 'The Villain', accent: 'alarm',
    bio: 'The richest man in Port Vesper. He owns half the city. He stole from his own bank and blamed Vera.',
    look: 'Tall, heavy-shouldered; swept-back silver hair, trimmed white beard; double-breasted cream suit, black gloves; crane-head silver cane.',
    voice: 'Velvet menace. Polite, amused, never in a hurry. Speaks of people as property.',
  },
  calloway: {
    name: 'Nina Cole', short: 'Detective Cole', role: 'The Detective', accent: 'teal',
    bio: 'A police detective. She has been trying to catch Crane for nine years.',
    look: 'Lean, angular; cropped grey-streaked hair; rumpled raincoat over a shoulder holster; paper cup of coffee, always cold.',
    voice: 'Weary, sardonic, patient. Asks questions she already knows the answer to.',
  },

  // Minor characters (appear in dialogue and cinema panels)
  moretti: {
    name: 'Sal Moretti', short: 'Moretti', role: 'Pawn Shop Owner', accent: 'cream',
    bio: "An old man who keeps Crane's secret record book in his shop.",
    look: 'Stooped, pear-shaped; bald crown with a white horseshoe of hair; cardigan with elbow patches; jeweller’s loupe on a chain.',
    voice: 'Nervous, wheedling, old-country courtesy.',
  },
  ruiz: {
    name: 'Frank Ruiz', short: 'Ruiz', role: 'Night Guard', accent: 'cream',
    bio: "The night guard at Moretti's shop. He takes a break at 1:30 every night.",
    look: 'Stocky, moustached; peaked guard cap pushed back; short-sleeved uniform shirt; thermos and folded newspaper.',
    voice: 'Grumbling, habitual. Talks to himself.',
  },
  voight: {
    name: 'Silas Voight', short: 'Voight', role: "Crane's Guard Boss", accent: 'alarm',
    bio: 'He runs security for Mr. Crane.',
    look: 'Square, crew-cut ex-soldier; scar through one eyebrow; black roll-neck and shoulder rig; earpiece coil.',
    voice: 'Clipped, military, few words.',
  },
  harris: {
    name: 'Ray Harris', short: 'Harris', role: 'Porter', accent: 'cream',
    bio: 'He works at the auction house. Someone paid his debts.',
    look: 'Thin, long-armed; grey comb-over; brown porter’s dust coat; white cotton gloves.',
    voice: 'Obsequious, sweaty, eager to please whoever pays.',
  },
  mia: {
    name: 'Mia Moran', short: 'Mia', role: "Dex's Sister", accent: 'teal',
    bio: "Dex's little sister. She fixes cars. Crane owns her garage.",
    look: 'Slight, oil-streaked; short curly hair under a red bandana; oversized coveralls with sleeves tied at the waist; a torque wrench on her shoulder.',
    voice: 'Blunt, tired, younger than she sounds. Loves her brother and doesn’t trust him.',
  },
  guard: {
    name: 'Night guard', short: 'Guard', role: 'Security', accent: 'cream',
    bio: 'A guard on night duty.',
    look: 'Generic uniformed silhouette; peaked cap; flashlight beam cutting the dark.',
    voice: 'Bored, then suddenly not.',
  },
};
