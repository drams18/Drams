/* ══════════════════════════════════════════════════════
   GAME.JS — Side-scroller engine
   Camera: horizontal only, lerp smoothing
   Renders: map → player → HUD → interact prompt
   ══════════════════════════════════════════════════════ */

'use strict';

class Game {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx    = this.canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;

    this.controls     = new Controls();
    this.mobile       = new MobileControls(this.controls);
    this.map          = new GameMap();
    this.interactions = new InteractionManager();

    const groundY = () => Math.round(this.canvas.height * GROUND_RATIO);
    this.player = new Player(SPAWN_X, groundY());

    // Camera starts so player is at left of screen
    this.cameraX  = 0;
    this._targetX = 0;

    this._tick          = 0;
    this._nearBuilding  = null;

    this._resize();
    window.addEventListener('resize', () => this._resize());

    requestAnimationFrame(() => this._loop());
  }

  _resize() {
    this.canvas.width  = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.ctx.imageSmoothingEnabled = false;
    this.player.groundY = Math.round(this.canvas.height * GROUND_RATIO);
  }

  _loop() {
    this._tick++;
    const ctx = this.ctx;
    const h   = this.canvas.height;
    const w   = this.canvas.width;

    const modalOpen = this.interactions.isOpen();

    // Close modal
    if (this.controls.close && modalOpen) {
      this.interactions.close();
    }

    // Move player only if modal closed
    if (!modalOpen) {
      this.player.move(this.controls, WORLD_WIDTH);
    }

    // Interact with nearby building
    this._nearBuilding = this.map.nearBuilding(this.player.x, this.player.groundY);
    if (!modalOpen && this._nearBuilding && this.controls.interact) {
      this.interactions.open(this._nearBuilding.id);
    }

    this.controls.flush();

    // Camera
    this._targetX = this.player.x - w / 2;
    this._targetX = Math.max(0, Math.min(WORLD_WIDTH - w, this._targetX));
    this.cameraX += (this._targetX - this.cameraX) * 0.1;
    const camX = Math.round(this.cameraX);

    // Render
    ctx.clearRect(0, 0, w, h);
    this.map.draw(ctx, camX, h, this._tick);

    if (this._nearBuilding) {
      this._drawBuildingGlow(ctx, this._nearBuilding, camX, h);
    }

    this.player.draw(ctx, camX);
    this._drawHUD(ctx, w, h);

    if (this._nearBuilding && !modalOpen) {
      this._drawInteractPrompt(ctx, w, h, this._nearBuilding);
    }

    requestAnimationFrame(() => this._loop());
  }

  _drawBuildingGlow(ctx, building, camX, canvasH) {
    const groundY = Math.round(canvasH * GROUND_RATIO);
    const sx = building.x - camX;
    const by = groundY - building.h;
    const pulse = 0.08 + 0.06 * Math.sin(this._tick * 0.08);

    ctx.save();
    ctx.shadowColor = building.accent;
    ctx.shadowBlur  = 28;
    ctx.strokeStyle = building.accent;
    ctx.lineWidth   = 2;
    ctx.globalAlpha = pulse * 3;
    ctx.strokeRect(sx - 10, by - 30, building.w + 20, building.h + 30);
    ctx.restore();
  }

  _drawHUD(ctx, w, h) {
    ctx.save();
    ctx.font = '7px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    const hintText = '← → [DÉPLACER]  ·  ESPACE [OUVRIR UNE FENÊTRE]  ·  ESC/SHIFT [FERMER UNE FENÊTRE]';
    const hintW = ctx.measureText(hintText).width + 20;
    const hintY = h - 16;
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(w / 2 - hintW / 2, hintY - 11, hintW, 14);
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.fillText(hintText, w / 2, hintY);
    ctx.restore();
  }

  _drawInteractPrompt(ctx, w, h, building) {
    const groundY = Math.round(h * GROUND_RATIO);
    const sx      = building.x - Math.round(this.cameraX) + building.w / 2;
    const py      = groundY - building.h - 50 + Math.sin(this._tick * 0.08) * 4;

    ctx.save();
    ctx.font = '8px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    const label = `[ ESPACE ] — ${building.label}`;
    const lw = ctx.measureText(label).width + 16;

    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(sx - lw / 2, py - 13, lw, 16);
    ctx.strokeStyle = building.accent;
    ctx.lineWidth = 1;
    ctx.strokeRect(sx - lw / 2, py - 13, lw, 16);
    ctx.fillStyle = building.accent;
    ctx.fillText(label, sx, py);
    ctx.restore();
  }
}

// ── Boot ─────────────────────────────────────────────

function startGame() {
  const welcome = document.getElementById('screen-welcome');
  const game    = document.getElementById('screen-game');

  welcome.classList.add('screen-exit');
  setTimeout(() => {
    welcome.classList.add('hidden');
    game.classList.remove('hidden');
    game.classList.add('screen-enter');
    new Game();
  }, 500);
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('btn-start')?.addEventListener('click', startGame);
});
