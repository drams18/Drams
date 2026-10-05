/* ══════════════════════════════════════════════════════
   PAUSEMENU.JS : le menu de pause

   REPRENDRE · CARTE · PROGRESSION · COMPÉTENCES · CV · TARIFS · CONTACT ·
   COMMANDES · SON (+ jauge de volume) · CHANGER D'UNIVERS · MODE CLASSIQUE · RECOMMENCER

   Carte, progression, compétences et commandes s'affichent dans le volet
   de droite ; les autres entrées agissent directement.
   ══════════════════════════════════════════════════════ */

import { h, clear, focusFirst, trapTab } from './dom.js';
import { keyList } from './Briefing.js';
import { volumeControl } from './VolumeControl.js';

export class PauseMenu {
  /* opts : { portfolio, save, vocabulary(), level(), onResume(), onGoto(loc), onSkill(id), onContact(),
              onSound(), onVolume(v), onMotion(), onUniverse(), onClassic(e), onRestart() } */
  constructor(root, opts) {
    this.o = opts;
    this.panel = h('div.adv-pause__panel', { 'aria-live': 'polite' });
    this.sound = h('button.adv-pause__item', { type: 'button', onclick: () => { opts.onSound(); } });
    this.volume = volumeControl('adv-vol--pause', (v) => opts.onVolume(v));
    this.restart = h('button.adv-pause__item.adv-pause__item--danger', { type: 'button', onclick: () => this._restart() }, 'RECOMMENCER');
    this.skillsBtn = h('button.adv-pause__item', { type: 'button', onclick: () => this._view('skills') });
    this.classic = h('a.adv-pause__item', { href: '/classique', onclick: (e) => opts.onClassic(e) }, 'MODE CLASSIQUE');
    this.resume = h('button.adv-pause__item.adv-pause__item--main', { type: 'button', onclick: () => opts.onResume() }, 'REPRENDRE');

    this.menu = h('nav.adv-pause__menu', { 'aria-label': 'Menu' },
      this.resume,
      h('button.adv-pause__item', { type: 'button', onclick: () => this._view('map') }, 'CARTE'),
      h('button.adv-pause__item', { type: 'button', onclick: () => this._view('progress') }, 'PROGRESSION'),
      this.skillsBtn,
      h('a.adv-pause__item', { href: 'assets/CV.pdf', target: '_blank', rel: 'noopener' }, 'CV'),
      h('a.adv-pause__item', { href: '/tarifs' }, 'TARIFS'),
      h('button.adv-pause__item', { type: 'button', onclick: () => opts.onContact() }, 'CONTACT'),
      h('button.adv-pause__item', { type: 'button', onclick: () => this._view('keys') }, 'COMMANDES'),
      this.sound,
      this.volume.el,
      h('button.adv-pause__item', { type: 'button', onclick: () => opts.onUniverse() }, 'CHANGER D\'UNIVERS'),
      this.classic,
      this.restart);

    this.title = h('h2.adv-pause__title', { id: 'adv-pause-title' }, 'PAUSE');
    this.el = h('div.adv-pause', { role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'adv-pause-title', hidden: true },
      h('div.adv-pause__card', null, this.title, h('div.adv-pause__cols', null, this.menu, this.panel)));
    this.el.addEventListener('keydown', (e) => trapTab(e, this.el));
    this.el.addEventListener('pointerdown', (e) => { if (e.target === this.el) opts.onResume(); });
    root.appendChild(this.el);
  }

  get isOpen() { return !this.el.hidden; }

  setSound(on, volume) {
    this.sound.textContent = on ? 'SON : ACTIVÉ' : 'SON : COUPÉ';
    this.sound.setAttribute('aria-pressed', on ? 'true' : 'false');
    this.volume.set(on, volume);
  }

  open(view) {
    this.skillsBtn.textContent = this.o.vocabulary().skills;
    this.restart.textContent = 'RECOMMENCER';
    this.restart.dataset.armed = '';
    this.el.hidden = false;
    this._view(view || 'map');
    focusFirst(this.resume);
  }

  close() { this.el.hidden = true; clear(this.panel); }

  // Deux clics : le premier arme, le second efface la progression.
  _restart() {
    if (!this.restart.dataset.armed) {
      this.restart.dataset.armed = '1';
      this.restart.textContent = 'EFFACER LA PROGRESSION ? CONFIRMER';
      return;
    }
    this.o.onRestart();
  }

  _view(name) {
    const o = this.o, v = o.vocabulary(), save = o.save, p = o.portfolio;
    clear(this.panel);
    this.el.dataset.view = name;

    if (name === 'map') {
      const lv = o.level();
      this.panel.append(h('h3.adv-pause__h', null, 'CARTE'),
        h('p.adv-muted', null, 'Choisissez un lieu pour vous y rendre directement.'),
        h('ul.adv-pause__map', null, lv.ordered.concat([lv.portal]).map(l => h('li', null,
          h('button' + (l.visited ? '.is-done' : ''), { type: 'button', onclick: () => o.onGoto(l) },
            h('b', null, l.label),
            h('span', null, l.isPortal ? 'Votre projet, pas à pas' : v.hints[l.id]),
            h('em', null, l.isPortal ? (l.boost ? 'Ouvert' : 'Mini-jeu') : l.visited ? 'Visité' : 'À découvrir'))))));
    } else if (name === 'progress') {
      const row = (k, a, b) => h('li', null, h('span', null, k), h('b', null, a + '/' + b),
        h('i', { style: `--k:${b ? a / b : 0}` }));
      this.panel.append(h('h3.adv-pause__h', null, 'PROGRESSION'),
        h('ul.adv-pause__progress', null,
          row(v.places, save.data.visitedLocations.length, 4),
          row(v.skills, save.data.collectedSkills.length, p.skills.length),
          row(v.projects + ' consultés', save.data.viewedProjects.length, p.projects.length)),
        h('p.adv-muted', null, save.data.missionComplete
          ? 'Les quatre lieux sont visités. Tout reste consultable.'
          : 'Rien n\'est verrouillé : tout le portfolio est accessible depuis la carte.'));
    } else if (name === 'skills') {
      this.panel.append(h('h3.adv-pause__h', null, v.skills),
        h('ul.adv-pause__skills', null, p.skills.map(s => h('li', null,
          h('button' + (save.hasSkill(s.id) ? '.is-done' : ''), { type: 'button', onclick: () => o.onSkill(s.id) },
            h('b', null, s.name), h('span', null, s.category),
            h('em', null, s.relatedProjects.length + (s.relatedProjects.length > 1 ? ' projets' : ' projet')))))));
    } else {
      const motion = h('button.adv-btn.adv-btn--ghost.adv-btn--small', { type: 'button', onclick: () => { o.onMotion(); this._view('keys'); } },
        save.data.settings.reducedMotion ? 'Animations réduites : oui' : 'Animations réduites : non');
      this.panel.append(h('h3.adv-pause__h', null, 'COMMANDES'), keyList('adv-keys.adv-keys--compact'),
        h('p.adv-muted', null, 'Cliquer ou toucher un lieu : y aller directement. ↓ + saut : descendre d\'une plateforme.'),
        motion);
    }
  }
}
