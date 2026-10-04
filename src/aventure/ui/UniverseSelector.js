/* ══════════════════════════════════════════════════════
   UNIVERSESELECTOR.JS : « Choisissez votre expérience »

   Trois cartes. Chaque miniature est une VRAIE vue de l'univers : son
   renderer, son niveau et son personnage, animés par le même moteur
   (aucune image à maintenir). Au survol / focus : le personnage accélère,
   la carte s'éclaire et se soulève. Au clic : transition vers le briefing.
   ══════════════════════════════════════════════════════ */

import { h, focusFirst } from './dom.js';
import { Camera } from '../core/Camera.js';
import { Level } from '../world/Level.js';
import { Character, STATES } from '../player/Character.js';
import { CharacterAnimator } from '../player/CharacterAnimator.js';
import { CharacterRenderer } from '../player/CharacterRenderer.js';

const PREVIEW_H = 400;      // unités monde visibles dans une miniature

// Une miniature : le personnage traverse son niveau, la caméra le suit.
class Preview {
  constructor(canvas, universe, portfolio) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.universe = universe;
    this.level = new Level(universe.createLevel(), universe, portfolio, [[]]);
    this.renderer = new universe.Renderer(universe);
    this.camera = new Camera();
    this.camera.configure({ ...universe.camera, zoom: 1, lookAhead: 0, deadX: 0, anchorY: 0.78 });
    this.body = new Character(this.level.spawn.x + 200, 0);
    this.animator = new CharacterAnimator(universe.character.player.animator);
    this.figure = new CharacterRenderer(universe.character.player.look);
    this.speed = 0.5;         // fraction de la vitesse max
    this.t = Math.random() * 10;
    this.state = { near: null };
    this.scale = 1;
  }

  resize() {
    const r = this.canvas.getBoundingClientRect();
    if (!r.width) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(r.width * dpr);
    this.canvas.height = Math.round(r.height * dpr);
    this.scale = this.canvas.height / PREVIEW_H;
    const viewW = this.canvas.width / this.scale;
    this.camera.setView(viewW, PREVIEW_H);
    const floor = PREVIEW_H * (1 - 0.78);
    this.camera.setBounds(0, this.level.width, this.level.top, floor);
    this.renderer.resize(this.canvas.width, this.canvas.height, this.scale, floor);
    this.camera.snap(this.body);
  }

  frame(dt, hot) {
    const max = this.universe.physics.maxSpeed;
    const b = this.body;
    this.speed += ((hot ? 1 : 0.42) - this.speed) * (1 - Math.exp(-5 * dt));
    b.vx = max * this.speed;
    b.x += b.vx * dt;
    b.state = this.speed > 0.8 ? STATES.RUN : STATES.WALK;
    if (b.x > this.level.width - 500) { b.x = 300; this.camera.snap(b); }
    this.t += dt;
    this.animator.update(dt, b, max);
    this.camera.update(dt, b);
    this.draw(dt);
  }

  draw(dt) {
    const ctx = this.ctx, r = this.renderer, cam = this.camera;
    if (!this.canvas.width) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    r.drawSky(ctx);
    cam.apply(ctx, this.scale);
    r.drawFar(ctx, cam, this.t);
    r.drawWorld(ctx, cam, this.t, this.level, this.state);
    this.figure.drawShadow(ctx, this.body);
    this.figure.draw(ctx, this.body, this.animator.pose, dt);
    r.drawFront(ctx, cam, this.t, this.level);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    r.drawOverlay(ctx, this.t);
  }
}

