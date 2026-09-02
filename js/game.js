/* ══════════════════════════════════════════════════════
   GAME.JS — Side-scroller engine
   Camera: horizontal only, lerp smoothing
   Renders: map → player → HUD → interact prompt
   ══════════════════════════════════════════════════════ */

'use strict';

class Game {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    // alpha:false → le compositeur saute la transparence du canvas (la scène
    // couvre tout l'écran de toute façon). Gain net à chaque frame.
    this.ctx    = this.canvas.getContext('2d', { alpha: false });
    this.ctx.imageSmoothingEnabled = false;
    this._loop  = this._loop.bind(this);   // pas de closure allouée par frame

    this.controls     = new Controls();
    this.mobile       = new MobileControls(this.controls);
    this.map          = new GameMap();
    this.interactions = new InteractionManager();

    const groundY = () => Math.round(this.canvas.height * GROUND_RATIO);
    this.player = new Player(SPAWN_X, groundY());

    // Camera starts so player is at left of screen
    this.cameraX  = 0;
    this._targetX = 0;

    this._tick          = 0;
    this._nearBuilding  = null;

    // Appareil tactile : les boutons à l'écran + l'intro suffisent,
    // on n'affiche pas le rappel clavier dessiné sur le canvas.
    this._touch = (window.matchMedia &&
      window.matchMedia('(hover: none) and (pointer: coarse)').matches) ||
      'ontouchstart' in window || window.innerWidth <= 900;

    this._resize();
    // Resize coalescé sur une frame (évite plusieurs _resize par salve d'events).
    window.addEventListener('resize', () => {
      if (this._resizeQueued) return;
      this._resizeQueued = true;
      requestAnimationFrame(() => { this._resizeQueued = false; this._resize(); });
    });

