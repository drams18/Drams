/* ══════════════════════════════════════════════════════
   BUILDGAME.JS : « Construisez votre projet », sur le moteur de l'aventure

   Le mini-jeu se joue DANS l'univers choisi par le visiteur (VILLE, HAUTE
   VOLTIGE, LE PALAIS) : même boucle, même caméra, même physique, même
   personnage, même renderer, même musique. Seule la règle change :
   chaque porte est une réponse.

     ↑ devant une porte    choisir (ou retirer, à l'étape à choix multiples)
     Entrée / bouton       valider l'étape
     le portail            revenir : étape précédente, puis le portfolio

     play → busy (changement d'étape) → play … → panel (récap, formulaire, fin)

   La boucle est suspendue derrière un écran plein (0 % CPU).
   ══════════════════════════════════════════════════════ */

import { GameLoop } from '../aventure/core/GameLoop.js';
import { Camera } from '../aventure/core/Camera.js';
import { Input, isTouchUI } from '../aventure/core/Input.js';
import { SaveManager, DEFAULT_VOLUME } from '../aventure/core/SaveManager.js';
import { Character } from '../aventure/player/Character.js';
import { CharacterController } from '../aventure/player/CharacterController.js';
import { CharacterAnimator } from '../aventure/player/CharacterAnimator.js';
import { CharacterRenderer } from '../aventure/player/CharacterRenderer.js';
import { Level } from '../aventure/world/Level.js';
import { World } from '../aventure/world/World.js';
import { UniverseManager, DEFAULT_UNIVERSE } from '../aventure/universes/UniverseManager.js';
import { ParticleSystem } from '../aventure/effects/ParticleSystem.js';
import { ScreenEffects } from '../aventure/effects/ScreenEffects.js';
import { UniverseAudio } from '../aventure/audio/UniverseAudio.js';
import { TouchControls } from '../aventure/ui/TouchControls.js';
import { STEPS, Answers, doorId } from './steps.js';
import { createRoom } from './rooms.js';
import { BuildUI } from './BuildUI.js';

const VIEW_H = 620;          // mêmes cadrages que l'aventure
const MIN_VIEW_W = 470;
const MAX_PX = 2560;
const OPEN_TIME = 0.7;       // s : la porte choisie reste ouverte

const NPC_LINES = [[
  'Chaque porte est une réponse : ↑ pour choisir.',
  'Rien n\'est définitif : tout se modifie au récapitulatif.',
]];

export class BuildGame {
  // universe : identifiant forcé par l'URL (#ville, #hero, #club), sinon celui de la sauvegarde.
  constructor({ root, canvas, ui, universe }) {
    this.root = root;
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.state = 'boot';
    this.step = 0;

    this.save = new SaveManager();
    this.answers = new Answers();
    this.universes = new UniverseManager(root);
    const wanted = this.universes.has(universe) ? universe : this.save.data.universe;
    const u = this.universe = this.universes.activate(wanted || DEFAULT_UNIVERSE);

    // L'univers, avec les libellés des portes à la place de ceux du portfolio.
    const locations = {}, hints = {};
    STEPS.forEach((s, i) => s.doors.forEach((d, k) => { locations[doorId(i, k)] = d.label; hints[doorId(i, k)] = d.hint; }));
    this.skin = { ...u, vocabulary: { ...u.vocabulary, locations, hints, stamp: 'CHOISI' } };

    this.input = new Input();
    this.camera = new Camera();
    this.camera.configure(u.camera);
    this.particles = new ParticleSystem(120);
    this.audio = new UniverseAudio();
    this.fx = new ScreenEffects(root);
    this.renderer = new u.Renderer(this.skin);
    this.loop = new GameLoop({ update: (dt) => this.update(dt), render: (dt, t) => this.render(dt, t) });
    this.loop.pause();
    this.loop.start();

    this.player = new Character();
    this.controller = new CharacterController(this.player, null, {});
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
    };
    this.figure = new CharacterRenderer(u.character.player.look);
    this.npcFigures = [];
    this.intent = { axis: 0, jumpPressed: false, jumpHeld: false, down: false };
    this.touchUI = isTouchUI();

