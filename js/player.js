/* =================================================
   PLAYER.JS — Character movement and rendering
   ================================================= */

const PLAYER_WIDTH  = 28;
const PLAYER_HEIGHT = 44;
const PLAYER_SPEED     = 3.2;
const PLAYER_RUN_SPEED = 6.8;

class Player {
  constructor(startX, startY) {
    this.x = startX;
    this.y = startY;
    this.vx = 0;
    this.vy = 0;
    this.dir = 'down';         // 'up' | 'down' | 'left' | 'right'
    this.isMoving = false;
    this.isRunning = false;
    this.animTime = 0;
    this.stepTime = 0;
    this.stepPhase = 0;        // oscillating 0..1 for leg swing
    this.speed = PLAYER_SPEED;
    this.enterAnim = 0;        // 0 = not playing, > 0 = playing
    this._runLean = 0;         // forward lean angle (radians) when sprinting
    this._particles = [];      // dust particles
    this._dustTimer = 0;
  }

  update(input, map, dt) {
    const { dx, dy, sprint } = input;

    this.isMoving  = dx !== 0 || dy !== 0;
    this.isRunning = this.isMoving && !!sprint;
    this.speed     = this.isRunning ? PLAYER_RUN_SPEED : PLAYER_SPEED;

    const animRate = this.isRunning ? 95 : 180;

    if (this.isMoving) {
      this.animTime += dt;
      this.stepTime += dt;
      this.stepPhase = Math.sin(this.animTime / animRate);

      // Direction
      if (Math.abs(dx) >= Math.abs(dy)) {
        this.dir = dx > 0 ? 'right' : 'left';
      } else {
        this.dir = dy > 0 ? 'down' : 'up';
      }
    } else {
      // Idle — gentle bob
      this.animTime += dt * 0.3;
      this.stepPhase = 0;
    }

    // Forward lean when sprinting
    const leanTarget = this.isRunning ? 0.18 : 0;
    this._runLean += (leanTarget - this._runLean) * Math.min(1, dt * 0.012);

    // Dust particles when running
    if (this.isRunning) {
      this._dustTimer += dt;
      if (this._dustTimer > 60) {
        this._spawnDust();
        this._dustTimer = 0;
      }
    } else {
      this._dustTimer = 0;
    }

    // Update existing particles
    this._updateParticles(dt);

    if (this.enterAnim > 0) {
      this.enterAnim -= dt;
      return; // freeze movement during enter animation
    }

    // Normalize diagonal movement
    let nx = dx;
    let ny = dy;
    if (dx !== 0 && dy !== 0) {
      const inv = 1 / Math.sqrt(2);
      nx *= inv;
      ny *= inv;
    }

    const newX = this.x + nx * this.speed;
    const newY = this.y + ny * this.speed;

    // Axis-separated collision
    if (!map.isColliding(newX - PLAYER_WIDTH / 2, this.y - PLAYER_HEIGHT * 0.8, PLAYER_WIDTH, PLAYER_HEIGHT)) {
      this.x = newX;
    }
    if (!map.isColliding(this.x - PLAYER_WIDTH / 2, newY - PLAYER_HEIGHT * 0.8, PLAYER_WIDTH, PLAYER_HEIGHT)) {
      this.y = newY;
    }

    // World clamp
    this.x = Math.max(PLAYER_WIDTH / 2, Math.min(WORLD_WIDTH - PLAYER_WIDTH / 2, this.x));
    this.y = Math.max(PLAYER_HEIGHT, Math.min(WORLD_HEIGHT - 10, this.y));
  }

