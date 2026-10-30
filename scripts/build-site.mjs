/* ══════════════════════════════════════════════════════
   BUILD-SITE.MJS : Génère le site (développeur web freelance) à partir
   des données, sans dépendance :
     js/museum.js        profil, contact, activité, projets (+ textes clients)
     js/tarifs-data.js   grille tarifaire (prix, offres principales)

     npm run content      (ou : node scripts/build-site.mjs)
     npm run build        (content + sitemap + vite build)

   Pages ÉCRITES EN ENTIER ici (ne pas les éditer à la main) :
     index.html                 /                        accueil (landing)
     realisations.html          /realisations            réalisations
     realisations/<slug>.html   /realisations/<slug>     un projet
     tarifs.html                /tarifs                  tarifs
     a-propos.html              /a-propos                à propos
     contact.html               /contact                 contact
     devis.html                 /devis                   demande de devis (js/devis.js)
     avis.html                  /avis                    avis Google (js/reviews.js)
     mentions-legales.html      /mentions-legales
     confidentialite.html       /confidentialite
     404.html
   Le mode aventure (aventure.html, construire-projet.html) n'est pas
   généré ici.

   Règles : chaque page est complète sans JavaScript et sans animation
   (rien n'est masqué en attendant un défilement), un seul <h1>, un titre
   et une description propres. Rien n'est inventé : un texte manquant
   reste [À COMPLÉTER] dans les données.
   ══════════════════════════════════════════════════════ */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const { SECTIONS } = require('../js/museum.js');
const T = require('../js/tarifs-data.js');
// Fiche Google : lien unique dans js/reviews.js.
const { REVIEW_URL, PROFILE_URL } = require('../js/reviews.js');

// Adresse publique (canonique) du site. À changer ici, dans robots.txt et
// scripts/sitemap.mjs si le domaine change.
const SITE_URL = 'https://arphandrame.fr/';

