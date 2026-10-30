/* ══════════════════════════════════════════════════════
   SITE.JS : Confort des pages du site (générées par
   scripts/build-site.mjs). Chaque page est complète SANS ce script ;
   il n'ajoute que :
     • le menu mobile
     • les flèches et points des carrousels de la page Réalisations
     • l'envoi du formulaire de contact (EmailJS, js/contact-form.js)
     • le préchargement du mode aventure à l'intention (survol, toucher)
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
      prev.disabled = track.scrollLeft < 4;
      next.disabled = track.scrollLeft > max - 4;
      // Point actif : la diapositive calée à gauche (la dernière en fin de course).
      var i = track.scrollLeft > max - 4 ? slides.length - 1 : Math.round(track.scrollLeft / (step() || 1));
      dots.forEach(function (d, k) { d.classList.toggle('on', k === i); });
    };
    var still = matchMedia('(prefers-reduced-motion: reduce)').matches;
    var go = function (dir) { track.scrollBy({ left: dir * step(), behavior: still ? 'auto' : 'smooth' }); };
    prev.addEventListener('click', function () { go(-1); });
    next.addEventListener('click', function () { go(1); });
    var queued = false;
    track.addEventListener('scroll', function () {
      if (queued) return;
      queued = true;
      requestAnimationFrame(function () { queued = false; update(); });
    }, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    update();
  });

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
