/* ══════════════════════════════════════════════════════
   LOGO.MJS : génère le logo du site (npm run logo)

     assets/img/logo.svg      sceau complet
     assets/img/favicon.svg   version simplifiée (favicon, barre du haut)

   Les PNG (favicon.png 96 px, apple-touch-icon.png 180 px) se refont à
   partir de favicon.svg, voir README.
   ══════════════════════════════════════════════════════ */
// Sceau rond « A.D », argent et bleu nuit, inspiré de Reborn!
//   bande extérieure en argent, nuages calqués gravés ; anneau intérieur : sept gemmes
//   aux couleurs des sept attributs (Tri-ni-sette) ; centre : monogramme AD coiffé du fedora.
//   Argent poli de la bague du Ciel, éclairage unique venant du haut à gauche.
import { readFileSync, writeFileSync } from 'node:fs';

const f = (n) => +n.toFixed(1);
const C = 400;
// Métal : palette relevée sur la bague du Ciel de Reborn!, argent poli à reflets bleus.
// Le chapeau garde ses couleurs d'origine (or, noir chaud) : HAT_INK et le dégradé hatGold.
const INK = '#0c1218', ENGRAVE = '#141f22', HAT_INK = '#0b0907';
const ATTR = [ // Ciel en haut, puis dans l'ordre
  ['Ciel', '#ff8a1c'], ['Tempête', '#e5322d'], ['Pluie', '#2f86e8'], ['Soleil', '#ffd23a'],
  ['Foudre', '#3cc457'], ['Nuage', '#9b4fe0'], ['Brume', '#5246c9'],
];
const pt = (r, deg) => [C + Math.cos((deg * Math.PI) / 180) * r, C + Math.sin((deg * Math.PI) / 180) * r];
const ring = (r, stroke, w) => `<circle cx="${C}" cy="${C}" r="${r}" fill="none" stroke="${stroke}" stroke-width="${w}"/>`;

const DEFS = `<defs>
<linearGradient id="hatGold" x1="0" y1="0" x2="1" y2="1">
  <stop offset="0" stop-color="#fdf0c0"/><stop offset=".3" stop-color="#e3bd68"/>
  <stop offset=".62" stop-color="#a87a2e"/><stop offset=".85" stop-color="#d9b062"/><stop offset="1" stop-color="#8a6222"/>
</linearGradient>
<linearGradient id="silver" x1="0" y1="0" x2="1" y2="1">
  <stop offset="0" stop-color="#f4fcf5"/><stop offset=".3" stop-color="#c8cfdc"/>
  <stop offset=".62" stop-color="#66798c"/><stop offset=".85" stop-color="#e1ebf3"/><stop offset="1" stop-color="#525d60"/>
</linearGradient>
<linearGradient id="band" x1="0" y1="0" x2="1" y2="1">
  <stop offset="0" stop-color="#e1ebf3"/><stop offset=".45" stop-color="#a1abb5"/><stop offset="1" stop-color="#525d60"/>
</linearGradient>
<linearGradient id="silverV" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="#ffffff"/><stop offset=".42" stop-color="#d5dde6"/>
  <stop offset=".68" stop-color="#66798c"/><stop offset="1" stop-color="#c8d6e2"/>
</linearGradient>
<linearGradient id="lit" x1="0" y1="0" x2="1" y2="1">
  <stop offset="0" stop-color="#ffffff"/><stop offset=".5" stop-color="#a1abb5" stop-opacity=".2"/><stop offset="1" stop-color="#141f22"/>
</linearGradient>
<linearGradient id="shade" x1="0" y1="0" x2="1" y2="1">
  <stop offset="0" stop-color="#141f22"/><stop offset=".5" stop-color="#a1abb5" stop-opacity=".2"/><stop offset="1" stop-color="#ffffff"/>
</linearGradient>
<radialGradient id="disc" cx="45%" cy="40%" r="62%">
  <stop offset="0" stop-color="#2f4f7a"/><stop offset=".6" stop-color="#142238"/><stop offset="1" stop-color="#070c14"/>
</radialGradient>
<linearGradient id="mirror" x1="0" y1="0" x2="1" y2="1">
  <stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".42" stop-color="#fff" stop-opacity="0"/>
  <stop offset=".5" stop-color="#d5f4f7" stop-opacity=".09"/><stop offset=".58" stop-color="#fff" stop-opacity="0"/>
</linearGradient>
<radialGradient id="sheen" cx="30%" cy="22%" r="70%">
  <stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/>
</radialGradient>
<linearGradient id="felt" x1="0" y1="0" x2="1" y2="1">
  <stop offset="0" stop-color="#3a332e"/><stop offset=".45" stop-color="#181412"/><stop offset="1" stop-color="#070605"/>
</linearGradient>
<linearGradient id="brim" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="#2c2622"/><stop offset=".55" stop-color="#121010"/><stop offset="1" stop-color="#050404"/>
</linearGradient>
<linearGradient id="ribbon" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="#ffb05a"/><stop offset=".5" stop-color="#ff8a1c"/><stop offset="1" stop-color="#c85a06"/>
</linearGradient>
</defs>`;
let s = DEFS;