// ── Helpers ────────────────────────────────────────────
const esc = (v) => String(v ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const icon = (id, cls = 'ico') => `<svg class="${cls}" aria-hidden="true" focusable="false"><use href="#i-${id}"/></svg>`;
const slugify = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const ext = (url, label, cls = 'btn btn--ghost') =>
  `<a class="${cls}" href="${esc(url)}" target="_blank" rel="noopener">${label}${icon('external', 'ico ico--xs')}</a>`;

// Dimensions d'un webp (en-tête VP8 / VP8L / VP8X) : réserve la place de
// l'image avant son chargement.
function webpSize(file) {
  const b = readFileSync(join(ROOT, file));
  const k = b.toString('latin1', 12, 16);
  if (k === 'VP8 ') return { w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff };
  if (k === 'VP8L') { const v = b.readUInt32LE(21); return { w: (v & 0x3fff) + 1, h: ((v >>> 14) & 0x3fff) + 1 }; }
  if (k === 'VP8X') return { w: 1 + b.readUIntLE(24, 3), h: 1 + b.readUIntLE(27, 3) };
  return null;
}

// ── Données ────────────────────────────────────────────
const profile  = SECTIONS.profile;
const bio      = profile.bio;
const steps    = SECTIONS.parcours.steps;
const projects = SECTIONS.projets.items;
const contact  = SECTIONS.contact;
const biz      = SECTIONS.business;

// « Arphan DRAME » → « Arphan Drame ».
const NAME = bio.name.replace(/\b(\p{Lu})(\p{Lu}+)\b/gu, (m, a, b) => a + b.toLowerCase());
const JOB = 'Développeur web freelance';
const AREA = biz.area;

const TEL_LOCAL = contact.phone;                                   // 07 67 31 84 26
const TEL_INTL  = '+33' + contact.phone.replace(/\D/g, '').replace(/^0/, '');
const TEL_HREF  = `tel:${TEL_INTL}`;
const WA_HREF   = `https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(contact.whatsappText)}`;
const MAIL_HREF = `mailto:${contact.email}`;
const IG_URL    = contact.instagram;
const IG_HANDLE = '@' + IG_URL.replace(/\/+$/, '').split('/').pop();
const LINKEDIN  = contact.links.find(l => /linkedin/i.test(l.label)).url;
const GITHUB    = contact.links.find(l => /github/i.test(l.label)).url;
const TIKTOK    = contact.tiktok || '';
const CV_URL    = '/assets/CV.pdf';
const PHOTO     = existsSync(join(ROOT, 'assets/img/arphan-drame.webp')) ? '/assets/img/arphan-drame.webp' : null;
const GOOGLE_PROFILE = PROFILE_URL && PROFILE_URL !== REVIEW_URL ? PROFILE_URL : '';

// ── Tarifs ─────────────────────────────────────────────
const serviceByName = (name) => {
  const s = T.SERVICES.find(x => x.name === name);
  if (!s) throw new Error(`tarifs-data : prestation introuvable, ${name}`);
  return s;
};
const svcId = (s) => slugify(s.name);
// « à partir de 150 € » (+ « / mois »…)
const priceText = (s) => `${s.from ? 'à partir de ' : ''}${s.price}${s.unit ? ` ${s.unit}` : ''}`;
const priceHtml = (s) => `${s.from ? '<span class="price__from">à partir de</span> ' : ''}<span class="price__amount">${esc(s.price)}</span>${s.unit ? ` <span class="price__unit">${esc(s.unit)}</span>` : ''}`;
const euros = (s) => parseInt(s.price.replace(/\D/g, ''), 10);
const offers = T.MAIN_OFFERS.map(o => ({ ...o, svc: serviceByName(o.service) }));
const offer = (id) => offers.find(o => o.id === id);
const maintenance = serviceByName('Maintenance');
const depannage = serviceByName('Intervention / dépannage');
const refonte = serviceByName('Refonte de site');

// ── Projets ────────────────────────────────────────────
const CASES = SECTIONS.projets.cases;
const KINDS = SECTIONS.projets.kinds;
const rank = (p) => { const i = SECTIONS.projets.order.indexOf(p.slug); return i < 0 ? Infinity : i; };
const ordered  = [...projects].sort((a, b) => rank(a) - rank(b));
const featured = SECTIONS.projets.featured.map(s => projects.find(p => p.slug === s)).filter(Boolean);
const others   = ordered.filter(p => !featured.includes(p));
for (const p of projects) if (!CASES[p.slug]) throw new Error(`museum.js : texte client manquant pour ${p.slug}`);
const caseOf = (p) => CASES[p.slug];
const projectUrl = (p) => `/realisations/${p.slug}`;

// Captures publiées : seules celles dont le webp existe.
const shotsOf = (p) => (p.shots || [])
  .map(s => ({ src: `/assets/img/projets/${s.file}.webp`, alt: s.alt || '', size: null }))
  .filter(s => existsSync(join(ROOT, s.src.slice(1))))
  .map(s => ({ ...s, size: webpSize(s.src.slice(1)) }));
const coverOf = (p) => {
  const f = `assets/img/projets/${p.slug}.webp`;
  return shotsOf(p).length && existsSync(join(ROOT, f)) ? { src: '/' + f, size: webpSize(f) } : null;
};
// Lien public : site en ligne ou App Store.
function linkOf(p) {
  const l = (p.links || [])[0];
  if (!l) return null;
  return /apps\.apple\.com/.test(l.url)
    ? { url: l.url, label: 'Voir sur l’App Store' }
    : { url: l.url, label: p.status ? 'Voir le site (en cours)' : 'Voir le site en ligne' };
}

// Maquette : téléphone pour une app, navigateur pour un site.
function mockup(p, { shot = 0, eager = false, sizes = '(max-width: 760px) 92vw, 560px', count = 1 } = {}) {
  const shots = shotsOf(p);
  if (!shots.length) {
    return `<div class="mock mock--none" aria-hidden="true"><span>${esc(p.title)}</span></div>`;
  }
  const load = eager ? 'fetchpriority="high"' : 'loading="lazy"';
  if (p.device === 'mobile') {
    const list = shots.slice(shot, shot + count);
    return `<div class="mocks mocks--${list.length}">${list.map(s => `
              <figure class="mock mock--phone"><img src="${s.src}" alt="${esc(s.alt)}" width="${s.size.w}" height="${s.size.h}" ${load} decoding="async"></figure>`).join('')}
            </div>`;
  }
  const s = shots[shot];
  const cover = shot === 0 ? coverOf(p) : null;
  const host = (p.links || [])[0] ? new URL(p.links[0].url).host.replace(/^www\./, '') : '';
  return `<figure class="mock mock--browser">
              <div class="mock__bar" aria-hidden="true"><i></i><i></i><i></i>${host ? `<span>${esc(host)}</span>` : ''}</div>
              <img src="${s.src}"${cover ? ` srcset="${cover.src} ${cover.size.w}w, ${s.src} ${s.size.w}w" sizes="${sizes}"` : ''} alt="${esc(s.alt)}" width="${s.size.w}" height="${s.size.h}" ${load} decoding="async">
            </figure>`;
}

// ── Pages ──────────────────────────────────────────────
const NAV = [
  { key: 'realisations', href: '/realisations', label: 'Réalisations' },
  { key: 'tarifs',       href: '/tarifs',       label: 'Tarifs' },
  { key: 'a-propos',     href: '/a-propos',     label: 'À propos' },
  { key: 'contact',      href: '/contact',      label: 'Contact' },
];

const SPRITE = `
  <svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false">
    <symbol id="i-arrow" viewBox="0 0 24 24"><path d="M5 12h13M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.8"/></symbol>
    <symbol id="i-back" viewBox="0 0 24 24"><path d="M19 12H6M11 6l-6 6 6 6" fill="none" stroke="currentColor" stroke-width="1.8"/></symbol>
    <symbol id="i-external" viewBox="0 0 24 24"><path d="M14 4h6v6M20 4l-9 9M18 14v6H4V6h6" fill="none" stroke="currentColor" stroke-width="1.8"/></symbol>
    <symbol id="i-phone" viewBox="0 0 24 24"><path d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></symbol>
    <symbol id="i-whatsapp" viewBox="0 0 24 24"><path d="M12 3a9 9 0 0 0-7.8 13.5L3 21l4.6-1.2A9 9 0 1 0 12 3z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M9.2 7.6c-.4 0-.9.4-.9 1.3 0 2.6 3 6.4 6.6 6.9.9.1 1.6-.5 1.7-1.1l.1-.6-2.1-1-.9.9c-1.1-.4-2.5-1.8-2.9-2.9l.9-.9-.9-2.2z" fill="currentColor"/></symbol>
    <symbol id="i-mail" viewBox="0 0 24 24"><path d="M3 5h18v14H3zM3 6l9 7 9-7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></symbol>
    <symbol id="i-instagram" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="17.3" cy="6.7" r="1.2" fill="currentColor"/></symbol>
    <symbol id="i-linkedin" viewBox="0 0 24 24"><path d="M4 3a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM3 9h3v12H3zM9 9h3v1.7c.5-.9 1.7-1.9 3.5-1.9 3.2 0 3.5 2.1 3.5 4.8V21h-3v-6.5c0-1.5 0-3.3-2-3.3s-2.3 1.6-2.3 3.2V21H9z" fill="currentColor"/></symbol>
    <symbol id="i-github" viewBox="0 0 24 24"><path d="M12 2a10 10 0 0 0-3.2 19.5c.5.1.7-.2.7-.5v-1.7c-2.8.6-3.4-1.3-3.4-1.3-.5-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.4 1.1 2.9.8.1-.7.4-1.1.6-1.3-2.2-.3-4.6-1.1-4.6-5a3.9 3.9 0 0 1 1-2.7 3.6 3.6 0 0 1 .1-2.7s.8-.3 2.8 1a9.6 9.6 0 0 1 5 0c1.9-1.3 2.8-1 2.8-1 .5 1.4.2 2.4.1 2.7a3.9 3.9 0 0 1 1 2.7c0 3.9-2.4 4.7-4.6 5 .4.3.7.9.7 1.9V21c0 .3.2.6.7.5A10 10 0 0 0 12 2z" fill="currentColor"/></symbol>
    <symbol id="i-tiktok" viewBox="0 0 24 24"><path d="M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5M14 3c.5 2.5 2.3 4 5 4.2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></symbol>
    <symbol id="i-menu" viewBox="0 0 24 24"><path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" stroke-width="1.8"/></symbol>
    <symbol id="i-close" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" stroke-width="1.8"/></symbol>
    <symbol id="i-sun" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1" stroke="currentColor" stroke-width="1.8"/></symbol>
    <symbol id="i-moon" viewBox="0 0 24 24"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" fill="none" stroke="currentColor" stroke-width="1.8"/></symbol>
    <symbol id="i-check" viewBox="0 0 24 24"><path d="m5 12.5 4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2"/></symbol>
    <symbol id="i-chevron" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" stroke-width="1.8"/></symbol>
    <symbol id="i-gamepad" viewBox="0 0 24 24"><path d="M4 8h16l2 9h-5l-2-3H9l-2 3H2zM7 10v4M5 12h4" fill="none" stroke="currentColor" stroke-width="1.8"/><rect x="15" y="10.5" width="2" height="2" fill="currentColor"/></symbol>
    <symbol id="i-download" viewBox="0 0 24 24"><path d="M12 3v12M7 10l5 5 5-5M4 20h16" fill="none" stroke="currentColor" stroke-width="1.8"/></symbol>
    <symbol id="i-search" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="m20 20-4-4" stroke="currentColor" stroke-width="1.8"/></symbol>
    <symbol id="i-pin" viewBox="0 0 24 24"><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><circle cx="12" cy="10" r="2.5" fill="none" stroke="currentColor" stroke-width="1.8"/></symbol>
    <symbol id="i-chat" viewBox="0 0 24 24"><path d="M4 5h16v11H9l-5 4z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M8 9.5h8M8 12.5h5" stroke="currentColor" stroke-width="1.8"/></symbol>
    <symbol id="i-mobile" viewBox="0 0 24 24"><rect x="6.5" y="2.5" width="11" height="19" rx="2.2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M10.5 18.5h3" stroke="currentColor" stroke-width="1.8"/></symbol>
    <symbol id="i-doc" viewBox="0 0 24 24"><path d="M6 3h9l4 4v14H6zM14 3v5h5M9 12h7M9 16h5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></symbol>
    <symbol id="i-page" viewBox="0 0 24 24"><rect x="4" y="3" width="16" height="18" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M8 8h8M8 12h8M8 16h5" stroke="currentColor" stroke-width="1.8"/></symbol>
    <symbol id="i-site" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M3 9h18" stroke="currentColor" stroke-width="1.8"/><circle cx="6.5" cy="6.5" r=".9" fill="currentColor"/><circle cx="9.3" cy="6.5" r=".9" fill="currentColor"/></symbol>
    <symbol id="i-calendar" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M3 10h18M8 3v4M16 3v4" stroke="currentColor" stroke-width="1.8"/><path d="m9 15 2 2 4-4" fill="none" stroke="currentColor" stroke-width="1.8"/></symbol>
    <symbol id="i-bag" viewBox="0 0 24 24"><path d="M5 8h14l-1 13H6zM9 8V6a3 3 0 0 1 6 0v2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></symbol>
    <symbol id="i-bolt" viewBox="0 0 24 24"><path d="M13 2 4 14h7l-1 8 9-12h-7z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></symbol>
  </svg>`;

function topbar(current) {
  const nav = NAV.map(n => `<a href="${n.href}"${n.key === current ? ' aria-current="page"' : ''}>${n.label}</a>`).join('\n        ');
  return `
  <header class="topbar">
    <div class="topbar__inner">
      <a class="brand" href="/"${current === 'home' ? ' aria-current="page"' : ''}><img class="brand__logo" src="/assets/img/logo.svg" alt="" width="30" height="30"><span class="brand__txt"><span class="brand__name">${esc(NAME)}</span><span class="brand__job">${JOB}</span></span></a>
      <nav class="nav" id="site-nav" aria-label="Pages du site">
        ${nav}
        <a class="nav__extra" href="/aventure" data-switch-adventure>${icon('gamepad')}Mode aventure</a>
      </nav>
      <div class="topbar__actions">
        <button type="button" class="icon-btn" data-theme-toggle aria-pressed="false" aria-label="Changer de thème">
          ${icon('sun', 'ico ico--sun')}
          ${icon('moon', 'ico ico--moon')}
        </button>
        <a class="btn btn--cta btn--sm topbar__cta" href="/devis"${current === 'devis' ? ' aria-current="page"' : ''}>Demander un devis</a>
        <button type="button" class="icon-btn nav-toggle" aria-controls="site-nav" aria-expanded="false" aria-label="Ouvrir le menu">
          ${icon('menu')}
        </button>
      </div>
    </div>
  </header>`;
}

// Barre fixe en bas de l'écran sur téléphone : les trois gestes qui
// comptent. Masquée sur ordinateur (le devis est dans la barre du haut).
function callbar(current) {
  return `
  <nav class="callbar" aria-label="Me contacter">
    <a class="callbar__a" href="${TEL_HREF}">${icon('phone')}<span>Appeler</span></a>
    <a class="callbar__a" href="${esc(WA_HREF)}" target="_blank" rel="noopener">${icon('whatsapp')}<span>WhatsApp</span></a>
    <a class="callbar__a callbar__a--cta" href="/devis"${current === 'devis' ? ' aria-current="page"' : ''}>${icon('doc')}<span>Devis<span class="callbar__long"> gratuit</span></span></a>
  </nav>`;
}

function footer() {
  const socials = [
    { href: IG_URL, ic: 'instagram', label: `Instagram ${IG_HANDLE}` },
    TIKTOK && { href: TIKTOK, ic: 'tiktok', label: 'TikTok' },
    { href: LINKEDIN, ic: 'linkedin', label: 'LinkedIn' },
    { href: GITHUB, ic: 'github', label: 'GitHub' },
  ].filter(Boolean);
  return `
  <div class="wrap review-slot" data-review-slot hidden></div>
  <footer class="foot">
    <div class="wrap foot__grid">
      <div class="foot__id">
        <a class="brand" href="/"><img class="brand__logo" src="/assets/img/logo.svg" alt="" width="30" height="30" loading="lazy"><span class="brand__txt"><span class="brand__name">${esc(NAME)}</span><span class="brand__job">${JOB} · ${AREA}</span></span></a>
        <p>Des sites et des outils pour les commerces, artisans et indépendants d’${AREA}.</p>
        <ul class="foot__socials" aria-label="Réseaux">${socials.map(s => `
          <li><a class="icon-btn" href="${esc(s.href)}" target="_blank" rel="noopener" aria-label="${esc(s.label)}" title="${esc(s.label)}">${icon(s.ic)}</a></li>`).join('')}
        </ul>
      </div>
      <nav class="foot__col" aria-label="Pages">
        <p class="foot__t">Pages</p>
        <a href="/realisations">Réalisations</a>
        <a href="/tarifs">Tarifs</a>
        <a href="/a-propos">À propos</a>
        <a href="/contact">Contact</a>
        <a href="/devis">Demander un devis</a>
      </nav>
      <div class="foot__col foot__col--wide">
        <p class="foot__t">Contact</p>
        <a href="${TEL_HREF}">${esc(TEL_LOCAL)}</a>
        <a href="${esc(WA_HREF)}" target="_blank" rel="noopener">WhatsApp</a>
        <a href="${MAIL_HREF}">${esc(contact.email)}</a>
        <a href="${esc(IG_URL)}" target="_blank" rel="noopener">Instagram ${esc(IG_HANDLE)}</a>
      </div>
      <nav class="foot__col" aria-label="Plus">
        <p class="foot__t">Plus</p>
        <a href="/aventure" data-switch-adventure>Mode aventure</a>
        <a href="${CV_URL}" target="_blank" rel="noopener">CV (PDF)</a>
        <a href="/avis" data-review-entry hidden>Avis Google</a>
        <a href="/mentions-legales">Mentions légales</a>
        <a href="/confidentialite">Confidentialité</a>
        <a href="#cookies" role="button" data-consent-open>Cookies</a>
      </nav>
    </div>
    <div class="wrap foot__legal">
      <p>© ${new Date().getFullYear()} ${esc(NAME)} · Entrepreneur individuel · SIRET ${esc(biz.siret)} · ${esc(biz.vat)} · ${PRO_ONLY}</p>
    </div>
  </footer>`;
}

// ── JSON-LD ────────────────────────────────────────────
const BUSINESS_ID = `${SITE_URL}#business`;
const PERSON_ID   = `${SITE_URL}#person`;
const WEBSITE_ID  = `${SITE_URL}#website`;
// Pas de vente aux particuliers (choix d'Arphan, 30/10/2026) : pas de
// médiateur de la consommation à désigner.
const PRO_ONLY = 'Prestations réservées aux professionnels';
const PRO_WHO = 'commerces, artisans, indépendants, entreprises et associations';
const SAME_AS = [IG_URL, LINKEDIN, GITHUB, TIKTOK, GOOGLE_PROFILE].filter(Boolean);

function clean(v) {
  if (Array.isArray(v)) return v.map(clean).filter(x => x != null);
  if (v && typeof v === 'object') {
    const o = {};
    for (const [k, x] of Object.entries(v)) { const c = clean(x); if (c != null) o[k] = c; }
    return Object.keys(o).length ? o : undefined;
  }
  return v === '' || v == null ? undefined : v;
}
const website = () => ({
  '@type': 'WebSite', '@id': WEBSITE_ID, name: NAME, url: SITE_URL, inLanguage: 'fr',
  publisher: { '@id': BUSINESS_ID },
});
const business = () => ({
  '@type': 'ProfessionalService',
  '@id': BUSINESS_ID,
  name: `${NAME} · ${JOB}`,
  alternateName: NAME,
  description: `${JOB} en ${AREA} : sites vitrines, landing pages, réservation en ligne, boutiques Shopify, fiches Google et automatisations pour les commerces, artisans et indépendants.`,
  url: SITE_URL,
  image: `${SITE_URL}assets/img/og.jpg`,
  logo: `${SITE_URL}assets/img/logo-1024.png`,
  telephone: TEL_INTL,
  email: contact.email,
  address: { '@type': 'PostalAddress', streetAddress: biz.street, postalCode: biz.postalCode, addressLocality: biz.city, addressRegion: AREA, addressCountry: 'FR' },
  areaServed: { '@type': 'AdministrativeArea', name: AREA },
  audience: { '@type': 'BusinessAudience', name: `Professionnels : ${PRO_WHO}` },
  priceRange: biz.priceRange,
  founder: { '@id': PERSON_ID },
  sameAs: SAME_AS,
});
const person = () => ({
  '@type': 'Person', '@id': PERSON_ID, name: NAME, jobTitle: JOB, url: `${SITE_URL}a-propos`,
  image: PHOTO ? SITE_URL + PHOTO.slice(1) : undefined,
  sameAs: [IG_URL, LINKEDIN, GITHUB, TIKTOK].filter(Boolean),
  knowsLanguage: bio.languages.map(l => l.label),
  alumniOf: { '@type': 'CollegeOrUniversity', name: 'ETNA' },
});
function graph(page, node, extra = []) {
  const url = SITE_URL + page.path;
  const crumbs = page.crumbs || [];
  return clean({
    '@context': 'https://schema.org',
    '@graph': [
      website(), business(), person(),
      { '@id': `${url}#page`, url, name: page.title, inLanguage: 'fr', isPartOf: { '@id': WEBSITE_ID },
        about: { '@id': BUSINESS_ID },
        ...(crumbs.length ? { breadcrumb: { '@id': `${url}#breadcrumb` } } : {}), '@type': 'WebPage', ...node },
      ...(crumbs.length ? [{
        '@type': 'BreadcrumbList', '@id': `${url}#breadcrumb`,
        itemListElement: [{ name: 'Accueil', path: '' }, ...crumbs].map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: SITE_URL + c.path })),
      }] : []),
      ...extra,
    ],
  });
}
const ld = (data) => `\n  <script type="application/ld+json">\n${JSON.stringify(data, null, 2).replace(/</g, '\\u003c')}\n  </script>`;

