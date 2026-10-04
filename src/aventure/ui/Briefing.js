/* BRIEFING.JS : « Comment explorer », très court, avant de prendre la main. */

import { h, focusFirst, trapTab } from './dom.js';
import { isTouchUI } from '../core/Input.js';

const KEYS = [
  ['← → / A D', 'Se déplacer'],
  ['ESPACE', 'Sauter'],
  ['↑ / ENTRÉE', 'Interagir'],
  ['ESC / P', 'Menu'],
];
const TOUCH = [
  ['◀ ▶', 'Se déplacer'],
  ['SAUT', 'Sauter'],
  ['ENTRER', 'Interagir'],
  ['MENU', 'Menu, en haut de l\'écran'],
];

export function keyList(cls = 'adv-keys') {
  return h('dl.' + cls, null, (isTouchUI() ? TOUCH : KEYS).map(k =>
    h('div', null, h('dt', null, h('kbd', null, k[0])), h('dd', null, k[1]))));
}

export class Briefing {
  // opts : { onStart(), onBack() }
  constructor(root, opts) {
    this.kicker = h('p.adv-brief__kicker');
    this.start = h('button.adv-btn.adv-btn--big', { type: 'button', onclick: () => opts.onStart() }, 'COMMENCER L\'EXPÉRIENCE');
    this.el = h('section.adv-brief', { role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'adv-brief-title', hidden: true },
      h('div.adv-brief__card', null,
        this.kicker,
        h('h2.adv-brief__title', { id: 'adv-brief-title' }, 'COMMENT EXPLORER'),
        keyList(),
        h('p.adv-brief__text', null, 'Explorez l\'univers. Découvrez mon profil, mon parcours, mes compétences et mes projets.'),
        h('div.adv-brief__actions', null,
          this.start,
          h('button.adv-btn.adv-btn--ghost', { type: 'button', onclick: () => opts.onBack() }, 'Changer d\'univers'))));
    this.el.addEventListener('keydown', (e) => trapTab(e, this.el));
    root.appendChild(this.el);
  }

  get isOpen() { return !this.el.hidden; }

  show(universe) {
    this.kicker.textContent = universe.name + ' · ' + universe.category;
    this.el.hidden = false;
    focusFirst(this.start);
  }

  hide() { this.el.hidden = true; }
}
