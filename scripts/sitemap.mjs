/* ══════════════════════════════════════════════════════
   SITEMAP.MJS : régénère sitemap.xml avec une date <lastmod> par URL

     npm run sitemap     (lancé aussi par npm run build)

   La date d'une URL est celle du dernier commit Git qui a touché ses
   fichiers sources ; aujourd'hui si l'un d'eux est modifié sans être
   commité. Aucune date n'est inventée : sans historique Git complet
   (clone superficiel d'un hébergeur, archive sans .git), le sitemap.xml
   déjà commité est laissé tel quel.

   Une nouvelle page : l'ajouter ici ET dans vite.config.js (PAGES).
   ══════════════════════════════════════════════════════ */

import { writeFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE_URL = 'https://arphandrame.fr/';

// URL (sans le domaine) → fichiers dont dépend son contenu.
const URLS = [
  ['',                       ['index.html']],
  ['classique',              ['classique.html']],
  ['classique/projets',      ['classique/projets.html']],
  ['classique/parcours',     ['classique/parcours.html']],
  ['classique/competences',  ['classique/competences.html']],
  ['classique/contact',      ['classique/contact.html']],
  ['aventure',               ['aventure.html', 'js/museum.js']],
  ['tarifs',                 ['tarifs.html']],
  ['devis',                  ['devis.html', 'js/devis.js']],
  ['construire-projet',      ['construire-projet.html', 'src/construire']],
  ['assets/CV.pdf',          ['assets/CV.pdf']],
];

const git = (...args) => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();

let reliable = false;
try { reliable = git('rev-parse', '--is-shallow-repository') === 'false'; } catch { /* pas de dépôt Git */ }
if (!reliable) {
  console.log('sitemap.xml conservé tel quel (historique Git indisponible ou incomplet).');
  process.exit(0);
}

const d = new Date();
const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

function lastmod(files) {
  for (const f of files) if (!existsSync(join(ROOT, f))) throw new Error(`sitemap : fichier introuvable, ${f}`);
  if (git('status', '--porcelain', '--', ...files)) return today;
  return git('log', '-1', '--format=%cs', '--', ...files) || null;
}

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${URLS.map(([path, files]) => {
  const date = lastmod(files);
  return `  <url><loc>${SITE_URL}${path}</loc>${date ? `<lastmod>${date}</lastmod>` : ''}</url>`;
}).join('\n')}
</urlset>
`;
writeFileSync(join(ROOT, 'sitemap.xml'), xml);
console.log(`sitemap.xml régénéré (${URLS.length} URLs).`);