// ── Gabarit ────────────────────────────────────────────
// page : { key, path, file, title, description, crumbs?, robots? }
function shell(page, { main, jsonld = null, css = [], scripts = [], keepMode = false, bodyClass = '' }) {
  const url = SITE_URL + page.path;
  const robots = page.robots || 'index, follow';
  return `<!DOCTYPE html>
<!-- GÉNÉRÉ par scripts/build-site.mjs, ne pas éditer : npm run content -->
<html lang="fr" data-theme="night">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <title>${esc(page.title)}</title>
  <meta name="description" content="${esc(page.description)}">
  <meta name="robots" content="${robots}">${page.key === '404' ? '' : `
  <link rel="canonical" href="${url}">`}
  <meta property="og:type" content="website">
  <meta property="og:locale" content="fr_FR">
  <meta property="og:site_name" content="${esc(NAME)} · ${JOB}">
  <meta property="og:title" content="${esc(page.ogTitle || page.title)}">
  <meta property="og:description" content="${esc(page.description)}">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="${SITE_URL}assets/img/og.jpg">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="${esc(NAME)}, ${JOB} en ${AREA} : des sites et des outils qui vous amènent des clients">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(page.ogTitle || page.title)}">
  <meta name="twitter:description" content="${esc(page.description)}">
  <meta name="twitter:image" content="${SITE_URL}assets/img/og.jpg">
  <meta name="theme-color" content="#070c14">${page.head || ''}
  <script src="/js/theme.js"></script>
  <link rel="icon" href="/assets/img/favicon.png" sizes="96x96">
  <link rel="icon" href="/assets/img/favicon.svg" type="image/svg+xml">
  <link rel="apple-touch-icon" href="/assets/img/apple-touch-icon.png">
  <link rel="stylesheet" href="/css/site.css">
  <link rel="stylesheet" href="/css/vitrine.css">${css.map(c => `\n  <link rel="stylesheet" href="${c}">`).join('')}${jsonld ? ld(jsonld) : ''}
</head>
<body class="${['p-' + page.key, bodyClass].filter(Boolean).join(' ')}"${keepMode ? ' data-keep-mode' : ''}>${SPRITE}

  <a class="skip" href="#main">Aller au contenu</a>
${topbar(page.key)}

  <main id="main" tabindex="-1">${main}
  </main>
${footer()}
${callbar(page.key)}

  <script src="/js/deeplink.js"></script>${scripts.map(s => `\n  <script src="${s}"></script>`).join('')}
  <script src="/js/site.js" defer></script>
  <script src="/js/reviews.js" defer></script>
  <script src="/js/consent.js" defer></script>
  <script src="/js/analytics.js" defer></script>
  <script src="/js/analytics-events.js" defer></script>
</body>
</html>
`;
}

// En-tête de page (pages intérieures)
const pageHead = (kicker, title, lead = '', extra = '') => `
    <header class="phead wrap">
      ${kicker ? `<p class="kicker">${kicker}</p>` : ''}
      <h1 class="phead__t">${title}</h1>
      ${lead ? `<p class="phead__lead">${lead}</p>` : ''}${extra}
    </header>`;

// ── Blocs partagés ─────────────────────────────────────
function offerCard(o, { level = 'h3' } = {}) {
  return `
          <li class="offer" id="offre-${o.id}">
            <span class="offer__ico">${icon(o.icon)}</span>
            <${level} class="offer__t">${esc(o.title)}</${level}>
            <p class="offer__price price">${priceHtml(o.svc)}</p>
            <p class="offer__pitch">${esc(o.pitch)}</p>
            <ul class="offer__inc" aria-label="Compris">${o.includes.map(i => `<li>${icon('check')}${esc(i)}</li>`).join('')}</ul>
            <a class="text-link offer__go" href="/devis">Demander un devis${icon('arrow')}</a>
          </li>`;
}
const offerGrid = (level) => `
        <ul class="offers">${offers.map(o => offerCard(o, { level })).join('')}
        </ul>`;
const vatNote = `Prix nets : ${biz.vat}. Le prix final dépend de votre projet, il est fixé dans le devis avant de commencer.`;

function caseCard(p, { level = 'h3', eager = false } = {}) {
  const c = caseOf(p);
  const link = linkOf(p);
  return `
          <li class="case" data-kind="${c.kind}">
            <a class="case__media" href="${projectUrl(p)}" tabindex="-1" aria-hidden="true">
              ${mockup(p, { eager })}
            </a>
            <div class="case__body">
              <p class="tags"><span class="tag tag--kind">${esc(c.label)}</span><span class="tag">${esc(c.frame)}</span></p>
              <${level} class="case__t"><a href="${projectUrl(p)}">${esc(p.title)}</a></${level}>
              <dl class="case__dl">
                <div><dt>Le besoin</dt><dd>${esc(c.need)}</dd></div>
                <div><dt>Ce que j’ai fait</dt><dd>${esc(c.did)}</dd></div>
                <div><dt>Ce que ça permet</dt><dd>${esc(c.result)}</dd></div>
              </dl>
              <p class="case__links"><a class="btn btn--sm" href="${projectUrl(p)}">Voir le projet${icon('arrow')}</a>${link ? ext(link.url, link.label, 'btn btn--sm btn--ghost') : ''}</p>
            </div>
          </li>`;
}

function smallCard(p) {
  const c = caseOf(p);
  const cover = coverOf(p);
  return `
          <li class="mini" data-kind="${c.kind}">
            <a class="mini__a" href="${projectUrl(p)}">
              <span class="mini__img${p.device === 'mobile' ? ' mini__img--phone' : ''}">${cover
                ? `<img src="${cover.src}" alt="" width="${cover.size.w}" height="${cover.size.h}" loading="lazy" decoding="async">`
                : `<span class="mini__ph" aria-hidden="true">${esc(p.title)}</span>`}</span>
              <span class="tags"><span class="tag tag--kind">${esc(c.label)}</span><span class="tag">${esc(c.frame)}</span></span>
              <span class="mini__t">${esc(p.title)}</span>
              <span class="mini__d">${esc(c.result)}</span>
            </a>
          </li>`;
}

