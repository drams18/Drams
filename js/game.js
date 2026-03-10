/* =================================================
   GAME.JS — Main game loop, camera, orchestration
   ================================================= */

class Game {
  constructor() {
    this.canvas  = document.getElementById('gameCanvas');
    this.ctx     = this.canvas.getContext('2d');

    // Disable image smoothing for pixel-art sharpness
    this.ctx.imageSmoothingEnabled = false;

    // Core systems
    this.map          = new GameMap();
    this.player       = new Player(900, 505); // Start at center intersection
    this.controls     = new Controls();
    this.mobile       = new MobileControls();
    this.interactions = new InteractionManager(this.map);

    // Camera (world-space top-left corner of viewport)
    this.camera = { x: 0, y: 0 };
    this._targetCamera = { x: 0, y: 0 };

    // Sprint visual FX
    this._speedLinesAlpha = 0;
    this._speedLines = this._generateSpeedLines();

    // Timing
    this._lastTime = 0;
    this._fps = 0;
    this._fpsTimer = 0;
    this._frameCount = 0;

    // Minimap (toggle with M)
    this._showMinimap = false;

    // Building highlight state
    this._highlightBuilding = null;
    this._highlightAlpha = 0;

    this._setupEventListeners();
    this._resize();
    this._rebuildMapAfterFonts();
    window.addEventListener('resize', () => this._resize());

    // Start loop
    requestAnimationFrame((t) => this._loop(t));
  }

  _resize() {
    this.canvas.width  = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.ctx.imageSmoothingEnabled = false;
  }

  _rebuildMapAfterFonts() {
    // Rebuild the pre-rendered map once web fonts are available
    // so building signs render with the correct pixel font
    document.fonts.ready.then(() => {
      this.map._buildStaticCanvas();
    });
  }

  _setupEventListeners() {
    // Visit callback → update quick nav
    this.interactions.onVisit((id, total) => {
      // nothing extra needed, handled inside interactions.js
    });

    // Canvas click → interact with building
    this.canvas.addEventListener('click', (e) => {
      if (this.interactions.isModalOpen()) return;
      const worldX = e.clientX + this.camera.x;
      const worldY = e.clientY + this.camera.y;
      this.interactions.handleCanvasClick(worldX, worldY, this.player);
    });

    // Minimap toggle
    window.addEventListener('keydown', (e) => {
      if (e.code === 'KeyM') {
        this._showMinimap = !this._showMinimap;
      }
    });
  }

  _updateCamera(dt) {
    // Target: center on player
    this._targetCamera.x = this.player.x - this.canvas.width  / 2;
    this._targetCamera.y = this.player.y - this.canvas.height / 2 + 40;

    // Clamp to world bounds
    this._targetCamera.x = Math.max(0, Math.min(WORLD_WIDTH  - this.canvas.width,  this._targetCamera.x));
    this._targetCamera.y = Math.max(0, Math.min(WORLD_HEIGHT - this.canvas.height, this._targetCamera.y));

    // Faster camera follow when sprinting
    const lerpSpeed = this.player.isRunning ? 0.22 : 0.12;
    this.camera.x += (this._targetCamera.x - this.camera.x) * lerpSpeed;
    this.camera.y += (this._targetCamera.y - this.camera.y) * lerpSpeed;
  }

