import { defineUniverse } from '../theme.js';
import { palette, fonts, vocabulary, camera, physics, audio, effects } from './theme.js';
import { player, npcs } from './character.js';
import { createLevel } from './world.js';
import { HeroRenderer } from './renderer.js';

export default defineUniverse({
  id: 'hero',
  name: 'ARPHAN-MAN',
  category: 'HÉROÏQUE',
  tagline: 'La nuit, la pluie, les néons. De la rue jusqu\'aux toits.',
  palette, fonts, vocabulary, camera, physics, audio, effects,
  character: { player, npcs },
  createLevel,
  Renderer: HeroRenderer,
});