// ── Liseré extérieur : relief (clair en haut à gauche, sombre en bas à droite) ──
s += `<circle cx="${C}" cy="${C}" r="396" fill="url(#silver)"/>`;
s += ring(394.5, 'url(#lit)', 3);
s += ring(383, INK, 3);       // gorge
s += ring(380.5, 'url(#shade)', 2);

// ── Bande en argent, nuages calqués sur une illustration (avec l’accord de son auteur), gravés ──
s += `<circle cx="${C}" cy="${C}" r="381.5" fill="url(#band)"/>`;
{
  const { CX, CY, loops } = JSON.parse(readFileSync(new URL('./logo-nuages.json', import.meta.url)));
  // Report en polaire : la bande d'origine (r 300 à 369) devient la nôtre (r 308 à 378).
  const map = ([x, y]) => {
    const dx = x - CX, dy = y - CY, r = Math.hypot(dx, dy), a = Math.atan2(dy, dx);
    const r2 = 308 + ((r - 300) * 70) / 69;
    return `${f(C + Math.cos(a) * r2)},${f(C + Math.sin(a) * r2)}`;
  };
  const d = loops.map((l) => 'M' + l.map(map).join(' L') + 'Z').join(' ');
  // Gravure : reflet clair décalé vers le bas à droite, puis le creux sombre.
  s += `<path d="${d}" fill="#ffffff" fill-rule="evenodd" opacity=".6" transform="translate(1.2 1.2)"/>`;
  s += `<path d="${d}" fill="${ENGRAVE}" fill-rule="evenodd"/>`;
}
s += ring(307, INK, 4);       // gorge intérieure

