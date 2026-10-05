/* ══════════════════════════════════════════════════════
   BUILD-CLASSIC.MJS : Génère le mode classique à partir de
   js/museum.js (source unique, partagée avec le mode aventure).

     npm run content      (ou : node scripts/build-classic.mjs)
     npm run build        (content + vite build)

   Mode classique = cinq pages autonomes, ÉCRITES EN ENTIER ici
   (ne pas les éditer à la main) :
     classique.html               /classique              Profil
     classique/projets.html       /classique/projets      Projets
     classique/parcours.html      /classique/parcours     Parcours
     classique/competences.html   /classique/competences  Compétences
     classique/contact.html       /classique/contact      Contact
   index.html : seuls les blocs entre marqueurs sont réécrits
     <!-- build:identity -->  <!-- build:jsonld -->

   Chaque page est un document complet, lisible sans JavaScript et
   indexable. Les expériences (espace de projets, frise, écosystème)
   sont une couche ajoutée par src/classic/*.js sur ce même HTML.

   Tout ce qui n'est pas écrit tel quel dans museum.js est DÉRIVÉ ici
   (statut, taille des bulles, liens compétence ↔ projet, chronologie),
   jamais inventé. Aucune dépendance.
   ══════════════════════════════════════════════════════ */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const { SECTIONS } = require('../js/museum.js');

// Adresse publique (canonique) du site. À changer ici, et dans les <head>
// des autres pages, robots.txt et sitemap.xml, si le domaine change.
const SITE_URL = 'https://arphandrame.fr/';

// ── Helpers ────────────────────────────────────────────
const esc = (v) => String(v ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const plural = (n, one, many) => `${n} ${n > 1 ? many : one}`;
const icon = (id, cls = 'ico') => `<svg class="${cls}" aria-hidden="true" focusable="false"><use href="#i-${id}"/></svg>`;
const slugify = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const lower1 = (s) => s.charAt(0).toLowerCase() + s.slice(1);

// ── Données ────────────────────────────────────────────
const profile  = SECTIONS.profile;
const bio      = profile.bio;
const steps    = SECTIONS.parcours.steps;
const projects = SECTIONS.projets.items;
const contact  = SECTIONS.contact;

// « Arphan DRAME » → « Arphan Drame » (le mode classique n'écrit pas en capitales).
const displayName = bio.name.replace(/\b(\p{Lu})(\p{Lu}+)\b/gu, (m, a, b) => a + b.toLowerCase());

const step = (slug) => steps.find(s => s.slug === slug);
const devphantom = step('devphantom');
const etna       = step('etna');
const company    = (devphantom.place || '').split(' · ')[0] || 'DevPhantom';

const CATEGORIES = ['Professionnel', 'Personnel', 'Scolaire'];
const byCat = Object.fromEntries(CATEGORIES.map(c => [c, projects.filter(p => p.category === c)]));

// Phrases de la bio : [0] le titre, [1] l'approche, [2] l'intégration.
const bioSentences = bio.description.split(/(?<=\.)\s+/);

// « En recherche de CDI (dès sept. 2026) » → ['Recherche CDI', 'dès sept. 2026'].
// Repli : la phrase entière si elle ne suit pas ce format.
function seekingBits(s) {
  if (!s) return [];
  const contract = (s.match(/\b(CDI|CDD|alternance|stage|freelance)\b/i) || [])[1];
  const when = (s.match(/\(([^)]+)\)/) || [])[1];
  return contract ? [`Recherche ${contract}`, when].filter(Boolean) : [s];
}
// « dès sept. 2026 » → 2026 + 8/12 (mois lu dans le texte, sinon l'année seule).
const MONTHS = ['janv', 'févr', 'mars', 'avr', 'mai', 'juin', 'juil', 'août', 'sept', 'oct', 'nov', 'déc'];
function seekingDate(s) {
  const y = +((s || '').match(/(?:19|20)\d{2}/) || [])[0];
  if (!y) return null;
  const m = MONTHS.findIndex(k => new RegExp(`\\b${k}`, 'i').test(s));
  return { year: y, at: y + (m >= 0 ? m / 12 : 0) };
}
const seeking = seekingDate(bio.seeking);

// ── Compétences ↔ projets ──────────────────────────────
// Une compétence est « utilisée » si elle figure dans la stack d'au moins
// un projet du portfolio (simple croisement des données existantes).
const norm = (s) => s.toLowerCase().replace(/\s+/g, ' ').trim();
const OTHER_TECH = new Set(['native', 'query', 'router']);   // « React Native » ≠ « React »
function techMatches(skill, tech) {
  const a = norm(skill), b = norm(tech);
  if (a === b) return true;
  const longer = a.length > b.length ? a : b;
  const shorter = a.length > b.length ? b : a;
  if (!longer.startsWith(shorter + ' ')) return false;
  const rest = longer.slice(shorter.length + 1).split(' ')[0];
  return !OTHER_TECH.has(rest);
}
const projectsUsing = (skill) => projects.filter(p => (p.tech || []).some(t => techMatches(skill, t)));

// Famille (couleur) déduite du libellé du groupe.
function familyKey(label) {
  if (/front/i.test(label)) return 'front';
  if (/back/i.test(label)) return 'back';
  if (/donn|data|base/i.test(label)) return 'data';
  if (/devops|infra/i.test(label)) return 'ops';
  if (/test/i.test(label)) return 'test';
  if (/\bIA\b|LLM/i.test(label)) return 'ai';
  if (/outil|concep/i.test(label)) return 'tools';
  return 'other';
}
const families = profile.skillGroups.map(g => ({
  label: g.label,
  key: familyKey(g.label),
  skills: g.items.map((item, i) => ({ item, i, slug: slugify(item), used: projectsUsing(item) })),
}));
const allSkills = families.flatMap(f => f.skills.map(s => ({ ...s, fam: f })));

// Logo de chaque compétence : assets/img/logos/<fichier>.svg (logos officiels
// monochromes Simple Icons / Devicon ; pictos maison pour les notions
// génériques). Une compétence absente d'ici garde sa bulle sans logo.
const LOGO = {
  'React': 'react', 'React Native': 'react', 'Next.js': 'nextdotjs', 'TypeScript': 'typescript',
  'JavaScript': 'javascript', 'Vite': 'vite', 'Tailwind CSS': 'tailwindcss', 'Redux / Zustand': 'redux',
  'Node.js': 'nodedotjs', 'Express': 'express', 'NestJS': 'nestjs', 'Symfony': 'symfony', 'Laravel': 'laravel',
  'PHP': 'php', 'Python': 'python', 'REST API': 'api', 'GraphQL': 'graphql',
  'MySQL': 'mysql', 'PostgreSQL': 'postgresql', 'Supabase': 'supabase', 'Prisma': 'prisma', 'TypeORM': 'typeorm',
  'Docker': 'docker', 'Git': 'git', 'GitHub': 'github', 'GitLab': 'gitlab', 'CI/CD': 'cicd', 'Nginx': 'nginx',
  'AWS': 'amazonwebservices', 'GCP': 'googlecloud', 'Cloudflare': 'cloudflare',
  'Jest': 'jest', 'Cypress': 'cypress', 'Vitest': 'vitest', 'Playwright': 'playwright',
  'Figma': 'figma', 'Jira': 'jira', 'Bruno': 'bruno', 'API REST': 'api',
  'Intégration IA / LLM': 'ai', 'Modèles locaux & API IA selon les projets': 'chip',
};
const logoOf = (item) => LOGO[item] && existsSync(join(ROOT, `assets/img/logos/${LOGO[item]}.svg`))
  ? `assets/img/logos/${LOGO[item]}.svg` : null;
const maxUse = Math.max(1, ...allSkills.map(s => s.used.length));
const mainStack = allSkills.filter(s => s.used.length >= 2).sort((a, b) => b.used.length - a.used.length);
const skillOfTech = (t) => allSkills.find(s => techMatches(s.item, t)) || null;
const projectSkills = (p) => [...new Set((p.tech || []).map(skillOfTech).filter(Boolean).map(s => s.slug))];

// ── Projets : statut, rang, contexte ───────────────────
// Statut déduit des données, jamais inventé :
//   `status` (museum.js)  → libellé du mode classique (« En cours » → « En développement »)
//   au moins un lien      → « Disponible »
//   aucun lien            → « Projet privé »
const STATUS_LABEL = { 'En cours': 'En développement' };
function statusOf(p) {
  if (p.status) return { tone: 'wip', label: STATUS_LABEL[p.status] || p.status };
  return (p.links || []).length ? { tone: 'on', label: 'Disponible' } : { tone: 'off', label: 'Projet privé' };
}
const statusBadge = (p) => {
  const s = statusOf(p);
  return `<span class="status status--${s.tone}"><span class="status__dot" aria-hidden="true"></span>${esc(s.label)}</span>`;
};

// Taille de la bulle : mis en avant (pick) › professionnel › autre.
const tierOf = (p) => p.pick ? 'l' : p.category === 'Professionnel' ? 'm' : 's';

// Cadre du projet, lu dans les données : jamais « solo » pour un travail d'équipe.
function contextOf(p) {
  if (p.category === 'Professionnel') return `${company} · équipe`;
  const team = (p.role || '').match(/équipe de (\d+)/i);
  if (team) return `Équipe de ${team[1]}`;
  if (/binôme/i.test(p.role || '')) return 'En binôme';
  if (p.category === 'Personnel') return 'Projet personnel';
  return '';
}

