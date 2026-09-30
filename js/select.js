/* ══════════════════════════════════════════════════════
   SELECT.JS : Écran de sélection du mode (index.html)
     • dernier mode utilisé : présélectionné + badge (jamais de redirection)
     • clavier : ← / → pour choisir, Entrée pour valider
     • préchargement du mode visé (survol / focus / présélection au repos)
     • transition : la capture choisie « devient » la page (View Transitions)
   ══════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var doc = document;
  var D = window.Deeplink;
  var cards = Array.prototype.slice.call(doc.querySelectorAll('.mode'));
  if (!cards.length) return;

  var PREFETCH = {
    classique: ['classique.html', 'css/classic.css', 'js/classic.js', 'js/contact-form.js'],
    aventure: ['aventure.html', 'style.css', 'js/audio.js', 'js/museum.js', 'js/controls.js',
      'js/mobileControls.js', 'js/interactions.js', 'js/player.js', 'js/map.js', 'js/game.js', 'js/contact-form.js'],
  };
  var done = {};
  function prefetch(mode) {
    if (done[mode] || !PREFETCH[mode]) return;
    done[mode] = true;
    var conn = navigator.connection;
    if (conn && (conn.saveData || /2g/.test(conn.effectiveType || ''))) return;
    PREFETCH[mode].forEach(function (href) {
      var l = doc.createElement('link');
      l.rel = 'prefetch';
      l.href = href;
      doc.head.appendChild(l);
    });
  }

  // Dernier mode utilisé → présélection (Entrée le valide directement).
  var last = D ? D.getMode() : null;
  var current = null;
  cards.forEach(function (c) {
    if (c.getAttribute('data-mode') === last) {
      current = c;
      c.classList.add('is-current');
      var badge = c.querySelector('.mode__last');
      if (badge) badge.hidden = false;
    }
  });

  function select(c) {
    cards.forEach(function (x) { x.classList.toggle('is-current', x === c); });
    current = c;
    prefetch(c.getAttribute('data-mode'));
  }

  cards.forEach(function (c, i) {
    var mode = c.getAttribute('data-mode');
    c.addEventListener('pointerenter', function () { prefetch(mode); });
    c.addEventListener('touchstart', function () { prefetch(mode); }, { passive: true });
    c.addEventListener('focus', function () { select(c); });
    c.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); cards[(i + 1) % cards.length].focus(); }
      if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   { e.preventDefault(); cards[(i - 1 + cards.length) % cards.length].focus(); }
    });
    // Seule la capture choisie porte le nom de transition « stage » :
    // la page d'arrivée (même nom) s'agrandit depuis cette capture.
    c.addEventListener('click', function () {
      var shot = c.querySelector('[data-vt]');
      if (shot) shot.style.viewTransitionName = 'stage';
    });
  });

  // Flèches depuis la page (sans focus sur une carte) : on entre dans les cartes.
  doc.addEventListener('keydown', function (e) {
    var t = doc.activeElement;
    var onCard = t && t.classList && t.classList.contains('mode');
    var typing = t && /^(INPUT|TEXTAREA|SELECT|BUTTON|A)$/.test(t.tagName) && !onCard;
    if (onCard || typing || doc.querySelector('.cw-overlay')) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      (current || cards[e.key === 'ArrowRight' ? 0 : cards.length - 1]).focus();
    } else if (e.key === 'Enter' && current) {
      e.preventDefault();
      current.click();
    }
  });

  // Retour arrière (bfcache) : on retire le nom de transition posé au clic.
  window.addEventListener('pageshow', function () {
    doc.querySelectorAll('[data-vt]').forEach(function (s) { s.style.viewTransitionName = ''; });
  });

  // Au repos, précharge le mode présélectionné (le plus probable).
  var idle = window.requestIdleCallback || function (fn) { return setTimeout(fn, 1500); };
  if (last && PREFETCH[last]) idle(function () { prefetch(last); });
})();
