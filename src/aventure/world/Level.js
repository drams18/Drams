/* ══════════════════════════════════════════════════════
   LEVEL.JS : un niveau, construit depuis la description d'un univers

   def (universes/<id>/world.js) :
     { width, top, spawn: {x, y},
       solids: [], platforms: [],
       locations: [{ id, x, w, h, baseY, doorX }], portal: {...},
       collectibles: [{ skill, x, y }],
       npcs: [{ x0, x1, y, look }],
       zones: [{ name, x0, x1, y0?, y1? }],
       decor: {...} }                 // libre, lu par le renderer de l'univers
   ══════════════════════════════════════════════════════ */

import { solid } from './Platform.js';
import { Location } from './Location.js';
import { Collectible } from './Collectible.js';
import { NPC } from './NPC.js';

export const LOCATION_ORDER = ['profile', 'parcours', 'projets', 'contact'];

export class Level {
  constructor(def, universe, portfolio, npcLines) {
    this.width = def.width;
    this.top = def.top;
    this.spawn = def.spawn;
    this.decor = def.decor || {};
    this.zones = def.zones || [];

    // Le sol de la rue : un solide, comme le reste.
    this.ground = solid(-400, 0, def.width + 800, 800, 'ground');
    this.solids = [this.ground, ...(def.solids || [])];
    this.platforms = def.platforms || [];

    const v = universe.vocabulary, pal = universe.palette;
    this.locations = def.locations.map(l => new Location(l, v.locations[l.id], pal.accent));
    this.portal = new Location({ ...def.portal, id: 'portal', portal: true, href: '/construire-projet' }, v.portal, pal.primary);
    this.interactables = [...this.locations, this.portal];

    this.collectibles = def.collectibles
      .map(c => new Collectible(c, portfolio.skill(c.skill)))
      .filter(c => c.skill);
    this.npcs = (def.npcs || []).map((n, i) => new NPC({ ...n, lines: npcLines[i % npcLines.length] }));
  }

  location(id) {
    return this.interactables.find(l => l.id === id) || null;
  }

  // Lieux dans l'ordre de visite conseillé (objectif courant).
  get ordered() {
    return LOCATION_ORDER.map(id => this.location(id)).filter(Boolean);
  }

  nearest(c) {
    for (let i = 0; i < this.interactables.length; i++) {
      if (this.interactables[i].isNear(c)) return this.interactables[i];
    }
    return null;
  }

  hit(wx, wy) {
    for (let i = 0; i < this.interactables.length; i++) {
      if (this.interactables[i].contains(wx, wy)) return this.interactables[i];
    }
    return null;
  }

  zoneAt(x, y) {
    for (let i = 0; i < this.zones.length; i++) {
      const z = this.zones[i];
      if (x >= z.x0 && x < z.x1 && (z.y1 == null || y <= z.y1) && (z.y0 == null || y > z.y0)) return z.name;
    }
    return '';
  }
}
