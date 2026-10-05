import { defineUniverse } from '../theme.js';
import { palette, fonts, vocabulary, camera, physics, audio, effects } from './theme.js';
import { player, npcs } from './character.js';
import { createLevel } from './world.js';
import { ClubRenderer } from './renderer.js';

export default defineUniverse({
  id: 'club',
  name: 'LE PALAIS',
  category: 'MATURE',
  tagline: 'Un palais la nuit : marbre sombre, or et bougies. Lent, solennel, presque sacré.',
  palette, fonts, vocabulary, camera, physics, audio, effects,
  character: { player, npcs },
  createLevel,
  Renderer: ClubRenderer,
});
