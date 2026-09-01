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

        // « Flèche Haut » UNIQUEMENT pour interagir avec / sélectionner une
        // porte. La touche Entrée reste volontairement sans effet sur les
        // portes. Le bouton tactile « CHOISIR » simule ArrowUp : il continue
        // de fonctionner.
        if (this.controls._justPressed('ArrowUp')) {
          if (this._nearDoor) {
            this._choose(this._nearDoor);
          } else if (this._stepHasValue()) {
            sfx('success');
            this._advance();
          }
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

    // ── Sélection d'une porte ──────────────────────────
    _choose(door) {
      const step = STEPS[state.step];

      if (step.multi) {
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

      // Choix unique : mémorise + anime l'ouverture + transition
      state.data[step.key] = door.value;
      saveState();
      door.opening = true;
      this._transitioning = true;
      this._hideNextBtn();
      sfx('open');
      setTimeout(() => this._advance(), 300);
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
      const grad = ctx.createLinearGradient(0, 0, 0, eh * GROUND_RATIO);
      grad.addColorStop(0, '#5ba3d9');
      grad.addColorStop(0.6, '#87ceeb');
      grad.addColorStop(1, '#c9e8f5');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, ctx.canvas.width, eh * GROUND_RATIO + 2);
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
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      for (const c of clouds) {
        const cx = c.x - camX * 0.2;
        ctx.fillRect(cx + 10, c.y, c.w - 20, c.h);
        ctx.fillRect(cx, c.y + 8, c.w, c.h - 14);
        ctx.fillRect(cx + 15, c.y - 8, c.w - 30, 16);
      }
    }

    _drawGround(ctx, camX, groundY, eh) {
      const w = ctx.canvas.width;

      ctx.fillStyle = '#5d9c34';
      ctx.fillRect(0, groundY, w, 18);
      ctx.fillStyle = '#4a8029';
      for (let bx = (-camX % 18); bx < w; bx += 18) ctx.fillRect(Math.round(bx), groundY, 1, 18);

      ctx.fillStyle = '#8b5e3c';
      ctx.fillRect(0, groundY + 18, w, eh - groundY - 18 + 4);
      ctx.fillStyle = '#7a5232';
      ctx.fillRect(0, groundY + 18, w, 1);
      ctx.fillRect(0, groundY + 36, w, 1);
      for (let bx = (-camX % 36); bx < w; bx += 36) ctx.fillRect(Math.round(bx), groundY + 18, 1, 18);

      // Dallage devant chaque porte
      for (const d of this.doors) {
        const px = d.x + d.w / 2 - camX;
        if (px < -40 || px > w + 40) continue;
        ctx.fillStyle = '#9e9e9e';
        ctx.fillRect(px - 16, groundY, 32, 18);
        ctx.fillStyle = '#888';
        ctx.fillRect(px - 14, groundY + 2, 28, 14);
      }
    }

    _drawTrees(ctx, camX, groundY) {
      const trees = [110, Math.round(this.worldWidth * 0.5), this.worldWidth - 120];
      for (const tx of trees) {
        const sx = tx - camX;
        if (sx < -40 || sx > ctx.canvas.width + 40) continue;
        ctx.fillStyle = '#6b4423';
        ctx.fillRect(sx - 5, groundY - 45, 10, 45);
        ctx.fillStyle = '#3d7a1e';
        ctx.fillRect(sx - 20, groundY - 80, 40, 18);
        ctx.fillStyle = '#4a9128';
        ctx.fillRect(sx - 15, groundY - 94, 30, 18);
        ctx.fillStyle = '#3d7a1e';
        ctx.fillRect(sx - 10, groundY - 106, 20, 16);
      }
    }

    _doorAccent(d) {
      if (d.special === 'done')    return '#69f0ae';
      if (d.special === 'unknown') return '#90caf9';
      if (d.selected)              return '#7bf0a8';
      return '#ffd54f';
    }

    _drawDoor(ctx, d, sx, groundY, near) {
      const by    = groundY - d.h;
      const postW = 12;
      const accent = this._doorAccent(d);

      if (near) {
        const p = 0.30 + 0.22 * Math.sin(this._tick * 0.12);
        ctx.save();
        ctx.globalAlpha = p;
        ctx.fillStyle = accent;
        ctx.fillRect(sx - 12, by - 10, d.w + 24, d.h + 12);
        ctx.restore();
      }

      // Socle
      ctx.fillStyle = '#4a4a4a';
      ctx.fillRect(sx - 8, groundY - 8, d.w + 16, 8);

      // Montants + linteau (bois)
      ctx.fillStyle = '#6b4a2a';
      ctx.fillRect(sx, by, postW, d.h);
      ctx.fillRect(sx + d.w - postW, by, postW, d.h);
      ctx.fillRect(sx - 6, by - 14, d.w + 12, 16);
      ctx.fillStyle = '#7c5a38';
      ctx.fillRect(sx - 6, by - 14, d.w + 12, 3);
      ctx.fillStyle = '#543a20';
      ctx.fillRect(sx, by, 3, d.h);
      ctx.fillRect(sx + d.w - 3, by, 3, d.h);

      // Ouverture
      const ox = sx + postW;
      const ow = d.w - postW * 2;
      const oy = by + 2;
      const oh = d.h - 2;
      ctx.fillStyle = '#1b140a';
      ctx.fillRect(ox, oy, ow, oh);
      if (d.selected || near) {
        ctx.fillStyle = 'rgba(' + hexToRgb(accent) + ',0.16)';
        ctx.fillRect(ox, oy, ow, oh);
      }

      // Battant (se réduit selon d.open)
      const leafW = Math.max(0, Math.round(ow * (1 - d.open)));
      if (leafW > 0) {
        ctx.fillStyle = '#3a2a14';
        ctx.fillRect(ox, oy, leafW, oh);
        ctx.fillStyle = '#4c3718';
        const pad = 5;
        if (leafW > pad * 2) {
          ctx.fillRect(ox + pad, oy + 8, leafW - pad * 2, 20);
          ctx.fillRect(ox + pad, oy + 34, leafW - pad * 2, oh - 46);
        }
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(ox + leafW - 7, oy + oh / 2 - 2, 4, 4);
      }
      if (d.open > 0 && d.open < 1) {
        ctx.save();
        ctx.globalAlpha = (1 - d.open) * 0.8;
        ctx.fillStyle = '#fff7dd';
        ctx.fillRect(ox, oy, ow, oh);
        ctx.restore();
      }

      // Badge « choisi » (étape multi)
      if (d.selected) {
        const cx = sx + d.w - 4;
        const cy = by - 6;
        ctx.beginPath();
        ctx.arc(cx, cy, 9, 0, Math.PI * 2);
        ctx.fillStyle = '#1b5e20';
        ctx.fill();
        ctx.strokeStyle = '#69f0ae';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx - 4, cy);
        ctx.lineTo(cx - 1, cy + 3);
        ctx.lineTo(cx + 4, cy - 3);
        ctx.strokeStyle = '#69f0ae';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
      }

      // Panneau au-dessus (texte du choix, sur 1 à 3 lignes)
      const sbW = Math.max(d.w + 46, 148);
      const sbX = Math.round(sx + d.w / 2 - sbW / 2);
      const lines = wrapText(ctx, d.label, sbW - 16, '7px "Press Start 2P", monospace');
      const sbH = 12 + lines.length * 11;
      const sbY = by - 24 - sbH;

      ctx.fillStyle = '#241608';
      ctx.fillRect(sbX, sbY, sbW, sbH);
      ctx.fillStyle = accent;
      ctx.fillRect(sbX, sbY, sbW, 2);
      ctx.fillRect(sbX, sbY + sbH - 2, sbW, 2);
      ctx.fillStyle = '#241608';
      ctx.fillRect(sx + d.w / 2 - 2, sbY + sbH, 4, 12);

      ctx.save();
      ctx.font = '7px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = accent;
      lines.forEach((ln, i) => ctx.fillText(ln, sx + d.w / 2, sbY + 12 + i * 11));
      ctx.restore();
    }

    _drawPrompt(ctx, camX, groundY) {
      const d  = this._nearDoor;
      const step = STEPS[state.step];
      const sx = d.x - camX + d.w / 2;
      const py = groundY - d.h - 40 + Math.sin(this._tick * 0.08) * 3;

      // Badge d'action au-dessus de la porte. Les étapes à choix unique
      // n'affichent plus d'indicateur « ENTRER » : on ne garde que la
      // description de la porte. Les étapes multi conservent le badge
      // CHOISIR / RETIRER / VALIDER, qui reflète l'état de la sélection.
      let action = null;
      if (step.multi) {
        if (d.special === 'done')         action = 'VALIDER';
        else if (d.special === 'unknown') action = 'CHOISIR';
        else                              action = d.selected ? 'RETIRER' : 'CHOISIR';
      }

      ctx.save();
      ctx.textAlign = 'center';

      if (action) {
        const label = (this._touch ? '' : '↑ ') + action;
        ctx.font = '9px "Press Start 2P", monospace';
        const lw = ctx.measureText(label).width + 22;
        ctx.fillStyle = 'rgba(6,10,16,0.88)';
        ctx.fillRect(sx - lw / 2, py - 16, lw, 22);
        ctx.strokeStyle = this._doorAccent(d);
        ctx.lineWidth = 2;
        ctx.strokeRect(sx - lw / 2, py - 16, lw, 22);
        ctx.fillStyle = '#fff';
        ctx.fillText(label, sx, py);
      }

      if (d.hint) {
        ctx.font = '6px "Press Start 2P", monospace';
        const hlines = wrapText(ctx, d.hint.toUpperCase(), 190, '6px "Press Start 2P", monospace');
        let hy = action ? py + 12 : py;
        for (const ln of hlines) {
          const hw = ctx.measureText(ln).width + 14;
          ctx.fillStyle = 'rgba(6,10,16,0.7)';
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
      const KEY = '#ffe066';
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
      ctx.fillStyle = 'rgba(6,10,16,0.72)';
      ctx.fillRect(x - 14, y - 19, total + 28, 30);
      ctx.strokeStyle = 'rgba(255,255,255,0.14)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x - 14, y - 19, total + 28, 30);
      ctx.textAlign = 'left';
      for (let i = 0; i < segs.length; i++) { ctx.fillStyle = segs[i].c; ctx.fillText(segs[i].t, x, y); x += wds[i]; }
      ctx.restore();
    }
  }

  // ── Helpers ───────────────────────────────────────────
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
