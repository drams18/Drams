/* ══════════════════════════════════════════════════════
   TARIFS.JS : page /tarifs, une mini boutique.
   Tout le contenu est écrit en HTML par scripts/build-site.mjs (lisible
   sans JavaScript et par Google : les parcours sont sous les bulles).
   Ce script ajoute :
     • la fenêtre des prestations (#shopDlg) : une bulle l'ouvre sur son
       parcours, des onglets passent d'un parcours à l'autre, le panier
       reste à côté (js/panier.js). Les parcours y sont déplacés au
       chargement. Le bouton « retour » du téléphone la ferme.
     • les liens directs (/tarifs#site-vitrine, #offre-…, #pas-de-site)
       et les anciennes adresses (#professionnels/site-pro, #app…) :
       la fenêtre s'ouvre sur le bon parcours, la tuile s'illumine
     • la recherche (dans la fenêtre) : résultats à la place du parcours,
       synonymes (js/tarifs-data.js) chargés au premier focus
     • le panneau de détail (<dialog>) quand on ouvre une tuile ; sans
       JavaScript, la tuile se déplie sur place (<details>)
     • un léger relief des illustrations des bulles sous le pointeur
   Le panier (bouton +, « Ajouter au panier ») est dans js/panier.js :
   l'événement « panier:sync » lui signale les boutons créés ici.
   ══════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var doc = document;
  var root = doc.documentElement;
  var fx = root.classList.contains('fx');
  var byId = function (id) { return id ? doc.getElementById(id) : null; };
  var sync = function () { doc.dispatchEvent(new CustomEvent('panier:sync')); };

  // ── Anciennes adresses ────────────────────────────────
  // #professionnels/<x> (ancienne page), puis anciennes catégories et
  // sections de la grille (avant les parcours, 23/11/2026).
  var LEGACY = {
    'site-pro': 'site', 'vendre-pro': 'vendre', 'app-pro': 'app', 'modules-pro': 'modules',
    'infra-pro': 'infra', 'suivi-pro': 'suivi', existant: 'deja-un-site', probleme: 'offre-depannage'
  };
  // Familles retirées le 23/11/2026 (liste réduite) : vers leur parcours.
  var MOVED = {
    offres: 'pas-de-site', toutes: 'autre-besoin', liste: 'autre-besoin',
    site: 'pas-de-site', vendre: 'pas-de-site', modules: 'deja-un-site-fonctions',
    visibilite: 'deja-un-site-visibilite', design: 'autre-besoin', suivi: 'deja-un-site-entretien',
    creatif: 'autre-besoin', conseil: 'autre-besoin-accompagner', app: 'autre-besoin', infra: 'autre-besoin',
    'deja-un-site-moderniser': 'deja-un-site', 'pas-de-site-creer': 'pas-de-site', 'pas-de-site-demarrer': 'pas-de-site',
    'autre-besoin-apps': 'autre-besoin', 'autre-besoin-ia': 'autre-besoin', 'autre-besoin-creatif': 'autre-besoin',
    'autre-besoin-design': 'autre-besoin', 'autre-besoin-devops': 'autre-besoin', 'autre-besoin-conseil': 'autre-besoin-accompagner'
  };
  // Ancre (sans #) → id présent dans la page, ou ''.
  function resolve(h) {
    if (!h) return '';
    var parts = h.split('/');
    var id = h;
    if (parts[0] === 'professionnels' || parts[0] === 'particuliers') id = LEGACY[parts[1]] || parts[1] || '';
    if (!byId(id)) id = MOVED[id] || MOVED[LEGACY[id]] || '';
    return byId(id) ? id : '';
  }
  function hashId() { return decodeURIComponent(location.hash.replace(/^#/, '')); }

  function restart(el, cls) {
    if (!el) return;
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
  }

  // Fermeture animée commune aux fenêtres (classe .is-closing).
  function animateClose(d, after) {
    if (!d.open || d.__closing) return;
    var done = function () {
      if (!d.__closing) return;
      d.__closing = false;
      d.classList.remove('is-closing');
      d.close();
      if (after) after();
    };
    if (!fx) { d.__closing = true; done(); return; }
    d.__closing = true;
    d.classList.add('is-closing');
    d.addEventListener('animationend', function end(e) {
      if (e.target !== d) return;
      d.removeEventListener('animationend', end);
      done();
    });
    setTimeout(done, 340);
  }

  // ── Fenêtre des prestations ───────────────────────────
  var dlg = byId('shopDlg');
  var shopMain = byId('shopMain');
  var routesBox = doc.querySelector('.routes');
  var canShop = !!(dlg && typeof dlg.showModal === 'function' && shopMain && routesBox);
  var routes = Array.prototype.slice.call(doc.querySelectorAll('.route'));
  var tabs = dlg ? Array.prototype.slice.call(dlg.querySelectorAll('[data-route]')) : [];
  var current = null;

  if (canShop) shopMain.appendChild(routesBox);
  else if (routesBox) routesBox.style.display = 'block';   // vieux navigateur : la liste reste dans la page

  function setRoute(id) {
    current = id;
    routes.forEach(function (r) { r.classList.toggle('is-current', r.id === id); });
    tabs.forEach(function (t) {
      var on = t.getAttribute('data-route') === id;
      t.setAttribute('aria-pressed', on ? 'true' : 'false');
      if (on && t.parentNode.scrollWidth > t.parentNode.clientWidth) {
        t.parentNode.scrollTo({ left: t.offsetLeft - (t.parentNode.clientWidth - t.offsetWidth) / 2, behavior: fx ? 'smooth' : 'auto' });
      }
    });
    var title = byId(id + '-t');
    if (title) dlg.setAttribute('aria-label', title.textContent);
  }

  function hit(t) {
    var tile = t && t.closest('.tile');
    if (!tile) return;
    var d = tile.querySelector('.tile__d');
    if (d) d.open = false;
    tile.scrollIntoView({ block: 'center' });
    restart(tile, 'is-hit');
  }

  // Ouvre la fenêtre sur l'élément #id (parcours, famille, tuile).
  // push : nouvelle entrée d'historique (le bouton retour fermera).
  function openAt(id, push) {
    var t = byId(id);
    if (!canShop || !t || !shopMain.contains(t)) return false;
    var r = t.matches('.route') ? t : t.closest('.route');
    if (!r) {
      // Prestation hors parcours : elle sort par la recherche.
      var only = t.closest('.tile');
      if (!only) return false;
      openAt(current || routes[0].id, push);
      search(only.querySelector('.tile__n').textContent);
      return true;
    }
    if (searching()) clearSearch(false);
    var was = current;
    setRoute(r.id);
    if (!dlg.open) {
      if (push !== false) history.pushState({ shop: 1 }, '', '#' + id);
      dlg.__closing = false;
      dlg.classList.remove('is-closing');
      dlg.showModal();
    } else {
      history.replaceState(history.state, '', '#' + id);
    }
    if (was !== r.id || t === r) shopMain.scrollTop = 0;
    if (was !== r.id) restart(r, 'is-arrived');
    if (t !== r) {
      if (t.closest('.tile')) hit(t);
      else t.scrollIntoView({ block: 'start' });
    }
    return true;
  }

  // Fermer : par l'historique si la fenêtre y a une entrée (le bouton
  // retour et la croix font la même chose), sinon directement.
  function closeShop() {
    if (!dlg.open) return;
    if (history.state && history.state.shop) history.back();
    else animateClose(dlg, clearUrl);
  }
  function clearUrl() {
    if (location.hash) history.replaceState(null, '', location.pathname + location.search);
  }

  if (canShop) {
    addEventListener('popstate', function () {
      var inShop = history.state && history.state.shop;
      if (dlg.open && !inShop) animateClose(dlg);
      else if (!dlg.open && inShop) openAt(resolve(hashId()), false);
    });
    addEventListener('hashchange', function () {
      var id = resolve(hashId());
      if (id) openAt(id, false);
    });
    dlg.addEventListener('click', function (e) {
      if (e.target === dlg || (e.target.closest && e.target.closest('.shopdlg__x'))) closeShop();
    });
    dlg.addEventListener('cancel', function (e) { e.preventDefault(); closeShop(); });
    tabs.forEach(function (t) {
      t.addEventListener('click', function () { openAt(t.getAttribute('data-route')); });
    });
  }

  // Liens internes (#parcours, #tuile, #situation, #recherche).
  doc.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a || !canShop) return;
    var h = decodeURIComponent(a.getAttribute('href').slice(1));
    if (h === 'situation') {
      if (dlg.open) { e.preventDefault(); closeShop(); }
      return;
    }
    if (h === 'recherche') {
      e.preventDefault();
      openAt(current || routes[0].id);
      if (input) input.focus();
      return;
    }
    var id = resolve(h);
    if (id && openAt(id)) e.preventDefault();
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
    var sAdd = sheet.querySelector('.sheet__add');

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
      if (sAdd) sAdd.setAttribute('data-name', tile.getAttribute('data-name'));
      sync();
      sheet.scrollTop = 0;
      sheet.__closing = false;
      sheet.classList.remove('is-closing');
      sheet.showModal();
    };

    doc.addEventListener('click', function (e) {
      var s = e.target.closest && e.target.closest('.tile__s');
      if (!s) return;
      e.preventDefault();
      openSheet(s.closest('.tile'));
    });
    sheet.addEventListener('click', function (e) {
      if (e.target === sheet || (e.target.closest && e.target.closest('[data-close]'))) animateClose(sheet);
    });
    sheet.addEventListener('cancel', function (e) { e.preventDefault(); animateClose(sheet); });
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
    var bubList = bubs.querySelector('.bubs__list');
    bubList.addEventListener('pointermove', function (e) {
      if (!ev) requestAnimationFrame(frame);
      ev = e;
    }, { passive: true });
    bubList.addEventListener('pointerleave', function () { ev = null; requestAnimationFrame(frame); boxes = null; });
    addEventListener('scroll', function () { boxes = null; }, { passive: true });
    addEventListener('resize', function () { boxes = null; });
  }

  // ── Recherche (dans la fenêtre) ───────────────────────
  var input = byId('tarifSearch');
  var clear = byId('tarifSearchClear');
  var status = byId('tarifStatus');
  var results = byId('tarifResults');
  var list = byId('tarifList');
  var none = byId('tarifNone');

  function searching() { return !!(dlg && dlg.classList.contains('is-searching')); }

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
    if (!input) return;
    var q = input.value.trim();
    var toks = tokens(q);
    var on = toks.length > 0;
    clear.hidden = !input.value.length;
    if (dlg) dlg.classList.toggle('is-searching', on);
    results.hidden = !on;
    if (!on) { status.textContent = ''; list.innerHTML = ''; last = ''; return; }
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
    sync();
    none.hidden = found.length > 0;
    status.textContent = found.length
      ? found.length + (found.length > 1 ? ' prestations' : ' prestation') + ' pour « ' + q + ' »'
      : 'Aucune prestation pour « ' + q + ' ».';
    if (shopMain) shopMain.scrollTop = 0;
  }
  function clearSearch(focus) {
    if (!input) return;
    input.value = '';
    run();
    if (focus) input.focus();
  }
  function search(q) {
    if (!input) return;
    loadSynonyms();
    input.value = q;
    run();
  }

  if (input) {
    input.addEventListener('focus', loadSynonyms, { once: true });
    input.addEventListener('input', run);
    input.addEventListener('keydown', function (e) {
      // Échap efface d'abord la recherche, sans fermer la fenêtre.
      if (e.key === 'Escape' && input.value) { e.preventDefault(); e.stopPropagation(); clearSearch(true); }
      // Téléphone : « Rechercher » ferme le clavier, les résultats sont dessous.
      if (e.key === 'Enter') { e.preventDefault(); if (matchMedia('(pointer: coarse)').matches) input.blur(); }
    });
    clear.addEventListener('click', function () { clearSearch(true); });
  }

  // ── Arrivée avec une ancre (/tarifs#site-vitrine…) ─────
  // L'adresse sans ancre reste en dessous dans l'historique : « retour »
  // ferme la fenêtre et laisse sur les bulles.
  var first = resolve(hashId());
  if (first && canShop) {
    history.replaceState(null, '', location.pathname + location.search);
    openAt(first);
  }
})();
