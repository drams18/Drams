/* ══════════════════════════════════════════════════════
   CLASSIC.JS — Mode classique (index.html)
   Page lisible SANS JavaScript ; ce script n'ajoute que du confort :
     • bouton « Mode aventure » contextuel (emporte la section lue)
     • préchargement du mode aventure à l'intention (survol / toucher)
     • filtres de projets, « Lire la suite », copier, formulaire
   Aucun code du jeu (canvas, audio) n'est chargé sur cette page.
   ══════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var doc = document;
  var D = window.Deeplink;
  doc.documentElement.classList.add('js');

  // ── Préférence de mode (mémorisée, jamais de redirection) ──
  // Dernier mode = aventure → la carte aventure propose de reprendre la balade.
  var prev = D ? D.getMode() : null;
  if (D) D.setMode('classique');
  if (prev === 'aventure') {
    var card = doc.querySelector('.mode-card--adventure');
    if (card) {
      card.classList.add('is-preferred');
      var go = card.querySelector('[data-resume]');
      if (go) go.textContent = go.getAttribute('data-resume');
    }
  }

  // ── Arrivée par fragment (grammaire commune js/deeplink.js) ──
  // Défilement explicite et instantané : fiable même pour les ancres
  // « projets/skywalk » et pour les alias sans élément (#portail, #ville).
  function applyHash(instant) {
    var r = D ? D.parse(location.hash) : null;
    if (!r) return;
    var id = location.hash.slice(1);
    try { id = decodeURIComponent(id); } catch (e) { /* brut */ }
    var target = r.kind === 'portail' ? doc.getElementById('services')
               : r.kind === 'ville'   ? doc.getElementById('top')
               : doc.getElementById(id) || doc.getElementById(id.split('/')[0]);
    if (!target) return;
    if (target.matches('.card[data-route]')) pinned = target;
    // Carte masquée par un filtre → on revient sur « Tous ».
    if (target.hidden) { var all = doc.querySelector('.filter[data-filter="all"]'); if (all) all.click(); }
    target.scrollIntoView({ block: 'start', behavior: instant ? 'instant' : 'smooth' });
  }
  window.addEventListener('hashchange', function () { applyHash(false); });

  // ── Route courante → bouton « Mode aventure » + onglet actif ──
  // Élément [data-route] le plus précis qui croise la ligne de lecture
  // (35 % de la hauteur) : carte projet > section.
  var routed = Array.prototype.slice.call(doc.querySelectorAll('main [data-route]'));
  var followers = doc.querySelectorAll('[data-follow-route]');
  var navLinks = Array.prototype.slice.call(doc.querySelectorAll('.nav a'));
  var ticking = false;
  // Carte « regardée » : cible du lien d'arrivée, ou dernière carte survolée /
  // ciblée au clavier. Prioritaire tant qu'elle est à l'écran (plusieurs
  // cartes peuvent partager la même ligne en grille).
  var pinned = null;
  doc.querySelector('main').addEventListener('pointerover', function (e) {
    var c = e.target.closest && e.target.closest('.card[data-route]');
    if (c && c !== pinned) { pinned = c; onScroll(); }
  });
  doc.querySelector('main').addEventListener('focusin', function (e) {
    var c = e.target.closest && e.target.closest('.card[data-route]');
    if (c) { pinned = c; onScroll(); }
  });

  function currentRoute() {
    if (pinned && !pinned.hidden) {
      var pr = pinned.getBoundingClientRect();
      if (pr.bottom > 70 && pr.top < window.innerHeight) return pinned.getAttribute('data-route');
    }
    var y = window.innerHeight * 0.35;
    var best = null, bestH = Infinity;
    for (var i = 0; i < routed.length; i++) {
      var el = routed[i];
      if (el.hidden) continue;
      var r = el.getBoundingClientRect();
      if (r.height && r.top <= y && r.bottom >= y && r.height < bestH) { best = el; bestH = r.height; }
    }
    return best ? best.getAttribute('data-route') : 'ville';
  }

  function update() {
    ticking = false;
    var route = currentRoute();
    for (var i = 0; i < followers.length; i++) followers[i].setAttribute('href', 'aventure.html#' + route);

    // Onglet actif = section qui contient la ligne de lecture.
    var y = window.innerHeight * 0.35, active = null;
    navLinks.forEach(function (a) {
      var sec = doc.getElementById(a.getAttribute('href').slice(1));
      if (!sec) return;
      var r = sec.getBoundingClientRect();
      if (r.top <= y && r.bottom >= y) active = a;
    });
    navLinks.forEach(function (a) {
      if (a === active) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });
  }
  function onScroll() {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  update();

  // ── Passage en mode aventure ──────────────────────────
  // Préchargement à l'intention (pas au chargement : un visiteur qui reste
  // en classique ne télécharge rien du jeu).
  var PREFETCH = ['aventure.html', 'style.css', 'js/audio.js', 'js/museum.js', 'js/controls.js',
    'js/mobileControls.js', 'js/interactions.js', 'js/player.js', 'js/map.js', 'js/game.js'];
  var prefetched = false;
  function prefetch() {
    if (prefetched) return;
    prefetched = true;
    var conn = navigator.connection;
    if (conn && (conn.saveData || /2g/.test(conn.effectiveType || ''))) return;
    PREFETCH.forEach(function (href) {
      var l = doc.createElement('link');
      l.rel = 'prefetch';
      l.href = href;
      doc.head.appendChild(l);
    });
  }
  doc.querySelectorAll('[data-switch-adventure]').forEach(function (a) {
    a.addEventListener('pointerenter', prefetch);
    a.addEventListener('focus', prefetch);
    a.addEventListener('touchstart', prefetch, { passive: true });
    // Au clic : route la plus fraîche (le scroll a pu bouger depuis la frame).
    if (a.hasAttribute('data-follow-route')) {
      a.addEventListener('click', function () { a.setAttribute('href', 'aventure.html#' + currentRoute()); });
    }
  });

  // ── Filtres de projets ────────────────────────────────
  var filters = Array.prototype.slice.call(doc.querySelectorAll('.filter'));
  var cards = Array.prototype.slice.call(doc.querySelectorAll('.proj'));
  filters.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var f = btn.getAttribute('data-filter');
      filters.forEach(function (b) { b.setAttribute('aria-pressed', b === btn ? 'true' : 'false'); });
      cards.forEach(function (c) {
        var show = f === 'all' ||
          (f === 'pick' ? c.hasAttribute('data-pick') : c.getAttribute('data-cat') === f);
        c.hidden = !show;
      });
      onScroll();
    });
  });

  // ── « Lire la suite » sur les descriptions longues ────
  doc.querySelectorAll('[data-clamp]').forEach(function (p) {
    if (p.scrollHeight <= p.clientHeight + 2) { p.removeAttribute('data-clamp'); return; }
    var more = doc.createElement('button');
    more.type = 'button';
    more.className = 'more';
    more.textContent = 'Lire la suite';
    more.setAttribute('aria-expanded', 'false');
    more.addEventListener('click', function () {
      var open = p.classList.toggle('is-open');
      more.textContent = open ? 'Réduire' : 'Lire la suite';
      more.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    p.insertAdjacentElement('afterend', more);
  });

  // ── Téléphone : appel direct sur mobile, texte + COPIER sur ordinateur ──
  var CW = window.ContactWidget;
  var mobile = CW ? CW.isMobile() : false;
  doc.querySelectorAll('[data-phone]').forEach(function (el) {
    if (!mobile) return;
    var a = doc.createElement('a');
    a.className = el.className;
    a.href = 'tel:' + el.getAttribute('data-phone');
    a.textContent = el.textContent;
    el.replaceWith(a);
  });

  // ── Copier ────────────────────────────────────────────
  doc.querySelectorAll('.copy').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var value = btn.getAttribute('data-copy');
      var done = function () {
        var prevText = btn.textContent;
        btn.textContent = 'Copié';
        btn.classList.add('is-ok');
        setTimeout(function () { btn.textContent = prevText; btn.classList.remove('is-ok'); }, 1500);
      };
      if (navigator.clipboard) navigator.clipboard.writeText(value).then(done, function () {});
    });
  });

  // ── Formulaire de contact (EmailJS chargé à la demande) ──
  var form = doc.getElementById('classic-contact-form');
  if (form && window.ContactForm) {
    window.ContactForm.warm(form);
    var submit = form.querySelector('[type="submit"]');
    var status = form.querySelector('.form-status');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      submit.disabled = true;
      submit.textContent = 'Envoi...';
      status.textContent = '';
      status.className = 'form-status';
      window.ContactForm.sendForm(form).then(function () {
        status.textContent = 'Message envoyé !';
        status.classList.add('is-ok');
        form.reset();
        submit.disabled = false;
        submit.textContent = 'Envoyer';
      }).catch(function (err) {
        console.error('EmailJS error:', err);
        status.textContent = 'Erreur lors de l\'envoi. Réessayez.';
        status.classList.add('is-error');
        submit.disabled = false;
        submit.textContent = 'Envoyer';
      });
    });
  }

  // Mise en page finale (« Lire la suite » posés) → on rejoint le fragment.
  applyHash(true);
  update();
})();
