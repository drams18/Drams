/* Consentement aux cookies : règles de js/consent.js (sans navigateur).
   node tests/consent.test.mjs */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { create, KEY, VERSION, MAX_AGE_DAYS } = require('../js/consent.js');

const DAY = 24 * 60 * 60 * 1000;
const store = () => { const m = new Map(); return { getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)) }; };
const broken = { getItem() { throw new Error('bloqué'); }, setItem() { throw new Error('bloqué'); } };

let t = 1e12;
const now = () => t;

// Première visite : aucun choix, rien n'est accordé.
let s = store();
let c = create({ storage: s, now });
assert.equal(c.get(), null, 'pas de choix au départ');
assert.equal(c.decided(), false);
assert.equal(c.allows('analytics'), false, 'refusé par défaut');

// Refus : mémorisé, relu par une autre page.
c.set(false);
assert.equal(c.decided(), true);
assert.equal(c.allows('analytics'), false);
assert.equal(create({ storage: s, now }).decided(), true, 'refus conservé');
assert.equal(create({ storage: s, now }).allows('analytics'), false);

// Accord : explicite, pour la seule catégorie connue.
c.set(true);
assert.equal(create({ storage: s, now }).allows('analytics'), true, 'accord conservé');
assert.equal(c.allows('publicite'), false, 'catégorie inconnue : jamais accordée');
assert.deepEqual(JSON.parse(s.getItem(KEY)), { v: VERSION, analytics: true, t });

// Seul le booléen true vaut accord.
c.set('oui');
assert.equal(c.allows('analytics'), false, 'valeur non booléenne = refus');

// Retrait : immédiat.
c.set(true); c.set(false);
assert.equal(c.allows('analytics'), false, 'retrait');

// Expiration : accord comme refus sont redemandés après MAX_AGE_DAYS.
c.set(true);
t += (MAX_AGE_DAYS - 1) * DAY;
assert.equal(c.allows('analytics'), true, 'encore valide la veille');
t += DAY;
assert.equal(c.decided(), false, 'expiré : à redemander');
assert.equal(c.allows('analytics'), false, 'expiré : plus d\'accord');
c.set(false);
t += MAX_AGE_DAYS * DAY;
assert.equal(c.decided(), false, 'le refus expire aussi');

// Données illisibles, autre version, date dans le futur : pas de choix.
for (const raw of ['{', 'null', '"oui"', '[]', JSON.stringify({ v: VERSION + 1, analytics: true, t }),
  JSON.stringify({ v: VERSION, analytics: 'true', t }), JSON.stringify({ v: VERSION, analytics: true }),
  JSON.stringify({ v: VERSION, analytics: true, t: t + 3 * DAY })]) {
  s = store(); s.setItem(KEY, raw);
  c = create({ storage: s, now });
  assert.equal(c.decided(), false, 'ignoré : ' + raw);
  assert.equal(c.allows('analytics'), false, 'jamais accordé : ' + raw);
}

// Stockage bloqué : le choix vaut pour la page, pas pour la suivante.
for (const storage of [broken, null]) {
  c = create({ storage, now });
  assert.equal(c.allows('analytics'), false);
  c.set(true);
  assert.equal(c.allows('analytics'), true, 'accord valable sur la page');
  assert.equal(c.persisted(), false, 'non conservé');
  assert.equal(create({ storage, now }).decided(), false, 'page suivante : redemandé');
}

console.log('consent.test : OK');
