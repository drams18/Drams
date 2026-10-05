/* ══════════════════════════════════════════════════════
   MAIN.JS : point d'entrée de « Construisez votre projet » (/construire-projet)

   Le mini-jeu tourne sur le moteur du mode aventure, dans l'univers choisi
   par le visiteur (sauvegarde `drame.aventure.save`), VILLE par défaut.
   #ville, #hero ou #club force un univers.

   Scripts classiques chargés avant ce module : js/deeplink.js (lien de
   retour vers le dernier mode utilisé), js/contact-form.js (EmailJS).
   ══════════════════════════════════════════════════════ */

import '../aventure/styles/aventure.css';
import './construire.css';
import { BuildGame } from './BuildGame.js';

function start() {
  const game = new BuildGame({
    root: document.getElementById('adv'),
    canvas: document.getElementById('adv-canvas'),
    ui: document.getElementById('adv-ui'),
    universe: location.hash.replace(/^#/, ''),
  });
  window.__construire = game;      // diagnostic et tests
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
else start();
