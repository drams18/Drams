/* Tests navigateur : consentement + Google Analytics 4 (Chrome headless, tests/cdp.mjs).
     BASE=http://localhost:5173 node tests/analytics.e2e.mjs [dossier-captures]
   Le serveur (npm run dev ou npm run preview) doit tourner.

   Rien ne sort vraiment :
     • les appels de collecte GA4 (…/collect) sont interceptés, lus, puis
       répondus 204 par le test : aucune donnée n'arrive dans la propriété ;
     • EmailJS est remplacé par un faux SDK : aucun e-mail n'est envoyé.
   Seul gtag.js est réellement téléchargé chez Google (comportement réel de
   la bibliothèque). Hors ligne, les scénarios C à E échouent. */
import { launch } from './cdp.mjs';

const BASE = process.env.BASE || 'http://localhost:5173';
const SHOTS = process.argv[2] || null;
const ID = 'G-XYZG9XXTCH';
const results = [];
let failed = 0;
const ok = (name, cond, detail = '') => {
  results.push(`${cond ? 'OK  ' : 'FAIL'} ${name}${detail ? '  (' + detail + ')' : ''}`);
  if (!cond) failed++;
};

const p = await launch({ width: 1280, height: 800 });
const shot = (name) => (SHOTS ? p.shot(`${SHOTS}/${name}.png`) : null);

// ── Réseau : tout ce qui sort du site est noté, la collecte est retenue ──
const net = { google: [], hits: [], gtagJs: 0, emailApi: 0, other: [] };
const archive = [];              // tous les appels de collecte du passage (bilan final)
const EMAIL_STUB = `window.emailjs = { init() {}, sendForm() {
  window.__emailCalls = (window.__emailCalls || 0) + 1;
  return new Promise((res, rej) => setTimeout(() => (window.__emailOk ? res({ status: 200, text: 'OK' }) : rej(new Error('refus simulé'))), 150));
} };`;
const b64 = (s) => Buffer.from(s).toString('base64');
p.on('Fetch.requestPaused', (e) => {
  const url = e.request.url;
  const host = new URL(url).hostname;
  const id = { requestId: e.requestId };
  const done = (m, extra) => p.send(m, { ...id, ...extra }).catch(() => {});
  if (host === 'localhost' || host === '127.0.0.1') return done('Fetch.continueRequest');
  if (/emailjs/.test(url) && host === 'cdn.jsdelivr.net') {
    return done('Fetch.fulfillRequest', { responseCode: 200, responseHeaders: [{ name: 'Content-Type', value: 'application/javascript' }], body: b64(EMAIL_STUB) });
  }
  if (/emailjs\.com$/.test(host)) { net.emailApi++; return done('Fetch.failRequest', { errorReason: 'BlockedByClient' }); }
  if (/(google|doubleclick|googletagmanager|google-analytics)\./.test(host)) {
    net.google.push(url);
    if (/googletagmanager\.com$/.test(host) && /\/gtag\/js/.test(url)) { net.gtagJs++; return done('Fetch.continueRequest'); }
    net.hits.push({ url, body: e.request.postData || '' });
    archive.push(net.hits[net.hits.length - 1]);
    return done('Fetch.fulfillRequest', { responseCode: 204, responseHeaders: [
      { name: 'Access-Control-Allow-Origin', value: new URL(BASE).origin }, { name: 'Access-Control-Allow-Credentials', value: 'true' }] });
  }
  net.other.push(url);
  return done('Fetch.continueRequest');
});
await p.send('Fetch.enable', { patterns: [{ urlPattern: '*' }] });
// Hors du site en ligne, la mesure ne démarre qu'avec ce drapeau (js/analytics.js).
await p.send('Page.addScriptToEvaluateOnNewDocument', { source: `try { localStorage.setItem('drame.analytics.debug', '1'); } catch (e) {}` });

// Un appel de collecte porte un ou plusieurs événements (corps : un par ligne).
const parse = (hits) => hits.flatMap((h) => {
  const base = new URL(h.url).searchParams;
  const lines = h.body ? h.body.split(/\r?\n/).filter(Boolean) : [''];
  return lines.map((l) => { const q = new URLSearchParams(l); const o = Object.fromEntries(base); for (const [k, v] of q) o[k] = v; return o; });
});
const events = () => parse(net.hits);
// Événements écrits par le site. La « mesure améliorée » de GA4 (réglage de la
// propriété) en ajoute d'autres, dont son propre form_start : comptés à part.
const OURS = { form_start: 'ep.form_type', generate_lead: 'ep.form_type', contact_click: 'ep.method' };
const mine = (e) => e.en === 'page_view' || (OURS[e.en] && OURS[e.en] in e);
const named = (en) => events().filter(e => e.en === en && mine(e));
// gtag.js regroupe ses envois : la page vue d'une page peut partir après
// plusieurs secondes. On compte donc par adresse de page.
const pvOf = (path) => named('page_view').filter(e => e.dl === BASE + path);
const pvs = () => named('page_view').map(e => e.dl.replace(BASE, '')).join(' , ') + ` | ${net.gtagJs} gtag.js`;
const reset = () => { net.google.length = 0; net.hits.length = 0; net.gtagJs = 0; net.other.length = 0; p.errors.length = 0; };
const until = async (fn, ms = 6000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await fn()) return true; await p.sleep(150); } return false; };
const quiet = (ms = 2500) => p.sleep(ms);       // laisse le temps à un envoi interdit d'apparaître
const clearAll = async () => {
  await p.eval('localStorage.clear(); sessionStorage.clear(); document.cookie.split(";").forEach(c => { document.cookie = c.split("=")[0].trim() + "=; Max-Age=0; path=/"; })');
};
const fresh = async (path, wait = 900) => { await p.goto(BASE + path, wait); };
const clickText = (scope, text) => p.eval(`(() => { const b = [...document.querySelectorAll(${JSON.stringify(scope + ' button')})].find(x => x.textContent.trim() === ${JSON.stringify(text)}); if (!b) return false; b.click(); return true; })()`);
const state = () => p.eval(`({
  banner: !!document.querySelector('.ck'),
  consent: window.Consent ? window.Consent.get() : 'absent',
  allows: !!(window.Consent && window.Consent.allows('analytics')),
  active: !!(window.Analytics && window.Analytics.isActive()),
  scripts: document.querySelectorAll('script[src*="googletagmanager"]').length,
  dataLayer: Array.isArray(window.dataLayer) ? window.dataLayer.length : null,
  disabled: window['ga-disable-${ID}'],
  ga: document.cookie.split(';').map(c => c.trim().split('=')[0]).filter(n => /^_ga/.test(n)),
  access: document.querySelectorAll('[data-consent-open], .ck-fab').length,
})`);
const type = async (selector, text) => { await p.eval(`document.querySelector(${JSON.stringify(selector)}).focus()`); await p.send('Input.insertText', { text }); };
const PII = ['Jean Testeur', 'Testeur', 'jean.testeur@example.com', 'jean.testeur', '0611223344', 'MESSAGE-SECRET-42'];
const leaks = () => { const all = decodeURIComponent(net.hits.map(h => h.url + '\n' + h.body).join('\n').replace(/\+/g, ' ')); return PII.filter(x => all.includes(x)); };

