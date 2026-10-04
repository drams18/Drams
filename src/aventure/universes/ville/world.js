/* VILLE : une rue, quatre adresses, un chantier au bout. Niveau plat, quelques
   abris et un échafaudage pour le saut. */

import { platform } from '../../world/Platform.js';

export function createLevel() {
  return {
    width: 4200,
    top: -900,
    spawn: { x: 240, y: 0 },
    solids: [],
    platforms: [
      platform(960, -88, 150, 'shelter'),
      platform(1880, -96, 130, 'kiosk'),
      platform(3470, -92, 170, 'scaffold'),
      platform(3560, -184, 130, 'scaffold'),
    ],
    locations: [
      { id: 'profile', x: 520, w: 300, h: 310, doorX: 670, style: 'studio' },
      { id: 'parcours', x: 1330, w: 340, h: 220, doorX: 1500, style: 'station' },
      { id: 'projets', x: 2230, w: 420, h: 270, doorX: 2440, style: 'gallery' },
      { id: 'contact', x: 3080, w: 250, h: 200, doorX: 3205, style: 'cafe' },
    ],
    portal: { x: 3720, w: 300, h: 360, doorX: 3870, style: 'site' },
    collectibles: [
      { skill: 'react', x: 380, y: -34 },
      { skill: 'typescript', x: 1035, y: -124 },
      { skill: 'nextjs', x: 1200, y: -34 },
      { skill: 'nodejs', x: 1945, y: -132 },
      { skill: 'nestjs', x: 2110, y: -34 },
      { skill: 'symfony', x: 2860, y: -92 },
      { skill: 'postgresql', x: 3400, y: -34 },
      { skill: 'docker', x: 3625, y: -220 },
    ],
    npcs: [
      { x0: 1720, x1: 1850, y: 0 },
      { x0: 2900, x1: 3030, y: 0 },
    ],
    zones: [
      { name: 'Quartier des ateliers', x0: 0, x1: 1150 },
      { name: 'Station', x0: 1150, x1: 2050 },
      { name: 'Rue des galeries', x0: 2050, x1: 2950 },
      { name: 'Place du café', x0: 2950, x1: 3560 },
      { name: 'Le chantier', x0: 3560, x1: 4300 },
    ],
    decor: {
      blocks: [
        { x: 40, w: 300, h: 250, tone: 0 }, { x: 860, w: 90, h: 0 },
        { x: 1130, w: 170, h: 280, tone: 1 }, { x: 1700, w: 160, h: 240, tone: 2 },
        { x: 2030, w: 180, h: 300, tone: 0 }, { x: 2680, w: 370, h: 260, tone: 1 },
        { x: 3350, w: 110, h: 230, tone: 2 }, { x: 4040, w: 200, h: 270, tone: 0 },
      ].filter(b => b.h > 0),
      lamps: [150, 880, 1280, 1890, 2200, 2700, 3060, 3380, 4060],
      trees: [430, 1690, 2670, 3345],
    },
  };
}
