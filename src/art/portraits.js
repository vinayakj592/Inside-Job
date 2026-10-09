// Crew portraits: bold, flat, split-lit noir heads with an accent rim light and halftone shadow.
// Contract:
//   portrait(id, { mood = 'calm', size = 96, bg = true } = {}) → SVGElement (square, viewBox 0 0 100 100)
//   portraitMarkup(id, { mood, bg, uid }) → string of SVG markup in the same 0..100 space (for embedding)
//   PORTRAIT_IDS: string[]
// Moods: 'calm' | 'smirk' | 'tense' | 'shock'. Unknown ids get a generic fedora silhouette.
// All heads face three-quarters to the viewer's right; key light from the right, rim light from the back.
import { CREW } from '../data/crew.js';

export const PORTRAIT_IDS = ['viv', 'dex', 'juno', 'otis', 'lena', 'crane', 'calloway', 'moretti', 'ruiz', 'voight', 'harris', 'guard', 'mia'];
export const MOODS = ['calm', 'smirk', 'tense', 'shock'];

const K = {
  ink: '#07090b', ink2: '#0d1316', ink3: '#141d21', ink4: '#1f2b30',
  t8: '#061f23', t7: '#0a2b30', t6: '#0d3a40', t5: '#114a51', t4: '#176068', t3: '#20787d', t2: '#3b9391', t1: '#86c2b8',
  gold: '#f2a93b', goldHot: '#ffcf5a', goldDeep: '#a8661a', cream: '#ece2c9', cream2: '#d7cbb0', creamDim: '#9d927c',
  manila: '#d6b476', manilaDeep: '#8a6a33', alarm: '#d8412f', alarmDeep: '#6e1a12', cyan: '#56d9ff',
};
const ACCENT = { gold: K.gold, teal: K.t2, cyan: K.cyan, cream: K.cream, alarm: K.alarm, 'gold-alt': K.goldHot };

// skin: [lit, shadow, deep line colour]
const SKIN = {
  light: ['#e9d3b3', '#8c6a55', '#4a3328'],
  warm: ['#e3c29a', '#8a6446', '#4a2f22'],
  tan: ['#c9966a', '#6e4a33', '#3a2418'],
  brown: ['#a8704a', '#5a3824', '#2e1c12'],
  deep: ['#7e4f33', '#432817', '#22130b'],
  pale: ['#e6d0b2', '#7d6452', '#3f2e25'],
};

/* Per-character art. Each returns { skin, head, back, front, clothes, extra, face, rim } pieces. */
const HEAD_DEFAULT = { top: 17, back: 34, fore: 65, chinY: 67, chinX: 57, jawX: 43, jawY: 62, nose: 72, noseY: 47 };

function headPath(h) {
  const { top, back, fore, chinY, chinX, jawX, jawY, nose, noseY } = h;
  const mid = (back + fore) / 2 - 1;
  return `M${mid},${top}C${fore - 6},${top - 1} ${fore + 1},${top + 5} ${fore + 1},${top + 15}L${fore + 2},${noseY - 10}L${nose},${noseY}L${fore + 1},${noseY + 3}L${fore + 2.5},${noseY + 7}L${fore + 1},${noseY + 9.5}L${fore + 1.5},${noseY + 12}C${fore + 1},${chinY - 4} ${chinX + 5},${chinY} ${chinX},${chinY}L${jawX},${jawY}C${back + 5},${jawY - 2} ${back + 3},${jawY - 7} ${back + 2},${noseY + 1}C${back - 1},${top + 22} ${back - 1},${top + 12} ${back + 4},${top + 5}C${back + 7},${top + 1} ${mid - 6},${top} ${mid},${top}Z`;
}

