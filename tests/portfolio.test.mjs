/* Données portfolio : 13 projets, 8 compétences, projets associés dérivés.
   node tests/portfolio.test.mjs */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
globalThis.SECTIONS = require('../js/museum.js').SECTIONS;
const { getPortfolio } = await import('../src/aventure/portfolio/data.js');
const { techMatches } = await import('../src/aventure/portfolio/Skill.js');

const p = getPortfolio();
assert.equal(p.projects.length, 13);
assert.equal(p.skills.length, 8);
assert.deepEqual(p.skills.map(s => s.name), ['React', 'TypeScript', 'Next.js', 'Node.js', 'NestJS', 'Symfony', 'PostgreSQL', 'Docker']);
assert.ok(techMatches('Symfony 7', 'Symfony'));
assert.ok(!techMatches('React Native', 'React'));
assert.ok(!techMatches('React Query', 'React'));
for (const s of p.skills) {
  assert.ok(s.category, `catégorie de ${s.name}`);
  for (const pr of s.relatedProjects) assert.ok(pr.tech.some(t => techMatches(t, s.name)));
  console.log(s.name.padEnd(11), s.category.padEnd(24), s.relatedProjects.map(x => x.short).join(', ') || '(aucun projet associé)');
}
assert.equal(p.project('skywalk').title, 'SkyWalk');
assert.equal(p.project('pool-party').status, 'En cours');
assert.equal(p.project('infinitia').status, 'Indisponible');
assert.ok(p.projects.every(x => !x.result), 'aucun résultat inventé');
assert.equal(p.experiences.length, SECTIONS.parcours.steps.length);
console.log('OK : données portfolio');
