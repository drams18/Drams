/* ══════════════════════════════════════════════════════
   AUDIO.JS — Gestionnaire audio centralisé
   Un seul endroit pour : musique de fond + effets (SFX).

   Points clés
     • Aucun son avant un vrai geste utilisateur (politique autoplay).
     • Objets Audio mutualisés (pool) : pas de « new Audio » par clic.
     • Fichier SFX absent → silencieux, aucune erreur JS.
     • Choix SOUND ON / OFF conservé dans localStorage.
     • Musique : ~25 %  ·  SFX : ~45–55 %  (les SFX ne couvrent jamais
       la musique).

   API publique (window.AudioManager) :
     unlock()            amorce le système (à appeler dans un geste user)
     playMusic()         lance / reprend la musique de fond
     pauseMusic()        met en pause sans remettre à zéro
     stopMusic()         arrête et remet à zéro
     play(name)          joue un SFX : 'click' | 'open' | 'close' |
                                       'transition' | 'success'
     setEnabled(bool) / toggle() / isEnabled()
     setMusicVolume(0..1) / setSfxVolume(0..1)
     onChange(fn)        notifié quand SOUND ON/OFF change
   ══════════════════════════════════════════════════════ */

'use strict';

(function (global) {
  const STORAGE_KEY = 'drame.portfolio.sound';

  // ── Configuration — tout se règle ici ────────────────
  const CONFIG = {
    musicSrc: 'assets/audio/bg-music.mp3',   // NE PAS déplacer : musique existante
    musicVolume: 0.25,
    sfxDir: 'sounds/',
    sfxVolume: 0.5,          // valeur par défaut si un SFX n'en précise pas
    poolSize: 4,             // instances réutilisées par SFX (superpositions)
    retriggerGuardMs: 70,    // ignore un même SFX redéclenché trop vite
    sfx: {
      click:      { file: 'click.mp3',      volume: 0.45 },
      open:       { file: 'open.mp3',       volume: 0.5  },
      close:      { file: 'close.mp3',      volume: 0.5  },
      transition: { file: 'transition.mp3', volume: 0.45 },
      success:    { file: 'success.mp3',    volume: 0.55 },
    },
  };

  function clamp01(v) {
    v = Number(v);
    if (isNaN(v)) return 0;
    return v < 0 ? 0 : v > 1 ? 1 : v;
  }

  function now() {
    return (global.performance && performance.now)
      ? performance.now()
      : Date.now();
  }

  class AudioManager {
    constructor(cfg) {
      this.cfg = cfg;
      this._enabled   = this._loadPref();
      this._unlocked  = false;
      this._musicWanted = false;   // l'app souhaite-t-elle que la musique tourne ?
      this._music     = null;
      this._pools     = {};        // name -> [HTMLAudioElement]
      this._poolIdx   = {};        // name -> index round-robin
      this._available = {};        // name -> false dès qu'un fichier manque
      this._lastPlay  = {};        // name -> timestamp
      this._listeners = new Set();
    }

    // ── Préférence utilisateur ─────────────────────────
    _loadPref() {
      try {
        const v = global.localStorage.getItem(STORAGE_KEY);
        return v === null ? true : v === 'on';
      } catch (e) {
        return true;   // localStorage indisponible → son actif par défaut
      }
    }

    _savePref() {
      try {
        global.localStorage.setItem(STORAGE_KEY, this._enabled ? 'on' : 'off');
      } catch (e) { /* stockage indisponible : on ignore proprement */ }
    }

    isEnabled() { return this._enabled; }

    onChange(fn) {
      this._listeners.add(fn);
      return () => this._listeners.delete(fn);
    }

    _emit() {
      this._listeners.forEach(fn => {
        try { fn(this._enabled); } catch (e) { /* noop */ }
      });
    }

    // ── Déverrouillage : 1er geste utilisateur ─────────
    // Crée les objets Audio et les « amorce » (play/pause immédiat)
    // pour lever les restrictions iOS / Safari.
    unlock() {
      if (this._unlocked) return;
      this._unlocked = true;

      this._ensureMusic();
      this._buildPools();

      const prime = (el) => {
        if (!el) return;
        const vol = el.volume;
        el.volume = 0;
        const p = el.play();
        if (p && p.then) {
          p.then(() => {
            el.pause();
            try { el.currentTime = 0; } catch (e) {}
            el.volume = vol;
          }).catch(() => { el.volume = vol; });
        } else {
          try { el.pause(); el.currentTime = 0; } catch (e) {}
          el.volume = vol;
        }
      };

      Object.keys(this._pools).forEach(name => prime(this._pools[name][0]));

      if (this._musicWanted && this._enabled) this.playMusic();
    }

    // ── Musique de fond ────────────────────────────────
    _ensureMusic() {
      if (this._music) return;
      const a = new Audio(this.cfg.musicSrc);
      a.loop    = true;
      a.preload = 'auto';
      a.volume  = clamp01(this.cfg.musicVolume);
      a.addEventListener('error', () => { /* musique absente : silencieux */ });
      this._music = a;
    }

    playMusic() {
      this._musicWanted = true;
      if (!this._enabled) return;
      this._ensureMusic();
      if (!this._unlocked) return;         // attend le 1er geste utilisateur
      const p = this._music.play();
      if (p && p.catch) p.catch(() => {}); // lecture refusée : on n'insiste pas
    }

    pauseMusic() {
      if (this._music) this._music.pause();
    }

    stopMusic() {
      this._musicWanted = false;
      if (this._music) {
        this._music.pause();
        try { this._music.currentTime = 0; } catch (e) {}
      }
    }

    setMusicVolume(v) {
      this.cfg.musicVolume = clamp01(v);
      if (this._music) this._music.volume = this.cfg.musicVolume;
    }

    // ── SFX ────────────────────────────────────────────
    _buildPools() {
      Object.keys(this.cfg.sfx).forEach(name => {
        if (this._pools[name]) return;

        const def = this.cfg.sfx[name];
        const src = this.cfg.sfxDir + def.file;
        const vol = clamp01(def.volume == null ? this.cfg.sfxVolume : def.volume);

        this._available[name] = true;
        this._poolIdx[name]   = 0;
        this._lastPlay[name]  = 0;

        const pool = [];
        for (let i = 0; i < this.cfg.poolSize; i++) {
          const el = new Audio();
          // Seul le 1er est préchargé ; les autres tirent du cache à la demande.
          el.preload = i === 0 ? 'auto' : 'none';
          el.volume  = vol;
          el.addEventListener('error', () => { this._available[name] = false; });
          el.src = src;
          pool.push(el);
        }
        this._pools[name] = pool;
      });
    }

    setSfxVolume(v) {
      const base = clamp01(v);
      this.cfg.sfxVolume = base;
      Object.keys(this._pools).forEach(name => {
        const def = this.cfg.sfx[name] || {};
        const vol = clamp01(def.volume == null ? base : def.volume);
        this._pools[name].forEach(el => { el.volume = vol; });
      });
    }

    play(name) {
      if (!this._enabled) return;
      const pool = this._pools[name];
      if (!pool || this._available[name] === false) return;

      const t = now();
      if (t - (this._lastPlay[name] || 0) < this.cfg.retriggerGuardMs) return;
      this._lastPlay[name] = t;

      // Réutilise une instance libre ; sinon round-robin sur la plus ancienne.
      let el = null;
      for (let i = 0; i < pool.length; i++) {
        if (pool[i].paused || pool[i].ended) { el = pool[i]; break; }
      }
      if (!el) {
        el = pool[this._poolIdx[name]];
        this._poolIdx[name] = (this._poolIdx[name] + 1) % pool.length;
      }

      try { el.currentTime = 0; } catch (e) {}
      const p = el.play();
      if (p && p.catch) p.catch(() => {});
    }

    // ── Activation / désactivation globale ─────────────
    setEnabled(on) {
      on = !!on;
      if (on === this._enabled) return;
      this._enabled = on;
      this._savePref();

      if (!on) {
        this.pauseMusic();                       // coupe tout de suite
      } else if (this._musicWanted) {
        this.playMusic();                        // reprend si le jeu la voulait
      }
      this._emit();
    }

    toggle() { this.setEnabled(!this._enabled); }
  }

  const manager = new AudioManager(CONFIG);

  // ── Déverrouillage au tout premier geste (n'importe où) ──
  const kick = () => manager.unlock();
  ['pointerdown', 'touchstart', 'keydown', 'click'].forEach(evt => {
    global.addEventListener(evt, kick, { once: true, passive: true, capture: true });
  });

  // ── Câblage de l'interface (bouton SOUND + retours légers) ──
  function initUI() {
    const btn = global.document.getElementById('btn-sound');
    if (btn) {
      const label = btn.querySelector('.sound-toggle__label') || btn;
      const sync = (on) => {
        label.textContent = on ? 'SOUND ON' : 'SOUND OFF';
        btn.setAttribute('aria-pressed', on ? 'true' : 'false');
        btn.classList.toggle('sound-toggle--off', !on);
      };
      sync(manager.isEnabled());
      manager.onChange(sync);
      btn.addEventListener('click', () => {
        manager.unlock();
        const willEnable = !manager.isEnabled();
        manager.toggle();
        if (willEnable) manager.play('click');   // retour audio seulement à l'activation
      });
    }

    // Retour discret sur les liens secondaires de l'accueil (navigation).
    global.document.querySelectorAll('.cv-link, .tarifs-link').forEach(el => {
      el.addEventListener('click', () => manager.play('click'));
    });
  }

  if (global.document.readyState === 'loading') {
    global.document.addEventListener('DOMContentLoaded', initUI);
  } else {
    initUI();
  }

  global.AudioManager = manager;
})(window);
