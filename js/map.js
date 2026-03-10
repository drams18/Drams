/* =================================================
   MAP.JS — World rendering, buildings, collision
   ================================================= */

const WORLD_WIDTH  = 1800;
const WORLD_HEIGHT = 1100;
const INTERACT_RADIUS = 72;

// ---- Building definitions ----------------------------------------
const BUILDINGS_DATA = [
  {
    id: 'about',
    name: 'MAISON',
    label: 'À PROPOS',
    emoji: '🏠',
    color: '#1e4d35',
    wallLight: '#285c40',
    wallShadow: '#163a28',
    roofColor: '#7c3012',
    roofDark: '#5c2009',
    windowColor: '#aaddff',
    x: 70, y: 90, w: 210, h: 155,
    doorX: 70 + 105 - 18, doorY: 90 + 155,
  },
  {
    id: 'skills',
    name: 'ATELIER',
    label: 'COMPÉTENCES',
    emoji: '⚙️',
    color: '#152d5c',
    wallLight: '#1c3b78',
    wallShadow: '#0d1f45',
    roofColor: '#1a5c7a',
    roofDark: '#0d3d52',
    windowColor: '#ffdd88',
    x: 490, y: 90, w: 210, h: 155,
    doorX: 490 + 105 - 18, doorY: 90 + 155,
  },
  {
    id: 'projects',
    name: 'ARCADE',
    label: 'PROJETS',
    emoji: '🕹️',
    color: '#4a1535',
    wallLight: '#5e1a44',
    wallShadow: '#330d25',
    roofColor: '#7a1560',
    roofDark: '#540d42',
    windowColor: '#ff88cc',
    x: 1000, y: 90, w: 210, h: 155,
    doorX: 1000 + 105 - 18, doorY: 90 + 155,
  },
  {
    id: 'formation',
    name: 'BIBLIOTHÈQUE',
    label: 'FORMATION',
    emoji: '📚',
    color: '#4a3010',
    wallLight: '#5e3c14',
    wallShadow: '#332209',
    roofColor: '#7a5010',
    roofDark: '#523509',
    windowColor: '#ffcc66',
    x: 70, y: 660, w: 210, h: 155,
    doorX: 70 + 105 - 18, doorY: 660 + 155,
  },
  {
    id: 'interests',
    name: 'JARDIN',
    label: "INTÉRÊTS",
    emoji: '🌿',
    color: '#1a4a1a',
    wallLight: '#235c23',
    wallShadow: '#0f2e0f',
    roofColor: null,  // open park / greenhouse
    windowColor: '#aaffaa',
    x: 520, y: 620, w: 270, h: 195,
    doorX: 520 + 135 - 18, doorY: 620 + 195,
    isPark: true,
  },
  {
    id: 'contact',
    name: 'BUREAU DE POSTE',
    label: 'CONTACT',
    emoji: '📬',
    color: '#0f3350',
    wallLight: '#143d61',
    wallShadow: '#092236',
    roofColor: '#0f5080',
    roofDark: '#093560',
    windowColor: '#88ccff',
    x: 1060, y: 640, w: 210, h: 155,
    doorX: 1060 + 105 - 18, doorY: 640 + 155,
  },
];

