/* ══════════════════════════════════════════════════════
   THEME.JS : le contrat d'un univers

   Un univers ne fournit QUE de l'habillage et des réglages :
     palette, typographie, vocabulaire, personnage, décor (niveau +
     renderer), caméra, physique, effets, audio.
   Il ne réimplémente jamais la boucle, les collisions, la sauvegarde,
   l'input, la logique portfolio ni la progression : tout cela est commun.

   Hiérarchie des couleurs (identique partout, pour éviter « une couleur
   pour tout ») :
     primary   ce qui s'actionne : boutons, liens, invite d'interaction
     accent    ce qui se découvre : progression, lieux, compétences
     text / muted / line / surface   le reste, neutre
   ══════════════════════════════════════════════════════ */

const REQUIRED = ['id', 'name', 'category', 'tagline', 'palette', 'fonts', 'vocabulary',
  'camera', 'physics', 'character', 'createLevel', 'Renderer', 'audio'];

const BASE_VOCABULARY = {
  locations: { profile: 'PROFIL', parcours: 'PARCOURS', contact: 'CONTACT', projets: 'GALERIE' },
  // Sous-titre en clair sous chaque libellé : le portfolio reste compréhensible.
  hints: { profile: 'Qui je suis', parcours: 'Formation et expériences', contact: 'Me joindre', projets: 'Mes projets' },
  portal: 'CONSTRUISEZ VOTRE PROJET',
  objective: 'OBJECTIF',
  places: 'LIEUX',
  placeFound: 'LIEU DÉCOUVERT',
  skills: 'COMPÉTENCES',
  skill: 'Compétence',
  skillFound: 'COMPÉTENCE DÉCOUVERTE',
  projects: 'PROJETS',
  experiences: 'PARCOURS',
  enter: 'Entrer',
  allDone: 'Tout est visité',
};

export function defineUniverse(spec) {
  for (const k of REQUIRED) {
    if (spec[k] == null) throw new Error(`Univers « ${spec.id || '?'} » : champ manquant « ${k} »`);
  }
  const v = spec.vocabulary;
  return Object.freeze({
    effects: {},
    ...spec,
    vocabulary: {
      ...BASE_VOCABULARY, ...v,
      locations: { ...BASE_VOCABULARY.locations, ...v.locations },
      hints: { ...BASE_VOCABULARY.hints, ...v.hints },
    },
  });
}

// Reporte la palette et la typographie sur l'interface DOM (variables CSS).
export function applyTheme(root, universe) {
  const p = universe.palette, f = universe.fonts;
  root.dataset.universe = universe.id;
  const set = (k, v) => root.style.setProperty(k, v);
  set('--u-bg', p.bg);
  set('--u-surface', p.surface);
  set('--u-surface-2', p.surface2);
  set('--u-text', p.text);
  set('--u-muted', p.muted);
  set('--u-line', p.line);
  set('--u-primary', p.primary);
  set('--u-on-primary', p.onPrimary);
  set('--u-accent', p.accent);
  set('--u-display', f.display);
  set('--u-display-weight', f.weight);
  set('--u-display-style', f.style || 'normal');
  set('--u-display-spacing', f.spacing || '0');
  set('--u-radius', f.radius || '12px');
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', p.bg);
}
