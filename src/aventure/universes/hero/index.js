import { defineUniverse } from '../theme.js';
import { palette, fonts, vocabulary, camera, physics, audio, effects } from './theme.js';
import { player, npcs } from './character.js';
import { createLevel } from './world.js';
import { HeroRenderer } from './renderer.js';

export default defineUniverse({
  id: 'hero',
  name: 'HAUTE VOLTIGE',
  category: 'HÉROÏQUE',
  tagline: 'L\'aube se lève sur la ville. De l\'élan, des cuivres, et les toits pour terrain de jeu.',
  palette, fonts, vocabulary, camera, physics, audio, effects,
  character: { player, npcs },
  createLevel,
  Renderer: HeroRenderer,
});
