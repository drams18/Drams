/* ══════════════════════════════════════════════════════
   CHARACTER.JS : état d'un personnage (joueur ou passant)
   Données seules : la physique est dans CharacterController, la pose dans
   CharacterAnimator, le dessin dans CharacterRenderer.
   ══════════════════════════════════════════════════════ */

export const STATES = {
  IDLE: 'idle', WALK: 'walk', RUN: 'run', JUMP: 'jump', FALL: 'fall', INTERACT: 'interact',
};

export class Character {
  constructor(x = 0, y = 0) {
    this.x = x;            // centre
    this.y = y;            // pieds
    this.w = 22;
    this.h = 56;
    this.vx = 0;
    this.vy = 0;
    this.facing = 1;
    this.grounded = true;
    this.state = STATES.IDLE;
    this.alpha = 1;
    this.shadowY = y;      // surface sous les pieds (ombre portée)
    this.surface = null;   // solide / plateforme sur lequel il se tient
  }

  place(x, y) {
    this.x = x; this.y = y;
    this.vx = 0; this.vy = 0;
    this.grounded = true;
    this.shadowY = y;
    this.state = STATES.IDLE;
  }
}
