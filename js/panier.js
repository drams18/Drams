/* ══════════════════════════════════════════════════════
   PANIER.JS : la page /tarifs comme une mini boutique.

   Le client choisit un pack (.pack, « Choisir ce pack ») et/ou ajoute des
   prestations (bouton + d'une tuile, « Ajouter au panier » dans le
   panneau de détail). Le panier reste visible : colonne blanche fixe à
   droite sur ordinateur, barre en bas sur téléphone ([data-minicart],
   [data-cartbar], sur la page et dans la fenêtre des prestations).
   « Valider mon panier » ouvre #tarifCart : rappel du panier, prénom,
   nom, téléphone, e-mail ; la demande part par EmailJS
   (js/contact-form.js, même modèle que le devis), avec un message en
   texte lisible rangé par catégorie (summary()).

   Packs : un seul à la fois (en choisir un autre le remplace) ; les
   prestations qu'il comprend sortent du panier et leurs boutons
   affichent « compris dans le pack ».

   Le HTML des blocs (vides) et du panneau est écrit par
   scripts/build-site.mjs (cartHtml) ; prix et catégories sont lus sur les
   tuiles et les packs (data-cat, data-price, data-eur, data-unit,
   data-includes).

   Mémoire : la sélection et le message restent dans localStorage (le
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

  // Prestations du panier rangées par catégorie (packs d'abord, puis
  // l'ordre de la grille).
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

  // Nombre de prestations (un pack compte pour ce qu'il comprend).
  function count(list) {
    return list.reduce(function (n, s) { return n + (s.includes ? s.includes.length : 1); }, 0);
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

  function title(t) { return [LINE, t, LINE]; }
  function fullName(c) { return [c.prenom, c.nom].filter(Boolean).join(' ').trim(); }

  // Le message reçu par e-mail (texte brut, une info par ligne).
  function summary(state, catalog, opts) {
    opts = opts || {};
    var c = state.contact || {};
    var gs = groups(state.items || [], catalog);
    var all = gs.reduce(function (a, g) { return a.concat(g.list); }, []);
    var n = count(all);
    var out = [
      'NOUVELLE DEMANDE DEPUIS LA PAGE TARIFS',
      plural(n, 'prestation', 'prestations') + ' · ' + plural(gs.length, 'catégorie', 'catégories'),
      ''
    ];
    out = out.concat(title('CLIENT'), [
      'Nom : ' + (fullName(c) || NONE),
      'Téléphone : ' + (c.tel || NONE),
      'E-mail : ' + (c.email || NONE),
      ''
    ]);
    out = out.concat(title('PANIER'));
    gs.forEach(function (g, i) {
      out.push('', (i + 1) + '. ' + g.label.toUpperCase());
      g.list.forEach(function (s) {
        out.push('   • ' + s.name + ' : ' + s.price);
        if (s.includes) out.push('     comprend : ' + s.includes.join(', '));
      });
    });
    out.push('');
    out = out.concat(title('ESTIMATION VUE PAR LE CLIENT'), totalLines(totals(all)), ['']);
    var msg = (state.message || '').trim();
    if (msg) out = out.concat(title('SON PROJET'), [msg, '']);
    var when = opts.date ? opts.date.toLocaleString('fr-FR', { dateStyle: 'full', timeStyle: 'short', timeZone: 'Europe/Paris' }) : '';
    out.push('Envoyé' + (when ? ' le ' + when : '') + (opts.page ? ' depuis ' + opts.page : ''));
    return out.join('\n');
  }

  global.Panier = { summary: summary, groups: groups, totals: totals, totalLines: totalLines, count: count, fmt: fmt };

  // ══ Page ═══════════════════════════════════════════════
  var doc = global.document;
  var dlg = doc && doc.getElementById('tarifCart');
  if (!dlg) return;

  var root = doc.documentElement;
  var fx = root.classList.contains('fx');
  var KEY = 'drams-panier';
  var KEY_C = 'drams-panier-contact';

  // Catalogue lu sur les tuiles (première de chaque prestation) et les packs.
  var catalog = {};
  doc.querySelectorAll('.routes .tile[data-name], .pack[data-name]').forEach(function (li) {
    var name = li.getAttribute('data-name');
    if (catalog[name]) return;
    var inc = li.getAttribute('data-includes');
    catalog[name] = {
      name: name,
      cat: li.getAttribute('data-cat'),
      catId: li.getAttribute('data-cat-id'),
      catI: +li.getAttribute('data-cat-i'),
      ico: li.getAttribute('data-ico'),
      price: li.getAttribute('data-price'),
      eur: +li.getAttribute('data-eur') || 0,
      unit: li.getAttribute('data-unit') || '',
      includes: inc ? inc.split('|') : null
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
    message: saved.message || '',
    contact: read('sessionStorage', KEY_C) || {}
  };
  function save() {
    write('localStorage', KEY, { items: state.items, message: state.message });
    write('sessionStorage', KEY_C, state.contact);
  }
  function has(name) { return state.items.indexOf(name) !== -1; }
  function pack() {
    for (var i = 0; i < state.items.length; i++) if (catalog[state.items[i]].includes) return catalog[state.items[i]];
    return null;
  }
  function inPack(name) { var p = pack(); return !!(p && p.includes.indexOf(name) !== -1); }
  function chosen() { return state.items.map(function (x) { return catalog[x]; }); }

  function replay(n, cls) {
    if (!fx || !n) return;
    n.classList.remove(cls);
    void n.offsetWidth;
    n.classList.add(cls);
  }
  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function svg(id, cls) { return '<svg class="' + (cls || 'ico') + '" aria-hidden="true"><use href="#i-' + id + '"/></svg>'; }

  var minis = doc.querySelectorAll('[data-minicart]');
  var bars = doc.querySelectorAll('[data-cartbar]');
  var live = doc.getElementById('cartLive');
  var form = dlg.querySelector('form');
  var recap = doc.getElementById('cartRecap');
  var status = form.querySelector('.cart__status');
  var submit = form.querySelector('[type="submit"]');

  // ── Boutons « ajouter » (packs, tuiles, résultats, panneau de détail) ──
  function syncButtons() {
    doc.querySelectorAll('[data-add]').forEach(function (b) {
      var name = b.getAttribute('data-name');
      if (!name) return;
      var on = has(name);
      var cov = !on && inPack(name);
      b.setAttribute('aria-pressed', on || cov ? 'true' : 'false');
      b.classList.toggle('is-covered', cov);
      if (b.classList.contains('tile__add')) {
        b.setAttribute('aria-label', cov ? '« ' + name + ' » est compris dans le ' + pack().name
          : (on ? 'Retirer « ' : 'Ajouter « ') + name + (on ? ' » du panier' : ' » au panier'));
      }
      var box = b.closest('.tile, .pack');
      if (box) { box.classList.toggle('is-in', on || cov); box.classList.toggle('is-covered', cov); }
    });
  }

  // ── Panier visible : colonne à droite (ordinateur), barre en bas (téléphone) ──
  function pills(cls) {
    return chosen().map(function (s) {
      return '<li class="' + cls + (s.includes ? ' is-pack' : '') + '">' +
        '<span class="pill__ico">' + svg(s.ico) + '</span>' +
        '<span class="pill__txt"><span class="pill__n">' + esc(s.name) + '</span>' +
        '<span class="pill__p">' + esc(s.price) + (s.includes ? ' · ' + plural(s.includes.length, 'prestation', 'prestations') : '') + '</span></span>' +
        '<button type="button" class="pill__x" data-remove="' + esc(s.name) + '" aria-label="Retirer « ' + esc(s.name) + ' »">' + svg('close') + '</button></li>';
    }).join('');
  }
  function totalHtml(cls) {
    var lines = totalLines(totals(chosen()));
    return '<div class="' + cls + '"><span class="tot__k">Total estimé</span><strong class="tot__v">' + esc(lines[0] || '') + '</strong>' +
      lines.slice(1).map(function (l) { return '<span class="tot__x">' + esc(l) + '</span>'; }).join('') + '</div>';
  }
  function miniHtml() {
    var n = state.items.length;
    var h = '<div class="mc__in"><p class="mc__k">' + svg('bag') + '<span>Votre panier</span><span class="mc__n">' + n + '</span></p>';
    if (!n) {
      return h + '<div class="mc__empty"><span class="mc__empty-ico">' + svg('bag') + '</span><p><strong>Votre panier est vide.</strong></p>' +
        '<p>Choisissez un pack ou ajoutez des prestations avec le bouton <span class="cart-how__plus" aria-hidden="true">' + svg('plus') + '</span>.</p></div></div>';
    }
    h += '<ul class="mc__list">' + pills('pill') + '</ul>';
    h += '<div class="mc__foot">' + totalHtml('tot') +
      '<button type="button" class="btn btn--cta mc__go" data-checkout>Valider mon panier' + svg('arrow') + '</button>' +
      '<p class="mc__note">Devis gratuit, sans engagement.</p></div></div>';
    return h;
  }
  function barHtml() {
    var n = state.items.length;
    if (!n) return '<div class="cartbar__in is-empty">' + svg('bag') + '<span>Votre panier est vide</span></div>';
    var t = totals(chosen());
    var p = t.once ? 'dès ' + fmt(t.once) + ' €' : t.monthly ? 'dès ' + fmt(t.monthly) + ' € / mois' : '';
    var c = count(chosen());
    return '<button type="button" class="cartbar__in" data-checkout>' +
      '<span class="cartbar__ico">' + svg('bag') + '<span class="cartbar__n">' + n + '</span></span>' +
      '<span class="cartbar__txt"><strong>Mon panier · ' + plural(c, 'prestation', 'prestations') + '</strong><span>' + esc(p) + '</span></span>' +
      '<span class="cartbar__go">Valider' + svg('arrow') + '</span></button>';
  }
  function renderCart(bump) {
    var m = miniHtml(), b = barHtml();
    minis.forEach(function (el) {
      el.innerHTML = m;
      el.classList.toggle('is-empty', !state.items.length);
      if (bump) {
        replay(el.querySelector('.mc__n'), 'is-bump');
        var items = el.querySelectorAll('.pill');
        replay(items[bump === true ? items.length - 1 : -1], 'is-new');
      }
    });
    bars.forEach(function (el) { el.innerHTML = b; if (bump) replay(el.querySelector('.cartbar__in'), 'is-bump'); });
  }

  function say(t) { live.textContent = t; }
  function toggle(name, btn) {
    var s = catalog[name];
    if (!s) return;
    // Déjà compris dans le pack choisi : on le dit, rien ne change.
    if (!has(name) && inPack(name)) {
      say('« ' + name + ' » est déjà compris dans le ' + pack().name + '.');
      minis.forEach(function (el) { replay(el.querySelector('.pill.is-pack'), 'is-hit'); });
      replay(btn, 'is-pop');
      return;
    }
    var on = !has(name);
    var gone = [];
    if (on && s.includes) {
      // Un pack remplace l'autre pack et ce qu'il comprend déjà.
      state.items = state.items.filter(function (x) {
        var out = !!catalog[x].includes || s.includes.indexOf(x) !== -1;
        if (out) gone.push(x);
        return !out;
      });
    }
    if (on) state.items.push(name);
    else state.items.splice(state.items.indexOf(name), 1);
    save();
    syncButtons();
    renderCart(on);
    if (on) replay(btn, 'is-pop');
    say('« ' + name + ' » ' + (on ? 'ajouté au panier' : 'retiré du panier') +
      (gone.length ? ', à la place de : ' + gone.join(', ') : '') +
      ' (' + plural(count(chosen()), 'prestation', 'prestations') + ').');
    if (dlg.open) renderRecap();
  }

  doc.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target : null;
    if (!t) return;
    var b = t.closest('[data-add]');
    if (b) { e.preventDefault(); toggle(b.getAttribute('data-name'), b); return; }
    var x = t.closest('[data-remove]');
    if (x) { toggle(x.getAttribute('data-remove'), null); return; }
    if (t.closest('[data-checkout]')) open();
  });
  // js/tarifs.js prévient quand il crée des boutons (résultats de recherche,
  // panneau de détail ouvert).
  doc.addEventListener('panier:sync', syncButtons);

  // ── Panneau de validation ──
  function renderRecap() {
    var n = state.items.length;
    recap.innerHTML = n
      ? '<ul class="cart__pills">' + pills('pill pill--sm') + '</ul>' + totalHtml('tot tot--cart')
      : '<p class="cart__empty">Votre panier est vide.</p>';
    submit.disabled = !n;
  }
  function show(view) {
    dlg.querySelectorAll('[data-view]').forEach(function (v) { v.hidden = v.getAttribute('data-view') !== view; });
    dlg.scrollTop = 0;
  }
  function open() {
    if (!state.items.length) return;
    renderRecap();
    var c = state.contact;
    form.client_prenom.value = c.prenom || '';
    form.client_nom.value = c.nom || '';
    form.client_tel.value = c.tel || '';
    form.client_email.value = c.email || '';
    form.client_message.value = state.message || '';
    status.textContent = '';
    status.className = 'cart__status';
    show('form');
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
  dlg.addEventListener('click', function (e) {
    if (e.target === dlg || (e.target.closest && e.target.closest('[data-close]'))) close();
  });
  dlg.addEventListener('cancel', function (e) { e.preventDefault(); close(); });
  // Lien direct vers le panier : /tarifs#panier
  if (location.hash === '#panier' && state.items.length) open();

  function readForm() {
    state.contact = {
      prenom: form.client_prenom.value.trim(),
      nom: form.client_nom.value.trim(),
      tel: form.client_tel.value.trim(),
      email: form.client_email.value.trim()
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
    if (!state.items.length) return fail('Votre panier est vide.');
    if (c.tel.replace(/\D/g, '').length < 9) return fail('Indiquez un numéro de téléphone valide.', form.client_tel);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email)) return fail('Indiquez une adresse e-mail valide.', form.client_email);
    if (!global.ContactForm) return fail('L’envoi est indisponible. Écrivez-moi ou appelez-moi depuis la page Contact.');

    var who = fullName(c) || c.email;
    form.from_name.value = who;
    form.setAttribute('data-subject', 'Panier tarifs · ' + plural(count(chosen()), 'prestation', 'prestations') + ' · ' + who);
    form.from_email.value = c.email;
    form.message.value = summary(state, catalog, { date: new Date(), page: location.origin + location.pathname });

    submit.disabled = true;
    status.textContent = 'Envoi…';
    status.className = 'cart__status';
    global.ContactForm.sendForm(form).then(function () {
      status.textContent = '';
      state.items = [];
      state.message = '';
      save();
      syncButtons();
      renderCart(false);
      show('done');
      if (global.FX && global.FX.confetti) global.FX.confetti();
    }).catch(function (err) {
      console.error('EmailJS error:', err);
      fail('L’envoi a échoué. Vérifiez votre connexion et réessayez, ou contactez-moi depuis la page Contact.');
    }).then(function () {
      submit.disabled = !state.items.length;
    });
  });

  syncButtons();
  renderCart(false);
})(typeof window !== 'undefined' ? window : globalThis);
