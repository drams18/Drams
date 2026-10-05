/* ══════════════════════════════════════════════════════
   GAME.JS : chef d'orchestre du mode aventure

   Un seul moteur pour les trois univers. Game relie la boucle, la caméra,
   l'input, le monde, le joueur, la sauvegarde, l'audio et l'interface, et
   tient la machine à états :

     select → briefing → intro (travelling) → play
     play ⇄ entering → window        (entrée dans un lieu, contenu)
     play ⇄ paused · play → end      (menu, expérience terminée)
     play → travel → play            (déplacement rapide)
     play → leaving                  (portail, mode classique)

   La boucle ne tourne que pendant intro / play / entering / travel :
   sélecteur, pause, fenêtre et fin la suspendent (0 % CPU derrière un panneau).
   ══════════════════════════════════════════════════════ */

import { GameLoop } from './GameLoop.js';
import { Camera } from './Camera.js';
import { Input, isTouchUI } from './Input.js';
import { SaveManager, LOCATION_IDS, DEFAULT_VOLUME } from './SaveManager.js';
import { Character } from '../player/Character.js';
import { CharacterController } from '../player/CharacterController.js';
import { CharacterAnimator } from '../player/CharacterAnimator.js';
import { CharacterRenderer } from '../player/CharacterRenderer.js';
import { Level } from '../world/Level.js';
import { World } from '../world/World.js';
import { UniverseManager, DEFAULT_UNIVERSE } from '../universes/UniverseManager.js';
import { ParticleSystem } from '../effects/ParticleSystem.js';
import { ScreenEffects } from '../effects/ScreenEffects.js';
import { UniverseAudio } from '../audio/UniverseAudio.js';
import { HUD } from '../ui/HUD.js';
import { TouchControls } from '../ui/TouchControls.js';
import { PortfolioWindow } from '../ui/PortfolioWindow.js';
import { PauseMenu } from '../ui/PauseMenu.js';
import { EndScreen } from '../ui/EndScreen.js';
import { UniverseSelector } from '../ui/UniverseSelector.js';
import { Briefing } from '../ui/Briefing.js';

const VIEW_H = 620;          // unités monde visibles en hauteur (paysage)
const MIN_VIEW_W = 470;      // largeur minimale visible (portrait)
const MAX_PX = 2560;         // largeur maximale du tampon du canvas
const ENTER_TIME = 0.36;     // s : entrée dans un lieu
const WALK_RANGE = 1000;     // au-delà : déplacement rapide plutôt que marche
const damp = (rate, dt) => 1 - Math.exp(-rate * dt);

export class Game {
  constructor({ root, canvas, ui, portfolio }) {
    this.root = root;
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.portfolio = portfolio;
    this.state = 'boot';
    this.capture = false;

    this.save = new SaveManager();
    this.universes = new UniverseManager(root);
    this.universe = null;
    this.level = null;
    this.world = null;
    this.renderer = null;

    this.input = new Input();
    this.camera = new Camera();
    this.particles = new ParticleSystem(160);
    this.audio = new UniverseAudio();
    this.fx = new ScreenEffects(root);
    this.loop = new GameLoop({ update: (dt) => this.update(dt), render: (dt, t) => this.render(dt, t) });
    this.loop.pause();          // démarre suspendue : rien à simuler avant le choix d'un univers
    this.loop.start();

    this.player = new Character();
    this.controller = new CharacterController(this.player, null, {});
    this.animator = new CharacterAnimator();
    this.figure = new CharacterRenderer({});
    this.npcFigures = [];
    this.intent = { axis: 0, jumpPressed: false, jumpHeld: false, down: false };
    this.touchUI = isTouchUI();

    this._rs = { near: null };     // état passé au renderer
    this._near = null;
    this._opened = null;           // lieu dont la porte est ouverte
    this._enter = null;            // { loc, t }
    this._auto = null;             // marche automatique { x, target, stuck, lastX }
    this._newVisit = null;
    this._endIn = 0;
    this._pt = { x: 0, y: 0 };

    this._buildUI(ui);
    this._bind();
    this._applyMotion();
    this.audio.setVolume(this.save.data.settings.volume);
    this._applySound(this.save.data.settings.sound, false);
  }