    this._rs = { near: null };     // état passé au renderer
    this._near = null;
    this._opened = null;           // porte tenue ouverte après un choix
    this._openT = 0;
    this._auto = null;             // marche automatique vers une porte cliquée
    this._pt = { x: 0, y: 0 };

    this.home = window.Deeplink ? window.Deeplink.homeHref(true) : '/';
    this.ui = new BuildUI(ui, this.answers, {
      home: this.home,
      back: () => this.back(),
      next: () => this.advance(),
      interact: () => { if (this.state === 'play' && this._near) this.interact(this._near); },
      sound: () => this.toggleSound(),
      volume: (v) => this.setVolume(v),
      sfx: (name) => this.audio.sfx(name),
      restart: () => this._toStep(0),
      toForm: () => { this.audio.sfx('open'); this._panel('form'); },
      toRecap: () => { this.audio.sfx('close'); this._panel('recap'); },
      sent: () => { this.audio.sfx('complete'); this._panel('done'); },
    });
    this.touch = new TouchControls(ui, this.input);
    if (this.touch.action) this.touch.action.textContent = 'CHOISIR';

    this._bind();
    this._applyMotion();
    this.audio.setVolume(this.save.data.settings.volume);
    this.audio.setUniverse(u.audio);
    this._applySound(this.save.data.settings.sound, false);

