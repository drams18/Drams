/* ══════════════════════════════════════════════════════
   PROJECTS.JS : Page Projets : l'espace des projets

   Lit l'index sémantique généré (.pj-item, scripts/build-classic.mjs)
   et en tire un espace sans bord qui couvre tout l'écran :
     • couche avant : chaque projet une fois par tuile (taille = rang) ;
     • couche arrière : les mêmes projets, plus petits et plus lointains
       (parallaxe), sur une tuile de période différente : l'espace se
       remplit sans motif répétitif visible ;
     • la fiche d'un projet (<dialog>) : on plonge dans la bulle, qui
       s'ouvre jusqu'à devenir la fiche ; ses captures y défilent
       (galerie), la première sert de fond à la bulle.

   Accessibilité : les bulles sont un décor (aria-hidden). La liste des
   projets reste dans la page ; en vue « espace » elle est masquée à
   l'écran mais atteignable au clavier : le focus sur un projet amène sa
   bulle au centre et l'entoure. Entrée ouvre la fiche.

   Liens : #<projet> ouvre la fiche · #tech/<compétence> éclaire les
   projets qui utilisent cette technologie.
   ══════════════════════════════════════════════════════ */
import { createSpace, relax, rng, mod, wrapD, REDUCE } from './space.js';

const doc = document;
const RADIUS = { l: 80, m: 60, s: 47 };
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const icon = (id, cls = 'ico') => `<svg class="${cls}" aria-hidden="true" focusable="false"><use href="#i-${id}"/></svg>`;
const plural = (n, one, many) => `${n} ${n > 1 ? many : one}`;

