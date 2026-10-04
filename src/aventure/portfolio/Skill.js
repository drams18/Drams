/* ══════════════════════════════════════════════════════
   SKILL.JS : les 8 compétences à découvrir dans le monde

   Source unique. La description est une définition neutre de la
   technologie (pas une affirmation sur mon niveau). La catégorie vient
   de SECTIONS.profile.skillGroups ; les projets associés sont DÉRIVÉS
   des technologies listées par chaque projet, jamais saisis à la main.
   ══════════════════════════════════════════════════════ */

export const SKILL_DEFS = [
  { id: 'react', abbr: 'Re', name: 'React', logo: 'react', description: 'Bibliothèque JavaScript pour construire des interfaces à base de composants.' },
  { id: 'typescript', abbr: 'TS', name: 'TypeScript', logo: 'typescript', description: 'JavaScript avec un typage statique, vérifié avant l\'exécution.' },
  { id: 'nextjs', abbr: 'Nx', name: 'Next.js', logo: 'nextdotjs', description: 'Framework React : rendu côté serveur, routage et génération de pages.' },
  { id: 'nodejs', abbr: 'No', name: 'Node.js', logo: 'nodedotjs', description: 'Environnement d\'exécution JavaScript côté serveur.' },
  { id: 'nestjs', abbr: 'Ns', name: 'NestJS', logo: 'nestjs', description: 'Framework Node.js structuré en modules, pour construire des API.' },
  { id: 'symfony', abbr: 'Sf', name: 'Symfony', logo: 'symfony', description: 'Framework PHP pour les applications web et les API.' },
  { id: 'postgresql', abbr: 'Pg', name: 'PostgreSQL', logo: 'postgresql', description: 'Base de données relationnelle open source.' },
  { id: 'docker', abbr: 'Dk', name: 'Docker', logo: 'docker', description: 'Conteneurs pour exécuter une application dans le même environnement partout.' },
];

const norm = (s) => String(s).toLowerCase().trim();

// « Symfony 7 » compte pour Symfony ; « React Native » ne compte PAS pour React.
export function techMatches(tech, skillName) {
  const t = norm(tech), s = norm(skillName);
  return t === s || (t.startsWith(s + ' ') && /^\d/.test(t.slice(s.length + 1)));
}

export class Skill {
  constructor(def, skillGroups, projects) {
    this.id = def.id;
    this.name = def.name;
    this.abbr = def.abbr;
    this.description = def.description;
    this.logo = 'assets/img/logos/' + def.logo + '.svg';
    const group = skillGroups.find(g => g.items.some(i => norm(i) === norm(def.name)));
    this.category = group ? group.label : '';
    this.relatedProjects = projects.filter(p => p.tech.some(t => techMatches(t, def.name)));
  }
}
