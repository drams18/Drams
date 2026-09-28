/* ══════════════════════════════════════════════════════
   CONTACT-FORM.JS — Envoi des formulaires via EmailJS (partagé)
   Source UNIQUE de la configuration EmailJS pour tout le portfolio :
   mode classique, mode aventure (maison CONTACT) et construire-projet.

   Le SDK n'est PAS chargé avec la page : il est récupéré à la demande,
   dès que le visiteur commence à remplir un formulaire (warm) ou au
   plus tard à l'envoi. Les pages sans formulaire ouvert ne paient rien.

   API (window.ContactForm) :
     warm(form)      précharge le SDK au 1er focus dans le formulaire
     sendForm(form)  Promise — envoie le formulaire (champs from_name,
                     from_email, message attendus par le template)
   ══════════════════════════════════════════════════════ */
(function (global) {
  'use strict';

  var SDK_SRC    = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js';
  var PUBLIC_KEY = 'a8mKuHS56bPD-ydT0';
  var SERVICE_ID  = 'service_kju3n28';
  var TEMPLATE_ID = 'template_pili6gr';

  var loading = null;

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
  }

  function sendForm(form) {
    return load().then(function (emailjs) {
      return emailjs.sendForm(SERVICE_ID, TEMPLATE_ID, form);
    });
  }

  global.ContactForm = { warm: warm, sendForm: sendForm, load: load };
})(window);
