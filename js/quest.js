/* ══════════════════════════════════════════════════════
   QUEST.JS : Ce qui fait du mode aventure un jeu « avec un but »
     • Save     : sauvegarde de la partie (localStorage)
     • Hud      : carte de la rue, objectif courant, compteurs, bandeau
     • Tutorial : tutoriel de 1re partie, pas à pas, non bloquant

   Interface en DOM (nette à tous les zooms, accessible au clavier) ;
   le canvas ne dessine que le monde. Piloté par js/game.js.
   ══════════════════════════════════════════════════════ */

'use strict';

// ── Sauvegarde ────────────────────────────────────────
const Save = {
  KEY: 'drame.aventure.save',
  SESSION: 'drame.aventure.session',   // écran titre : une fois par session

  blank() { return { v: 1, visited: [], tokens: [], complete: false, tuto: false, x: null }; },

  load() {
    try {
      const s = JSON.parse(localStorage.getItem(Save.KEY));
      if (s && s.v === 1 && Array.isArray(s.visited) && Array.isArray(s.tokens)) return s;
    } catch (e) { /* stockage indisponible ou donnée illisible */ }
    return Save.blank();
  },

  write(state) {
    try { localStorage.setItem(Save.KEY, JSON.stringify(state)); } catch (e) { /* noop */ }
  },

  clear() {
    try { localStorage.removeItem(Save.KEY); } catch (e) { /* noop */ }
  },

  hasProgress(s) { return s.visited.length > 0 || s.tokens.length > 0; },

  sessionStarted() {
    try { return sessionStorage.getItem(Save.SESSION) === '1'; } catch (e) { return false; }
  },
  markSession(on) {
    try {
      if (on) sessionStorage.setItem(Save.SESSION, '1');
      else sessionStorage.removeItem(Save.SESSION);
    } catch (e) { /* noop */ }
  },
};

// ── HUD ───────────────────────────────────────────────
class Hud {
  // onGoto(lieu) : le joueur a cliqué un lieu sur la carte ou l'objectif.
  constructor(onGoto) {
    this.el      = document.getElementById('hud');
    this._goal   = document.getElementById('hud-goal');
    this._goalT  = document.getElementById('hud-goal-txt');
    this._goalD  = document.getElementById('hud-goal-dir');
    this._places = document.getElementById('hud-places');
    this._tokens = document.getElementById('hud-tokens');
    this._map    = document.getElementById('hud-map');
    this._banner = document.getElementById('hud-banner');
    this._onGoto = onGoto;
    this._goalTarget = null;
    this._last = { pos: -1, goal: '', dir: '' };
    this._dots = Object.create(null);

    this._buildMap();
    this._goal.addEventListener('click', () => {
      if (this._goalTarget) this._onGoto(this._goalTarget);
    });
  }

  // Un point par lieu, à sa position réelle dans la rue.
  _buildMap() {
    const places = BUILDINGS_DATA.concat([SPECIAL_DOOR]);
    for (const b of places) {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'hud__dot' + (b.isPortal ? ' hud__dot--portal' : '');
      dot.style.left = (b.doorX / WORLD_WIDTH * 100).toFixed(2) + '%';
      dot.style.setProperty('--c', b.accent);
      const name = b.isPortal ? 'PORTAIL' : b.label;
      dot.setAttribute('aria-label', 'Aller à : ' + b.label);
      dot.innerHTML = '<span>' + name + '</span>';
      dot.addEventListener('click', () => this._onGoto(b));
      this._map.appendChild(dot);
      this._dots[b.id] = dot;
    }
    this._me = document.createElement('span');
    this._me.className = 'hud__me';
    this._me.innerHTML = '<i></i>';
    this._map.appendChild(this._me);
  }

  show(on) { this.el.hidden = !on; }

  setCounts(places, placesTotal, tokens, tokensTotal) {
    this._places.textContent = places + '/' + placesTotal;
    this._tokens.textContent = tokens + '/' + tokensTotal;
    for (const b of BUILDINGS_DATA) {
      const d = this._dots[b.id];
      d.classList.toggle('is-done', !!b.visited);
      d.setAttribute('aria-label', 'Aller à : ' + b.label + (b.visited ? ' (visité)' : ''));
    }
  }

  // dir : '←' | '→' | '↑' (devant la porte). Mis à jour seulement au changement.
  setGoal(target, dir) {
    const id = target ? target.id : '';
    if (id === this._last.goal && dir === this._last.dir) return;
    if (id !== this._last.goal) {
      for (const k in this._dots) this._dots[k].classList.toggle('is-goal', k === id);
      this._goalT.textContent = target ? (target.promptLabel || target.label) : '';
    }
    this._goalD.textContent = dir;
    this._goalTarget = target;
    this._last.goal = id;
    this._last.dir = dir;
  }

  setPlayer(x) {
    const pos = Math.round(x / WORLD_WIDTH * 1000) / 10;
    if (pos === this._last.pos) return;
    this._last.pos = pos;
    this._me.style.transform = 'translateX(' + pos + '%)';
  }