// Nom court pour les bulles : le titre, sauf s'il est trop long.
const titleCase = (s) => s.toLowerCase().replace(/(^|[\s-])(\p{L})/gu, (m, a, b) => a + b.toUpperCase());
const bubbleName = (p) => p.title.length > 26 && p.short ? titleCase(p.short) : p.title;

// Captures (museum.js `shots`, converties par npm run images) : seules
// celles dont le webp existe sont publiées. Couverture : assets/img/projets/
// <slug>.webp (la première capture, réduite). Sans capture : le fond actuel.
const projectShots = (p) => (p.shots || [])
  .map(s => ({ src: `assets/img/projets/${s.file}.webp`, alt: s.alt || '' }))
  .filter(s => existsSync(join(ROOT, s.src)));
const projectImage = (p) => projectShots(p).length && existsSync(join(ROOT, `assets/img/projets/${p.slug}.webp`))
  ? `assets/img/projets/${p.slug}.webp` : null;

// Projets à la une (page Profil), dans cet ordre : les plus aboutis, en
// ligne, avec captures. Un slug inconnu est simplement ignoré.
const FEATURED = ['wild-kedougou', 'islaah', 'skywalk'];
const featured = FEATURED.map(slug => projects.find(p => p.slug === slug)).filter(Boolean);

// ── Chronologie ────────────────────────────────────────
// « 01/2024 - 10/2026 », « 2021 - début 2022 », « 2020 »… → années décimales.
// Une fin sans mois est « floue » : dessinée jusqu'au milieu de l'année,
// en fondu (on n'invente pas de mois).
function spanOf(date) {
  const pts = [...String(date).matchAll(/(?:(\d{1,2})\/)?((?:19|20)\d{2})/g)]
    .map(m => ({ y: +m[2], m: m[1] ? +m[1] : null }));
  if (!pts.length) return null;
  const a = pts[0], b = pts[pts.length - 1];
  const start = a.y + (a.m ? (a.m - 1) / 12 : 0);
  if (pts.length === 1) return { start, end: null, fuzzy: false, year: a.y };
  const early = /début\s+(?:19|20)\d{2}\s*$/i.test(date);
  const end = b.m ? b.y + b.m / 12 : b.y + (early ? 0.25 : 0.5);
  return { start, end, fuzzy: !b.m, year: a.y };
}
const KIND = { 'ACADÉMIQUE': 'Formation', 'PROFESSIONNEL': 'Expérience' };
// Le mode classique ne montre que les étapes datées (« Autres expériences »
// reste dans museum.js pour le mode aventure et le CV).
const timeline = steps.map(s => ({ s, span: spanOf(s.date) }));
const dated   = timeline.filter(t => t.span).sort((a, b) => a.span.start - b.span.start);

// Jalons : SECTIONS.parcours.milestones + projets personnels / scolaires datés.
// Une année seule est placée au milieu de l'année (le libellé garde l'année).
const MONTH_LABEL = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
function pointOf(date) {
  const m = /^(?:(\d{1,2})\/)?((?:19|20)\d{2})$/.exec(String(date || '').trim());
  if (!m) return null;
  const y = +m[2], mo = m[1] ? +m[1] : null;
  return { at: mo ? y + (mo - 1) / 12 : y + 0.5, label: mo ? `${MONTH_LABEL[mo - 1]} ${y}` : String(y) };
}
const PIN_KIND = { 'DIPLÔME': 'Diplôme', 'CERTIFICATION': 'Certification', 'ÉTAPE': 'Étape' };
const teamOf = (p) => {
  const r = p.role || '';
  if (/binôme/i.test(r)) return 'en binôme';
  const n = (r.match(/équipe de (\d+)/i) || [])[1];
  return n ? `en équipe de ${n}` : '';
};
const milestones = [
  ...(SECTIONS.parcours.milestones || []).map(m => ({
    slug: m.slug, title: m.title, desc: m.desc || '', step: m.step || null, logo: m.logo || null,
    kind: m.kind === 'ÉTAPE' ? 'edu' : 'award', label: PIN_KIND[m.kind] || m.kind, pt: pointOf(m.date),
  })),
  ...projects.filter(p => p.date && p.category !== 'Professionnel').map(p => ({
    slug: p.slug, title: p.title, project: p, step: p.category === 'Scolaire' ? 'etna' : null,
    kind: p.category === 'Scolaire' ? 'edu' : 'perso',
    label: p.category === 'Scolaire' ? 'Projet ETNA' : 'Projet personnel', pt: pointOf(p.date),
  })),
].filter(m => m.pt).sort((a, b) => a.pt.at - b.pt.at);
// Poids visuel : l'expérience professionnelle liée aux projets domine ;
// une formation longue compte plus qu'un point ; « autres » reste discret.
function weightOf({ s, span }) {
  if (s.kind === 'PROFESSIONNEL' && s.role) return 'major';
  if (!span) return 'minor';
  return span.end && span.end - span.start >= 2 ? 'mid' : 'normal';
}
// Libellé court : le mot du titre / lieu qui correspond au `short` (« DevPhantom »).
function stepLabel(s) {
  const words = `${s.title} ${s.place || ''}`.split(/[\s·,()]+/);
  return words.find(w => w.toUpperCase() === s.short) || titleCase(s.short);
}
// Images du parcours (museum.js `logo` / `photos`, converties par npm run
// images) : publiées seulement si le fichier existe.
const tlImage = (file) => file && ['webp', 'svg'].map(e => `assets/img/parcours/${file}.${e}`).find(f => existsSync(join(ROOT, f)));
const tlLogo = (file, name, L) => {
  const src = tlImage(file);
  const size = src && imgSize(src);
  return src ? `<p class="tl-logo"><img src="${L.up}${src}" alt="Logo ${esc(name)}"${size ? ` width="${size.w}" height="${size.h}"` : ''} decoding="async"></p>` : '';
};
const tlPhotos = (photos, L) => {
  const list = (photos || []).map(ph => ({ ...ph, src: tlImage(ph.file) })).filter(ph => ph.src);
  return list.length ? `
              <div class="tl-photos">${list.map(ph => `
                <figure><a href="${L.up}${ph.src}" target="_blank" rel="noopener"><img src="${L.up}${ph.src}" alt="${esc(ph.alt)}" loading="lazy" decoding="async"></a>${ph.alt ? `<figcaption>${esc(ph.alt)}</figcaption>` : ''}</figure>`).join('')}
              </div>` : '';
};
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
// Dimensions d'une image du parcours : webp, ou svg (attributs width / height).
function imgSize(file) {
  if (!file.endsWith('.svg')) return webpSize(file);
  const tag = (readFileSync(join(ROOT, file), 'utf8').match(/<svg\b[^>]*>/) || [''])[0];
  const w = parseFloat((tag.match(/\bwidth="([\d.]+)(?:px)?"/) || [])[1]);
  const h = parseFloat((tag.match(/\bheight="([\d.]+)(?:px)?"/) || [])[1]);
  return w && h ? { w, h } : null;
}
// Aperçu d'un projet dans sa fiche de la frise : la première capture (les
// trois premières pour une application mobile). Sans capture : rien.
const tlShots = (p, L) => {
  const list = projectShots(p).slice(0, p.device === 'mobile' ? 3 : 1)
    .map(s => ({ ...s, size: webpSize(s.src) })).filter(s => s.size);
  return list.length ? `
            <a class="tl-shots${p.device === 'mobile' ? ' tl-shots--mobile' : ''}" href="${L.page('projets', p.slug)}" aria-label="Aperçu du projet ${esc(p.title)} : voir le projet">${list.map(s => `
              <img src="${L.up}${esc(s.src)}" alt="${esc(s.alt)}" width="${s.size.w}" height="${s.size.h}" loading="lazy" decoding="async">`).join('')}
            </a>` : '';
};
const firstYear = Math.floor(Math.min(...dated.map(t => t.span.start)));
const lastYear  = Math.max(...dated.map(t => Math.ceil(t.span.end ?? t.span.start + 1)), seeking ? seeking.year + 1 : 0);

// ── Pages ──────────────────────────────────────────────
const PAGES = [
  { key: 'profil',      file: 'classique.html',             path: 'classique',             label: 'Profil',      route: 'profil' },
  { key: 'projets',     file: 'classique/projets.html',     path: 'classique/projets',     label: 'Projets',     route: 'projets' },
  { key: 'parcours',    file: 'classique/parcours.html',    path: 'classique/parcours',    label: 'Parcours',    route: `parcours/${devphantom.slug}` },
  { key: 'competences', file: 'classique/competences.html', path: 'classique/competences', label: 'Compétences', route: 'profil' },
  { key: 'contact',     file: 'classique/contact.html',     path: 'classique/contact',     label: 'Contact',     route: 'contact' },
];
PAGES.forEach((p, i) => { p.n = String(i + 1).padStart(2, '0'); p.i = i; });
const PAGE = Object.fromEntries(PAGES.map(p => [p.key, p]));

