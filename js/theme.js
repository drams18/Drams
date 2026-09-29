/* ══════════════════════════════════════════════════════
   THEME.JS — La ville de jour ou de nuit, selon l'heure locale
   Chargé de façon BLOQUANTE dans le <head> (≈ 1 Ko) : le thème est
   posé avant le premier affichage, sans flash.

     07 h → 20 h  : data-theme="day"   (ville de jour, fond clair)
     sinon        : data-theme="night" (ville de nuit, fond sombre)

   Un interrupteur ([data-theme-toggle]) permet de choisir l'autre
   ambiance ; ce choix n'est retenu que pour la session en cours
   (le lendemain, l'heure reprend la main).
   ══════════════════════════════════════════════════════ */
(function (global) {
  'use strict';

  var KEY = 'drame.portfolio.theme';
  var DAY_START = 7, DAY_END = 20;
  var root = global.document.documentElement;

  function byHour() {
    var h = new Date().getHours();
    return h >= DAY_START && h < DAY_END ? 'day' : 'night';
  }

  function override() {
    try { return global.sessionStorage.getItem(KEY); } catch (e) { return null; }
  }

  function apply(theme) {
    root.setAttribute('data-theme', theme);
    var meta = global.document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'day' ? '#f4f6fb' : '#0e1630');
    var btns = global.document.querySelectorAll('[data-theme-toggle]');
    for (var i = 0; i < btns.length; i++) {
      btns[i].setAttribute('aria-pressed', theme === 'night' ? 'true' : 'false');
      btns[i].setAttribute('aria-label', theme === 'day' ? 'Passer à la ville de nuit' : 'Passer à la ville de jour');
      btns[i].setAttribute('title', theme === 'day' ? 'Ville de jour (selon votre heure) — passer à la nuit' : 'Ville de nuit — passer au jour');
    }
  }

  // ?theme=day|night force l'ambiance (captures d'écran, lien partagé),
  // sans être mémorisé.
  var q = null;
  try { q = new URLSearchParams(global.location.search).get('theme'); } catch (e) { /* noop */ }
  var o = q === 'day' || q === 'night' ? q : override();
  apply(o === 'day' || o === 'night' ? o : byHour());

  function toggle() {
    var next = root.getAttribute('data-theme') === 'day' ? 'night' : 'day';
    try {
      if (next === byHour()) global.sessionStorage.removeItem(KEY);   // retour au rythme de l'heure
      else global.sessionStorage.setItem(KEY, next);
    } catch (e) { /* noop */ }
    apply(next);
  }

  global.document.addEventListener('DOMContentLoaded', function () {
    apply(root.getAttribute('data-theme'));          // synchronise les boutons
    var btns = global.document.querySelectorAll('[data-theme-toggle]');
    for (var i = 0; i < btns.length; i++) btns[i].addEventListener('click', toggle);
  });

  global.PortfolioTheme = { toggle: toggle, byHour: byHour };
})(window);
