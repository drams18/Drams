/* ══════════════════════════════════════════════════════
   ARPHAN CLUB · renderer : béton, néons blafards, ombres, grain
   Pas de ciel : un mur de fond, un plafond bas, des tubes fluorescents
   dont certains faiblissent, des piliers qui passent au premier plan.
   ══════════════════════════════════════════════════════ */

import { BaseRenderer, rng, hash } from '../BaseRenderer.js';

const INK = '#090a09';
const BONE = '#e8e3d5';
const CEIL = -340;
const DOOR_W = 50, DOOR_H = 86;
const GRAIN = 512;           // px : taille de la tuile de bruit

export class ClubRenderer extends BaseRenderer {
  constructor(universe) {
    super(universe);
    this.collectibleGlow = 'rgba(223, 233, 198, 0.4)';
    this._grainAt = 0; this._gx = 0; this._gy = 0;
  }

  drawSky(ctx) {
    ctx.fillStyle = '#0d0e0d';
    ctx.fillRect(0, 0, this.pxW, this.pxH);
  }

  drawFar(ctx, cam) {
    // Profondeur du parking : piliers et voitures dans la pénombre.
    const far = this.sprite('far', 900, 380, (g, w, h) => {
      g.fillStyle = '#141614'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#1b1d1a'; g.fillRect(0, h - 70, w, 70);
      const r = rng(77);
      for (let x = 40; x < w; x += 180) {
        g.fillStyle = '#1e211d'; g.fillRect(x, 0, 40, h - 40);
        g.fillStyle = '#10110f';
        g.beginPath(); g.roundRect(x + 60 + r() * 20, h - 96, 90, 40, 10); g.fill();
      }
      g.fillStyle = 'rgba(223, 233, 198, 0.06)';
      for (let x = 0; x < w; x += 300) g.fillRect(x + 80, 18, 120, 5);
    });
    this.parallax(ctx, cam, far, 0.55, 20, 0.8);
  }

  drawWorld(ctx, cam, t, level, state) {
    const d = level.decor;

    // Mur du fond : béton banché, bande peinte, taches.
    const wall = this.sprite('wall', 640, -CEIL, (g, w, h) => {
      g.fillStyle = '#2b2d29'; g.fillRect(0, 0, w, h);
      const r = rng(13);
      for (let i = 0; i < 26; i++) {
        g.fillStyle = `rgba(0, 0, 0, ${0.05 + r() * 0.1})`;
        g.fillRect(r() * w, r() * h, 20 + r() * 120, 10 + r() * 90);
      }
      g.fillStyle = 'rgba(0, 0, 0, 0.22)';
      for (let x = 0; x < w; x += 160) g.fillRect(x, 0, 2, h);
      g.fillRect(0, h * 0.5, w, 2);
      g.fillStyle = '#6f3a30'; g.fillRect(0, h - 120, w, 26);
      g.fillStyle = '#3a3c37'; g.fillRect(0, h - 94, w, 94);
    });
    this.tiles(ctx, cam, wall, CEIL);

    // Voitures garées (décor).
    for (let i = 0; i < d.cars.length; i++) {
      if (!this.visible(cam, d.cars[i], 190)) continue;
      this.blit(ctx, this.sprite('pcar', 190, 70, (g) => this._bakeCar(g)), d.cars[i], -70);
    }

    // Sol et plafond.
    const floor = this.sprite('floor', 520, 420, (g, w, h) => {
      g.fillStyle = '#3d3f3a'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#4b4d47'; g.fillRect(0, 0, w, 3);
      g.fillStyle = 'rgba(232, 227, 213, 0.22)';
      for (let x = 60; x < w; x += 260) { g.fillRect(x, 26, 5, 110); }
      g.fillStyle = 'rgba(0, 0, 0, 0.25)'; g.fillRect(0, 150, w, h - 150);
    });
    const ceil = this.sprite('ceil', 520, 600, (g, w, h) => {
      g.fillStyle = '#131412'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#1e201d'; g.fillRect(0, h - 14, w, 14);
      g.fillStyle = '#34362f'; g.fillRect(0, h - 40, w, 9); g.fillRect(0, h - 62, w, 5);
    });
    this.tiles(ctx, cam, floor, 0);
    this.tiles(ctx, cam, ceil, CEIL - 600 + 2);

    // Tubes fluorescents : cône de lumière cuit ; deux d'entre eux faiblissent.
    const cone = this.sprite('cone', 420, -CEIL + 20, (g, w, h) => {
      const grad = g.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, 'rgba(223, 233, 198, 0.3)');
      grad.addColorStop(1, 'rgba(223, 233, 198, 0)');
      g.fillStyle = grad;
      g.beginPath(); g.moveTo(w / 2 - 44, 0); g.lineTo(w / 2 + 44, 0); g.lineTo(w, h); g.lineTo(0, h); g.closePath(); g.fill();
    });
    for (let i = 0; i < d.tubes.length; i++) {
      const x = d.tubes[i];
      if (!this.visible(cam, x - 210, 420)) continue;
      let a = 1;
      if (!this.reduced && d.flicker.includes(i)) a = hash(Math.floor(t * 16) + i * 7) > 0.3 ? 1 : 0.2;
      ctx.globalAlpha = a;
      this.blit(ctx, cone, x - 210, CEIL);
      ctx.fillStyle = '#f3f8e2'; ctx.fillRect(x - 46, CEIL + 2, 92, 5);
      ctx.globalAlpha = 1;
    }