const CHARS = {
  // Tall, narrow; sharp black bob with one silver streak; charcoal trench over a turtleneck; drafting pencil behind her ear.
  viv: {
    skin: 'light', accent: 'gold', head: { ...HEAD_DEFAULT, chinY: 66, jawX: 44 },
    clothes: () => `
      <path d="M6,100 L11,83 C19,75 30,73 40,72 L62,72 C74,73 85,78 93,86 L97,100Z" fill="${K.ink3}"/>
      <path d="M41,62 L59,64 L61,79 C55,82 46,82 40,78Z" fill="${K.ink}"/><path d="M42,67 L60,69 M41,72 L61,74" stroke="${K.ink3}" stroke-width="1"/>
      <path d="M40,72 L28,57 L25,82 L44,98 L47,82Z" fill="#2a3338"/><path d="M40,72 L28,57 L31,78Z" fill="#1c2327"/>
      <path d="M62,72 L74,57 L78,81 L60,98 L56,82Z" fill="#3a454b"/><path d="M74,57 L78,81" stroke="${K.gold}" stroke-width="1.2" opacity=".8"/>`,
    back: `<path d="M31,64 C27,46 28,28 36,19 C44,11 60,11 67,19 C72,25 73,33 72,40 L69,40 C66,30 58,27 50,30 L44,58 L44,66 Z" fill="${K.ink}"/>`,
    front: `<path d="M35,20 C43,11 60,11 67,18 C71,23 72,30 71,37 L66,33 L50,40 L42,34 L40,52 L41,66 L31,65 C28,50 28,31 35,20Z" fill="${K.ink}"/>
      <path d="M57,13.5 C60.5,20 61.5,27 60.5,34.5 L58.5,35.2 C59,28 57.5,21 55,14Z" fill="${K.cream2}"/>
      <path d="M29,40 L46,33" stroke="${K.gold}" stroke-width="2.6" stroke-linecap="round"/><path d="M29,40 L31,39.2" stroke="${K.ink}" stroke-width="2.6"/><path d="M45,33.4 L46.8,32.6" stroke="${K.cream}" stroke-width="2.6"/>`,
    extra: '', lips: '#5b2a22',
  },
  // Wiry; slicked-back hair with one curl that won't stay down; cropped leather racing jacket, torn sleeve stripe; key ring.
  dex: {
    skin: 'tan', accent: 'teal', head: { ...HEAD_DEFAULT, top: 20, chinY: 69, jawX: 42, jawY: 63 },
    clothes: () => `
      <path d="M2,100 L7,83 C17,75 30,73 40,73 L62,74 C76,75 88,80 96,88 L100,100Z" fill="${K.ink2}"/>
      <path d="M40,70 L62,71 L63,77 L39,76Z" fill="${K.ink}"/><path d="M40,70 L62,71" stroke="${K.t3}" stroke-width="1.2"/>
      <path d="M44,76 L52,86 L59,77Z" fill="${K.cream2}"/>
      <path d="M50,77 L50,100" stroke="${K.t4}" stroke-width="1.4"/>
      <path d="M8,84 L22,78 L28,96 L14,100 L10,100Z" fill="${K.t5}"/><path d="M8,90 L24,85 L26,91 L21,90 L17,94 L10,95Z" fill="${K.ink2}"/>
      <path d="M86,82 L94,86 L96,100 L88,100Z" fill="${K.t5}"/>`,
    back: '',
    front: `<path d="M34,48 C30,33 34,20 46,16 C56,13 66,15 69,23 L68,27 C62,22 53,22 46,25 C41,28 40,36 40,48Z" fill="${K.ink}"/>
      <path d="M38,28 C46,20 56,18 66,21 M37,34 C44,27 52,24 62,24" stroke="${K.t4}" stroke-width="1.1" fill="none"/>
      <path d="M62,21 C68,22 70,27 66,30 C63,32 61,29 63,27" stroke="${K.ink}" stroke-width="2.4" fill="none" stroke-linecap="round"/>
      <path d="M38,46 L37,56 L40,56 L41,46Z" fill="${K.ink}"/>`,
    extra: '', lips: '#5a3424',
  },
  // Small, compact; blunt fringe and a messy topknot; oversized cardigan over overalls; round wire glasses; stethoscope.
  juno: {
    skin: 'warm', accent: 'cyan', head: { ...HEAD_DEFAULT, top: 21, fore: 64, chinY: 66, jawX: 45, jawY: 61, nose: 70 },
    clothes: () => `
      <path d="M2,100 L8,82 C17,74 31,72 42,72 L60,72 C73,73 86,79 95,88 L98,100Z" fill="${K.t6}"/>
      <path d="M40,72 L50,84 L61,72Z" fill="${K.cream2}"/>
      <path d="M33,80 L40,100 M67,80 L60,100" stroke="${K.t4}" stroke-width="4"/>
      <path d="M36,78 L44,100 L56,100 L64,78 C58,86 42,86 36,78Z" fill="${K.t4}" opacity=".55"/>
      <path d="M22,78 C24,86 22,94 24,100 M78,78 C76,86 78,94 76,100" stroke="${K.t7}" stroke-width="2" fill="none"/>
      <path d="M42,70 C38,80 38,90 44,94" stroke="${K.ink}" stroke-width="1.8" fill="none"/><path d="M60,71 C63,80 60,88 52,92" stroke="${K.ink}" stroke-width="1.8" fill="none"/>
      <circle cx="47" cy="94" r="3.4" fill="${K.cream2}" stroke="${K.ink}" stroke-width="1"/>`,
    back: `<path d="M33,40 L32,58 L40,60 L41,40Z" fill="${K.ink}"/>`,
    front: `<path d="M32,44 C28,26 38,15 52,15 C63,15 70,21 70,31 L66,32 L66,36 L42,36 L40,44Z" fill="${K.ink}"/>
      <path d="M44,16 C44,8 53,4 58,8 C63,5 66,12 60,15 C58,17 50,18 44,16Z" fill="${K.ink}"/>
      <path d="M58,8 L62,3 M60,12 L66,9 M47,9 L44,5" stroke="${K.ink}" stroke-width="1.6" stroke-linecap="round"/>
      <path d="M49,10 C52,8 55,9 57,11" stroke="${K.t3}" stroke-width="1" fill="none"/>`,
    extra: '', lips: '#6b3a2c', glasses: 'wire',
  },
  // Huge, round-shouldered; shaved head, grey stubble; cable-knit sweater under an old pea coat; thermos.
  otis: {
    skin: 'deep', accent: 'cream', head: { ...HEAD_DEFAULT, top: 20, back: 31, fore: 66, chinY: 70, chinX: 56, jawX: 40, jawY: 65, nose: 73, noseY: 48 },
    clothes: () => `
      <path d="M-4,100 L-2,77 C10,67 26,65 38,65 L64,66 C80,67 94,71 104,79 L104,100Z" fill="${K.ink3}"/>
      <path d="M36,64 C40,74 60,76 66,65 L68,100 L34,100Z" fill="${K.cream2}"/>
      <path d="M41,74 C43,80 41,88 43,100 M50,76 C52,84 50,92 52,100 M59,74 C57,82 60,90 58,100" stroke="${K.creamDim}" stroke-width="2.2" fill="none"/>
      <path d="M36,65 L20,68 L28,100 L38,100Z" fill="${K.t7}"/><path d="M66,65 L82,68 L74,100 L64,100Z" fill="${K.t6}"/>
      <path d="M20,68 L10,88 L28,100" fill="${K.t8}"/><path d="M82,68 L92,88 L74,100" fill="${K.t7}"/>
      <circle cx="30" cy="92" r="2.2" fill="${K.t4}"/><circle cx="72" cy="92" r="2.2" fill="${K.t4}"/>`,
    neckW: 1.6,
    back: '',
    front: `<path d="M40,22 C47,18 58,18 64,22" stroke="#9c6a4a" stroke-width="2" fill="none" opacity=".8"/>`,
    extra: '', lips: '#3a2418', beard: 'stubble',
  },
  // Hourglass; red finger-waved hair; fitted evening coat with fur collar; cigarette holder she never lights.
  lena: {
    skin: 'light', accent: 'gold-alt', head: { ...HEAD_DEFAULT, top: 19, chinY: 66, chinX: 58, jawX: 45, jawY: 61, nose: 71 },
    clothes: () => `
      <path d="M10,100 L15,85 C23,78 34,75 42,75 L60,75 C72,76 82,81 89,88 L92,100Z" fill="${K.ink2}"/>
      <path d="M50,80 L46,100 M50,80 L55,100" stroke="${K.ink}" stroke-width="1.4"/>
      <path d="M22,82 C22,74 30,70 36,72 C38,66 46,66 46,72 C48,70 52,72 50,78 C46,86 36,90 28,92 C22,92 20,86 22,82Z" fill="${K.cream}"/>
      <path d="M78,82 C80,74 72,70 66,72 C64,66 57,66 57,72 C55,70 51,72 53,78 C57,86 67,90 74,92 C80,92 82,86 78,82Z" fill="${K.cream2}"/>
      <path d="M26,84 l3,-2 M32,86 l3,-3 M38,82 l2,-3 M66,82 l2,3 M71,86 l3,1 M62,78 l3,1" stroke="${K.creamDim}" stroke-width="1"/>`,
    back: `<path d="M38,17 C26,20 22,34 25,46 C22,54 25,62 30,66 C34,68 40,66 43,62 L45,30Z" fill="#8e2c1c"/>
      <path d="M27,36 C31,40 26,44 30,48 C33,52 28,56 32,60" stroke="#b8452c" stroke-width="1.6" fill="none"/>`,
    front: `<path d="M34,40 C30,24 40,14 52,13 C62,12 69,17 71,25 C66,23 62,26 58,24 C54,29 48,26 44,30 C41,34 42,40 43,50 L37,54 C35,48 34,44 34,40Z" fill="#8e2c1c"/>
      <path d="M40,20 C44,16 48,22 53,17 C57,13 61,19 66,16 M37,28 C41,24 45,30 49,25 M36,36 C39,32 41,38 43,34" stroke="#c4553a" stroke-width="1.7" fill="none" stroke-linecap="round"/>
      <path d="M52,13 C50,17 48,20 44,22" stroke="#5a1a10" stroke-width="1.2" fill="none"/>`,
    extra: `<path d="M64,57.5 L90,50" stroke="${K.ink}" stroke-width="1.6" stroke-linecap="round"/><path d="M78,53.2 L82,52.1" stroke="${K.gold}" stroke-width="2"/><path d="M89,50.3 L91,49.7" stroke="${K.cream2}" stroke-width="2"/>`,
    lips: '#8a2418',
  },
  // Tall, heavy-shouldered; swept-back silver hair, trimmed white beard; double-breasted cream suit, black gloves.
  crane: {
    skin: 'pale', accent: 'alarm', head: { ...HEAD_DEFAULT, top: 18, back: 33, fore: 66, chinY: 68, chinX: 57, jawX: 42, jawY: 63, nose: 73.5, noseY: 48 },
    clothes: () => `
      <path d="M-2,100 L3,79 C13,71 28,69 40,69 L62,69 C77,70 91,75 99,83 L102,100Z" fill="${K.cream2}"/>
      <path d="M0,100 L4,84 C10,80 16,78 22,78 L26,100Z" fill="${K.creamDim}" opacity=".6"/>
      <path d="M41,69 L50,84 L60,69Z" fill="${K.ink}"/><path d="M48,75 L52,75 L54,100 L46,100Z" fill="${K.alarmDeep}"/>
      <path d="M40,69 L29,72 L39,100 L47,100 L48,82Z" fill="${K.manila}"/><path d="M61,69 L73,72 L63,100 L55,100 L53,82Z" fill="#e2d6b8"/>
      <circle cx="58" cy="90" r="1.6" fill="${K.creamDim}"/><circle cx="58" cy="97" r="1.6" fill="${K.creamDim}"/><circle cx="66" cy="90" r="1.6" fill="${K.creamDim}"/>
      <path d="M71,79 L78,77 L78,81Z" fill="${K.alarm}"/>`,
    back: '',
    front: `<path d="M34,46 C30,32 34,20 45,16 C54,13 63,14 67,19 L67,23 C61,19 53,19 47,22 C42,25 40,32 39,46Z" fill="${K.cream2}"/>
      <path d="M38,26 C46,20 56,18 66,21 M36,32 C44,25 52,23 60,23 M36,38 C40,31 45,28 50,27" stroke="${K.creamDim}" stroke-width="1" fill="none"/>
      <path d="M34,42 C33,31 36,23 42,19" stroke="${K.t3}" stroke-width="1.4" fill="none"/>`,
    extra: '', lips: '#6b4034', lines: true, beard: 'trim',
  },
  // Lean, angular; cropped grey-streaked hair; rumpled raincoat over a shoulder holster; cold coffee.
  calloway: {
    skin: 'brown', accent: 'teal', head: { ...HEAD_DEFAULT, top: 19, chinY: 67, chinX: 57, jawX: 44, jawY: 62, nose: 71.5 },
    clothes: () => `
      <path d="M4,100 L10,82 C18,75 30,72 40,72 L62,72 C74,73 86,78 94,86 L98,100Z" fill="#6d5227"/>
      <path d="M41,72 L50,84 L60,72Z" fill="${K.cream2}"/><path d="M47,78 L53,78 L55,100 L45,100Z" fill="${K.cream2}"/>
      <path d="M44,80 L34,100 M57,80 L68,100" stroke="#3a2a14" stroke-width="3"/>
      <path d="M40,71 L27,59 L23,82 L42,98 L47,84Z" fill="${K.manilaDeep}"/><path d="M61,71 L75,59 L79,82 L60,98 L54,84Z" fill="#a8844a"/>
      <path d="M75,59 L79,82" stroke="${K.manila}" stroke-width="1.2"/><path d="M30,90 C34,86 36,94 40,90" stroke="#4a3818" stroke-width="1" fill="none"/>`,
    back: '',
    front: `<path d="M35,44 C31,30 36,16 50,14 C60,12 68,17 68,27 L64,24 C56,21 48,24 42,28 L40,44Z" fill="${K.ink2}"/>
      <path d="M42,17 C48,14 56,14 63,18 M38,24 C44,20 50,19 56,19" stroke="${K.creamDim}" stroke-width="1.4" fill="none"/>`,
    extra: '', lips: '#4a2a1c',
  },
  // Stooped, pear-shaped; bald crown with a white horseshoe of hair; cardigan with elbow patches; jeweller's loupe.
  moretti: {
    skin: 'warm', accent: 'cream', head: { ...HEAD_DEFAULT, top: 22, back: 34, fore: 65, chinY: 70, chinX: 57, jawX: 42, jawY: 65, nose: 73, noseY: 50 },
    clothes: () => `
      <path d="M8,100 L14,86 C22,80 34,78 42,77 L60,77 C72,78 82,83 88,90 L90,100Z" fill="#5a3a24"/>
      <path d="M42,76 L50,88 L59,76Z" fill="${K.cream2}"/><path d="M50,88 L50,100" stroke="#3a2414" stroke-width="1.4"/>
      <circle cx="47" cy="93" r="1.3" fill="${K.cream2}"/><circle cx="53" cy="93" r="1.3" fill="${K.cream2}"/>
      <path d="M44,77 C46,86 52,88 56,86" stroke="${K.creamDim}" stroke-width=".8" fill="none"/><circle cx="56" cy="87" r="2.4" fill="${K.ink}" stroke="${K.creamDim}" stroke-width=".8"/>`,
    back: `<path d="M33,32 C30,42 32,52 36,56 L40,56 L40,36Z" fill="${K.cream}"/>`,
    front: `<path d="M34,34 C33,30 35,27 37,26 L40,40 L36,46Z" fill="${K.cream}"/><path d="M66,33 C68,30 67,28 65,27 L63,33Z" fill="${K.cream}"/>
      <path d="M44,24 C50,21 58,22 62,25" stroke="#f4dcb8" stroke-width="2" fill="none" opacity=".7"/>`,
    extra: '', lips: '#6a3a2a', lines: true,
  },
  // Stocky, moustached; peaked guard cap pushed back; short-sleeved uniform shirt.
  ruiz: {
    skin: 'tan', accent: 'cream', head: { ...HEAD_DEFAULT, top: 22, back: 33, fore: 66, chinY: 69, jawX: 41, jawY: 64 },
    clothes: () => `
      <path d="M2,100 L6,81 C16,74 30,72 40,72 L62,72 C76,73 88,78 96,86 L100,100Z" fill="${K.t3}"/>
      <path d="M41,72 L50,82 L60,72Z" fill="${K.t2}"/><path d="M50,82 L50,100" stroke="${K.t4}" stroke-width="1.2"/>
      <path d="M58,86 h12 v9 h-12Z" fill="none" stroke="${K.t4}" stroke-width="1.2"/><path d="M64,84 l2,-3 l2,3Z" fill="${K.gold}"/>
      <path d="M20,80 L24,76 M78,80 L74,76" stroke="${K.t4}" stroke-width="2"/>`,
    back: '',
    front: `<path d="M31,30 C30,17 42,10 53,11 C63,12 70,17 70,26 L32,33Z" fill="${K.t7}"/>
      <path d="M31,28 L70,24 L71,28 L31,33Z" fill="${K.ink}"/><path d="M58,26 L78,30 L74,34 L58,31Z" fill="${K.ink}"/>
      <path d="M48,17 l3,-4 l3,4 l-3,3Z" fill="${K.gold}"/>
      <path d="M35,33 L33,46 L38,46 L39,33Z" fill="${K.ink2}"/>`,
    extra: '', lips: '#4a2a1c', beard: 'mous',
  },
  // Square, crew-cut ex-soldier; scar through one eyebrow; black roll-neck and shoulder rig; earpiece coil.
  voight: {
    skin: 'light', accent: 'alarm', head: { ...HEAD_DEFAULT, top: 19, back: 33, fore: 66, chinY: 70, chinX: 56, jawX: 40, jawY: 66, nose: 72, noseY: 48 },
    clothes: () => `
      <path d="M-2,100 L3,79 C13,71 28,69 40,69 L62,69 C77,70 91,75 99,83 L102,100Z" fill="${K.ink}"/>
      <path d="M40,62 L60,64 L62,80 C55,83 46,83 39,79Z" fill="${K.ink}"/><path d="M41,68 L61,70 M40,74 L62,76" stroke="${K.ink3}" stroke-width="1"/>
      <path d="M14,80 L30,100 M86,80 L70,100" stroke="#3a2414" stroke-width="4"/>`,
    back: '',
    front: `<path d="M34,42 C32,28 36,17 50,15 C60,14 67,18 68,26 L66,27 L38,28 L37,42Z" fill="${K.ink2}"/>
      <path d="M36,22 L66,21" stroke="${K.creamDim}" stroke-width=".8" stroke-dasharray="1 1.5"/>
      <path d="M38,46 C35,54 36,62 40,70 C41,76 44,80 46,84" stroke="${K.cream2}" stroke-width="1.2" fill="none" stroke-dasharray="1.6 1"/>
      <circle cx="38.5" cy="46" r="2.2" fill="${K.ink}"/>`,
    extra: `<path d="M58,28.5 L55,40" stroke="${K.cream}" stroke-width="1.2"/>`,
    lips: '#6b4034',
  },
  // Thin, long-armed; grey comb-over; brown porter's dust coat; white cotton gloves.
  harris: {
    skin: 'pale', accent: 'cream', head: { ...HEAD_DEFAULT, top: 18, back: 35, fore: 64, chinY: 69, chinX: 57, jawX: 45, jawY: 63, nose: 71, noseY: 48 },
    clothes: () => `
      <path d="M12,100 L16,84 C24,78 34,76 42,75 L60,75 C71,76 80,80 86,87 L88,100Z" fill="#6d5227"/>
      <path d="M42,75 L50,86 L58,75Z" fill="${K.cream}"/><path d="M47,80 L53,80 L51,86Z" fill="${K.ink}"/>
      <path d="M42,75 L34,78 L42,100 L48,100Z" fill="#5a4220"/><path d="M58,75 L66,78 L58,100 L52,100Z" fill="#826230"/>`,
    back: `<path d="M34,34 C32,42 33,50 36,54 L39,52 L39,36Z" fill="${K.creamDim}"/>`,
    front: `<path d="M35,30 C44,22 56,20 66,24 L66,26 C56,23 45,25 36,33Z" fill="${K.creamDim}"/>
      <path d="M37,29 C46,23 56,22 65,25 M36,32 C44,26 52,24 60,24" stroke="${K.cream2}" stroke-width=".7" fill="none"/>`,
    extra: '', lips: '#6b4034', lines: true,
  },
  // Slight, oil-streaked; short curly hair under a red bandana; oversized coveralls, sleeves tied; torque wrench on her shoulder.
  mia: {
    skin: 'tan', accent: 'teal', head: { ...HEAD_DEFAULT, top: 21, fore: 64, chinY: 66, chinX: 57, jawX: 45, jawY: 61, nose: 70 },
    clothes: () => `
      <path d="M4,100 L9,84 C18,77 31,74 42,74 L60,74 C72,75 84,80 92,88 L96,100Z" fill="${K.t4}"/>
      <path d="M42,74 L50,84 L59,74Z" fill="${K.ink3}"/><path d="M50,84 L50,100" stroke="${K.t6}" stroke-width="1.6"/>
      <path d="M36,78 h9 v7 h-9Z" fill="none" stroke="${K.t6}" stroke-width="1.2"/><path d="M14,96 C24,90 34,94 42,99" stroke="${K.t6}" stroke-width="3" fill="none"/>
      <path d="M68,76 L102,64 L103,69 L70,82Z" fill="${K.cream2}"/><path d="M68,76 L102,64" stroke="${K.creamDim}" stroke-width="1"/>
      <rect x="64" y="74" width="8" height="11" rx="2" fill="${K.ink}" transform="rotate(-20 68 79)"/>`,
    back: `<path d="M33,44 C28,40 29,34 32,32 C29,28 33,24 36,26 L40,46Z" fill="${K.ink}"/>`,
    front: `<path d="M31,31 C30,19 41,12 52,12 C63,12 71,18 70,29 C62,26 44,27 31,33Z" fill="#b23a2a"/>
      <path d="M34,27 C42,23 56,22 68,25" stroke="#d65a44" stroke-width="1.2" fill="none"/><circle cx="40" cy="20" r="1.2" fill="${K.cream}"/><circle cx="55" cy="17" r="1.2" fill="${K.cream}"/><circle cx="63" cy="22" r="1.2" fill="${K.cream}"/>
      <path d="M31,30 L24,36 L27,40 L33,33Z" fill="#8e2c1c"/>
      <path d="M33,33 C30,35 31,39 34,39 C32,42 34,46 37,45 L38,34Z" fill="${K.ink}"/><path d="M63,29 C66,30 67,33 65,34 C64,32 62,31 60,31Z" fill="${K.ink}"/>`,
    extra: `<path d="M53,45 C55,46 56,48 56.5,50" stroke="${K.ink}" stroke-width="1.3" stroke-linecap="round" opacity=".45"/>`,
    lips: '#5a3424',
  },
  // Generic uniformed silhouette; peaked cap.
  guard: {
    skin: 'warm', accent: 'cream', head: { ...HEAD_DEFAULT, top: 21 },
    clothes: () => `
      <path d="M2,100 L6,81 C16,74 30,72 40,72 L62,72 C76,73 88,78 96,86 L100,100Z" fill="${K.t7}"/>
      <path d="M41,72 L50,84 L60,72Z" fill="${K.cream2}"/><path d="M48,78 L52,78 L53,100 L47,100Z" fill="${K.ink}"/>
      <path d="M62,86 l3,-5 l3,5 l-1,4 l-2,2 l-2,-2Z" fill="${K.gold}"/>`,
    back: '',
    front: `<path d="M30,34 C28,18 40,10 52,10 C64,10 72,16 71,30 L31,36Z" fill="${K.t7}"/>
      <path d="M30,32 L71,28 L72,33 L31,37Z" fill="${K.ink}"/><path d="M56,31 L80,36 L76,40 L56,36Z" fill="${K.ink}"/>
      <path d="M48,16 l3,-4 l3,4 l-3,3Z" fill="${K.gold}"/>`,
    extra: '', lips: '#4a3024',
  },
};

