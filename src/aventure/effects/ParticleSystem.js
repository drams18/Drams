/* ══════════════════════════════════════════════════════
   PARTICLESYSTEM.JS : particules en réserve fixe (aucune allocation
   pendant le jeu). Positions en unités monde, vitesses en u/s.
   ══════════════════════════════════════════════════════ */

export class ParticleSystem {
  constructor(max = 160) {
    this.max = max;
    this.x = new Float32Array(max); this.y = new Float32Array(max);
    this.vx = new Float32Array(max); this.vy = new Float32Array(max);
    this.life = new Float32Array(max); this.ttl = new Float32Array(max);
    this.size = new Float32Array(max); this.grav = new Float32Array(max);
    this.color = new Array(max).fill('#fff');
    this._next = 0;
    this.enabled = true;
  }

  spawn(x, y, vx, vy, ttl, size, color, gravity = 0) {
    if (!this.enabled) return;
    const i = this._next;
    this._next = (i + 1) % this.max;
    this.x[i] = x; this.y[i] = y; this.vx[i] = vx; this.vy[i] = vy;
    this.life[i] = ttl; this.ttl[i] = ttl; this.size[i] = size;
    this.grav[i] = gravity; this.color[i] = color;
  }

  // Poussière au sol (pas, atterrissage). dir : -1 / 0 / +1.
  dust(x, y, count, dir, color) {
    for (let k = 0; k < count; k++) {
      const a = Math.random();
      this.spawn(x + (a - 0.5) * 14, y - 2,
        (dir !== 0 ? dir * (20 + a * 50) : (a - 0.5) * 130), -(15 + Math.random() * 45),
        0.28 + Math.random() * 0.22, 2.2 + Math.random() * 2.4, color, 60);
    }
  }

  // Éclat (compétence ramassée, lieu découvert).
  burst(x, y, count, color) {
    for (let k = 0; k < count; k++) {
      const a = (k / count) * Math.PI * 2 + Math.random() * 0.4;
      const s = 70 + Math.random() * 130;
      this.spawn(x, y, Math.cos(a) * s, Math.sin(a) * s - 40, 0.45 + Math.random() * 0.35, 2 + Math.random() * 2.5, color, 260);
    }
  }

  clear() { this.life.fill(0); }

  update(dt) {
    for (let i = 0; i < this.max; i++) {
      if (this.life[i] <= 0) continue;
      this.life[i] -= dt;
      this.vy[i] += this.grav[i] * dt;
      this.x[i] += this.vx[i] * dt;
      this.y[i] += this.vy[i] * dt;
    }
  }

  draw(ctx) {
    for (let i = 0; i < this.max; i++) {
      if (this.life[i] <= 0) continue;
      const k = this.life[i] / this.ttl[i];
      ctx.globalAlpha = k;
      ctx.fillStyle = this.color[i];
      const s = this.size[i] * (0.5 + k * 0.5);
      ctx.fillRect(this.x[i] - s / 2, this.y[i] - s / 2, s, s);
    }
    ctx.globalAlpha = 1;
  }
}
