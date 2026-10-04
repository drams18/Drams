/* ══════════════════════════════════════════════════════
   GAME.JS : Side-scroller engine
   Camera: horizontal only, lerp smoothing
   Renders: map → jetons / passants → player → prompt → flèche d'objectif
   Déroulé : écran titre → travelling d'ouverture → jeu (+ tutoriel de
   1re partie) → mission accomplie quand les 4 lieux sont visités.
   HUD, tutoriel et sauvegarde : js/quest.js. Rue vivante : js/actors.js.
   ══════════════════════════════════════════════════════ */

'use strict';

// Commandes virtuelles de la marche automatique (déplacement rapide).
const STEER_LEFT  = { left: true,  right: false };
const STEER_RIGHT = { left: false, right: true  };
const STEER_NONE  = { left: false, right: false };

const ENTER_FRAMES = 18;      // entrée dans une maison ≈ 300 ms
const ENTER_ZOOM   = 1.14;
const INTRO_FRAMES = 110;     // travelling d'ouverture ≈ 1,8 s

class Game {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    // alpha:false → le compositeur saute la transparence du canvas (la scène
    // couvre tout l'écran de toute façon). Gain net à chaque frame.
    this.ctx    = this.canvas.getContext('2d', { alpha: false });
    this.ctx.imageSmoothingEnabled = false;
    this._loop  = this._loop.bind(this);   // pas de closure allouée par frame

    this.controls     = new Controls();
    this.mobile       = new MobileControls(this.controls, { jump: true });
    this.map          = new GameMap();
    this.interactions = new InteractionManager();

    const groundY = () => Math.round(this.canvas.height * GROUND_RATIO);
    this.player = new Player(SPAWN_X, groundY());

    // Camera starts so player is at left of screen
    this.cameraX  = 0;
    this._targetX = 0;

    this._tick          = 0;
    this._nearBuilding  = null;

    // 'title' (écran titre), 'intro' (travelling), 'play'.
    this.mode   = 'play';
    this.paused = false;
    this._reduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

    // ── Partie : sauvegarde, jetons, passants, circulation ──
    this.save = Save.load();
    this.interactions.restoreVisited(this.save.visited);
    SPECIAL_DOOR.boost = !!this.save.complete;
    this.tokens    = new Tokens(this.save.tokens);
    this.npcs      = new Npcs();
    this.particles = new Particles(56);
    this.traffic   = new Traffic();
    this.map.traffic = this.traffic;

    this.hud  = new Hud((place) => this.goTo(place));
    this.tuto = new Tutorial(this.hud, () => { this.save.tuto = true; this._persist(); });
    this._syncHud();

    // ── Entrée dans une maison : porte, zoom, fondu du personnage ──
    this._entering = null;   // { b, t } pendant l'animation
    this._inside   = false;  // fenêtre de section ouverte
    this._zoomK    = 1;
    this._zoomB    = null;   // maison sur laquelle on zoome
    this._shake    = 0;
    this._newVisit = null;   // lieu découvert, fêté à la fermeture de la fenêtre
    this._missionIn = 0;     // compte à rebours avant « Mission accomplie »

    this.interactions.onOpen  = (id) => this._onOpen(id);
    this.interactions.onClose = () => this._onClose();

    // Sensations : poussière + bruit de pas, écrasement à l'atterrissage.
    const sfx = (name) => { if (window.AudioManager) window.AudioManager.synth(name); };
    this.player.onStep = () => {
      this.particles.dust(this.player.x, this.player.groundY, 1, this.player.vx > 0 ? -1 : 1);
      sfx('step');
    };
    this.player.onLand = () => {
      this.particles.dust(this.player.x, this.player.groundY, 6, 0);
      sfx('land');
    };

    // Appareil tactile : libellés tactiles (ENTRER au lieu de ↑ ENTRER).
    this._touch = isTouchUI();

    this._resize();
    // Resize coalescé sur une frame (évite plusieurs _resize par salve d'events).
    window.addEventListener('resize', () => {
      if (this._resizeQueued) return;
      this._resizeQueued = true;
      requestAnimationFrame(() => { this._resizeQueued = false; this._resize(); });
    });

