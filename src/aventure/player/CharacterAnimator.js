/* ══════════════════════════════════════════════════════
   CHARACTERANIMATOR.JS : état du personnage → pose

   Ne lit que le Character, ne dessine rien. Produit une `pose` (réutilisée
   d'une image à l'autre) que le CharacterRenderer interprète :
     phase    cycle de marche, avancé par la DISTANCE parcourue (les pieds
              ne glissent pas, quel que soit le taux de rafraîchissement)
     move     0 immobile → 1 pleine course (fondu)
     air      0 au sol → 1 en l'air (fondu), rise : -1 monte, +1 tombe
     squash   écrasement à l'atterrissage / étirement au saut (ressort)
     lean     inclinaison du buste
     breath   respiration au repos
     reach    0 → 1, geste d'interaction
   ══════════════════════════════════════════════════════ */

import { STATES } from './Character.js';

const damp = (rate, dt) => 1 - Math.exp(-rate * dt);

export class CharacterAnimator {
  constructor(opts = {}) {
    this.stride = opts.stride || 46;       // unités monde par cycle de marche
    this.weight = opts.weight || 1;        // > 1 : démarche plus lourde
    this.onStep = null;
    this.pose = {
      state: STATES.IDLE, phase: 0, move: 0, air: 0, rise: 0,
      squash: 0, lean: 0, breath: 0, reach: 0, speed: 0, t: 0,
    };
    this._squashV = 0;
    this._lastStep = 0;
  }

  // Impulsions ponctuelles (saut, atterrissage).
  kick(amount) { this._squashV += amount; }

  update(dt, c, maxSpeed) {
    const p = this.pose;
    p.t += dt;
    p.state = c.state;

    const speed = Math.abs(c.vx);
    p.speed = speed;
    const ratio = Math.min(1, speed / maxSpeed);
    p.move += ((c.grounded ? ratio : 0) - p.move) * damp(12, dt);
    p.air += ((c.grounded ? 0 : 1) - p.air) * damp(16, dt);
    p.rise = Math.max(-1, Math.min(1, c.vy / 500));

    // Cycle de marche : avance avec la distance, se replie doucement à l'arrêt.
    if (c.grounded && speed > 12) {
      p.phase += (speed * dt) / (this.stride * (0.75 + ratio * 0.55));
      const step = Math.floor(p.phase * 2);
      if (step !== this._lastStep) { this._lastStep = step; if (this.onStep) this.onStep(); }
    } else if (c.grounded) {
      const f = p.phase % 0.5;
      p.phase -= f * damp(10, dt);
    }

    // Ressort d'écrasement.
    this._squashV += (-p.squash * 190 - this._squashV * 17) * dt;
    p.squash += this._squashV * dt;

    const lean = c.grounded ? (c.vx / maxSpeed) * 0.13 / this.weight : (c.vx / maxSpeed) * 0.08;
    p.lean += (lean * c.facing - p.lean) * damp(9, dt);
    p.breath = Math.sin(p.t * 2.1 / this.weight);
    p.reach += ((c.state === STATES.INTERACT ? 1 : 0) - p.reach) * damp(10, dt);
  }
}
