/* =================================================
   MOBILECONTROLS.JS — Virtual joystick + touch
   ================================================= */

class MobileControls {
  constructor() {
    this.dx = 0;
    this.dy = 0;
    this._interactPressed = false;
    this._active = false;
    this._touchId = null;

    // Joystick DOM refs
    this._zone     = document.getElementById('joystick-zone');
    this._base     = document.getElementById('joystick-base');
    this._thumb    = document.getElementById('joystick-thumb');
    this._btnE     = document.getElementById('btn-interact-mobile');
    this._controls = document.getElementById('mobile-controls');

    this._baseRect  = null;
    this._baseRadius = 44; // max thumb travel radius in px

    this._detectAndShow();
    this._bindEvents();
  }

  _detectAndShow() {
    const isMobile =
      /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
      (navigator.maxTouchPoints && navigator.maxTouchPoints > 1) ||
      window.innerWidth <= 900;

    if (isMobile) {
      this._controls.classList.remove('hidden');
    }

    // Also show on first touch event even on desktop
    window.addEventListener('touchstart', () => {
      this._controls.classList.remove('hidden');
    }, { once: true });
  }

  _bindEvents() {
    // --- Joystick touch ---
    this._zone.addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (this._touchId !== null) return;

      const touch = e.changedTouches[0];
      this._touchId = touch.identifier;
      this._baseRect = this._base.getBoundingClientRect();
      this._active = true;
      this._updateThumb(touch.clientX, touch.clientY);
    }, { passive: false });

    window.addEventListener('touchmove', (e) => {
      if (!this._active) return;
      e.preventDefault();

      for (const touch of e.changedTouches) {
        if (touch.identifier === this._touchId) {
          this._updateThumb(touch.clientX, touch.clientY);
          break;
        }
      }
    }, { passive: false });

    window.addEventListener('touchend', (e) => {
      for (const touch of e.changedTouches) {
        if (touch.identifier === this._touchId) {
          this._touchId = null;
          this._active = false;
          this.dx = 0;
          this.dy = 0;
          this._resetThumb();
          break;
        }
      }
    });

    window.addEventListener('touchcancel', () => {
      this._touchId = null;
      this._active = false;
      this.dx = 0;
      this.dy = 0;
      this._resetThumb();
    });

    // --- Interact button ---
    this._btnE.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this._interactPressed = true;
    }, { passive: false });

    this._btnE.addEventListener('mousedown', () => {
      this._interactPressed = true;
    });
  }

  _updateThumb(clientX, clientY) {
    if (!this._baseRect) return;

    const centerX = this._baseRect.left + this._baseRect.width / 2;
    const centerY = this._baseRect.top  + this._baseRect.height / 2;

    let offsetX = clientX - centerX;
    let offsetY = clientY - centerY;

    const dist = Math.hypot(offsetX, offsetY);

    if (dist > this._baseRadius) {
      offsetX = (offsetX / dist) * this._baseRadius;
      offsetY = (offsetY / dist) * this._baseRadius;
    }

    // Normalize to -1..1
    this.dx = offsetX / this._baseRadius;
    this.dy = offsetY / this._baseRadius;

    // Dead zone
    if (Math.abs(this.dx) < 0.12) this.dx = 0;
    if (Math.abs(this.dy) < 0.12) this.dy = 0;

    // Move thumb visual
    this._thumb.style.transform = `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px))`;
  }

  _resetThumb() {
    this._thumb.style.transform = 'translate(-50%, -50%)';
  }

  getInput() {
    // Auto-sprint when joystick is pushed hard (>80% of radius)
    const mag = Math.hypot(this.dx, this.dy);
    return {
      dx: this.dx,
      dy: this.dy,
      interact: this._interactPressed,
      sprint: mag > 0.8,
    };
  }

  consumeInteract() {
    this._interactPressed = false;
  }
}
