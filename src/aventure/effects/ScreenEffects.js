/* ══════════════════════════════════════════════════════
   SCREENEFFECTS.JS : transitions plein écran (voile DOM)

   Un seul voile, habillé par l'univers courant (CSS) : fondu doux pour la
   ville, balayage oblique pour le héros, coupe au noir pour le club.
   Rapides (≈ 300 ms), et réduites à un simple fondu court si l'utilisateur
   préfère moins d'animations.
   ══════════════════════════════════════════════════════ */

const wait = (ms) => new Promise(r => setTimeout(r, ms));

export class ScreenEffects {
  constructor(root) {
    this.reduced = false;
    this.el = document.createElement('div');
    this.el.className = 'adv-veil';
    this.el.setAttribute('aria-hidden', 'true');
    root.appendChild(this.el);
  }

  get duration() { return this.reduced ? 90 : 300; }

  cover() {
    this.el.classList.add('is-on');
    return wait(this.duration);
  }

  reveal() {
    this.el.classList.remove('is-on');
    return wait(this.duration);
  }

  // Couvre l'écran, exécute `fn` à l'abri du voile, puis découvre.
  async through(fn) {
    await this.cover();
    await fn();
    await wait(40);
    return this.reveal();
  }
}