// ---- Decorations (trees, rocks, flowers) -------------------------
const DECORATIONS = [];
(function generateDecorations() {
  const treePositions = [
    // Corners and edges
    [30, 30], [1740, 30], [30, 1040], [1740, 1040],
    [30, 280], [30, 540], [1760, 280], [1760, 540],
    // Between buildings top row
    [380, 120], [380, 60], [820, 100], [820, 50],
    [1270, 100], [1280, 50], [1420, 100], [1500, 80],
    [1600, 140], [1680, 90],
    // Between buildings bottom row
    [380, 700], [380, 760], [850, 700], [850, 750],
    [1340, 700], [1370, 760], [1500, 700],
    // Left side
    [30, 760], [30, 830], [30, 900],
    // Right side
    [1760, 760], [1760, 830], [1760, 900],
    // Around park
    [490, 580], [480, 640], [808, 590], [802, 640],
    [560, 830], [780, 830],
  ];
  for (const [x, y] of treePositions) {
    DECORATIONS.push({ type: 'tree', x, y });
  }

  // Flowers/bushes
  const bushPositions = [
    [350, 220], [440, 220], [710, 220], [850, 220],
    [1230, 220], [1320, 220], [340, 700], [450, 700],
    [330, 760], [455, 780], [895, 700], [950, 760],
  ];
  for (const [x, y] of bushPositions) {
    DECORATIONS.push({ type: 'bush', x, y });
  }

  // Lampposts along main path
  const lampPositions = [
    [200, 465], [400, 465], [600, 465], [780, 465],
    [1020, 465], [1220, 465], [1420, 465], [1620, 465],
    [200, 580], [400, 580], [600, 580], [780, 580],
    [1020, 580], [1220, 580], [1420, 580], [1620, 580],
  ];
  for (const [x, y] of lampPositions) {
    DECORATIONS.push({ type: 'lamp', x, y });
  }
})();

// ---- Offscreen canvas for static elements (performance) ----------
let staticCanvas = null;
let staticCtx = null;
let staticDirty = true;

class GameMap {
  constructor() {
    this._buildStaticCanvas();
  }

  _buildStaticCanvas() {
    staticCanvas = document.createElement('canvas');
    staticCanvas.width = WORLD_WIDTH;
    staticCanvas.height = WORLD_HEIGHT;
    staticCtx = staticCanvas.getContext('2d');
    this._renderStatic(staticCtx);
  }

  _renderStatic(ctx) {
    // --- 1. Grass background ---
    this._drawGrass(ctx);

    // --- 2. Paths ---
    this._drawPaths(ctx);

    // --- 3. Fountain / town center ---
    this._drawFountain(ctx, 900, 522);

    // --- 4. Buildings ---
    for (const b of BUILDINGS_DATA) {
      this._drawBuilding(ctx, b);
    }

    // --- 5. Decorations ---
    for (const d of DECORATIONS) {
      if (d.type === 'tree') this._drawTree(ctx, d.x, d.y);
      else if (d.type === 'bush') this._drawBush(ctx, d.x, d.y);
      else if (d.type === 'lamp') this._drawLamp(ctx, d.x, d.y);
    }
  }

  _drawGrass(ctx) {
    // Base grass
    ctx.fillStyle = '#2a5418';
    ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    // Grass variation patches
    const patchColors = ['#2d5c1c', '#255014', '#306420', '#245012', '#285618'];
    const rng = mulberry32(42);
    for (let i = 0; i < 600; i++) {
      ctx.fillStyle = patchColors[Math.floor(rng() * patchColors.length)];
      const x = rng() * WORLD_WIDTH;
      const y = rng() * WORLD_HEIGHT;
      const s = 20 + rng() * 60;
      ctx.fillRect(x, y, s, s * 0.6);
    }

    // Tiny grass blades
    ctx.fillStyle = '#346020';
    for (let i = 0; i < 300; i++) {
      const x = rng() * WORLD_WIDTH;
      const y = rng() * WORLD_HEIGHT;
      ctx.fillRect(x, y, 2, 6);
    }
  }

