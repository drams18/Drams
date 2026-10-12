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

   API (window.Analytics) :
     event(nom, params)  envoie un événement, seulement si la mesure est
                         active ; renvoie true si l'événement est parti
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
  var UTM = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'utm_id'];

  var doc = global.document;
  var loc = global.location;
  function safe(fn) { try { return fn(); } catch (e) { return null; } }

  var debug = safe(function () { return global.localStorage.getItem(DEBUG_KEY); }) === '1';
  var configured = /^G-[A-Z0-9]{6,}$/.test(MEASUREMENT_ID) && MEASUREMENT_ID !== 'G-XXXXXXXXXX';
  var allowedHost = debug || HOSTS.indexOf(loc.hostname) !== -1;
  var DISABLE_FLAG = 'ga-disable-' + MEASUREMENT_ID;

  var started = false;   // gtag.js demandé (une seule fois par page)
  var active = false;    // la collecte est ouverte

  function gtag() { global.dataLayer.push(arguments); }

  // Adresse envoyée à GA4 : chemin seul, plus les paramètres de campagne.
  // Ni fragment (#…) ni autre paramètre : rien de saisi par le visiteur.
  function pageLocation() {
    var forced = doc.documentElement.getAttribute('data-analytics-path');
    var url = loc.origin + (forced || loc.pathname);
    var keep = [];
    var q = safe(function () { return new URLSearchParams(loc.search); });
    if (q) UTM.forEach(function (k) { if (q.has(k)) keep.push(k + '=' + encodeURIComponent(q.get(k))); });
    return url + (keep.length ? '?' + keep.join('&') : '');
  }

  function start() {
    started = true;
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
    var parts = loc.hostname.split('.');
    var domains = [''];
    for (var i = 0; i < parts.length - 1; i++) domains.push('.' + parts.slice(i).join('.'));
    domains.push(loc.hostname);
    names.forEach(function (name) {
      if (!/^_ga(_|$)/.test(name)) return;
      domains.forEach(function (d) {
        try { doc.cookie = name + '=; Max-Age=0; path=/' + (d ? '; domain=' + d : ''); } catch (e) { /* noop */ }
      });
    });
  }

  function enable() {
    global[DISABLE_FLAG] = false;
    if (!started) start();
    else if (!active) gtag('consent', 'update', { analytics_storage: 'granted' });
    active = true;
  }

  function disable() {
    // Coupe tout envoi, même si gtag.js est déjà en mémoire sur cette page.
    global[DISABLE_FLAG] = true;
    if (started && active) gtag('consent', 'update', { analytics_storage: 'denied' });
    active = false;
    clearCookies();
  }

  function sync() {
    if (!configured || !allowedHost) return;
    // Page préchargée (speculationrules du mode classique) : pas encore vue.
    if (doc.prerendering) return;
    if (global.Consent && global.Consent.allows('analytics')) enable();
    else disable();
  }

  function event(name, params) {
    if (!active) return false;
    gtag('event', name, params || {});
    return true;
  }

  doc.addEventListener('consent:change', sync);
  doc.addEventListener('prerenderingchange', sync);
  // Retour par le cache arrière : la page n'est pas rechargée, mais elle est
  // revue. On relit le choix (il a pu changer entre-temps) puis on la compte.
  global.addEventListener('pageshow', function (e) {
    if (!e.persisted) return;
    sync();
    event('page_view', { page_location: pageLocation(), page_title: doc.title });
  });

  global.Analytics = {
    event: event,
    isActive: function () { return active; },
    MEASUREMENT_ID: MEASUREMENT_ID,
  };

  sync();
})(window);
