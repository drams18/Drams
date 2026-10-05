/* ══════════════════════════════════════════════════════
   LE PALAIS · renderer : marbre sombre, or, bougies, ombres
   Pas de ciel : un mur de fond, un plafond bas, des lustres dont certaines
   bougies vacillent, des colonnes qui passent au premier plan.
   ══════════════════════════════════════════════════════ */

import { BaseRenderer, rng, hash } from '../BaseRenderer.js';

const INK = '#08060b';
const BONE = '#efe6d2';
const GOLD = '#d9b56a';
const BRASS = '#5c4a2a';       // or dans l'ombre
const CRIMSON = '#6e2233';     // tapis, tentures
const SEAL = '#d95a70';        // cramoisi clair : sceaux
const WOOD = '#4b3526';
const CEIL = -340;
const DOOR_W = 50, DOOR_H = 86;
const GRAIN = 512;           // px : taille de la tuile de bruit

export class ClubRenderer extends BaseRenderer {
  constructor(universe) {
    super(universe);
    this.collectibleGlow = 'rgba(217, 181, 106, 0.45)';
    this._grainAt = 0; this._gx = 0; this._gy = 0;
  }

  drawSky(ctx) {
    ctx.fillStyle = '#0a080d';
    ctx.fillRect(0, 0, this.pxW, this.pxH);
  }

  drawFar(ctx, cam) {
    // Profondeur de la salle : colonnes et hautes fenêtres dans la pénombre.
    const far = this.sprite('far', 900, 380, (g, w, h) => {
      g.fillStyle = '#120e17'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#19141f'; g.fillRect(0, h - 70, w, 70);
      for (let x = 40; x < w; x += 180) {
        g.fillStyle = '#1e1826'; g.fillRect(x, 0, 40, h - 40);
        g.fillStyle = '#0d0a12';
        g.beginPath(); g.roundRect(x + 76, 70, 68, h - 150, [34, 34, 0, 0]); g.fill();
        g.fillStyle = 'rgba(150, 140, 200, 0.1)';
        g.beginPath(); g.roundRect(x + 84, 80, 52, h - 168, [26, 26, 0, 0]); g.fill();
      }
      g.fillStyle = 'rgba(217, 181, 106, 0.08)';
      g.fillRect(0, 18, w, 3);
    });
    this.parallax(ctx, cam, far, 0.55, 20, 0.8);
  }

