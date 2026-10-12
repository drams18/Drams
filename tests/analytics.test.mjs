/* Mesure d'audience : filtres de js/analytics.js (sans navigateur).
   Ce qui peut partir chez Google : adresse de page, page d'origine,
   événements. Chaque filtre est attaqué avec des données personnelles.
   node tests/analytics.test.mjs */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const A = require('../js/analytics.js');

const O = 'https://arphandrame.fr';
const SECRETS = ['jean.testeur', 'example.com', '@', '%40', '0611223344', '06 11 22 33 44', 'Testeur', 'secret'];
const clean = (out) => SECRETS.forEach(s => assert.ok(!decodeURIComponent(out).includes(s), `« ${s} » dans ${out}`));

// ── Adresse de la page ──
assert.equal(A.cleanUrl(O, '/tarifs', ''), O + '/tarifs');
assert.equal(A.cleanUrl(O, '/tarifs', '?utm_source=newsletter&utm_medium=email&utm_campaign=cv-2026'),
  O + '/tarifs?utm_source=newsletter&utm_medium=email&utm_campaign=cv-2026', 'campagne gardée');
assert.equal(A.cleanUrl(O, '/devis', '?theme=day&email=jean.testeur@example.com&nom=Testeur&q=secret'), O + '/devis', 'paramètres inconnus retirés');
assert.equal(A.cleanUrl(O, '/', '?utm_term=secret&utm_source=google'), O + '/?utm_source=google', 'utm_term hors liste');
// Valeurs de campagne : un mot-clé, rien d'autre.
for (const bad of ['jean.testeur@example.com', 'jean.testeur%40example.com', '06 11 22 33 44', '0611223344', '+33611223344',
  'Jean Testeur', 'a b', 'x'.repeat(51), '<script>', 'a&b', 'été', '']) {
  const out = A.cleanUrl(O, '/', '?utm_source=' + encodeURIComponent(bad) + '&utm_campaign=ok');
  assert.equal(out, O + '/?utm_campaign=ok', 'valeur refusée : ' + bad);
}
assert.equal(A.cleanUrl(O, '/', '?utm_source=a&utm_source=jean@x.fr'), O + '/?utm_source=a', 'doublon : seule la première valeur, validée');
clean(A.cleanUrl(O, '/classique/contact', '?from_name=Jean+Testeur&from_email=jean.testeur%40example.com&message=secret+0611223344'));
// Chemin : celui d'une page du site, sinon la racine.
assert.equal(A.safePath('/classique/projets'), '/classique/projets');
assert.equal(A.safePath('/404'), '/404');
for (const bad of ['/jean.testeur@example.com', '/a b', '/x?y', '/tel/0611223344', '/%40', 'javascript:alert(1)', '/é'])
  assert.equal(A.safePath(bad), '/', 'chemin refusé : ' + bad);
assert.equal(A.cleanUrl(O, '/profil/jean.testeur@example.com', '?utm_source=a'), O + '/?utm_source=a');

// ── Page d'origine ──
assert.equal(A.cleanReferrer('', O), '');
assert.equal(A.cleanReferrer(O + '/avis?merci=Testeur#x', O), O + '/avis', 'même site : chemin seul');
assert.equal(A.cleanReferrer('https://mail.google.com/mail/u/0/?q=jean.testeur@example.com#inbox/secret', O), 'https://mail.google.com/', 'autre site : domaine seul');
assert.equal(A.cleanReferrer('https://www.linkedin.com/in/jean-testeur/', O), 'https://www.linkedin.com/');
assert.equal(A.cleanReferrer('pas une adresse', O), '');
assert.equal(A.cleanReferrer('android-app://com.google.android.gm/', O), '', 'protocole non web');
clean(A.cleanReferrer(O + '/classique/contact?from_email=jean.testeur@example.com', O));

