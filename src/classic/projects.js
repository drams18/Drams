/* ══════════════════════════════════════════════════════
   PROJECTS.JS — L'espace des projets (mode classique)

   Lit l'index sémantique généré (.pj-item, scripts/build-classic.mjs)
   et en tire :
     • un espace de bulles explorable, sans bord : la tuile se répète à
       l'infini. Répétition VIRTUELLE — une seule bulle DOM par projet,
       sa position est repliée modulo la taille de la tuile (tore) ;
     • une mini-carte, des filtres par catégorie, une vue « liste » ;
     • la fiche immersive d'un projet (<dialog>) : la bulle s'ouvre
       jusqu'à devenir la fiche.
   Aucune boucle permanente : le rendu ne tourne que pendant un geste,
   une inertie ou un glissé de caméra.
   ══════════════════════════════════════════════════════ */
import { gsap } from 'gsap';

const doc = document;
const REDUCE = matchMedia('(prefers-reduced-motion: reduce)');
const RADIUS = { l: 84, m: 62, s: 48 };   // rayon de base par rang de bulle
const GAP = 30;                             // espace minimal entre deux bulles
const mod = (a, n) => ((a % n) + n) % n;
const wrapD = (d, n) => d - n * Math.round(d / n);   // plus court écart sur un tore
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const icon = (id, cls = 'ico') => `<svg class="${cls}" aria-hidden="true" focusable="false"><use href="#i-${id}"/></svg>`;

// Pseudo-aléatoire déterministe : l'espace est le même à chaque visite.
function rng(seed) {
  return () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
}

