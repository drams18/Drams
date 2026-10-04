/* ══════════════════════════════════════════════════════
   PORTFOLIOWINDOW.JS : la fenêtre de contenu du portfolio

   Cinq vues, identiques dans les trois univers (seuls les libellés
   changent) : profil, parcours, compétences, projets, contact.
   Les onglets permettent de tout lire sans marcher : rien d'essentiel
   n'est bloqué derrière la progression.

   Galerie : clavier (← →), clic, tactile, balayage.
   Contenu : portfolio/data.js (source : js/museum.js). Rien n'est inventé.
   ══════════════════════════════════════════════════════ */

import { h, clear, focusFirst, trapTab, link } from './dom.js';
import { techMatches } from '../portfolio/Skill.js';

export const VIEWS = ['profile', 'parcours', 'skills', 'projets', 'contact'];
const ROUTES = { profile: 'profil', parcours: 'parcours', skills: 'competences', projets: 'projets', contact: 'contact' };

const chips = (items, cls = 'adv-chip') => h('ul.adv-chips', null, items.map(i => h('li.' + cls, null, i)));

export class PortfolioWindow {
  // opts : { portfolio, save, vocabulary(), sfx(name), onOpen(view), onClose(view), onProject(slug) }
  constructor(root, opts) {
    this.o = opts;
    this.p = opts.portfolio;
    this.view = null;
    this.slug = null;          // projet ou étape affiché
    this.skillId = null;
    this._idx = 0;
    this._shot = 0;
    this._restore = null;

    this.kicker = h('p.adv-win__kicker');
    this.title = h('h2.adv-win__title', { id: 'adv-win-title' });
    this.tabs = h('nav.adv-win__tabs', { 'aria-label': 'Sections du portfolio' });
    this.body = h('div.adv-win__body', { tabindex: '-1' });
    this.closeBtn = h('button.adv-btn.adv-btn--ghost.adv-win__close', { type: 'button', onclick: () => this.close() }, 'Fermer');
    this.card = h('div.adv-win__card', null,
      h('header.adv-win__head', null, h('div', null, this.kicker, this.title), this.closeBtn),
      this.tabs, this.body);
    this.el = h('div.adv-win', { role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'adv-win-title', hidden: true }, this.card);
    root.appendChild(this.el);

    this.el.addEventListener('pointerdown', (e) => { if (e.target === this.el) this.close(); });
    this.el.addEventListener('keydown', (e) => this._onKey(e));
  }

  get isOpen() { return !this.el.hidden; }

  // Fragment d'URL de ce qui est affiché (grammaire commune : js/deeplink.js).
  route() {
    if (!this.isOpen) return '';
    return '#' + ROUTES[this.view] + (this.slug && (this.view === 'projets' || this.view === 'parcours') ? '/' + this.slug : '');
  }

  open(view, opts = {}) {
    if (!VIEWS.includes(view)) return;
    const wasOpen = this.isOpen;
    if (!wasOpen) this._restore = document.activeElement;
    this.view = view;
    this.slug = opts.slug || null;
    this.skillId = opts.skill || null;
    this.el.hidden = false;
    this.el.classList.remove('is-in');
    void this.el.offsetWidth;
    this.el.classList.add('is-in');
    this._render();
    this.body.scrollTop = 0;
    focusFirst(this.body);
    this.o.sfx(wasOpen ? 'ui' : 'open');
    this.o.onOpen(view, !wasOpen);
  }

  close() {
    if (!this.isOpen) return;
    const view = this.view;
    this.el.hidden = true;
    clear(this.body);
    this.o.sfx('close');
    if (this._restore && this._restore.blur) this._restore.blur();
    this.o.onClose(view);
  }

