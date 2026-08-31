/* ══════════════════════════════════════════════════════
   CONTACT.JS — Composant de contact commun (HTML/CSS/JS vanilla)
   Source UNIQUE des coordonnées pour tout le portfolio.

   Au clic sur un CTA de contact ([data-contact-cta]), ouvre un
   petit choix pixel-art, lisible et accessible :
     • E-mail    → mailto:  (desktop + mobile)
     • Téléphone → tel:     sur mobile ;
                   texte NON cliquable (+ bouton COPIER) sur ordinateur

   Utilisé par index.html (musée) et tarifs.html.
   Les styles sont injectés une seule fois, aucune dépendance.
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

  function mailtoHref(subject) {
    return 'mailto:' + EMAIL +
      (subject ? '?subject=' + encodeURIComponent(subject) : '');
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
      '.cw-panel{--cw-accent:#35e07a;--cw-accent-2:#7bf0a8;width:100%;max-width:420px;',
      'background:#0e1215;border:2px solid var(--cw-accent);color:#f0ead6;',
      'box-shadow:0 0 0 1px rgba(0,0,0,.8),0 0 40px rgba(0,0,0,.6),inset 0 1px 0 rgba(255,255,255,.05);',
      'animation:cw-pop .2s ease;max-height:calc(100vh - 40px);overflow-y:auto;}',
      '.cw-head{display:flex;align-items:center;justify-content:space-between;gap:12px;',
      'padding:14px 16px;border-bottom:2px solid var(--cw-accent);background:rgba(0,0,0,.4);}',
      '.cw-title{font-size:11px;letter-spacing:2px;color:var(--cw-accent);margin:0;',
      'text-shadow:0 0 10px rgba(53,224,122,.45);}',
      '.cw-close{font-family:inherit;font-size:8px;letter-spacing:1px;color:#cfc8b8;',
      'background:transparent;border:1px solid rgba(255,255,255,.3);padding:8px 11px;',
      'cursor:pointer;flex-shrink:0;transition:color .15s,border-color .15s;}',
      '.cw-close:hover,.cw-close:focus-visible{color:#fff;border-color:#fff;outline:none;}',
      ".cw-intro{font-family:-apple-system,'Segoe UI',Roboto,sans-serif;font-size:13px;",
      'line-height:1.6;color:#9aa7bb;padding:16px 16px 2px;margin:0;}',
      '.cw-option{display:block;position:relative;margin:12px 16px;padding:14px 16px;',
      'text-decoration:none;color:inherit;background:rgba(255,255,255,.03);',
      'border:1px solid rgba(255,255,255,.1);border-left:4px solid var(--cw-accent);',
      'transition:background .15s,border-color .15s,transform .1s;}',
      '.cw-option+.cw-option{margin-top:0;}',
      '.cw-option:last-child{margin-bottom:18px;}',
      'a.cw-option:hover,a.cw-option:focus-visible{background:rgba(53,224,122,.1);',
      'border-left-color:var(--cw-accent-2);outline:none;}',
      'a.cw-option:active{transform:translateY(2px);}',
      '.cw-option--static{cursor:default;}',
      '.cw-option-label{display:block;font-size:10px;letter-spacing:1px;color:var(--cw-accent);}',
      ".cw-option-value{display:block;margin-top:9px;font-family:-apple-system,'Segoe UI',Roboto,sans-serif;",
      'font-size:15px;font-weight:700;color:#fff;word-break:break-word;}',
      ".cw-option-hint{display:block;margin-top:6px;font-family:-apple-system,'Segoe UI',Roboto,sans-serif;",
      'font-size:11px;color:#8f9bb0;}',
      '.cw-copy{margin-top:12px;font-family:inherit;font-size:8px;letter-spacing:1px;',
      'color:#06251a;background:var(--cw-accent);border:2px solid var(--cw-accent-2);',
      'padding:9px 13px;cursor:pointer;transition:background .15s,transform .1s;}',
      '.cw-copy:hover,.cw-copy:focus-visible{background:var(--cw-accent-2);outline:none;}',
      '.cw-copy:active{transform:translateY(2px);}',
      '.cw-copy.cw-copied{background:#3a8a3a;color:#fff;border-color:#5d9c34;}',
      '@media (max-width:480px){.cw-panel{max-width:none;}.cw-option-value{font-size:14px;}}',
      '@media (prefers-reduced-motion:reduce){.cw-overlay,.cw-panel{animation:none;}}'
    ].join('');
    var el = doc.createElement('style');
    el.id = STYLE_ID;
    el.textContent = css;
    doc.head.appendChild(el);
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

  function copyPhone(btn) {
    var done = function () {
      var prev = btn.getAttribute('data-label') || btn.textContent;
      btn.setAttribute('data-label', prev);
      btn.textContent = 'NUMERO COPIE';
      btn.classList.add('cw-copied');
      setTimeout(function () {
        btn.textContent = prev;
        btn.classList.remove('cw-copied');
      }, 1600);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(PHONE).then(done, done);
    } else {
      var t = doc.createElement('textarea');
      t.value = PHONE;
      t.setAttribute('readonly', '');
      t.style.position = 'absolute';
      t.style.left = '-9999px';
      doc.body.appendChild(t);
      t.select();
      try { doc.execCommand('copy'); } catch (err) { /* noop */ }
      doc.body.removeChild(t);
      done();
    }
  }

  function makeOption(tag) {
    var el = doc.createElement(tag);
    el.className = 'cw-option';
    return el;
  }

  function fill(el, label, value, hint) {
    var l = doc.createElement('span');
    l.className = 'cw-option-label';
    l.textContent = label;
    var v = doc.createElement('span');
    v.className = 'cw-option-value';
    v.textContent = value;
    var h = doc.createElement('span');
    h.className = 'cw-option-hint';
    h.textContent = hint;
    el.appendChild(l);
    el.appendChild(v);
    el.appendChild(h);
  }

  function open(opts) {
    opts = opts || {};
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
    intro.textContent = 'Choisissez un moyen de contact.';

    // ── E-mail : toujours cliquable (mailto) ──────────────
    var mail = makeOption('a');
    mail.href = mailtoHref(opts.subject);
    fill(mail, 'E-mail', EMAIL, 'Ouvre votre application e-mail');
    mail.addEventListener('click', function () {
      setTimeout(close, 120);
    });

    // ── Téléphone : tel: sur mobile, texte simple sur desktop ──
    var phone;
    if (mobile) {
      phone = makeOption('a');
      phone.href = 'tel:' + PHONE_TEL;
      fill(phone, 'Téléphone', PHONE, "Ouvre l'application Téléphone pour appeler");
      phone.addEventListener('click', function () {
        setTimeout(close, 120);
      });
    } else {
      phone = makeOption('div');
      phone.className = 'cw-option cw-option--static';
      fill(phone, 'Téléphone', PHONE, 'Numéro à composer ou à copier');
      var copy = doc.createElement('button');
      copy.type = 'button';
      copy.className = 'cw-copy';
      copy.textContent = 'COPIER LE NUMERO';
      copy.setAttribute('aria-label', 'Copier le numéro de téléphone');
      copy.addEventListener('click', function () {
        copyPhone(copy);
      });
      phone.appendChild(copy);
    }

    panel.appendChild(head);
    panel.appendChild(intro);
    panel.appendChild(mail);
    panel.appendChild(phone);
    overlay.appendChild(panel);
    doc.body.appendChild(overlay);

    doc.addEventListener('keydown', onKeydown, true);
    mail.focus();
  }

  // ── Câblage automatique des CTA ──────────────────────────
  function bind(el) {
    if (!el || el.__cwBound) return;
    el.__cwBound = true;
    el.addEventListener('click', function (e) {
      e.preventDefault();
      open({ subject: el.getAttribute('data-contact-subject') || '' });
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
