/* ══════════════════════════════════════════════════════
   MAP.JS — Side-scroller world (Minecraft pixel art)
   Spawn left, all buildings to the right, close together
   ══════════════════════════════════════════════════════ */

'use strict';

const WORLD_WIDTH     = 1900;
const GROUND_RATIO    = 0.72;
const INTERACT_RADIUS = 85;

// ── Player spawn position (left side) ────────────────
const SPAWN_X = 80;

// ── Buildings layout ─────────────────────────────────
// Packed together to the right of spawn, 30px gaps
const BUILDINGS_DATA = [
  {
    id: 'profile',
    label: 'PROFIL',
    accent: '#4fc3f7',
    wallColor: '#5c7a3e',
    wallDark: '#4a6232',
    roofColor: '#7c3012',
    roofDark: '#5c2009',
    windowColor: '#4fc3f7',
    x: 200, w: 230, h: 240,
    emoji: '🏠',
  },
  {
    id: 'parcours',
    label: 'PARCOURS',
    accent: '#81c784',
    wallColor: '#6b5c3e',
    wallDark: '#534830',
    roofColor: '#3a6b52',
    roofDark: '#2a5040',
    windowColor: '#81c784',
    x: 460, w: 230, h: 240,
    emoji: '🎓',
  },
  {
    id: 'passions',
    label: 'PASSIONS',
    accent: '#ff8a65',
    wallColor: '#7c5c3e',
    wallDark: '#604830',
    roofColor: '#8b4513',
    roofDark: '#6b3510',
    windowColor: '#ff8a65',
    x: 720, w: 230, h: 240,
    emoji: '🎯',
  },
  {
    id: 'contact',
    label: 'CONTACT',
    accent: '#ce93d8',
    wallColor: '#3e5c7c',
    wallDark: '#304860',
    roofColor: '#6b3e8b',
    roofDark: '#502e6b',
    windowColor: '#ce93d8',
    x: 980, w: 230, h: 240,
    emoji: '📬',
  },
  {
    id: 'projets',
    label: 'GALERIE',
    accent: '#ffd54f',
    wallColor: '#5c4a2a',
    wallDark: '#483a20',
    roofColor: '#8b6914',
    roofDark: '#6b510f',
    windowColor: '#ffd54f',
    x: 1260, w: 380, h: 300,  // bigger gallery
    emoji: '🎮',
  },
];

// Add computed door positions
BUILDINGS_DATA.forEach(b => {
  b.doorX = b.x + Math.floor(b.w / 2);
  b.visited = false;
});

// ── Clouds ───────────────────────────────────────────
const CLOUDS = [
  { x: 100,  y: 55,  w: 100, h: 38 },
  { x: 450,  y: 38,  w: 80,  h: 30 },
  { x: 800,  y: 70,  w: 120, h: 42 },
  { x: 1150, y: 45,  w: 95,  h: 34 },
  { x: 1550, y: 62,  w: 110, h: 40 },
];

// ── Decorative trees ─────────────────────────────────
const TREES = [50, 390, 650, 900, 1160, 1680];

class GameMap {
  constructor() {
    this._cloudOffset = 0;
  }

  nearBuilding(playerX, playerY) {
    for (const b of BUILDINGS_DATA) {
      const dist = Math.abs(playerX - b.doorX);
      if (dist < INTERACT_RADIUS) return b;
    }
    return null;
  }

  draw(ctx, cameraX, canvasH, tick) {
    const groundY = Math.round(canvasH * GROUND_RATIO);

    this._drawSky(ctx, canvasH);
    this._drawClouds(ctx, cameraX, groundY);
    this._drawGround(ctx, cameraX, groundY, canvasH);
    this._drawTrees(ctx, cameraX, groundY);
    this._drawBuildings(ctx, cameraX, groundY, tick);
  }

