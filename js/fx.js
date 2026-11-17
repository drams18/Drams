/* ══════════════════════════════════════════════════════
   FX.JS : Effets du site (styles dans css/fx.css). Chaque page est
   complète sans ce script ; il n'ajoute que du mouvement :
     • écran d'arrivée (première page de la session, voir js/theme.js)
     • rideau entre les pages, avec le nom de la page d'arrivée
     • apparitions au défilement (seulement ce qui est sous la ligne de
       flottaison au chargement : rien ne disparaît sous les yeux),
       titres et chapeaux qui arrivent mot à mot, flous puis nets
     • lumière qui suit le pointeur sur les cartes
     • hero : halo, mots fantômes et scène 3D qui suivent le pointeur,
       recul au défilement
     • texte brouillé au survol du menu et du nom
     • boutons magnétiques, barre de progression, barre du haut
     • méthode : frise qui se remplit
     • confettis après l'envoi d'un formulaire (window.FX.confetti)
     • boucles mises en pause quand elles sortent de l'écran
   Rien si le visiteur demande moins de mouvement (pas de classe .fx).
   ══════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var doc = document;
  var root = doc.documentElement;
  var body = doc.body;
  if (!root.classList.contains('fx')) return;

  var fine = matchMedia('(pointer: fine)').matches;
  var mouse = matchMedia('(hover: hover) and (pointer: fine)').matches;
  var raf = window.requestAnimationFrame.bind(window);
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var EASE_OUT = 'cubic-bezier(.16,1,.3,1)';
  var EASE_BACK = 'cubic-bezier(.34,1.56,.64,1)';
  var EASE_IO = 'cubic-bezier(.76,0,.24,1)';

  // ── Texte brouillé : les lettres se recomposent de gauche à droite ──
  var GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789#%&*+=?';
  function scramble(node, to, dur) {
    if (node.__scr) cancelAnimationFrame(node.__scr);
    var t0 = performance.now(), last = -1;
    (function step(now) {
      var p = clamp((now - t0) / dur, 0, 1);
      var bucket = Math.floor(now / 45);
      if (p === 1) node.textContent = to;
      else if (bucket !== last) {
        last = bucket;
        var out = '', n = to.length, done = Math.floor(n * p);
        for (var i = 0; i < n; i++) {
          var ch = to.charAt(i);
          out += i < done || /[\s·,']/.test(ch) ? ch : GLYPHS.charAt((Math.random() * GLYPHS.length) | 0);
        }
        node.textContent = out;
      }
      node.__scr = p < 1 ? raf(step) : 0;
    })(t0);
  }

  // ══ Écran d'arrivée ═══════════════════════════════════
  // Logo, nom lettre à lettre, compteur, puis deux rideaux qui se lèvent.
  // Un clic, une touche ou la molette le passent.
  (function intro() {
    if (!root.classList.contains('intro') || !Element.prototype.animate) return;
    var name = (doc.querySelector('.brand__name') || {}).textContent || '';
    var job = (doc.querySelector('.brand__job') || {}).textContent || '';
    var letters = name.split('').map(function (c) {
      return c === ' ' ? '<span class="intro-screen__sp"> </span>' : '<span class="intro-screen__c"><span>' + esc(c) + '</span></span>';
    }).join('');
    var el = doc.createElement('div');
    el.className = 'intro-screen';
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML =
      '<div class="intro-screen__sheet"></div>' +
      '<div class="intro-screen__ink">' +
        '<div class="intro-screen__in">' +
          '<img class="intro-screen__logo" src="/assets/img/logo.svg" alt="" width="132" height="132">' +
          '<p class="intro-screen__name">' + letters + '</p>' +
          '<p class="intro-screen__job">' + esc(job) + '</p>' +
        '</div>' +
        '<span class="intro-screen__count">0</span>' +
        '<span class="intro-screen__bar"><i></i></span>' +
      '</div>';
    body.appendChild(el);
    root.classList.add('intro-on');

    var q = function (s) { return el.querySelector(s); };
    var ink = q('.intro-screen__ink'), sheet = q('.intro-screen__sheet'), inner = q('.intro-screen__in');
    var count = q('.intro-screen__count'), bar = q('.intro-screen__bar i');
    var play = function (node, frames, opts) {
      opts.fill = 'both';
      return node.animate(frames, opts);
    };
    play(q('.intro-screen__logo'), [{ opacity: 0, transform: 'scale(.55) rotate(-140deg)' }, { opacity: 1, transform: 'none' }], { duration: 900, delay: 60, easing: EASE_BACK });
    el.querySelectorAll('.intro-screen__c > span').forEach(function (c, i) {
      play(c, [{ transform: 'translate3d(0,110%,0)' }, { transform: 'none' }], { duration: 640, delay: 180 + i * 24, easing: EASE_OUT });
    });
    play(q('.intro-screen__job'), [{ opacity: 0, transform: 'translate3d(0,14px,0)' }, { opacity: 1, transform: 'none' }], { duration: 520, delay: 480, easing: EASE_OUT });

    var t0 = performance.now(), D = 950, leaving = false;
    (function tick(now) {
      if (leaving) return;
      var p = clamp((now - t0) / D, 0, 1), e = 1 - Math.pow(1 - p, 3);
      count.textContent = Math.round(e * 100);
      bar.style.transform = 'scaleX(' + e.toFixed(3) + ')';
      if (p < 1) raf(tick);
    })(t0);

    var SKIP = ['pointerdown', 'keydown', 'wheel', 'touchstart'];
    var timer = setTimeout(leave, 1040);
    SKIP.forEach(function (t) { addEventListener(t, leave, { passive: true }); });

    function leave() {
      if (leaving) return;
      leaving = true;
      clearTimeout(timer);
      SKIP.forEach(function (t) { removeEventListener(t, leave, { passive: true }); });
      count.textContent = '100';
      bar.style.transform = 'scaleX(1)';
      play(inner, [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translate3d(0,-36px,0)' }], { duration: 340, easing: 'cubic-bezier(.5,0,.75,0)' });
      play(q('.intro-screen__count'), [{ opacity: 1 }, { opacity: 0 }], { duration: 300 });
      play(q('.intro-screen__bar'), [{ opacity: 1 }, { opacity: 0 }], { duration: 300 });
      play(ink, [{ transform: 'translate3d(0,0,0)' }, { transform: 'translate3d(0,-100%,0)' }], { duration: 640, delay: 200, easing: EASE_IO });
      var last = play(sheet, [{ transform: 'translate3d(0,0,0)' }, { transform: 'translate3d(0,-100%,0)' }], { duration: 640, delay: 290, easing: EASE_IO });
      // Les entrées de la page démarrent pendant que le dernier rideau se lève.
      setTimeout(function () { root.classList.remove('hold'); }, 400);
      last.finished.then(done, done);
    }
    function done() {
      el.remove();
      root.classList.remove('intro', 'intro-on', 'hold');
    }
  })();

  // ══ Rideau entre les pages ════════════════════════════
  // Au clic sur un lien interne : un rideau cobalt monte avec le nom de la
  // page d'arrivée, puis on change de page. Sur la page suivante, le même
  // rideau se lève en CSS pur (js/theme.js pose [data-curtain]).
  var LABELS = {
    '/': 'Accueil', '/realisations': 'Réalisations', '/tarifs': 'Tarifs', '/a-propos': 'À propos',
    '/contact': 'Contact', '/devis': 'Devis gratuit', '/avis': 'Votre avis',
    '/mentions-legales': 'Mentions légales', '/confidentialite': 'Confidentialité',
  };
  function labelFor(a, url) {
    var path = url.pathname.replace(/\.html$/, '').replace(/\/+$/, '') || '/';
    if (LABELS[path]) return LABELS[path];
    if (!/^\/realisations\/[^/]+$/.test(path)) return '';
    var card = a.closest('.case');
    var t = card && card.querySelector('.case__t');
    if (t) return t.textContent.trim();
    var span = a.closest('.proj__nav') && a.querySelector('span');
    if (span && span.lastChild && span.lastChild.nodeType === 3) return span.lastChild.nodeValue.trim();
    return 'Réalisations';
  }
  var curtain = null;
  function leaveTo(href, label) {
    if (curtain) return;
    curtain = doc.createElement('div');
    curtain.className = 'curtain';
    curtain.setAttribute('aria-hidden', 'true');
    curtain.innerHTML = '<span class="curtain__t"></span>';
    body.appendChild(curtain);
    scramble(curtain.firstChild, label, 300);
    try { sessionStorage.setItem('drame.curtain', label); } catch (e) { /* noop */ }
    var go = function () { location.href = href; };
    var safety = setTimeout(go, 520);
    curtain.animate([{ transform: 'translate3d(0,100%,0)' }, { transform: 'translate3d(0,0,0)' }], { duration: 330, easing: EASE_IO, fill: 'both' })
      .finished.then(function () { clearTimeout(safety); go(); }, go);
  }
  if (Element.prototype.animate) {
    doc.addEventListener('click', function (e) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var a = e.target.closest && e.target.closest('a[href]');
      if (!a || (a.target && a.target !== '_self') || a.hasAttribute('download') || a.hasAttribute('data-switch-adventure')) return;
      var url;
      try { url = new URL(a.href, location.href); } catch (err) { return; }
      if (url.origin !== location.origin) return;
      if (/\.(pdf|png|jpe?g|webp|svg|zip)$/i.test(url.pathname) || /^\/(aventure|construire-projet)/.test(url.pathname)) return;
      if (url.pathname === location.pathname && url.search === location.search) return;   // ancre de la page
      var label = labelFor(a, url);
      if (!label) return;
      e.preventDefault();
      leaveTo(url.href, label);
    });
    // Retour arrière : la page revient du cache, sans son rideau.
    addEventListener('pageshow', function (e) {
      if (!e.persisted || !curtain) return;
      curtain.remove();
      curtain = null;
      try { sessionStorage.removeItem('drame.curtain'); } catch (err) { /* noop */ }
    });
    // Page suivante préchargée quand le pointeur s'attarde sur un lien.
    if (window.HTMLScriptElement && HTMLScriptElement.supports && HTMLScriptElement.supports('speculationrules')) {
      var rules = doc.createElement('script');
      rules.type = 'speculationrules';
      rules.textContent = JSON.stringify({ prefetch: [{
        where: { and: [{ href_matches: '/*' }, { not: { href_matches: '/assets/*' } }, { not: { href_matches: '/aventure*' } }, { not: { selector_matches: '[target=_blank]' } }] },
        eagerness: 'moderate',
      }] });
      body.appendChild(rules);
    }
  }

  // ══ Confettis (formulaire envoyé) ═════════════════════
  // Deux gerbes depuis les coins bas, aux couleurs du site. Canvas posé le
  // temps de l'animation (3 s environ), puis retiré.
  function confetti() {
    var c = doc.createElement('canvas');
    if (!c.getContext) return;
    var W = innerWidth, H = innerHeight, dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.className = 'confetti';
    c.setAttribute('aria-hidden', 'true');
    c.width = W * dpr; c.height = H * dpr;
    body.appendChild(c);
    var ctx = c.getContext('2d');
    var COLORS = ['#2d45f5', '#7d8bff', '#ff9a62', '#a996ff', '#34d399', '#121212'];
    var parts = [], k = Math.sqrt(H / 900);
    function burst(x, dir, n) {
      for (var i = 0; i < n; i++) {
        var ang = (dir > 0 ? -62 : -118) * Math.PI / 180 + (Math.random() - .5) * .7;
        var sp = (13 + Math.random() * 11) * k;
        parts.push({
          x: x, y: H + 10, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp,
          r: Math.random() * 6.28, vr: (Math.random() - .5) * .35, t: Math.random() * 6.28, vt: .08 + Math.random() * .18,
          w: 6 + Math.random() * 6, h: 9 + Math.random() * 8, c: COLORS[(Math.random() * COLORS.length) | 0],
        });
      }
    }
    burst(0, 1, 70); burst(W, -1, 70);
    setTimeout(function () { burst(0, 1, 35); burst(W, -1, 35); }, 260);
    var prev = performance.now(), start = prev;
    (function frame(now) {
      var f = Math.min((now - prev) / 16.67, 3);
      prev = now;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, c.width, c.height);
      var alive = 0;
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i];
        p.vy += .34 * f; p.vx *= Math.pow(.985, f); p.vy *= Math.pow(.985, f);
        p.x += p.vx * f; p.y += p.vy * f; p.r += p.vr * f; p.t += p.vt * f;
        if (p.y > H + 40) continue;
        alive++;
        var cos = Math.cos(p.r), sin = Math.sin(p.r), sy = Math.cos(p.t);
        ctx.setTransform(cos * dpr, sin * dpr, -sin * sy * dpr, cos * sy * dpr, p.x * dpr, p.y * dpr);
        ctx.fillStyle = p.c;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      }
      if ((alive || now - start < 400) && now - start < 4500) raf(frame);
      else c.remove();
    })(prev);
  }
  window.FX = { confetti: confetti, scramble: scramble };

  // Curseur : mini sabre en CSS pur (css/fx.css), rien à faire ici.

  // ══ Menu et nom : texte brouillé au survol ════════════
  if (mouse) {
    doc.querySelectorAll('.nav > a').forEach(function (a) {
      if (a.children.length) return;           // liens avec icône : tels quels
      var text = a.textContent.trim();
      // Le fantôme (invisible) garde la largeur du mot : rien ne bouge.
      a.innerHTML = '<span class="scr"><span class="scr__g" aria-hidden="true">' + esc(text) + '</span><span class="scr__t">' + esc(text) + '</span></span>';
      var live = a.querySelector('.scr__t');
      a.addEventListener('pointerenter', function () { scramble(live, text, 420); });
    });
    var job = doc.querySelector('.topbar .brand__job[data-alt]');
    var brand = job && job.closest('.brand');
    if (brand) {
      var base = job.textContent, alts = job.getAttribute('data-alt').split('|'), k = 0;
      brand.addEventListener('pointerenter', function () { scramble(job, alts[k++ % alts.length], 560); });
      brand.addEventListener('pointerleave', function () { scramble(job, base, 420); });
    }
  }

  if (!('IntersectionObserver' in window)) return;

  // ══ Apparitions au défilement ═════════════════════════
  var REVEAL = [
    '.sec__head > *', '.problem', '.offer', '.care', '.rail__track', '.process__s', '.about__photo', '.about__txt > *', '.adv',
    '.faq__i', '.cta__in > *', '.way', '.block__t', '.block__lead', '.proj__media', '.proj__s', '.shots > *', '.cat',
    '.free', '.orbit__form', '.tl__list > li', '.about-page > *', '.sec__more', '.legal > *', '.cta__row > *',
  ].join(',');
  // Titres et chapeaux : mot à mot, flous puis nets.
  var WORDS = '.sec__t, .block__t, .sec__lead, .block__lead';
  // Téléphone : une rangée qui défile au doigt apparaît d'un bloc (ses cartes
  // hors écran sur le côté n'attendent pas d'être balayées pour s'afficher).
  var narrow = matchMedia('(max-width: 699px)').matches;
  var fold = innerHeight * 0.94;
  var targets = Array.prototype.filter.call(doc.querySelectorAll(REVEAL + (narrow ? ',.swipe-wrap' : '')), function (el) {
    if (narrow && el.closest('.swipe')) return false;
    return !el.closest('.hero, .phead') && el.getBoundingClientRect().top > fold;
  });

  // Découpe en mots : les nœuds de texte seulement ; un élément intérieur
  // (compteur, icône) compte pour un mot. Le titre garde son nom lisible.
  function splitWords(el) {
    var n = 0;
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (c) {
        if (c.nodeType === 3) {
          var frag = doc.createDocumentFragment();
          c.nodeValue.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(doc.createTextNode(part)); return; }
            var s = doc.createElement('span');
            s.className = 'bw';
            s.style.setProperty('--i', n++);
            s.textContent = part;
            frag.appendChild(s);
          });
          c.parentNode.replaceChild(frag, c);
        } else if (c.nodeType === 1) {
          if (c.matches('svg, .ico, .rail__n, br')) { c.classList.add('bw'); c.style.setProperty('--i', n++); }
          else walk(c);
        }
      });
    })(el);
  }

  // Décalage en cascade entre éléments frères
  targets.forEach(function (el) {
    var sibs = Array.prototype.filter.call(el.parentNode.children, function (c) { return targets.indexOf(c) >= 0; });
    var i = sibs.indexOf(el);
    el.style.setProperty('--d', (Math.min(i, 4) * 0.06).toFixed(2) + 's');
    if (el.matches(WORDS)) {
      if (/^H\d$/.test(el.tagName) && !el.hasAttribute('aria-label')) el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());
      splitWords(el);
      el.classList.add('rv--w');
    }
    el.classList.add('rv');
  });
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      io.unobserve(e.target);
      // Une fois apparu, le délai ne doit plus freiner le survol.
      setTimeout(function () { e.target.style.removeProperty('--d'); }, 1800);
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

  // ══ Lumière qui suit le pointeur sur les cartes ═══════
  if (fine) {
    var CARDS = '.problem, .offer, .case, .care, .way, .faq__i, .proj__s, .cat, .form-card, .free';
    doc.querySelectorAll(CARDS).forEach(function (c) { c.classList.add('spot'); });
    var spotEv = null;
    var spotFrame = function () {
      var e = spotEv;
      spotEv = null;
      var c = e.target.closest && e.target.closest('.spot');
      if (!c) return;
      var r = c.getBoundingClientRect();
      c.style.setProperty('--mx', (e.clientX - r.left).toFixed(0) + 'px');
      c.style.setProperty('--my', (e.clientY - r.top).toFixed(0) + 'px');
    };
    doc.addEventListener('pointermove', function (e) {
      if (!spotEv) raf(spotFrame);
      spotEv = e;
    }, { passive: true });

    // Boutons magnétiques
    doc.querySelectorAll('[data-magnet]').forEach(function (b) {
      var r = null;
      b.addEventListener('pointerenter', function () { r = b.getBoundingClientRect(); });
      b.addEventListener('pointermove', function (e) {
        if (!r) r = b.getBoundingClientRect();
        var x = (e.clientX - r.left - r.width / 2) * 0.22;
        var y = (e.clientY - r.top - r.height / 2) * 0.35;
        b.style.translate = x.toFixed(1) + 'px ' + y.toFixed(1) + 'px';
      });
      b.addEventListener('pointerleave', function () { b.style.translate = ''; r = null; });
    });
  }

  // ══ Hero ══════════════════════════════════════════════
  var hero = doc.querySelector('[data-hero]');
  var heroOn = false;
  if (hero) {
    var spot = hero.querySelector('.hero__spot');
    var ghost = hero.querySelector('.ghost');
    var stage = hero.querySelector('[data-tilt]');
    var txt = hero.querySelector('.hero__txt');
    var vis = hero.querySelector('.hero__vis');
    var tx = 0, ty = 0, cx = 0, cy = 0, sx = 0, sy = 0, psx = 0, psy = 0, gsx = 0, gsy = 0, moving = 0;

    // Sol quadrillé en perspective, dessiné dans un canvas. Les lignes de
    // fuite ne bougent pas : cuites une fois dans un tampon (avec le
    // fondu). À chaque image : le tampon + une douzaine de lignes
    // horizontales qui avancent vers le visiteur.
    var floorEl = hero.querySelector('.hero__floor');
    var floor = null;
    if (floorEl && doc.createElement('canvas').getContext) {
      floor = (function () {
        var cv = doc.createElement('canvas');
        var ctx = cv.getContext('2d');
        floorEl.classList.add('hero__floor--c');
        floorEl.appendChild(cv);
        var color = getComputedStyle(root).getPropertyValue('--accent').trim() || '#2d45f5';
        var W = 0, H = 0, dpr = 1, VY = 0, K = 0, S = 0, buf = null, run = 0, t0 = performance.now();
        var fade = function (y) {            // 1 en bas, 0 en haut (comme l'ancien masque)
          var t = (H - y) / H;
          return t < 0.35 ? 1 - t / 0.35 * 0.25 : Math.max(0, 0.75 * (1 - (t - 0.35) / 0.55));
        };
        function size() {
          var w = floorEl.clientWidth, h = floorEl.clientHeight;
          if (!w || !h) return;
          dpr = Math.min(window.devicePixelRatio || 1, 1.5);
          W = w; H = h;
          cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
          VY = -1.2 * H;                      // point de fuite, au-dessus du canvas
          K = H - VY;                         // y = VY + K / profondeur
          S = Math.min(72, W / 11) / K;       // pas de la grille (cases carrées en bas)
          // Lignes de fuite + fondu, une fois.
          buf = doc.createElement('canvas');
          buf.width = cv.width; buf.height = cv.height;
          var b = buf.getContext('2d');
          b.setTransform(dpr, 0, 0, dpr, 0, 0);
          b.strokeStyle = color; b.lineWidth = 1.5; b.globalAlpha = 0.2;
          var cxm = W / 2, dTop = K / (0 - VY), n = Math.ceil((W / 2) * dTop / (K * S)) + 1;
          b.beginPath();
          for (var i = -n; i <= n; i++) {
            b.moveTo(cxm + i * S * K, H);
            b.lineTo(cxm + i * S * K / dTop, 0);
          }
          b.stroke();
          b.globalAlpha = 1;
          b.globalCompositeOperation = 'destination-in';
          var g = b.createLinearGradient(0, H, 0, 0);
          g.addColorStop(0, '#000'); g.addColorStop(0.35, 'rgba(0,0,0,.75)'); g.addColorStop(0.9, 'transparent');
          b.fillStyle = g;
          b.fillRect(0, 0, W, H);
          draw(performance.now());
        }
        function draw(now) {
          if (!buf) return;
          ctx.setTransform(1, 0, 0, 1, 0, 0);
          ctx.clearRect(0, 0, cv.width, cv.height);
          ctx.drawImage(buf, 0, 0);
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          ctx.strokeStyle = color;
          var phase = ((now - t0) / 3200) % 1, dTop = K / (0 - VY);
          for (var k = 0; ; k++) {
            var d = 1 + (k + 1 - phase) * S;
            if (d > dTop) break;
            var y = VY + K / d;
            var a = fade(y);
            if (a <= 0.01) continue;
            ctx.globalAlpha = 0.2 * a;
            ctx.lineWidth = 1.5 / d;
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
          }
          ctx.globalAlpha = 1;
        }
        function loop(now) { draw(now); run = raf(loop); }
        if (window.ResizeObserver) new ResizeObserver(size).observe(floorEl);
        size();
        return {
          start: function () { if (!run && !doc.hidden) run = raf(loop); },
          stop: function () { cancelAnimationFrame(run); run = 0; },
        };
      })();
      doc.addEventListener('visibilitychange', function () { if (doc.hidden) floor.stop(); else if (heroOn) floor.start(); });
    }
    hero.__floor = floor;

    var frame = function () {
      cx += (tx - cx) * 0.08; cy += (ty - cy) * 0.08;
      psx += (sx - psx) * 0.12; psy += (sy - psy) * 0.12;
      // Les mots fantômes traînent un peu plus : effet liquide.
      gsx += (sx - gsx) * 0.07; gsy += (sy - gsy) * 0.07;
      if (stage) stage.style.transform = 'rotateY(' + (-16 + cx * 14).toFixed(2) + 'deg) rotateX(' + (7 - cy * 10).toFixed(2) + 'deg)';
      if (spot) spot.style.transform = 'translate3d(' + psx.toFixed(0) + 'px,' + psy.toFixed(0) + 'px,0)';
      if (ghost) { ghost.style.setProperty('--gx', gsx.toFixed(0) + 'px'); ghost.style.setProperty('--gy', gsy.toFixed(0) + 'px'); }
      var still = Math.abs(tx - cx) + Math.abs(ty - cy) < 0.002 && Math.abs(sx - psx) + Math.abs(sy - psy) < 0.5 && Math.abs(sx - gsx) + Math.abs(sy - gsy) < 0.5;
      moving = still ? 0 : raf(frame);
    };
    if (fine) {
      hero.addEventListener('pointermove', function (e) {
        var r = hero.getBoundingClientRect();
        tx = (e.clientX - r.left) / r.width - 0.5;
        ty = (e.clientY - r.top) / r.height - 0.5;
        sx = e.clientX - r.left; sy = e.clientY - r.top;
        if (!hero.classList.contains('is-lit')) { psx = gsx = sx; psy = gsy = sy; hero.classList.add('is-lit'); }
        if (!moving) moving = raf(frame);
      }, { passive: true });
      hero.addEventListener('pointerleave', function () {
        tx = ty = 0; hero.classList.remove('is-lit');
        if (!moving) moving = raf(frame);
      });
    }

    // Recul au défilement : le texte s'efface, la scène descend.
    var heroH = 1;
    var heroScroll = function (y) {
      var p = clamp(y / heroH, 0, 1);
      if (txt) { txt.style.transform = 'translate3d(0,' + (-p * 70).toFixed(1) + 'px,0)'; txt.style.opacity = (1 - p * 0.85).toFixed(3); }
      if (vis) vis.style.transform = 'translate3d(0,' + (p * 60).toFixed(1) + 'px,0) scale(' + (1 - p * 0.06).toFixed(3) + ')';
    };
    hero.__scroll = heroScroll;
    hero.__measure = function () { heroH = hero.offsetHeight || 1; };
  }

  // ══ Méthode : frise ═══════════════════════════════════
  // Géométrie lue au chargement et au redimensionnement ; au défilement,
  // une seule lecture (la position de la frise), puis les écritures.
  var proc = doc.querySelector('[data-process]');
  var steps = proc ? Array.prototype.slice.call(proc.querySelectorAll('.process__s')) : [];
  var procOn = false, procH = 1, stepTops = [];
  function procMeasure() {
    if (!proc) return;
    procH = proc.offsetHeight || 1;
    var top = proc.getBoundingClientRect().top;
    stepTops = steps.map(function (s) { return s.getBoundingClientRect().top - top; });
    // Frise verticale : la ligne s'arrête au centre du dernier numéro.
    var last = steps[steps.length - 1];
    if (last) proc.style.setProperty('--tail', (procH - last.offsetTop - 23) + 'px');
  }
  function procScroll(vh) {
    if (!proc || !procOn) return;
    var line = vh * 0.72;
    var top = proc.getBoundingClientRect().top;
    proc.style.setProperty('--p', clamp((line - top) / procH, 0, 1).toFixed(3));
    steps.forEach(function (s, i) { s.classList.toggle('on', top + stepTops[i] < line); });
  }

  // ══ Barre de progression + barre du haut ══════════════
  var bar = doc.createElement('div');
  bar.className = 'fx-progress';
  bar.setAttribute('aria-hidden', 'true');
  body.appendChild(bar);
  var topbar = doc.querySelector('.topbar');

  // Barre de progression et recul du hero : liés au défilement en CSS pur
  // quand le navigateur le permet (fluide, sans JavaScript à chaque image).
  var cssBar = !!(window.CSS && CSS.supports && CSS.supports('animation-timeline', 'scroll()'));
  var cssHero = cssBar && CSS.supports('animation-range', 'exit-crossing 0% exit-crossing 100%');
  if (cssBar) root.classList.add('fx-sbar');
  if (cssHero) root.classList.add('fx-shero');
  var maxY = 1, vh = innerHeight, lastY = -1;
  function measure() {
    vh = innerHeight;
    maxY = root.scrollHeight - vh;
    if (hero && !cssHero) hero.__measure();
    procMeasure();
    lastY = -1;
  }
  function paint() {
    var y = scrollY;
    if (y === lastY) return;
    lastY = y;
    if (!cssBar) bar.style.transform = 'scaleX(' + (maxY > 0 ? clamp(y / maxY, 0, 1) : 0).toFixed(4) + ')';
    if (topbar) topbar.classList.toggle('is-scrolled', y > 24);
    if (hero && heroOn && !cssHero) hero.__scroll(y);
    procScroll(vh);
  }
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    raf(function () { ticking = false; paint(); });
  }
  var resizing = 0;
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', function () {
    cancelAnimationFrame(resizing);
    resizing = raf(function () { measure(); paint(); });
  }, { passive: true });
  // La page s'allonge quand les images arrivent : on remesure.
  addEventListener('load', function () { measure(); paint(); });
  if (window.ResizeObserver) new ResizeObserver(function () { maxY = root.scrollHeight - innerHeight; }).observe(body);

  // ══ Boucles en pause hors écran ═══════════════════════
  var pause = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      e.target.classList.toggle('is-off', !e.isIntersecting);
      if (e.target === hero) {
        heroOn = e.isIntersecting;
        if (hero.__floor) hero.__floor[heroOn ? 'start' : 'stop']();
      }
      if (e.target === proc) { procOn = true; procScroll(vh); procOn = e.isIntersecting; }
    });
  });
  doc.querySelectorAll('[data-hero], .ticker, .cta, .orbit').forEach(function (el) { pause.observe(el); });
  if (proc) pause.observe(proc);
  heroOn = !!hero;

  root.classList.add('fxr');
  measure();
  paint();
})();
