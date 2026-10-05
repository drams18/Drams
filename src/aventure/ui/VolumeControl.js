/* VOLUMECONTROL.JS : la jauge de volume, la même dans les trois univers. */

import { h } from './dom.js';

// onChange(v) : v de 0 à 1, à chaque déplacement du curseur.
export function volumeControl(cls, onChange) {
  const range = h('input.adv-vol__range', { type: 'range', min: '0', max: '100', step: '5', 'aria-label': 'Volume du son' });
  const out = h('span.adv-vol__val', { 'aria-hidden': 'true' });
  range.addEventListener('input', () => onChange(range.value / 100));
  // Les flèches règlent la jauge : elles ne doivent pas piloter le jeu ou les cartes.
  range.addEventListener('keydown', (e) => { if (e.key.startsWith('Arrow')) e.stopPropagation(); });
  const el = h('label.adv-vol' + (cls ? '.' + cls : ''), null, h('span.adv-vol__label', null, 'Volume'), range, out);
  return {
    el,
    set(on, volume) {
      const pct = on ? Math.round(volume * 100) : 0;
      range.value = String(pct);
      range.style.setProperty('--k', pct + '%');
      range.setAttribute('aria-valuetext', pct + ' %');
      out.textContent = pct + ' %';
    },
  };
}
