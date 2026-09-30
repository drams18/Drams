/* ══════════════════════════════════════════════════════
   CLASSIC-APP.JS : Couche interactive du mode classique
   Module ES regroupé par Vite (npm run build) ; chargé après classic.js
   sur chacune des cinq pages.

   Chaque page est complète sans lui (HTML généré depuis js/museum.js).
   Il charge SEULEMENT l'expérience de la page courante (import
   dynamique → un fichier par page, GSAP uniquement sur le Profil) :
     profil       src/classic/profile.js    entrée cinématique, profondeur
     projets      src/classic/projects.js   espace de bulles + fiche
     parcours     src/classic/timeline.js   frise horizontale
     competences  src/classic/skills.js     écosystème (globe)
     contact      (aucune)                      (CSS seul)
   ══════════════════════════════════════════════════════ */
const root = document.documentElement;
const app = (window.ClassicApp = window.ClassicApp || {});
const page = document.body.dataset.page;

const VIEWS = {
  profil: () => import('./classic/profile.js').then((m) => m.initProfile(app)),
  projets: () => import('./classic/projects.js').then((m) => m.initProjects(app)),
  parcours: () => import('./classic/timeline.js').then((m) => m.initTimeline(app)),
  competences: () => import('./classic/skills.js').then((m) => m.initSkills(app)),
};

function ready() {
  root.classList.add('app-ready');
  root.classList.remove('no-app');
}

function start() {
  const view = VIEWS[page];
  // Le masque anti-flash ne concerne que l'entrée du Profil (levé par profile.js).
  if (page !== 'profil') root.classList.remove('motion-pending');
  if (!view) { ready(); return; }
  view()
    .then(ready)
    .catch((err) => {
      console.error(err);
      root.classList.remove('motion-pending');
      root.classList.add('no-app');
    });
}

// Page préchargée en arrière-plan (speculation rules) : les vues se
// construisent tout de suite (affichage instantané au clic) ; seule
// l'entrée du Profil attend que la page soit réellement affichée.
start();
