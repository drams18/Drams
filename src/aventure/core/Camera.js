/* ══════════════════════════════════════════════════════
   CAMERA.JS : caméra 2D commune aux trois univers

   Position = centre de la vue, en unités monde. Gère : suivi avec zone
   morte et anticipation, interpolation indépendante du taux de
   rafraîchissement, limites du niveau, zoom, secousse, travelling
   (pan cinématique, passable) et cadrage forcé (entrée dans un lieu).

   Chaque univers ne fournit que des réglages (`configure`).
   ══════════════════════════════════════════════════════ */

const DEFAULTS = {
  lerpX: 6,          // rapidité du suivi horizontal (1/s)
  lerpY: 5,
  deadX: 50,         // demi-largeur de la zone morte (unités monde)
  deadY: 70,
  lookAhead: 70,     // anticipation dans le sens de la marche
  anchorY: 0.74,     // où se posent les pieds du joueur dans la hauteur de vue
  zoom: 1,
  zoomLerp: 5,
  shake: 1,          // multiplicateur de secousse
};

const ease = (k) => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);
const damp = (rate, dt) => 1 - Math.exp(-rate * dt);

export class Camera {
  constructor() {
    this.cfg = { ...DEFAULTS };
    this.cx = 0; this.cy = 0;            // centre courant
    this.zoom = 1;
    this.viewW = 800; this.viewH = 600;  // unités monde visibles à zoom 1
    this.bounds = { minX: 0, maxX: 1000, minY: -1000, maxY: 100 };
    this.reducedMotion = false;

    this._tx = 0; this._ty = 0;          // cible suivie (après zone morte)
    this._look = 0;
    this._zoomTarget = 1;
    this._focus = null;                  // { x, y, zoom } cadrage forcé
    this._pan = null;                    // travelling en cours
    this._trauma = 0;
    this._sx = 0; this._sy = 0;          // décalage de secousse
    this._t = 0;
  }

  configure(cfg) {
    this.cfg = { ...DEFAULTS, ...cfg };
    this._zoomTarget = this.cfg.zoom;
    this.zoom = this.cfg.zoom;
  }

  setView(viewW, viewH) { this.viewW = viewW; this.viewH = viewH; }
  setBounds(minX, maxX, minY, maxY) {
    this.bounds.minX = minX; this.bounds.maxX = maxX;
    this.bounds.minY = minY; this.bounds.maxY = maxY;
  }

  get halfW() { return this.viewW / this.zoom / 2; }
  get halfH() { return this.viewH / this.zoom / 2; }
  get left() { return this.cx - this.halfW; }
  get right() { return this.cx + this.halfW; }
  get top() { return this.cy - this.halfH; }
  get bottom() { return this.cy + this.halfH; }
  get panning() { return !!this._pan; }

  // Centre de vue qui pose le point (x, y) à l'ancrage vertical.
  _centerFor(y) { return y - (this.cfg.anchorY - 0.5) * (this.viewH / this.zoom); }

  _clampX(x) {
    const b = this.bounds, hw = this.halfW;
    if (b.maxX - b.minX <= hw * 2) return (b.minX + b.maxX) / 2;
    return Math.max(b.minX + hw, Math.min(b.maxX - hw, x));
  }
  _clampY(y) {
    const b = this.bounds, hh = this.halfH;
    if (b.maxY - b.minY <= hh * 2) return b.maxY - hh;      // niveau plus petit : calé au sol
    return Math.max(b.minY + hh, Math.min(b.maxY - hh, y));
  }

  // Cale immédiatement la caméra sur une cible (téléportation, départ).
  snap(target) {
    this._tx = target.x; this._ty = target.y;
    this._look = 0;
    this.cx = this._clampX(this._tx);
    this.cy = this._clampY(this._centerFor(this._ty));
  }

  // Cadrage forcé (zoom sur une porte). release() rend la main au suivi.
  focus(x, y, zoom) { this._focus = { x, y, zoom }; }
  release() { this._focus = null; }
  zoomTo(z) { this._zoomTarget = z; }

