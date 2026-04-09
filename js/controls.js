/* ══════════════════════════════════════════════════════
   CONTROLS.JS — Keyboard input (side-scroller)
   ← / Q / A move left | → / D move right
   ↑ / W / Z interact  | ↓ / S close
   ══════════════════════════════════════════════════════ */

'use strict';

class Controls {
  constructor() {
    this._keys = {};
    this._justPressedKeys = {};

    window.addEventListener('keydown', (e) => {
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
      this._keys[e.code] = false;
    });
  }

  flush() {
    this._justPressedKeys = {};
  }

  _justPressed(code) {
    return !!this._justPressedKeys[code];
  }

  get left()     { return !!(this._keys['ArrowLeft']  || this._keys['KeyA'] || this._keys['KeyQ']); }
  get right()    { return !!(this._keys['ArrowRight'] || this._keys['KeyD']); }
  get interact() { return this._justPressed('ArrowUp')   || this._justPressed('KeyW') || this._justPressed('KeyZ'); }
  get close()    { return this._justPressed('ArrowDown') || this._justPressed('KeyS'); }
}