  // ── Interface ────────────────────────────────────────
  _buildUI(ui) {
    const vocabulary = () => this.universe.vocabulary;
    const sfx = (name) => this.audio.sfx(name);

    this.hud = new HUD(ui, {
      objective: () => { const o = this._objective(); if (o) this.goTo(o); else this.togglePause('map'); },
      skills: () => this.openWindow('skills'),
      interact: () => { if (this.state === 'play' && this._near) this.enter(this._near); },
      contact: () => this.openWindow('contact'),
      menu: () => this.togglePause(),
      classic: (e) => this.toClassic(e),
    });
    this.touch = new TouchControls(ui, this.input);

    this.win = new PortfolioWindow(ui, {
      portfolio: this.portfolio, save: this.save, vocabulary, sfx,
      onOpen: (view) => this._onWindowOpen(view),
      onClose: () => this._onWindowClose(),
      onProject: (slug) => { this.save.viewProject(slug); this._setHash(this.win.route()); },
    });

    this.pause = new PauseMenu(ui, {
      portfolio: this.portfolio, save: this.save, vocabulary, level: () => this.level,
      onResume: () => this.togglePause(),
      onGoto: (loc) => { this._resumeFrom('paused'); this.goTo(loc); },
      onSkill: (id) => this.openWindow('skills', { skill: id }),
      onContact: () => this.openWindow('contact'),
      onSound: () => this.toggleSound(),
      onVolume: (v) => this.setVolume(v),
      onMotion: () => { this.save.setSetting('reducedMotion', !this.save.data.settings.reducedMotion); this._applyMotion(); },
      onUniverse: () => this.showSelector(true),
      onClassic: (e) => this.toClassic(e),
      onRestart: () => this.restart(),
    });

    this.end = new EndScreen(ui, {
      portfolio: this.portfolio, save: this.save, vocabulary,
      onOpen: (view) => this.openWindow(view),
      onContact: () => this.openWindow('contact'),
      onClassic: (e) => this.toClassic(e),
      onContinue: () => this._resumeFrom('end'),
      onPortal: () => { this._resumeFrom('end'); this.goTo(this.level.portal); },
    });

    this.selector = new UniverseSelector(ui, {
      universes: this.universes.list(), portfolio: this.portfolio, save: this.save,
      classicHref: '/classique',
      onChoose: (id) => this.startUniverse(id, { briefing: true }),
      onSound: () => this.toggleSound(),
      onVolume: (v) => this.setVolume(v),
      onContact: () => { if (window.ContactWidget) window.ContactWidget.open({ subject: 'Prise de contact · Portfolio' }); },
    });

    this.briefing = new Briefing(ui, {
      onStart: () => { this.audio.sfx('ui'); this._beginPlay(true); },
      onBack: () => this.showSelector(true),
    });
  }