    // Les mesures de texte du prompt sont mises en cache ; on les recalcule une
    // fois la police pixel chargée (sinon largeurs basées sur le fallback).
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => { this._prompt = null; });
    }

    this._walkTo = null;
    this.canvas.addEventListener('pointerup', (e) => this._onTap(e));

    // Position mémorisée en quittant la page (retour de Tarifs, du portail…).
    window.addEventListener('pagehide', () => {
      this.save.x = Math.round(this.player.x);
      this._persist();
    });

    this._running = false;
    this._rafId   = 0;
    this.start();

    // Onglet remis au premier plan : on relance une frame proprement
    // (la boucle s'était arrêtée sur document.hidden).
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this._running && !this._rafId) {
        this._rafId = requestAnimationFrame(this._loop);
      }
    });
  }

  // Démarre / relance la boucle de rendu (idempotent).
  start() {
    if (this._running) return;
    this._running = true;
    if (!this._rafId) this._rafId = requestAnimationFrame(this._loop);
  }

  // Stoppe complètement la boucle : plus aucune frame planifiée tant que
  // start() n'est pas rappelé (retour à l'accueil → 0 % CPU).
  stop() {
    this._running = false;
    if (this._rafId) { cancelAnimationFrame(this._rafId); this._rafId = 0; }
  }

  // ── Partie ───────────────────────────────────────────
  _persist() {
    this.save.tokens = this.tokens.ids();
    Save.write(this.save);
  }

  _syncHud() {
    this.hud.setCounts(this.save.visited.length, BUILDINGS_DATA.length, this.tokens.count, this.tokens.total);
  }

  // Prochain lieu à visiter (de gauche à droite), puis le portail.
  _objective() {
    for (const b of BUILDINGS_DATA) if (!b.visited) return b;
    return SPECIAL_DOOR;
  }

  // Nouvelle partie : tout est remis à zéro, sauf le tutoriel déjà vu.
  reset() {
    const tuto = this.save.tuto;
    this.save = Save.blank();
    this.save.tuto = tuto;
    Save.write(this.save);
    for (const b of BUILDINGS_DATA) { b.visited = false; b.doorOpen = 0; }
    this.interactions._visited.clear();
    SPECIAL_DOOR.boost = false;
    this.tokens = new Tokens([]);
    this._walkTo = null;
    this._missionIn = 0;
    this.player.vx = 0;
    this.placeAt(SPAWN_X);
    this._syncHud();
  }

  // Travelling d'ouverture : la caméra part du bout de la rue et revient
  // sur le joueur, pour montrer d'un coup tout ce qu'il y a à visiter.
  startIntro(skip) {
    const ew = this.canvas.width / this.zoom;
    const from = Math.max(0, WORLD_WIDTH - ew);
    if (skip || this._reduced || from - this._targetX < 200) { this.beginPlay(true); return; }
    this.mode = 'intro';
    this._intro = { t: 0, from };
    this.cameraX = from;
  }

  // Le joueur prend la main. withTuto : tutoriel si c'est sa 1re partie.
  beginPlay(withTuto) {
    this.mode = 'play';
    this._intro = null;
    this.hud.show(true);
    _setMobileBtns('flex');
    if (withTuto && !this.save.tuto && !this.tuto.active) this.tuto.start();
  }

  // ── Déplacement rapide : clic / toucher sur une maison ──
  // Le personnage marche jusqu'à la porte puis entre. Toute commande
  // manuelle (← →, boutons tactiles) reprend immédiatement la main.
  _onTap(e) {
    if (this.mode !== 'play' || this.paused || this.interactions.isOpen() || this._leaving) return;
    const zoom = this.zoom;
    const wx = this.cameraX + e.clientX / zoom;
    const wy = e.clientY / zoom;
    const groundY = Math.round((this.canvas.height / zoom) * GROUND_RATIO);
    const hit = BUILDINGS_DATA.concat([SPECIAL_DOOR]).find(b =>
      wx >= b.x && wx <= b.x + b.w && wy >= groundY - b.h - 48 && wy <= groundY + 12);
    if (!hit) return;
    this.goTo(hit);
  }

  // Aller à un lieu (clic sur une maison, sur la carte ou sur l'objectif).
  goTo(place) {
    if (this.mode !== 'play' || this._leaving || this._entering || this.interactions.isOpen()) return;
    this._walkTo = { x: place.doorX, target: place };
  }

  // Commandes effectives de la frame : clavier / boutons, ou marche auto.
  _steer() {
    const c = this.controls;
    if (!this._walkTo) return c;
    if (c.left || c.right) { this._walkTo = null; return c; }
    const dx = this._walkTo.x - this.player.x;
    if (Math.abs(dx) <= 10) {
      const t = this._walkTo.target;
      this._walkTo = null;
      this.player.vx = 0;
      this._enter(t);
      return STEER_NONE;
    }
    return dx < 0 ? STEER_LEFT : STEER_RIGHT;
  }

  // Téléporte le joueur (lien profond) et cale la caméra sur lui sans
  // travelling : on « arrive » directement devant la bonne maison.
  placeAt(x) {
    this.player.x = Math.max(0, Math.min(WORLD_WIDTH, x));
    const ew = this.canvas.width / this.zoom;
    this._targetX = Math.max(0, Math.min(WORLD_WIDTH - ew, this.player.x - ew / 2));
    this.cameraX = this._targetX;
  }

  // Route de ce que le joueur regarde : fenêtre ouverte, sinon maison / portail
  // devant lequel il se tient. Sert au bouton « Mode classique ».
  currentRoute() {
    const open = this.interactions.currentRoute();
    if (open) return open;
    const b = this._nearBuilding;
    if (!b) return '';
    return b.isPortal ? '#portail' : (window.Deeplink ? window.Deeplink.build(b.id) : '');
  }

  _resize() {
    this.canvas.width  = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.ctx.imageSmoothingEnabled = false;
    // Zoom adaptatif : ~1 sur mobile, ~1.8 sur grand écran desktop
    this.zoom = Math.min(2.2, Math.max(1, window.innerWidth / 900));
    const eh = Math.round(this.canvas.height / this.zoom);
    this.player.groundY = Math.round(eh * GROUND_RATIO);
  }

  // ── Entrée / sortie d'une maison ─────────────────────
  // La porte s'ouvre, le personnage s'y engouffre, la caméra zoome, puis la
  // fenêtre de section apparaît. Mouvement réduit : ouverture directe.
  _enter(place) {
    if (this._entering || this._leaving) return;
    if (place.isPortal) { this._enterPortal(place); return; }
    this._walkTo = null;
    if (this._reduced) { this.interactions.open(place.id); return; }
    this.player.vx = 0;
    this.player.jumpY = 0;
    this.player.vy = 0;
    this._zoomB = place;
    this._entering = { b: place, t: 0 };
  }

  _stepEntering() {
    const e = this._entering;
    e.t++;
    this.player.x += (e.b.doorX - this.player.x) * 0.3;
    this.player.alpha = Math.max(0, 1 - Math.max(0, e.t - 6) / 9);
    if (e.t >= ENTER_FRAMES) {
      this._entering = null;
      this.interactions.open(e.b.id);
    }
  }

  // Fenêtre ouverte (jeu, carte ou lien profond).
  _onOpen(id) {
    this._inside = true;
    const b = BUILDINGS_DATA.find(x => x.id === id);
    if (b && !this._reduced) {
      this._zoomB = b;
      b.doorOpen = 1;
      this._zoomK = ENTER_ZOOM;
      this.player.alpha = 0;
    }
    if (this.save.visited.indexOf(id) === -1) {
      this.save.visited.push(id);
      this._persist();
      this._newVisit = b || null;
    }
  }

  // Fenêtre refermée : le personnage ressort, et on fête un lieu découvert.
  _onClose() {
    this._inside = false;
    this.tuto.notify('visit');
    const b = this._newVisit;
    this._newVisit = null;
    this._syncHud();
    if (!b) return;

    const done = this.save.visited.length;
    const total = BUILDINGS_DATA.length;
    this.hud.banner('LIEU DÉCOUVERT', done + '/' + total + ' · ' + b.label);
    this.particles.burst(b.x + b.w - 16, this.player.groundY - b.h + 40, 14, b.accent);
    if (window.AudioManager) window.AudioManager.synth('stamp');
    if (done >= total && !this.save.complete) this._missionIn = 70;
  }

  _enterPortal(portal) {
    if (this._leaving) return;
    this._leaving = true;
    this._walkTo = null;
    this.save.x = Math.round(this.player.x);
    this._persist();

    // Même logique audio qu'une entrée de maison : SFX de transition.
    if (window.AudioManager) window.AudioManager.play('transition');

    // Flash chromatique + wipe en panneaux vers la page suivante.
    const fade = document.createElement('div');
    fade.style.cssText =
      'position:fixed;inset:0;z-index:9999;opacity:0;pointer-events:none;' +
      'transition:opacity .45s ease;' +
      'background:' +
        "repeating-linear-gradient(58deg, transparent 0 22px, rgba(255,255,255,0.06) 22px 23px, transparent 23px 46px)," +
        "repeating-linear-gradient(-58deg, transparent 0 22px, rgba(255,255,255,0.06) 22px 23px, transparent 23px 46px)," +
        'radial-gradient(60% 60% at 50% 50%, rgba(25,232,255,0.35) 0%, transparent 70%),' +
        'linear-gradient(115deg, #ff123d 0%, #ff2bb0 32%, #0e1630 33%, #0e1630 66%, #8a3bff 67%, #19e8ff 100%);';
    document.body.appendChild(fade);
    void fade.offsetWidth;
    fade.style.opacity = '1';

    const go = () => { window.location.href = portal.href || '/construire-projet'; };
    fade.addEventListener('transitionend', go, { once: true });
    setTimeout(go, 700); // filet de sécurité si transitionend ne se déclenche pas
  }

  // ── Boucle ───────────────────────────────────────────
  _loop() {
    this._rafId = 0;
    if (!this._running) return;

    // Onglet en arrière-plan : on ne redessine pas la ville (grosse économie
    // CPU/GPU quand la page reste ouverte sans être regardée). La boucle
    // repart sur l'évènement visibilitychange.
    if (document.hidden) return;

    // En pause quand on est revenu à l'accueil : on garde la boucle
    // vivante mais on ne calcule/dessine rien.
    if (document.getElementById('screen-game').classList.contains('hidden')) {
      this._rafId = requestAnimationFrame(this._loop);
      return;
    }

    const modalOpen = this.interactions.isOpen();

    // Close modal
    if (this.controls.close && modalOpen && this.interactions.currentSection() !== 'contact') {
      this.interactions.close();
    }

    // Pause, ou fenêtre de section ouverte : le panneau masque la scène. On
    // garde la boucle vivante mais on ne redessine pas la ville, gros gain
    // CPU/GPU pendant la lecture du contenu.
    if (this.paused || modalOpen) {
      this.controls.flush();
      this._rafId = requestAnimationFrame(this._loop);
      return;
    }

    this._tick++;
    const ctx = this.ctx;
    const h   = this.canvas.height;
    const w   = this.canvas.width;
    const zoom = this.zoom;
    const ew   = w / zoom;  // largeur effective (espace monde)
    const eh   = h / zoom;  // hauteur effective (espace monde)
    const player  = this.player;
    const groundY = player.groundY;
    const playing = this.mode === 'play';

    // ── Mise à jour ──
    if (this._entering) {
      this._stepEntering();
    } else if (playing && !this._leaving) {
      this._updatePlay(groundY);
    } else {
      player.move(STEER_NONE, WORLD_WIDTH);
    }
    this.controls.flush();

    this.traffic.update();
    this.particles.update();
    if (this.npcs.update(playing ? player.x : -9999) && window.AudioManager) window.AudioManager.synth('talk');

    // Portes, zoom et fondu du personnage reviennent d'eux-mêmes au repos.
    const zoomed = !!this._entering || this._inside;
    for (const b of BUILDINGS_DATA) {
      const target = zoomed && b === this._zoomB ? 1 : 0;
      b.doorOpen = (b.doorOpen || 0) + (target - (b.doorOpen || 0)) * 0.25;
    }
    this._zoomK += ((zoomed ? ENTER_ZOOM : 1) - this._zoomK) * 0.18;
    if (!zoomed && player.alpha < 1) player.alpha = Math.min(1, player.alpha + 0.12);

    if (this._leaving) this._shake = 5;
    else if (this._shake > 0.3) this._shake *= 0.85; else this._shake = 0;

    // Portail illuminé une fois la mission accomplie : étincelles qui montent.
    if (SPECIAL_DOOR.boost && this._tick % 5 === 0) {
      this.particles.spawn(SPECIAL_DOOR.x + Math.random() * SPECIAL_DOOR.w, groundY - 6,
        (Math.random() - 0.5) * 0.6, -1.6 - Math.random() * 1.4, 50, 3,
        this._tick % 2 ? CITY.cyan : CITY.magenta, 0);
    }

    // Camera (en espace monde)
    this._targetX = player.x - ew / 2;
    this._targetX = Math.max(0, Math.min(WORLD_WIDTH - ew, this._targetX));
    if (this.mode === 'intro') this._stepIntro();
    else this.cameraX += (this._targetX - this.cameraX) * 0.12;
    const camX = Math.round(this.cameraX);

    // HUD (DOM) : n'écrit dans la page que si une valeur a changé.
    const goal = this._objective();
    if (playing) {
      const near = this._nearBuilding;
      this.hud.setGoal(goal, near === goal ? (this._touch ? '' : '↑') : goal.doorX < player.x ? '←' : '→');
      this.hud.setPlayer(player.x);
    }

    // ── Rendu avec zoom ──
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.scale(zoom, zoom);
    if (this._shake) ctx.translate((Math.random() - 0.5) * this._shake, (Math.random() - 0.5) * this._shake);
    if (this._zoomK > 1.002 && this._zoomB) {
      // Zoom centré sur la porte de la maison où l'on entre.
      const px = this._zoomB.doorX - camX;
      const py = groundY - 40;
      ctx.translate(px, py);
      ctx.scale(this._zoomK, this._zoomK);
      ctx.translate(-px, -py);
    }

    this.map.draw(ctx, camX, eh, this._tick);

    const near = playing && !this._entering ? this._nearBuilding : null;
    if (near) this._drawBuildingGlow(ctx, near, camX, eh);

    this.tokens.draw(ctx, camX, groundY, this._tick);
    this.npcs.draw(ctx, camX, groundY, ew);
    player.draw(ctx, camX);
    this.particles.draw(ctx, camX);

    if (near) this._drawInteractPrompt(ctx, ew, eh, near);
    if (playing) this._drawGoalArrow(ctx, ew, groundY, camX, goal);

    ctx.restore();

    this._rafId = requestAnimationFrame(this._loop);
  }

  // Une frame de jeu : déplacement, saut, interaction, jetons.
  _updatePlay(groundY) {
    const c = this.controls;
    const player = this.player;

    player.move(this._steer(), WORLD_WIDTH);
    if (this._entering || this._leaving) return;
    this.tuto.track(player.x);

    // ↑ / Entrée devant une porte : on entre. Sinon ↑ et Espace font sauter.
    const near = this._nearBuilding = this.map.nearBuilding(player.x, groundY);
    const up = c.interact;
    if (near && (up || c.enter)) {
      this._enter(near);
      return;
    }
    if ((up || c.jump) && player.jump()) {
      this.particles.dust(player.x, groundY, 4, 0);
      if (window.AudioManager) window.AudioManager.synth('jump');
      this.tuto.notify('jump');
    }

    // Jetons de compétences
    const token = this.tokens.collect(player, groundY, this._tick);
    if (token) {
      this.particles.burst(token.x, groundY - (token.high ? 118 : 30), 10, token.color);
      if (window.AudioManager) window.AudioManager.synth('coin');
      this._persist();
      this._syncHud();
      this.tuto.notify('token');
      if (this.tokens.count === this.tokens.total) {
        this.hud.banner('INVENTAIRE COMPLET', this.tokens.total + '/' + this.tokens.total + ' jetons de compétences');
        if (window.AudioManager) window.AudioManager.synth('stamp');
      }
    }

    // Mission accomplie : laisse le temps de voir le tampon du dernier lieu.
    if (this._missionIn > 0 && --this._missionIn === 0) {
      this.save.complete = true;
      this._persist();
      SPECIAL_DOOR.boost = true;
      if (typeof this.onMission === 'function') this.onMission();
    }
  }

  _stepIntro() {
    const i = this._intro;
    i.t++;
    const k = Math.min(1, i.t / INTRO_FRAMES);
    const ease = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
    this.cameraX = i.from + (this._targetX - i.from) * ease;
    if (k >= 1) this.beginPlay(true);
  }

  // Passe le travelling d'ouverture (n'importe quelle touche / toucher).
  skipIntro() {
    if (this.mode !== 'intro') return;
    this.cameraX = this._targetX;
    this.beginPlay(true);
  }

  _drawBuildingGlow(ctx, building, camX, canvasH) {
    const groundY = Math.round(canvasH * GROUND_RATIO);
    const sx = building.x - camX;
    const w  = building.w;
    const by = groundY - building.h;
    const pulse = 0.08 + 0.06 * Math.sin(this._tick * 0.08);

    ctx.save();

    // Double contour « encre » comics décalé (rouge + cyan)
    ctx.globalAlpha = 0.5 + pulse * 2;
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#ff123d';
    ctx.strokeRect(sx - 12, by - 32, w + 24, building.h + 32);
    ctx.strokeStyle = '#19e8ff';
    ctx.strokeRect(sx - 8, by - 28, w + 16, building.h + 28);

    // Halo accent, empilement de contours dégradés (remplace un ctx.shadowBlur
    // de 28 px par frame, l'une des opérations canvas les plus coûteuses).
    ctx.strokeStyle = building.accent;
    for (let g = 0; g < 4; g++) {
      ctx.globalAlpha = (pulse * 3) * (1 - g / 4);
      ctx.lineWidth = 2 + g * 4;
      ctx.strokeRect(sx - 10 - g * 3, by - 30 - g * 3, w + 20 + g * 6, building.h + 30 + g * 6);
    }

    // Lignes de vitesse latérales
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 0.35 + pulse;
    ctx.strokeStyle = building.accent;
    ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) {
      const yy = by + 20 + i * (building.h / 4);
      ctx.beginPath();
      ctx.moveTo(sx - 16 - i * 6, yy);
      ctx.lineTo(sx - 34 - i * 10, yy);
      ctx.moveTo(sx + w + 16 + i * 6, yy);
      ctx.lineTo(sx + w + 34 + i * 10, yy);
      ctx.stroke();
    }

    // Arcs « spider-sense » qui s'étendent autour du bâtiment proche
    const cx = sx + w / 2;
    const cy = by + building.h / 2;
    for (let k = 0; k < 3; k++) {
      const rr = 30 + ((this._tick * 2 + k * 46) % 150);
      ctx.globalAlpha = Math.max(0, 0.35 - rr / 200);
      ctx.lineWidth = 2;
      ctx.strokeStyle = k % 2 ? '#19e8ff' : building.accent;
      ctx.beginPath(); ctx.arc(cx, cy, rr, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
      ctx.beginPath(); ctx.arc(cx, cy, rr, Math.PI * 0.15, Math.PI * 0.85); ctx.stroke();
    }
    ctx.restore();
  }

  // Bulle « ↑ ENTRER · LIEU », collée à la porte, au-dessus du personnage.
  _drawInteractPrompt(ctx, w, h, building) {
    const groundY = Math.round(h * GROUND_RATIO);
    const sx      = building.x - Math.round(this.cameraX) + building.w / 2;
    const py      = groundY - 104 + Math.sin(this._tick * 0.08) * 3;

    ctx.save();
    ctx.font = '10px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    // Libellé + largeur mesurés une fois par bâtiment (chaîne constante).
    this._prompt = this._prompt || Object.create(null);
    let pc = this._prompt[building.id];
    if (!pc) {
      const action = this._touch ? 'ENTRER' : '↑ ENTRER';
      const lbl = `${action} · ${building.promptLabel || building.label}`;
      pc = { label: lbl, lw: ctx.measureText(lbl).width + 28 };
      this._prompt[building.id] = pc;
    }
    const label = pc.label;
    const lw = pc.lw;
    // Reste entièrement à l'écran (petits écrans).
    const bxp = Math.max(6, Math.min(w - lw - 6, sx - lw / 2));
    const tx = bxp + lw / 2;

    // Bulle comics : fond + trait encre + liseré accent + coins
    ctx.fillStyle = 'rgba(10,16,34,0.94)';
    ctx.fillRect(bxp, py - 19, lw, 28);
    ctx.strokeStyle = '#01010a';
    ctx.lineWidth = 3;
    ctx.strokeRect(bxp + 1.5, py - 17.5, lw - 3, 25);
    ctx.strokeStyle = building.accent;
    ctx.lineWidth = 2;
    ctx.strokeRect(bxp - 2, py - 21, lw + 4, 32);
    // queue de bulle vers le bas
    ctx.fillStyle = building.accent;
    ctx.fillRect(sx - 4, py + 11, 8, 6);

    // texte avec décalage RGB
    ctx.fillStyle = 'rgba(255,18,61,0.55)';
    ctx.fillText(label, tx - 0.8, py);
    ctx.fillStyle = 'rgba(25,232,255,0.55)';
    ctx.fillText(label, tx + 0.8, py);
    ctx.fillStyle = '#fff';
    ctx.fillText(label, tx, py);
    ctx.restore();
  }

  // Objectif hors écran : chevron qui pulse au bord, dans sa direction.
  _drawGoalArrow(ctx, ew, groundY, camX, goal) {
    const sx = goal.doorX - camX;
    if (sx >= 0 && sx <= ew) return;
    const left = sx < 0;
    const dir = left ? -1 : 1;
    const beat = Math.sin(this._tick * 0.12);
    const x = (left ? 26 : ew - 26) + dir * beat * 4;
    const y = groundY - 150;

    ctx.save();
    ctx.globalAlpha = 0.75 + 0.25 * beat;
    ctx.beginPath();
    ctx.moveTo(x + dir * 12, y);
    ctx.lineTo(x - dir * 8, y - 14);
    ctx.lineTo(x - dir * 8, y + 14);
    ctx.closePath();
    ctx.fillStyle = goal.accent;
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#01010a';
    ctx.stroke();

    const label = goal.isPortal ? 'PORTAIL' : goal.label;
    ctx.font = '7px "Press Start 2P", monospace';
    ctx.textAlign = left ? 'left' : 'right';
    const lx = left ? 12 : ew - 12;
    ctx.fillStyle = '#01010a';
    ctx.fillText(label, lx + 1, y + 31);
    ctx.fillStyle = '#f5f6ff';
    ctx.fillText(label, lx, y + 30);
    ctx.restore();
  }
}

