/* ══════════════════════════════════════════════════════
   CHARACTERRENDERER.JS : dessin vectoriel d'un personnage

   Ne fait QUE dessiner : il reçoit un Character (position), une pose
   (CharacterAnimator) et un `look` fourni par l'univers :

     { skin, hair, top, topShade, bottom, shoes, accent,
       build: 1,           largeur de la silhouette
       hairStyle: 'short' | 'hood' | 'mask' | 'cap',
       coat: false,        manteau long (palais)
       scarf: false,       écharpe qui flotte (héros)
       bag: false,         sac à dos (ville)
       emblem: false }     marque géométrique sur la poitrine (héros)

   Aplats et traits à bouts ronds uniquement : ni dégradé, ni ombre floue,
   ni mesure de texte dans la boucle.
   ══════════════════════════════════════════════════════ */

const TAU = Math.PI * 2;
const HIP = 27;        // hauteur des hanches au-dessus des pieds
const THIGH = 14;
const SHIN = 13.5;
const TORSO = 19;
const UPPER = 10;
const FORE = 9.5;

export class CharacterRenderer {
  constructor(look) {
    this.look = look;
    this._scarf = new Float32Array(10);     // 5 points de traîne (x, y)
    this._scarfInit = false;
  }

  setLook(look) { this.look = look; this._scarfInit = false; }

