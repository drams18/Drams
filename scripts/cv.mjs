/* ══════════════════════════════════════════════════════
   CV.MJS : Exporte cv/cv.html en PDF A4 (une page).

     npm run cv

   Prérequis : Google Chrome (ou variable d'environnement CHROME=/chemin/chrome)
   Produit cv/CV-Arphan-Drame.pdf. Pour le publier sur le site, le copier
   ensuite vers assets/CV.pdf.
   ══════════════════════════════════════════════════════ */

import { execFile } from 'node:child_process';
import { readFile, appendFile } from 'node:fs/promises';
import { promisify } from 'node:util';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const out = join(ROOT, 'cv/CV-Arphan-Drame.pdf');

await promisify(execFile)(CHROME, ['--headless=new', '--disable-gpu', '--no-pdf-header-footer',
  '--virtual-time-budget=3000', `--print-to-pdf=${out}`, pathToFileURL(join(ROOT, 'cv/cv.html')).href]);
// Chrome n'écrit pas l'auteur dans le PDF : on l'ajoute par mise à jour
// incrémentale (nouvel objet Info + table xref en fin de fichier).
const author = (await readFile(join(ROOT, 'cv/cv.html'), 'utf8')).match(/<meta name="author" content="([^"]+)"/)[1];
const pdf = (await readFile(out)).toString('latin1');
const trailer = pdf.slice(pdf.lastIndexOf('trailer'));
const [, size] = trailer.match(/\/Size (\d+)/);
const [, root] = trailer.match(/\/Root (\d+ \d+ R)/);
const [, info] = trailer.match(/\/Info (\d+) 0 R/);
const [, prev] = trailer.match(/startxref\s+(\d+)/);
const [, dict] = pdf.match(new RegExp(`(?:^|[\\r\\n])${info} 0 obj\\s*<<([\\s\\S]*?)>>\\s*endobj`));
const obj = `${info} 0 obj\n<<${dict}/Author (${author})>>\nendobj\n`;
const pos = String(pdf.length + 1).padStart(10, '0');
await appendFile(out, `\n${obj}xref\n${info} 1\n${pos} 00000 n \ntrailer\n<</Size ${size}\n/Root ${root}\n/Info ${info} 0 R\n/Prev ${prev}>>\nstartxref\n${pdf.length + 1 + obj.length}\n%%EOF\n`, 'latin1');
console.log('→', out);
