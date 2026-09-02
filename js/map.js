/* ══════════════════════════════════════════════════════
   MAP.JS — Side-scroller world (ville nocturne néon / comics)
   Spawn left, all buildings to the right, close together.
   Réécriture visuelle uniquement : structure de données, API
   (nearBuilding / draw) et positions INCHANGÉES.
   ══════════════════════════════════════════════════════ */

'use strict';

const WORLD_WIDTH     = 1780;
const GROUND_RATIO    = 0.72;
const INTERACT_RADIUS = 85;

// ── Player spawn position (left side) ────────────────
const SPAWN_X = 80;

// ── Palette monde — BLEU NUIT urbain (Spider-Verse) ──
const CITY = {
  ink:      '#01010a',
  facade:   '#16223f',
  facadeHi: '#1e2c50',
  asphalt:  '#131d33',
  red:      '#ff123d',
  magenta:  '#ff2bb0',
  violet:   '#8a3bff',
  cyan:     '#19e8ff',
  paper:    '#f5f6ff',
};

// ── Buildings layout ─────────────────────────────────
// Packed together to the right of spawn. Couleurs = nouvelle DA.
const BUILDINGS_DATA = [
  {
    id: 'profile',
    label: 'PROFIL',
    accent: CITY.cyan,
    wallColor: CITY.facade,
    wallDark: '#101a33',
    roofColor: '#16223f',
    roofDark: '#0c1428',
    windowColor: CITY.cyan,
    x: 200, w: 230, h: 240,
  },
  {
    id: 'parcours',
    label: 'PARCOURS',
    accent: CITY.violet,
    wallColor: CITY.facade,
    wallDark: '#101a33',
    roofColor: '#16223f',
    roofDark: '#0c1428',
    windowColor: CITY.violet,
    x: 460, w: 230, h: 240,
  },
  {
    id: 'contact',
    label: 'CONTACT',
    accent: CITY.magenta,
    wallColor: CITY.facade,
    wallDark: '#101a33',
    roofColor: '#16223f',
    roofDark: '#0c1428',
    windowColor: CITY.magenta,
    x: 980, w: 230, h: 240,
  },
  {
    id: 'projets',
    label: 'GALERIE',
    accent: CITY.red,
    wallColor: CITY.facade,
    wallDark: '#101a33',
    roofColor: '#16223f',
    roofDark: '#0c1428',
    windowColor: CITY.red,
    x: 1260, w: 380, h: 240,
  },
];

// Add computed door positions
BUILDINGS_DATA.forEach(b => {
  b.doorX = b.x + Math.floor(b.w / 2);
  b.visited = false;
});

// ── Porte-portail « Construisez votre projet » ──────────
// Pas une maison : une faille d'énergie isolée, logée dans l'espace
// vide entre PARCOURS (fin x≈690) et CONTACT (début x≈980).
// Interagir dessus ouvre une NOUVELLE PAGE.
const SPECIAL_DOOR = {
  id: 'build-project',
  label: 'CONSTRUISEZ VOTRE PROJET',
  promptLabel: 'CONSTRUIRE UN PROJET',
  href: 'construire-projet.html',
  accent: CITY.cyan,
  isPortal: true,
  x: 769, w: 132, h: 216,
};
SPECIAL_DOOR.doorX = SPECIAL_DOOR.x + Math.floor(SPECIAL_DOOR.w / 2);

// ── Nuées de lumière / smog (parallaxe) ──────────────
const CLOUDS = [
  { x: 100,  y: 55,  w: 100, h: 38 },
  { x: 450,  y: 38,  w: 80,  h: 30 },
  { x: 800,  y: 70,  w: 120, h: 42 },
  { x: 1150, y: 45,  w: 95,  h: 34 },
  { x: 1550, y: 62,  w: 110, h: 40 },
];

// ── Lampadaires / enseignes néon en silhouette ───────
const TREES = [50, 390, 650, 900, 1160, 1680];

