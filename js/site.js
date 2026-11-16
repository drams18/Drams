/* ══════════════════════════════════════════════════════
   SITE.JS : Confort des pages du site (générées par
   scripts/build-site.mjs). Chaque page est complète SANS ce script ;
   il n'ajoute que :
     • le menu mobile (plein écran, la page derrière ne défile plus)
     • les flèches et points des carrousels (Réalisations, accueil)
     • les points des rangées qui défilent au doigt (offres de l'accueil)
     • la barre d'appel qui s'efface quand le clavier est ouvert
     • l'envoi du formulaire de contact (EmailJS, js/contact-form.js)
     • le préchargement du mode aventure à l'intention (survol, toucher)
     • l'heure en Île-de-France dans le pied de page
   ══════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var doc = document;
  var body = doc.body;

  // Dernier mode utilisé (liens « retour » du mode aventure, devis). Les
  // pages communes aux deux modes (tarifs, devis, avis) le laissent tel quel.
  if (window.Deeplink && !body.hasAttribute('data-keep-mode')) window.Deeplink.setMode('classique');

  // ── Menu mobile ───────────────────────────────────────
  var nav = doc.getElementById('site-nav');
  var toggle = doc.querySelector('.nav-toggle');
  function setNav(open) {
    nav.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
    toggle.innerHTML = '<svg class="ico" aria-hidden="true" focusable="false"><use href="#i-' + (open ? 'close' : 'menu') + '"/></svg>';
    doc.documentElement.classList.toggle('nav-open', open);
  }
  if (nav && toggle) {
    toggle.addEventListener('click', function () { setNav(!nav.classList.contains('is-open')); });
    doc.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) { setNav(false); toggle.focus(); }
    });
    doc.addEventListener('click', function (e) {
      if (nav.classList.contains('is-open') && !e.target.closest('#site-nav, .nav-toggle')) setNav(false);
    });
    window.addEventListener('pageshow', function (e) { if (e.persisted) setNav(false); });
    // Lien du menu vers une ancre de la page : on referme.
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) setNav(false); });
    matchMedia('(min-width: 900px)').addEventListener('change', function (m) { if (m.matches) setNav(false); });
  }

  // ── Réalisations : carrousels ────────────────────────
  // Le défilement est natif (doigt, pavé, clavier) ; on ajoute les flèches
  // et les points. Rien à faire défiler : flèches et points masqués.
  doc.querySelectorAll('[data-rail]').forEach(function (rail) {
    var track = rail.querySelector('.rail__track');
    var slides = Array.prototype.slice.call(track.children);
    var prev = rail.querySelector('[data-rail-prev]');
    var next = rail.querySelector('[data-rail-next]');
    var dots = rail.querySelectorAll('.rail__dots i');
    var step = function () { return slides.length > 1 ? slides[1].offsetLeft - slides[0].offsetLeft : track.clientWidth; };
    var update = function () {
      var max = track.scrollWidth - track.clientWidth;
      rail.classList.toggle('is-static', max < 4);
      if (prev) prev.disabled = track.scrollLeft < 4;
      if (next) next.disabled = track.scrollLeft > max - 4;
      // Point actif : la diapositive calée à gauche (la dernière en fin de course).
      var i = track.scrollLeft > max - 4 ? slides.length - 1 : Math.round(track.scrollLeft / (step() || 1));
      dots.forEach(function (d, k) { d.classList.toggle('on', k === i); });
    };
    var still = matchMedia('(prefers-reduced-motion: reduce)').matches;
    var go = function (dir) { track.scrollBy({ left: dir * step(), behavior: still ? 'auto' : 'smooth' }); };
    if (prev) prev.addEventListener('click', function () { go(-1); });
    if (next) next.addEventListener('click', function () { go(1); });
    var queued = false;
    track.addEventListener('scroll', function () {
      if (queued) return;
      queued = true;
      requestAnimationFrame(function () { queued = false; update(); });
    }, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    update();
  });

  // ── Rangées au doigt (téléphone) : point actif ────────
  doc.querySelectorAll('[data-swipe]').forEach(function (wrap) {
    var track = wrap.querySelector('.swipe');
    var dots = wrap.querySelectorAll('.swipe__dots i');
    if (!track || !dots.length) return;
    var queued = false;
    var update = function () {
      queued = false;
      var kids = track.children;
      var step = kids.length > 1 ? kids[1].offsetLeft - kids[0].offsetLeft : track.clientWidth;
      var max = track.scrollWidth - track.clientWidth;
      var i = track.scrollLeft > max - 4 ? kids.length - 1 : Math.round(track.scrollLeft / (step || 1));
      dots.forEach(function (d, k) { d.classList.toggle('on', k === i); });
    };
    track.addEventListener('scroll', function () {
      if (!queued) { queued = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();
  });

  // ── Clavier ouvert : la barre d'appel laisse la place ──
  var typing = function (t) { return t && t.matches && t.matches('input:not([type=checkbox]):not([type=radio]), textarea, select'); };
  doc.addEventListener('focusin', function (e) { if (typing(e.target)) doc.documentElement.classList.add('is-typing'); });
  doc.addEventListener('focusout', function (e) { if (typing(e.target)) doc.documentElement.classList.remove('is-typing'); });

  // ── Formulaire de contact (EmailJS chargé à la demande) ──
  var form = doc.getElementById('contact-form');
  if (form && window.ContactForm) {
    window.ContactForm.warm(form);
    var submit = form.querySelector('[type="submit"]');
    var label = submit.innerHTML;
    var out = form.querySelector('.form-status');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      // Le modèle d'e-mail ne connaît que nom, e-mail et message : le
      // téléphone (facultatif) est ajouté au message.
      var msg = form.elements.message;
      var phone = form.elements.from_phone && form.elements.from_phone.value.trim();
      var original = msg.value;
      if (phone) msg.value = original + '\n\nTéléphone : ' + phone;
      submit.disabled = true;
      submit.textContent = 'Envoi…';
      out.textContent = '';
      out.className = 'form-status';
      window.ContactForm.sendForm(form).then(function () {
        out.textContent = 'Message envoyé, merci ! Je vous réponds sous 48 h.';
        out.classList.add('is-ok');
        form.reset();
        if (window.FX) window.FX.confetti();
      }).catch(function (err) {
        console.error('EmailJS error:', err);
        msg.value = original;
        out.textContent = 'L’envoi n’a pas fonctionné. Réessayez, ou appelez-moi directement.';
        out.classList.add('is-error');
      }).then(function () {
        submit.disabled = false;
        submit.innerHTML = label;
      });
    });
  }

  // ── Pied de page : heure en Île-de-France ─────────────
  var clocks = doc.querySelectorAll('[data-clock]');
  if (clocks.length && window.Intl) {
    var fmt = new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', hour: '2-digit', minute: '2-digit', second: '2-digit' });
    var tick = function () {
      var now = new Date();
      var t = fmt.format(now);
      clocks.forEach(function (c) { c.textContent = t; c.dateTime = now.toISOString(); });
      setTimeout(tick, 1000 - (now.getTime() % 1000) + 5);
    };
    tick();
  }

  // ── Mode aventure : préchargé seulement si le visiteur s'y intéresse ──
  var prefetched = false;
  function prefetch() {
    if (prefetched) return;
    prefetched = true;
    var conn = navigator.connection;
    if (conn && (conn.saveData || /2g/.test(conn.effectiveType || ''))) return;
    var l = doc.createElement('link');
    l.rel = 'prefetch';
    l.href = '/aventure';
    doc.head.appendChild(l);
  }
  doc.querySelectorAll('[data-switch-adventure]').forEach(function (a) {
    a.addEventListener('pointerenter', prefetch);
    a.addEventListener('focus', prefetch);
    a.addEventListener('touchstart', prefetch, { passive: true });
  });
})();
