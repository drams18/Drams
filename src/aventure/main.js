/* ══════════════════════════════════════════════════════
   MAIN.JS : point d'entrée du mode aventure (/aventure)

   Scripts classiques chargés avant ce module (partagés avec le reste du
   site) : js/deeplink.js, js/contact-form.js, js/museum.js, js/contact.js.

   Liens profonds :
     #aventure/ville | hero | club   l'univers, directement
     #profil · #parcours[/slug] · #projets[/slug] · #contact · #competences
     #portail                        devant « Construisez votre projet »
   ══════════════════════════════════════════════════════ */

import './styles/aventure.css';
import { Game } from './core/Game.js';
import { getPortfolio } from './portfolio/data.js';

const UNIVERSES = ['ville', 'hero', 'club'];

function parseRoute(hash) {
  const h = String(hash || '').replace(/^#/, '');
  const [head, slug] = h.split('/');
  if (head === 'aventure') return UNIVERSES.includes(slug) ? { kind: 'universe', universe: slug } : null;
  if (head === 'competences') return { kind: 'view', view: 'skills' };
  return window.Deeplink ? window.Deeplink.parse(hash) : null;
}

function start() {
  if (window.Deeplink) window.Deeplink.setMode('aventure');
  const root = document.getElementById('adv');
  const game = new Game({
    root,
    canvas: document.getElementById('adv-canvas'),
    ui: document.getElementById('adv-ui'),
    portfolio: getPortfolio(),
  });
  // ?capture : miniature de l'écran de sélection du site (scripts/capture.mjs).
  game.boot(parseRoute(location.hash), { capture: /[?&]capture\b/.test(location.search) });
  window.addEventListener('hashchange', () => game.navigate(parseRoute(location.hash)));
  window.__aventure = game;      // diagnostic et tests
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
else start();
