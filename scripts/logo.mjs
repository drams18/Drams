/* ══════════════════════════════════════════════════════
   LOGO.MJS : génère le logo du site (npm run logo)

     assets/img/logo.svg            logo complet (barre du haut, grands formats)
     assets/img/favicon.svg         onglet du navigateur : mêmes anneaux, sans les nuages gravés
     assets/img/logo-1024.png       logo complet en haute définition, fond transparent
     assets/img/favicon.png         96 px, pour les navigateurs sans favicon SVG
     assets/img/apple-touch-icon.png 180 px sur fond #070c14 (iOS n'aime pas la transparence)

   Les PNG sont rendus par Google Chrome (variable CHROME pour un autre chemin) puis
   réduits par sips (macOS) ; sans Chrome, seuls les SVG sont régénérés.
   ══════════════════════════════════════════════════════ */
// Trois anneaux du sceau d'origine (bande d'argent aux nuages gravés, anneau intérieur aux sept pierres),
// évidés, centres aux sommets d'un triangle équilatéral invisible : les trois paires sont à la même
// distance. Entrelacs borroméen : chaque anneau passe sur un voisin et sous l'autre.
// Nuages : illustration de l'auteur du site, contours dans scripts/logo-nuages.json.
import { readFileSync, writeFileSync, mkdtempSync, rmSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const f = (n) => +n.toFixed(1);
const C = 400; // repère d'un anneau : celui du sceau d'origine (800 × 800)
const INK = '#0c1218', ENGRAVE = '#141f22';
const ATTR = [ // Ciel d'abord (pierre plus grosse), puis dans l'ordre
  ['Ciel', '#ff8a1c'], ['Tempête', '#e5322d'], ['Pluie', '#2f86e8'], ['Soleil', '#ffd23a'],
  ['Foudre', '#3cc457'], ['Nuage', '#9b4fe0'], ['Brume', '#5246c9'],
];
const RO = 397, RI = 287; // bords extérieur et intérieur de l'anneau évidé
const pt = (r, deg) => [C + Math.cos((deg * Math.PI) / 180) * r, C + Math.sin((deg * Math.PI) / 180) * r];
const ring = (r, stroke, w) => `<circle cx="${C}" cy="${C}" r="${r}" fill="none" stroke="${stroke}" stroke-width="${w}"/>`;

const GRADIENTS = `
<linearGradient id="silver" x1="0" y1="0" x2="1" y2="1">
  <stop offset="0" stop-color="#f4fcf5"/><stop offset=".3" stop-color="#c8cfdc"/>
  <stop offset=".62" stop-color="#66798c"/><stop offset=".85" stop-color="#e1ebf3"/><stop offset="1" stop-color="#525d60"/>
</linearGradient>
<linearGradient id="band" x1="0" y1="0" x2="1" y2="1">
  <stop offset="0" stop-color="#e1ebf3"/><stop offset=".45" stop-color="#a1abb5"/><stop offset="1" stop-color="#525d60"/>
</linearGradient>
<linearGradient id="lit" x1="0" y1="0" x2="1" y2="1">
  <stop offset="0" stop-color="#ffffff"/><stop offset=".5" stop-color="#a1abb5" stop-opacity=".2"/><stop offset="1" stop-color="#141f22"/>
</linearGradient>
<linearGradient id="shade" x1="0" y1="0" x2="1" y2="1">
  <stop offset="0" stop-color="#141f22"/><stop offset=".5" stop-color="#a1abb5" stop-opacity=".2"/><stop offset="1" stop-color="#ffffff"/>
</linearGradient>
<mask id="annulus" maskUnits="userSpaceOnUse" x="0" y="0" width="800" height="800">
  <circle cx="${C}" cy="${C}" r="${RO + 2}" fill="#fff"/><circle cx="${C}" cy="${C}" r="${RI}" fill="#000"/>
</mask>`;

// Nuages calqués, reportés en polaire sur la bande (r 308 à 378). Tracé une fois, réutilisé (<use>).
function cloudsPath() {
  const { CX, CY, loops } = JSON.parse(readFileSync(new URL('./logo-nuages.json', import.meta.url)));
  const map = ([x, y]) => {
    const dx = x - CX, dy = y - CY, r = Math.hypot(dx, dy), a = Math.atan2(dy, dx);
    const r2 = 308 + ((r - 300) * 70) / 69;
    return `${f(C + Math.cos(a) * r2)},${f(C + Math.sin(a) * r2)}`;
  };
  return loops.map((l) => 'M' + l.map(map).join(' L') + 'Z').join(' ');
}

// ── Un anneau, sans ses pierres (la lumière vient toujours du haut à gauche) ──
function ringBody(clouds) {
  let s = `<circle cx="${C}" cy="${C}" r="396" fill="url(#silver)"/>`;
  s += ring(394.5, 'url(#lit)', 3);
  s += ring(383, INK, 3);        // gorge
  s += ring(380.5, 'url(#shade)', 2);
  s += `<circle cx="${C}" cy="${C}" r="381.5" fill="url(#band)"/>`;
  if (clouds) { // gravure : reflet clair décalé vers le bas à droite, puis le creux sombre
    s += `<use href="#nuages" fill="#ffffff" opacity=".6" transform="translate(1.2 1.2)"/>`;
    s += `<use href="#nuages" fill="${ENGRAVE}"/>`;
  }
  s += ring(307, INK, 4);        // gorge intérieure
  s += `<circle cx="${C}" cy="${C}" r="305" fill="url(#silver)"/>`;
  s += ring(303.5, 'url(#lit)', 2.5);
  s += ring(289.5, 'url(#shade)', 2.5);
  s += ring(RO - 1, INK, 4) + ring(RI + 1, INK, 4); // liserés encre : détachent les croisements
  return `<g id="ring" mask="url(#annulus)">${s}</g>`;
}

// Gemme taillée : table octogonale, facettes claires vers la lumière, chaton à quatre griffes.
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
    const lightness = Math.cos(a - Math.PI * 1.25);
    const fill = lightness > 0 ? mix(col, '#ffffff', 0.04 + lightness * 0.22) : mix(col, '#000000', -lightness * 0.45);
    g += `<path d="M${f(girdle[k][0])},${f(girdle[k][1])} L${f(girdle[k2][0])},${f(girdle[k2][1])} L${f(table[k2][0])},${f(table[k2][1])} L${f(table[k][0])},${f(table[k][1])} Z" fill="${fill}"/>`;
  }
  g += `<path d="M${table.map(([u, v]) => `${f(u)},${f(v)}`).join(' L')} Z" fill="${mix(col, '#ffffff', 0.08)}" stroke="${mix(col, '#000000', 0.4)}" stroke-width=".8"/>`;
  g += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="none" stroke="${INK}" stroke-width="1.4"/>`;
  g += `<path d="M${f(x - r * 0.42)},${f(y - r * 0.1)} L${f(x - r * 0.12)},${f(y - r * 0.42)}" stroke="#fff" stroke-width="${f(r * 0.16)}" stroke-linecap="round" opacity=".85"/>`;
  for (const a of [45, 135, 225, 315]) {
    const t = (a * Math.PI) / 180, gx = x + Math.cos(t) * (r + 1), gy = y + Math.sin(t) * (r + 1);
    g += `<circle cx="${f(gx)}" cy="${f(gy)}" r="${f(Math.max(2.2, r * 0.2))}" fill="url(#silver)" stroke="${INK}" stroke-width="1.2"/>`;
  }
  return g;
}
// Les sept pierres d'un anneau ; rot fait tourner leur position, pas leur éclairage.
const gems = (rot) => ATTR.map(([, col], i) => {
  const [x, y] = pt(296.5, -90 + rot + (i * 360) / ATTR.length);
  return gem(x, y, i === 0 ? 14 : 9.5, col);
}).join('');

// ── Trois anneaux aux sommets d'un triangle équilatéral (côté DIST, identique pour les trois paires) ──
const SC = 0.5;                 // échelle d'un anneau : rayon extérieur ≈ 198
const DIST = 222;               // distance entre deux centres
const K = DIST / Math.sqrt(3);  // centre de gravité -> sommet
const W = 2 * (K + RO * SC) + 24, GX = W / 2, GY = W / 2 + K / 4; // triangle centré verticalement
const ANG = [-90, 150, 30];     // haut, bas gauche, bas droite
const CENTERS = ANG.map((a) => [GX + Math.cos((a * Math.PI) / 180) * K, GY + Math.sin((a * Math.PI) / 180) * K]);

// Croisements sur le cercle médian des bandes. Borroméen : 0 passe sur 1, 1 sur 2, 2 sur 0.
const RM = ((RO + RI) / 2) * SC;
function crossings(a, b) {
  const [x0, y0] = CENTERS[a], [x1, y1] = CENTERS[b], d = Math.hypot(x1 - x0, y1 - y0);
  const m = [(x0 + x1) / 2, (y0 + y1) / 2], h = Math.sqrt(RM * RM - (d / 2) ** 2), n = [-(y1 - y0) / d, (x1 - x0) / d];
  return [[m[0] + n[0] * h, m[1] + n[1] * h], [m[0] - n[0] * h, m[1] - n[1] * h]];
}

function trio({ clouds }) {
  // Chaque anneau est tourné (pierres seulement) pour que sa pierre du Ciel regarde hors du triangle.
  const place = (i) => `translate(${f(CENTERS[i][0])} ${f(CENTERS[i][1])}) scale(${SC}) translate(-${C} -${C})`;
  const use = (i) => `<g transform="${place(i)}"><use href="#ring"/><use href="#gems${i}"/></g>`;
  // L'anneau du dessus est redessiné dans un disque autour de chaque croisement. Un masque (et non un
  // clipPath) : il s'applique au groupe déjà composé, sans filet sombre au bord du disque.
  let masks = '', tops = '';
  [[0, 1], [1, 2], [2, 0]].forEach(([top, under], j) => crossings(top, under).forEach(([x, y], q) => {
    masks += `<mask id="x${j}${q}" maskUnits="userSpaceOnUse" x="0" y="0" width="${f(W)}" height="${f(W)}">` +
      `<circle cx="${f(x)}" cy="${f(y)}" r="${f((RO - RI) * SC * 1.25)}" fill="#fff"/></mask>`;
    tops += `<g mask="url(#x${j}${q})">${use(top)}</g>`;
  }));
  const defs = GRADIENTS + masks +
    (clouds ? `<path id="nuages" d="${cloudsPath()}" fill-rule="evenodd"/>` : '') +
    ringBody(clouds) + [0, 1, 2].map((i) => `<g id="gems${i}">${gems(ANG[i] + 90)}</g>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${f(W)} ${f(W)}"><defs>${defs}</defs>` +
    [0, 1, 2].map(use).join('') + tops + `</svg>\n`;
}

