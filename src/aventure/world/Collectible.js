/* COLLECTIBLE.JS : une compétence à ramasser dans le monde. */

const RADIUS = 18;

export class Collectible {
  constructor(def, skill) {
    this.id = def.skill;
    this.skill = skill;
    this.x = def.x;
    this.y = def.y;          // centre
    this.taken = false;
    this.seed = def.x * 0.013;
    this.fade = 0;           // 0 visible → 1 disparu (après ramassage)
  }

  // Le corps du personnage (boîte) touche-t-il le collectible ?
  touches(c) {
    if (this.taken) return false;
    const dx = Math.max(Math.abs(this.x - c.x) - c.w / 2, 0);
    const cy = c.y - c.h / 2;
    const dy = Math.max(Math.abs(this.y - cy) - c.h / 2, 0);
    return dx * dx + dy * dy <= RADIUS * RADIUS;
  }
}
