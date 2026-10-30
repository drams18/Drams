/* ══════════════════════════════════════════════════════
   ANALYTICS.JS : Google Analytics 4 (gtag.js), chargé après accord
   Source UNIQUE de la configuration GA4 pour tout le site.

   Rien de Google n'est chargé ni appelé tant que le visiteur n'a pas
   accepté la mesure d'audience (js/consent.js). C'est le mode « de base »
   de Google Consent Mode : pas de bibliothèque, pas de ping anonyme, pas
   de signal envoyé avant l'accord.

     accord   → gtag.js chargé une seule fois, une page vue par page
     refus    → rien n'est chargé
     retrait  → collecte coupée tout de suite (ga-disable), consentement
                repassé à « denied », cookies _ga supprimés

   L'identifiant de mesure n'est pas un secret (il est visible dans toute
   page qui utilise GA4). Aucune clé d'API ne doit être placée ici.

   Ce qui part chez Google est filtré ici, et nulle part ailleurs :
     • adresse de la page : chemin seul + paramètres utm_* de la liste,
       si leur valeur est un simple mot-clé (cleanUrl) ;
     • page d'origine : sans paramètres ni fragment ; pour un autre site,
       son domaine seul (cleanReferrer) ;
     • événements : noms, paramètres et valeurs d'une liste fermée
       (safeEvent). Un texte libre ne peut pas sortir par event() ;
     • une page dont l'adresse contient ce qui ressemble à une adresse
       e-mail ou à un numéro n'est pas mesurée du tout (looksPersonal).

   Le retrait arrête la collecte à venir et efface les cookies du site.
   Il n'efface pas ce que Google a déjà reçu : cela se demande dans GA4
   (Admin → Demandes de suppression de données).

   API (window.Analytics) :
     event(nom, params)  envoie un événement, seulement si la mesure est
                         active et l'accord toujours valide au moment de
                         l'envoi ; renvoie true si l'événement est parti
     isActive()          true si la mesure est active sur cette page
   Les événements du site sont câblés dans js/analytics-events.js.
   ══════════════════════════════════════════════════════ */
