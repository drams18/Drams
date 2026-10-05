/* ══════════════════════════════════════════════════════
   STEPS.JS : les questions de « Construisez votre projet » et les réponses

   Cinq étapes ; chaque étape est une rue (ou une galerie) dont chaque porte
   est une réponse. Les `value` sont celles du formulaire de devis
   (js/devis.js) : même e-mail, même session (`drame.buildproject`), un
   projet commencé d'un côté se retrouve de l'autre.
     label  ce qui s'affiche sur la porte (court : il doit tenir sur l'enseigne)
     hint   sous-titre en clair
   ══════════════════════════════════════════════════════ */

export const STORAGE_KEY = 'drame.buildproject';
export const NO_CHOICE = 'Aucun choix';

export const STEPS = [
  {
    key: 'projectType',
    recapLabel: 'Type de projet',
    title: 'Que voulez-vous créer ?',
    help: 'Vous pourrez modifier vos choix à la fin en cas de doute.',
    doors: [
      { value: 'Site web', label: 'SITE WEB', hint: 'Présenter votre activité' },
      { value: 'Boutique en ligne (e-commerce)', label: 'E-COMMERCE', hint: 'Vendre sur internet' },
      { value: 'Application web', label: 'APPLICATION WEB', hint: 'Un outil dans le navigateur' },
      { value: 'Application mobile', label: 'APPLICATION MOBILE', hint: 'Une app sur téléphone' },
      { value: 'Site WordPress', label: 'WORDPRESS', hint: 'Un site modifiable par vous' },
      { value: 'Boutique Shopify', label: 'SHOPIFY', hint: 'Une boutique prête à l\'emploi' },
      { value: 'Autre', label: 'AUTRE', hint: 'À préciser à la fin' },
    ],
  },
  {
    key: 'clientType',
    recapLabel: 'Profil',
    title: 'Pour qui est ce projet ?',
    help: 'Cela m\'aide à adapter ma proposition. Choisissez « Je ne sais pas » si vous hésitez.',
    doors: [
      { value: 'Particulier', label: 'PARTICULIER', hint: 'Un projet personnel' },
      { value: 'Professionnel', label: 'PROFESSIONNEL', hint: 'Entreprise, indépendant' },
      { value: 'Association', label: 'ASSOCIATION', hint: 'À but non lucratif' },
      { value: 'Étudiant', label: 'ÉTUDIANT', hint: 'Projet d\'études' },
      { value: 'Autre', label: 'AUTRE', hint: 'Une autre situation' },
      { value: 'Je ne sais pas', label: 'JE NE SAIS PAS', hint: 'On en parlera ensemble' },
    ],
  },
  {
    key: 'need',
    recapLabel: 'Besoin',
    title: 'De quoi avez-vous besoin ?',
    help: 'Dites-moi simplement où vous en êtes aujourd\'hui.',
    doors: [
      { value: 'Création', label: 'CRÉATION', hint: 'Partir de zéro' },
      { value: 'Refonte', label: 'REFONTE', hint: 'Refaire un site existant' },
      { value: 'Ajout de fonctionnalités', label: 'NOUVELLES FONCTIONS', hint: 'Compléter un site existant' },
      { value: 'Correction / dépannage', label: 'DÉPANNAGE', hint: 'Quelque chose ne marche plus' },
      { value: 'Maintenance', label: 'MAINTENANCE', hint: 'Garder le site à jour' },
      { value: 'Accompagnement', label: 'ACCOMPAGNEMENT', hint: 'Être conseillé et guidé' },
      { value: 'Autre', label: 'AUTRE', hint: 'À préciser à la fin' },
      { value: 'Je ne sais pas', label: 'JE NE SAIS PAS', hint: 'On fera le point ensemble' },
    ],
  },
  {
    key: 'features',
    recapLabel: 'Fonctionnalités',
    title: 'Quelles fonctionnalités vous intéressent ?',
    help: 'Vous pouvez en choisir plusieurs, puis valider l\'étape.',
    multi: true,
    doors: [
      { value: 'Paiement en ligne', label: 'PAIEMENT EN LIGNE', hint: 'Encaisser par carte' },
      { value: 'Réservation', label: 'RÉSERVATION', hint: 'Rendez-vous, réservations' },
      { value: 'Compte utilisateur', label: 'COMPTE UTILISATEUR', hint: 'Vos visiteurs se connectent' },
      { value: 'Espace administration', label: 'ADMINISTRATION', hint: 'Gérer le contenu en privé' },
      { value: 'Base de données', label: 'BASE DE DONNÉES', hint: 'Stocker des informations' },
      { value: 'API / services externes', label: 'SERVICES EXTERNES', hint: 'Se relier à d\'autres outils' },
      { value: 'Site multilingue', label: 'MULTILINGUE', hint: 'Plusieurs langues' },
      { value: 'Autre', label: 'AUTRE', hint: 'À préciser à la fin' },
      { value: '__unknown__', special: 'unknown', label: 'JE NE SAIS PAS', hint: 'Continuer sans choisir' },
      { value: '__done__', special: 'done', label: 'VALIDER', hint: 'Passer à la suite' },
    ],
  },
  {
    key: 'budget',
    recapLabel: 'Budget',
    title: 'Quel est votre budget ?',
    help: 'Ce n\'est pas un prix définitif, juste une indication pour comprendre votre projet.',
    doors: [
      { value: 'Moins de 100 €', label: 'MOINS DE 100 €', hint: 'Un besoin simple' },
      { value: '100 - 300 €', label: '100 À 300 €', hint: 'Un petit projet' },
      { value: '300 - 600 €', label: '300 À 600 €', hint: 'Un projet intermédiaire' },
      { value: '600 - 1000 €', label: '600 À 1000 €', hint: 'Un projet complet' },
      { value: 'Plus de 1000 €', label: 'PLUS DE 1000 €', hint: 'Un projet ambitieux' },
      { value: 'Je ne sais pas', label: 'JE NE SAIS PAS', hint: 'On l\'estimera ensemble' },
    ],
  },
];

