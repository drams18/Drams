/* ══════════════════════════════════════════════════════
   GAMELOOP.JS : boucle requestAnimationFrame + deltaTime

   La simulation avance en SECONDES, jamais en frames : le même jeu tourne
   à l'identique à 30, 60, 120, 144 ou 165 Hz. Un gros delta (onglet
   suspendu, saccade) est plafonné, puis découpé en pas d'au plus
   `maxStep` pour que la physique reste stable.

   La boucle ne tourne que si elle a quelque chose à montrer : elle
   s'arrête d'elle-même quand l'onglet est caché et repart à son retour ;
   `pause()` / `resume()` la suspendent (pause, fenêtre ouverte).
   ══════════════════════════════════════════════════════ */

export const MAX_DELTA = 0.1;      // s : au-delà, le temps perdu est abandonné
export const MAX_STEP = 1 / 60;    // s : pas de simulation maximal

// Avance une simulation de `dt` secondes par pas d'au plus `maxStep`.
// Fonction pure (sans rAF) : c'est elle que les tests pilotent.
export function advance(update, dt, maxStep = MAX_STEP) {
  const steps = Math.max(1, Math.ceil(dt / maxStep - 1e-9));
  const step = dt / steps;
  for (let i = 0; i < steps; i++) update(step);
  return steps;
}

export class GameLoop {
  constructor({ update, render }) {
    this._update = update;
    this._render = render;
    this._frame = this._frame.bind(this);   // pas de closure allouée par frame
    this._raf = 0;
    this._last = 0;
    this._running = false;
    this._paused = false;
    this.time = 0;          // temps de jeu écoulé (s)
    this.fps = 0;           // lissé, pour le diagnostic

    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) this._schedule();
    });
  }

  get active() { return this._running && !this._paused; }

  start() {
    this._running = true;
    this._schedule();
  }

  stop() {
    this._running = false;
    this._cancel();
  }

  pause() {
    this._paused = true;
    this._cancel();
  }

  resume() {
    this._paused = false;
    this._schedule();
  }

  // Une image hors boucle (redessiner la scène derrière un panneau).
  renderOnce() {
    this._render(0, this.time);
  }

  _cancel() {
    if (this._raf) cancelAnimationFrame(this._raf);
    this._raf = 0;
  }

  _schedule() {
    if (this._raf || !this.active || document.hidden) return;
    this._last = 0;          // repart sans delta : le temps suspendu ne compte pas
    this._raf = requestAnimationFrame(this._frame);
  }

  _frame(now) {
    this._raf = 0;
    if (!this.active || document.hidden) return;

    let dt = this._last ? (now - this._last) / 1000 : MAX_STEP;
    this._last = now;
    if (dt <= 0) dt = MAX_STEP;
    if (dt > MAX_DELTA) dt = MAX_DELTA;

    this.fps += ((1 / dt) - this.fps) * 0.05;
    this.time += dt;
    advance(this._update, dt);
    this._render(dt, this.time);

    if (this.active) this._raf = requestAnimationFrame(this._frame);
  }
}
