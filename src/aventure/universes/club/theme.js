/* ARPHAN CLUB · MATURE : sous-sols, béton, néons blafards. Thriller urbain,
   sobre et contrasté. Identité originale, aucune violence montrée. */

export const palette = {
  bg: '#0b0c0b',
  surface: 'rgba(17, 18, 16, 0.96)',
  surface2: '#22241f',
  text: '#e8e3d5',
  muted: '#9b978a',
  line: 'rgba(232, 227, 213, 0.18)',
  primary: '#dfe9c6',       // blanc néon : ce qui s'actionne
  onPrimary: '#10110e',
  accent: '#d1483b',        // rouge tampon : ce qui se découvre
};

export const fonts = {
  canvas: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace',
  display: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace',
  weight: '700',
  spacing: '0.08em',
  radius: '0px',
};

export const vocabulary = {
  locations: { profile: 'PROFIL', parcours: 'CASE FILES', contact: 'CONTACT', projets: 'DOSSIERS' },
  hints: { profile: 'Le sujet', parcours: 'Parcours et expériences', contact: 'Ligne directe', projets: 'Mes projets' },
  objective: 'MISSION',
  placeFound: 'LIEU IDENTIFIÉ',
  skills: 'OUTILS',
  skill: 'Outil',
  skillFound: 'OUTIL RÉCUPÉRÉ',
  projects: 'DOSSIERS',
  experiences: 'EXPÉRIENCES',
};

// Caméra lente, serrée, cinématique.
export const camera = { lerpX: 3, lerpY: 3, deadX: 74, deadY: 70, lookAhead: 46, anchorY: 0.76, zoom: 1.08, shake: 0.9, zoomLerp: 3 };

// Mouvements plus lourds.
export const physics = { maxSpeed: 200, accel: 1100, friction: 1500, airControl: 0.5, gravity: 1900, jumpVelocity: 585 };

export const audio = {
  // Bourdon grave + ronflement des néons.
  pad: { notes: [41.2, 61.74, 82.41], type: 'triangle', gain: 0.06, lfo: 0.04 },
  hum: { freq: 120, gain: 0.012 },
  noise: { type: 'bandpass', freq: 900, gain: 0.012 },
  sfx: { wave: 'triangle', base: 300 },
};

export const effects = { grain: true, sharp: true, dust: '#7d7a70' };