class GameMap {
  constructor() {
    this._cloudOffset = 0;
    this._htPattern = null;
    this._rgb        = Object.create(null);  // mémo _hexToRgb
    this._grad       = Object.create(null);  // dégradés dépendant de la taille (invalidés au resize)
    this._cloudGrads = null;                 // dégradés nuages (constants)
    this._labels     = Object.create(null);  // sprites de texte néon pré-rendus
    this._sky        = null;                  // { under, over } — ciel statique bufferisé
    this._skyline    = null;                  // { far, near }   — skyline statique bufferisée
    this._sizeKey    = '';

    // Les sprites de texte néon sont pré-rendus : si la police pixel n'est pas
    // encore chargée au 1er rendu, on jette le cache une fois prête.
    if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => { this._labels = Object.create(null); });
    }
  }

  nearBuilding(playerX, playerY) {
    for (const b of BUILDINGS_DATA) {
      const dist = Math.abs(playerX - b.doorX);
      if (dist < INTERACT_RADIUS) return b;
    }
    if (Math.abs(playerX - SPECIAL_DOOR.doorX) < INTERACT_RADIUS) return SPECIAL_DOOR;
    return null;
  }

  // Trame halftone mise en cache (une seule fois).
  _halftone(ctx) {
    if (this._htPattern) return this._htPattern;
    const p = document.createElement('canvas');
    p.width = p.height = 6;
    const c = p.getContext('2d');
    c.fillStyle = 'rgba(255,255,255,0.05)';
    c.beginPath();
    c.arc(1.6, 1.6, 1, 0, Math.PI * 2);
    c.fill();
    this._htPattern = ctx.createPattern(p, 'repeat');
    return this._htPattern;
  }

  draw(ctx, cameraX, canvasH, tick) {
    const groundY = Math.round(canvasH * GROUND_RATIO);

    // Invalide les buffers/dégradés statiques uniquement quand la taille change.
    const sizeKey = ctx.canvas.width + 'x' + canvasH;
    if (sizeKey !== this._sizeKey) {
      this._sizeKey = sizeKey;
      this._sky     = null;
      this._skyline = null;
      this._grad    = Object.create(null);
    }

    this._drawSky(ctx, canvasH, tick);
    this._drawSkyline(ctx, cameraX, groundY);
    this._drawClouds(ctx, cameraX, groundY);
    this._drawGround(ctx, cameraX, groundY, canvasH);
    this._drawTrees(ctx, cameraX, groundY, tick);
    this._drawBuildings(ctx, cameraX, groundY, tick);
    this._drawPortal(ctx, cameraX, groundY, tick);
  }

  _drawSky(ctx, canvasH, tick) {
    const w = ctx.canvas.width;
    const skyH = canvasH * GROUND_RATIO;
    const sky = this._ensureSky(w, skyH);

    ctx.drawImage(sky.under, 0, 0);

    // Éclats / étoiles — seul élément animé du ciel (scintillement).
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    for (let i = 0; i < 60; i++) {
      const sx = (i * 137.5) % w;
      const sy = (i * 89.3) % skyH;
      const tw = 0.4 + 0.6 * Math.abs(Math.sin(tick * 0.04 + i));
      ctx.globalAlpha = tw;
      ctx.fillRect(sx, sy, 1.5, 1.5);
    }
    ctx.globalAlpha = 1;

    ctx.drawImage(sky.over, 0, 0);
  }

  // Ciel 100 % statique pré-rendu : dégradés + lune + halos (calque « under »,
  // sous les étoiles) puis fils de toile + trame halftone (calque « over »).
  // Élimine ~5 créations de dégradés + 3 grands fillRect par frame.
  _ensureSky(w, skyH) {
    if (this._sky) return this._sky;
    const H = Math.ceil(skyH);
    const make = () => {
      const c = document.createElement('canvas');
      c.width = w; c.height = H;
      return c;
    };

    const under = make();
    const u = under.getContext('2d');
    const grad = u.createLinearGradient(0, 0, 0, skyH);
    grad.addColorStop(0, '#0e1630');
    grad.addColorStop(0.5, '#16213f');
    grad.addColorStop(1, '#1b1533');
    u.fillStyle = grad;
    u.fillRect(0, 0, w, skyH);

    const cx = w * 0.78;
    const cy = skyH * 0.34;
    const r  = Math.max(60, w * 0.09);
    const halo = u.createRadialGradient(cx, cy, 0, cx, cy, r * 3);
    halo.addColorStop(0, 'rgba(255,43,176,0.5)');
    halo.addColorStop(0.35, 'rgba(138,59,255,0.22)');
    halo.addColorStop(1, 'rgba(138,59,255,0)');
    u.fillStyle = halo;
    u.fillRect(0, 0, w, skyH);
    u.fillStyle = 'rgba(255,60,190,0.85)';
    u.beginPath();
    u.arc(cx, cy, r, 0, Math.PI * 2);
    u.fill();

    const low = u.createLinearGradient(0, skyH - 120, 0, skyH);
    low.addColorStop(0, 'rgba(25,232,255,0)');
    low.addColorStop(1, 'rgba(25,232,255,0.16)');
    u.fillStyle = low;
    u.fillRect(0, skyH - 120, w, 120);

    const over = make();
    const o = over.getContext('2d');
    o.strokeStyle = 'rgba(255,255,255,0.05)';
    o.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      const gx = ((i * 261) % (w + 200)) - 100;
      o.beginPath();
      o.moveTo(gx, -20);
      o.lineTo(gx + skyH * 0.7, skyH);
      o.stroke();
      o.beginPath();
      o.moveTo(gx + 140, -20);
      o.lineTo(gx + 140 - skyH * 0.7, skyH);
      o.stroke();
    }
    const ht = this._halftone(o);
    if (ht) {
      o.fillStyle = ht;
      o.fillRect(0, 0, w, skyH);
    }

    this._sky = { under, over };
    return this._sky;
  }

  // Skyline dense façon New York — 2 couches de parallaxe, 100 % statiques :
  // pré-rendues une fois dans des buffers, puis blittées avec décalage
  // parallaxe (2 drawImage/frame au lieu de ~2500 fillRect).
  _drawSkyline(ctx, cameraX, groundY) {
    const s = this._ensureSkyline(ctx.canvas.width);
    ctx.drawImage(s.far.buf,  Math.round(s.far.x0  - cameraX * s.far.par),  groundY - s.far.h);
    ctx.drawImage(s.near.buf, Math.round(s.near.x0 - cameraX * s.near.par), groundY - s.near.h);
  }

  _ensureSkyline(w) {
    if (this._skyline) return this._skyline;

    const bake = (o) => {
      // Plage de « seeds » couvrant tout le déplacement caméra + le viewport.
      const S0 = -2;
      const S1 = Math.ceil((w + WORLD_WIDTH * o.par) / o.step) + 2;
      const bufH = o.hMin + o.hMod + 40;
      const buf = document.createElement('canvas');
      buf.width  = (S1 - S0 + 1) * o.step;
      buf.height = bufH;
      const g = buf.getContext('2d');
      const base = bufH;

      for (let seed = S0; seed <= S1; seed++) {
        const bx = (seed - S0) * o.step;
        const bh = o.hMin + ((seed * 53) % o.hMod);
        const bw = o.wMin + ((seed * 29) % o.wMod);
        g.fillStyle = o.color;
        g.fillRect(bx, base - bh, bw, bh);

        // Redents / château d'eau / antenne selon le seed → variété NYC
        const kind = seed % 3;
        if (kind === 0) {
          g.fillRect(bx + bw * 0.2, base - bh - 18, bw * 0.6, 18);       // redent
        } else if (kind === 1) {
          g.fillRect(bx + bw * 0.5 - 8, base - bh - 22, 16, 14);         // cuve
          g.fillRect(bx + bw * 0.5 - 2, base - bh - 30, 4, 8);           // mât
        } else {
          g.fillRect(bx + bw * 0.5 - 1, base - bh - 26, 2, 26);          // antenne
        }

        // Fenêtres allumées cyan / magenta
        g.fillStyle = seed % 2 ? o.winA : o.winB;
        for (let wy = base - bh + 12; wy < base - 8; wy += 16) {
          for (let wx = bx + 8; wx < bx + bw - 8; wx += 14) {
            if ((wx + wy + seed) % 3) g.fillRect(wx, wy, 4, 4);
          }
        }
      }
      return { buf, x0: S0 * o.step, par: o.par, h: bufH };
    };

    this._skyline = {
      far: bake({
        par: 0.22, step: 120, color: '#0b1122',
        hMin: 70, hMod: 120, wMin: 46, wMod: 44,
        winA: 'rgba(25,232,255,0.12)', winB: 'rgba(255,43,176,0.10)',
      }),
      near: bake({
        par: 0.4, step: 200, color: '#0d1630',
        hMin: 96, hMod: 150, wMin: 74, wMod: 66,
        winA: 'rgba(25,232,255,0.20)', winB: 'rgba(255,43,176,0.18)',
      }),
    };
    return this._skyline;
  }

  _drawClouds(ctx, cameraX, groundY) {
    // Dégradés verticaux constants → créés une seule fois.
    if (!this._cloudGrads) {
      this._cloudGrads = CLOUDS.map(c => {
        const g = ctx.createLinearGradient(0, c.y, 0, c.y + c.h);
        g.addColorStop(0, 'rgba(138,59,255,0.10)');
        g.addColorStop(1, 'rgba(25,232,255,0.05)');
        return g;
      });
    }
    for (let i = 0; i < CLOUDS.length; i++) {
      const c = CLOUDS[i];
      const cx = c.x - cameraX * 0.2;
      ctx.save();
      ctx.translate(cx, 0);
      ctx.fillStyle = this._cloudGrads[i];
      ctx.fillRect(0, c.y + 6, c.w, c.h - 12);
      ctx.fillRect(12, c.y, c.w - 24, c.h);
      ctx.restore();
    }
  }

  _drawGround(ctx, cameraX, groundY, canvasH) {
    const w = ctx.canvas.width;

    // Bitume
    ctx.fillStyle = CITY.asphalt;
    ctx.fillRect(0, groundY, w, canvasH - groundY);

    // Arête lumineuse cyan au niveau du sol
    ctx.fillStyle = 'rgba(25,232,255,0.9)';
    ctx.fillRect(0, groundY, w, 2);
    ctx.fillStyle = 'rgba(25,232,255,0.18)';
    ctx.fillRect(0, groundY + 2, w, 6);

    // Reflets / lignes de perspective
    ctx.fillStyle = 'rgba(255,43,176,0.10)';
    for (let bx = (-cameraX % 64); bx < w; bx += 64) {
      ctx.fillRect(Math.round(bx), groundY + 10, 1, canvasH - groundY - 10);
    }
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    ctx.fillRect(0, groundY + 22, w, 1);

    // Plaque néon devant chaque immeuble
    for (const b of BUILDINGS_DATA) {
      const px = b.x - cameraX;
      if (px > -b.w && px < w + b.w) {
        ctx.fillStyle = 'rgba(255,255,255,0.05)';
        ctx.fillRect(px + b.w / 2 - 18, groundY + 2, 36, 12);
        ctx.fillStyle = b.accent;
        ctx.globalAlpha = 0.5;
        ctx.fillRect(px + b.w / 2 - 18, groundY + 2, 36, 2);
        ctx.globalAlpha = 1;
      }
    }

    // Traînée d'énergie vers le portail
    const pathX = SPECIAL_DOOR.doorX - cameraX;
    if (pathX > -120 && pathX < w + 120) {
      for (let i = 0; i < 6; i++) {
        const tileX = pathX - 54 + i * 18;
        ctx.fillStyle = i % 2 ? 'rgba(25,232,255,0.35)' : 'rgba(255,43,176,0.3)';
        ctx.fillRect(tileX, groundY + 3, 13, 10);
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.fillRect(tileX, groundY + 3, 13, 2);
      }
    }
  }

  _drawTrees(ctx, cameraX, groundY, tick) {
    for (let t = 0; t < TREES.length; t++) {
      const tx = TREES[t];
      const sx = tx - cameraX;
      if (sx < -40 || sx > ctx.canvas.width + 40) continue;

      const col = t % 2 ? CITY.cyan : CITY.magenta;

      // Mât
      ctx.fillStyle = '#05060d';
      ctx.fillRect(sx - 3, groundY - 92, 6, 92);
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      ctx.fillRect(sx - 3, groundY - 92, 2, 92);

      // Bras + luminaire néon
      ctx.fillStyle = '#05060d';
      ctx.fillRect(sx - 18, groundY - 92, 22, 6);
      ctx.fillStyle = col;
      ctx.globalAlpha = 0.9;
      ctx.fillRect(sx - 22, groundY - 90, 8, 8);
      ctx.globalAlpha = 0.18 + 0.06 * Math.sin(tick * 0.1 + t);
      ctx.fillRect(sx - 30, groundY - 96, 24, 60);
      ctx.globalAlpha = 1;
    }
  }

  _drawBuildings(ctx, cameraX, groundY, tick) {
    for (const b of BUILDINGS_DATA) {
      const sx = b.x - cameraX;
      if (sx > ctx.canvas.width + 50 || sx + b.w < -50) continue;
      this._drawBuilding(ctx, b, sx, groundY, tick);
    }
  }

  // Faille d'énergie « Construisez votre projet » — pièce maîtresse.
  // Volontairement SANS toit ni murs pour ne pas ressembler à une maison.
  _drawPortal(ctx, cameraX, groundY, tick) {
    const d  = SPECIAL_DOOR;
    const sx = d.x - cameraX;
    if (sx > ctx.canvas.width + 120 || sx + d.w < -120) return;

    const by      = groundY - d.h;
    const cx      = sx + d.w / 2;
    const pillarW = 18;
    const glow    = 0.55 + 0.45 * Math.sin(tick * 0.06);

    // Halo général large
    const halo = ctx.createRadialGradient(cx, by + d.h * 0.5, 10, cx, by + d.h * 0.5, d.h);
    halo.addColorStop(0, `rgba(25,232,255,${(0.30 + 0.20 * glow).toFixed(3)})`);
    halo.addColorStop(0.4, `rgba(255,43,176,${(0.16 + 0.12 * glow).toFixed(3)})`);
    halo.addColorStop(1, 'rgba(138,59,255,0)');
    ctx.fillStyle = halo;
    ctx.fillRect(sx - d.w, by - 60, d.w * 3, d.h + 120);

    // Faisceau vertical vers le ciel
    const beam = ctx.createLinearGradient(0, by - 80, 0, by + d.h);
    beam.addColorStop(0, 'rgba(25,232,255,0)');
    beam.addColorStop(1, `rgba(25,232,255,${(0.10 + 0.10 * glow).toFixed(3)})`);
    ctx.fillStyle = beam;
    ctx.fillRect(cx - pillarW, by - 80, pillarW * 2, d.h + 80);

    // Monolithes sombres
    for (const px of [sx, sx + d.w - pillarW]) {
      ctx.fillStyle = '#04040c';
      ctx.fillRect(px, by, pillarW, d.h);
      ctx.fillStyle = d.accent;
      ctx.globalAlpha = 0.55 + 0.25 * glow;
      ctx.fillRect(px + (px === sx ? pillarW - 2 : 0), by, 2, d.h);
      ctx.globalAlpha = 1;
    }

    // Linteau
    ctx.fillStyle = '#04040c';
    ctx.fillRect(sx - 8, by - 16, d.w + 16, 18);
    ctx.fillStyle = d.accent;
    ctx.globalAlpha = 0.6 + 0.3 * glow;
    ctx.fillRect(sx - 8, by - 2, d.w + 16, 2);
    ctx.globalAlpha = 1;

    // Ouverture : dégradé d'énergie
    const ix = sx + pillarW;
    const iw = d.w - pillarW * 2;
    const iy = by;
    const ih = d.h;
    ctx.fillStyle = '#02030a';
    ctx.fillRect(ix, iy, iw, ih);
    const rift = ctx.createLinearGradient(ix, iy, ix, iy + ih);
    rift.addColorStop(0, `rgba(25,232,255,${(0.35 + 0.30 * glow).toFixed(3)})`);
    rift.addColorStop(0.5, `rgba(255,43,176,${(0.25 + 0.20 * glow).toFixed(3)})`);
    rift.addColorStop(1, 'rgba(138,59,255,0.14)');
    ctx.fillStyle = rift;
    ctx.fillRect(ix, iy, iw, ih);

    // Brins de toile rayonnant depuis le haut de la faille
    ctx.save();
    ctx.strokeStyle = `rgba(255,255,255,${(0.10 + 0.10 * glow).toFixed(3)})`;
    ctx.lineWidth = 1;
    const anchorX = cx, anchorY = iy + 6;
    for (let s = -3; s <= 3; s++) {
      ctx.beginPath();
      ctx.moveTo(anchorX, anchorY);
      ctx.lineTo(anchorX + s * (iw / 6), iy + ih - 4);
      ctx.stroke();
    }
    for (let r = ih * 0.28; r < ih; r += ih * 0.3) {
      ctx.beginPath();
      ctx.moveTo(anchorX - r * 0.9, anchorY + r * 0.55);
      ctx.quadraticCurveTo(anchorX, anchorY + r, anchorX + r * 0.9, anchorY + r * 0.55);
      ctx.stroke();
    }
    ctx.restore();

    // Anneaux à aberration chromatique (renforcés) + spider-sense
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let k = 0; k < 3; k++) {
      const rr = 14 + ((tick * 1.4 + k * 34) % (ih * 0.55));
      const a  = Math.max(0, 0.6 - rr / (ih * 0.6));
      ctx.globalAlpha = a;
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = CITY.red;
      ctx.beginPath(); ctx.ellipse(cx - 3, iy + ih * 0.5, rr, rr * 0.7, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = CITY.cyan;
      ctx.beginPath(); ctx.ellipse(cx + 3, iy + ih * 0.5, rr, rr * 0.7, 0, 0, Math.PI * 2); ctx.stroke();
    }
    // Arcs spider-sense qui s'étendent au-delà de l'ouverture
    for (let k = 0; k < 2; k++) {
      const rr = 20 + ((tick * 2 + k * 60) % (d.w * 1.1));
      ctx.globalAlpha = Math.max(0, 0.4 - rr / (d.w * 1.2));
      ctx.lineWidth = 2;
      ctx.strokeStyle = CITY.cyan;
      ctx.beginPath(); ctx.arc(cx, iy + ih * 0.5, rr, Math.PI * 0.15, Math.PI * 0.85); ctx.stroke();
      ctx.beginPath(); ctx.arc(cx, iy + ih * 0.5, rr, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
    }
    ctx.restore();
    ctx.globalAlpha = 1;

    // Battant entrouvert (silhouette)
    ctx.fillStyle = '#05060f';
    ctx.fillRect(ix, iy, Math.round(iw * 0.4), ih);
    ctx.fillStyle = d.accent;
    ctx.globalAlpha = 0.5;
    ctx.fillRect(ix + Math.round(iw * 0.4) - 2, iy, 2, ih);
    ctx.globalAlpha = 1;

    // Motes de lumière qui flottent
    ctx.fillStyle = `rgba(255,255,255,${(0.5 + 0.4 * glow).toFixed(3)})`;
    for (let i = 0; i < 8; i++) {
      const mx = ix + 6 + ((i * 53 + tick * 1.3) % (iw - 10));
      const my = iy + ih - 12 - ((i * 37 + tick * 1.7) % (ih - 20));
      ctx.fillRect(Math.round(mx), Math.round(my), 3, 3);
    }

    // Panneau suspendu (texte inchangé)
    const signW = d.w + 44;
    const signX = cx - signW / 2;
    const signY = by - 52;
    ctx.fillStyle = '#03040c';
    ctx.fillRect(signX, signY, signW, 38);
    ctx.fillStyle = d.accent;
    ctx.fillRect(signX, signY, signW, 3);
    ctx.fillRect(signX, signY + 35, signW, 3);
    ctx.fillStyle = '#03040c';
    ctx.fillRect(cx - 2, by - 14, 4, 14);

    const pf = 'bold 8px "Press Start 2P", monospace';
    const l1 = this._neonLabel('CONSTRUISEZ', d.accent, 10, pf);
    const l2 = this._neonLabel('VOTRE PROJET', d.accent, 10, pf);
    ctx.drawImage(l1.c, Math.round(cx - l1.w / 2), Math.round(signY + 16 - l1.baseline));
    ctx.drawImage(l2.c, Math.round(cx - l2.w / 2), Math.round(signY + 29 - l2.baseline));
  }

  _drawBuilding(ctx, b, sx, groundY, tick) {
    const by = groundY - b.h;

    // Ombre portée au sol
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(sx - 6, groundY, b.w + 12, 6);

    // Facade — dégradé sombre (vertical, indépendant de la caméra → mis en cache)
    let fac = this._grad['fac_' + b.id];
    if (!fac) {
      fac = ctx.createLinearGradient(0, by, 0, groundY);
      fac.addColorStop(0, CITY.facadeHi);
      fac.addColorStop(1, b.wallDark);
      this._grad['fac_' + b.id] = fac;
    }
    ctx.save();
    ctx.translate(sx, 0);
    ctx.fillStyle = fac;
    ctx.fillRect(0, by, b.w, b.h);
    ctx.restore();

    // Trame halftone sur la façade
    const ht = this._halftone(ctx);
    if (ht) {
      ctx.save();
      ctx.globalAlpha = 0.6;
      ctx.fillStyle = ht;
      ctx.fillRect(sx, by, b.w, b.h);
      ctx.restore();
    }

    // Nervures structurelles verticales
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    for (let px = sx + 16; px < sx + b.w; px += 24) ctx.fillRect(px, by, 2, b.h);

    // Grille de fenêtres allumées (accent), motif déterministe
    const winY0 = by + 26;
    const cols  = Math.max(2, Math.floor((b.w - 24) / 34));
    const rows  = Math.max(3, Math.floor((b.h - 90) / 30));
    const winW = 20, winH = 16;
    const gapX = (b.w - 24 - cols * winW) / Math.max(1, cols - 1);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const wx = sx + 12 + c * (winW + gapX);
        const wy = winY0 + r * 30;
        const lit = ((r * 7 + c * 3 + b.x) % 5) !== 0;
        this._drawWindow(ctx, wx, wy, winW, winH, b.windowColor, lit, tick + r + c);
      }
    }

    // Filament de toile discret dans l'angle haut-gauche de la façade
    this._webFilament(ctx, sx + 3, by + 3, 34, 'rgba(255,255,255,0.9)', 0.10, 1, 1);

    // Contour « encre » comics : trait noir + liseré accent
    ctx.strokeStyle = CITY.ink;
    ctx.lineWidth = 3;
    ctx.strokeRect(sx + 1.5, by + 1.5, b.w - 3, b.h - 3);
    ctx.strokeStyle = b.accent;
    ctx.globalAlpha = 0.4 + 0.15 * Math.sin(tick * 0.05);
    ctx.lineWidth = 1;
    ctx.strokeRect(sx + 3, by + 3, b.w - 6, b.h - 6);
    ctx.globalAlpha = 1;

    // Toit + antenne
    ctx.fillStyle = b.roofDark;
    ctx.fillRect(sx - 6, by - 10, b.w + 12, 12);
    ctx.strokeStyle = CITY.ink;
    ctx.lineWidth = 3;
    ctx.strokeRect(sx - 4.5, by - 8.5, b.w + 9, 10);
    ctx.fillStyle = '#05060d';
    ctx.fillRect(sx + b.w - 26, by - 34, 3, 26);
    const blink = (Math.sin(tick * 0.14 + b.x) > 0.6);
    ctx.fillStyle = blink ? CITY.red : 'rgba(255,18,61,0.25)';
    ctx.fillRect(sx + b.w - 28, by - 38, 7, 5);

    // Enseigne néon en toiture (texte b.label inchangé)
    const signY = by + 6;
    const signW = b.w - 16;
    ctx.fillStyle = '#03040c';
    ctx.fillRect(sx + 8, signY, signW, 22);
    ctx.fillStyle = b.accent;
    ctx.fillRect(sx + 8, signY, signW, 2);
    ctx.fillRect(sx + 8, signY + 20, signW, 2);
    const sign = this._neonLabel(b.label, b.accent, 8, 'bold 9px "Press Start 2P", monospace');
    ctx.drawImage(sign.c,
      Math.round(sx + b.w / 2 - sign.w / 2),
      Math.round(signY + 15 - sign.baseline));

    // Porte au pied de l'immeuble
    const doorW = 42;
    const doorH = 66;
    const doorX = sx + Math.floor(b.w / 2) - Math.floor(doorW / 2);
    const doorY = groundY - doorH;
    ctx.fillStyle = '#02030a';
    ctx.fillRect(doorX, doorY, doorW, doorH);
    let dg = this._grad['door_' + b.id];
    if (!dg) {
      dg = ctx.createLinearGradient(0, doorY, 0, doorY + doorH);
      dg.addColorStop(0, `rgba(${this._hexToRgb(b.accent)},0.35)`);
      dg.addColorStop(1, `rgba(${this._hexToRgb(b.accent)},0.05)`);
      this._grad['door_' + b.id] = dg;
    }
    ctx.save();
    ctx.translate(doorX, 0);
    ctx.fillStyle = dg;
    ctx.fillRect(3, doorY + 3, doorW - 6, doorH - 6);
    ctx.restore();
    ctx.strokeStyle = b.accent;
    ctx.lineWidth = 2;
    ctx.strokeRect(doorX + 1, doorY + 1, doorW - 2, doorH - 2);
    ctx.fillStyle = CITY.paper;
    ctx.fillRect(doorX + doorW - 9, doorY + doorH / 2 - 2, 4, 4);

    // Tampon « visité » — pastille néon frappée d'une petite araignée
    if (b.visited) {
      ctx.save();
      const cx = sx + b.w - 16;
      const cy = by + 40;
      ctx.beginPath();
      ctx.arc(cx, cy, 12, 0, Math.PI * 2);
      ctx.fillStyle = '#02030a';
      ctx.fill();
      ctx.strokeStyle = b.accent;
      ctx.lineWidth = 2;
      ctx.stroke();
      this._drawSpider(ctx, cx, cy, 13, b.accent);
      ctx.restore();
    }
  }

  _drawWindow(ctx, wx, wy, ww, wh, color, lit, tick) {
    ctx.fillStyle = '#03040c';
    ctx.fillRect(wx - 1, wy - 1, ww + 2, wh + 2);
    if (lit) {
      const flick = 0.55 + 0.25 * Math.abs(Math.sin(tick * 0.05));
      ctx.fillStyle = `rgba(${this._hexToRgb(color)},${flick.toFixed(3)})`;
      ctx.fillRect(wx, wy, ww, wh);
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.fillRect(wx + 2, wy + 2, 4, 3);
    } else {
      ctx.fillStyle = 'rgba(10,16,26,0.9)';
      ctx.fillRect(wx, wy, ww, wh);
    }
  }

  _hexToRgb(hex) {
    let v = this._rgb[hex];
    if (v !== undefined) return v;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    v = `${r},${g},${b}`;
    this._rgb[hex] = v;
    return v;
  }

  // Sprite de texte néon (texte blanc + halo flou) pré-rendu une seule fois,
  // puis blitté chaque frame : évite un ctx.shadowBlur par frame (très coûteux).
  // Reproduit un fillText centré, baseline alphabétique.
  _neonLabel(text, color, blur, font) {
    const key = font + '|' + blur + '|' + color + '|' + text;
    let rec = this._labels[key];
    if (rec) return rec;

    const c = document.createElement('canvas');
    let g = c.getContext('2d');
    g.font = font;
    const tw  = Math.ceil(g.measureText(text).width);
    const pad = Math.ceil(blur) + 6;
    c.width  = tw + pad * 2;
    c.height = 16 + pad * 2;

    g = c.getContext('2d');
    g.font = font;
    g.textAlign = 'center';
    g.textBaseline = 'alphabetic';
    g.fillStyle = CITY.paper;
    g.shadowColor = color;
    g.shadowBlur = blur;
    const baseline = c.height - pad;
    g.fillText(text, c.width / 2, baseline);

    rec = { c, w: c.width, h: c.height, baseline };
    this._labels[key] = rec;
    return rec;
  }

  // Filament de toile ancré à un coin — dirX/dirY = sens vers l'intérieur (+1/-1).
  _webFilament(ctx, ox, oy, size, color, alpha, dirX, dirY) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.globalAlpha = alpha;
    ctx.lineWidth = 1;
    // Rayons
    for (let i = 0; i <= 4; i++) {
      const a = (Math.PI / 2) * (i / 4);
      ctx.beginPath();
      ctx.moveTo(ox, oy);
      ctx.lineTo(ox + dirX * Math.cos(a) * size, oy + dirY * Math.sin(a) * size);
      ctx.stroke();
    }
    // Arcs concentriques
    for (let r = size * 0.35; r <= size; r += size * 0.32) {
      ctx.beginPath();
      ctx.arc(ox, oy, r, 0, Math.PI / 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Petite araignée stylisée (corps + 8 pattes) — motif récurrent.
  _drawSpider(ctx, cx, cy, s, color) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = Math.max(1, s * 0.14);
    ctx.lineCap = 'round';
    // Pattes
    for (const sgn of [-1, 1]) {
      for (let i = 0; i < 4; i++) {
        const ky = cy - s * 0.5 + i * (s * 0.34);
        const bend = (i === 0 || i === 3) ? s * 0.5 : s * 0.85;
        ctx.beginPath();
        ctx.moveTo(cx + sgn * s * 0.28, ky);
        ctx.lineTo(cx + sgn * (s * 0.28 + bend), ky - s * 0.28);
        ctx.lineTo(cx + sgn * (s * 0.28 + bend + s * 0.14), ky + s * 0.1);
        ctx.stroke();
      }
    }
    // Corps + tête
    ctx.beginPath();
    ctx.ellipse(cx, cy + s * 0.12, s * 0.3, s * 0.44, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, cy - s * 0.42, s * 0.22, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
