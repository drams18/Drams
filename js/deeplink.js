/* ══════════════════════════════════════════════════════
   DEEPLINK.JS — Grammaire de liens COMMUNE aux deux modes
   Le même fragment désigne le même contenu en mode classique
   (classique.html → /classique) et en mode aventure
   (aventure.html → /aventure) :

     #profil                 profil & compétences
     #parcours[/<slug>]      une étape du parcours (bac, bts, etna…)
     #projets[/<slug>]       un projet (skywalk…)
     #contact                coordonnées + formulaire
     #portail                « Construisez votre projet » (+ tarifs)
     #ville                  la ville, sans section particulière

   Passer d'un mode à l'autre = garder le fragment, changer de page.
   Le mode courant n'est PAS un état global : c'est la page elle-même.
   localStorage ne retient que la préférence (présélection sur l'écran
   de sélection, liens « retour ») — jamais de redirection automatique.
   ══════════════════════════════════════════════════════ */
(function (global) {
  'use strict';

  var MODE_KEY = 'drame.portfolio.mode';

  // Pages des modes. Cloudflare Pages les sert aussi sans « .html »
  // (/classique, /aventure) ; les liens gardent l'extension pour que le
  // site fonctionne tel quel en local.
  var PAGES = { classique: 'classique.html', aventure: 'aventure.html', selection: 'index.html' };

  // route (URL) ⇄ id de section (SECTIONS / BUILDINGS_DATA)
  var SECTION_OF = { profil: 'profile', parcours: 'parcours', projets: 'projets', contact: 'contact' };
  var ROUTE_OF   = { profile: 'profil', parcours: 'parcours', projets: 'projets', contact: 'contact' };

  function parse(hash) {
    var h = String(hash || '').replace(/^#/, '');
    try { h = decodeURIComponent(h); } catch (e) { /* fragment brut */ }
    if (!h) return null;
    var parts = h.split('/');
    var head = parts[0];
    var slug = parts[1] || null;
    if (head === 'ville')   return { kind: 'ville' };
    if (head === 'portail') return { kind: 'portail' };
    if (SECTION_OF[head])   return { kind: 'section', section: SECTION_OF[head], slug: slug };
    return null;
  }

  function build(section, slug) {
    var r = ROUTE_OF[section];
    if (!r) return '';
    return '#' + r + (slug ? '/' + slug : '');
  }

  function setMode(mode) {
    try { global.localStorage.setItem(MODE_KEY, mode); } catch (e) { /* noop */ }
  }

  function getMode() {
    try { return global.localStorage.getItem(MODE_KEY); } catch (e) { return null; }
  }

  // Page vers laquelle revenir depuis tarifs / construire-projet : celle du
  // dernier mode utilisé (sinon l'écran de sélection). Depuis le portail,
  // on revient DEVANT le portail (aventure) ou sur « Vous avez un projet ? ».
  function homeHref(fromPortal) {
    var mode = getMode();
    var page = PAGES[mode] || PAGES.selection;
    return page + (fromPortal && PAGES[mode] ? '#portail' : '');
  }

  // Réécrit les liens « retour au portfolio » (href="index.html") d'une page annexe.
  function rewriteHomeLinks(root, fromPortal) {
    var href = homeHref(fromPortal);
    (root || global.document).querySelectorAll('a[href="index.html"]').forEach(function (a) {
      a.setAttribute('href', href);
    });
  }

  global.Deeplink = {
    PAGES: PAGES,
    parse: parse,
    build: build,
    setMode: setMode,
    getMode: getMode,
    homeHref: homeHref,
    rewriteHomeLinks: rewriteHomeLinks,
  };
})(window);
