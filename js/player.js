/* ══════════════════════════════════════════════════════
   PLAYER.JS : Personnage pixel art (vue de côté)
   Mouvement horizontal (← →) + saut. Réécriture visuelle uniquement :
   proportions, animation de marche, idle bob, API et texte du
   nametag INCHANGÉS.
   ══════════════════════════════════════════════════════ */

'use strict';

const PLAYER_W = 45;
const PLAYER_H = 54;
const PLAYER_SPEED = 12;
const PLAYER_ACCEL = 2.4;    // montée en vitesse : démarrage doux
const PLAYER_BRAKE = 3.2;    // freinage un peu plus vif à l'arrêt
const PLAYER_JUMP = 13;      // impulsion du saut (sommet ≈ 94 px)
const PLAYER_GRAVITY = 0.9;

class Player {
  constructor(x, groundY) {
    this.x = x;
    this.groundY = groundY; // bottom of player feet
    this.vx = 0;
    this.facing = 'right';

    this._walkFrame = 0;   // 0..2π for leg animation
    this._idleBob = 0;     // subtle idle bob
    this._idleDir = 1;
    this._bobY = 0;

    // Saut (mode aventure) : jumpY = hauteur au-dessus du sol.
    this.jumpY = 0;
    this.vy = 0;
    this.alpha = 1;        // fondu quand le personnage entre dans une maison
    this._squash = 0;      // écrasement à l'atterrissage / à l'arrêt (1 → 0)
    this.onStep = null;    // appelé à chaque pas posé au sol
    this.onLand = null;    // appelé à l'atterrissage
  }

  get y() { return this.groundY - PLAYER_H - this.jumpY; }
  get airborne() { return this.jumpY > 0 || this.vy !== 0; }

  jump() {
    if (this.airborne) return false;
    this.vy = PLAYER_JUMP;
    return true;
  }

  move(controls, worldWidth) {
    // Vitesse cible selon les touches, puis on s'en rapproche progressivement :
    // le personnage démarre et s'arrête en douceur au lieu de « claquer ».
    let target = 0;
    if (controls.left) {
      target = -PLAYER_SPEED;
      this.facing = 'left';
    } else if (controls.right) {
      target = PLAYER_SPEED;
      this.facing = 'right';
    }

    const rate = target === 0 ? PLAYER_BRAKE : PLAYER_ACCEL;
    if (this.vx < target)      this.vx = Math.min(target, this.vx + rate);
    else if (this.vx > target) this.vx = Math.max(target, this.vx - rate);

    this.x += this.vx;
    this.x = Math.max(PLAYER_W / 2, Math.min(worldWidth - PLAYER_W / 2, this.x));

    // Saut : simple parabole, atterrissage = petit écrasement.
    if (this.airborne) {
      this.jumpY += this.vy;
      this.vy -= PLAYER_GRAVITY;
      if (this.jumpY <= 0) {
        this.jumpY = 0;
        this.vy = 0;
        this._squash = 1;
        if (this.onLand) this.onLand();
      }
    }
    if (this._squash > 0.02) this._squash *= 0.8; else this._squash = 0;

    const walking = Math.abs(this.vx) > 0.4;
    if (this._wasWalking && !walking && !this.airborne) this._squash = Math.max(this._squash, 0.45);
    this._wasWalking = walking;

    if (walking) {
      // Cadence de marche proportionnelle à la vitesse réelle.
      const prev = this._walkFrame;
      this._walkFrame += 0.12 + (Math.abs(this.vx) / PLAYER_SPEED) * 0.08;
      // Un pas posé à chaque demi-cycle.
      if (this.onStep && !this.airborne &&
          Math.floor(prev / Math.PI) !== Math.floor(this._walkFrame / Math.PI)) this.onStep();
    } else {
      // Idle bob
      this._idleBob += 0.05 * this._idleDir;
      if (Math.abs(this._idleBob) > 1.5) this._idleDir *= -1;
      this._bobY = this._idleBob;
    }
  }

  draw(ctx, cameraX) {
    const sx = Math.round(this.x - cameraX);
    const sy = Math.round(this.y + this._bobY);

    // Lignes de vitesse derrière le personnage quand il court (repère
    // dessiné dans l'espace écran, sans flip).
    this._drawSpeedLines(ctx, sx, sy);

    ctx.save();
    if (this.alpha < 1) ctx.globalAlpha = Math.max(0, this.alpha);

    // Flip if facing left
    if (this.facing === 'left') {
      ctx.translate(sx, 0);
      ctx.scale(-1, 1);
      ctx.translate(-sx, 0);
    }

    // Écrasement / étirement autour des pieds.
    const stretch = this.airborne ? Math.min(0.1, Math.abs(this.vy) * 0.012) : 0;
    const k = this._squash * 0.16 - stretch;
    if (k) {
      const feet = sy + PLAYER_H;
      ctx.translate(sx, feet);
      ctx.scale(1 + k, 1 - k);
      ctx.translate(-sx, -feet);
    }

    this._drawSprite(ctx, sx, sy);

    ctx.restore();

    // Nametag (always unflipped)
    if (this.alpha > 0.6) this._drawNametag(ctx, sx, sy);
  }