  // Bandeau central éphémère (« LIEU DÉCOUVERT 2/4 »).
  banner(title, sub) {
    const b = this._banner;
    b.innerHTML = '<b></b><span></span>';
    b.firstChild.textContent = title;
    b.lastChild.textContent = sub || '';
    b.hidden = false;
    b.classList.remove('is-in');
    void b.offsetWidth;
    b.classList.add('is-in');
    clearTimeout(this._bannerT);
    this._bannerT = setTimeout(() => { b.classList.remove('is-in'); b.hidden = true; }, 2200);
  }

  highlight(on) { this.el.classList.toggle('is-tuto', !!on); }
}

// ── Tutoriel de première partie ───────────────────────
// Quatre étapes, validées en JOUANT (pas en lisant) : se déplacer, sauter,
// entrer dans une maison, suivre l'objectif. La carte reste en bas de
// l'écran, la ville est jouable derrière ; « Passer » à tout moment.
class Tutorial {
  constructor(hud, onDone) {
    this.el      = document.getElementById('tuto');
    this._step   = document.getElementById('tuto-step');
    this._keys   = document.getElementById('tuto-keys');
    this._title  = document.getElementById('tuto-title');
    this._text   = document.getElementById('tuto-text');
    this._dots   = document.getElementById('tuto-dots');
    this._next   = document.getElementById('tuto-next');
    this._skip   = document.getElementById('tuto-skip');
    this._hud    = hud;
    this._onDone = onDone;
    this.active  = false;
    this._i      = 0;

    const touch = isTouchUI();
    this.steps = [
      { id: 'move', keys: touch ? ['◀', '▶'] : ['←', '→'],
        title: 'DÉPLACEZ-VOUS',
        text: touch ? 'Avec les flèches en bas de l\'écran.' : 'Avec les flèches du clavier (ou A / D).' },
      { id: 'jump', keys: touch ? ['SAUT'] : ['ESPACE'],
        title: 'SAUTEZ',
        text: 'Des jetons de compétences flottent dans la rue. Certains sont en hauteur : sautez pour les attraper.' },
      { id: 'enter', keys: touch ? ['ENTRER'] : ['↑'],
        title: 'ENTREZ DANS UNE MAISON',
        text: touch
          ? 'Placez-vous devant une porte, puis ENTRER. Ou touchez une maison pour y aller directement.'
          : 'Placez-vous devant une porte, puis ↑ (ou Entrée). Ou cliquez une maison pour y aller directement.' },
      { id: 'goal', keys: ['4 LIEUX'],
        title: 'SUIVEZ L\'OBJECTIF',
        text: 'La carte en haut de l\'écran montre les lieux à visiter et le prochain objectif. Visitez les 4 pour terminer la mission. Le bouton Menu met le jeu en pause (CV, contact, carte).',
        manual: true },
    ];

    this._next.addEventListener('click', () => {
      if (window.AudioManager) window.AudioManager.play('click');
      this._advance();
    });
    this._skip.addEventListener('click', () => {
      if (window.AudioManager) window.AudioManager.play('close');
      this.finish();
    });
  }

  start() {
    this.active = true;
    this._i = 0;
    this._moved = 0;
    this._lastX = null;
    this.el.hidden = false;
    this._render();
    requestAnimationFrame(() => this.el.classList.add('is-in'));
  }

  _render() {
    const s = this.steps[this._i];
    this.el.classList.remove('is-ok');
    this._step.textContent = 'TUTORIEL ' + (this._i + 1) + '/' + this.steps.length;
    this._keys.innerHTML = s.keys.map(k => '<kbd>' + k + '</kbd>').join('');
    this._title.textContent = s.title;
    this._text.textContent = s.text;
    this._dots.innerHTML = this.steps.map((_, i) =>
      '<i class="' + (i < this._i ? 'is-done' : i === this._i ? 'is-cur' : '') + '"></i>').join('');
    this._next.hidden = !s.manual;
    this._hud.highlight(s.id === 'goal');
  }

  // Le jeu signale ce que fait le joueur : 'jump', 'visit' (fenêtre refermée).
  notify(event) {
    if (!this.active || this._pending) return;
    const id = this.steps[this._i].id;
    // Un joueur pressé qui entre dans une maison a forcément compris le reste.
    if (event === 'visit' && id !== 'goal') { this._i = 2; this._ok(); return; }
    if ((event === 'jump' || event === 'token') && id === 'jump') this._ok();
  }

  // Appelé à chaque frame de jeu : valide l'étape « se déplacer ».
  track(playerX) {
    if (!this.active || this._pending || this.steps[this._i].id !== 'move') return;
    if (this._lastX !== null) this._moved += Math.abs(playerX - this._lastX);
    this._lastX = playerX;
    if (this._moved > 90) this._ok();
  }

  _ok() {
    this._pending = true;
    this.el.classList.add('is-ok');
    if (window.AudioManager) window.AudioManager.synth('coin');
    setTimeout(() => { this._pending = false; this._advance(); }, 650);
  }

  _advance() {
    if (!this.active) return;
    if (this._i >= this.steps.length - 1) { this.finish(); return; }
    this._i++;
    this._render();
  }

  finish() {
    if (!this.active) return;
    this.active = false;
    this._pending = false;
    this._hud.highlight(false);
    this.el.classList.remove('is-in');
    setTimeout(() => { this.el.hidden = true; }, 220);
    if (this._onDone) this._onDone();
  }
}
