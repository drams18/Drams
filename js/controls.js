/* =================================================
   CONTROLS.JS — Keyboard and mouse/click controls
   ================================================= */

class Controls {
  constructor() {
    this._keys = {};
    this._interactPressed = false;
    this._clickTarget = null;  // { worldX, worldY } for click-to-move

    this._bindEvents();
  }

  _bindEvents() {
    window.addEventListener('keydown', (e) => {
      this._keys[e.code] = true;

      // Interact key
      if (e.code === 'KeyE' || e.code === 'Space') {
        this._interactPressed = true;
      }

      // Close modal with ESC
      if (e.code === 'Escape') {
        const modal = document.getElementById('section-modal');
        if (modal && !modal.classList.contains('hidden')) {
          // Handled by interactions.js
          document.dispatchEvent(new CustomEvent('closeModal'));
        }
        const qnPanel = document.getElementById('quick-nav-panel');
        if (qnPanel && !qnPanel.classList.contains('hidden')) {
          qnPanel.classList.add('hidden');
        }
      }

      // Prevent arrow key page scroll
      const preventKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'];
      if (preventKeys.includes(e.code)) {
        e.preventDefault();
      }
    });

    window.addEventListener('keyup', (e) => {
      this._keys[e.code] = false;
    });

    // Canvas click for building interaction
    document.getElementById('gameCanvas').addEventListener('click', (e) => {
      // Will be handled by game.js using camera transform
      const rect = e.target.getBoundingClientRect();
      this._clickTarget = {
        screenX: e.clientX - rect.left,
        screenY: e.clientY - rect.top,
      };
    });
  }

  getInput() {
    let dx = 0;
    let dy = 0;

    // WASD or Arrow keys
    if (this._keys['KeyW'] || this._keys['ArrowUp'])    dy -= 1;
    if (this._keys['KeyS'] || this._keys['ArrowDown'])  dy += 1;
    if (this._keys['KeyA'] || this._keys['ArrowLeft'])  dx -= 1;
    if (this._keys['KeyD'] || this._keys['ArrowRight']) dx += 1;

    const sprint = !!(this._keys['ShiftLeft'] || this._keys['ShiftRight']);

    return { dx, dy, interact: this._interactPressed, sprint };
  }

  consumeInteract() {
    this._interactPressed = false;
  }

  consumeClick() {
    const t = this._clickTarget;
    this._clickTarget = null;
    return t;
  }

  isModalOpen() {
    return !document.getElementById('section-modal').classList.contains('hidden');
  }
}