// Liens entre pages : l'URL canonique (/classique/projets, sans « .html »),
// celle que sert Cloudflare Pages sans redirection. `up` reste relatif pour
// les fichiers (css, js, images) : la page Profil est à la racine, les autres
// dans classique/.
function linker(from) {
  const up = from.key === 'profil' ? '' : '../';
  return {
    up,
    page: (key, hash = '') => `/${PAGE[key].path}` + (hash ? `#${hash}` : ''),
  };
}

// ── Fragments communs ──────────────────────────────────
const SPRITE = `
  <svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false">
    <symbol id="i-gamepad" viewBox="0 0 24 24"><path d="M4 8h16l2 9h-5l-2-3H9l-2 3H2zM7 10v4M5 12h4" fill="none" stroke="currentColor" stroke-width="1.8"/><rect x="15" y="10.5" width="2" height="2" fill="currentColor"/></symbol>
    <symbol id="i-sun" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1" stroke="currentColor" stroke-width="1.8"/></symbol>
    <symbol id="i-moon" viewBox="0 0 24 24"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" fill="none" stroke="currentColor" stroke-width="1.8"/></symbol>
    <symbol id="i-download" viewBox="0 0 24 24"><path d="M12 3v12M7 10l5 5 5-5M4 20h16" fill="none" stroke="currentColor" stroke-width="1.8"/></symbol>
    <symbol id="i-mail" viewBox="0 0 24 24"><path d="M3 5h18v14H3zM3 6l9 7 9-7" fill="none" stroke="currentColor" stroke-width="1.8"/></symbol>
    <symbol id="i-github" viewBox="0 0 24 24"><path d="M12 2a10 10 0 0 0-3.2 19.5c.5.1.7-.2.7-.5v-1.7c-2.8.6-3.4-1.3-3.4-1.3-.5-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.4 1.1 2.9.8.1-.7.4-1.1.6-1.3-2.2-.3-4.6-1.1-4.6-5a3.9 3.9 0 0 1 1-2.7 3.6 3.6 0 0 1 .1-2.7s.8-.3 2.8 1a9.6 9.6 0 0 1 5 0c1.9-1.3 2.8-1 2.8-1 .5 1.4.2 2.4.1 2.7a3.9 3.9 0 0 1 1 2.7c0 3.9-2.4 4.7-4.6 5 .4.3.7.9.7 1.9V21c0 .3.2.6.7.5A10 10 0 0 0 12 2z" fill="currentColor"/></symbol>
    <symbol id="i-linkedin" viewBox="0 0 24 24"><path d="M4 3a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM3 9h3v12H3zM9 9h3v1.7c.5-.9 1.7-1.9 3.5-1.9 3.2 0 3.5 2.1 3.5 4.8V21h-3v-6.5c0-1.5 0-3.3-2-3.3s-2.3 1.6-2.3 3.2V21H9z" fill="currentColor"/></symbol>
    <symbol id="i-menu" viewBox="0 0 24 24"><path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" stroke-width="1.8"/></symbol>
    <symbol id="i-chevron" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" stroke-width="1.8"/></symbol>
    <symbol id="i-arrow" viewBox="0 0 24 24"><path d="M5 12h13M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.8"/></symbol>
    <symbol id="i-back" viewBox="0 0 24 24"><path d="M19 12H6M11 6l-6 6 6 6" fill="none" stroke="currentColor" stroke-width="1.8"/></symbol>
    <symbol id="i-external" viewBox="0 0 24 24"><path d="M14 4h6v6M20 4l-9 9M18 14v6H4V6h6" fill="none" stroke="currentColor" stroke-width="1.8"/></symbol>
    <symbol id="i-phone" viewBox="0 0 24 24"><path d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2z" fill="none" stroke="currentColor" stroke-width="1.8"/></symbol>
    <symbol id="i-close" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" stroke-width="1.8"/></symbol>
    <symbol id="i-orbit" viewBox="0 0 24 24"><circle cx="8" cy="9" r="3.2" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="16.5" cy="7" r="1.8" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="15" cy="16" r="4" fill="none" stroke="currentColor" stroke-width="1.8"/></symbol>
    <symbol id="i-list" viewBox="0 0 24 24"><path d="M9 6h11M9 12h11M9 18h11" stroke="currentColor" stroke-width="1.8"/><circle cx="4.5" cy="6" r="1.3" fill="currentColor"/><circle cx="4.5" cy="12" r="1.3" fill="currentColor"/><circle cx="4.5" cy="18" r="1.3" fill="currentColor"/></symbol>
    <symbol id="i-copy" viewBox="0 0 24 24"><rect x="8" y="8" width="12" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3" fill="none" stroke="currentColor" stroke-width="1.8"/></symbol>
    <symbol id="i-check" viewBox="0 0 24 24"><path d="m5 12.5 4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2"/></symbol>
    <symbol id="i-send" viewBox="0 0 24 24"><path d="M21 3 3 10.5l7 3 3 7zM10 13.5 21 3" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></symbol>
    <symbol id="i-center" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4" stroke="currentColor" stroke-width="1.8"/></symbol>
  </svg>`;

function topbar(page, L) {
  const nav = PAGES.map(p => {
    const cur = p === page;
    return `<a href="${L.page(p.key)}"${cur ? ' aria-current="page"' : ''} data-page-link="${p.key}"><span>${p.label}</span>${cur ? '<i class="nav__ink" aria-hidden="true"></i>' : ''}</a>`;
  }).concat(`<a href="/tarifs"><span>Tarifs</span></a>`,
    `<a class="nav__cv" href="${L.up}assets/CV.pdf" target="_blank" rel="noopener"><span>Voir mon CV</span></a>`).join('\n        ');
  return `
  <header class="topbar">
    <div class="topbar__inner">
      <a class="brand" href="${L.up || './'}" aria-label="${esc(displayName)}, accueil"><span>A. DRAME</span></a>
      <span class="topbar__where" aria-hidden="true"><b>${page.n}</b>${page.label}</span>
      <nav class="nav" id="site-nav" aria-label="Pages du portfolio">
        ${nav}
      </nav>
      <div class="topbar__actions">
        <a class="topbar__cv" href="${L.up}assets/CV.pdf" target="_blank" rel="noopener">Voir mon CV</a>
        <button type="button" class="icon-btn" data-theme-toggle aria-pressed="false" aria-label="Changer d'ambiance">
          ${icon('sun', 'ico ico--sun')}
          ${icon('moon', 'ico ico--moon')}
        </button>
        <a class="switch" href="/aventure#${page.route}" data-switch-adventure data-follow-route
           title="Passer en mode aventure, à l'endroit que vous lisez">
          ${icon('gamepad')}<span>Mode aventure</span>
        </a>
        <button type="button" class="icon-btn nav-toggle" aria-controls="site-nav" aria-expanded="false" aria-label="Ouvrir le menu">
          ${icon('menu')}
        </button>
      </div>
    </div>
  </header>`;
}

// Portes latérales : page précédente / suivante. Leurs liens (rel=prev|next)
// servent aussi aux flèches du clavier (js/classic.js).
function worlds(page, L) {
  const prev = PAGES[page.i - 1], next = PAGES[page.i + 1];
  const door = (p, dir) => p ? `
    <a class="worlds__door worlds__door--${dir}" href="${L.page(p.key)}" rel="${dir}" aria-keyshortcuts="${dir === 'prev' ? 'ArrowLeft' : 'ArrowRight'}">
      ${icon(dir === 'prev' ? 'back' : 'arrow')}<span class="worlds__l">${p.label}</span>
    </a>` : '';
  return `
  <nav class="worlds" aria-label="Page précédente et suivante">${door(prev, 'prev')}${door(next, 'next')}
  </nav>`;
}

function footer(L) {
  return `
  <footer class="footer">
    <div class="wrap footer__inner">
      <p>${esc(displayName)} · ${esc(bio.title)} · ${esc(bio.location)}</p>
      <nav class="footer__links" aria-label="Autres pages">
        <a href="/">Choisir un mode</a>
        <a href="/aventure#ville" data-switch-adventure>Mode aventure</a>
        <a href="/tarifs">Tarifs</a>
        <a href="${L.up}assets/CV.pdf" target="_blank" rel="noopener">CV</a>
      </nav>
    </div>
  </footer>`;
}

