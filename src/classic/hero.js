/* ══════════════════════════════════════════════════════
   HERO.JS — Constellation d'entrée (mode classique)

   Aperçu de l'espace des projets : un point par projet (couleur =
   catégorie, taille = rang), reliés par catégorie. Décor pur
   (aria-hidden). Il suit légèrement le pointeur — seulement quand le
   pointeur bouge, puis s'arrête : pas de boucle permanente.
   ══════════════════════════════════════════════════════ */
const doc = document;
const NS = 'http://www.w3.org/2000/svg';
const REDUCE = matchMedia('(prefers-reduced-motion: reduce)');

function rng(seed) {
  return () => { seed = (seed * 48271) % 2147483647; return (seed - 1) / 2147483646; };
}

export function initHero() {
  const hero = doc.querySelector('.hero');
  const sky = hero && hero.querySelector('.hero__sky');
  const items = [...doc.querySelectorAll('.pj-item')];
  if (!sky || !items.length) return;

  const svg = doc.createElementNS(NS, 'svg');
  svg.setAttribute('aria-hidden', 'true');
  sky.appendChild(svg);
  const R = { l: 6.5, m: 4.5, s: 3 };
  const rand = rng(7);
  // Positions fixes (fractions), dans la moitié droite : le texte reste
  // lisible, et le menu « À explorer » (en bas à droite) reste dégagé.
  const pts = items.map((li) => {
    const fx = 0.56 + rand() * 0.4;
    return {
      cat: li.dataset.cat, tier: li.dataset.tier, pick: li.hasAttribute('data-pick'),
      fx, fy: 0.1 + rand() * (fx > 0.68 ? 0.34 : 0.7),
    };
  });

  function draw() {
    const w = sky.clientWidth, h = sky.clientHeight;
    if (!w) return;
    const narrow = w < 900;
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    svg.textContent = '';
    // Écran moyen : la constellation se resserre en haut à droite, au-dessus
    // du menu et à l'écart des boutons.
    const mid = !narrow && w < 1280;
    const pos = pts.map((p) => ({
      ...p,
      x: (narrow ? 0.08 + (p.fx - 0.5) * 1.9 : mid ? 0.68 + ((p.fx - 0.56) / 0.4) * 0.29 : p.fx) * w,
      y: (narrow ? p.fy * 0.5 : mid ? 0.1 + ((p.fy - 0.1) / 0.7) * 0.3 : p.fy) * h,
    }));
    // Liens : chaque point vers le suivant de sa catégorie.
    const cats = [...new Set(pos.map((p) => p.cat))];
    cats.forEach((c) => {
      const g = pos.filter((p) => p.cat === c).sort((a, b) => a.x - b.x);
      for (let i = 1; i < g.length; i++) {
        const l = doc.createElementNS(NS, 'line');
        l.setAttribute('x1', g[i - 1].x.toFixed(1)); l.setAttribute('y1', g[i - 1].y.toFixed(1));
        l.setAttribute('x2', g[i].x.toFixed(1)); l.setAttribute('y2', g[i].y.toFixed(1));
        svg.appendChild(l);
      }
    });
    pos.forEach((p) => {
      const c = doc.createElementNS(NS, 'circle');
      c.setAttribute('cx', p.x.toFixed(1)); c.setAttribute('cy', p.y.toFixed(1));
      c.setAttribute('r', R[p.tier] || 3);
      c.setAttribute('data-cat', p.cat);
      if (p.pick) c.setAttribute('class', 'is-pick');
      svg.appendChild(c);
    });
  }
  draw();
  let rw = 0;
  new ResizeObserver(() => { if (sky.clientWidth !== rw) { rw = sky.clientWidth; draw(); } }).observe(sky);

  // Léger suivi du pointeur (ordinateur uniquement).
  if (REDUCE.matches || !matchMedia('(pointer: fine)').matches) return;
  let tx = 0, ty = 0, x = 0, y = 0, raf = 0;
  function frame() {
    x += (tx - x) * 0.08; y += (ty - y) * 0.08;
    svg.style.transform = `translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,0)`;
    raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.1 ? requestAnimationFrame(frame) : 0;
  }
  hero.addEventListener('pointermove', (e) => {
    const r = hero.getBoundingClientRect();
    tx = -((e.clientX - r.left) / r.width - 0.5) * 28;
    ty = -((e.clientY - r.top) / r.height - 0.5) * 20;
    if (!raf) raf = requestAnimationFrame(frame);
  });
  hero.addEventListener('pointerleave', () => { tx = ty = 0; if (!raf) raf = requestAnimationFrame(frame); });
}
