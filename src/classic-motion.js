/* ══════════════════════════════════════════════════════
   CLASSIC-MOTION.JS — Animations du mode classique (GSAP + ScrollTrigger)
   Appelé par src/classic-app.js, une fois les vues construites.

   Pur confort : la page reste complète sans lui. Rien n'est animé si le
   visiteur demande moins de mouvement. Mouvements courts, qui servent la
   lecture : l'entrée du hero se lit dans l'ordre (qui, quoi, quoi
   chercher, où aller), puis chaque section se dévoile en arrivant.
   ══════════════════════════════════════════════════════ */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const doc = document;
const root = doc.documentElement;
const EASE = 'power3.out';
// Opacité seulement (jamais visibility) : un élément pas encore dévoilé
// reste atteignable au clavier, et se dévoile dès qu'il reçoit le focus.
const CLEAR = 'transform,opacity';               // rend la main au CSS (hover, thème)

// ── Hero : séquence d'entrée ────────────────────────────
function intro() {
  if (!doc.querySelector('.hero')) return;
  gsap.timeline({ defaults: { ease: EASE, duration: 0.8 } })
    .from('.topbar', { y: -18, opacity: 0, duration: 0.9, clearProps: CLEAR }, 0.05)
    .from('.hero__glow', { opacity: 0, scale: 0.7, duration: 1.8, ease: 'power2.out', clearProps: 'opacity' }, 0)
    .from('.hero__kicker', { opacity: 0, x: -14, clearProps: CLEAR }, 0.15)
    .from('.hero__w > span', { yPercent: 108, duration: 1.15, ease: 'power4.out', stagger: 0.1, clearProps: 'transform' }, 0.3)
    .from('.hero__line', { y: 22, opacity: 0, clearProps: CLEAR }, 0.8)
    .from('.hero__meta', { opacity: 0, duration: 0.5, clearProps: CLEAR }, 1.0)
    .from('.hero__meta > *', { x: -8, opacity: 0, stagger: 0.09, duration: 0.5, clearProps: CLEAR }, 1.0)
    .from('.hero__cta > *, .hero__social', { y: 14, opacity: 0, stagger: 0.07, duration: 0.6, clearProps: CLEAR }, 1.2)
    .from('.hero__doors', { opacity: 0, duration: 0.4, clearProps: CLEAR }, 1.3)
    .from('.hero__doors-k, .hero__doors li', { x: 18, opacity: 0, stagger: 0.07, duration: 0.6, clearProps: CLEAR }, 1.3)
    .from('.hero__sky circle', { scale: 0, transformOrigin: '50% 50%', stagger: { each: 0.05, from: 'random' }, duration: 0.8, ease: 'back.out(2)', clearProps: 'transform' }, 0.6)
    .from('.hero__sky line', { opacity: 0, duration: 1.4, ease: 'power1.out', clearProps: 'opacity' }, 1.1);
}

// ── Hero : on s'en éloigne en profondeur ────────────────
function heroScroll() {
  const st = { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.5 };
  gsap.to('.hero__seq', { y: -70, opacity: 0.15, ease: 'none', scrollTrigger: st });
  gsap.to('.hero__doors', { y: -30, opacity: 0, ease: 'none', scrollTrigger: st });
  gsap.to('.hero__sky', { yPercent: 22, ease: 'none', scrollTrigger: st });
  gsap.to('.hero__glow', { yPercent: 25, ease: 'none', scrollTrigger: st });
}

// Seul ce qui est encore SOUS l'écran est masqué : une arrivée par lien
// profond (#projets/skywalk) ou un retour arrière n'affiche jamais de trou.
function below(el) {
  return el.getBoundingClientRect().top > window.innerHeight * 0.92;
}

