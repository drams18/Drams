import { defineUniverse } from '../theme.js';
import { palette, fonts, vocabulary, camera, physics, audio, effects } from './theme.js';
import { player, npcs } from './character.js';
import { createLevel } from './world.js';
import { VilleRenderer } from './renderer.js';

export default defineUniverse({
  id: 'ville',
  name: 'VILLE',
  category: 'URBAIN',
  tagline: 'Une ville contemporaine à l\'heure dorée. Sobre et élégant.',
  palette, fonts, vocabulary, camera, physics, audio, effects,
  character: { player, npcs },
  createLevel,
  Renderer: VilleRenderer,
});
