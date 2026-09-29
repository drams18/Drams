/* ══════════════════════════════════════════════════════
   THEME.JS — Thème clair ou sombre du site classique, selon l'heure locale
   Chargé de façon BLOQUANTE dans le <head> (≈ 1 Ko) : le thème est
   posé avant le premier affichage, sans flash.

     07 h → 20 h  : data-theme="day"   (clair)
     sinon        : data-theme="night" (sombre)

   Un interrupteur ([data-theme-toggle]) permet de choisir l'autre
   thème ; ce choix n'est retenu que pour la session en cours
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
    if (meta) meta.setAttribute('content', theme === 'day' ? '#ffffff' : '#0a0a0d');
    var btns = global.document.querySelectorAll('[data-theme-toggle]');
    for (var i = 0; i < btns.length; i++) {
      btns[i].setAttribute('aria-pressed', theme === 'night' ? 'true' : 'false');
      btns[i].setAttribute('aria-label', theme === 'day' ? 'Passer au thème sombre' : 'Passer au thème clair');
      btns[i].setAttribute('title', theme === 'day' ? 'Thème clair (selon votre heure) — passer au sombre' : 'Thème sombre — passer au clair');
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
