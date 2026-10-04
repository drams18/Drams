/* ══════════════════════════════════════════════════════
   NPC.JS : un passant
   Arpente un segment ; quand le joueur approche, il s'arrête, se tourne
   vers lui et dit une phrase (la suivante à la prochaine rencontre).
   Même physique simplifiée et même rendu que le joueur.
   ══════════════════════════════════════════════════════ */

import { Character, STATES } from '../player/Character.js';
import { CharacterAnimator } from '../player/CharacterAnimator.js';

const RADIUS = 110;
const SPEED = 48;

export class NPC {
  // def : { x0, x1, y = 0, lines: [], look }
  constructor(def) {
    this.x0 = def.x0;
    this.x1 = def.x1;
    this.lines = def.lines || [];
    this.look = def.look;
    this.body = new Character((def.x0 + def.x1) / 2, def.y || 0);
    this.animator = new CharacterAnimator({ stride: 40 });
    this.dir = 1;
    this.near = false;
    this.line = -1;
    this._pause = 0;
  }

  get text() { return this.near && this.line >= 0 ? this.lines[this.line] : ''; }

  // Renvoie true à l'instant où il commence à parler.
  update(dt, player) {
    const b = this.body;
    const near = !!player && Math.abs(player.x - b.x) < RADIUS && Math.abs(player.y - b.y) < 60;
    let spoke = false;
    if (near && !this.near && this.lines.length) {
      this.line = (this.line + 1) % this.lines.length;
      spoke = true;
    }
    this.near = near;

    let target = 0;
    if (near) {
      b.facing = player.x < b.x ? -1 : 1;
    } else if (this._pause > 0) {
      this._pause -= dt;
    } else {
      target = this.dir * SPEED;
      if (b.x >= this.x1) { this.dir = -1; this._pause = 1.2; }
      else if (b.x <= this.x0) { this.dir = 1; this._pause = 1.2; }
      b.facing = this.dir;
    }
    b.vx += (target - b.vx) * (1 - Math.exp(-8 * dt));
    b.x += b.vx * dt;
    b.state = Math.abs(b.vx) > 12 ? STATES.WALK : STATES.IDLE;
    this.animator.update(dt, b, 120);
    return spoke;
  }
}
