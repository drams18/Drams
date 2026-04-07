/* ══════════════════════════════════════════════════════
   PLAYER.JS — Side-view pixel art character
   Movement: horizontal only (← →)
   Sprite: 20×36px pixel art, walk animation
   ══════════════════════════════════════════════════════ */

'use strict';

const PLAYER_W = 45;
const PLAYER_H = 54;
const PLAYER_SPEED = 8;

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
  }

  get y() { return this.groundY - PLAYER_H; }

  move(controls, worldWidth) {
    if (controls.left) {
      this.vx = -PLAYER_SPEED;
      this.facing = 'left';
    } else if (controls.right) {
      this.vx = PLAYER_SPEED;
      this.facing = 'right';
    } else {
      this.vx = 0;
    }

    this.x += this.vx;
    this.x = Math.max(PLAYER_W / 2, Math.min(worldWidth - PLAYER_W / 2, this.x));

    if (this.vx !== 0) {
      this._walkFrame += 0.18;
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

    ctx.save();

    // Flip if facing left
    if (this.facing === 'left') {
      ctx.translate(sx, 0);
      ctx.scale(-1, 1);
      ctx.translate(-sx, 0);
    }

    this._drawSprite(ctx, sx, sy);

    ctx.restore();

    // Nametag (always unflipped)
    this._drawNametag(ctx, sx, sy);
  }

  _drawSprite(ctx, sx, sy) {
    const walk = this.vx !== 0;
    const legSwing = walk ? Math.sin(this._walkFrame) * 8 : 0;
    const armSwing = walk ? Math.sin(this._walkFrame) * 6 : 0;

    // ── Shadow ──────────────────────────────
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.beginPath();
    ctx.ellipse(sx, this.groundY + 3, 15, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // ── Legs ────────────────────────────────
    const legY = sy + 33;

    // Left leg
    ctx.fillStyle = '#000000';
    ctx.fillRect(sx - 9, legY + legSwing, 8, 21);
    // Right leg
    ctx.fillStyle = '#000000';
    ctx.fillRect(sx + 2, legY - legSwing, 8, 21);

    // ── Body ────────────────────────────────
    ctx.fillStyle = '#949494'; // shirt orange-red
    ctx.fillRect(sx - 9, sy + 15, 18, 20);

    // Shirt pocket
    ctx.fillStyle = '#b9b9b9';
    ctx.fillRect(sx + 2, sy + 18, 6, 5);

    // ── Arms ────────────────────────────────
    // Left arm
    ctx.fillStyle = '#b9b9b9';
    ctx.fillRect(sx - 14, sy + 17 + armSwing, 6, 15);
    // Right arm
    ctx.fillStyle = '#b9b9b9';
    ctx.fillRect(sx + 8, sy + 17 - armSwing, 6, 15);

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

    // Eyes
    ctx.fillStyle = '#1a1a2e';
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
    ctx.fillStyle = '#1a1208';
    ctx.fillRect(sx - 9, sy, 18, 5);
    ctx.fillRect(sx - 11, sy + 2, 3, 6); // sideburn left
    ctx.fillRect(sx + 8, sy + 2, 3, 6); // sideburn right
  }

  _drawNametag(ctx, sx, sy) {
    const label = 'RECRUTEZ MOI !';
    ctx.save();
    ctx.font = '6px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    const w = ctx.measureText(label).width + 8;
    const tagY = sy - 12;

    // Background
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(sx - w / 2, tagY - 7, w, 9);

    // Text
    ctx.fillStyle = '#ffd700';
    ctx.fillText(label, sx, tagY);
    ctx.restore();
  }
}