  // Ombre portée, dessinée avant le personnage (au sol sous lui).
  drawShadow(ctx, c) {
    const lift = Math.min(1, Math.max(0, (c.shadowY - c.y) / 160));
    ctx.globalAlpha = (0.3 - lift * 0.2) * c.alpha;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(c.x, c.shadowY + 1, 15 - lift * 6, 3.6 - lift * 1.4, 0, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  draw(ctx, c, pose, dt) {
    const L = this.look;
    const w = L.build || 1;
    const sq = pose.squash;
    const cyc = pose.phase * TAU;
    const m = pose.move, air = pose.air;

    ctx.save();
    ctx.globalAlpha = c.alpha;
    ctx.translate(c.x, c.y);
    ctx.scale(c.facing * (1 + sq * 0.5), 1 - sq);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Rebond du bassin pendant la marche, respiration au repos.
    const bob = Math.abs(Math.sin(cyc)) * 2.4 * m + pose.breath * 0.5 * (1 - m);
    const hipY = -HIP + bob * (1 - air) - air * 1.5;
    const lean = pose.lean + air * pose.rise * -0.06;

    // ── Jambes ──
    const swing = 0.72 * m;
    const legA = this._leg(Math.sin(cyc) * swing, Math.max(0, -Math.cos(cyc)) * 0.95 * m, air, pose.rise, 1);
    const legB = this._leg(Math.sin(cyc + Math.PI) * swing, Math.max(0, Math.cos(cyc)) * 0.95 * m, air, pose.rise, -1);

    // Manteau long : pan arrière, derrière les jambes.
    if (L.coat) {
      const sway = Math.sin(cyc) * 2.5 * m - pose.lean * 20;
      ctx.fillStyle = L.topShade;
      ctx.beginPath();
      ctx.moveTo(-6.5 * w, hipY - 4);
      ctx.lineTo(6 * w, hipY - 4);
      ctx.lineTo(7 * w - sway * 0.4, hipY + 17);
      ctx.lineTo(-9 * w - sway, hipY + 18 - air * 4);
      ctx.closePath();
      ctx.fill();
    }

    this._drawLeg(ctx, legB, hipY, L.bottomShade || L.bottom, L.shoes, w);
    this._drawLeg(ctx, legA, hipY, L.bottom, L.shoes, w);

    // ── Buste (incliné autour des hanches) ──
    ctx.translate(0, hipY);
    ctx.rotate(lean);
    const shY = -TORSO;

    // Bras arrière
    const armSwing = 0.85 * m;
    const reach = pose.reach;
    this._drawArm(ctx, shY, -Math.sin(cyc) * armSwing * (1 - reach) + air * (0.9 + pose.rise * 0.5) , 0.25 + m * 0.7 + air * 0.4, L.topShade, L.skin, w, -1);

    if (L.bag) {
      ctx.fillStyle = L.accent;
      this._round(ctx, -10.5 * w, shY + 2, 6, 14, 2.5);
    }

    // Torse
    ctx.fillStyle = L.top;
    this._round(ctx, -6.8 * w, shY - 1, 13.6 * w, TORSO + 3, 5.5);
    if (L.coat) {
      ctx.fillStyle = L.topShade;
      ctx.fillRect(1.2 * w, shY + 3, 1.4, TORSO - 2);        // fermeture du manteau
      ctx.beginPath();                                        // col relevé
      ctx.moveTo(-5 * w, shY + 1); ctx.lineTo(1 * w, shY + 7); ctx.lineTo(5 * w, shY - 1); ctx.lineTo(1 * w, shY - 3);
      ctx.closePath();
      ctx.fill();
    }
    if (L.emblem) {
      ctx.strokeStyle = L.accent;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(-2.6, shY + 11); ctx.lineTo(1, shY + 4.5); ctx.lineTo(4.6, shY + 11);
      ctx.moveTo(-0.8, shY + 8.6); ctx.lineTo(2.8, shY + 8.6);
      ctx.stroke();
    }

    // Écharpe : traîne à l'opposé du mouvement.
    if (L.scarf) this._drawScarf(ctx, c, pose, shY, dt);

    // ── Tête ──
    const headY = shY - 8.2;
    ctx.fillStyle = L.skin;
    ctx.fillRect(-1.8, shY - 3.5, 4, 4);                       // cou
    this._drawHead(ctx, headY, L, pose);

    // Bras avant
    this._drawArm(ctx, shY, Math.sin(cyc) * armSwing * (1 - reach) - reach * 1.35 + air * (-0.5 + pose.rise * 0.4), 0.25 + m * 0.7 + reach * 0.3, L.top, L.skin, w, 1);

    ctx.restore();
  }

  // Angles d'une jambe : cuisse (sw), genou (bend) ; en l'air les jambes se replient.
  _leg(sw, bend, air, rise, side) {
    const tuck = air * (0.5 - rise * 0.25);
    return { thigh: sw * (1 - air) + air * side * (0.42 + rise * 0.1), knee: bend * (1 - air) + tuck };
  }

  _drawLeg(ctx, leg, hipY, color, shoes, w) {
    const kx = Math.sin(leg.thigh) * THIGH;
    const ky = hipY + Math.cos(leg.thigh) * THIGH;
    const a2 = leg.thigh - leg.knee;
    const fx = kx + Math.sin(a2) * SHIN;
    const fy = ky + Math.cos(a2) * SHIN;
    ctx.strokeStyle = color;
    ctx.lineWidth = 6.4 * w;
    ctx.beginPath();
    ctx.moveTo(0, hipY); ctx.lineTo(kx, ky); ctx.lineTo(fx, fy - 2);
    ctx.stroke();
    ctx.fillStyle = shoes;
    this._round(ctx, fx - 3.5, fy - 4.2, 10, 4.6, 2.2);
  }

  _drawArm(ctx, shY, swing, bend, color, skin, w, side) {
    const sx = side * 0.8;
    const ex = sx + Math.sin(swing) * UPPER;
    const ey = shY + 2.5 + Math.cos(swing) * UPPER;
    const a2 = swing + bend;
    const hx = ex + Math.sin(a2) * FORE;
    const hy = ey + Math.cos(a2) * FORE;
    ctx.strokeStyle = color;
    ctx.lineWidth = 5 * w;
    ctx.beginPath();
    ctx.moveTo(sx, shY + 2.5); ctx.lineTo(ex, ey); ctx.lineTo(hx, hy);
    ctx.stroke();
    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.arc(hx, hy, 2.7, 0, TAU);
    ctx.fill();
  }

  _drawHead(ctx, y, L, pose) {
    const r = 7;
    const style = L.hairStyle;
    if (style === 'mask') {
      // Masque intégral + visière : une bande lumineuse, identité propre.
      ctx.fillStyle = L.hair;
      ctx.beginPath(); ctx.arc(0.5, y, r, 0, TAU); ctx.fill();
      ctx.fillStyle = L.accent;
      ctx.beginPath();
      ctx.moveTo(-1.5, y - 1.2); ctx.lineTo(7, y - 2.6); ctx.lineTo(7.2, y + 0.6); ctx.lineTo(0, y + 1.6);
      ctx.closePath();
      ctx.fill();
      return;
    }
    ctx.fillStyle = L.skin;
    ctx.beginPath(); ctx.arc(0.5, y, r, 0, TAU); ctx.fill();
    ctx.fillStyle = L.hair;
    if (style === 'hood') {
      ctx.beginPath();
      ctx.arc(-0.3, y - 0.4, r + 1.4, Math.PI * 0.42, Math.PI * 1.82);
      ctx.lineTo(3.2, y - 3);
      ctx.closePath();
      ctx.fill();
    } else if (style === 'cap') {
      ctx.beginPath(); ctx.arc(0.5, y - 0.6, r + 0.4, Math.PI, TAU); ctx.fill();
      this._round(ctx, 2, y - 2.2, 9, 2.2, 1);
    } else {
      ctx.beginPath(); ctx.arc(0.2, y - 1.2, r + 0.3, Math.PI * 0.95, Math.PI * 1.95); ctx.fill();
      ctx.fillRect(-7, y - 2.4, 4.4, 4.6);
    }
    // Œil (clignement toutes les ~4 s)
    if (pose.t % 4.1 > 0.12) {
      ctx.fillStyle = '#16181f';
      ctx.fillRect(3.6, y - 0.8, 1.6, 2.2);
    }
  }

  // Traîne à 5 points : chaque point suit le précédent avec retard (en espace
  // monde), ce qui donne le flottement sans simulation coûteuse.
  _drawScarf(ctx, c, pose, shY, dt) {
    const s = this._scarf;
    const ax = c.x - c.facing * 4, ay = c.y - 27 - 19 + 2;
    if (!this._scarfInit) {
      for (let i = 0; i < 5; i++) { s[i * 2] = ax - c.facing * i * 5; s[i * 2 + 1] = ay + i * 2; }
      this._scarfInit = true;
    }
    const k = 1 - Math.exp(-22 * (dt || 0.016));
    let px = ax, py = ay;
    for (let i = 0; i < 5; i++) {
      const tx = px - c.facing * 5.5 + Math.sin(pose.t * 5 + i) * 0.8;
      const ty = py + 2.4 + Math.cos(pose.t * 4 + i * 1.3) * 0.8;
      s[i * 2] += (tx - s[i * 2]) * k;
      s[i * 2 + 1] += (ty - s[i * 2 + 1]) * k;
      px = s[i * 2]; py = s[i * 2 + 1];
    }
    // Le contexte est en repère local (retourné, incliné) : on repasse en monde.
    ctx.save();
    ctx.rotate(-pose.lean);
    ctx.scale(c.facing, 1);
    ctx.translate(-c.x, -(c.y - 27));
    ctx.strokeStyle = this.look.accent;
    ctx.lineWidth = 3.6;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    for (let i = 0; i < 5; i++) ctx.lineTo(s[i * 2], s[i * 2 + 1]);
    ctx.stroke();
    ctx.restore();
  }

  _round(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.fill();
  }
}