  _bind() {
    let queued = false;
    window.addEventListener('resize', () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => { queued = false; this._resize(); if (!this.loop.active && this.universe) this.loop.renderOnce(); });
    });

    this.input.onPause = (e) => this._onPauseKey(e);
    this.input.onAny = () => { if (this.state === 'intro') this.camera.skipPan(); };

    this.canvas.addEventListener('pointerup', (e) => {
      if (this.state !== 'play') return;
      this.camera.screenToWorld(e.clientX, e.clientY, this.cssScale, this._pt);
      const hit = this.level.hit(this._pt.x, this._pt.y);
      if (hit) this.goTo(hit);
    });

    window.addEventListener('pagehide', () => this._savePosition());
    // Retour arrière depuis une autre page (bfcache) : on rend la main.
    window.addEventListener('pageshow', (e) => {
      if (!e.persisted) return;
      this.fx.reveal();
      if (this.state === 'leaving') this._play();
    });

    const mq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
    if (mq && mq.addEventListener) mq.addEventListener('change', () => this._applyMotion());

    // La police chargée, les textes cuits dans les tampons sont refaits.
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        if (this.renderer) this.renderer.invalidate();
        this.selector.invalidate();
        if (!this.loop.active && this.universe) this.loop.renderOnce();
      });
    }

    // Un bouton cliqué à la souris ne garde pas le focus : sinon Espace (saut)
    // et Entrée le réactiveraient au lieu de piloter le personnage.
    document.addEventListener('click', (e) => {
      const b = e.target.closest && e.target.closest('.adv-hud button, .adv-hud a');
      if (b && e.detail > 0) b.blur();
    });
  }

  // ── Réglages ─────────────────────────────────────────
  get reduced() {
    const mq = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    return !!mq || this.save.data.settings.reducedMotion;
  }

  _applyMotion() {
    const r = this.reduced;
    this.root.classList.toggle('adv--reduced', r);
    this.camera.reducedMotion = r;
    this.particles.enabled = !r;
    this.fx.reduced = r;
    this.selector.reduced = r;
    if (this.renderer) this.renderer.reduced = r;
  }

  _applySound(on, persist = true) {
    if (persist) this.save.setSetting('sound', on);
    this.audio.setEnabled(on);
    const v = this.save.data.settings.volume;
    this.selector.setSound(on, v);
    this.pause.setSound(on, v);
  }

  toggleSound() {
    const on = !this.save.data.settings.sound;
    // Réactivé avec la jauge à zéro : on remonte le volume, sinon rien ne s'entend.
    if (on && this.save.data.settings.volume === 0) this.setVolume(DEFAULT_VOLUME);
    else this._applySound(on);
    this.audio.sfx('ui');
  }

  // Jauge de volume (0 à 1), commune aux trois univers. Zéro coupe le son.
  setVolume(v) {
    this.save.setVolume(v);
    v = this.save.data.settings.volume;
    this.audio.setVolume(v);
    this._applySound(v > 0);
  }

  // ── Déroulé ──────────────────────────────────────────
  // route : { kind: 'universe' | 'section' | 'view' | 'portail', … } ou null.
  boot(route, opts = {}) {
    this.capture = !!opts.capture;
    if (this.capture) this.root.classList.add('adv--capture');
    const saved = this.save.data.universe;

    if (route && route.kind === 'universe') {
      this.startUniverse(route.universe, { instant: true, briefing: !this.capture && !this.save.sessionStarted });
    } else if (route && route.kind !== 'ville') {
      // Lien profond vers un contenu : directement dans le monde, sans briefing.
      this.startUniverse(saved || DEFAULT_UNIVERSE, { instant: true, route });
    } else if (this.capture) {
      this.startUniverse(DEFAULT_UNIVERSE, { instant: true });
    } else {
      this.showSelector(false);
    }
  }

  // Lien modifié pendant la partie.
  navigate(route) {
    if (!route) return;
    if (route.kind === 'universe') {
      if (!this.universe || this.universe.id !== route.universe) this.startUniverse(route.universe, { briefing: false });
      return;
    }
    if (route.kind === 'ville') return;
    if (!this.universe || this.state === 'select' || this.state === 'briefing') {
      this.startUniverse((this.universe && this.universe.id) || this.save.data.universe || DEFAULT_UNIVERSE, { route });
      return;
    }
    this._applyRoute(route);
  }

  async showSelector(withVeil) {
    if (withVeil) await this.fx.cover();
    this._savePosition();
    this.state = 'select';
    this.loop.pause();
    this.input.enabled = false;
    this.pause.close();
    this.briefing.hide();
    this.end.hide();
    this.hud.show(false);
    this.touch.show(false);
    this._setHash('');
    this.selector.show();
    if (withVeil) this.fx.reveal();
  }

  async startUniverse(id, opts = {}) {
    if (this._starting) return;
    this._starting = true;
    if (!opts.instant) { this.audio.sfx('transition'); await this.fx.cover(); }
    this.selector.hide();
    this.pause.close();
    this.end.hide();
    if (this.win.isOpen) this.win.close();
    this._build(this.universes.has(id) ? id : DEFAULT_UNIVERSE);
    this.hud.show(false);
    this.touch.show(false);
    this.loop.pause();
    this.loop.renderOnce();
    this._starting = false;

    if (opts.route) {
      this.save.markSession();
      this._play();
      this._applyRoute(opts.route);
    } else if (opts.briefing) {
      this.state = 'briefing';
      this.briefing.show(this.universe);
    } else {
      this._beginPlay(false);
    }
    if (!opts.instant) this.fx.reveal();
  }

  // Construit l'univers : thème, niveau, renderer, réglages. Le moteur ne change pas.
  _build(id) {
    const u = this.universes.activate(id);
    this.universe = u;
    this.save.setUniverse(id);

    const v = u.vocabulary;
    const n = this.portfolio.projects.length;
    const lines = [
      [this.portfolio.profile.seeking, 'Un projet de site ? Passez le portail.'],
      [`${v.locations.projets} : ${n} projets à voir.`, 'Le CV est dans le menu.'],
    ];
    this.level = new Level(u.createLevel(), u, this.portfolio, lines);
    this.world = new World(this.level);
    this.world.restore(this.save);
    this.world.onCollect = (c) => this._onCollect(c);
    this.world.onSpeak = () => this.audio.sfx('talk');

    this.renderer = new u.Renderer(u);
    this.renderer.reduced = this.reduced;
    this.controller.setWorld(this.world.collision, u.physics);
    this.animator = new CharacterAnimator(u.character.player.animator);
    this.animator.onStep = () => {
      this.particles.dust(this.player.x, this.player.y, 1, this.player.vx > 0 ? -1 : 1, u.effects.dust);
      this.audio.sfx('step');
    };
    this.controller.onJump = () => { this.animator.kick(-1.4); this.audio.sfx('jump'); };
    this.controller.onLand = (speed) => {
      this.animator.kick(Math.min(3.2, speed / 260));
      this.particles.dust(this.player.x, this.player.y, 6, 0, u.effects.dust);
      this.audio.sfx('land');
      if (speed > 900) this.camera.shake(0.25);
    };
    this.figure.setLook(u.character.player.look);
    this.npcFigures = this.level.npcs.map((npc, i) => new CharacterRenderer(u.character.npcs[i % u.character.npcs.length]));

    this.camera.configure(u.camera);
    this.particles.clear();
    this.controller.locked = false;
    this._near = null; this._opened = null; this._enter = null; this._auto = null; this._newVisit = null; this._endIn = 0;
    this.camera.release();

    // Reprise à la position sauvegardée, sinon au point de départ.
    const pos = this.save.data.playerPosition;
    const ok = pos && pos.x > 0 && pos.x < this.level.width && pos.y <= 0 && pos.y > this.level.top;
    this.player.place(ok ? pos.x : this.level.spawn.x, ok ? pos.y : this.level.spawn.y);
    this.player.y = this.world.collision.groundBelow(this.player.x, this.player.y - 4);
    this.player.shadowY = this.player.y;
    this.player.alpha = 1;
    this.player.facing = 1;

    this._resize();
    this.camera.snap(this.player);
    this.hud.setVocabulary(v);
    this._syncHud();
    this.audio.setUniverse(u.audio);
    this._setHash('#aventure/' + id);
  }

  // Travelling d'ouverture (passable) : la caméra part du bout du niveau et
  // revient sur le joueur, pour montrer d'un coup ce qu'il y a à explorer.
  _beginPlay(withIntro) {
    this.briefing.hide();
    this.save.markSession();
    if (!withIntro || this.reduced || this.capture) { this._play(); return; }
    this.state = 'intro';
    this.camera.snap(this.player);
    const to = { x: this.camera.cx, y: this.camera.cy };
    const from = { x: this.level.width, y: to.y + (this.level.decor.roofs ? -420 : 0) };
    this.camera.pan(from, to, 2.4, () => this._play());
    this.loop.resume();
  }

  _play() {
    this.state = 'play';
    this.input.reset();
    this.input.enabled = true;
    if (!this.capture) { this.hud.show(true); this.touch.show(true); }
    this.loop.resume();
  }

  // Reprise depuis la pause ou l'écran de fin.
  _resumeFrom(state) {
    if (this.state !== state) return;
    this.pause.close();
    this.end.hide();
    this.audio.sfx('close');
    this._play();
  }

  togglePause(view) {
    if (this.state === 'paused') { this._resumeFrom('paused'); return; }
    if (this.state !== 'play') return;
    this.state = 'paused';
    this._auto = null;
    this.input.enabled = false;
    this._savePosition();
    this.loop.pause();
    this.audio.sfx('open');
    this.pause.open(view);
  }

  _onPauseKey(e) {
    if (this.win.isOpen) { if (e.key === 'Escape') this.win.close(); return true; }
    if (this.end.isOpen) { if (e.key === 'Escape') this._resumeFrom('end'); return true; }
    if (this.state === 'play' || this.state === 'paused') { this.togglePause(); return true; }
    return false;
  }

  restart() {
    this.save.reset();
    this.pause.close();
    this.world.restore(this.save);
    this.player.place(this.level.spawn.x, this.level.spawn.y);
    this.camera.snap(this.player);
    this.particles.clear();
    this._syncHud();
    this._play();
    this.hud.toast({ kicker: 'NOUVELLE PARTIE', title: 'Progression remise à zéro' });
  }

  // ── Lieux, fenêtres, déplacements ────────────────────
  _objective() {
    const list = this.level.ordered;
    for (let i = 0; i < list.length; i++) if (!list[i].visited) return list[i];
    return null;
  }

  // Aller à un lieu : à pied s'il est proche et de plain-pied, sinon déplacement rapide.
  goTo(loc) {
    if (this.state !== 'play') return;
    const p = this.player;
    if (loc.isNear(p)) { this.enter(loc); return; }
    if (Math.abs(loc.baseY - p.y) <= 70 && Math.abs(loc.doorX - p.x) <= WALK_RANGE) {
      this._auto = { x: loc.doorX, target: loc, stuck: 0, lastX: p.x };
      return;
    }
    this._travel(loc, true);
  }

  async _travel(loc, thenEnter) {
    this.state = 'travel';
    this._auto = null;
    this.input.enabled = false;
    this.audio.sfx('transition');
    await this.fx.through(() => {
      this.player.place(loc.doorX, loc.baseY);
      this.camera.snap(this.player);
      this.loop.renderOnce();
    });
    this._play();
    if (thenEnter) this.enter(loc);
  }

  enter(loc) {
    if (this.state !== 'play') return;
    this._auto = null;
    if (loc.isPortal) { this._leave(loc.href); return; }
    this.audio.sfx('enter');
    if (this.reduced) { this.win.open(loc.id); return; }
    this.state = 'entering';
    this.input.enabled = false;
    this.controller.locked = true;
    this._opened = loc;
    this._enter = { loc, t: 0 };
    this.hud.setPrompt('');
    this.camera.focus(loc.doorX, this.camera._centerFor(loc.baseY) - 10, this.camera.cfg.zoom * 1.16);
  }

  // Ouvre une vue du portfolio (depuis le monde, le menu, le HUD ou un lien).
  openWindow(view, opts) {
    if (!this.universe || this.state === 'leaving' || this.state === 'select') return;
    this.pause.close();
    this.end.hide();
    this.briefing.hide();
    this.win.open(view, opts);
  }

  _onWindowOpen(view) {
    this.state = 'window';
    this._enter = null;
    this._auto = null;
    this.input.enabled = false;
    this.hud.show(false);
    this.touch.show(false);
    const loc = this.level.location(view);
    if (loc && !loc.isPortal) this._opened = loc;
    if (LOCATION_IDS.includes(view) && this.save.visit(view) && loc) {
      loc.visited = true;
      this._newVisit = loc;
    }
    this._savePosition();
    this._setHash(this.win.route());
    this.loop.renderOnce();
    this.loop.pause();
  }

  _onWindowClose() {
    this.camera.release();
    this.controller.locked = false;
    this._opened = null;
    this._setHash('#aventure/' + this.universe.id);
    this._syncHud();
    this._play();

    const loc = this._newVisit;
    this._newVisit = null;
    if (!loc) return;
    const v = this.universe.vocabulary;
    const done = this.save.data.visitedLocations.length;
    this.hud.toast({ kicker: v.placeFound, title: loc.label, text: done + '/4 ' + v.places.toLowerCase() });
    this.particles.burst(loc.doorX, loc.baseY - 60, 16, this.universe.palette.accent);
    this.audio.sfx('discover');
    if (done >= 4 && !this.save.data.missionComplete) this._endIn = 1.1;
  }

  _onCollect(c) {
    this.save.collect(c.id);
    const u = this.universe, n = c.skill.relatedProjects.length;
    this.particles.burst(c.x, c.y, 12, u.palette.accent);
    this.audio.sfx('collect');
    this._syncHud();
    this.hud.toast({
      kicker: u.vocabulary.skillFound, title: c.skill.name,
      text: c.skill.category + ' · ' + (n ? n + (n > 1 ? ' projets associés' : ' projet associé') : 'aucun projet associé'),
      action: { label: 'Voir', run: () => this.openWindow('skills', { skill: c.id }) },
    });
  }

  _applyRoute(route) {
    if (route.kind === 'portail') {
      this.player.place(this.level.portal.doorX - 34, 0);
      this.camera.snap(this.player);
      if (!this.loop.active) this.loop.renderOnce();
      return;
    }
    const view = route.kind === 'view' ? route.view : route.section;
    const loc = this.level.location(view);
    if (loc) { this.player.place(loc.doorX, loc.baseY); this.camera.snap(this.player); }
    this.openWindow(view, { slug: route.slug });
  }

  // Fragment de ce que regarde le visiteur : fenêtre ouverte, sinon lieu tout proche.
  currentRoute() {
    const open = this.win.route();
    if (open) return open;
    const b = this._near;
    if (!b) return '';
    return b.isPortal ? '#portail' : (window.Deeplink ? window.Deeplink.build(b.id) : '');
  }

  async toClassic(e) {
    if (e) e.preventDefault();
    const href = '/classique' + (this.universe ? this.currentRoute() : '');
    this._savePosition();
    this.state = 'leaving';
    this.loop.pause();
    this.audio.setEnabled(false);       // le mode classique est silencieux
    await this.fx.cover();
    window.location.href = href;
  }

  async _leave(href) {
    this.state = 'leaving';
    this.input.enabled = false;
    this._savePosition();
    this.audio.sfx('transition');
    this.camera.shake(0.5);
    await this.fx.cover();
    this.loop.pause();
    window.location.href = href || '/construire-projet';
  }

  _savePosition() {
    if (!this.universe || this.state === 'select' || this.state === 'boot') return;
    this.save.setPosition(this.player.x, this.player.shadowY);
  }

  _setHash(hash) {
    if (this.capture) return;
    try { history.replaceState(null, '', location.pathname + location.search + (hash || '')); } catch (e) { /* noop */ }
  }

  _syncHud() {
    const d = this.save.data;
    this.hud.setProgress(d.visitedLocations.length, 4, d.collectedSkills.length, this.portfolio.skills.length);
  }

  // ── Affichage ────────────────────────────────────────
  _resize() {
    const w = window.innerWidth, h = window.innerHeight;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (w * dpr > MAX_PX) dpr = MAX_PX / w;
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.cssScale = Math.min(h / VIEW_H, w / MIN_VIEW_W);
    this.pxScale = this.cssScale * dpr;
    const viewW = w / this.cssScale, viewH = h / this.cssScale;
    this.camera.setView(viewW, viewH);
    if (!this.universe) return;
    // Hauteur de sol sous les pieds, en unités monde : celle voulue par l'univers
    // (réglée pour un écran paysage), et au moins la hauteur des boutons tactiles.
    // En portrait, la vue est plus haute : on montre plus de ciel, pas plus de sol.
    const u = this.universe.camera;
    let pad = (1 - u.anchorY) * VIEW_H;
    if (this.touchUI) pad = Math.max(pad, 104 / this.cssScale);
    this.camera.cfg.anchorY = 1 - (pad * u.zoom) / viewH;
    const floor = pad;
    this.camera.setBounds(0, this.level.width, this.level.top, floor);
    this.renderer.resize(this.canvas.width, this.canvas.height, this.pxScale, floor);
    if (this.state !== 'intro') this.camera.snap(this.player);
  }

  // ── Simulation (dt en secondes) ──────────────────────
  update(dt) {
    const p = this.player, input = this.input, intent = this.intent;
    const playing = this.state === 'play';

    intent.axis = 0; intent.jumpPressed = false; intent.jumpHeld = false; intent.down = false;

    if (playing) {
      this._near = this.level.nearest(p);
      intent.axis = input.axis;
      intent.jumpHeld = input.jumpHeld;
      intent.down = input.down;
      intent.jumpPressed = input.jumpPressed;
      if (this._auto) this._autoWalk(intent);

      // ↑ / Entrée devant une porte : on entre. Sinon ↑ fait sauter.
      if (input.interactPressed) {
        if (this._near) this.enter(this._near);
        else intent.jumpPressed = true;
      }
    } else {
      this._near = null;
    }

    if (this.state === 'entering') this._stepEntering(dt);
    else if (p.alpha < 1) p.alpha = Math.min(1, p.alpha + dt * 5);

    this.controller.update(dt, intent);
    this.animator.update(dt, p, this.controller.physics.maxSpeed);
    this.world.update(dt, p, playing, this._opened);
    this.particles.update(dt);
    this.camera.update(dt, p);
    input.endFrame();          // un front montant ne vaut que pour un pas de simulation

    // Portail illuminé une fois la visite terminée : étincelles.
    const portal = this.level.portal;
    if (portal.boost && Math.random() < dt * 14) {
      this.particles.spawn(portal.x + Math.random() * portal.w, -6, (Math.random() - 0.5) * 30,
        -70 - Math.random() * 70, 0.9, 3, this.universe.palette.primary, 0);
    }

    if (playing && this._endIn > 0) {
      this._endIn -= dt;
      if (this._endIn <= 0) this._complete();
    }
  }

  // Marche automatique : toute commande manuelle reprend la main ; un obstacle
  // se saute ; bloqué trop longtemps, on bascule en déplacement rapide.
  _autoWalk(intent) {
    const a = this._auto, p = this.player;
    if (this.input.axis !== 0) { this._auto = null; return; }
    const dx = a.x - p.x;
    if (Math.abs(dx) <= 8 && a.target.isNear(p)) {
      this._auto = null;
      p.vx = 0;
      this.enter(a.target);
      return;
    }
    intent.axis = dx < 0 ? -1 : 1;
    intent.jumpHeld = true;
    if (this.controller.hitWall !== 0 && p.grounded) intent.jumpPressed = true;
    a.stuck = Math.abs(p.x - a.lastX) < 0.2 ? a.stuck + 1 : 0;
    a.lastX = p.x;
    if (a.stuck > 150) this._travel(a.target, true);
  }

  _stepEntering(dt) {
    const e = this._enter, p = this.player;
    e.t += dt;
    p.x += (e.loc.doorX - p.x) * damp(10, dt);
    p.vx = 0;
    p.alpha = Math.max(0, 1 - Math.max(0, e.t - 0.12) / 0.2);
    if (e.t >= ENTER_TIME) this.win.open(e.loc.id);
  }

  _complete() {
    if (!this.save.completeMission()) return;
    this.level.portal.boost = true;
    this.state = 'end';
    this.input.enabled = false;
    this.hud.hideToast();
    this.audio.sfx('complete');
    this.loop.renderOnce();
    this.loop.pause();
    this.end.show();
  }

  // ── Rendu ────────────────────────────────────────────
  render(dt, t) {
    const ctx = this.ctx, r = this.renderer, cam = this.camera, lv = this.level;
    if (!r) return;
    const playing = this.state === 'play';

    if (playing) this._updateHud();
    this._rs.near = playing ? this._near : null;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    r.drawSky(ctx);
    cam.apply(ctx, this.pxScale);
    r.drawFar(ctx, cam, t);
    r.drawWorld(ctx, cam, t, lv, this._rs);

    for (let i = 0; i < lv.collectibles.length; i++) {
      const c = lv.collectibles[i];
      if (c.fade < 1 && r.visible(cam, c.x - 20, 40)) r.drawCollectible(ctx, c, t);
    }
    for (let i = 0; i < lv.npcs.length; i++) {
      const n = lv.npcs[i];
      if (!r.visible(cam, n.body.x - 20, 40)) continue;
      this.npcFigures[i].drawShadow(ctx, n.body);
      this.npcFigures[i].draw(ctx, n.body, n.animator.pose, dt);
    }
    this.figure.drawShadow(ctx, this.player);
    this.figure.draw(ctx, this.player, this.animator.pose, dt);
    this.particles.draw(ctx);
    r.drawFront(ctx, cam, t, lv);

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    r.drawOverlay(ctx, t);
  }

  _updateHud() {
    const p = this.player, v = this.universe.vocabulary, near = this._near;
    const goal = this._objective();
    if (goal) {
      const dx = goal.doorX - p.x, dy = goal.baseY - p.y;
      const dir = near === goal ? '' : Math.abs(dy) > 120 && Math.abs(dx) < 260 ? (dy < 0 ? '↑' : '↓') : dx < 0 ? '←' : '→';
      this.hud.setObjective(goal.label, dir);
    } else {
      this.hud.setObjective(v.allDone, '');
    }
    this.hud.setZone(this.level.zoneAt(p.x, p.y));
    this.hud.setPrompt(near ? v.enter + ' · ' + near.label : '', this.touchUI ? '' : '↑', !!near && near.isPortal);
    this.touch.setReady(!!near);
    const speaker = this.world.speaker;
    this.hud.setDialogue(speaker ? speaker.text : '');
  }
}