  _loop(timestamp) {
    const dt = Math.min(timestamp - this._lastTime, 50); // cap at 50ms (20fps min)
    this._lastTime = timestamp;

    // --- UPDATE ---
    const kbInput = this.controls.getInput();
    const mbInput = this.mobile.getInput();

    const isModalOpen = this.interactions.isModalOpen();

    // Merge inputs (ignore movement if modal open)
    const input = {
      dx:       isModalOpen ? 0 : (kbInput.dx || mbInput.dx),
      dy:       isModalOpen ? 0 : (kbInput.dy || mbInput.dy),
      interact: kbInput.interact || mbInput.interact,
      sprint:   !isModalOpen && !!(kbInput.sprint || mbInput.sprint),
    };

    this.player.update(input, this.map, dt);

    // Speed lines alpha (read isRunning after update)
    const sprintTarget = this.player.isRunning ? 1 : 0;
    this._speedLinesAlpha += (sprintTarget - this._speedLinesAlpha) * Math.min(1, dt * 0.008);
    this._updateCamera(dt);

    // Interactions (consumes interact)
    if (!isModalOpen) {
      this.interactions.update(this.player, input.interact);
    }

    // Consume interact flags
    this.controls.consumeInteract();
    this.mobile.consumeInteract();

    // Update building highlight glow
    const nearby = this.map.getNearbyBuilding(this.player.x, this.player.y);
    if (nearby) {
      this._highlightBuilding = nearby;
      this._highlightAlpha = Math.min(1, this._highlightAlpha + dt / 200);
    } else {
      this._highlightAlpha = Math.max(0, this._highlightAlpha - dt / 150);
      if (this._highlightAlpha <= 0) this._highlightBuilding = null;
    }

    // FPS counter
    this._frameCount++;
    this._fpsTimer += dt;
    if (this._fpsTimer >= 1000) {
      this._fps = this._frameCount;
      this._frameCount = 0;
      this._fpsTimer -= 1000;
    }

    // --- RENDER ---
    this._render(dt);

    requestAnimationFrame((t) => this._loop(t));
  }

  _render(dt) {
    const ctx = this.ctx;
    const camX = Math.round(this.camera.x);
    const camY = Math.round(this.camera.y);

    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.save();
    ctx.translate(-camX, -camY);

    // 1. Map (pre-rendered static canvas)
    this.map.render(ctx, this.camera);

    // 2. Building highlight glow (proximity effect)
    if (this._highlightBuilding && this._highlightAlpha > 0) {
      this._renderBuildingGlow(ctx, this._highlightBuilding, this._highlightAlpha);
    }

    // 3. Building interaction zones (visual indicator)
    this._renderInteractionZones(ctx);

    // 4. Player
    this.player.render(ctx);

    ctx.restore(); // Back to screen space

    // 5. Speed lines (sprint FX)
    if (this._speedLinesAlpha > 0.01) {
      this._renderSpeedLines(ctx);
    }

    // 6. Scanline overlay
    this._renderScanlines(ctx);

    // 7. Vignette
    this._renderVignette(ctx);

    // 8. Minimap
    if (this._showMinimap) {
      this._renderMinimap(ctx, camX, camY);
    }

    // 8. Dev FPS (remove in production)
    // ctx.fillStyle = 'rgba(255,255,255,0.3)';
    // ctx.font = '10px monospace';
    // ctx.fillText(`FPS: ${this._fps}`, 10, this.canvas.height - 10);
  }

  _renderBuildingGlow(ctx, b, alpha) {
    const cx = b.x + b.w / 2;
    const cy = b.y + b.h / 2;

    ctx.save();
    ctx.globalAlpha = alpha * 0.35;

    // Outer glow
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, b.w * 0.8);
    grad.addColorStop(0, 'rgba(0,229,255,0.8)');
    grad.addColorStop(0.5, 'rgba(0,229,255,0.3)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(b.x - 40, b.y - 40, b.w + 80, b.h + 80);

    // Outline pulse
    ctx.globalAlpha = alpha * 0.7;
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#00e5ff';
    ctx.shadowBlur = 12;
    ctx.strokeRect(b.x - 4, b.y - 4, b.w + 8, b.h + 8);

    ctx.restore();
  }

