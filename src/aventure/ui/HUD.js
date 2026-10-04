/* ══════════════════════════════════════════════════════
   HUD.JS : interface de jeu, entièrement en DOM (nette à tous les zooms,
   lisible sur mobile, accessible au clavier). Le canvas ne dessine que
   le monde.

     objectif · progression · lieu · invite d'interaction · retours
     barre : Mode classique · Contact · Menu (toujours accessibles)

   N'écrit dans la page que lorsqu'une valeur change.
   ══════════════════════════════════════════════════════ */

import { h } from './dom.js';

export class HUD {
  // on : { objective, skills, interact, tarifs, contact, menu, classic }
  constructor(root, on) {
    this._last = Object.create(null);
    this._toastTimer = 0;

    this.objK = h('span.adv-hud__k');
    this.objT = h('span.adv-hud__goal-txt');
    this.objD = h('span.adv-hud__goal-dir', { 'aria-hidden': 'true' });
    this.objective = h('button.adv-hud__goal', { type: 'button', title: 'Y aller directement', onclick: on.objective },
      this.objK, this.objT, this.objD);

    this.places = h('b');
    this.placesK = h('span.adv-hud__k');
    this.skills = h('b');
    this.skillsK = h('span.adv-hud__k');
    this.progress = h('div.adv-hud__progress', null,
      h('p.adv-hud__count', null, this.placesK, ' ', this.places),
      h('button.adv-hud__count', { type: 'button', title: 'Voir la liste', onclick: on.skills }, this.skillsK, ' ', this.skills));

    this.zone = h('p.adv-hud__zone', { 'aria-live': 'polite' });

    this.classic = h('a.adv-btn.adv-btn--ghost', { href: '/classique', title: 'Passer en mode classique, à l\'endroit que vous regardez', onclick: on.classic }, 'Mode classique');
    this.bar = h('div.adv-hud__bar', null,
      this.classic,
      h('button.adv-btn.adv-btn--ghost', { type: 'button', onclick: on.contact }, 'Contact'),
      h('button.adv-btn', { type: 'button', 'aria-haspopup': 'dialog', title: 'Menu (Échap)', onclick: on.menu }, 'Menu'));

    this.promptKey = h('kbd');
    this.promptT = h('span');
    this.promptBtn = h('button.adv-hud__prompt-main', { type: 'button', onclick: on.interact }, this.promptKey, this.promptT);
    this.promptMore = h('a.adv-hud__prompt-more', { href: '/tarifs' }, 'Voir les tarifs');
    this.prompt = h('div.adv-hud__prompt', { hidden: true }, this.promptBtn, this.promptMore);

    this.dialogue = h('p.adv-hud__dialogue', { hidden: true, role: 'status' });

    this.toastK = h('span.adv-toast__k');
    this.toastT = h('b.adv-toast__t');
    this.toastD = h('span.adv-toast__d');
    this.toastA = h('button.adv-btn.adv-btn--small', { type: 'button' });
    this.toastEl = h('div.adv-toast', { role: 'status', hidden: true },
      h('div', null, this.toastK, this.toastT, this.toastD), this.toastA);
    this._toastAction = null;
    this.toastA.addEventListener('click', () => { const fn = this._toastAction; this.hideToast(); if (fn) fn(); });

    this.el = h('div.adv-hud', { hidden: true },
      h('div.adv-hud__top', null, h('div.adv-hud__left', null, this.objective, this.progress), this.bar),
      this.zone, this.toastEl, this.dialogue, this.prompt);
    root.appendChild(this.el);
  }

  show(on) { this.el.hidden = !on; }

  setVocabulary(v) {
    this.objK.textContent = v.objective;
    this.placesK.textContent = v.places;
    this.skillsK.textContent = v.skills;
  }

  _set(key, value, fn) {
    if (this._last[key] === value) return;
    this._last[key] = value;
    fn(value);
  }

  setObjective(text, dir) {
    this._set('obj', text, v => { this.objT.textContent = v; });
    this._set('dir', dir, v => { this.objD.textContent = v; });
  }

  setProgress(places, totalPlaces, skills, totalSkills) {
    this._set('places', places + '/' + totalPlaces, v => { this.places.textContent = v; });
    this._set('skills', skills + '/' + totalSkills, v => { this.skills.textContent = v; });
  }

  setZone(name) {
    this._set('zone', name, v => {
      this.zone.textContent = v;
      this.zone.classList.remove('is-in');
      void this.zone.offsetWidth;
      if (v) this.zone.classList.add('is-in');
    });
  }

  // key : touche affichée ('' sur tactile) ; more : lien « Voir les tarifs » (portail).
  setPrompt(text, key, more) {
    this._set('prompt', text || '', v => {
      this.prompt.hidden = !v;
      this.promptT.textContent = v;
    });
    this._set('promptKey', key || '', v => { this.promptKey.textContent = v; this.promptKey.hidden = !v; });
    this._set('promptMore', !!more, v => { this.promptMore.hidden = !v; });
  }

  setDialogue(text) {
    this._set('dialogue', text || '', v => {
      this.dialogue.hidden = !v;
      this.dialogue.textContent = v;
    });
  }

  // { kicker, title, text, action: { label, run } }
  toast(o) {
    clearTimeout(this._toastTimer);
    this.toastK.textContent = o.kicker || '';
    this.toastT.textContent = o.title || '';
    this.toastD.textContent = o.text || '';
    this._toastAction = o.action ? o.action.run : null;
    this.toastA.hidden = !o.action;
    if (o.action) this.toastA.textContent = o.action.label;
    this.toastEl.hidden = false;
    this.toastEl.classList.remove('is-in');
    void this.toastEl.offsetWidth;
    this.toastEl.classList.add('is-in');
    this._toastTimer = setTimeout(() => this.hideToast(), o.action ? 6000 : 3600);
  }

  hideToast() {
    clearTimeout(this._toastTimer);
    this.toastEl.hidden = true;
  }
}
