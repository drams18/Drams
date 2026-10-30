/* ══════════════════════════════════════════════════════
   FX.JS : Effets du site (styles dans css/fx.css). Chaque page est
   complète sans ce script ; il n'ajoute que du mouvement :
     • apparitions au défilement (seulement ce qui est sous la ligne de
       flottaison au chargement : rien ne disparaît sous les yeux)
     • lumière qui suit le pointeur sur les cartes
     • hero : halo et scène 3D qui suivent le pointeur, recul au défilement
     • boutons magnétiques, barre de progression, barre du haut
     • méthode : frise qui se remplit
     • boucles mises en pause quand elles sortent de l'écran
   Rien si le visiteur demande moins de mouvement (pas de classe .fx).
   ══════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var doc = document;
  var root = doc.documentElement;
  if (!root.classList.contains('fx') || !('IntersectionObserver' in window)) return;

  var fine = matchMedia('(pointer: fine)').matches;
  var raf = window.requestAnimationFrame.bind(window);
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };

  // ── Apparitions au défilement ─────────────────────────
  var REVEAL = [
    '.sec__head > *', '.problem', '.offer', '.case', '.process__s', '.about__photo', '.about__txt > *', '.adv',
    '.faq__i', '.cta__in > *', '.way', '.mini', '.block__t', '.proj__media', '.proj__s', '.shots > *', '.cat',
    '.free', '.form-card', '.contact > *', '.tl__list > li', '.about-page > *', '.sec__more', '.legal > *', '.cta__row > *',
  ].join(',');
  var fold = innerHeight * 0.94;
  var targets = Array.prototype.filter.call(doc.querySelectorAll(REVEAL), function (el) {
    return !el.closest('.hero, .phead') && el.getBoundingClientRect().top > fold;
  });
  // Décalage en cascade entre éléments frères
  targets.forEach(function (el) {
    var sibs = Array.prototype.filter.call(el.parentNode.children, function (c) { return targets.indexOf(c) >= 0; });
    var i = sibs.indexOf(el);
    el.style.setProperty('--d', (Math.min(i, 5) * 0.08).toFixed(2) + 's');
    el.classList.add('rv');
  });
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      io.unobserve(e.target);
      // Une fois apparu, le délai ne doit plus freiner le survol.
      setTimeout(function () { e.target.style.removeProperty('--d'); }, 1400);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  targets.forEach(function (el) { io.observe(el); });
  // Clavier : un élément atteint au Tab apparaît tout de suite.
  doc.addEventListener('focusin', function (e) {
    var el = e.target.closest && e.target.closest('.rv:not(.in)');
    if (el) el.classList.add('in');
  });
  // Ancre (#offre-…, #contact) : on dévoile la cible et ses voisins.
  function revealHash() {
    var id = location.hash.slice(1);
    var t = id && doc.getElementById(decodeURIComponent(id));
    if (!t) return;
    (t.closest('.sec') || t).querySelectorAll('.rv').forEach(function (el) { el.classList.add('in'); });
    if (t.classList.contains('rv')) t.classList.add('in');
  }
  addEventListener('hashchange', revealHash);
  revealHash();

  // ── Lumière qui suit le pointeur sur les cartes ───────
  if (fine) {
    var CARDS = '.problem, .offer, .case, .way, .mini__a, .faq__i, .proj__s, .cat, .form-card, .free';
    doc.querySelectorAll(CARDS).forEach(function (c) { c.classList.add('spot'); });
    doc.addEventListener('pointermove', function (e) {
      var c = e.target.closest && e.target.closest('.spot');
      if (!c) return;
      var r = c.getBoundingClientRect();
      c.style.setProperty('--mx', (e.clientX - r.left).toFixed(0) + 'px');
      c.style.setProperty('--my', (e.clientY - r.top).toFixed(0) + 'px');
    }, { passive: true });

    // Boutons magnétiques
    doc.querySelectorAll('[data-magnet]').forEach(function (b) {
      b.addEventListener('pointermove', function (e) {
        var r = b.getBoundingClientRect();
        var x = (e.clientX - r.left - r.width / 2) * 0.22;
        var y = (e.clientY - r.top - r.height / 2) * 0.35;
        b.style.translate = x.toFixed(1) + 'px ' + y.toFixed(1) + 'px';
      });
      b.addEventListener('pointerleave', function () { b.style.translate = ''; });
    });
  }

  // ── Hero ──────────────────────────────────────────────
  var hero = doc.querySelector('[data-hero]');
  var heroOn = false;
  if (hero) {
    var spot = hero.querySelector('.hero__spot');
    var stage = hero.querySelector('[data-tilt]');
    var txt = hero.querySelector('.hero__txt');
    var vis = hero.querySelector('.hero__vis');
    var tx = 0, ty = 0, cx = 0, cy = 0, sx = 0, sy = 0, psx = 0, psy = 0, moving = 0;

    function frame() {
      cx += (tx - cx) * 0.08; cy += (ty - cy) * 0.08;
      psx += (sx - psx) * 0.12; psy += (sy - psy) * 0.12;
      if (stage) {
        stage.style.setProperty('--ry', (-16 + cx * 14).toFixed(2) + 'deg');
        stage.style.setProperty('--rx', (7 - cy * 10).toFixed(2) + 'deg');
      }
      if (spot) spot.style.transform = 'translate3d(' + psx.toFixed(0) + 'px,' + psy.toFixed(0) + 'px,0)';
      var still = Math.abs(tx - cx) + Math.abs(ty - cy) < 0.002 && Math.abs(sx - psx) + Math.abs(sy - psy) < 0.5;
      moving = still ? 0 : raf(frame);
    }
    if (fine) {
      hero.addEventListener('pointermove', function (e) {
        var r = hero.getBoundingClientRect();
        tx = (e.clientX - r.left) / r.width - 0.5;
        ty = (e.clientY - r.top) / r.height - 0.5;
        sx = e.clientX - r.left; sy = e.clientY - r.top;
        if (!hero.classList.contains('is-lit')) { psx = sx; psy = sy; hero.classList.add('is-lit'); }
        if (!moving) moving = raf(frame);
      }, { passive: true });
      hero.addEventListener('pointerleave', function () {
        tx = ty = 0; hero.classList.remove('is-lit');
        if (!moving) moving = raf(frame);
      });
    }

    // Recul au défilement : le texte s'efface, la scène descend.
    var heroScroll = function () {
      var h = hero.offsetHeight || 1;
      var p = clamp(scrollY / h, 0, 1);
      if (txt) { txt.style.transform = 'translate3d(0,' + (-p * 70).toFixed(1) + 'px,0)'; txt.style.opacity = (1 - p * 0.85).toFixed(3); }
      if (vis) vis.style.transform = 'translate3d(0,' + (p * 60).toFixed(1) + 'px,0) scale(' + (1 - p * 0.06).toFixed(3) + ')';
    };
    hero.__scroll = heroScroll;
  }

  // ── Méthode : frise ───────────────────────────────────
  var proc = doc.querySelector('[data-process]');
  var steps = proc ? proc.querySelectorAll('.process__s') : [];
  function procScroll() {
    if (!proc) return;
    var r = proc.getBoundingClientRect();
    var p = clamp((innerHeight * 0.72 - r.top) / (r.height || 1), 0, 1);
    proc.style.setProperty('--p', p.toFixed(3));
    // Frise verticale : la ligne s'arrête au centre du dernier numéro.
    var last = steps[steps.length - 1];
    if (last) proc.style.setProperty('--tail', (proc.offsetHeight - last.offsetTop - 23) + 'px');
    var line = innerHeight * 0.72;
    steps.forEach(function (s) { s.classList.toggle('on', s.getBoundingClientRect().top < line); });
  }

  // ── Barre de progression + barre du haut ──────────────
  var bar = doc.createElement('div');
  bar.className = 'fx-progress';
  bar.setAttribute('aria-hidden', 'true');
  doc.body.appendChild(bar);
  var topbar = doc.querySelector('.topbar');

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    raf(function () {
      ticking = false;
      var max = root.scrollHeight - innerHeight;
      bar.style.transform = 'scaleX(' + (max > 0 ? clamp(scrollY / max, 0, 1) : 0).toFixed(4) + ')';
      if (topbar) topbar.classList.toggle('is-scrolled', scrollY > 24);
      if (hero && heroOn) hero.__scroll();
      procScroll();
    });
  }
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll, { passive: true });

  // ── Boucles en pause hors écran ───────────────────────
  var pause = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      e.target.classList.toggle('is-off', !e.isIntersecting);
      if (e.target === hero) heroOn = e.isIntersecting;
    });
  });
  doc.querySelectorAll('[data-hero], .ticker, .cta').forEach(function (el) { pause.observe(el); });
  heroOn = !!hero;

  root.classList.add('fxr');
  onScroll();
})();
