/* ══════════════════════════════════════════════════════
   VILLE · renderer : ville contemporaine à l'heure dorée
   Ciel chaud, tours lointaines dans la brume, façades claires, vitrines
   éclairées, circulation au premier plan. Tout le décor fixe est cuit.
   ══════════════════════════════════════════════════════ */

import { BaseRenderer, rng } from '../BaseRenderer.js';

const WARM = ['#ffe2a8', '#ffd28a', '#fff0cf'];
const TONES = [
  { wall: '#e9e3da', trim: '#cfc7ba' },
  { wall: '#c9cfda', trim: '#aab2c2' },
  { wall: '#d8c9b8', trim: '#bca994' },
];
const INK = '#232941';
const DOOR_W = 46, DOOR_H = 82;
const PORTAL_LINES = ['CONSTRUISEZ', 'VOTRE PROJET'];   // remplacé par `portal.lines` dans le mini-jeu

export class VilleRenderer extends BaseRenderer {
  drawSky(ctx) {
    const sky = this.screen('sky', (g, w, h) => {
      const grad = g.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#141d3c');
      grad.addColorStop(0.42, '#3d4079');
      grad.addColorStop(0.7, '#b8637a');
      grad.addColorStop(0.86, '#ffb37a');
      grad.addColorStop(1, '#ffd9a8');
      g.fillStyle = grad;
      g.fillRect(0, 0, w, h);
      // Soleil bas et voiles de nuages.
      const sun = g.createRadialGradient(w * 0.72, h * 0.78, 0, w * 0.72, h * 0.78, h * 0.5);
      sun.addColorStop(0, 'rgba(255, 236, 190, 0.85)');
      sun.addColorStop(0.18, 'rgba(255, 190, 130, 0.35)');
      sun.addColorStop(1, 'rgba(255, 170, 120, 0)');
      g.fillStyle = sun;
      g.fillRect(0, 0, w, h);
      const r = rng(7);
      g.fillStyle = 'rgba(255, 220, 200, 0.10)';
      for (let i = 0; i < 9; i++) {
        g.beginPath();
        g.ellipse(r() * w, h * (0.25 + r() * 0.4), w * (0.12 + r() * 0.2), h * 0.012 * (1 + r() * 2), 0, 0, Math.PI * 2);
        g.fill();
      }
    });
    ctx.drawImage(sky.c, 0, 0);
  }

  drawFar(ctx, cam) {
    const far = this.sprite('far', 1300, 330, (g, w, h) => {
      this.skyline(g, w, h, { seed: 11, minW: 50, maxW: 120, minH: 0.3, maxH: 0.98, colors: ['#6a5c92', '#74649a', '#5f5489'], gap: 30, antenna: true });
    });
    const mid = this.sprite('mid', 1500, 300, (g, w, h) => {
      this.skyline(g, w, h, {
        seed: 23, minW: 90, maxW: 190, minH: 0.3, maxH: 0.98, colors: ['#343a66', '#2c3157', '#3b3f70'], gap: 24,
        lit: 0.22, cell: 13, on: WARM, off: '#454b7c',
      });
    });
    this.parallax(ctx, cam, far, 0.1, 20, 0.2);
    this.parallax(ctx, cam, mid, 0.32, 10, 0.45);
  }

