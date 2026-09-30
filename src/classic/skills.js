/* ══════════════════════════════════════════════════════
   SKILLS.JS : Page Compétences : l'écosystème technique

   Chaque compétence du HTML généré porte ses projets (data-projects).
   On en tire un globe qu'on fait tourner à la main :
     • une bulle par compétence, taille = nombre de projets qui
       l'utilisent (toutes restent visibles, même à zéro) ;
     • familles mêlées au hasard (la couleur dit la famille) ;
     • la tuile se répète : glisser fait « tourner » le monde, avec
       inertie ; les bulles rapetissent et s'estompent vers les bords
       (courbure du globe) ;
     • survol : nom, famille, nombre de projets ;
       clic : panneau, les projets concernés (liens vers leur fiche),
       les technologies souvent associées, « voir dans l'espace projets ».
   Projet ↔ technologie : #projet/<slug> éclaire les technologies d'un
   projet (lien « Voir ces technologies » d'une fiche).

   Accessibilité : les bulles sont un décor (aria-hidden) ; la liste par
   famille reste dans la page, atteignable au clavier (le focus amène la
   bulle au centre).
   ══════════════════════════════════════════════════════ */
import { createSpace, relax, rng, mod, REDUCE } from './space.js';

const doc = document;
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const icon = (id, cls = 'ico') => `<svg class="${cls}" aria-hidden="true" focusable="false"><use href="#i-${id}"/></svg>`;
const plural = (n, one, many) => `${n} ${n > 1 ? many : one}`;
const smooth = (a, b, v) => { const t = Math.min(1, Math.max(0, (v - a) / (b - a))); return t * t * (3 - 2 * t); };