const contactWays = () => [
  { key: 'phone', ic: 'phone', label: 'Téléphone', value: TEL_LOCAL, href: TEL_HREF, hint: 'Appelez-moi directement' },
  { key: 'whatsapp', ic: 'whatsapp', label: 'WhatsApp', value: TEL_LOCAL, href: WA_HREF, ext: true, hint: 'Un message, je vous réponds' },
  { key: 'instagram', ic: 'instagram', label: 'Instagram', value: IG_HANDLE, href: IG_URL, ext: true, hint: 'Écrivez-moi en message privé' },
  { key: 'mail', ic: 'mail', label: 'E-mail', value: contact.email, href: MAIL_HREF, hint: 'Pour un message détaillé' },
  { key: 'linkedin', ic: 'linkedin', label: 'LinkedIn', value: 'arphan-drame', href: LINKEDIN, ext: true, hint: 'Mon profil professionnel' },
  TIKTOK && { key: 'tiktok', ic: 'tiktok', label: 'TikTok', value: 'Mes vidéos', href: TIKTOK, ext: true, hint: 'Mes vidéos' },
].filter(Boolean);
const wayCard = (w) => `
          <li><a class="way way--${w.key}" href="${esc(w.href)}"${w.ext ? ' target="_blank" rel="noopener"' : ''}>
            <span class="way__ico">${icon(w.ic)}</span>
            <span class="way__txt"><span class="way__l">${esc(w.label)}</span><span class="way__v">${esc(w.value)}</span></span>
            ${icon('arrow', 'ico way__go')}
          </a></li>`;

// ══════════════════════════════════════════════════════
// ACCUEIL
// ══════════════════════════════════════════════════════
const PROBLEMS = [
  { ic: 'pin', t: 'Vous n’êtes pas sur Google Maps',
    d: 'Quand on cherche votre métier près de chez vous, ce sont vos concurrents qui apparaissent. Je crée ou je complète votre fiche Google.',
    sol: offer('fiche-google').title, svc: offer('fiche-google').svc, href: '/tarifs#offre-fiche-google' },
  { ic: 'chat', t: 'Vos rendez-vous se prennent par DM',
    d: 'Vous répondez aux messages un par un, à toute heure. Avec la réservation en ligne, vos clients choisissent seuls un créneau libre.',
    sol: offer('reservation').title, svc: offer('reservation').svc, href: '/tarifs#offre-reservation' },
  { ic: 'mobile', t: 'Votre site est lent ou vieillot sur téléphone',
    d: 'Vos clients vous découvrent souvent sur leur téléphone. Je refais votre site pour qu’il soit rapide, clair et donne confiance.',
    sol: 'Refonte de site', svc: refonte, href: `/tarifs#${svcId(refonte)}` },
  { ic: 'doc', t: 'Vous faites vos devis à la main',
    d: 'Recopier les mêmes informations dans Word prend du temps. J’automatise vos devis, vos relances ou vos tableaux.',
    sol: offer('automatisation').title, svc: offer('automatisation').svc, href: '/tarifs#offre-automatisation' },
  { ic: 'instagram', t: 'Votre activité n’existe que sur Instagram',
    d: 'Sans site, Google ne vous trouve pas et vous dépendez d’un réseau social. Une page à vous rassemble votre offre et vos contacts.',
    sol: offer('landing-page').title, svc: offer('landing-page').svc, href: '/tarifs#offre-landing-page' },
];

const PROCESS = [
  { t: 'Premier échange gratuit', d: 'Vous m’expliquez votre activité et votre besoin, par téléphone, WhatsApp ou message. Je vous réponds sous 48 h.' },
  { t: 'Devis et maquette', d: 'Je vous envoie un devis clair, puis une maquette pour voir le résultat avant de commencer.' },
  { t: 'Réalisation', d: 'Je construis votre site ou votre outil et je vous montre l’avancement. Vous validez à chaque étape.' },
  { t: 'Mise en ligne et suivi', d: 'Votre site est en ligne. Je vous montre comment l’utiliser et je reste joignable pour la suite.' },
];

// FAQ : prix lus dans la grille. Engagements validés avec Arphan le
// 30/10/2026 (délais : « environ une semaine » landing / vitrine).
const FAQ = [
  { q: 'Combien ça coûte ?',
    a: `Ça dépend de votre besoin. Une fiche Google commence à ${offer('fiche-google').svc.price}, une landing page à ${offer('landing-page').svc.price}, un site vitrine à ${offer('site-vitrine').svc.price}. Après un premier échange gratuit, je vous envoie un devis détaillé : le prix est fixé avant de commencer. Le nom de domaine et l’hébergement ont un petit coût annuel, indiqué dans le devis. Je suis en micro-entreprise : TVA non applicable, le prix affiché est celui que vous payez.` },
  { q: 'Combien de temps ça prend ?',
    a: 'Comptez environ une semaine pour une landing page ou un site vitrine, à partir du moment où j’ai vos textes et vos photos. Pour un projet plus grand (réservation, boutique, outil sur mesure), le délai est indiqué dans le devis.' },
  { q: 'Travaillez-vous avec les particuliers ?',
    a: `Non. Mes prestations sont réservées aux professionnels : ${PRO_WHO}.` },
  { q: 'Je n’y connais rien, c’est un problème ?',
    a: 'Pas du tout. Je m’occupe de la technique : nom de domaine, hébergement, mise en ligne. Je vous explique chaque étape simplement, sans jargon, et à la livraison je vous montre comment utiliser votre site.' },
  { q: 'Est-ce que le site m’appartient ?',
    a: 'Oui. Une fois la facture réglée, le site est à vous : le nom de domaine est enregistré à votre nom et je vous transmets les accès. Vous restez libre de changer de prestataire.' },
  { q: 'Comment se passe le paiement ?',
    a: 'Un acompte de 30 % à la signature du devis, le solde à la mise en ligne. Le paiement se fait par virement.' },
  { q: 'Et après la mise en ligne ?',
    a: `Je reste joignable. Si un défaut lié à mon travail apparaît dans le mois qui suit la mise en ligne, je le corrige sans frais. Ensuite, vous pouvez choisir un suivi mensuel (${priceText(maintenance)} : mises à jour, correctifs, petites évolutions) ou faire appel à moi seulement quand vous en avez besoin (${priceText(depannage)}).` },
];