// ══ A. Première visite ══════════════════════════════════
await fresh('/'); await clearAll(); reset(); await fresh('/');
let s = await state();
ok('A bandeau affiché', s.banner);
ok('A aucun choix enregistré', s.consent === null && !s.allows);
ok('A gtag.js non chargé', s.scripts === 0 && s.dataLayer === null && net.gtagJs === 0);
ok('A boutons présents', (await p.eval('[...document.querySelectorAll(".ck button")].map(b => b.textContent).join("|")')) === 'Tout refuser|Tout accepter|Personnaliser');
const sizes = await p.eval('[...document.querySelectorAll(".ck button")].slice(0, 2).map(b => { const r = b.getBoundingClientRect(), c = getComputedStyle(b); return [Math.round(r.width), Math.round(r.height), c.backgroundColor, c.color, c.fontWeight, c.fontSize, c.borderColor].join("/"); })');
ok('A refuser et accepter : même taille, même style', sizes[0] === sizes[1], sizes[0]);
ok('A bandeau : région nommée', await p.eval('document.querySelector(".ck").getAttribute("role") === "region" && !!document.querySelector(".ck").getAttribute("aria-label")'));
await p.press('Tab');
ok('A clavier : premier arrêt = Tout refuser', (await p.eval('document.activeElement.textContent')) === 'Tout refuser');
await shot('a1-bandeau-accueil');
// Ni l'attente, ni le défilement, ni la navigation ne valent accord.
await p.eval('window.scrollTo(0, 400); document.body.click()');
await fresh('/classique', 1500);
await p.eval('window.scrollTo(0, 600)');
await quiet();
s = await state();
ok('A navigation + défilement : toujours aucun choix', s.banner && s.consent === null && s.scripts === 0);
// Personnaliser : rien de précoché ; fermer ne décide de rien.
await clickText('.ck', 'Personnaliser'); await p.sleep(300);
ok('A panneau ouvert, nommé', await p.eval('(() => { const d = document.querySelector(".ck-dlg"); return d.open && !!document.getElementById(d.getAttribute("aria-labelledby")); })()'));
ok('A focus dans le panneau', await p.eval('!!document.activeElement.closest(".ck-dlg")'));
ok('A mesure d\'audience non précochée', await p.eval('document.getElementById("ck-analytics").checked') === false);
await shot('a2-preferences');
await p.press('Escape'); await p.sleep(250);
s = await state();
ok('A Échap ferme le panneau sans rien décider', !(await p.eval('document.querySelector(".ck-dlg").open')) && s.banner && s.consent === null);
await clickText('.ck', 'Personnaliser'); await p.sleep(200);
await clickText('.ck-dlg', 'Fermer'); await p.sleep(200);
s = await state();
ok('A « Fermer » ne vaut pas accord', s.banner && s.consent === null && s.scripts === 0);
ok('A aucun appel vers Google avant le choix', net.google.length === 0, net.google.join(' '));
ok('A aucun cookie _ga', s.ga.length === 0);

// ══ B. Refus ════════════════════════════════════════════
await clickText('.ck', 'Tout refuser'); await p.sleep(300);
s = await state();
ok('B bandeau retiré', !s.banner);
ok('B refus enregistré', s.consent && s.consent.analytics === false && !s.allows);
ok('B Analytics coupé', !s.active && s.scripts === 0 && s.disabled === true);
ok('B accès aux préférences présent', s.access > 0);
await fresh('/classique', 1200);
s = await state();
ok('B refus conservé au rechargement', !s.banner && s.consent && s.consent.analytics === false && s.scripts === 0);
await fresh('/classique/contact', 1200);
s = await state();
ok('B refus conservé en navigation', !s.banner && !s.active && s.scripts === 0);
await quiet(1500);
ok('B aucun appel vers Google', net.google.length === 0, net.google.join(' '));

// ══ C. Acceptation ══════════════════════════════════════
await clearAll(); reset(); await fresh('/classique', 1200);
await clickText('.ck', 'Tout accepter');
ok('C page_view envoyée', await until(() => named('page_view').length >= 1, 9000));
await quiet(1500);
s = await state();
ok('C bandeau retiré, accord enregistré', !s.banner && s.allows && s.active);
ok('C gtag.js chargé une seule fois', s.scripts === 1 && net.gtagJs === 1, `${s.scripts} balise, ${net.gtagJs} requête`);
ok('C une seule page_view', named('page_view').length === 1, String(named('page_view').length));
let pv = named('page_view')[0] || {};
ok('C identifiant de mesure', pv.tid === ID, pv.tid);
ok('C adresse = chemin seul', pv.dl === BASE + '/classique', pv.dl);
// gcs = G1 + publicité (0 = refusée) + mesure d'audience (1 = accordée).
ok('C consentement transmis : mesure oui, publicité non', pv.gcs === 'G101' && pv.npa === '1', 'gcs=' + pv.gcs + ' npa=' + pv.npa);
ok('C cookie _ga déposé après accord', s.ga.includes('_ga'), s.ga.join(','));
// Page suivante : une page vue, une balise.
reset(); await fresh('/tarifs?utm_source=test&foo=bar&nom=Testeur#recherche', 1200);
ok('C page suivante : page_view', await until(() => pvOf('/tarifs?utm_source=test').length >= 1, 9000));
await quiet(1500);
s = await state();
pv = pvOf('/tarifs?utm_source=test')[0] || {};
ok('C page suivante : une seule page_view, une seule balise', named('page_view').filter(e => /\/tarifs/.test(e.dl)).length === 1 && s.scripts === 1 && net.gtagJs <= 1, pvs());
ok('C adresse : campagne gardée, reste retiré', pv.dl === BASE + '/tarifs?utm_source=test', pv.dl);
ok('C aucune donnée personnelle (adresse de page)', leaks().length === 0, leaks().join(','));
// 404 : chemin fixe (en production, Cloudflare sert cette page pour toute adresse inconnue).
reset(); await fresh('/404.html?nom=jean.testeur', 1200);
await until(() => pvOf('/404').length >= 1, 9000);
pv = pvOf('/404')[0] || named('page_view')[0] || {};
ok('C 404 : chemin fixe « /404 »', pv.dl === BASE + '/404', pv.dl);
// Moyens de contact.
reset(); await fresh('/classique/contact', 1500);
await until(() => named('page_view').length >= 1);
await p.eval('document.addEventListener("click", e => e.preventDefault())');
await p.eval('document.querySelector(\'.ct-orbs a[href^="mailto:"]\').click()');
ok('C contact_click (e-mail)', await until(() => named('contact_click').some(e => e['ep.method'] === 'email')));
await p.eval('document.querySelector(\'.ct-orbs a[href^="tel:"]\').click()');
ok('C contact_click (téléphone)', await until(() => named('contact_click').some(e => e['ep.method'] === 'phone')));
const cc = named('contact_click');
ok('C contact_click : un événement par clic', cc.length === 2, String(cc.length));
// Widget de contact (accueil, tarifs) : lien webmail.
await fresh('/', 1200);
await p.eval('document.addEventListener("click", e => { if (e.target.closest("a")) e.preventDefault(); })');
await p.eval('document.querySelector("[data-contact-cta]").click()'); await p.sleep(300);
await p.eval('document.querySelector(".cw-svc").click()');
ok('C contact_click (webmail, widget)', await until(() => named('contact_click').some(e => e['ep.link_type'] === 'webmail')));
const OWNER = /arphandrame0|0767318426|07 67 31/;
ok('C contact_click : ni adresse ni numéro dans nos événements', !named('contact_click').some(e => OWNER.test(JSON.stringify(e))));