const GENERIC = {
  skin: 'warm', accent: 'teal', head: HEAD_DEFAULT,
  clothes: () => `<path d="M4,100 L10,82 C20,74 32,72 42,72 L60,72 C74,73 86,78 94,86 L98,100Z" fill="${K.ink3}"/>
    <path d="M40,71 L30,60 L27,82 L44,96Z" fill="${K.t6}"/><path d="M61,71 L72,60 L76,82 L60,96Z" fill="${K.t5}"/>`,
  back: '',
  front: `<path d="M18,30 L84,26 L82,31 L20,35Z" fill="${K.ink}"/><path d="M32,30 C32,18 40,10 52,10 C62,10 70,16 70,28Z" fill="${K.ink}"/>
    <path d="M32,27 L70,24.5 L70,28 L32,30.5Z" fill="${K.t4}"/>`,
  extra: '', lips: '#4a3024', hatShadow: true,
};

/* ---------------- features by mood ---------------- */
function features(ch, mood, skin) {
  const line = skin[2];
  const ink = K.ink;
  const h = ch.head;
  const ey = h.noseY - 7.5; // eye line
  const e1 = [57, ey], e2 = [h.fore - 0.6, ey - 0.5]; // near eye, far eye (tucked against the bridge)
  let s = '';
  // eye sockets (shadow wedges) — graphic, not soft
  s += `<path d="M${e1[0] - 6},${ey - 3} L${e1[0] + 5},${ey - 4} L${e1[0] + 4},${ey + 2.5} L${e1[0] - 5},${ey + 2}Z" fill="${skin[1]}" opacity=".35"/>`;
  const eyeShape = (x, y, w, hgt, lid = 0) => `<path d="M${x - w},${y} Q${x},${y - hgt - lid} ${x + w},${y - 0.4} Q${x},${y + hgt * 0.7} ${x - w},${y}Z" fill="${ink}"/>`;
  const brow = (x, y, w, tilt, th = 2.2) => `<path d="M${x - w},${y + tilt} L${x + w},${y - tilt} L${x + w - 0.5},${y - tilt + th} L${x - w},${y + tilt + th * 0.7}Z" fill="${ch.browColor || ink}"/>`;
  const by = ey - 5.2;
  if (mood === 'shock') {
    s += `<ellipse cx="${e1[0]}" cy="${ey}" rx="3.6" ry="3.4" fill="${K.cream}"/><circle cx="${e1[0] + 0.8}" cy="${ey}" r="1.3" fill="${ink}"/>`;
    s += `<ellipse cx="${e2[0]}" cy="${e2[1]}" rx="1.6" ry="2.9" fill="${K.cream}"/><circle cx="${e2[0] + 0.3}" cy="${e2[1]}" r="1" fill="${ink}"/>`;
    s += brow(e1[0], by - 3.2, 4.4, 1.6) + brow(e2[0] + 0.5, by - 3.4, 2.6, -1.4, 1.8);
  } else if (mood === 'tense') {
    s += eyeShape(e1[0], ey + 0.5, 3.4, 1.1) + eyeShape(e2[0], e2[1] + 0.5, 1.5, 0.9);
    s += brow(e1[0], by + 1.4, 4.6, -1.8, 2.6) + brow(e2[0] + 0.3, by + 1.4, 2.6, 1.6, 2.2);
    s += `<path d="M${e1[0] + 3.5},${by - 1.5} l1.2,4" stroke="${line}" stroke-width=".8"/>`;
    s += `<path d="M${h.back + 6},${ey - 8} q-1.4,3 0,4.2 q1.4,-1.2 0,-4.2Z" fill="${K.cream}" opacity=".85"/>`;
  } else if (mood === 'smirk') {
    s += eyeShape(e1[0], ey, 3.4, 1.2, -0.6) + eyeShape(e2[0], e2[1], 1.5, 1.0, -0.4);
    s += `<path d="M${e1[0] - 3.8},${ey - 1.3} L${e1[0] + 3.6},${ey - 1.8}" stroke="${line}" stroke-width="1"/>`;
    s += brow(e1[0], by - 0.2, 4.4, 0.4) + brow(e2[0] + 0.3, by - 2.2, 2.6, 1.4, 1.9);
  } else {
    s += eyeShape(e1[0], ey, 3.4, 1.6) + eyeShape(e2[0], e2[1], 1.5, 1.4);
    s += brow(e1[0], by, 4.4, 0.6) + brow(e2[0] + 0.3, by - 0.3, 2.6, 0.4, 1.9);
  }
  // catch-lights
  if (mood !== 'shock') s += `<rect x="${e1[0] + 0.8}" y="${ey - 1.2}" width="1.1" height="1.1" fill="${K.cream}" opacity=".8"/>`;
  // nose shadow (hard wedge under the tip, on the lit side)
  s += `<path d="M${h.nose - 1},${h.noseY + 0.5} L${h.fore - 4},${h.noseY + 3.2} L${h.fore - 0.5},${h.noseY + 2.8}Z" fill="${skin[1]}" opacity=".75"/>`;
  // mouth
  const my = h.noseY + 8.4, mx = h.fore - 3;
  const lip = ch.lips || line;
  if (ch.beard !== 'full' || mood === 'shock') {
    if (mood === 'shock') s += `<path d="M${mx - 5.2},${my - 0.6} Q${mx - 2},${my - 2.2} ${mx + 1.6},${my - 0.8} Q${mx + 1.2},${my + 5.4} ${mx - 2.2},${my + 5.4} Q${mx - 5.2},${my + 4.8} ${mx - 5.2},${my - 0.6}Z" fill="${ink}"/><path d="M${mx - 4.4},${my - 0.3} Q${mx - 2},${my - 1.6} ${mx + 0.9},${my - 0.5} L${mx + 0.8},${my + 0.7} Q${mx - 2},${my - 0.1} ${mx - 4.3},${my + 1}Z" fill="${K.cream}" opacity=".9"/>`;
    else if (mood === 'smirk') s += `<path d="M${mx - 7},${my + 1.2} Q${mx - 3},${my + 2.2} ${mx + 1.4},${my - 1.8}" stroke="${lip}" stroke-width="1.8" fill="none" stroke-linecap="round"/><path d="M${mx + 1},${my - 3} l1.2,1" stroke="${line}" stroke-width=".8"/>`;
    else if (mood === 'tense') s += `<path d="M${mx - 6.5},${my + 1.6} L${mx + 1.2},${my + 0.6}" stroke="${lip}" stroke-width="2" stroke-linecap="round"/><path d="M${mx - 5},${my + 4} l5,-.6" stroke="${line}" stroke-width=".7" opacity=".7"/>`;
    else s += `<path d="M${mx - 6},${my + 0.6} Q${mx - 2.5},${my + 1.8} ${mx + 1.2},${my + 0.2}" stroke="${lip}" stroke-width="1.8" fill="none" stroke-linecap="round"/>`;
  } else {
    // beard: mouth reads as a dark cut in the beard
    if (mood === 'smirk') s += `<path d="M${mx - 7},${my + 1.5} Q${mx - 3},${my + 2.5} ${mx + 1},${my - 1}" stroke="#5a3a2a" stroke-width="1.6" fill="none"/>`;
    else if (mood === 'tense') s += `<path d="M${mx - 6.5},${my + 1.6} L${mx + 1},${my + 1}" stroke="#5a3a2a" stroke-width="1.6"/>`;
    else s += `<path d="M${mx - 6},${my + 1} Q${mx - 2.5},${my + 2.4} ${mx + 1},${my + 0.6}" stroke="#5a3a2a" stroke-width="1.5" fill="none"/>`;
  }
  if (ch.lines) s += `<path d="M${h.fore - 1},${h.noseY + 3} q-3,4 -3.5,8 M${e1[0] - 5},${ey + 3} l-3,1.5 M${e1[0] - 5},${by - 3} h7" stroke="${line}" stroke-width=".8" fill="none" opacity=".7"/>`;
  if (ch.glasses) {
    s += `<circle cx="${e1[0]}" cy="${ey}" r="5.6" fill="${K.t1}" fill-opacity=".16" stroke="${ink}" stroke-width="${ch.glasses === 'wire' ? 1.1 : 1.7}"/>`;
    s += `<ellipse cx="${e2[0] + 0.6}" cy="${e2[1]}" rx="3.2" ry="5" fill="${K.t1}" fill-opacity=".16" stroke="${ink}" stroke-width="${ch.glasses === 'wire' ? 1 : 1.5}"/>`;
    s += `<path d="M${e1[0] + 5.6},${ey - 0.6} L${e2[0] - 2.6},${e2[1] - 0.8} M${e1[0] - 5.6},${ey - 0.5} L${h.back + 8},${ey - 1.6}" stroke="${ink}" stroke-width="1.4"/>`;
    s += `<path d="M${e1[0] - 2.6},${ey - 3.4} l2.4,-.6" stroke="${K.cream}" stroke-width="1.1" opacity=".8"/>`;
  }
  return s;
}

