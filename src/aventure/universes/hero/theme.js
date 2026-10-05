/* HAUTE VOLTIGE · HÉROÏQUE : l'aube sur la ville, de la rue jusqu'aux toits.
   Ambiance d'après le thème de « The Amazing Spider-Man 2 » (Hans Zimmer) :
   fanfare lumineuse, pulsation électrique. Identité originale : bleu roi,
   rouge vif, bleu électrique, or des cuivres. */

export const palette = {
  bg: '#07142e',
  surface: 'rgba(8, 20, 48, 0.94)',
  surface2: '#12295c',
  text: '#f4f7ff',
  muted: '#9fb2d8',
  line: 'rgba(63, 200, 255, 0.24)',
  primary: '#ff4d4d',       // rouge vif : ce qui s'actionne
  onPrimary: '#16040a',
  accent: '#3fc8ff',        // bleu électrique : ce qui se découvre
};

export const fonts = {
  canvas: '"Inter Variable", Inter, system-ui, sans-serif',
  display: '"Inter Variable", Inter, system-ui, sans-serif',
  weight: '900',
  style: 'italic',
  spacing: '0.01em',
  radius: '3px',
};

export const vocabulary = {
  locations: { profile: 'PROFIL', parcours: 'ORIGIN STORY', contact: 'CONTACT', projets: 'GALERIE' },
  hints: { profile: 'Identité', parcours: 'Mon parcours', contact: 'Le signal', projets: 'Mes projets' },
  objective: 'MISSION',
  skills: 'POUVOIRS',
  skill: 'Pouvoir',
  skillFound: 'POUVOIR DÉBLOQUÉ',
  experiences: 'ORIGIN STORY',
};

// Caméra dynamique et verticale : cadre large, suit vite la montée sur les toits.
export const camera = { lerpX: 7.5, lerpY: 7, deadX: 40, deadY: 46, lookAhead: 110, anchorY: 0.66, zoom: 0.92, shake: 1.3 };

export const physics = { maxSpeed: 305, accel: 2300, friction: 2500, airControl: 0.8, gravity: 1800, jumpVelocity: 720 };

export const audio = {
  track: '/sounds/aventure/hero.mp3',   // facultatif : sans fichier, le synthé ci-dessous joue
  // Accord majeur cuivré (ré majeur) + ostinato électrique + vent des toits.
  pad: { notes: [73.42, 110, 146.83, 185], type: 'sawtooth', gain: 0.03, lfo: 0.12, filter: 900 },
  pulse: { note: 146.83, rate: 4, gain: 0.04 },
  noise: { type: 'lowpass', freq: 600, gain: 0.02 },
  sfx: { wave: 'square', base: 660 },
};

export const effects = { sharp: true, dust: '#9fb2d8' };