function homePage() {
  const page = {
    key: 'home', path: '', file: 'index.html',
    title: `${JOB} en ${AREA} · ${NAME}`,
    ogTitle: `${NAME} · ${JOB} · ${AREA}`,
    description: `Sites vitrines, réservation en ligne, fiche Google, boutique Shopify : des sites et des outils qui amènent des clients aux commerces, artisans et indépendants d’${AREA}. Devis gratuit.`,
    // Anciens liens (#projets/skywalk… de l'ancien mode classique et du mode
    // aventure) : renvoyés vers la bonne page avant tout affichage.
    head: `
  <script>
    (function (h) {
      var m = /^#(profil|parcours|projets|contact|portail|competences|formation|services)(?:\\/(.+))?$/.exec(h);
      if (!m) return;
      var to = { profil: '/a-propos', parcours: '/a-propos#parcours', competences: '/a-propos', formation: '/a-propos#parcours',
        contact: '/contact', portail: '/devis', services: '/tarifs', projets: m[2] ? '/realisations/' + m[2] : '/realisations' }[m[1]];
      location.replace(to);
    })(location.hash);
  </script>`,
  };
  const wk = projects.find(p => p.slug === 'wild-kedougou');
  const isl = projects.find(p => p.slug === 'islaah');
  const heroShot = shotsOf(wk)[0], heroCover = coverOf(wk), phoneShot = shotsOf(isl)[0];

  const main = `
    <section class="hero" aria-labelledby="hero-t">
      <div class="wrap hero__grid">
        <div class="hero__txt">
          <h1 id="hero-t" class="hero__h1">
            <span class="hero__kicker">${JOB} · ${AREA}</span>
            <span class="hero__title">Des sites et des outils qui vous amènent <em>des clients</em></span>
          </h1>
          <p class="hero__lead">Pour les commerces, artisans et indépendants d’${AREA}. Je vous aide à être trouvé sur Google, à recevoir des réservations en ligne et à gagner du temps sur vos tâches.</p>
          <div class="hero__cta">
            <a class="btn btn--cta btn--lg" href="/devis">Demander un devis gratuit${icon('arrow')}</a>
            <a class="btn btn--lg" href="#contact">${icon('phone')}M’appeler / WhatsApp</a>
          </div>
          <p class="hero__trust">${icon('check')}Diagnostic gratuit en 48 h · ${AREA}</p>
        </div>
        <div class="hero__vis" aria-hidden="true">
          <figure class="mock mock--browser hero__browser">
            <div class="mock__bar"><i></i><i></i><i></i><span>wild-kedougou-experience</span></div>
            <img src="${heroShot.src}" srcset="${heroCover.src} ${heroCover.size.w}w, ${heroShot.src} ${heroShot.size.w}w" sizes="(max-width: 900px) 88vw, 560px" alt="" width="${heroShot.size.w}" height="${heroShot.size.h}" decoding="async">
          </figure>
          <figure class="mock mock--phone hero__phone"><img src="${phoneShot.src}" alt="" width="${phoneShot.size.w}" height="${phoneShot.size.h}" decoding="async"></figure>
        </div>
      </div>
    </section>

    <section class="sec" aria-labelledby="pb-t">
      <div class="wrap">
        <header class="sec__head">
          <p class="kicker">Ce que je règle pour vous</p>
          <h2 class="sec__t" id="pb-t">Vous vous reconnaissez ?</h2>
        </header>
        <ul class="problems">${PROBLEMS.map(p => `
          <li class="problem">
            <span class="problem__ico">${icon(p.ic)}</span>
            <h3 class="problem__t">${esc(p.t)}</h3>
            <p class="problem__d">${esc(p.d)}</p>
            <p class="problem__sol"><span>${esc(p.sol)}</span><a class="price" href="${p.href}">${priceHtml(p.svc)}${icon('arrow', 'ico ico--xs')}</a></p>
          </li>`).join('')}
          <li class="problem problem--cta">
            <h3 class="problem__t">Autre chose ?</h3>
            <p class="problem__d">Dites-moi ce qui vous fait perdre du temps ou des clients. On en parle, c’est gratuit.</p>
            <p><a class="btn btn--cta btn--sm" href="/devis">Demander un devis gratuit${icon('arrow')}</a></p>
          </li>
        </ul>
      </div>
    </section>

    <section class="sec sec--alt" aria-labelledby="of-t">
      <div class="wrap">
        <header class="sec__head">
          <p class="kicker">Offres</p>
          <h2 class="sec__t" id="of-t">Mes offres principales</h2>
          <p class="sec__lead">Des prix clairs, affichés « à partir de ». Ce qui est compris est écrit noir sur blanc.</p>
        </header>${offerGrid('h3')}
        <p class="sec__more"><a class="btn" href="/tarifs">Voir la grille complète des tarifs${icon('arrow')}</a><span class="note">${esc(vatNote)}</span></p>
      </div>
    </section>

    <section class="sec" aria-labelledby="re-t">
      <div class="wrap">
        <header class="sec__head">
          <p class="kicker">Réalisations</p>
          <h2 class="sec__t" id="re-t">Ce que j’ai déjà construit</h2>
          <p class="sec__lead">Un site de réservation, des applications publiées sur l’App Store, un outil de gestion d’entreprise : chaque projet expliqué simplement.</p>
        </header>
        <ul class="cases">${featured.map(p => caseCard(p)).join('')}
        </ul>
        <p class="sec__more"><a class="btn" href="/realisations">Voir toutes les réalisations${icon('arrow')}</a></p>
      </div>
    </section>

    <section class="sec sec--alt" aria-labelledby="pr-t">
      <div class="wrap">
        <header class="sec__head">
          <p class="kicker">Méthode</p>
          <h2 class="sec__t" id="pr-t">Comment ça se passe</h2>
        </header>
        <ol class="process">${PROCESS.map((s, i) => `
          <li class="process__s"><span class="process__n">${i + 1}</span><h3 class="process__t">${esc(s.t)}</h3><p>${esc(s.d)}</p></li>`).join('')}
        </ol>
      </div>
    </section>

    <section class="sec" aria-labelledby="me-t">
      <div class="wrap about">
        ${PHOTO ? `<img class="about__photo" src="${PHOTO}" alt="${esc(NAME)}" width="320" height="320" loading="lazy" decoding="async">` : ''}
        <div class="about__txt">
          <p class="kicker">Qui je suis</p>
          <h2 class="sec__t" id="me-t">Arphan, développeur web à votre écoute</h2>
          <p>Je m’appelle ${esc(NAME)}, développeur web freelance en ${AREA}. J’ai passé près de 3 ans en entreprise, chez DevPhantom, à créer en équipe des plateformes web et des applications mobiles. J’ai aussi publié seul une application sur l’App Store.</p>
          <p>Aujourd’hui, je mets cette expérience au service des commerces, artisans et indépendants : des outils simples, expliqués sans jargon, qui vous amènent des clients et vous font gagner du temps.</p>
          <ul class="facts">
            <li>${icon('pin')}${AREA}</li>
            <li>${icon('check')}Près de 3 ans en entreprise</li>
            <li>${icon('mobile')}Applications publiées sur l’App Store</li>
          </ul>
          <p><a class="text-link" href="/a-propos">En savoir plus sur mon parcours${icon('arrow')}</a></p>
        </div>
        <aside class="adv" aria-labelledby="adv-t">
          <span class="adv__ico">${icon('gamepad')}</span>
          <div>
            <h3 class="adv__t" id="adv-t">Découvrez mon univers en mode aventure</h3>
            <p>Un petit jeu dans le navigateur : vous explorez une ville et découvrez mon parcours et mes projets. Son conseillé, environ 5 minutes.</p>
          </div>
          <a class="btn btn--sm" href="/aventure" data-switch-adventure>Lancer le mode aventure${icon('arrow')}</a>
        </aside>
      </div>
    </section>

    <section class="sec sec--alt" aria-labelledby="faq-t">
      <div class="wrap faq-wrap">
        <header class="sec__head">
          <p class="kicker">Questions</p>
          <h2 class="sec__t" id="faq-t">Questions fréquentes</h2>
        </header>
        <div class="faq">${FAQ.map(f => `
          <details class="faq__i">
            <summary><h3>${esc(f.q)}</h3>${icon('chevron', 'ico faq__chev')}</summary>
            <p>${esc(f.a)}</p>
          </details>`).join('')}
        </div>
      </div>
    </section>

    <section class="sec cta" id="contact" aria-labelledby="ct-t">
      <div class="wrap cta__in">
        <p class="kicker">Contact</p>
        <h2 class="sec__t" id="ct-t">Parlons de votre projet</h2>
        <p class="sec__lead">Un premier échange gratuit et sans engagement. Choisissez le moyen le plus simple pour vous.</p>
        <p class="cta__main"><a class="btn btn--cta btn--lg" href="/devis">Demander un devis gratuit${icon('arrow')}</a></p>
        <ul class="ways">${contactWays().slice(0, 4).map(wayCard).join('')}
        </ul>
      </div>
    </section>`;

  const jsonld = graph(page, { name: page.title, description: page.description }, [{
    '@type': 'FAQPage', '@id': `${SITE_URL}#faq`,
    mainEntity: FAQ.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  }]);
  return [page, shell(page, { main, jsonld })];
}

// ══════════════════════════════════════════════════════
// RÉALISATIONS
// ══════════════════════════════════════════════════════
function realisationsPage() {
  const page = {
    key: 'realisations', path: 'realisations', file: 'realisations.html',
    title: `Réalisations · Sites, réservation et applications · ${NAME}`,
    description: `Projets réalisés par ${NAME}, ${JOB.toLowerCase()} en ${AREA} : site de réservation, applications publiées sur l’App Store, outils de gestion. Le besoin, ce que j’ai fait, ce que ça permet.`,
    crumbs: [{ name: 'Réalisations', path: 'realisations' }],
  };
  const used = Object.keys(KINDS).filter(k => projects.some(p => caseOf(p).kind === k));
  const main = `${pageHead('Réalisations', 'Ce que j’ai construit', 'Chaque projet expliqué simplement : le besoin, ce que j’ai fait, et ce que ça permet aujourd’hui.')}
    <div class="wrap">
      <div class="filters js-only" role="group" aria-label="Filtrer par type de projet">
        <button type="button" class="chip" data-filter="" aria-pressed="true">Tous</button>${used.map(k => `
        <button type="button" class="chip" data-filter="${k}" aria-pressed="false">${esc(KINDS[k])}</button>`).join('')}
      </div>
      <p class="sr-only" role="status" data-filter-status></p>

      <section class="block" aria-labelledby="une-t">
        <h2 class="block__t" id="une-t">À la une</h2>
        <ul class="cases">${featured.map(p => caseCard(p, { level: 'h3' })).join('')}
        </ul>
      </section>

      <section class="block" aria-labelledby="autres-t">
        <h2 class="block__t" id="autres-t">Autres projets</h2>
        <p class="block__lead">Projets d’entreprise réalisés en équipe, projets personnels et projet d’école.</p>
        <ul class="minis">${others.map(smallCard).join('')}
        </ul>
      </section>
      <p class="empty" data-filter-empty hidden>Pas encore de projet de ce type ici. <a class="text-link" href="/devis">Parlons du vôtre${icon('arrow')}</a></p>
    </div>
${ctaBand('Un projet du même genre ?', 'Expliquez-moi votre besoin : je vous dis gratuitement ce que je peux faire pour vous.')}`;
  const jsonld = graph(page, {
    '@type': 'CollectionPage', name: page.title, description: page.description,
    mainEntity: { '@type': 'ItemList', itemListElement: ordered.map((p, i) => ({
      '@type': 'ListItem', position: i + 1, url: SITE_URL + projectUrl(p).slice(1), name: p.title,
    })) },
  });
  return [page, shell(page, { main, jsonld })];
}

function ctaBand(title, text) {
  return `
    <section class="sec cta cta--band" aria-label="${esc(title)}">
      <div class="wrap cta__row">
        <div><h2 class="cta__t">${esc(title)}</h2><p>${esc(text)}</p></div>
        <p class="cta__btns"><a class="btn btn--cta" href="/devis">Demander un devis gratuit${icon('arrow')}</a><a class="btn" href="${esc(WA_HREF)}" target="_blank" rel="noopener">${icon('whatsapp')}WhatsApp</a></p>
      </div>
    </section>`;
}