// ── Background music ──────────────────────────────────
// Déléguée au gestionnaire central (js/audio.js) : création paresseuse,
// déverrouillage au 1er geste utilisateur (iOS/WebView), respect du
// choix SOUND ON/OFF. bg-music.mp3 reste géré exactement comme avant.

function startMusic() {
  if (window.AudioManager) window.AudioManager.playMusic();
}

function stopMusic() {
  if (window.AudioManager) window.AudioManager.stopMusic();
}

// ── Boot ─────────────────────────────────────────────
// Le choix du mode a lieu sur l'écran de sélection (index.html). /aventure
// s'ouvre sur l'écran titre du jeu (une fois par session), puis la ville.

let _game = null;         // instance unique

function _setMobileBtns(display) {
  const mb = document.getElementById('mobile-btns');
  if (mb) mb.style.display = display;
}

function _click() {
  if (window.AudioManager) window.AudioManager.play('click');
}

// Tab reste dans le panneau ouvert (pause, mission accomplie).
function trapTab(e, root) {
  if (e.key !== 'Tab') return;
  const f = Array.prototype.filter.call(
    root.querySelectorAll('a[href], button:not([disabled])'), el => el.offsetParent !== null);
  if (!f.length) return;
  const first = f[0], last = f[f.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
}

// ── Écran titre ───────────────────────────────────────
function showTitle() {
  const el = document.getElementById('title-screen');
  const start = document.getElementById('title-start');
  const fresh = document.getElementById('title-new');
  const line  = document.getElementById('title-save');
  if (!el || !start) { _game.beginPlay(true); return; }

  _game.mode = 'title';
  _setMobileBtns('none');

  const resumable = Save.hasProgress(_game.save);
  if (resumable) {
    start.textContent = 'REPRENDRE';
    start.classList.remove('game-cta--blink');
    fresh.hidden = false;
    line.hidden = false;
    line.textContent = 'Partie en cours : ' + _game.save.visited.length + '/' + BUILDINGS_DATA.length +
      ' lieux · ' + _game.tokens.count + '/' + _game.tokens.total + ' jetons';
  } else if (isTouchUI()) {
    start.textContent = 'TOUCHEZ POUR JOUER';
  }

  el.hidden = false;
  try { start.focus({ preventScroll: true }); } catch (e) { start.focus(); }

  let gone = false;
  const go = (newGame) => {
    if (gone) return;
    gone = true;
    window.removeEventListener('keydown', onKey);
    _click();
    Save.markSession(true);
    if (newGame) _game.reset();
    else if (resumable && _game.save.x) _game.placeAt(_game.save.x);
    el.classList.add('is-out');
    setTimeout(() => { el.hidden = true; }, 320);
    if (document.activeElement && el.contains(document.activeElement)) document.activeElement.blur();
    // Partie reprise : pas de travelling, on est tout de suite aux commandes.
    _game.startIntro(resumable && !newGame);
  };
  // Entrée / Espace lancent la partie, même si le focus a quitté le bouton.
  const onKey = (e) => {
    if (e.code !== 'Enter' && e.code !== 'NumpadEnter' && e.code !== 'Space') return;
    const tag = document.activeElement && document.activeElement.tagName;
    if (tag === 'BUTTON' || tag === 'A') return;
    e.preventDefault();
    go(false);
  };
  window.addEventListener('keydown', onKey);
  start.addEventListener('click', () => go(false));
  fresh.addEventListener('click', () => go(true));
}

// ── Pause (carte, inventaire, commandes, liens) ───────
function initPause() {
  const btn   = document.getElementById('btn-menu');
  const panel = document.getElementById('pause');
  if (!btn || !panel) return;
  const reset = document.getElementById('pause-reset');

  const fill = () => {
    const g = _game;
    document.getElementById('pause-places').textContent = g.save.visited.length + '/' + BUILDINGS_DATA.length;
    document.getElementById('pause-tokens').textContent = g.tokens.count + '/' + g.tokens.total;

    const map = document.getElementById('pause-map');
    map.innerHTML = '';
    for (const b of BUILDINGS_DATA.concat([SPECIAL_DOOR])) {
      const li = document.createElement('li');
      const go = document.createElement('button');
      go.type = 'button';
      go.style.setProperty('--c', b.accent);
      go.className = b.visited ? 'is-done' : '';
      const state = b.isPortal ? (SPECIAL_DOOR.boost ? 'Illuminé' : 'Mini-jeu') : b.visited ? 'Visité' : 'À découvrir';
      go.innerHTML = '<b></b><span></span>';
      go.firstChild.textContent = b.label;
      go.lastChild.textContent = state;
      go.addEventListener('click', () => { set(false); g.goTo(b); });
      li.appendChild(go);
      map.appendChild(li);
    }

    const inv = document.getElementById('pause-inv');
    inv.innerHTML = '';
    for (const t of g.tokens.items) {
      const li = document.createElement('li');
      li.textContent = t.taken ? t.label : '???';
      if (t.taken) { li.className = 'is-got'; li.style.setProperty('--c', t.color); }
      inv.appendChild(li);
    }

    const keys = isTouchUI()
      ? [['◀ ▶', 'Se déplacer'], ['SAUT', 'Sauter'], ['ENTRER', 'Entrer dans une maison'], ['TOUCHER', 'Une maison : y aller directement']]
      : [['← →', 'Se déplacer (ou A / D)'], ['ESPACE', 'Sauter'], ['↑', 'Entrer dans une maison (ou Entrée)'],
         ['↓', 'Fermer une fenêtre (ou Échap)'], ['CLIC', 'Sur une maison : y aller directement'], ['ÉCHAP', 'Pause']];
    document.getElementById('pause-keys').innerHTML =
      keys.map(k => '<li><kbd>' + k[0] + '</kbd><span>' + k[1] + '</span></li>').join('');

    reset.textContent = 'Recommencer la partie';
    reset.dataset.armed = '';
  };

  const set = (open) => {
    if (open === _game.paused) return;
    if (open && (_game.mode !== 'play' || _game.interactions.isOpen())) return;
    _game.paused = open;
    panel.hidden = !open;
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (window.AudioManager) window.AudioManager.play(open ? 'open' : 'close');
    if (open) {
      fill();
      const r = document.getElementById('pause-resume');
      try { r.focus({ preventScroll: true }); } catch (e) { r.focus(); }
    } else if (document.activeElement && panel.contains(document.activeElement)) {
      document.activeElement.blur();
    }
  };
  _game.setPaused = set;

  btn.addEventListener('click', () => set(!_game.paused));
  document.getElementById('pause-resume').addEventListener('click', () => set(false));
  panel.addEventListener('click', (e) => { if (e.target === panel) set(false); });
  document.querySelectorAll('.pause [data-contact-cta]').forEach(el => el.addEventListener('click', _click));
  panel.addEventListener('keydown', (e) => trapTab(e, panel));

  document.getElementById('pause-tuto').addEventListener('click', () => {
    set(false);
    _game.tuto.finish();
    _game.tuto.start();
  });

  // Deux clics : le premier arme, le second efface la partie.
  reset.addEventListener('click', () => {
    if (!reset.dataset.armed) {
      reset.dataset.armed = '1';
      reset.textContent = 'Effacer la progression ? Cliquez pour confirmer';
      return;
    }
    _game.reset();
    set(false);
    _game.hud.banner('NOUVELLE PARTIE', 'Progression remise à zéro');
  });
}

// ── Mission accomplie ─────────────────────────────────
function initMission() {
  const panel = document.getElementById('mission');
  if (!panel) return;

  const set = (open) => {
    panel.hidden = !open;
    _game.paused = open;
    if (open) {
      document.getElementById('mission-stats').textContent =
        _game.tokens.count + '/' + _game.tokens.total + ' jetons de compétences ramassés';
      const c = document.getElementById('mission-continue');
      try { c.focus({ preventScroll: true }); } catch (e) { c.focus(); }
    } else if (document.activeElement && panel.contains(document.activeElement)) {
      document.activeElement.blur();
    }
  };
  _game.closeMission = () => { if (!panel.hidden) { set(false); return true; } return false; };

  _game.onMission = () => {
    if (window.AudioManager) {
      window.AudioManager.synth('fanfare');
      window.AudioManager.play('success');
    }
    set(true);
  };
  document.getElementById('mission-continue').addEventListener('click', () => { _click(); set(false); });
  document.getElementById('mission-portal').addEventListener('click', () => {
    _click();
    set(false);
    _game.goTo(SPECIAL_DOOR);
  });
  panel.addEventListener('keydown', (e) => trapTab(e, panel));
}

// ── Clavier global : pause, travelling ────────────────
function initKeys() {
  window.addEventListener('keydown', (e) => {
    if (!e.repeat) _game.skipIntro();
    const pauseKey = e.key === 'Escape' || e.code === 'KeyP';
    // Échap déjà consommé par une fenêtre de section ou le widget contact.
    if (!pauseKey || e.defaultPrevented) return;
    const tag = document.activeElement && document.activeElement.tagName;
    if (e.code === 'KeyP' && (tag === 'INPUT' || tag === 'TEXTAREA')) return;
    if (_game.closeMission && _game.closeMission()) return;
    if (_game.setPaused) _game.setPaused(!_game.paused);
  });
  window.addEventListener('pointerdown', () => _game.skipIntro());

  // Un bouton cliqué à la souris ne garde pas le focus : sinon Espace
  // (saut) et Entrée le réactiveraient au lieu de piloter le personnage.
  document.addEventListener('click', (e) => {
    const b = e.target.closest && e.target.closest('button, a');
    if (b && e.detail > 0 && !b.closest('.pause, .section-modal, .cw-overlay, .title-screen')) b.blur();
  });
}

// ── Liens profonds (grammaire commune : js/deeplink.js) ──
// #projets/skywalk → joueur devant la GALERIE, fenêtre ouverte sur SkyWalk.
// #portail → devant « Construisez votre projet ». #ville → départ normal.
function applyRoute(route, delay) {
  if (!_game || !route) return;
  if (_game.mode !== 'play' && route.kind !== 'ville') {     // fragment saisi sur l'écran titre
    const title = document.getElementById('title-screen');
    if (title) title.hidden = true;
    _game.beginPlay(false);
  }
  if (route.kind === 'portail') { _game.placeAt(SPECIAL_DOOR.doorX); return; }
  if (route.kind !== 'section') return;
  const b = BUILDINGS_DATA.find(x => x.id === route.section);
  if (!b) return;
  _game.placeAt(b.doorX);
  // Petit temps d'arrivée : on voit la maison avant que la fenêtre s'ouvre.
  setTimeout(() => {
    if (_game.interactions.isOpen()) _game.interactions.close();
    _game.interactions.open(b.id, { slide: route.slug });
  }, delay);
}

function startGame(route) {
  const game = document.getElementById('screen-game');

  // Pas d'unlock() ici : la page s'ouvre sans geste utilisateur. La musique
  // est « voulue » tout de suite et démarre au 1er geste (audio.js, kick()).
  startMusic();

  game.classList.add('screen-enter');
  _game = new Game();
  initPause();
  initMission();
  initKeys();

  const capture = /[?&]capture\b/.test(location.search);   // miniatures (scripts/capture.mjs)
  const section = !!route && route.kind === 'section';
  const direct  = capture || section || (!!route && route.kind === 'portail') || Save.sessionStarted();

  if (!direct) { showTitle(); return; }

  // Arrivée directe (lien profond, retour dans la session) : pas d'écran titre.
  Save.markSession(true);
  if (route && route.kind !== 'ville') applyRoute(route, 380);
  else if (_game.save.x) _game.placeAt(_game.save.x);
  // Lien profond vers une section : on ouvre le contenu, sans tutoriel par-dessus.
  _game.beginPlay(!capture && !section);
}

// ── Passage en mode classique ─────────────────────────
// Emporte le contexte : fenêtre ouverte (et slide) ou maison devant laquelle
// se tient le joueur → même fragment côté classique (classique.html#projets/skywalk).
function switchToClassic(e) {
  const a = e.currentTarget;
  const route = _game ? _game.currentRoute() : '';
  e.preventDefault();
  if (window.AudioManager) {
    window.AudioManager.play('close');
    window.AudioManager.stopMusic();     // le mode classique est silencieux
  }
  window.location.href = a.getAttribute('href').split('#')[0] + route;
}

document.addEventListener('DOMContentLoaded', () => {
  if (window.Deeplink) window.Deeplink.setMode('aventure');

  document.querySelectorAll('[data-switch-classic]').forEach(a => {
    a.addEventListener('click', switchToClassic);
  });

  startGame(window.Deeplink ? window.Deeplink.parse(location.hash) : null);

  // Fragment modifié à la main pendant la partie → on y va.
  window.addEventListener('hashchange', () => {
    const r = window.Deeplink ? window.Deeplink.parse(location.hash) : null;
    if (r) applyRoute(r, 0);
  });
});