  _drawSpeedLines(ctx, sx, sy) {
    const spd = Math.abs(this.vx);
    if (spd < 3) return;
    const dir = this.vx < 0 ? 1 : -1; // les traits partent derrière
    const n = 5;
    ctx.save();
    ctx.strokeStyle = '#19e8ff';
    ctx.lineWidth = 2;
    for (let i = 0; i < n; i++) {
      const len = 10 + (spd / PLAYER_SPEED) * (14 + i * 6);
      const yy = sy + 6 + i * 9;
      ctx.globalAlpha = (0.35 - i * 0.05) * (spd / PLAYER_SPEED);
      ctx.strokeStyle = i % 2 ? '#19e8ff' : '#ff2bb0';
      ctx.beginPath();
      ctx.moveTo(sx + dir * 16, yy);
      ctx.lineTo(sx + dir * (16 + len), yy);
      ctx.stroke();
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  _drawSprite(ctx, sx, sy) {
    const air = this.airborne;
    const walk = !air && Math.abs(this.vx) > 0.4;
    // En l'air : jambes groupées, bras levés.
    const legSwing = air ? 5 : walk ? Math.sin(this._walkFrame) * 8 : 0;
    const armSwing = air ? -7 : walk ? Math.sin(this._walkFrame) * 6 : 0;

    // ── Shadow ──────────────────────────────  (reste au sol, rétrécit en l'air)
    const sh = 1 - Math.min(0.55, this.jumpY / 170);
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.ellipse(sx, this.groundY + 3, 15 * sh, 4 * sh, 0, 0, Math.PI * 2);
    ctx.fill();

    // ── Legs ──────────────────────────────── (combinaison sombre)
    const legY = sy + 33;
    ctx.fillStyle = '#0c1428';
    ctx.fillRect(sx - 9, legY + legSwing, 8, 21);
    ctx.fillStyle = '#0c1428';
    ctx.fillRect(sx + 2, legY - legSwing, 8, 21);
    // liseré cyan sur la jambe avant
    ctx.fillStyle = 'rgba(25,232,255,0.5)';
    ctx.fillRect(sx + 2, legY - legSwing, 2, 21);

    // ── Body ────────────────────────────────
    ctx.fillStyle = '#141d33';
    ctx.fillRect(sx - 9, sy + 15, 18, 20);
    // accent magenta poitrine
    ctx.fillStyle = '#ff2bb0';
    ctx.fillRect(sx - 2, sy + 18, 5, 8);
    // petit emblème géométrique (losange + point), évocation abstraite, non figurative
    ctx.strokeStyle = 'rgba(25,232,255,0.9)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(sx + 0.5, sy + 17);
    ctx.lineTo(sx + 3.5, sy + 21.5);
    ctx.lineTo(sx + 0.5, sy + 26);
    ctx.lineTo(sx - 2.5, sy + 21.5);
    ctx.closePath();
    ctx.stroke();
    ctx.fillStyle = 'rgba(25,232,255,0.9)';
    ctx.fillRect(sx, sy + 21, 1, 1);
    // rim light cyan bord gauche
    ctx.fillStyle = 'rgba(25,232,255,0.55)';
    ctx.fillRect(sx - 9, sy + 15, 2, 20);

    // ── Arms ────────────────────────────────
    ctx.fillStyle = '#141d33';
    ctx.fillRect(sx - 14, sy + 17 + armSwing, 6, 15);
    ctx.fillStyle = '#141d33';
    ctx.fillRect(sx + 8, sy + 17 - armSwing, 6, 15);
    ctx.fillStyle = 'rgba(25,232,255,0.4)';
    ctx.fillRect(sx - 14, sy + 17 + armSwing, 2, 15);

    // ── Hands ────────────────────────────────
    ctx.fillStyle = '#4d301b'; // skin
    ctx.fillRect(sx - 14, sy + 30 + armSwing, 6, 6);
    ctx.fillRect(sx + 8, sy + 30 - armSwing, 6, 6);

    // ── Neck ────────────────────────────────
    ctx.fillStyle = '#4d301b';
    ctx.fillRect(sx - 3, sy + 11, 6, 6);

    // ── Head ────────────────────────────────
    ctx.fillStyle = '#4d301b';
    ctx.fillRect(sx - 9, sy, 18, 15);
    // rim light néon sur le visage
    ctx.fillStyle = 'rgba(25,232,255,0.35)';
    ctx.fillRect(sx - 9, sy, 2, 15);
    ctx.fillStyle = 'rgba(255,43,176,0.3)';
    ctx.fillRect(sx + 7, sy, 2, 15);

    // Eyes
    ctx.fillStyle = '#f5f6ff';
    ctx.fillRect(sx - 5, sy + 5, 3, 3);
    ctx.fillRect(sx + 3, sy + 5, 3, 3);

    // Mouth (smile)
    if (!walk) {
      ctx.fillStyle = '#c0602a';
      ctx.fillRect(sx - 3, sy + 11, 2, 2);
      ctx.fillRect(sx - 2, sy + 12, 5, 2);
      ctx.fillRect(sx + 3, sy + 11, 2, 2);
    }

    // ── Hair ────────────────────────────────
    ctx.fillStyle = '#0b0a10';
    ctx.fillRect(sx - 9, sy, 18, 5);
    ctx.fillRect(sx - 11, sy + 2, 3, 6); // sideburn left
    ctx.fillRect(sx + 8, sy + 2, 3, 6); // sideburn right
  }

  _drawNametag(ctx, sx, sy) {
    const label = 'RECRUTEZ MOI !';
    ctx.save();
    ctx.font = '6px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    const w = ctx.measureText(label).width + 12;
    const tagY = sy - 12;

    // Cartouche comics : fond + trait épais + petite queue
    ctx.fillStyle = '#03040c';
    ctx.fillRect(sx - w / 2, tagY - 8, w, 11);
    ctx.strokeStyle = '#19e8ff';
    ctx.lineWidth = 1;
    ctx.strokeRect(sx - w / 2, tagY - 8, w, 11);
    ctx.fillRect(sx - 2, tagY + 3, 4, 3);

    ctx.fillStyle = '#f5f6ff';
    ctx.fillText(label, sx, tagY);
    ctx.restore();
  }
}
