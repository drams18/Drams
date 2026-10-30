/* ══════════════════════════════════════════════════════
   THEME.JS : Réglages posés avant le premier affichage.
   Chargé de façon BLOQUANTE dans le <head> (quelques octets) :
     .js  contenu réservé à JavaScript (.js-only)
     .fx  effets d'entrée (css/fx.css), sauf si le visiteur demande
          moins de mouvement
   Le site n'a qu'un thème, sombre : le thème clair a été retiré le
   30/10/2026.
   ══════════════════════════════════════════════════════ */
(function (global) {
  'use strict';

  var root = global.document.documentElement;
  root.classList.add('js');
  try { if (!global.matchMedia('(prefers-reduced-motion: reduce)').matches) root.classList.add('fx'); } catch (e) { /* noop */ }
  // Ancien choix de thème (session) : plus utilisé.
  try { global.sessionStorage.removeItem('drame.portfolio.theme'); } catch (e) { /* noop */ }
})(window);