export class UniverseSelector {
  // opts : { universes, portfolio, save, onChoose(id), onSound(), onContact(), classicHref }
  constructor(root, opts) {
    this.o = opts;
    this.reduced = false;
    this._raf = 0;
    this._last = 0;
    this._hot = null;
    this._frame = this._frame.bind(this);
    this.previews = [];

    this.sound = h('button.adv-btn.adv-btn--ghost', { type: 'button', onclick: () => opts.onSound() });
    this.cards = h('div.adv-sel__cards');
    for (const u of opts.universes) {
      const canvas = h('canvas.adv-card__view', { 'aria-hidden': 'true' });
      const badge = h('span.adv-card__badge', { hidden: true }, 'Dernière visite');
      const card = h('button.adv-card', {
        type: 'button', 'data-universe': u.id,
        style: `--c-primary:${u.palette.primary};--c-accent:${u.palette.accent};--c-bg:${u.palette.bg};--c-text:${u.palette.text};--c-font:${u.fonts.display};--c-weight:${u.fonts.weight};--c-style:${u.fonts.style || 'normal'}`,
      },
        h('span.adv-card__frame', null, canvas, badge),
        h('span.adv-card__cat', null, u.category),
        h('span.adv-card__name', null, u.name),
        h('span.adv-card__tag', null, u.tagline),
        h('span.adv-card__cta', null, 'Entrer'));
      const hot = (on) => () => { this._hot = on ? u.id : (this._hot === u.id ? null : this._hot); };
      card.addEventListener('pointerenter', hot(true));
      card.addEventListener('pointerleave', hot(false));
      card.addEventListener('focus', hot(true));
      card.addEventListener('blur', hot(false));
      card.addEventListener('click', () => this._choose(u.id, card));
      card.addEventListener('keydown', (e) => {
        const all = Array.from(this.cards.children);
        const i = all.indexOf(card);
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); all[(i + 1) % all.length].focus(); }
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); all[(i - 1 + all.length) % all.length].focus(); }
      });
      this.cards.appendChild(card);
      this.previews.push({ id: u.id, card, badge, universe: u, canvas, preview: null });
    }

    this.el = h('section.adv-sel', { hidden: true, 'aria-labelledby': 'adv-sel-title' },
      h('header.adv-sel__head', null,
        h('p.adv-sel__kicker', null, 'PORTFOLIO · MODE AVENTURE'),
        h('h1.adv-sel__title', { id: 'adv-sel-title' }, 'Choisissez votre expérience'),
        h('p.adv-sel__lead', null, 'Trois univers, un même portfolio : profil, parcours, compétences et projets.')),
      this.cards,
      h('footer.adv-sel__foot', null,
        h('a.adv-btn.adv-btn--ghost', { href: opts.classicHref }, 'Mode classique'),
        this.sound,
        h('a.adv-btn.adv-btn--ghost', { href: 'assets/CV.pdf', target: '_blank', rel: 'noopener' }, 'CV'),
        h('button.adv-btn.adv-btn--ghost', { type: 'button', onclick: () => opts.onContact() }, 'Contact')));
    root.appendChild(this.el);

    window.addEventListener('resize', () => { if (!this.el.hidden) this._resize(); });
    document.addEventListener('visibilitychange', () => { if (!document.hidden && !this.el.hidden) this._start(); });
  }

  setSound(on) { this.sound.textContent = on ? 'Son : activé' : 'Son : coupé'; this.sound.setAttribute('aria-pressed', on ? 'true' : 'false'); }

  show() {
    const last = this.o.save.data.universe;
    const resume = this.o.save.hasProgress;
    this.el.hidden = false;
    this.el.classList.remove('is-out');
    for (const p of this.previews) {
      p.card.classList.remove('is-chosen');
      p.card.disabled = false;
      p.badge.hidden = p.id !== last;
      p.badge.textContent = resume ? 'Reprendre' : 'Dernière visite';
      if (!p.preview) p.preview = new Preview(p.canvas, p.universe, this.o.portfolio);
      p.preview.renderer.reduced = this.reduced;
    }
    this._resize();
    const first = this.previews.find(p => p.id === last) || this.previews[0];
    focusFirst(first.card);
    this._start();
  }

  hide() {
    this.el.hidden = true;
    this._stop();
    // Libère les tampons des miniatures.
    for (const p of this.previews) { if (p.preview) p.preview.renderer.invalidate(); p.preview = null; }
  }

  invalidate() {
    for (const p of this.previews) if (p.preview) p.preview.renderer.invalidate();
  }

  _resize() {
    for (const p of this.previews) if (p.preview) { p.preview.resize(); p.preview.draw(0); }
  }

  _start() {
    if (this._raf || this.el.hidden) return;
    this._last = 0;
    this._raf = requestAnimationFrame(this._frame);
  }
  _stop() {
    if (this._raf) cancelAnimationFrame(this._raf);
    this._raf = 0;
  }

  _frame(now) {
    this._raf = 0;
    if (this.el.hidden || document.hidden) return;
    const dt = this._last ? Math.min(0.05, (now - this._last) / 1000) : 0.016;
    this._last = now;
    // Mouvement réduit : une image fixe, redessinée seulement au besoin.
    if (!this.reduced) {
      for (const p of this.previews) if (p.preview) p.preview.frame(dt, this._hot === p.id);
      this._raf = requestAnimationFrame(this._frame);
    }
  }

  _choose(id, card) {
    if (this.el.classList.contains('is-out')) return;
    this.el.classList.add('is-out');
    card.classList.add('is-chosen');
    for (const p of this.previews) p.card.disabled = true;
    this.o.onChoose(id);
  }
}
