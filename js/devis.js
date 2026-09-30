/* ══════════════════════════════════════════════════════
   DEVIS.JS : « Construisez votre projet », version site classique
   (devis.html). Formulaire par étapes :

     #etape-1 … #etape-5   une question (choix unique ou multiple)
     #recap                récapitulatif, chaque étape modifiable
     #coordonnees          coordonnées + message → envoi EmailJS
     (confirmation affichée sans changer d'URL)

   Même contenu, même e-mail et même mémoire de session
   (sessionStorage « drame.buildproject ») que le mini-jeu du mode
   aventure (js/build-project.js) : un projet commencé dans l'un se
   retrouve dans l'autre. Choix unique → étape suivante automatique ;
   Entrée valide l'étape.
   ══════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var doc = document;
  var STORAGE_KEY = 'drame.buildproject';
  var NO_CHOICE = 'Aucun choix';
  var CONTACT_EMAIL = 'arphandrame0@gmail.com';
  var UNKNOWN = '__unknown__';

  // Valeurs (value) identiques à js/build-project.js : ce sont elles qui
  // partent dans l'e-mail et dans la session partagée.
  var STEPS = [
    {
      key: 'projectType', recapLabel: 'Type de projet',
      title: 'Que voulez-vous créer ?',
      help: 'Vous pourrez modifier vos choix à la fin en cas de doute.',
      options: [
        { value: 'Site web',                       label: 'Site web',           hint: 'Présenter votre activité en ligne' },
        { value: 'Boutique en ligne (e-commerce)', label: 'E-commerce',         hint: 'Vendre vos produits sur internet' },
        { value: 'Application web',                label: 'Application web',    hint: 'Un outil qui s\'ouvre dans le navigateur' },
        { value: 'Application mobile',             label: 'Application mobile', hint: 'Une app à installer sur téléphone' },
        { value: 'Site WordPress',                 label: 'WordPress',          hint: 'Un site que vous pourrez modifier vous-même' },
        { value: 'Boutique Shopify',               label: 'Shopify',            hint: 'Une boutique en ligne prête à l\'emploi' },
        { value: 'Autre',                          label: 'Autre',              hint: 'Votre idée ne rentre dans aucune case', soft: true },
      ],
    },
    {
      key: 'clientType', recapLabel: 'Profil',
      title: 'Pour qui est ce projet ?',
      help: 'Cela m\'aide à adapter ma proposition. Choisissez « Je ne sais pas » si vous hésitez.',
      options: [
        { value: 'Particulier',    label: 'Particulier',    hint: 'Un projet personnel' },
        { value: 'Professionnel',  label: 'Professionnel',  hint: 'Entreprise, indépendant, commerçant' },
        { value: 'Association',    label: 'Association',    hint: 'Structure à but non lucratif' },
        { value: 'Étudiant',       label: 'Étudiant',       hint: 'Projet d\'études ou personnel' },
        { value: 'Autre',          label: 'Autre',          hint: 'Une autre situation', soft: true },
        { value: 'Je ne sais pas', label: 'Je ne sais pas', hint: 'On en parlera ensemble', soft: true },
      ],
    },
    {
      key: 'need', recapLabel: 'Besoin',
      title: 'De quoi avez-vous besoin ?',
      help: 'Dites-moi simplement où vous en êtes aujourd\'hui.',
      options: [
        { value: 'Création',                 label: 'Création',                 hint: 'Partir de zéro' },
        { value: 'Refonte',                  label: 'Refonte',                  hint: 'Refaire un site qui existe déjà' },
        { value: 'Ajout de fonctionnalités', label: 'Ajout de fonctionnalités', hint: 'Compléter un site existant' },
        { value: 'Correction / dépannage',   label: 'Correction / dépannage',   hint: 'Quelque chose ne fonctionne plus' },
        { value: 'Maintenance',              label: 'Maintenance',              hint: 'Garder le site à jour dans le temps' },
        { value: 'Accompagnement',           label: 'Accompagnement',           hint: 'Être conseillé et guidé' },
        { value: 'Autre',                    label: 'Autre',                    hint: 'Un autre besoin, à préciser à la fin', soft: true },
        { value: 'Je ne sais pas',           label: 'Je ne sais pas',           hint: 'On fera le point ensemble', soft: true },
      ],
    },
    {
      key: 'features', recapLabel: 'Fonctionnalités', multi: true,
      title: 'Quelles fonctionnalités vous intéressent ?',
      help: 'Vous pouvez en choisir plusieurs. Passez par « Je ne sais pas » pour continuer sans choisir.',
      options: [
        { value: 'Paiement en ligne',       label: 'Paiement en ligne',       hint: 'Encaisser des paiements par carte' },
        { value: 'Réservation',             label: 'Réservation',             hint: 'Prendre des rendez-vous ou des réservations' },
        { value: 'Compte utilisateur',      label: 'Compte utilisateur',      hint: 'Vos visiteurs peuvent se connecter' },
        { value: 'Espace administration',   label: 'Espace administration',   hint: 'Un espace privé pour gérer le contenu' },
        { value: 'Base de données',         label: 'Base de données',         hint: 'Stocker et retrouver des informations' },
        { value: 'API / services externes', label: 'API / services externes', hint: 'Se connecter à d\'autres outils' },
        { value: 'Site multilingue',        label: 'Site multilingue',        hint: 'Le site en plusieurs langues' },
        { value: 'Autre',                   label: 'Autre',                   hint: 'Une autre fonctionnalité, à préciser à la fin', soft: true },
        { value: UNKNOWN,                   label: 'Je ne sais pas',          hint: 'Continuer sans choisir', soft: true },
      ],
    },
    {
      key: 'budget', recapLabel: 'Budget',
      title: 'Quel est votre budget ?',
      help: 'Ce n\'est pas un prix définitif, juste une indication pour comprendre votre projet.',
      options: [
        { value: 'Moins de 100 €', label: 'Moins de 100 €', hint: 'Pour un besoin simple' },
        { value: '100 - 300 €',    label: '100 – 300 €',    hint: 'Un petit projet' },
        { value: '300 - 600 €',    label: '300 – 600 €',    hint: 'Un projet intermédiaire' },
        { value: '600 - 1000 €',   label: '600 – 1 000 €',  hint: 'Un projet complet' },
        { value: 'Plus de 1000 €', label: 'Plus de 1 000 €', hint: 'Un projet ambitieux' },
        { value: 'Je ne sais pas', label: 'Je ne sais pas', hint: 'On l\'estimera ensemble', soft: true },
      ],
    },
  ];

  // ── Données (forme identique à build-project.js) ────────
  var data = {
    projectType: '', clientType: '', need: '',
    features: [], featuresUnknown: false, budget: '',
    contact: { prenom: '', nom: '', email: '', tel: '' },
    message: '',
  };
  try {
    var saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || 'null');
    if (saved && typeof saved === 'object') {
      Object.keys(data).forEach(function (k) { if (k in saved) data[k] = saved[k]; });
      if (!Array.isArray(data.features)) data.features = [];
      if (!data.contact || typeof data.contact !== 'object') data.contact = { prenom: '', nom: '', email: '', tel: '' };
    }
  } catch (e) { /* stockage indisponible : on repart à vide */ }

  function save() {
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (e) { /* noop */ }
  }

  function isEmpty(step) {
    if (step.multi) return !data.featuresUnknown && data.features.length === 0;
    return !data[step.key];
  }
  function allEmpty() { return STEPS.every(isEmpty); }

  function recapValue(step) {
    if (step.multi) {
      if (data.featuresUnknown) return 'Je ne sais pas';
      return data.features.length ? data.features.join(', ') : NO_CHOICE;
    }
    return data[step.key] || NO_CHOICE;
  }

  // Résumé texte de l'e-mail, même format que le mini-jeu.
  function buildSummary() {
    var d = data;
    return [
      'Nouvelle demande de projet',
      '',
      'Type : '            + (d.projectType || NO_CHOICE),
      'Profil : '          + (d.clientType  || NO_CHOICE),
      'Besoin : '          + (d.need        || NO_CHOICE),
      'Fonctionnalités : ' + recapValue(STEPS[3]),
      'Budget : '          + (d.budget      || NO_CHOICE),
      '',
      'Informations du client',
      '',
      'Prénom : '    + (d.contact.prenom || ''),
      'Nom : '       + (d.contact.nom || ''),
      'Email : '     + (d.contact.email || ''),
      'Téléphone : ' + (d.contact.tel || 'Non précisé'),
      '',
      'Message',
      '',
      (d.message || 'Non précisé'),
    ].join('\n');
  }

  // ── DOM ────────────────────────────────────────────────
  var root = doc.getElementById('wizard');
  var progress = doc.getElementById('progress');
  var progressLabel = doc.getElementById('progress-label');
  var progressFill = doc.getElementById('progress-fill');

  function el(tag, cls, text) {
    var n = doc.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function button(cls, text, onClick) {
    var b = el('button', cls, text);
    b.type = 'button';
    if (onClick) b.addEventListener('click', onClick);
    return b;
  }
  function arrow() {
    var s = doc.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('class', 'ico');
    s.setAttribute('aria-hidden', 'true');
    var u = doc.createElementNS('http://www.w3.org/2000/svg', 'use');
    u.setAttribute('href', '#i-arrow');
    s.appendChild(u);
    return s;
  }
  function homeHref() { return window.Deeplink ? window.Deeplink.homeHref(true) : 'index.html'; }

  function setProgress(n, label) {
    progress.hidden = false;
    progressLabel.textContent = label;
    progressFill.style.width = Math.round(n * 100) + '%';
  }

  function mount(section) {
    root.innerHTML = '';
    root.appendChild(section);
    var h = section.querySelector('h1');
    if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
    window.scrollTo(0, 0);
  }

  // ── Routage ────────────────────────────────────────────
  var returnToRecap = false;      // étape ouverte depuis « Modifier » du récap
  var advanceTimer = null;
  var onEnter = null;             // action de la touche Entrée pour la vue courante

  function go(hash) {
    if (location.hash === '#' + hash) render();
    else location.hash = hash;
  }

  function nextFrom(i) {
    if (returnToRecap || i === STEPS.length - 1) { returnToRecap = false; go('recap'); }
    else go('etape-' + (i + 2));
  }

  function render() {
    clearTimeout(advanceTimer);
    onEnter = null;
    var h = location.hash.replace(/^#/, '');
    var m = /^etape-(\d)$/.exec(h);
    if (m && +m[1] >= 1 && +m[1] <= STEPS.length) return viewStep(+m[1] - 1);
    if (h === 'recap') return viewRecap();
    if (h === 'coordonnees') return allEmpty() ? go('recap') : viewForm();
    return viewStep(0);
  }

  // ── Étape ──────────────────────────────────────────────
  function viewStep(i) {
    var step = STEPS[i];
    setProgress((i + 1) / (STEPS.length + 1), 'Étape ' + (i + 1) + ' / ' + STEPS.length);

    var sec = el('section', 'step');
    sec.appendChild(el('h1', 'step__title', step.title));
    sec.appendChild(el('p', 'step__help', step.help));

    var list = el('div', 'options' + (step.multi ? ' options--multi' : ''));
    list.setAttribute('role', 'group');
    list.setAttribute('aria-label', step.title);

    var next = button('btn btn--primary', 'Continuer', function () { if (!isEmpty(step)) nextFrom(i); });
    next.appendChild(arrow());
    function syncNext() {
      var off = isEmpty(step);
      next.disabled = off;
      next.setAttribute('aria-disabled', off ? 'true' : 'false');
    }

    step.options.forEach(function (o) {
      var b = el('button', 'option' + (o.soft ? ' option--soft' : ''));
      b.type = 'button';
      b.appendChild(el('span', 'option__label', o.label));
      b.appendChild(el('span', 'option__hint', o.hint));

      function selected() {
        if (!step.multi) return data[step.key] === o.value;
        return o.value === UNKNOWN ? data.featuresUnknown : (!data.featuresUnknown && data.features.indexOf(o.value) !== -1);
      }
      b.setAttribute('aria-pressed', selected() ? 'true' : 'false');

      b.addEventListener('click', function () {
        if (step.multi) {
          if (o.value === UNKNOWN) {
            data.featuresUnknown = !data.featuresUnknown;
            data.features = [];
          } else {
            data.featuresUnknown = false;
            var at = data.features.indexOf(o.value);
            if (at === -1) data.features.push(o.value); else data.features.splice(at, 1);
          }
          save();
          list.querySelectorAll('.option').forEach(function (x, k) {
            var v = step.options[k].value;
            var on = v === UNKNOWN ? data.featuresUnknown : (!data.featuresUnknown && data.features.indexOf(v) !== -1);
            x.setAttribute('aria-pressed', on ? 'true' : 'false');
          });
          syncNext();
          return;
        }
        // Choix unique : on marque le choix, puis on enchaîne tout seul.
        data[step.key] = o.value;
        save();
        list.querySelectorAll('.option').forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
        b.setAttribute('aria-pressed', 'true');
        syncNext();
        clearTimeout(advanceTimer);
        advanceTimer = setTimeout(function () { nextFrom(i); }, 260);
      });
      list.appendChild(b);
    });
    sec.appendChild(list);

    var actions = el('div', 'step__actions');
    if (i > 0) actions.appendChild(button('btn btn--ghost btn-back', 'Étape précédente', function () { returnToRecap = false; go('etape-' + i); }));
    else {
      var home = el('a', 'btn btn--ghost btn-back', 'Revenir au portfolio');
      home.href = homeHref();
      actions.appendChild(home);
    }
    var hint = el('span', 'hint');
    hint.innerHTML = '<kbd>Entrée</kbd> pour continuer';
    actions.appendChild(hint);
    actions.appendChild(next);
    sec.appendChild(actions);
    syncNext();

    onEnter = function () { if (!isEmpty(step)) nextFrom(i); };
    mount(sec);
  }

  // ── Récapitulatif ──────────────────────────────────────
  function viewRecap() {
    setProgress(STEPS.length / (STEPS.length + 1), 'Récapitulatif');

    var sec = el('section', 'step');
    sec.appendChild(el('h1', 'step__title', 'Votre projet'));
    sec.appendChild(el('p', 'step__help', 'Vérifiez vos réponses : chaque étape reste modifiable.'));

    var dl = el('dl', 'recap');
    STEPS.forEach(function (step, i) {
      var row = el('div', 'recap__row');
      row.appendChild(el('dt', null, step.recapLabel));
      var dd = el('dd', isEmpty(step) ? 'is-empty' : null, recapValue(step));
      row.appendChild(dd);
      row.appendChild(button('recap__edit', 'Modifier', function () { returnToRecap = true; go('etape-' + (i + 1)); }));
      dl.appendChild(row);
    });
    sec.appendChild(dl);

    var empty = allEmpty();
    var actions = el('div', 'step__actions');
    actions.appendChild(button('btn btn--ghost', 'Tout recommencer', function () {
      data.projectType = data.clientType = data.need = data.budget = '';
      data.features = []; data.featuresUnknown = false;
      save();
      returnToRecap = false;
      go('etape-1');
    }));
    var next = button('btn btn--primary', 'Continuer', function () { if (!allEmpty()) go('coordonnees'); });
    next.appendChild(arrow());
    next.disabled = empty;
    next.setAttribute('aria-disabled', empty ? 'true' : 'false');
    actions.appendChild(next);
    sec.appendChild(actions);

    var status = el('p', 'status' + (empty ? ' status--error' : ''),
      empty ? 'Sélectionnez au moins un élément dans les étapes pour continuer.' : '');
    status.setAttribute('role', 'status');
    sec.appendChild(status);

    onEnter = function () { if (!allEmpty()) go('coordonnees'); };
    mount(sec);
  }

  // ── Coordonnées + envoi ────────────────────────────────
  function field(label, name, type, opts) {
    opts = opts || {};
    var l = el('label', 'field' + (opts.full ? ' field--full' : ''));
    l.appendChild(doc.createTextNode(label));
    var input = el(type === 'textarea' ? 'textarea' : 'input');
    input.name = name;
    if (type !== 'textarea') input.type = type;
    else input.rows = 5;
    if (opts.auto) input.autocomplete = opts.auto;
    if (opts.required) input.required = true;
    if (opts.value) input.value = opts.value;
    if (opts.placeholder) input.placeholder = opts.placeholder;
    l.appendChild(input);
    return l;
  }
  function hidden(name) {
    var i = el('input');
    i.type = 'hidden';
    i.name = name;
    return i;
  }

  function viewForm() {
    setProgress(1, 'Dernière étape');
    var c = data.contact || {};

    var sec = el('section', 'step');
    sec.appendChild(el('h1', 'step__title', 'Parlons de votre projet'));
    sec.appendChild(el('p', 'step__help', 'Les champs marqués d\'un astérisque (*) sont obligatoires.'));

    var usedAutre = data.projectType === 'Autre' || data.need === 'Autre' || data.features.indexOf('Autre') !== -1;
    var form = el('form', 'form');
    form.noValidate = true;
    form.appendChild(field('Prénom *', 'client_prenom', 'text', { auto: 'given-name', required: true, value: c.prenom }));
    form.appendChild(field('Nom *', 'client_nom', 'text', { auto: 'family-name', required: true, value: c.nom }));
    form.appendChild(field('Adresse e-mail *', 'client_email', 'email', { auto: 'email', required: true, value: c.email }));
    form.appendChild(field('Téléphone (facultatif)', 'client_tel', 'tel', { auto: 'tel', value: c.tel }));
    form.appendChild(field('Message / précisions supplémentaires', 'client_message', 'textarea', {
      full: true, value: data.message,
      placeholder: usedAutre
        ? 'Vous avez choisi « Autre » : précisez ici ce dont vous avez besoin.'
        : 'Un détail, une contrainte, une date… (facultatif)',
    }));
    // Champs attendus par le template EmailJS existant.
    form.appendChild(hidden('from_name'));
    form.appendChild(hidden('from_email'));
    form.appendChild(hidden('message'));

    var actions = el('div', 'step__actions');
    actions.appendChild(button('btn btn--ghost btn-back', 'Retour', function () { go('recap'); }));
    var submit = el('button', 'btn btn--primary', 'Envoyer ma demande');
    submit.type = 'submit';
    actions.appendChild(submit);
    form.appendChild(actions);

    var status = el('p', 'status');
    status.setAttribute('role', 'status');
    status.style.gridColumn = '1 / -1';
    form.appendChild(status);

    if (window.ContactForm) window.ContactForm.warm(form);

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var prenom = form.client_prenom.value.trim();
      var nom    = form.client_nom.value.trim();
      var email  = form.client_email.value.trim();
      var tel    = form.client_tel.value.trim();
      var msg    = form.client_message.value.trim();

      if (!prenom || !nom || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        status.textContent = 'Merci d\'indiquer votre prénom, votre nom et une adresse e-mail valide.';
        status.className = 'status status--error';
        (!prenom ? form.client_prenom : !nom ? form.client_nom : form.client_email).focus();
        return;
      }

      data.contact = { prenom: prenom, nom: nom, email: email, tel: tel };
      data.message = msg;
      save();

      if (allEmpty()) {
        status.textContent = 'Sélectionnez au moins un élément dans les étapes précédentes avant d\'envoyer votre demande.';
        status.className = 'status status--error';
        return;
      }

      form.from_name.value  = (prenom + ' ' + nom).trim();
      form.from_email.value = email;
      form.message.value    = buildSummary();

      submit.disabled = true;
      submit.textContent = 'Envoi…';
      status.textContent = '';
      status.className = 'status';

      window.ContactForm.sendForm(form).then(function () {
        try { sessionStorage.removeItem(STORAGE_KEY); } catch (err) { /* noop */ }
        viewDone();
      }).catch(function (err) {
        console.error('EmailJS error:', err);
        status.textContent = 'L\'envoi a échoué. Vérifiez votre connexion et réessayez, ou écrivez à ' + CONTACT_EMAIL;
        status.className = 'status status--error';
        submit.disabled = false;
        submit.textContent = 'Envoyer ma demande';
      });
    });

    sec.appendChild(form);
    mount(sec);
  }

  // ── Confirmation ───────────────────────────────────────
  function viewDone() {
    progress.hidden = true;
    var sec = el('section', 'step done');
    var check = el('div', 'done__check');
    check.innerHTML = '<svg class="ico" aria-hidden="true"><use href="#i-check"/></svg>';
    sec.appendChild(check);
    sec.appendChild(el('h1', 'step__title', 'Projet transmis'));
    sec.appendChild(el('p', 'step__help', 'Merci pour votre demande. Je reviendrai vers vous rapidement.'));
    var back = el('a', 'btn btn--primary', 'Retour au portfolio');
    back.href = homeHref();
    sec.appendChild(back);
    history.replaceState(null, '', location.pathname);
    mount(sec);
  }

  // ── Clavier : Entrée valide l'étape (hors champs de saisie) ──
  // Choix unique : Entrée sur une option la choisit (et enchaîne).
  // Choix multiple : Espace coche / décoche, Entrée valide l'étape.
  doc.addEventListener('keydown', function (e) {
    if ((e.key !== 'Enter' && e.code !== 'NumpadEnter') || !onEnter) return;
    var t = e.target;
    if (t && /^(INPUT|TEXTAREA|SELECT|A)$/.test(t.tagName)) return;
    if (t && t.tagName === 'BUTTON') {
      var multiOption = t.classList.contains('option') && t.closest('.options--multi');
      if (!multiOption) return;             // bouton normal : son propre clic
    }
    e.preventDefault();
    onEnter();
  });

  window.addEventListener('hashchange', render);
  render();
})();