function projectPage(p, i) {
  const c = caseOf(p);
  const page = {
    key: 'realisations', path: `realisations/${p.slug}`, file: `realisations/${p.slug}.html`,
    title: `${p.title} · ${c.label} · ${NAME}`,
    description: `${c.need} ${c.result}`.slice(0, 158).replace(/\s+\S*$/, '') + '…',
    crumbs: [{ name: 'Réalisations', path: 'realisations' }, { name: p.title, path: `realisations/${p.slug}` }],
  };
  const link = linkOf(p);
  const shots = shotsOf(p);
  const prev = ordered[(i - 1 + ordered.length) % ordered.length];
  const next = ordered[(i + 1) % ordered.length];
  const gallery = p.device === 'mobile'
    ? mockup(p, { eager: true, count: Math.min(3, shots.length) })
    : mockup(p, { eager: true, sizes: '(max-width: 900px) 92vw, 1000px' });
  const moreShots = p.device === 'mobile' ? shots.slice(3) : shots.slice(1);
  const main = `
    <article class="proj">
      <header class="phead wrap">
        <nav class="crumbs" aria-label="Fil d’Ariane"><a href="/realisations">${icon('back')}Réalisations</a></nav>
        <p class="tags"><span class="tag tag--kind">${esc(c.label)}</span><span class="tag">${esc(c.frame)}</span>${p.status ? `<span class="tag tag--wip">${esc(p.status)}</span>` : ''}</p>
        <h1 class="phead__t">${esc(p.title)}</h1>
        ${link ? `<p class="proj__links">${ext(link.url, link.label, 'btn btn--cta')}</p>` : ''}
      </header>
      <div class="wrap proj__media">${gallery}
      </div>
      <div class="wrap proj__grid">
        <section class="proj__s"><h2>Le besoin</h2><p>${esc(c.need)}</p></section>
        <section class="proj__s"><h2>Ce que j’ai fait</h2><p>${esc(c.did)}</p></section>
        <section class="proj__s"><h2>Ce que ça permet</h2><p>${esc(c.result)}</p></section>
      </div>${moreShots.length ? `
      <div class="wrap proj__more">
        <h2 class="block__t">Autres écrans</h2>
        <ul class="shots${p.device === 'mobile' ? ' shots--phone' : ''}">${moreShots.map(s => `
          <li><figure class="mock ${p.device === 'mobile' ? 'mock--phone' : 'mock--browser'}">${p.device === 'mobile' ? '' : '<div class="mock__bar" aria-hidden="true"><i></i><i></i><i></i></div>'}<img src="${s.src}" alt="" width="${s.size.w}" height="${s.size.h}" loading="lazy" decoding="async"></figure><figcaption>${esc(s.alt)}</figcaption></li>`).join('')}
        </ul>
      </div>` : ''}
      <div class="wrap proj__tech">
        <h2>Technologies utilisées</h2>
        <ul class="techs">${(p.tech || []).map(t => `<li>${esc(t)}</li>`).join('')}</ul>
      </div>
      <nav class="wrap proj__nav" aria-label="Autres projets">
        <a href="${projectUrl(prev)}">${icon('back')}<span><small>Projet précédent</small>${esc(prev.title)}</span></a>
        <a href="${projectUrl(next)}"><span><small>Projet suivant</small>${esc(next.title)}</span>${icon('arrow')}</a>
      </nav>
    </article>
${ctaBand('Un projet du même genre ?', 'Expliquez-moi votre besoin : je vous dis gratuitement ce que je peux faire pour vous.')}`;
  const jsonld = graph(page, { name: page.title, description: page.description, mainEntity: { '@id': `${SITE_URL}${page.path}#work` } }, [{
    '@type': 'CreativeWork', '@id': `${SITE_URL}${page.path}#work`, name: p.title, genre: c.label,
    description: `${c.need} ${c.result}`, creator: { '@id': PERSON_ID },
    image: shots[0] ? SITE_URL + shots[0].src.slice(1) : undefined,
    sameAs: link ? link.url : undefined, keywords: (p.tech || []).join(', '),
  }]);
  return [page, shell(page, { main, jsonld })];
}

// ══════════════════════════════════════════════════════
// TARIFS
// ══════════════════════════════════════════════════════
function tarifsPage() {
  const page = {
    key: 'tarifs', path: 'tarifs', file: 'tarifs.html',
    title: `Tarifs · Site vitrine, landing page, réservation · ${NAME}`,
    description: `Tarifs d’un ${JOB.toLowerCase()} en ${AREA} : fiche Google ${offer('fiche-google').svc.price}, landing page ${offer('landing-page').svc.price}, site vitrine ${offer('site-vitrine').svc.price}, réservation en ligne ${offer('reservation').svc.price}. Prix affichés, devis gratuit.`,
    crumbs: [{ name: 'Tarifs', path: 'tarifs' }],
  };
  const main_ = T.CATEGORIES.filter(c => !c.tech), tech = T.CATEGORIES.filter(c => c.tech);
  const inCat = (id) => {
    const list = T.SERVICES.filter(s => s.cats.includes(id));
    return list.filter(s => s.cats[0] === id).concat(list.filter(s => s.cats[0] !== id));
  };
  const catLabel = (id) => (T.CATEGORIES.find(c => c.id === id) || {}).label || '';
  const svcRow = (s, cat) => `
              <li class="svc-item" data-search="${esc([s.name, s.desc, s.kw, ...s.cats.map(catLabel)].join(' '))}">
                <details class="svc"${s.cats[0] === cat ? ` id="${svcId(s)}"` : ''}>
                  <summary class="svc__head"><span class="svc__name">${esc(s.name)}</span><span class="svc__price price">${priceHtml(s)}</span><span class="svc__chev" aria-hidden="true"></span></summary>
                  <p class="svc__desc">${esc(s.desc)}</p>
                </details>
              </li>`;
  const catBlock = (c) => `
          <section class="cat" id="${c.id}" aria-labelledby="cat-${c.id}">
            <h3 class="cat__t" id="cat-${c.id}">${esc(c.label)}<span>${esc(c.hint)}</span></h3>
            <ul class="svc-list">${inCat(c.id).map(s => svcRow(s, c.id)).join('')}
            </ul>
          </section>`;
  const main = `${pageHead('Tarifs', 'Tarifs : des prix clairs, affichés d’avance', 'Les prix sont « à partir de » : le prix final dépend de votre projet et il est fixé dans le devis, avant de commencer. Le premier échange est gratuit.')}
    <section class="wrap block" aria-labelledby="top-t">
      <h2 class="block__t" id="top-t">Les offres les plus demandées</h2>${offerGrid('h3')}
    </section>

    <section class="wrap" aria-label="Premier échange gratuit">
      <div class="free">
        <span class="free__ico">${icon('chat')}</span>
        <div class="free__txt">
          <h2 class="free__t">Premier échange gratuit</h2>
          <p>Vous ne savez pas ce qu’il vous faut ? Expliquez-moi votre activité : je vous conseille gratuitement, sans engagement.</p>
          <p class="free__note">${PRO_ONLY} : ${PRO_WHO}.</p>
        </div>
        <p class="free__btns"><a class="btn btn--cta" href="/devis">Demander un devis gratuit${icon('arrow')}</a><a class="btn" href="${esc(WA_HREF)}" target="_blank" rel="noopener">${icon('whatsapp')}WhatsApp</a></p>
      </div>
    </section>

    <section class="wrap block catalog" aria-labelledby="all-t">
      <h2 class="block__t" id="all-t">Toutes les prestations</h2>
      <p class="block__lead">${T.SERVICES.length} prestations, classées par besoin. Touchez une ligne pour voir le détail.</p>
      <div class="search js-only" role="search">
        ${icon('search', 'ico search__ico')}
        <label class="sr-only" for="tarifSearch">Rechercher une prestation</label>
        <input id="tarifSearch" class="search__input" type="search" inputmode="search" enterkeyhint="search" autocomplete="off" autocorrect="off" spellcheck="false" placeholder="Rechercher : site, boutique, réservation…">
        <button type="button" class="search__clear" id="tarifSearchClear" hidden>Effacer</button>
      </div>
      <p class="search__status" id="tarifStatus" role="status" aria-live="polite"></p>
      <div class="noresult" id="tarifNone" hidden>
        <p>Votre besoin est peut-être spécifique : parlons-en.</p>
        <p class="cta__btns"><a class="btn btn--cta" href="/devis">Demander un devis gratuit${icon('arrow')}</a><a class="btn" href="/contact">Me contacter</a></p>
      </div>
      <nav class="cat-nav" aria-label="Catégories">${T.CATEGORIES.map(c => `<a class="chip" href="#${c.id}">${esc(c.label)}</a>`).join('')}</nav>
      <div class="cats">${main_.map(catBlock).join('')}
      </div>
      <h2 class="block__t block__t--sub" id="tech-t">Projets techniques</h2>
      <p class="block__lead">Pour les entreprises qui ont déjà une équipe ou un logiciel : applications sur mesure, serveur, mise en production.</p>
      <div class="cats">${tech.map(catBlock).join('')}
      </div>
      <p class="note">${esc(vatNote)}</p>
    </section>
${ctaBand('Vous hésitez entre deux offres ?', 'Décrivez votre activité en quelques clics : je vous conseille la solution la plus simple pour votre budget.')}`;
  const jsonld = graph(page, { name: page.title, description: page.description }, [{
    '@type': 'OfferCatalog', '@id': `${SITE_URL}tarifs#catalogue`, name: 'Offres principales',
    itemListElement: offers.map(o => ({
      '@type': 'Offer', name: o.title, description: o.pitch, url: `${SITE_URL}tarifs#offre-${o.id}`,
      priceCurrency: 'EUR', price: String(euros(o.svc)),
      priceSpecification: { '@type': 'PriceSpecification', minPrice: euros(o.svc), priceCurrency: 'EUR' },
      itemOffered: { '@type': 'Service', name: o.svc.name, areaServed: AREA, provider: { '@id': BUSINESS_ID } },
    })),
  }]);
  return [page, shell(page, { main, jsonld, keepMode: true, scripts: ['/js/tarifs.js'] })];
}

