/* ══════════════════════════════════════════════════════
   BUILD-PROJECT.JS — « Construisez votre projet »
   Expérience guidée dans l'univers du portfolio.

   Réutilise EXACTEMENT les briques du jeu :
     • Controls / MobileControls  (js/controls.js, js/mobileControls.js)
     • Player                     (js/player.js)
     • AudioManager               (js/audio.js)  — musique + SFX + SOUND ON/OFF
     • EmailJS                    (même service / template que le formulaire
                                   de contact du portfolio)

   Le joueur avance étape par étape. Chaque étape = une salle avec
   plusieurs PORTES. Il marche jusqu'à une porte et interagit.
   ══════════════════════════════════════════════════════ */

'use strict';

(function () {
  // ── Réglages monde (locaux : map.js n'est PAS chargé ici) ──
  const GROUND_RATIO    = 0.74;
  const INTERACT_RADIUS = 82;
  const SPAWN_X         = 90;
  const FIRST_DOOR_X    = 320;
  const DOOR_SPACING    = 220;
  const DOOR_W          = 94;
  const DOOR_H          = 152;

  const STORAGE_KEY = 'drame.buildproject';

  // Libellé affiché quand une étape n'a reçu aucune sélection.
  const NO_CHOICE = 'Aucun choix';

  // Adresse de repli affichée si l'envoi échoue (même que le portfolio).
  const CONTACT_EMAIL = 'arphandrame0@gmail.com';

  // Config EmailJS — IDENTIQUE au formulaire de contact (js/interactions.js).
  const EMAILJS_SERVICE  = 'service_kju3n28';
  const EMAILJS_TEMPLATE = 'template_pili6gr';

  // ── Étapes ────────────────────────────────────────────
  const STEPS = [
    {
      key: 'projectType',
      recapLabel: 'TYPE DE PROJET',
      title: 'QUE VOULEZ-VOUS CREER ?',
      help: 'Vous pourrez modifier vos choix à la fin en cas de doute.',
      multi: false,
      doors: [
        { value: 'Site web',                       label: 'SITE WEB',           hint: 'Presenter votre activite en ligne' },
        { value: 'Boutique en ligne (e-commerce)', label: 'E-COMMERCE',         hint: 'Vendre vos produits sur internet' },
        { value: 'Application web',                label: 'APPLICATION WEB',    hint: 'Un outil qui s\'ouvre dans le navigateur' },
        { value: 'Application mobile',             label: 'APPLICATION MOBILE', hint: 'Une app a installer sur telephone' },
        { value: 'Site WordPress',                label: 'WORDPRESS',          hint: 'Un site que vous pourrez modifier vous-meme' },
        { value: 'Boutique Shopify',              label: 'SHOPIFY',            hint: 'Une boutique en ligne prete a l\'emploi' },
        { value: 'Autre',                         label: 'AUTRE',              hint: 'Votre idee ne rentre dans aucune case' },
      ],
    },
    {
      key: 'clientType',
      recapLabel: 'PROFIL',
      title: 'POUR QUI EST CE PROJET ?',
      help: 'Cela m\'aide à adapter ma proposition. Choisissez « Je ne sais pas » si vous hésitez.',
      multi: false,
      doors: [
        { value: 'Particulier',    label: 'PARTICULIER',    hint: 'Un projet personnel' },
        { value: 'Professionnel',  label: 'PROFESSIONNEL',  hint: 'Entreprise, independant, commercant' },
        { value: 'Association',     label: 'ASSOCIATION',    hint: 'Structure a but non lucratif' },
        { value: 'Étudiant',       label: 'ETUDIANT',       hint: 'Projet d\'etudes ou personnel' },
        { value: 'Autre',          label: 'AUTRE',          hint: 'Une autre situation' },
        { value: 'Je ne sais pas', label: 'JE NE SAIS PAS', hint: 'On en parlera ensemble' },
      ],
    },
    {
      key: 'need',
      recapLabel: 'BESOIN',
      title: 'DE QUOI AVEZ-VOUS BESOIN ?',
      help: 'Dites-moi simplement où vous en êtes aujourd\'hui.',
      multi: false,
      doors: [
        { value: 'Création',                   label: 'CREATION',                hint: 'Partir de zero' },
        { value: 'Refonte',                    label: 'REFONTE',                 hint: 'Refaire un site qui existe deja' },
        { value: 'Ajout de fonctionnalités',   label: 'AJOUT DE FONCTIONNALITES', hint: 'Completer un site existant' },
        { value: 'Correction / dépannage',     label: 'CORRECTION / DEPANNAGE',  hint: 'Quelque chose ne fonctionne plus' },
        { value: 'Maintenance',                label: 'MAINTENANCE',             hint: 'Garder le site a jour dans le temps' },
        { value: 'Accompagnement',             label: 'ACCOMPAGNEMENT',          hint: 'Etre conseille et guide' },
        { value: 'Autre',                      label: 'AUTRE',                   hint: 'Un autre besoin, a preciser a la fin' },
        { value: 'Je ne sais pas',             label: 'JE NE SAIS PAS',          hint: 'On fera le point ensemble' },
      ],
    },
    {
      key: 'features',
      recapLabel: 'FONCTIONNALITES',
      title: 'QUELLES FONCTIONNALITES VOUS INTERESSENT ?',
      help: 'Vous pouvez en choisir plusieurs. Passez par « Je ne sais pas » pour continuer sans choisir.',
      multi: true,
      doors: [
        { value: 'Paiement en ligne',       label: 'PAIEMENT EN LIGNE',      hint: 'Encaisser des paiements par carte' },
        { value: 'Réservation',             label: 'RESERVATION',            hint: 'Prendre des rendez-vous ou des reservations' },
        { value: 'Compte utilisateur',      label: 'COMPTE UTILISATEUR',     hint: 'Vos visiteurs peuvent se connecter' },
        { value: 'Espace administration',   label: 'ESPACE ADMINISTRATION',  hint: 'Un espace prive pour gerer le contenu' },
        { value: 'Base de données',         label: 'BASE DE DONNEES',        hint: 'Stocker et retrouver des informations' },
        { value: 'API / services externes', label: 'API / SERVICES EXTERNES', hint: 'Se connecter a d\'autres outils' },
        { value: 'Site multilingue',        label: 'SITE MULTILINGUE',       hint: 'Le site en plusieurs langues' },
        { value: 'Autre',                   label: 'AUTRE',                  hint: 'Une autre fonctionnalite, a preciser a la fin' },
        { value: '__unknown__', special: 'unknown', label: 'JE NE SAIS PAS', hint: 'Continuer sans choisir' },
        { value: '__done__',    special: 'done',    label: 'TERMINER LA SELECTION', hint: 'Valider et passer a la suite' },
      ],
    },
    {
      key: 'budget',
      recapLabel: 'BUDGET',
      title: 'QUEL EST VOTRE BUDGET ?',
      help: 'Ce n\'est pas un prix définitif, juste une indication pour comprendre votre projet.',
      multi: false,
      doors: [
        { value: 'Moins de 100 €', label: 'MOINS DE 100 E', hint: 'Pour un besoin simple' },
        { value: '100 - 300 €',    label: '100 - 300 E',    hint: 'Un petit projet' },
        { value: '300 - 600 €',    label: '300 - 600 E',    hint: 'Un projet intermediaire' },
        { value: '600 - 1000 €',   label: '600 - 1000 E',   hint: 'Un projet complet' },
        { value: 'Plus de 1000 €', label: 'PLUS DE 1000 E', hint: 'Un projet ambitieux' },
        { value: 'Je ne sais pas', label: 'JE NE SAIS PAS', hint: 'On l\'estimera ensemble' },
      ],
    },
  ];

  // ── État / données ────────────────────────────────────
  const state = {
    step: 0,
    phase: 'walk', // walk | recap | form | done
    data: {
      projectType: '',
      clientType: '',
      need: '',
      features: [],
      featuresUnknown: false,
      budget: '',
      contact: { prenom: '', nom: '', email: '', tel: '' },
      message: '',
    },
  };

  function loadState() {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const d = JSON.parse(raw);
      if (d && typeof d === 'object') {
        Object.assign(state.data, d);
        if (!Array.isArray(state.data.features)) state.data.features = [];
        if (!state.data.contact || typeof state.data.contact !== 'object') {
          state.data.contact = { prenom: '', nom: '', email: '', tel: '' };
        }
      }
    } catch (e) { /* stockage indisponible : on repart a vide */ }
  }

  function saveState() {
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state.data)); }
    catch (e) { /* noop */ }
  }

  function sfx(name) {
    if (window.AudioManager) window.AudioManager.play(name);
  }

  // ── Résumé texte pour l'e-mail (format demandé) ───────
  function buildSummary() {
    const d = state.data;
    const feat = d.featuresUnknown
      ? 'Je ne sais pas'
      : (d.features.length ? d.features.join(', ') : NO_CHOICE);

    return [
      'Nouvelle demande de projet',
      '',
      'Type : '            + (d.projectType || NO_CHOICE),
      'Profil : '          + (d.clientType  || NO_CHOICE),
      'Besoin : '          + (d.need        || NO_CHOICE),
      'Fonctionnalités : ' + feat,
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

  // ── Sélection : une étape est-elle restée sans aucun choix ? ──
  function isStepEmpty(step) {
    const d = state.data;
    if (step.multi) return !d.featuresUnknown && d.features.length === 0;
    return !d[step.key];
  }

  // Toutes les étapes sont-elles à « Aucun choix » ? (bloque l'envoi)
  function allStepsEmpty() {
    return STEPS.every(isStepEmpty);
  }

  // ── Moteur ────────────────────────────────────────────
  class BuildProject {
    constructor() {
      this.canvas = document.getElementById('bpCanvas');
      this.ctx    = this.canvas.getContext('2d');
      this.ctx.imageSmoothingEnabled = false;

      this.controls = new Controls();
      this.mobile   = new MobileControls(this.controls);

      this._touch = (window.matchMedia &&
        window.matchMedia('(hover: none) and (pointer: coarse)').matches) ||
        'ontouchstart' in window || window.innerWidth <= 900;

      this.player = new Player(SPAWN_X, 100);
      // Sur cette page, on masque l'étiquette « RECRUTEZ MOI ! » du jeu :
      // le personnage reste identique, sans le libellé hors sujet ici.
      this.player._drawNametag = function () {};

      this.cameraX = 0;
      this._targetX = 0;
      this._tick = 0;
      this._nearDoor = null;
      this._transitioning = false;
      this._moved = false;      // le joueur a-t-il déjà bougé ? (rappel clavier)
      this._movedAt = 0;
      this.doors = [];
      this.worldWidth = 1200;

      // Voile de transition (créé une fois)
      this._fadeEl = document.createElement('div');
      this._fadeEl.id = 'bp-fade';
      document.body.appendChild(this._fadeEl);

      this._toastEl = document.getElementById('bp-toast');

      this._resize();
      window.addEventListener('resize', () => this._resize());

      this._relabelMobile();
      this._bindUI();

      this._buildStep(state.step, true);
      requestAnimationFrame(() => this._loop());

      // La musique reprend l'ambiance du portfolio (démarre au 1er geste,
      // exactement comme dans le jeu — géré par js/audio.js).
      if (window.AudioManager) window.AudioManager.playMusic();
    }

    _resize() {
      this.canvas.width  = window.innerWidth;
      this.canvas.height = window.innerHeight;
      this.ctx.imageSmoothingEnabled = false;
      this.zoom = Math.min(2.2, Math.max(1, window.innerWidth / 900));
      const eh = Math.round(this.canvas.height / this.zoom);
      this.player.groundY = Math.round(eh * GROUND_RATIO);
    }

    _relabelMobile() {
      const close = document.getElementById('mbtn-close');
      if (close) close.textContent = 'RETOUR';
      const enter = document.getElementById('mbtn-enter');
      if (enter) enter.textContent = 'CHOISIR';
    }

    // ── UI (HUD + panneaux) ────────────────────────────
    _bindUI() {
      document.getElementById('bp-back')?.addEventListener('click', () => this._back());
      document.getElementById('bp-quit')?.addEventListener('click', () => {
        sfx('close');
        window.location.href = 'index.html';
      });

      // Bouton « valider l'étape » : équivalent tactile de la touche Entrée.
      document.getElementById('bp-next')?.addEventListener('click', () => {
        if (state.phase !== 'walk' || this._transitioning) return;
        sfx('success');
        this._advance();
      });

      // Touche Entrée : elle NE DOIT JAMAIS ouvrir, sélectionner ou valider une
      // porte — seule la flèche Haut le permet. Entrée se contente de valider
      // l'étape courante quand un choix a déjà été fait (équivalent du bouton
      // « Valider l'étape »). Neutre dans les champs de formulaire.
      window.addEventListener('keydown', (e) => {
        if (e.code !== 'Enter' && e.code !== 'NumpadEnter') return;
        const tag = document.activeElement && document.activeElement.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA') return;

        if (state.phase === 'walk') {
          if (this._transitioning) return;
          // Aucune interaction avec la porte devant soi : on ne fait qu'avancer
          // si l'étape possède déjà une valeur.
          if (this._stepHasValue()) {
            e.preventDefault();
            sfx('success');
            this._advance();
          }
        } else if (state.phase === 'recap') {
          const t = document.activeElement;
          if (!t || t === document.body) {
            e.preventDefault();
            document.getElementById('bp-recap-next')?.click();
          }
        }
      });

      document.getElementById('bp-recap-edit')?.addEventListener('click', () => {
        sfx('close');
        this._transitioning = true;
        this._fade(() => this._buildStep(0));
      });
      document.getElementById('bp-recap-next')?.addEventListener('click', () => {
        // Blocage : impossible de continuer si aucune étape n'a de choix.
        if (allStepsEmpty()) {
          sfx('close');
          this._updateRecapGate();
          return;
        }
        sfx('open');
        state.phase = 'form';
        this._prefillForm();
        this._syncUI();
        document.querySelector('#bp-form-el [name="client_prenom"]')?.focus();
      });

      document.getElementById('bp-form-back')?.addEventListener('click', () => {
        sfx('close');
        state.phase = 'recap';
        this._renderRecap();
        this._syncUI();
      });

      const form = document.getElementById('bp-form-el');
      form?.addEventListener('submit', (e) => this._onSubmit(e));
    }

    _syncUI() {
      const walk = state.phase === 'walk';

      const hud  = document.getElementById('bp-hud');
      const back = document.getElementById('bp-back');
      hud?.classList.toggle('hidden', !walk);
      back?.classList.toggle('hidden', !walk);

      if (walk) {
        const step = STEPS[state.step];
        const counter = document.getElementById('bp-counter');
        if (counter) counter.textContent = (state.step + 1) + ' / ' + STEPS.length;
        const fill = document.getElementById('bp-progress-fill');
        if (fill) fill.style.right = (100 - Math.round(((state.step + 1) / STEPS.length) * 100)) + '%';
        document.getElementById('bp-title').textContent = step.title;
        document.getElementById('bp-help').textContent  = step.help;
        back.textContent = state.step === 0 ? 'Revenir au portfolio' : 'Etape precedente';

        // Transition douce du HUD à chaque changement d'étape.
        if (hud) { hud.classList.remove('bp-hud--change'); void hud.offsetWidth; hud.classList.add('bp-hud--change'); }
      }
      this._updateNextBtn();

      document.getElementById('bp-recap')?.classList.toggle('hidden', state.phase !== 'recap');
      document.getElementById('bp-form')?.classList.toggle('hidden', state.phase !== 'form');
      document.getElementById('bp-done')?.classList.toggle('hidden', state.phase !== 'done');

      const mb = document.getElementById('mobile-btns');
      if (mb) mb.style.display = walk ? 'flex' : 'none';
    }

    // ── Construction d'une étape ───────────────────────
    _buildStep(index, instant) {
      state.step  = index;
      state.phase = 'walk';
      const step  = STEPS[index];

      this.doors = step.doors.map((d, i) => ({
        value:   d.value,
        label:   d.label,
        hint:    d.hint || '',
        special: d.special || null,
        x: FIRST_DOOR_X + i * DOOR_SPACING,
        w: DOOR_W,
        h: DOOR_H,
        open: 0,
        opening: false,
        selected: this._isSelected(step, d),
      }));

      this.worldWidth = FIRST_DOOR_X + (step.doors.length - 1) * DOOR_SPACING + 240;
      this.player.x = SPAWN_X;
      this.player.facing = 'right';
      this.player.vx = 0;
      this.cameraX = instant ? 0 : this.cameraX;
      this._targetX = 0;
      this._nearDoor = null;
      this._transitioning = false;

      this._syncUI();
    }

    _isSelected(step, door) {
      if (step.multi) {
        if (door.special) return false;
        return state.data.features.includes(door.value);
      }
      return state.data[step.key] === door.value;
    }

    // ── Boucle ─────────────────────────────────────────
    _loop() {
      if (document.hidden) { requestAnimationFrame(() => this._loop()); return; }

      this._tick++;
      const walk = state.phase === 'walk' && !this._transitioning;

      if (walk) {
        this.player.move(this.controls, this.worldWidth);
        this._nearDoor = this._findNearDoor();

        if (!this._moved && (this.controls.left || this.controls.right)) {
          this._moved = true;
          this._movedAt = this._tick;
        }

        // « Flèche Haut » (ou bouton tactile « CHOISIR ») = CHOISIR, rien
        // d'autre : elle sélectionne la porte devant laquelle se tient le
        // joueur. Sans porte à proximité, la touche est ignorée. Elle ne fait
        // JAMAIS passer à l'étape suivante — c'est le rôle exclusif d'« Entrée »
        // (ou du bouton « Valider l'étape »).
        if (this.controls._justPressed('ArrowUp')) {
          if (this._nearDoor) this._choose(this._nearDoor);
        } else if (this.controls.close) {
          this._back();
        }

        this._updateNextBtn();
      }
      this.controls.flush();

      for (const d of this.doors) {
        if (d.opening && d.open < 1) d.open = Math.min(1, d.open + 0.13);
      }

      this._render();
      requestAnimationFrame(() => this._loop());
    }

    _findNearDoor() {
      let best = null, bestDist = INTERACT_RADIUS;
      for (const d of this.doors) {
        const dist = Math.abs(this.player.x - (d.x + d.w / 2));
        if (dist < bestDist) { best = d; bestDist = dist; }
      }
      return best;
    }

    // ── Sélection d'une porte (Flèche Haut / bouton « CHOISIR ») ────────
    // Ne valide jamais l'étape à choix unique : elle se contente de mémoriser
    // et d'afficher la sélection. Le passage à l'étape suivante est réservé à
    // « Entrée » / au bouton « Valider l'étape ».
    _choose(door) {
      const step = STEPS[state.step];

      if (step.multi) {
        // Portes d'action de l'étape multi. « TERMINER LA SELECTION » est
        // l'équivalent tactile d'« Entrée » (indispensable sans clavier) et
        // « JE NE SAIS PAS » est un choix qui clôt aussi l'étape.
        if (door.special === 'done') {
          sfx('success');
          this._advance();
          return;
        }
        if (door.special === 'unknown') {
          state.data.features = [];
          state.data.featuresUnknown = true;
          saveState();
          sfx('success');
          this._advance();
          return;
        }
        door.selected = !door.selected;
        state.data.featuresUnknown = false;
        const set = new Set(state.data.features);
        if (door.selected) set.add(door.value); else set.delete(door.value);
        state.data.features = Array.from(set);
        saveState();
        sfx('click');
        this._toast(door.selected ? 'Ajoute : ' + door.label : 'Retire : ' + door.label);
        return;
      }

      // Choix unique : on MÉMORISE seulement la porte choisie et on la met en
      // évidence. Aucun avancement ici — il faut ensuite appuyer sur « Entrée »
      // (ou le bouton « Valider l'étape »).
      if (state.data[step.key] === door.value) return; // déjà sélectionnée
      this.doors.forEach((dr) => { dr.selected = (dr === door); });
      state.data[step.key] = door.value;
      saveState();
      sfx('open');
      this._toast('Choix : ' + door.label);
      this._updateNextBtn();
    }

    // Un choix est-il déjà fait pour l'étape courante ?
    _stepHasValue() {
      const step = STEPS[state.step];
      if (!step) return false;
      if (step.multi) return state.data.featuresUnknown || state.data.features.length > 0;
      return !!state.data[step.key];
    }

    _hideNextBtn() {
      document.getElementById('bp-next')?.classList.add('hidden');
    }

    _updateNextBtn() {
      const btn = document.getElementById('bp-next');
      if (!btn) return;
      const show = state.phase === 'walk' && !this._transitioning && this._stepHasValue();
      btn.classList.toggle('hidden', !show);
    }

    _advance() {
      this._transitioning = true;
      this._hideNextBtn();
      sfx('transition');
      this._fade(() => {
        if (state.step < STEPS.length - 1) {
          this._buildStep(state.step + 1);
        } else {
          state.phase = 'recap';
          this._renderRecap();
          this._transitioning = false;
          this._syncUI();
        }
      });
    }

    _back() {
      if (this._transitioning) return;
      this._transitioning = true;
      this._hideNextBtn();
      sfx('close');
      this._fade(() => {
        if (state.step === 0) { window.location.href = 'index.html'; return; }
        this._buildStep(state.step - 1);
      });
    }

    _fade(midCb) {
      const f = this._fadeEl;
      f.classList.add('bp-fade--on');
      setTimeout(() => {
        midCb();
        requestAnimationFrame(() => requestAnimationFrame(() => f.classList.remove('bp-fade--on')));
      }, 190);
    }

    // ── Récapitulatif ──────────────────────────────────
    _recapValue(step) {
      const d = state.data;
      if (step.key === 'features') {
        if (d.featuresUnknown) return 'Je ne sais pas';
        return d.features.length ? d.features.join(', ') : NO_CHOICE;
      }
      return d[step.key] || NO_CHOICE;
    }

    // Bloque « Continuer » tant qu'aucune étape n'a de choix + message associé.
    _updateRecapGate() {
      const empty = allStepsEmpty();
      const btn = document.getElementById('bp-recap-next');
      if (btn) {
        btn.disabled = empty;
        btn.setAttribute('aria-disabled', empty ? 'true' : 'false');
      }
      const status = document.getElementById('bp-recap-status');
      if (status) {
        status.textContent = empty
          ? 'Sélectionnez au moins un élément dans les étapes pour continuer.'
          : '';
        status.className = empty
          ? 'bp-form-status bp-form-status--error'
          : 'bp-form-status';
      }
      return empty;
    }

    _renderRecap() {
      const list = document.getElementById('bp-recap-list');
      list.innerHTML = STEPS.map((step, i) =>
        '<div class="bp-recap-row" data-step="' + i + '">' +
          '<div class="bp-recap-row__head">' +
            '<dt>' + escapeHtml(step.recapLabel) + '</dt>' +
            '<button type="button" class="bp-recap-edit-btn" data-edit="' + i + '">Modifier cette etape</button>' +
          '</div>' +
          '<dd data-val="' + i + '">' + escapeHtml(this._recapValue(step)) + '</dd>' +
          '<div class="bp-recap-choices hidden" data-choices="' + i + '"></div>' +
        '</div>'
      ).join('');

      list.querySelectorAll('.bp-recap-edit-btn').forEach((btn) => {
        btn.addEventListener('click', () => this._toggleRecapEditor(Number(btn.dataset.edit)));
      });

      this._updateRecapGate();
    }

    _updateRecapValue(i) {
      const dd = document.querySelector('.bp-recap-row[data-step="' + i + '"] dd[data-val]');
      if (dd) dd.textContent = this._recapValue(STEPS[i]);
      this._updateRecapGate();
    }

    _toggleRecapEditor(i) {
      const box = document.querySelector('.bp-recap-choices[data-choices="' + i + '"]');
      if (!box) return;
      const wasOpen = !box.classList.contains('hidden');

      // On ne garde qu'un éditeur ouvert à la fois.
      document.querySelectorAll('.bp-recap-choices').forEach((el) => {
        el.classList.add('hidden');
        el.innerHTML = '';
      });
      document.querySelectorAll('.bp-recap-edit-btn').forEach((b) => b.classList.remove('is-active'));

      if (wasOpen) { sfx('close'); return; }

      sfx('open');
      document.querySelector('.bp-recap-edit-btn[data-edit="' + i + '"]')?.classList.add('is-active');
      this._renderRecapChoices(i, box);
      box.classList.remove('hidden');
    }

    _closeRecapEditor(box, i) {
      box.classList.add('hidden');
      box.innerHTML = '';
      document.querySelector('.bp-recap-edit-btn[data-edit="' + i + '"]')?.classList.remove('is-active');
    }

    _renderRecapChoices(i, box) {
      const step = STEPS[i];
      const d = state.data;
      const options = step.doors.filter((dr) => !dr.special);

      if (step.multi) {
        box.innerHTML =
          options.map((o) =>
            '<button type="button" class="bp-choice-chip' +
              ((!d.featuresUnknown && d.features.includes(o.value)) ? ' is-on' : '') +
              '" data-val="' + escapeHtml(o.value) + '">' + escapeHtml(o.label) + '</button>'
          ).join('') +
          '<button type="button" class="bp-choice-chip' + (d.featuresUnknown ? ' is-on' : '') +
            '" data-unknown="1">JE NE SAIS PAS</button>' +
          '<button type="button" class="bp-btn bp-btn--primary bp-choice-done">Termine</button>';

        box.querySelectorAll('.bp-choice-chip[data-val]').forEach((b) => {
          b.addEventListener('click', () => {
            d.featuresUnknown = false;
            const set = new Set(d.features);
            if (set.has(b.dataset.val)) set.delete(b.dataset.val);
            else set.add(b.dataset.val);
            d.features = Array.from(set);
            saveState();
            sfx('click');
            b.classList.toggle('is-on');
            box.querySelector('.bp-choice-chip[data-unknown]')?.classList.remove('is-on');
            this._updateRecapValue(i);
          });
        });

        box.querySelector('.bp-choice-chip[data-unknown]')?.addEventListener('click', () => {
          d.featuresUnknown = true;
          d.features = [];
          saveState();
          sfx('click');
          this._renderRecapChoices(i, box);
          this._updateRecapValue(i);
        });

        box.querySelector('.bp-choice-done')?.addEventListener('click', () => {
          sfx('close');
          this._closeRecapEditor(box, i);
        });
        return;
      }

      // Choix unique : un clic remplace la valeur et referme l'éditeur.
      box.innerHTML = options.map((o) =>
        '<button type="button" class="bp-choice-chip' +
          (d[step.key] === o.value ? ' is-on' : '') +
          '" data-val="' + escapeHtml(o.value) + '">' + escapeHtml(o.label) + '</button>'
      ).join('');

      box.querySelectorAll('.bp-choice-chip[data-val]').forEach((b) => {
        b.addEventListener('click', () => {
          d[step.key] = b.dataset.val;
          saveState();
          sfx('success');
          box.querySelectorAll('.bp-choice-chip').forEach((c) => c.classList.remove('is-on'));
          b.classList.add('is-on');
          this._updateRecapValue(i);
          setTimeout(() => this._closeRecapEditor(box, i), 240);
        });
      });
    }

    // ── Formulaire ─────────────────────────────────────
    _prefillForm() {
      const form = document.getElementById('bp-form-el');
      if (!form) return;
      const c = state.data.contact || {};
      form.client_prenom.value  = c.prenom || '';
      form.client_nom.value     = c.nom || '';
      form.client_email.value   = c.email || '';
      form.client_tel.value     = c.tel || '';
      form.client_message.value = state.data.message || '';

      const usedAutre =
        state.data.projectType === 'Autre' ||
        state.data.need === 'Autre' ||
        state.data.features.includes('Autre');
      const msg = document.getElementById('bp-msg');
      if (msg) {
        msg.placeholder = usedAutre
          ? 'Vous avez choisi « Autre » : précisez ici ce dont vous avez besoin.'
          : 'Un détail, une contrainte, une date… (facultatif)';
      }

      const status = document.getElementById('bp-form-status');
      if (status) { status.textContent = ''; status.className = 'bp-form-status'; }
    }

    async _onSubmit(e) {
      e.preventDefault();
      const form   = e.currentTarget;
      const btn    = document.getElementById('bp-form-submit');
      const status = document.getElementById('bp-form-status');

      const prenom = form.client_prenom.value.trim();
      const nom    = form.client_nom.value.trim();
      const email  = form.client_email.value.trim();
      const tel    = form.client_tel.value.trim();
      const msg    = form.client_message.value.trim();

      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      if (!prenom || !nom || !emailOk) {
        status.textContent = 'Merci d\'indiquer votre prénom, votre nom et une adresse e-mail valide.';
        status.className = 'bp-form-status bp-form-status--error';
        if (!prenom)       form.client_prenom.focus();
        else if (!nom)     form.client_nom.focus();
        else               form.client_email.focus();
        return;
      }

      state.data.contact = { prenom, nom, email, tel };
      state.data.message = msg;
      saveState();

      // Blocage final juste avant l'envoi : au moins une étape doit avoir un choix.
      if (allStepsEmpty()) {
        status.textContent =
          'Sélectionnez au moins un élément dans les étapes précédentes avant d\'envoyer votre demande.';
        status.className = 'bp-form-status bp-form-status--error';
        return;
      }

      // Champs attendus par le template EmailJS existant.
      form.from_name.value  = (prenom + ' ' + nom).trim();
      form.from_email.value = email;
      form.message.value    = buildSummary();

      btn.disabled = true;
      btn.textContent = 'ENVOI...';
      status.textContent = '';
      status.className = 'bp-form-status';

      try {
        await emailjs.sendForm(EMAILJS_SERVICE, EMAILJS_TEMPLATE, form);
        sfx('success');
        try { sessionStorage.removeItem(STORAGE_KEY); } catch (err) { /* noop */ }
        state.phase = 'done';
        this._syncUI();
      } catch (err) {
        console.error('EmailJS error:', err);
        status.textContent =
          'L\'envoi a échoué. Vérifiez votre connexion et réessayez, ou écrivez à ' + CONTACT_EMAIL;
        status.className = 'bp-form-status bp-form-status--error';
        btn.disabled = false;
        btn.textContent = 'Envoyer ma demande';
      }
    }

    // ── Toast ──────────────────────────────────────────
    _toast(text) {
      const t = this._toastEl;
      if (!t) return;
      clearTimeout(this._toastT);
      t.textContent = text;
      t.classList.remove('hidden', 'toast-hide');
      t.classList.add('toast-show');
      this._toastT = setTimeout(() => {
        t.classList.remove('toast-show');
        t.classList.add('toast-hide');
        setTimeout(() => t.classList.add('hidden'), 400);
      }, 1400);
    }

    // ── Rendu ──────────────────────────────────────────
    _render() {
      const ctx  = this.ctx;
      const w    = this.canvas.width;
      const h    = this.canvas.height;
      const zoom = this.zoom;
      const ew   = w / zoom;
      const eh   = h / zoom;

      this._targetX = this.player.x - ew / 2;
      this._targetX = Math.max(0, Math.min(Math.max(0, this.worldWidth - ew), this._targetX));
      this.cameraX += (this._targetX - this.cameraX) * 0.12;
      const camX = Math.round(this.cameraX);

      ctx.clearRect(0, 0, w, h);
      ctx.save();
      ctx.scale(zoom, zoom);

      const groundY = Math.round(eh * GROUND_RATIO);

      this._drawSky(ctx, eh);
      this._drawClouds(ctx, camX);
      this._drawGround(ctx, camX, groundY, eh);
      this._drawTrees(ctx, camX, groundY);

      for (const d of this.doors) {
        const sx = d.x - camX;
        if (sx > ew + 80 || sx + d.w < -80) continue;
        this._drawDoor(ctx, d, sx, groundY, d === this._nearDoor && !this._transitioning);
      }

      this.player.draw(ctx, camX);

      if (this._nearDoor && state.phase === 'walk' && !this._transitioning) {
        this._drawPrompt(ctx, camX, groundY);
      }
      if (!this._touch && state.phase === 'walk') {
        this._drawHintBar(ctx, ew, eh);
      }

      ctx.restore();
    }

    _drawSky(ctx, eh) {
      const w = ctx.canvas.width;
      const skyH = eh * GROUND_RATIO;

      const grad = ctx.createLinearGradient(0, 0, 0, skyH);
      grad.addColorStop(0, '#0e1630');
      grad.addColorStop(0.5, '#16213f');
      grad.addColorStop(1, '#1b1533');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, skyH + 2);

      // Disque lumineux magenta / violet
      const cx = w * 0.24, cy = skyH * 0.32, r = Math.max(50, w * 0.08);
      const halo = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 3);
      halo.addColorStop(0, 'rgba(255,43,176,0.45)');
      halo.addColorStop(0.4, 'rgba(138,59,255,0.2)');
      halo.addColorStop(1, 'rgba(138,59,255,0)');
      ctx.fillStyle = halo;
      ctx.fillRect(0, 0, w, skyH);
      ctx.fillStyle = 'rgba(255,60,190,0.8)';
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();

      // Halo bas cyan
      const low = ctx.createLinearGradient(0, skyH - 110, 0, skyH);
      low.addColorStop(0, 'rgba(25,232,255,0)');
      low.addColorStop(1, 'rgba(25,232,255,0.16)');
      ctx.fillStyle = low;
      ctx.fillRect(0, skyH - 110, w, 110);

      // Éclats fixes
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      for (let i = 0; i < 50; i++) {
        ctx.fillRect((i * 137.5) % w, (i * 71.3) % skyH, 1.5, 1.5);
      }

      // Fils de toile — diagonales très ténues
      ctx.save();
      ctx.strokeStyle = 'rgba(255,255,255,0.05)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 5; i++) {
        const gx = ((i * 261) % (w + 200)) - 100;
        ctx.beginPath(); ctx.moveTo(gx, -20); ctx.lineTo(gx + skyH * 0.7, skyH); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(gx + 140, -20); ctx.lineTo(gx + 140 - skyH * 0.7, skyH); ctx.stroke();
      }
      ctx.restore();

      const ht = getHalftone(ctx);
      if (ht) { ctx.fillStyle = ht; ctx.fillRect(0, 0, w, skyH); }

      // Skyline urbaine dense (2 couches de parallaxe)
      this._drawSkyline(ctx, skyH);
    }

    _drawSkyline(ctx, skyH) {
      const w = ctx.canvas.width;
      const base = skyH + 2;
      const camX = this.cameraX;
      const layer = (par, step, color, hMin, hMod, wMin, wMod, winA, winB) => {
        const off = -(camX * par) % step;
        for (let x = off - step; x < w + step; x += step) {
          const seed = Math.round((x + camX * par) / step);
          const bh = hMin + ((seed * 53) % hMod);
          const bw = wMin + ((seed * 29) % wMod);
          const bx = Math.round(x);
          ctx.fillStyle = color;
          ctx.fillRect(bx, base - bh, bw, bh);
          const kind = seed % 3;
          if (kind === 0) ctx.fillRect(bx + bw * 0.2, base - bh - 14, bw * 0.6, 14);
          else if (kind === 1) { ctx.fillRect(bx + bw * 0.5 - 7, base - bh - 18, 14, 12); ctx.fillRect(bx + bw * 0.5 - 2, base - bh - 24, 4, 6); }
          else ctx.fillRect(bx + bw * 0.5 - 1, base - bh - 22, 2, 22);
          ctx.fillStyle = seed % 2 ? winA : winB;
          for (let wy = base - bh + 10; wy < base - 6; wy += 14) {
            for (let wx = bx + 6; wx < bx + bw - 6; wx += 12) {
              if ((wx + wy + seed) % 3) ctx.fillRect(wx, wy, 3, 3);
            }
          }
        }
      };
      layer(0.18, 110, '#0b1122', 60, 110, 44, 40, 'rgba(25,232,255,0.12)', 'rgba(255,43,176,0.10)');
      layer(0.34, 180, '#0d1630', 84, 140, 70, 60, 'rgba(25,232,255,0.18)', 'rgba(255,43,176,0.16)');
    }

    _drawClouds(ctx, camX) {
      const clouds = [
        { x: 120, y: 50, w: 100, h: 36 },
        { x: 520, y: 34, w: 84, h: 30 },
        { x: 900, y: 66, w: 120, h: 40 },
        { x: 1400, y: 44, w: 96, h: 34 },
        { x: 1950, y: 58, w: 110, h: 38 },
        { x: 2450, y: 40, w: 90, h: 30 },
      ];
      for (const c of clouds) {
        const cx = c.x - camX * 0.2;
        const g = ctx.createLinearGradient(cx, c.y, cx, c.y + c.h);
        g.addColorStop(0, 'rgba(138,59,255,0.1)');
        g.addColorStop(1, 'rgba(25,232,255,0.05)');
        ctx.fillStyle = g;
        ctx.fillRect(cx + 10, c.y, c.w - 20, c.h);
        ctx.fillRect(cx, c.y + 8, c.w, c.h - 14);
      }
    }

    _drawGround(ctx, camX, groundY, eh) {
      const w = ctx.canvas.width;

      // Bitume
      ctx.fillStyle = '#131d33';
      ctx.fillRect(0, groundY, w, eh - groundY + 4);

      // Arête lumineuse cyan
      ctx.fillStyle = 'rgba(25,232,255,0.9)';
      ctx.fillRect(0, groundY, w, 2);
      ctx.fillStyle = 'rgba(25,232,255,0.16)';
      ctx.fillRect(0, groundY + 2, w, 6);

      // Lignes de fuite
      ctx.fillStyle = 'rgba(255,43,176,0.1)';
      for (let bx = (-camX % 64); bx < w; bx += 64) {
        ctx.fillRect(Math.round(bx), groundY + 10, 1, eh - groundY);
      }

      // Plaque néon devant chaque porte
      for (const d of this.doors) {
        const px = d.x + d.w / 2 - camX;
        if (px < -40 || px > w + 40) continue;
        ctx.fillStyle = 'rgba(255,255,255,0.05)';
        ctx.fillRect(px - 18, groundY + 2, 36, 12);
        ctx.fillStyle = this._doorAccent(d);
        ctx.globalAlpha = 0.5;
        ctx.fillRect(px - 18, groundY + 2, 36, 2);
        ctx.globalAlpha = 1;
      }
    }

    _drawTrees(ctx, camX, groundY) {
      const trees = [110, Math.round(this.worldWidth * 0.5), this.worldWidth - 120];
      for (let t = 0; t < trees.length; t++) {
        const sx = trees[t] - camX;
        if (sx < -40 || sx > ctx.canvas.width + 40) continue;
        const col = t % 2 ? '#19e8ff' : '#ff2bb0';
        ctx.fillStyle = '#05060d';
        ctx.fillRect(sx - 3, groundY - 92, 6, 92);
        ctx.fillRect(sx - 18, groundY - 92, 22, 6);
        ctx.fillStyle = col;
        ctx.globalAlpha = 0.9;
        ctx.fillRect(sx - 22, groundY - 90, 8, 8);
        ctx.globalAlpha = 0.14;
        ctx.fillRect(sx - 30, groundY - 96, 24, 56);
        ctx.globalAlpha = 1;
      }
    }

    _doorAccent(d) {
      if (d.special === 'done')    return '#ff123d';  // valider = action primaire
      if (d.special === 'unknown') return '#8a3bff';  // secondaire
      if (d.selected)              return '#ff2bb0';  // sélection active
      return '#19e8ff';                               // interactif par défaut
    }

    _drawDoor(ctx, d, sx, groundY, near) {
      const by    = groundY - d.h;
      const postW = 12;
      const accent = this._doorAccent(d);
      const cx = sx + d.w / 2;
      const glow = 0.5 + 0.5 * Math.sin(this._tick * 0.08);

      // Halo large
      const halo = ctx.createRadialGradient(cx, by + d.h * 0.5, 6, cx, by + d.h * 0.5, d.h * 0.9);
      halo.addColorStop(0, 'rgba(' + hexToRgb(accent) + ',' + ((near ? 0.32 : 0.16) + 0.12 * glow).toFixed(3) + ')');
      halo.addColorStop(1, 'rgba(' + hexToRgb(accent) + ',0)');
      ctx.fillStyle = halo;
      ctx.fillRect(sx - d.w, by - 40, d.w * 3, d.h + 80);

      // Monolithes sombres
      ctx.fillStyle = '#04040c';
      ctx.fillRect(sx, by, postW, d.h);
      ctx.fillRect(sx + d.w - postW, by, postW, d.h);
      ctx.fillRect(sx - 6, by - 14, d.w + 12, 16);
      ctx.fillStyle = accent;
      ctx.globalAlpha = 0.5 + 0.3 * glow;
      ctx.fillRect(sx + postW - 2, by, 2, d.h);
      ctx.fillRect(sx + d.w - postW, by, 2, d.h);
      ctx.fillRect(sx - 6, by - 2, d.w + 12, 2);
      ctx.globalAlpha = 1;

      // Ouverture : dégradé d'énergie
      const ox = sx + postW;
      const ow = d.w - postW * 2;
      const oy = by + 2;
      const oh = d.h - 2;
      ctx.fillStyle = '#02030a';
      ctx.fillRect(ox, oy, ow, oh);
      const rift = ctx.createLinearGradient(ox, oy, ox, oy + oh);
      rift.addColorStop(0, 'rgba(' + hexToRgb(accent) + ',' + (0.3 + 0.25 * glow).toFixed(3) + ')');
      rift.addColorStop(0.5, 'rgba(255,43,176,' + (0.18 + 0.16 * glow).toFixed(3) + ')');
      rift.addColorStop(1, 'rgba(138,59,255,0.12)');
      ctx.fillStyle = rift;
      ctx.fillRect(ox, oy, ow, oh);

      // Brins de toile rayonnant depuis le haut de l'ouverture
      ctx.save();
      ctx.strokeStyle = 'rgba(255,255,255,' + (0.08 + 0.08 * glow).toFixed(3) + ')';
      ctx.lineWidth = 1;
      for (let s = -2; s <= 2; s++) {
        ctx.beginPath();
        ctx.moveTo(cx, oy + 4);
        ctx.lineTo(cx + s * (ow / 4), oy + oh - 4);
        ctx.stroke();
      }
      for (let r = oh * 0.32; r < oh; r += oh * 0.34) {
        ctx.beginPath();
        ctx.moveTo(cx - r * 0.85, oy + 4 + r * 0.5);
        ctx.quadraticCurveTo(cx, oy + 4 + r, cx + r * 0.85, oy + 4 + r * 0.5);
        ctx.stroke();
      }
      ctx.restore();

      // Anneaux à aberration chromatique + arcs spider-sense quand on est près
      if (near) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        for (let k = 0; k < 2; k++) {
          const rr = 10 + ((this._tick * 1.6 + k * 30) % (oh * 0.5));
          ctx.globalAlpha = Math.max(0, 0.5 - rr / (oh * 0.55));
          ctx.lineWidth = 2;
          ctx.strokeStyle = '#ff123d';
          ctx.beginPath(); ctx.ellipse(cx - 2, oy + oh * 0.5, rr, rr * 0.7, 0, 0, Math.PI * 2); ctx.stroke();
          ctx.strokeStyle = '#19e8ff';
          ctx.beginPath(); ctx.ellipse(cx + 2, oy + oh * 0.5, rr, rr * 0.7, 0, 0, Math.PI * 2); ctx.stroke();
        }
        for (let k = 0; k < 2; k++) {
          const rr = 16 + ((this._tick * 2 + k * 50) % (d.w * 1.2));
          ctx.globalAlpha = Math.max(0, 0.38 - rr / (d.w * 1.3));
          ctx.lineWidth = 2;
          ctx.strokeStyle = '#19e8ff';
          ctx.beginPath(); ctx.arc(cx, oy + oh * 0.5, rr, Math.PI * 0.15, Math.PI * 0.85); ctx.stroke();
          ctx.beginPath(); ctx.arc(cx, oy + oh * 0.5, rr, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
        }
        ctx.restore();
        ctx.globalAlpha = 1;
      }

      // Battant (se réduit selon d.open)
      const leafW = Math.max(0, Math.round(ow * (1 - d.open)));
      if (leafW > 0) {
        ctx.fillStyle = '#05060f';
        ctx.fillRect(ox, oy, leafW, oh);
        ctx.fillStyle = accent;
        ctx.globalAlpha = 0.4;
        ctx.fillRect(ox + leafW - 2, oy, 2, oh);
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#f5f6ff';
        ctx.fillRect(ox + leafW - 7, oy + oh / 2 - 2, 4, 4);
      }
      if (d.open > 0 && d.open < 1) {
        ctx.save();
        ctx.globalAlpha = (1 - d.open) * 0.85;
        ctx.fillStyle = '#eafcff';
        ctx.fillRect(ox, oy, ow, oh);
        ctx.restore();
      }

      // Badge « choisi » (étape multi) — pastille néon frappée d'une araignée
      if (d.selected) {
        const bcx = sx + d.w - 4;
        const bcy = by - 6;
        ctx.beginPath();
        ctx.arc(bcx, bcy, 10, 0, Math.PI * 2);
        ctx.fillStyle = '#02030a';
        ctx.fill();
        ctx.strokeStyle = '#ff2bb0';
        ctx.lineWidth = 2;
        ctx.stroke();
        drawSpider(ctx, bcx, bcy, 11, '#ff2bb0');
      }

      // Panneau au-dessus (texte du choix, sur 1 à 3 lignes)
      const sbW = Math.max(d.w + 46, 148);
      const sbX = Math.round(sx + d.w / 2 - sbW / 2);
      const lines = wrapText(ctx, d.label, sbW - 16, '7px "Press Start 2P", monospace');
      const sbH = 12 + lines.length * 11;
      const sbY = by - 24 - sbH;

      ctx.fillStyle = '#03040c';
      ctx.fillRect(sbX, sbY, sbW, sbH);
      ctx.fillStyle = accent;
      ctx.fillRect(sbX, sbY, sbW, 2);
      ctx.fillRect(sbX, sbY + sbH - 2, sbW, 2);
      ctx.fillStyle = '#03040c';
      ctx.fillRect(sx + d.w / 2 - 2, sbY + sbH, 4, 12);

      ctx.save();
      ctx.font = '7px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#f5f6ff';
      ctx.shadowColor = accent;
      ctx.shadowBlur = 6;
      lines.forEach((ln, i) => ctx.fillText(ln, sx + d.w / 2, sbY + 12 + i * 11));
      ctx.restore();
    }

    _drawPrompt(ctx, camX, groundY) {
      const d  = this._nearDoor;
      const step = STEPS[state.step];
      const sx = d.x - camX + d.w / 2;
      const py = groundY - d.h - 40 + Math.sin(this._tick * 0.08) * 3;

      // Badge d'action au-dessus de la porte. Il reflète le rôle de la Flèche
      // Haut : CHOISIR une porte (ou CHOISI quand c'est déjà la sélection en
      // cours), RETIRER pour désélectionner en multi, VALIDER pour la porte
      // « TERMINER LA SELECTION ». Le passage à l'étape suivante reste sur
      // « Entrée » / le bouton « Valider l'étape ».
      let action;
      if (step.multi) {
        if (d.special === 'done')         action = 'VALIDER';
        else if (d.special === 'unknown') action = 'CHOISIR';
        else                              action = d.selected ? 'RETIRER' : 'CHOISIR';
      } else {
        action = state.data[step.key] === d.value ? 'CHOISI' : 'CHOISIR';
      }

      ctx.save();
      ctx.textAlign = 'center';

      if (action) {
        const label = (this._touch ? '' : '↑ ') + action;
        const accent = this._doorAccent(d);
        ctx.font = '9px "Press Start 2P", monospace';
        const lw = ctx.measureText(label).width + 24;
        ctx.fillStyle = 'rgba(3,4,12,0.92)';
        ctx.fillRect(sx - lw / 2, py - 17, lw, 24);
        ctx.strokeStyle = '#01010a';
        ctx.lineWidth = 3;
        ctx.strokeRect(sx - lw / 2 + 1.5, py - 15.5, lw - 3, 21);
        ctx.strokeStyle = accent;
        ctx.lineWidth = 2;
        ctx.strokeRect(sx - lw / 2 - 2, py - 19, lw + 4, 28);
        ctx.fillStyle = 'rgba(255,18,61,0.55)';
        ctx.fillText(label, sx - 0.8, py);
        ctx.fillStyle = 'rgba(25,232,255,0.55)';
        ctx.fillText(label, sx + 0.8, py);
        ctx.fillStyle = '#fff';
        ctx.fillText(label, sx, py);
      }

      if (d.hint) {
        ctx.font = '6px "Press Start 2P", monospace';
        const hlines = wrapText(ctx, d.hint.toUpperCase(), 190, '6px "Press Start 2P", monospace');
        let hy = action ? py + 12 : py;
        for (const ln of hlines) {
          const hw = ctx.measureText(ln).width + 14;
          ctx.fillStyle = 'rgba(3,4,12,0.8)';
          ctx.fillRect(sx - hw / 2, hy - 8, hw, 12);
          ctx.fillStyle = 'rgba(255,255,255,0.82)';
          ctx.fillText(ln, sx, hy);
          hy += 12;
        }
      }
      ctx.restore();
    }

    _drawHintBar(ctx, ew, eh) {
      // Le rappel clavier s'efface en douceur une fois que le joueur a compris
      // (dès qu'il s'est déplacé) — l'écran reste ainsi dégagé.
      let alpha = 1;
      if (this._moved) {
        alpha = 1 - (this._tick - this._movedAt - 36) / 48;
        if (alpha <= 0) return;
        if (alpha > 1) alpha = 1;
      }

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = '8px "Press Start 2P", monospace';
      const KEY = '#19e8ff';
      const LBL = 'rgba(255,255,255,0.82)';
      const segs = [
        { t: 'SE DEPLACER ', c: LBL }, { t: '← →', c: KEY },
        { t: '     ', c: LBL },
        { t: 'CHOISIR ', c: LBL }, { t: '↑', c: KEY },
        { t: '     ', c: LBL },
        { t: 'RETOUR ', c: LBL }, { t: '↓', c: KEY },
      ];
      let total = 0;
      const wds = segs.map(s => { const x = ctx.measureText(s.t).width; total += x; return x; });
      const y = eh - 18;
      let x = Math.round(ew / 2 - total / 2);
      ctx.fillStyle = 'rgba(3,4,12,0.86)';
      ctx.fillRect(x - 14, y - 19, total + 28, 30);
      ctx.strokeStyle = '#01010a';
      ctx.lineWidth = 3;
      ctx.strokeRect(x - 12.5, y - 17.5, total + 25, 27);
      ctx.strokeStyle = 'rgba(25,232,255,0.5)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x - 16, y - 21, total + 32, 34);
      ctx.textAlign = 'left';
      for (let i = 0; i < segs.length; i++) { ctx.fillStyle = segs[i].c; ctx.fillText(segs[i].t, x, y); x += wds[i]; }
      ctx.restore();
    }
  }

  // ── Helpers ───────────────────────────────────────────
  let _htPattern = null;
  function getHalftone(ctx) {
    if (_htPattern) return _htPattern;
    const p = document.createElement('canvas');
    p.width = p.height = 6;
    const c = p.getContext('2d');
    c.fillStyle = 'rgba(255,255,255,0.05)';
    c.beginPath();
    c.arc(1.6, 1.6, 1, 0, Math.PI * 2);
    c.fill();
    _htPattern = ctx.createPattern(p, 'repeat');
    return _htPattern;
  }

  function wrapText(ctx, text, maxW, font) {
    ctx.save();
    ctx.font = font;
    const words = String(text).split(' ');
    const lines = [];
    let cur = '';
    for (const wd of words) {
      const test = cur ? cur + ' ' + wd : wd;
      if (ctx.measureText(test).width > maxW && cur) { lines.push(cur); cur = wd; }
      else cur = test;
    }
    if (cur) lines.push(cur);
    ctx.restore();
    return lines.slice(0, 3);
  }

  function hexToRgb(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return r + ',' + g + ',' + b;
  }

  // Petite araignée stylisée (corps + 8 pattes) — motif récurrent.
  function drawSpider(ctx, cx, cy, s, color) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = Math.max(1, s * 0.14);
    ctx.lineCap = 'round';
    for (const sgn of [-1, 1]) {
      for (let i = 0; i < 4; i++) {
        const ky = cy - s * 0.5 + i * (s * 0.34);
        const bend = (i === 0 || i === 3) ? s * 0.5 : s * 0.85;
        ctx.beginPath();
        ctx.moveTo(cx + sgn * s * 0.28, ky);
        ctx.lineTo(cx + sgn * (s * 0.28 + bend), ky - s * 0.28);
        ctx.lineTo(cx + sgn * (s * 0.28 + bend + s * 0.14), ky + s * 0.1);
        ctx.stroke();
      }
    }
    ctx.beginPath();
    ctx.ellipse(cx, cy + s * 0.12, s * 0.3, s * 0.44, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, cy - s * 0.42, s * 0.22, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  }

  // ── Boot ──────────────────────────────────────────────
  function boot() {
    loadState();
    try {
      new BuildProject();
    } catch (err) {
      console.error('BuildProject init error:', err);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
