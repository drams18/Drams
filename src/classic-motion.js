/* ══════════════════════════════════════════════════════
   CLASSIC-MOTION.JS — Animations du mode classique (GSAP + ScrollTrigger)
   Module ES regroupé par Vite (npm run build) ; chargé après classic.js.

   Pur confort : la page reste complète sans lui. Rien n'est animé si le
   visiteur demande moins de mouvement. Le HTML de classique.html est
   GÉNÉRÉ (museum.js) : on ne cible que des classes existantes, sans
   ajouter d'attributs au contenu.
   ══════════════════════════════════════════════════════ */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const doc = document;
const root = doc.documentElement;
const EASE = 'power3.out';
const CLEAR = 'transform,opacity,visibility';   // rend la main au CSS (hover, thème)

// Éléments révélés au défilement, dans l'ordre de lecture.
const REVEAL = [
  '.filters', '.group-title', '.proj--feat', '.proj-list > li',
  '.track__title', '.tl__item',
  '.stack-card', '.skill-group',
  '.about__bio', '.about__meta > *',
  '.services > *',
  '.contact__row', '.contact__links', '.contact__form',
].join(',');

// ── Hero : entrée orchestrée au chargement ──────────────
function intro() {
  const hero = doc.querySelector('.hero');
  if (!hero) return;

  gsap.timeline({ defaults: { ease: EASE, duration: 0.9 } })
    .from('.hero__glow', { autoAlpha: 0, scale: 0.6, duration: 1.6, ease: 'power2.out', clearProps: 'opacity,visibility' }, 0)
    .from('.hero__id > *', { y: 30, autoAlpha: 0, stagger: 0.08, clearProps: CLEAR }, 0.05)
    .from('.stack-strip__k, .stack-strip li', { y: 12, autoAlpha: 0, stagger: 0.035, duration: 0.5, clearProps: CLEAR }, 0.5);
}

// ── Hero : le halo et le texte glissent à des vitesses différentes ──
function parallax() {
  const st = { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.5 };
  gsap.to('.hero__glow',  { yPercent: 30, ease: 'none', scrollTrigger: st });
  gsap.to('.hero__inner', { y: -40, autoAlpha: 0.3, ease: 'none', scrollTrigger: st });
}

// ── Sections : titres puis contenus, au défilement ──────
// Seul ce qui est encore SOUS l'écran est masqué : une arrivée par lien
// profond (#projets/skywalk) ou un retour arrière n'affiche jamais de trou.
function below(el) {
  return el.getBoundingClientRect().top > window.innerHeight * 0.92;
}

function reveals() {
  doc.querySelectorAll('.sec-head').forEach((head) => {
    if (!below(head)) return;
    gsap.from(head.children, {
      y: 24, autoAlpha: 0, duration: 0.7, stagger: 0.08, ease: EASE, clearProps: CLEAR,
      scrollTrigger: { trigger: head, start: 'top 88%', once: true },
    });
  });

  const items = gsap.utils.toArray(REVEAL).filter(below);
  if (!items.length) return;
  gsap.set(items, { autoAlpha: 0, y: 32 });
  ScrollTrigger.batch(items, {
    start: 'top 92%',
    once: true,
    onEnter: (batch) => gsap.to(batch, {
      autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.08, ease: EASE, overwrite: true, clearProps: CLEAR,
    }),
  });
}

// ── Parcours : la ligne du temps se trace en lisant ─────
function timelines() {
  doc.querySelectorAll('.tl').forEach((tl) => {
    gsap.fromTo(tl, { '--tl-draw': 0 }, {
      '--tl-draw': 1, ease: 'none',
      scrollTrigger: { trigger: tl, start: 'top 80%', end: 'bottom 65%', scrub: 0.6 },
    });
  });
}

// ?capture (npm run capture) : page figée pour les miniatures.
const still = /[?&]capture\b/.test(location.search);

if (!still) gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
  intro();
  parallax();
  reveals();
  timelines();
});

// États initiaux posés (synchrone) → on lève le masque anti-flash du <head>.
root.classList.remove('motion-pending');

// Filtres, « Lire la suite », <details> : la hauteur de la page change,
// les déclencheurs doivent être recalculés.
const main = doc.getElementById('main');
if (main && 'ResizeObserver' in window) {
  let t;
  new ResizeObserver(() => {
    clearTimeout(t);
    t = setTimeout(() => ScrollTrigger.refresh(), 150);
  }).observe(main);
}