(function (global) {
  'use strict';

  // ── Configuration ─────────────────────────────────────────
  // Identifiant de mesure GA4 (Admin → Flux de données → Flux Web).
  // Laisser 'G-XXXXXXXXXX' désactive toute la mesure.
  var MEASUREMENT_ID = 'G-XYZG9XXTCH';
  // La mesure ne tourne que sur le site en ligne : ni en local, ni sur les
  // aperçus *.pages.dev. Pour tester ailleurs (DebugView de GA4) :
  //   localStorage.setItem('drame.analytics.debug', '1')
  var HOSTS = ['arphandrame.fr', 'www.arphandrame.fr'];
  var DEBUG_KEY = 'drame.analytics.debug';
  // Durée de vie des cookies _ga : 13 mois, non prolongée à chaque visite.
  var COOKIE_MAX_AGE = 395 * 24 * 60 * 60;
  // Paramètres de campagne gardés dans l'adresse. utm_term (mots saisis dans
  // un moteur de recherche) n'en fait pas partie.
  var UTM = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_id'];
  // Valeur acceptée : un mot-clé court (newsletter, linkedin, cv-2026…).
  var UTM_VALUE = /^[A-Za-z0-9][A-Za-z0-9._-]{0,49}$/;
  // Événements que le site a le droit d'envoyer, et leurs seules valeurs.
  var VALUES = {
    form_type: ['contact', 'devis'],
    site_mode: ['classique', 'aventure'],
    method: ['email', 'phone', 'sms', 'linkedin', 'whatsapp', 'instagram'],
    link_type: ['app', 'webmail', 'copy', 'profile'],
  };
  var EVENTS = {
    form_start: ['form_type', 'site_mode'],
    generate_lead: ['form_type', 'site_mode'],
    contact_click: ['method', 'link_type', 'site_mode'],
  };

  // ── Filtres (fonctions pures, testées par tests/analytics.test.mjs) ──
  function decode(s) {
    try { return decodeURIComponent(String(s).replace(/\+/g, ' ')); } catch (e) { return String(s); }
  }
  // Adresse e-mail (un @ suffit) ou numéro de téléphone français.
  function looksPersonal(text) {
    var t = decode(decode(text || ''));
    return /@|%40/i.test(t) || /(?:^|\D)(?:(?:\+|00)?33[\s.\-]?|0)[1-9](?:[\s.\-]?\d{2}){4}(?!\d)/.test(t);
  }
  function safePath(pathname) {
    var p = String(pathname || '/');
    return /^\/[A-Za-z0-9/_.-]*$/.test(p) && !looksPersonal(p) ? p : '/';
  }
  function cleanQuery(search) {
    var keep = [];
    var q;
    try { q = new URLSearchParams(search || ''); } catch (e) { return ''; }
    UTM.forEach(function (k) {
      var v = q.get(k);
      if (v && UTM_VALUE.test(v) && !looksPersonal(v)) keep.push(k + '=' + v);
    });
    return keep.length ? '?' + keep.join('&') : '';
  }
  function cleanUrl(origin, pathname, search) {
    return origin + safePath(pathname) + cleanQuery(search);
  }
  // Page d'origine : même site → chemin seul ; autre site → domaine seul.
  function cleanReferrer(referrer, origin) {
    if (!referrer) return '';
    var u;
    try { u = new URL(referrer); } catch (e) { return ''; }
    if (!/^https?:$/.test(u.protocol)) return '';
    return u.origin === origin ? u.origin + safePath(u.pathname) : u.origin + '/';
  }
  function safeEvent(name, params) {
    var keys = EVENTS[name];
    if (!keys) return null;
    var out = {};
    for (var i = 0; i < keys.length; i++) {
      var v = params && params[keys[i]];
      // Un paramètre attendu absent ou hors liste : l'événement ne part pas.
      if (typeof v !== 'string' || VALUES[keys[i]].indexOf(v) === -1) return null;
      out[keys[i]] = v;
    }
    return out;
  }
  // Serveurs de collecte de Google (appels …/collect de gtag.js).
  function isCollect(url, base) {
    var u;
    try { u = new URL(String(url), base || 'https://x.invalid/'); } catch (e) { return false; }
    return /(^|\.)(google-analytics\.com|analytics\.google\.com|doubleclick\.net)$/.test(u.hostname) ||
      (/(^|\.)google\.[a-z.]{2,6}$/.test(u.hostname) && /\/collect/.test(u.pathname));
  }
  // Domaines où gtag.js a pu poser ses cookies : le plus large d'abord
  // (.exemple.fr), puis chaque sous-domaine, puis l'hôte seul.
  function cookieDomains(hostname) {
    var parts = String(hostname || '').split('.');
    var domains = [''];
    for (var i = parts.length - 2; i >= 0; i--) domains.push('.' + parts.slice(i).join('.'));
    if (hostname) domains.push(hostname);
    return domains;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      cleanUrl: cleanUrl, cleanQuery: cleanQuery, cleanReferrer: cleanReferrer, safePath: safePath,
      looksPersonal: looksPersonal, safeEvent: safeEvent, cookieDomains: cookieDomains, isCollect: isCollect,
      MEASUREMENT_ID: MEASUREMENT_ID, COOKIE_MAX_AGE: COOKIE_MAX_AGE, UTM: UTM,
    };
    return;
  }

  var doc = global.document;
  var loc = global.location;
  function safe(fn) { try { return fn(); } catch (e) { return null; } }

  var debug = safe(function () { return global.localStorage.getItem(DEBUG_KEY); }) === '1';
  var configured = /^G-[A-Z0-9]{6,}$/.test(MEASUREMENT_ID) && MEASUREMENT_ID !== 'G-XXXXXXXXXX';
  var allowedHost = debug || HOSTS.indexOf(loc.hostname) !== -1;
  var DISABLE_FLAG = 'ga-disable-' + MEASUREMENT_ID;

  var started = false;   // gtag.js demandé (une seule fois par page)
  var active = false;    // la collecte est ouverte
  var blocking = false;  // retrait en cours de page : plus rien ne sort

  // gtag.js garde quelques secondes les événements déjà notés et les envoie
  // par lot, au plus tard quand on quitte la page. « ga-disable » empêche les
  // nouveaux événements, pas l'envoi de ce lot. Après un retrait, les appels
  // de collecte encore en attente sont donc arrêtés ici, à la sortie.
  // Posé avant le chargement de gtag.js, inactif tant que l'accord tient.
  function guardNetwork() {
    var nav = global.navigator;
    var beacon = nav && nav.sendBeacon;
    if (beacon) {
      nav.sendBeacon = function (url) {
        if (blocking && isCollect(url, loc.href)) return true;
        return beacon.apply(nav, arguments);
      };
    }
    var nativeFetch = global.fetch;
    if (nativeFetch) {
      global.fetch = function (input) {
        var url = input && typeof input === 'object' && 'url' in input ? input.url : input;
        if (blocking && isCollect(url, loc.href)) return Promise.resolve(new global.Response(null, { status: 204 }));
        return nativeFetch.apply(global, arguments);
      };
    }
  }

  function gtag() { global.dataLayer.push(arguments); }

  // Adresse envoyée à GA4 : chemin seul, plus les paramètres de campagne
  // validés. Ni fragment (#…) ni autre paramètre : rien de saisi par le visiteur.
  function pageLocation() {
    var forced = doc.documentElement.getAttribute('data-analytics-path');
    return cleanUrl(loc.origin, forced || loc.pathname, loc.search);
  }
  // gtag.js lit aussi l'adresse réelle pour ses événements automatiques
  // (mesure améliorée) : une page dont l'adresse porte une donnée
  // personnelle n'est donc pas mesurée.
  function pageIsPrivate() {
    return looksPersonal(loc.pathname + loc.search + loc.hash);
  }

  function start() {
    started = true;
    guardNetwork();
    global.dataLayer = global.dataLayer || [];
    global.gtag = gtag;
    // Publicité : toujours refusée. Seule la mesure d'audience est accordée.
    gtag('consent', 'default', {
      ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'denied',
    });
    gtag('consent', 'update', { analytics_storage: 'granted' });
    gtag('js', new Date());
    var config = {
      page_location: pageLocation(),      // déclenche la seule page_view de la page
      page_referrer: cleanReferrer(doc.referrer, loc.origin),
      cookie_expires: COOKIE_MAX_AGE,
      cookie_update: false,
      cookie_flags: 'SameSite=Lax' + (loc.protocol === 'https:' ? ';Secure' : ''),
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
    };
    if (debug) config.debug_mode = true;
    gtag('config', MEASUREMENT_ID, config);

    var s = doc.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(MEASUREMENT_ID);
    doc.head.appendChild(s);
  }

  // Supprime les cookies de mesure (_ga, _ga_<flux>) déjà déposés.
  function clearCookies() {
    var names = safe(function () {
      return doc.cookie.split(';').map(function (c) { return c.split('=')[0].trim(); });
    }) || [];
    var domains = cookieDomains(loc.hostname);
    names.forEach(function (name) {
      if (!/^_ga(_|$)/.test(name)) return;
      // gtag.js pose ses cookies sur « / ». Un cookie n'est effacé que si
      // domaine et chemin sont ceux de sa création : on essaie chaque domaine.
      domains.forEach(function (d) {
        try {
          doc.cookie = name + '=; Max-Age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/' + (d ? '; domain=' + d : '');
        } catch (e) { /* noop */ }
      });
    });
  }

  function enable() {
    global[DISABLE_FLAG] = false;
    blocking = false;
    if (!started) start();
    else if (!active) gtag('consent', 'update', { analytics_storage: 'granted' });
    active = true;
  }

  function disable() {
    // Coupe tout envoi, même si gtag.js est déjà en mémoire sur cette page.
    global[DISABLE_FLAG] = true;
    blocking = true;
    if (started && active) gtag('consent', 'update', { analytics_storage: 'denied' });
    active = false;
    clearCookies();
  }

  function sync() {
    if (!configured || !allowedHost) return;
    // Page préchargée (speculationrules du mode classique) : pas encore vue.
    if (doc.prerendering) return;
    if (consented() && !pageIsPrivate()) enable();
    else disable();
  }

  function consented() {
    return !!(global.Consent && global.Consent.allows('analytics'));
  }

  function event(name, params) {
    if (!active) return false;
    // L'accord est relu au moment de l'envoi : il a pu expirer ou être
    // retiré (autre onglet, stockage vidé) depuis le chargement de la page.
    if (!consented() || pageIsPrivate()) { disable(); return false; }
    var clean = safeEvent(name, params);
    if (!clean) return false;
    gtag('event', name, clean);
    return true;
  }

  doc.addEventListener('consent:change', sync);
  doc.addEventListener('prerenderingchange', sync);
  // Retour par le cache arrière : la page n'est pas rechargée, mais elle est
  // revue. On relit le choix (il a pu changer entre-temps) puis on la compte.
  global.addEventListener('pageshow', function (e) {
    if (!e.persisted) return;
    var already = started;            // sinon start() envoie lui-même la page vue
    sync();
    if (already && active) gtag('event', 'page_view', { page_location: pageLocation(), page_title: doc.title });
  });

  global.Analytics = {
    event: event,
    isActive: function () { return active; },
    MEASUREMENT_ID: MEASUREMENT_ID,
  };

  sync();
})(typeof window !== 'undefined' ? window : globalThis);
