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
reset(); await fresh('/tarifs?utm_source=test&foo=bar&email=jean.testeur@example.com#recherche', 1200);
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
const allLeaks = PII.filter(x => decodeURIComponent(archive.map(h => h.url + '\n' + h.body).join('\n').replace(/\+/g, ' ')).includes(x));
ok('Bilan : aucune donnée saisie par le visiteur dans aucun appel (automatiques compris)', allLeaks.length === 0, allLeaks.join(','));
console.log(results.join('\n'));
console.log(failed ? `\n${failed} ÉCHEC(S)` : '\nTout est OK');
process.exit(failed ? 1 : 0);