/** Portrait markup in a 0..100 box. */
export function portraitMarkup(id, { mood = 'calm', bg = true, uid } = {}) {
  const ch = CHARS[id] || GENERIC;
  const u = uid || 'p' + Math.random().toString(36).slice(2, 8);
  const skin = SKIN[ch.skin] || SKIN.warm;
  const acc = ACCENT[CREW?.[id]?.accent] || ACCENT[ch.accent] || K.t2;
  const hp = headPath(ch.head);
  const h = ch.head;
  const nw = ch.neckW || 1;
  let s = `<defs>
    <pattern id="${u}ht" width="3.2" height="3.2" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><circle cx="1.6" cy="1.6" r="1.05" fill="${K.ink}"/></pattern>
    <pattern id="${u}st" width="1.6" height="1.6" patternUnits="userSpaceOnUse" patternTransform="rotate(30)"><circle cx=".8" cy=".8" r=".42" fill="${K.creamDim}"/></pattern>
    <pattern id="${u}hl" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><circle cx="2" cy="2" r=".9" fill="${acc}"/></pattern>
    <clipPath id="${u}hc"><path d="${hp}"/></clipPath>
    <clipPath id="${u}box"><rect width="100" height="100"/></clipPath>
  </defs>`;
  s += `<g clip-path="url(#${u}box)">`;
  if (bg) {
    s += `<rect width="100" height="100" fill="${K.ink2}"/>`;
    s += `<path d="M100,0 L100,70 L58,0Z" fill="${K.t8}"/>`;
    s += `<path d="M0,0 L44,0 L0,58Z" fill="url(#${u}hl)" opacity=".5"/>`;
    s += `<path d="M0,0 L30,0 L0,36Z" fill="${acc}" opacity=".16"/>`;
  }
  // rim silhouette behind (offset toward the back/left)
  const rim = `<g transform="translate(-2.2 -0.6)">
      <path d="M${48 - 7 * nw},${h.jawY - 6} L${48 + 9 * nw},${h.jawY - 2} L${50 + 10 * nw},84 L${46 - 9 * nw},84Z" fill="${acc}"/>
      <path d="${hp}" fill="${acc}"/>${recolor(ch.back, acc)}${recolor(ch.front, acc)}${recolor(ch.clothes(acc), acc)}</g>`;
  s += rim;
  s += ch.back || '';
  // neck: shadow tone with a lit strip on the key side
  s += `<path d="M${48 - 7 * nw},${h.jawY - 6} L${48 + 9 * nw},${h.jawY - 2} L${50 + 10 * nw},84 L${46 - 9 * nw},84Z" fill="${skin[1]}"/>`;
  s += `<path d="M${48 + 4 * nw},${h.jawY + 1} L${48 + 9 * nw},${h.jawY - 2} L${50 + 10 * nw},84 L${48 + 5 * nw},84Z" fill="${skin[0]}" opacity=".55"/>`;
  s += ch.clothes(acc);
  // head: lit skin, then split-light shadow with halftone + cheekbone wedge
  s += `<path d="${hp}" fill="${skin[0]}"/>`;
  s += `<g clip-path="url(#${u}hc)">
      <path d="M0,0 L51,0 C47,20 52,34 49,46 C47,56 51,64 55,80 L0,80Z" fill="${skin[1]}"/>
      <path d="M0,0 L51,0 C47,20 52,34 49,46 C47,56 51,64 55,80 L0,80Z" fill="url(#${u}ht)" opacity=".35"/>
      <path d="M51,${h.noseY + 1} L${h.fore - 7},${h.noseY + 4} L53,${h.noseY + 11}Z" fill="${skin[1]}" opacity=".55"/>
      <path d="M${h.fore - 8},${h.chinY - 3} L${h.fore + 4},${h.chinY - 8} L${h.fore + 4},${h.chinY + 4} L${h.fore - 10},${h.chinY + 4}Z" fill="${skin[1]}" opacity=".5"/>
    </g>`;
  // ear (shadow side)
  s += `<path d="M${h.back + 6},${h.noseY - 6} C${h.back + 1},${h.noseY - 7} ${h.back},${h.noseY + 3} ${h.back + 6},${h.noseY + 5}Z" fill="${skin[2]}" opacity=".7"/>`;
  s += beard(ch, h, u);
  s += features(ch, mood, skin);
  s += ch.front || '';
  s += ch.extra || '';
  s += `</g>`;
  return s;
}

