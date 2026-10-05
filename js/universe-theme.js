/* ══════════════════════════════════════════════════════
   UNIVERSE-THEME.JS : l'univers du mode aventure, repris par
   « Construisez votre projet »

   Le mode aventure dépose l'habillage de l'univers en cours (palette,
   typographie, morceau) dans localStorage (`drame.aventure.theme`, écrit par
   src/aventure/core/SaveManager.js). Chargé dans le <head>, AVANT le premier
   affichage, ce script :
     • pose data-universe et les variables --u-* sur <html>
       (css/bp-universe.css rhabille alors toute la page) ;
     • expose window.UniverseTheme : wrap(ctx) retraduit à la volée les
       couleurs et la police néon du canvas dans la palette de l'univers.

   Sans univers choisi, ou si le visiteur vient du mode classique :
   window.UniverseTheme vaut null et la page garde sa DA comics / néon.
   ══════════════════════════════════════════════════════ */
(function (global) {
  'use strict';

  global.UniverseTheme = null;

  var theme = null;
  try {
    if (global.localStorage.getItem('drame.portfolio.mode') === 'aventure') {
      theme = JSON.parse(global.localStorage.getItem('drame.aventure.theme'));
    }
  } catch (e) { /* stockage indisponible ou donnée illisible */ }
  if (!theme || !theme.id || !theme.palette || !theme.fonts) return;

  var p = theme.palette, f = theme.fonts;
  var root = global.document.documentElement;
  root.dataset.universe = theme.id;
  var set = function (k, v) { if (v != null) root.style.setProperty(k, v); };
  set('--u-bg', p.bg);
  set('--u-surface', p.surface);
  set('--u-surface-2', p.surface2);
  set('--u-text', p.text);
  set('--u-muted', p.muted);
  set('--u-line', p.line);
  set('--u-primary', p.primary);
  set('--u-on-primary', p.onPrimary);
  set('--u-accent', p.accent);
  set('--u-display', f.display);
  set('--u-display-weight', f.weight);
  set('--u-display-style', f.style);
  set('--u-display-spacing', f.spacing);
  set('--u-radius', f.radius);

  // ── Canvas : couleurs néon → palette de l'univers ─────
  function hex(c) {
    c = String(c || '').replace('#', '');
    if (c.length === 3) c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
    var n = parseInt(c, 16);
    return isNaN(n) ? [128, 128, 128] : [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  var bg = hex(p.bg), s2 = hex(p.surface2);
  var ROLE = {
    primary: hex(p.primary),
    accent: hex(p.accent),
    muted: hex(p.muted),
  };
  // Ton de référence des aplats sombres (ciel, sol, immeubles).
  var BASE = [(bg[0] + s2[0]) / 2, (bg[1] + s2[1]) / 2, (bg[2] + s2[2]) / 2];
  var INK = 48;   // canal le plus fort de l'ancien fond (#0e1630)

  // Teintes néon de l'ancienne DA → rôle dans l'univers.
  var LEGACY = {
    '25,232,255': 'accent',    // cyan : interactif
    '138,59,255': 'accent',    // violet : secondaire
    '255,18,61': 'primary',    // rouge : action
    '255,43,176': 'primary',   // magenta : sélection, titres
    '255,60,190': 'primary',   // astre du ciel
    '55,227,155': 'muted',     // vert de la porte de retour : sortie, neutre
  };

  var RGBA = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)$/;
  var cache = new Map();

  function convert(c) {
    var r, g, b, a = 1, m;
    if (c.charAt(0) === '#') { m = hex(c); r = m[0]; g = m[1]; b = m[2]; }
    else if ((m = RGBA.exec(c))) { r = +m[1]; g = +m[2]; b = +m[3]; if (m[4] != null) a = +m[4]; }
    else return c;

    var out = null, role = LEGACY[r + ',' + g + ',' + b];
    if (role) out = ROLE[role];
    else {
      // Aplat sombre : même luminosité relative, teinte de l'univers.
      var top = Math.max(r, g, b);
      if (top > 0 && top <= 64) {
        var k = top / INK;
        out = [Math.min(255, BASE[0] * k), Math.min(255, BASE[1] * k), Math.min(255, BASE[2] * k)];
      }
    }
    if (!out) return c;
    return 'rgba(' + Math.round(out[0]) + ',' + Math.round(out[1]) + ',' + Math.round(out[2]) + ',' + a + ')';
  }

  function color(c) {
    if (typeof c !== 'string') return c;      // dégradé, motif
    var v = cache.get(c);
    if (v === undefined) {
      if (cache.size > 4000) cache.clear();   // alphas animés : cache borné
      v = convert(c);
      cache.set(c, v);
    }
    return v;
  }

  // '7px "Press Start 2P", monospace' → police de l'univers, agrandie (la
  // police pixel est bien plus large à corps égal).
  var PIXEL = /^([\d.]+)px\s+"Press Start 2P".*$/;
  function font(v) {
    var m = PIXEL.exec(v);
    if (!m) return v;
    var px = Math.round(m[1] * 1.45 * 2) / 2;
    return (f.style === 'italic' ? 'italic ' : '') + '700 ' + px + 'px ' + f.display;
  }

  function wrap(ctx) {
    if (!ctx || ctx.__universe) return ctx;
    var proto = Object.getPrototypeOf(ctx);
    var map = function (name, fn) {
      var d = Object.getOwnPropertyDescriptor(proto, name);
      if (!d || !d.set) return;
      Object.defineProperty(ctx, name, {
        configurable: true,
        get: function () { return d.get.call(ctx); },
        set: function (v) { d.set.call(ctx, fn(v)); },
      });
    };
    map('fillStyle', color);
    map('strokeStyle', color);
    map('shadowColor', color);
    map('font', font);
    ['createLinearGradient', 'createRadialGradient'].forEach(function (name) {
      var make = proto[name];
      ctx[name] = function () {
        var grad = make.apply(ctx, arguments);
        var add = grad.addColorStop;
        grad.addColorStop = function (o, c) { add.call(grad, o, color(c)); };
        return grad;
      };
    });
    ctx.__universe = true;
    return ctx;
  }

  global.UniverseTheme = {
    id: theme.id,
    palette: p,
    fonts: f,
    track: theme.track || null,
    trackGain: theme.trackGain || 0.5,
    color: color,
    font: font,
    wrap: wrap,
  };
})(window);
