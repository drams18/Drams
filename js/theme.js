/* ══════════════════════════════════════════════════════
   THEME.JS : Réglages posés avant le premier affichage.
   Chargé de façon BLOQUANTE dans le <head> (quelques octets) :
     .js     contenu réservé à JavaScript (.js-only)
     .fx     effets d'entrée (css/fx.css), sauf si le visiteur demande
             moins de mouvement
     .intro  écran d'arrivée (première page de la session, pages
             marquées data-intro) : couvre la page dès le premier
             affichage, joué par js/fx.js
     [data-curtain]  rideau entre deux pages : js/fx.js le pose en
             partant, il se lève ici en CSS pur (css/fx.css)
     .hold   les entrées de la page attendent que le rideau ou l'écran
             d'arrivée se lève
   Chaque état est retiré ici par une minuterie de secours : même si
   js/fx.js ne se charge pas, la page finit visible.
   Le site n'a qu'un thème, clair (Cloud Dancer & Cobalt, 16/11/2026),
   défini dans css/site.css.
   ══════════════════════════════════════════════════════ */
(function (global) {
  'use strict';

  var root = global.document.documentElement;
  root.classList.add('js');
  try { if (!global.matchMedia('(prefers-reduced-motion: reduce)').matches) root.classList.add('fx'); } catch (e) { /* noop */ }
  // Ancien choix de thème (session) : plus utilisé.
  try { global.sessionStorage.removeItem('drame.portfolio.theme'); } catch (e) { /* noop */ }

  var fx = root.classList.contains('fx');
  var later = function (ms, fn) { global.setTimeout(fn, ms); };

  // Rideau : nom de la page d'arrivée, laissé par la page précédente.
  try {
    var label = global.sessionStorage.getItem('drame.curtain');
    if (label) {
      global.sessionStorage.removeItem('drame.curtain');
      if (fx) {
        root.setAttribute('data-curtain', label);
        root.classList.add('hold');
        later(160, function () { root.classList.remove('hold'); });
        later(1000, function () { root.removeAttribute('data-curtain'); });
      }
    }
  } catch (e) { /* noop */ }

  // Écran d'arrivée : une fois par session, sans ancre dans l'adresse.
  try {
    if (fx && root.hasAttribute('data-intro') && !root.hasAttribute('data-curtain') && !global.location.hash &&
        !global.sessionStorage.getItem('drame.intro')) {
      global.sessionStorage.setItem('drame.intro', '1');
      root.classList.add('intro', 'hold');
      later(4200, function () { root.classList.remove('intro', 'hold'); });
    }
  } catch (e) { /* noop */ }
})(window);