const IMG = fileURLToPath(new URL('../assets/img/', import.meta.url));
const write = (name, data) => {
  writeFileSync(join(IMG, name), data);
  console.log(`assets/img/${name}`, data.length, 'octets');
};
write('logo.svg', trio({ clouds: true }));
write('favicon.svg', trio({ clouds: false }));

// ── PNG : Chrome rend en 1024 px (le SVG sans width/height remplit la fenêtre), sips (macOS) réduit.
// Chrome impose une taille de fenêtre minimale : les petites tailles passent toujours par la réduction.
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
if (!existsSync(CHROME)) {
  console.log('Chrome introuvable : PNG non régénérés (variable CHROME pour indiquer son chemin).');
} else {
  const tmp = mkdtempSync(join(tmpdir(), 'logo-'));
  const shot = (url, out, transparent = true) =>
    execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--allow-file-access-from-files',
      '--window-size=1024,1024', ...(transparent ? ['--default-background-color=00000000'] : []),
      `--screenshot=${out}`, url], { stdio: 'ignore' });
  const png = (src, size, name) => {
    execFileSync('sips', ['-z', String(size), String(size), src, '--out', join(IMG, name)], { stdio: 'ignore' });
    console.log(`assets/img/${name}`, `${size} px`);
  };
  shot(`file://${join(IMG, 'logo.svg')}`, join(IMG, 'logo-1024.png'));
  console.log('assets/img/logo-1024.png', '1024 px');
  shot(`file://${join(IMG, 'favicon.svg')}`, join(tmp, 'favicon.png'));
  png(join(tmp, 'favicon.png'), 96, 'favicon.png');
  // Icône iOS : logo complet avec une marge, sur le bleu nuit du site.
  const page = join(tmp, 'apple.html');
  writeFileSync(page, `<!doctype html><body style="margin:0;background:#070c14;display:grid;place-items:center;height:100vh">` +
    `<img src="file://${join(IMG, 'logo.svg')}" style="width:86%;height:86%">`);
  shot(`file://${page}`, join(tmp, 'apple.png'), false);
  png(join(tmp, 'apple.png'), 180, 'apple-touch-icon.png');
  rmSync(tmp, { recursive: true, force: true });
}
