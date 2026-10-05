/* ══════════════════════════════════════════════════════
   ROOMS.JS : le décor d'une étape, dans l'univers en cours

   Une étape = un niveau de plain-pied bâti avec les MÊMES pièces que
   l'univers du mode aventure : ses lieux (un par réponse), son portail
   (la sortie : retour au portfolio ou étape précédente) et son décor.
   Rien n'est redessiné ici : c'est le renderer de l'univers qui dessine.
   ══════════════════════════════════════════════════════ */

import { solid } from '../aventure/world/Platform.js';
import { doorId } from './steps.js';

// Par univers : les styles de lieux [style, largeur, hauteur], le portail, l'écart.
const KITS = {
  ville: {
    styles: [['studio', 300, 310], ['station', 340, 220], ['gallery', 400, 270], ['cafe', 260, 200]],
    portal: { w: 300, h: 360, style: 'site' },
    gap: 74,
  },
  hero: {
    styles: [['base', 270, 230], ['beacon', 230, 200], ['tower', 250, 190], ['holo', 300, 200]],
    portal: { w: 220, h: 300, style: 'gate' },
    gap: 96,
  },
  club: {
    styles: [['hall', 250, 220], ['bell', 250, 210], ['library', 260, 200], ['curtain', 300, 230]],
    portal: { w: 250, h: 270, style: 'doors' },
    gap: 84,
  },
};

const PORTAL_X = 70;
const HERO_SIGNS = [
  { text: 'VOTRE PROJET', color: '#3fc8ff', w: 190 }, { text: 'PARIS', color: '#ffd27a', w: 110 },
  { text: 'WEB', color: '#ff4d4d', w: 100 }, { text: 'SUR MESURE', color: '#3fc8ff', w: 170 },
];

function decor(id, width, gaps) {
  if (id === 'hero') {
    // Immeubles en toile de fond (on reste dans la rue) et enseignes.
    const roofs = [], signs = [];
    for (let x = 30, i = 0; x < width - 200; x += 660, i++) {
      const y = i % 2 ? -600 : -520;
      roofs.push({ x, w: 560, y });
      const s = HERO_SIGNS[i % HERO_SIGNS.length];
      signs.push({ ...s, x: x + 280 - s.w / 2, y: y + 150 });
    }
    return { roofs, signs };
  }
  if (id === 'club') {
    const chandeliers = [];
    for (let x = 180; x < width; x += 380) chandeliers.push(x);
    // Pas de colonnes au premier plan ici : elles masqueraient le libellé des portes.
    return { chandeliers, flicker: [2, 6], pillars: [], braziers: gaps.filter((g, i) => i % 3 === 1).map(g => g - 95) };
  }
  // Ville : un lampadaire ou un arbre entre deux adresses, des immeubles aux deux bouts.
  return {
    blocks: [{ x: width - 250, w: 220, h: 270, tone: 1 }],
    lamps: gaps.filter((g, i) => i % 2 === 0),
    trees: gaps.filter((g, i) => i % 2 === 1),
  };
}

// step : une entrée de STEPS ; index : son rang (identifiants des portes).
export function createRoom(universeId, step, index) {
  const id = KITS[universeId] ? universeId : 'ville';
  const kit = KITS[id];
  const portal = { ...kit.portal, x: PORTAL_X, doorX: PORTAL_X + kit.portal.w / 2 };
  const spawnX = portal.x + portal.w + 120;

  const locations = [], gaps = [spawnX];
  let x = spawnX + 120;
  step.doors.forEach((door, i) => {
    const [style, w, h] = kit.styles[(i + index) % kit.styles.length];
    if (i) gaps.push(x - kit.gap / 2);
    locations.push({ id: doorId(index, i), x, w, h, doorX: x + w / 2, style });
    x += w + kit.gap;
  });
  const width = x + 260;

  return {
    width,
    top: -760,
    spawn: { x: spawnX, y: 0 },
    // Le palais a un plafond bas, comme dans l'aventure.
    solids: id === 'club' ? [solid(-400, -900, width + 800, 560, 'ceiling')] : [],
    platforms: [],
    locations,
    portal,
    collectibles: [],
    npcs: [{ x0: width - 230, x1: width - 90, y: 0 }],
    zones: [],
    decor: decor(id, width, gaps),
  };
}