  _renderInteractionZones(ctx) {
    for (const b of BUILDINGS_DATA) {
      const doorX = b.doorX + 18;
      const doorY = b.doorY;
      const dist  = Math.hypot(this.player.x - doorX, this.player.y - doorY);
      const inZone = dist < INTERACT_RADIUS * 1.5;

      if (inZone) {
        // Animated door marker
        const pulse = 0.4 + 0.3 * Math.sin(Date.now() / 300);
        ctx.save();
        ctx.globalAlpha = pulse;
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(b.doorX - 6, b.doorY - 6, 48, 16);
        ctx.setLineDash([]);
        // Arrow pointing down
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.moveTo(doorX, doorY + 12);
        ctx.lineTo(doorX - 8, doorY + 2);
        ctx.lineTo(doorX + 8, doorY + 2);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
    }
  }

  _generateSpeedLines() {
    const lines = [];
    const count = 28;
    for (let i = 0; i < count; i++) {
      lines.push({
        angle:  (Math.random() * Math.PI * 2),
        dist:   0.35 + Math.random() * 0.45,   // fraction of half-diagonal from center
        length: 30 + Math.random() * 90,
        width:  0.5 + Math.random() * 1.5,
        speed:  0.004 + Math.random() * 0.008,
        phase:  Math.random() * Math.PI * 2,
      });
    }
    return lines;
  }

  _renderSpeedLines(ctx) {
    const W  = this.canvas.width;
    const H  = this.canvas.height;
    const cx = W / 2;
    const cy = H / 2;
    const diag = Math.hypot(cx, cy);
    const now  = Date.now() / 1000;

    ctx.save();
    ctx.globalCompositeOperation = 'screen';

    for (const l of this._speedLines) {
      // Animate along radial direction
      const t   = ((now * l.speed * 3 + l.phase) % 1);
      const d   = l.dist * diag + t * diag * 0.3;
      const sx  = cx + Math.cos(l.angle) * d;
      const sy  = cy + Math.sin(l.angle) * d;
      const ex  = cx + Math.cos(l.angle) * (d + l.length);
      const ey  = cy + Math.sin(l.angle) * (d + l.length);

      const alpha = this._speedLinesAlpha * (0.5 + 0.5 * Math.sin(now * 8 + l.phase)) * (1 - t * 0.6);

      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(ex, ey);
      ctx.lineWidth = l.width;
      ctx.strokeStyle = `rgba(180, 220, 255, ${alpha * 0.4})`;
      ctx.stroke();
    }

    ctx.restore();
  }

  _renderScanlines(ctx) {
    ctx.save();
    ctx.globalAlpha = 0.025;
    ctx.fillStyle = '#000';
    for (let y = 0; y < this.canvas.height; y += 3) {
      ctx.fillRect(0, y, this.canvas.width, 1);
    }
    ctx.restore();
  }

  _renderVignette(ctx) {
    const W = this.canvas.width;
    const H = this.canvas.height;
    const grad = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.9);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,0,0,0.45)');
    ctx.save();
    ctx.globalAlpha = 1;
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  _renderMinimap(ctx, camX, camY) {
    const mx = this.canvas.width - 180;
    const my = this.canvas.height - 140;
    const mw = 160;
    const mh = 120;
    const scaleX = mw / WORLD_WIDTH;
    const scaleY = mh / WORLD_HEIGHT;

    ctx.save();
    // Background
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(mx - 4, my - 4, mw + 8, mh + 8);
    ctx.strokeStyle = 'rgba(0,229,255,0.5)';
    ctx.lineWidth = 1;
    ctx.strokeRect(mx - 4, my - 4, mw + 8, mh + 8);

    // Grass
    ctx.fillStyle = '#2a5418';
    ctx.fillRect(mx, my, mw, mh);

    // Paths
    ctx.fillStyle = '#8a7460';
    ctx.fillRect(mx, my + 460 * scaleY, mw, 90 * scaleY);
    ctx.fillRect(mx + 860 * scaleX, my, 90 * scaleX, mh);

    // Buildings
    for (const b of BUILDINGS_DATA) {
      ctx.fillStyle = b.color;
      ctx.fillRect(
        mx + b.x * scaleX,
        my + b.y * scaleY,
        b.w * scaleX,
        b.h * scaleY
      );
    }

    // Camera viewport
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(
      mx + camX * scaleX,
      my + camY * scaleY,
      this.canvas.width  * scaleX,
      this.canvas.height * scaleY
    );

    // Player dot
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.arc(
      mx + this.player.x * scaleX,
      my + this.player.y * scaleY,
      4, 0, Math.PI * 2
    );
    ctx.fill();

    // Label
    ctx.fillStyle = 'rgba(0,229,255,0.6)';
    ctx.font = '6px "Press Start 2P", monospace';
    ctx.textAlign = 'left';
    ctx.fillText('MAP [M]', mx, my - 8);

    ctx.restore();
  }
}

// ---- Bootstrap --------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  window.game = new Game();
});