// Script du <head> (bloquant, minuscule) :
//   • .js avant le premier rendu (place réservée aux expériences) ;
//   • sens de la transition entre pages (types de View Transition) ;
//   • filet .no-app si le module ne démarre pas.
const HEAD_SCRIPT = `
  <script>
    (function (r, w) {
      r.classList.add('js');
      var still = /[?&]capture\\b/.test(location.search);
      if (still) r.classList.add('is-still');
      if (!still && !matchMedia('(prefers-reduced-motion: reduce)').matches) r.classList.add('motion-pending');
      // Ordre des pages : le sens de navigation donne le sens de la transition.
      var ORDER = ['classique', 'projets', 'parcours', 'competences', 'contact'];
      function idx(u) {
        try { var p = new URL(u, location.href).pathname.replace(/\\.html$/, '').replace(/\\/$/, ''); } catch (e) { return -1; }
        var k = p.slice(p.lastIndexOf('/') + 1);
        return /\\/classique\\//.test(p + '/') || k === 'classique' ? ORDER.indexOf(k) : -1;
      }
      function from() {
        var a = w.navigation && navigation.activation;
        if (a && a.from && a.from.url) return idx(a.from.url);
        try { var v = sessionStorage.getItem('drame.classic.from'); sessionStorage.removeItem('drame.classic.from'); return v === null ? -1 : +v; } catch (e) { return -1; }
      }
      var here = idx(location.href);
      w.ClassicNav = { order: ORDER, idx: idx, here: here };
      if ('onpagereveal' in w) {
        w.addEventListener('pagereveal', function (e) {
          var f = from();
          if (f < 0 || f === here) return;
          var dir = f < here ? 'fwd' : 'back';
          r.classList.add('vt-arrival');
          if (e.viewTransition && e.viewTransition.types) {
            e.viewTransition.types.add(dir);
            e.viewTransition.types.add('from-' + ORDER[f]);
          } else if (!e.viewTransition) r.classList.add('arrive-' + dir);
        });
      } else {
        var f = from();
        if (f >= 0 && f !== here) r.classList.add('arrive-' + (f < here ? 'fwd' : 'back'));
      }
      // Filet : module absent après 2,5 s d'affichage réel → document statique.
      function arm() {
        setTimeout(function () {
          r.classList.remove('motion-pending');
          if (!r.classList.contains('app-ready')) r.classList.add('no-app');
        }, 2500);
      }
      if (document.prerendering) document.addEventListener('prerenderingchange', arm, { once: true }); else arm();
    })(document.documentElement, window);
  </script>`;

function shell(page, { title, description, ogDescription, jsonld, personExtra, body, scripts = '', scrolls = false }) {
  const L = linker(page);
  const others = PAGES.filter(p => p !== page).map(p => L.page(p.key));
  const url = SITE_URL + page.path;
  jsonld = pageGraph(page, jsonld, personExtra);
  return `<!DOCTYPE html>
<!-- GÉNÉRÉ par scripts/build-classic.mjs depuis js/museum.js, ne pas éditer : npm run content -->
<html lang="fr" data-theme="night">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="${url}">
  <meta property="og:type" content="${page.key === 'profil' ? 'profile' : 'website'}">
  <meta property="og:locale" content="fr_FR">
  <meta property="og:site_name" content="${esc(displayName)} · Portfolio">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(ogDescription || description)}">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="${SITE_URL}assets/img/og.jpg">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="${esc(OG_ALT)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(ogDescription || description)}">
  <meta name="twitter:image" content="${SITE_URL}assets/img/og.jpg">
  <meta name="theme-color" content="#0a0a0d">
  <script src="${L.up}js/theme.js"></script>${HEAD_SCRIPT}
  <link rel="icon" href="${L.up}assets/img/favicon.png">
  <link rel="stylesheet" href="${L.up}css/tokens.css">
  <link rel="stylesheet" href="${L.up}css/site.css">
  <link rel="stylesheet" href="${L.up}css/classic.css">
  <script type="speculationrules">
  {"prerender": [{"source": "list", "urls": ${JSON.stringify(others)}, "eagerness": "moderate"}]}
  </script>${ld(jsonld)}</head>
<body class="page page--${page.key}${scrolls ? ' page--doc' : ' page--world'}" data-page="${page.key}" data-route="${page.route}">${SPRITE}

  <a class="skip" href="#main">Aller au contenu</a>
${topbar(page, L)}

  <main id="main" class="world world--${page.key} vt-stage" tabindex="-1">
    <div class="world__bg" aria-hidden="true"><i></i></div>${body(L)}
  </main>
${worlds(page, L)}${scrolls ? footer(L) : ''}

  <script src="${L.up}js/seeking.js"></script>
  <script src="${L.up}js/deeplink.js"></script>${scripts ? `\n  ${scripts.replaceAll('{up}', L.up)}` : ''}
  <script src="${L.up}js/classic.js"></script>
  <script type="module" src="${L.up}src/classic-app.js"></script>
</body>
</html>
`;
}

function worldHead(page, title, lead, extra = '', { quiet = false, count = '' } = {}) {
  return `
      <header class="world-head">
        <p class="world-head__k"><span>${page.n}</span>${esc(page.label)}${count ? `<em class="world-head__n" data-count>${esc(count)}</em>` : ''}</p>
        <h1 class="${quiet ? 'sr-only' : 'world-head__t'}" id="${page.key}-title">${esc(title)}</h1>
        ${lead ? `<p class="world-head__lead">${lead}</p>` : ''}${extra}
      </header>`;
}

// Légende repliable d'un espace : [{ title, items: [html] }].
function legend(groups) {
  return `
        <details class="legend js-only">
          <summary>Légende${icon('chevron', 'ico legend__chev')}</summary>
          <div class="legend__in">${groups.map(g => `
            <div class="legend__g"><p class="legend__t">${esc(g.title)}</p><ul>${g.items.map(i => `<li>${i}</li>`).join('')}</ul></div>`).join('')}
          </div>
        </details>`;
}

// ══════════════════════════════════════════════════════
// 01 · PROFIL
// ══════════════════════════════════════════════════════
function profilPage() {
  const page = PAGE.profil;
  const ctx = [bio.location, ...seekingBits(bio.seeking)].map(m => `<span class="pf-ctx__i" data-seeking>${esc(m)}</span>`).join(' ');
  const [first, ...rest] = displayName.split(' ');
  // Les technologies les plus utilisées (nombre de projets), en orbes
  // flottantes autour du nom : logo, couleur = famille, taille = usage.
  // Une orbe par logo (React et React Native partagent le leur). Positions
  // fixes, calculées ici pour laisser le centre (le nom) dégagé.
  const orbStack = mainStack.filter((s, i, a) => logoOf(s.item) && a.findIndex(o => logoOf(o.item) === logoOf(s.item)) === i);
  const orbs = (L) => orbStack.map((s, i) => {
    // De part et d'autre du nom (bandes gauche / droite), jamais dessus.
    const side = i % 2 ? 1 : -1;
    const k = i >> 1, rows = Math.ceil(orbStack.length / 2);
    const band = [0.15, 0.85, 0.45, 1, 0, 0.65, 0.3][k % 7];   // quinconce : pas de chevauchement
    const x = 50 + side * (31 + band * 13);
    const y = 12 + ((k * 3 + (side > 0 ? 1 : 0)) % rows + (side > 0 ? 0.65 : 0.35)) / rows * 76;
    const z = [0.5, 0.7, 1, 0.85, 0.6][i % 5];         // profondeur (parallaxe, taille)
    const tier = s.used.length >= 5 ? 'l' : s.used.length >= 3 ? 'm' : 's';
    return `<i data-fam="${s.fam.key}" data-tier="${tier}" style="--x:${x.toFixed(1)}%;--y:${y.toFixed(1)}%;--z:${z};--d:${(i * 0.7) % 6}s;--logo:url('${L.up}${logoOf(s.item)}')"></i>`;
  }).join('');
  const langs = bio.languages.map(l => `<li><strong>${esc(l.label)}</strong> ${esc(l.level)}</li>`).join('');

  // Projets à la une : la preuve avant le discours. La carte entière mène à
  // la fiche du projet (les technologies ne sont donc pas des liens ici).
  const featCard = (p, L) => {
    const ctx = p.category === 'Personnel' ? '' : contextOf(p);   // la pastille le dit déjà
    const tech = p.tech || [];
    return `
          <li data-cat="${esc(p.category)}"><article class="feat-card" aria-labelledby="f-${p.slug}">
            ${projectCover(p, L)}
            <p class="feat-card__meta"><span class="chip-cat">${esc(p.category)}</span><span>${esc(p.type)}</span>${ctx ? `<span>${esc(ctx)}</span>` : ''}</p>
            <h3 class="feat-card__title" id="f-${p.slug}"><a href="${L.page('projets', p.slug)}">${esc(p.title)}</a></h3>
            <p class="feat-card__desc">${esc(p.desc.split(/(?<=\.)\s+/)[0])}</p>
            <ul class="tags" aria-label="Technologies">${tech.slice(0, 4).map(t => `<li>${esc(t)}</li>`).join('')}${tech.length > 4 ? `<li>+${tech.length - 4}</li>` : ''}</ul>
          </article></li>`;
  };

  // Les projets sont déjà montrés plus haut : il reste trois portes.
  const doors = [
    { key: 'parcours', q: 'Quel a été son parcours\u202f?', hint: `${firstYear} → ${lastYear - 1} · ${plural(dated.length, 'étape', 'étapes')}` },
    { key: 'competences', q: 'Quel est son univers technique\u202f?', hint: `${plural(allSkills.length, 'compétence', 'compétences')} · ${families.length} familles` },
    { key: 'contact', q: 'Comment le contacter\u202f?', hint: bio.seeking || 'E-mail, téléphone, formulaire' },
  ];

  // Titre de la page = nom + métier : le <h1> enveloppe ces deux lignes du
  // hero sans boîte propre (display:contents), le rendu ne change pas.
  const body = (L) => `
    <section class="pf-hero" aria-labelledby="profil-title">
      <div class="pf-orbs" aria-hidden="true">${orbs(L)}</div>
      <div class="pf-hero__inner">
        <h1 id="profil-title" style="display:contents">
          <span class="pf-name"><span class="pf-name__w"><span>${esc(first)}</span></span> <span class="pf-name__w"><span>${esc(rest.join(' '))}</span></span></span>
          <span class="pf-role">${esc(bio.title)}</span>
        </h1>
        <p class="pf-ctx"><span class="pulse" aria-hidden="true"></span>${ctx}</p>
        <div class="pf-cta">
          <a class="btn btn--primary" href="${L.page('projets')}">Voir mes projets${icon('arrow')}</a>
          <a class="btn btn--ghost" href="/tarifs">Un projet à me confier\u202f?${icon('arrow')}</a>
        </div>
      </div>
      <a class="pf-scroll" href="#a-la-une"><span>Projets à la une</span>${icon('chevron')}</a>
    </section>

    <section class="pf-feat" id="a-la-une" aria-labelledby="a-la-une-title">
      <div class="wrap">
        <h2 class="kicker" id="a-la-une-title">Projets à la une</h2>
        <ol class="feat">${featured.map(p => featCard(p, L)).join('')}
        </ol>
        <p class="pf-feat__more">
          <a class="text-link" href="${L.page('projets')}">Voir les ${plural(projects.length, 'projet', 'projets')}${icon('arrow')}</a>
          <span>${byCat.Professionnel.length} professionnels chez ${esc(company)}, ${byCat.Personnel.length} personnels, ${byCat.Scolaire.length} scolaires</span>
        </p>
      </div>
    </section>

    <section class="pf-about" id="presentation" aria-labelledby="presentation-title">
      <div class="wrap">
        <h2 class="kicker" id="presentation-title">Qui je suis</h2>
        <p class="pf-statement">${esc(profile.positioning)}</p>
        <div class="pf-about__grid">
          <div class="pf-about__text">
            <p>${esc(`Je suis ${displayName}, ${bio.title.toLowerCase()} à ${bio.location}. ${bioSentences[1] || ''}`.trim())}</p>${profile.aboutStack ? `
            <p>${esc(profile.aboutStack)}</p>` : ''}
          </div>
          <dl class="facts">
            <div><dt>Aujourd'hui</dt><dd>${esc(bio.availability)} <a class="inline-link" href="${L.page('parcours', devphantom.slug)}">${esc(devphantom.date)}</a></dd></div>
            <div><dt>Formation</dt><dd>${esc(etna.title)} <span class="facts__m">${esc(etna.date)}</span></dd></div>
            <div><dt>Langues</dt><dd><ul class="inline-list">${langs}</ul></dd></div>
          </dl>
        </div>
      </div>
    </section>

    <section class="pf-next" aria-labelledby="explorer-title">
      <div class="wrap">
        <h2 class="kicker" id="explorer-title">Continuer l'exploration</h2>
        <ol class="doors">${doors.map(d => `
          <li><a class="door door--${d.key}" href="${L.page(d.key)}">
            <span class="door__n">${PAGE[d.key].n}</span>
            <span class="door__l">${PAGE[d.key].label}</span>
            <span class="door__q">${esc(d.q)}</span>
            <span class="door__h" data-seeking>${esc(d.hint)}</span>
            ${icon('arrow', 'ico door__go')}
          </a></li>`).join('')}
        </ol>
      </div>
    </section>`;

  return shell(page, {
    title: `${displayName} · ${bio.title} à ${bio.location}`,
    description: `Portfolio d'${displayName}, ${bio.title} à ${bio.location}. ${bio.seeking}. Projets, parcours, compétences et contact.`,
    ogDescription: `${bio.seeking}. ${profile.positioning}`,
    jsonld: { '@type': 'ProfilePage', name: `Profil · ${displayName}`, mainEntity: PERSON_REF },
    body,
    scrolls: true,
  });
}

