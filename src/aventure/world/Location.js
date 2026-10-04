/* ══════════════════════════════════════════════════════
   LOCATION.JS : un lieu du monde où l'on entre

   Quatre lieux portent une section du portfolio (profile, parcours,
   contact, projets) et un portail mène à « Construisez votre projet ».
   Les identifiants sont les mêmes dans les trois univers : seuls
   l'apparence et le libellé changent.
   ══════════════════════════════════════════════════════ */

const REACH_X = 52;
const REACH_Y = 24;

export class Location {
  // def : { id, x, w, h, baseY = 0, doorX, portal?, style? }
  constructor(def, label, accent) {
    this.id = def.id;
    this.isPortal = !!def.portal;
    this.x = def.x;
    this.w = def.w;
    this.h = def.h;
    this.baseY = def.baseY || 0;       // niveau du seuil (0 = rue)
    this.doorX = def.doorX != null ? def.doorX : def.x + def.w / 2;
    this.style = def.style || def.id;
    this.label = label;
    this.accent = accent;
    this.href = def.href || null;
    this.visited = false;
    this.open = 0;                     // 0 fermé → 1 ouvert (animation de porte)
    this.boost = false;                // portail illuminé (mission accomplie)
  }

  isNear(c) {
    return Math.abs(c.x - this.doorX) <= REACH_X && Math.abs(c.y - this.baseY) <= REACH_Y;
  }

  contains(wx, wy) {
    return wx >= this.x && wx <= this.x + this.w && wy >= this.baseY - this.h - 30 && wy <= this.baseY + 16;
  }
}
