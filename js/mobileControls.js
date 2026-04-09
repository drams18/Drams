/* ══════════════════════════════════════════════════════
   MOBILECONTROLS.JS — Touch buttons for side-scroller
   Buttons: ← left | → right | ENTRER | FERMER
   ══════════════════════════════════════════════════════ */

'use strict';

class MobileControls {
  constructor(controls) {
    this._controls = controls;
    this._isMobile = this._detectMobile();

    if (this._isMobile) {
      this._inject();
      this._bind();
    }
  }

  _detectMobile() {
    return window.innerWidth <= 900 || 'ontouchstart' in window;
  }

  _inject() {
    const existing = document.getElementById('mobile-btns');
    if (existing) existing.remove();

    const div = document.createElement('div');
    div.id = 'mobile-btns';
    div.innerHTML = `
      <button id="mbtn-left"  class="mbtn" aria-label="Aller à gauche">G</button>
      <button id="mbtn-enter" class="mbtn mbtn-enter" aria-label="Entrer">ENTRER</button>
      <button id="mbtn-close" class="mbtn mbtn-close" aria-label="Fermer">FERMER</button>
      <button id="mbtn-right" class="mbtn" aria-label="Aller à droite">D</button>
    `;
    document.body.appendChild(div);
  }

  _bind() {
    const bind = (id, onStart, onEnd) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('touchstart', (e) => { e.preventDefault(); onStart(); }, { passive: false });
      el.addEventListener('touchend',   (e) => { e.preventDefault(); onEnd();   }, { passive: false });
      el.addEventListener('mousedown',  onStart);
      el.addEventListener('mouseup',    onEnd);
    };

    bind('mbtn-left',
      () => { this._controls._keys['ArrowLeft'] = true; },
      () => { this._controls._keys['ArrowLeft'] = false; }
    );

    bind('mbtn-right',
      () => { this._controls._keys['ArrowRight'] = true; },
      () => { this._controls._keys['ArrowRight'] = false; }
    );

    bind('mbtn-enter',
      () => {
        this._controls._justPressedKeys['ArrowUp'] = true;
        this._controls._keys['ArrowUp'] = true;
      },
      () => { this._controls._keys['ArrowUp'] = false; }
    );

    bind('mbtn-close',
      () => {
        this._controls._justPressedKeys['ArrowDown'] = true;
        this._controls._keys['ArrowDown'] = true;
      },
      () => { this._controls._keys['ArrowDown'] = false; }
    );
  }

  get isMobile() { return this._isMobile; }
}
