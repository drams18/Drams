/* VILLE · URBAIN : une ville contemporaine à l'heure dorée. Élégant, calme, lisible. */

export const palette = {
  bg: '#101728',
  surface: 'rgba(18, 25, 44, 0.94)',
  surface2: '#1d2845',
  text: '#f4f1ea',
  muted: '#aab1c6',
  line: 'rgba(244, 241, 234, 0.16)',
  primary: '#ffb454',       // ambre : ce qui s'actionne
  onPrimary: '#1b1407',
  accent: '#5fd4c4',        // turquoise : ce qui se découvre
};

export const fonts = {
  canvas: '"Inter Variable", Inter, system-ui, sans-serif',
  display: '"Inter Variable", Inter, system-ui, sans-serif',
  weight: '650',
  spacing: '0.02em',
  radius: '14px',
};

export const vocabulary = {
  locations: { profile: 'PROFIL', parcours: 'PARCOURS', contact: 'CONTACT', projets: 'GALERIE' },
};

// Caméra naturelle et stable.
export const camera = { lerpX: 5.5, lerpY: 4.5, deadX: 56, deadY: 80, lookAhead: 64, anchorY: 0.74, zoom: 1, shake: 0.6 };

export const physics = { maxSpeed: 250, accel: 1700, friction: 2100, gravity: 1750, jumpVelocity: 630 };

export const audio = {
  // Nappe douce + rumeur de ville.
  pad: { notes: [146.83, 220, 293.66, 369.99], type: 'sine', gain: 0.05, lfo: 0.07 },
  noise: { type: 'lowpass', freq: 420, gain: 0.035 },
  sfx: { wave: 'sine', base: 520 },
};

export const effects = { dust: '#cfc7ba' };
