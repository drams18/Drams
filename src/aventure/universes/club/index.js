import { defineUniverse } from '../theme.js';
import { palette, fonts, vocabulary, camera, physics, audio, effects } from './theme.js';
import { player, npcs } from './character.js';
import { createLevel } from './world.js';
import { ClubRenderer } from './renderer.js';

export default defineUniverse({
  id: 'club',
  name: 'ARPHAN CLUB',
  category: 'MATURE',
  tagline: 'Sous-sols, béton, néons blafards. Un thriller urbain, sobre.',
  palette, fonts, vocabulary, camera, physics, audio, effects,
  character: { player, npcs },
  createLevel,
  Renderer: ClubRenderer,
});