    // Solides et passerelle.
    for (let i = 0; i < level.solids.length; i++) {
      const s = level.solids[i];
      if (s.kind === 'ground' || s.kind === 'ceiling' || !this.visible(cam, s.x, s.w)) continue;
      this._solid(ctx, s);
    }
    for (let i = 0; i < level.platforms.length; i++) {
      const p = level.platforms[i];
      ctx.fillStyle = '#52554d'; ctx.fillRect(p.x, p.y, p.w, 6);
      ctx.fillStyle = INK; ctx.fillRect(p.x, p.y + 6, p.w, 2);
      ctx.fillStyle = '#34362f';
      ctx.fillRect(p.x + 8, CEIL, 3, p.y - CEIL); ctx.fillRect(p.x + p.w - 11, CEIL, 3, p.y - CEIL);
      ctx.fillRect(p.x, p.y - 28, p.w, 2.5);
    }

    for (let i = 0; i < level.locations.length; i++) {
      const l = level.locations[i];
      if (!this.visible(cam, l.x, l.w)) continue;
      this.blit(ctx, this.sprite('loc:' + l.id, l.w, l.h, (g) => this._bakeLocation(g, l)), l.x, l.baseY - l.h);
      this._door(ctx, l);
      if (l.visited) this._stamp(ctx, l);
      if (state.near === l) this.drawNearHighlight(ctx, l, t, this.palette.primary);
    }

