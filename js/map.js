/* ══════════════════════════════════════════════════════
   MAP.JS — Side-scroller world (ville nocturne néon / comics)
   Spawn left, all buildings to the right, close together.
   Réécriture visuelle uniquement : structure de données, API
   (nearBuilding / draw) et positions INCHANGÉES.
   ══════════════════════════════════════════════════════ */

'use strict';

const WORLD_WIDTH     = 2160;
const GROUND_RATIO    = 0.72;
const INTERACT_RADIUS = 85;

// ── Player spawn position (left side) ────────────────
const SPAWN_X = 80;

// ── Palette monde ────────────────────────────────────
const CITY = {
  ink:      '#01010a',
  facade:   '#0d1220',
  facadeHi: '#141c30',
  asphalt:  '#0a0c15',
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
    wallDark: '#080c16',
    roofColor: '#0b1120',
    roofDark: '#05080f',
    windowColor: CITY.cyan,
    x: 200, w: 230, h: 240,
  },
  {
    id: 'parcours',
    label: 'PARCOURS',
    accent: CITY.violet,
    wallColor: CITY.facade,
    wallDark: '#080c16',
    roofColor: '#0b1120',
    roofDark: '#05080f',
    windowColor: CITY.violet,
    x: 460, w: 230, h: 240,
  },
  {
    id: 'contact',
    label: 'CONTACT',
    accent: CITY.magenta,
    wallColor: CITY.facade,
    wallDark: '#080c16',
    roofColor: '#0b1120',
    roofDark: '#05080f',
    windowColor: CITY.magenta,
    x: 980, w: 230, h: 240,
  },
  {
    id: 'projets',
    label: 'GALERIE',
    accent: CITY.red,
    wallColor: CITY.facade,
    wallDark: '#080c16',
    roofColor: '#0b1120',
    roofDark: '#05080f',
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
// Pas une maison : une faille d'énergie isolée, nettement séparée
// du reste. Interagir dessus ouvre une NOUVELLE PAGE.
const SPECIAL_DOOR = {
  id: 'build-project',
  label: 'CONSTRUISEZ VOTRE PROJET',
  promptLabel: 'CONSTRUIRE UN PROJET',
  href: 'construire-projet.html',
  accent: CITY.cyan,
  isPortal: true,
  x: 1900, w: 132, h: 216,
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

    const grad = ctx.createLinearGradient(0, 0, 0, skyH);
    grad.addColorStop(0, '#05060b');
    grad.addColorStop(0.5, '#0b0a18');
    grad.addColorStop(1, '#12081c');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, skyH);

    // Disque lumineux (lune / néon lointain) magenta→violet
    const cx = w * 0.78;
    const cy = skyH * 0.34;
    const r  = Math.max(60, w * 0.09);
    const halo = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 3);
    halo.addColorStop(0, 'rgba(255,43,176,0.5)');
    halo.addColorStop(0.35, 'rgba(138,59,255,0.22)');
    halo.addColorStop(1, 'rgba(138,59,255,0)');
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, w, skyH);
    ctx.fillStyle = 'rgba(255,60,190,0.85)';
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    // Halo bas cyan (pollution lumineuse urbaine)
    const low = ctx.createLinearGradient(0, skyH - 120, 0, skyH);
    low.addColorStop(0, 'rgba(25,232,255,0)');
    low.addColorStop(1, 'rgba(25,232,255,0.16)');
    ctx.fillStyle = low;
    ctx.fillRect(0, skyH - 120, w, 120);

    // Éclats / étoiles fixes (parallaxe nulle, semis déterministe)
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    for (let i = 0; i < 60; i++) {
      const sx = (i * 137.5) % w;
      const sy = (i * 89.3) % skyH;
      const tw = 0.4 + 0.6 * Math.abs(Math.sin(tick * 0.04 + i));
      ctx.globalAlpha = tw;
      ctx.fillRect(sx, sy, 1.5, 1.5);
    }
    ctx.globalAlpha = 1;

    // Trame halftone très légère sur le ciel
    const ht = this._halftone(ctx);
    if (ht) {
      ctx.fillStyle = ht;
      ctx.fillRect(0, 0, w, skyH);
    }
  }

  // Skyline de fond, lointaine (parallaxe forte)
  _drawSkyline(ctx, cameraX, groundY) {
    const w = ctx.canvas.width;
    const base = groundY;
    ctx.fillStyle = '#080610';
    const off = -(cameraX * 0.35) % 220;
    for (let x = off - 220; x < w + 220; x += 220) {
      const seed = Math.round((x + cameraX * 0.35) / 220);
      const bh = 60 + ((seed * 53) % 90);
      const bw = 70 + ((seed * 29) % 60);
      ctx.fillRect(Math.round(x), base - bh, bw, bh);
      // quelques fenêtres cyan/magenta ténues
      ctx.fillStyle = seed % 2 ? 'rgba(25,232,255,0.18)' : 'rgba(255,43,176,0.16)';
      for (let wy = base - bh + 10; wy < base - 8; wy += 16) {
        ctx.fillRect(Math.round(x) + 8, wy, 4, 4);
        ctx.fillRect(Math.round(x) + bw - 14, wy, 4, 4);
      }
      ctx.fillStyle = '#080610';
    }
  }

  _drawClouds(ctx, cameraX, groundY) {
    for (const c of CLOUDS) {
      const cx = c.x - cameraX * 0.2;
      const g = ctx.createLinearGradient(cx, c.y, cx, c.y + c.h);
      g.addColorStop(0, 'rgba(138,59,255,0.10)');
      g.addColorStop(1, 'rgba(25,232,255,0.05)');
      ctx.fillStyle = g;
      ctx.fillRect(cx, c.y + 6, c.w, c.h - 12);
      ctx.fillRect(cx + 12, c.y, c.w - 24, c.h);
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

    // Anneaux à aberration chromatique
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let k = 0; k < 3; k++) {
      const rr = 14 + ((tick * 1.4 + k * 34) % (ih * 0.55));
      const a  = Math.max(0, 0.5 - rr / (ih * 0.6));
      ctx.globalAlpha = a;
      ctx.lineWidth = 2;
      ctx.strokeStyle = CITY.red;
      ctx.beginPath(); ctx.ellipse(cx - 2, iy + ih * 0.5, rr, rr * 0.7, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = CITY.cyan;
      ctx.beginPath(); ctx.ellipse(cx + 2, iy + ih * 0.5, rr, rr * 0.7, 0, 0, Math.PI * 2); ctx.stroke();
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

    ctx.save();
    ctx.font = 'bold 8px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = CITY.paper;
    ctx.shadowColor = d.accent;
    ctx.shadowBlur = 10;
    ctx.fillText('CONSTRUISEZ', cx, signY + 16);
    ctx.fillText('VOTRE PROJET', cx, signY + 29);
    ctx.restore();
  }

  _drawBuilding(ctx, b, sx, groundY, tick) {
    const by = groundY - b.h;

    // Ombre portée au sol
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(sx - 6, groundY, b.w + 12, 6);

    // Facade — dégradé sombre
    const fac = ctx.createLinearGradient(sx, by, sx, groundY);
    fac.addColorStop(0, CITY.facadeHi);
    fac.addColorStop(1, b.wallDark);
    ctx.fillStyle = fac;
    ctx.fillRect(sx, by, b.w, b.h);

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
    ctx.save();
    ctx.font = 'bold 9px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = CITY.paper;
    ctx.shadowColor = b.accent;
    ctx.shadowBlur = 8;
    ctx.fillText(b.label, sx + b.w / 2, signY + 15);
    ctx.restore();

    // Porte au pied de l'immeuble
    const doorW = 42;
    const doorH = 66;
    const doorX = sx + Math.floor(b.w / 2) - Math.floor(doorW / 2);
    const doorY = groundY - doorH;
    ctx.fillStyle = '#02030a';
    ctx.fillRect(doorX, doorY, doorW, doorH);
    const dg = ctx.createLinearGradient(doorX, doorY, doorX, doorY + doorH);
    dg.addColorStop(0, `rgba(${this._hexToRgb(b.accent)},0.35)`);
    dg.addColorStop(1, `rgba(${this._hexToRgb(b.accent)},0.05)`);
    ctx.fillStyle = dg;
    ctx.fillRect(doorX + 3, doorY + 3, doorW - 6, doorH - 6);
    ctx.strokeStyle = b.accent;
    ctx.lineWidth = 2;
    ctx.strokeRect(doorX + 1, doorY + 1, doorW - 2, doorH - 2);
    ctx.fillStyle = CITY.paper;
    ctx.fillRect(doorX + doorW - 9, doorY + doorH / 2 - 2, 4, 4);

    // Tampon « visité » — pastille néon
    if (b.visited) {
      ctx.save();
      const cx = sx + b.w - 16;
      const cy = by + 40;
      ctx.beginPath();
      ctx.arc(cx, cy, 11, 0, Math.PI * 2);
      ctx.fillStyle = '#02030a';
      ctx.fill();
      ctx.strokeStyle = b.accent;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx - 5, cy);
      ctx.lineTo(cx - 1, cy + 4);
      ctx.lineTo(cx + 5, cy - 4);
      ctx.strokeStyle = b.accent;
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
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
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `${r},${g},${b}`;
  }
}