// ══ E. Formulaires (accord donné) ═══════════════════════
const openMsg = async () => { await p.eval('document.querySelector("[data-open-message]").click()'); await p.sleep(400); };
const fillContact = async () => {
  await type('#classic-contact-form [name="from_name"]', 'Jean Testeur');
  await type('#classic-contact-form [name="from_email"]', 'jean.testeur@example.com');
  await type('#classic-contact-form [name="message"]', 'MESSAGE-SECRET-42');
};
const submitContact = () => p.eval('document.querySelector("#classic-contact-form [type=submit]").click()');
reset(); await fresh('/classique/contact', 1500);
await until(() => named('page_view').length >= 1);
await openMsg();
await p.eval('document.querySelector("#classic-contact-form [name=from_name]").focus()');
await quiet(1200);
ok('E contact : le focus seul ne vaut pas form_start', named('form_start').length === 0);
// Formulaire vide : la validation du navigateur bloque l'envoi.
await submitContact(); await quiet(1500);
ok('E contact vide : aucun envoi, aucun generate_lead', (await p.eval('window.__emailCalls || 0')) === 0 && named('generate_lead').length === 0);
await fillContact();
ok('E contact : form_start à la première saisie', await until(() => named('form_start').length >= 1));
await quiet(1200);
ok('E contact : form_start unique', named('form_start').length === 1, String(named('form_start').length));
ok('E contact : form_type=contact, site_mode=classique', named('form_start')[0]['ep.form_type'] === 'contact' && named('form_start')[0]['ep.site_mode'] === 'classique');
// Envoi refusé par le service : pas de lead.
await p.eval('window.__emailOk = false');
await submitContact();
await until(() => p.eval('document.querySelector("#classic-contact-form .form-status").classList.contains("is-error")'));
await quiet(1500);
ok('E contact : échec d\'envoi → aucun generate_lead', named('generate_lead').length === 0 && (await p.eval('window.__emailCalls')) === 1);
// Envoi réussi, déclenché deux fois d'affilée (double clic).
await p.eval('window.__emailOk = true; window.__emailCalls = 0');
await p.eval('(() => { const f = document.getElementById("classic-contact-form"); f.requestSubmit(); f.requestSubmit(); })()');
ok('E contact : generate_lead après confirmation', await until(() => named('generate_lead').length >= 1));
await quiet(1500);
ok('E contact : double envoi → un seul e-mail', (await p.eval('window.__emailCalls')) === 1, String(await p.eval('window.__emailCalls')));
ok('E contact : generate_lead unique', named('generate_lead').length === 1, String(named('generate_lead').length));
const lead = named('generate_lead')[0] || {};
ok('E contact : paramètres du lead', lead['ep.form_type'] === 'contact' && lead['ep.site_mode'] === 'classique' && !('epn.value' in lead) && !('ep.currency' in lead) && !lead.cu);
ok('E contact : aucune donnée personnelle transmise', leaks().length === 0, leaks().join(','));
const leadsBefore = named('generate_lead').length;
await fresh('/classique/contact', 1500);
await until(() => named('page_view').length >= 2); await quiet(1200);
ok('E contact : rechargement → pas de nouveau lead', named('generate_lead').length === leadsBefore);
ok('E aucun appel direct à api.emailjs.com (faux SDK)', net.emailApi === 0);

// Devis : cinq étapes, récapitulatif, coordonnées.
reset(); await fresh('/devis', 1000);
await p.eval('sessionStorage.removeItem("drame.buildproject")'); await fresh('/devis#etape-1', 600);
await p.eval('location.reload()'); await p.sleep(1000);
for (let i = 0; i < 5; i++) {
  await p.eval('document.querySelector("#wizard .option").click()');
  await p.sleep(200);
  if (await p.eval('!!document.querySelector("#wizard .options--multi")')) await p.eval('[...document.querySelectorAll("#wizard .step__actions .btn--primary")].pop().click()');
  await p.sleep(500);
}
ok('E devis : récapitulatif atteint', await p.eval('location.hash') === '#recap');
await p.eval('document.querySelector("#wizard .step__actions .btn--primary").click()'); await p.sleep(500);
ok('E devis : formulaire affiché', await p.eval('!!document.querySelector("#wizard form [name=client_email]")'));
await quiet(800);
ok('E devis : choix des étapes ≠ form_start', named('form_start').length === 0);
await type('#wizard [name="client_prenom"]', 'Jean');
await type('#wizard [name="client_nom"]', 'Testeur');
await type('#wizard [name="client_email"]', 'jean.testeur');             // adresse invalide
await p.eval('window.__emailOk = true; window.__emailCalls = 0');
await p.eval('document.querySelector("#wizard form [type=submit]").click()'); await quiet(1500);
ok('E devis invalide : aucun envoi, aucun generate_lead', (await p.eval('window.__emailCalls')) === 0 && named('generate_lead').length === 0);
await type('#wizard [name="client_email"]', '@example.com');
await type('#wizard [name="client_tel"]', '0611223344');
await type('#wizard [name="client_message"]', 'MESSAGE-SECRET-42');
await p.eval('document.querySelector("#wizard form [type=submit]").click()');
ok('E devis : generate_lead après confirmation', await until(() => named('generate_lead').length >= 1));
await quiet(1500);
ok('E devis : confirmation affichée', (await p.eval('document.querySelector("#wizard h1").textContent')) === 'Projet transmis');
ok('E devis : un e-mail, un generate_lead, un form_start', (await p.eval('window.__emailCalls')) === 1 && named('generate_lead').length === 1 && named('form_start').length === 1,
  `${named('generate_lead').length} lead, ${named('form_start').length} start : ` + JSON.stringify(named('form_start').map(e => Object.fromEntries(Object.entries(e).filter(([k]) => /^ep/.test(k))))));