  _spawnDust() {
    // Emit dust behind the player based on direction
    const behind = {
      down:  [  0,  6],
      up:    [  0, -6],
      left:  [  8,  0],
      right: [ -8,  0],
    };
    const [ox, oy] = behind[this.dir] || [0, 0];

    for (let i = 0; i < 3; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.3 + Math.random() * 0.7;
      this._particles.push({
        x:       this.x + ox + (Math.random() - 0.5) * 10,
        y:       this.y + oy + (Math.random() - 0.5) * 4,
        vx:      Math.cos(angle) * speed * 0.6,
        vy:      Math.sin(angle) * speed * 0.4 - 0.3,
        age:     0,
        maxLife: 0.25 + Math.random() * 0.25,  // seconds
        size:    2 + Math.random() * 4,
      });
    }
  }

  _updateParticles(dt) {
    const dtS = dt / 1000;
    for (const p of this._particles) {
      p.age += dtS;
      p.x   += p.vx;
      p.y   += p.vy;
      p.vy  += 0.03; // gravity
      p.vx  *= 0.96; // friction
    }
    this._particles = this._particles.filter(p => p.age < p.maxLife);
  }

  triggerEnterAnimation() {
    this.enterAnim = 600;
  }

  render(ctx) {
    // Render dust particles BEHIND the player
    this._renderParticles(ctx);

    const x   = this.x - PLAYER_WIDTH / 2;
    const y   = this.y - PLAYER_HEIGHT;
    const bob = Math.sin(this.animTime / (this.isRunning ? 160 : 400)) * (this.isRunning ? 2.5 : 1.5);
    const legSwing = this.stepPhase * (this.isRunning ? 13 : 7);

    ctx.save();
    ctx.translate(this.x, this.y - PLAYER_HEIGHT / 2);
    ctx.rotate(this.isRunning ? this._runLean * (this.dir === 'left' ? -1 : 1) * (this.dir === 'up' || this.dir === 'down' ? 0 : 1) : 0);
    ctx.translate(-this.x, -(this.y - PLAYER_HEIGHT / 2));
    ctx.translate(0, bob);

    // --- Shadow (stretches when running) ---
    const shadowScale = this.isRunning ? 1.5 : 1;
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(x + PLAYER_WIDTH / 2, y + PLAYER_HEIGHT + 1, 12 * shadowScale, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Draw based on direction
    if (this.dir === 'down') {
      this._drawFront(ctx, x, y, legSwing);
    } else if (this.dir === 'up') {
      this._drawBack(ctx, x, y, legSwing);
    } else if (this.dir === 'left') {
      this._drawSide(ctx, x, y, legSwing, -1);
    } else {
      this._drawSide(ctx, x, y, legSwing, 1);
    }

    ctx.restore();

    // Name tag
    ctx.save();
    ctx.font = '6px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(this.x - 28, this.y - PLAYER_HEIGHT - 16, 56, 13);
    // Name color: gold normally, red when running
    ctx.fillStyle = this.isRunning ? '#ff6644' : '#ffd700';
    ctx.fillText(this.isRunning ? 'SPRINT!' : 'ARPHAN', this.x, this.y - PLAYER_HEIGHT - 6);
    ctx.restore();
  }

  _renderParticles(ctx) {
    for (const p of this._particles) {
      const t     = p.age / p.maxLife;
      const alpha = (1 - t) * 0.55;
      const r     = p.size * (1 - t * 0.4);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle   = '#c8b080';
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  _drawFront(ctx, x, y, ls) {
    const W = PLAYER_WIDTH;
    const H = PLAYER_HEIGHT;

    // === LEGS ===
    const leg1H = 14 + ls;
    const leg2H = 14 - ls;
    // Left leg
    ctx.fillStyle = '#1a2a66';
    ctx.fillRect(x + 5, y + H - 18, 9, leg1H);
    // Right leg
    ctx.fillRect(x + W - 14, y + H - 18, 9, leg2H);
    // Shoes
    ctx.fillStyle = '#1a0e00';
    ctx.fillRect(x + 4, y + H - 18 + leg1H, 11, 5);
    ctx.fillRect(x + W - 15, y + H - 18 + leg2H, 11, 5);

    // === BODY ===
    ctx.fillStyle = '#2255bb';
    ctx.fillRect(x + 3, y + H - 32, W - 6, 17);
    // Shirt collar
    ctx.fillStyle = '#1844aa';
    ctx.fillRect(x + 3, y + H - 32, W - 6, 4);
    // Belt
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(x + 3, y + H - 19, W - 6, 3);

    // === ARMS ===
    const arm1 = ls * 0.5;
    const arm2 = -ls * 0.5;
    ctx.fillStyle = '#ffc896';
    // Left arm
    ctx.fillRect(x - 4, y + H - 31 + arm1, 8, 14);
    // Right arm
    ctx.fillRect(x + W - 4, y + H - 31 + arm2, 8, 14);
    // Sleeve overlap
    ctx.fillStyle = '#2255bb';
    ctx.fillRect(x - 3, y + H - 31 + arm1, 7, 5);
    ctx.fillRect(x + W - 4, y + H - 31 + arm2, 7, 5);

    // === NECK ===
    ctx.fillStyle = '#ffc896';
    ctx.fillRect(x + W / 2 - 5, y + H - 36, 10, 6);

    // === HEAD ===
    ctx.fillStyle = '#ffc896';
    ctx.beginPath();
    ctx.arc(x + W / 2, y + H - 44, 13, 0, Math.PI * 2);
    ctx.fill();

    // === HAIR ===
    ctx.fillStyle = '#1a0800';
    // Top hair
    ctx.beginPath();
    ctx.arc(x + W / 2, y + H - 50, 10, Math.PI, 0, false);
    ctx.fill();
    ctx.fillRect(x + W / 2 - 10, y + H - 51, 20, 8);
    // Side hair
    ctx.fillRect(x + W / 2 - 13, y + H - 50, 5, 10);
    ctx.fillRect(x + W / 2 + 8, y + H - 50, 5, 10);

    // === FACE ===
    // Eyes
    ctx.fillStyle = '#1a0a00';
    ctx.fillRect(x + W / 2 - 7, y + H - 43, 4, 4);
    ctx.fillRect(x + W / 2 + 3, y + H - 43, 4, 4);
    // Eye whites
    ctx.fillStyle = '#fff';
    ctx.fillRect(x + W / 2 - 7, y + H - 44, 4, 4);
    ctx.fillRect(x + W / 2 + 3, y + H - 44, 4, 4);
    ctx.fillStyle = '#1a0a00';
    ctx.fillRect(x + W / 2 - 6, y + H - 43, 3, 3);
    ctx.fillRect(x + W / 2 + 4, y + H - 43, 3, 3);
    // Nose
    ctx.fillStyle = '#e0a070';
    ctx.fillRect(x + W / 2 - 1, y + H - 39, 3, 2);
    // Mouth
    ctx.fillStyle = '#cc6644';
    ctx.fillRect(x + W / 2 - 4, y + H - 36, 8, 2);
  }

  _drawBack(ctx, x, y, ls) {
    const W = PLAYER_WIDTH;
    const H = PLAYER_HEIGHT;

    // Legs
    ctx.fillStyle = '#1a2a66';
    ctx.fillRect(x + 5, y + H - 18, 9, 14 + ls);
    ctx.fillRect(x + W - 14, y + H - 18, 9, 14 - ls);
    ctx.fillStyle = '#1a0e00';
    ctx.fillRect(x + 4, y + H - 4 + ls, 11, 5);
    ctx.fillRect(x + W - 15, y + H - 4 - ls, 11, 5);

    // Body
    ctx.fillStyle = '#2255bb';
    ctx.fillRect(x + 3, y + H - 32, W - 6, 17);
    ctx.fillStyle = '#1844aa';
    ctx.fillRect(x + 3, y + H - 32, W - 6, 4);
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(x + 3, y + H - 19, W - 6, 3);

    // Arms
    ctx.fillStyle = '#ffc896';
    ctx.fillRect(x - 4, y + H - 31 + (-ls * 0.5), 8, 14);
    ctx.fillRect(x + W - 4, y + H - 31 + (ls * 0.5), 8, 14);
    ctx.fillStyle = '#2255bb';
    ctx.fillRect(x - 3, y + H - 31 + (-ls * 0.5), 7, 5);
    ctx.fillRect(x + W - 4, y + H - 31 + (ls * 0.5), 7, 5);

    // Neck
    ctx.fillStyle = '#ffc896';
    ctx.fillRect(x + W / 2 - 5, y + H - 36, 10, 6);

    // Head (back)
    ctx.fillStyle = '#ffc896';
    ctx.beginPath();
    ctx.arc(x + W / 2, y + H - 44, 13, 0, Math.PI * 2);
    ctx.fill();

    // Back of head — hair covers all
    ctx.fillStyle = '#1a0800';
    ctx.beginPath();
    ctx.arc(x + W / 2, y + H - 44, 13, 0, Math.PI * 2);
    ctx.fill();
    // Small ear suggestion
    ctx.fillStyle = '#ffc896';
    ctx.fillRect(x + W / 2 - 14, y + H - 46, 4, 5);
    ctx.fillRect(x + W / 2 + 10, y + H - 46, 4, 5);
  }

  _drawSide(ctx, x, y, ls, dir) {
    const W = PLAYER_WIDTH;
    const H = PLAYER_HEIGHT;

    ctx.save();
    if (dir === -1) {
      ctx.translate(x + W, 0);
      ctx.scale(-1, 1);
      x = 0;
    }

    // Legs (side profile — front/back leg)
    ctx.fillStyle = '#152055';
    ctx.fillRect(x + 7, y + H - 18, 8, 14 + ls); // front leg
    ctx.fillStyle = '#1a2a66';
    ctx.fillRect(x + 11, y + H - 18, 8, 14 - ls); // back leg
    ctx.fillStyle = '#0f0800';
    ctx.fillRect(x + 6, y + H - 4 + ls, 11, 5);
    ctx.fillStyle = '#1a0e00';
    ctx.fillRect(x + 10, y + H - 4 - ls, 10, 4);

    // Body (side)
    ctx.fillStyle = '#2255bb';
    ctx.fillRect(x + 6, y + H - 32, W - 10, 17);
    // Belt
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(x + 6, y + H - 19, W - 10, 3);

    // Arm (front side)
    ctx.fillStyle = '#ffc896';
    ctx.fillRect(x + W - 6, y + H - 31 + ls, 6, 14);
    ctx.fillStyle = '#2255bb';
    ctx.fillRect(x + W - 6, y + H - 31 + ls, 6, 5);

    // Neck
    ctx.fillStyle = '#ffc896';
    ctx.fillRect(x + 10, y + H - 36, 8, 6);

    // Head
    ctx.fillStyle = '#ffc896';
    ctx.beginPath();
    ctx.arc(x + W / 2 - 1, y + H - 44, 12, 0, Math.PI * 2);
    ctx.fill();

    // Hair
    ctx.fillStyle = '#1a0800';
    ctx.beginPath();
    ctx.arc(x + W / 2 - 1, y + H - 48, 10, Math.PI, 0, false);
    ctx.fill();
    ctx.fillRect(x + W / 2 - 11, y + H - 51, 20, 8);
    ctx.fillRect(x + W / 2 - 13, y + H - 50, 4, 10);

    // Eye (side)
    ctx.fillStyle = '#fff';
    ctx.fillRect(x + W / 2 + 3, y + H - 44, 5, 4);
    ctx.fillStyle = '#1a0a00';
    ctx.fillRect(x + W / 2 + 5, y + H - 43, 3, 3);
    // Nose (profile)
    ctx.fillStyle = '#e0a070';
    ctx.fillRect(x + W / 2 + 9, y + H - 40, 3, 3);
    ctx.fillRect(x + W / 2 + 11, y + H - 37, 3, 2);

    ctx.restore();
  }
}
