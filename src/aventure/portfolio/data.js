/* ══════════════════════════════════════════════════════
   DATA.JS : le portfolio vu par le mode aventure

   js/museum.js reste la source unique (partagée avec le mode classique).
   Ce module le lit une fois et expose des objets prêts à afficher,
   identiques dans les trois univers : seul le vocabulaire change.
   ══════════════════════════════════════════════════════ */

import { Project } from './Project.js';
import { Skill, SKILL_DEFS } from './Skill.js';
import { Experience } from './Experience.js';
import { Profile } from './Profile.js';

let cache = null;

export function getPortfolio() {
  if (cache) return cache;
  // SECTIONS : constante globale déclarée par js/museum.js (script classique).
  // eslint-disable-next-line no-undef
  const src = typeof SECTIONS !== 'undefined' ? SECTIONS : null;
  if (!src) throw new Error('js/museum.js doit être chargé avant le mode aventure');

  const projects = src.projets.items.map(p => new Project(p));
  const profile = new Profile(src.profile, src.contact);
  const skills = SKILL_DEFS.map(d => new Skill(d, profile.skillGroups, projects));
  const experiences = src.parcours.steps.map(s => new Experience(s));

  cache = {
    profile,
    projects,
    skills,
    experiences,
    milestones: src.parcours.milestones || [],
    project: (slug) => projects.find(p => p.slug === slug) || null,
    skill: (id) => skills.find(s => s.id === id) || null,
  };
  return cache;
}