  drawWorld(ctx, cam, t, level, state) {
    const d = level.decor;

    // Sol : trottoir, bordure, chaussée.
    const ground = this.sprite('ground', 480, 420, (g, w, h) => {
      g.fillStyle = '#868aa0'; g.fillRect(0, 0, w, 30);
      g.fillStyle = '#9da0b4'; g.fillRect(0, 0, w, 3);
      g.fillStyle = 'rgba(35, 41, 65, 0.25)';
      for (let x = 0; x < w; x += 60) g.fillRect(x, 3, 1.5, 27);
      g.fillStyle = '#5c6079'; g.fillRect(0, 30, w, 9);
      g.fillStyle = '#2b2e42'; g.fillRect(0, 39, w, h - 39);
      g.fillStyle = 'rgba(233, 227, 218, 0.5)';
      for (let x = 20; x < w; x += 120) g.fillRect(x, 118, 60, 4);
      g.fillStyle = 'rgba(255, 180, 110, 0.05)'; g.fillRect(0, 39, w, 50);
    });
    this.tiles(ctx, cam, ground, 0);

    for (let i = 0; i < d.blocks.length; i++) {
      const b = d.blocks[i];
      if (!this.visible(cam, b.x, b.w)) continue;
      this.blit(ctx, this.sprite('blk' + i, b.w, b.h, (g, w, h) => this._bakeBlock(g, w, h, TONES[b.tone], 100 + i)), b.x, -b.h);
    }

    for (let i = 0; i < d.trees.length; i++) {
      if (!this.visible(cam, d.trees[i] - 50, 100)) continue;
      this.blit(ctx, this.sprite('tree', 100, 170, (g) => this._bakeTree(g)), d.trees[i] - 50, -170);
    }

    for (let i = 0; i < level.locations.length; i++) {
      const l = level.locations[i];
      if (!this.visible(cam, l.x, l.w)) continue;
      this.blit(ctx, this.sprite('loc:' + l.id, l.w, l.h + 40, (g) => this._bakeLocation(g, l)), l.x, l.baseY - l.h - 40);
      this._door(ctx, l);
      if (l.visited) this.drawVisited(ctx, l);
      if (state.near === l) this.drawNearHighlight(ctx, l, t, this.palette.primary);
    }

    const p = level.portal;
    if (this.visible(cam, p.x, p.w)) {
      this.blit(ctx, this.sprite('portal:' + (p.lines || ''), p.w, p.h, (g) => this._bakeSite(g, p)), p.x, -p.h);
      // Projecteurs du chantier : allumés une fois la visite terminée.
      const pulse = p.boost ? 0.75 + 0.25 * Math.sin(t * 3) : 0.35;
      const halo = this.glow('site-glow', 90, 'rgba(255, 180, 84, 0.55)');
      ctx.globalAlpha = pulse;
      this.blit(ctx, halo, p.doorX - 90, -150);
      ctx.globalAlpha = 1;
      this._door(ctx, p);
      if (state.near === p) this.drawNearHighlight(ctx, p, t, this.palette.primary);
    }

    for (let i = 0; i < level.platforms.length; i++) this._platform(ctx, level.platforms[i]);

    for (let i = 0; i < d.lamps.length; i++) {
      if (!this.visible(cam, d.lamps[i] - 80, 160)) continue;
      this.blit(ctx, this.sprite('lamp', 160, 270, (g) => this._bakeLamp(g)), d.lamps[i] - 80, -270);
    }
  }

  // Premier plan : voitures sur la chaussée (sans état, position = f(t)).
  drawFront(ctx, cam, t, level) {
    const car = this.sprite('car', 150, 54, (g) => this._bakeCar(g, '#e9e3da'));
    const car2 = this.sprite('car2', 150, 54, (g) => this._bakeCar(g, '#3f6f7a'));
    const span = level.width + 900;
    const speed = this.reduced ? 0 : 1;
    for (let i = 0; i < 3; i++) {
      const dir = i % 2 ? -1 : 1;
      const base = (i * 1700 + t * speed * (150 + i * 40) * dir) % span;
      const x = (base + span) % span - 450;
      if (!this.visible(cam, x, 150)) continue;
      const y = i % 2 ? 122 : 58;
      ctx.save();
      ctx.translate(x + 75, y);
      ctx.scale(dir, 1);
      ctx.drawImage((i % 2 ? car2 : car).c, -75, 0, 150, 54);
      ctx.restore();
    }
  }

  drawOverlay(ctx) {
    ctx.drawImage(this.vignette('vig', 'rgba(16, 23, 40, 1)', 0.4).c, 0, 0);
  }

  bakeCollectible(g, col) {
    g.fillStyle = '#fbf8f2';
    g.beginPath(); g.roundRect(3, 3, 28, 28, 9); g.fill();
    g.strokeStyle = this.palette.accent; g.lineWidth = 2.5; g.stroke();
    this.label(g, col.skill.abbr, 17, 18, 13, INK, 800);
  }

  // ── Dessin dynamique ──