function reveal(targets, vars = {}, start = 'top 88%') {
  const items = gsap.utils.toArray(targets).filter(below);
  if (!items.length) return;
  gsap.set(items, { opacity: 0, y: vars.y ?? 28, x: vars.x ?? 0 });
  items.forEach((el) => el.setAttribute('data-unrevealed', ''));
  ScrollTrigger.batch(items, {
    start,
    once: true,
    onEnter: (batch) => show(batch, vars),
  });
}
function show(batch, vars = {}) {
  batch.forEach((el) => el.removeAttribute('data-unrevealed'));
  gsap.to(batch, {
    opacity: 1, x: 0, y: 0, duration: vars.duration ?? 0.75, stagger: vars.stagger ?? 0.08,
    ease: EASE, overwrite: true, clearProps: CLEAR,
  });
}
// Navigation au clavier : ce qui reçoit le focus se dévoile tout de suite.
doc.addEventListener('focusin', (e) => {
  const el = e.target.closest && e.target.closest('[data-unrevealed]');
  if (el) show([el], { duration: 0.3 });
});

// ── Sections : dévoilées dans l'ordre de lecture ────────
function sections() {
  doc.querySelectorAll('.sec-head').forEach((head) => {
    if (!below(head)) return;
    gsap.from(head.children, {
      y: 26, opacity: 0, duration: 0.8, stagger: 0.09, ease: EASE, clearProps: CLEAR,
      scrollTrigger: { trigger: head, start: 'top 88%', once: true },
    });
  });

  // Profil : l'idée d'abord, le détail ensuite.
  doc.querySelectorAll('.chapter').forEach((ch) => {
    if (!below(ch)) return;
    gsap.timeline({ scrollTrigger: { trigger: ch, start: 'top 80%', once: true }, defaults: { ease: EASE, clearProps: CLEAR } })
      .from(ch.querySelector('.chapter__k'), { opacity: 0, x: -10, duration: 0.5 })
      .from(ch.querySelector('.chapter__lead'), { opacity: 0, y: 30, duration: 0.9 }, 0.08)
      .from(ch.querySelectorAll('.chapter__more > *'), { opacity: 0, y: 18, duration: 0.6, stagger: 0.08 }, 0.4);
  });

  reveal('.pj-bar, .pj-legend', { y: 16 });
  reveal('.ev__card, .ev--aside > *', { x: 28, y: 0, duration: 0.8 }, 'top 85%');
  reveal('.fam__t', { x: -12, y: 0 });
  reveal('.sk__btn', { y: 10, duration: 0.5, stagger: 0.025 }, 'top 92%');
  reveal('.sk-panel', { y: 24 });
  reveal('.services, .contact__row, .contact__links, .contact__form', { y: 24 });
}

// ── Parcours : la vue d'ensemble se trace ───────────────
function spans() {
  const chart = doc.querySelector('.spans');
  if (!chart || !below(chart)) return;
  gsap.timeline({ scrollTrigger: { trigger: chart, start: 'top 85%', once: true } })
    .from(chart, { opacity: 0, y: 20, duration: 0.6, ease: EASE, clearProps: CLEAR })
    .from(chart.querySelectorAll('.span:not(.span--point)'), { scaleX: 0, duration: 0.9, stagger: 0.12, ease: 'power3.inOut', clearProps: 'transform' }, 0.2)
    .from(chart.querySelectorAll('.span--point'), { scale: 0, duration: 0.5, ease: 'back.out(2)', clearProps: 'transform' }, 0.2);
}

// ?capture (npm run capture) : page figée pour les miniatures.
const still = /[?&]capture\b/.test(location.search);

export function initMotion() {
  if (!still) gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
    intro();
    heroScroll();
    sections();
    spans();
  });

  // États initiaux posés (synchrone) → on lève le masque anti-flash du <head>.
  root.classList.remove('motion-pending');

  // Vue liste/espace, « En savoir plus », info-panneau : la hauteur de la
  // page change, les déclencheurs doivent être recalculés.
  const main = doc.getElementById('main');
  if (main && 'ResizeObserver' in window) {
    let t;
    new ResizeObserver(() => {
      clearTimeout(t);
      t = setTimeout(() => ScrollTrigger.refresh(), 150);
    }).observe(main);
  }
}
