/* ══════════════════════════════════════════════════════
   SKILLS.JS — Écosystème technique (mode classique)

   Chaque compétence du HTML généré porte ses projets (data-projects) :
     • survol / focus → nom, famille, nombre de projets ;
     • clic → panneau : projets concernés (ouvrent leur fiche),
       technologies souvent associées, « voir dans l'espace projets » ;
     • depuis une fiche projet → ses technologies mises en évidence ici.
   Projet ↔ technologie : le profil s'explore dans les deux sens.
   ══════════════════════════════════════════════════════ */
const doc = document;
const REDUCE = matchMedia('(prefers-reduced-motion: reduce)');
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const icon = (id, cls = 'ico') => `<svg class="${cls}" aria-hidden="true" focusable="false"><use href="#i-${id}"/></svg>`;
const plural = (n, one, many) => `${n} ${n > 1 ? many : one}`;

export function initSkills(app) {
  const sec = doc.getElementById('competences');
  const mapEl = sec && sec.querySelector('.sk-map');
  const panel = sec && sec.querySelector('.sk-panel');
  if (!mapEl || !panel) return;
  const detail = panel.querySelector('.sk-panel__detail');

  const skills = [...mapEl.querySelectorAll('.sk')].map((li) => ({
    li, btn: li.querySelector('.sk__btn'),
    slug: li.dataset.skill, fam: li.dataset.fam,
    famLabel: li.closest('.fam').querySelector('.fam__t').firstChild.nextSibling.textContent,
    name: li.querySelector('.sk__name').textContent,
    projects: (li.dataset.projects || '').split(' ').filter(Boolean),
  }));
  const bySlug = Object.fromEntries(skills.map((s) => [s.slug, s]));
  const project = (slug) => (app.projectInfo && app.projectInfo(slug)) || projectFromDom(slug);
  function projectFromDom(slug) {
    const li = doc.querySelector(`.pj-item[data-slug="${slug}"]`);
    return li ? { slug, title: li.querySelector('.pj-item__title').textContent, cat: li.dataset.cat, skills: (li.dataset.skills || '').split(' ').filter(Boolean) } : null;
  }
  const countText = (n) => n ? `Utilisée dans ${plural(n, 'projet', 'projets')}` : 'Hors des projets présentés ici';

  // ── Info-bulle ────────────────────────────────────────
  const tip = doc.createElement('div');
  tip.className = 'sk-tip';
  tip.setAttribute('aria-hidden', 'true');
  doc.body.appendChild(tip);
  function showTip(s) {
    tip.dataset.fam = s.fam;
    tip.innerHTML = `<b>${esc(s.name)}</b><span>${esc(s.famLabel)}</span><em>${countText(s.projects.length)}</em>`;
    const r = s.btn.getBoundingClientRect();
    tip.classList.add('is-on');
    const tw = tip.offsetWidth, th = tip.offsetHeight;
    const x = Math.min(innerWidth - tw - 12, Math.max(12, r.left + r.width / 2 - tw / 2));
    const y = r.top - th - 10 < 70 ? r.bottom + 10 : r.top - th - 10;
    tip.style.transform = `translate3d(${Math.round(x)}px,${Math.round(y)}px,0)`;
  }
  const hideTip = () => tip.classList.remove('is-on');
  window.addEventListener('scroll', hideTip, { passive: true });

  // L'intitulé accessible porte l'information de l'info-bulle.
  skills.forEach((s) => {
    s.btn.setAttribute('aria-label', `${s.name}, ${s.famLabel} : ${countText(s.projects.length).toLowerCase()}. Afficher le détail`);
    s.btn.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') showTip(s); });
    s.btn.addEventListener('pointerleave', hideTip);
    s.btn.addEventListener('focus', () => { if (s.btn.matches(':focus-visible')) showTip(s); });
    s.btn.addEventListener('blur', hideTip);
    s.btn.addEventListener('click', () => { hideTip(); select(s.slug); });
  });

  // ── Sélection ─────────────────────────────────────────
  let selected = null, returnTo = null;
  function clearMarks() {
    mapEl.classList.remove('has-sel');
    skills.forEach((s) => s.li.classList.remove('is-sel', 'is-rel'));
  }

  function select(slug, opts = {}) {
    const s = bySlug[slug];
    if (!s) return;
    selected = s;
    returnTo = s.btn;
    clearMarks();
    mapEl.classList.add('has-sel');
    s.li.classList.add('is-sel');
    // Technologies qui partagent au moins un projet avec celle-ci.
    const co = new Map();
    s.projects.forEach((p) => {
      const info = project(p);
      (info ? info.skills : []).forEach((k) => { if (k !== slug) co.set(k, (co.get(k) || 0) + 1); });
    });
    co.forEach((n, k) => bySlug[k] && bySlug[k].li.classList.add('is-rel'));
    const related = [...co.entries()].filter(([k]) => bySlug[k]).sort((a, b) => b[1] - a[1]).slice(0, 8);

    const list = s.projects.map((p) => {
      const info = project(p);
      return info ? `<li><button type="button" data-open="${p}" data-cat="${esc(info.cat)}"><i class="cat-dot" aria-hidden="true"></i><span>${esc(info.title)}</span><small>${esc(info.cat)}</small></button></li>` : '';
    }).join('');
    detail.dataset.fam = s.fam;
    detail.innerHTML = `
      <button type="button" class="skd__back">${icon('back')}Vue d'ensemble</button>
      <p class="skd__fam" data-fam="${s.fam}">${esc(s.famLabel)}</p>
      <h3 class="skd__name" tabindex="-1">${esc(s.name)}</h3>
      <p class="skd__count">${countText(s.projects.length)}</p>
      ${list ? `<ul class="skd__list">${list}</ul>` : `<p class="skd__empty">Compétence de mon profil, absente des ${doc.querySelectorAll('.pj-item').length} projets présentés ici.</p>`}
      ${related.length ? `<div class="skd__sec"><p class="mini-title">Souvent associée à</p><div class="skd__rel">${related.map(([k, n]) =>
        `<button type="button" data-skill="${k}" data-fam="${bySlug[k].fam}" title="${plural(n, 'projet', 'projets')} en commun">${esc(bySlug[k].name)}</button>`).join('')}</div></div>` : ''}
      ${s.projects.length ? `<div class="skd__actions"><button type="button" class="btn btn--sm" data-lens>Voir dans l'espace projets${icon('arrow')}</button></div>` : ''}`;
    showDetail(opts.focus !== false);
  }

  // Depuis une fiche : les technologies d'un projet.
  function lensProject(pslug) {
    const info = project(pslug);
    if (!info) return;
    selected = null;
    returnTo = null;
    clearMarks();
    const own = info.skills.filter((k) => bySlug[k]);
    mapEl.classList.add('has-sel');
    own.forEach((k) => bySlug[k].li.classList.add('is-sel'));
    detail.dataset.fam = '';
    detail.innerHTML = `
      <button type="button" class="skd__back">${icon('back')}Vue d'ensemble</button>
      <p class="skd__fam" data-cat="${esc(info.cat)}">Projet · ${esc(info.cat)}</p>
      <h3 class="skd__name" tabindex="-1">${esc(info.title)}</h3>
      <p class="skd__count">${plural(own.length, 'compétence mise en évidence', 'compétences mises en évidence')} dans l'écosystème</p>
      <div class="skd__sec"><div class="skd__rel">${own.map((k) =>
        `<button type="button" data-skill="${k}" data-fam="${bySlug[k].fam}">${esc(bySlug[k].name)}</button>`).join('')}</div></div>
      <div class="skd__actions"><button type="button" class="btn btn--sm" data-open="${pslug}">Revenir à la fiche${icon('arrow')}</button></div>`;
    scrollToSection();
    showDetail(true);
  }

  function showDetail(focus) {
    panel.classList.add('is-detail');
    if (focus) detail.querySelector('.skd__name').focus({ preventScroll: true });
  }

  function reset(opts = {}) {
    selected = null;
    clearMarks();
    panel.classList.remove('is-detail');
    detail.innerHTML = '';
    if (opts.focus && returnTo) returnTo.focus({ preventScroll: true });
  }

  detail.addEventListener('click', (e) => {
    const t = e.target.closest('button');
    if (!t) return;
    if (t.classList.contains('skd__back')) reset({ focus: true });
    else if (t.dataset.skill) select(t.dataset.skill);
    else if (t.dataset.open && app.openProject) app.openProject(t.dataset.open, { from: t });
    else if (t.hasAttribute('data-lens') && selected && app.lensSkill) {
      app.lensSkill(selected.slug, selected.name, selected.fam, selected.projects);
      if (matchMedia('(max-width: 960px)').matches) reset();
    }
  });
  doc.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && panel.classList.contains('is-detail') && !doc.querySelector('dialog[open]')) reset({ focus: true });
  });

  function scrollToSection() {
    const r = sec.getBoundingClientRect();
    if (r.top > innerHeight * 0.3 || r.bottom < innerHeight * 0.5) {
      sec.scrollIntoView({ behavior: REDUCE.matches ? 'instant' : 'smooth', block: 'start' });
    }
  }

  // Aller à une compétence (lien, chip d'une fiche, #competences/<slug>).
  function focusSkill(slug) {
    const s = bySlug[slug];
    if (!s) return;
    s.li.scrollIntoView({ behavior: REDUCE.matches ? 'instant' : 'smooth', block: 'center' });
    select(slug, { focus: false });
    s.li.classList.remove('is-flash'); void s.li.offsetWidth; s.li.classList.add('is-flash');
    s.btn.focus({ preventScroll: true });
  }

  // Liens internes vers une compétence (chapitre « Expertise », barres…).
  doc.addEventListener('click', (e) => {
    const a = e.target.closest('a[data-skill-link]');
    if (!a || a.closest('dialog')) return;
    e.preventDefault();
    focusSkill(a.dataset.skillLink);
  });
  function fromHash() {
    const m = location.hash.match(/^#competences\/(.+)$/);
    if (m) focusSkill(decodeURIComponent(m[1]));
  }
  window.addEventListener('hashchange', fromHash);

  app.focusSkill = focusSkill;
  app.lensProject = lensProject;
  fromHash();
}
