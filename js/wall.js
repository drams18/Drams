/* ══════════════════════════════════════════════════════
   WALL.JS : Mur des réalisations (page /realisations, ordinateur).
   Toutes les captures des projets sur un plan sans fin que l'on fait
   glisser à la souris, avec de l'inertie au lâcher. Styles : css/wall.css.
   Données : <script id="wall-data"> écrit par scripts/build-site.mjs.

   Principe : un « motif » (les cartes rangées en colonnes équilibrées,
   exactement aussi hautes les unes que les autres) est répété en copies
   autour de la vue. On ne déplace qu'un seul calque (transform) par image ;
   les copies sont recyclées quand elles sortent de la vue.

   Accessibilité : une seule copie (la plus centrée) est lisible et
   atteignable au clavier ; une carte qui reçoit le focus est amenée au
   centre ; les flèches du clavier déplacent le mur. Les carrousels
   (bouton « Liste ») restent la version complète, et la seule sur
   téléphone, sans JavaScript ou sans souris.
   ══════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var doc = document;
  var root = doc.documentElement;
  var sec = doc.querySelector('[data-wall]');
  var dataEl = doc.getElementById('wall-data');
  var views = doc.querySelector('[data-views]');
  if (!sec || !dataEl || !views) return;
  if (!matchMedia('(min-width: 900px) and (hover: hover) and (pointer: fine)').matches) return;
  var data;
  try { data = JSON.parse(dataEl.textContent); } catch (e) { return; }

  var still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var raf = window.requestAnimationFrame.bind(window);
  var view = sec.querySelector('.wall__view');
  var field = sec.querySelector('.wall__field');
  var dots = sec.querySelector('.wall__dots');
  var filters = sec.querySelectorAll('[data-filter]');
  var KEY = 'drame.realisations.vue';
  var CARD = 340, GAP = 44, DOT = 26, CHROME = 22, PAD = 16, PHONE_GAP = 12;
  var PHONE_W = (CARD - 2 - 2 * PAD - PHONE_GAP) / 2;

  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var mod = function (a, n) { return ((a % n) + n) % n; };
  var rnd = function (i) { var x = Math.sin(i * 12.9898 + 4.1) * 43758.5453; return x - Math.floor(x); };

  // ── Motif ─────────────────────────────────────────────
  // Les captures d'un même projet ne se suivent pas (tour à tour).
  function interleave(tiles) {
    var by = {}, order = [], out = [];
    tiles.forEach(function (t) {
      if (!by[t.slug]) { by[t.slug] = []; order.push(t.slug); }
      by[t.slug].push(t);
    });
    for (var r = 0; out.length < tiles.length; r++) {
      order.forEach(function (s) { if (by[s][r]) out.push(by[s][r]); });
    }
    return out;
  }
  function heightOf(t) {
    if (t.phone) return 2 + 2 * PAD + Math.max.apply(null, t.imgs.map(function (im) { return PHONE_W * im.h / im.w; }));
    return 2 + CHROME + (CARD - 2) * t.imgs[0].h / t.imgs[0].w;
  }
  // Colonnes remplies au plus court, puis l'écart de chaque colonne est
  // ajusté pour qu'elles fassent toutes la hauteur du motif : en le
  // répétant, rien ne se chevauche et aucun trou n'apparaît.
  function layout(tiles) {
    var cols = Math.max(2, Math.min(6, Math.round(Math.sqrt(tiles.length * 1.1))));
    var h = [], lists = [], c;
    for (c = 0; c < cols; c++) { h.push(0); lists.push([]); }
    tiles.forEach(function (t) {
      var best = 0;
      for (var k = 1; k < cols; k++) if (h[k] < h[best]) best = k;
      var th = Math.round(heightOf(t));
      lists[best].push({ t: t, h: th });
      h[best] += th + GAP;
    });
    var PH = Math.max.apply(null, h);
    var items = [];
    lists.forEach(function (list, col) {
      if (!list.length) return;
      var used = list.reduce(function (s, x) { return s + x.h; }, 0);
      var gap = (PH - used) / list.length;
      var y = (col % 2) * 70 + (col % 3) * 24;
      list.forEach(function (x) {
        var n = items.length;
        items.push({
          t: x.t, h: x.h,
          x: Math.round(col * (CARD + GAP) + (rnd(n) - 0.5) * 18),
          y: Math.round(y),
          rot: ((rnd(n + 50) - 0.5) * 2.6).toFixed(2),
        });
        y += x.h + gap;
      });
    });
    return { PW: cols * (CARD + GAP), PH: Math.round(PH), items: items };
  }
  function cardHTML(it, k) {
    var t = it.t;
    var imgs = t.imgs.map(function (im) {
      return '<img src="' + esc(im.src) + '" alt="" width="' + im.w + '" height="' + im.h + '" loading="lazy" decoding="async" draggable="false">';
    }).join('');
    return '<a class="wall__card wall__card--' + (t.phone ? 'phone' : 'web') + '" href="' + esc(t.href) + '" data-cursor="Voir" draggable="false"' +
      ' style="left:' + it.x + 'px;top:' + it.y + 'px;height:' + it.h + 'px;rotate:' + it.rot + 'deg;--k:' + k + '">' +
      (t.phone ? '' : '<span class="wall__chrome" aria-hidden="true"><i></i><i></i><i></i></span>') + imgs +
      '<span class="wall__cap"><span class="wall__t">' + esc(t.title) + '</span><span class="wall__l">' + esc(t.label) + '</span></span></a>';
  }

  // ── Copies du motif autour de la vue ──────────────────
  var lay = null, html = '', slots = {}, pool = [], mainKey = null;
  var ox = 0, oy = 0, vx = 0, vy = 0, loop = 0, glideTo = null;

  function mark(el, on) {
    if (el.__main === on) return;
    el.__main = on;
    if (on) el.removeAttribute('aria-hidden'); else el.setAttribute('aria-hidden', 'true');
    el.querySelectorAll('a').forEach(function (a) { if (on) a.removeAttribute('tabindex'); else a.setAttribute('tabindex', '-1'); });
  }
  function newCopy() {
    var el = doc.createElement('div');
    el.className = 'wall__copy';
    el.innerHTML = html;
    el.__main = true;
    mark(el, false);
    field.appendChild(el);
    return el;
  }
  function render() {
    if (!lay) return;
    var vw = view.clientWidth, vh = view.clientHeight, M = 160;
    var PW = lay.PW, PH = lay.PH;
    field.style.transform = 'translate3d(' + ox.toFixed(1) + 'px,' + oy.toFixed(1) + 'px,0)';
    dots.style.transform = 'translate3d(' + (mod(ox, DOT) - DOT).toFixed(1) + 'px,' + (mod(oy, DOT) - DOT).toFixed(1) + 'px,0)';
    var i0 = Math.floor((-M - ox) / PW) - 1, i1 = Math.floor((vw + M - ox) / PW);
    var j0 = Math.floor((-M - oy) / PH) - 1, j1 = Math.floor((vh + M - oy) / PH);
    var need = {}, k, i, j;
    for (i = i0; i <= i1; i++) for (j = j0; j <= j1; j++) need[i + ',' + j] = [i, j];
    for (k in slots) if (!need[k]) { slots[k].hidden = true; pool.push(slots[k]); delete slots[k]; }
    for (k in need) {
      if (slots[k]) continue;
      var el = pool.pop() || newCopy();
      el.hidden = false;
      el.style.transform = 'translate3d(' + need[k][0] * PW + 'px,' + need[k][1] * PH + 'px,0)';
      slots[k] = el;
    }
  }
  // Copie la plus centrée = la seule lisible au clavier et par les lecteurs
  // d'écran (pas pendant que le focus est dans le mur).
  function settle() {
    if (!lay || field.contains(doc.activeElement)) return;
    var vw = view.clientWidth, vh = view.clientHeight, best = null, bd = Infinity;
    Object.keys(slots).forEach(function (k) {
      var ij = k.split(',');
      var dx = +ij[0] * lay.PW + ox + lay.PW / 2 - vw / 2, dy = +ij[1] * lay.PH + oy + lay.PH / 2 - vh / 2;
      var d = dx * dx + dy * dy;
      if (d < bd) { bd = d; best = k; }
    });
    if (best === mainKey) return;
    mainKey = best;
    Object.keys(slots).forEach(function (k) { mark(slots[k], k === best); });
    pool.forEach(function (el) { mark(el, false); });
  }

  // ── Mouvement : glisser, inertie, aller vers un point ──
  function run() { if (!loop) loop = raf(step); }
  var prev = 0;
  function step(now) {
    var f = prev ? Math.min((now - prev) / 16.67, 3) : 1;
    prev = now;
    var go = false;
    if (glideTo) {
      var k = 1 - Math.pow(1 - 0.14, f);
      ox += (glideTo[0] - ox) * k; oy += (glideTo[1] - oy) * k;
      if (Math.abs(glideTo[0] - ox) + Math.abs(glideTo[1] - oy) < 0.5) { ox = glideTo[0]; oy = glideTo[1]; glideTo = null; }
      else go = true;
    } else if (!drag) {
      var fr = Math.pow(0.93, f);
      vx *= fr; vy *= fr;
      ox += vx * f; oy += vy * f;
      go = Math.abs(vx) + Math.abs(vy) > 0.15;
    }
    render();
    if (go) loop = raf(step);
    else { loop = 0; prev = 0; if (!drag) settle(); }
  }
  function glide(x, y) {
    vx = vy = 0;
    if (still) { ox = x; oy = y; render(); settle(); return; }
    glideTo = [x, y];
    run();
  }

  var drag = null, suppress = false;
  view.addEventListener('pointerdown', function (e) {
    if (e.button !== 0 || e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
    drag = { lx: e.clientX, ly: e.clientY, t: performance.now(), moved: 0, on: false, id: e.pointerId };
    vx = vy = 0; glideTo = null; suppress = false;
  });
  view.addEventListener('pointermove', function (e) {
    if (!drag || e.pointerId !== drag.id) return;
    var dx = e.clientX - drag.lx, dy = e.clientY - drag.ly;
    var now = performance.now(), dt = Math.max(1, now - drag.t);
    drag.moved += Math.abs(dx) + Math.abs(dy);
    drag.lx = e.clientX; drag.ly = e.clientY; drag.t = now;
    if (!drag.on) {
      if (drag.moved < 5) return;
      drag.on = true;
      view.setPointerCapture(e.pointerId);
      sec.classList.add('is-dragging', 'is-touched');
    }
    ox += dx; oy += dy;
    // Élan lissé, plafonné (un geste très vif ne doit pas faire filer le mur).
    vx = Math.max(-70, Math.min(70, vx * 0.6 + dx / dt * 16 * 0.4));
    vy = Math.max(-70, Math.min(70, vy * 0.6 + dy / dt * 16 * 0.4));
    render();
  });
  function end(e) {
    if (!drag || (e && e.pointerId !== drag.id)) return;
    var was = drag.on, idle = performance.now() - drag.t;
    drag = null;
    sec.classList.remove('is-dragging');
    if (!was) return;
    suppress = true;                       // ce n'était pas un clic
    if (idle > 90 || still) vx = vy = 0;   // lâché à l'arrêt : pas d'élan
    run();
  }
  view.addEventListener('pointerup', end);
  view.addEventListener('pointercancel', end);
  view.addEventListener('lostpointercapture', end);
  view.addEventListener('click', function (e) {
    if (!suppress) return;
    suppress = false;
    e.preventDefault();
    e.stopPropagation();
  }, true);
  view.addEventListener('dragstart', function (e) { e.preventDefault(); });

  // Pavé tactile : un balayage horizontal déplace le mur ; la molette
  // verticale fait toujours défiler la page.
  view.addEventListener('wheel', function (e) {
    if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
    e.preventDefault();
    sec.classList.add('is-touched');
    vx = vy = 0; glideTo = null;
    ox -= e.deltaX;
    render();
    clearTimeout(view.__wheel);
    view.__wheel = setTimeout(settle, 160);
  }, { passive: false });

  // Clavier : flèches ; une carte atteinte au Tab vient au centre.
  view.addEventListener('keydown', function (e) {
    var d = { ArrowLeft: [1, 0], ArrowRight: [-1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] }[e.key];
    if (!d) return;
    e.preventDefault();
    sec.classList.add('is-touched');
    glide((glideTo ? glideTo[0] : ox) + d[0] * 260, (glideTo ? glideTo[1] : oy) + d[1] * 220);
  });
  field.addEventListener('focusin', function (e) {
    var card = e.target.closest('.wall__card');
    if (!card) return;
    var r = card.getBoundingClientRect(), v = view.getBoundingClientRect();
    glide(ox + (v.left + v.width / 2) - (r.left + r.width / 2), oy + (v.top + v.height / 2) - (r.top + r.height / 2));
  });
  field.addEventListener('focusout', function () { setTimeout(settle, 0); });

  // ── Construction (et filtre) ──────────────────────────
  var current = null;
  function build(group) {
    current = group;
    var tiles = interleave(data.tiles.filter(function (t) { return !group || t.group === group; }));
    lay = layout(tiles);
    html = lay.items.map(cardHTML).join('');
    Object.keys(slots).forEach(function (k) { slots[k].remove(); });
    pool.forEach(function (el) { el.remove(); });
    slots = {}; pool = []; mainKey = null;
    ox = Math.round((view.clientWidth - lay.PW) / 2);
    oy = Math.round((view.clientHeight - lay.PH) / 2);
    vx = vy = 0; glideTo = null;
    if (!still) {
      sec.classList.add('is-entering');
      clearTimeout(sec.__enter);
      sec.__enter = setTimeout(function () { sec.classList.remove('is-entering'); }, 1600);
    }
    render();
    settle();
  }
  function setFilter(group) {
    if (group === current) return;
    filters.forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-filter') === group ? 'true' : 'false'); });
    if (still || !field.animate) { build(group); return; }
    field.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 180, fill: 'forwards' }).finished.then(function () {
      build(group);
      field.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 280, fill: 'forwards' });
    });
  }
  filters.forEach(function (b) {
    b.addEventListener('click', function () { setFilter(b.getAttribute('data-filter')); });
  });

  // ── Mur / Liste ───────────────────────────────────────
  var buttons = views.querySelectorAll('[data-view]');
  function setView(v) {
    var wall = v !== 'liste';
    sec.hidden = !wall;
    root.classList.toggle('is-wall', wall);
    buttons.forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-view') === (wall ? 'mur' : 'liste') ? 'true' : 'false'); });
    try { localStorage.setItem(KEY, wall ? 'mur' : 'liste'); } catch (e) { /* noop */ }
    if (wall && current === null) build('');
    else if (wall) render();
  }
  buttons.forEach(function (b) {
    b.addEventListener('click', function () { setView(b.getAttribute('data-view')); });
  });
  var saved = null;
  try { saved = localStorage.getItem(KEY); } catch (e) { /* noop */ }
  views.hidden = false;
  setView(saved === 'liste' ? 'liste' : 'mur');

  addEventListener('resize', function () { if (!sec.hidden) { render(); settle(); } }, { passive: true });
})();