  _drawPaths(ctx) {
    const pathColor     = '#8a7460';
    const pathDark      = '#756050';
    const pathEdge      = '#6a5444';
    const stoneLight    = '#9a8470';

    // Main horizontal path
    ctx.fillStyle = pathColor;
    ctx.fillRect(0, 460, WORLD_WIDTH, 90);

    // Main vertical path
    ctx.fillRect(860, 0, 90, WORLD_HEIGHT);

    // Side paths to upper buildings
    const upperPaths = [
      { x: 152, y: 245, w: 40, h: 215 },   // to about
      { x: 572, y: 245, w: 40, h: 215 },   // to skills
      { x: 1082, y: 245, w: 40, h: 215 },  // to projects
    ];
    for (const p of upperPaths) {
      ctx.fillStyle = pathColor;
      ctx.fillRect(p.x, p.y, p.w, p.h);
    }

    // Side paths to lower buildings
    const lowerPaths = [
      { x: 152, y: 550, w: 40, h: 110 },   // to formation
      { x: 632, y: 550, w: 40, h: 72 },    // to interests
      { x: 1142, y: 550, w: 40, h: 92 },   // to contact
    ];
    for (const p of lowerPaths) {
      ctx.fillStyle = pathColor;
      ctx.fillRect(p.x, p.y, p.w, p.h);
    }

    // Stone tile pattern on paths
    ctx.strokeStyle = pathEdge;
    ctx.lineWidth = 1;

    // Horizontal path tiles
    for (let x = 0; x < WORLD_WIDTH; x += 36) {
      for (let y = 460; y < 550; y += 36) {
        if (Math.random() > 0.3) {
          ctx.fillStyle = stoneLight;
          ctx.fillRect(x + 1, y + 1, 34, 34);
        }
        ctx.strokeRect(x + 0.5, y + 0.5, 36, 36);
      }
    }

    // Vertical path tiles
    for (let x = 860; x < 950; x += 36) {
      for (let y = 0; y < WORLD_HEIGHT; y += 36) {
        if ((x >= 0 && x <= WORLD_WIDTH) && !(y >= 460 && y <= 550)) {
          ctx.fillStyle = stoneLight;
          ctx.fillRect(x + 1, y + 1, 34, 34);
          ctx.strokeRect(x + 0.5, y + 0.5, 36, 36);
        }
      }
    }

    // Path borders/edges
    ctx.strokeStyle = pathDark;
    ctx.lineWidth = 2;
    // Horizontal top/bottom
    ctx.beginPath();
    ctx.moveTo(0, 460); ctx.lineTo(WORLD_WIDTH, 460);
    ctx.moveTo(0, 550); ctx.lineTo(WORLD_WIDTH, 550);
    // Vertical left/right
    ctx.moveTo(860, 0); ctx.lineTo(860, WORLD_HEIGHT);
    ctx.moveTo(950, 0); ctx.lineTo(950, WORLD_HEIGHT);
    ctx.stroke();
  }

