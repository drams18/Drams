/* ══════════════════════════════════════════════════════
   SCROLL.JS — Suivi de lecture partagé (mode classique)

   Un seul écouteur de défilement, regroupé par frame. Chaque vue ne
   travaille que lorsqu'elle est à l'écran (IntersectionObserver) :
   aucune boucle quand rien ne bouge.
   ══════════════════════════════════════════════════════ */
const views = [];
let ticking = false;

function run() {
  ticking = false;
  views.forEach((v) => { if (v.on) v.fn(); });
}
function request() {
  if (!ticking) { ticking = true; requestAnimationFrame(run); }
}
addEventListener('scroll', request, { passive: true });
addEventListener('resize', request);
document.addEventListener('classic:layout', request);

export function watch(el, fn) {
  const v = { fn, on: false };
  views.push(v);
  new IntersectionObserver(([e]) => { v.on = e.isIntersecting; if (v.on) request(); }, { rootMargin: '10% 0px' }).observe(el);
  return request;
}

// Index du dernier élément dont le haut a franchi la ligne de lecture.
export function currentIndex(els, line) {
  let cur = 0;
  for (let i = 0; i < els.length; i++) {
    if (els[i].getBoundingClientRect().top <= line) cur = i;
  }
  return cur;
}
