/* ══════════════════════════════════════════════════════
   VITE.CONFIG.JS : build multi-pages vers dist/ (Cloudflare Pages)

     npm run dev      serveur local avec rechargement à chaud
     npm run build    génère le HTML du site (scripts/build-site.mjs) puis dist/

   Les pages restent en HTML / CSS / JS vanilla. Vite ne regroupe que les
   modules (type="module", ex. src/aventure/main.js) et les
   feuilles de style liées ; les scripts classiques (js/*.js, chargés sans
   type="module") et les médias sont copiés tels quels dans dist/.
   ══════════════════════════════════════════════════════ */
import { defineConfig } from 'vite';
import { cpSync, existsSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';

// Pages du site : liste écrite par scripts/build-site.mjs (lancé avant le
// build), plus les deux pages du mode aventure.
const SITE = existsSync('scripts/pages.json') ? JSON.parse(readFileSync('scripts/pages.json', 'utf8')) : [];
const PAGES = [...SITE.map(p => p.file.replace(/\.html$/, '')), 'aventure', 'construire-projet'];

// Copiés tels quels : scripts non-modules, médias, config Cloudflare.
// css/ aussi (consent.js, captures).
const STATIC = ['js', 'css', 'assets', 'sounds',
  '_headers', '_redirects', 'robots.txt', 'sitemap.xml'];

const PRIVATE = /(^|[\\/])assets[\\/](?!CV\.pdf$)[^\\/]+\.pdf$/;

function copyStatic() {
  let outDir;
  return {
    name: 'copy-static',
    apply: 'build',
    configResolved(c) { outDir = c.build.outDir; },
    closeBundle() {
      for (const p of STATIC) {
        // assets/img/_raw : captures brutes, converties par npm run images.
        // assets/*.pdf : seul le CV est public (jamais un document administratif).
        if (existsSync(p)) cpSync(p, resolve(outDir, p), { recursive: true, filter: (f) => !/[\\/]_raw([\\/]|$)/.test(f) && !PRIVATE.test(f) });
      }
    },
  };
}

// Les scripts classiques (js/*.js) ne sont pas renommés par Vite : sans
// version dans l'URL, le cache (navigateur, Cloudflare) sert l'ancien fichier
// plusieurs heures après une mise en ligne, à côté d'un HTML déjà à jour.
// Chaque référence reçoit donc ?v=<empreinte du contenu>.
function versionStatic() {
  const stamp = (file) => createHash('md5').update(readFileSync(file)).digest('hex').slice(0, 8);
  return {
    name: 'version-static',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler: (html) => html.replace(/(src=")((?:\.\.\/|\/)*)(js\/[^"?#]+\.js)(")/g, (m, a, prefix, path, z) => {
        const file = resolve(import.meta.dirname, path);
        return existsSync(file) ? `${a}${prefix}${path}?v=${stamp(file)}${z}` : m;
      }),
    },
  };
}

export default defineConfig({
  publicDir: false,
  build: {
    outDir: 'dist',
    assetsDir: '_vite',          // « assets/ » est déjà le dossier des médias du site
    rollupOptions: {
      input: Object.fromEntries(PAGES.map(p => [p, resolve(import.meta.dirname, `${p}.html`)])),
    },
  },
  plugins: [copyStatic(), versionStatic()],
});
