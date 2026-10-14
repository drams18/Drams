/* ══════════════════════════════════════════════════════
   PROJECTS.JS : Page Projets : grille de cartes + fiche

   Lit les cartes générées (.pj-card, scripts/build-classic.mjs) :
     • filtres par technologie (plusieurs à la fois), cartes classées du
       plus technique au moins technique (ordre du HTML) ;
     • une carte ouvre la fiche du projet (<dialog>) : la fiche s'ouvre
       depuis la carte, ses captures y défilent (galerie), ← → passent
       au projet voisin parmi ceux affichés ;
     • les cartes déjà ouvertes portent la mention « Vu » (le temps de
       la visite).

   Liens : #<projet> ouvre la fiche · #tech/<compétence>[,<compétence>…]
   n'affiche que les projets qui utilisent ces technologies (lien depuis
   Compétences).
   ══════════════════════════════════════════════════════ */
const doc = document;
const REDUCE = matchMedia('(prefers-reduced-motion: reduce)');
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const icon = (id, cls = 'ico') => `<svg class="${cls}" aria-hidden="true" focusable="false"><use href="#i-${id}"/></svg>`;
const plural = (n, one, many) => `${n} ${n > 1 ? many : one}`;
const mod = (a, n) => ((a % n) + n) % n;

export function initProjects() {
  const sec = doc.querySelector('.pj');
  const cards = sec ? [...sec.querySelectorAll('.pj-card')] : [];
  if (!cards.length) return;
  const grid = sec.querySelector('.pj-grid');
  const live = sec.querySelector('.pj-status');

  // ── Données (depuis le HTML généré) ───────────────────
  const data = cards.map((li, i) => ({
    i, li, slug: li.dataset.slug, cat: li.dataset.cat, name: li.dataset.name,
    type: li.dataset.type || '', ctx: li.dataset.ctx || '',
    shots: li.dataset.shots ? JSON.parse(li.dataset.shots) : [], device: li.dataset.device || 'desktop',
    title: li.querySelector('.pj-card__title').textContent,
    statusLabel: li.querySelector('.status').textContent.trim(),
    skills: (li.dataset.skills || '').split(' ').filter(Boolean),
  }));
  const bySlug = Object.fromEntries(data.map((d) => [d.slug, d]));

  // ── Projets consultés (le temps de la visite) ─────────
  const SEEN_KEY = 'drame.classic.seen';
  let seen = new Set();
  try { seen = new Set(JSON.parse(sessionStorage.getItem(SEEN_KEY) || '[]').filter((s) => bySlug[s])); } catch (e) { /* noop */ }
  data.forEach((d) => d.li.querySelector('.pj-card__foot').insertAdjacentHTML('beforeend', '<span class="pj-card__seen">Vu</span>'));
  const showSeen = () => data.forEach((d) => d.li.classList.toggle('is-seen', seen.has(d.slug)));
  function markSeen(slug) {
    if (seen.has(slug)) return;
    seen.add(slug);
    try { sessionStorage.setItem(SEEN_KEY, JSON.stringify([...seen])); } catch (e) { /* noop */ }
    showSeen();
  }
  showSeen();

  // ── Cartes : le titre devient le bouton qui couvre la carte ──
  data.forEach((d) => {
    const h = d.li.querySelector('.pj-card__title');
    const btn = doc.createElement('button');
    btn.type = 'button';
    btn.className = 'pj-card__open';
    btn.setAttribute('aria-haspopup', 'dialog');
    btn.setAttribute('aria-label', `${d.title}, ${d.cat}, ${d.type}. ${d.statusLabel}. Ouvrir la fiche`);
    btn.textContent = h.textContent;
    h.textContent = '';
    h.appendChild(btn);
    d.btn = btn;
    btn.addEventListener('click', () => openProject(d.slug, { from: d.li }));
  });

  // ── Filtres par technologie ───────────────────────────
  // Plusieurs technologies à la fois : restent les projets qui les utilisent
  // toutes. Chaque pastille annonce combien de projets resteraient si on
  // l'ajoutait ; celles qui n'en laisseraient aucun s'estompent.
  const bar = sec.querySelector('.pj-tf');
  const chips = bar ? [...bar.querySelectorAll('.tf')] : [];
  const chipOf = Object.fromEntries(chips.map((b) => [b.dataset.tech, b]));
  const reset = bar && bar.querySelector('.pj-tf__reset');
  const state = bar && bar.querySelector('.pj-tf__state');
  const picked = new Set();
  const visible = () => data.filter((d) => !d.li.hidden);
  const uses = (d, keys) => [...keys].every((k) => d.skills.includes(k));
  const nameOf = (k) => chipOf[k].querySelector('.tf__l').textContent;

  function apply({ animate = true } = {}) {
    // FLIP : la place de chaque carte avant le filtre…
    const before = new Map(visible().map((d) => [d, d.li.getBoundingClientRect()]));
    data.forEach((d) => { d.li.hidden = !uses(d, picked); });
    const shown = visible();
    chips.forEach((b) => {
      const k = b.dataset.tech, on = picked.has(k);
      const n = on ? shown.length : shown.filter((d) => d.skills.includes(k)).length;
      b.setAttribute('aria-pressed', String(on));
      b.querySelector('.tf__n').textContent = n;
      b.disabled = !on && !n;
      b.setAttribute('aria-label', on ? `${nameOf(k)}, filtre actif : retirer` : `${nameOf(k)}, ${plural(n, 'projet', 'projets')}`);
    });
    if (bar) {
      bar.classList.toggle('is-on', picked.size > 0);
      reset.hidden = !picked.size;
      state.textContent = picked.size ? `${shown.length} sur ${data.length}` : '';
      // Téléphone (une ligne qui défile) : les filtres actifs passent en
      // tête, on y revient.
      const list = bar.querySelector('.pj-tf__list');
      if (list.scrollWidth > list.clientWidth) list.scrollTo({ left: 0, behavior: animate && !REDUCE.matches ? 'smooth' : 'auto' });
    }
    if (live) {
      live.textContent = picked.size
        ? `${plural(shown.length, 'projet affiché', 'projets affichés')} avec ${[...picked].map(nameOf).join(' et ')}`
        : plural(shown.length, 'projet affiché', 'projets affichés');
    }
    if (!animate || REDUCE.matches) return;
    // … puis chaque carte glisse de son ancienne place à la nouvelle ;
    // celles qui apparaissent arrivent en douceur, en léger décalé.
    let k = 0;
    shown.forEach((d) => {
      const was = before.get(d);
      if (was) {
        const now = d.li.getBoundingClientRect();
        const dx = was.left - now.left, dy = was.top - now.top;
        if (dx || dy) d.li.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], { duration: 620, easing: 'cubic-bezier(.16,1,.3,1)' });
      } else {
        d.li.animate([{ opacity: 0, transform: 'translateY(18px) scale(.97)' }, { opacity: 1, transform: 'none' }],
          { duration: 480, delay: 90 + Math.min(k++, 8) * 40, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'backwards' });
      }
    });
  }

  const clearHash = () => { if (/^#tech\//.test(location.hash)) history.replaceState(null, '', location.pathname + location.search); };
  function toggle(k) {
    if (picked.has(k)) picked.delete(k); else picked.add(k);
    clearHash();
    apply();
  }
  chips.forEach((b) => b.addEventListener('click', () => toggle(b.dataset.tech)));
  if (reset) reset.addEventListener('click', () => { picked.clear(); clearHash(); apply(); chips[0].focus(); });

  // #tech/<slug>[,<slug>…] (lien depuis Compétences) : pré-sélection.
  function techFromHash() {
    const m = location.hash.match(/^#tech\/(.+)$/);
    const keys = m ? decodeURIComponent(m[1]).split(',').filter((k) => chipOf[k]) : [];
    if (!keys.length) return false;
    picked.clear();
    (data.some((d) => uses(d, keys)) ? keys : keys.slice(0, 1)).forEach((k) => picked.add(k));
    apply();
    return true;
  }

  // ── Fiche du projet ───────────────────────────────────
  const dlg = doc.createElement('dialog');
  dlg.className = 'pjd';
  dlg.setAttribute('aria-labelledby', 'pjd-title');
  dlg.innerHTML = `
    <div class="pjd__panel">
      <div class="pjd__media">
        <div class="pjd__orb"><span></span></div>
        <div class="pjd__gal" hidden>
          <div class="pjd__track" tabindex="0" role="group" aria-roledescription="galerie" aria-label="Captures du projet"></div>
          <div class="pjd__galbar">
            <button type="button" class="pjd__gbtn" data-shot="-1" aria-label="Capture précédente">${icon('back')}</button>
            <span class="pjd__dots" aria-hidden="true"></span>
            <button type="button" class="pjd__gbtn" data-shot="1" aria-label="Capture suivante">${icon('arrow')}</button>
          </div>
        </div>
      </div>
      <div class="pjd__body">
        <div class="pjd__content">
          <p class="pjd__kicker"></p>
          <h2 class="pjd__title" id="pjd-title" tabindex="-1"></h2>
          <div class="pjd__status"></div>
          <p class="pjd__desc"></p>
          <div class="pjd__block">
            <p class="mini-title">Technologies</p>
            <div class="pjd__tags"></div>
            <a class="text-link pjd__sk" href="#">Voir ces technologies dans mes compétences${icon('arrow')}</a>
          </div>
          <div class="pjd__block pjd__role"><p class="mini-title">Mon rôle</p><p></p></div>
        </div>
        <nav class="pjd__nav" aria-label="Autres projets">
          <button type="button" class="pjd__step" data-step="-1">${icon('back')}<span></span></button>
          <span class="pjd__count"></span>
          <button type="button" class="pjd__step" data-step="1"><span></span>${icon('arrow')}</button>
        </nav>
      </div>
      <button type="button" class="pjd__close" aria-label="Fermer la fiche">${icon('close')}</button>
    </div>`;
  doc.body.appendChild(dlg);
  const $ = (s) => dlg.querySelector(s);
  const panel = $('.pjd__panel');
  let current = null, returnTo = null, closing = false, pushed = false;
  const firstTag = sec.querySelector('.tag-link');
  const competences = firstTag ? firstTag.getAttribute('href').split('#')[0] : '/classique/competences';

  // Projets parcourus par ← → : ceux affichés (le projet ouvert en fait
  // partie même s'il est filtré, ouvert par un lien).
  const ring = () => {
    const list = visible();
    return current && !list.includes(current) ? data : list;
  };

  function fill(d) {
    current = d;
    dlg.dataset.cat = d.cat;
    $('.pjd__orb span').textContent = d.name;
    fillGallery(d);
    $('.pjd__kicker').innerHTML = `<span class="chip-cat" data-cat="${esc(d.cat)}">${esc(d.cat)}</span><span>${esc(d.type)}</span>${d.ctx ? `<span>${esc(d.ctx)}</span>` : ''}`;
    $('.pjd__title').textContent = d.title;
    const links = d.li.querySelector('.pj-card__links');
    $('.pjd__status').innerHTML = d.li.querySelector('.status').outerHTML + (links ? links.innerHTML : '');
    $('.pjd__desc').textContent = d.li.querySelector('.pj-card__desc').textContent;
    $('.pjd__tags').innerHTML = d.li.querySelector('.pj-card__more .tags').outerHTML;
    const sk = $('.pjd__sk');
    sk.hidden = !d.skills.length;
    sk.href = `${competences}#projet/${d.slug}`;
    const role = d.li.querySelector('.pj-card__role p');
    $('.pjd__role').hidden = !role;
    $('.pjd__role p:last-child').textContent = role ? role.textContent : '';
    const list = ring(), at = list.indexOf(d);
    const prev = list[mod(at - 1, list.length)], next = list[mod(at + 1, list.length)];
    $('.pjd__nav').hidden = list.length < 2;
    $('[data-step="-1"] span').textContent = prev.title;
    $('[data-step="-1"]').setAttribute('aria-label', `Projet précédent : ${prev.title}`);
    $('[data-step="1"] span').textContent = next.title;
    $('[data-step="1"]').setAttribute('aria-label', `Projet suivant : ${next.title}`);
    $('.pjd__count').textContent = `${at + 1} / ${list.length}`;
    $('.pjd__body').scrollTop = 0;
    panel.scrollTop = 0;
  }

  // ── Galerie de captures (fiche) ───────────────────────
  // Une piste à défilement horizontal (glisser au doigt, molette, flèches) ;
  // sans capture, le nom du projet reste seul.
  const gal = $('.pjd__gal'), track = $('.pjd__track'), dots = $('.pjd__dots');
  let shotAt = 0;
  function fillGallery(d) {
    const has = d.shots.length > 0;
    gal.hidden = !has;
    $('.pjd__media').classList.toggle('has-shots', has);
    $('.pjd__media').dataset.device = d.device;
    track.innerHTML = d.shots.map((s, i) => `
      <figure class="pjd__slide" aria-label="${i + 1} sur ${d.shots.length}">
        <div class="pjd__frame pjd__frame--${d.device}"><img src="${esc(s.src)}" alt="${esc(s.alt)}" decoding="async"${i ? ' loading="lazy"' : ''}></div>
        ${s.alt ? `<figcaption>${esc(s.alt)}</figcaption>` : ''}
      </figure>`).join('');
    track.querySelectorAll('img').forEach((img) => {
      const done = () => img.closest('.pjd__frame').classList.add('is-loaded');
      if (img.complete) done(); else { img.onload = done; img.onerror = () => img.closest('.pjd__slide').remove(); }
    });
    dots.innerHTML = d.shots.length > 1 ? d.shots.map(() => '<i></i>').join('') : '';
    gal.classList.toggle('is-single', d.shots.length < 2);
    track.scrollLeft = 0;
    setShot(0);
  }
  function setShot(i) {
    shotAt = i;
    [...dots.children].forEach((n, k) => n.classList.toggle('is-on', k === i));
    const n = track.children.length;
    gal.querySelector('[data-shot="-1"]').disabled = i <= 0;
    gal.querySelector('[data-shot="1"]').disabled = i >= n - 1;
  }
  function goShot(i) {
    const n = track.children.length;
    if (!n) return;
    i = Math.max(0, Math.min(n - 1, i));
    track.scrollTo({ left: i * track.clientWidth, behavior: REDUCE.matches ? 'auto' : 'smooth' });
    setShot(i);
  }
  track.addEventListener('scroll', () => {
    const i = Math.round(track.scrollLeft / Math.max(1, track.clientWidth));
    if (i !== shotAt) setShot(i);
  }, { passive: true });
  gal.querySelectorAll('[data-shot]').forEach((b) => b.addEventListener('click', () => goShot(shotAt + +b.dataset.shot)));

  const contentParts = () => [...$('.pjd__content').children].filter((n) => !n.hidden);
  const anim = (el, frames, o) => (REDUCE.matches || !el ? null : el.animate(frames, { fill: 'both', easing: 'cubic-bezier(.16,1,.3,1)', ...o }));

  // Rectangle de la carte dans le repère du panneau (inset() du clip-path).
  function insetOf(card) {
    const pr = panel.getBoundingClientRect(), cr = card.getBoundingClientRect();
    const r = (v) => `${Math.round(v)}px`;
    return `inset(${r(cr.top - pr.top)} ${r(pr.right - cr.right)} ${r(pr.bottom - cr.bottom)} ${r(cr.left - pr.left)} round 20px)`;
  }
  const inView = (el) => { const r = el.getBoundingClientRect(); return r.bottom > 40 && r.top < innerHeight - 40 && r.width > 0; };

  function openProject(slug, opts = {}) {
    const d = bySlug[slug];
    if (!d) return;
    const wasOpen = dlg.open;
    if (wasOpen && current === d) return;
    fill(d);
    markSeen(d.slug);
    if (!wasOpen) {
      returnTo = opts.from ? d.btn : doc.activeElement;
      doc.documentElement.classList.add('has-dialog');
      dlg.showModal();
      requestAnimationFrame(() => dlg.classList.add('is-open'));
      animateIn(opts.from && inView(opts.from) ? opts.from : null);
    } else {
      const dir = opts.dir || 1;
      contentParts().forEach((n, i) => anim(n, [{ opacity: 0, transform: `translateX(${24 * dir}px)` }, { opacity: 1, transform: 'none' }], { duration: 420, delay: i * 35 }));
      anim($('.pjd__orb'), [{ opacity: 0, transform: 'scale(.85)' }, { opacity: 1, transform: 'none' }], { duration: 520 });
      anim(gal.hidden ? null : gal, [{ opacity: 0, transform: `translateX(${32 * dir}px)` }, { opacity: 1, transform: 'none' }], { duration: 520 });
    }
    $('.pjd__title').focus({ preventScroll: true });
    // Historique : « retour » ferme la fiche ; le lien reste partageable.
    const hash = `#${slug}`;
    if (!opts.fromHash && location.hash !== hash) {
      if (wasOpen || pushed) history.replaceState({ pj: slug }, '', hash);
      else { history.pushState({ pj: slug }, '', hash); pushed = true; }
    }
    route(`projets/${slug}`);
  }

  // Ouverture : la fiche grandit depuis la carte (sinon, simple fondu).
  function animateIn(card) {
    if (REDUCE.matches) return;
    if (card) {
      const a = panel.animate([{ clipPath: insetOf(card) }, { clipPath: 'inset(0 round 28px)' }],
        { duration: 520, easing: 'cubic-bezier(.65,0,.35,1)' });
      a.onfinish = () => a.cancel();
    } else {
      anim(panel, [{ opacity: 0, transform: 'translateY(18px) scale(.98)' }, { opacity: 1, transform: 'none' }], { duration: 420 });
    }
    anim($('.pjd__orb'), [{ opacity: 0, transform: 'scale(.6)' }, { opacity: 1, transform: 'none' }], { duration: 640, delay: 80 });
    anim(gal.hidden ? null : gal, [{ opacity: 0, transform: 'scale(.95)' }, { opacity: 1, transform: 'none' }], { duration: 640, delay: 120 });
    contentParts().forEach((n, i) => anim(n, [{ opacity: 0, transform: 'translateY(18px)' }, { opacity: 1, transform: 'none' }], { duration: 520, delay: 200 + i * 50 }));
    [$('.pjd__nav'), $('.pjd__close')].forEach((n) => anim(n, [{ opacity: 0 }, { opacity: 1 }], { duration: 360, delay: 420 }));
  }

  function closeProject(opts = {}) {
    if (!dlg.open || closing) return Promise.resolve();
    closing = true;
    const d = current;
    dlg.classList.remove('is-open');
    const done = () => {
      dlg.getAnimations({ subtree: true }).forEach((a) => a.cancel());
      dlg.close();
      closing = false;
      doc.documentElement.classList.remove('has-dialog');
      route(null);
      if (!opts.keepFocus) {
        const back = !d.li.hidden ? d.btn : returnTo;
        if (back && back.isConnected && back.getClientRects().length) back.focus({ preventScroll: true });
      }
    };
    if (!opts.fromPop) {
      if (pushed && history.state && history.state.pj) history.back();
      else if (bySlug[location.hash.slice(1)]) history.replaceState(null, '', location.pathname + location.search);
    }
    pushed = false;
    return new Promise((resolve) => {
      let ended = false;
      const finish = () => { if (ended) return; ended = true; done(); resolve(); };
      if (REDUCE.matches) { finish(); return; }
      // Filet : page masquée (onglet changé), les animations s'arrêtent.
      setTimeout(finish, 700);
      // La fiche se referme dans sa carte, si elle est à l'écran.
      if (!d.li.hidden && inView(d.li)) {
        panel.animate([{ clipPath: 'inset(0 round 28px)' }, { clipPath: insetOf(d.li) }],
          { duration: 420, easing: 'cubic-bezier(.65,0,.35,1)', fill: 'forwards' }).onfinish = finish;
      } else {
        panel.animate([{ opacity: 1 }, { opacity: 0, transform: 'translateY(18px) scale(.98)' }], { duration: 260, easing: 'ease-in', fill: 'forwards' }).onfinish = finish;
      }
    });
  }

  function step(dir) {
    if (!current) return;
    const list = ring();
    openProject(list[mod(list.indexOf(current) + dir, list.length)].slug, { dir });
  }

  $('.pjd__close').addEventListener('click', () => closeProject());
  dlg.addEventListener('cancel', (e) => { e.preventDefault(); closeProject(); });
  dlg.addEventListener('click', (e) => { if (e.target === dlg) closeProject(); });
  dlg.querySelectorAll('[data-step]').forEach((b) => b.addEventListener('click', () => step(+b.dataset.step)));
  dlg.addEventListener('keydown', (e) => {
    if (e.target.closest('input, textarea')) return;
    // Dans la galerie, les flèches changent de capture, pas de projet.
    if (e.target.closest('.pjd__gal') && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) {
      e.preventDefault();
      goShot(shotAt + (e.key === 'ArrowRight' ? 1 : -1));
      return;
    }
    if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
  });

  window.addEventListener('popstate', () => {
    const slug = decodeURIComponent(location.hash.slice(1));
    if (bySlug[slug]) { if (!dlg.open) pushed = !!(history.state && history.state.pj); openProject(slug, { fromHash: true }); }
    else if (dlg.open) closeProject({ fromPop: true });
  });
  window.addEventListener('hashchange', () => { if (!dlg.open) techFromHash(); });

  // Route suivie par le bouton « Mode aventure » (js/classic.js).
  function route(r) { doc.dispatchEvent(new CustomEvent('classic:route', { detail: r })); }

  // ── Démarrage ─────────────────────────────────────────
  apply({ animate: false });
  const slug = decodeURIComponent(location.hash.slice(1));
  if (bySlug[slug]) requestAnimationFrame(() => openProject(slug, { fromHash: true }));
  else if (techFromHash()) grid.scrollIntoView({ block: 'start' });
}
