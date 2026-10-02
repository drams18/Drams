/* ══════════════════════════════════════════════════════
   ACTORS.JS : Tout ce qui vit dans la rue du mode aventure
     • Particles : poussière des pas, éclats (pool fixe, zéro allocation)
     • Traffic   : métro aérien + voitures qui passent derrière les immeubles
     • Tokens    : jetons de compétences à ramasser
     • Npcs      : passants qui glissent une information utile

   Rendu canvas uniquement, en rectangles pleins : ni dégradé, ni shadowBlur,
   ni measureText par frame (la police pixel est à chasse fixe : 1 glyphe =
   1 corps de large, ce qui donne la largeur d'un texte sans le mesurer).
   ══════════════════════════════════════════════════════ */

'use strict';

// ── Particules ────────────────────────────────────────
class Particles {
  constructor(size) {
    this._p = [];
    for (let i = 0; i < size; i++) this._p.push({ life: 0, max: 1, x: 0, y: 0, vx: 0, vy: 0, g: 0, s: 2, c: '#fff' });
    this._next = 0;
  }

  spawn(x, y, vx, vy, life, size, color, gravity) {
    const p = this._p[this._next];
    this._next = (this._next + 1) % this._p.length;
    p.x = x; p.y = y; p.vx = vx; p.vy = vy;
    p.life = p.max = life; p.s = size; p.c = color; p.g = gravity || 0;
  }

  // Petit nuage de poussière au ras du sol.
  dust(x, y, n, dir) {
    for (let i = 0; i < n; i++) {
      this.spawn(x + (Math.random() - 0.5) * 10, y - 1,
        (dir || 0) * (0.4 + Math.random()) + (Math.random() - 0.5) * 1.2,
        -0.3 - Math.random() * 0.9, 14 + Math.random() * 8, 2 + Math.random() * 2,
        'rgba(159,176,216,0.8)', 0.02);
    }
  }

  // Éclats qui partent en étoile (jeton ramassé, lieu découvert).
  burst(x, y, n, color) {
    for (let i = 0; i < n; i++) {
      const a = (Math.PI * 2 * i) / n + Math.random() * 0.4;
      const v = 1.6 + Math.random() * 2.4;
      this.spawn(x, y, Math.cos(a) * v, Math.sin(a) * v - 0.6, 22 + Math.random() * 12, 3,
        i % 3 === 0 ? '#f5f6ff' : color, 0.08);
    }
  }

  update() {
    for (const p of this._p) {
      if (p.life <= 0) continue;
      p.life--;
      p.x += p.vx; p.y += p.vy; p.vy += p.g;
    }
  }

  draw(ctx, camX) {
    for (const p of this._p) {
      if (p.life <= 0) continue;
      ctx.globalAlpha = p.life / p.max;
      ctx.fillStyle = p.c;
      ctx.fillRect(Math.round(p.x - camX), Math.round(p.y), p.s, p.s);
    }
    ctx.globalAlpha = 1;
  }
}

// ── Circulation d'ambiance ────────────────────────────
class Traffic {
  constructor() {
    // Métro aérien : parallaxe 0.6, repasse régulièrement.
    this._train = { x: -500, wait: 240 };
    // Deux voitures, sens opposés, qui roulent derrière les immeubles.
    this._cars = [
      { x: -120, dir: 1,  speed: 2.6, wait: 90,  color: CITY.cyan },
      { x: WORLD_WIDTH + 120, dir: -1, speed: 3.1, wait: 420, color: CITY.magenta },
    ];
  }

  update() {
    const t = this._train;
    if (t.wait > 0) t.wait--;
    else {
      t.x += 3.4;
      if (t.x > WORLD_WIDTH + 900) { t.x = -500; t.wait = 520; }
    }
    for (const c of this._cars) {
      if (c.wait > 0) { c.wait--; continue; }
      c.x += c.dir * c.speed;
      if (c.dir > 0 && c.x > WORLD_WIDTH + 160) { c.x = -160; c.wait = 380 + Math.random() * 300; }
      if (c.dir < 0 && c.x < -160) { c.x = WORLD_WIDTH + 160; c.wait = 380 + Math.random() * 300; }
    }
  }