  drawWorld(ctx, cam, t, level, state) {
    const d = level.decor;

    // Mur du fond : marbre veiné, panneaux, tenture basse filetée d'or.
    const wall = this.sprite('wall', 640, -CEIL, (g, w, h) => {
      g.fillStyle = '#231b2b'; g.fillRect(0, 0, w, h);
      const r = rng(13);
      for (let i = 0; i < 26; i++) {
        g.fillStyle = `rgba(0, 0, 0, ${0.05 + r() * 0.1})`;
        g.fillRect(r() * w, r() * h, 20 + r() * 120, 10 + r() * 90);
      }
      g.fillStyle = 'rgba(0, 0, 0, 0.22)';
      for (let x = 0; x < w; x += 160) g.fillRect(x, 0, 2, h);
      g.fillRect(0, h * 0.5, w, 2);
      g.fillStyle = CRIMSON; g.fillRect(0, h - 120, w, 26);
      g.fillStyle = 'rgba(217, 181, 106, 0.55)'; g.fillRect(0, h - 122, w, 2); g.fillRect(0, h - 96, w, 2);
      g.fillStyle = '#2e2536'; g.fillRect(0, h - 94, w, 94);
    });
    this.tiles(ctx, cam, wall, CEIL);

    // Vasques de braise le long du mur (décor).
    for (let i = 0; i < d.braziers.length; i++) {
      if (!this.visible(cam, d.braziers[i], 190)) continue;
      this.blit(ctx, this.sprite('brazier', 190, 110, (g) => this._bakeBrazier(g)), d.braziers[i], -110);
    }

    // Sol et plafond.
    const floor = this.sprite('floor', 520, 420, (g, w, h) => {
      g.fillStyle = '#2c2433'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#4a3d55'; g.fillRect(0, 0, w, 3);
      g.fillStyle = 'rgba(239, 230, 210, 0.08)';
      for (let x = 0; x < w; x += 130) g.fillRect(x, 3, 2, 147);
      // Tapis d'apparat.
      g.fillStyle = CRIMSON; g.fillRect(0, 44, w, 62);
      g.fillStyle = 'rgba(217, 181, 106, 0.6)'; g.fillRect(0, 48, w, 2); g.fillRect(0, 100, w, 2);
      g.fillStyle = 'rgba(0, 0, 0, 0.25)'; g.fillRect(0, 150, w, h - 150);
    });
    const ceil = this.sprite('ceil', 520, 600, (g, w, h) => {
      g.fillStyle = '#0f0c13'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#1a1520'; g.fillRect(0, h - 14, w, 14);
      g.fillStyle = BRASS; g.fillRect(0, h - 40, w, 9); g.fillRect(0, h - 62, w, 5);
    });
    this.tiles(ctx, cam, floor, 0);
    this.tiles(ctx, cam, ceil, CEIL - 600 + 2);

    // Lustres : cône de lumière cuit ; deux d'entre eux vacillent.
    const cone = this.sprite('cone', 420, -CEIL + 20, (g, w, h) => {
      const grad = g.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, 'rgba(255, 200, 120, 0.26)');
      grad.addColorStop(1, 'rgba(255, 200, 120, 0)');
      g.fillStyle = grad;
      g.beginPath(); g.moveTo(w / 2 - 44, 0); g.lineTo(w / 2 + 44, 0); g.lineTo(w, h); g.lineTo(0, h); g.closePath(); g.fill();
    });
    const lustre = this.sprite('lustre', 120, 50, (g) => this._bakeChandelier(g));
    for (let i = 0; i < d.chandeliers.length; i++) {
      const x = d.chandeliers[i];
      if (!this.visible(cam, x - 210, 420)) continue;
      let a = 1;
      if (!this.reduced && d.flicker.includes(i)) a = hash(Math.floor(t * 9) + i * 7) > 0.3 ? 1 : 0.6;
      ctx.globalAlpha = a;
      this.blit(ctx, cone, x - 210, CEIL + 30);
      ctx.globalAlpha = 1;
      this.blit(ctx, lustre, x - 60, CEIL);
    }

