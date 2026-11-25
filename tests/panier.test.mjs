/* Panier de /tarifs : message e-mail rangé par catégorie (js/panier.js).
   node tests/panier.test.mjs */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
require('../js/panier.js');
const P = globalThis.Panier;

const svc = (name, cat, catId, catI, eur, unit = '') =>
  ({ name, cat, catId, catI, ico: 'site', eur, unit, price: `à partir de ${P.fmt(eur)} €${unit ? ' ' + unit : ''}` });
const catalog = Object.fromEntries([
  svc('Site vitrine', 'Site internet', 'site', 0, 900),
  svc('Landing page', 'Site internet', 'site', 0, 450),
  svc('Fiche Google Business Profile', 'Visibilité & statistiques', 'visibilite', 3, 150),
  svc('Maintenance', 'Maintenance et renfort', 'suivi', 5, 150, '/ mois'),
  svc('Régie', 'Maintenance et renfort', 'suivi', 5, 60, '/ h'),
].map(s => [s.name, s]));

// Rangement : ordre de la grille, pas l'ordre d'ajout ; inconnus ignorés.
const g = P.groups(['Maintenance', 'Fiche Google Business Profile', 'Site vitrine', 'Inconnue', 'Landing page'], catalog);
assert.deepEqual(g.map(x => x.id), ['site', 'visibilite', 'suivi']);
assert.deepEqual(g[0].list.map(s => s.name), ['Site vitrine', 'Landing page']);

// Estimation : forfaits additionnés, mensuel à part, temps passé cité.
const t = P.totals(Object.values(catalog));
assert.deepEqual([t.once, t.monthly, t.timed.length], [1500, 150, 1]);
assert.deepEqual(P.totalLines(t), ['à partir de 1 500 €', '+ 150 € / mois', '+ Régie : à partir de 60 € / h']);
assert.deepEqual(P.totalLines(P.totals([catalog.Maintenance])), ['à partir de 150 € / mois']);

// Pack : compte pour ce qu'il comprend, rangé en premier, contenu cité.
catalog['Pack Vitrine'] = { name: 'Pack Vitrine', cat: 'Packs', catId: 'pack', catI: -1, ico: 'site', eur: 1500, unit: '',
  price: 'à partir de 1 500 €', includes: ['Site vitrine', 'Fiche Google Business Profile', 'Logo', 'Nom de domaine'] };
assert.equal(P.count([catalog['Pack Vitrine'], catalog['Landing page']]), 5);

const msg = P.summary({
  items: ['Maintenance', 'Pack Vitrine', 'Landing page'],
  contact: { prenom: 'Jeanne', nom: 'Test', tel: '06 12 34 56 78', email: 'jeanne@example.com' },
  message: 'Fleuriste, avant le printemps',
}, catalog, { date: new Date('2026-11-24T13:32:00Z'), page: 'https://arphandrame.fr/tarifs' });
console.log(msg + '\n');

assert.match(msg, /^NOUVELLE DEMANDE DEPUIS LA PAGE TARIFS\n6 prestations · 3 catégories\n/);
assert.match(msg, /Nom : Jeanne Test\nTéléphone : 06 12 34 56 78\nE-mail : jeanne@example\.com\n/);
assert.match(msg, /1\. PACKS\n   • Pack Vitrine : à partir de 1 500 €\n     comprend : Site vitrine, Fiche Google Business Profile, Logo, Nom de domaine\n/);
assert.match(msg, /2\. SITE INTERNET\n   • Landing page : à partir de 450 €\n/);
assert.match(msg, /3\. MAINTENANCE ET RENFORT\n   • Maintenance : à partir de 150 € \/ mois/);
assert.match(msg, /ESTIMATION VUE PAR LE CLIENT\n━+\nà partir de 1 950 €\n\+ 150 € \/ mois/);
assert.match(msg, /SON PROJET\n━+\nFleuriste, avant le printemps/);
assert.match(msg, /Envoyé le mardi 24 novembre 2026 .*14:32 depuis https:\/\/arphandrame\.fr\/tarifs$/);
assert.ok(!msg.includes('—'), 'pas de tiret cadratin');
assert.match(P.summary({ items: ['Site vitrine'], contact: { email: 'a@b.fr' } }, catalog), /Nom : non précisé/);
assert.ok(!/SON PROJET/.test(P.summary({ items: ['Site vitrine'], contact: {} }, catalog)), 'pas de bloc vide');
console.log('OK : panier');
