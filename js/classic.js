/* ══════════════════════════════════════════════════════
   CLASSIC.JS — Mode classique (classique.html)
   Page lisible SANS JavaScript ; ce script n'ajoute que du confort :
     • menu mobile ; barre du haut vivante (onglet actif + pastille qui
       glisse, fond au défilement, progression, section courante)
     • bouton « Mode aventure » contextuel (emporte la section lue)
     • préchargement du mode aventure à l'intention (survol / toucher)
     • copier, formulaire
   Les visualisations (projets, frise, compétences) sont dans
   src/classic/*.js. Aucun code du jeu (canvas, audio) n'est chargé ici.
   ══════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var doc = document;
  var D = window.Deeplink;
  var main = doc.getElementById('main');
  doc.documentElement.classList.add('js');
  if (D) D.setMode('classique');

  // ── Menu mobile ───────────────────────────────────────
  var nav = doc.getElementById('site-nav');
  var navToggle = doc.querySelector('.nav-toggle');
  function setNav(open) {
    if (!nav || !navToggle) return;
    nav.classList.toggle('is-open', open);
    navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    navToggle.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
  }
  if (navToggle) {
    navToggle.addEventListener('click', function () { setNav(!nav.classList.contains('is-open')); });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) setNav(false); });
    doc.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) { setNav(false); navToggle.focus(); }
    });
  }

  // ── Route courante → bouton « Mode aventure » + onglet actif ──
  var routed = Array.prototype.slice.call(main.querySelectorAll('[data-route]'));
  var followers = doc.querySelectorAll('[data-follow-route]');
  var navLinks = Array.prototype.slice.call(doc.querySelectorAll('.nav a'));
  var topbar = doc.querySelector('.topbar');
  var ink = doc.querySelector('.nav__ink');
  var where = doc.querySelector('.topbar__where');
  var ticking = false;

  // Élément « regardé » : cible du lien d'arrivée, ou dernier élément
  // survolé / ciblé au clavier (bulle, étape…). Prioritaire tant qu'il est
  // à l'écran.
  var pinned = null;
  function pin(e) {
    var c = e.target.closest && e.target.closest('[data-route]');
    if (c && c.tagName !== 'SECTION' && c !== pinned) { pinned = c; onScroll(); }
  }
  main.addEventListener('pointerover', pin);
  main.addEventListener('focusin', pin);
  // Fiche projet ouverte (src/classic/projects.js) : c'est elle qu'on emporte.
  var forced = null;
  doc.addEventListener('classic:route', function (e) { forced = e.detail || null; onScroll(); });

  function visible(el) {
    if (el.hidden || el.closest('[hidden]')) return false;
    var r = el.getBoundingClientRect();
    return r.height > 0 && r.bottom > 70 && r.top < window.innerHeight;
  }

  // Élément [data-route] le plus précis qui croise la ligne de lecture
  // (35 % de la hauteur) : carte projet > section.
  function currentRoute() {
    if (forced) return forced;
    if (pinned && visible(pinned)) return pinned.getAttribute('data-route');
    var y = window.innerHeight * 0.35;
    var best = null, bestH = Infinity;
    for (var i = 0; i < routed.length; i++) {
      var el = routed[i];
      if (el.hidden || el.closest('[hidden]')) continue;
      var r = el.getBoundingClientRect();
      if (r.height && r.top <= y && r.bottom >= y && r.height < bestH) { best = el; bestH = r.height; }
    }
    return best ? best.getAttribute('data-route') : 'ville';
  }

  function update() {
    ticking = false;
    var href = 'aventure.html#' + currentRoute();
    for (var i = 0; i < followers.length; i++) followers[i].setAttribute('href', href);

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
    moveInk(active);
    if (where) {
      where.textContent = active ? active.textContent : '';
      where.classList.toggle('is-on', !!active);
    }

    // Barre du haut : légère dans le hero, plus présente ensuite.
    var sy = window.scrollY || doc.documentElement.scrollTop;
    var max = doc.documentElement.scrollHeight - window.innerHeight;
    if (topbar) {
      topbar.classList.toggle('is-scrolled', sy > 24);
      topbar.style.setProperty('--sp', max > 0 ? Math.min(1, sy / max).toFixed(4) : 0);
    }
  }

  // Pastille de l'onglet actif : glisse d'un onglet à l'autre.
  var inkOn = null;
  function moveInk(a) {
    if (!ink) return;
    var nav = ink.parentNode;
    if (!a || !a.offsetWidth) { nav.classList.remove('has-ink'); inkOn = null; return; }
    if (!inkOn) nav.classList.add('no-ink-anim');      // 1re apparition : sur place, sans glisser
    ink.style.setProperty('--ix', a.offsetLeft + 'px');
    ink.style.setProperty('--iw', a.offsetWidth + 'px');
    if (!inkOn) { void ink.offsetWidth; nav.classList.remove('no-ink-anim'); }
    nav.classList.add('has-ink');
    inkOn = a;
  }
  function onScroll() {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);

  // ── Arrivée par fragment (grammaire commune js/deeplink.js) ──
  // Défilement explicite et instantané : fiable même pour les ancres
  // « projets/skywalk » et pour les alias sans élément (#portail, #ville).
  function applyHash(instant) {
    // Fermeture d'une fiche projet (retour dans l'historique) : on reste où l'on est.
    if (window.ClassicApp && window.ClassicApp.skipHash) { window.ClassicApp.skipHash = false; return; }
    var r = D ? D.parse(location.hash) : null;
    if (!r) return;
    var id = location.hash.slice(1);
    try { id = decodeURIComponent(id); } catch (e) { /* brut */ }
    var target = r.kind === 'portail' ? doc.getElementById('services')
               : r.kind === 'ville'   ? doc.getElementById('top')
               : doc.getElementById(id) || doc.getElementById(id.split('/')[0]);
    if (!target) return;
    // Projet : la fiche immersive s'en charge (une fois le module prêt ;
    // au premier chargement, il lit lui-même le fragment).
    var app = window.ClassicApp;
    if (target.classList.contains('pj-item') && app && app.openProject) {
      app.openProject(target.getAttribute('data-slug'), { fromHash: true });
      return;
    }
    if (target.tagName !== 'SECTION' && target.getAttribute('data-route')) pinned = target;
    // Élément non affiché (liste des projets en vue « espace ») → sa section.
    var shown = target.getClientRects().length ? target : target.closest('section') || target;
    shown.scrollIntoView({ block: 'start', behavior: instant ? 'instant' : 'smooth' });
    if (shown === target && target.tagName !== 'SECTION') {
      target.classList.remove('is-target'); void target.offsetWidth; target.classList.add('is-target');
    }
  }
  window.addEventListener('hashchange', function () { applyHash(false); });

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

  // Mise en page finale → on rejoint le fragment.
  applyHash(true);
  update();
  // Police chargée / redimensionnement : les onglets changent de largeur.
  if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(function () { inkOn = null; update(); });
  window.addEventListener('resize', function () { inkOn = null; });
})();
