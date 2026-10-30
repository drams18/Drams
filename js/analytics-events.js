/* ══════════════════════════════════════════════════════
   ANALYTICS-EVENTS.JS : Événements GA4 du site (hors page_view)

     form_start      première saisie dans un formulaire (une fois par
                     formulaire et par page)
     generate_lead   demande réellement partie : EmailJS a répondu OK
     contact_click   clic sur un moyen de contact (e-mail, téléphone,
                     SMS, LinkedIn)

   Ce fichier n'envoie rien lui-même : il passe par Analytics.event(),
   qui ne laisse rien sortir sans accord (js/analytics.js).

   Paramètres : uniquement des valeurs fixes écrites ici. Jamais un nom,
   une adresse, un numéro, un message, ni le contenu d'un champ.
     form_type       'contact' | 'devis'
     site_mode       'classique' | 'aventure'
     method          'email' | 'phone' | 'sms' | 'linkedin'
     link_type       'app' | 'webmail' | 'copy' | 'profile'

   Les formulaires préviennent par deux événements DOM émis par
   js/contact-form.js : « lead:start » et « lead:sent ».
   ══════════════════════════════════════════════════════ */
(function (global) {
  'use strict';

  var doc = global.document;

  function send(name, params) {
    if (global.Analytics) global.Analytics.event(name, params);
  }

  function siteMode() {
    return /^\/(aventure|construire-projet)(\.html)?\/?$/.test(global.location.pathname) ? 'aventure' : 'classique';
  }

  function formParams(e) {
    var type = e.detail && e.detail.type === 'devis' ? 'devis' : 'contact';
    return { form_type: type, site_mode: siteMode() };
  }

  doc.addEventListener('lead:start', function (e) { send('form_start', formParams(e)); });
  // Pas de valeur monétaire : aucune estimation fiable d'une demande.
  doc.addEventListener('lead:sent', function (e) { send('generate_lead', formParams(e)); });

  // ── Moyens de contact ────────────────────────────────────
  // Le moyen est déduit de la forme du lien, jamais de sa valeur.
  function contactOf(t) {
    var a = t.closest('a[href]');
    if (a) {
      var href = a.getAttribute('href') || '';
      var copies = a.hasAttribute('data-copy') && a.title === 'Cliquer pour copier';
      if (/^mailto:/i.test(href)) return { method: 'email', link_type: copies ? 'copy' : 'app' };
      if (/^tel:/i.test(href)) return { method: 'phone', link_type: copies ? 'copy' : 'app' };
      if (/^sms:/i.test(href)) return { method: 'sms', link_type: 'app' };
      if (/^https:\/\/(mail\.google\.com\/mail\/\?view=cm|outlook\.live\.com\/mail\/)/i.test(href)) return { method: 'email', link_type: 'webmail' };
      if (/^https:\/\/([a-z]+\.)?linkedin\.com\/in\//i.test(href)) return { method: 'linkedin', link_type: 'profile' };
      if (/^https:\/\/(wa\.me|api\.whatsapp\.com)\//i.test(href)) return { method: 'whatsapp', link_type: 'app' };
      if (/^https:\/\/(www\.)?instagram\.com\//i.test(href)) return { method: 'instagram', link_type: 'profile' };
      return null;
    }
    // Boutons « Copier » : widget de contact (js/contact.js) et mode aventure.
    var b = t.closest('.cw-copy, .adv-contact__row button');
    if (b) {
      var row = b.closest('.cw-option, .adv-contact__row');
      var mail = row && /@/.test(row.textContent);
      return { method: mail ? 'email' : 'phone', link_type: 'copy' };
    }
    return null;
  }

  // Phase de capture : certains liens referment leur fenêtre au clic.
  doc.addEventListener('click', function (e) {
    var t = e.target;
    if (!t || !t.closest) return;
    var c = contactOf(t);
    if (!c) return;
    c.site_mode = siteMode();
    send('contact_click', c);
  }, true);

  // La « mesure améliorée » de GA4 (réglage de la propriété, à désactiver :
  // docs/analytics-ga4.md) écoute les clics sur document et envoie l'adresse
  // complète des liens sortants. Celle d'un lien de contact contient le
  // destinataire, l'objet et parfois un texte tiré de la recherche du
  // visiteur. Tant que la mesure est active, ces clics s'arrêtent donc ici,
  // juste sous document : le lien s'ouvre normalement, ses propres écouteurs
  // ont déjà tourné, et notre contact_click (ci-dessus, en capture) est parti.
  doc.documentElement.addEventListener('click', function (e) {
    var a = e.target && e.target.closest && e.target.closest('a[href]');
    if (!a || !global.Analytics || !global.Analytics.isActive()) return;
    var c = contactOf(a);
    if (c && c.method !== 'linkedin') e.stopPropagation();
  });
})(window);
