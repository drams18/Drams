/* ══════════════════════════════════════════════════════
   CONSENT.JS : Consentement aux cookies (partagé par toutes les pages)
   Source UNIQUE du choix du visiteur. Ce fichier ne charge AUCUN
   traceur : il mémorise le choix, affiche le bandeau et le panneau de
   préférences, puis prévient les autres scripts (js/analytics.js).

   Règles :
     • sans choix, tout ce qui demande un accord reste coupé ;
     • fermer le panneau, naviguer ou attendre ne vaut pas accord ;
     • « Tout refuser » et « Tout accepter » ont le même poids visuel ;
     • le choix (accord comme refus) est redemandé après MAX_AGE_DAYS,
       ou quand VERSION change (nouvelle finalité, nouvel outil).

   Stockage : localStorage « drame.consent » = { v, analytics, t }.
   Si le stockage est bloqué, le choix ne vaut que pour la page en cours
   (le bandeau revient à la page suivante, rien n'est activé d'office).

   Dans le HTML :
     [data-consent-open]  rouvre les préférences (pied de page, menu).
                          Sans un tel lien, un bouton discret est ajouté
                          en bas à gauche une fois le choix fait.

   API (window.Consent) :
     allows('analytics')  true seulement après un accord encore valide
     get()                { v, analytics, t } ou null (pas de choix)
     set(bool)            enregistre le choix
     open()               ouvre le panneau de préférences
   Événement : « consent:change » sur document, detail { analytics }.
   ══════════════════════════════════════════════════════ */
