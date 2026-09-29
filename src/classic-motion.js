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

  // Le décalage RGB du nom (CSS nameIn) se joue pendant que le hero est
  // masqué : on le relance quand le nom apparaît.
  const name = hero.querySelector('.hero__name');
  if (name) name.style.animation = 'none';

  gsap.timeline({ defaults: { ease: EASE, duration: 0.8 } })
    .from('.hero__id > *', { y: 28, autoAlpha: 0, stagger: 0.07, clearProps: CLEAR }, 0)
    .call(() => { if (name) name.style.animation = ''; }, null, 0.08)
    .from('.hero__city', {
      clipPath: 'inset(100% 0 0 0)', y: 24, duration: 1.1, ease: 'power4.out',
      clearProps: 'clipPath,transform',
    }, 0.15)
    .from('.hero__city .c-win', {
      opacity: 0, duration: 0.3, stagger: { each: 0.018, from: 'random' }, clearProps: 'opacity',
    }, 0.6)
    .from('.hero__city .c-hero', { x: -60, duration: 1.2, ease: 'power2.out', clearProps: 'transform' }, 0.5)
    .from('.stack-strip__k, .stack-strip li', { y: 12, autoAlpha: 0, stagger: 0.035, duration: 0.5, clearProps: CLEAR }, 0.45);
}

// ── Hero : parallaxe de la skyline quand on la quitte ───
function parallax() {
  const st = { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.5 };
  gsap.to('.hero__city .c-stars', { y: 6,  ease: 'none', scrollTrigger: st });
  gsap.to('.hero__city .c-orb',   { y: 26, ease: 'none', scrollTrigger: st });
  gsap.to('.hero__city .c-far',   { y: 14, ease: 'none', scrollTrigger: st });
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

gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
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
