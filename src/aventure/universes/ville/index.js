import { defineUniverse } from '../theme.js';
import { palette, fonts, vocabulary, camera, physics, audio, effects } from './theme.js';
import { player, npcs } from './character.js';
import { createLevel } from './world.js';
import { VilleRenderer } from './renderer.js';

export default defineUniverse({
  id: 'ville',
  name: 'VILLE',
  category: 'URBAIN',
  tagline: 'Une petite ville tranquille en fin de journée. On s\'y promène, on pousse les portes.',
  palette, fonts, vocabulary, camera, physics, audio, effects,
  character: { player, npcs },
  createLevel,
  Renderer: VilleRenderer,
});
