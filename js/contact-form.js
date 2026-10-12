/* ══════════════════════════════════════════════════════
   CONTACT-FORM.JS : Envoi des formulaires via EmailJS (partagé)
   Source UNIQUE de la configuration EmailJS pour tout le portfolio :
   mode classique, mode aventure (maison CONTACT) et construire-projet.

   Le SDK n'est PAS chargé avec la page : il est récupéré à la demande,
   dès que le visiteur commence à remplir un formulaire (warm) ou au
   plus tard à l'envoi. Les pages sans formulaire ouvert ne paient rien.

   API (window.ContactForm) :
     warm(form)      précharge le SDK au 1er focus dans le formulaire
     sendForm(form)  Promise, envoie le formulaire (champs from_name,
                     from_email, message attendus par le template)

   Suivi (js/analytics-events.js) : deux événements DOM sur document,
   detail { type: 'contact' | 'devis' }, sans aucune donnée du formulaire.
     lead:start   première saisie dans un formulaire préparé par warm()
     lead:sent    EmailJS a confirmé l'envoi (jamais au simple clic)
   ══════════════════════════════════════════════════════ */
(function (global) {
  'use strict';

  var SDK_SRC    = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js';
  var PUBLIC_KEY = 'a8mKuHS56bPD-ydT0';
  var SERVICE_ID  = 'service_kju3n28';
  var TEMPLATE_ID = 'template_pili6gr';

  var loading = null;

  // Formulaire de devis (devis.html, construire-projet) ou de contact.
  function kind(form) {
    return form && form.elements && form.elements.client_email ? 'devis' : 'contact';
  }
  function emit(name, form) {
    try {
      global.document.dispatchEvent(new CustomEvent(name, { detail: { type: kind(form) } }));
    } catch (e) { /* le suivi ne doit jamais gêner un envoi */ }
  }

  function load() {
    if (loading) return loading;
    loading = new Promise(function (resolve, reject) {
      if (global.emailjs && global.emailjs.sendForm) {
        global.emailjs.init(PUBLIC_KEY);
        resolve(global.emailjs);
        return;
      }
      var s = global.document.createElement('script');
      s.src = SDK_SRC;
      s.async = true;
      s.onload = function () {
        if (!global.emailjs) { reject(new Error('EmailJS indisponible')); return; }
        global.emailjs.init(PUBLIC_KEY);
        resolve(global.emailjs);
      };
      s.onerror = function () {
        loading = null;   // nouvel essai possible au prochain envoi
        reject(new Error('Chargement EmailJS impossible'));
      };
      global.document.head.appendChild(s);
    });
    return loading;
  }

  function warm(form) {
    if (!form) return;
    var go = function () { load().catch(function () {}); };
    form.addEventListener('focusin', go, { once: true });
    form.addEventListener('pointerdown', go, { once: true, passive: true });
    form.addEventListener('input', function () { emit('lead:start', form); }, { once: true });
  }

  // Un envoi déjà en cours pour ce formulaire (double clic, double appel)
  // est réutilisé : un seul e-mail, un seul « lead:sent ».
  function sendForm(form) {
    if (form && form.__sending) return form.__sending;
    var sending = load().then(function (emailjs) {
      return emailjs.sendForm(SERVICE_ID, TEMPLATE_ID, form);
    }).then(function (res) {
      emit('lead:sent', form);
      return res;
    });
    if (form) {
      var done = function () { form.__sending = null; };
      form.__sending = sending;
      sending.then(done, done);
    }
    return sending;
  }

  global.ContactForm = { warm: warm, sendForm: sendForm, load: load };
})(window);
