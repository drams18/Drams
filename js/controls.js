/* ══════════════════════════════════════════════════════
   CONTROLS.JS — Keyboard input (side-scroller)
   ← → move | Space/E interact | Esc/Shift close
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

      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].includes(e.code)) {
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

  get left()     { return !!(this._keys['ArrowLeft']  || this._keys['KeyA']); }
  get right()    { return !!(this._keys['ArrowRight'] || this._keys['KeyD']); }
  get interact() { return this._justPressed('Space') || this._justPressed('KeyE'); }
  get close()    { return this._justPressed('Escape') || this._justPressed('ShiftLeft'); }
}
