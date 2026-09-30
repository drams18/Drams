/* ══════════════════════════════════════════════════════
   SPACE.JS : Espace infini explorable (projets, compétences)

   Un monde « torique » : chaque couche est une tuile (W × H) répétée à
   l'infini dans les deux sens. Répétition VIRTUELLE : seules les copies
   qui touchent l'écran existent dans le DOM (un petit réservoir
   d'éléments par objet, réutilisés) ; leur position est la position
   dans la tuile, repliée modulo W / H.

   On le manipule comme un globe : glisser (souris, doigt, stylet) avec
   inertie, molette / pavé tactile. Une couche peut avoir une profondeur
   (z < 1 : elle défile moins vite → parallaxe).

   Aucune boucle permanente : une frame n'est demandée que pendant un
   geste, une inertie ou un glissé de caméra. Tout passe par transform /
   opacity (composition GPU).
   ══════════════════════════════════════════════════════ */
export const REDUCE = matchMedia('(prefers-reduced-motion: reduce)');
export const mod = (a, n) => ((a % n) + n) % n;
export const wrapD = (d, n) => d - n * Math.round(d / n);   // plus court écart sur un tore

// Pseudo-aléatoire déterministe : le même espace à chaque visite.
export function rng(seed) {
  return () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
}

// Relaxation sur un tore : les disques se repoussent (écart minimal
// `gap`) et restent attirés par leur ancre. Positions dans la tuile.
export function relax(items, W, H, { gap = 24, iterations = 320, pull = 0.012, late = 0.004 } = {}) {
  for (let it = 0; it < iterations; it++) {
    for (let i = 0; i < items.length; i++) {
      const a = items[i];
      for (let j = i + 1; j < items.length; j++) {
        const b = items[j];
        const dx = wrapD(b.x - a.x, W), dy = wrapD(b.y - a.y, H);
        const dist = Math.hypot(dx, dy) || 0.01;
        const min = a.r + b.r + gap;
        if (dist < min) {
          const push = ((min - dist) / dist) * 0.5;
          a.x -= dx * push; a.y -= dy * push;
          b.x += dx * push; b.y += dy * push;
        }
      }
    }
    const k = it < iterations * 0.7 ? pull : late;
    items.forEach((d) => {
      if (d.ax !== undefined) {
        d.x += wrapD(d.ax - d.x, W) * k;
        d.y += wrapD(d.ay - d.y, H) * k;
      }
      d.x = mod(d.x, W); d.y = mod(d.y, H);
    });
  }
  return items;
}

/**
 * createSpace(host, opts)
 *   opts.make(item, layer)      → élément d'une copie (appelé à la demande)
 *   opts.project?(x, y)         → { x, y, s, o } : déformation (globe)
 *   opts.onPick?(item, el, e)   clic / toucher sur une copie
 *   opts.onHover?(item|null, el)
 *   opts.onMove?()              la caméra a bougé (après rendu)
 *   opts.label                  intitulé du champ
 */