    const p = level.portal;
    if (this.visible(cam, p.x, p.w)) {
      this.blit(ctx, this.sprite('portal', p.w, p.h, (g) => this._bakeLift(g, p)), p.x, -p.h);
      // Voyant du monte-charge : rouge, puis vert une fois la visite terminée.
      const on = this.reduced || Math.sin(t * (p.boost ? 5 : 2)) > -0.2;
      ctx.fillStyle = !on ? '#2a2c27' : p.boost ? '#b8e08a' : '#d1483b';
      ctx.beginPath(); ctx.arc(p.doorX, -p.h + 96, 6, 0, Math.PI * 2); ctx.fill();
      this._door(ctx, p);
      if (state.near === p) this.drawNearHighlight(ctx, p, t, this.palette.primary);
    }
  }

  // Piliers au premier plan : défilent plus vite que le monde (profondeur).
  drawFront(ctx, cam, t, level) {
    const pillars = level.decor.pillars;
    const s = this.sprite('pillar', 84, 900, (g, w, h) => {
      g.fillStyle = '#080908'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#14150f';
      for (let y = 600; y < h; y += 40) {
        g.beginPath(); g.moveTo(0, y); g.lineTo(w, y - 30); g.lineTo(w, y - 12); g.lineTo(0, y + 18); g.closePath(); g.fill();
      }
    });
    for (let i = 0; i < pillars.length; i++) {
      const x = cam.cx + (pillars[i] - cam.cx) * 1.45 - 42;
      if (x + 84 < cam.left || x > cam.right) continue;
      this.blit(ctx, s, x, cam.bottom - 900 + 40);
    }
  }

  drawOverlay(ctx, t) {
    ctx.drawImage(this.vignette('vig', 'rgba(0, 0, 0, 1)', 0.86).c, 0, 0);
    // Grain : une grande tuile de bruit (peu de recopies) décalée ~12 fois par seconde.
    const grain = this.sprites.get('grain') || this._bakeGrain();
    if (!this.reduced && t - this._grainAt > 0.08) {
      this._grainAt = t;
      this._gx = Math.floor(Math.random() * GRAIN);
      this._gy = Math.floor(Math.random() * GRAIN);
    }
    ctx.globalAlpha = 0.085;
    for (let y = -this._gy; y < this.pxH; y += GRAIN) {
      for (let x = -this._gx; x < this.pxW; x += GRAIN) ctx.drawImage(grain.c, x, y);
    }
    ctx.globalAlpha = 1;
  }

  bakeCollectible(g, col) {
    // Étiquette d'outil : fiche cartonnée, coin rouge.
    g.fillStyle = BONE; g.fillRect(3, 5, 28, 25);
    g.fillStyle = '#d1483b';
    g.beginPath(); g.moveTo(31, 5); g.lineTo(31, 14); g.lineTo(22, 5); g.closePath(); g.fill();
    g.strokeStyle = INK; g.lineWidth = 1.5; g.strokeRect(3, 5, 28, 25);
    this.label(g, col.skill.abbr, 16, 19, 12, INK, 800);
  }

  _bakeGrain() {
    const c = document.createElement('canvas');
    c.width = c.height = GRAIN;
    const g = c.getContext('2d');
    const img = g.createImageData(GRAIN, GRAIN);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = Math.random() * 255;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    const s = { c, w: GRAIN, h: GRAIN };
    this.sprites.set('grain', s);
    return s;
  }

  _door(ctx, l) {
    if (l.open < 0.02) return;
    ctx.globalAlpha = l.open;
    ctx.fillStyle = '#f3ecd0';
    ctx.fillRect(l.doorX - DOOR_W / 2 + 3, l.baseY - DOOR_H + 3, DOOR_W - 6, DOOR_H - 3);
    ctx.globalAlpha = 1;
  }

  // Lieu visité : un tampon rouge, de travers.
  _stamp(ctx, l) {
    const s = this.sprite('stamp', 70, 30, (g) => {
      g.strokeStyle = '#d1483b'; g.lineWidth = 2.5; g.strokeRect(2, 2, 66, 26);
      this.label(g, 'VU', 35, 16, 16, '#d1483b', 800, 'center', 3);
    });
    ctx.save();
    ctx.translate(l.x + l.w - 46, l.baseY - l.h + 94);       // sous le libellé, sans le recouvrir
    ctx.rotate(-0.16);
    ctx.drawImage(s.c, -35, -15, 70, 30);
    ctx.restore();
  }

  _solid(ctx, s) {
    if (s.kind === 'crate') {
      ctx.fillStyle = '#6a5a41'; ctx.fillRect(s.x, s.y, s.w, s.h);
      ctx.strokeStyle = '#3d3324'; ctx.lineWidth = 3;
      ctx.strokeRect(s.x + 1.5, s.y + 1.5, s.w - 3, s.h - 3);
      ctx.beginPath(); ctx.moveTo(s.x + 3, s.y + 3); ctx.lineTo(s.x + s.w - 3, s.y + s.h - 3); ctx.stroke();
    } else if (s.kind === 'duct') {
      ctx.fillStyle = '#4a4d45'; ctx.fillRect(s.x, s.y, s.w, s.h);
      ctx.fillStyle = '#2a2c27'; ctx.fillRect(s.x, s.y + s.h - 4, s.w, 4);
      ctx.fillRect(s.x + 20, CEIL, 4, s.y - CEIL); ctx.fillRect(s.x + s.w - 24, CEIL, 4, s.y - CEIL);
    } else {
      // Quai et marches : béton, liseré de sécurité jaune et noir.
      ctx.fillStyle = '#55584f'; ctx.fillRect(s.x, s.y, s.w, s.h);
      ctx.fillStyle = '#2a2c27'; ctx.fillRect(s.x, s.y + 9, s.w, 2);
      const stripe = this.sprite('hazard', 60, 9, (g) => {
        g.fillStyle = '#c9a53a'; g.fillRect(0, 0, 60, 9);
        g.fillStyle = INK;
        for (let x = -10; x < 60; x += 20) { g.beginPath(); g.moveTo(x, 9); g.lineTo(x + 9, 0); g.lineTo(x + 19, 0); g.lineTo(x + 10, 9); g.closePath(); g.fill(); }
      });
      for (let x = s.x; x < s.x + s.w; x += 60) {
        const w = Math.min(60, s.x + s.w - x);
        ctx.drawImage(stripe.c, 0, 0, stripe.c.width * (w / 60), stripe.c.height, x, s.y, w, 9);
      }
    }
  }

  _bakeCar(g) {
    g.fillStyle = '#1b1c1a';
    g.beginPath(); g.roundRect(4, 26, 182, 32, 10); g.fill();
    g.beginPath(); g.roundRect(40, 4, 104, 34, 14); g.fill();
    g.fillStyle = '#2c2e2a';
    g.beginPath(); g.roundRect(50, 10, 40, 20, 6); g.fill();
    g.beginPath(); g.roundRect(96, 10, 40, 20, 6); g.fill();
    g.fillStyle = INK;
    g.beginPath(); g.arc(46, 58, 12, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.arc(146, 58, 12, 0, Math.PI * 2); g.fill();
  }

  // Libellé au pochoir + sous-titre en clair.
  _stencil(g, cx, y, loc) {
    this.label(g, loc.label, cx, y, 20, BONE, 800, 'center', 3);
    g.fillStyle = '#d1483b'; g.fillRect(cx - 34, y + 15, 68, 2);
    this.label(g, this.universe.vocabulary.hints[loc.id], cx, y + 30, 11, '#b3ae9f', 500, 'center', 0.5);
  }

  _doorFrame(g, cx, base, color = '#4a4d45') {
    g.fillStyle = INK; g.fillRect(cx - DOOR_W / 2 - 5, base - DOOR_H - 5, DOOR_W + 10, DOOR_H + 5);
    g.fillStyle = color; g.fillRect(cx - DOOR_W / 2, base - DOOR_H, DOOR_W, DOOR_H);
    g.fillStyle = 'rgba(0, 0, 0, 0.3)';
    g.fillRect(cx - DOOR_W / 2, base - DOOR_H + 26, DOOR_W, 2); g.fillRect(cx - DOOR_W / 2, base - 30, DOOR_W, 2);
    g.fillStyle = BONE; g.fillRect(cx + 12, base - 46, 4, 14);
    // Applique grillagée au-dessus de la porte.
    g.fillStyle = '#f3f8e2'; g.fillRect(cx - 10, base - DOOR_H - 20, 20, 8);
    const grad = g.createRadialGradient(cx, base - DOOR_H - 14, 2, cx, base - DOOR_H - 14, 70);
    grad.addColorStop(0, 'rgba(243, 248, 226, 0.34)');
    grad.addColorStop(1, 'rgba(243, 248, 226, 0)');
    g.fillStyle = grad; g.fillRect(cx - 70, base - DOOR_H - 60, 140, 140);
  }

  _bakeLocation(g, l) {
    const w = l.w, h = l.h, cx = l.doorX - l.x;
    g.fillStyle = '#32342f'; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(0, 0, 0, 0.3)'; g.fillRect(0, 0, 4, h); g.fillRect(w - 4, 0, 4, h);
    if (l.style === 'steel') {
      this._doorFrame(g, cx, h, '#5a5d54');
    } else if (l.style === 'phone') {
      // Ligne directe : un téléphone mural dans son alcôve.
      g.fillStyle = INK; g.fillRect(22, h - 132, 46, 74);
      g.fillStyle = '#7a7d72'; g.fillRect(28, h - 126, 34, 50);
      g.fillStyle = INK; g.fillRect(34, h - 118, 22, 12);
      g.strokeStyle = '#7a7d72'; g.lineWidth = 2;
      g.beginPath(); g.moveTo(45, h - 76); g.quadraticCurveTo(30, h - 44, 48, h - 34); g.stroke();
      this._doorFrame(g, cx, h, '#4d5048');
    } else if (l.style === 'archive') {
      // Case files : porte vitrée dépolie, casiers d'archives.
      for (let i = 0; i < 3; i++) {
        g.fillStyle = '#4a4d45'; g.fillRect(14 + i * 26, h - 96, 22, 96);
        g.fillStyle = INK; for (let y = h - 90; y < h - 6; y += 22) g.fillRect(17 + i * 26, y, 16, 2);
      }
      this._doorFrame(g, cx, h, '#5a5d54');
      g.fillStyle = 'rgba(243, 236, 208, 0.5)'; g.fillRect(cx - 17, h - DOOR_H + 8, 34, 30);
    } else {
      // Dossiers : rideau de fer entrouvert, lumière chaude dessous.
      g.fillStyle = INK; g.fillRect(24, h - 150, w - 48, 150);
      g.fillStyle = '#5a5d54'; g.fillRect(30, h - 144, w - 60, 100);
      g.fillStyle = 'rgba(0, 0, 0, 0.28)';
      for (let y = h - 138; y < h - 46; y += 10) g.fillRect(30, y, w - 60, 2);
      g.fillStyle = '#e9c98a'; g.fillRect(30, h - 44, w - 60, 44);
      g.fillStyle = 'rgba(0, 0, 0, 0.5)';
      for (let x = 44; x < w - 60; x += 34) g.fillRect(x, h - 34, 22, 34);
      this._doorFrame(g, cx, h, '#4d5048');
    }
    this._stencil(g, cx, 34, l);
  }

  // Le portail : un monte-charge.
  _bakeLift(g, p) {
    const w = p.w, h = p.h, cx = p.doorX - p.x;
    g.fillStyle = '#32342f'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#c9a53a'; g.fillRect(0, 0, w, 12); g.fillRect(0, h - 10, w, 10);
    g.fillStyle = INK;
    for (let x = -10; x < w; x += 28) {
      g.beginPath(); g.moveTo(x, 12); g.lineTo(x + 12, 0); g.lineTo(x + 26, 0); g.lineTo(x + 14, 12); g.closePath(); g.fill();
    }
    this.label(g, 'CONSTRUISEZ', cx, 40, 19, BONE, 800, 'center', 2.5);
    this.label(g, 'VOTRE PROJET', cx, 64, 19, BONE, 800, 'center', 2.5);
    g.fillStyle = INK; g.fillRect(cx - 62, h - 164, 124, 154);
    g.fillStyle = '#5a5d54'; g.fillRect(cx - 56, h - 158, 54, 148); g.fillRect(cx + 2, h - 158, 54, 148);
    g.fillStyle = 'rgba(0, 0, 0, 0.3)';
    for (let y = h - 150; y < h - 12; y += 12) g.fillRect(cx - 56, y, 112, 2);
  }
}
