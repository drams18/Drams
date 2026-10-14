/* ══════════════════════════════════════════════════════
   SKILLS.JS : Page Compétences : le détail d'une technologie

   La page générée liste les familles et leurs technologies (.sk). Ce
   module n'ajoute que le panneau de détail :
     • clic sur une technologie : les projets qui l'utilisent (liens vers
       leur fiche) et « Voir ces projets » (page Projets filtrée) ;
     • #projet/<slug> (lien « Voir ces technologies » d'une fiche) : les
       technologies du projet sont mises en évidence dans la page.
   Échap, la croix ou un clic hors du panneau le referment.
   ══════════════════════════════════════════════════════ */
const doc = document;
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const icon = (id, cls = 'ico') => `<svg class="${cls}" aria-hidden="true" focusable="false"><use href="#i-${id}"/></svg>`;
const plural = (n, one, many) => `${n} ${n > 1 ? many : one}`;
const REDUCE = matchMedia('(prefers-reduced-motion: reduce)');

export function initSkills() {
  const sec = doc.querySelector('.eco');
  const aside = sec && sec.querySelector('.eco-panel');
  if (!aside) return;
  const panel = aside.querySelector('.eco-panel__in');
  // Panneau fixe : hors de la section, que l'animation d'arrivée (transform)
  // transformerait en repère et ferait défiler avec la page.
  doc.body.appendChild(aside);

  // ── Données ───────────────────────────────────────────
  let projects = [];
  try { projects = JSON.parse(doc.getElementById('eco-projects').textContent); } catch (e) { /* liste seule */ }
  const project = Object.fromEntries(projects.map((p) => [p.slug, p]));
  const projectHref = (slug) => {
    const a = sec.querySelector(`.sk__projects a[data-project="${CSS.escape(slug)}"]`);
    return a ? a.getAttribute('href') : `/classique/projets#${slug}`;
  };
  const projectsPage = projectHref('').split('#')[0];
  const famLabel = Object.fromEntries([...sec.querySelectorAll('.fam')].map((f) => [f.dataset.fam, f.querySelector('.fam__t').textContent.trim()]));
  const skills = [...sec.querySelectorAll('.sk')].map((li) => ({
    li, btn: li.querySelector('.sk__btn'),
    slug: li.dataset.skill, fam: li.dataset.fam, logo: li.dataset.logo || null,
    name: li.querySelector('.sk__name').textContent,
    projects: (li.dataset.projects || '').split(' ').filter(Boolean),
  }));
  const bySlug = Object.fromEntries(skills.map((s) => [s.slug, s]));

  // ── Mise en évidence dans la page ─────────────────────
  let marked = [];
  function mark(slugs, cls) {
    skills.forEach((s) => {
      s.li.classList.remove('is-sel', 'is-lit');
      s.btn.setAttribute('aria-expanded', 'false');
    });
    marked = slugs.filter((k) => bySlug[k]);
    marked.forEach((k) => bySlug[k].li.classList.add(cls));
    if (cls === 'is-sel') marked.forEach((k) => bySlug[k].btn.setAttribute('aria-expanded', 'true'));
    sec.classList.toggle('has-lit', cls === 'is-lit' && marked.length > 0);
  }
  // Une technologie hors de l'écran (lien entrant) : on l'amène en vue.
  function reveal(el) {
    const r = el.getBoundingClientRect();
    if (r.top < 90 || r.bottom > innerHeight - 40) el.scrollIntoView({ block: 'center', behavior: REDUCE.matches ? 'auto' : 'smooth' });
  }

  // ── Panneau ───────────────────────────────────────────
  let returnTo = null;
  function openPanel(html, fam, { focus = true } = {}) {
    panel.dataset.fam = fam || '';
    panel.innerHTML = html;
    aside.hidden = false;
    if (focus) panel.querySelector('.skd__name').focus({ preventScroll: true });
  }
  const top = (label, attr) => `<div class="skd__top"><p class="skd__fam" ${attr}>${esc(label)}</p><button type="button" class="skd__close" data-close aria-label="Fermer le détail">${icon('close')}</button></div>`;

  function select(slug, opts = {}) {
    const s = bySlug[slug];
    if (!s) return;
    returnTo = s.btn;
    mark([slug], 'is-sel');
    const list = s.projects.map((p) => {
      const info = project[p];
      return info ? `<li><a href="${esc(projectHref(p))}" data-cat="${esc(info.cat)}"><i class="cat-dot" aria-hidden="true"></i><span>${esc(info.title)}</span><small>${esc(info.cat)}</small></a></li>` : '';
    }).join('');
    openPanel(`
      ${top(famLabel[s.fam] || '', `data-fam="${esc(s.fam)}"`)}
      <h2 class="skd__name" tabindex="-1">${s.logo ? `<i class="skd__logo" aria-hidden="true" style="--logo:url('${esc(s.logo)}')"></i>` : ''}${esc(s.name)}</h2>
      <p class="skd__count">Utilisée dans ${plural(s.projects.length, 'projet', 'projets')}</p>
      <ul class="skd__list">${list}</ul>
      <div class="skd__actions"><a class="btn btn--sm" href="${esc(projectsPage)}#tech/${esc(s.slug)}">Voir ${s.projects.length > 1 ? 'ces projets' : 'ce projet'}${icon('arrow')}</a></div>`, s.fam, opts);
    if (opts.reveal) reveal(s.li);
    setHash(s.slug);
  }

  // Depuis une fiche projet : ses technologies mises en évidence ici.
  function lensProject(pslug) {
    const info = project[pslug];
    if (!info) return;
    const own = info.skills.filter((k) => bySlug[k]);
    if (!own.length) return;
    returnTo = null;
    mark(own, 'is-lit');
    openPanel(`
      ${top(`Projet · ${info.cat}`, `data-cat="${esc(info.cat)}"`)}
      <h2 class="skd__name" tabindex="-1">${esc(info.title)}</h2>
      <p class="skd__count">${plural(own.length, 'technologie', 'technologies')} de ce projet, mises en évidence dans la page</p>
      <div class="skd__sec"><div class="skd__rel">${own.map((k) => `<button type="button" data-skill="${k}" data-fam="${bySlug[k].fam}">${esc(bySlug[k].name)}</button>`).join('')}</div></div>
      <div class="skd__actions"><a class="btn btn--sm" href="${esc(projectHref(pslug))}">Voir la fiche du projet${icon('arrow')}</a></div>`, '', { focus: false });
    reveal(bySlug[own[0]].li);
  }

  function reset(opts = {}) {
    if (aside.hidden) return;
    mark([], 'is-sel');
    aside.hidden = true;
    panel.innerHTML = '';
    setHash('');
    if (opts.focus && returnTo && returnTo.isConnected) returnTo.focus({ preventScroll: true });
  }

  panel.addEventListener('click', (e) => {
    const t = e.target.closest('button');
    if (!t) return;
    if (t.hasAttribute('data-close')) reset({ focus: true });
    else if (t.dataset.skill) select(t.dataset.skill, { reveal: true });
  });
  doc.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !aside.hidden) reset({ focus: true });
  });
  // Clic ailleurs (hors panneau et hors technologie) : on referme.
  doc.addEventListener('pointerdown', (e) => {
    if (aside.hidden || e.target.closest('.eco-panel, .sk__btn, .topbar, .ck, .ck-dlg')) return;
    reset();
  });

  function setHash(h) {
    const want = h ? `#${h}` : '';
    if (location.hash !== want) history.replaceState(null, '', location.pathname + location.search + want);
  }

  // ── Technologies ──────────────────────────────────────
  skills.forEach((s) => {
    s.btn.setAttribute('aria-label', `${s.name}, ${famLabel[s.fam] || ''} : utilisée dans ${plural(s.projects.length, 'projet', 'projets')}. Afficher ${s.projects.length > 1 ? 'les projets' : 'le projet'}`);
    s.btn.setAttribute('aria-expanded', 'false');
    s.btn.setAttribute('aria-controls', 'eco-panel');
    s.btn.addEventListener('click', () => {
      if (s.li.classList.contains('is-sel')) reset({ focus: true });
      else select(s.slug);
    });
  });
  aside.id = 'eco-panel';

  // ── Démarrage ─────────────────────────────────────────
  function fromHash() {
    const h = decodeURIComponent(location.hash.slice(1));
    const m = h.match(/^projet\/(.+)$/);
    if (m) lensProject(m[1]);
    else if (bySlug[h]) select(h, { focus: false, reveal: true });
  }
  window.addEventListener('hashchange', fromHash);
  if (location.hash) requestAnimationFrame(fromHash);
}
