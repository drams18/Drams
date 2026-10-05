/* ══════════════════════════════════════════════════════
   BUILDUI.JS : interface de « Construisez votre projet », en DOM

   Mêmes composants et mêmes classes que le mode aventure (boutons, invite,
   toast, cartes) : l'habillage vient des variables --u-* de l'univers.

     haut   : retour · carte de l'étape (progression, question, valider) · son
     bas    : invite devant une porte, bulle du passant
     écrans : récapitulatif → formulaire → confirmation
   ══════════════════════════════════════════════════════ */

import { h, clear, focusFirst, trapTab } from '../aventure/ui/dom.js';
import { volumeControl } from '../aventure/ui/VolumeControl.js';
import { STEPS } from './steps.js';

const CONTACT_EMAIL = 'arphandrame0@gmail.com';   // repli affiché si l'envoi échoue

export class BuildUI {
  /* on : { back(), next(), interact(), sound(), volume(v), sfx(name),
            restart(), toForm(), toRecap(), sent(), home } */
  constructor(root, answers, on) {
    this.answers = answers;
    this.on = on;
    this._last = Object.create(null);
    this._toastTimer = 0;

    // ── Haut ──
    this.back = h('button.adv-btn.adv-btn--ghost', { type: 'button', onclick: on.back });
    this.sound = h('button.adv-btn.adv-btn--ghost', { type: 'button', onclick: on.sound });
    this.volume = volumeControl('adv-vol--bar', on.volume);

    this.count = h('span');
    this.bar = h('i.bp-step__bar');
    this.title = h('h1.bp-step__title');
    this.help = h('p.bp-step__help');
    this.next = h('button.adv-btn.bp-step__next', { type: 'button', hidden: true, onclick: on.next });
    this.step = h('div.bp-step', null,
      h('p.bp-step__k', null, this.count, this.bar), this.title, this.help, this.next);

    // ── Bas ──
    this.promptKey = h('kbd');
    this.promptT = h('span');
    this.promptBtn = h('button.adv-hud__prompt-main', { type: 'button', onclick: on.interact }, this.promptKey, this.promptT);
    this.promptMore = h('span.adv-hud__prompt-more');
    this.prompt = h('div.adv-hud__prompt', { hidden: true }, this.promptBtn, this.promptMore);
    this.dialogue = h('p.adv-hud__dialogue', { hidden: true, role: 'status' });

    this.toastK = h('span.adv-toast__k');
    this.toastT = h('b.adv-toast__t');
    this.toastEl = h('div.adv-toast', { role: 'status', hidden: true }, h('div', null, this.toastK, this.toastT));

    this.hud = h('div.adv-hud.bp-hud', { hidden: true },
      h('div.bp-top', null,
        h('div.bp-top__left', null, this.back),
        this.step,
        h('div.bp-top__right', null, this.sound, this.volume.el)),
      this.toastEl, this.dialogue, this.prompt);
    root.appendChild(this.hud);

    this._buildPanels(root);
  }

  // ── HUD ──────────────────────────────────────────────
  _set(key, value, fn) {
    if (this._last[key] === value) return;
    this._last[key] = value;
    fn(value);
  }

  showHud(on) { this.hud.hidden = !on; }

  setStep(index, enterKey) {
    const step = STEPS[index];
    this.count.textContent = `ÉTAPE ${index + 1}/${STEPS.length}`;
    this.bar.style.setProperty('--k', String((index + 1) / STEPS.length));
    this.title.textContent = step.title;
    this.help.textContent = step.help;
    // Écran étroit : libellé court, le son et la jauge tiennent sur la même ligne.
    const narrow = window.innerWidth < 640;
    this.back.textContent = index === 0 ? (narrow ? '← Portfolio' : 'Revenir au portfolio') : (narrow ? '← Précédent' : 'Étape précédente');
    this.next.textContent = (index === STEPS.length - 1 ? 'Voir le récapitulatif' : 'Valider l\'étape') + (enterKey ? ' · Entrée' : '');
    this.step.classList.remove('is-in');
    void this.step.offsetWidth;
    this.step.classList.add('is-in');
  }

  setNext(on) { this._set('next', !!on, v => { this.next.hidden = !v; }); }

  // text : action devant la porte ; key : touche ('' sur tactile) ; more : précision.
  setPrompt(text, key, more) {
    this._set('prompt', text || '', v => { this.prompt.hidden = !v; this.promptT.textContent = v; });
    this._set('promptKey', key || '', v => { this.promptKey.textContent = v; this.promptKey.hidden = !v; });
    this._set('promptMore', more || '', v => { this.promptMore.textContent = v; this.promptMore.hidden = !v; });
  }

  setDialogue(text) {
    this._set('dialogue', text || '', v => { this.dialogue.hidden = !v; this.dialogue.textContent = v; });
  }