  // Derrière la ville : viaduc + rame.
  drawFar(ctx, camX, groundY) {
    const w = ctx.canvas.width;
    const par = 0.6;
    const y = groundY - 150;

    ctx.fillStyle = '#0a1024';
    ctx.fillRect(0, y, w, 4);
    for (let px = -((camX * par) % 150); px < w; px += 150) ctx.fillRect(Math.round(px), y + 4, 5, 150);

    if (this._train.wait > 0) return;
    const tx = this._train.x - camX * par;
    if (tx > w + 20 || tx + 4 * 78 < -20) return;
    for (let i = 0; i < 4; i++) {
      const cx = Math.round(tx + i * 78);
      ctx.fillStyle = '#0d1630';
      ctx.fillRect(cx, y - 18, 74, 18);
      ctx.fillStyle = 'rgba(25,232,255,0.55)';
      for (let k = 0; k < 5; k++) ctx.fillRect(cx + 6 + k * 13, y - 14, 8, 6);
      ctx.fillStyle = 'rgba(255,43,176,0.6)';
      ctx.fillRect(cx, y - 4, 74, 1);
    }
  }

  // Au niveau de la rue, avant les immeubles (qui les recouvrent).
  drawNear(ctx, camX, groundY) {
    const w = ctx.canvas.width;
    for (const c of this._cars) {
      if (c.wait > 0) continue;
      const sx = Math.round(c.x - camX);
      if (sx < -90 || sx > w + 90) continue;
      const front = c.dir > 0 ? 1 : -1;

      ctx.fillStyle = '#070b18';
      ctx.fillRect(sx - 30, groundY - 17, 60, 12);          // caisse
      ctx.fillRect(sx - 16, groundY - 27, 30, 10);          // habitacle
      ctx.fillStyle = 'rgba(25,232,255,0.3)';
      ctx.fillRect(sx - 12, groundY - 24, 22, 6);           // vitres
      ctx.fillStyle = c.color;
      ctx.fillRect(sx - 30, groundY - 10, 60, 2);           // liseré néon
      ctx.fillStyle = '#01010a';
      ctx.fillRect(sx - 22, groundY - 7, 11, 7);            // roues
      ctx.fillRect(sx + 11, groundY - 7, 11, 7);
      ctx.fillStyle = CITY.paper;
      ctx.fillRect(sx + front * 30 - (front > 0 ? 4 : 0), groundY - 15, 4, 4);   // phare
      ctx.globalAlpha = 0.16;
      ctx.fillRect(front > 0 ? sx + 30 : sx - 74, groundY - 14, 44, 9);          // faisceau
      ctx.globalAlpha = 1;
      ctx.fillStyle = CITY.red;
      ctx.fillRect(sx - front * 30 - (front > 0 ? 0 : 3), groundY - 15, 3, 4);   // feu arrière
    }
  }
}

// ── Jetons de compétences ─────────────────────────────
// Compétences réelles (SECTIONS.profile.skillGroups). `high` = il faut sauter.
const TOKENS_DATA = [
  { id: 'react',      label: 'React',      x: 150,  high: false, color: CITY.cyan },
  { id: 'typescript', label: 'TypeScript', x: 258,  high: true,  color: CITY.cyan },
  { id: 'nextjs',     label: 'Next.js',    x: 445,  high: false, color: CITY.cyan },
  { id: 'nodejs',     label: 'Node.js',    x: 640,  high: true,  color: CITY.magenta },
  { id: 'nestjs',     label: 'NestJS',     x: 730,  high: false, color: CITY.magenta },
  { id: 'symfony',    label: 'Symfony',    x: 1010, high: true,  color: CITY.magenta },
  { id: 'postgresql', label: 'PostgreSQL', x: 1235, high: false, color: CITY.violet },
  { id: 'docker',     label: 'Docker',     x: 1570, high: true,  color: CITY.red },
];

class Tokens {
  constructor(collectedIds) {
    const got = new Set(collectedIds || []);
    this.items = TOKENS_DATA.map(t => ({ ...t, taken: got.has(t.id) }));
    this._pops = [];      // « + React » qui s'envole
  }

  get count() { return this.items.reduce((n, t) => n + (t.taken ? 1 : 0), 0); }
  get total() { return this.items.length; }
  ids() { return this.items.filter(t => t.taken).map(t => t.id); }