  _onKey(e) {
    trapTab(e, this.card);
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); this.close(); return; }
    const tag = e.target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    if (this.view === 'projets' && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
      e.preventDefault();
      this._step(e.key === 'ArrowRight' ? 1 : -1);
    }
  }

  _render() {
    const v = this.o.vocabulary();
    const labels = {
      profile: v.locations.profile, parcours: v.locations.parcours, skills: v.skills,
      projets: v.locations.projets, contact: v.locations.contact,
    };
    const plain = { profile: 'Profil', parcours: 'Parcours', skills: 'Compétences', projets: 'Projets', contact: 'Contact' };
    this.kicker.textContent = labels[this.view];
    this.title.textContent = plain[this.view];

    clear(this.tabs);
    for (const id of VIEWS) {
      this.tabs.appendChild(h('button.adv-win__tab' + (id === this.view ? '.is-current' : ''), {
        type: 'button', 'aria-current': id === this.view ? 'page' : null,
        onclick: () => { if (id !== this.view) this.open(id); },
      }, plain[id]));
    }

    clear(this.body);
    this.body.className = 'adv-win__body adv-win__body--' + this.view;
    this['_' + this.view]();
  }

  // ── Profil ───────────────────────────────────────────
  _profile() {
    const p = this.p.profile;
    this.body.append(
      h('div.adv-profile__id', null,
        h('p.adv-profile__name', null, p.name),
        h('p.adv-profile__role', null, p.title),
        h('p.adv-profile__meta', null, p.location + ' · ' + p.availability),
        h('p.adv-badge', null, p.seeking)),
      h('p.adv-lead', null, p.description),
      p.positioning && h('p', null, p.positioning),
      p.aboutStack && h('p', null, p.aboutStack),
      h('div.adv-actions', null,
        link('adv-btn', p.cv, 'Voir le CV', true),
        h('button.adv-btn.adv-btn--alt', { type: 'button', onclick: () => this.open('contact') }, 'Me contacter'),
        h('button.adv-btn.adv-btn--ghost', { type: 'button', onclick: () => this.open('projets') }, 'Voir les projets')),
      h('h3.adv-h', null, 'Spécialités'),
      h('div.adv-groups', null, p.skillGroups.map(g => h('section', null, h('h4.adv-h4', null, g.label), chips(g.items)))),
      h('h3.adv-h', null, 'Ce que j\'apporte'),
      chips(p.qualities),
      h('h3.adv-h', null, 'Langues'),
      chips(p.languages.map(l => l.label + ' · ' + l.level)),
      h('h3.adv-h', null, 'Liens'),
      h('div.adv-actions', null, p.socials.map(s => link('adv-btn.adv-btn--ghost', s.url, s.label, true))),
    );
  }

  // ── Parcours ─────────────────────────────────────────
  _parcours() {
    const list = h('ol.adv-timeline');
    let target = null;
    for (const s of this.p.experiences) {
      const li = h('li.adv-step' + (s.slug === this.slug ? '.is-target' : ''), { id: 'adv-step-' + s.slug },
        h('div.adv-step__head', null,
          s.logo && h('img.adv-step__logo', { src: s.logo, alt: '', loading: 'lazy', onerror: (e) => e.target.remove() }),
          h('div', null,
            h('p.adv-step__meta', null, h('span.adv-tag', null, s.kind), ' ', s.date),
            h('h3.adv-step__title', null, s.title),
            s.place && h('p.adv-step__place', null, s.place))),
        h('p', null, s.desc),
        s.details.length ? h('ul.adv-list', null, s.details.map(d => h('li', null, d))) : null,
        s.context && h('p', null, s.context),
        s.role && h('p.adv-step__role', null, s.role),
        s.photos.length ? h('div.adv-step__photos', null, s.photos.map(ph =>
          h('img', { src: ph.src, alt: ph.alt, loading: 'lazy', onerror: (e) => e.target.remove() }))) : null);
      if (s.slug === this.slug) target = li;
      list.appendChild(li);
    }
    this.body.appendChild(list);
    if (this.p.milestones.length) {
      this.body.append(h('h3.adv-h', null, 'Jalons'),
        h('ul.adv-list', null, this.p.milestones.map(m => h('li', null, h('b', null, m.date), ' · ', m.title, m.desc ? ' : ' + m.desc : ''))));
    }
    if (target) requestAnimationFrame(() => target.scrollIntoView({ block: 'start' }));
  }

  // ── Compétences ──────────────────────────────────────
  _skills() {
    const v = this.o.vocabulary();
    const found = this.p.skills.filter(s => this.o.save.hasSkill(s.id)).length;
    const detail = h('div.adv-skill', { 'aria-live': 'polite' });
    const grid = h('div.adv-skills');
    const show = (skill, btn) => {
      this.skillId = skill.id;
      grid.querySelectorAll('.is-current').forEach(b => b.classList.remove('is-current'));
      if (btn) btn.classList.add('is-current');
      clear(detail);
      const n = skill.relatedProjects.length;
      detail.append(
        h('p.adv-skill__cat', null, skill.category),
        h('h3.adv-skill__name', null, skill.name),
        h('p', null, skill.description),
        h('h4.adv-h4', null, n ? `Projets associés (${n})` : 'Projets associés'),
        n ? h('div.adv-actions', null, skill.relatedProjects.map(pr =>
          h('button.adv-btn.adv-btn--ghost', { type: 'button', onclick: () => this.open('projets', { slug: pr.slug }) }, pr.title)))
          : h('p.adv-muted', null, 'Aucun projet de la galerie ne liste cette technologie.'));
    };
    for (const s of this.p.skills) {
      const got = this.o.save.hasSkill(s.id);
      const btn = h('button.adv-skillcard' + (got ? '.is-found' : ''), { type: 'button' },
        h('span.adv-skillcard__logo', { style: `--logo:url("${s.logo}")`, 'aria-hidden': 'true' }),
        h('b', null, s.name),
        h('span.adv-skillcard__cat', null, s.category),
        h('span.adv-skillcard__state', null, got ? 'Découvert dans le monde' : 'À trouver dans le monde'));
      btn.addEventListener('click', () => { this.o.sfx('ui'); show(s, btn); });
      grid.appendChild(btn);
      if (s.id === this.skillId) show(s, btn);
    }
    this.body.append(
      h('p.adv-lead', null, `${v.skills} : ${found}/${this.p.skills.length} trouvés dans le monde. Chaque fiche liste les projets qui utilisent la technologie.`),
      grid, detail,
      h('p.adv-muted', null, 'La liste complète de mes technologies est dans le Profil.'));
    if (!this.skillId) show(this.p.skills[0], grid.firstChild);
  }

  // ── Projets (galerie) ────────────────────────────────
  _projets() {
    const items = this.p.projects;
    const i = this.slug ? items.findIndex(p => p.slug === this.slug) : -1;
    this._idx = i >= 0 ? i : 0;
    this._shot = 0;

    this._strip = h('div.adv-gal__strip', { role: 'tablist', 'aria-label': 'Projets' });
    let cat = '';
    items.forEach((p, k) => {
      if (p.category !== cat) { cat = p.category; this._strip.appendChild(h('span.adv-gal__group', null, cat)); }
      this._strip.appendChild(h('button.adv-gal__tab', { type: 'button', role: 'tab', 'data-k': k, onclick: () => this._show(k) },
        p.short, p.pick ? h('span.adv-gal__pick', { title: 'À ne pas rater' }) : null));
    });

    this._count = h('span.adv-gal__count');
    this._stage = h('article.adv-gal__stage', { 'aria-live': 'polite' });
    const nav = h('div.adv-gal__nav', null,
      h('button.adv-btn.adv-btn--ghost', { type: 'button', 'aria-label': 'Projet précédent', onclick: () => this._step(-1) }, '← Précédent'),
      this._count,
      h('button.adv-btn.adv-btn--ghost', { type: 'button', 'aria-label': 'Projet suivant', onclick: () => this._step(1) }, 'Suivant →'));

    // Balayage horizontal (doigt ou souris).
    let sx = 0, sy = 0, tracking = false;
    this._stage.addEventListener('pointerdown', (e) => { sx = e.clientX; sy = e.clientY; tracking = true; });
    this._stage.addEventListener('pointerup', (e) => {
      if (!tracking) return;
      tracking = false;
      const dx = e.clientX - sx, dy = e.clientY - sy;
      if (Math.abs(dx) > 56 && Math.abs(dy) < 48 && !e.target.closest('a, button')) this._step(dx < 0 ? 1 : -1);
    });
    this._stage.addEventListener('pointercancel', () => { tracking = false; });

    this.body.append(this._strip, this._stage, nav);
    this._show(this._idx, true);
  }

  _step(d) {
    const n = this.p.projects.length;
    this._show((this._idx + d + n) % n);
  }

  _show(k, first) {
    const p = this.p.projects[k];
    this._idx = k;
    this._shot = 0;
    this.slug = p.slug;
    if (!first) this.o.sfx('ui');
    this._count.textContent = (k + 1) + ' / ' + this.p.projects.length;
    this._strip.querySelectorAll('.adv-gal__tab').forEach(b => {
      const on = Number(b.dataset.k) === k;
      b.classList.toggle('is-current', on);
      b.setAttribute('aria-selected', on ? 'true' : 'false');
      if (on && b.scrollIntoView) b.scrollIntoView({ block: 'nearest', inline: 'center' });
    });

    clear(this._stage);
    const shots = p.shots;
    let media = null;
    if (shots.length) {
      const img = h('img.adv-gal__img', { src: shots[0].src, alt: shots[0].alt, onerror: () => media.remove() });
      const cap = h('figcaption', null, shots[0].alt);
      const dots = shots.length > 1 ? h('div.adv-gal__dots', null, shots.map((s, n) =>
        h('button' + (n === 0 ? '.is-current' : ''), { type: 'button', 'aria-label': 'Capture ' + (n + 1) + ' : ' + s.alt, onclick: (e) => {
          this._shot = n; img.src = s.src; img.alt = s.alt; cap.textContent = s.alt;
          dots.querySelectorAll('button').forEach(b => b.classList.toggle('is-current', b === e.currentTarget));
        } }))) : null;
      media = h('figure.adv-gal__media' + (p.device === 'mobile' ? '.is-mobile' : ''), null, img, cap, dots);
    }

    const skills = this.p.skills;
    const tech = h('ul.adv-chips', null, p.tech.map(t => {
      const s = skills.find(x => techMatches(t, x.name));
      return s
        ? h('li', null, h('button.adv-chip.adv-chip--link', { type: 'button', title: 'Voir la fiche ' + s.name, onclick: () => this.open('skills', { skill: s.id }) }, t))
        : h('li.adv-chip', null, t);
    }));

    this._stage.append(
      media,
      h('div.adv-gal__info', null,
        h('p.adv-gal__meta', null,
          h('span.adv-tag', null, p.category), ' ', p.type, p.date ? ' · ' + p.date : '',
          ' ', h('span.adv-tag.adv-tag--state', null, p.status)),
        h('h3.adv-gal__title', null, p.title),
        h('p', null, p.desc),
        p.role && h('h4.adv-h4', null, 'Mon rôle'),
        p.role && h('p', null, p.role),
        p.result && h('h4.adv-h4', null, 'Résultat'),
        p.result && h('p', null, p.result),
        h('h4.adv-h4', null, 'Technologies'),
        tech,
        h('div.adv-actions', null,
          p.links.map(l => link('adv-btn', l.url, l.label, true)),
          p.github && link('adv-btn.adv-btn--ghost', p.github.url, 'GitHub', true),
          !p.links.length && !p.github ? h('span.adv-muted', null, 'Pas de lien public pour ce projet.') : null)));
    this._stage.scrollTop = 0;
    this.o.onProject(p.slug);

    // Précharge la couverture du projet suivant.
    const next = this.p.projects[(k + 1) % this.p.projects.length];
    if (next.shots.length) { const im = new Image(); im.src = next.shots[0].src; }
  }

  // ── Contact ──────────────────────────────────────────
  _contact() {
    const p = this.p.profile;
    const CW = window.ContactWidget;
    const mobile = CW ? CW.isMobile() : false;
    const copy = (value) => h('button.adv-btn.adv-btn--small.adv-btn--ghost', { type: 'button', onclick: async (e) => {
      const b = e.currentTarget;
      try { await navigator.clipboard.writeText(value); b.textContent = 'Copié'; }
      catch (err) { b.textContent = 'Copie impossible'; }
      setTimeout(() => { b.textContent = 'Copier'; }, 1500);
    } }, 'Copier');

    const status = h('p.adv-form__status', { role: 'status' });
    const submit = h('button.adv-btn', { type: 'submit' }, 'Envoyer');
    const form = h('form.adv-form', null,
      h('label', null, 'Votre nom', h('input', { type: 'text', name: 'from_name', required: true, autocomplete: 'name' })),
      h('label', null, 'Votre e-mail', h('input', { type: 'email', name: 'from_email', required: true, autocomplete: 'email' })),
      h('label', null, 'Votre message', h('textarea', { name: 'message', required: true, rows: '4' })),
      submit, status);
    if (window.ContactForm) window.ContactForm.warm(form);
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      submit.disabled = true; submit.textContent = 'Envoi…';
      status.textContent = ''; status.className = 'adv-form__status';
      try {
        await window.ContactForm.sendForm(form);
        status.textContent = 'Message envoyé. Merci, je vous réponds rapidement.';
        status.classList.add('is-ok');
        form.reset();
        this.o.sfx('discover');
      } catch (err) {
        console.error('EmailJS error:', err);
        status.textContent = 'Erreur lors de l\'envoi. Réessayez, ou écrivez-moi directement par e-mail.';
        status.classList.add('is-error');
      }
      submit.disabled = false; submit.textContent = 'Envoyer';
    });

    this.body.append(
      h('p.adv-lead', null, p.seeking),
      h('div.adv-contact', null,
        h('div.adv-contact__row', null, h('a.adv-contact__value', { href: 'mailto:' + p.email }, p.email), copy(p.email)),
        h('div.adv-contact__row', null,
          mobile ? h('a.adv-contact__value', { href: 'tel:' + p.phoneTel }, p.phone) : h('span.adv-contact__value', null, p.phone),
          copy(p.phone))),
      h('div.adv-actions', null,
        p.links.map(l => link('adv-btn.adv-btn--ghost', l.url, l.label, true)),
        link('adv-btn.adv-btn--ghost', '/tarifs', 'Voir les tarifs', false)),
      h('h3.adv-h', null, 'Envoyer un message'),
      form);
  }
}