  _door(ctx, l) {
    if (l.open < 0.02) return;
    ctx.globalAlpha = l.open;
    ctx.fillStyle = '#fff3d6';
    ctx.fillRect(l.doorX - DOOR_W / 2 + 3, l.baseY - DOOR_H + 3, DOOR_W - 6, DOOR_H - 3);
    ctx.globalAlpha = 1;
  }

  _platform(ctx, p) {
    if (p.kind === 'scaffold') {
      ctx.fillStyle = '#c7a05a'; ctx.fillRect(p.x, p.y, p.w, 6);
      ctx.fillStyle = '#5b6079';
      ctx.fillRect(p.x + 4, p.y, 3, -p.y); ctx.fillRect(p.x + p.w - 7, p.y, 3, -p.y);
      ctx.fillRect(p.x, p.y - 26, p.w, 2.5);
      return;
    }
    // Abribus / kiosque : toit plat, montants, vitre.
    ctx.fillStyle = INK; ctx.fillRect(p.x - 4, p.y, p.w + 8, 7);
    ctx.fillStyle = '#5b6079';
    ctx.fillRect(p.x + 6, p.y + 7, 4, -p.y - 7); ctx.fillRect(p.x + p.w - 10, p.y + 7, 4, -p.y - 7);
    ctx.fillStyle = p.kind === 'kiosk' ? 'rgba(255, 210, 138, 0.55)' : 'rgba(170, 200, 230, 0.22)';
    ctx.fillRect(p.x + 12, p.y + 12, p.w - 24, -p.y - 26);
    ctx.fillStyle = INK; ctx.fillRect(p.x + 14, -22, p.w - 28, 5);
  }

  // ── Cuisson ──

  _bakeBlock(g, w, h, tone, seed) {
    g.fillStyle = tone.wall; g.fillRect(0, 0, w, h);
    g.fillStyle = tone.trim; g.fillRect(0, 0, w, 8); g.fillRect(0, h - 96, w, 6);
    const cols = Math.max(2, Math.round(w / 62)), rows = Math.max(1, Math.round((h - 130) / 62));
    this.windows(g, 8, 16, w - 16, h - 120, { cols, rows, gapX: 16, gapY: 16, lit: 0.45, on: WARM, off: '#56607e', seed });
    // Rez-de-chaussée : vitrine éclairée sous un bandeau.
    g.fillStyle = INK; g.fillRect(10, h - 84, w - 20, 84);
    g.fillStyle = '#ffd596'; g.fillRect(16, h - 76, w - 32, 62);
    g.fillStyle = 'rgba(35, 41, 65, 0.35)';
    for (let x = 16 + (w - 32) / 3; x < w - 20; x += (w - 32) / 3) g.fillRect(x, h - 76, 3, 62);
    g.fillStyle = 'rgba(35, 41, 65, 0.16)'; g.fillRect(16, h - 40, w - 32, 26);
    g.fillStyle = INK; g.fillRect(0, h - 4, w, 4);
  }