ok('E devis : form_type=devis', (named('generate_lead')[0] || {})['ep.form_type'] === 'devis');
ok('E devis : aucune donnée personnelle transmise', leaks().length === 0, leaks().join(','));
await shot('e1-devis-transmis');
await p.eval('location.reload()'); await p.sleep(1200); await quiet(1500);
ok('E devis : rechargement après confirmation → pas de nouveau lead', named('generate_lead').length === 1);

// ══ D. Retrait du consentement ══════════════════════════
reset(); await fresh('/classique', 1500);
await until(() => named('page_view').length >= 1);
s = await state();
ok('D départ : mesure active, cookies présents', s.active && s.ga.length >= 1, s.ga.join(','));
ok('D lien « Cookies » dans le pied de page', await p.eval('!!document.querySelector(".footer [data-consent-open]")'));
await p.eval('document.querySelector(".footer [data-consent-open]").focus(); document.querySelector(".footer [data-consent-open]").click()'); await p.sleep(300);
ok('D panneau rouvert, case = accord en cours', await p.eval('document.querySelector(".ck-dlg").open && document.getElementById("ck-analytics").checked'));
await p.eval('document.getElementById("ck-analytics").click()');
await clickText('.ck-dlg', 'Enregistrer mes choix'); await p.sleep(400);
s = await state();
ok('D état mis à jour', s.consent && s.consent.analytics === false && !s.allows && !s.active);
ok('D collecte coupée (ga-disable)', s.disabled === true);
ok('D cookies _ga supprimés', s.ga.length === 0, s.ga.join(','));
ok('D focus rendu au lien d\'ouverture', await p.eval('document.activeElement.hasAttribute("data-consent-open")'));
ok('D pas de bandeau (le refus est un choix)', !s.banner);
const before = net.hits.length;
await p.eval('document.addEventListener("click", e => e.preventDefault())');
await p.eval('window.Analytics.event("contact_click", { method: "email" }); document.dispatchEvent(new CustomEvent("lead:sent", { detail: { type: "contact" } }));');
await p.eval('window.scrollTo(0, document.body.scrollHeight)');
await quiet(3000);
ok('D plus aucun appel de collecte après retrait', net.hits.length === before, `${net.hits.length - before} appel(s)`);
reset(); await fresh('/classique/projets', 1500); await quiet(1500);
s = await state();
ok('D visite suivante : retrait conservé, rien de chargé', !s.banner && !s.active && s.scripts === 0 && net.google.length === 0 && s.ga.length === 0);
// Nouvel accord depuis une page sans pied de page (bouton discret).
ok('D bouton d\'accès sur une page sans pied de page', await p.eval('!!document.querySelector(".ck-fab")'));
await shot('d1-bouton-acces');
await p.eval('document.querySelector(".ck-fab").click()'); await p.sleep(300);
await clickText('.ck-dlg', 'Tout accepter');
ok('D nouvel accord pris en compte tout de suite', await until(() => named('page_view').length === 1));
// Refus + formulaire réussi : rien ne part.
reset(); await fresh('/classique/contact', 1200);
await p.eval('window.Consent.set(false)'); await p.sleep(200);
reset(); await openMsg(); await fillContact();
await p.eval('window.__emailOk = true; window.__emailCalls = 0'); await submitContact();
await until(() => p.eval('document.querySelector("#classic-contact-form .form-status").classList.contains("is-ok")'));
await quiet(2000);
ok('D refus : formulaire envoyé, aucun appel vers Google', (await p.eval('window.__emailCalls')) === 1 && net.hits.length === 0, `${net.hits.length} appel(s)`);

// ══ G. Confidentialité des adresses et des clics (accord donné) ═
const rawAll = () => decodeURIComponent(net.hits.map(h => h.url + '\n' + h.body).join('\n').replace(/\+/g, ' '));
const SECRET = 'zzrecherchezz';
await fresh('/'); await p.eval('window.Consent.set(true)'); await p.sleep(300);
// Paramètres : seuls les utm_* de la liste, avec une valeur « mot-clé ».
reset(); await fresh('/tarifs?utm_source=newsletter&utm_medium=Jean%20Testeur&utm_term=MESSAGE-SECRET-42&utm_campaign=cv-2026&nom=Testeur&ref=MESSAGE-SECRET-42#pro', 1200);
ok('G campagne : page_view', await until(() => pvOf('/tarifs?utm_source=newsletter&utm_campaign=cv-2026').length === 1, 9000), pvs());
await p.eval('window.scrollTo(0, document.body.scrollHeight)'); await quiet(2500);
ok('G campagne : valeurs refusées et paramètres inconnus absents de tous les appels', leaks().length === 0 && !/utm_term|utm_medium/.test(rawAll()), leaks().join(','));
// Adresse contenant une donnée personnelle : la page n'est pas mesurée du tout.
for (const url of ['/devis?email=jean.testeur@example.com', '/tarifs?utm_source=jean.testeur%40example.com', '/classique/contact?tel=06%2011%2022%2033%2044#message']) {
  reset(); await fresh(url, 1500); await quiet(2500);
  s = await state();
  // (un dernier envoi de la page précédente, encore sous accord, peut arriver ici : on regarde cette page-ci)
  const here = events().filter(e => (e.dl || '').startsWith(BASE + url.split('?')[0]));
  ok(`G adresse avec donnée personnelle : page non mesurée (${url.split('?')[0]})`, !s.active && s.scripts === 0 && net.gtagJs === 0 && here.length === 0 && leaks().length === 0 && s.allows, `${here.length} appel(s) ${leaks().join(',')}`);
}
// Page d'origine : sans paramètres.
reset(); await fresh('/avis?merci=Testeur&src=MESSAGE-SECRET-42', 1200);
await until(() => pvOf('/avis').length >= 1, 9000);
await p.eval('document.querySelector(\'a[href="/classique/contact"]\').click()'); await p.sleep(1500);
ok('G page d\'origine : page suivante mesurée', await until(() => pvOf('/classique/contact').length >= 1, 9000), pvs());
pv = pvOf('/classique/contact')[0] || {};
ok('G page d\'origine : chemin seul', pv.dr === BASE + '/avis', 'dr=' + pv.dr);
await quiet(1500);
ok('G page d\'origine : aucun paramètre transmis', leaks().length === 0, leaks().join(','));
// Liens de contact : jamais l'adresse du lien, le destinataire, l'objet ou le corps.
reset(); await fresh('/tarifs', 1200);
await until(() => pvOf('/tarifs').length >= 1, 9000);
await p.eval('document.addEventListener("click", e => { if (e.target.closest("a")) e.preventDefault(); }, true)');
await type('#tarifSearch', SECRET); await p.sleep(400);
ok('G tarifs : recherche sans résultat', await p.eval('!!document.querySelector(".noresult button")'));
ok('G tarifs : titre de page sans le texte cherché', !(await p.eval('document.title')).includes(SECRET));
await p.eval('document.querySelector(".noresult button").click()'); await p.sleep(300);
const hrefs = await p.eval('[...document.querySelectorAll(".cw-svc")].map(a => a.href)');
ok('G tarifs : les liens webmail portent bien le texte cherché (cas à protéger)', hrefs.length === 3 && hrefs.every(h => h.includes(SECRET)));
for (let i = 0; i < 3; i++) {
  await p.eval('document.querySelector("[data-contact-cta], .noresult button").click()'); await p.sleep(200);
  await p.eval(`document.querySelectorAll(".cw-svc")[${i}].click()`); await p.sleep(400);
}
ok('G liens de contact : nos trois contact_click', await until(() => named('contact_click').length === 3), String(named('contact_click').length));
await quiet(3000);
ok('G liens de contact : valeurs prédéfinies seulement', named('contact_click').every(e => e['ep.method'] === 'email' && ['webmail', 'app'].includes(e['ep.link_type'])
  && Object.keys(e).filter(k => /^ep\./.test(k)).every(k => ['ep.method', 'ep.link_type', 'ep.site_mode', 'ep.debug_mode'].includes(k))));