    this._buildStep(0);
    this._play();
  }

  _bind() {
    let queued = false;
    window.addEventListener('resize', () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => { queued = false; this._resize(); if (!this.loop.active) this.loop.renderOnce(); });
    });

    // Entrée ne choisit jamais une porte : elle valide l'étape (capture, avant Input).
    window.addEventListener('keydown', (e) => {
      if (e.code !== 'Enter' && e.code !== 'NumpadEnter') return;
      const tag = document.activeElement && document.activeElement.tagName;
      if (this.state !== 'play' || tag === 'BUTTON' || tag === 'A' || tag === 'INPUT') return;
      e.preventDefault();
      e.stopImmediatePropagation();
      if (!e.repeat && this.answers.hasValue(STEPS[this.step])) this.advance();
    }, true);

    // Échap : du formulaire au récapitulatif.
    this.input.onPause = (e) => {
      if (e.key === 'Escape' && this.phase === 'form') { this.audio.sfx('close'); this._panel('recap'); return true; }
      return false;
    };

    // Cliquer ou toucher une porte : y aller, puis la choisir.
    this.canvas.addEventListener('pointerup', (e) => {
      if (this.state !== 'play') return;
      this.camera.screenToWorld(e.clientX, e.clientY, this.cssScale, this._pt);
      const hit = this.level.hit(this._pt.x, this._pt.y);
      if (!hit) return;
      if (hit.isNear(this.player)) this.interact(hit);
      else this._auto = hit;
    });

    // Retour arrière depuis le portfolio (bfcache) : on rend la main.
    window.addEventListener('pageshow', (e) => {
      if (!e.persisted) return;
      this.fx.reveal();
      if (this.state === 'leaving') this._play();
    });

    const mq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
    if (mq && mq.addEventListener) mq.addEventListener('change', () => this._applyMotion());

    // La police chargée, les textes cuits dans les tampons sont refaits.
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => { this.renderer.invalidate(); if (!this.loop.active) this.loop.renderOnce(); });
    }

    // Un bouton cliqué à la souris ne garde pas le focus : sinon Espace (saut)
    // le réactiverait au lieu de piloter le personnage.
    document.addEventListener('click', (e) => {
      const b = e.target.closest && e.target.closest('.adv-hud button');
      if (b && e.detail > 0) b.blur();
    });
    // Idem pour la jauge de volume réglée à la souris : les flèches reviennent au jeu.
    this.ui.volume.el.addEventListener('pointerup', () => { if (document.activeElement) document.activeElement.blur(); });
  }

  // ── Réglages (les mêmes que dans l'aventure, partagés par la sauvegarde) ──
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
    this.renderer.reduced = r;
  }

  _applySound(on, persist = true) {
    if (persist) this.save.setSetting('sound', on);
    this.audio.setEnabled(on);
    this.ui.setSound(on, this.save.data.settings.volume);
  }

  toggleSound() {
    const on = !this.save.data.settings.sound;
    if (on && this.save.data.settings.volume === 0) this.setVolume(DEFAULT_VOLUME);
    else this._applySound(on);
    this.audio.sfx('ui');
  }

  setVolume(v) {
    this.save.setVolume(v);
    v = this.save.data.settings.volume;
    this.audio.setVolume(v);
    this._applySound(v > 0);
  }

  // ── Étapes ───────────────────────────────────────────
  get phase() { return this.state === 'panel' ? this._phase : null; }

  _buildStep(index) {
    const u = this.universe, step = STEPS[index];
    this.step = index;

    this.level = new Level(createRoom(u.id, step, index), this.skin, null, NPC_LINES);
    const portal = this.level.portal;
    portal.lines = index === 0 ? ['RETOUR', 'AU PORTFOLIO'] : ['ÉTAPE', 'PRÉCÉDENTE'];
    portal.label = index === 0 ? 'Revenir au portfolio' : 'Étape précédente';
    this.level.locations.forEach((l, i) => {
      l.door = step.doors[i];
      l.visited = this.answers.isSelected(step, l.door);   // tampon « choisi » du renderer
    });

    this.world = new World(this.level);
    this.world.onSpeak = () => this.audio.sfx('talk');
    this.controller.setWorld(this.world.collision, u.physics);
    this.controller.locked = false;
    this.npcFigures = this.level.npcs.map((n, i) => new CharacterRenderer(u.character.npcs[i % u.character.npcs.length]));

    this.particles.clear();
    this._near = null; this._opened = null; this._openT = 0; this._auto = null;
    this.player.place(this.level.spawn.x, this.level.spawn.y);
    this.player.facing = 1;
    this.player.alpha = 1;
    this._resize();
    this.camera.snap(this.player);
    this.ui.setStep(index, !this.touchUI);
    this.ui.setNext(this.answers.hasValue(step));
  }

  _play() {
    this.state = 'play';
    this.input.reset();
    this.input.enabled = true;
    this.ui.showPanel(null);
    this.ui.showHud(true);
    this.touch.show(true);
    this.loop.resume();
  }

  // Écran plein : récapitulatif, formulaire, confirmation.
  _panel(phase) {
    this.state = 'panel';
    this._phase = phase;
    this._auto = null;
    this.input.enabled = false;
    this.ui.showHud(false);
    this.touch.show(false);
    this.loop.renderOnce();
    this.loop.pause();
    this.ui.showPanel(phase);
  }

  // Change d'étape à l'abri du voile de l'univers.
  async _toStep(index) {
    if (this.state === 'busy' || this.state === 'leaving') return;
    this.state = 'busy';
    this.input.enabled = false;
    this.audio.sfx('transition');
    await this.fx.through(() => {
      if (index >= STEPS.length) { this.ui.showHud(false); this.touch.show(false); return; }
      this.ui.showPanel(null);
      this._buildStep(index);
      this.loop.renderOnce();
    });
    if (index >= STEPS.length) this._panel('recap');
    else this._play();
  }

  advance() {
    if (this.state !== 'play') return;
    this._toStep(this.step + 1);
  }

  back() {
    if (this.state !== 'play') return;
    if (this.step > 0) { this._toStep(this.step - 1); return; }
    this._leave();
  }

  async _leave() {
    this.state = 'leaving';
    this.input.enabled = false;
    this.audio.sfx('transition');
    await this.fx.cover();
    this.loop.pause();
    window.location.href = this.home;
  }

  // ── Portes ───────────────────────────────────────────
  interact(loc) {
    if (this.state !== 'play') return;
    this._auto = null;
    if (loc.isPortal) { this.back(); return; }

    const step = STEPS[this.step], door = loc.door, a = this.answers;
    if (door.special === 'done') { this.advance(); return; }
    if (door.special === 'unknown') {
      a.setUnknown();
      this.level.locations.forEach(l => { l.visited = false; });
      this._celebrate(loc, 'CHOIX', door.label);
      this.advance();
      return;
    }
    if (step.multi) {
      loc.visited = a.toggle(door.value);
      if (loc.visited) this._celebrate(loc, 'AJOUTÉ', door.label);
      else { this.audio.sfx('close'); this.ui.toast('RETIRÉ', door.label); }
    } else if (a.pick(step, door.value)) {
      this.level.locations.forEach(l => { l.visited = l === loc; });
      this._celebrate(loc, 'CHOIX', door.label);
    }
    this.ui.setNext(a.hasValue(step));
  }

  _celebrate(loc, kicker, title) {
    this._opened = loc;
    this._openT = OPEN_TIME;
    this.audio.sfx('collect');
    this.particles.burst(loc.doorX, loc.baseY - 60, 14, this.universe.palette.accent);
    this.ui.toast(kicker, title);
  }

  // Ce que fait ↑ devant la porte `loc`.
  _action(loc) {
    if (loc.isPortal) return 'Retour';
    const step = STEPS[this.step], door = loc.door;
    if (door.special === 'done') return 'Valider';
    if (step.multi && !door.special) return loc.visited ? 'Retirer' : 'Choisir';
    return loc.visited ? 'Choisi' : 'Choisir';
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
    if (!this.level) return;
    // Même cadrage que l'aventure : le sol voulu par l'univers, et au moins la
    // hauteur des boutons tactiles.
    const u = this.universe.camera;
    let pad = (1 - u.anchorY) * VIEW_H;
    if (this.touchUI) pad = Math.max(pad, 104 / this.cssScale);
    this.camera.cfg.anchorY = 1 - (pad * u.zoom) / viewH;
    this.camera.setBounds(0, this.level.width, this.level.top, pad);
    this.renderer.resize(this.canvas.width, this.canvas.height, this.pxScale, pad);
    this.camera.snap(this.player);
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
      intent.jumpPressed = input.jumpPressed;
      if (this._auto) this._autoWalk(intent);

      // ↑ devant une porte : on la choisit. Sinon ↑ fait sauter.
      if (input.interactPressed) {
        if (this._near) this.interact(this._near);
        else intent.jumpPressed = true;
      }
    } else {
      this._near = null;
    }

    if (this._openT > 0 && (this._openT -= dt) <= 0) this._opened = null;

    this.controller.update(dt, intent);
    this.animator.update(dt, p, this.controller.physics.maxSpeed);
    this.world.update(dt, p, playing, this._opened);
    this.particles.update(dt);
    this.camera.update(dt, p);
    input.endFrame();
  }

  // Marche vers la porte cliquée ; toute commande manuelle reprend la main.
  _autoWalk(intent) {
    const loc = this._auto, p = this.player;
    if (this.input.axis !== 0) { this._auto = null; return; }
    const dx = loc.doorX - p.x;
    if (Math.abs(dx) <= 10) {
      this._auto = null;
      p.vx = 0;
      this.interact(loc);
      return;
    }
    intent.axis = dx < 0 ? -1 : 1;
  }

  // ── Rendu (même ordre que l'aventure) ────────────────
  render(dt, t) {
    const ctx = this.ctx, r = this.renderer, cam = this.camera, lv = this.level;
    const playing = this.state === 'play';

    if (playing) this._updateHud();
    this._rs.near = playing ? this._near : null;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    r.drawSky(ctx);
    cam.apply(ctx, this.pxScale);
    r.drawFar(ctx, cam, t);
    r.drawWorld(ctx, cam, t, lv, this._rs);

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
    const near = this._near;
    if (near) {
      const more = near.isPortal ? '' : near.door.hint;
      this.ui.setPrompt(this._action(near) + ' · ' + (near.isPortal ? near.label : near.door.label), this.touchUI ? '' : '↑', more);
    } else {
      this.ui.setPrompt('');
    }
    this.touch.setReady(!!near);
    const speaker = this.world.speaker;
    this.ui.setDialogue(speaker ? speaker.text : '');
  }
}
