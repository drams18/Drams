/* ══════════════════════════════════════════════════════
   UNIVERSEAUDIO.JS : ambiance et bruitages, synthétisés (WebAudio)

   OFF par défaut. Aucun fichier : l'expérience ne dépend d'aucune musique
   externe. Chaque univers décrit son ambiance (`audio` dans son thème) :
     pad    nappe d'oscillateurs (notes, forme d'onde, filtre)
     noise  souffle filtré (rumeur de ville, pluie, ventilation)
     pulse  basse pulsée (héros)
     hum    ronflement des néons (club)
     sfx    timbre des bruitages
   Le contexte audio n'est créé qu'après un geste de l'utilisateur.
   ══════════════════════════════════════════════════════ */

// name → suite de notes : m = multiple de la fréquence de base, to = glissando.
const SFX = {
  step: [{ m: 0.2, to: 0.14, d: 0.04, v: 0.05, wave: 'triangle' }],
  jump: [{ m: 0.6, to: 1.2, d: 0.12, v: 0.06 }],
  land: [{ m: 0.3, to: 0.14, d: 0.09, v: 0.08, wave: 'triangle' }],
  collect: [{ m: 1.5, d: 0.07, v: 0.07 }, { m: 2, d: 0.16, v: 0.07, at: 0.07 }],
  enter: [{ m: 0.5, to: 1, d: 0.2, v: 0.06 }],
  ui: [{ m: 1, d: 0.04, v: 0.04 }],
  open: [{ m: 0.75, to: 1, d: 0.1, v: 0.05 }],
  close: [{ m: 1, to: 0.75, d: 0.1, v: 0.05 }],
  talk: [{ m: 0.9, d: 0.04, v: 0.03 }, { m: 1.1, d: 0.04, v: 0.03, at: 0.06 }],
  discover: [{ m: 1, d: 0.1, v: 0.07 }, { m: 1.25, d: 0.1, v: 0.07, at: 0.1 }, { m: 1.5, d: 0.22, v: 0.07, at: 0.2 }],
  complete: [{ m: 1, d: 0.12, v: 0.08 }, { m: 1.25, d: 0.12, v: 0.08, at: 0.12 }, { m: 1.5, d: 0.12, v: 0.08, at: 0.24 }, { m: 2, d: 0.4, v: 0.08, at: 0.36 }],
  transition: [{ m: 2, to: 0.25, d: 0.4, v: 0.05 }],
};

export class UniverseAudio {
  constructor() {
    this.enabled = false;
    this.ctx = null;
    this.master = null;
    this.spec = null;
    this._ambient = null;      // { gain, nodes[] }
    this._last = Object.create(null);

    document.addEventListener('visibilitychange', () => {
      if (!this.ctx) return;
      if (document.hidden) this.ctx.suspend(); else if (this.enabled) this.ctx.resume();
    });
    // Son déjà activé (sauvegarde) : il démarre au premier geste, jamais avant.
    const kick = () => { if (this.enabled) this._ensure(); };
    window.addEventListener('pointerdown', kick, { passive: true });
    window.addEventListener('keydown', kick);
  }

