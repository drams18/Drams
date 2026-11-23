/* ══════════════════════════════════════════════════════
   TARIFS.JS : page /tarifs.
   Tout le contenu est écrit en HTML par scripts/build-site.mjs (lisible
   sans JavaScript et par Google). Ce script ajoute :
     • les anciennes adresses (#professionnels/site-pro, #app, #offres…)
       redirigées vers le parcours ou la famille qui les remplace
     • la recherche du haut : résultats juste en dessous (copies des
       tuiles), synonymes (js/tarifs-data.js) chargés au premier focus
     • le panneau de détail (<dialog>) quand on ouvre une tuile ; sans
       JavaScript, la tuile se déplie sur place (<details>)
     • la barre collante des parcours : parcours en cours allumé
     • l'arrivée dans un parcours (bulle, lien) et sur une tuile ciblée
     • un léger relief des illustrations des bulles sous le pointeur
   ══════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var doc = document;
  var root = doc.documentElement;
  var fx = root.classList.contains('fx');
  var byId = function (id) { return id ? doc.getElementById(id) : null; };

  // ── Anciennes adresses ────────────────────────────────
  // #professionnels/<x> (ancienne page), puis anciennes catégories et
  // sections de la grille (avant les parcours, 23/11/2026).
  var LEGACY = {
    'site-pro': 'site', 'vendre-pro': 'vendre', 'app-pro': 'app', 'modules-pro': 'modules',
    'infra-pro': 'infra', 'suivi-pro': 'suivi', existant: 'deja-un-site', probleme: 'offre-depannage'
  };
  var MOVED = {
    offres: 'pas-de-site', toutes: 'autre-besoin', liste: 'autre-besoin',
    site: 'pas-de-site', vendre: 'pas-de-site-creer', modules: 'deja-un-site-fonctions',
    visibilite: 'deja-un-site-visibilite', design: 'autre-besoin-design', suivi: 'deja-un-site-entretien',
    creatif: 'autre-besoin-creatif', conseil: 'autre-besoin-conseil', app: 'autre-besoin-apps', infra: 'autre-besoin-devops'
  };
  function legacy() {
    var h = decodeURIComponent(location.hash.replace(/^#/, ''));
    if (!h) return;
    var parts = h.split('/');
    var id = h;
    if (parts[0] === 'professionnels' || parts[0] === 'particuliers') id = LEGACY[parts[1]] || parts[1] || '';
    if (!byId(id)) id = MOVED[id] || (MOVED[LEGACY[id]] || '');
    if (id === h) return;
    history.replaceState(null, '', location.pathname + location.search + (byId(id) ? '#' + id : ''));
    var t = byId(id);
    if (t) t.scrollIntoView();
  }
  legacy();
  addEventListener('hashchange', legacy);

  // ── Arrivée : parcours qui s'allume, tuile ciblée ─────
  function restart(el, cls) {
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
  }
  function arrive(id) {
    var t = byId(id);
    if (!t) return;
    if (t.matches('.route')) restart(t, 'is-arrived');
    var tile = t.closest('.tile');
    if (tile) {
      var d = tile.querySelector('.tile__d');
      if (d && root.classList.contains('js')) d.open = false;
      restart(tile, 'is-hit');
    }
  }
  arrive(decodeURIComponent(location.hash.slice(1)));
  addEventListener('hashchange', function () { arrive(decodeURIComponent(location.hash.slice(1))); });

  var head = doc.querySelector('.p-tarifs .phead');
  var input = byId('tarifSearch');

  // Liens internes : un même lien cliqué deux fois rallume l'arrivée ;
  // « Changer de situation » ferme d'abord une recherche en cours ;
  // la loupe de la barre remonte à la recherche et y place le curseur.
  doc.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute('href').slice(1);
    if (id === 'situation' && head && head.classList.contains('is-searching')) clearSearch(false);
    if (id === 'recherche' && input) {
      e.preventDefault();
      byId('recherche').scrollIntoView({ block: 'center' });
      input.focus({ preventScroll: true });
      return;
    }
    if (location.hash === '#' + id) arrive(id);
  });

  // ── Panneau de détail ─────────────────────────────────
  var sheet = byId('tarifSheet');
  var canSheet = sheet && typeof sheet.showModal === 'function';
  if (canSheet) {
    var sIco = sheet.querySelector('.sheet__ico');
    var sWhere = sheet.querySelector('.sheet__where');
    var sTitle = sheet.querySelector('.sheet__t');
    var sPrice = sheet.querySelector('.sheet__p');
    var sBody = sheet.querySelector('.sheet__body');
    var closing = false;

    doc.querySelectorAll('.tile__s').forEach(function (s) { s.setAttribute('aria-haspopup', 'dialog'); });

    var openSheet = function (tile) {
      var b = tile.querySelector('.tile__b');
      var ico = tile.querySelector('.tile__ico svg');
      sIco.innerHTML = '';
      if (ico) sIco.appendChild(ico.cloneNode(true));
      sWhere.textContent = b.getAttribute('data-where') || '';
      sTitle.textContent = tile.querySelector('.tile__n').textContent;
      sPrice.innerHTML = tile.querySelector('.tile__p').innerHTML;
      sBody.innerHTML = '';
      Array.prototype.forEach.call(b.children, function (c) {
        if (!c.classList.contains('tile__go')) sBody.appendChild(c.cloneNode(true));
      });
      sheet.scrollTop = 0;
      closing = false;
      sheet.classList.remove('is-closing');
      sheet.showModal();
    };
    var closeSheet = function () {
      if (!sheet.open || closing) return;
      if (!fx) { sheet.close(); return; }
      closing = true;
      sheet.classList.add('is-closing');
      var done = function () {
        if (!closing) return;
        closing = false;
        sheet.classList.remove('is-closing');
        sheet.close();
      };
      sheet.addEventListener('animationend', function end(e) {
        if (e.target !== sheet) return;
        sheet.removeEventListener('animationend', end);
        done();
      });
      setTimeout(done, 320);
    };

    doc.addEventListener('click', function (e) {
      var s = e.target.closest && e.target.closest('.tile__s');
      if (!s) return;
      e.preventDefault();
      openSheet(s.closest('.tile'));
    });
    sheet.addEventListener('click', function (e) {
      if (e.target === sheet || (e.target.closest && e.target.closest('[data-close]'))) closeSheet();
    });
    sheet.addEventListener('cancel', function (e) { e.preventDefault(); closeSheet(); });
  }

  // ── Barre des parcours ────────────────────────────────
  var bar = doc.querySelector('.switch');
  if (bar && 'IntersectionObserver' in window) {
    var inner = bar.querySelector('.switch__in');
    var links = Array.prototype.slice.call(bar.querySelectorAll('[data-for]'));
    var top = parseFloat(getComputedStyle(root).getPropertyValue('--top')) || 64;
    // Ombre quand la barre colle en haut
    var probe = doc.createElement('div');
    probe.setAttribute('aria-hidden', 'true');
    bar.parentNode.insertBefore(probe, bar);
    new IntersectionObserver(function (en) {
      var e = en[0];
      bar.classList.toggle('is-stuck', !e.isIntersecting && e.boundingClientRect.top < top + 1);
    }, { rootMargin: '-' + (top + 1) + 'px 0px 0px 0px' }).observe(probe);
    // Parcours en cours : celui qui occupe le milieu de l'écran
    var current = null;
    var setOn = function (id) {
      if (id === current) return;
      current = id;
      links.forEach(function (a) {
        var on = a.getAttribute('data-for') === id;
        a.classList.toggle('is-on', on);
        if (on) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current');
        if (on && inner.scrollWidth > inner.clientWidth) {
          inner.scrollTo({ left: a.offsetLeft - (inner.clientWidth - a.offsetWidth) / 2, behavior: fx ? 'smooth' : 'auto' });
        }
      });
    };
    var seen = {};
    var routeIo = new IntersectionObserver(function (en) {
      en.forEach(function (e) { seen[e.target.id] = e.isIntersecting; });
      var on = null;
      links.forEach(function (a) { var id = a.getAttribute('data-for'); if (!on && seen[id]) on = id; });
      setOn(on);
    }, { rootMargin: '-45% 0px -50% 0px' });
    doc.querySelectorAll('.route').forEach(function (r) { routeIo.observe(r); });
  }

  // ── Bulles : boucles en pause hors écran, relief au pointeur ──
  var bubs = doc.querySelector('.bubs');
  if (bubs && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (en) { bubs.classList.toggle('is-off', !en[0].isIntersecting); }).observe(bubs);
  }
  if (bubs && fx && matchMedia('(hover: hover) and (pointer: fine) and (min-width: 760px)').matches) {
    var arts = Array.prototype.slice.call(bubs.querySelectorAll('.bub__disc'));
    var ev = null, boxes = null;
    var frame = function () {
      var e = ev;
      ev = null;
      if (!boxes) boxes = arts.map(function (d) { return d.getBoundingClientRect(); });
      arts.forEach(function (d, i) {
        var r = boxes[i];
        var x = e ? Math.max(-1, Math.min(1, (e.clientX - r.left - r.width / 2) / r.width)) : 0;
        var y = e ? Math.max(-1, Math.min(1, (e.clientY - r.top - r.height / 2) / r.height)) : 0;
        d.querySelector('.bub__art').style.transform = e ? 'translate3d(' + (x * 10).toFixed(1) + 'px,' + (y * 8).toFixed(1) + 'px,0)' : '';
        d.querySelector('.bub__glow').style.transform = e ? 'translate3d(' + (x * -18).toFixed(1) + 'px,' + (y * -14).toFixed(1) + 'px,0) scale(1.08)' : '';
      });
    };
    var list = bubs.querySelector('.bubs__list');
    list.addEventListener('pointermove', function (e) {
      if (!ev) requestAnimationFrame(frame);
      ev = e;
    }, { passive: true });
    list.addEventListener('pointerleave', function () { ev = null; requestAnimationFrame(frame); boxes = null; });
    addEventListener('scroll', function () { boxes = null; }, { passive: true });
    addEventListener('resize', function () { boxes = null; });
  }

  // ── Recherche ─────────────────────────────────────────
  if (!input) return;
  var clear = byId('tarifSearchClear');
  var status = byId('tarifStatus');
  var results = byId('tarifResults');
  var list = byId('tarifList');
  var none = byId('tarifNone');

  var DIACRITICS = new RegExp('[\\u0300-\\u036f]', 'g');
  function norm(s) {
    return String(s == null ? '' : s).toLowerCase().normalize('NFD').replace(DIACRITICS, '')
      .replace(/[^a-z0-9]+/g, ' ').trim();
  }
  var STOP = { de: 1, du: 1, des: 1, la: 1, le: 1, les: 1, un: 1, une: 1, et: 1, ou: 1, en: 1, au: 1, aux: 1,
    sur: 1, dans: 1, par: 1, pour: 1, avec: 1, je: 1, mon: 1, ma: 1, mes: 1, ce: 1, cette: 1, quel: 1, quelle: 1 };
  function tokens(str) { return norm(str).split(' ').filter(function (w) { return w.length >= 2 && !STOP[w]; }); }

  // Une entrée par prestation (la première tuile rencontrée).
  var items = [];
  var byName = {};
  doc.querySelectorAll('.routes .tile[data-search]').forEach(function (li) {
    var name = li.getAttribute('data-name');
    if (byName[name]) return;
    var hay = norm(li.getAttribute('data-search'));
    var title = norm(li.querySelector('.tile__n').textContent + ' ' + name);
    byName[name] = { li: li, hay: hay, words: hay.split(' '), title: title.split(' '), order: items.length };
    items.push(byName[name]);
  });

  // Synonymes : chargés à la demande (même fichier que la grille).
  var SYN = {};
  var loading = false;
  function loadSynonyms() {
    if (loading || window.TarifsData) return;
    loading = true;
    var s = doc.createElement('script');
    s.src = '/js/tarifs-data.js';
    s.onload = function () { SYN = (window.TarifsData && window.TarifsData.SYNONYMS) || {}; if (input.value) run(); };
    doc.head.appendChild(s);
  }
  input.addEventListener('focus', loadSynonyms, { once: true });

  function wordMatch(tok, words) {
    for (var i = 0; i < words.length; i++) {
      var w = words[i];
      if (w === tok || (tok.length >= 3 && w.length > tok.length && w.indexOf(tok) === 0)) return true;
    }
    return false;
  }
  // 0 : absent ; 1 : trouvé (texte, synonyme) ; 3 : dans le nom affiché.
  function score(tok, it) {
    if (wordMatch(tok, it.title)) return 3;
    if (wordMatch(tok, it.words)) return 1;
    var syn = SYN[tok];
    if (syn) for (var i = 0; i < syn.length; i++) {
      var sv = norm(syn[i]);
      if (sv.indexOf(' ') !== -1 ? it.hay.indexOf(sv) !== -1 : wordMatch(sv, it.words)) return 1;
    }
    return 0;
  }

  function copy(it, n) {
    var li = it.li.cloneNode(true);
    li.removeAttribute('id');
    li.classList.remove('tile--top', 'is-hit');
    li.style.setProperty('--n', n);
    var d = li.querySelector('.tile__d');
    d.removeAttribute('id');
    d.open = false;
    var p = li.querySelector('.tile__pitch');
    if (p) p.remove();
    return li;
  }

  var last = '';
  function run() {
    var q = input.value.trim();
    var toks = tokens(q);
    var searching = toks.length > 0;
    clear.hidden = !input.value.length;
    head.classList.toggle('is-searching', searching);
    results.hidden = !searching;
    if (!searching) { status.textContent = ''; list.innerHTML = ''; last = ''; return; }
    var key = toks.join(' ') + '|' + Object.keys(SYN).length;
    if (key === last) return;
    last = key;
    var found = [];
    items.forEach(function (it) {
      var total = 0;
      for (var i = 0; i < toks.length; i++) {
        var s = score(toks[i], it);
        if (!s) return;
        total += s;
      }
      found.push({ it: it, s: total });
    });
    found.sort(function (a, b) { return b.s - a.s || a.it.order - b.it.order; });
    var frag = doc.createDocumentFragment();
    found.forEach(function (f, n) { frag.appendChild(copy(f.it, n)); });
    list.innerHTML = '';
    list.appendChild(frag);
    if (canSheet) list.querySelectorAll('.tile__s').forEach(function (s) { s.setAttribute('aria-haspopup', 'dialog'); });
    none.hidden = found.length > 0;
    status.textContent = found.length
      ? found.length + (found.length > 1 ? ' prestations' : ' prestation') + ' pour « ' + q + ' »'
      : 'Aucune prestation pour « ' + q + ' ».';
  }
  function clearSearch(focus) {
    input.value = '';
    run();
    if (focus) input.focus();
  }

  input.addEventListener('input', run);
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && input.value) { e.preventDefault(); clearSearch(true); }
    // Téléphone : « Rechercher » ferme le clavier, les résultats sont dessous.
    if (e.key === 'Enter') { e.preventDefault(); if (matchMedia('(pointer: coarse)').matches) input.blur(); }
  });
  clear.addEventListener('click', function () { clearSearch(true); });
  doc.querySelectorAll('.finder__chip').forEach(function (b) {
    b.addEventListener('click', function () {
      loadSynonyms();
      input.value = b.getAttribute('data-q');
      run();
      input.focus({ preventScroll: true });
    });
  });
})();
