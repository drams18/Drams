/* ══════════════════════════════════════════════════════
   ARPHAN-MAN · renderer : nuit, pluie, néons, verticalité
   Skyline dense, métro aérien au loin, immeubles dont les toits se
   parcourent, enseignes qui grésillent, asphalte mouillé.
   ══════════════════════════════════════════════════════ */

import { BaseRenderer, rng, hash } from '../BaseRenderer.js';

const NEON = ['#ff4fa3', '#39e1ff', '#d7ff3e', '#8f7bff'];
const INK = '#07061a';
const DOOR_W = 48, DOOR_H = 84;

export class HeroRenderer extends BaseRenderer {
  constructor(universe) {
    super(universe);
    this.collectibleGlow = 'rgba(215, 255, 62, 0.55)';
  }

  drawSky(ctx) {
    const sky = this.screen('sky', (g, w, h) => {
      const grad = g.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#050414');
      grad.addColorStop(0.5, '#150d3a');
      grad.addColorStop(0.85, '#3a1a63');
      grad.addColorStop(1, '#6a2470');
      g.fillStyle = grad; g.fillRect(0, 0, w, h);
      // Lune voilée.
      const mx = w * 0.78, my = h * 0.2, mr = Math.min(w, h) * 0.085;
      const halo = g.createRadialGradient(mx, my, mr * 0.6, mx, my, mr * 4);
      halo.addColorStop(0, 'rgba(190, 170, 255, 0.35)');
      halo.addColorStop(1, 'rgba(190, 170, 255, 0)');
      g.fillStyle = halo; g.fillRect(0, 0, w, h);
      g.fillStyle = '#e9e2ff'; g.beginPath(); g.arc(mx, my, mr, 0, Math.PI * 2); g.fill();
      g.fillStyle = 'rgba(21, 13, 58, 0.5)';
      const r = rng(5);
      for (let i = 0; i < 7; i++) {
        g.beginPath();
        g.ellipse(r() * w, h * (0.08 + r() * 0.35), w * (0.15 + r() * 0.2), h * 0.02 * (1 + r()), 0, 0, Math.PI * 2);
        g.fill();
      }
    });
    ctx.drawImage(sky.c, 0, 0);
  }

  drawFar(ctx, cam, t) {
    const far = this.sprite('far', 1400, 760, (g, w, h) => {
      this.skyline(g, w, h, {
        seed: 41, minW: 46, maxW: 110, minH: 0.3, maxH: 1, colors: ['#1a1346', '#20174f', '#150f3c'], gap: 12,
        lit: 0.16, cell: 9, on: ['#6c5ad0', '#ff4fa3', '#39e1ff'], off: '#1c1548', antenna: true,
      });
    });
    const mid = this.sprite('mid', 1600, 600, (g, w, h) => {
      this.skyline(g, w, h, {
        seed: 57, minW: 110, maxW: 220, minH: 0.35, maxH: 0.9, colors: ['#120d33', '#170f3d'], gap: 60,
        lit: 0.2, cell: 14, on: ['#ffd27a', '#39e1ff', '#ff4fa3'], off: '#1d1650',
      });
      // Viaduc du métro aérien.
      g.fillStyle = '#0b0826'; g.fillRect(0, h - 250, w, 14);
      for (let x = 60; x < w; x += 200) g.fillRect(x, h - 236, 16, 236);
      g.fillStyle = 'rgba(57, 225, 255, 0.5)'; g.fillRect(0, h - 252, w, 2);
    });
    this.parallax(ctx, cam, far, 0.08, 60, 0.18);
    this.parallax(ctx, cam, mid, 0.3, 30, 0.4);

    // Rame de métro : passe sur le viaduc (sans état).
    if (!this.reduced) {
      const ox = cam.left * 0.7;
      const oy = (cam.bottom - this.floor) * 0.6;
      const x = ox + ((t * 260) % 5200) - 900;
      if (x + 640 > cam.left && x < cam.right) {
        const train = this.sprite('train', 640, 44, (g) => {
          for (let i = 0; i < 4; i++) {
            g.fillStyle = '#241c66'; g.beginPath(); g.roundRect(i * 162, 0, 156, 44, 8); g.fill();
            g.fillStyle = '#ffe9a8'; g.fillRect(i * 162 + 12, 9, 132, 15);
            g.fillStyle = '#241c66';
            for (let k = 1; k < 5; k++) g.fillRect(i * 162 + 12 + k * 26.4, 9, 3, 15);
          }
        });
        this.blit(ctx, train, x, 30 - 250 - 44 + oy);
      }
    }
  }