  _y(t, groundY, tick) {
    return groundY - (t.high ? 118 : 30) + Math.sin(tick * 0.07 + t.x) * 4;
  }

  // Renvoie le jeton ramassé cette frame (ou null).
  collect(player, groundY, tick) {
    const top = player.y - 10;
    const bottom = player.y + PLAYER_H + 10;
    for (const t of this.items) {
      if (t.taken || Math.abs(player.x - t.x) > 26) continue;
      const y = this._y(t, groundY, tick);
      if (y < top || y > bottom) continue;
      t.taken = true;
      this._pops.push({ text: '+ ' + t.label, x: t.x, y, life: 55, color: t.color });
      return t;
    }
    return null;
  }

  draw(ctx, camX, groundY, tick) {
    const w = ctx.canvas.width;
    ctx.textAlign = 'center';
    ctx.font = '6px "Press Start 2P", monospace';

    for (const t of this.items) {
      if (t.taken) continue;
      const sx = Math.round(t.x - camX);
      if (sx < -60 || sx > w + 60) continue;
      const y = Math.round(this._y(t, groundY, tick));

      // Losange qui « tourne » (largeur modulée), contour encre.
      const half = 10;
      const hw = Math.max(2, Math.abs(Math.cos(tick * 0.05 + t.x)) * half);
      ctx.beginPath();
      ctx.moveTo(sx, y - half);
      ctx.lineTo(sx + hw, y);
      ctx.lineTo(sx, y + half);
      ctx.lineTo(sx - hw, y);
      ctx.closePath();
      ctx.fillStyle = t.color;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = CITY.ink;
      ctx.stroke();
      ctx.fillStyle = CITY.paper;
      ctx.fillRect(sx - 1, y - 5, 2, 4);

      // Étiquette : cartouche sombre + nom (chasse fixe → largeur sans mesure).
      const lw = t.label.length * 6 + 8;
      ctx.fillStyle = 'rgba(3,4,12,0.85)';
      ctx.fillRect(Math.round(sx - lw / 2), y + 14, lw, 11);
      ctx.fillStyle = t.color;
      ctx.fillText(t.label, sx, y + 23);
    }

    // Textes qui s'envolent après un ramassage
    ctx.font = '7px "Press Start 2P", monospace';
    for (let i = this._pops.length - 1; i >= 0; i--) {
      const p = this._pops[i];
      p.life--;
      p.y -= 0.9;
      if (p.life <= 0) { this._pops.splice(i, 1); continue; }
      ctx.globalAlpha = Math.min(1, p.life / 20);
      ctx.fillStyle = CITY.ink;
      ctx.fillText(p.text, p.x - camX + 1, p.y + 1);
      ctx.fillStyle = CITY.paper;
      ctx.fillText(p.text, p.x - camX, p.y);
    }
    ctx.globalAlpha = 1;
  }
}

// ── Passants ──────────────────────────────────────────
// Chacun arpente un bout de trottoir ; quand le joueur approche, il s'arrête,
// se tourne vers lui et dit une phrase (la suivante à la prochaine rencontre).
function npcLines() {
  const projets = (typeof SECTIONS !== 'undefined' && SECTIONS.projets && SECTIONS.projets.items)
    ? SECTIONS.projets.items.length : 0;
  const seeking = typeof seekingNow === 'function' ? seekingNow() : 'En recherche de CDI';
  return [
    [seeking, 'Un projet de site ? Passez le portail.'],
    [projets ? `La galerie : ${projets} projets à voir.` : 'La galerie est juste là.', 'Le CV est dans le menu.'],
  ];
}

const NPC_RADIUS = 105;

class Npcs {
  constructor() {
    const lines = npcLines();
    this.items = [
      { x: 925, x0: 912, x1: 968, dir: 1, coat: '#3a1d6e', trim: CITY.violet, lines: lines[0] },
      { x: 1690, x0: 1662, x1: 1748, dir: -1, coat: '#6b1040', trim: CITY.magenta, lines: lines[1] },
    ];
    for (const n of this.items) {
      n.frame = 0; n.near = false; n.line = 0; n.pop = 0;
      n.wrapped = n.lines.map(l => Npcs.wrap(l, 20));
    }
  }