    // Les mesures de texte du HUD sont mises en cache ; on les recalcule une
    // fois la police pixel chargée (sinon largeurs basées sur le fallback).
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => { this._hud = null; this._prompt = null; });
    }

    requestAnimationFrame(this._loop);
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

  _loop() {
    // En pause quand on est revenu à l'accueil : on garde la boucle
    // vivante mais on ne calcule/dessine rien.
    if (document.getElementById('screen-game').classList.contains('hidden')) {
      requestAnimationFrame(this._loop);
      return;
    }

    this._tick++;
    const ctx = this.ctx;
    const h   = this.canvas.height;
    const w   = this.canvas.width;

    const modalOpen = this.interactions.isOpen();
    const zoom = this.zoom;
    const ew   = w / zoom;  // largeur effective (espace monde)
    const eh   = h / zoom;  // hauteur effective (espace monde)

    // Close modal
    if (this.controls.close && modalOpen && this.interactions.currentSection() !== 'contact') {
      this.interactions.close();
    }

    // Move player only if modal closed
    if (!modalOpen) {
      this.player.move(this.controls, WORLD_WIDTH);
    }

    // Interact with nearby building
    this._nearBuilding = this.map.nearBuilding(this.player.x, this.player.groundY);
    if (!modalOpen && this._nearBuilding && this.controls.interact) {
      if (this._nearBuilding.isPortal) {
        this._enterPortal(this._nearBuilding);
      } else {
        this.interactions.open(this._nearBuilding.id);
      }
    }

    this.controls.flush();

    // Fenêtre de section ouverte : le panneau (fond ~90 % opaque) masque la
    // scène. On garde la boucle vivante mais on ne redessine pas la ville —
    // gros gain CPU/GPU pendant la lecture du contenu.
    if (modalOpen) {
      requestAnimationFrame(this._loop);
      return;
    }

    // Camera (en espace monde)
    this._targetX = this.player.x - ew / 2;
    this._targetX = Math.max(0, Math.min(WORLD_WIDTH - ew, this._targetX));
    this.cameraX += (this._targetX - this.cameraX) * 0.12;
    const camX = Math.round(this.cameraX);

    // Render avec zoom
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.scale(zoom, zoom);

    this.map.draw(ctx, camX, eh, this._tick);

    if (this._nearBuilding) {
      this._drawBuildingGlow(ctx, this._nearBuilding, camX, eh);
    }

    this.player.draw(ctx, camX);
    this._drawHUD(ctx, ew, eh);

    if (this._nearBuilding && !modalOpen) {
      this._drawInteractPrompt(ctx, ew, eh, this._nearBuilding);
    }

    ctx.restore();

    requestAnimationFrame(this._loop);
  }

  _enterPortal(portal) {
    if (this._leaving) return;
    this._leaving = true;

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

    const go = () => { window.location.href = portal.href || 'construire-projet.html'; };
    fade.addEventListener('transitionend', go, { once: true });
    setTimeout(go, 700); // filet de sécurité si transitionend ne se déclenche pas
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

    // Halo accent — empilement de contours dégradés (remplace un ctx.shadowBlur
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

  _drawHUD(ctx, w, h) {
    // Sur mobile : boutons tactiles visibles + intro → pas de rappel clavier.
    if (this._touch) return;

    ctx.save();
    ctx.font = '8px "Press Start 2P", monospace';

    const KEY = '#ffe066';
    const LBL = 'rgba(255,255,255,0.82)';
    const SEP = 'rgba(255,255,255,0.28)';

    const segments = [
      { text: 'SE DÉPLACER ', color: LBL },
      { text: '← →',          color: KEY },
      { text: '     ',        color: SEP },
      { text: 'ENTRER ',      color: LBL },
      { text: '↑',            color: KEY },
      { text: '     ',        color: SEP },
      { text: 'FERMER ',      color: LBL },
      { text: '↓',            color: KEY },
    ];

    // measureText × 8 par frame pour une chaîne fixe → mesuré une seule fois.
    if (!this._hud) {
      let tw = 0;
      const ws = segments.map(s => {
        const sw = ctx.measureText(s.text).width;
        tw += sw;
        return sw;
      });
      this._hud = { widths: ws, totalW: tw };
    }
    const widths = this._hud.widths;
    const totalW = this._hud.totalW;

    const hintY = h - 20;
    const padX  = 14;
    const padY  = 9;
    let x = Math.round(w / 2 - totalW / 2);

    const bx = x - padX;
    const by = hintY - 10 - padY;
    const bw = totalW + padX * 2;
    const bh = 12 + padY * 2;

    // Cartouche « caption box » comics
    ctx.fillStyle = 'rgba(10,16,34,0.88)';
    ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = '#01010a';
    ctx.lineWidth = 3;
    ctx.strokeRect(bx + 1.5, by + 1.5, bw - 3, bh - 3);
    ctx.strokeStyle = '#19e8ff';
    ctx.lineWidth = 1;
    ctx.strokeRect(bx - 2, by - 2, bw + 4, bh + 4);
    ctx.fillStyle = '#ff123d';
    ctx.fillRect(bx - 4, by - 4, 6, 6);
    ctx.fillRect(bx + bw - 2, by + bh - 2, 6, 6);

    ctx.textAlign = 'left';
    for (let i = 0; i < segments.length; i++) {
      // léger décalage RGB
      ctx.fillStyle = 'rgba(255,18,61,0.5)';
      ctx.fillText(segments[i].text, x - 0.6, hintY);
      ctx.fillStyle = segments[i].color;
      ctx.fillText(segments[i].text, x, hintY);
      x += widths[i];
    }

    ctx.restore();
  }

  _drawInteractPrompt(ctx, w, h, building) {
    const groundY = Math.round(h * GROUND_RATIO);
    const sx      = building.x - Math.round(this.cameraX) + building.w / 2;
    const py      = groundY - building.h - 50 + Math.sin(this._tick * 0.08) * 4;

    ctx.save();
    ctx.font = '9px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    // Libellé + largeur mesurés une fois par bâtiment (chaîne constante).
    this._prompt = this._prompt || Object.create(null);
    let pc = this._prompt[building.id];
    if (!pc) {
      const action = this._touch ? 'ENTRER' : '↑ ENTRER';
      const lbl = `${action} · ${building.promptLabel || building.label}`;
      pc = { label: lbl, lw: ctx.measureText(lbl).width + 24 };
      this._prompt[building.id] = pc;
    }
    const label = pc.label;
    const lw = pc.lw;
    const bxp = sx - lw / 2;

    // Bulle comics : fond + trait encre + liseré accent + coins
    ctx.fillStyle = 'rgba(10,16,34,0.9)';
    ctx.fillRect(bxp, py - 17, lw, 24);
    ctx.strokeStyle = '#01010a';
    ctx.lineWidth = 3;
    ctx.strokeRect(bxp + 1.5, py - 15.5, lw - 3, 21);
    ctx.strokeStyle = building.accent;
    ctx.lineWidth = 2;
    ctx.strokeRect(bxp - 2, py - 19, lw + 4, 28);
    // queue de bulle vers le bas
    ctx.fillStyle = 'rgba(10,16,34,0.9)';
    ctx.fillRect(sx - 3, py + 7, 6, 5);

    // texte avec décalage RGB
    ctx.fillStyle = 'rgba(255,18,61,0.55)';
    ctx.fillText(label, sx - 0.8, py);
    ctx.fillStyle = 'rgba(25,232,255,0.55)';
    ctx.fillText(label, sx + 0.8, py);
    ctx.fillStyle = '#fff';
    ctx.fillText(label, sx, py);
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

let _game = null;         // instance unique (créée à la 1re partie)
let _introShown = false;  // l'intro du jeu ne s'affiche qu'une fois

function _setMobileBtns(display) {
  const mb = document.getElementById('mobile-btns');
  if (mb) mb.style.display = display;
}

function showGameIntro() {
  if (_introShown) return;
  _introShown = true;

  const intro = document.getElementById('game-intro');
  const list  = document.getElementById('game-intro-list');
  if (!intro || !list) return;

  const touch = (window.matchMedia &&
    window.matchMedia('(hover: none) and (pointer: coarse)').matches) ||
    'ontouchstart' in window || window.innerWidth <= 900;

  list.innerHTML = touch
    ? `<li><b>◀ &nbsp;▶</b><span>Se déplacer dans le village</span></li>
       <li><b>ENTRER</b><span>Entrer dans une maison quand vous êtes devant la porte</span></li>
       <li><b>FERMER</b><span>Fermer une fenêtre ouverte</span></li>`
    : `<li><b>← &nbsp;→</b><span>Se déplacer (ou les touches A / D)</span></li>
       <li><b>↑</b><span>Entrer dans une maison (ou la touche W)</span></li>
       <li><b>↓</b><span>Fermer une fenêtre (ou la touche S)</span></li>`;

  intro.classList.remove('hidden');

  const closeIntro = () => intro.classList.add('hidden');

  document.getElementById('btn-intro-close')
    ?.addEventListener('click', () => {
      if (window.AudioManager) window.AudioManager.play('click');
      closeIntro();
    }, { once: true });

  // Se ferme aussi dès le premier déplacement / première touche mobile
  const onKey = (e) => {
    if (['ArrowLeft','ArrowRight','ArrowUp','KeyA','KeyD','KeyW','KeyQ','KeyZ'].includes(e.code)) {
      closeIntro();
      window.removeEventListener('keydown', onKey);
    }
  };
  window.addEventListener('keydown', onKey);

  const mb = document.getElementById('mobile-btns');
  mb?.addEventListener('touchstart', closeIntro, { once: true, passive: true });
}

// ── Modal d'information audio ─────────────────────────
// Affichée une seule fois par visiteur, juste après « Let's go ! », pour
// recommander d'activer le son. Elle NE crée aucun second moteur audio :
// tout passe par window.AudioManager (musique, SFX, bouton SOUND). Une fois
// vue (mémorisée dans localStorage), « Let's go ! » enchaîne directement.
const AUDIO_HINT_KEY = 'drame.portfolio.audioHint';

function audioHintSeen() {
  try { return localStorage.getItem(AUDIO_HINT_KEY) === 'seen'; }
  catch (e) { return true; }   // stockage indisponible : on n'insiste pas
}

function markAudioHintSeen() {
  try { localStorage.setItem(AUDIO_HINT_KEY, 'seen'); } catch (e) { /* noop */ }
}

function showAudioHint(onContinue) {
  const modal = document.getElementById('audio-hint');
  const btn   = document.getElementById('audio-hint-continue');
  if (!modal || !btn) { onContinue(); return; }

  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    markAudioHintSeen();
    btn.removeEventListener('click', finish);
    window.removeEventListener('keydown', onKey);
    if (window.AudioManager) window.AudioManager.play('click');
    modal.classList.add('audio-hint--out');
    setTimeout(() => {
      modal.classList.add('hidden');
      modal.classList.remove('audio-hint--in', 'audio-hint--out');
    }, 180);
    onContinue();
  };
  const onKey = (e) => {
    if (e.code === 'Enter' || e.code === 'NumpadEnter' || e.code === 'Escape') {
      e.preventDefault();
      finish();
    }
  };

  modal.classList.remove('hidden');
  void modal.offsetWidth;
  modal.classList.add('audio-hint--in');
  btn.addEventListener('click', finish);
  window.addEventListener('keydown', onKey);
  try { btn.focus({ preventScroll: true }); } catch (e) { try { btn.focus(); } catch (_) {} }
}

function onStartClick() {
  if (audioHintSeen()) { startGame(); return; }
  // Le clic « Let's go ! » amorce déjà l'audio (geste utilisateur) ; le jeu
  // ne démarre qu'après « Continuer », lui aussi un geste utilisateur — la
  // lecture audio iOS/WebView reste donc autorisée.
  if (window.AudioManager) window.AudioManager.unlock();
  showAudioHint(startGame);
}

function startGame() {
  const welcome = document.getElementById('screen-welcome');
  const game    = document.getElementById('screen-game');

  // Init + play audio synchronously inside the user gesture (required on iOS/WebView)
  if (window.AudioManager) window.AudioManager.unlock();
  startMusic();

  welcome.classList.remove('screen-enter');
  welcome.classList.add('screen-exit');
  setTimeout(() => {
    welcome.classList.add('hidden');
    welcome.classList.remove('screen-exit');

    game.classList.remove('hidden', 'screen-enter');
    void game.offsetWidth;              // reflow → rejoue l'animation d'entrée
    game.classList.add('screen-enter');

    // Entrée dans le village = arrivée dans une nouvelle pièce
    if (window.AudioManager) window.AudioManager.play('transition');

    if (!_game) {
      _game = new Game();               // créé une seule fois
      showGameIntro();
    }
    _setMobileBtns('flex');
  }, 500);
}

function goHome() {
  const welcome = document.getElementById('screen-welcome');
  const game    = document.getElementById('screen-game');

  if (window.AudioManager) window.AudioManager.play('close');
  stopMusic();
  if (_game && _game.interactions) _game.interactions.close();

  game.classList.add('hidden');
  game.classList.remove('screen-enter');
  _setMobileBtns('none');

  welcome.classList.remove('hidden', 'screen-exit', 'screen-enter');
  void welcome.offsetWidth;
  welcome.classList.add('screen-enter');
}

document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('btn-start');
  if (btn) {
    // Pré-déverrouille l'audio au moindre contact avant le clic (iOS WebView).
    const unlock = () => {
      if (window.AudioManager) window.AudioManager.unlock();
      btn.removeEventListener('touchstart', unlock);
      btn.removeEventListener('mousedown',  unlock);
    };
    btn.addEventListener('touchstart', unlock, { passive: true });
    btn.addEventListener('mousedown',  unlock);
    btn.addEventListener('click', onStartClick);
  }

  document.getElementById('btn-home')?.addEventListener('click', goHome);
});
