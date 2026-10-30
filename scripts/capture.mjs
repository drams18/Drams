/* ══════════════════════════════════════════════════════
   CAPTURE.MJS : Génère l'image de partage (Open Graph) à partir de
   scripts/og.html.

     npm run capture

   Prérequis (outils locaux, pas des dépendances du site) :
     • Google Chrome   (ou variable d'environnement CHROME=/chemin/chrome)
     • ffmpeg

   Produit assets/img/og.jpg (1200×630). Lancer `npm run build` avant
   (le serveur sert dist/ en priorité, le reste depuis la racine).
   ══════════════════════════════════════════════════════ */

import { createServer } from 'node:http';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname, join, extname, normalize } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const OUT = join(ROOT, 'assets/img');
if (!existsSync(DIST)) { console.error('dist/ introuvable : lancez d\'abord npm run build.'); process.exit(1); }
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png',
  '.webp': 'image/webp', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.mp3': 'audio/mpeg', '.pdf': 'application/pdf', '.svg': 'image/svg+xml' };

// Mini serveur statique : les pages depuis dist/, le reste (scripts/og.html,
// node_modules/ pour sa police) depuis la racine du projet.
const server = createServer(async (req, res) => {
  const path = normalize(decodeURIComponent(req.url.split('?')[0])).replace(/^(\.\.[/\\])+/, '');
  const rel = path.endsWith('/') ? path + 'index.html' : path;
  const file = existsSync(join(DIST, rel)) ? join(DIST, rel) : join(ROOT, rel);
  try {
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404); res.end();
  }
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}/`;
const tmp = await mkdtemp(join(tmpdir(), 'capture-'));
// Appels ASYNCHRONES : le serveur ci-dessus tourne dans ce même processus.
const run = promisify(execFile);

function shot(url, png, width, height, wait = 3000) {
  return run(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--mute-audio',
    `--window-size=${width},${height}`, `--virtual-time-budget=${wait}`, `--screenshot=${png}`, base + url],
    { timeout: 60000 });
}

try {
  const og = join(tmp, 'og.png');
  await shot('scripts/og.html', og, 1200, 630, 2500);
  await run('ffmpeg', ['-loglevel', 'error', '-y', '-i', og, '-q:v', '3', join(OUT, 'og.jpg')]);
  console.log('✓ og.jpg');
} finally {
  server.close();
  await rm(tmp, { recursive: true, force: true });
}
