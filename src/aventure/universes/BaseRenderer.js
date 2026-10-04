/* ══════════════════════════════════════════════════════
   BASERENDERER.JS : socle de rendu commun aux univers

   Règles de performance du canvas :
     • tout ce qui est statique est cuit UNE fois dans un tampon hors écran
       (`sprite`), à la résolution courante, puis simplement recopié ;
     • aucun dégradé, aucune mesure de texte, aucune ombre floue créés
       dans la boucle ;
     • les tampons sont invalidés au redimensionnement et quand la police
       est chargée.

   Ordre d'appel par Game, à chaque image :
     drawSky (pixels) → drawFar → drawWorld → [collectibles, personnages,
     particules] → drawFront (repère monde) → drawOverlay (pixels)
   ══════════════════════════════════════════════════════ */

const TAU = Math.PI * 2;

// Générateur pseudo-aléatoire déterministe : le décor est identique à chaque visite.
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Bruit stable 0..1 pour un entier (scintillements sans état).
export function hash(n) {
  const s = Math.sin(n * 127.1) * 43758.5453;
  return s - Math.floor(s);
}

export class BaseRenderer {
  constructor(universe) {
    this.universe = universe;
    this.palette = universe.palette;
    this.sprites = new Map();
    this.scale = 1;           // pixels par unité monde (zoom 1)
    this.pxW = 0; this.pxH = 0;
    this.floor = 0;           // bas de la vue quand la caméra est au niveau de la rue
    this.reduced = false;
  }

  get font() { return this.universe.fonts.canvas; }

  resize(pxW, pxH, scale, floor) {
    this.floor = floor;
    if (pxW === this.pxW && pxH === this.pxH && scale === this.scale) return;
    this.pxW = pxW; this.pxH = pxH; this.scale = scale;
    this.invalidate();
  }

  invalidate() { this.sprites.clear(); }