// ══════════════════════════════════════════════════════
// 02 · PROJETS
// ══════════════════════════════════════════════════════
function projectCover(p, L) {
  const img = projectImage(p);
  if (img) {
    return `<div class="pj-cover${p.device === 'mobile' ? ' pj-cover--mobile' : ''}"><img class="pj-cover__img" src="${L.up}${esc(img)}" alt="Aperçu du projet ${esc(p.title)}" loading="lazy" decoding="async" width="1280" height="800"></div>`;
  }
  // Pas de capture (projet privé ou visuel à venir) : couverture
  // typographique, jamais d'image inventée.
  return `<div class="pj-cover pj-cover--type" aria-hidden="true"><span>${esc(bubbleName(p))}</span></div>`;
}

function techList(p, L) {
  return `<ul class="tags" aria-label="Technologies">${(p.tech || []).map(t => {
    const s = skillOfTech(t);
    return s
      ? `<li><a class="tag-link" href="${L.page('competences', s.slug)}" data-skill="${s.slug}" data-fam="${s.fam.key}">${esc(t)}</a></li>`
      : `<li>${esc(t)}</li>`;
  }).join('')}</ul>`;
}

function projectItem(p, L) {
  const ctx = contextOf(p);
  const img = projectImage(p);
  const shots = img ? projectShots(p).map(s => ({ ...s, src: L.up + s.src })) : [];
  const st = statusOf(p);
  const links = (p.links || []).map(l =>
    `<a class="btn btn--sm" href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)}${icon('external', 'ico ico--xs')}</a>`).join('');
  return `
          <li class="pj-item" id="${p.slug}" data-slug="${p.slug}"
              data-cat="${esc(p.category)}" data-tier="${tierOf(p)}" data-status="${st.tone}"
              data-name="${esc(bubbleName(p))}" data-skills="${projectSkills(p).join(' ')}"${img ? ` data-img="${L.up}${esc(img)}" data-shots="${esc(JSON.stringify(shots))}"` : ''}${p.device ? ` data-device="${esc(p.device)}"` : ''}${p.pick ? ' data-pick' : ''}>
            <article aria-labelledby="p-${p.slug}">
              <div class="pj-item__head">
                <span class="pj-item__orb" aria-hidden="true"></span>
                <h2 class="pj-item__title" id="p-${p.slug}">${esc(p.title)}</h2>
                <p class="pj-item__meta"><span class="chip-cat">${esc(p.category)}</span><span>${esc(p.type)}</span>${ctx ? `<span>${esc(ctx)}</span>` : ''}</p>
                <p class="pj-item__status">${statusBadge(p)}</p>
              </div>
              <div class="pj-item__body">
                ${projectCover(p, L)}
                <p class="pj-item__desc">${esc(p.desc)}</p>
                ${techList(p, L)}
                ${p.role ? `<div class="pj-item__role"><h3 class="mini-title">Mon rôle</h3><p>${esc(p.role)}</p></div>` : ''}
                ${links ? `<div class="pj-item__links">${links}</div>` : ''}
              </div>
            </article>
          </li>`;
}

function projetsPage() {
  const page = PAGE.projets;
  const body = (L) => `
    <section class="pj" aria-labelledby="projets-title">
      <div class="world-ui">${worldHead(page, 'Projets de développement web', '', legend([
        { title: 'Catégorie', items: CATEGORIES.map(c => `<i class="cat-dot" data-cat="${c}"></i>${c}`) },
        { title: 'État', items: ['<i class="lg-dot lg-dot--on"></i>Disponible', '<i class="lg-dot lg-dot--wip"></i>En développement', '<i class="lg-dot lg-dot--off"></i>Projet privé'] },
        { title: 'Taille', items: ['<i class="lg-size lg-size--l"></i>À ne pas rater', '<i class="lg-size lg-size--m"></i>Professionnel', '<i class="lg-size lg-size--s"></i>Autre'] },
      ]), { quiet: true, count: plural(projects.length, 'projet', 'projets') })}
        <div class="pj-bar js-only" role="toolbar" aria-label="Affichage des projets">
          <div class="seg-group" role="group" aria-label="Vue">
            <button type="button" class="seg" data-view="space" aria-pressed="true">${icon('orbit')}Espace</button>
            <button type="button" class="seg" data-view="list" aria-pressed="false">${icon('list')}Liste</button>
          </div>
        </div>
      </div>
      <div class="pj-space js-only" data-keys></div>
      <div class="pj-list">
        <ol class="pj-index" aria-label="Tous les projets" data-keys>${projects.map(p => projectItem(p, L)).join('')}
        </ol>
      </div>
    </section>`;
  return shell(page, {
    title: `Projets web et mobiles · ${displayName}, ${bio.title}`,
    description: `${plural(projects.length, 'projet', 'projets')} d'${displayName} : ${byCat.Professionnel.length} professionnels réalisés en équipe chez ${company}, ${byCat.Personnel.length} personnels et ${byCat.Scolaire.length} scolaires. Technologies, rôle et disponibilité de chaque projet.`,
    jsonld: {
      '@type': 'CollectionPage',
      name: `Projets · ${displayName}`,
      about: PERSON_REF,
      mainEntity: {
        '@type': 'ItemList',
        itemListElement: projects.map((p, i) => ({
          '@type': 'ListItem', position: i + 1,
          item: {
            '@type': 'CreativeWork', name: p.title, description: p.desc, genre: p.type,
            url: `${SITE_URL}${page.path}#${p.slug}`, keywords: (p.tech || []).join(', '),
            creator: PERSON_REF,
            ...(p.links && p.links[0] ? { sameAs: p.links[0].url } : {}),
          },
        })),
      },
    },
    body,
  });
}

