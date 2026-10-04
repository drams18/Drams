/* ══════════════════════════════════════════════════════
   ENDSCREEN.JS : « Expérience terminée »
   Les quatre volets du portfolio, puis les suites utiles à un recruteur :
   CV et contact d'abord, projets, mode classique, ou continuer d'explorer.
   ══════════════════════════════════════════════════════ */

import { h, clear, focusFirst, trapTab } from './dom.js';

export class EndScreen {
  /* opts : { portfolio, save, vocabulary(), onOpen(view), onContact(), onClassic(e), onContinue(), onPortal() } */
  constructor(root, opts) {
    this.o = opts;
    this.tiles = h('div.adv-end__tiles');
    this.kicker = h('p.adv-end__kicker');
    this.cv = h('a.adv-btn.adv-btn--big', { href: 'assets/CV.pdf', target: '_blank', rel: 'noopener' }, 'VOIR LE CV');
    this.el = h('div.adv-end', { role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'adv-end-title', hidden: true },
      h('div.adv-end__card', null,
        this.kicker,
        h('h2.adv-end__title', { id: 'adv-end-title' }, 'EXPÉRIENCE TERMINÉE'),
        this.tiles,
        h('div.adv-end__actions', null,
          this.cv,
          h('button.adv-btn.adv-btn--big.adv-btn--alt', { type: 'button', onclick: () => opts.onContact() }, 'ME CONTACTER'),
          h('button.adv-btn', { type: 'button', onclick: () => opts.onOpen('projets') }, 'VOIR LES PROJETS'),
          h('a.adv-btn.adv-btn--ghost', { href: '/classique', onclick: (e) => opts.onClassic(e) }, 'MODE CLASSIQUE'),
          h('button.adv-btn.adv-btn--ghost', { type: 'button', onclick: () => opts.onContinue() }, 'EXPLORER À NOUVEAU')),
        h('p.adv-end__more', null, 'Un projet de site ou d\'application ? ',
          h('button.adv-link', { type: 'button', onclick: () => opts.onPortal() }, 'Construisez votre projet'))));
    this.el.addEventListener('keydown', (e) => trapTab(e, this.el));
    root.appendChild(this.el);
  }

  get isOpen() { return !this.el.hidden; }

  show() {
    const o = this.o, v = o.vocabulary(), p = o.portfolio, d = o.save.data;
    this.kicker.textContent = d.visitedLocations.length + '/4 ' + v.places;
    clear(this.tiles);
    const tile = (view, label, stat) => h('button.adv-end__tile', { type: 'button', onclick: () => o.onOpen(view) },
      h('b', null, label), h('span', null, stat));
    this.tiles.append(
      tile('profile', 'PROFIL', p.profile.title),
      tile('parcours', 'PARCOURS', p.experiences.length + ' étapes'),
      tile('skills', 'COMPÉTENCES', d.collectedSkills.length + '/' + p.skills.length + ' trouvées'),
      tile('projets', 'PROJETS', p.projects.length + ' projets, ' + d.viewedProjects.length + ' consultés'));
    this.el.hidden = false;
    focusFirst(this.cv);
  }

  hide() { this.el.hidden = true; }
}