/** Beards: 'trim' (white, close), 'stubble' (halftone grey), 'mous' (moustache only). */
function beard(ch, h, u) {
  const b = ch.beard;
  if (!b || b === 'full') return '';
  const my = h.noseY + 8.4, mx = h.fore - 3;
  const jaw = `M${h.back + 5},${h.noseY - 2} C${h.back + 4},${h.jawY + 2} ${h.jawX},${h.chinY + 1} ${h.chinX},${h.chinY + 1.5} C${h.chinX + 5},${h.chinY + 1} ${h.fore + 1},${h.chinY - 4} ${h.fore + 1.5},${h.noseY + 11} L${h.fore - 2},${h.noseY + 10.5} C${h.fore - 4},${h.noseY + 13.5} ${h.chinX - 2},${h.chinY - 3} ${h.jawX + 2},${h.jawY - 4} C${h.back + 9},${h.jawY - 8} ${h.back + 9},${h.noseY + 2} ${h.back + 8},${h.noseY - 2}Z`;
  const mous = (c) => `<path d="M${mx - 7},${my - 1.8} Q${mx - 3},${my - 3.6} ${mx + 1.6},${my - 1.4} L${mx + 1.4},${my - 0.1} Q${mx - 3},${my - 1.4} ${mx - 7.2},${my + 0.2}Z" fill="${c}"/>`;
  if (b === 'trim') return `<path d="${jaw}" fill="${K.cream2}"/><path d="${jaw}" fill="url(#${u}ht)" opacity=".18"/>` + mous(K.cream2);
  if (b === 'stubble') return `<path d="${jaw}" fill="url(#${u}st)" opacity=".85"/>` + `<path d="M${mx - 7},${my - 1.8} Q${mx - 3},${my - 3.6} ${mx + 1.6},${my - 1.4} L${mx + 1.4},${my - 0.1} Q${mx - 3},${my - 1.4} ${mx - 7.2},${my + 0.2}Z" fill="url(#${u}st)"/>`;
  if (b === 'mous') return `<path d="M${mx - 8},${my - 1.2} Q${mx - 3},${my - 4.4} ${mx + 2.2},${my - 1.2} L${mx + 2.6},${my + 1.4} Q${mx - 1},${my - 0.8} ${mx - 3},${my - 0.6} Q${mx - 5.5},${my - 0.8} ${mx - 8.4},${my + 1.8}Z" fill="${K.ink}"/>`;
  return '';
}

/** Solid silhouette of a portrait (for rim plates and backlit reveals). */
export function portraitSilhouette(id, color = K.ink, uid) {
  return recolor(portraitMarkup(id, { mood: 'calm', bg: false, uid }), color);
}

/** Recolour a markup fragment to a single fill (for the rim-light silhouette). */
function recolor(markup, color) {
  if (!markup) return '';
  return markup
    .replace(/fill="(?!none)[^"]*"/g, `fill="${color}"`)
    .replace(/stroke="(?!none)[^"]*"/g, `stroke="${color}"`)
    .replace(/fill="url\([^)]*\)"/g, `fill="${color}"`)
    .replace(/class="[^"]*"/g, '');
}

export function portrait(id, { mood = 'calm', size = 96, bg = true } = {}) {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 100 100');
  svg.setAttribute('width', size);
  svg.setAttribute('height', size);
  svg.setAttribute('class', `portrait portrait--${CHARS[id] ? id : 'generic'} portrait--${mood}`);
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', `${CREW?.[id]?.name || id} (${mood})`);
  svg.innerHTML = portraitMarkup(id, { mood, bg });
  return svg;
}