ok('G liens de contact : ni texte cherché, ni objet, ni corps, ni adresse du lien', !new RegExp(`${SECRET}|Demande d'information|je souhaiterais|mail\\.google|outlook\\.live|mailto:|[?&](su|subject|body|to)=`, 'i').test(rawAll()),
  (rawAll().match(new RegExp(`.{0,60}(${SECRET}|mail\\.google|outlook\\.live|mailto:).{0,40}`, 'i')) || [''])[0]);
ok('G liens de contact : ni adresse ni numéro du site', !OWNER.test(rawAll()));
ok('G liens de contact : aucun « click » automatique sur ces liens', !events().some(e => e.en === 'click'), events().filter(e => e.en === 'click').map(e => e['ep.link_url']).join(' '));
// Téléphone et SMS (liens du widget sur mobile) + bouton « Copier ».
reset(); await fresh('/classique/contact', 1500);
await until(() => pvOf('/classique/contact').length >= 1, 9000);
await p.eval('document.addEventListener("click", e => { if (e.target.closest("a")) e.preventDefault(); }, true)');
await p.eval(`(() => { for (const href of ['tel:0767318426', 'sms:0767318426?&body=MESSAGE-SECRET-42', 'mailto:arphandrame0@gmail.com?subject=MESSAGE-SECRET-42&body=Jean%20Testeur']) { const a = document.createElement('a'); a.href = href; a.textContent = 'x'; document.body.appendChild(a); a.click(); } })()`);
ok('G tel / sms / mailto : trois contact_click', await until(() => named('contact_click').length === 3), named('contact_click').map(e => e['ep.method']).join(','));
await quiet(2500);
ok('G tel / sms / mailto : rien d\'autre que le moyen de contact', leaks().length === 0 && !OWNER.test(rawAll()), leaks().join(','));
// Événements : un texte libre ne peut pas sortir par Analytics.event().
reset();
const sent = await p.eval(`[
  window.Analytics.event('contact_click', { method: 'jean.testeur@example.com', link_type: 'copy', note: 'MESSAGE-SECRET-42', site_mode: 'classique' }),
  window.Analytics.event('generate_lead', { form_type: 'contact', site_mode: 'classique', value: 900, currency: 'EUR', email: 'jean.testeur@example.com' }),
  window.Analytics.event('evenement_libre', { nom: 'Jean Testeur' }),
  window.Analytics.event('page_view', { page_location: location.origin + '/?email=jean.testeur@example.com' }),
]`);
ok('G événements : valeur libre ou nom hors liste → événement refusé', sent.join() === 'false,true,false,false', sent.join());
await until(() => named('generate_lead').length >= 1); await quiet(2000);
const gl = named('generate_lead')[0] || {};
ok('G événements : paramètres hors liste retirés (valeur, devise, texte)', leaks().length === 0 && !('epn.value' in gl) && !gl.cu && !('ep.currency' in gl) && !('ep.email' in gl) && !/900/.test(JSON.stringify(Object.entries(gl).filter(([k]) => /^epn?\./.test(k)))), leaks().join(','));
ok('G événements : aucun événement « libre » parti', !events().some(e => e.en === 'evenement_libre' || e.en === 'contact_click') && named('page_view').length === 0);

// ══ H. Retrait : compléments ════════════════════════════
const cookies = async () => (await p.send('Network.getCookies', { urls: [BASE + '/'] })).cookies.filter(c => /^_ga/.test(c.name));
const days = (c) => (c.expires - Date.now() / 1000) / 86400;
await clearAll(); reset(); await fresh('/classique', 1200);
await clickText('.ck', 'Tout accepter');
await until(() => pvOf('/classique').length >= 1, 9000);
let ck = await cookies();
ok('H durée : cookies _ga et _ga_<flux> présents', ck.length === 2, ck.map(c => c.name).join(','));
ok('H durée : expiration à 395 jours (13 mois)', ck.length > 0 && ck.every(c => days(c) > 394 && days(c) < 396), ck.map(c => `${c.name}=${days(c).toFixed(1)} j`).join(' '));
ok('H cookies : chemin « / », non HttpOnly (effaçables par le site)', ck.every(c => c.path === '/' && !c.httpOnly));
const exp0 = Object.fromEntries(ck.map(c => [c.name, c.expires]));
await p.sleep(2200);
reset(); await fresh('/tarifs', 1200); await until(() => pvOf('/tarifs').length >= 1, 9000); await quiet(800);
ck = await cookies();
ok('H durée : non prolongée par une nouvelle page (_ga)', ck.some(c => c.name === '_ga') && ck.filter(c => c.name === '_ga').every(c => Math.abs(c.expires - exp0[c.name]) < 1.5),
  ck.map(c => `${c.name} ${(c.expires - exp0[c.name]).toFixed(1)} s`).join(' '));
