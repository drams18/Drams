/* ══════════════════════════════════════════════════════
   CONTROLS.JS — Keyboard input (side-scroller)
   ← / Q / A move left | → / D move right
   ↑ / W / Z interact  | ↓ / S close
   ══════════════════════════════════════════════════════ */

'use strict';

// Détection UNIQUE « interface tactile » pour tout le portfolio (boutons à
// l'écran, libellés tactiles, rappel clavier masqué). Basée sur le pointeur
// réel, pas sur la largeur d'écran ni le user-agent : un PC tactile piloté
// à la souris garde l'interface clavier, une tablette a les boutons.
function isTouchUI() {
  return !!(window.matchMedia && window.matchMedia('(hover: none) and (pointer: coarse)').matches);
}

class Controls {
  constructor() {
    this._keys = {};
    this._justPressedKeys = {};

    window.addEventListener('keydown', (e) => {
      if (this._isTyping()) return;

      if (!this._keys[e.code]) {
        this._justPressedKeys[e.code] = true;
      }
      this._keys[e.code] = true;

      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space',
           'KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyZ', 'KeyQ'].includes(e.code)) {
        e.preventDefault();
      }
    });

    window.addEventListener('keyup', (e) => {
      if (this._isTyping()) {
        this._keys[e.code] = false;
        return;
      }
      this._keys[e.code] = false;
    });
  }

  _isTyping() {
    const tag = document.activeElement?.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA';
  }

  flush() {
    this._justPressedKeys = {};
  }

  _justPressed(code) {
    return !!this._justPressedKeys[code];
  }

  get left()     { return !this._isTyping() && !!(this._keys['ArrowLeft']  || this._keys['KeyA'] || this._keys['KeyQ']); }
  get right()    { return !this._isTyping() && !!(this._keys['ArrowRight'] || this._keys['KeyD']); }
  get interact() { return !this._isTyping() && (this._justPressed('ArrowUp')   || this._justPressed('KeyW') || this._justPressed('KeyZ')); }
  get close()    { return !this._isTyping() && (this._justPressed('ArrowDown') || this._justPressed('KeyS')); }
}
