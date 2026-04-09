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
    // Zoom adaptatif : ~1 sur mobile, ~1.8 sur grand écran desktop
    this.zoom = Math.min(2.2, Math.max(1, window.innerWidth / 900));
    const eh = Math.round(this.canvas.height / this.zoom);
    this.player.groundY = Math.round(eh * GROUND_RATIO);
  }

  _loop() {
    this._tick++;
    const ctx = this.ctx;
    const h   = this.canvas.height;
    const w   = this.canvas.width;

    const modalOpen = this.interactions.isOpen();
    const zoom = this.zoom;
    const ew   = w / zoom;  // largeur effective (espace monde)
    const eh   = h / zoom;  // hauteur effective (espace monde)

    // Close modal
    if (this.controls.close && modalOpen && this.interactions.currentSection() !== 'contact') {
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

    // Camera (en espace monde)
    this._targetX = this.player.x - ew / 2;
    this._targetX = Math.max(0, Math.min(WORLD_WIDTH - ew, this._targetX));
    this.cameraX += (this._targetX - this.cameraX) * 0.1;
    const camX = Math.round(this.cameraX);

    // Render avec zoom
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.scale(zoom, zoom);

    this.map.draw(ctx, camX, eh, this._tick);

    if (this._nearBuilding) {
      this._drawBuildingGlow(ctx, this._nearBuilding, camX, eh);
    }

    this.player.draw(ctx, camX);
    this._drawHUD(ctx, ew, eh);

    if (this._nearBuilding && !modalOpen) {
      this._drawInteractPrompt(ctx, ew, eh, this._nearBuilding);
    }

    ctx.restore();

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

    const KEY = '#ffd700';
    const LBL = 'rgba(255,255,255,0.70)';
    const SEP = 'rgba(255,255,255,0.25)';

    const segments = [
      { text: 'Aller à gauche : ',  color: LBL },
      { text: '[← / Q / A]   ',   color: KEY },
      { text: 'Aller à droite : ',  color: LBL },
      { text: ' [→ / D] ',   color: KEY },
      { text: '   ·   ',   color: SEP },
      { text: ' Entrer : ',   color: LBL },
      { text: '[↑ / W / Z]',   color: KEY },
      { text: '   ·   ',   color: SEP },
      { text: ' Fermer : ',   color: LBL },
      { text: '[↓ / S]',     color: KEY },
    ];

    let totalW = 0;
    const widths = segments.map(s => {
      const sw = ctx.measureText(s.text).width;
      totalW += sw;
      return sw;
    });

    const hintY = h - 16;
    const pad   = 10;
    let x = Math.round(w / 2 - totalW / 2);

    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(x - pad, hintY - 11, totalW + pad * 2, 14);

    ctx.textAlign = 'left';
    for (let i = 0; i < segments.length; i++) {
      ctx.fillStyle = segments[i].color;
      ctx.fillText(segments[i].text, x, hintY);
      x += widths[i];
    }

    ctx.restore();
  }

  _drawInteractPrompt(ctx, w, h, building) {
    const groundY = Math.round(h * GROUND_RATIO);
    const sx      = building.x - Math.round(this.cameraX) + building.w / 2;
    const py      = groundY - building.h - 50 + Math.sin(this._tick * 0.08) * 4;

    ctx.save();
    ctx.font = '8px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    const label = `[ ENTRER ] — ${building.label}`;
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

// ── Background music ──────────────────────────────────
// Audio created lazily on first user gesture for mobile/WebView compatibility

let bgMusic = null;

function _initAudio() {
  if (bgMusic) return;
  bgMusic = new Audio('assets/audio/bg-music.mp3');
  bgMusic.loop   = true;
  bgMusic.volume = 0.3;
}

function startMusic() {
  _initAudio();
  const p = bgMusic.play();
  if (p !== undefined) p.catch(() => {});
}

function stopMusic() {
  if (!bgMusic) return;
  bgMusic.pause();
  bgMusic.currentTime = 0;
}

// ── Boot ─────────────────────────────────────────────

function startGame() {
  const welcome = document.getElementById('screen-welcome');
  const game    = document.getElementById('screen-game');

  // Init + play audio synchronously inside the user gesture (required on iOS/WebView)
  startMusic();

  welcome.classList.add('screen-exit');
  setTimeout(() => {
    welcome.classList.add('hidden');
    game.classList.remove('hidden');
    game.classList.add('screen-enter');
    new Game();
  }, 500);
}

document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('btn-start');
  if (!btn) return;

  // Pre-unlock audio on any touch/click before the start button (iOS WebView)
  const unlock = () => {
    _initAudio();
    // Trigger a silent play/pause to unlock the audio context on iOS
    bgMusic.play().then(() => bgMusic.pause()).catch(() => {});
    btn.removeEventListener('touchstart', unlock);
    btn.removeEventListener('mousedown',  unlock);
  };
  btn.addEventListener('touchstart', unlock, { passive: true });
  btn.addEventListener('mousedown',  unlock);

  btn.addEventListener('click', startGame);
});