export function initProjects(app) {
  const sec = doc.querySelector('.pj');
  const holder = sec && sec.querySelector('.pj-space');
  const items = sec ? [...sec.querySelectorAll('.pj-item')] : [];
  if (!holder || !items.length) return;

  // ── Données (depuis le HTML généré) ───────────────────
  const data = items.map((li, i) => {
    const meta = [...li.querySelector('.pj-item__meta').children].map((n) => n.textContent);
    return {
      i, li, slug: li.dataset.slug, cat: li.dataset.cat, tier: li.dataset.tier,
      status: li.dataset.status, name: li.dataset.name, img: li.dataset.img || null,
      shots: li.dataset.shots ? JSON.parse(li.dataset.shots) : [], device: li.dataset.device || 'desktop',
      title: li.querySelector('.pj-item__title').textContent,
      type: meta[1] || '', ctx: meta[2] || '',
      statusLabel: li.querySelector('.status').textContent.trim(),
      skills: (li.dataset.skills || '').split(' ').filter(Boolean),
    };
  });
  const bySlug = Object.fromEntries(data.map((d) => [d.slug, d]));

  // ── Espace ────────────────────────────────────────────
  holder.insertAdjacentHTML('beforeend', `
    <div class="space-tip" aria-hidden="true"></div>
    <div class="space-ui">
      <button type="button" class="space-btn" data-home>${icon('center')}Recentrer</button>
      <p class="space-hint">Glissez pour explorer · l’espace n’a pas de bord</p>
    </div>`);
  const tip = holder.querySelector('.space-tip');
  const hint = holder.querySelector('.space-hint');
  const ui = holder.querySelector('.space-ui');

  const space = createSpace(holder, {
    make(it, L) {
      const d = it.d;
      const el = doc.createElement('div');
      el.className = `bub bub--${L.name}${d.img ? ' bub--img' : ''}`;
      el.dataset.i = d.i;
      el.dataset.cat = d.cat;
      el.dataset.tier = d.tier;
      el.dataset.status = d.status;
      el.style.setProperty('--r', `${it.r.toFixed(1)}px`);
      // Capture du projet en fond de bulle (sinon : le fond de catégorie).
      const img = d.img ? `<span class="bub__img" style="background-image:url('${esc(d.img)}')"></span>` : '';
      el.innerHTML = `<span class="bub__core">${img}<span class="bub__name" lang="fr">${esc(d.name)}</span><span class="bub__st"></span></span>`;
      return el;
    },
    onPick(it, el) { hideTip(); openProject(it.d.slug, { from: el }); },
    onHover(it, el) { if (it) showTip(it.d, el); else hideTip(); },
    onDragStart() { hideTip(); hint.classList.add('is-gone'); },
    onMove() { if (tipEl) positionTip(tipEl); },
    onResize: layout,
  });

  // ── Disposition ───────────────────────────────────────
  // Densité réglée sur la surface : l'écran est couvert, sans chevauchement.
  let front = null;
  function layout() {
    if (!space.measure()) return;
    const { w: SW, h: SH } = space.size;
    const k = SW < 700 ? 0.72 : SW < 1100 ? 0.86 : 1;
    const aspect = Math.min(1.9, Math.max(0.75, SW / SH));
    const tile = (list, cover) => {
      const area = list.reduce((s, it) => s + Math.PI * (it.r + 14) ** 2, 0) / cover;
      const W = Math.sqrt(area * aspect);
      return { W, H: area / W };
    };

    // Avant : un exemplaire par projet, semés au hasard (catégories
    // mêlées) : points de départ en « tournesol », puis écartés.
    const fItems = data.map((d) => ({ d, r: RADIUS[d.tier] * k }));
    const F = tile(fItems, 0.34);
    const r1 = rng(20260930);
    const order = fItems.map((it) => ({ it, key: r1() })).sort((a, b) => a.key - b.key).map((o) => o.it);
    order.forEach((it, n) => {
      it.x = mod((n * 0.618034 + r1() * 0.08) * F.W, F.W);
      it.y = mod(((n + 0.5) / order.length + (r1() - 0.5) * 0.06) * F.H, F.H);
    });
    relax(fItems, F.W, F.H, { gap: 34 * k, pull: 0 });

    // Arrière : plus petits, plus loin, tuile d'une autre période.
    const bItems = data.map((d) => ({ d, r: RADIUS[d.tier] * k * 0.52 }));
    const B = { W: F.W * 0.71, H: F.H * 0.77 };
    const r2 = rng(7331);
    bItems.forEach((it) => { it.x = r2() * B.W; it.y = r2() * B.H; });
    relax(bItems, B.W, B.H, { gap: 40 * k, pull: 0 });

    front = { name: 'front', z: 1, W: F.W, H: F.H, items: fItems };
    space.setLayers([
      { name: 'back', z: 0.62, W: B.W, H: B.H, items: bItems },
      front,
    ], RADIUS.l * k + 24);
    frameHome();
    applyDim();
  }

  // Vue de départ : les projets mis en avant bien placés, au centre.
  let home = { x: 0, y: 0 };
  function frameHome() {
    const L = space.layers[1];
    const ref = L.items.find((it) => it.d.tier === 'l') || L.items[0];
    // Centre de gravité des projets autour de la référence (sur le tore).
    let sx = 0, sy = 0;
    L.items.forEach((it) => { sx += wrapD(it.x - ref.x, L.W); sy += wrapD(it.y - ref.y, L.H); });
    home = { x: mod(ref.x + sx / L.items.length, L.W), y: mod(ref.y + sy / L.items.length, L.H) + 30 };
    space.cam.x = home.x; space.cam.y = home.y;
    space.request();
  }
  function goHome() {
    const L = space.layers[1];
    space.glideBy(wrapD(home.x - space.cam.x, L.W), wrapD(home.y - space.cam.y, L.H), 800);
  }
  ui.querySelector('[data-home]').addEventListener('click', () => { clearLens(); goHome(); });

  // ── Info-bulle ────────────────────────────────────────
  let tipEl = null;
  function showTip(d, el) {
    tipEl = el;
    tip.dataset.cat = d.cat;
    tip.dataset.device = d.device;
    tip.innerHTML = `${d.img ? `<img class="space-tip__img" src="${esc(d.img)}" alt="" loading="lazy" decoding="async">` : ''}
      <p class="space-tip__t">${esc(d.title)}</p>
      <p class="space-tip__m"><i class="cat-dot" aria-hidden="true"></i>${esc(d.cat)}${d.ctx ? ` · ${esc(d.ctx)}` : ''}</p>
      ${d.li.querySelector('.status').outerHTML}
      <p class="space-tip__hint">${esc(d.type)} · cliquer pour ouvrir la fiche</p>`;
    tip.classList.add('is-on');
    positionTip(el);
  }
  function positionTip(el) {
    const { w: SW, h: SH } = space.size;
    const r = parseFloat(el.style.getPropertyValue('--r')) || 50;
    const tw = tip.offsetWidth || 244, th = tip.offsetHeight || 120;
    let x = el._x + r + 18;
    if (x + tw > SW - 12) x = el._x - r - 18 - tw;
    const y = Math.min(SH - th - 12, Math.max(12, el._y - th / 2));
    tip.style.transform = `translate3d(${Math.round(Math.max(12, x))}px,${Math.round(y)}px,0)`;
  }
  function hideTip() { tipEl = null; tip.classList.remove('is-on'); }

  // ── Clavier : la liste pilote l'espace ────────────────
  data.forEach((d) => {
    const h = d.li.querySelector('.pj-item__title');
    const btn = doc.createElement('button');
    btn.type = 'button';
    btn.className = 'pj-item__open';
    btn.setAttribute('aria-haspopup', 'dialog');
    btn.setAttribute('aria-label', `${d.title}, ${d.cat}${d.ctx ? `, ${d.ctx}` : ''}, ${d.type}. ${d.statusLabel}. Ouvrir la fiche`);
    btn.textContent = h.textContent;
    h.textContent = '';
    h.appendChild(btn);
    d.btn = btn;
    btn.addEventListener('click', () => openProject(d.slug, { from: btn }));
    btn.addEventListener('focus', () => { if (sec.dataset.view !== 'list') focusBubble(d); });
    btn.addEventListener('blur', () => unfocusBubble(d));
  });
  const frontItem = (d) => front && front.items[d.i];
  function focusBubble(d) {
    const it = frontItem(d);
    if (!it) return;
    space.setItemClass(it, 'is-focus', true);
    const el = space.nearest(it);
    const { w, h } = space.size;
    if (!space.inView(el, 140)) space.glideTo(it, front, w / 2, h / 2 + 30, 600);
    requestAnimationFrame(() => { const e = space.nearest(it); if (e) showTip(d, e); });
    hint.classList.add('is-gone');
  }
  function unfocusBubble(d) {
    const it = frontItem(d);
    if (it) space.setItemClass(it, 'is-focus', false);
    hideTip();
  }
  // Flèches (vue espace) : bulle voisine dans cette direction.
  const DIRS = { ArrowRight: [1, 0], ArrowLeft: [-1, 0], ArrowDown: [0, 1], ArrowUp: [0, -1] };
  sec.querySelector('.pj-index').addEventListener('keydown', (e) => {
    const from = data.find((d) => d.btn === doc.activeElement);
    if (!from) return;
    if (sec.dataset.view === 'list') {
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
      e.preventDefault();
      const next = data[from.i + (e.key === 'ArrowDown' ? 1 : -1)];
      if (next) next.btn.focus();
      return;
    }
    const dir = DIRS[e.key];
    if (!dir) return;
    e.preventDefault();
    const a = frontItem(from);
    let best = null, bestScore = Infinity;
    data.forEach((d) => {
      if (d === from || d.out) return;
      const b = frontItem(d);
      const dx = wrapD(b.x - a.x, front.W), dy = wrapD(b.y - a.y, front.H);
      const along = dx * dir[0] + dy * dir[1];
      const across = Math.abs(dx * dir[1] - dy * dir[0]);
      if (along <= 4) return;
      const score = along + across * 1.8;
      if (score < bestScore) { bestScore = score; best = d; }
    });
    if (best) best.btn.focus();
  });

  // ── « Lentille » technologie ──────────────────────────
  let lens = null;                 // { slug, label, fam, set }
  function applyDim() {
    data.forEach((d) => {
      const out = !!lens && !lens.set.has(d.slug);
      d.out = out;
      space.layers.forEach((L) => {
        const it = L.items[d.i];
        if (!it) return;
        space.setItemClass(it, 'is-dim', out);
        space.setItemClass(it, 'is-lit', !!lens && !out);
      });
      d.li.classList.toggle('is-dim', out);
    });
  }

  let lensChip = null;
  function setLens(slug, label, fam, set) {
    lens = { slug, set: new Set(set) };
    if (!lensChip) {
      lensChip = doc.createElement('p');
      lensChip.className = 'space-lens';
      ui.prepend(lensChip);
    }
    lensChip.dataset.fam = fam || 'other';
    lensChip.innerHTML = `<span><strong>${esc(label)}</strong> · ${plural(set.length, 'projet', 'projets')}</span><button type="button" aria-label="Retirer la mise en évidence ${esc(label)}">${icon('close')}</button>`;
    lensChip.querySelector('button').addEventListener('click', () => {
      clearLens();
      if (/^#tech\//.test(location.hash)) history.replaceState(null, '', location.pathname + location.search);
    });
    hint.hidden = true;
    applyDim();
    setTimeout(frameLens, 50);
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
    if (!lens || !front) return;
    const { w: SW, h: SH } = space.size;
    const lit = front.items.filter((it) => lens.set.has(it.d.slug));
    let best = null, bestN = -1;
    lit.forEach((c) => {
      const n = lit.filter((it) => Math.abs(wrapD(it.x - c.x, front.W)) < SW / 2 - it.r - 40
        && Math.abs(wrapD(it.y - c.y, front.H)) < SH / 2 - it.r - 90).length;
      if (n > bestN) { best = c; bestN = n; }
    });
    if (best) space.glideTo(best, front, SW / 2, SH / 2 + 40, 900);
  }

  // Lien depuis la page Compétences : #tech/<compétence>
  function lensFromHash() {
    const m = location.hash.match(/^#tech\/(.+)$/);
    if (!m) return false;
    const slug = decodeURIComponent(m[1]);
    const set = data.filter((d) => d.skills.includes(slug)).map((d) => d.slug);
    const tag = sec.querySelector(`.tag-link[data-skill="${CSS.escape(slug)}"]`);
    if (!set.length || !tag) return false;
    setLens(slug, tag.textContent, tag.dataset.fam, set);
    return true;
  }

  // ── Vue : espace / liste ──────────────────────────────
  const viewBtns = [...sec.querySelectorAll('[data-view]')];
  function setView(v) {
    sec.dataset.view = v;
    viewBtns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.view === v)));
    hideTip();
  }
  viewBtns.forEach((b) => b.addEventListener('click', () => setView(b.dataset.view)));

  // ── Fiche immersive ───────────────────────────────────
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
            <a class="text-link pjd__sk" href="#">Voir ces technologies dans l’écosystème${icon('arrow')}</a>
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
  const competences = sec.querySelector('.tag-link') ? sec.querySelector('.tag-link').getAttribute('href').split('#')[0] : 'competences.html';

  function fill(d) {
    current = d;
    dlg.dataset.cat = d.cat;
    $('.pjd__orb span').textContent = d.name;
    fillGallery(d);
    $('.pjd__kicker').innerHTML = `<span class="chip-cat" data-cat="${esc(d.cat)}">${esc(d.cat)}</span><span>${esc(d.type)}</span>${d.ctx ? `<span>${esc(d.ctx)}</span>` : ''}`;
    $('.pjd__title').textContent = d.title;
    const links = d.li.querySelector('.pj-item__links');
    $('.pjd__status').innerHTML = d.li.querySelector('.status').outerHTML + (links ? links.innerHTML : '');
    $('.pjd__desc').textContent = d.li.querySelector('.pj-item__desc').textContent;
    $('.pjd__tags').innerHTML = d.li.querySelector('.tags').outerHTML;
    const sk = $('.pjd__sk');
    sk.hidden = !d.skills.length;
    sk.href = `${competences}#projet/${d.slug}`;
    const role = d.li.querySelector('.pj-item__role p');
    $('.pjd__role').hidden = !role;
    $('.pjd__role p:last-child').textContent = role ? role.textContent : '';
    const prev = data[mod(d.i - 1, data.length)], next = data[mod(d.i + 1, data.length)];
    $('[data-step="-1"] span').textContent = prev.title;
    $('[data-step="-1"]').setAttribute('aria-label', `Projet précédent : ${prev.title}`);
    $('[data-step="1"] span').textContent = next.title;
    $('[data-step="1"]').setAttribute('aria-label', `Projet suivant : ${next.title}`);
    $('.pjd__count').textContent = `${d.i + 1} / ${data.length}`;
    $('.pjd__body').scrollTop = 0;
    panel.scrollTop = 0;
  }

  // ── Galerie de captures (fiche) ───────────────────────
  // Une piste à défilement horizontal (glisser au doigt, molette, flèches) ;
  // sans capture, la bulle du projet reste seule.
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

  function openProject(slug, opts = {}) {
    const d = bySlug[slug];
    if (!d) return;
    const wasOpen = dlg.open;
    if (wasOpen && current === d) return;
    fill(d);
    if (!wasOpen) {
      returnTo = opts.from || doc.activeElement;
      doc.documentElement.classList.add('has-dialog');
      const bubble = opts.from && opts.from.classList.contains('bub') ? opts.from : null;
      // On plonge vers la bulle : l'espace grossit autour d'elle.
      if (bubble && !REDUCE.matches) holder.style.transformOrigin = `${bubble._x}px ${bubble._y}px`;
      holder.classList.add('is-diving');
      dlg.showModal();
      requestAnimationFrame(() => dlg.classList.add('is-open'));
      animateIn(bubble);
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
    const a = panel.animate([{ clipPath: `circle(${r0}px at ${cx}px ${cy}px)` }, { clipPath: `circle(${R}px at ${cx}px ${cy}px)` }],
      { duration: 620, easing: 'cubic-bezier(.65,0,.35,1)' });
    a.onfinish = () => a.cancel();
    anim($('.pjd__orb'), [{ opacity: 0, transform: 'scale(.55)' }, { opacity: 1, transform: 'none' }], { duration: 700, delay: 80 });
    anim(gal.hidden ? null : gal, [{ opacity: 0, transform: 'scale(.94)' }, { opacity: 1, transform: 'none' }], { duration: 700, delay: 140 });
    contentParts().forEach((n, i) => anim(n, [{ opacity: 0, transform: 'translateY(22px)' }, { opacity: 1, transform: 'none' }], { duration: 560, delay: 240 + i * 60 }));
    [$('.pjd__nav'), $('.pjd__close')].forEach((n) => anim(n, [{ opacity: 0 }, { opacity: 1 }], { duration: 400, delay: 520 }));
  }

  function closeProject(opts = {}) {
    if (!dlg.open || closing) return Promise.resolve();
    closing = true;
    const d = current;
    dlg.classList.remove('is-open');
    holder.classList.remove('is-diving');
    const done = () => {
      dlg.getAnimations({ subtree: true }).forEach((a) => a.cancel());
      dlg.close();
      closing = false;
      doc.documentElement.classList.remove('has-dialog');
      route(null);
      if (!opts.keepFocus) {
        const back = returnTo && returnTo.isConnected && !returnTo.classList.contains('bub') ? returnTo : null;
        if (back && back.getClientRects().length) back.focus({ preventScroll: true });
        else if (d.btn) { d.btn.focus({ preventScroll: true }); }
      }
    };
    if (!opts.fromPop) {
      if (pushed && history.state && history.state.pj) history.back();
      else if (bySlug[location.hash.slice(1)]) history.replaceState(null, '', location.pathname + location.search);
    }
    pushed = false;
    return new Promise((resolve) => {
      const finish = () => { done(); resolve(); };
      if (REDUCE.matches) { finish(); return; }
      // La fiche se referme dans sa bulle, si elle est à l'écran.
      const it = frontItem(d);
      const b = it && sec.dataset.view !== 'list' ? space.nearest(it) : null;
      const pr = panel.getBoundingClientRect();
      if (b && space.inView(b, 40)) {
        const br = b.getBoundingClientRect();
        const cx = br.left + br.width / 2 - pr.left, cy = br.top + br.height / 2 - pr.top;
        const R = Math.hypot(Math.max(cx, pr.width - cx), Math.max(cy, pr.height - cy)) + 20;
        panel.animate([{ clipPath: `circle(${R}px at ${cx}px ${cy}px)` }, { clipPath: `circle(${br.width / 2}px at ${cx}px ${cy}px)` }],
          { duration: 480, easing: 'cubic-bezier(.65,0,.35,1)', fill: 'forwards' }).onfinish = finish;
      } else {
        panel.animate([{ opacity: 1 }, { opacity: 0, transform: 'translateY(18px) scale(.98)' }], { duration: 260, easing: 'ease-in', fill: 'forwards' }).onfinish = finish;
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
  window.addEventListener('hashchange', () => { if (!dlg.open) lensFromHash(); });

  // Route suivie par le bouton « Mode aventure » (js/classic.js).
  function route(r) { doc.dispatchEvent(new CustomEvent('classic:route', { detail: r })); }

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
  // Entrée : l'espace glisse doucement vers sa place (on y arrive).
  if (!REDUCE.matches && !doc.documentElement.classList.contains('is-still')) {
    space.cam.x -= 90; space.cam.y += 60;
    space.glideBy(90, -60, 1200);
  }
  const slug = decodeURIComponent(location.hash.slice(1));
  if (bySlug[slug]) requestAnimationFrame(() => openProject(slug, { fromHash: true }));
  else lensFromHash();

  app.projectInfo = (s) => bySlug[s] || null;
}