  _drawBuilding(ctx, b) {
    const { x, y, w, h } = b;
    const cx = x + w / 2;

    // --- Shadow ---
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(x + 6, y + h + 2, w, 10);

    // --- Roof ---
    if (!b.isPark && b.roofColor) {
      ctx.fillStyle = b.roofColor;
      ctx.beginPath();
      ctx.moveTo(x - 12, y + 2);
      ctx.lineTo(cx, y - 52);
      ctx.lineTo(x + w + 12, y + 2);
      ctx.closePath();
      ctx.fill();

      // Roof ridge / edge
      ctx.fillStyle = b.roofDark || '#000';
      ctx.beginPath();
      ctx.moveTo(cx - 4, y - 52);
      ctx.lineTo(cx + 4, y - 52);
      ctx.lineTo(x + w + 12, y + 2);
      ctx.lineTo(x - 12, y + 2);
      ctx.closePath();
      ctx.lineWidth = 2;
      ctx.strokeStyle = b.roofDark || '#000';
      ctx.stroke();

      // Roof tiles / lines
      ctx.strokeStyle = 'rgba(0,0,0,0.25)';
      ctx.lineWidth = 1;
      for (let i = 1; i < 5; i++) {
        const t = i / 5;
        const lx1 = x - 12 + (cx - (x - 12)) * t;
        const ly1 = y + 2 + (y - 52 - (y + 2)) * t;
        const lx2 = x + w + 12 - (x + w + 12 - cx) * t;
        const ly2 = y + 2 + (y - 52 - (y + 2)) * t;
        ctx.beginPath();
        ctx.moveTo(lx1, ly1);
        ctx.lineTo(lx2, ly2);
        ctx.stroke();
      }
    }

    if (b.isPark) {
      // Open park / greenhouse look
      ctx.strokeStyle = b.wallLight;
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, w, h);
      // Interior grass
      ctx.fillStyle = '#1e5c1e';
      ctx.fillRect(x + 1, y + 1, w - 2, h - 2);
      // Park decorations inside
      this._drawParkInterior(ctx, b);
    } else {
      // --- Walls ---
      ctx.fillStyle = b.color;
      ctx.fillRect(x, y, w, h);

      // Wall lighting (top lighter)
      ctx.fillStyle = b.wallLight;
      ctx.fillRect(x, y, w, 12);

      // Wall shadow (bottom)
      ctx.fillStyle = b.wallShadow;
      ctx.fillRect(x, y + h - 18, w, 18);

      // Wall brick pattern
      ctx.strokeStyle = 'rgba(0,0,0,0.2)';
      ctx.lineWidth = 1;
      for (let row = 0; row < 4; row++) {
        const by = y + 14 + row * 22;
        const offset = row % 2 === 0 ? 0 : 18;
        for (let bx = x - offset; bx < x + w + offset; bx += 36) {
          ctx.strokeRect(bx + 0.5, by + 0.5, 36, 20);
        }
      }

      // --- Windows ---
      const numWin = w > 180 ? 2 : 1;
      const winSpacing = w / (numWin + 1);
      for (let i = 0; i < numWin; i++) {
        const wx = x + winSpacing * (i + 1) - 20;
        const wy = y + 28;
        this._drawWindow(ctx, wx, wy, 40, 35, b.windowColor);
      }

      // --- Door ---
      const doorW = 36;
      const doorH = 50;
      const dx = cx - doorW / 2;
      const dy = y + h - doorH;
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(dx - 2, dy - 2, doorW + 4, doorH + 4);
      ctx.fillStyle = '#1a0c04';
      ctx.fillRect(dx, dy, doorW, doorH);
      // Door panels
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      ctx.fillRect(dx + 4, dy + 4, doorW / 2 - 6, doorH / 2 - 8);
      ctx.fillRect(dx + doorW / 2 + 2, dy + 4, doorW / 2 - 6, doorH / 2 - 8);
      // Door handle
      ctx.fillStyle = '#ffd700';
      ctx.beginPath();
      ctx.arc(cx + 8, dy + doorH * 0.55, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // --- Outline ---
      ctx.strokeStyle = 'rgba(0,0,0,0.5)';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, w, h);
    }

