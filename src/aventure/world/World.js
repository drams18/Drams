/* ══════════════════════════════════════════════════════
   WORLD.JS : le niveau en cours de jeu
   Relie le Level à son monde de collisions et fait vivre ce qui bouge
   sans le joueur (passants, portes, collectibles). Ne connaît ni le
   rendu ni l'interface : Game écoute ses évènements.
   ══════════════════════════════════════════════════════ */

import { CollisionWorld } from '../core/Collision.js';

const damp = (rate, dt) => 1 - Math.exp(-rate * dt);

export class World {
  constructor(level) {
    this.level = level;
    this.collision = new CollisionWorld({
      solids: level.solids, platforms: level.platforms, minX: 0, maxX: level.width,
    });
    this.onCollect = null;     // (collectible)
    this.onSpeak = null;       // (npc)
    this.speaker = null;       // passant en train de parler
  }

  // Reporte la sauvegarde sur le niveau (lieux visités, compétences prises).
  restore(save) {
    for (const l of this.level.locations) l.visited = save.hasVisited(l.id);
    for (const c of this.level.collectibles) { c.taken = save.hasSkill(c.id); c.fade = c.taken ? 1 : 0; }
    this.level.portal.boost = save.data.missionComplete;
  }

  // opened : lieu dont la porte doit rester ouverte (entrée en cours / fenêtre ouverte).
  update(dt, player, playing, opened) {
    const lv = this.level;

    for (let i = 0; i < lv.interactables.length; i++) {
      const l = lv.interactables[i];
      l.open += ((l === opened ? 1 : 0) - l.open) * damp(9, dt);
    }

    for (let i = 0; i < lv.collectibles.length; i++) {
      const c = lv.collectibles[i];
      if (c.taken) { if (c.fade < 1) c.fade = Math.min(1, c.fade + dt * 4); continue; }
      if (playing && c.touches(player)) {
        c.taken = true;
        if (this.onCollect) this.onCollect(c);
      }
    }

    let speaker = null;
    for (let i = 0; i < lv.npcs.length; i++) {
      const n = lv.npcs[i];
      if (n.update(dt, playing ? player : null) && this.onSpeak) this.onSpeak(n);
      if (n.near) speaker = n;
    }
    this.speaker = speaker;
  }
}
