/* ARPHAN CLUB : parking souterrain → quai de chargement → entrepôt.
   Des caisses et un quai (solides, avec murs) et une passerelle. Un conduit
   bas au-dessus du quai fait plafond. */

import { solid, platform } from '../../world/Platform.js';

export function createLevel() {
  return {
    width: 3900,
    top: -420,
    spawn: { x: 200, y: 0 },
    solids: [
      solid(860, -44, 74, 44, 'crate'),
      solid(1500, -30, 60, 30, 'step'),
      solid(1560, -60, 900, 60, 'dock'),
      solid(2460, -30, 60, 30, 'step'),
      solid(2250, -210, 150, 22, 'duct'),
      solid(3010, -44, 74, 44, 'crate'),
      solid(-400, -900, 5000, 560, 'ceiling'),
    ],
    platforms: [
      platform(2030, -140, 190, 'catwalk'),
    ],
    locations: [
      { id: 'profile', x: 410, w: 220, h: 220, doorX: 520, style: 'steel' },
      { id: 'contact', x: 1090, w: 200, h: 210, doorX: 1190, style: 'phone' },
      { id: 'parcours', x: 1690, w: 250, h: 200, baseY: -60, doorX: 1815, style: 'archive' },
      { id: 'projets', x: 2640, w: 300, h: 230, doorX: 2790, style: 'shutter' },
    ],
    portal: { x: 3520, w: 250, h: 270, doorX: 3645, style: 'lift' },
    collectibles: [
      { skill: 'react', x: 720, y: -34 },
      { skill: 'typescript', x: 897, y: -80 },
      { skill: 'nextjs', x: 1390, y: -34 },
      { skill: 'nodejs', x: 1640, y: -96 },
      { skill: 'nestjs', x: 2125, y: -176 },
      { skill: 'symfony', x: 2330, y: -96 },
      { skill: 'postgresql', x: 3047, y: -82 },
      { skill: 'docker', x: 3400, y: -100 },
    ],
    npcs: [
      { x0: 1320, x1: 1450, y: 0 },
      { x0: 3140, x1: 3290, y: 0 },
    ],
    zones: [
      { name: 'Parking · niveau -2', x0: 0, x1: 1500 },
      { name: 'Quai de chargement', x0: 1500, x1: 2520 },
      { name: 'Entrepôt', x0: 2520, x1: 4000 },
    ],
    decor: {
      tubes: [180, 560, 940, 1320, 1700, 2080, 2460, 2840, 3220, 3600],
      flicker: [2, 6],                       // néons défaillants
      pillars: [300, 1000, 1700, 2450, 3150, 3850],
      cars: [680, 1300, 3260],
    },
  };
}
