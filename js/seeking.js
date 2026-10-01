/* ══════════════════════════════════════════════════════
   SEEKING.JS : « dès <mois courant> » toujours à jour
   Le HTML généré porte le mois du dernier build ; ici on le
   remplace par le mois du jour dans chaque [data-seeking].
   Même formule que seekingNow() dans js/museum.js.
   ══════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var MONTHS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
  var d = new Date();
  var when = 'dès ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear();
  document.querySelectorAll('[data-seeking]').forEach(function (el) {
    var next = el.textContent.replace(/dès [^()]*?\d{4}/i, when);
    if (next !== el.textContent) el.textContent = next;
  });
})();
