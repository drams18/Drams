/* ══════════════════════════════════════════════════════
   TIMELINE.JS — Page Parcours : la frise horizontale

   La frise (en bas de l'écran) est un jeu d'onglets : chaque nœud est
   une étape ; l'étape choisie s'affiche au-dessus, sans changer de page.
     • glisser la frise (souris), la faire défiler (doigt, molette,
       pavé tactile), survoler, cliquer ;
     • clavier : ← → entre les étapes, Début / Fin ;
     • « Aujourd'hui » placé à la date réelle du visiteur ;
     • au départ : l'étape la plus importante (DevPhantom), sauf lien
       direct (#bts, #etna…).
   Sans JavaScript : toutes les étapes à la suite, la frise en liens.
   ══════════════════════════════════════════════════════ */
const doc = document;
const REDUCE = matchMedia('(prefers-reduced-motion: reduce)');

export function initTimeline() {
  const sec = doc.querySelector('.tl');
  const track = sec && sec.querySelector('.tl-track');
  if (!track) return;
  const rail = track.querySelector('.tl-rail');
  const stage = sec.querySelector('.tl-stage');
  const yearEl = sec.querySelector('.tl-stage__year');
  const tablist = track.querySelector('.tl-nodes');
  const nodes = [...tablist.querySelectorAll('.tl-node')];
  const panels = Object.fromEntries([...sec.querySelectorAll('.tl-panel')].map((p) => [p.dataset.step, p]));
  const bars = [...rail.querySelectorAll('.tl-bar')];
  const from = +track.dataset.from, to = +track.dataset.to;
  const years = to - from;

  // ── Échelle : la frise dépasse l'écran, on la manipule ─
  function scale() {
    const w = track.clientWidth;
    const ppy = Math.max(w < 700 ? 150 : 180, Math.round((w * 1.15) / years));
    rail.style.setProperty('--ppy', `${ppy}px`);
    rail.style.setProperty('--years', years);
  }
  scale();
  new ResizeObserver(() => { scale(); center(current, true); }).observe(track);

  // « Aujourd'hui »
  const now = rail.querySelector('.tl-now');
  const d = new Date();
  const t = d.getFullYear() + d.getMonth() / 12 + (d.getDate() - 1) / 365;
  if (now && t >= from && t <= to) { now.style.setProperty('--now', ((t - from) / years).toFixed(4)); now.classList.add('is-on'); }

  // ── Onglets ───────────────────────────────────────────
  tablist.setAttribute('role', 'tablist');
  tablist.setAttribute('aria-label', 'Étapes du parcours');
  track.removeAttribute('aria-label');
  track.setAttribute('role', 'presentation');
  track.setAttribute('data-keys', '');
  nodes.forEach((n) => {
    const p = panels[n.dataset.step];
    n.setAttribute('role', 'tab');
    n.id = `tab-${n.dataset.step}`;
    n.setAttribute('aria-controls', p.id);
    n.setAttribute('aria-label', `${n.querySelector('.tl-node__l').textContent}, ${n.querySelector('.tl-node__d').textContent}`);
    p.setAttribute('role', 'tabpanel');
    p.setAttribute('aria-labelledby', n.id);
    p.setAttribute('tabindex', '0');
  });

  let current = null;
  function select(step, opts = {}) {
    const i = nodes.findIndex((n) => n.dataset.step === step);
    if (i < 0) return;
    const prev = current;
    if (prev === i && !opts.force) return;
    current = i;
    nodes.forEach((n, k) => {
      n.setAttribute('aria-selected', String(k === i));
      n.tabIndex = k === i ? 0 : -1;
    });
    bars.forEach((b) => b.classList.toggle('is-on', b.dataset.step === step));
    const panel = panels[step];
    Object.values(panels).forEach((p) => { p.hidden = p !== panel; });
    stage.scrollTop = 0;

    // L'étape entre du côté d'où l'on vient dans le temps.
    if (prev !== null && !REDUCE.matches) {
      const dir = i > prev ? 1 : -1;
      [...panel.children].forEach((c, k) => c.animate(
        [{ opacity: 0, transform: `translateX(${40 * dir}px)` }, { opacity: 1, transform: 'none' }],
        { duration: 480, delay: k * 45, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'backwards' }));
    }
    // Grande année en filigrane.
    const y = panel.dataset.year || '';
    if (yearEl && yearEl.textContent !== y) {
      yearEl.textContent = y;
      if (prev !== null && !REDUCE.matches) yearEl.animate([{ opacity: 0, transform: 'translateY(6%)' }, { opacity: 1, transform: 'none' }], { duration: 600, easing: 'cubic-bezier(.16,1,.3,1)' });
    }
    center(i, opts.instant);
    if (opts.focus) nodes[i].focus({ preventScroll: true });
    if (!opts.keepHash) history.replaceState(null, '', `${location.pathname}${location.search}#${step}`);
    doc.dispatchEvent(new CustomEvent('classic:route', { detail: panel.dataset.kind === 'next' ? 'parcours' : `parcours/${step}` }));
  }

  // Le nœud choisi vient vers le centre de la frise.
  function center(i, instant) {
    if (i === null || i === undefined) return;
    const n = nodes[i];
    const x = n.offsetLeft + rail.offsetLeft - track.clientWidth / 2;
    track.scrollTo({ left: Math.max(0, x), behavior: instant || REDUCE.matches ? 'instant' : 'smooth' });
  }

  nodes.forEach((n) => {
    n.addEventListener('click', (e) => {
      e.preventDefault();
      if (dragged) return;
      select(n.dataset.step, { focus: false });
    });
  });
  tablist.addEventListener('keydown', (e) => {
    const k = { ArrowRight: 1, ArrowLeft: -1, Home: -Infinity, End: Infinity }[e.key];
    if (k === undefined) return;
    e.preventDefault();
    const i = Math.min(nodes.length - 1, Math.max(0, (current ?? 0) + (Number.isFinite(k) ? k : k > 0 ? nodes.length : -nodes.length)));
    select(nodes[i].dataset.step, { focus: true });
  });
  // Survol d'un nœud : sa barre s'allume.
  nodes.forEach((n) => {
    n.addEventListener('pointerenter', () => bars.forEach((b) => b.classList.toggle('is-hot', b.dataset.step === n.dataset.step)));
    n.addEventListener('pointerleave', () => bars.forEach((b) => b.classList.remove('is-hot')));
  });

  // ── Manipulation directe : glisser la frise ───────────
  let drag = null, dragged = false, v = 0, raf = 0;
  track.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;     // doigt : défilement natif
    cancelAnimationFrame(raf);
    drag = { x: e.clientX, x0: e.clientX, left: track.scrollLeft, t: e.timeStamp, moved: false };
    v = 0;
  });
  addEventListener('pointermove', (e) => {
    if (!drag) return;
    if (!drag.moved && Math.abs(e.clientX - drag.x0) < 5) return;
    if (!drag.moved) { drag.moved = true; track.classList.add('is-dragging'); hintOff(); }
    const dt = Math.max(1, e.timeStamp - drag.t);
    v = 0.6 * v + 0.4 * ((e.clientX - drag.x) / dt);
    drag.x = e.clientX; drag.t = e.timeStamp;
    track.scrollLeft = drag.left - (e.clientX - drag.x0);
  });
  addEventListener('pointerup', (e) => {
    if (!drag) return;
    dragged = drag.moved;
    track.classList.remove('is-dragging');
    const still = e.timeStamp - drag.t > 90;
    drag = null;
    setTimeout(() => { dragged = false; }, 0);
    if (!dragged || still || REDUCE.matches) return;
    // Élan après le lâcher.
    let last = performance.now();
    const glide = (now) => {
      const dt = now - last; last = now;
      track.scrollLeft -= v * dt;
      v *= Math.exp(-dt / 300);
      if (Math.abs(v) > 0.02) raf = requestAnimationFrame(glide);
    };
    raf = requestAnimationFrame(glide);
  });
  // Molette verticale → défilement horizontal de la frise.
  track.addEventListener('wheel', (e) => {
    if (e.ctrlKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
    e.preventDefault();
    track.scrollLeft += e.deltaY * (e.deltaMode === 1 ? 16 : 1);
    hintOff();
  }, { passive: false });

  const hint = doc.createElement('p');
  hint.className = 'tl-hint';
  hint.setAttribute('aria-hidden', 'true');
  hint.textContent = 'Glissez la frise · cliquez une étape';
  track.before(hint);
  function hintOff() { hint.classList.add('is-gone'); }
  track.addEventListener('scroll', () => { if (track.scrollLeft > 40) hintOff(); }, { passive: true });

  // ── Départ ────────────────────────────────────────────
  const fromHash = () => {
    const h = decodeURIComponent(location.hash.slice(1));
    return panels[h] ? h : null;
  };
  select(fromHash() || stage.dataset.initial, { instant: true, keepHash: !fromHash() });
  addEventListener('hashchange', () => { const h = fromHash(); if (h) select(h); });
}