  setSound(on, volume) {
    this.sound.textContent = on ? 'Son : activé' : 'Son : coupé';
    this.sound.setAttribute('aria-pressed', on ? 'true' : 'false');
    this.volume.set(on, volume);
  }

  toast(kicker, title) {
    clearTimeout(this._toastTimer);
    this.toastK.textContent = kicker;
    this.toastT.textContent = title;
    this.toastEl.hidden = false;
    this.toastEl.classList.remove('is-in');
    void this.toastEl.offsetWidth;
    this.toastEl.classList.add('is-in');
    this._toastTimer = setTimeout(() => { this.toastEl.hidden = true; }, 2200);
  }

  // ── Écrans : récapitulatif, formulaire, confirmation ──
  _buildPanels(root) {
    const on = this.on;
    const panel = (id, title, ...children) => {
      const el = h('section.adv-brief.bp-panel', { hidden: true, role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': id },
        h('div.adv-brief__card.bp-panel__card', null,
          h('p.adv-brief__kicker', null, 'Construisez votre projet'),
          h('h2.adv-brief__title', { id }, title), children));
      el.addEventListener('keydown', (e) => trapTab(e, el));
      root.appendChild(el);
      return el;
    };
    const exit = () => h('a.bp-panel__exit', { href: on.home }, 'Revenir au portfolio');

    // Récapitulatif
    this.recapList = h('dl.bp-recap');
    this.recapStatus = h('p.adv-form__status', { role: 'status', 'aria-live': 'polite' });
    this.recapNext = h('button.adv-btn', { type: 'button', onclick: () => { if (!this._gate()) on.toForm(); else on.sfx('close'); } }, 'Continuer');
    this.recap = panel('bp-recap-title', 'Votre projet',
      this.recapList,
      h('div.adv-actions', null,
        h('button.adv-btn.adv-btn--ghost', { type: 'button', onclick: on.restart }, 'Tout recommencer'),
        this.recapNext),
      this.recapStatus, exit());

    // Formulaire
    const field = (label, attrs) => h('label', null, label, h(attrs.rows ? 'textarea' : 'input', attrs));
    this.msg = h('textarea', { name: 'client_message', rows: '4' });
    this.formStatus = h('p.adv-form__status', { role: 'status', 'aria-live': 'polite' });
    this.submit = h('button.adv-btn', { type: 'submit' }, 'Envoyer ma demande');
    this.form = h('form.adv-form', { novalidate: true, onsubmit: (e) => this._onSubmit(e) },
      field('Prénom *', { name: 'client_prenom', type: 'text', autocomplete: 'given-name', required: true }),
      field('Nom *', { name: 'client_nom', type: 'text', autocomplete: 'family-name', required: true }),
      field('Adresse e-mail *', { name: 'client_email', type: 'email', autocomplete: 'email', required: true }),
      field('Téléphone (facultatif)', { name: 'client_tel', type: 'tel', autocomplete: 'tel' }),
      h('label', null, 'Message, précisions supplémentaires', this.msg),
      // Champs attendus par le modèle EmailJS (le même que le formulaire de devis).
      h('input', { type: 'hidden', name: 'from_name' }),
      h('input', { type: 'hidden', name: 'from_email' }),
      h('input', { type: 'hidden', name: 'message' }),
      h('div.adv-actions', null,
        h('button.adv-btn.adv-btn--ghost', { type: 'button', onclick: on.toRecap }, 'Retour'),
        this.submit),
      this.formStatus);
    this.formPanel = panel('bp-form-title', 'Parlons de votre projet',
      h('p.adv-muted', null, 'Les champs marqués d\'un astérisque (*) sont obligatoires.'), this.form, exit());
    if (window.ContactForm) window.ContactForm.warm(this.form);

    // Confirmation
    this.done = panel('bp-done-title', 'Projet transmis',
      h('p.adv-brief__text', null, 'Merci pour votre demande. Je reviendrai vers vous rapidement.'),
      h('div.adv-actions', null, h('a.adv-btn', { href: on.home }, 'Retour au portfolio')));
  }

  // phase : 'recap' | 'form' | 'done' | null (retour au jeu)
  showPanel(phase) {
    this.recap.hidden = phase !== 'recap';
    this.formPanel.hidden = phase !== 'form';
    this.done.hidden = phase !== 'done';
    if (phase === 'recap') { this._renderRecap(); focusFirst(this.recapNext); }
    if (phase === 'form') { this._prefill(); focusFirst(this.form.client_prenom); }
    if (phase === 'done') focusFirst(this.done.querySelector('a'));
  }

  // Bloque « Continuer » tant qu'aucune étape n'a de réponse.
  _gate() {
    const empty = this.answers.empty;
    this.recapNext.disabled = empty;
    this.recapStatus.textContent = empty ? 'Choisissez au moins une réponse pour continuer.' : '';
    this.recapStatus.classList.toggle('is-error', empty);
    return empty;
  }

  _renderRecap() {
    clear(this.recapList);
    this._rows = STEPS.map((step, i) => {
      const value = h('dd', null, this.answers.recap(step));
      const choices = h('div.bp-recap__choices', { hidden: true });
      const edit = h('button.adv-btn.adv-btn--ghost.adv-btn--small', { type: 'button', 'aria-expanded': 'false', onclick: () => this._toggleEditor(i) }, 'Modifier');
      this.recapList.appendChild(h('div.bp-recap__row', null,
        h('div.bp-recap__head', null, h('dt', null, step.recapLabel), edit), value, choices));
      return { value, choices, edit };
    });
    this._gate();
  }

  _refresh(i) {
    this._rows[i].value.textContent = this.answers.recap(STEPS[i]);
    this._gate();
  }

  // Un seul éditeur ouvert à la fois.
  _toggleEditor(i) {
    const open = !this._rows[i].choices.hidden;
    this._rows.forEach(r => { r.choices.hidden = true; clear(r.choices); r.edit.setAttribute('aria-expanded', 'false'); });
    this.on.sfx(open ? 'close' : 'open');
    if (open) return;
    this._rows[i].edit.setAttribute('aria-expanded', 'true');
    this._rows[i].choices.hidden = false;
    this._renderChoices(i);
  }

  _renderChoices(i) {
    const step = STEPS[i], a = this.answers, box = this._rows[i].choices;
    clear(box);
    const chip = (label, isOn, run) => h('button.bp-chip' + (isOn ? '.is-on' : ''), { type: 'button', 'aria-pressed': isOn ? 'true' : 'false', onclick: run }, label);
    for (const door of step.doors) {
      if (door.special === 'done') continue;
      if (door.special === 'unknown') {
        box.appendChild(chip(door.label, a.data.featuresUnknown, () => { a.setUnknown(); this.on.sfx('ui'); this._renderChoices(i); this._refresh(i); }));
      } else if (step.multi) {
        box.appendChild(chip(door.label, a.isSelected(step, door), () => { a.toggle(door.value); this.on.sfx('ui'); this._renderChoices(i); this._refresh(i); }));
      } else {
        // Choix unique : un clic remplace la valeur et referme l'éditeur.
        box.appendChild(chip(door.label, a.isSelected(step, door), () => { a.pick(step, door.value); this.on.sfx('collect'); this._refresh(i); this._toggleEditor(i); }));
      }
    }
    if (step.multi) box.appendChild(h('button.adv-btn.adv-btn--small', { type: 'button', onclick: () => this._toggleEditor(i) }, 'Terminé'));
  }

  _prefill() {
    const f = this.form, d = this.answers.data, c = d.contact || {};
    f.client_prenom.value = c.prenom || '';
    f.client_nom.value = c.nom || '';
    f.client_email.value = c.email || '';
    f.client_tel.value = c.tel || '';
    this.msg.value = d.message || '';
    const other = d.projectType === 'Autre' || d.need === 'Autre' || d.features.includes('Autre');
    this.msg.placeholder = other
      ? 'Vous avez choisi « Autre » : précisez ici ce dont vous avez besoin.'
      : 'Un détail, une contrainte, une date… (facultatif)';
    this._status('');
  }

  _status(text, error) {
    this.formStatus.textContent = text;
    this.formStatus.classList.toggle('is-error', !!error);
  }

  async _onSubmit(e) {
    e.preventDefault();
    const f = this.form, a = this.answers;
    const prenom = f.client_prenom.value.trim(), nom = f.client_nom.value.trim();
    const email = f.client_email.value.trim(), tel = f.client_tel.value.trim();

    if (!prenom || !nom || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      this._status('Merci d\'indiquer votre prénom, votre nom et une adresse e-mail valide.', true);
      (!prenom ? f.client_prenom : !nom ? f.client_nom : f.client_email).focus();
      return;
    }
    a.data.contact = { prenom, nom, email, tel };
    a.data.message = this.msg.value.trim();
    a.save();
    if (a.empty) {
      this._status('Choisissez au moins une réponse dans les étapes précédentes avant d\'envoyer votre demande.', true);
      return;
    }

    f.from_name.value = (prenom + ' ' + nom).trim();
    f.from_email.value = email;
    f.message.value = a.summary();
    this.submit.disabled = true;
    this.submit.textContent = 'Envoi…';
    this._status('');
    try {
      await window.ContactForm.sendForm(f);
      a.clear();
      this.on.sent();
    } catch (err) {
      console.error('EmailJS error:', err);
      this._status('L\'envoi a échoué. Vérifiez votre connexion et réessayez, ou écrivez à ' + CONTACT_EMAIL, true);
    }
    this.submit.disabled = false;
    this.submit.textContent = 'Envoyer ma demande';
  }
}