export function createSpace(host, opts) {
  const field = document.createElement('div');
  field.className = 'space-field';
  field.setAttribute('aria-hidden', 'true');
  field.innerHTML = '<div class="space-grid"></div>';
  const grid = field.firstChild;
  const vignette = document.createElement('div');
  vignette.className = 'space-vignette';
  host.append(field, vignette);

  let SW = 0, SH = 0, PAD = 120;
  let layers = [];                 // [{ z, W, H, items: [{ …, els: [], n }], cls }]
  const cam = { x: 0, y: 0 };
  let raf = 0, glide = null, vx = 0, vy = 0, drag = null, last = 0;

  function measure() {
    const r = field.getBoundingClientRect();
    SW = r.width; SH = r.height;
    return SW > 0;
  }

  // ── Couches ──────────────────────────────────────────
  function setLayers(next, pad) {
    // Les éléments des anciennes copies sont retirés (nouvelle disposition).
    layers.forEach((L) => L.items.forEach((it) => it.els.forEach((el) => el.remove())));
    layers = next.map((L) => ({ z: 1, ...L, items: L.items.map((it) => Object.assign(it, { els: [], n: 0 })) }));
    PAD = pad ?? PAD;
    request();
  }

  // ── Rendu ────────────────────────────────────────────
  function request() { if (!raf) raf = requestAnimationFrame(frame); }

  function copies(v, c, n, size, pad) {
    // Positions à l'écran de toutes les copies de `v` (tuile `n`) visibles
    // dans [−pad, size + pad].
    const out = [];
    for (let s = mod(v - c + size / 2 + pad, n) - pad; s < size + pad; s += n) out.push(s);
    return out;
  }

  function render() {
    const proj = opts.project;
    for (const L of layers) {
      const cx = cam.x * L.z, cy = cam.y * L.z;
      for (const it of L.items) {
        const xs = copies(it.x, cx, L.W, SW, PAD);
        const ys = copies(it.y, cy, L.H, SH, PAD);
        let n = 0;
        for (const x of xs) {
          for (const y of ys) {
            let el = it.els[n];
            if (!el) {
              el = opts.make(it, L);
              el._it = it; el._L = L;
              if (it.cls) el.className += ' ' + it.cls;
              it.els.push(el);
              field.appendChild(el);
            }
            if (el.hidden) el.hidden = false;
            el._x = x; el._y = y;
            if (proj) {
              const p = proj(x, y);
              el._x = p.x; el._y = p.y;
              el.style.transform = `translate3d(${p.x.toFixed(1)}px,${p.y.toFixed(1)}px,0) scale(${p.s.toFixed(3)})`;
              el.style.opacity = p.o.toFixed(3);
            } else {
              el.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0)`;
            }
            n++;
          }
        }
        for (let k = n; k < it.els.length; k++) if (!it.els[k].hidden) it.els[k].hidden = true;
        it.n = n;
      }
    }
    grid.style.transform = `translate3d(${mod(-cam.x, 34).toFixed(1)}px,${mod(-cam.y, 34).toFixed(1)}px,0)`;
    if (opts.onMove) opts.onMove();
  }

  function frame(now) {
    raf = 0;
    const dt = Math.min(48, now - (last || now)) || 16;
    last = now;
    let more = false;
    if (glide) {
      const t = Math.min(1, (now - glide.t0) / glide.dur);
      const e = 1 - Math.pow(1 - t, 4);
      cam.x = glide.x0 + glide.dx * e;
      cam.y = glide.y0 + glide.dy * e;
      if (t < 1) more = true; else glide = null;
    } else if (!drag && (Math.abs(vx) > 0.01 || Math.abs(vy) > 0.01)) {
      cam.x -= vx * dt; cam.y -= vy * dt;
      const f = Math.exp(-dt / 320);                 // décélération douce (≈ iOS)
      vx *= f; vy *= f;
      more = true;
    }
    render();
    if (more) request(); else last = 0;
  }

  // ── Caméra ───────────────────────────────────────────
  function stop() { glide = null; vx = vy = 0; }
  function panBy(dx, dy) { stop(); cam.x += dx; cam.y += dy; request(); }
  function glideBy(dx, dy, dur = 700) {
    vx = vy = 0;
    if (REDUCE.matches || Math.hypot(dx, dy) < 0.5) { glide = null; cam.x += dx; cam.y += dy; request(); return; }
    glide = { x0: cam.x, y0: cam.y, dx, dy, t0: performance.now(), dur };
    request();
  }
  // Amène la copie la plus proche de `it` (couche L) au point (tx, ty) de l'écran.
  function glideTo(it, L, tx = SW / 2, ty = SH / 2, dur) {
    const dx = wrapD(it.x - cam.x * L.z + SW / 2 - tx, L.W);
    const dy = wrapD(it.y - cam.y * L.z + SH / 2 - ty, L.H);
    glideBy(dx / L.z, dy / L.z, dur);
  }
  // Copie visible la plus proche d'un point de l'écran.
  function nearest(it, tx = SW / 2, ty = SH / 2) {
    let best = null, bd = Infinity;
    for (let k = 0; k < it.n; k++) {
      const el = it.els[k];
      const d = Math.hypot(el._x - tx, el._y - ty);
      if (d < bd) { bd = d; best = el; }
    }
    return best;
  }
  const inView = (el, m = 0) => el && el._x > m && el._x < SW - m && el._y > m && el._y < SH - m;

  // ── Gestes ───────────────────────────────────────────
  let justDragged = false;
  field.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    stop();
    drag = { id: e.pointerId, x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY, t: e.timeStamp, moved: false };
  });
  field.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) {
      if (!drag && e.pointerType === 'mouse' && opts.onHover) hover(e);
      return;
    }
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (!drag.moved) {
      if (Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) < 6) return;
      drag.moved = true;
      try { field.setPointerCapture(e.pointerId); } catch (err) { /* noop */ }
      field.classList.add('is-dragging');
      if (opts.onHover) setHot(null);
      if (opts.onDragStart) opts.onDragStart();
    }
    const dt = Math.max(1, e.timeStamp - drag.t);
    cam.x -= dx; cam.y -= dy;
    vx = vx * 0.5 + (dx / dt) * 0.5;
    vy = vy * 0.5 + (dy / dt) * 0.5;
    drag.x = e.clientX; drag.y = e.clientY; drag.t = e.timeStamp;
    request();
  });
  function endDrag(e) {
    if (!drag || (e && e.pointerId !== drag.id)) return;
    if (drag.moved) {
      justDragged = true;
      setTimeout(() => { justDragged = false; }, 0);
      // Relâché à l'arrêt : pas d'élan.
      if ((e ? e.timeStamp : performance.now()) - drag.t > 90) vx = vy = 0;
    } else vx = vy = 0;
    drag = null;
    field.classList.remove('is-dragging');
    request();
  }
  field.addEventListener('pointerup', endDrag);
  field.addEventListener('pointercancel', (e) => { endDrag(e); vx = vy = 0; });
  field.addEventListener('lostpointercapture', (e) => endDrag(e));

  field.addEventListener('click', (e) => {
    if (justDragged) return;
    const el = e.target.closest('[data-i]');
    if (el && el._it && opts.onPick) opts.onPick(el._it, el, e);
  });

  // Molette / pavé tactile : on se déplace (le pincement reste au navigateur).
  field.addEventListener('wheel', (e) => {
    if (e.ctrlKey) return;
    e.preventDefault();
    const k = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? SH : 1;
    let dx = e.deltaX * k, dy = e.deltaY * k;
    if (e.shiftKey && !dx) { dx = dy; dy = 0; }
    panBy(dx, dy);
    if (opts.onDragStart) opts.onDragStart();
  }, { passive: false });

  // Survol (souris) : délégué, sans écouteur par bulle.
  let hot = null;
  function setHot(el) {
    if (el === hot) return;
    hot = el;
    opts.onHover(el ? el._it : null, el);
  }
  function hover(e) {
    const el = e.target.closest && e.target.closest('[data-i]');
    setHot(el && el._it ? el : null);
  }
  field.addEventListener('pointerleave', () => { if (opts.onHover) setHot(null); });

  // Redimensionnement : la page recalcule sa disposition.
  let lastW = 0, lastH = 0, rt = 0;
  new ResizeObserver(() => {
    const r = field.getBoundingClientRect();
    if (!r.width) return;
    // La barre d'adresse mobile (petits écarts de hauteur) ne réarrange rien.
    const big = Math.abs(r.width - lastW) > 2 || Math.abs(r.height - lastH) > 120;
    SW = r.width; SH = r.height;
    if (!big) { request(); return; }
    clearTimeout(rt);
    rt = setTimeout(() => { lastW = r.width; lastH = r.height; if (opts.onResize) opts.onResize(); }, lastW ? 160 : 0);
  }).observe(field);

  measure();
  lastW = SW; lastH = SH;

  return {
    field, cam, measure, setLayers, request, render, panBy, glideBy, glideTo, nearest, inView, stop,
    get size() { return { w: SW, h: SH }; },
    get layers() { return layers; },
    get hot() { return hot; },
    // Classe appliquée à toutes les copies d'un objet (présentes et futures).
    setItemClass(it, cls, on) {
      const has = (it.cls || '').split(' ').filter(Boolean);
      const i = has.indexOf(cls);
      if (on && i < 0) has.push(cls); else if (!on && i >= 0) has.splice(i, 1); else return;
      it.cls = has.join(' ');
      it.els.forEach((el) => el.classList.toggle(cls, on));
    },
  };
}