// ══════════════════════════════════════════════════════
// 03 · PARCOURS
// ══════════════════════════════════════════════════════
// Frise : une échelle en années. Ligne principale = les étapes (un nœud à
// leur début, une barre si elles durent) ; au-dessus, les jalons (diplômes,
// projets datés) en petits points, empilés quand ils sont proches.
// Étapes et jalons sont des onglets, dans l'ordre chronologique.
function parcoursPage() {
  const page = PAGE.parcours;
  const years = lastYear - firstYear;
  const at = (v) => ((v - firstYear) / years).toFixed(4);           // position 0 → 1
  const kindKey = (s) => s.kind === 'ACADÉMIQUE' ? 'edu' : 'pro';
  const next = bio.seeking && seeking ? { slug: 'et-ensuite', at: seeking.at, year: seeking.year } : null;
  const initial = next ? next.slug : dated[dated.length - 1].s.slug;

  // Étapes : deux étiquettes trop proches s'écartent (la première finit à
  // son point, la suivante y commence) au lieu de se chevaucher.
  const stepItems = dated.map(t => ({ ...t, type: 'step', w: weightOf(t), at: t.span.start }));
  if (next) stepItems.push({ type: 'next', at: next.at });
  stepItems.reduce((prev, e) => { if (prev && e.at - prev.at < 0.6) { prev.align = 'end'; e.align = 'start'; } return e; }, null);

  // Jalons : premier niveau libre (0,2 an d'écart au moins), sinon on empile.
  const lanes = [];
  const pins = milestones.map(m => {
    let lvl = lanes.findIndex(last => m.pt.at - last >= 0.2);
    if (lvl < 0) lvl = lanes.length;
    lanes[lvl] = m.pt.at;
    return { ...m, type: 'pin', at: m.pt.at, lvl };
  });
  const items = [...stepItems, ...pins].sort((a, b) => a.at - b.at || (a.type === 'pin') - (b.type === 'pin'));
  const pinsOf = (slug) => pins.filter(m => m.step === slug);

  const kinList = (list) => `
              <div class="tl-kin">
                <p class="mini-title">Jalons</p>
                <ul>${list.map(m => `<li><a href="#${m.slug}" data-kind="${m.kind}"><i aria-hidden="true"></i><strong>${esc(m.title)}</strong><span>${esc(m.pt.label)}</span></a></li>`).join('')}</ul>
              </div>`;
  const more = (title, text) => `
              <details class="tl-more"><summary>${esc(title)}${icon('chevron', 'ico tl-more__chev')}</summary><p>${esc(text)}</p></details>`;

  const stepPanel = ({ s, w }, L) => {
    const pro = s.slug === devphantom.slug ? byCat.Professionnel : [];
    const kin = pinsOf(s.slug);
    // Les jalons d'une étape (diplômes…) remplacent sa liste de détails.
    const details = !kin.length && s.details && s.details.length
      ? `<ul class="tl-panel__details">${s.details.map(d => `<li>${esc(d)}</li>`).join('')}</ul>` : '';
    return `
          <article class="tl-panel tl-panel--${w}" id="${s.slug}" data-step="${s.slug}" data-kind="${kindKey(s)}" data-route="parcours/${s.slug}" aria-labelledby="tl-${s.slug}-t">
            <header class="tl-panel__head">${tlLogo(s.logo, stepLabel(s), L)}
              <p class="tl-panel__k"><span>${esc(KIND[s.kind] || s.kind)}</span>${esc(s.date)}</p>
              <h2 class="tl-panel__t" id="tl-${s.slug}-t">${esc(s.title)}</h2>
              ${s.place ? `<p class="tl-panel__place">${esc(s.place)}</p>` : ''}
              ${s.desc ? `<p class="tl-panel__lead">${esc(s.desc)}</p>` : ''}
            </header>
            <div class="tl-panel__body">${s.context && !pro.length ? `
              <p>${esc(s.context)}</p>` : ''}${tlPhotos(s.photos, L)}${details}${kin.length ? kinList(kin) : ''}${pro.length ? `
              <div class="tl-panel__projects">
                <p class="mini-title">Projets ${esc(company)} · en équipe</p>
                <ul>${pro.map(p => `<li><a href="${L.page('projets', p.slug)}" data-cat="${esc(p.category)}"><strong>${esc(p.title)}</strong><span>${esc(p.type)}</span></a></li>`).join('')}</ul>
              </div>` : ''}${s.context && pro.length ? more('Au quotidien', s.context) : ''}${s.role && !pro.length ? more('Mon rôle', s.role) : ''}
            </div>
          </article>`;
  };
  const pinPanel = (m, L) => {
    const p = m.project;
    const parent = m.step && step(m.step);
    // Accroche : la première phrase de la description qui n'est ni le type ni
    // le statut (déjà écrits dessous) ; à défaut, le rôle.
    const lead = p
      ? p.desc.split(/(?<=\.)\s+/).find(x => norm(x.replace(/\.$/, '')) !== norm(p.type) && !(p.status && norm(x).startsWith(norm(`projet ${p.status}`)))) || p.role
      : m.desc;
    const place = p ? [p.type, teamOf(p), p.status].filter(Boolean).join(' · ') : '';
    const route = p ? `projets/${p.slug}` : parent ? `parcours/${parent.slug}` : 'parcours';
    const shots = p ? tlShots(p, L) : '';
    return `
          <article class="tl-panel tl-panel--pin${shots ? ' tl-panel--shots' : ''}" id="${m.slug}" data-step="${m.slug}" data-kind="${m.kind}" data-route="${route}" aria-labelledby="tl-${m.slug}-t">
            <header class="tl-panel__head">${tlLogo(m.logo, m.title, L)}
              <p class="tl-panel__k"><span>${esc(m.label)}</span>${esc(m.pt.label)}</p>
              <h2 class="tl-panel__t" id="tl-${m.slug}-t">${esc(m.title)}</h2>
              ${place ? `<p class="tl-panel__place">${esc(place)}</p>` : ''}
              ${p || parent ? `<p class="tl-panel__acts">${p ? `<a class="btn btn--primary btn--sm" href="${L.page('projets', p.slug)}">Voir le projet${icon('arrow')}</a>` : ''}${parent ? `<a class="tl-up" href="#${parent.slug}"><span>Pendant</span>${esc(stepLabel(parent))}</a>` : ''}</p>` : ''}
              ${lead ? `<p class="tl-panel__lead">${esc(lead)}</p>` : ''}
            </header>${shots}
          </article>`;
  };
  const nextPanel = (L) => `
          <article class="tl-panel tl-panel--next" id="${next.slug}" data-step="${next.slug}" data-kind="next" data-route="parcours" aria-labelledby="tl-next-t">
            <header class="tl-panel__head">
              <p class="tl-panel__k"><span>Et ensuite</span>${next.year}</p>
              <h2 class="tl-panel__t" id="tl-next-t" data-seeking>${esc(bio.seeking)}</h2>
              <p class="tl-panel__place">${esc(bio.title)} · ${esc(bio.location)}</p>
              <p class="tl-panel__lead">${esc(profile.positioning)}</p>
            </header>
            <div class="tl-panel__body">
              <p class="tl-panel__acts"><a class="btn btn--primary btn--sm" href="${L.page('contact')}">Me contacter${icon('arrow')}</a></p>
            </div>
          </article>`;
  const panel = (e, L) => e.type === 'pin' ? pinPanel(e, L) : e.type === 'next' ? nextPanel(L) : stepPanel(e, L);

  // Nœuds : étapes sur la ligne, jalons au-dessus (info-bulle au survol).
  const node = (e) => {
    if (e.type === 'pin') return `<a class="tl-node tl-pin" href="#${e.slug}" data-step="${e.slug}" data-kind="${e.kind}"${e.step ? ` data-parent="${e.step}"` : ''} style="--at:${at(e.at)};--lvl:${e.lvl}">
              <span class="tl-node__dot" aria-hidden="true"></span>
              <span class="tl-node__tip"><span class="tl-node__l">${esc(e.project ? bubbleName(e.project) : e.title)}</span><span class="tl-node__d">${esc(e.pt.label)}</span></span>
            </a>`;
    const [l, d] = e.type === 'next'
      ? [seekingBits(bio.seeking)[0] || 'Et ensuite', seekingBits(bio.seeking)[1] || next.year]
      : [stepLabel(e.s), e.s.date.length > 12 ? String(e.span.year) : e.s.date];
    const slug = e.type === 'next' ? next.slug : e.s.slug;
    return `<a class="tl-node tl-node--${e.type === 'next' ? 'next' : e.w}" href="#${slug}" data-step="${slug}" data-kind="${e.type === 'next' ? 'next' : kindKey(e.s)}"${e.align ? ` data-align="${e.align}"` : ''} style="--at:${at(e.at)}">
              <span class="tl-node__dot" aria-hidden="true"></span>
              <span class="tl-node__l">${esc(l)}</span>
              <span class="tl-node__d"${e.type === 'next' ? ' data-seeking' : ''}>${esc(d)}</span>
            </a>`;
  };
  const bars = dated.filter(t => t.span.end).map(({ s, span }) =>
    `<i class="tl-bar${span.fuzzy ? ' tl-bar--fuzzy' : ''}" data-step="${s.slug}" data-kind="${kindKey(s)}" style="--at:${at(span.start)};--len:${((span.end - span.start) / years).toFixed(4)}"></i>`).join('');
  const ticks = Array.from({ length: years + 1 }, (_, i) => `<span style="--at:${at(firstYear + i)}">${firstYear + i}</span>`).join('');
  const legendKinds = [['edu', 'bar', 'Formation'], ['pro', 'bar', 'Expérience'], ['perso', 'dot', 'Projet perso'], ['edu', 'dot', 'Projet ETNA'], ['award', 'dia', 'Diplôme']]
    .filter(([k, shape]) => shape === 'bar' || pins.some(m => m.kind === k));

  const body = (L) => `
    <section class="tl" aria-labelledby="parcours-title">
      <div class="world-ui">${worldHead(page, 'Parcours de développeur web', '', '', { quiet: true })}
      </div>
      <div class="tl-stage" data-initial="${initial}">
        <div class="tl-panels">${items.map(e => panel(e, L)).join('')}
        </div>
      </div>
      <div class="tl-foot js-only" aria-hidden="true">
        <p class="tl-hint"><span class="tl-hint--fine">Cliquez un point · ← → pour tout parcourir</span><span class="tl-hint--touch">Glissez la frise · touchez un point</span></p>
        <p class="tl-legend">${legendKinds.map(([k, shape, t]) => `<span data-kind="${k}"><i class="tl-legend__${shape}"></i>${t}</span>`).join('')}</p>
      </div>
      <nav class="tl-track" aria-label="Frise chronologique ${firstYear} – ${lastYear - 1}" data-from="${firstYear}" data-to="${lastYear}">
        <div class="tl-rail">
          <div class="tl-scale" aria-hidden="true">${ticks}<b class="tl-now"></b></div>
          <div class="tl-lanes" aria-hidden="true">${bars}</div>
          <div class="tl-line" aria-hidden="true"></div>
          <div class="tl-nodes">
            ${items.map(node).join('\n            ')}
          </div>
        </div>
      </nav>
    </section>`;
  return shell(page, {
    title: `Parcours · ${displayName}, ${bio.title}`,
    description: `Parcours d'${displayName} : ${dated.map(t => stepLabel(t.s)).join(', ')}. ${devphantom.title} chez ${company} (${devphantom.date}).`,
    jsonld: { '@type': 'ProfilePage', name: `Parcours · ${displayName}`, mainEntity: PERSON_REF },
    body,
  });
}

