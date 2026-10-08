/* ══════════════════════════════════════════════════════
   CV.MJS : Exporte cv/cv.html en PDF A4 (une page).

     npm run cv

   Prérequis : Google Chrome (ou variable d'environnement CHROME=/chemin/chrome)
   Produit cv/CV-Arphan-Drame.pdf. Pour le publier sur le site, le copier
   ensuite vers assets/CV.pdf.
   ══════════════════════════════════════════════════════ */

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const out = join(ROOT, 'cv/CV-Arphan-Drame.pdf');

await promisify(execFile)(CHROME, ['--headless=new', '--disable-gpu', '--no-pdf-header-footer',
  '--virtual-time-budget=3000', `--print-to-pdf=${out}`, pathToFileURL(join(ROOT, 'cv/cv.html')).href]);
console.log('→', out);
