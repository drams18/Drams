/* Avis Google : règles de sollicitation de js/reviews.js.
   node tests/reviews.test.mjs */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { create, REVIEW_URL, PROFILE_URL, MAX_SHOWN, COOLDOWN_DAYS } = require('../js/reviews.js');

const DAY = 24 * 60 * 60 * 1000;
const store = () => { const m = new Map(); return { getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)) }; };
const broken = { getItem() { throw new Error('bloqué'); }, setItem() { throw new Error('bloqué'); } };

let t = 1e12;
const now = () => t;
const storage = store();
// Une « session » = un nouveau sessionStorage sur le même localStorage.
const visit = (url = 'https://example.test/avis') => create({ url, storage, session: store(), now });

assert.ok(REVIEW_URL === '' || /^https:\/\//.test(REVIEW_URL), 'REVIEW_URL vide ou en https');
assert.ok(!/\/review\/?$/.test(PROFILE_URL), 'la fiche publique n\'est pas le lien d\'avis');

// Visiteur : jamais sollicité.
assert.equal(visit().shouldPrompt(), false, 'visiteur non invité');

// URL non renseignée : tout est inerte, même invité.
let r = visit('');
r.markInvited();
assert.equal(r.enabled(), false);
assert.equal(visit('').shouldPrompt(), false, 'sans URL');

// Client invité : pas de rappel dans la session où il a ouvert /avis.
r = visit();
r.markInvited();
assert.equal(r.shouldPrompt(), false, 'même session que l\'invitation');

// Session suivante : un rappel, un seul.
r = visit();
assert.equal(r.shouldPrompt(), true, 'invité, nouvelle session');
r.markShown();
assert.equal(r.shouldPrompt(), false, 'une fois par session');

// « Pas maintenant » : silence pendant le cooldown.
r.dismiss();
t += (COOLDOWN_DAYS - 1) * DAY;
assert.equal(visit().shouldPrompt(), false, 'pendant le cooldown');
t += 2 * DAY;
r = visit();
assert.equal(r.shouldPrompt(), true, 'après le cooldown');
r.markShown();

// Plafond total atteint.
assert.equal(r.state().shown, MAX_SHOWN);
t += 365 * DAY;
assert.equal(visit().shouldPrompt(), false, 'plafond total');

// Clic vers Google : plus jamais.
const s2 = store();
const again = () => create({ url: 'https://example.test/avis', storage: s2, session: store(), now });
again().markInvited();
assert.equal(again().shouldPrompt(), true);
again().markClicked();
assert.equal(again().shouldPrompt(), false, 'après un clic vers Google');

// Stockage indisponible ou illisible : pas de rappel, pas d'exception.
r = create({ url: 'https://example.test/avis', storage: broken, session: broken, now });
assert.equal(r.markInvited(), false);
assert.equal(r.shouldPrompt(), false, 'stockage bloqué');
assert.equal(create({ url: 'https://example.test/avis', now }).shouldPrompt(), false, 'sans stockage');
const junk = store(); junk.setItem('drame.reviews', '{"invited":"x","shown":-3}');
assert.equal(create({ url: 'https://example.test/avis', storage: junk, session: store(), now }).shouldPrompt(), false, 'donnée illisible');

console.log('OK : avis Google');