  _drawSky(ctx, canvasH) {
    const grad = ctx.createLinearGradient(0, 0, 0, canvasH * GROUND_RATIO);
    grad.addColorStop(0, '#5ba3d9');
    grad.addColorStop(0.6, '#87ceeb');
    grad.addColorStop(1, '#c9e8f5');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, ctx.canvas.width, canvasH * GROUND_RATIO);
  }

  _drawClouds(ctx, cameraX, groundY) {
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    for (const c of CLOUDS) {
      const cx = c.x - cameraX * 0.2;
      ctx.fillRect(cx + 10, c.y, c.w - 20, c.h);
      ctx.fillRect(cx, c.y + 8, c.w, c.h - 14);
      ctx.fillRect(cx + 15, c.y - 8, c.w - 30, 16);
    }
  }

  _drawGround(ctx, cameraX, groundY, canvasH) {
    const w = ctx.canvas.width;

    // Grass layer
    ctx.fillStyle = '#5d9c34';
    ctx.fillRect(0, groundY, w, 18);
    ctx.fillStyle = '#4a8029';
    for (let bx = (-cameraX % 18); bx < w; bx += 18) {
      ctx.fillRect(Math.round(bx), groundY, 1, 18);
    }

    // Dirt layer
    ctx.fillStyle = '#8b5e3c';
    ctx.fillRect(0, groundY + 18, w, canvasH - groundY - 18);
    ctx.fillStyle = '#7a5232';
    ctx.fillRect(0, groundY + 18, w, 1);
    ctx.fillRect(0, groundY + 36, w, 1);
    for (let bx = (-cameraX % 36); bx < w; bx += 36) {
      ctx.fillRect(Math.round(bx), groundY + 18, 1, 18);
    }
    for (let bx = (-cameraX % 36 + 18); bx < w; bx += 36) {
      ctx.fillRect(Math.round(bx), groundY + 36, 1, 18);
    }

    // Stone path under buildings
    for (const b of BUILDINGS_DATA) {
      const px = b.x - cameraX;
      if (px > -b.w && px < w + b.w) {
        ctx.fillStyle = '#9e9e9e';
        ctx.fillRect(px + b.w / 2 - 16, groundY, 32, 18);
        ctx.fillStyle = '#888';
        ctx.fillRect(px + b.w / 2 - 14, groundY + 2, 28, 14);
      }
    }
  }

  _drawTrees(ctx, cameraX, groundY) {
    for (const tx of TREES) {
      const sx = tx - cameraX;
      if (sx < -40 || sx > ctx.canvas.width + 40) continue;

      ctx.fillStyle = '#6b4423';
      ctx.fillRect(sx - 5, groundY - 45, 10, 45);
      ctx.fillStyle = '#5a3519';
      ctx.fillRect(sx - 5, groundY - 45, 2, 45);

      ctx.fillStyle = '#3d7a1e';
      ctx.fillRect(sx - 20, groundY - 80, 40, 18);
      ctx.fillStyle = '#4a9128';
      ctx.fillRect(sx - 15, groundY - 94, 30, 18);
      ctx.fillStyle = '#3d7a1e';
      ctx.fillRect(sx - 10, groundY - 106, 20, 16);
      ctx.fillStyle = '#5db832';
      ctx.fillRect(sx - 18, groundY - 78, 6, 6);
      ctx.fillRect(sx + 8, groundY - 92, 6, 6);
    }
  }

  _drawBuildings(ctx, cameraX, groundY, tick) {
    for (const b of BUILDINGS_DATA) {
      const sx = b.x - cameraX;
      if (sx > ctx.canvas.width + 50 || sx + b.w < -50) continue;
      this._drawBuilding(ctx, b, sx, groundY, tick);
    }
  }

  _drawBuilding(ctx, b, sx, groundY, tick) {
    const by = groundY - b.h;

    // Foundation
    ctx.fillStyle = '#5a5a5a';
    ctx.fillRect(sx - 4, groundY - 8, b.w + 8, 8);

    // Main wall
    ctx.fillStyle = b.wallColor;
    ctx.fillRect(sx, by, b.w, b.h);
    ctx.fillStyle = b.wallDark;
    const plankW = 18;
    for (let px = sx; px < sx + b.w; px += plankW) {
      ctx.fillRect(px, by, 1, b.h);
    }
    for (let py = by; py < groundY; py += 24) {
      ctx.fillRect(sx, py, b.w, 1);
    }

    // Roof
    const roofH = 28;
    ctx.fillStyle = b.roofColor;
    ctx.fillRect(sx - 8, by - roofH, b.w + 16, roofH);
    ctx.fillStyle = b.roofDark;
    ctx.fillRect(sx - 8, by - 2, b.w + 16, 4);
    for (let py = by - roofH; py < by; py += 8) {
      ctx.fillRect(sx - 8, py, b.w + 16, 1);
    }
    ctx.fillRect(sx - 8, by - roofH, b.w + 16, 4);

    // Windows
    const winY = by + 40;
    const winH = 36;
    const winW = 28;
    const glowPulse = 0.7 + 0.3 * Math.sin(tick * 0.05);
    this._drawWindow(ctx, sx + 22, winY, winW, winH, b.windowColor, glowPulse);
    this._drawWindow(ctx, sx + b.w - 22 - winW, winY, winW, winH, b.windowColor, glowPulse);
    if (b.w > 300) {
      this._drawWindow(ctx, sx + b.w / 2 - winW / 2, winY, winW, winH, b.windowColor, glowPulse);
    }

    // Door
    const doorW = 28;
    const doorH = 46;
    const doorX = sx + Math.floor(b.w / 2) - Math.floor(doorW / 2);
    const doorY = groundY - doorH;
    ctx.fillStyle = '#3a1f0a';
    ctx.fillRect(doorX, doorY, doorW, doorH);
    ctx.fillStyle = '#5a3515';
    ctx.fillRect(doorX - 2, doorY - 2, doorW + 4, 4);
    ctx.fillRect(doorX - 2, doorY - 2, 4, doorH + 2);
    ctx.fillRect(doorX + doorW - 2, doorY - 2, 4, doorH + 2);
    ctx.fillStyle = '#4a2808';
    ctx.fillRect(doorX + 3, doorY + 4, doorW - 6, 14);
    ctx.fillRect(doorX + 3, doorY + 22, doorW - 6, 18);
    ctx.fillStyle = '#ffd700';
    ctx.fillRect(doorX + doorW - 8, doorY + doorH / 2 - 2, 4, 4);

    // Sign / Label
    const signY = by + 8;
    const signW = b.w - 20;
    ctx.fillStyle = '#2c1a08';
    ctx.fillRect(sx + 10, signY, signW, 24);
    ctx.fillStyle = b.accent;
    ctx.fillRect(sx + 10, signY, signW, 2);
    ctx.fillRect(sx + 10, signY + 22, signW, 2);
    ctx.save();
    ctx.font = 'bold 9px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = b.accent;
    ctx.shadowColor = b.accent;
    ctx.shadowBlur = 4;
    ctx.fillText(b.label, sx + b.w / 2, signY + 16);
    ctx.restore();

    // Visited checkmark
    if (b.visited) {
      ctx.save();
      ctx.font = '14px monospace';
      ctx.fillStyle = '#69f0ae';
      ctx.textAlign = 'center';
      ctx.fillText('✓', sx + b.w - 12, by + roofH - 30);
      ctx.restore();
    }
  }

  _drawWindow(ctx, wx, wy, ww, wh, color, glowPulse) {
    ctx.fillStyle = '#2c1a08';
    ctx.fillRect(wx - 2, wy - 2, ww + 4, wh + 4);
    ctx.fillStyle = 'rgba(20,30,40,0.8)';
    ctx.fillRect(wx, wy, ww, wh);
    ctx.fillStyle = '#3a2510';
    ctx.fillRect(wx + ww / 2 - 1, wy, 2, wh);
    ctx.fillRect(wx, wy + wh / 2 - 1, ww, 2);
    ctx.fillStyle = `rgba(${this._hexToRgb(color)},${(0.12 * glowPulse).toFixed(2)})`;
    ctx.fillRect(wx, wy, ww, wh);
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillRect(wx + 3, wy + 3, 5, 4);
  }

  _hexToRgb(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `${r},${g},${b}`;
  }
}