// ══════════════════════════════════════════════════════
// 04 · COMPÉTENCES
// ══════════════════════════════════════════════════════
function competencesPage() {
  const page = PAGE.competences;
  const usedCount = allSkills.filter(s => s.used.length).length;
  const body = (L) => {
    const rows = families.map(f => {
      const sorted = [...f.skills].sort((a, b) => b.used.length - a.used.length || a.i - b.i);
      const used = f.skills.filter(s => s.used.length).length;
      return `
          <section class="fam" data-fam="${f.key}" aria-labelledby="fam-${f.key}">
            <h2 class="fam__t" id="fam-${f.key}"><span class="fam__dot" aria-hidden="true"></span><span class="fam__l">${esc(f.label)}</span>${used ? `<span class="fam__n">${used}/${f.skills.length} dans les projets</span>` : ''}</h2>
            <ul class="fam__list">${sorted.map(s => {
              const n = s.used.length;
              const logo = logoOf(s.item);
              return `
              <li class="sk${n ? '' : ' sk--decl'}" id="${s.slug}" data-skill="${s.slug}" data-fam="${f.key}" data-count="${n}" data-projects="${s.used.map(p => p.slug).join(' ')}"${logo ? ` data-logo="${L.up}${logo}"` : ''} style="--w:${(n / maxUse).toFixed(3)}${logo ? `;--logo:url('${L.up}${logo}')` : ''}">
                <button type="button" class="sk__btn">${logo ? '<i class="sk__logo" aria-hidden="true"></i>' : ''}<span class="sk__name">${esc(s.item)}</span><span class="sk__dots" aria-hidden="true">${'<i></i>'.repeat(n)}</span></button>
                <p class="sk__used">${n ? `Utilisée dans ${plural(n, 'projet', 'projets')} : ` : 'Hors des projets présentés ici'}</p>${n ? `
                <ul class="sk__projects">${s.used.map(p => `<li><a href="${L.page('projets', p.slug)}" data-project="${p.slug}" data-cat="${esc(p.category)}">${esc(p.title)}</a></li>`).join('')}</ul>` : ''}
              </li>`;
            }).join('')}
            </ul>
          </section>`;
    }).join('');
    // Projets (slug, titre, catégorie, compétences) : de quoi relier une
    // compétence à ses projets et l'inverse, sans quitter la page.
    const data = JSON.stringify(projects.map(p => ({ slug: p.slug, title: p.title, cat: p.category, type: p.type, skills: projectSkills(p) }))).replace(/</g, '\\u003c');
    return `
    <section class="eco" aria-labelledby="competences-title">
      <div class="world-ui">${worldHead(page, 'Compétences en développement web', '', legend([
        { title: 'Famille', items: families.map(f => `<i class="fam-dot" data-fam="${f.key}"></i>${esc(f.label)}`) },
        { title: 'Taille', items: ['<i class="lg-size lg-size--l"></i>Utilisée dans beaucoup de projets', '<i class="lg-size lg-size--s"></i>Utilisée dans peu de projets', '<i class="lg-size lg-size--decl"></i>Hors des projets présentés'] },
      ]) + `
        <div class="eco-bar js-only" role="toolbar" aria-label="Affichage des compétences">
          <div class="seg-group" role="group" aria-label="Vue">
            <button type="button" class="seg" data-view="space" aria-pressed="true">${icon('orbit')}Écosystème</button>
            <button type="button" class="seg" data-view="list" aria-pressed="false">${icon('list')}Liste</button>
          </div>
        </div>`, { quiet: true })}
      </div>
      <div class="eco-space js-only" data-keys></div>
      <div class="eco-list">
        <p class="eco-list__note">${usedCount} compétences sur ${allSkills.length} apparaissent dans au moins un projet présenté.</p>
        <div class="eco-fam-list" data-keys>${rows}
        </div>
      </div>
      <aside class="eco-panel" aria-label="Détail" hidden>
        <div class="eco-panel__in" aria-live="polite"></div>
      </aside>
      <script type="application/json" id="eco-projects">${data}</script>
    </section>`;
  };
  return shell(page, {
    title: `Compétences Symfony, PHP, React · ${displayName}, Développeur Web`,
    description: `Compétences techniques d'${displayName} : ${mainStack.slice(0, 6).map(s => s.item).join(', ')}… classées par famille et reliées aux projets qui les utilisent.`,
    jsonld: { '@type': 'ProfilePage', name: `Compétences · ${displayName}`, mainEntity: PERSON_REF },
    body,
  });
}

