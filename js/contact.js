/* ══════════════════════════════════════════════════════
   CONTACT.JS — Composant de contact commun (HTML/CSS/JS vanilla)
   Source UNIQUE des coordonnées pour tout le portfolio.

   Au clic sur un CTA de contact ([data-contact-cta]), ouvre un
   petit choix pixel-art, lisible et accessible :

     • E-mail    → adresse affichée + bouton COPIER + services au choix :
                   Gmail (webmail), Outlook (webmail), Application e-mail (mailto:)
                   → fonctionne sur ordinateur MÊME sans logiciel mail installé
     • Téléphone → sur mobile : tel: (déclenche l'appel) ET sms: (ouvre
                   l'application Messages pour écrire un SMS) ;
                   texte NON cliquable + bouton COPIER sur ordinateur

   Utilisé par index.html (musée) et tarifs.html.
   Styles injectés une seule fois, aucune dépendance.
   ══════════════════════════════════════════════════════ */
(function (global) {
  'use strict';

  var doc = global.document;

  // ── Coordonnées — NE PAS dupliquer / inventer ailleurs ─────
  var EMAIL = 'arphandrame0@gmail.com';
  var PHONE = '07 67 31 84 26';
  var PHONE_TEL = PHONE.replace(/[^\d+]/g, ''); // "0767318426"

  // ── Détection mobile (tactile sans survol) ────────────────
  function isMobile() {
    var coarse = global.matchMedia &&
      global.matchMedia('(hover: none) and (pointer: coarse)').matches;
    return !!coarse || /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  }

  // ── Constructeurs de liens e-mail ────────────────────────
  // `body` est facultatif : permet de préremplir le corps du message
  // (ex. depuis la recherche de tarifs.html). Rétrocompatible.
  function mailtoHref(subject, body) {
    var p = [];
    if (subject) p.push('subject=' + encodeURIComponent(subject));
    if (body) p.push('body=' + encodeURIComponent(body));
    return 'mailto:' + EMAIL + (p.length ? '?' + p.join('&') : '');
  }
  function gmailHref(subject, body) {
    return 'https://mail.google.com/mail/?view=cm&fs=1&to=' + encodeURIComponent(EMAIL) +
      (subject ? '&su=' + encodeURIComponent(subject) : '') +
      (body ? '&body=' + encodeURIComponent(body) : '');
  }
  function outlookHref(subject, body) {
    return 'https://outlook.live.com/mail/0/deeplink/compose?to=' + encodeURIComponent(EMAIL) +
      (subject ? '&subject=' + encodeURIComponent(subject) : '') +
      (body ? '&body=' + encodeURIComponent(body) : '');
  }

  // ── Styles (injectés une seule fois) ─────────────────────
  var STYLE_ID = 'contact-widget-style';
  function injectStyles() {
    if (doc.getElementById(STYLE_ID)) return;
    var css = [
      '.cw-overlay{position:fixed;inset:0;z-index:9999;display:flex;',
      'align-items:center;justify-content:center;padding:20px;',
      'background:rgba(4,7,12,.8);animation:cw-fade .15s ease;',
      "font-family:'Press Start 2P',monospace;}",
      '@keyframes cw-fade{from{opacity:0}to{opacity:1}}',
      '@keyframes cw-pop{from{transform:translateY(10px);opacity:0}to{transform:none;opacity:1}}',
      '.cw-panel{--cw-accent:#ff2bb0;--cw-accent-2:#19e8ff;width:100%;max-width:440px;',
      'background:#0b0d16;border:3px solid #01010a;color:#f5f6ff;',
      'box-shadow:10px 10px 0 #8f0a24,0 0 40px rgba(0,0,0,.6),0 0 26px rgba(255,43,176,.3);',
      'animation:cw-pop .2s ease;max-height:calc(100vh - 40px);overflow-y:auto;}',
      '.cw-panel:focus{outline:none;}',
      '.cw-head{display:flex;align-items:center;justify-content:space-between;gap:12px;',
      'padding:14px 16px;border-bottom:3px solid #01010a;background:rgba(0,0,0,.4);}',
      '.cw-title{font-size:11px;letter-spacing:2px;color:var(--cw-accent);margin:0;',
      'text-shadow:-0.03em 0 0 #ff123d,0.03em 0 0 #19e8ff,0 0 12px rgba(255,43,176,.5);}',
      '.cw-close{font-family:inherit;font-size:8px;letter-spacing:1px;color:#cfc8b8;',
      'background:transparent;border:1px solid rgba(255,255,255,.3);padding:8px 11px;',
      'cursor:pointer;flex-shrink:0;transition:color .15s,border-color .15s;}',
      '.cw-close:hover,.cw-close:focus-visible{color:#fff;border-color:#fff;outline:none;}',
      ".cw-intro{font-family:-apple-system,'Segoe UI',Roboto,sans-serif;font-size:13px;",
      'line-height:1.6;color:#9aa7bb;padding:16px 16px 2px;margin:0;}',
      '.cw-option{display:block;position:relative;margin:12px 16px;padding:14px 16px;',
      'text-decoration:none;color:inherit;background:#11131f;',
      'border:2px solid #01010a;border-left:4px solid var(--cw-accent);',
      'box-shadow:3px 3px 0 #01010a;',
      'transition:background .15s,border-color .15s,transform .1s;}',
      '.cw-option:last-child{margin-bottom:18px;}',
      'a.cw-option:hover,a.cw-option:focus-visible{background:rgba(25,232,255,.1);',
      'border-left-color:var(--cw-accent-2);outline:none;}',
      'a.cw-option:active{transform:translateY(2px);}',
      '.cw-option--static{cursor:default;}',
      '.cw-option-label{display:block;font-size:10px;letter-spacing:1px;color:var(--cw-accent);}',
      ".cw-option-value{font-family:-apple-system,'Segoe UI',Roboto,sans-serif;",
      'font-size:15px;font-weight:700;color:#fff;word-break:break-word;}',
      '.cw-option>.cw-option-value{display:block;margin-top:9px;}',
      ".cw-option-hint{display:block;margin-top:8px;font-family:-apple-system,'Segoe UI',Roboto,sans-serif;",
      'font-size:11px;color:#8f9bb0;line-height:1.55;}',
      '.cw-valuerow{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-top:9px;}',
      '.cw-valuerow .cw-option-value{flex:1;min-width:0;}',
      '.cw-svc-row{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px;}',
      ".cw-svc{font-family:-apple-system,'Segoe UI',Roboto,sans-serif;font-size:12px;font-weight:700;",
      'color:#f0ead6;text-decoration:none;background:rgba(255,255,255,.05);',
      'border:1px solid rgba(255,255,255,.25);padding:10px 13px;cursor:pointer;',
      'transition:background .15s,border-color .15s,transform .1s;}',
      '.cw-svc:hover,.cw-svc:focus-visible{background:rgba(25,232,255,.14);',
      'border-color:var(--cw-accent-2);outline:none;}',
      '.cw-svc:active{transform:translateY(2px);}',
      '.cw-copy{flex-shrink:0;font-family:inherit;font-size:8px;letter-spacing:1px;',
      'color:#04121a;background:var(--cw-accent-2);border:2px solid #01010a;',
      'box-shadow:2px 2px 0 #01010a;',
      'padding:9px 12px;cursor:pointer;transition:filter .15s,transform .1s;}',
      '.cw-copy:hover,.cw-copy:focus-visible{filter:brightness(1.1);outline:none;}',
      '.cw-copy:active{transform:translateY(2px);}',
      '.cw-copy.cw-copied{background:#19e8ff;color:#04121a;border-color:#01010a;}',
      '@media (max-width:480px){.cw-panel{max-width:none;}.cw-option-value{font-size:14px;}',
      '.cw-svc{flex:1;text-align:center;}}',
      '@media (prefers-reduced-motion:reduce){.cw-overlay,.cw-panel{animation:none;}}'
    ].join('');
    var el = doc.createElement('style');
    el.id = STYLE_ID;
    el.textContent = css;
    doc.head.appendChild(el);
  }

  // ── Petits helpers DOM ──────────────────────────────────
  function span(cls, text) {
    var s = doc.createElement('span');
    s.className = cls;
    s.textContent = text;
    return s;
  }

  function fallbackCopy(value) {
    var t = doc.createElement('textarea');
    t.value = value;
    t.setAttribute('readonly', '');
    t.style.position = 'absolute';
    t.style.left = '-9999px';
    doc.body.appendChild(t);
    t.select();
    try { doc.execCommand('copy'); } catch (err) { /* noop */ }
    doc.body.removeChild(t);
  }

  function copyText(btn, value, okLabel) {
    var reset = function () {
      btn.textContent = 'COPIER';
      btn.classList.remove('cw-copied');
    };
    var done = function () {
      btn.textContent = okLabel;
      btn.classList.add('cw-copied');
      setTimeout(reset, 1600);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(value).then(done, function () { fallbackCopy(value); done(); });
    } else {
      fallbackCopy(value);
      done();
    }
  }

  function copyBtn(value, okLabel) {
    var b = doc.createElement('button');
    b.type = 'button';
    b.className = 'cw-copy';
    b.textContent = 'COPIER';
    b.setAttribute('aria-label', 'Copier : ' + value);
    b.addEventListener('click', function () { copyText(b, value, okLabel); });
    return b;
  }

  function svcLink(label, href, isMailto) {
    var a = doc.createElement('a');
    a.className = 'cw-svc';
    a.href = href;
    if (!isMailto) {
      a.target = '_blank';
      a.rel = 'noopener';
    }
    a.textContent = label;
    a.addEventListener('click', function () { setTimeout(close, 150); });
    return a;
  }

  // ── État ─────────────────────────────────────────────────
  var overlay = null;
  var lastFocus = null;

  function close() {
    if (!overlay) return;
    doc.removeEventListener('keydown', onKeydown, true);
    if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    overlay = null;
    if (lastFocus && lastFocus.focus) lastFocus.focus();
    lastFocus = null;
  }

  function onKeydown(e) {
    if (!overlay) return;
    if (e.key === 'Escape' || e.keyCode === 27) {
      e.preventDefault();
      close();
      return;
    }
    if (e.key === 'Tab' || e.keyCode === 9) {
      var f = overlay.querySelectorAll('a[href],button');
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && doc.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && doc.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  function open(opts) {
    opts = opts || {};
    var subject = opts.subject || '';
    var body = opts.body || '';
    if (overlay) close();
    injectStyles();
    lastFocus = doc.activeElement;

    var mobile = isMobile();

    overlay = doc.createElement('div');
    overlay.className = 'cw-overlay';
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) close();
    });

    var panel = doc.createElement('div');
    panel.className = 'cw-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-labelledby', 'cw-title');
    panel.setAttribute('tabindex', '-1');

    // ── En-tête ──────────────────────────────────────────
    var head = doc.createElement('div');
    head.className = 'cw-head';
    var title = doc.createElement('h2');
    title.className = 'cw-title';
    title.id = 'cw-title';
    title.textContent = 'ME CONTACTER';
    var closeBtn = doc.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'cw-close';
    closeBtn.textContent = 'FERMER';
    closeBtn.setAttribute('aria-label', 'Fermer');
    closeBtn.addEventListener('click', close);
    head.appendChild(title);
    head.appendChild(closeBtn);

    var intro = doc.createElement('p');
    intro.className = 'cw-intro';
    intro.textContent = 'Choisissez comment me contacter.';

    // ── E-mail : adresse + copie + services webmail / mailto ──
    var mail = doc.createElement('div');
    mail.className = 'cw-option cw-option--static';
    mail.appendChild(span('cw-option-label', 'E-mail'));
    var mailRow = doc.createElement('div');
    mailRow.className = 'cw-valuerow';
    mailRow.appendChild(span('cw-option-value', EMAIL));
    mailRow.appendChild(copyBtn(EMAIL, 'ADRESSE COPIEE'));
    mail.appendChild(mailRow);
    mail.appendChild(span('cw-option-hint',
      'Ouvrez votre messagerie habituelle, ou copiez l\'adresse.'));
    var svc = doc.createElement('div');
    svc.className = 'cw-svc-row';
    var firstFocus = svcLink('Gmail', gmailHref(subject, body));
    svc.appendChild(firstFocus);
    svc.appendChild(svcLink('Outlook', outlookHref(subject, body)));
    svc.appendChild(svcLink('Application e-mail', mailtoHref(subject, body), true));
    mail.appendChild(svc);

    // ── Téléphone : appel + SMS sur mobile, texte simple sur desktop ──
    var phone;
    if (mobile) {
      phone = doc.createDocumentFragment();

      var call = doc.createElement('a');
      call.className = 'cw-option';
      call.href = 'tel:' + PHONE_TEL;
      call.appendChild(span('cw-option-label', 'Téléphone — appeler'));
      call.appendChild(span('cw-option-value', PHONE));
      call.appendChild(span('cw-option-hint', "Ouvre l'application Téléphone pour appeler"));
      call.addEventListener('click', function () { setTimeout(close, 150); });

      var sms = doc.createElement('a');
      sms.className = 'cw-option';
      sms.href = 'sms:' + PHONE_TEL +
        ((body || subject) ? '?&body=' + encodeURIComponent(body || subject) : '');
      sms.appendChild(span('cw-option-label', 'Téléphone — message'));
      sms.appendChild(span('cw-option-value', PHONE));
      sms.appendChild(span('cw-option-hint', "Ouvre l'application Messages pour envoyer un SMS"));
      sms.addEventListener('click', function () { setTimeout(close, 150); });

      phone.appendChild(call);
      phone.appendChild(sms);
    } else {
      phone = doc.createElement('div');
      phone.className = 'cw-option cw-option--static';
      phone.appendChild(span('cw-option-label', 'Téléphone'));
      var phoneRow = doc.createElement('div');
      phoneRow.className = 'cw-valuerow';
      phoneRow.appendChild(span('cw-option-value', PHONE));
      phoneRow.appendChild(copyBtn(PHONE, 'NUMERO COPIE'));
      phone.appendChild(phoneRow);
      phone.appendChild(span('cw-option-hint', 'Numéro à composer ou à copier.'));
    }

    panel.appendChild(head);
    panel.appendChild(intro);
    panel.appendChild(mail);
    panel.appendChild(phone);
    overlay.appendChild(panel);
    doc.body.appendChild(overlay);

    doc.addEventListener('keydown', onKeydown, true);
    (firstFocus || panel).focus();
  }

  // ── Câblage automatique des CTA ──────────────────────────
  function bind(el) {
    if (!el || el.__cwBound) return;
    el.__cwBound = true;
    el.addEventListener('click', function (e) {
      e.preventDefault();
      open({
        subject: el.getAttribute('data-contact-subject') || '',
        body: el.getAttribute('data-contact-body') || ''
      });
    });
  }

  function init(root) {
    var nodes = (root || doc).querySelectorAll('[data-contact-cta]');
    for (var i = 0; i < nodes.length; i++) bind(nodes[i]);
  }

  global.ContactWidget = {
    open: open,
    close: close,
    init: init,
    bind: bind,
    isMobile: isMobile,
    mailtoHref: mailtoHref,
    gmailHref: gmailHref,
    outlookHref: outlookHref,
    EMAIL: EMAIL,
    PHONE: PHONE,
    PHONE_TEL: PHONE_TEL
  };

  if (doc.readyState === 'loading') {
    doc.addEventListener('DOMContentLoaded', function () { init(); });
  } else {
    init();
  }
})(window);