    // --- Sign / Label ---
    this._drawSign(ctx, b);
  }

  _drawWindow(ctx, x, y, w, h, color) {
    // Frame
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
    // Panes
    const half = Math.floor(w / 2) - 1;
    const halfH = Math.floor(h / 2) - 1;
    const colors = [
      lightenHex(color, 1.0),
      lightenHex(color, 0.7),
      lightenHex(color, 0.7),
      lightenHex(color, 0.5),
    ];
    ctx.fillStyle = colors[0]; ctx.fillRect(x,       y,       half, halfH);
    ctx.fillStyle = colors[1]; ctx.fillRect(x + half + 2, y, half, halfH);
    ctx.fillStyle = colors[2]; ctx.fillRect(x,       y + halfH + 2, half, halfH);
    ctx.fillStyle = colors[3]; ctx.fillRect(x + half + 2, y + halfH + 2, half, halfH);
    // Cross divider
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(x + half, y, 2, h);
    ctx.fillRect(x, y + halfH, w, 2);
    // Reflection glint
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillRect(x + 2, y + 2, 4, 4);
  }

  _drawSign(ctx, b) {
    const cx = b.x + b.w / 2;
    const sy = b.y - (b.isPark ? 14 : 62);

    // Sign board
    const text = b.label;
    ctx.font = '8px "Press Start 2P", monospace';
    const tw = ctx.measureText(text).width;
    const sw = tw + 24;
    const sh = 20;
    const sx = cx - sw / 2;

    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(sx - 2, sy - 2, sw + 4, sh + 4);
    ctx.fillStyle = '#1a1000';
    ctx.fillRect(sx, sy, sw, sh);
    ctx.fillStyle = '#ffd700';
    ctx.font = '8px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(text, cx, sy + sh - 6);

    // Sign brackets
    ctx.fillStyle = '#5a5040';
    ctx.fillRect(cx - 6, sy + sh, 4, 8);
    ctx.fillRect(cx + 2, sy + sh, 4, 8);
  }

  _drawParkInterior(ctx, b) {
    const { x, y, w, h } = b;
    // Trees inside park
    const parkTrees = [
      [x + 30, y + 30], [x + w - 50, y + 30],
      [x + 30, y + h - 50], [x + w - 50, y + h - 50],
      [x + w / 2, y + 30],
    ];
    for (const [tx, ty] of parkTrees) {
      this._drawTree(ctx, tx, ty, 0.7);
    }
    // Bench
    ctx.fillStyle = '#5a3a14';
    ctx.fillRect(x + w / 2 - 25, y + h - 80, 50, 8);
    ctx.fillRect(x + w / 2 - 25, y + h - 70, 50, 5);
    ctx.fillRect(x + w / 2 - 22, y + h - 80, 6, 14);
    ctx.fillRect(x + w / 2 + 16, y + h - 80, 6, 14);

    // Flowers
    const flowerColors = ['#ff6688', '#ffaa00', '#aa66ff', '#ff4444', '#66ff88'];
    for (let i = 0; i < 12; i++) {
      const fx = x + 20 + (i * 23) % (w - 40);
      const fy = y + 60 + (i * 17) % (h - 120);
      ctx.fillStyle = flowerColors[i % flowerColors.length];
      ctx.beginPath();
      ctx.arc(fx, fy, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#2a8a2a';
      ctx.fillRect(fx - 1, fy + 4, 2, 8);
    }
  }

  _drawFountain(ctx, cx, cy) {
    // Basin outer
    ctx.fillStyle = '#2a3a5a';
    ctx.beginPath();
    ctx.ellipse(cx, cy + 14, 55, 30, 0, 0, Math.PI * 2);
    ctx.fill();
    // Basin inner
    ctx.fillStyle = '#1a4a7a';
    ctx.beginPath();
    ctx.ellipse(cx, cy + 14, 44, 24, 0, 0, Math.PI * 2);
    ctx.fill();
    // Water shimmer
    ctx.fillStyle = 'rgba(100,180,255,0.4)';
    ctx.beginPath();
    ctx.ellipse(cx, cy + 16, 40, 20, 0, 0, Math.PI * 2);
    ctx.fill();
    // Center pillar
    ctx.fillStyle = '#606070';
    ctx.fillRect(cx - 6, cy - 14, 12, 28);
    // Pillar top
    ctx.fillStyle = '#707080';
    ctx.beginPath();
    ctx.ellipse(cx, cy - 14, 10, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    // Water streams (static arcs)
    ctx.strokeStyle = 'rgba(150,210,255,0.6)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy - 14);
      const ex = cx + Math.cos(angle) * 28;
      const ey = cy + Math.sin(angle) * 14 + 10;
      const cpx = cx + Math.cos(angle) * 20;
      const cpy = cy + Math.sin(angle) * 8 - 18;
      ctx.quadraticCurveTo(cpx, cpy, ex, ey);
      ctx.stroke();
    }

    // Label
    ctx.fillStyle = '#ffd700';
    ctx.font = '7px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('FONTAINE', cx, cy + 52);
  }

  _drawTree(ctx, x, y, scale = 1) {
    // Trunk
    ctx.fillStyle = '#4a3000';
    ctx.fillRect(x - 4 * scale, y - 2 * scale, 8 * scale, 22 * scale);
    // Roots suggestion
    ctx.fillStyle = '#3a2200';
    ctx.fillRect(x - 6 * scale, y + 16 * scale, 4 * scale, 6 * scale);
    ctx.fillRect(x + 2 * scale, y + 16 * scale, 4 * scale, 6 * scale);
    // Shadow under canopy
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(x + 2 * scale, y + 6 * scale, 18 * scale, 9 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    // Canopy dark
    ctx.fillStyle = '#1a4010';
    ctx.beginPath();
    ctx.arc(x, y - 8 * scale, 20 * scale, 0, Math.PI * 2);
    ctx.fill();
    // Canopy mid
    ctx.fillStyle = '#246018';
    ctx.beginPath();
    ctx.arc(x - 4 * scale, y - 12 * scale, 16 * scale, 0, Math.PI * 2);
    ctx.fill();
    // Canopy highlight
    ctx.fillStyle = '#2c7a1e';
    ctx.beginPath();
    ctx.arc(x, y - 14 * scale, 14 * scale, 0, Math.PI * 2);
    ctx.fill();
    // Top highlight
    ctx.fillStyle = '#38962a';
    ctx.beginPath();
    ctx.arc(x - 2 * scale, y - 18 * scale, 8 * scale, 0, Math.PI * 2);
    ctx.fill();
  }

  _drawBush(ctx, x, y) {
    ctx.fillStyle = '#1a4a10';
    ctx.beginPath();
    ctx.arc(x, y, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#246018';
    ctx.beginPath();
    ctx.arc(x - 6, y - 4, 8, 0, Math.PI * 2);
    ctx.arc(x + 6, y - 4, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#2c7a1e';
    ctx.beginPath();
    ctx.arc(x, y - 6, 7, 0, Math.PI * 2);
    ctx.fill();
  }

  _drawLamp(ctx, x, y) {
    // Post
    ctx.fillStyle = '#606070';
    ctx.fillRect(x - 2, y, 4, 30);
    // Arm
    ctx.fillRect(x - 2, y - 2, 12, 4);
    // Lamp head
    ctx.fillStyle = '#ffd700';
    ctx.fillRect(x + 4, y - 10, 10, 10);
    // Glow
    ctx.fillStyle = 'rgba(255,220,100,0.15)';
    ctx.beginPath();
    ctx.arc(x + 9, y - 5, 16, 0, Math.PI * 2);
    ctx.fill();
    // Base
    ctx.fillStyle = '#808090';
    ctx.fillRect(x - 4, y + 28, 8, 4);
  }

  // ----- Public API -----

  render(ctx, camera) {
    // Blit pre-rendered static map
    ctx.drawImage(staticCanvas, 0, 0);
  }

  isColliding(px, py, pw, ph) {
    // World boundary
    if (px < 0 || py < 0 || px + pw > WORLD_WIDTH || py + ph > WORLD_HEIGHT) {
      return true;
    }
    // Buildings
    for (const b of BUILDINGS_DATA) {
      if (
        px < b.x + b.w &&
        px + pw > b.x &&
        py < b.y + b.h &&
        py + ph > b.y
      ) {
        return true;
      }
    }
    // Tall trees as solid obstacles (only the trunk area)
    for (const d of DECORATIONS) {
      if (d.type === 'tree') {
        if (
          px < d.x + 8 &&
          px + pw > d.x - 8 &&
          py < d.y + 22 &&
          py + ph > d.y - 2
        ) {
          return true;
        }
      }
    }
    return false;
  }

  getNearbyBuilding(px, py) {
    for (const b of BUILDINGS_DATA) {
      const doorX = b.doorX + 18;
      const doorY = b.doorY;
      const dist = Math.hypot(px - doorX, py - doorY);
      if (dist < INTERACT_RADIUS) return b;
    }
    return null;
  }

  getBuildingAtPoint(wx, wy) {
    for (const b of BUILDINGS_DATA) {
      if (wx >= b.x && wx <= b.x + b.w && wy >= b.y && wy <= b.y + b.h) {
        return b;
      }
    }
    return null;
  }
}

// ---- Utility functions -------------------------------------------

function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 0xffffffff;
  };
}

function lightenHex(color, factor) {
  // Very simple — parse #rrggbb and lighten
  let r = parseInt(color.slice(1, 3), 16);
  let g = parseInt(color.slice(3, 5), 16);
  let b = parseInt(color.slice(5, 7), 16);
  r = Math.min(255, Math.floor(r * factor));
  g = Math.min(255, Math.floor(g * factor));
  b = Math.min(255, Math.floor(b * factor));
  return `rgb(${r},${g},${b})`;
}
