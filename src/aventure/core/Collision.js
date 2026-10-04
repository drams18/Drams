/* ══════════════════════════════════════════════════════
   COLLISION.JS : collisions AABB réutilisables

   Repère : x vers la droite, y vers le BAS, le sol de la rue est à y = 0.
   Un corps est décrit par ses pieds : { x (centre), y (pieds), w, h }.

     solides      { x, y, w, h }   sol, murs, plafonds, caisses, quais
     plateformes  { x, y, w }      traversables par dessous : on ne s'y pose
                                   qu'en tombant (et on en descend avec ↓)
     limites      murs invisibles aux bords du monde

   Résolution axe par axe (X puis Y), sans allocation.
   ══════════════════════════════════════════════════════ */

const EPS = 0.01;

export function overlaps(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

export class CollisionWorld {
  constructor({ solids = [], platforms = [], minX = 0, maxX = 1000 } = {}) {
    this.solids = solids;
    this.platforms = platforms;
    this.minX = minX;
    this.maxX = maxX;
    // Résultat du dernier move(), réutilisé d'un appel à l'autre.
    this.hit = { wall: 0, ground: false, ceiling: false, surface: null };
  }

  // Déplace `body` de (dx, dy) en résolvant les collisions.
  // dropThrough : le corps traverse les plateformes (descente volontaire).
  move(body, dx, dy, dropThrough) {
    const hit = this.hit;
    hit.wall = 0; hit.ground = false; hit.ceiling = false; hit.surface = null;
    const hw = body.w / 2;

    // ── Axe X : murs et limites du monde ──
    body.x += dx;
    if (dx !== 0) {
      const top = body.y - body.h;
      for (let i = 0; i < this.solids.length; i++) {
        const s = this.solids[i];
        if (!overlaps(body.x - hw, top, body.w, body.h - EPS, s.x, s.y, s.w, s.h)) continue;
        if (dx > 0) { body.x = s.x - hw; hit.wall = 1; }
        else { body.x = s.x + s.w + hw; hit.wall = -1; }
      }
    }
    if (body.x - hw < this.minX) { body.x = this.minX + hw; hit.wall = -1; }
    else if (body.x + hw > this.maxX) { body.x = this.maxX - hw; hit.wall = 1; }

    // ── Axe Y : sol, plafonds, plateformes ──
    const prevFeet = body.y;
    body.y += dy;
    for (let i = 0; i < this.solids.length; i++) {
      const s = this.solids[i];
      if (!overlaps(body.x - hw, body.y - body.h, body.w, body.h, s.x, s.y, s.w, s.h)) continue;
      if (dy >= 0 && prevFeet <= s.y + EPS) { body.y = s.y; hit.ground = true; hit.surface = s; }
      else if (dy < 0) { body.y = s.y + s.h + body.h; hit.ceiling = true; }
    }
    if (dy >= 0 && !dropThrough && !hit.ground) {
      for (let i = 0; i < this.platforms.length; i++) {
        const p = this.platforms[i];
        if (body.x + hw <= p.x || body.x - hw >= p.x + p.w) continue;
        if (prevFeet <= p.y + EPS && body.y >= p.y) {
          body.y = p.y; hit.ground = true; hit.surface = p;
          break;
        }
      }
    }
    return hit;
  }

  // Y de la première surface sous le point (x, y) : ombre portée, apparitions.
  groundBelow(x, y) {
    let best = Infinity;
    for (let i = 0; i < this.solids.length; i++) {
      const s = this.solids[i];
      if (x >= s.x && x <= s.x + s.w && s.y >= y - EPS && s.y < best) best = s.y;
    }
    for (let i = 0; i < this.platforms.length; i++) {
      const p = this.platforms[i];
      if (x >= p.x && x <= p.x + p.w && p.y >= y - EPS && p.y < best) best = p.y;
    }
    return best === Infinity ? 0 : best;
  }
}