// Retrait puis nouvel accord sur la même page : une seule balise, pas de page vue en double.
reset(); await fresh('/classique', 1200); await until(() => pvOf('/classique').length >= 1, 9000);
await p.eval('document.addEventListener("click", e => { if (e.target.closest("a")) e.preventDefault(); }, true)');
await p.eval('window.Consent.set(false)'); await p.sleep(300);
ok('H retrait : cookies effacés (lecture navigateur)', (await cookies()).length === 0, (await cookies()).map(c => c.name + '@' + c.domain).join(','));
const afterWithdraw = net.hits.length;
await p.eval('document.querySelector(\'a[href^="mailto:"], .footer a\').click(); window.Analytics.event("contact_click", { method: "email", link_type: "app", site_mode: "classique" })');
await quiet(2500);
ok('H retrait : aucun appel ensuite', net.hits.length === afterWithdraw);
await p.eval('window.Consent.set(true)'); await p.sleep(300);
await p.eval('window.Analytics.event("contact_click", { method: "email", link_type: "copy", site_mode: "classique" })');
ok('H nouvel accord, même page : la collecte reprend', await until(() => named('contact_click').length >= 1));
await quiet(2500);
s = await state();
ok('H nouvel accord, même page : une seule balise, gtag.js non rechargé', s.scripts === 1 && net.gtagJs <= 1, `${s.scripts} balise, ${net.gtagJs} requête`);
ok('H nouvel accord, même page : pas de seconde page_view', pvOf('/classique').length === 1, pvs());
for (let i = 0; i < 3; i++) { await p.eval('window.Consent.set(false)'); await p.eval('window.Consent.set(true)'); }
await quiet(2000);
s = await state();
ok('H accords / retraits répétés : toujours une balise, une page_view', s.scripts === 1 && pvOf('/classique').length === 1 && s.active, `${s.scripts} balise ; ${pvs()}`);
// Retrait juste après l'affichage, puis départ : le lot que gtag.js gardait en attente ne part pas.
reset(); await fresh('/tarifs', 1300);
await p.eval('window.scrollTo(0, document.body.scrollHeight)'); await p.sleep(200);
await p.eval('window.Consent.set(false)');
const pending = net.hits.length;
await fresh('/avis', 1200); await quiet(3000);
ok('H retrait puis départ immédiat : aucun envoi différé', net.hits.length === pending, events().slice(pending).map(e => `${e.en} ${e.dl}`).join(' | '));
await p.eval('window.Consent.set(true)'); await p.sleep(300);
reset(); await fresh('/classique', 1200); await until(() => pvOf('/classique').length >= 1, 9000);
// L'accord est relu au moment de l'envoi (retiré sans que la page le sache).
reset();
await p.eval(`localStorage.setItem('drame.consent', JSON.stringify({ v: 1, analytics: false, t: Date.now() }))`);
await p.eval('document.dispatchEvent(new CustomEvent("lead:sent", { detail: { type: "contact" } }))');
await quiet(2500);
s = await state();
ok('H accord retiré à l\'insu de la page : événement non envoyé, collecte coupée', net.hits.length === 0 && !s.active && s.disabled === true && s.ga.length === 0, `${net.hits.length} appel(s)`);
// Accord expiré (plus de 6 mois) : même chose.
await p.eval('window.Consent.set(true)'); await p.sleep(300); reset();
await p.eval(`localStorage.setItem('drame.consent', JSON.stringify({ v: 1, analytics: true, t: Date.now() - 183 * 864e5 }))`);
await p.eval('document.dispatchEvent(new CustomEvent("lead:sent", { detail: { type: "devis" } }))');
await quiet(2500);
ok('H accord expiré : événement non envoyé', net.hits.length === 0 && !(await state()).active);
await fresh('/classique', 1200);
s = await state();
ok('H accord expiré : bandeau redemandé à la page suivante, rien de chargé', s.banner && s.scripts === 0 && s.consent === null);
// Retour arrière. Page gardée en mémoire par le navigateur : son état date d'avant.
await p.eval('window.Consent.set(true)'); await p.sleep(300);
reset(); await fresh('/classique/competences', 1500); await until(() => pvOf('/classique/competences').length >= 1, 9000);
await p.eval(`localStorage.setItem('drame.consent', JSON.stringify({ v: 1, analytics: false, t: Date.now() }))`);   // refus donné « ailleurs »
await p.eval('window.dispatchEvent(new PageTransitionEvent("pageshow", { persisted: true }))'); await p.sleep(300);
const afterBack = net.hits.length;
await p.eval('window.Analytics.event("contact_click", { method: "email", link_type: "app", site_mode: "classique" })'); await quiet(2500);
s = await state();
ok('H retour arrière (page en mémoire) après un refus : collecte coupée, pas de page vue', !s.active && s.disabled === true && net.hits.length === afterBack && s.ga.length === 0);
await p.eval('window.Consent.set(true)'); await p.sleep(300); reset();
await p.eval('window.dispatchEvent(new PageTransitionEvent("pageshow", { persisted: true }))');
ok('H retour arrière (page en mémoire) avec accord : la page est recomptée', await until(() => pvOf('/classique/competences').length === 1));
await quiet(2000);
ok('H retour arrière avec accord : une seule fois, sans nouvelle balise', pvOf('/classique/competences').length === 1 && (await state()).scripts === 1, pvs());
// Retour arrière réel : refus sur la page suivante, puis « précédent ».
await p.send('Page.addScriptToEvaluateOnNewDocument', { source: 'addEventListener("pageshow", e => { window.__persisted = e.persisted; })' });
reset(); await fresh('/avis', 1200); await until(() => pvOf('/avis').length >= 1, 9000);
await fresh('/tarifs', 1200); await p.eval('window.Consent.set(false)'); await p.sleep(300);
reset(); await p.eval('history.back()'); await p.sleep(2000); await quiet(2000);
s = await state();
const how = (await p.eval('window.__persisted')) ? 'page reprise en mémoire' : 'page rechargée';
ok(`H retour arrière réel après refus (${how}) : rien d'envoyé, collecte coupée`, (await p.eval('location.pathname')).replace('.html', '') === '/avis' && !s.active && !s.banner && net.hits.length === 0 && s.ga.length === 0, events().map(e => `${e.en} ${e.dl}`).join(' | '));