// ══════════════════════════════════════════════════════
// À PROPOS
// ══════════════════════════════════════════════════════
function aproposPage() {
  const page = {
    key: 'a-propos', path: 'a-propos', file: 'a-propos.html',
    title: `À propos · ${NAME}, ${JOB.toLowerCase()} en ${AREA}`,
    description: `${NAME}, ${JOB.toLowerCase()} en ${AREA} : près de 3 ans en entreprise, des applications publiées sur l’App Store, et des sites pensés pour les commerces et indépendants.`,
    crumbs: [{ name: 'À propos', path: 'a-propos' }],
  };
  // Parcours : étapes datées, de la plus récente à la plus ancienne, plus
  // l'installation en freelance (avis SIRENE).
  const dated = steps.filter(s => /\d{4}/.test(s.date)).slice().reverse();
  const timeline = [
    { date: `depuis ${biz.since.slice(3)}`, title: `${JOB}, micro-entreprise`, place: AREA },
    ...dated.map(s => ({ date: s.date, title: s.title, place: s.slug === 'devphantom' ? 'DevPhantom, en équipe' : (s.place || '') })),
  ];
  const groups = profile.skillGroups.filter(g => !/IA/.test(g.label));
  const main = `
    <header class="phead wrap phead--about">
      ${PHOTO ? `<img class="about__photo" src="${PHOTO}" alt="${esc(NAME)}" width="320" height="320" fetchpriority="high" decoding="async">` : ''}
      <div>
        <p class="kicker">À propos</p>
        <h1 class="phead__t">${esc(NAME)}, ${JOB.toLowerCase()} en ${AREA}</h1>
        <p class="phead__lead">Je crée des sites et des outils simples pour les commerces, artisans et indépendants. Mon objectif : que vous trouviez plus de clients et que vous perdiez moins de temps.</p>
      </div>
    </header>
    <div class="wrap about-page">
      <section class="prose" aria-labelledby="qui-t">
        <h2 id="qui-t">Qui je suis</h2>
        <p>J’ai passé près de 3 ans en entreprise, en alternance chez DevPhantom, pendant mes études à l’ETNA. En équipe, j’y ai créé des plateformes web et des applications mobiles pour des entreprises : outils internes, plannings, rapports, applications publiées sur l’App Store.</p>
        <p>En parallèle, j’ai mené mes propres projets de bout en bout, seul : un site de réservation, une application iPhone publiée sur l’App Store, une application d’organisation installable sur téléphone.</p>
        <p>Depuis septembre 2026, je suis à mon compte en ${AREA}. Je travaille directement avec vous : vous avez un seul interlocuteur, qui vous explique les choses simplement et reste joignable après la mise en ligne.</p>
        <ul class="facts">
          <li>${icon('pin')}${AREA}</li>
          <li>${icon('check')}Près de 3 ans en entreprise</li>
          <li>${icon('mobile')}Applications publiées sur l’App Store</li>
          <li>${icon('chat')}${bio.languages.map(l => l.label).join(', ')}</li>
        </ul>
        <p class="about-page__cv"><a class="btn btn--sm" href="${CV_URL}" target="_blank" rel="noopener">${icon('download')}Télécharger mon CV (PDF)</a></p>
      </section>
      <section aria-labelledby="parcours" class="tl">
        <h2 id="parcours">Mon parcours</h2>
        <ol class="tl__list">${timeline.map(t => `
          <li><span class="tl__d">${esc(t.date)}</span><strong>${esc(t.title)}</strong>${t.place ? `<span class="tl__p">${esc(t.place)}</span>` : ''}</li>`).join('')}
        </ol>
      </section>
      <section aria-labelledby="tech-t" class="about-page__tech">
        <h2 id="tech-t">Pour les curieux : les technologies que j’utilise</h2>
        <p>Vous n’avez pas besoin de les connaître : je choisis l’outil adapté à votre projet.</p>
        <details class="more">
          <summary>Voir la liste${icon('chevron', 'ico faq__chev')}</summary>
          <dl class="techgroups">${groups.map(g => `
            <div><dt>${esc(g.label)}</dt><dd><ul class="techs">${g.items.map(i => `<li>${esc(i)}</li>`).join('')}</ul></dd></div>`).join('')}
          </dl>
        </details>
      </section>
      <aside class="adv" aria-labelledby="adv-t">
        <span class="adv__ico">${icon('gamepad')}</span>
        <div>
          <h2 class="adv__t" id="adv-t">Découvrez mon univers en mode aventure</h2>
          <p>Un petit jeu dans le navigateur : vous explorez une ville et découvrez mon parcours et mes projets. Son conseillé, environ 5 minutes.</p>
        </div>
        <a class="btn btn--sm" href="/aventure" data-switch-adventure>Lancer le mode aventure${icon('arrow')}</a>
      </aside>
    </div>
${ctaBand('On travaille ensemble ?', 'Racontez-moi votre activité et ce qui vous manque aujourd’hui. Le premier échange est gratuit.')}`;
  const jsonld = graph(page, { '@type': 'AboutPage', name: page.title, description: page.description, mainEntity: { '@id': PERSON_ID } });
  return [page, shell(page, { main, jsonld })];
}

// ══════════════════════════════════════════════════════
// CONTACT
// ══════════════════════════════════════════════════════
function contactPage() {
  const page = {
    key: 'contact', path: 'contact', file: 'contact.html',
    title: `Contact · Appel, WhatsApp, devis gratuit · ${NAME}`,
    description: `Contacter ${NAME}, ${JOB.toLowerCase()} en ${AREA} : téléphone ${TEL_LOCAL}, WhatsApp, Instagram ${IG_HANDLE}, e-mail ou formulaire. Premier échange gratuit.`,
    crumbs: [{ name: 'Contact', path: 'contact' }],
  };
  const main = `${pageHead('Contact', 'Parlons de votre projet', 'Un premier échange gratuit et sans engagement. Appelez, écrivez sur WhatsApp ou laissez un message : je vous réponds sous 48 h.')}
    <div class="wrap contact">
      <section aria-labelledby="ways-t">
        <h2 class="block__t" id="ways-t">Me joindre directement</h2>
        <ul class="ways ways--col">${contactWays().map(wayCard).join('')}
        </ul>
        <p class="contact__devis">Vous préférez décrire votre projet étape par étape ? <a class="text-link" href="/devis">Demander un devis${icon('arrow')}</a></p>
      </section>
      <section class="form-card" aria-labelledby="form-t">
        <h2 class="block__t" id="form-t">Envoyer un message</h2>
        <p class="form-card__lead">Quelques lignes suffisent. Je vous réponds par e-mail ou par téléphone.</p>
        <form class="cform" id="contact-form" action="${MAIL_HREF}" method="post" enctype="text/plain">
          <label class="field"><span>Nom</span><input type="text" name="from_name" autocomplete="name" placeholder="Prénom Nom" required></label>
          <label class="field"><span>E-mail</span><input type="email" name="from_email" autocomplete="email" placeholder="vous@exemple.fr" required></label>
          <label class="field"><span>Téléphone <small>(facultatif)</small></span><input type="tel" name="from_phone" autocomplete="tel" placeholder="06 12 34 56 78"></label>
          <label class="field"><span>Votre message</span><textarea name="message" rows="5" placeholder="Bonjour, j’ai un salon de coiffure et je voudrais…" required></textarea></label>
          <button type="submit" class="btn btn--cta">Envoyer${icon('arrow')}</button>
          <p class="cform__note">Vos coordonnées servent uniquement à vous répondre. <a href="/confidentialite">Confidentialité</a></p>
          <p class="form-status" role="status" aria-live="polite"></p>
        </form>
      </section>
    </div>`;
  const jsonld = graph(page, { '@type': 'ContactPage', name: page.title, description: page.description, mainEntity: { '@id': BUSINESS_ID } });
  return [page, shell(page, { main, jsonld, scripts: ['/js/contact-form.js'] })];
}

// ══════════════════════════════════════════════════════
// DEVIS, AVIS, 404 (contenu rendu par leurs scripts)
// ══════════════════════════════════════════════════════
function devisPage() {
  const page = {
    key: 'devis', path: 'devis', file: 'devis.html',
    title: `Demander un devis gratuit · ${NAME}, ${JOB.toLowerCase()}`,
    description: `Décrivez votre projet en quelques clics (type, besoin, budget) : ${NAME}, ${JOB.toLowerCase()} en ${AREA}, vous répond sous 48 h avec une proposition. Gratuit et sans engagement.`,
    crumbs: [{ name: 'Devis', path: 'devis' }],
  };
  const main = `
    <div class="wrap wizard">
      <div class="progress" id="progress">
        <span class="progress__label" id="progress-label">Étape 1 / 5</span>
        <span class="progress__track"><span class="progress__fill" id="progress-fill" style="width:20%"></span></span>
      </div>
      <div id="wizard" aria-live="polite">
        <noscript>
          <h1 class="step__title">Demander un devis</h1>
          <p class="step__help">Ce formulaire a besoin de JavaScript. Décrivez votre projet par e-mail à <a href="${MAIL_HREF}?subject=Demande%20de%20devis">${esc(contact.email)}</a>, ou appelez le <a href="${TEL_HREF}">${esc(TEL_LOCAL)}</a>.</p>
        </noscript>
      </div>
      <p class="wizard__alt">Plus simple pour vous ? <a href="${TEL_HREF}">Appelez le ${esc(TEL_LOCAL)}</a> ou <a href="${esc(WA_HREF)}" target="_blank" rel="noopener">écrivez sur WhatsApp</a>.</p>
    </div>`;
  return [page, shell(page, { main, jsonld: graph(page, { name: page.title, description: page.description }), keepMode: true, css: ['/css/annexe.css'], scripts: ['/js/contact-form.js', '/js/devis.js'] })];
}

function avisPage() {
  const page = {
    key: 'avis', path: 'avis', file: 'avis.html', robots: 'noindex, follow',
    title: `Donner votre avis · ${NAME}`,
    description: `Vous avez travaillé avec ${NAME} ? Partagez votre expérience sur Google.`,
  };
  const main = `
    <div class="wrap review-page">
      <section class="step done" data-review-page>
        <h1 class="step__title">Nous avons travaillé ensemble ?</h1>
        <p class="step__help">Merci pour votre confiance. Si vous le souhaitez, vous pouvez partager votre expérience sur Google : quelques lignes sincères, positives ou non, aident d’autres personnes à savoir à quoi s’attendre.</p>
        <p data-review-ready hidden><a class="btn btn--cta" data-review-go href="#">Donner mon avis sur Google</a></p>
        <p class="step__help" data-review-pending>Le lien vers Google sera bientôt disponible.</p>
        <p class="review-page__note">Le lien ouvre Google dans un nouvel onglet. Rien n’est demandé en échange, et rien ne vous y oblige.</p>
        <p class="review-page__note">Vous n’avez pas encore travaillé avec moi ? Cette page ne vous concerne pas : <a class="inline-link" href="/contact">écrivez-moi plutôt</a>.</p>
      </section>
    </div>`;
  return [page, shell(page, { main, keepMode: true, css: ['/css/annexe.css'] })];
}

function notFoundPage() {
  const page = {
    key: '404', path: '404', file: '404.html', robots: 'noindex',
    title: `Page introuvable · ${NAME}`,
    description: 'Cette page n’existe pas ou a changé d’adresse.',
  };
  const main = `
    <div class="wrap lost">
      <p class="lost__code" aria-hidden="true">404</p>
      <h1 class="phead__t">Cette page n’existe pas</h1>
      <p class="phead__lead">Elle a peut-être changé d’adresse. Voici les pages les plus utiles :</p>
      <p class="lost__btns"><a class="btn btn--cta" href="/">Accueil</a><a class="btn" href="/realisations">Réalisations</a><a class="btn" href="/tarifs">Tarifs</a><a class="btn" href="/contact">Contact</a></p>
    </div>`;
  return [page, shell(page, { main })];
}