export function initProjects(app) {
  const sec = doc.getElementById('projets');
  const holder = sec && sec.querySelector('.pj-space');
  const items = sec ? [...sec.querySelectorAll('.pj-item')] : [];
  if (!holder || !items.length) return;

  // ── Données (depuis le HTML généré) ───────────────────
  const data = items.map((li, i) => {
    const meta = [...li.querySelector('.pj-item__meta').children].map((n) => n.textContent);
    return {
      i, li, slug: li.dataset.slug, cat: li.dataset.cat, tier: li.dataset.tier,
      status: li.dataset.status, name: li.dataset.name, img: li.dataset.img || null,
      title: li.querySelector('.pj-item__title').textContent,
      type: meta[1] || '', ctx: meta[2] || '',
      statusLabel: li.querySelector('.status').textContent.trim(),
      skills: (li.dataset.skills || '').split(' ').filter(Boolean),
    };
  });
  const bySlug = Object.fromEntries(data.map((d) => [d.slug, d]));
  const cats = [...new Set(data.map((d) => d.cat))];

  // ── Espace : DOM ──────────────────────────────────────
  holder.innerHTML = `
    <div class="pj-field" role="group" aria-label="Espace des projets : ${data.length} bulles. Flèches du clavier pour passer d'une bulle à l'autre." aria-describedby="pj-hint"></div>
    <div class="pj-tip" aria-hidden="true"></div>
    <div class="pj-ui">
      <div class="pj-ui__left">
        <button type="button" class="pj-center">${icon('center')}Recentrer</button>
        <p class="pj-hint" id="pj-hint">Glissez pour explorer : l'espace n'a pas de bord.</p>
      </div>
      <div class="pj-map" aria-hidden="true"><b></b></div>
    </div>`;
  const field = holder.querySelector('.pj-field');
  const tip = holder.querySelector('.pj-tip');
  const hint = holder.querySelector('.pj-hint');
  const map = holder.querySelector('.pj-map');
  const mapView = map.querySelector('b');
  const uiLeft = holder.querySelector('.pj-ui__left');

  const regions = cats.map((cat) => {
    const el = doc.createElement('div');
    el.className = 'pj-region';
    el.dataset.cat = cat;
    const n = data.filter((d) => d.cat === cat);
    const team = cat === 'Professionnel' && n[0].ctx ? ` · ${n[0].ctx}` : '';
    el.innerHTML = `<b>${esc(cat)}</b><span>${n.length} projet${n.length > 1 ? 's' : ''}${esc(team)}</span>`;
    field.appendChild(el);
    return { cat, el, x: 0, y: 0 };
  });

  data.forEach((d, i) => {
    const b = doc.createElement('button');
    b.type = 'button';
    b.className = 'bub';
    b.dataset.cat = d.cat;
    b.dataset.tier = d.tier;
    b.dataset.status = d.status;
    b.dataset.route = `projets/${d.slug}`;
    b.style.setProperty('--d', `${(i % 7) * 60 + Math.floor(i / 7) * 30}ms`);
    b.setAttribute('aria-label', `${d.title} — ${d.cat}${d.ctx ? `, ${d.ctx}` : ''}. ${d.statusLabel}. Ouvrir la fiche`);
    b.setAttribute('aria-haspopup', 'dialog');
    b.innerHTML = `<span class="bub__core"><span class="bub__name" lang="fr">${esc(d.name)}</span><span class="bub__st"></span></span>`;
    field.appendChild(b);
    d.el = b;
    const dot = doc.createElement('i');
    dot.dataset.cat = d.cat;
    dot.dataset.tier = d.tier;
    map.appendChild(dot);
    d.dot = dot;
  });

  // ── Géométrie ─────────────────────────────────────────
  // La tuile (W × H) est plus grande que la vue (SW × SH) : on explore.
  // Sur mobile, pas de bouclage vertical (le glissé vertical fait défiler
  // la page) : la tuile a la hauteur de la vue et s'étire en largeur.
  let SW = 0, SH = 0, W = 0, H = 0, PAD = 0, wrapY = true, mobile = false;
  let camX = 0, camY = 0, driftY = 0;
  let mapW = 150, mapH = 100;

  function layout() {
    const r = field.getBoundingClientRect();
    if (!r.width) return false;
    SW = r.width; SH = r.height;
    mobile = SW < 700;
    // Tactile : le glissé vertical fait défiler la page → espace en largeur.
    wrapY = !mobile && !matchMedia('(pointer: coarse)').matches;
    const scale = mobile ? 0.72 : SW < 1000 ? 0.86 : 1;
    data.forEach((d) => { d.r = RADIUS[d.tier] * scale; d.el.style.setProperty('--r', `${d.r}px`); });
    const maxR = RADIUS.l * scale;
    PAD = maxR * 1.25 + 20;
    const area = data.reduce((s, d) => s + Math.PI * (d.r + GAP / 2) ** 2, 0);
    if (wrapY) {
      W = Math.max(SW * 1.35 + 2 * PAD, 1000);
      H = Math.max(SH * 1.3 + 2 * PAD, 820);
      const k = Math.sqrt(Math.max(1, (area * 2.6) / (W * H)));
      W *= k; H *= k;
    } else {
      H = SH;
      W = Math.max(SW + 2 * PAD, (area * 2.3) / (H - 110));
    }

    // Quartiers par catégorie (fractions de la tuile), puis relaxation :
    // les bulles se repoussent, et restent attirées par leur quartier.
    const CENTERS = wrapY
      ? { Professionnel: [0.37, 0.4], Personnel: [0.66, 0.56], Scolaire: [0.4, 0.8] }
      : { Professionnel: [0.2, 0.52], Personnel: [0.56, 0.52], Scolaire: [0.86, 0.52] };
    const rand = rng(20260930);
    const k = {};
    data.forEach((d) => {
      const c = CENTERS[d.cat] || [Math.random(), 0.5];
      d.cx = c[0] * W; d.cy = c[1] * H;
      const n = (k[d.cat] = (k[d.cat] || 0) + 1);
      const a = n * 2.39996 + rand() * 0.6;
      const rad = 50 * scale * Math.sqrt(n);
      d.x = d.cx + Math.cos(a) * rad;
      d.y = d.cy + Math.sin(a) * rad * (wrapY ? 1 : 0.6);
    });
    const top = 64, bottom = 64;   // mobile : place des libellés et des commandes
    for (let it = 0; it < 420; it++) {
      for (let i = 0; i < data.length; i++) {
        for (let j = i + 1; j < data.length; j++) {
          const a = data[i], b = data[j];
          const dx = wrapD(b.x - a.x, W);
          const dy = wrapY ? wrapD(b.y - a.y, H) : b.y - a.y;
          const dist = Math.hypot(dx, dy) || 0.01;
          const min = a.r + b.r + GAP;
          if (dist < min) {
            const push = ((min - dist) / dist) * 0.5;
            a.x -= dx * push; a.y -= dy * push;
            b.x += dx * push; b.y += dy * push;
          }
        }
      }
      const pull = it < 300 ? 0.012 : 0.004;
      data.forEach((d) => {
        d.x = mod(d.x + wrapD(d.cx - d.x, W) * pull, W);
        const dy = wrapY ? wrapD(d.cy - d.y, H) : d.cy - d.y;
        d.y += dy * pull;
        d.y = wrapY ? mod(d.y, H) : Math.min(H - bottom - d.r, Math.max(top + d.r, d.y));
      });
    }

    // Libellés de quartier : au-dessus de leur groupe (en haut sur mobile).
    regions.forEach((g) => {
      const group = data.filter((d) => d.cat === g.cat);
      const ref = group[0];
      let sx = 0;
      group.forEach((d) => { sx += wrapD(d.x - ref.x, W); });
      g.x = mod(ref.x + sx / group.length, W);
      if (wrapY) {
        const hi = group.reduce((m, d) => Math.min(m, wrapD(d.y - ref.y, H) - d.r), Infinity);
        g.y = mod(ref.y + hi - 46, H);
      } else g.y = 14;
    });

    frameAll();
    mapH = Math.round(Math.min(120, Math.max(64, (mapW * H) / W)));
    map.style.height = `${mapH}px`;
    mapView.style.width = `${(SW / W) * mapW}px`;
    mapView.style.height = `${(wrapY ? SH / H : 1) * mapH}px`;
    mapView.style.left = `${(mapW - (SW / W) * mapW) / 2}px`;
    mapView.style.top = `${(mapH - (wrapY ? SH / H : 1) * mapH) / 2}px`;
    home(true);
    return true;
  }

  // Vue de départ : centrée sur l'ensemble des bulles (et leurs libellés).
  let homeX = 0, homeY = 0;
  function frameAll() {
    const ref = data[0];
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    data.forEach((d) => {
      const dx = wrapD(d.x - ref.x, W), dy = wrapY ? wrapD(d.y - ref.y, H) : d.y - ref.y;
      x0 = Math.min(x0, dx - d.r); x1 = Math.max(x1, dx + d.r);
      y0 = Math.min(y0, dy - d.r - (wrapY ? 46 : 0)); y1 = Math.max(y1, dy + d.r);
    });
    // Mobile : la vue part du premier quartier, on glisse pour la suite.
    homeX = mod(ref.x + (wrapY ? (x0 + x1) / 2 : x0 - 16 + SW / 2), W);
    homeY = wrapY ? mod(ref.y + (y0 + y1) / 2 + 24, H) : H / 2;
  }
  function home(instant) {
    const x = homeX, y = homeY;
    if (instant) { camX = x; camY = y; request(); } else glideTo(x, y);
  }

  // ── Rendu ─────────────────────────────────────────────
  let raf = 0;
  function request() { if (!raf) raf = requestAnimationFrame(frame); }

  function place(el, x, y) { el.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0)`; }

  function screenX(x) { return mod(x - camX + SW / 2 + PAD, W) - PAD; }
  function screenY(y) { return wrapY ? mod(y - camY - driftY + SH / 2 + PAD, H) - PAD : y; }

  function render() {
    data.forEach((d) => {
      d.sx = screenX(d.x); d.sy = screenY(d.y);
      place(d.el, d.sx, d.sy);
      const mx = (mod(d.x - camX + W / 2, W) / W) * mapW;
      const my = wrapY ? (mod(d.y - camY - driftY + H / 2, H) / H) * mapH : (d.y / H) * mapH;
      place(d.dot, mx, my);
    });
    regions.forEach((g) => place(g.el, screenX(g.x), screenY(g.y)));
    field.style.setProperty('--bgx', `${mod(-camX + SW / 2, 34).toFixed(1)}px`);
    field.style.setProperty('--bgy', `${mod(-(camY + driftY) + SH / 2, 34).toFixed(1)}px`);
    if (hot) positionTip(hot);
  }

  // Une seule boucle, active seulement tant que quelque chose bouge.
  let glide = null, vx = 0, vy = 0, drag = null;
  function frame(now) {
    raf = 0;
    let more = false;
    if (glide) {
      const t = Math.min(1, (now - glide.t0) / glide.dur);
      const e = 1 - Math.pow(1 - t, 4);
      camX = glide.x0 + glide.dx * e;
      camY = glide.y0 + glide.dy * e;
      if (t < 1) more = true; else glide = null;
    } else if (!drag && (Math.abs(vx) > 0.05 || Math.abs(vy) > 0.05)) {
      camX -= vx; camY -= vy;
      vx *= 0.93; vy *= 0.93;
      more = true;
    }
    render();
    if (more) request();
  }

  function glideTo(x, y, dur = 750) {
    vx = vy = 0;
    const dx = wrapD(x - camX, W);
    const dy = wrapY ? wrapD(y - camY, H) : 0;
    if (REDUCE.matches || Math.hypot(dx, dy) < 1) { camX += dx; camY += dy; request(); return; }
    glide = { x0: camX, y0: camY, dx, dy, t0: performance.now(), dur };
    request();
  }

  // ── Gestes : glisser, inertie, molette horizontale ────
  let justDragged = false;
  field.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    glide = null; vx = vy = 0;
    drag = { id: e.pointerId, x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY, t: e.timeStamp, moved: false, touch: e.pointerType !== 'mouse' };
  });
  field.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (!drag.moved) {
      if (Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) < 6) return;
      drag.moved = true;
      try { field.setPointerCapture(e.pointerId); } catch (err) { /* noop */ }
      field.classList.add('is-dragging');
      hideTip();
      hint.classList.add('is-gone');
    }
    const dt = Math.max(1, e.timeStamp - drag.t);
    const my = wrapY && !drag.touch ? dy : 0;
    camX -= dx; camY -= my;
    vx = vx * 0.6 + (dx / dt) * 16 * 0.4;
    vy = vy * 0.6 + (my / dt) * 16 * 0.4;
    drag.x = e.clientX; drag.y = e.clientY; drag.t = e.timeStamp;
    request();
  });
  function endDrag(e) {
    if (!drag || (e && e.pointerId !== drag.id)) return;
    if (drag.moved) {
      justDragged = true;
      setTimeout(() => { justDragged = false; }, 0);
      if (REDUCE.matches) vx = vy = 0;
    } else vx = vy = 0;
    drag = null;
    field.classList.remove('is-dragging');
    request();
  }
  field.addEventListener('pointerup', endDrag);
  field.addEventListener('pointercancel', (e) => { endDrag(e); vx = vy = 0; });
  // Un glissé n'est pas un clic.
  field.addEventListener('click', (e) => { if (justDragged) { e.stopPropagation(); e.preventDefault(); } }, true);
  // Pavé tactile / molette horizontale : on explore ; la molette verticale fait défiler la page.
  field.addEventListener('wheel', (e) => {
    if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
    e.preventDefault();
    glide = null; vx = vy = 0;
    camX += e.deltaX;
    hint.classList.add('is-gone');
    request();
  }, { passive: false });
  // Le navigateur ne doit jamais faire défiler le champ lui-même (focus).
  field.addEventListener('scroll', () => { field.scrollLeft = 0; field.scrollTop = 0; });

  // ── Bulles : survol, focus, clic ──────────────────────
  let hot = null;
  function showTip(d) {
    hot = d;
    d.el.classList.add('is-hot');
    tip.dataset.cat = d.cat;
    tip.innerHTML = `${d.img ? `<img class="pj-tip__img" src="${esc(d.img)}" alt="" loading="lazy" decoding="async">` : ''}
      <p class="pj-tip__t">${esc(d.title)}</p>
      <p class="pj-tip__m"><i class="cat-dot" aria-hidden="true"></i>${esc(d.cat)}${d.ctx ? ` · ${esc(d.ctx)}` : ''}</p>
      ${d.li.querySelector('.status').outerHTML}
      <p class="pj-tip__hint">${esc(d.type)} · cliquer pour ouvrir la fiche</p>`;
    tip.classList.add('is-on');
    positionTip(d);
  }
  function positionTip(d) {
    const tw = tip.offsetWidth || 236, th = tip.offsetHeight || 120;
    let x = d.sx + d.r + 18;
    if (x + tw > SW - 12) x = d.sx - d.r - 18 - tw;
    const y = Math.min(SH - th - 12, Math.max(12, d.sy - th / 2));
    tip.style.transform = `translate3d(${Math.round(Math.max(12, x))}px,${Math.round(y)}px,0)`;
  }
  function hideTip() {
    if (hot) hot.el.classList.remove('is-hot');
    hot = null;
    tip.classList.remove('is-on');
  }

  data.forEach((d) => {
    d.el.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse' && !drag) showTip(d); });
    d.el.addEventListener('pointerleave', () => { if (hot === d) hideTip(); });
    d.el.addEventListener('focus', () => { ensureVisible(d); if (d.el.matches(':focus-visible')) showTip(d); });
    d.el.addEventListener('blur', () => { if (hot === d) hideTip(); });
    d.el.addEventListener('click', () => { hideTip(); openProject(d.slug, { from: d.el }); });
  });

  function ensureVisible(d) {
    const m = d.r + 30;
    const sx = screenX(d.x), sy = screenY(d.y);
    const out = sx < m || sx > SW - m || (wrapY && (sy < m || sy > SH - m - 60));
    if (out) glideTo(d.x, wrapY ? d.y : camY, 600);
  }

  // Flèches : on passe à la bulle la plus proche dans cette direction.
  const DIRS = { ArrowRight: [1, 0], ArrowLeft: [-1, 0], ArrowDown: [0, 1], ArrowUp: [0, -1] };
  field.addEventListener('keydown', (e) => {
    if (e.key === 'Home') { e.preventDefault(); home(); return; }
    const dir = DIRS[e.key];
    const from = data.find((d) => d.el === doc.activeElement);
    if (!dir || !from) return;
    e.preventDefault();
    let best = null, bestScore = Infinity;
    data.forEach((d) => {
      if (d === from || d.el.classList.contains('is-dim')) return;
      const dx = wrapD(d.x - from.x, W);
      const dy = wrapY ? wrapD(d.y - from.y, H) : d.y - from.y;
      const along = dx * dir[0] + dy * dir[1];
      const across = Math.abs(dx * dir[1] - dy * dir[0]);
      if (along <= 4) return;
      const score = along + across * 1.8;
      if (score < bestScore) { bestScore = score; best = d; }
    });
    if (best) best.el.focus();
  });

  holder.querySelector('.pj-center').addEventListener('click', () => { clearLens(); home(); });
  map.addEventListener('click', (e) => {
    const r = map.getBoundingClientRect();
    const x = camX + ((e.clientX - r.left) / mapW - 0.5) * W;
    const y = wrapY ? camY + ((e.clientY - r.top) / mapH - 0.5) * H : camY;
    glideTo(x, y);
  });

  // ── Filtres par catégorie + « lentille » technologie ──
  let filter = 'all';
  let lens = null;       // { slug, label, fam, set }
  const filterBtns = [...sec.querySelectorAll('[data-filter]')];
  filterBtns.forEach((btn) => btn.addEventListener('click', () => {
    filter = btn.dataset.filter;
    filterBtns.forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
    applyDim();
  }));

  function applyDim() {
    data.forEach((d) => {
      const out = (filter !== 'all' && d.cat !== filter) || (lens && !lens.set.has(d.slug));
      d.el.classList.toggle('is-dim', out);
      d.el.classList.toggle('is-lit', !!lens && !out);
      d.dot.classList.toggle('is-dim', out);
      d.li.classList.toggle('is-dim', !!lens && !lens.set.has(d.slug));
      d.li.hidden = filter !== 'all' && d.cat !== filter;
      d.el.tabIndex = out ? -1 : 0;
    });
    regions.forEach((g) => g.el.classList.toggle('is-dim', filter !== 'all' && g.cat !== filter));
  }

  let lensChip = null;
  function setLens(slug, label, fam, projects) {
    lens = { slug, set: new Set(projects) };
    if (!lensChip) {
      lensChip = doc.createElement('p');
      lensChip.className = 'pj-lens';
      uiLeft.appendChild(lensChip);
    }
    lensChip.dataset.fam = fam || 'other';
    lensChip.innerHTML = `<span><strong>${esc(label)}</strong> · ${projects.length} projet${projects.length > 1 ? 's' : ''}</span><button type="button" aria-label="Retirer la mise en évidence ${esc(label)}">${icon('close')}</button>`;
    lensChip.querySelector('button').addEventListener('click', () => { clearLens(); });
    hint.hidden = true;
    applyDim();
  }
  function clearLens() {
    if (!lens) return;
    lens = null;
    if (lensChip) { lensChip.remove(); lensChip = null; }
    hint.hidden = false;
    applyDim();
  }
  // Cadrage : la vue qui montre le plus de projets éclairés à la fois.
  function frameLens() {
    if (!lens) return;
    const lit = data.filter((d) => lens.set.has(d.slug));
    let best = null, bestN = -1, bestDist = Infinity;
    lit.forEach((c) => {
      const n = lit.filter((d) => Math.abs(wrapD(d.x - c.x, W)) < SW / 2 - d.r - 20
        && (!wrapY || Math.abs(wrapD(d.y - c.y, H)) < SH / 2 - d.r - 40)).length;
      const dist = Math.abs(wrapD(c.x - camX, W));
      if (n > bestN || (n === bestN && dist < bestDist)) { best = c; bestN = n; bestDist = dist; }
    });
    if (best) glideTo(best.x, wrapY ? best.y : camY, 900);
  }

  // ── Vue : espace / liste ──────────────────────────────
  const viewBtns = [...sec.querySelectorAll('[data-view]')];
  function setView(v) {
    sec.dataset.view = v;
    viewBtns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.view === v)));
    if (v === 'space') { layout(); applyDim(); }
    doc.dispatchEvent(new CustomEvent('classic:layout'));
  }
  viewBtns.forEach((b) => b.addEventListener('click', () => setView(b.dataset.view)));

  // Liste : chaque ligne ouvre la fiche.
  data.forEach((d) => {
    const h = d.li.querySelector('.pj-item__title');
    const btn = doc.createElement('button');
    btn.type = 'button';
    btn.className = 'pj-item__open';
    btn.setAttribute('aria-haspopup', 'dialog');
    btn.textContent = h.textContent;
    h.textContent = '';
    h.appendChild(btn);
    btn.addEventListener('click', () => openProject(d.slug, { from: btn }));
  });

  // ── Fiche immersive ───────────────────────────────────
  const dlg = doc.createElement('dialog');
  dlg.className = 'pjd';
  dlg.setAttribute('aria-labelledby', 'pjd-title');
  dlg.innerHTML = `
    <div class="pjd__panel">
      <div class="pjd__media"><div class="pjd__orb"><span></span></div><div class="pjd__shot"></div></div>
      <div class="pjd__body">
        <div class="pjd__content">
          <p class="pjd__kicker"></p>
          <h2 class="pjd__title" id="pjd-title" tabindex="-1"></h2>
          <div class="pjd__status"></div>
          <p class="pjd__desc"></p>
          <div class="pjd__block">
            <p class="mini-title">Technologies</p>
            <div class="pjd__tags"></div>
            <button type="button" class="text-link pjd__sk">Voir ces technologies dans l'écosystème${icon('arrow')}</button>
          </div>
          <details class="pjd__role"><summary>Mon rôle dans le projet${icon('chevron')}</summary><p></p></details>
        </div>
        <nav class="pjd__nav" aria-label="Autres projets">
          <button type="button" class="pjd__step" data-step="-1">${icon('back')}<span></span></button>
          <span class="pjd__count"></span>
          <button type="button" class="pjd__step pjd__step--next" data-step="1"><span></span>${icon('arrow')}</button>
        </nav>
      </div>
      <button type="button" class="pjd__close" aria-label="Fermer la fiche">${icon('close')}</button>
    </div>`;
  doc.body.appendChild(dlg);
  const $ = (s) => dlg.querySelector(s);
  const panel = $('.pjd__panel');
  let current = null, returnTo = null, closing = false, pushed = false;

  function fill(d) {
    current = d;
    dlg.dataset.cat = d.cat;
    $('.pjd__orb span').textContent = d.name;
    const shot = $('.pjd__shot');
    shot.classList.remove('is-loaded');
    shot.innerHTML = '';
    if (d.img) {
      const img = new Image();
      img.alt = `Aperçu du projet ${d.title}`;
      img.decoding = 'async';
      img.onload = () => shot.classList.add('is-loaded');
      img.onerror = () => img.remove();          // repli : la bulle reste
      img.src = d.img;
      shot.appendChild(img);
    }
    $('.pjd__kicker').innerHTML = `<span class="chip-cat" data-cat="${esc(d.cat)}">${esc(d.cat)}</span><span>${esc(d.type)}</span>${d.ctx ? `<span>${esc(d.ctx)}</span>` : ''}`;
    $('.pjd__title').textContent = d.title;
    const links = d.li.querySelector('.pj-item__links');
    $('.pjd__status').innerHTML = d.li.querySelector('.status').outerHTML + (links ? links.innerHTML : '');
    $('.pjd__desc').textContent = d.li.querySelector('.pj-item__desc').textContent;
    $('.pjd__tags').innerHTML = d.li.querySelector('.tags').outerHTML;
    $('.pjd__sk').hidden = !d.skills.length;
    const role = d.li.querySelector('.pj-item__role p');
    $('.pjd__role').hidden = !role;
    $('.pjd__role').open = false;
    $('.pjd__role p').textContent = role ? role.textContent : '';
    const prev = data[mod(d.i - 1, data.length)], next = data[mod(d.i + 1, data.length)];
    $('[data-step="-1"] span').textContent = prev.title;
    $('[data-step="-1"]').setAttribute('aria-label', `Projet précédent : ${prev.title}`);
    $('[data-step="1"] span').textContent = next.title;
    $('[data-step="1"]').setAttribute('aria-label', `Projet suivant : ${next.title}`);
    $('.pjd__count').textContent = `${d.i + 1} / ${data.length}`;
    $('.pjd__body').scrollTop = 0;
    panel.scrollTop = 0;
  }

  function contentParts() {
    return [...$('.pjd__content').children].filter((n) => !n.hidden);
  }

  function openProject(slug, opts = {}) {
    const d = bySlug[slug];
    if (!d) return;
    const wasOpen = dlg.open;
    if (wasOpen && current === d) return;
    const dir = opts.dir || 1;
    fill(d);
    if (!wasOpen) {
      returnTo = opts.from || doc.activeElement;
      doc.documentElement.classList.add('has-dialog');
      dlg.showModal();
      requestAnimationFrame(() => dlg.classList.add('is-open'));
      holder.classList.add('is-receding');
      $('.pjd__title').focus({ preventScroll: true });
      animateIn(opts.from && opts.from.classList.contains('bub') ? opts.from : null);
    } else if (!REDUCE.matches) {
      gsap.fromTo(contentParts(), { opacity: 0, x: 24 * dir }, { opacity: 1, x: 0, duration: 0.45, stagger: 0.04, ease: 'power3.out', clearProps: 'transform,opacity' });
      gsap.fromTo('.pjd__orb', { scale: 0.85, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.55, ease: 'power3.out', clearProps: 'transform,opacity,visibility' });
    }
    $('.pjd__title').focus({ preventScroll: true });
    // Historique : « retour » ferme la fiche ; le lien reste partageable.
    const hash = `#projets/${slug}`;
    if (!opts.fromHash && location.hash !== hash) {
      if (wasOpen || pushed) history.replaceState({ pj: slug }, '', hash);
      else { history.pushState({ pj: slug }, '', hash); pushed = true; }
    }
    doc.dispatchEvent(new CustomEvent('classic:route', { detail: `projets/${slug}` }));
  }

  function animateIn(bubble) {
    if (REDUCE.matches) return;
    const pr = panel.getBoundingClientRect();
    let cx = pr.width / 2, cy = pr.height / 2, r0 = 48;
    if (bubble) {
      const br = bubble.getBoundingClientRect();
      cx = br.left + br.width / 2 - pr.left;
      cy = br.top + br.height / 2 - pr.top;
      r0 = br.width / 2;
    }
    const R = Math.hypot(Math.max(cx, pr.width - cx), Math.max(cy, pr.height - cy)) + 20;
    gsap.timeline({ defaults: { ease: 'power3.out' } })
      .fromTo(panel, { clipPath: `circle(${r0}px at ${cx}px ${cy}px)` },
        { clipPath: `circle(${R}px at ${cx}px ${cy}px)`, duration: 0.8, ease: 'power3.inOut', clearProps: 'clipPath' })
      .from('.pjd__orb', { scale: 0.55, autoAlpha: 0, duration: 0.8, clearProps: 'transform,opacity,visibility' }, 0.12)
      .from(contentParts(), { y: 22, opacity: 0, duration: 0.6, stagger: 0.07, clearProps: 'transform,opacity' }, 0.32)
      .from(dlg.querySelectorAll('.pjd__tags li'), { y: 8, opacity: 0, duration: 0.4, stagger: 0.025, clearProps: 'transform,opacity' }, 0.6)
      .from(['.pjd__nav', '.pjd__close'].map((s) => $(s)), { opacity: 0, duration: 0.5, clearProps: 'opacity' }, 0.7);
  }

  function closeProject(opts = {}) {
    if (!dlg.open || closing) return Promise.resolve();
    closing = true;
    const d = current;
    dlg.classList.remove('is-open');
    holder.classList.remove('is-receding');
    const done = () => {
      gsap.set(panel, { clearProps: 'all' });
      dlg.close();
      closing = false;
      doc.documentElement.classList.remove('has-dialog');
      doc.dispatchEvent(new CustomEvent('classic:route', { detail: null }));
      if (!opts.keepFocus) {
        // Retour : la bulle (ou la ligne) du projet affiché en dernier.
        const back = sec.dataset.view === 'list' ? d.li.querySelector('.pj-item__open')
          : returnTo && returnTo.classList.contains('bub') ? d.el : returnTo;
        if (back && back.isConnected && back.getClientRects().length) back.focus({ preventScroll: true });
      }
    };
    // Historique : on retire l'entrée de la fiche.
    if (!opts.fromPop) {
      if (pushed && history.state && history.state.pj) { app.skipHash = true; history.back(); }
      else if (/^#projets\//.test(location.hash)) history.replaceState(null, '', location.pathname + location.search);
    }
    pushed = false;
    return new Promise((resolve) => {
      const finish = () => { done(); resolve(); };
      if (REDUCE.matches) { finish(); return; }
      // La fiche se referme dans sa bulle si elle est à l'écran.
      const b = sec.dataset.view !== 'list' && d.el;
      const br = b && b.getBoundingClientRect();
      const pr = panel.getBoundingClientRect();
      if (br && br.width && br.top > 0 && br.bottom < innerHeight) {
        const cx = br.left + br.width / 2 - pr.left, cy = br.top + br.height / 2 - pr.top;
        const R = Math.hypot(Math.max(cx, pr.width - cx), Math.max(cy, pr.height - cy)) + 20;
        gsap.fromTo(panel, { clipPath: `circle(${R}px at ${cx}px ${cy}px)` },
          { clipPath: `circle(${br.width / 2}px at ${cx}px ${cy}px)`, duration: 0.55, ease: 'power3.inOut', onComplete: finish });
      } else {
        gsap.to(panel, { autoAlpha: 0, y: 18, scale: 0.98, duration: 0.3, ease: 'power2.in', onComplete: finish });
      }
    });
  }

  function step(dir) {
    if (!current) return;
    openProject(data[mod(current.i + dir, data.length)].slug, { dir });
  }

  $('.pjd__close').addEventListener('click', () => closeProject());
  dlg.addEventListener('cancel', (e) => { e.preventDefault(); closeProject(); });
  dlg.addEventListener('click', (e) => { if (e.target === dlg) closeProject(); });
  dlg.querySelectorAll('[data-step]').forEach((b) => b.addEventListener('click', () => step(+b.dataset.step)));
  dlg.addEventListener('keydown', (e) => {
    if (e.target.closest('summary, input, textarea')) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
  });
  // Technologie → écosystème ; la fiche se referme d'abord.
  dlg.addEventListener('click', (e) => {
    const a = e.target.closest('[data-skill-link]');
    if (!a) return;
    e.preventDefault();
    const slug = a.dataset.skillLink;
    closeProject({ keepFocus: true }).then(() => app.focusSkill && app.focusSkill(slug));
  });
  $('.pjd__sk').addEventListener('click', () => {
    const d = current;
    closeProject({ keepFocus: true }).then(() => app.lensProject && app.lensProject(d.slug));
  });

  window.addEventListener('popstate', () => {
    const m = location.hash.match(/^#projets\/(.+)$/);
    if (m && bySlug[m[1]]) { if (!dlg.open) pushed = !!(history.state && history.state.pj); openProject(m[1], { fromHash: true }); }
    else if (dlg.open) closeProject({ fromPop: true });
  });

  // ── Défilement : l'espace dérive doucement (profondeur) ──
  let inView = false;
  new IntersectionObserver(([e]) => {
    inView = e.isIntersecting;
    if (inView && !field.dataset.entered) {
      field.dataset.entered = '1';
      if (!REDUCE.matches) {
        field.classList.add('is-entering');
        setTimeout(() => field.classList.remove('is-entering'), 1600);
      }
    }
  }, { threshold: 0.15 }).observe(field);
  window.addEventListener('scroll', () => {
    if (!inView || !wrapY || REDUCE.matches) return;
    const r = field.getBoundingClientRect();
    const p = (innerHeight - r.top) / (innerHeight + r.height);
    driftY = (Math.min(1, Math.max(0, p)) - 0.5) * 140;
    request();
  }, { passive: true });

  // Redimensionnement : nouvelle tuile (largeur seulement : la barre
  // d'adresse mobile ne doit pas tout réarranger).
  let lastW = 0, rt = 0;
  new ResizeObserver(() => {
    const w = Math.round(field.getBoundingClientRect().width);
    if (!w || Math.abs(w - lastW) < 2) return;
    clearTimeout(rt);
    rt = setTimeout(() => { lastW = w; layout(); }, lastW ? 150 : 0);
  }).observe(field);

  sec.dataset.view = 'space';
  lastW = Math.round(field.getBoundingClientRect().width);
  layout();

  // ── API partagée (compétences, parcours, liens profonds) ──
  app.openProject = (slug, opts = {}) => {
    if (!bySlug[slug]) return;
    if (opts.fromHash && !dlg.open) {
      const r = sec.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) sec.scrollIntoView({ behavior: 'instant', block: 'start' });
    }
    openProject(slug, opts);
  };
  app.lensSkill = (slug, label, fam, projects) => {
    if (sec.dataset.view !== 'space') setView('space');
    setLens(slug, label, fam, projects);
    holder.scrollIntoView({ behavior: REDUCE.matches ? 'instant' : 'smooth', block: 'center' });
    setTimeout(frameLens, REDUCE.matches ? 0 : 450);
  };
  app.projectInfo = (slug) => bySlug[slug] || null;

  // Arrivée directe sur une fiche (#projets/<slug>).
  const m = location.hash.match(/^#projets\/(.+)$/);
  if (m && bySlug[decodeURIComponent(m[1])]) {
    requestAnimationFrame(() => app.openProject(decodeURIComponent(m[1]), { fromHash: true }));
  }
}