// ══════════════════════════════════════════════════════
// 05 · CONTACT
// ══════════════════════════════════════════════════════
function contactPage() {
  const page = PAGE.contact;
  const tel = contact.phone.replace(/[^\d+]/g, '');
  // Chaque canal est une bulle : un geste, une action. E-mail et téléphone
  // ouvrent l'application (mailto / tel) ; au pointeur fin, js/classic.js
  // les copie à la place. Le formulaire vit dans un panneau (dialog).
  const body = (L) => {
    const orb = ({ key, ic, label, sub, href, attrs = '' }) => `
          <li><a class="ct-orb" data-orb="${key}" href="${esc(href)}"${attrs}>
            <span class="ct-orb__core">${icon(ic)}<span class="ct-orb__l">${esc(label)}</span></span>
            <span class="ct-orb__s">${esc(sub)}</span>
          </a></li>`;
    const links = contact.links.map(l => {
      const cv = /cv/i.test(l.label);
      const id = /github/i.test(l.label) ? 'github' : /linkedin/i.test(l.label) ? 'linkedin' : cv ? 'download' : 'external';
      const href = /^https?:/.test(l.url) ? l.url : L.up + l.url;
      const handle = l.url.replace(/\/+$/, '').split('/').pop();
      return { key: cv ? 'cv' : id, ic: id, label: cv ? 'CV' : l.label, sub: cv ? 'PDF' : handle, href, attrs: ' target="_blank" rel="noopener"' };
    });
    const orbs = [
      { key: 'message', ic: 'send', label: 'Message', sub: 'Formulaire', href: '#message', attrs: ' data-open-message aria-haspopup="dialog"' },
      { key: 'mail', ic: 'mail', label: 'E-mail', sub: contact.email, href: `mailto:${contact.email}`, attrs: ` data-copy="${esc(contact.email)}" data-copied="Adresse copiée"` },
      { key: 'phone', ic: 'phone', label: 'Téléphone', sub: contact.phone, href: `tel:${tel}`, attrs: ` data-copy="${esc(contact.phone)}" data-copied="Numéro copié"` },
      ...links,
    ];
    return `
    <section class="ct" aria-labelledby="contact-title">
      <div class="world-ui">
        <header class="world-head">
          <p class="world-head__k"><span>${page.n}</span>${esc(page.label)}</p>
        </header>
      </div>
      <div class="ct-stage">
        <div class="ct-hero">
          ${bio.seeking ? `<p class="ct-ctx"><span class="pulse" aria-hidden="true"></span><span data-seeking>${esc(bio.seeking)}</span><span>${esc(bio.location)}</span></p>` : ''}
          <h1 class="ct-title" id="contact-title">Travaillons <em>ensemble.</em></h1>
        </div>
        <ul class="ct-orbs" aria-label="Moyens de contact">${orbs.map(orb).join('')}
        </ul>
        <p class="sr-only" role="status" data-copy-status></p>
        <p class="ct-project" id="projet"><span>Un projet à réaliser ?</span><a class="text-link" href="/devis">Construisez votre projet${icon('arrow')}</a><a class="inline-link" href="/tarifs">Voir mes tarifs</a></p>
      </div>
      <dialog class="ct-dlg" id="message" aria-labelledby="form-title">
        <form class="ct-form" id="classic-contact-form">
          <div class="ct-form__h">
            <h2 class="ct-form__t" id="form-title" tabindex="-1" autofocus>Envoyer un message</h2>
            <p>Quelques lignes suffisent, je vous réponds par e-mail.</p>
          </div>
          <div class="ct-form__pair">
            <label class="fld"><span class="fld__l">Nom</span><input type="text" name="from_name" autocomplete="name" placeholder="Prénom Nom" required></label>
            <label class="fld"><span class="fld__l">E-mail</span><input type="email" name="from_email" autocomplete="email" placeholder="vous@exemple.fr" required></label>
          </div>
          <label class="fld"><span class="fld__l">Message</span><textarea name="message" rows="5" placeholder="Bonjour, je vous contacte au sujet de…" required></textarea></label>
          <div class="ct-form__send">
            <button type="submit" class="btn btn--primary">Envoyer${icon('arrow')}</button>
            <p class="ct-form__note">Vos coordonnées servent uniquement à vous répondre.</p>
          </div>
          <p class="form-status" role="status" aria-live="polite"></p>
          <button type="button" class="icon-btn ct-dlg__close js-only" data-close-message aria-label="Fermer le formulaire">${icon('close')}</button>
        </form>
      </dialog>
    </section>`;
  };
  return shell(page, {
    title: `Contact · ${displayName}, ${bio.title} à ${bio.location}`,
    description: `Contacter ${displayName}, ${bio.title} à ${bio.location}. ${bio.seeking}. E-mail, téléphone, LinkedIn, GitHub, CV et formulaire de contact.`,
    jsonld: { '@type': 'ContactPage', name: `Contact · ${displayName}`, mainEntity: PERSON_REF },
    // Le téléphone n'est affiché que sur cette page : il n'est déclaré qu'ici.
    personExtra: { telephone: `+33${tel.replace(/^0/, '')}` },
    body,
    scripts: '<script src="{up}js/contact-form.js"></script>',
  });
}

// ── Écran de sélection : bloc identité ──────────────────
function identity() {
  return `
        ${bio.seeking ? `<p class="pill sel-status"><span class="pulse" aria-hidden="true"></span><span data-seeking>${esc(bio.seeking)}</span></p>` : ''}
        <h1 class="sel-name">${esc(displayName)}</h1>
        <p class="sel-title">${esc(bio.title)} <span>· ${esc(bio.location)}</span></p>
        `;
}

// ── JSON-LD ────────────────────────────────────────────
// Compétences déclarées : sans le doublon « API REST » (= « REST API ») ni
// la mention qui n'est pas une compétence. L'affichage, lui, ne change pas.
const LD_SKIP = new Set(['API REST', 'Modèles locaux & API IA selon les projets']);
const knowsAbout = [...new Set(profile.skillGroups.flatMap(g => g.items))].filter(s => !LD_SKIP.has(s));
// Texte alternatif de l'image de partage (assets/img/og.jpg).
const OG_ALT = `${displayName}, ${bio.title} · ${bio.location}`;

// Une seule personne pour tout le site : toutes les pages pointent sur cet @id.
// Google ne suit pas un @id d'une page à l'autre : le nœud Person complet est
// donc répété dans le @graph de CHAQUE page, et `mainEntity` s'y réfère.
const PERSON_ID  = `${SITE_URL}#person`;
const WEBSITE_ID = `${SITE_URL}#website`;
const PERSON_REF = { '@id': PERSON_ID };

const website = () => ({
  '@type': 'WebSite', '@id': WEBSITE_ID, name: `${displayName} · Portfolio`, url: SITE_URL, inLanguage: 'fr',
  author: PERSON_REF, publisher: PERSON_REF,
});

// Retire les valeurs vides (undefined, null, '', [] ) pour ne jamais les publier.
function clean(v) {
  if (Array.isArray(v)) return v.map(clean).filter(x => x != null);
  if (v && typeof v === 'object') {
    const o = {};
    for (const [k, x] of Object.entries(v)) { const c = clean(x); if (c != null) o[k] = c; }
    return Object.keys(o).length ? o : undefined;
  }
  return v === '' || v == null ? undefined : v;
}

// Graphe d'une page classique : site, personne, la page, son fil d'Ariane
// (sous-pages seulement, en données structurées, rien d'affiché).
function pageGraph(page, node, personExtra) {
  const url = SITE_URL + page.path;
  const sub = page.key !== 'profil';
  return clean({
    '@context': 'https://schema.org',
    '@graph': [
      website(),
      person(personExtra),
      {
        '@type': node['@type'],
        '@id': `${url}#${node['@type'].toLowerCase()}`,
        url,
        inLanguage: 'fr',
        isPartOf: { '@id': WEBSITE_ID },
        ...(sub ? { breadcrumb: { '@id': `${url}#breadcrumb` } } : {}),
        ...node,
      },
      ...(sub ? [breadcrumb(page)] : []),
    ],
  });
}

function breadcrumb(page) {
  return {
    '@type': 'BreadcrumbList',
    '@id': `${SITE_URL}${page.path}#breadcrumb`,
    itemListElement: [PAGE.profil, page].map((p, i) => ({
      '@type': 'ListItem', position: i + 1, name: p === PAGE.profil ? 'Portfolio' : p.label, item: SITE_URL + p.path,
    })),
  };
}

function person(extra = {}) {
  return {
    '@type': 'Person',
    '@id': PERSON_ID,
    name: displayName,
    jobTitle: bio.title,
    description: `${bio.title} à ${bio.location}. ${bio.seeking || ''}`.trim(),
    url: SITE_URL,
    email: `mailto:${contact.email}`,
    address: { '@type': 'PostalAddress', addressLocality: bio.location, addressCountry: 'FR' },
    sameAs: bio.socials.map(s => s.url),
    knowsLanguage: bio.languages.map(l => l.label),
    knowsAbout,
    alumniOf: { '@type': 'CollegeOrUniversity', name: 'ETNA' },
    worksFor: { '@type': 'Organization', name: company },
    ...extra,
  };
}
const ld = (data) => `\n  <script type="application/ld+json">\n${JSON.stringify(data, null, 2).replace(/</g, '\\u003c')}\n  </script>\n  `;

// ── Écriture ───────────────────────────────────────────
function writePage(file, html) {
  const out = join(ROOT, file);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, html);
}
function writeMarked(fileName, parts) {
  const file = join(ROOT, fileName);
  let html = readFileSync(file, 'utf8');
  for (const [name, body] of Object.entries(parts)) {
    const re = new RegExp(`(<!-- build:${name} -->)[\\s\\S]*?(<!-- /build:${name} -->)`);
    if (!re.test(html)) throw new Error(`Marqueur build:${name} introuvable dans ${fileName}`);
    html = html.replace(re, () => `<!-- build:${name} -->${body}<!-- /build:${name} -->`);
  }
  writeFileSync(file, html);
}

// La page Profil reçoit aussi les anciens liens (#projets/skywalk… du mode
// aventure et des versions précédentes) : ils sont renvoyés vers la bonne
// page avant tout affichage.
const LEGACY = `
  <script>
    (function (h) {
      var m = /^#(projets|parcours|competences|contact|portail|services)(?:\\/(.+))?$/.exec(h);
      if (!m) return;
      var page = { projets: 'projets', parcours: 'parcours', competences: 'competences', contact: 'contact', portail: 'contact', services: 'contact' }[m[1]];
      var frag = m[2] ? '#' + m[2] : (m[1] === 'portail' || m[1] === 'services') ? '#projet' : '';
      location.replace('/classique/' + page + location.search + frag);
    })(location.hash);
  </script>`;

writePage(PAGE.profil.file, profilPage().replace('<script src="js/theme.js">', `${LEGACY.trim()}\n  <script src="js/theme.js">`));
writePage(PAGE.projets.file, projetsPage());
writePage(PAGE.parcours.file, parcoursPage());
writePage(PAGE.competences.file, competencesPage());
writePage(PAGE.contact.file, contactPage());

writeMarked('index.html', {
  identity: identity(),
  jsonld: ld(clean({ '@context': 'https://schema.org', '@graph': [website(), person()] })),
});

const withImg = projects.filter(projectImage).length;
console.log(`Mode classique régénéré (${PAGES.length} pages) + index.html, ${projects.length} projets (${withImg} miniature${withImg > 1 ? 's' : ''}), ${steps.length} étapes, ${allSkills.length} compétences (${mainStack.length} dans 2 projets ou plus).`);
