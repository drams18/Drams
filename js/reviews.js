/* ══════════════════════════════════════════════════════
   REVIEWS.JS : Avis Google (partagé)
   Source UNIQUE du lien Google et des règles de sollicitation.
   Tant que REVIEW_URL est vide, rien ne s'affiche nulle part.

   Principe : le site ne sait pas qui est client. Seul un lien envoyé
   à la main après une prestation (/avis?merci) marque le navigateur
   comme « invité ». Aucun formulaire, aucune visite ne déclenche de
   demande. Rien n'est envoyé à un serveur : l'état reste dans le
   navigateur (dates et compteur, aucune donnée personnelle).

   Dans le HTML :
     [data-review-entry]  lien permanent vers /avis, masqué (hidden)
                          tant que l'URL n'est pas renseignée
     [data-review-go]     lien vers Google (page /avis)
     [data-review-page]   la page /avis ; avec ?merci, marque l'invitation
     [data-review-slot]   emplacement du rappel discret (client invité
                          qui revient sans avoir laissé d'avis)

   Règles du rappel : navigateur invité, pas encore de clic vers Google,
   1 affichage par session, MAX_SHOWN au total, COOLDOWN_DAYS de pause
   après « Pas maintenant ». Stockage indisponible → pas de rappel.
   ══════════════════════════════════════════════════════ */
(function (global) {
  'use strict';

  // ── Lien Google, NE PAS dupliquer ailleurs ───────────────
  var REVIEW_URL = 'https://g.page/r/CYTu5tg8sNymEBM/review';
  // Fiche publique : le même lien court sans « /review » (sameAs du JSON-LD,
  // lu par scripts/build-classic.mjs).
  var PROFILE_URL = REVIEW_URL.replace(/\/review\/?$/, '');

  var KEY = 'drame.reviews';
  var SESSION_KEY = 'drame.reviews.session';
  var MAX_SHOWN = 2;
  var COOLDOWN_DAYS = 30;
  var DAY = 24 * 60 * 60 * 1000;

  // opts : { url, storage, session, now } injectables (tests).
  function create(opts) {
    opts = opts || {};
    var url = opts.url == null ? REVIEW_URL : opts.url;
    var storage = opts.storage || null;
    var session = opts.session || null;
    var now = opts.now || function () { return Date.now(); };

    function read() {
      var s = { invited: 0, shown: 0, dismissedAt: 0, clickedAt: 0 };
      try {
        var raw = JSON.parse(storage.getItem(KEY));
        if (raw && typeof raw === 'object') {
          Object.keys(s).forEach(function (k) { if (isFinite(raw[k]) && raw[k] > 0) s[k] = +raw[k]; });
        }
      } catch (e) { /* stockage indisponible ou donnée illisible */ }
      return s;
    }
    function write(s) {
      try { storage.setItem(KEY, JSON.stringify(s)); return true; } catch (e) { return false; }
    }
    function update(fn) { var s = read(); fn(s); return write(s); }

    function seenThisSession() {
      try { return session.getItem(SESSION_KEY) === '1'; } catch (e) { return true; }
    }
    function markSession() {
      try { session.setItem(SESSION_KEY, '1'); } catch (e) { /* noop */ }
    }

    return {
      url: function () { return url; },
      enabled: function () { return !!url; },
      state: read,

      // Lien personnel ouvert : la page /avis EST la demande de cette session.
      markInvited: function () {
        markSession();
        return update(function (s) { if (!s.invited) s.invited = now(); });
      },
      shouldPrompt: function () {
        if (!url || !storage || !session || seenThisSession()) return false;
        var s = read();
        if (!s.invited || s.clickedAt || s.shown >= MAX_SHOWN) return false;
        return !s.dismissedAt || now() - s.dismissedAt >= COOLDOWN_DAYS * DAY;
      },
      markShown: function () {
        markSession();
        return update(function (s) { s.shown += 1; });
      },
      dismiss: function () { return update(function (s) { s.dismissedAt = now(); }); },
      markClicked: function () { return update(function (s) { s.clickedAt = now(); }); },
    };
  }

  // Lecture côté Node (tests), sans effet dans le navigateur.
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { create: create, REVIEW_URL: REVIEW_URL, PROFILE_URL: PROFILE_URL, KEY: KEY, SESSION_KEY: SESSION_KEY, MAX_SHOWN: MAX_SHOWN, COOLDOWN_DAYS: COOLDOWN_DAYS };
    return;
  }

  var doc = global.document;
  function safe(fn) { try { return fn(); } catch (e) { return null; } }
  var R = create({
    storage: safe(function () { return global.localStorage; }),
    session: safe(function () { return global.sessionStorage; }),
  });
  global.Reviews = R;

  function el(tag, cls, text) {
    var n = doc.createElement(tag);
    if (cls) n.className = cls;
    if (text) n.textContent = text;
    return n;
  }

  function googleLink(a) {
    a.href = R.url();
    a.target = '_blank';
    a.rel = 'noopener';
    a.addEventListener('click', function () { R.markClicked(); });
  }

  // Rappel : une ligne dans le flux de la page, ni modale ni prise de focus.
  function prompt(slot) {
    var card = el('aside', 'review-card');
    card.setAttribute('aria-label', 'Avis Google');
    var text = el('p', 'review-card__text');
    text.appendChild(el('strong', '', 'Nous avons travaillé ensemble ?'));
    text.appendChild(doc.createTextNode(' Si vous le souhaitez, vous pouvez partager votre expérience sur Google.'));
    var actions = el('div', 'review-card__actions');
    var go = el('a', 'btn btn--sm', 'Donner mon avis');
    googleLink(go);
    go.addEventListener('click', function () { slot.hidden = true; });
    var later = el('button', 'review-card__later', 'Pas maintenant');
    later.type = 'button';
    later.addEventListener('click', function () { R.dismiss(); slot.hidden = true; });
    actions.appendChild(go);
    actions.appendChild(later);
    card.appendChild(text);
    card.appendChild(actions);
    slot.appendChild(card);
    slot.hidden = false;
    R.markShown();
  }

  function init() {
    if (!R.enabled()) return;
    doc.querySelectorAll('[data-review-entry]').forEach(function (a) { a.hidden = false; });
    doc.querySelectorAll('[data-review-go]').forEach(googleLink);
    doc.querySelectorAll('[data-review-ready]').forEach(function (n) { n.hidden = false; });
    doc.querySelectorAll('[data-review-pending]').forEach(function (n) { n.hidden = true; });
    if (doc.querySelector('[data-review-page]')) {
      if (/[?&]merci\b/.test(global.location.search)) R.markInvited();
      return;
    }
    var slot = doc.querySelector('[data-review-slot]');
    // Page prérendue (règles de spéculation) : on attend qu'elle soit vraiment affichée.
    if (slot && !doc.prerendering && R.shouldPrompt()) prompt(slot);
    else if (slot && doc.prerendering) {
      doc.addEventListener('prerenderingchange', function () { if (R.shouldPrompt()) prompt(slot); }, { once: true });
    }
  }

  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', init);
  else init();
})(typeof window !== 'undefined' ? window : globalThis);
