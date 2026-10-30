/* ══════════════════════════════════════════════════════
   TARIFS.JS : Recherche dans la grille de /tarifs.
   La grille est écrite en HTML par scripts/build-site.mjs (lisible sans
   JavaScript et par Google) ; ce script ne fait que filtrer les lignes.
   Chaque ligne porte data-search (nom, description, mots-clés,
   catégories). Les synonymes (js/tarifs-data.js) sont chargés au premier
   focus dans le champ.
   Anciennes adresses (#professionnels/site-pro…) → catégorie actuelle.
   ══════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var doc = document;

  // ── Anciennes adresses ────────────────────────────────
  var LEGACY = {
    'site-pro': 'site', 'vendre-pro': 'vendre', 'app-pro': 'app', 'modules-pro': 'modules',
    'infra-pro': 'infra', 'suivi-pro': 'suivi', existant: 'site', probleme: 'suivi'
  };
  // Ouvre les volets (<details>) qui contiennent el, el compris.
  function reveal(el) {
    for (var d = el.closest('details'); d; d = d.parentElement && d.parentElement.closest('details')) d.open = true;
  }
  var parts = location.hash.replace(/^#/, '').split('/');
  if (parts[0] === 'professionnels' || parts[0] === 'particuliers') {
    var id = LEGACY[parts[1]] || parts[1] || '';
    history.replaceState(null, '', location.pathname + location.search + (doc.getElementById(id) ? '#' + id : ''));
    var t = doc.getElementById(id);
    if (t) { reveal(t); t.scrollIntoView(); }
  }
  // Lien vers une prestation ou une catégorie de la grille complète (repliée) :
  // la grille s'ouvre, la prestation aussi, puis on s'y rend.
  function openTarget() {
    var el = location.hash && doc.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (!el || !el.closest('.all')) return;
    var wasClosed = !el.closest('.all').open;
    reveal(el);
    if (wasClosed) el.scrollIntoView();
  }
  openTarget();
  window.addEventListener('hashchange', openTarget);

  // ── Recherche ─────────────────────────────────────────
  var input = doc.getElementById('tarifSearch');
  if (!input) return;
  var clear = doc.getElementById('tarifSearchClear');
  var status = doc.getElementById('tarifStatus');
  var none = doc.getElementById('tarifNone');
  var catalog = input.closest('.catalog');
  var items = Array.prototype.slice.call(doc.querySelectorAll('.svc-item[data-search]'));
  var cats = Array.prototype.slice.call(doc.querySelectorAll('.cat'));
  var subTitle = catalog.querySelector('.block__t--sub');
  var sub = subTitle && { title: subTitle, lead: subTitle.nextElementSibling };

  var DIACRITICS = new RegExp('[\\u0300-\\u036f]', 'g');
  function norm(s) {
    return String(s == null ? '' : s).toLowerCase().normalize('NFD').replace(DIACRITICS, '')
      .replace(/[^a-z0-9]+/g, ' ').trim();
  }
  var STOP = { de: 1, du: 1, des: 1, la: 1, le: 1, les: 1, un: 1, une: 1, et: 1, ou: 1, en: 1, au: 1, aux: 1,
    sur: 1, dans: 1, par: 1, pour: 1, avec: 1, je: 1, mon: 1, ma: 1, mes: 1, ce: 1, cette: 1, quel: 1, quelle: 1 };
  function tokens(str) { return norm(str).split(' ').filter(function (w) { return w.length >= 2 && !STOP[w]; }); }

  items.forEach(function (li) {
    li._hay = norm(li.getAttribute('data-search'));
    li._words = li._hay.split(' ');
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
  function hits(tok, li) {
    if (wordMatch(tok, li._words)) return true;
    var syn = SYN[tok];
    if (syn) for (var i = 0; i < syn.length; i++) {
      var sv = norm(syn[i]);
      if (sv.indexOf(' ') !== -1 ? li._hay.indexOf(sv) !== -1 : wordMatch(sv, li._words)) return true;
    }
    return false;
  }

  var all = catalog.querySelector('.all');
  var wasOpen = all.open;
  function run() {
    var toks = tokens(input.value);
    var searching = toks.length > 0;
    clear.hidden = !input.value.length;
    // Les résultats vivent dans la grille repliée : ouverte pendant la
    // recherche, remise comme avant quand le champ est vidé.
    if (searching && !catalog.classList.contains('is-searching')) { wasOpen = all.open; all.open = true; }
    if (!searching && catalog.classList.contains('is-searching')) all.open = wasOpen;
    catalog.classList.toggle('is-searching', searching);
    var shown = 0, seen = {};
    items.forEach(function (li) {
      var name = li.querySelector('.svc__name').textContent;
      var on = !searching || toks.every(function (t) { return hits(t, li); });
      // Une prestation rangée dans plusieurs catégories n'apparaît qu'une fois.
      if (searching && on) { if (seen[name]) on = false; else seen[name] = true; }
      li.hidden = !on;
      if (on) shown++;
    });
    cats.forEach(function (c) { c.hidden = !c.querySelector('.svc-item:not([hidden])'); });
    // « Projets techniques » : titre masqué si aucune de ses catégories ne répond.
    var techCats = sub && sub.lead.nextElementSibling;
    if (techCats) sub.title.hidden = sub.lead.hidden = !techCats.querySelector('.cat:not([hidden])');
    none.hidden = !searching || shown > 0;
    status.textContent = searching
      ? (shown ? shown + (shown > 1 ? ' prestations' : ' prestation') + ' pour « ' + input.value.trim() + ' »' : 'Aucune prestation pour « ' + input.value.trim() + ' ».')
      : '';
  }

  input.addEventListener('input', run);
  clear.addEventListener('click', function () { input.value = ''; run(); input.focus(); });
})();
