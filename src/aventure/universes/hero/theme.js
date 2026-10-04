/* ARPHAN-MAN · HÉROÏQUE : nuit, pluie, néons et toits. Identité originale :
   indigo profond, visière et écharpe jaune acide, enseignes magenta. */

export const palette = {
  bg: '#0b0920',
  surface: 'rgba(15, 11, 40, 0.94)',
  surface2: '#1d1650',
  text: '#f3f0ff',
  muted: '#a79fd0',
  line: 'rgba(215, 255, 62, 0.22)',
  primary: '#d7ff3e',       // jaune acide : ce qui s'actionne
  onPrimary: '#12130a',
  accent: '#ff4fa3',        // magenta : ce qui se découvre
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
  // Basse pulsée + pluie.
  pad: { notes: [55, 110, 164.81], type: 'sawtooth', gain: 0.03, lfo: 0.12, filter: 520 },
  pulse: { note: 110, rate: 2.2, gain: 0.05 },
  noise: { type: 'highpass', freq: 2600, gain: 0.03 },
  sfx: { wave: 'square', base: 660 },
};

export const effects = { rain: true, sharp: true, dust: '#8f86c8' };
