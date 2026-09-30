/* ══════════════════════════════════════════════════════
   TIMELINE.JS : Page Parcours : la frise horizontale

   La frise (en bas de l'écran) est un jeu d'onglets : chaque nœud est
   une étape (sur la ligne) ou un jalon (petit point au-dessus : diplôme,
   projet daté) ; le choix s'affiche au-dessus, sans changer de page.
     • la frise tient dans l'écran quand il est assez large ; sinon la
       glisser (souris), la faire défiler (doigt, molette, pavé tactile) ;
     • clavier : ← → dans l'ordre chronologique, Début / Fin ;
     • une étape choisie éclaire ses jalons, et inversement ;
     • « Aujourd'hui » placé à la date réelle du visiteur ;
     • au départ : la prochaine étape (recherche de CDI), sauf lien
       direct (#bts, #skywalk…).
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
  const tablist = track.querySelector('.tl-nodes');
  const nodes = [...tablist.querySelectorAll('.tl-node')];
  const panels = Object.fromEntries([...sec.querySelectorAll('.tl-panel')].map((p) => [p.dataset.step, p]));
  const bars = [...rail.querySelectorAll('.tl-bar')];
  const from = +track.dataset.from, to = +track.dataset.to;
  const years = to - from;

  // ── Échelle : toute la frise à l'écran si possible, sinon on la manipule ─
  function scale() {
    const cs = getComputedStyle(rail);
    const room = track.clientWidth - 2 * parseFloat(cs.marginLeft) - parseFloat(cs.getPropertyValue('--off')) - parseFloat(cs.getPropertyValue('--end'));
    const ppy = Math.max(track.clientWidth < 700 ? 110 : 120, Math.floor(room / years));
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
    // Parenté étape ↔ jalons : l'étape d'un jalon, les jalons d'une étape.
    const parent = nodes[i].dataset.parent;
    nodes.forEach((n) => n.classList.toggle('is-kin', n.dataset.parent === step || (!!parent && n.dataset.step === parent)));
    bars.forEach((b) => b.classList.toggle('is-kin', !!parent && b.dataset.step === parent));
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
    center(i, opts.instant);
    if (opts.focus) nodes[i].focus({ preventScroll: true });
    if (!opts.keepHash) history.replaceState(null, '', `${location.pathname}${location.search}#${step}`);
    doc.dispatchEvent(new CustomEvent('classic:route', { detail: panel.dataset.route || 'parcours' }));
  }

  // Le nœud choisi vient vers le centre de la frise (si elle dépasse).
  function center(i, instant) {
    if (i === null || i === undefined || track.scrollWidth <= track.clientWidth) return;
    const x = nodes[i].offsetLeft + rail.offsetLeft - track.clientWidth / 2;
    track.scrollTo({ left: Math.max(0, x), behavior: instant || REDUCE.matches ? 'instant' : 'smooth' });
  }

  nodes.forEach((n) => {
    n.addEventListener('click', (e) => {
      e.preventDefault();
      if (dragged) return;
      select(n.dataset.step, { focus: false });
    });
  });
  // Liens entre fiches (jalons d'une étape, « Pendant : ETNA ») : même onglet.
  stage.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    const to = a && decodeURIComponent(a.hash.slice(1));
    if (!to || !panels[to]) return;
    e.preventDefault();
    select(to, { focus: true });
  });
  tablist.addEventListener('keydown', (e) => {
    const k = { ArrowRight: 1, ArrowLeft: -1, Home: -Infinity, End: Infinity }[e.key];
    if (k === undefined) return;
    e.preventDefault();
    const i = Math.min(nodes.length - 1, Math.max(0, (current ?? 0) + (Number.isFinite(k) ? k : k > 0 ? nodes.length : -nodes.length)));
    select(nodes[i].dataset.step, { focus: true });
  });
  // Survol d'un nœud : sa barre (ou celle de l'étape du jalon) s'allume.
  nodes.forEach((n) => {
    n.addEventListener('pointerenter', () => bars.forEach((b) => b.classList.toggle('is-hot', b.dataset.step === (n.dataset.parent || n.dataset.step))));
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

  const hint = sec.querySelector('.tl-hint');
  function hintOff() { if (hint) hint.classList.add('is-gone'); }
  // Seul un geste du visiteur l'éteint (pas le centrage automatique).
  track.addEventListener('pointerdown', hintOff, { passive: true });

  // ── Départ ────────────────────────────────────────────
  const fromHash = () => {
    const h = decodeURIComponent(location.hash.slice(1));
    return panels[h] ? h : null;
  };
  select(fromHash() || stage.dataset.initial, { instant: true, keepHash: !fromHash() });
  addEventListener('hashchange', () => { const h = fromHash(); if (h) select(h); });
}
