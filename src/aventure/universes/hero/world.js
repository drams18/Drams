/* HAUTE VOLTIGE : deux niveaux, la RUE puis les TOITS. Trois escaliers de secours
   montent aux toits ; les toits s'enchaînent par des sauts. Une chute ramène
   simplement à la rue (aucun danger), et ↓ + saut redescend d'un étage. */

import { platform } from '../../world/Platform.js';

// Escalier de secours : paliers alternés tous les 110 u jusqu'au toit.
function escape(x, top, flip) {
  const steps = [];
  for (let y = -110, i = 0; y > top + 40; y -= 110, i++) {
    steps.push(platform(x + ((i % 2 === 0) !== !!flip ? 0 : 40), y, 76, 'escape'));
  }
  return steps;
}

export function createLevel() {
  const roofs = [
    { x: 980, w: 520, y: -520 },
    { x: 1620, w: 520, y: -600 },
    { x: 2260, w: 440, y: -520 },
    { x: 2810, w: 590, y: -620 },
    { x: 3520, w: 380, y: -450 },
  ];
  return {
    width: 4400,
    top: -1500,
    spawn: { x: 220, y: 0 },
    solids: [],
    platforms: [
      ...roofs.map(r => platform(r.x, r.y, r.w, 'roof')),
      ...escape(864, -520, false),
      ...escape(2144, -520, true),
      ...escape(3900, -450, false),
    ],
    locations: [
      { id: 'profile', x: 370, w: 270, h: 230, doorX: 505, style: 'base' },
      { id: 'contact', x: 1550, w: 170, h: 200, doorX: 1635, style: 'beacon' },
      { id: 'parcours', x: 1770, w: 230, h: 190, baseY: -600, doorX: 1885, style: 'tower' },
      { id: 'projets', x: 2970, w: 300, h: 200, baseY: -620, doorX: 3120, style: 'holo' },
    ],
    portal: { x: 4090, w: 220, h: 300, doorX: 4200, style: 'gate' },
    collectibles: [
      { skill: 'react', x: 700, y: -34 },
      { skill: 'typescript', x: 902, y: -146 },
      { skill: 'nextjs', x: 1250, y: -554 },
      { skill: 'nodejs', x: 1560, y: -640 },
      { skill: 'nestjs', x: 2060, y: -634 },
      { skill: 'symfony', x: 2490, y: -554 },
      { skill: 'postgresql', x: 3330, y: -654 },
      { skill: 'docker', x: 3710, y: -540 },
    ],
    npcs: [
      { x0: 1180, x1: 1400, y: 0 },
      { x0: 2330, x1: 2440, y: -520 },
    ],
    zones: [
      { name: 'Les toits', x0: 0, x1: 5000, y1: -300 },
      { name: 'La rue', x0: 0, x1: 5000 },
    ],
    decor: {
      roofs,
      signs: [
        { x: 1090, y: -300, w: 150, text: 'FULL STACK', color: '#3fc8ff' },
        { x: 2330, y: -250, w: 110, text: 'PARIS', color: '#ffd27a' },
        { x: 3000, y: -330, w: 130, text: 'WEB', color: '#ff4d4d' },
        { x: 3590, y: -220, w: 120, text: 'CODE', color: '#3fc8ff' },
      ],
    },
  };
}
