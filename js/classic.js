/* ══════════════════════════════════════════════════════
   CLASSIC.JS : Socle commun aux cinq pages du mode classique
   (classique.html + classique/*.html). Chaque page est lisible SANS
   JavaScript ; ce script n'ajoute que du confort :
     • menu mobile ; barre du haut (fond au défilement)
     • navigation entre pages au clavier (← →), jamais dans un champ
       ni dans un composant qui utilise déjà les flèches ([data-keys])
     • transitions entre pages : sens mémorisé (navigateurs sans
       View Transitions), nom ↔ logo quand le nom est hors écran
     • bouton « Mode aventure » contextuel (emporte ce qu'on regarde)
     • préchargement du mode aventure à l'intention (survol / toucher)
     • copier, téléphone, formulaire (page Contact)
   Les expériences (projets, frise, compétences) sont dans
   src/classic/*.js. Aucun code du jeu (canvas, audio) n'est chargé ici.
   ══════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var doc = document;
  var root = doc.documentElement;
  var D = window.Deeplink;
  var NAV = window.ClassicNav || { idx: function () { return -1; }, here: -1 };
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
    doc.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) { setNav(false); navToggle.focus(); }
    });
    doc.addEventListener('click', function (e) {
      if (nav.classList.contains('is-open') && !e.target.closest('#site-nav, .nav-toggle')) setNav(false);
    });
  }

  // ── Légende repliable : se referme en cliquant ailleurs ou avec Échap ──
  doc.addEventListener('pointerdown', function (e) {
    doc.querySelectorAll('.legend[open]').forEach(function (d) { if (!d.contains(e.target)) d.open = false; });
  });
  doc.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    doc.querySelectorAll('.legend[open]').forEach(function (d) {
      d.open = false;
      if (d.contains(doc.activeElement)) d.querySelector('summary').focus();
    });
  });

  // ── Barre du haut : légère en haut de page, plus présente ensuite ──
  var topbar = doc.querySelector('.topbar');
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      if (topbar) topbar.classList.toggle('is-scrolled', (window.scrollY || root.scrollTop) > 24);
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ── Navigation entre pages ────────────────────────────
  // Sens mémorisé pour la page suivante (repli des navigateurs sans
  // Navigation API ; voir le script du <head>).
  function remember() {
    try { sessionStorage.setItem('drame.classic.from', String(NAV.here)); } catch (e) { /* noop */ }
  }
  doc.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a || a.target === '_blank' || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var to = NAV.idx(a.href);
    if (to >= 0 && to !== NAV.here) remember();
  });

  function go(rel) {
    var link = doc.querySelector('.worlds a[rel="' + rel + '"]');
    if (!link) return false;
    remember();
    location.href = link.href;
    return true;
  }
  doc.addEventListener('keydown', function (e) {
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    var t = e.target;
    if (t.closest && t.closest('input, textarea, select, [contenteditable=""], [contenteditable="true"], [data-keys], [role="tablist"], dialog, .eco-panel')) return;
    if (doc.querySelector('dialog[open]') || (nav && nav.classList.contains('is-open'))) return;
    if (go(e.key === 'ArrowLeft' ? 'prev' : 'next')) e.preventDefault();
  });

  // Départ vers une autre page du classique : le nom (Profil) se change
  // en logo… sauf s'il n'est plus à l'écran, c'est alors le logo qui part.
  window.addEventListener('pageswap', function (e) {
    if (!e.viewTransition) return;
    var name = doc.querySelector('.pf-name');
    var brand = doc.querySelector('.brand');
    if (!name || !brand) return;
    var r = name.getBoundingClientRect();
    if (r.bottom < 60 || r.top > innerHeight) {
      name.style.viewTransitionName = 'none';
      brand.style.viewTransitionName = 'name';
    }
  });
  // Arrivée sur le Profil déjà défilé (retour arrière) : même logique.
  window.addEventListener('pagereveal', function (e) {
    if (!e.viewTransition) return;
    var name = doc.querySelector('.pf-name');
    var brand = doc.querySelector('.brand');
    if (!name || !brand) return;
    var r = name.getBoundingClientRect();
    if (r.bottom < 60 || r.top > innerHeight) {
      name.style.viewTransitionName = 'none';
      brand.style.viewTransitionName = 'name';
      e.viewTransition.finished.then(function () { name.style.viewTransitionName = ''; brand.style.viewTransitionName = ''; });
    }
  });
  // Retour arrière depuis le cache : la page revient telle qu'elle était.
  window.addEventListener('pageshow', function (e) {
    if (e.persisted) {
      var n = doc.querySelector('.pf-name'), b = doc.querySelector('.brand');
      if (n) n.style.viewTransitionName = '';
      if (b) b.style.viewTransitionName = '';
      setNav(false);
    }
  });

  // ── Bouton « Mode aventure » : emporte ce qu'on regarde ──
  var followers = doc.querySelectorAll('[data-follow-route]');
  var baseRoute = doc.body.getAttribute('data-route') || 'ville';
  function setRoute(r) {
    for (var i = 0; i < followers.length; i++) {
      var href = followers[i].getAttribute('href').split('#')[0];
      followers[i].setAttribute('href', href + '#' + (r || baseRoute));
    }
  }
  doc.addEventListener('classic:route', function (e) { setRoute(e.detail); });

  // Préchargement à l'intention (pas au chargement : un visiteur qui reste
  // en classique ne télécharge rien du jeu).
  var up = /\/classique\//.test(location.pathname) ? '../' : '';
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
      l.href = up + href;
      doc.head.appendChild(l);
    });
  }
  doc.querySelectorAll('[data-switch-adventure]').forEach(function (a) {
    a.addEventListener('pointerenter', prefetch);
    a.addEventListener('focus', prefetch);
    a.addEventListener('touchstart', prefetch, { passive: true });
  });

  // ── Téléphone : appel direct sur mobile, texte + COPIER sur ordinateur ──
  var mobile = matchMedia('(pointer: coarse)').matches && matchMedia('(max-width: 900px)').matches;
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
      var label = btn.querySelector('span') || btn;
      var done = function () {
        clearTimeout(btn._t);
        label.textContent = 'Copié';
        btn.classList.add('is-ok');
        btn._t = setTimeout(function () { label.textContent = 'Copier'; btn.classList.remove('is-ok'); }, 1600);
      };
      if (navigator.clipboard) navigator.clipboard.writeText(value).then(done, function () {});
    });
  });

  // ── Formulaire de contact (EmailJS chargé à la demande) ──
  var form = doc.getElementById('classic-contact-form');
  if (form && window.ContactForm) {
    window.ContactForm.warm(form);
    var submit = form.querySelector('[type="submit"]');
    var label = submit.innerHTML;
    var status = form.querySelector('.form-status');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      submit.disabled = true;
      submit.textContent = 'Envoi…';
      form.classList.add('is-sending');
      status.textContent = '';
      status.className = 'form-status';
      window.ContactForm.sendForm(form).then(function () {
        form.classList.remove('is-sending');
        status.textContent = 'Message envoyé, merci ! Je vous réponds par e-mail.';
        status.classList.add('is-ok');
        form.reset();
        submit.disabled = false;
        submit.innerHTML = label;
      }).catch(function (err) {
        console.error('EmailJS error:', err);
        form.classList.remove('is-sending');
        status.textContent = 'Erreur lors de l\'envoi. Réessayez.';
        status.classList.add('is-error');
        submit.disabled = false;
        submit.innerHTML = label;
      });
    });
  }
})();