// Identifiant de lieu d'une porte (clé des libellés et des tampons du renderer).
export const doorId = (step, i) => `s${step}d${i}`;

function blank() {
  return {
    projectType: '', clientType: '', need: '',
    features: [], featuresUnknown: false,
    budget: '',
    contact: { prenom: '', nom: '', email: '', tel: '' },
    message: '',
  };
}

// Réponses du visiteur, gardées le temps de la session de navigation.
export class Answers {
  constructor(storage) {
    this._storage = storage || safe(() => window.sessionStorage);
    this.data = blank();
    try {
      const d = JSON.parse(this._storage.getItem(STORAGE_KEY));
      if (d && typeof d === 'object') {
        Object.assign(this.data, d);
        if (!Array.isArray(this.data.features)) this.data.features = [];
        if (!this.data.contact || typeof this.data.contact !== 'object') this.data.contact = blank().contact;
      }
    } catch (e) { /* stockage indisponible : on repart à vide */ }
  }

  save() {
    try { this._storage.setItem(STORAGE_KEY, JSON.stringify(this.data)); } catch (e) { /* noop */ }
  }

  clear() {
    try { this._storage.removeItem(STORAGE_KEY); } catch (e) { /* noop */ }
  }

  isSelected(step, door) {
    if (step.multi) return !door.special && this.data.features.includes(door.value);
    return this.data[step.key] === door.value;
  }

  hasValue(step) {
    if (step.multi) return this.data.featuresUnknown || this.data.features.length > 0;
    return !!this.data[step.key];
  }

  get empty() { return STEPS.every(s => !this.hasValue(s)); }

  // Choix unique : remplace la valeur. Renvoie false si elle était déjà choisie.
  pick(step, value) {
    if (this.data[step.key] === value) return false;
    this.data[step.key] = value;
    this.save();
    return true;
  }

  // Choix multiple : ajoute ou retire. Renvoie true si la valeur est maintenant choisie.
  toggle(value) {
    const set = new Set(this.data.features);
    const on = !set.has(value);
    if (on) set.add(value); else set.delete(value);
    this.data.features = [...set];
    this.data.featuresUnknown = false;
    this.save();
    return on;
  }

  setUnknown() {
    this.data.features = [];
    this.data.featuresUnknown = true;
    this.save();
  }

  recap(step) {
    const d = this.data;
    if (step.multi) {
      if (d.featuresUnknown) return 'Je ne sais pas';
      return d.features.length ? d.features.join(', ') : NO_CHOICE;
    }
    return d[step.key] || NO_CHOICE;
  }

  // Corps de l'e-mail (même format que le formulaire de devis).
  summary() {
    const d = this.data, v = (i) => this.recap(STEPS[i]);
    return [
      'Nouvelle demande de projet', '',
      'Type : ' + v(0),
      'Profil : ' + v(1),
      'Besoin : ' + v(2),
      'Fonctionnalités : ' + v(3),
      'Budget : ' + v(4),
      '', 'Informations du client', '',
      'Prénom : ' + (d.contact.prenom || ''),
      'Nom : ' + (d.contact.nom || ''),
      'Email : ' + (d.contact.email || ''),
      'Téléphone : ' + (d.contact.tel || 'Non précisé'),
      '', 'Message', '',
      d.message || 'Non précisé',
    ].join('\n');
  }
}

function safe(fn) {
  try { return fn(); } catch (e) { return null; }
}