  _ensure() {
    if (this.ctx) { if (this.ctx.state === 'suspended' && !document.hidden) this.ctx.resume(); return true; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    try {
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.9;
      this.master.connect(this.ctx.destination);
    } catch (e) { this.ctx = null; return false; }
    if (this.spec) this._startAmbient();
    return true;
  }

  // À appeler depuis un geste (clic sur le bouton Son).
  setEnabled(on) {
    this.enabled = !!on;
    if (on) { this._ensure(); if (this.ctx && !this._ambient && this.spec) this._startAmbient(); }
    else this._stopAmbient();
  }

  setUniverse(spec) {
    this.spec = spec;
    this._stopAmbient();
    if (this.enabled && this.ctx) this._startAmbient();
  }

  _stopAmbient() {
    const a = this._ambient;
    if (!a || !this.ctx) { this._ambient = null; return; }
    this._ambient = null;
    const now = this.ctx.currentTime;
    a.gain.gain.cancelScheduledValues(now);
    a.gain.gain.setValueAtTime(a.gain.gain.value, now);
    a.gain.gain.linearRampToValueAtTime(0, now + 0.4);
    setTimeout(() => {
      for (const n of a.nodes) { try { n.stop(); } catch (e) { /* déjà arrêté */ } n.disconnect(); }
      a.gain.disconnect();
    }, 500);
  }

  _startAmbient() {
    const ctx = this.ctx, s = this.spec;
    if (!ctx || !s || this._ambient) return;
    const now = ctx.currentTime;
    const out = ctx.createGain();
    out.gain.setValueAtTime(0, now);
    out.gain.linearRampToValueAtTime(1, now + 1.6);
    out.connect(this.master);
    const nodes = [];

    if (s.pad) {
      const g = ctx.createGain();
      g.gain.value = s.pad.gain;
      let dest = g;
      if (s.pad.filter) {
        const f = ctx.createBiquadFilter();
        f.type = 'lowpass'; f.frequency.value = s.pad.filter;
        f.connect(g); dest = f;
      }
      g.connect(out);
      s.pad.notes.forEach((freq, i) => {
        const o = ctx.createOscillator();
        o.type = s.pad.type; o.frequency.value = freq; o.detune.value = (i % 2 ? 6 : -6);
        o.connect(dest); o.start(); nodes.push(o);
      });
      const lfo = ctx.createOscillator(), depth = ctx.createGain();
      lfo.frequency.value = s.pad.lfo; depth.gain.value = s.pad.gain * 0.5;
      lfo.connect(depth); depth.connect(g.gain); lfo.start(); nodes.push(lfo);
    }
    if (s.pulse) {
      const o = ctx.createOscillator(), g = ctx.createGain(), lfo = ctx.createOscillator(), depth = ctx.createGain();
      o.type = 'triangle'; o.frequency.value = s.pulse.note;
      g.gain.value = s.pulse.gain * 0.5; depth.gain.value = s.pulse.gain * 0.5;
      lfo.type = 'square'; lfo.frequency.value = s.pulse.rate;
      lfo.connect(depth); depth.connect(g.gain); o.connect(g); g.connect(out);
      o.start(); lfo.start(); nodes.push(o, lfo);
    }
    if (s.hum) {
      [1, 2].forEach((k) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'sawtooth'; o.frequency.value = s.hum.freq * k; g.gain.value = s.hum.gain / k;
        o.connect(g); g.connect(out); o.start(); nodes.push(o);
      });
    }
    if (s.noise) {
      const len = ctx.sampleRate * 2;
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      const src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
      src.buffer = buf; src.loop = true;
      f.type = s.noise.type; f.frequency.value = s.noise.freq;
      g.gain.value = s.noise.gain;
      src.connect(f); f.connect(g); g.connect(out); src.start(); nodes.push(src);
    }
    this._ambient = { gain: out, nodes };
  }

  sfx(name) {
    if (!this.enabled || !this.ctx || this.ctx.state !== 'running') return;
    const def = SFX[name];
    if (!def) return;
    const now = this.ctx.currentTime;
    if (now - (this._last[name] || 0) < 0.05) return;      // pas de rafale du même son
    this._last[name] = now;
    const base = (this.spec && this.spec.sfx.base) || 520;
    const wave = (this.spec && this.spec.sfx.wave) || 'sine';
    for (const n of def) {
      const t0 = now + (n.at || 0);
      const o = this.ctx.createOscillator(), g = this.ctx.createGain();
      o.type = n.wave || wave;
      o.frequency.setValueAtTime(base * n.m, t0);
      if (n.to) o.frequency.exponentialRampToValueAtTime(base * n.to, t0 + n.d);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(n.v, t0 + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + n.d);
      o.connect(g); g.connect(this.master);
      o.start(t0); o.stop(t0 + n.d + 0.02);
    }
  }
}