// ══════════════════════════════════════════════════════
// MENTIONS LÉGALES, CONFIDENTIALITÉ
// ══════════════════════════════════════════════════════
const HOST = {
  name: 'Cloudflare, Inc.',
  address: '101 Townsend St, San Francisco, CA 94107, États-Unis',
  phone: '+1 888 993 5273',
  url: 'https://www.cloudflare.com',
};

function legalPage() {
  const page = {
    key: 'mentions-legales', path: 'mentions-legales', file: 'mentions-legales.html',
    title: `Mentions légales · ${NAME}`,
    description: `Mentions légales du site ${SITE_URL.replace(/^https:\/\/|\/$/g, '')} : éditeur, statut, SIRET, hébergeur.`,
    crumbs: [{ name: 'Mentions légales', path: 'mentions-legales' }],
  };
  const main = `${pageHead('', 'Mentions légales', `Dernière mise à jour : 30 octobre 2026.`)}
    <div class="wrap prose legal">
      <h2>Éditeur du site</h2>
      <dl class="legal__dl">
        <div><dt>Nom</dt><dd>${esc(biz.legalName)}</dd></div>
        <div><dt>Statut</dt><dd>${esc(biz.status)}</dd></div>
        <div><dt>SIREN</dt><dd>${esc(biz.siren)}</dd></div>
        <div><dt>SIRET</dt><dd>${esc(biz.siret)}</dd></div>
        <div><dt>Code APE</dt><dd>${esc(biz.ape)}</dd></div>
        <div><dt>Adresse</dt><dd>${biz.address.map(esc).join('<br>')}</dd></div>
        <div><dt>E-mail</dt><dd><a href="${MAIL_HREF}">${esc(contact.email)}</a></dd></div>
        <div><dt>Téléphone</dt><dd><a href="${TEL_HREF}">${esc(TEL_LOCAL)}</a></dd></div>
        <div><dt>TVA</dt><dd>${esc(biz.vat)}</dd></div>
        <div><dt>Directeur de la publication</dt><dd>${esc(biz.legalName)}</dd></div>
      </dl>
      <h2>Hébergement</h2>
      <p>${esc(HOST.name)}, ${esc(HOST.address)}. Téléphone : ${esc(HOST.phone)}. Site : <a href="${HOST.url}" target="_blank" rel="noopener">cloudflare.com</a>.</p>
      <h2>Propriété intellectuelle</h2>
      <p>Les textes, le logo et les illustrations de ce site appartiennent à ${esc(biz.legalName)}, sauf mention contraire. Toute reproduction sans accord écrit est interdite. Les noms et les captures des projets présentés restent la propriété de leurs titulaires respectifs.</p>
      <h2>Données personnelles et cookies</h2>
      <p>Voir la page <a href="/confidentialite">Confidentialité</a>. Vous pouvez modifier votre choix sur les cookies à tout moment : <a href="#cookies" role="button" data-consent-open>gérer les cookies</a>.</p>
      <h2>Clientèle</h2>
      <p>${PRO_ONLY} : ${PRO_WHO}. Je ne travaille pas avec les particuliers.</p>
    </div>`;
  return [page, shell(page, { main, jsonld: graph(page, { name: page.title, description: page.description }) })];
}

function privacyPage() {
  const page = {
    key: 'confidentialite', path: 'confidentialite', file: 'confidentialite.html',
    title: `Confidentialité et cookies · ${NAME}`,
    description: 'Quelles données le site traite (formulaires, mesure d’audience), pourquoi, combien de temps, et comment exercer vos droits.',
    crumbs: [{ name: 'Confidentialité', path: 'confidentialite' }],
  };
  const main = `${pageHead('', 'Confidentialité et cookies', 'Ce que le site fait de vos données, en clair. Dernière mise à jour : 30 octobre 2026.')}
    <div class="wrap prose legal">
      <h2>Qui est responsable de vos données</h2>
      <p>${esc(biz.legalName)}, ${esc(biz.status.toLowerCase())}, SIRET ${esc(biz.siret)}, ${biz.address.map(esc).join(', ')}. Contact : <a href="${MAIL_HREF}">${esc(contact.email)}</a>.</p>

      <h2>Les données traitées, et pourquoi</h2>
      <div class="table"><table>
        <thead><tr><th>Quand</th><th>Données</th><th>Pourquoi</th><th>Base légale</th><th>Durée</th></tr></thead>
        <tbody>
          <tr><td>Formulaire de contact</td><td>Nom, e-mail, téléphone (facultatif), message</td><td>Vous répondre</td><td>Mesures précontractuelles prises à votre demande</td><td>3 ans après notre dernier échange</td></tr>
          <tr><td>Demande de devis (formulaire ou mini-jeu)</td><td>Prénom, nom, e-mail, téléphone (facultatif), message, réponses aux questions (type de projet, besoin, budget…)</td><td>Étudier votre projet et vous faire une proposition</td><td>Mesures précontractuelles prises à votre demande</td><td>3 ans après notre dernier échange ; si vous devenez client, durée légale de conservation des documents comptables</td></tr>
          <tr><td>Mesure d’audience, seulement si vous l’acceptez</td><td>Pages vues, clics sur un moyen de contact, envoi d’un formulaire (jamais son contenu), identifiant de cookie, données techniques du navigateur</td><td>Savoir quelles pages sont utiles</td><td>Votre consentement</td><td>Cookies : 13 mois au plus. Données dans Google Analytics : 14 mois au plus</td></tr>
          <tr><td>Fonctionnement du site</td><td>Réglages enregistrés dans votre navigateur (voir plus bas)</td><td>Thème, brouillon de devis, progression du mode aventure, votre choix sur les cookies</td><td>Nécessaires au fonctionnement</td><td>Voir le tableau des cookies</td></tr>
        </tbody>
      </table></div>
      <p>Le contenu des formulaires n’est jamais envoyé à Google Analytics.</p>

      <h2>Qui reçoit ces données</h2>
      <ul>
        <li><strong>EmailJS</strong> (EmailJS Pte. Ltd., Singapour) : achemine les messages des formulaires jusqu’à ma boîte e-mail.</li>
        <li><strong>Google (Gmail)</strong> : ma messagerie, où les messages sont reçus et conservés.</li>
        <li><strong>Google Analytics</strong> (Google Ireland Ltd) : mesure d’audience, uniquement après votre accord.</li>
        <li><strong>Cloudflare</strong> : hébergement et distribution du site (adresse IP, journaux techniques).</li>
        <li><strong>jsDelivr</strong> : fournit le petit programme d’envoi des formulaires, chargé quand vous commencez à en remplir un.</li>
      </ul>
      <p>Certains de ces prestataires peuvent traiter des données hors de l’Union européenne, notamment aux États-Unis. Google et Cloudflare adhèrent au cadre de protection des données UE-États-Unis (Data Privacy Framework). Les serveurs d’EmailJS sont situés aux États-Unis : ce transfert est encadré par les clauses contractuelles types de la Commission européenne.</p>
      <p>Vos données ne sont ni vendues, ni louées, ni utilisées pour de la publicité.</p>

      <h2 id="cookies">Cookies et stockage dans votre navigateur</h2>
      <div class="table"><table>
        <thead><tr><th>Nom</th><th>Rôle</th><th>Durée</th><th>Accord demandé</th></tr></thead>
        <tbody>
          <tr><td>_ga, _ga_*</td><td>Mesure d’audience Google Analytics</td><td>13 mois au plus</td><td>Oui</td></tr>
          <tr><td>drame.consent</td><td>Votre choix sur les cookies</td><td>6 mois, puis redemandé</td><td>Non</td></tr>
          <tr><td>drame.portfolio.mode, drame.aventure.save</td><td>Dernier mode utilisé, progression du mode aventure</td><td>Jusqu’à ce que vous les effaciez</td><td>Non</td></tr>
          <tr><td>drame.reviews</td><td>Rappel discret pour un client invité à laisser un avis</td><td>Jusqu’à ce que vous l’effaciez</td><td>Non</td></tr>
          <tr><td>drame.portfolio.theme, drame.buildproject et autres réglages de session</td><td>Thème choisi, brouillon de demande de devis, navigation</td><td>Fermeture de l’onglet</td><td>Non</td></tr>
        </tbody>
      </table></div>
      <p>Vous pouvez changer d’avis à tout moment : <a href="#cookies" role="button" data-consent-open>gérer les cookies</a>.</p>

      <h2>Vos droits</h2>
      <p>Vous pouvez demander à accéder à vos données, les corriger, les effacer, en limiter l’usage, vous opposer à leur traitement ou les récupérer. Écrivez à <a href="${MAIL_HREF}">${esc(contact.email)}</a> : je vous réponds sous un mois. Si vous estimez que vos droits ne sont pas respectés, vous pouvez saisir la CNIL (<a href="https://www.cnil.fr" target="_blank" rel="noopener">cnil.fr</a>).</p>
    </div>`;
  return [page, shell(page, { main, jsonld: graph(page, { name: page.title, description: page.description }) })];
}

// ── Écriture ───────────────────────────────────────────
function writePage(file, html) {
  const out = join(ROOT, file);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, html);
}

// Pages de projets : le dossier est réécrit en entier (un projet retiré de
// museum.js ne laisse pas de page orpheline).
rmSync(join(ROOT, 'realisations'), { recursive: true, force: true });

const built = [
  homePage(), realisationsPage(), ...ordered.map(projectPage), tarifsPage(), aproposPage(), contactPage(),
  devisPage(), avisPage(), legalPage(), privacyPage(), notFoundPage(),
];
for (const [page, html] of built) {
  if ((html.match(/<h1[\s>]/g) || []).length > 1) throw new Error(`${page.file} : plusieurs <h1>`);
  if (/\u2014/.test(html)) throw new Error(`${page.file} : tiret cadratin interdit`);
  writePage(page.file, html);
}

// Liste des pages pour Vite (vite.config.js) et le plan du site (sitemap.mjs).
writeFileSync(join(ROOT, 'scripts/pages.json'), JSON.stringify(built.map(([p]) => ({
  file: p.file, path: p.path, index: !/noindex/.test(p.robots || '') && p.key !== '404',
})), null, 2) + '\n');

console.log(`Site régénéré : ${built.length} pages (dont ${ordered.length} projets, ${featured.length} à la une), ${offers.length} offres, ${T.SERVICES.length} prestations.`);