// ── Détection d'une donnée personnelle dans l'adresse réelle ──
for (const yes of ['?email=jean@x.fr', '?e=jean%40x.fr', '?e=jean%2540x.fr', '#tel=06 11 22 33 44', '?t=0611223344', '?t=06.11.22.33.44', '?t=%2B33611223344'])
  assert.equal(A.looksPersonal(yes), true, 'à bloquer : ' + yes);
for (const no of ['', '?theme=day', '#projets/skywalk', '?utm_campaign=cv-2026', '?t=k3j9x', '?v=1728731234567', '#etape-3', '?merci'])
  assert.equal(A.looksPersonal(no), false, 'à laisser : ' + no);

// ── Événements : liste fermée de noms, de paramètres et de valeurs ──
assert.deepEqual(A.safeEvent('generate_lead', { form_type: 'devis', site_mode: 'aventure' }), { form_type: 'devis', site_mode: 'aventure' });
assert.deepEqual(A.safeEvent('contact_click', { method: 'email', link_type: 'webmail', site_mode: 'classique' }),
  { method: 'email', link_type: 'webmail', site_mode: 'classique' });
assert.deepEqual(A.safeEvent('generate_lead', { form_type: 'devis', site_mode: 'classique', value: 500, currency: 'EUR', email: 'jean@x.fr', message: 'secret' }),
  { form_type: 'devis', site_mode: 'classique' }, 'paramètres hors liste retirés (dont toute valeur monétaire)');
// Une valeur libre ou manquante : l'événement entier est refusé.
assert.equal(A.safeEvent('contact_click', { method: 'jean.testeur@example.com', link_type: 'copy', site_mode: 'classique' }), null);
assert.equal(A.safeEvent('contact_click', { method: 'email', link_type: 'https://mail.google.com/?to=x&su=secret', site_mode: 'classique' }), null);
assert.equal(A.safeEvent('form_start', { form_type: ['contact'], site_mode: 'classique' }), null, 'seules des chaînes');
assert.equal(A.safeEvent('form_start', { form_type: 'contact' }), null, 'paramètre manquant');
assert.equal(A.safeEvent('form_start', null), null);
for (const name of ['purchase', 'page_view', 'click', 'form_submit', '', 'Generate_Lead', 'jean@x.fr'])
  assert.equal(A.safeEvent(name, { form_type: 'contact' }), null, 'événement refusé : ' + name);

// ── Cookies : tous les domaines où gtag.js a pu les poser ──
assert.deepEqual(A.cookieDomains('arphandrame.fr'), ['', '.arphandrame.fr', 'arphandrame.fr']);
assert.deepEqual(A.cookieDomains('www.arphandrame.fr'), ['', '.arphandrame.fr', '.www.arphandrame.fr', 'www.arphandrame.fr']);
assert.deepEqual(A.cookieDomains('localhost'), ['', 'localhost']);

// ── Serveurs de collecte (appels arrêtés après un retrait) ──
for (const u of ['https://www.google-analytics.com/g/collect?v=2', 'https://region1.google-analytics.com/g/collect', 'https://analytics.google.com/g/collect',
  'https://stats.g.doubleclick.net/g/collect', 'https://www.google.com/ccm/collect', 'https://www.google.fr/ads/ga-audiences/collect'])
  assert.equal(A.isCollect(u), true, u);
for (const u of ['https://arphandrame.fr/js/analytics.js', 'https://api.emailjs.com/api/v1.0/email/send-form', 'https://mail.google.com/mail/?view=cm',
  'https://www.google.com/maps', 'https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js', '/collect', 'pas une adresse', 'https://google-analytics.com.exemple.fr/g/collect'])
  assert.equal(A.isCollect(u), false, u);

// ── Configuration ──
assert.match(A.MEASUREMENT_ID, /^G-[A-Z0-9]{6,}$/);
assert.equal(A.COOKIE_MAX_AGE, 395 * 24 * 60 * 60, 'cookies _ga : 395 jours');
assert.ok(!A.UTM.includes('utm_term'));

console.log('analytics.test : OK');
