/* ══════════════════════════════════════════════════════
   INPUT.JS : clavier + boutons tactiles → intentions de jeu

     ← → / A D (Q en AZERTY)   se déplacer
     Espace                    sauter
     ↑ / Entrée (W, Z)         interagir
     ↓ / S                     descendre d'une plateforme
     Échap / P                 menu (géré par Game via onPause)

   Les boutons tactiles (ui/TouchControls.js) passent par setVirtual().
   Quand `enabled` est faux (fenêtre, pause, sélecteur), le clavier garde
   son comportement natif : défilement, activation des boutons.
   ══════════════════════════════════════════════════════ */

const LEFT = ['ArrowLeft', 'KeyA', 'KeyQ'];
const RIGHT = ['ArrowRight', 'KeyD'];
const JUMP = ['Space'];
const INTERACT = ['ArrowUp', 'KeyW', 'KeyZ', 'Enter', 'NumpadEnter'];
const DOWN = ['ArrowDown', 'KeyS'];
const GAME_KEYS = new Set([...LEFT, ...RIGHT, ...JUMP, ...DOWN, 'ArrowUp', 'KeyW', 'KeyZ']);

// Interface tactile : basée sur le pointeur réel, pas sur la largeur d'écran.
export function isTouchUI() {
  return !!(window.matchMedia && window.matchMedia('(hover: none) and (pointer: coarse)').matches);
}

function typing() {
  const el = document.activeElement;
  const tag = el && el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
}

// Espace / Entrée restent l'activation native d'un bouton ou d'un lien focalisé.
function onWidget() {
  const tag = document.activeElement && document.activeElement.tagName;
  return tag === 'BUTTON' || tag === 'A';
}

export class Input {
  constructor() {
    this.enabled = false;
    this.onPause = null;      // Échap / P
    this.onAny = null;        // n'importe quelle touche ou toucher (passer une cinématique)
    this._down = Object.create(null);
    this._pressed = Object.create(null);
    this._virtual = { left: false, right: false, jump: false, interact: false, down: false };
    this._vPressed = { jump: false, interact: false };

    window.addEventListener('keydown', (e) => this._onKeyDown(e));
    window.addEventListener('keyup', (e) => { this._down[e.code] = false; });
    window.addEventListener('blur', () => this.reset());
    window.addEventListener('pointerdown', () => { if (this.onAny) this.onAny(); });
  }

  _onKeyDown(e) {
    if (!e.repeat && this.onAny) this.onAny();

    if ((e.key === 'Escape' || e.code === 'KeyP') && !e.defaultPrevented) {
      if (e.code === 'KeyP' && typing()) return;
      if (this.onPause && this.onPause(e) !== false) e.preventDefault();
      return;
    }
    if (!this.enabled || typing()) return;
    if ((e.code === 'Space' || e.code === 'Enter' || e.code === 'NumpadEnter') && onWidget()) return;

    if (!this._down[e.code]) this._pressed[e.code] = true;
    this._down[e.code] = true;
    if (GAME_KEYS.has(e.code)) e.preventDefault();
  }

  _any(codes) {
    for (let i = 0; i < codes.length; i++) if (this._down[codes[i]]) return true;
    return false;
  }
  _anyPressed(codes) {
    for (let i = 0; i < codes.length; i++) if (this._pressed[codes[i]]) return true;
    return false;
  }

  // Boutons tactiles : held = maintenu ; un appui produit aussi un front montant.
  setVirtual(name, held) {
    if (held && !this._virtual[name] && name in this._vPressed) this._vPressed[name] = true;
    this._virtual[name] = held;
  }

  get axis() {
    if (!this.enabled) return 0;
    const l = this._any(LEFT) || this._virtual.left;
    const r = this._any(RIGHT) || this._virtual.right;
    return (r ? 1 : 0) - (l ? 1 : 0);
  }
  get jumpPressed() { return this.enabled && (this._anyPressed(JUMP) || this._vPressed.jump); }
  get jumpHeld() { return this.enabled && (this._any(JUMP) || this._any(INTERACT) || this._virtual.jump); }
  get interactPressed() { return this.enabled && (this._anyPressed(INTERACT) || this._vPressed.interact); }
  get down() { return this.enabled && (this._any(DOWN) || this._virtual.down); }

  // À appeler une fois par image, après la simulation.
  endFrame() {
    for (const k in this._pressed) this._pressed[k] = false;
    this._vPressed.jump = false;
    this._vPressed.interact = false;
  }

  reset() {
    for (const k in this._down) this._down[k] = false;
    for (const k in this._virtual) this._virtual[k] = false;
    this.endFrame();
  }
}
