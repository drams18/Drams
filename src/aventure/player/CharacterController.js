/* ══════════════════════════════════════════════════════
   CHARACTERCONTROLLER.JS : physique du personnage

   Tout est exprimé par seconde et intégré avec dt :
     • horizontal : accélération / friction linéaires (approche d'une
       vitesse cible), contrôle réduit en l'air ;
     • vertical : gravité intégrée en Verlet (exacte pour une accélération
       constante, donc même hauteur de saut à 30 comme à 165 Hz) ;
     • saut : tampon d'appui + « coyote time », saut écourté si la touche
       est relâchée, chute un peu plus lourde que la montée ;
     • collisions : core/Collision.js.

   Les réglages (`physics`) viennent de l'univers : la ville est souple,
   le héros nerveux, le club plus lourd.
   ══════════════════════════════════════════════════════ */

import { STATES } from './Character.js';

export const DEFAULT_PHYSICS = {
  maxSpeed: 250,        // u/s
  accel: 1700,          // u/s²
  friction: 2100,
  airControl: 0.6,
  gravity: 1750,
  fallGravity: 1.3,     // multiplicateur en descente
  jumpVelocity: 630,
  jumpCut: 0.45,        // vitesse conservée si le saut est relâché tôt
  maxFall: 1150,
  coyote: 0.09,         // s
  buffer: 0.12,         // s
  runRatio: 0.82,       // au-delà : état « course »
};

const approach = (v, target, delta) =>
  (v < target ? Math.min(v + delta, target) : Math.max(v - delta, target));

export class CharacterController {
  constructor(character, collision, physics) {
    this.c = character;
    this.collision = collision;
    this.physics = { ...DEFAULT_PHYSICS, ...physics };
    this.onJump = null;
    this.onLand = null;        // (vitesse d'impact)
    this.locked = false;       // interaction en cours : plus de commandes
    this.hitWall = 0;
    this._coyote = 0;
    this._buffer = 0;
    this._cut = false;
    this._drop = 0;            // s restantes de traversée de plateforme
  }

  setWorld(collision, physics) {
    this.collision = collision;
    this.physics = { ...DEFAULT_PHYSICS, ...physics };
  }

  // intent : { axis, jumpPressed, jumpHeld, down }
  update(dt, intent) {
    const c = this.c, p = this.physics;
    const axis = this.locked ? 0 : intent.axis;

    // ── Horizontal ──
    const control = c.grounded ? 1 : p.airControl;
    const rate = (axis !== 0 ? p.accel : p.friction) * control;
    c.vx = approach(c.vx, axis * p.maxSpeed, rate * dt);
    if (axis !== 0) c.facing = axis;

    // ── Saut ──
    this._coyote = c.grounded ? p.coyote : Math.max(0, this._coyote - dt);
    this._buffer = (!this.locked && intent.jumpPressed) ? p.buffer : Math.max(0, this._buffer - dt);

    // ↓ + saut sur une plateforme traversable : on descend.
    if (this._buffer > 0 && intent.down && c.grounded && c.surface && c.surface.oneWay) {
      this._drop = 0.2;
      this._buffer = 0;
      c.grounded = false;
    } else if (this._buffer > 0 && this._coyote > 0) {
      c.vy = -p.jumpVelocity;
      c.grounded = false;
      this._buffer = 0; this._coyote = 0; this._cut = false;
      if (this.onJump) this.onJump();
    }
    if (!c.grounded && c.vy < 0 && !this._cut && !intent.jumpHeld) {
      c.vy *= p.jumpCut;
      this._cut = true;
    }
    if (this._drop > 0) this._drop -= dt;

    // ── Vertical : Verlet ──
    const g = p.gravity * (c.vy > 0 ? p.fallGravity : 1);
    let dy = c.vy * dt + 0.5 * g * dt * dt;
    c.vy = Math.min(c.vy + g * dt, p.maxFall);
    if (c.grounded && dy < 1) dy = 1;      // garde le contact avec le sol

    // ── Collisions ──
    const wasGrounded = c.grounded;
    const impact = c.vy;
    const hit = this.collision.move(c, c.vx * dt, dy, this._drop > 0);
    this.hitWall = hit.wall;
    if (hit.wall !== 0 && Math.sign(c.vx) === hit.wall) c.vx = 0;
    if (hit.ceiling && c.vy < 0) c.vy = 0;
    c.grounded = hit.ground;
    c.surface = hit.surface;
    if (hit.ground) {
      c.vy = 0;
      c.shadowY = c.y;
      if (!wasGrounded && this.onLand) this.onLand(impact);
    } else {
      c.shadowY = this.collision.groundBelow(c.x, c.y);
    }

    // ── État ──
    if (this.locked) c.state = STATES.INTERACT;
    else if (!c.grounded) c.state = c.vy < 0 ? STATES.JUMP : STATES.FALL;
    else {
      const s = Math.abs(c.vx);
      c.state = s < 12 ? STATES.IDLE : s > p.maxSpeed * p.runRatio ? STATES.RUN : STATES.WALK;
    }
  }
}
