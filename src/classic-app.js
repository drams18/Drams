/* ══════════════════════════════════════════════════════
   CLASSIC-APP.JS — Couche interactive du mode classique
   Module ES regroupé par Vite (npm run build) ; chargé après classic.js.

   La page est complète sans lui (HTML généré depuis js/museum.js).
   Il ajoute, sur ce même HTML :
     • la constellation du hero           src/classic/hero.js
     • le récit du profil + la frise      src/classic/journey.js
     • l'espace des projets + la fiche    src/classic/projects.js
     • l'écosystème de compétences        src/classic/skills.js
     • les animations (GSAP)              src/classic-motion.js
   window.ClassicApp relie les vues entre elles (projet ↔ technologie)
   et avec classic.js (liens profonds).
   ══════════════════════════════════════════════════════ */
import { initHero } from './classic/hero.js';
import { initStory, initTimeline } from './classic/journey.js';
import { initProjects } from './classic/projects.js';
import { initSkills } from './classic/skills.js';
import { initMotion } from './classic-motion.js';

const root = document.documentElement;
const app = (window.ClassicApp = window.ClassicApp || {});

// Une vue en échec ne doit pas emporter les autres.
function safely(fn) {
  try { fn(app); } catch (err) { console.error(err); }
}

safely(initProjects);
safely(initSkills);
safely(initHero);
safely(initStory);
safely(initTimeline);
root.classList.add('app-ready');
root.classList.remove('no-app');
safely(initMotion);