(function (global) {
  'use strict';

  var KEY = 'drame.consent';
  var VERSION = 1;
  var MAX_AGE_DAYS = 182;            // 6 mois, accord comme refus
  var DAY = 24 * 60 * 60 * 1000;

  // storage : injectable (tests), localStorage par défaut.
  function create(opts) {
    opts = opts || {};
    var storage = opts.storage || null;
    var now = opts.now || function () { return Date.now(); };
    var memory = null;               // repli quand le stockage est bloqué
    var blocked = !storage;

    function valid(rec) {
      if (!rec || typeof rec !== 'object') return null;
      if (rec.v !== VERSION || typeof rec.analytics !== 'boolean' || typeof rec.t !== 'number') return null;
      var age = now() - rec.t;
      // Date dans le futur (horloge modifiée) : on redemande.
      if (age < -DAY || age >= MAX_AGE_DAYS * DAY) return null;
      return { v: rec.v, analytics: rec.analytics, t: rec.t };
    }

    function get() {
      if (storage) {
        try {
          var raw = storage.getItem(KEY);
          blocked = false;
          if (!raw) return null;
          try { return valid(JSON.parse(raw)); } catch (e) { return null; }
        } catch (e) { blocked = true; }
      }
      return valid(memory);
    }

    function set(analytics) {
      var rec = { v: VERSION, analytics: analytics === true, t: now() };
      memory = rec;
      if (storage) {
        try { storage.setItem(KEY, JSON.stringify(rec)); blocked = false; } catch (e) { blocked = true; }
      }
      return rec;
    }

    return {
      get: get,
      set: set,
      decided: function () { return get() !== null; },
      // Seul un accord explicite, encore valide, vaut « oui ».
      allows: function (category) {
        var rec = get();
        return !!rec && category === 'analytics' && rec.analytics === true;
      },
      persisted: function () { return !blocked; },
    };
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { create: create, KEY: KEY, VERSION: VERSION, MAX_AGE_DAYS: MAX_AGE_DAYS };
    return;
  }

  var doc = global.document;
  function safe(fn) { try { return fn(); } catch (e) { return null; } }
  var C = create({ storage: safe(function () { return global.localStorage; }) });

  // ?capture : miniatures et captures du site (scripts/capture.mjs), sans bandeau.
  var still = /[?&]capture\b/.test(global.location.search);

  // ── Styles (injectés une seule fois) ─────────────────────
  // Jetons du site classique (css/site.css) quand ils existent ; sinon les
  // mêmes valeurs sombres, pour le mode aventure qui ne charge pas site.css.
  var STYLE_ID = 'consent-style';
  function injectStyles() {
    if (doc.getElementById(STYLE_ID)) return;
    var css = [
      '.ck,.ck-dlg,.ck-fab{--ck-bg:var(--surface,#0e1724);--ck-bg-2:var(--surface-2,#142238);',
      '--ck-line:var(--line-2,#2a3d58);--ck-text:var(--text,#f4f8fb);--ck-text-2:var(--text-2,#c8cfdc);',
      '--ck-muted:var(--muted,#8f9db0);--ck-accent:var(--accent,#ff9a3c);',
      "font-family:var(--font,'Inter Variable',Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif);",
      'font-size:14.5px;line-height:1.55;color:var(--ck-text-2);text-align:left;letter-spacing:normal;}',
      '.ck *,.ck-dlg *{box-sizing:border-box;}',
      '.ck [hidden],.ck-dlg [hidden]{display:none!important;}',
      '.ck p,.ck-dlg p,.ck-dlg h2,.ck-dlg h3{margin:0;}',

      /* Bandeau : en bas, non bloquant */
      '.ck{position:fixed;left:0;right:0;bottom:0;z-index:2147483000;display:flex;justify-content:center;',
      'padding:12px 12px calc(12px + env(safe-area-inset-bottom,0px));pointer-events:none;}',
      '.ck__card{pointer-events:auto;width:100%;max-width:760px;padding:18px 20px;display:grid;gap:14px;',
      'background:var(--ck-bg);border:1px solid var(--ck-line);border-radius:18px;',
      'box-shadow:0 1px 2px rgba(0,0,0,.3),0 20px 50px -18px rgba(0,0,0,.6);animation:ck-in .35s cubic-bezier(.2,.7,.3,1);}',
      '@keyframes ck-in{from{transform:translateY(14px);opacity:0}to{transform:none;opacity:1}}',
      '.ck__t{font-size:15px;font-weight:600;color:var(--ck-text);}',
      '.ck__actions{display:flex;flex-wrap:wrap;gap:8px;}',

      /* Boutons : refuser et accepter strictement identiques */
      '.ck-btn{display:inline-flex;align-items:center;justify-content:center;min-height:42px;padding:9px 18px;',
      'font:600 14.5px/1.3 inherit;font-family:inherit;color:var(--ck-text);cursor:pointer;text-align:center;',
      'background:var(--ck-bg-2);border:1px solid var(--ck-line);border-radius:999px;',
      'transition:border-color .2s,background .2s,transform .2s;}',
      '.ck-btn:hover{border-color:var(--ck-muted);transform:translateY(-1px);}',
      '.ck-btn:active{transform:none;}',
      '.ck-btn--ghost{background:transparent;}',
      '.ck-btn:focus-visible,.ck-fab:focus-visible,.ck-dlg__close:focus-visible{outline:2px solid var(--ck-accent);outline-offset:3px;}',
      '.ck__actions .ck-btn{flex:1 1 150px;}',
      '.ck-dlg .ck__actions .ck-btn--ghost{flex-basis:100%;}',

      /* Panneau de préférences */
      '.ck-dlg{padding:0;width:min(580px,calc(100vw - 24px));max-height:calc(100vh - 24px);max-height:calc(100dvh - 24px);',
      'background:var(--ck-bg);border:1px solid var(--ck-line);border-radius:20px;overflow:hidden auto;',
      'box-shadow:0 30px 80px -20px rgba(0,0,0,.6);}',
      '.ck-dlg::backdrop{background:rgba(0,0,0,.55);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);}',
      '.ck-dlg__in{display:grid;gap:16px;padding:22px;}',
      '.ck-dlg__head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;}',
      '.ck-dlg__title{font-size:18px;line-height:1.3;font-weight:600;color:var(--ck-text);}',
      '.ck-dlg__title:focus{outline:none;}',
      '.ck-dlg__close{flex-shrink:0;font:600 12.5px/1 inherit;font-family:inherit;color:var(--ck-text-2);cursor:pointer;',
      'padding:9px 12px;background:transparent;border:1px solid var(--ck-line);border-radius:10px;}',
      '.ck-dlg__close:hover{color:var(--ck-text);border-color:var(--ck-muted);}',
      '.ck-cat{display:grid;gap:6px;padding:14px 16px;background:var(--ck-bg-2);border:1px solid var(--ck-line);border-radius:14px;}',
      '.ck-cat__top{display:flex;align-items:center;justify-content:space-between;gap:14px;}',
      '.ck-cat__name{font-size:15px;font-weight:600;color:var(--ck-text);}',
      '.ck-cat__state{font-size:12.5px;font-weight:600;color:var(--ck-muted);white-space:nowrap;}',
      '.ck-cat__sw{display:inline-flex;align-items:center;gap:9px;cursor:pointer;font-size:13px;font-weight:600;color:var(--ck-text);white-space:nowrap;}',
      '.ck-cat__sw input{width:20px;height:20px;margin:0;cursor:pointer;accent-color:var(--ck-accent);}',
      '.ck-cat__d{font-size:13.5px;color:var(--ck-muted);}',
      '.ck-dlg__note{font-size:13px;color:var(--ck-muted);}',

      /* Accès permanent quand la page n'a pas de lien « Cookies » */
      /* --ck-lift : hauteur d'une barre fixe en bas de page (css/classic.css, construire.css) */
      '.ck-fab{position:fixed;left:12px;bottom:calc(12px + var(--ck-lift,0px) + env(safe-area-inset-bottom,0px));z-index:2147482000;',
      'display:grid;place-items:center;width:36px;height:36px;padding:0;cursor:pointer;color:var(--ck-muted);',
      'background:var(--ck-bg);border:1px solid var(--ck-line);border-radius:50%;opacity:.7;transition:opacity .2s,color .2s;}',
      '.ck-fab:hover,.ck-fab:focus-visible{opacity:1;color:var(--ck-text);}',
      '.ck-fab svg{width:18px;height:18px;display:block;}',

      '@media (max-width:520px){.ck{padding:8px 8px calc(8px + env(safe-area-inset-bottom,0px));}',
      '.ck__card{padding:16px;gap:12px;border-radius:16px;}.ck,.ck-dlg{font-size:14px;}',
      '.ck__actions .ck-btn{flex-basis:120px;}.ck__actions .ck-btn--ghost{flex-basis:100%;}',
      '.ck-dlg__in{padding:18px 16px;}}',
      '@media (prefers-reduced-motion:reduce){.ck__card{animation:none;}.ck-btn{transition:none;}}'
    ].join('');
    var s = doc.createElement('style');
    s.id = STYLE_ID;
    s.textContent = css;
    doc.head.appendChild(s);
  }

  // ── Petits helpers DOM ──────────────────────────────────
  function el(tag, cls, text) {
    var n = doc.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function button(cls, text, onClick) {
    var b = el('button', cls, text);
    b.type = 'button';
    b.addEventListener('click', onClick);
    return b;
  }
  // Les pages écoutent le clavier sur document / window (flèches du mode
  // classique, touches du jeu, Échap = pause) : rien ne sort de l'interface
  // de consentement.
  function isolate(node) {
    ['keydown', 'keyup', 'pointerdown'].forEach(function (type) {
      node.addEventListener(type, function (e) { e.stopPropagation(); });
    });
  }

  // ── État de l'interface ──────────────────────────────────
  var banner = null, dialog = null, checkbox = null, fab = null;

  function notify() {
    doc.dispatchEvent(new CustomEvent('consent:change', { detail: { analytics: C.allows('analytics') } }));
  }

  function choose(analytics) {
    C.set(analytics);
    if (dialog && dialog.open) dialog.close();
    render();
    notify();
  }

  // ── Bandeau ──────────────────────────────────────────────
  function buildBanner() {
    var root = el('div', 'ck');
    root.setAttribute('role', 'region');
    root.setAttribute('aria-label', 'Cookies et mesure d\'audience');
    var card = el('div', 'ck__card');
    var text = el('div');
    text.appendChild(el('p', 'ck__t', 'Mesure d\'audience'));
    text.appendChild(el('p', null,
      'Avec votre accord, ce site utilise Google Analytics pour compter les visites et savoir quelles pages sont utiles. ' +
      'Aucun cookie de mesure n\'est déposé sans votre accord, et vous pouvez changer d\'avis à tout moment.'));
    var actions = el('div', 'ck__actions');
    actions.appendChild(button('ck-btn', 'Tout refuser', function () { choose(false); }));
    actions.appendChild(button('ck-btn', 'Tout accepter', function () { choose(true); }));
    actions.appendChild(button('ck-btn ck-btn--ghost', 'Personnaliser', function () { open(); }));
    card.appendChild(text);
    card.appendChild(actions);
    root.appendChild(card);
    isolate(root);
    return root;
  }

  // ── Panneau de préférences ───────────────────────────────
  function category(name, description, control) {
    var box = el('div', 'ck-cat');
    var top = el('div', 'ck-cat__top');
    top.appendChild(el('h3', 'ck-cat__name', name));
    top.appendChild(control);
    box.appendChild(top);
    box.appendChild(el('p', 'ck-cat__d', description));
    return box;
  }

  function buildDialog() {
    var dlg = el('dialog', 'ck-dlg');
    dlg.setAttribute('aria-labelledby', 'ck-dlg-title');
    var inner = el('div', 'ck-dlg__in');

    var head = el('div', 'ck-dlg__head');
    var title = el('h2', 'ck-dlg__title', 'Vos préférences de cookies');
    title.id = 'ck-dlg-title';
    title.setAttribute('tabindex', '-1');
    head.appendChild(title);
    // Fermer ne change rien : sans choix enregistré, le bandeau reste.
    var close = button('ck-dlg__close', 'Fermer', function () { dlg.close(); });
    close.setAttribute('aria-label', 'Fermer sans modifier mon choix');
    head.appendChild(close);

    var sw = el('label', 'ck-cat__sw');
    checkbox = el('input');
    checkbox.type = 'checkbox';
    checkbox.id = 'ck-analytics';
    var swText = el('span');
    function sync() { swText.textContent = checkbox.checked ? 'Activée' : 'Désactivée'; }
    checkbox.addEventListener('change', sync);
    dlg._sync = sync;
    sw.appendChild(swText);
    sw.appendChild(checkbox);

    var actions = el('div', 'ck__actions');
    actions.appendChild(button('ck-btn', 'Tout refuser', function () { choose(false); }));
    actions.appendChild(button('ck-btn', 'Tout accepter', function () { choose(true); }));
    actions.appendChild(button('ck-btn ck-btn--ghost', 'Enregistrer mes choix', function () { choose(checkbox.checked); }));

    inner.appendChild(head);
    inner.appendChild(el('p', null,
      'Vous décidez de ce que ce site peut enregistrer sur votre appareil. Refuser ne change rien à votre navigation.'));
    inner.appendChild(category('Nécessaires',
      'Réglages enregistrés sur votre appareil : thème, dernier mode utilisé, progression du mode aventure, ' +
      'demande de projet en cours et votre choix sur les cookies. Ils ne servent à aucun suivi.',
      el('span', 'ck-cat__state', 'Toujours actifs')));
    inner.appendChild(category('Mesure d\'audience',
      'Google Analytics (Google Ireland Ltd) compte les visites, les pages vues et les demandes envoyées, jamais leur contenu. ' +
      'Cookies _ga et _ga_*, conservés 13 mois au plus. Les données peuvent être traitées hors de l\'Union européenne. ' +
      'Aucun usage publicitaire.',
      sw));
    inner.appendChild(actions);
    inner.appendChild(el('p', 'ck-dlg__note',
      'Votre choix est conservé 6 mois sur cet appareil, puis redemandé. ' +
      'Pour le modifier ou le retirer, rouvrez ce panneau depuis « Cookies », en bas de page ou dans le menu.'));
    dlg.appendChild(inner);

    isolate(dlg);
    // Échap : fermeture gérée ici (le jeu l'utilise pour son menu de pause).
    dlg.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { e.preventDefault(); dlg.close(); }
    });
    // Clic sur le voile (hors de la carte) : on referme, sans rien changer.
    dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
    return dlg;
  }

  function open() {
    if (!doc.body) return;
    injectStyles();
    if (!dialog) { dialog = buildDialog(); doc.body.appendChild(dialog); }
    if (dialog.open) return;
    // Jamais précochée : la case ne reflète qu'un accord déjà donné.
    checkbox.checked = C.allows('analytics');
    dialog._sync();
    if (dialog.showModal) dialog.showModal(); else dialog.setAttribute('open', '');
    var title = dialog.querySelector('.ck-dlg__title');
    if (title) title.focus();
  }

  // ── Accès permanent ──────────────────────────────────────
  function buildFab() {
    var b = button('ck-fab', null, open);
    b.setAttribute('aria-label', 'Gérer les cookies');
    b.title = 'Gérer les cookies';
    b.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
      '<path d="M12 3a9 9 0 1 0 9 9 4 4 0 0 1-4.5-4.5A4 4 0 0 1 12 3z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>' +
      '<circle cx="9" cy="10.5" r="1.1" fill="currentColor"/><circle cx="14" cy="14.5" r="1.1" fill="currentColor"/>' +
      '<circle cx="9.5" cy="15.5" r="1.1" fill="currentColor"/></svg>';
    isolate(b);
    return b;
  }

  function hasLink() {
    var nodes = doc.querySelectorAll('[data-consent-open]');
    for (var i = 0; i < nodes.length; i++) if (nodes[i] !== fab) return true;
    return false;
  }

  // Bandeau tant qu'aucun choix n'est fait ; ensuite, un accès aux préférences.
  function render() {
    if (still || !doc.body) return;
    injectStyles();
    var decided = C.decided();
    if (!decided && !banner) {
      banner = buildBanner();
      // En tête de page : premier arrêt au clavier, annoncé d'emblée.
      doc.body.insertBefore(banner, doc.body.firstChild);
    } else if (decided && banner) {
      banner.parentNode.removeChild(banner);
      banner = null;
    }
    var needFab = decided && !hasLink();
    if (needFab && !fab) { fab = buildFab(); doc.body.appendChild(fab); }
    else if (!needFab && fab) { fab.parentNode.removeChild(fab); fab = null; }
  }

  // Liens « Cookies » des pages (présents ou ajoutés plus tard : délégation).
  doc.addEventListener('click', function (e) {
    var t = e.target && e.target.closest && e.target.closest('[data-consent-open]');
    if (!t || t === fab) return;
    e.preventDefault();
    open();
  });

  // Choix modifié dans un autre onglet : pris en compte ici aussi.
  global.addEventListener('storage', function (e) {
    if (e.key !== null && e.key !== KEY) return;
    render();
    notify();
  });
  // Page rendue par le cache arrière (bfcache) : son état date d'avant.
  global.addEventListener('pageshow', function (e) {
    if (!e.persisted) return;
    render();
    notify();
  });

  global.Consent = {
    get: C.get,
    allows: C.allows,
    decided: C.decided,
    persisted: C.persisted,
    set: choose,
    open: open,
    KEY: KEY,
    MAX_AGE_DAYS: MAX_AGE_DAYS,
  };

  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', render);
  else render();
  // Les interfaces construites en JS (menu du mode aventure) arrivent après.
  global.addEventListener('load', render);
})(typeof window !== 'undefined' ? window : globalThis);
