/* ══════════════════════════════════════════════════════
   PROFILE.JS : Page Profil : la porte d'entrée

   Séquence d'entrée, dans l'ordre de lecture :
     identité (le nom) → métier → contexte → exploration.
   Puis une profondeur discrète : les orbes (les technologies) et le halo
   suivent le pointeur selon leur plan ; au défilement, le nom recule.
   Arrivée depuis une autre page (View Transition) : le nom est déjà là
   (il vient du logo), seule la suite se dévoile.

   GSAP + ScrollTrigger (regroupés par Vite, chargés sur cette page
   seulement). Rien n'est animé si le visiteur demande moins de
   mouvement. Aucune boucle permanente.
   ══════════════════════════════════════════════════════ */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const doc = document;
const root = doc.documentElement;
const EASE = 'power3.out';
const CLEAR = 'transform,opacity';

function intro() {
  const arrived = root.classList.contains('vt-arrival');
  const tl = gsap.timeline({ defaults: { ease: EASE, duration: 0.8 } });
  if (!arrived) {
    tl.from('.pf-name__w > span', { yPercent: 110, duration: 1.2, ease: 'power4.out', stagger: 0.12, clearProps: 'transform' }, 0.1);
  }
  const t0 = arrived ? 0.12 : 0.85;
  tl.from('.pf-role', { y: 18, opacity: 0, clearProps: CLEAR }, t0)
    .from('.pf-ctx', { y: 12, opacity: 0, duration: 0.7, clearProps: CLEAR }, t0 + 0.2)
    .from('.pf-cta > *', { y: 14, opacity: 0, stagger: 0.08, duration: 0.7, clearProps: CLEAR }, t0 + 0.42)
    .from('.pf-scroll', { opacity: 0, duration: 0.8, clearProps: 'opacity' }, t0 + 0.8)
    .from('.pf-orbs i', {
      opacity: 0, scale: 0.2, x: (i, el) => (50 - parseFloat(el.style.getPropertyValue('--x'))) * 6,
      y: (i, el) => (50 - parseFloat(el.style.getPropertyValue('--y'))) * 4,
      duration: 1.4, ease: 'expo.out', stagger: { each: 0.04, from: 'random' }, clearProps: 'opacity,scale,x,y',
    }, arrived ? 0 : 0.4);
}

// Profondeur : pointeur → orbes (selon leur plan) et halo.
function depth() {
  const hero = doc.querySelector('.pf-hero');
  const orbs = doc.querySelector('.pf-orbs');
  if (!hero || !orbs || !matchMedia('(pointer: fine)').matches) return;
  let tx = 0, ty = 0, x = 0, y = 0, raf = 0;
  function frame() {
    x += (tx - x) * 0.07; y += (ty - y) * 0.07;
    orbs.style.setProperty('--px', `${x.toFixed(1)}px`);
    orbs.style.setProperty('--py', `${y.toFixed(1)}px`);
    hero.style.setProperty('--hx', `${(-x * 1.6).toFixed(1)}px`);
    hero.style.setProperty('--hy', `${(-y * 1.6).toFixed(1)}px`);
    raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.1 ? requestAnimationFrame(frame) : 0;
  }
  hero.addEventListener('pointermove', (e) => {
    const r = hero.getBoundingClientRect();
    tx = -((e.clientX - r.left) / r.width - 0.5) * 70;
    ty = -((e.clientY - r.top) / r.height - 0.5) * 50;
    if (!raf) raf = requestAnimationFrame(frame);
  });
  hero.addEventListener('pointerleave', () => { tx = ty = 0; if (!raf) raf = requestAnimationFrame(frame); });
}

function scroll() {
  const st = { trigger: '.pf-hero', start: 'top top', end: 'bottom top', scrub: 0.4 };
  gsap.to('.pf-hero__inner', { y: -90, opacity: 0.1, scale: 0.96, ease: 'none', scrollTrigger: st });
  gsap.to('.pf-orbs', { '--sy': '-160px', ease: 'none', scrollTrigger: st });
  gsap.to('.pf-scroll', { opacity: 0, ease: 'none', scrollTrigger: { ...st, end: '20% top' } });

  // Sections suivantes : dévoilées en arrivant (opacité seulement :
  // un élément pas encore dévoilé reste atteignable au clavier).
  const below = (el) => el.getBoundingClientRect().top > innerHeight * 0.9;
  const groups = [
    ['.pf-about .kicker, .pf-statement', 0.1],
    ['.pf-about__text, .facts', 0.12],
    ['.pf-stack', 0],
    ['.pf-next .kicker', 0],
    ['.doors > li', 0.08],
  ];
  groups.forEach(([sel, stagger]) => {
    const els = gsap.utils.toArray(sel).filter(below);
    if (!els.length) return;
    gsap.set(els, { opacity: 0, y: 26 });
    ScrollTrigger.batch(els, {
      start: 'top 88%', once: true,
      onEnter: (b) => gsap.to(b, { opacity: 1, y: 0, duration: 0.85, stagger, ease: EASE, overwrite: true, clearProps: CLEAR }),
    });
  });
  doc.addEventListener('focusin', (e) => {
    const el = e.target.closest('.pf-about *, .pf-next *');
    if (el) gsap.to(el.closest('.doors > li, .pf-stack, .facts, .pf-about__text') || el, { opacity: 1, y: 0, duration: 0.3, overwrite: true });
  });
}

// Orbes : leur flottement s'arrête quand le haut de page n'est plus visible.
function pauseOffscreen() {
  const orbs = doc.querySelector('.pf-orbs');
  if (!orbs) return;
  new IntersectionObserver(([e]) => orbs.classList.toggle('is-paused', !e.isIntersecting)).observe(orbs);
}

export function initProfile() {
  const still = root.classList.contains('is-still');
  pauseOffscreen();
  const run = () => {
    if (!still) gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
      intro();
      depth();
      scroll();
    });
    // États initiaux posés (synchrone) → on lève le masque anti-flash du <head>.
    root.classList.remove('motion-pending');
  };
  // Page préchargée (speculation rules) : l'entrée attend l'affichage réel.
  if (doc.prerendering) doc.addEventListener('prerenderingchange', run, { once: true });
  else run();
}