  drawWorld(ctx, cam, t, level, state) {
    const d = level.decor;

    // Asphalte mouillé.
    const ground = this.sprite('ground', 520, 420, (g, w, h) => {
      g.fillStyle = '#19143f'; g.fillRect(0, 0, w, 26);
      g.fillStyle = '#2b2466'; g.fillRect(0, 0, w, 3);
      g.fillStyle = '#0c0a24'; g.fillRect(0, 26, w, h - 26);
      const r = rng(9);
      // Reflets de néon ; chaque flaque est redessinée à ±w pour que la tuile se répète sans coupure.
      for (let i = 0; i < 9; i++) {
        g.fillStyle = NEON[i % 4];
        g.globalAlpha = 0.1 + r() * 0.12;
        const px = r() * w, py = 50 + r() * 120, rx = 30 + r() * 60, ry = 4 + r() * 5;
        for (let k = -1; k <= 1; k++) { g.beginPath(); g.ellipse(px + k * w, py, rx, ry, 0, 0, Math.PI * 2); g.fill(); }
      }
      g.globalAlpha = 0.5; g.fillStyle = '#d7ff3e';
      for (let x = 30; x < w; x += 130) g.fillRect(x, 96, 56, 3);
      g.globalAlpha = 1;
    });
    this.tiles(ctx, cam, ground, 0);

    // Immeubles : la façade descend du toit jusqu'à la rue.
    for (let i = 0; i < d.roofs.length; i++) {
      const r = d.roofs[i];
      if (!this.visible(cam, r.x, r.w)) continue;
      const s = this.sprite('bld' + i, r.w, -r.y + 60, (g, w, h) => this._bakeBuilding(g, w, h, 200 + i));
      this.blit(ctx, s, r.x, r.y - 60);
    }

    // Enseignes : grésillement léger, certaines clignotent.
    for (let i = 0; i < d.signs.length; i++) {
      const s = d.signs[i];
      if (!this.visible(cam, s.x, s.w)) continue;
      const flick = this.reduced ? 1 : (hash(Math.floor(t * 14) + i * 31) > (i === 1 ? 0.25 : 0.06) ? 1 : 0.35);
      ctx.globalAlpha = flick;
      this.blit(ctx, this.sprite('sign' + i, s.w + 40, 76, (g) => this._bakeSign(g, s)), s.x - 20, s.y - 20);
      ctx.globalAlpha = 1;
    }

    for (let i = 0; i < level.platforms.length; i++) {
      const p = level.platforms[i];
      if (p.kind !== 'escape' || !this.visible(cam, p.x, p.w)) continue;
      ctx.fillStyle = '#4a428f'; ctx.fillRect(p.x, p.y, p.w, 5);
      ctx.fillStyle = '#2b2466'; ctx.fillRect(p.x, p.y + 5, p.w, 3);
      ctx.strokeStyle = '#3a327a'; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(p.x + 3, p.y); ctx.lineTo(p.x + 3, p.y - 30); ctx.lineTo(p.x + p.w - 3, p.y - 30); ctx.lineTo(p.x + p.w - 3, p.y);
      ctx.moveTo(p.x + p.w / 2, p.y + 8); ctx.lineTo(p.x + p.w / 2, p.y + 110);
      ctx.stroke();
    }

    for (let i = 0; i < level.locations.length; i++) {
      const l = level.locations[i];
      if (!this.visible(cam, l.x, l.w)) continue;
      this.blit(ctx, this.sprite('loc:' + l.id, l.w, l.h + 50, (g) => this._bakeLocation(g, l)), l.x, l.baseY - l.h - 50);
      this._door(ctx, l, '#d7ff3e');
      if (l.visited) this.drawVisited(ctx, l);
      if (state.near === l) this.drawNearHighlight(ctx, l, t, this.palette.primary);
    }

    const p = level.portal;
    if (this.visible(cam, p.x, p.w)) {
      const halo = this.glow('gate-glow', 150, 'rgba(215, 255, 62, 0.4)');
      ctx.globalAlpha = (p.boost ? 0.85 : 0.4) + (this.reduced ? 0 : 0.15 * Math.sin(t * 3.4));
      this.blit(ctx, halo, p.doorX - 150, -260);
      ctx.globalAlpha = 1;
      this.blit(ctx, this.sprite('portal', p.w, p.h, (g) => this._bakeGate(g, p)), p.x, -p.h);
      // Anneaux d'énergie dans l'arche.
      if (!this.reduced) {
        ctx.strokeStyle = '#d7ff3e'; ctx.lineWidth = 2;
        for (let k = 0; k < 3; k++) {
          const q = ((t * 0.5 + k / 3) % 1);
          ctx.globalAlpha = (1 - q) * (p.boost ? 0.9 : 0.45);
          ctx.beginPath(); ctx.ellipse(p.doorX, -95, 12 + q * 50, 20 + q * 78, 0, 0, Math.PI * 2); ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }
      this._door(ctx, p, '#f3ffc0');
      if (state.near === p) this.drawNearHighlight(ctx, p, t, this.palette.primary);
    }
  }

  // Pluie : traits obliques sans état (position = f(index, t)).
  drawFront(ctx, cam, t) {
    if (this.reduced) return;
    const w = cam.right - cam.left, h = cam.bottom - cam.top;
    ctx.strokeStyle = 'rgba(190, 200, 255, 0.34)';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    for (let i = 0; i < 90; i++) {
      const sp = 0.9 + hash(i) * 0.7;
      const x = cam.left + ((hash(i + 0.5) * w * 1.3 - t * 150 * sp - cam.left * 0.4) % (w * 1.3) + w * 1.3) % (w * 1.3) - w * 0.15;
      const y = cam.top + ((hash(i + 0.25) * h + t * 900 * sp) % h);
      ctx.moveTo(x, y); ctx.lineTo(x - 5, y + 24);
    }
    ctx.stroke();
  }

  drawOverlay(ctx) {
    ctx.drawImage(this.vignette('vig', 'rgba(5, 4, 20, 1)', 0.62).c, 0, 0);
  }

  bakeCollectible(g, col) {
    // Losange d'énergie.
    g.fillStyle = '#17123f';
    g.beginPath(); g.moveTo(17, 1); g.lineTo(33, 17); g.lineTo(17, 33); g.lineTo(1, 17); g.closePath(); g.fill();
    g.strokeStyle = '#d7ff3e'; g.lineWidth = 2.5; g.stroke();
    this.label(g, col.skill.abbr, 17, 18, 12, '#f3ffc0', 900);
  }

  _door(ctx, l, color) {
    if (l.open < 0.02) return;
    ctx.globalAlpha = l.open;
    ctx.fillStyle = color;
    ctx.fillRect(l.doorX - DOOR_W / 2 + 4, l.baseY - DOOR_H + 4, DOOR_W - 8, DOOR_H - 4);
    ctx.globalAlpha = 1;
  }

  // ── Cuisson ──

  _bakeBuilding(g, w, h, seed) {
    const r = rng(seed);
    const top = 60;
    g.fillStyle = '#120d33'; g.fillRect(0, top, w, h - top);
    this.windows(g, 14, top + 26, w - 28, h - top - 150, {
      cols: Math.round(w / 52), rows: Math.round((h - top - 150) / 58), gapX: 18, gapY: 22,
      lit: 0.3, on: ['#ffd27a', '#39e1ff', '#ff4fa3', '#8f7bff'], off: '#1b1548', seed,
    });
    // Rez-de-chaussée : rideaux de fer et vitrines sombres.
    g.fillStyle = INK; g.fillRect(0, h - 104, w, 104);
    for (let x = 16; x < w - 60; x += 110) {
      g.fillStyle = r() < 0.5 ? '#231b5c' : '#2c1548';
      g.fillRect(x, h - 90, 84, 90);
      g.fillStyle = 'rgba(255, 255, 255, 0.05)';
      for (let y = h - 84; y < h - 6; y += 9) g.fillRect(x, y, 84, 2);
    }
    // Bord du toit (sur lequel on marche) et équipements.
    g.fillStyle = '#3a327a'; g.fillRect(-0, top, w, 9);
    g.fillStyle = '#5a50b0'; g.fillRect(0, top, w, 2.5);
    g.fillStyle = '#1c1650';
    g.fillRect(w * 0.12, top - 26, 46, 26); g.fillRect(w * 0.7, top - 40, 30, 40);
    g.fillStyle = '#2b2466'; g.fillRect(w * 0.12 + 5, top - 21, 36, 6);
    g.fillRect(w * 0.84, top - 58, 3, 58);
    g.fillStyle = '#ff4fa3'; g.beginPath(); g.arc(w * 0.84 + 1.5, top - 58, 3.5, 0, Math.PI * 2); g.fill();
  }

  _bakeSign(g, s) {
    const w = s.w + 40;
    const grad = g.createRadialGradient(w / 2, 38, 4, w / 2, 38, w / 2);
    grad.addColorStop(0, s.color + '55');
    grad.addColorStop(1, s.color + '00');
    g.fillStyle = grad; g.fillRect(0, 0, w, 76);
    g.strokeStyle = s.color; g.lineWidth = 2.5;
    g.strokeRect(20, 20, s.w, 36);
    this.label(g, s.text, w / 2, 39, 18, s.color, 900, 'center', 2);
  }

  _plate(g, cx, y, loc, w) {
    const hint = this.universe.vocabulary.hints[loc.id];
    g.fillStyle = INK; g.fillRect(cx - w / 2, y, w, 48);
    g.strokeStyle = '#ff4fa3'; g.lineWidth = 2; g.strokeRect(cx - w / 2 + 1, y + 1, w - 2, 46);
    g.save();
    g.transform(1, 0, -0.14, 1, 0, 0);
    this.label(g, loc.label, cx + (y + 18) * 0.14, y + 18, 19, '#f3f0ff', 900, 'center', 1);
    g.restore();
    this.label(g, hint, cx, y + 37, 11, '#a79fd0', 600);
  }

  _doorFrame(g, cx, base) {
    g.fillStyle = INK; g.fillRect(cx - DOOR_W / 2 - 4, base - DOOR_H - 4, DOOR_W + 8, DOOR_H + 4);
    g.fillStyle = '#2c2380'; g.fillRect(cx - DOOR_W / 2, base - DOOR_H, DOOR_W, DOOR_H);
    g.strokeStyle = '#d7ff3e'; g.lineWidth = 2;
    g.strokeRect(cx - DOOR_W / 2 + 1, base - DOOR_H + 1, DOOR_W - 2, DOOR_H - 1);
    g.fillStyle = '#d7ff3e'; g.fillRect(cx + 10, base - 44, 4, 12);
  }

  _bakeLocation(g, l) {
    const w = l.w, top = 50, h = l.h, base = top + h, cx = l.doorX - l.x;
    if (l.style === 'base') {
      // Le QG : garage en béton, bandeau lumineux.
      g.fillStyle = '#1c1650'; g.fillRect(0, top, w, h);
      g.fillStyle = '#d7ff3e'; g.fillRect(0, top, w, 5);
      g.fillStyle = '#120d33';
      g.fillRect(16, top + 90, 78, h - 90); g.fillRect(w - 94, top + 90, 78, h - 90);
      g.fillStyle = 'rgba(57, 225, 255, 0.55)';
      g.fillRect(22, top + 98, 66, 26); g.fillRect(w - 88, top + 98, 66, 26);
      this._plate(g, cx, top + 22, l, 180);
    } else if (l.style === 'beacon') {
      // Le signal : une borne d'appel sous un projecteur.
      g.fillStyle = 'rgba(255, 79, 163, 0.18)';
      g.beginPath(); g.moveTo(w / 2, top + 58); g.lineTo(w, top - 50); g.lineTo(0, top - 50); g.closePath(); g.fill();
      g.fillStyle = '#1c1650'; g.fillRect(18, top + 60, w - 36, h - 60);
      g.fillStyle = '#ff4fa3'; g.fillRect(18, top + 60, w - 36, 5);
      g.beginPath(); g.arc(w / 2, top + 50, 9, 0, Math.PI * 2); g.fill();
      this._plate(g, cx, top + 4, l, 150);
    } else if (l.style === 'tower') {
      // Origin story : un château d'eau transformé en observatoire.
      g.fillStyle = '#2b2466';
      g.fillRect(34, top + 70, 8, h - 70); g.fillRect(w - 42, top + 70, 8, h - 70);
      g.fillStyle = '#1c1650'; g.beginPath(); g.roundRect(20, top + 34, w - 40, 76, 10); g.fill();
      g.fillStyle = '#3a327a';
      g.beginPath(); g.moveTo(12, top + 36); g.lineTo(w / 2, top + 4); g.lineTo(w - 12, top + 36); g.closePath(); g.fill();
      g.fillStyle = 'rgba(57, 225, 255, 0.6)'; g.fillRect(40, top + 80, w - 80, 12);
      g.fillStyle = '#1c1650'; g.fillRect(cx - 44, top + 106, 88, h - 106);
      this._plate(g, cx, top + 42, l, 180);
    } else {
      // Galerie : un panneau holographique géant sur le toit.
      g.fillStyle = '#2b2466'; g.fillRect(20, top + 110, 8, h - 110); g.fillRect(w - 28, top + 110, 8, h - 110);
      g.fillStyle = INK; g.fillRect(0, top, w, 116);
      g.strokeStyle = '#39e1ff'; g.lineWidth = 2.5; g.strokeRect(1.5, top + 1.5, w - 3, 113);
      const cols = ['#ff4fa3', '#39e1ff', '#d7ff3e', '#8f7bff', '#ff4fa3'];
      for (let i = 0; i < 5; i++) {
        g.fillStyle = cols[i]; g.globalAlpha = 0.75;
        g.fillRect(14 + i * ((w - 28) / 5), top + 60, (w - 28) / 5 - 8, 44);
      }
      g.globalAlpha = 1;
      g.fillStyle = '#1c1650'; g.fillRect(cx - 40, top + 116, 80, h - 116);
      this._plate(g, cx, top + 8, l, 180);
    }
    this._doorFrame(g, cx, base);
  }

  _bakeGate(g, p) {
    const w = p.w, h = p.h, cx = p.doorX - p.x;
    g.strokeStyle = '#2c2380'; g.lineWidth = 22;
    g.beginPath(); g.moveTo(cx - 70, h); g.lineTo(cx - 70, h - 150); g.arc(cx, h - 150, 70, Math.PI, 0); g.lineTo(cx + 70, h); g.stroke();
    g.strokeStyle = '#d7ff3e'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(cx - 58, h); g.lineTo(cx - 58, h - 150); g.arc(cx, h - 150, 58, Math.PI, 0); g.lineTo(cx + 58, h); g.stroke();
    g.fillStyle = INK; g.fillRect(8, 18, w - 16, 62);
    g.strokeStyle = '#d7ff3e'; g.lineWidth = 2; g.strokeRect(9, 19, w - 18, 60);
    this.label(g, 'CONSTRUISEZ', cx, 38, 19, '#d7ff3e', 900, 'center', 1);
    this.label(g, 'VOTRE PROJET', cx, 62, 19, '#d7ff3e', 900, 'center', 1);
  }
}