  // Tampon en unités monde, cuit à la résolution courante.
  sprite(key, w, h, draw) {
    let s = this.sprites.get(key);
    if (s) return s;
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.ceil(w * this.scale));
    c.height = Math.max(1, Math.ceil(h * this.scale));
    const g = c.getContext('2d');
    // Échelle calée sur des pixels entiers : pas de bord à demi transparent,
    // donc pas de jointure entre deux tuiles voisines.
    g.scale(c.width / w, c.height / h);
    draw(g, w, h);
    s = { c, w, h };
    this.sprites.set(key, s);
    return s;
  }

  // Tampon plein écran, en pixels (ciel, vignette).
  screen(key, draw) {
    let s = this.sprites.get(key);
    if (s) return s;
    const c = document.createElement('canvas');
    c.width = this.pxW; c.height = this.pxH;
    draw(c.getContext('2d'), this.pxW, this.pxH);
    s = { c, w: this.pxW, h: this.pxH };
    this.sprites.set(key, s);
    return s;
  }

  blit(ctx, s, x, y) { ctx.drawImage(s.c, x, y, s.w, s.h); }

  // Tuile répétée le long du niveau (sol, mur) : léger recouvrement, pas de jointure.
  tiles(ctx, cam, s, y) {
    for (let x = Math.floor(cam.left / s.w) * s.w; x < cam.right; x += s.w) {
      ctx.drawImage(s.c, x, y, s.w + 0.6, s.h);
    }
  }

  // Couche répétée horizontalement, qui défile à `f` fois la vitesse du monde.
  // baseY : y monde du bas de la couche quand la caméra est au niveau de la rue.
  parallax(ctx, cam, s, f, baseY, fy = f) {
    const ox = cam.left * (1 - f);
    const oy = (cam.bottom - this.floor) * (1 - fy);
    const first = ox + Math.floor((cam.left - ox) / s.w) * s.w;
    for (let x = first; x < cam.right; x += s.w) {
      ctx.drawImage(s.c, x, baseY - s.h + oy, s.w + 0.6, s.h);
    }
  }

  visible(cam, x, w, margin = 60) {
    return x + w > cam.left - margin && x < cam.right + margin;
  }

  // ── Primitives de décor (utilisées pendant la cuisson) ──

  // Grille de fenêtres : `lit` (0..1) = proportion de fenêtres éclairées.
  windows(g, x, y, w, h, o) {
    const r = rng(o.seed || 1);
    const cw = (w - o.gapX * (o.cols + 1)) / o.cols;
    const ch = (h - o.gapY * (o.rows + 1)) / o.rows;
    for (let j = 0; j < o.rows; j++) {
      for (let i = 0; i < o.cols; i++) {
        const lit = r() < o.lit;
        g.fillStyle = lit ? o.on[Math.floor(r() * o.on.length)] : o.off;
        g.fillRect(x + o.gapX + i * (cw + o.gapX), y + o.gapY + j * (ch + o.gapY), cw, ch);
      }
    }
  }

  // Silhouettes d'immeubles pour une couche lointaine répétable.
  skyline(g, w, h, o) {
    const r = rng(o.seed);
    let x = 0;
    while (x < w) {
      const bw = o.minW + r() * (o.maxW - o.minW);
      const bh = h * (o.minH + r() * (o.maxH - o.minH));
      g.fillStyle = o.colors[Math.floor(r() * o.colors.length)];
      g.fillRect(x, h - bh, Math.min(bw, w - x) + 1, bh);
      if (o.lit) {
        this.windows(g, x + 2, h - bh + 6, Math.min(bw, w - x) - 4, bh - 10, {
          cols: Math.max(2, Math.floor(bw / o.cell)), rows: Math.max(3, Math.floor(bh / (o.cell * 1.4))),
          gapX: o.cell * 0.35, gapY: o.cell * 0.5, lit: o.lit, on: o.on, off: o.off, seed: Math.floor(r() * 1e6),
        });
      }
      if (o.antenna && r() < 0.3) { g.fillStyle = o.colors[0]; g.fillRect(x + bw / 2, h - bh - 26, 2, 26); }
      x += bw + (o.gap || 0) * r();
    }
  }

  label(g, text, x, y, size, color, weight = 700, align = 'center', spacing = 0) {
    g.font = `${weight} ${size}px ${this.font}`;
    g.textAlign = align;
    g.textBaseline = 'middle';
    if (spacing && 'letterSpacing' in g) g.letterSpacing = spacing + 'px';
    g.fillStyle = color;
    g.fillText(text, x, y);
    if ('letterSpacing' in g) g.letterSpacing = '0px';
  }

  // Halo circulaire cuit (remplace shadowBlur dans la boucle).
  glow(key, radius, color) {
    return this.sprite(key, radius * 2, radius * 2, (g) => {
      const grad = g.createRadialGradient(radius, radius, 0, radius, radius, radius);
      grad.addColorStop(0, color);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = grad;
      g.fillRect(0, 0, radius * 2, radius * 2);
    });
  }

  vignette(key, color, strength) {
    return this.screen(key, (g, w, h) => {
      const grad = g.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.75);
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(1, color);
      g.globalAlpha = strength;
      g.fillStyle = grad;
      g.fillRect(0, 0, w, h);
    });
  }

  // ── Éléments communs, habillés par chaque univers ──

  // Contour pulsé autour du lieu devant lequel se tient le joueur.
  drawNearHighlight(ctx, loc, t, color) {
    const pulse = 0.5 + 0.5 * Math.sin(t * 4);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.globalAlpha = 0.45 + pulse * 0.4;
    const pad = 6 + pulse * 3;
    ctx.beginPath();
    ctx.roundRect(loc.x - pad, loc.baseY - loc.h - pad, loc.w + pad * 2, loc.h + pad, this.universe.effects.sharp ? 0 : 10);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  // Pastille « visité » au coin du lieu.
  drawVisited(ctx, loc) {
    const s = this.sprite('visited', 26, 26, (g) => {
      g.fillStyle = this.palette.accent;
      g.beginPath(); g.arc(13, 13, 12, 0, TAU); g.fill();
      g.strokeStyle = this.palette.bg;
      g.lineWidth = 3; g.lineCap = 'round'; g.lineJoin = 'round';
      g.beginPath(); g.moveTo(7.5, 13.5); g.lineTo(11.5, 17.5); g.lineTo(18.5, 9); g.stroke();
    });
    this.blit(ctx, s, loc.x + loc.w - 20, loc.baseY - loc.h - 8);
  }

  // Collectible : halo + pastille au monogramme de la compétence.
  drawCollectible(ctx, col, t) {
    if (col.fade >= 1) return;
    const bob = this.reduced ? 0 : Math.sin(t * 2.4 + col.seed * 40) * 4;
    const k = 1 - col.fade;
    const halo = this.glow('col-glow', 34, this.collectibleGlow || this.palette.accent);
    ctx.globalAlpha = k * (0.5 + 0.2 * Math.sin(t * 3 + col.seed * 9));
    this.blit(ctx, halo, col.x - 34, col.y - 34 + bob);
    ctx.globalAlpha = k;
    const s = this.sprite('col:' + col.id, 34, 34, (g) => this.bakeCollectible(g, col));
    const grow = 1 + col.fade * 0.8;
    ctx.drawImage(s.c, col.x - 17 * grow, col.y - 17 * grow + bob - col.fade * 26, 34 * grow, 34 * grow);
    ctx.globalAlpha = 1;
  }

  bakeCollectible(g, col) {
    g.fillStyle = this.palette.surface;
    g.beginPath(); g.roundRect(3, 3, 28, 28, 9); g.fill();
    g.strokeStyle = this.palette.accent; g.lineWidth = 2.5; g.stroke();
    this.label(g, col.skill.abbr, 17, 18, 13, this.palette.text, 800);
  }

  // Hooks : chaque univers les redéfinit.
  drawSky() {}
  drawFar() {}
  drawWorld() {}
  drawFront() {}
  drawOverlay() {}
}