    // Solides et tribune.
    for (let i = 0; i < level.solids.length; i++) {
      const s = level.solids[i];
      if (s.kind === 'ground' || s.kind === 'ceiling' || !this.visible(cam, s.x, s.w)) continue;
      this._solid(ctx, s);
    }
    for (let i = 0; i < level.platforms.length; i++) {
      const p = level.platforms[i];
      ctx.fillStyle = '#b99652'; ctx.fillRect(p.x, p.y, p.w, 6);
      ctx.fillStyle = INK; ctx.fillRect(p.x, p.y + 6, p.w, 2);
      ctx.fillStyle = BRASS;
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
      this.blit(ctx, this.sprite('portal', p.w, p.h, (g) => this._bakeDoors(g, p)), p.x, -p.h);
      // Lanterne de la grande porte : cramoisie, puis dorée une fois la visite terminée.
      const on = this.reduced || Math.sin(t * (p.boost ? 5 : 2)) > -0.2;
      ctx.fillStyle = !on ? '#2a2132' : p.boost ? '#ffd9a0' : SEAL;
      ctx.beginPath(); ctx.arc(p.doorX, -p.h + 96, 6, 0, Math.PI * 2); ctx.fill();
      this._door(ctx, p);
      if (state.near === p) this.drawNearHighlight(ctx, p, t, this.palette.primary);
    }
  }

  // Colonnes au premier plan : défilent plus vite que le monde (profondeur).
  drawFront(ctx, cam, t, level) {
    const pillars = level.decor.pillars;
    const s = this.sprite('pillar', 84, 900, (g, w, h) => {
      g.fillStyle = '#07050a'; g.fillRect(0, 0, w, h);
      // Cannelures.
      g.fillStyle = '#120e17';
      for (let x = 12; x < w - 8; x += 18) g.fillRect(x, 0, 4, h);
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
    ctx.globalAlpha = 0.055;
    for (let y = -this._gy; y < this.pxH; y += GRAIN) {
      for (let x = -this._gx; x < this.pxW; x += GRAIN) ctx.drawImage(grain.c, x, y);
    }
    ctx.globalAlpha = 1;
  }

  bakeCollectible(g, col) {
    // Atout : un médaillon d'or.
    g.fillStyle = GOLD; g.beginPath(); g.arc(17, 17, 15, 0, Math.PI * 2); g.fill();
    g.strokeStyle = INK; g.lineWidth = 1.5; g.stroke();
    g.strokeStyle = 'rgba(8, 6, 11, 0.45)'; g.lineWidth = 1;
    g.beginPath(); g.arc(17, 17, 12, 0, Math.PI * 2); g.stroke();
    this.label(g, col.skill.abbr, 17, 18, 11, INK, 800);
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
    ctx.fillStyle = '#ffe2b0';
    ctx.fillRect(l.doorX - DOOR_W / 2 + 3, l.baseY - DOOR_H + 3, DOOR_W - 6, DOOR_H - 3);
    ctx.globalAlpha = 1;
  }

  // Salle visitée : un sceau cramoisi, de travers.
  _stamp(ctx, l) {
    const s = this.sprite('stamp', 70, 30, (g) => {
      g.strokeStyle = SEAL; g.lineWidth = 2.5; g.strokeRect(2, 2, 66, 26);
      this.label(g, 'VU', 35, 16, 16, SEAL, 800, 'center', 3);
    });
    ctx.save();
    ctx.translate(l.x + l.w - 46, l.baseY - l.h + 94);       // sous le libellé, sans le recouvrir
    ctx.rotate(-0.16);
    ctx.drawImage(s.c, -35, -15, 70, 30);
    ctx.restore();
  }

  _solid(ctx, s) {
    if (s.kind === 'crate') {
      // Socle de pierre cerclé d'or.
      ctx.fillStyle = '#3a303f'; ctx.fillRect(s.x, s.y, s.w, s.h);
      ctx.fillStyle = '#4a3d55'; ctx.fillRect(s.x - 3, s.y, s.w + 6, 6);
      ctx.fillStyle = GOLD; ctx.fillRect(s.x, s.y + 8, s.w, 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'; ctx.fillRect(s.x, s.y + s.h - 6, s.w, 6);
    } else if (s.kind === 'duct') {
      // Linteau suspendu par des chaînes.
      ctx.fillStyle = '#3d3345'; ctx.fillRect(s.x, s.y, s.w, s.h);
      ctx.fillStyle = '#1c1622'; ctx.fillRect(s.x, s.y + s.h - 4, s.w, 4);
      ctx.fillStyle = BRASS;
      ctx.fillRect(s.x + 20, CEIL, 4, s.y - CEIL); ctx.fillRect(s.x + s.w - 24, CEIL, 4, s.y - CEIL);
    } else {
      // Estrade et marches : marbre, galon cramoisi et or.
      ctx.fillStyle = '#3a303f'; ctx.fillRect(s.x, s.y, s.w, s.h);
      ctx.fillStyle = '#1c1622'; ctx.fillRect(s.x, s.y + 9, s.w, 2);
      const trim = this.sprite('trim', 60, 9, (g) => {
        g.fillStyle = CRIMSON; g.fillRect(0, 0, 60, 9);
        g.fillStyle = GOLD; g.fillRect(0, 0, 60, 2);
        for (let x = 5; x < 60; x += 20) { g.beginPath(); g.moveTo(x, 5.5); g.lineTo(x + 5, 3); g.lineTo(x + 10, 5.5); g.lineTo(x + 5, 8); g.closePath(); g.fill(); }
      });
      for (let x = s.x; x < s.x + s.w; x += 60) {
        const w = Math.min(60, s.x + s.w - x);
        ctx.drawImage(trim.c, 0, 0, trim.c.width * (w / 60), trim.c.height, x, s.y, w, 9);
      }
    }
  }

  // Lustre : chaîne, couronne d'or, cinq bougies.
  _bakeChandelier(g) {
    g.fillStyle = BRASS; g.fillRect(59, 0, 2, 22);
    g.fillStyle = GOLD;
    g.beginPath(); g.ellipse(60, 30, 48, 5, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = BRASS; g.beginPath(); g.ellipse(60, 32, 40, 3, 0, 0, Math.PI * 2); g.fill();
    for (let i = 0; i < 5; i++) {
      const x = 18 + i * 21;
      g.fillStyle = BONE; g.fillRect(x - 2, 17, 4, 11);
      g.fillStyle = '#ffd9a0'; g.beginPath(); g.ellipse(x, 13, 2.6, 5, 0, 0, Math.PI * 2); g.fill();
    }
  }

  // Vasque de braise sur son pied, halo chaud.
  _bakeBrazier(g) {
    const cx = 95;
    const grad = g.createRadialGradient(cx, 40, 4, cx, 40, 90);
    grad.addColorStop(0, 'rgba(255, 170, 90, 0.3)');
    grad.addColorStop(1, 'rgba(255, 170, 90, 0)');
    g.fillStyle = grad; g.fillRect(0, 0, 190, 110);
    g.fillStyle = '#1c1622'; g.fillRect(cx - 4, 58, 8, 44); g.fillRect(cx - 22, 102, 44, 8);
    g.fillStyle = BRASS;
    g.beginPath(); g.moveTo(cx - 34, 44); g.lineTo(cx + 34, 44); g.lineTo(cx + 20, 60); g.lineTo(cx - 20, 60); g.closePath(); g.fill();
    g.fillStyle = GOLD; g.fillRect(cx - 36, 42, 72, 3);
    g.fillStyle = '#ff9a55'; g.beginPath(); g.ellipse(cx, 41, 26, 4, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#ffd9a0'; g.beginPath(); g.ellipse(cx, 40, 12, 2.5, 0, 0, Math.PI * 2); g.fill();
  }

  // Libellé gravé + sous-titre en clair.
  _stencil(g, cx, y, loc) {
    this.label(g, loc.label, cx, y, 20, BONE, 700, 'center', 3);
    g.fillStyle = GOLD; g.fillRect(cx - 34, y + 15, 68, 2);
    this.label(g, this.universe.vocabulary.hints[loc.id], cx, y + 30, 11, '#b9ad98', 500, 'center', 0.5);
  }

  _doorFrame(g, cx, base, color = WOOD) {
    g.fillStyle = INK; g.fillRect(cx - DOOR_W / 2 - 5, base - DOOR_H - 5, DOOR_W + 10, DOOR_H + 5);
    g.fillStyle = color; g.fillRect(cx - DOOR_W / 2, base - DOOR_H, DOOR_W, DOOR_H);
    g.strokeStyle = 'rgba(217, 181, 106, 0.7)'; g.lineWidth = 1.5;
    g.strokeRect(cx - DOOR_W / 2 + 0.75, base - DOOR_H + 0.75, DOOR_W - 1.5, DOOR_H - 0.75);
    g.fillStyle = 'rgba(0, 0, 0, 0.3)';
    g.fillRect(cx - DOOR_W / 2, base - DOOR_H + 26, DOOR_W, 2); g.fillRect(cx - DOOR_W / 2, base - 30, DOOR_W, 2);
    g.fillStyle = GOLD; g.fillRect(cx + 12, base - 46, 4, 14);
    // Applique à bougie au-dessus de la porte.
    g.fillStyle = '#ffd9a0'; g.fillRect(cx - 10, base - DOOR_H - 20, 20, 8);
    const grad = g.createRadialGradient(cx, base - DOOR_H - 14, 2, cx, base - DOOR_H - 14, 70);
    grad.addColorStop(0, 'rgba(255, 205, 130, 0.34)');
    grad.addColorStop(1, 'rgba(255, 205, 130, 0)');
    g.fillStyle = grad; g.fillRect(cx - 70, base - DOOR_H - 60, 140, 140);
  }

  _bakeLocation(g, l) {
    const w = l.w, h = l.h, cx = l.doorX - l.x;
    g.fillStyle = '#2a2132'; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(0, 0, 0, 0.3)'; g.fillRect(0, 0, 4, h); g.fillRect(w - 4, 0, 4, h);
    g.fillStyle = 'rgba(217, 181, 106, 0.5)'; g.fillRect(4, 0, w - 8, 2);
    if (l.style === 'hall') {
      this._doorFrame(g, cx, h, '#5a4030');
    } else if (l.style === 'bell') {
      // Demander audience : une cloche dans son alcôve.
      g.fillStyle = INK; g.beginPath(); g.roundRect(22, h - 132, 46, 74, [23, 23, 0, 0]); g.fill();
      g.fillStyle = BRASS; g.fillRect(44, h - 126, 2, 12);
      g.fillStyle = GOLD;
      g.beginPath(); g.moveTo(31, h - 88); g.quadraticCurveTo(33, h - 116, 45, h - 116); g.quadraticCurveTo(57, h - 116, 59, h - 88); g.closePath(); g.fill();
      g.fillRect(28, h - 89, 34, 3);
      g.beginPath(); g.arc(45, h - 82, 3.5, 0, Math.PI * 2); g.fill();
      g.strokeStyle = BRASS; g.lineWidth = 2;
      g.beginPath(); g.moveTo(45, h - 78); g.quadraticCurveTo(38, h - 54, 47, h - 36); g.stroke();
      this._doorFrame(g, cx, h);
    } else if (l.style === 'library') {
      // Chroniques : rayonnages de registres, porte à vitrail.
      for (let i = 0; i < 3; i++) {
        g.fillStyle = WOOD; g.fillRect(14 + i * 26, h - 96, 22, 96);
        g.fillStyle = INK; for (let y = h - 90; y < h - 6; y += 22) g.fillRect(17 + i * 26, y, 16, 2);
        g.fillStyle = i === 1 ? CRIMSON : BRASS; g.fillRect(19 + i * 26, h - 84, 5, 14); g.fillRect(27 + i * 26, h - 62, 5, 14);
      }
      this._doorFrame(g, cx, h, '#5a4030');
      g.fillStyle = 'rgba(255, 220, 160, 0.45)'; g.fillRect(cx - 17, h - DOOR_H + 8, 34, 30);
    } else {
      // Collection : tenture relevée, pièces exposées dans la lumière.
      g.fillStyle = INK; g.fillRect(24, h - 150, w - 48, 150);
      g.fillStyle = CRIMSON; g.fillRect(30, h - 144, w - 60, 100);
      g.fillStyle = 'rgba(0, 0, 0, 0.28)';
      for (let x = 40; x < w - 34; x += 16) g.fillRect(x, h - 144, 3, 100);
      g.fillStyle = GOLD; g.fillRect(30, h - 48, w - 60, 4);
      g.fillStyle = '#e9c98a'; g.fillRect(30, h - 44, w - 60, 44);
      g.fillStyle = 'rgba(0, 0, 0, 0.5)';
      for (let x = 44; x < w - 60; x += 34) g.fillRect(x, h - 34, 22, 34);
      this._doorFrame(g, cx, h);
    }
    this._stencil(g, cx, 34, l);
  }

  // Le portail : une grande porte à deux vantaux.
  _bakeDoors(g, p) {
    const w = p.w, h = p.h, cx = p.doorX - p.x;
    g.fillStyle = '#2a2132'; g.fillRect(0, 0, w, h);
    g.fillStyle = GOLD; g.fillRect(0, 0, w, 12); g.fillRect(0, h - 10, w, 10);
    g.fillStyle = INK; g.fillRect(0, 8, w, 1.5);
    this.label(g, 'CONSTRUISEZ', cx, 40, 19, BONE, 700, 'center', 2.5);
    this.label(g, 'VOTRE PROJET', cx, 64, 19, BONE, 700, 'center', 2.5);
    g.fillStyle = INK; g.fillRect(cx - 62, h - 164, 124, 154);
    g.fillStyle = '#5a4030'; g.fillRect(cx - 56, h - 158, 54, 148); g.fillRect(cx + 2, h - 158, 54, 148);
    g.strokeStyle = 'rgba(217, 181, 106, 0.6)'; g.lineWidth = 1.5;
    for (const x of [cx - 48, cx + 10]) { g.strokeRect(x, h - 148, 38, 56); g.strokeRect(x, h - 82, 38, 62); }
    g.fillStyle = GOLD; g.fillRect(cx - 8, h - 92, 4, 14); g.fillRect(cx + 4, h - 92, 4, 14);
  }
}
