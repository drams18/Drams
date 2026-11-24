/* ══════════════════════════════════════════════════════
   PANIER.JS : la page /tarifs comme une mini boutique.

   Le client ajoute des prestations (bouton + d'une tuile, ou « Ajouter au
   panier » dans le panneau de détail), précise son besoin pour chaque
   catégorie, laisse son nom, son téléphone et son e-mail : la demande
   part par EmailJS (js/contact-form.js, même modèle que le devis), avec
   un message en texte lisible, rangé par catégorie (summary()).

   Le HTML (bouton flottant, panneau en 2 étapes) est écrit par
   scripts/build-site.mjs (cartHtml) ; les prix et catégories sont lus
   sur les tuiles (data-cat, data-price, data-eur, data-unit).

   Mémoire : la sélection et les besoins restent dans localStorage (le
   client peut revenir plus tard) ; les coordonnées dans sessionStorage
   seulement. Tout est vidé après l'envoi.

   window.Panier.summary() est pure : testée par tests/panier.test.mjs.
   ══════════════════════════════════════════════════════ */
(function (global) {
  'use strict';

  var NONE = 'non précisé';
  var LINE = '━━━━━━━━━━━━━━━━━━━━━━━━━━━━';

  // 1650 → « 1 650 »
  function fmt(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }
  function plural(n, one, many) { return n + ' ' + (n > 1 ? many : one); }

  // Prestations du panier rangées par catégorie (ordre de la grille).
  function groups(items, catalog) {
    var by = {};
    var out = [];
    items.forEach(function (name) {
      var s = catalog[name];
      if (!s) return;
      if (!by[s.catId]) {
        by[s.catId] = { id: s.catId, label: s.cat, i: s.catI, ico: s.ico, list: [] };
        out.push(by[s.catId]);
      }
      by[s.catId].list.push(s);
    });
    return out.sort(function (a, b) { return a.i - b.i; });
  }

  // Estimation : forfaits additionnés, mensualités à part, le reste
  // (à l'heure, à la journée) cité tel quel.
  function totals(list) {
    var t = { once: 0, monthly: 0, timed: [] };
    list.forEach(function (s) {
      if (!s.unit) t.once += s.eur;
      else if (/mois/.test(s.unit)) t.monthly += s.eur;
      else t.timed.push(s);
    });
    return t;
  }
  function totalLines(t) {
    var lines = [];
    if (t.once) lines.push('à partir de ' + fmt(t.once) + ' €');
    if (t.monthly) lines.push((lines.length ? '+ ' : 'à partir de ') + fmt(t.monthly) + ' € / mois');
    t.timed.forEach(function (s) { lines.push((lines.length ? '+ ' : '') + s.name + ' : ' + s.price); });
    return lines;
  }

  function indent(text, pad) {
    return String(text).trim().split(/\r?\n/).map(function (l) { return pad + l.trim(); }).join('\n');
  }
  function title(t) { return [LINE, t, LINE]; }

  // Le message reçu par e-mail (texte brut, une info par ligne).
  function summary(state, catalog, opts) {
    opts = opts || {};
    var c = state.contact || {};
    var needs = state.needs || {};
    var gs = groups(state.items || [], catalog);
    var all = gs.reduce(function (a, g) { return a.concat(g.list); }, []);
    var out = [
      'NOUVELLE DEMANDE DEPUIS LA PAGE TARIFS',
      plural(all.length, 'prestation', 'prestations') + ' · ' + plural(gs.length, 'catégorie', 'catégories'),
      ''
    ];
    out = out.concat(title('CLIENT'), [
      'Nom : ' + (c.nom || NONE),
      'Téléphone : ' + (c.tel || NONE),
      'E-mail : ' + (c.email || NONE),
      'Activité : ' + (c.activite || NONE),
      ''
    ]);
    out = out.concat(title('BESOINS PAR CATÉGORIE'));
    gs.forEach(function (g, i) {
      out.push('', (i + 1) + '. ' + g.label.toUpperCase());
      g.list.forEach(function (s) { out.push('   • ' + s.name + ' : ' + s.price); });
      var need = (needs[g.id] || '').trim();
      out.push('   Son besoin :' + (need ? '' : ' ' + NONE));
      if (need) out.push(indent(need, '   '));
    });
    out.push('');
    out = out.concat(title('ESTIMATION VUE PAR LE CLIENT'), totalLines(totals(all)), ['']);
    var msg = (state.message || '').trim();
    if (msg) out = out.concat(title('AUTRE MESSAGE'), [msg, '']);
    var when = opts.date ? opts.date.toLocaleString('fr-FR', { dateStyle: 'full', timeStyle: 'short', timeZone: 'Europe/Paris' }) : '';
    out.push('Envoyé' + (when ? ' le ' + when : '') + (opts.page ? ' depuis ' + opts.page : ''));
    return out.join('\n');
  }

  global.Panier = { summary: summary, groups: groups, totals: totals, totalLines: totalLines, fmt: fmt };

  // ══ Page ═══════════════════════════════════════════════
  var doc = global.document;
  var dlg = doc && doc.getElementById('tarifCart');
  if (!dlg) return;

  var root = doc.documentElement;
  var fx = root.classList.contains('fx');
  var KEY = 'drams-panier';
  var KEY_C = 'drams-panier-contact';

  // Catalogue lu sur les tuiles (première tuile de chaque prestation).
  var catalog = {};
  doc.querySelectorAll('.routes .tile[data-name]').forEach(function (li) {
    var name = li.getAttribute('data-name');
    if (catalog[name]) return;
    catalog[name] = {
      name: name,
      cat: li.getAttribute('data-cat'),
      catId: li.getAttribute('data-cat-id'),
      catI: +li.getAttribute('data-cat-i'),
      ico: li.getAttribute('data-ico'),
      price: li.getAttribute('data-price'),
      eur: +li.getAttribute('data-eur') || 0,
      unit: li.getAttribute('data-unit') || ''
    };
  });

  function read(store, key) {
    try { return JSON.parse(global[store].getItem(key) || 'null'); } catch (e) { return null; }
  }
  function write(store, key, v) {
    try { if (v == null) global[store].removeItem(key); else global[store].setItem(key, JSON.stringify(v)); } catch (e) { /* noop */ }
  }
  var saved = read('localStorage', KEY) || {};
  var state = {
    items: (saved.items || []).filter(function (n) { return catalog[n]; }),
    needs: saved.needs || {},
    message: saved.message || '',
    contact: read('sessionStorage', KEY_C) || {}
  };
  function save() {
    write('localStorage', KEY, { items: state.items, needs: state.needs, message: state.message });
    write('sessionStorage', KEY_C, state.contact);
  }
  function has(name) { return state.items.indexOf(name) !== -1; }

  // ── Petits outils DOM ──
  function el(tag, cls, text) {
    var n = doc.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function ico(id, cls) {
    var s = doc.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('class', cls || 'ico');
    s.setAttribute('aria-hidden', 'true');
    var u = doc.createElementNS('http://www.w3.org/2000/svg', 'use');
    u.setAttribute('href', '#i-' + id);
    s.appendChild(u);
    return s;
  }
  function replay(n, cls) {
    if (!fx || !n) return;
    n.classList.remove(cls);
    void n.offsetWidth;
    n.classList.add(cls);
  }

  var fab = doc.getElementById('cartFab');
  var fabN = doc.getElementById('cartFabN');
  var fabP = doc.getElementById('cartFabP');
  var live = doc.getElementById('cartLive');
  var list = doc.getElementById('cartList');
  var empty = doc.getElementById('cartEmpty');
  var sum = doc.getElementById('cartSum');
  var next = dlg.querySelector('[data-next]');
  var form = dlg.querySelector('form');
  var recap = doc.getElementById('cartRecap');
  var status = form.querySelector('.cart__status');
  var submit = form.querySelector('[type="submit"]');

  // Placeholders des besoins, par catégorie (exemples, rien d'engageant).
  var HINT = {
    site: 'Ex. : votre activité, le nombre de pages, un site que vous aimez…',
    vendre: 'Ex. : combien de produits, livraison ou retrait en boutique…',
    modules: 'Ex. : prise de rendez-vous pour 2 personnes, acompte en ligne…',
    visibilite: 'Ex. : être trouvé sur « coiffeur Montreuil »…',
    design: 'Ex. : vos couleurs, le style que vous aimez…',
    suivi: 'Ex. : votre site actuel, ce qui ne va pas…'
  };

  // ── Boutons « ajouter » (tuiles, résultats, panneau de détail) ──
  function syncButtons() {
    doc.querySelectorAll('[data-add]').forEach(function (b) {
      var name = b.getAttribute('data-name');
      var on = !!name && has(name);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      if (b.classList.contains('tile__add')) b.setAttribute('aria-label', (on ? 'Retirer « ' : 'Ajouter « ') + name + (on ? ' » du panier' : ' » au panier'));
      var li = b.closest('.tile');
      if (li) li.classList.toggle('is-in', on);
    });
  }

  function syncFab() {
    var n = state.items.length;
    fab.hidden = n === 0;
    fabN.textContent = n;
    var t = totals(state.items.map(function (x) { return catalog[x]; }));
    fabP.textContent = t.once ? 'dès ' + fmt(t.once) + ' €' : t.monthly ? 'dès ' + fmt(t.monthly) + ' € / mois' : plural(n, 'prestation', 'prestations');
  }

  function toggle(name, btn) {
    if (!catalog[name]) return;
    var on = !has(name);
    if (on) state.items.push(name);
    else state.items.splice(state.items.indexOf(name), 1);
    save();
    syncButtons();
    var wasHidden = fab.hidden;
    syncFab();
    if (on) {
      replay(btn, 'is-pop');
      if (!wasHidden) replay(fab, 'is-bump');
    }
    live.textContent = '« ' + name + ' » ' + (on ? 'ajouté au panier' : 'retiré du panier') + ' (' + plural(state.items.length, 'prestation', 'prestations') + ').';
    if (dlg.open) renderList();
  }

  doc.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-add]');
    if (!b) return;
    e.preventDefault();
    toggle(b.getAttribute('data-name'), b);
  });
  // js/tarifs.js prévient quand il crée des boutons (résultats de recherche,
  // panneau de détail ouvert).
  doc.addEventListener('panier:sync', syncButtons);

  // ── Étape 1 : la sélection, rangée par catégorie ──
  function renderList() {
    var gs = groups(state.items, catalog);
    list.innerHTML = '';
    gs.forEach(function (g) {
      var sec = el('section', 'cgrp');
      var h = el('h3', 'cgrp__t');
      var gi = el('span', 'cgrp__ico');
      gi.appendChild(ico(g.ico));
      h.appendChild(gi);
      h.appendChild(doc.createTextNode(g.label));
      h.appendChild(el('span', 'cgrp__n', String(g.list.length)));
      sec.appendChild(h);
      var ul = el('ul', 'citems');
      g.list.forEach(function (s) {
        var li = el('li', 'citem');
        li.appendChild(el('span', 'citem__n', s.name));
        li.appendChild(el('span', 'citem__p', s.price));
        var x = el('button', 'citem__x');
        x.type = 'button';
        x.setAttribute('data-remove', s.name);
        x.setAttribute('aria-label', 'Retirer « ' + s.name + ' »');
        x.appendChild(ico('close'));
        li.appendChild(x);
        ul.appendChild(li);
      });
      sec.appendChild(ul);
      var lab = el('label', 'cneed');
      lab.appendChild(el('span', 'cneed__t', 'Votre besoin pour « ' + g.label + ' »'));
      lab.lastChild.appendChild(el('small', null, ' (facultatif)'));
      var ta = el('textarea');
      ta.rows = 2;
      ta.setAttribute('data-need', g.id);
      ta.placeholder = HINT[g.id] || 'Ex. : ce que vous voulez obtenir, vos délais…';
      ta.value = state.needs[g.id] || '';
      lab.appendChild(ta);
      sec.appendChild(lab);
      list.appendChild(sec);
    });
    var n = state.items.length;
    empty.hidden = n > 0;
    sum.hidden = n === 0;
    next.disabled = n === 0;
    sum.innerHTML = '';
    if (n) {
      var lines = totalLines(totals(state.items.map(function (x) { return catalog[x]; })));
      sum.appendChild(el('span', 'cart__sum-k', 'Estimation · ' + plural(n, 'prestation', 'prestations')));
      sum.appendChild(el('strong', 'cart__sum-v', lines[0]));
      lines.slice(1).forEach(function (l) { sum.appendChild(el('span', 'cart__sum-x', l)); });
    }
  }
  list.addEventListener('click', function (e) {
    var x = e.target.closest('[data-remove]');
    if (x) toggle(x.getAttribute('data-remove'), null);
  });
  list.addEventListener('input', function (e) {
    var id = e.target.getAttribute('data-need');
    if (!id) return;
    state.needs[id] = e.target.value;
    save();
  });

  // ── Vues du panneau ──
  function show(view) {
    dlg.querySelectorAll('[data-view]').forEach(function (v) { v.hidden = v.getAttribute('data-view') !== view; });
    dlg.scrollTop = 0;
  }
  function open() {
    renderList();
    show('list');
    status.textContent = '';
    dlg.classList.remove('is-closing');
    dlg.showModal();
  }
  var closing = false;
  function close() {
    if (!dlg.open || closing) return;
    if (!fx) { dlg.close(); return; }
    closing = true;
    dlg.classList.add('is-closing');
    var done = function () {
      if (!closing) return;
      closing = false;
      dlg.classList.remove('is-closing');
      dlg.close();
    };
    dlg.addEventListener('animationend', function end(e) {
      if (e.target !== dlg) return;
      dlg.removeEventListener('animationend', end);
      done();
    });
    setTimeout(done, 320);
  }
  fab.addEventListener('click', open);
  dlg.addEventListener('click', function (e) {
    if (e.target === dlg || (e.target.closest && e.target.closest('[data-close]'))) close();
  });
  dlg.addEventListener('cancel', function (e) { e.preventDefault(); close(); });
  // Lien direct vers le panier : /tarifs#panier
  if (location.hash === '#panier' && state.items.length) open();

  // ── Étape 2 : coordonnées puis envoi ──
  function recapText() {
    var lines = totalLines(totals(state.items.map(function (x) { return catalog[x]; })));
    return plural(state.items.length, 'prestation', 'prestations') + (lines[0] ? ' · ' + lines[0] : '');
  }
  next.addEventListener('click', function () {
    if (!state.items.length) return;
    recap.textContent = recapText();
    var c = state.contact;
    form.client_nom.value = c.nom || '';
    form.client_tel.value = c.tel || '';
    form.client_email.value = c.email || '';
    form.client_activite.value = c.activite || '';
    form.client_message.value = state.message || '';
    show('form');
  });
  dlg.querySelector('[data-back]').addEventListener('click', function () { renderList(); show('list'); });

  function readForm() {
    state.contact = {
      nom: form.client_nom.value.trim(),
      tel: form.client_tel.value.trim(),
      email: form.client_email.value.trim(),
      activite: form.client_activite.value.trim()
    };
    state.message = form.client_message.value;
    save();
  }
  form.addEventListener('input', readForm);
  if (global.ContactForm) global.ContactForm.warm(form);

  function fail(msg, field) {
    status.textContent = msg;
    status.className = 'cart__status is-error';
    if (field) field.focus();
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    readForm();
    var c = state.contact;
    if (!c.nom) return fail('Indiquez votre nom.', form.client_nom);
    if (c.tel.replace(/\D/g, '').length < 9) return fail('Indiquez un numéro de téléphone valide.', form.client_tel);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email)) return fail('Indiquez une adresse e-mail valide.', form.client_email);
    if (!state.items.length) return fail('Votre panier est vide.');
    if (!global.ContactForm) return fail('L’envoi est indisponible. Écrivez-moi ou appelez-moi depuis la page Contact.');

    form.from_name.value = c.nom + ' · panier de ' + plural(state.items.length, 'prestation', 'prestations');
    form.from_email.value = c.email;
    form.message.value = summary(state, catalog, { date: new Date(), page: location.origin + location.pathname });

    submit.disabled = true;
    status.textContent = 'Envoi…';
    status.className = 'cart__status';
    global.ContactForm.sendForm(form).then(function () {
      state.items = [];
      state.needs = {};
      state.message = '';
      save();
      syncButtons();
      syncFab();
      show('done');
      if (global.FX && global.FX.confetti) global.FX.confetti();
    }).catch(function (err) {
      console.error('EmailJS error:', err);
      fail('L’envoi a échoué. Vérifiez votre connexion et réessayez, ou contactez-moi depuis la page Contact.');
    }).then(function () {
      submit.disabled = false;
    });
  });

  syncButtons();
  syncFab();
})(typeof window !== 'undefined' ? window : globalThis);
