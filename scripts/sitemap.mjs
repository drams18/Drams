/* ══════════════════════════════════════════════════════
   SITEMAP.MJS : régénère sitemap.xml avec une date <lastmod> par URL

     npm run sitemap     (lancé aussi par npm run build)

   La date d'une URL est celle du dernier commit Git qui a touché ses
   fichiers sources ; aujourd'hui si l'un d'eux est modifié sans être
   commité. Aucune date n'est inventée : sans historique Git complet
   (clone superficiel d'un hébergeur, archive sans .git), le sitemap.xml
   déjà commité est laissé tel quel.

   Une nouvelle page du site : rien à faire (scripts/pages.json). Une page
   hors du site (mode aventure) : l'ajouter ici ET dans vite.config.js.
   ══════════════════════════════════════════════════════ */

import { writeFileSync, existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE_URL = 'https://arphandrame.fr/';

// URL (sans le domaine) → fichiers dont dépend son contenu. Les pages du
// site viennent de scripts/pages.json (écrit par scripts/build-site.mjs) :
// leur contenu dépend de la page et des données.
const DATA = ['js/museum.js', 'js/tarifs-data.js', 'scripts/build-site.mjs'];
const SITE = JSON.parse(readFileSync(join(ROOT, 'scripts/pages.json'), 'utf8'));
const URLS = [
  ...SITE.filter(p => p.index).map(p => [p.path, [p.file, ...DATA]]),
  ['aventure',               ['aventure.html', 'js/museum.js', 'src/aventure']],
  ['construire-projet',      ['construire-projet.html', 'src/construire']],
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