  _bakeTree(g) {
    g.fillStyle = '#4a3a34'; g.fillRect(47, 90, 6, 80);
    g.fillStyle = '#2f5d57';
    g.beginPath(); g.arc(50, 62, 42, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#3d7a70';
    g.beginPath(); g.arc(40, 50, 26, 0, Math.PI * 2); g.fill();
    g.fillStyle = 'rgba(255, 190, 120, 0.22)';
    g.beginPath(); g.arc(66, 44, 20, 0, Math.PI * 2); g.fill();
    g.fillStyle = INK; g.fillRect(34, 164, 32, 6);
  }

  _bakeLamp(g) {
    const grad = g.createRadialGradient(80, 76, 0, 80, 76, 76);
    grad.addColorStop(0, 'rgba(255, 220, 160, 0.5)');
    grad.addColorStop(1, 'rgba(255, 220, 160, 0)');
    g.fillStyle = grad; g.fillRect(0, 0, 160, 160);
    g.fillStyle = INK; g.fillRect(78, 76, 4, 194); g.fillRect(62, 70, 36, 5);
    g.fillStyle = '#fff3d6'; g.fillRect(66, 75, 28, 4);
  }

  _bakeCar(g, color) {
    g.fillStyle = 'rgba(0, 0, 0, 0.3)'; g.beginPath(); g.ellipse(75, 50, 70, 4, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = color;
    g.beginPath(); g.roundRect(4, 20, 142, 24, 9); g.fill();
    g.beginPath(); g.roundRect(34, 3, 78, 26, 12); g.fill();
    g.fillStyle = '#1d2238';
    g.beginPath(); g.roundRect(42, 8, 30, 15, 5); g.fill();
    g.beginPath(); g.roundRect(76, 8, 30, 15, 5); g.fill();
    g.fillStyle = '#14172a';
    g.beginPath(); g.arc(36, 44, 9.5, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.arc(114, 44, 9.5, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#fff3d6'; g.fillRect(140, 26, 6, 6);
    g.fillStyle = '#ff6a5c'; g.fillRect(4, 26, 4, 6);
  }

  _sign(g, cx, y, loc, w = 170) {
    const hint = this.universe.vocabulary.hints[loc.id];
    // Libellé long : l'enseigne s'élargit jusqu'aux bords du lieu, puis le texte rétrécit.
    w = Math.max(w, Math.min(loc.w - 12, this.textWidth(g, loc.label, 19, 750, 1.5) + 30));
    g.fillStyle = INK;
    g.beginPath(); g.roundRect(cx - w / 2, y, w, hint ? 46 : 34, 8); g.fill();
    this.label(g, loc.label, cx, y + (hint ? 17 : 18), this.fit(g, loc.label, 19, w - 24, 750, 1.5), '#fff3d6', 750, 'center', 1.5);
    if (hint) this.label(g, hint, cx, y + 35, this.fit(g, hint, 11, w - 16, 500, 0, 8), '#aab1c6', 500);
  }

  _doorFrame(g, cx, baseY) {
    g.fillStyle = INK;
    g.beginPath(); g.roundRect(cx - DOOR_W / 2, baseY - DOOR_H, DOOR_W, DOOR_H, [6, 6, 0, 0]); g.fill();
    g.fillStyle = '#ffcf85';
    g.fillRect(cx - DOOR_W / 2 + 5, baseY - DOOR_H + 6, DOOR_W - 10, DOOR_H - 6);
    g.fillStyle = INK;
    g.fillRect(cx - 1, baseY - DOOR_H + 6, 2, DOOR_H - 6);
    g.fillRect(cx + 5, baseY - 42, 2.5, 12);
  }

  _bakeLocation(g, l) {
    const w = l.w, top = 40, h = l.h, base = top + h, cx = l.doorX - l.x;
    if (l.style === 'studio') {
      g.fillStyle = '#efe9df'; g.fillRect(0, top, w, h);
      g.fillStyle = '#d5cdbf'; g.fillRect(0, top, w, 10);
      this.windows(g, 10, top + 22, w - 20, h - 150, { cols: 4, rows: 3, gapX: 16, gapY: 14, lit: 0.6, on: WARM, off: '#56607e', seed: 3 });
      g.fillStyle = INK; g.fillRect(14, base - 100, w - 28, 100);
      g.fillStyle = '#ffd596'; g.fillRect(22, base - 92, w - 44, 80);
      g.fillStyle = 'rgba(35, 41, 65, 0.3)'; g.fillRect(22, base - 44, w - 44, 32);
      this._sign(g, cx, top + h - 152, l);
    } else if (l.style === 'station') {
      // Pavillon de station : auvent, verrière, plan de ligne (les étapes du parcours).
      g.fillStyle = '#dfe4ec'; g.fillRect(16, top + 60, w - 32, h - 60);
      g.fillStyle = 'rgba(120, 170, 210, 0.45)'; g.fillRect(28, top + 74, w - 56, h - 100);
      g.fillStyle = INK;
      for (let x = 28; x <= w - 28; x += (w - 56) / 5) g.fillRect(x - 1.5, top + 74, 3, h - 100);
      g.beginPath(); g.roundRect(0, top + 40, w, 22, 6); g.fill();
      g.strokeStyle = this.palette.accent; g.lineWidth = 3;
      g.beginPath(); g.moveTo(40, top + 51); g.lineTo(w - 40, top + 51); g.stroke();
      for (let i = 0; i < 6; i++) {
        g.fillStyle = '#fff3d6';
        g.beginPath(); g.arc(40 + i * (w - 80) / 5, top + 51, 4.5, 0, Math.PI * 2); g.fill();
      }
      this._sign(g, cx, top - 14, l);
    } else if (l.style === 'gallery') {
      g.fillStyle = '#f6f3ee'; g.fillRect(0, top, w, h);
      g.fillStyle = '#ddd6ca'; g.fillRect(0, top, w, 8);
      g.fillStyle = INK; g.fillRect(18, top + 96, w - 36, h - 96);
      g.fillStyle = '#fff0cf'; g.fillRect(26, top + 104, w - 52, h - 118);
      // Cadres exposés en vitrine.
      const frames = ['#e2685c', '#5fd4c4', '#ffb454', '#6f7fd8', '#2f5d57'];
      for (let i = 0; i < 5; i++) {
        const fx = 40 + i * ((w - 80) / 5) + (i > 1 ? 30 : 0) - (i > 2 ? 30 : 0);
        if (Math.abs(fx + 24 - cx) < 44) continue;
        g.fillStyle = INK; g.fillRect(fx, top + 122, 50, 64);
        g.fillStyle = frames[i]; g.fillRect(fx + 5, top + 127, 40, 54);
      }
      this._sign(g, cx, top + 30, l, 190);
    } else {
      // Café : store rayé, vitrine chaude.
      g.fillStyle = '#e4d6c3'; g.fillRect(0, top + 20, w, h - 20);
      g.fillStyle = INK; g.fillRect(12, top + 96, w - 24, h - 96);
      g.fillStyle = '#ffd596'; g.fillRect(20, top + 104, w - 40, h - 118);
      for (let i = 0; i < 10; i++) {
        g.fillStyle = i % 2 ? '#fbf8f2' : '#c0584e';
        g.beginPath();
        g.moveTo(i * w / 10, top + 70); g.lineTo((i + 1) * w / 10, top + 70);
        g.lineTo((i + 1) * w / 10 + 6, top + 98); g.lineTo(i * w / 10 - 6, top + 98);
        g.closePath(); g.fill();
      }
      this._sign(g, cx, top + 12, l);
    }
    this._doorFrame(g, cx, base);
    g.fillStyle = INK; g.fillRect(0, base - 3, w, 3);
  }

  // Le portail : un immeuble en chantier (« Construisez votre projet »).
  _bakeSite(g, p) {
    const w = p.w, h = p.h, cx = p.doorX - p.x;
    g.fillStyle = '#4a506b'; g.fillRect(30, 70, w - 60, h - 70);
    g.strokeStyle = '#c7a05a'; g.lineWidth = 3;
    for (let y = 70; y < h; y += 58) { g.beginPath(); g.moveTo(14, y); g.lineTo(w - 14, y); g.stroke(); }
    for (let x = 14; x <= w - 14; x += (w - 28) / 4) { g.beginPath(); g.moveTo(x, 70); g.lineTo(x, h); g.stroke(); }
    // Grue
    g.strokeStyle = '#ffb454'; g.lineWidth = 4;
    g.beginPath(); g.moveTo(w - 60, 70); g.lineTo(w - 60, 6); g.moveTo(20, 18); g.lineTo(w - 20, 18); g.stroke();
    g.lineWidth = 1.5; g.beginPath(); g.moveTo(70, 18); g.lineTo(70, 60); g.stroke();
    // Palissade + panneau
    g.fillStyle = INK; g.fillRect(0, h - 120, w, 120);
    g.fillStyle = '#ffb454'; g.beginPath(); g.roundRect(18, h - 206, w - 36, 74, 8); g.fill();
    const [a, b] = p.lines || PORTAL_LINES;
    this.label(g, a, cx, h - 182, 21, '#1b1407', 800, 'center', 1);
    this.label(g, b, cx, h - 156, 21, '#1b1407', 800, 'center', 1);
    this._doorFrame(g, cx, h);
  }
}