export function initSkills() {
  const sec = doc.querySelector('.eco');
  const holder = sec && sec.querySelector('.eco-space');
  const aside = sec && sec.querySelector('.eco-panel');
  if (!holder || !aside) return;
  const panel = aside.querySelector('.eco-panel__in');

  // ── Données ───────────────────────────────────────────
  let projects = [];
  try { projects = JSON.parse(doc.getElementById('eco-projects').textContent); } catch (e) { /* liste seule */ }
  const project = Object.fromEntries(projects.map((p) => [p.slug, p]));
  const projectHref = (slug) => {
    const a = sec.querySelector(`.sk__projects a[data-project="${CSS.escape(slug)}"]`);
    return a ? a.getAttribute('href') : `projets.html#${slug}`;
  };
  const projectsPage = projectHref('').split('#')[0];

  const fams = [...sec.querySelectorAll('.fam')].map((f) => ({
    key: f.dataset.fam, el: f, label: f.querySelector('.fam__l').textContent,
  }));
  const famOf = Object.fromEntries(fams.map((f) => [f.key, f]));
  const skills = [...sec.querySelectorAll('.sk')].map((li, i) => ({
    i, li, btn: li.querySelector('.sk__btn'),
    slug: li.dataset.skill, fam: li.dataset.fam, n: +li.dataset.count || 0,
    name: li.querySelector('.sk__name').textContent,
    projects: (li.dataset.projects || '').split(' ').filter(Boolean),
  }));
  const bySlug = Object.fromEntries(skills.map((s) => [s.slug, s]));
  const maxN = Math.max(1, ...skills.map((s) => s.n));
  const countText = (n) => (n ? `Utilisée dans ${plural(n, 'projet', 'projets')}` : 'Hors des projets présentés ici');

  // ── Espace ────────────────────────────────────────────
  holder.insertAdjacentHTML('beforeend', `
    <div class="space-tip" aria-hidden="true"></div>
    <div class="space-ui">
      <button type="button" class="space-btn" data-home>${icon('center')}Recentrer</button>
      <p class="space-hint">Glissez pour faire tourner l’écosystème</p>
    </div>`);
  const tip = holder.querySelector('.space-tip');
  const hint = holder.querySelector('.space-hint');

  // Courbure : au bord de l'écran, les bulles rapetissent et s'effacent.
  let CX = 0, CY = 0, RX = 1, RY = 1;
  const flat = REDUCE.matches;
  function curve(x, y) {
    const dx = x - CX, dy = y - CY;
    const t = smooth(0.42, 1.12, Math.hypot(dx / RX, dy / RY));
    const k = flat ? 0 : t;
    return { x: CX + dx * (1 - 0.1 * k), y: CY + dy * (1 - 0.1 * k), s: 1 - 0.42 * k, o: 1 - 0.7 * t };
  }

  const space = createSpace(holder, {
    project: curve,
    make(it, L) {
      const el = doc.createElement('div');
      const s = it.s;
      el.className = `skb${s.n ? '' : ' skb--decl'}${it.below ? ' skb--below' : ''}`;
      el.dataset.i = s.i;
      el.dataset.fam = s.fam;
      el.style.setProperty('--r', `${it.r.toFixed(1)}px`);
      el.innerHTML = `<span class="skb__c">${it.below ? '' : `<span class="skb__n">${esc(s.name)}</span>`}${s.n && it.r > 44 ? `<span class="skb__k">${s.n}</span>` : ''}</span>${it.below ? `<span class="skb__n">${esc(s.name)}</span>` : ''}`;
      return el;
    },
    onPick(it) { hideTip(); select(it.s.slug, { glide: true }); },
    onHover(it, el) { if (it) showTip(it.s, el); else hideTip(); },
    onDragStart() { hideTip(); hint.classList.add('is-gone'); },
    onMove() { if (tipEl) positionTip(tipEl); },
    onResize: layout,
  });

  // ── Disposition : bulles semées sur un tore ───────────
  let bubbles = null;
  function layout() {
    if (!space.measure()) return;
    const { w: SW, h: SH } = space.size;
    CX = SW / 2; CY = SH / 2 + (SW < 700 ? 30 : 40);
    RX = SW / 2; RY = SH / 2;
    const k = SW < 700 ? 0.7 : SW < 1100 ? 0.86 : 1;
    const items = skills.map((s) => {
      const r = (s.n ? 30 + 46 * Math.pow(s.n / maxN, 0.7) : 21) * k;
      return { s, r, below: r < 40 * k || !s.n, rr: 0 };
    });
    // Rayon « d'encombrement » : un libellé sous la bulle prend de la place.
    items.forEach((it) => { it.rr = it.r; it.r = it.below ? it.r + 16 * k : it.r; });
    const area = items.reduce((s, it) => s + Math.PI * (it.r + 10) ** 2, 0) / 0.44;
    const aspect = Math.min(1.9, Math.max(0.7, SW / SH));
    const W = Math.sqrt(area * aspect), H = area / W;

    // Départs en « tournesol » dans un ordre tiré au hasard : les
    // familles se mêlent, la surface est couverte sans trou.
    const rand = rng(424242);
    const order = items.map((it) => ({ it, key: rand() })).sort((a, b) => a.key - b.key).map((o) => o.it);
    order.forEach((it, n) => {
      it.x = mod((n * 0.618034 + rand() * 0.05) * W, W);
      it.y = mod(((n + 0.5) / order.length + (rand() - 0.5) * 0.04) * H, H);
    });
    relax(items, W, H, { gap: 12 * k, iterations: 360, pull: 0 });
    items.forEach((it) => { it.r = it.rr; });

    bubbles = { name: 'bubbles', z: 1, W, H, items };
    space.setLayers([bubbles], 110 * k);
    home();
    space.request();
    restoreMarks();
  }
  const itemOf = (s) => bubbles && bubbles.items[s.i];
  // Départ : la compétence la plus utilisée, au centre.
  const lead = () => itemOf([...skills].sort((a, b) => b.n - a.n)[0]);
  function home() { const it = lead(); space.cam.x = it.x; space.cam.y = it.y - 20; }

  holder.querySelector('[data-home]').addEventListener('click', () => {
    reset();
    space.glideTo(lead(), bubbles, space.size.w / 2, space.size.h / 2 + 20, 800);
  });

  // ── Info-bulle ────────────────────────────────────────
  let tipEl = null;
  function showTip(s, el) {
    tipEl = el;
    tip.dataset.fam = s.fam;
    tip.innerHTML = `<p class="space-tip__t">${esc(s.name)}</p>
      <p class="space-tip__m"><i class="fam-dot" aria-hidden="true"></i>${esc(famOf[s.fam].label)}</p>
      <p class="space-tip__hint">${countText(s.n)}${s.n ? ' · cliquer pour les voir' : ''}</p>`;
    tip.classList.add('is-on');
    positionTip(el);
  }
  function positionTip(el) {
    const { w: SW, h: SH } = space.size;
    const r = (parseFloat(el.style.getPropertyValue('--r')) || 30) * (parseFloat((el.style.transform.match(/scale\(([\d.]+)/) || [])[1]) || 1);
    const tw = tip.offsetWidth || 220, th = tip.offsetHeight || 90;
    let x = el._x + r + 16;
    if (x + tw > SW - 12) x = el._x - r - 16 - tw;
    const y = Math.min(SH - th - 12, Math.max(12, el._y - th / 2));
    tip.style.transform = `translate3d(${Math.round(Math.max(12, x))}px,${Math.round(y)}px,0)`;
  }
  function hideTip() { tipEl = null; tip.classList.remove('is-on'); }

  // ── Sélection ─────────────────────────────────────────
  let marks = { sel: [], rel: [] };
  function mark(sel, rel) {
    marks = { sel, rel };
    restoreMarks();
  }
  function restoreMarks() {
    if (!bubbles) return;
    const on = marks.sel.length > 0;
    holder.classList.toggle('has-sel', on);
    skills.forEach((s) => {
      const it = itemOf(s);
      space.setItemClass(it, 'is-sel', marks.sel.includes(s.slug));
      space.setItemClass(it, 'is-rel', marks.rel.includes(s.slug));
      s.li.classList.toggle('is-sel', marks.sel.includes(s.slug));
    });
  }

  // Point d'arrivée d'une bulle choisie : à gauche du panneau (ordinateur),
  // au-dessus de la feuille (mobile).
  function focusPoint() {
    const { w, h } = space.size;
    return w > 860 ? [(w - 380) / 2, h / 2 + 30] : [w / 2, h * 0.3 + 30];
  }

  let returnTo = null;
  function openPanel(html, fam) {
    panel.dataset.fam = fam || '';
    panel.innerHTML = html;
    aside.hidden = false;
    hideTip();
  }
  function select(slug, opts = {}) {
    const s = bySlug[slug];
    if (!s) return;
    if (opts.from) returnTo = opts.from;
    // Technologies qui partagent au moins un projet avec celle-ci.
    const co = new Map();
    s.projects.forEach((p) => (project[p] ? project[p].skills : []).forEach((k) => { if (k !== slug && bySlug[k]) co.set(k, (co.get(k) || 0) + 1); }));
    const related = [...co.entries()].sort((a, b) => b[1] - a[1]);
    mark([slug], related.map(([k]) => k));
    const list = s.projects.map((p) => {
      const info = project[p];
      return info ? `<li><a href="${esc(projectHref(p))}" data-cat="${esc(info.cat)}"><i class="cat-dot" aria-hidden="true"></i><span>${esc(info.title)}</span><small>${esc(info.cat)}</small></a></li>` : '';
    }).join('');
    openPanel(`
      <div class="skd__top"><p class="skd__fam" data-fam="${s.fam}">${esc(famOf[s.fam].label)}</p><button type="button" class="skd__close" data-close aria-label="Fermer le détail">${icon('close')}</button></div>
      <h2 class="skd__name" tabindex="-1">${esc(s.name)}</h2>
      <p class="skd__count">${countText(s.n)}</p>
      ${list ? `<ul class="skd__list">${list}</ul>` : `<p class="skd__empty">Compétence de mon profil, absente des ${projects.length} projets présentés ici.</p>`}
      ${related.length ? `<div class="skd__sec"><p class="mini-title">Souvent associée à</p><div class="skd__rel">${related.slice(0, 8).map(([k, n]) =>
        `<button type="button" data-skill="${k}" data-fam="${bySlug[k].fam}" title="${plural(n, 'projet', 'projets')} en commun">${esc(bySlug[k].name)}</button>`).join('')}</div></div>` : ''}
      ${s.n ? `<div class="skd__actions"><a class="btn btn--sm" href="${esc(projectsPage)}#tech/${s.slug}">Voir dans l’espace projets${icon('arrow')}</a></div>` : ''}`, s.fam);
    if (opts.glide !== false && bubbles) {
      const [tx, ty] = focusPoint();
      space.glideTo(itemOf(s), bubbles, tx, ty, 750);
    }
    if (opts.focus !== false) panel.querySelector('.skd__name').focus({ preventScroll: true });
    setHash(s.slug);
  }

  // Depuis une fiche projet : ses technologies éclairées ici.
  function lensProject(pslug) {
    const info = project[pslug];
    if (!info) return;
    const own = info.skills.filter((k) => bySlug[k]);
    mark(own, []);
    openPanel(`
      <div class="skd__top"><p class="skd__fam" data-cat="${esc(info.cat)}">Projet · ${esc(info.cat)}</p><button type="button" class="skd__close" data-close aria-label="Fermer le détail">${icon('close')}</button></div>
      <h2 class="skd__name" tabindex="-1">${esc(info.title)}</h2>
      <p class="skd__count">${plural(own.length, 'technologie mise en évidence', 'technologies mises en évidence')} dans l’écosystème</p>
      <div class="skd__sec"><div class="skd__rel">${own.map((k) => `<button type="button" data-skill="${k}" data-fam="${bySlug[k].fam}">${esc(bySlug[k].name)}</button>`).join('')}</div></div>
      <div class="skd__actions"><a class="btn btn--sm" href="${esc(projectHref(pslug))}">Voir la fiche du projet${icon('arrow')}</a></div>`, '');
    // Cadrage : la technologie la plus utilisée du projet.
    const lead = own.map((k) => bySlug[k]).sort((a, b) => b.n - a.n)[0];
    if (lead && bubbles) { const [tx, ty] = focusPoint(); space.glideTo(itemOf(lead), bubbles, tx, ty, 800); }
  }

  function reset(opts = {}) {
    mark([], []);
    aside.hidden = true;
    panel.innerHTML = '';
    setHash('');
    if (opts.focus && returnTo && returnTo.isConnected) returnTo.focus({ preventScroll: true });
  }

  panel.addEventListener('click', (e) => {
    const t = e.target.closest('button');
    if (!t) return;
    if (t.hasAttribute('data-close')) reset({ focus: true });
    else if (t.dataset.skill) select(t.dataset.skill);
  });
  doc.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !aside.hidden) reset({ focus: true });
  });

  function setHash(h) {
    const want = h ? `#${h}` : '';
    if (location.hash !== want) history.replaceState(null, '', location.pathname + location.search + want);
  }

  // ── Clavier : la liste pilote le globe ────────────────
  skills.forEach((s) => {
    s.btn.setAttribute('aria-label', `${s.name}, ${famOf[s.fam].label} : ${countText(s.n).toLowerCase()}. Afficher le détail`);
    s.btn.addEventListener('click', () => select(s.slug, { from: s.btn }));
    s.btn.addEventListener('focus', () => {
      if (sec.dataset.view === 'list' || !bubbles) return;
      const it = itemOf(s);
      space.setItemClass(it, 'is-focus', true);
      const el = space.nearest(it, ...focusPoint());
      if (!el || !space.inView(el, 150)) space.glideTo(it, bubbles, space.size.w / 2, space.size.h / 2 + 30, 550);
      requestAnimationFrame(() => { const n = space.nearest(it); if (n) showTip(s, n); });
      hint.classList.add('is-gone');
    });
    s.btn.addEventListener('blur', () => { if (bubbles) space.setItemClass(itemOf(s), 'is-focus', false); hideTip(); });
  });

  // ── Vue : écosystème / liste ──────────────────────────
  const viewBtns = [...sec.querySelectorAll('[data-view]')];
  viewBtns.forEach((b) => b.addEventListener('click', () => {
    sec.dataset.view = b.dataset.view;
    viewBtns.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    hideTip();
  }));

  // ── Démarrage ─────────────────────────────────────────
  // Espace / liste : dans la barre du bas (l'en-tête reste léger).
  const views = sec.querySelector('[data-view]').parentElement;
  views.classList.add('space-views');
  holder.querySelector('.space-ui').prepend(views);
  // Hauteur de l'en-tête : la vue « liste » commence dessous.
  const head = sec.querySelector('.world-ui');
  new ResizeObserver(() => sec.style.setProperty('--head', `${Math.round(head.getBoundingClientRect().bottom)}px`)).observe(head);
  sec.dataset.view = 'space';
  layout();
  if (!REDUCE.matches && !doc.documentElement.classList.contains('is-still')) {
    // Entrée : le globe finit de tourner jusqu'à sa place.
    space.cam.x += 160; space.cam.y += 40;
    space.glideBy(-160, -40, 1300);
  }
  function fromHash() {
    const h = decodeURIComponent(location.hash.slice(1));
    const m = h.match(/^projet\/(.+)$/);
    if (m) lensProject(m[1]);
    else if (bySlug[h]) select(h, { focus: false });
  }
  window.addEventListener('hashchange', fromHash);
  if (location.hash) setTimeout(fromHash, REDUCE.matches ? 0 : 200);
}