// ══ I. Formulaires du mode aventure et du mini-jeu ══════
const PERSON = { prenom: 'Jean', nom: 'Testeur', email: 'jean.testeur@example.com', tel: '0611223344', msg: 'MESSAGE-SECRET-42' };
await fresh('/'); await p.eval('window.Consent.set(true)'); await p.sleep(300);
// Mode aventure : fenêtre Contact.
reset(); await fresh('/aventure#aventure/ville', 1800);
for (let i = 0; i < 6 && (await p.eval('window.__aventure.state')) !== 'play'; i++) {
  if (await p.eval('!!document.querySelector(".adv-brief .adv-btn--big") && window.__aventure.state === "briefing"')) await p.eval('document.querySelector(".adv-brief .adv-btn--big").click()');
  else await p.press('Space');
  await p.sleep(500);
}
await p.eval('location.hash = "#contact"'); await p.sleep(700);
ok('I aventure : formulaire de contact ouvert', await p.eval('!!document.querySelector(".adv-form [name=from_email]")'), await p.eval('window.__aventure.state'));
const AF = '.adv-form';
await p.eval('window.__emailCalls = 0; window.__emailOk = false');
await p.eval(`document.querySelector('${AF}').requestSubmit()`); await quiet(1200);
ok('I aventure : formulaire vide → aucun envoi', (await p.eval('window.__emailCalls')) === 0 && named('generate_lead').length === 0);
await type(`${AF} [name="from_name"]`, 'Jean Testeur');
await type(`${AF} [name="from_email"]`, PERSON.email);
await type(`${AF} [name="message"]`, PERSON.msg);
ok('I aventure : form_start', await until(() => named('form_start').length === 1));
ok('I aventure : form_type=contact, site_mode=aventure', (named('form_start')[0] || {})['ep.form_type'] === 'contact' && (named('form_start')[0] || {})['ep.site_mode'] === 'aventure');
// Échec, puis nouvelle tentative réussie (double envoi) : un seul lead.
await p.eval(`document.querySelector('${AF}').requestSubmit()`);
await until(() => p.eval(`document.querySelector('${AF} .adv-form__status').classList.contains('is-error')`)); await quiet(1500);
ok('I aventure : échec EmailJS → aucun generate_lead', (await p.eval('window.__emailCalls')) === 1 && named('generate_lead').length === 0);
await type(`${AF} [name="message"]`, ' suite');
await p.eval(`window.__emailOk = true; window.__emailCalls = 0; (() => { const f = document.querySelector('${AF}'); f.requestSubmit(); f.requestSubmit(); })()`);
ok('I aventure : generate_lead après confirmation', await until(() => named('generate_lead').length >= 1));
await quiet(2000);
ok('I aventure : nouvelle tentative + double envoi → un e-mail, un lead, un form_start', (await p.eval('window.__emailCalls')) === 1 && named('generate_lead').length === 1 && named('form_start').length === 1,
  `${await p.eval('window.__emailCalls')} e-mail, ${named('generate_lead').length} lead, ${named('form_start').length} start`);
ok('I aventure : lead form_type=contact, site_mode=aventure', (named('generate_lead')[0] || {})['ep.form_type'] === 'contact' && (named('generate_lead')[0] || {})['ep.site_mode'] === 'aventure');
ok('I aventure : aucune donnée saisie transmise', leaks().length === 0, leaks().join(','));
// Accord retiré pendant l'envoi : l'e-mail part, pas l'événement.
await type(`${AF} [name="from_name"]`, 'Jean Testeur'); await type(`${AF} [name="from_email"]`, PERSON.email); await type(`${AF} [name="message"]`, PERSON.msg);
await quiet(1200); reset();
await p.eval(`window.__emailCalls = 0; document.querySelector('${AF}').requestSubmit(); window.Consent.set(false)`);
await until(() => p.eval(`document.querySelector('${AF} .adv-form__status').classList.contains('is-ok')`)); await quiet(2500);
ok('I aventure : accord retiré pendant l\'envoi → e-mail envoyé, aucun appel vers Google', (await p.eval('window.__emailCalls')) === 1 && net.hits.length === 0, `${net.hits.length} appel(s)`);

// Mini-jeu « Construisez votre projet ».
await p.eval('window.Consent.set(true)'); await p.sleep(300);
reset(); await fresh('/construire-projet', 1800);
await p.eval('sessionStorage.removeItem("drame.buildproject")'); await fresh('/construire-projet?t=1', 1800);
const B = 'window.__construire';
await p.eval(`${B}.answers.data.projectType = 'Site web'; ${B}.answers.save(); ${B}._toStep(5)`); await p.sleep(1000);
await p.eval('[...document.querySelectorAll(".bp-panel:not([hidden]) .adv-btn")].find(b => b.textContent === "Continuer").click()'); await p.sleep(400);
const BF = '.bp-panel:not([hidden]) form';
ok('I mini-jeu : formulaire affiché', await p.eval(`${B}.phase === 'form' && !!document.querySelector('${BF} [name=client_email]')`));
await quiet(1000);
ok('I mini-jeu : réponses du jeu ≠ form_start', named('form_start').length === 0);
await p.eval('window.__emailCalls = 0; window.__emailOk = true');
await type(`${BF} [name="client_prenom"]`, PERSON.prenom);
await type(`${BF} [name="client_nom"]`, PERSON.nom);
await type(`${BF} [name="client_email"]`, 'jean.testeur');                 // adresse invalide
await p.eval(`document.querySelector('${BF}').requestSubmit()`); await quiet(1500);
ok('I mini-jeu invalide : aucun envoi, aucun generate_lead', (await p.eval('window.__emailCalls')) === 0 && named('generate_lead').length === 0 && await p.eval(`${B}.phase === 'form'`));
await type(`${BF} [name="client_email"]`, '@example.com');
await type(`${BF} [name="client_tel"]`, PERSON.tel);
await type(`${BF} textarea`, PERSON.msg);
await p.eval('window.__emailOk = false');
await p.eval(`document.querySelector('${BF}').requestSubmit()`);
await until(() => p.eval(`document.querySelector('${BF} .adv-form__status').classList.contains('is-error')`)); await quiet(1500);
ok('I mini-jeu : échec EmailJS → aucun generate_lead', (await p.eval('window.__emailCalls')) === 1 && named('generate_lead').length === 0 && await p.eval(`${B}.phase === 'form'`));
await p.eval(`window.__emailOk = true; window.__emailCalls = 0; (() => { const f = document.querySelector('${BF}'); f.requestSubmit(); f.requestSubmit(); })()`);
ok('I mini-jeu : generate_lead après confirmation', await until(() => named('generate_lead').length >= 1));
await quiet(2000);
ok('I mini-jeu : nouvelle tentative + double envoi → un e-mail, un lead, un form_start', (await p.eval('window.__emailCalls')) === 1 && named('generate_lead').length === 1 && named('form_start').length === 1,
  `${await p.eval('window.__emailCalls')} e-mail, ${named('generate_lead').length} lead, ${named('form_start').length} start`);