  // Coupe une phrase en lignes de `max` caractères au plus.
  static wrap(text, max) {
    const out = [];
    let cur = '';
    for (const word of text.split(' ')) {
      if (cur && (cur + ' ' + word).length > max) { out.push(cur); cur = word; }
      else cur = cur ? cur + ' ' + word : word;
    }
    if (cur) out.push(cur);
    return out;
  }

  // Renvoie true si un passant vient d'engager la conversation.
  update(playerX) {
    let spoke = false;
    for (const n of this.items) {
      const near = Math.abs(playerX - n.x) < NPC_RADIUS;
      if (near && !n.near) { n.pop = 0; spoke = true; }
      if (!near && n.near) n.line = (n.line + 1) % n.lines.length;
      n.near = near;
      if (near) {
        n.dir = playerX < n.x ? -1 : 1;
        if (n.pop < 1) n.pop = Math.min(1, n.pop + 0.18);
      } else {
        n.x += n.dir * 0.45;
        n.frame += 0.1;
        if (n.x > n.x1) n.dir = -1;
        if (n.x < n.x0) n.dir = 1;
      }
    }
    return spoke;
  }

  // viewW = largeur visible en espace monde (la bulle reste à l'écran).
  draw(ctx, camX, groundY, viewW) {
    const w = ctx.canvas.width;
    for (const n of this.items) {
      const sx = Math.round(n.x - camX);
      if (sx < -160 || sx > w + 160) continue;
      const swing = n.near ? 0 : Math.sin(n.frame) * 5;
      const top = groundY - 50;

      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.fillRect(sx - 12, groundY + 1, 24, 3);

      ctx.save();
      if (n.dir < 0) { ctx.translate(sx, 0); ctx.scale(-1, 1); ctx.translate(-sx, 0); }
      ctx.fillStyle = '#0c1428';                       // jambes
      ctx.fillRect(sx - 7, top + 31 + swing * 0.4, 6, 19 - swing * 0.4);
      ctx.fillRect(sx + 1, top + 31 - swing * 0.4, 6, 19 + swing * 0.4);
      ctx.fillStyle = n.coat;                          // manteau
      ctx.fillRect(sx - 9, top + 13, 18, 21);
      ctx.fillStyle = n.trim;
      ctx.fillRect(sx - 9, top + 13, 2, 21);
      ctx.fillRect(sx - 9, top + 32, 18, 2);
      ctx.fillStyle = '#c98a5e';                       // tête
      ctx.fillRect(sx - 7, top, 14, 13);
      ctx.fillStyle = n.trim;                          // bonnet
      ctx.fillRect(sx - 8, top - 3, 16, 6);
      ctx.fillStyle = '#01010a';                       // œil (regarde devant)
      ctx.fillRect(sx + 2, top + 6, 3, 3);
      ctx.restore();

      // Au-dessus de l'étiquette du joueur, qui se tient juste à côté.
      if (n.near) this._bubble(ctx, n, sx, top - 46, viewW);
    }
  }

  _bubble(ctx, n, sx, bottom, viewW) {
    const lines = n.wrapped[n.line];
    const fs = 7, lh = 11;
    let chars = 0;
    for (const l of lines) chars = Math.max(chars, l.length);
    const bw = chars * fs + 16;
    const bh = lines.length * lh + 9;
    // Reste entièrement à l'écran.
    const bx = Math.round(Math.max(6, Math.min(viewW - bw - 6, sx - bw / 2)));
    const by = Math.round(bottom - bh + (1 - n.pop) * 6);

    ctx.globalAlpha = n.pop;
    ctx.fillStyle = CITY.paper;
    ctx.fillRect(bx, by, bw, bh);
    ctx.fillRect(sx - 2, by + bh, 4, 30);              // fil de la bulle jusqu'au passant
    ctx.strokeStyle = CITY.ink;
    ctx.lineWidth = 2;
    ctx.strokeRect(bx, by, bw, bh);
    ctx.fillStyle = n.trim;
    ctx.fillRect(bx + 2, by + bh - 3, bw - 4, 2);

    ctx.font = fs + 'px "Press Start 2P", monospace';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#0e1630';
    for (let i = 0; i < lines.length; i++) ctx.fillText(lines[i], bx + 8, by + 13 + i * lh);
    ctx.globalAlpha = 1;
  }
}
