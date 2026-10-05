/* LE PALAIS · MATURE : un palais la nuit, marbre sombre, or et bougies.
   Ambiance d'après « In the Palace ~ Lamentoso / Agitato » (Hunter x Hunter) :
   solennelle, lente, tragique. Identité originale, aucune violence montrée. */

export const palette = {
  bg: '#0c0a10',
  surface: 'rgba(18, 14, 22, 0.96)',
  surface2: '#261d2e',
  text: '#efe6d2',
  muted: '#a89c8c',
  line: 'rgba(217, 181, 106, 0.22)',
  primary: '#d9b56a',       // or : ce qui s'actionne
  onPrimary: '#16100a',
  accent: '#d95a70',        // cramoisi du sceau : ce qui se découvre
};

const SERIF = '"Iowan Old Style", "Palatino Linotype", Palatino, "Book Antiqua", Georgia, serif';

export const fonts = {
  canvas: SERIF,
  display: SERIF,
  weight: '700',
  spacing: '0.06em',
  radius: '2px',
};

export const vocabulary = {
  locations: { profile: 'PROFIL', parcours: 'CHRONIQUES', contact: 'CONTACT', projets: 'COLLECTION' },
  hints: { profile: 'L\'hôte', parcours: 'Parcours et expériences', contact: 'Demander audience', projets: 'Mes projets' },
  objective: 'QUÊTE',
  places: 'SALLES',
  placeFound: 'SALLE OUVERTE',
  skills: 'ATOUTS',
  skill: 'Atout',
  skillFound: 'ATOUT OBTENU',
  projects: 'COLLECTION',
  experiences: 'CHRONIQUES',
};

// Caméra lente, serrée, cinématique.
export const camera = { lerpX: 3, lerpY: 3, deadX: 74, deadY: 70, lookAhead: 46, anchorY: 0.76, zoom: 1.08, shake: 0.9, zoomLerp: 3 };

// Mouvements plus lourds.
export const physics = { maxSpeed: 200, accel: 1100, friction: 1500, airControl: 0.5, gravity: 1900, jumpVelocity: 585 };

export const audio = {
  track: '/sounds/aventure/club.mp3',   // facultatif : sans fichier, le synthé ci-dessous joue
  // Accord d'orgue grave (do mineur) + souffle de la grande salle.
  pad: { notes: [65.41, 98, 130.81, 155.56], type: 'triangle', gain: 0.06, lfo: 0.04 },
  noise: { type: 'lowpass', freq: 300, gain: 0.012 },
  sfx: { wave: 'triangle', base: 392 },
};

export const effects = { grain: true, sharp: true, dust: '#8a7f8c' };