ok('I mini-jeu : form_type=devis, site_mode=aventure', (named('generate_lead')[0] || {})['ep.form_type'] === 'devis' && (named('generate_lead')[0] || {})['ep.site_mode'] === 'aventure');
ok('I mini-jeu : confirmation affichée', await p.eval('[...document.querySelectorAll(".bp-panel:not([hidden]) h2, .bp-panel:not([hidden]) [id$=title]")].some(e => e.textContent === "Projet transmis")'));
ok('I mini-jeu : aucune donnée saisie transmise', leaks().length === 0, leaks().join(','));
await p.eval('location.reload()'); await p.sleep(1800); await quiet(1500);
ok('I mini-jeu : rechargement → pas de nouveau lead', named('generate_lead').length === 1);
ok('I aucun appel direct à api.emailjs.com (faux SDK)', net.emailApi === 0);

// ══ F. Qualité technique ════════════════════════════════
const PAGES = ['/', '/classique', '/classique/projets', '/classique/parcours', '/classique/competences', '/classique/contact',
  '/tarifs', '/devis', '/avis', '/aventure', '/construire-projet'];
for (const mode of ['refus', 'accord']) {
  await fresh('/'); await p.eval(`window.Consent.set(${mode === 'accord'})`);
  for (const path of PAGES) {
    reset(); await fresh(path, 1600);
    if (mode === 'accord') { await until(() => pvOf(path).length >= 1, 9000); await quiet(1200); }
    s = await state();
    const errs = p.errors.filter(e => !/favicon/.test(e));
    ok(`F ${mode} ${path} : console propre`, errs.length === 0, errs.join(' | ').slice(0, 200));
    ok(`F ${mode} ${path} : accès aux préférences`, s.access > 0 && !s.banner);
    if (mode === 'accord') ok(`F accord ${path} : une page_view, une balise`, pvOf(path).length === 1 && s.scripts === 1 && net.gtagJs <= 1, pvs());
    else ok(`F refus ${path} : rien vers Google`, net.google.length === 0 && s.scripts === 0);
  }
}
// Mode aventure : le clavier du bandeau ne pilote pas le jeu.
await clearAll(); reset(); await fresh('/aventure', 1800);
ok('F aventure : bandeau affiché', (await state()).banner);
await shot('f1-aventure-bandeau');
await clickText('.ck', 'Personnaliser'); await p.sleep(300);
const advState = await p.eval('window.__aventure.state');
await p.press('Escape'); await p.sleep(300);
ok('F aventure : Échap ferme le panneau, pas de menu pause', !(await p.eval('document.querySelector(".ck-dlg").open')) && (await p.eval('window.__aventure.state')) === advState);
ok('F aventure : entrée COOKIES dans le menu', await p.eval('!!document.querySelector(".adv-pause [data-consent-open]")'));
// Mobile : le bandeau tient dans l'écran, sans défilement horizontal.
await p.setViewport(360, 640, { mobile: true, dpr: 2 });
for (const path of ['/', '/classique', '/devis', '/aventure']) {
  await fresh(path, 1500);
  const m = await p.eval('(() => { const c = document.querySelector(".ck__card"); if (!c) return null; const r = c.getBoundingClientRect(); const bs = [...c.querySelectorAll("button")].map(b => b.getBoundingClientRect()); return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, vw: innerWidth, vh: innerHeight, minH: Math.min(...bs.map(b => b.height)), inView: bs.every(b => b.top >= 0 && b.bottom <= innerHeight && b.left >= 0 && b.right <= innerWidth), overflow: document.documentElement.scrollWidth > innerWidth }; })()');
  ok(`F mobile ${path} : bandeau dans l'écran`, m && m.left >= 0 && m.right <= m.vw && m.top >= 0 && m.inView && !m.overflow, JSON.stringify(m));
  ok(`F mobile ${path} : boutons d'au moins 40 px`, m && m.minH >= 40, m && String(m.minH));
  await shot('f2-mobile' + path.replace(/\//g, '-'));
}
await clickText('.ck', 'Personnaliser'); await p.sleep(300);
const d = await p.eval('(() => { const r = document.querySelector(".ck-dlg").getBoundingClientRect(); return { ok: r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight, w: r.width, h: r.height }; })()');
ok('F mobile : panneau dans l\'écran', d.ok, JSON.stringify(d));
await shot('f3-mobile-preferences');

await p.close();
// Bilan : ce que la propriété GA4 ajoute d'elle-même (mesure améliorée).
const auto = parse(archive).filter(e => !mine(e));
const autoNames = [...new Set(auto.map(e => e.en).filter(Boolean))];
const clicks = [...new Set(auto.filter(e => e.en === 'click').map(e => e['ep.link_url']))];
if (clicks.length) results.push('', `INFO clics sortants automatiques (link_url) : ${clicks.join(' , ').slice(0, 300)}`);
results.push('', `INFO événements automatiques de GA4 (mesure améliorée) vus pendant le test : ${autoNames.join(', ') || 'aucun'}`);
if (auto.some(e => e.en === 'form_start')) results.push('WARN form_start automatique détecté : il double le nôtre. Désactiver « Interactions avec les formulaires » dans GA4 (docs/analytics-ga4.md).');
const ownerLeak = auto.filter(e => OWNER.test(decodeURIComponent(JSON.stringify(e))));
if (ownerLeak.length) results.push(`WARN ${[...new Set(ownerLeak.map(e => e.en))].join(', ')} automatique : transmet l'adresse ou le numéro du site (lien cliqué). Désactiver « Clics sortants » dans GA4.`);
const everything = decodeURIComponent(archive.map(h => h.url + '\n' + h.body).join('\n').replace(/\+/g, ' '));
ok('Bilan : aucun objet, corps, destinataire ou lien de messagerie dans aucun appel', !/zzrecherchezz|mail\.google|outlook\.live|mailto:|sms:|tel:|[?&](su|subject|body)=/i.test(everything) && !OWNER.test(everything),
  (everything.match(/.{0,50}(zzrecherchezz|mail\.google|outlook\.live|mailto:|arphandrame0).{0,40}/i) || [''])[0]);
const titles = [...new Set(parse(archive).map(e => e.dt).filter(Boolean))];
ok('Bilan : titres de page sans donnée personnelle', titles.every(t => !/@|\d{6,}|zzrecherchezz|Testeur|SECRET/i.test(t)), titles.join(' | '));
const allLeaks = PII.filter(x => decodeURIComponent(archive.map(h => h.url + '\n' + h.body).join('\n').replace(/\+/g, ' ')).includes(x));
ok('Bilan : aucune donnée saisie par le visiteur dans aucun appel (automatiques compris)', allLeaks.length === 0, allLeaks.join(','));
console.log(results.join('\n'));
console.log(failed ? `\n${failed} ÉCHEC(S)` : '\nTout est OK');
process.exit(failed ? 1 : 0);