  shake(amount) {
    if (this.reducedMotion) return;
    this._trauma = Math.min(1, this._trauma + amount * this.cfg.shake);
  }

  // Travelling : du point `from` au point `to` (centres de vue), en `duration` s.
  pan(from, to, duration, onDone) {
    if (this.reducedMotion || duration <= 0) { if (onDone) onDone(); return; }
    this._pan = { fx: from.x, fy: from.y, tx: to.x, ty: to.y, t: 0, d: duration, onDone };
    this.cx = this._clampX(from.x);
    this.cy = this._clampY(from.y);
  }
  skipPan() {
    const p = this._pan;
    if (!p) return false;
    this._pan = null;
    this.cx = this._clampX(p.tx); this.cy = this._clampY(p.ty);
    if (p.onDone) p.onDone();
    return true;
  }

  // target : { x, y (pieds), vx, grounded, facing }
  update(dt, target) {
    const c = this.cfg;
    this._t += dt;

    this.zoom += ((this._focus ? this._focus.zoom : this._zoomTarget) - this.zoom) * damp(c.zoomLerp, dt);

    if (this._pan) {
      const p = this._pan;
      p.t += dt;
      const k = ease(Math.min(1, p.t / p.d));
      this.cx = this._clampX(p.fx + (p.tx - p.fx) * k);
      this.cy = this._clampY(p.fy + (p.ty - p.fy) * k);
      if (p.t >= p.d) { this._pan = null; if (p.onDone) p.onDone(); }
    } else if (this._focus) {
      this.cx += (this._clampX(this._focus.x) - this.cx) * damp(7, dt);
      this.cy += (this._clampY(this._focus.y) - this.cy) * damp(7, dt);
    } else if (target) {
      // Zone morte : la cible ne bouge que si le joueur en sort.
      const dx = target.x - this._tx;
      if (dx > c.deadX) this._tx = target.x - c.deadX;
      else if (dx < -c.deadX) this._tx = target.x + c.deadX;

      // Vertical : recalé sur chaque surface où le joueur se pose, sinon zone morte
      // (un simple saut ne fait pas tanguer la vue).
      const dy = target.y - this._ty;
      if (target.grounded) this._ty += dy * damp(c.lerpY * 1.6, dt);
      else if (dy > c.deadY) this._ty = target.y - c.deadY;
      else if (dy < -c.deadY) this._ty = target.y + c.deadY;

      const moving = Math.abs(target.vx) > 20;
      const want = moving ? Math.sign(target.vx) * c.lookAhead : this._look * 0.6;
      this._look += (want - this._look) * damp(2.2, dt);

      const gx = this._clampX(this._tx + this._look);
      const gy = this._clampY(this._centerFor(this._ty));
      this.cx += (gx - this.cx) * damp(c.lerpX, dt);
      this.cy += (gy - this.cy) * damp(c.lerpY, dt);
    }

    // Secousse : amortie de façon exponentielle, bruit sinusoïdal (pas de Math.random).
    if (this._trauma > 0.001) {
      this._trauma *= Math.exp(-5 * dt);
      const a = this._trauma * this._trauma * 14;
      this._sx = Math.sin(this._t * 71.3) * a;
      this._sy = Math.cos(this._t * 53.7) * a;
    } else {
      this._trauma = 0; this._sx = 0; this._sy = 0;
    }
  }

  // Pose la transformation monde → pixels sur le contexte.
  apply(ctx, pixelScale) {
    const s = pixelScale * this.zoom;
    ctx.setTransform(s, 0, 0, s,
      Math.round((-this.left + this._sx) * s),
      Math.round((-this.top + this._sy) * s));
  }

  screenToWorld(px, py, cssScale, out) {
    const s = cssScale * this.zoom;
    out.x = this.left + px / s;
    out.y = this.top + py / s;
    return out;
  }
}
