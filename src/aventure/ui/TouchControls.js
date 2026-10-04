/* ══════════════════════════════════════════════════════
   TOUCHCONTROLS.JS : boutons tactiles (uniquement sur un appareil tactile)
   ◀ ▶ à gauche, SAUT et ENTRER à droite. Évènements pointeur : plusieurs
   doigts à la fois (courir + sauter).
   ══════════════════════════════════════════════════════ */

import { h } from './dom.js';
import { isTouchUI } from '../core/Input.js';

const ARROW = (d) => {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  p.setAttribute('d', d);
  svg.appendChild(p);
  return svg;
};

export class TouchControls {
  constructor(root, input) {
    this.active = isTouchUI();
    this.el = null;
    if (!this.active) return;

    const btn = (cls, name, label, child) => {
      const b = h('button.adv-touch__btn.' + cls, { type: 'button', 'aria-label': label }, child || label);
      const set = (on) => (e) => {
        e.preventDefault();
        if (on) { try { b.setPointerCapture(e.pointerId); } catch (err) { /* noop */ } }
        b.classList.toggle('is-down', on);
        input.setVirtual(name, on);
      };
      b.addEventListener('pointerdown', set(true));
      b.addEventListener('pointerup', set(false));
      b.addEventListener('pointercancel', set(false));
      b.addEventListener('lostpointercapture', () => { b.classList.remove('is-down'); input.setVirtual(name, false); });
      b.addEventListener('contextmenu', (e) => e.preventDefault());
      return b;
    };

    this.action = btn('adv-touch__btn--action', 'interact', 'Entrer', 'ENTRER');
    this.el = h('div.adv-touch', { hidden: true },
      h('div.adv-touch__pad', null,
        btn('adv-touch__btn--dir', 'left', 'Aller à gauche', ARROW('M15 4 7 12l8 8')),
        btn('adv-touch__btn--dir', 'right', 'Aller à droite', ARROW('m9 4 8 8-8 8'))),
      h('div.adv-touch__pad', null,
        this.action,
        btn('adv-touch__btn--jump', 'jump', 'Sauter', 'SAUT')));
    root.appendChild(this.el);
  }

  show(on) { if (this.el) this.el.hidden = !on; }

  // Le bouton ENTRER s'allume devant une porte.
  setReady(on) { if (this.action) this.action.classList.toggle('is-ready', on); }
}