// ── Anneau d'argent intérieur + sept gemmes ──
s += `<circle cx="${C}" cy="${C}" r="305" fill="url(#silver)"/>`;
s += ring(303.5, 'url(#lit)', 2.5);
s += `<circle cx="${C}" cy="${C}" r="288" fill="url(#disc)"/>`;
s += `<circle cx="${C}" cy="${C}" r="288" fill="url(#mirror)"/>`; // reflet en biais, comme le chaton de la bague
s += ring(288.5, 'url(#shade)', 2.5);
s += ring(281, '#c8cfdc', 1.2).replace('/>', ' opacity=".45"/>');
// Gemme taillée : table octogonale, facettes alternées claires et sombres, chaton à quatre griffes.
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mix = (h, to, t) => '#' + hex(h).map((v, i) => Math.round(v + (hex(to)[i] - v) * t).toString(16).padStart(2, '0')).join('');
function gem(x, y, r, col) {
  let g = `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r + 6)}" fill="url(#silver)" stroke="${INK}" stroke-width="2.5"/>` +
    `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r + 1.5)}" fill="${INK}"/>`;
  const N = 8, girdle = [], table = [];
  for (let k = 0; k < N; k++) {
    const a = (k / N) * Math.PI * 2 + Math.PI / 8;
    girdle.push([x + Math.cos(a) * r, y + Math.sin(a) * r]);
    table.push([x + Math.cos(a) * r * 0.52, y + Math.sin(a) * r * 0.52]);
  }
  g += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${mix(col, '#000000', 0.3)}"/>`;
  for (let k = 0; k < N; k++) {
    const k2 = (k + 1) % N, a = (k / N) * Math.PI * 2;
    // Les facettes tournées vers la lumière (haut à gauche) sont plus claires.
    const lightness = Math.cos(a - Math.PI * 1.25);
    const fill = lightness > 0 ? mix(col, '#ffffff', 0.04 + lightness * 0.22) : mix(col, '#000000', -lightness * 0.45);
    g += `<path d="M${f(girdle[k][0])},${f(girdle[k][1])} L${f(girdle[k2][0])},${f(girdle[k2][1])} L${f(table[k2][0])},${f(table[k2][1])} L${f(table[k][0])},${f(table[k][1])} Z" fill="${fill}"/>`;
  }
  g += `<path d="M${table.map(([u, v]) => `${f(u)},${f(v)}`).join(' L')} Z" fill="${mix(col, '#ffffff', 0.08)}" stroke="${mix(col, '#000000', 0.4)}" stroke-width=".8"/>`;
  g += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="none" stroke="${INK}" stroke-width="1.4"/>`;
  g += `<path d="M${f(x - r * 0.42)},${f(y - r * 0.1)} L${f(x - r * 0.12)},${f(y - r * 0.42)}" stroke="#fff" stroke-width="${f(r * 0.16)}" stroke-linecap="round" opacity=".85"/>`;
  // Griffes en diagonale.
  for (const a of [45, 135, 225, 315]) {
    const t = (a * Math.PI) / 180, gx = x + Math.cos(t) * (r + 1), gy = y + Math.sin(t) * (r + 1);
    g += `<circle cx="${f(gx)}" cy="${f(gy)}" r="${f(Math.max(2.2, r * 0.2))}" fill="url(#silver)" stroke="${INK}" stroke-width="1.2"/>`;
  }
  return g;
}
// Le Ciel, en haut, est la pierre du chef de famille : plus grosse que les autres.
ATTR.forEach(([, col], i) => {
  const [x, y] = pt(296.5, -90 + (i * 360) / ATTR.length);
  s += gem(x, y, i === 0 ? 14 : 9.5, col);
});

// ── Monogramme AD calligraphique ──
// Chaque trait est une courbe de Bézier tracée « au pinceau » : on échantillonne la courbe et on
// l'épaissit de part et d'autre selon un profil de largeur (pleins et déliés, attaques effilées).
// Repère local : ligne de base y = 0, hauteur de capitale 240.
function brush(segs, widths, steps = 28) {
  const P = [];
  segs.forEach(([p0, c1, c2, p1], si) => {
    for (let i = si ? 1 : 0; i <= steps; i++) {
      const t = i / steps, u = 1 - t;
      const x = u * u * u * p0[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * p1[0];
      const y = u * u * u * p0[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * p1[1];
      P.push([x, y]);
    }
  });
  const width = (t) => {
    for (let k = 1; k < widths.length; k++) {
      const [t0, w0] = widths[k - 1], [t1, w1] = widths[k];
      if (t <= t1) { const e = (t - t0) / (t1 - t0 || 1), sm = e * e * (3 - 2 * e); return w0 + (w1 - w0) * sm; }
    }
    return widths[widths.length - 1][1];
  };
  const left = [], right = [];
  P.forEach(([x, y], i) => {
    const [ax, ay] = P[Math.max(0, i - 1)], [bx, by] = P[Math.min(P.length - 1, i + 1)];
    const dx = bx - ax, dy = by - ay, n = Math.hypot(dx, dy) || 1, w = width(i / (P.length - 1)) / 2;
    left.push([x - (dy / n) * w, y + (dx / n) * w]);
    right.push([x + (dy / n) * w, y - (dx / n) * w]);
  });
  const pts = left.concat(right.reverse());
  return 'M' + pts.map(([x, y]) => `${f(x)},${f(y)}`).join(' L') + 'Z';
}
const ball = (x, y, r) => `M${f(x - r)},${y} a${r},${r} 0 1,0 ${2 * r},0 a${r},${r} 0 1,0 ${-2 * r},0Z`;

// D : panse (délié en haut, plein à droite, délié en bas), fût, boucle d'attaque en haut à gauche.
const D_bowl = brush([[[146, -236], [250, -254], [334, -204], [334, -120]], [[334, -120], [334, -32], [254, 8], [146, -2]]],
  [[0, 3], [0.18, 8], [0.5, 46], [0.82, 10], [1, 4]]);
const D_stem = brush([[[154, -230], [148, -160], [150, -70], [146, -4]]], [[0, 24], [0.45, 32], [1, 26]]);
const D_loop = brush([[[152, -234], [132, -252], [100, -246], [102, -224]], [[102, -224], [104, -206], [128, -206], [128, -222]]],
  [[0, 6], [0.5, 9], [1, 3]]) + ' ' + ball(127, -222, 5);
// Souligné : le bas du D repart vers la gauche, passe sous le A et s'enroule.
const D_swash = brush([[[146, -2], [60, 16], [-60, 26], [-132, 8]], [[-132, 8], [-168, -2], [-168, -34], [-142, -36]], [[-142, -36], [-126, -37], [-120, -22], [-132, -16]]],
  [[0, 5], [0.3, 13], [0.7, 6], [1, 3]]) + ' ' + ball(-133, -17, 5.5);
// A : jambage droit plein et effilé, jambage gauche en délié, petits empattements calligraphiques.
const A_right = brush([[[0, -242], [22, -170], [56, -72], [84, 6]]],
  [[0, 4], [0.3, 22], [0.75, 34], [1, 30]]);
const A_left = brush([[[0, -242], [-22, -168], [-52, -80], [-78, -6]], [[-78, -6], [-82, 4], [-96, 6], [-104, -2]]],
  [[0, 4], [0.5, 7], [0.85, 8], [1, 3]]);
// Barre : arabesque qui part en volute à gauche, traverse le A et le fût du D, et s'enroule dans la panse.
const A_bar = brush([[[-104, -64], [-112, -86], [-86, -98], [-56, -90]], [[-56, -90], [0, -82], [110, -92], [196, -98]],
  [[196, -98], [236, -101], [246, -74], [228, -66]], [[228, -66], [214, -60], [204, -74], [214, -80]]],
  [[0, 3], [0.2, 6], [0.45, 12], [0.72, 9], [0.9, 5], [1, 3]]) + ' ' + ball(214, -79, 5);
const MONO_CX = 82; // milieu horizontal du monogramme dans le repère local

// Le contour clair passe sous le remplissage (paint-order) : pas de coutures entre morceaux.
// evenodd uniquement pour le D (sa panse est un trou) ; le A est fait de morceaux qui se chevauchent.
// bold > 0 épaissit tous les traits (favicon : les déliés disparaîtraient sinon).
const metal = (d, rule = 'nonzero', bold = 0) =>
  `<path d="${d}" fill="#000" opacity=".45" transform="translate(2.5 4)" fill-rule="${rule}"${bold ? ` stroke="#000" stroke-width="${bold}"` : ''}/>` +
  (bold ? `<path d="${d}" fill="none" stroke="url(#silverV)" stroke-width="${bold}" stroke-linejoin="round"/>` : '') +
  `<path d="${d}" fill="url(#silverV)" stroke="url(#lit)" stroke-width="4" paint-order="stroke" fill-rule="${rule}"/>`;
const monogram = (cx, baseline, sc, bold = 0) =>
  `<g transform="translate(${f(cx - MONO_CX * sc)} ${baseline}) scale(${sc})" stroke-linejoin="round">` +
  metal(D_bowl, 'nonzero', bold) + metal(D_stem, 'nonzero', bold) + metal(D_loop, 'nonzero', bold) +
  metal(D_swash, 'nonzero', bold) +
  // Le A passe devant le souligné, la barre passe devant tout : un liseré sombre détache chaque croisement.
  `<path d="${A_right} ${A_left}" fill="none" stroke="${INK}" stroke-width="${6 + bold}"/>` + metal(A_right + ' ' + A_left, 'nonzero', bold) +
  `<path d="${A_bar}" fill="none" stroke="${INK}" stroke-width="${6 + bold}"/>` + metal(A_bar, 'nonzero', bold) +
  `</g>`;

// ── Fedora, légèrement incliné, posé sur la pointe du A ──
const fedora = (cx, ty, sc) =>
  `<g transform="translate(${cx} ${ty}) rotate(-6) scale(${sc}) translate(-400 -262)">` +
  // calotte pincée : feutre éclairé du haut à gauche, creux sur le dessus et pincements latéraux
  `<path d="M296,312 C292,240 310,186 346,176 C368,170 384,192 400,192 C416,192 432,170 454,176 C490,186 508,240 504,312 Z" fill="url(#felt)" stroke="url(#hatGold)" stroke-width="5" stroke-linejoin="round"/>` +
  `<path d="M352,196 C372,192 386,206 400,206 C414,206 428,192 448,196 C430,212 414,218 400,218 C386,218 370,212 352,196 Z" fill="#000" opacity=".35"/>` +
  `<path d="M400,206 C394,236 394,268 400,300" fill="none" stroke="#000" stroke-width="5" opacity=".35" stroke-linecap="round"/>` +
  `<path d="M402,208 C398,238 398,268 403,298" fill="none" stroke="#e8c873" stroke-width="1.6" opacity=".3"/>` +
  `<path d="M330,230 C322,250 324,266 334,276" fill="none" stroke="#000" stroke-width="7" opacity=".3" stroke-linecap="round"/>` +
  `<path d="M470,230 C478,250 476,266 466,276" fill="none" stroke="#000" stroke-width="7" opacity=".45" stroke-linecap="round"/>` +
  `<path d="M316,296 C310,252 322,218 348,206" fill="none" stroke="#fff" stroke-width="4" opacity=".16" stroke-linecap="round"/>` +
  // ruban orange
  `<path d="M294,276 C340,286 460,286 506,276 L508,308 C460,318 340,318 292,308 Z" fill="url(#ribbon)" stroke="${HAT_INK}" stroke-width="3"/>` +
  `<path d="M296,281 C340,291 460,291 504,281" fill="none" stroke="#ffd29a" stroke-width="2" opacity=".75"/>` +
  // bord relevé : dessus éclairé, épaisseur sombre devant, ombre de la calotte
  `<path d="M222,320 C250,292 318,302 400,302 C482,302 550,292 578,320 C552,350 482,342 400,342 C318,342 248,350 222,320 Z" fill="url(#brim)" stroke="url(#hatGold)" stroke-width="5" stroke-linejoin="round"/>` +
  `<path d="M238,326 C270,342 330,340 400,340 C470,340 530,342 562,326 C536,346 476,344 400,344 C324,344 264,346 238,326 Z" fill="#000" opacity=".55"/>` +
  `<ellipse cx="404" cy="312" rx="112" ry="7" fill="#000" opacity=".4"/>` +
  `<path d="M246,320 C280,310 330,314 400,314" fill="none" stroke="#fff" stroke-width="2.5" opacity=".14" stroke-linecap="round"/>` +
  `</g>`;

// Chapeau + monogramme + filet, regroupés puis recentrés sur le centre du cercle (CENTRE_*, mesuré au rendu).
const CENTRE_S = [-12.2, -28.4], CENTRE_F = [-15.3, 11.9];
s += `<g id="centre" transform="translate(${CENTRE_S[0]} ${CENTRE_S[1]})">`;
s += monogram(C, 572, 0.8) + fedora(C, 309, 0.8);

// ── Filet doré sous le monogramme ──
s += `<path d="M262,622 H384 M416,622 H538" stroke="url(#silver)" stroke-width="3" stroke-linecap="round"/>`.replace('url(#silver)', '#a1abb5') +
  `<path d="M${C},612 L${C + 10},622 L${C},632 L${C - 10},622 Z" fill="url(#silverV)"/>`;

s += `</g>`;

// ── Reflet général : la lumière vient du haut à gauche ──
s += `<circle cx="${C}" cy="${C}" r="396" fill="url(#sheen)" pointer-events="none"/>`;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800">${s}</svg>\n`;
writeFileSync(new URL('../assets/img/logo.svg', import.meta.url), svg);
console.log('assets/img/logo.svg', svg.length, 'octets');

// ── Favicon : anneau d'or, monogramme épaissi et fedora, sans nuages ni pierres ──
{
  let fv = DEFS;
  fv += `<circle cx="${C}" cy="${C}" r="400" fill="url(#silver)"/>`;
  fv += ring(397, 'url(#lit)', 5);
  fv += `<circle cx="${C}" cy="${C}" r="352" fill="${INK}"/>`;
  fv += `<circle cx="${C}" cy="${C}" r="346" fill="url(#disc)"/>`;
  fv += `<circle cx="${C}" cy="${C}" r="346" fill="url(#mirror)"/>`;
  fv += `<g id="centre" transform="translate(${CENTRE_F[0]} ${CENTRE_F[1]})">` + monogram(C, 600, 1.0, 14) + fedora(C, 270, 1.15) + `</g>`;
  fv += `<circle cx="${C}" cy="${C}" r="400" fill="url(#sheen)"/>`;
  const out = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800">${fv}</svg>\n`;
  writeFileSync(new URL('../assets/img/favicon.svg', import.meta.url), out);
  console.log('assets/img/favicon.svg', out.length, 'octets');
}
