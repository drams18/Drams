/* ══════════════════════════════════════════════════════
   IMAGES.MJS : Convertit les captures brutes en webp optimisés.

     npm run images      (ou : node scripts/images.mjs [--force])

   Source : assets/img/_raw/<file>.(png|jpg|jpeg|webp), où <file> est
   déclaré dans js/museum.js (SECTIONS.projets.items[].shots).
   Sorties (lues par scripts/build-classic.mjs) :
     assets/img/projets/<file>.webp   capture de la fiche
                                      (ordinateur : 1600 px de large max,
                                       téléphone : 600 px max)
     assets/img/projets/<slug>.webp   couverture = première capture,
                                      réduite (bulle, info-bulle, liste)
     assets/img/parcours/<file>.webp  logos et photos du parcours
                                      (SECTIONS.parcours : steps[].logo,
                                       steps[].photos, milestones[].logo ;
                                       un logo SVG est copié tel quel)
   Une sortie plus récente que sa source n'est pas refaite.

   Nécessite cwebp (brew install webp). Aucune dépendance npm.
   ══════════════════════════════════════════════════════ */

import { readFileSync, existsSync, statSync, mkdirSync, copyFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const { SECTIONS } = require('../js/museum.js');
const RAW = join(ROOT, 'assets/img/_raw');
const OUT = join(ROOT, 'assets/img/projets');
const OUT_TL = join(ROOT, 'assets/img/parcours');
const FORCE = process.argv.includes('--force');

// Largeur max : fiche / couverture, selon le type de capture.
const WIDTH = { desktop: { shot: 1600, cover: 720 }, mobile: { shot: 600, cover: 360 } };

// Largeur d'une image (PNG, JPEG, WebP), lue dans l'en-tête.
function widthOf(file) {
  const b = readFileSync(file);
  if (b.readUInt32BE(0) === 0x89504e47) return b.readUInt32BE(16);                    // PNG
  if (b.toString('ascii', 0, 4) === 'RIFF') {                                          // WebP
    const kind = b.toString('ascii', 12, 16);
    if (kind === 'VP8 ') return b.readUInt16LE(26) & 0x3fff;
    if (kind === 'VP8L') return 1 + (((b[22] & 0x3f) << 8) | b[21]);
    if (kind === 'VP8X') return 1 + b.readUIntLE(24, 3);
  }
  if (b[0] === 0xff && b[1] === 0xd8) {                                                // JPEG
    for (let i = 2; i < b.length;) {
      const marker = b[i + 1], len = b.readUInt16BE(i + 2);
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) return b.readUInt16BE(i + 7);
      i += 2 + len;
    }
  }
  throw new Error(`format non reconnu : ${file}`);
}

const rawOf = (name) => ['png', 'jpg', 'jpeg', 'webp', 'svg'].map(e => join(RAW, `${name}.${e}`)).find(existsSync);
const fresh = (src, out) => !FORCE && existsSync(out) && statSync(out).mtimeMs >= statSync(src).mtimeMs;

function convert(src, out, maxW, quality) {
  if (fresh(src, out)) return false;
  const w = widthOf(src);
  const resize = w > maxW ? ['-resize', String(maxW), '0'] : [];
  execFileSync('cwebp', ['-quiet', '-mt', '-q', String(quality), '-metadata', 'none', ...resize, src, '-o', out]);
  return true;
}

mkdirSync(OUT, { recursive: true });
let done = 0, missing = 0;
for (const p of SECTIONS.projets.items) {
  const shots = p.shots || [];
  const size = WIDTH[p.device === 'mobile' ? 'mobile' : 'desktop'];
  shots.forEach((s, i) => {
    const src = rawOf(s.file);
    if (!src) { console.warn(`  ! ${p.slug} : ${s.file} introuvable dans assets/img/_raw/`); missing++; return; }
    if (convert(src, join(OUT, `${s.file}.webp`), size.shot, 80)) done++;
    if (i === 0 && convert(src, join(OUT, `${p.slug}.webp`), size.cover, 74)) done++;
  });
}
// Parcours : logos (petits, transparence conservée) et photos.
mkdirSync(OUT_TL, { recursive: true });
const { steps, milestones = [] } = SECTIONS.parcours;
const tlJobs = [
  ...[...steps, ...milestones].filter(e => e.logo).map(e => ({ file: e.logo, maxW: 480, q: 90 })),
  ...steps.flatMap(e => (e.photos || []).map(ph => ({ file: ph.file, maxW: 1400, q: 80 }))),
];
for (const job of tlJobs) {
  const src = rawOf(job.file);
  if (!src) { console.warn(`  ! parcours : ${job.file} introuvable dans assets/img/_raw/`); missing++; continue; }
  if (src.endsWith('.svg')) {
    const out = join(OUT_TL, `${job.file}.svg`);
    if (!fresh(src, out)) { copyFileSync(src, out); done++; }
  } else if (convert(src, join(OUT_TL, `${job.file}.webp`), job.maxW, job.q)) done++;
}

console.log(`images : ${done} fichier(s) généré(s)${missing ? `, ${missing} source(s) manquante(s)` : ''}.`);
if (missing) process.exitCode = 1;
