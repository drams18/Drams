/* ══════════════════════════════════════════════════════
   BUILD-CLASSIC.MJS — Génère le HTML statique à partir de
   js/museum.js (source unique, partagée avec le mode aventure).

     npm run build        (ou : node scripts/build-classic.mjs)

   Réécrit uniquement ce qui se trouve entre des marqueurs :
     classique.html  <!-- build:content -->   le mode classique
                     <!-- build:jsonld -->    ProfilePage + Person
     index.html      <!-- build:identity -->  identité (écran de sélection)
                     <!-- build:jsonld -->    WebSite + Person
   Le reste des pages (head, header, footer) s'édite à la main.

   Résultat : HTML complet, lisible sans JavaScript et indexable. Les
   visualisations (espace de projets, frise, écosystème de compétences)
   sont une couche ajoutée par src/classic/*.js sur ce même HTML.

   Tout ce qui n'est pas écrit tel quel dans museum.js est DÉRIVÉ ici
   (statut, taille des bulles, liens compétence ↔ projet, chronologie),
   jamais inventé. Aucune dépendance.
   ══════════════════════════════════════════════════════ */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const { SECTIONS } = require('../js/museum.js');

// Adresse publique du site (Cloudflare Pages). À changer ici — et dans les
// <head> des pages — le jour où un nom de domaine est acheté.
const SITE_URL = 'https://portfolio-3kx.pages.dev/';

// ── Helpers ────────────────────────────────────────────
const esc = (v) => String(v ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const plural = (n, one, many) => `${n} ${n > 1 ? many : one}`;
const icon = (id, cls = 'ico') => `<svg class="${cls}" aria-hidden="true" focusable="false"><use href="#i-${id}"/></svg>`;
const slugify = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

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
const seekingYear = (bio.seeking || '').match(/(?:19|20)\d{2}/)?.[0] || null;

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

// Miniature : champ `image` du projet, sinon assets/img/projets/<slug>.webp
// s'il existe (il suffit de déposer le fichier, 16:10 conseillé).
const projectImage = (p) => p.image
  || (existsSync(join(ROOT, `assets/img/projets/${p.slug}.webp`)) ? `assets/img/projets/${p.slug}.webp` : null);

// Web / mobile, déduit du type.
const isMobile = (p) => /mobile/i.test(p.type || '');

// ── Chronologie ────────────────────────────────────────
// « 01/2024 — 10/2026 », « 2021 — début 2022 », « 2020 »… → années décimales.
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
const timeline = steps.map(s => ({ s, span: spanOf(s.date) }));
const dated   = timeline.filter(t => t.span).sort((a, b) => a.span.start - b.span.start);
const undated = timeline.filter(t => !t.span);
// Poids visuel : l'expérience professionnelle liée aux projets domine.
const weightOf = (s) => s.kind === 'PROFESSIONNEL' && s.role ? 'major' : 'normal';
// Libellé court : le mot du titre / lieu qui correspond au `short` (« DevPhantom »).
function stepLabel(s) {
  const words = `${s.title} ${s.place || ''}`.split(/[\s·—,()]+/);
  return words.find(w => w.toUpperCase() === s.short) || s.short;
}
const firstYear = Math.floor(Math.min(...dated.map(t => t.span.start)));
const lastYear  = Math.max(...dated.map(t => Math.ceil(t.span.end ?? t.span.start + 1)));

// ── Fragments ──────────────────────────────────────────
function secHead(id, n, kicker, title, lead) {
  return `
      <header class="sec-head">
        <p class="sec-kicker"><span>${n}</span>${esc(kicker)}</p>
        <h2 class="sec-title" id="${id}-title">${esc(title)}</h2>
        ${lead ? `<p class="sec-lead">${lead}</p>` : ''}
      </header>`;
}

// ── Hero : séquence d'entrée ────────────────────────────
function hero() {
  const meta = [bio.location, ...seekingBits(bio.seeking)].map(m => `<span class="hero__meta-i">${esc(m)}</span>`).join('');
  const social = bio.socials.map(s => {
    const id = /github/i.test(s.label) ? 'github' : /linkedin/i.test(s.label) ? 'linkedin' : 'external';
    return `<a class="icon-link" href="${esc(s.url)}" target="_blank" rel="noopener">${icon(id)}<span>${esc(s.label)}</span></a>`;
  }).join('');
  // « Ce que vous pouvez explorer » : les portes de la page, chiffrées.
  const doors = [
    { href: '#profil', n: '01', label: 'Profil', hint: 'Qui je suis' },
    { href: '#projets', n: '02', label: 'Projets', hint: plural(projects.length, 'réalisation', 'réalisations') },
    { href: '#parcours', n: '03', label: 'Parcours', hint: `${firstYear} → ${lastYear - 1}` },
    { href: '#competences', n: '04', label: 'Compétences', hint: plural(allSkills.length, 'technologie', 'technologies') },
  ].map(d => `<li><a href="${d.href}"><span class="door__n">${d.n}</span><span class="door__l">${d.label}</span><span class="door__h">${esc(d.hint)}</span></a></li>`).join('');
  const [first, ...rest] = displayName.split(' ');
  return `
    <section class="hero" id="top" data-route="ville" aria-labelledby="hero-name">
      <div class="hero__bg" aria-hidden="true"><div class="hero__glow"></div><div class="hero__sky"></div></div>
      <div class="wrap hero__inner">
        <div class="hero__seq">
          <p class="hero__kicker">${esc(bio.title)}</p>
          <h1 class="hero__name" id="hero-name"><span class="hero__w"><span>${esc(first)}</span></span> <span class="hero__w"><span>${esc(rest.join(' '))}</span></span></h1>
          <p class="hero__line">${esc(bioSentences[1] || profile.positioning)}</p>
          <p class="hero__meta"><span class="pulse" aria-hidden="true"></span>${meta}</p>
          <div class="hero__cta">
            <a class="btn btn--primary" href="#projets">Explorer mes projets${icon('arrow')}</a>
            <a class="btn btn--ghost" href="assets/CV.pdf" target="_blank" rel="noopener">${icon('download')}Télécharger le CV</a>
            <button type="button" class="btn btn--ghost" data-contact-cta data-contact-subject="Prise de contact — Portfolio">${icon('mail')}Me contacter</button>
          </div>
          <div class="hero__social">${social}</div>
        </div>
        <nav class="hero__doors" aria-label="Explorer le portfolio">
          <p class="hero__doors-k">À explorer</p>
          <ol>${doors}</ol>
        </nav>
      </div>
    </section>`;
}

// ── Profil : un récit en quatre chapitres ───────────────
function story() {
  const web = projects.filter(p => !isMobile(p)).length;
  const mobile = projects.length - web;
  const langs = bio.languages.map(l => `<li><strong>${esc(l.label)}</strong> ${esc(l.level)}</li>`).join('');
  const quals = profile.qualities.map(q => `<li>${esc(q)}</li>`).join('');
  const top = mainStack.slice(0, 6).map(s =>
    `<li><a href="#competences/${s.slug}" data-skill-link="${s.slug}"><strong>${esc(s.item)}</strong><span>${plural(s.used.length, 'projet', 'projets')}</span></a></li>`).join('');
  const team = (devphantom.place || '').split(' · ').slice(1).join(' · ');

  const chapters = [
    {
      id: 'identite', k: 'Identité', lead: `${displayName}. ${bio.title} en ${bio.location}.`,
      body: `
              <dl class="facts">
                ${bio.seeking ? `<div><dt>Je recherche</dt><dd>${esc(bio.seeking)}</dd></div>` : ''}
                <div><dt>Aujourd'hui</dt><dd>${esc(bio.availability)}</dd></div>
                <div><dt>Langues</dt><dd><ul class="inline-list">${langs}</ul></dd></div>
              </dl>`,
    },
    {
      id: 'approche', k: 'Approche', lead: profile.positioning,
      body: `
              <p class="chapter__text">${esc(bioSentences.slice(1).join(' '))}</p>
              <ul class="inline-list">${quals}</ul>`,
    },
    {
      id: 'expertise', k: 'Expertise', lead: `Du frontend au backend : ${plural(web, 'projet web', 'projets web')} et ${plural(mobile, 'application mobile', 'applications mobiles')}.`,
      body: `
              <p class="chapter__text">Les technologies les plus présentes dans mes projets :</p>
              <ul class="top-stack">${top}</ul>`,
    },
    {
      id: 'experience', k: 'Expérience', lead: `${devphantom.title} chez ${company}, ${devphantom.date}.`,
      body: `
              <p class="chapter__text">${esc(devphantom.desc)}</p>
              <ul class="figures">
                <li><strong>${byCat.Professionnel.length}</strong><span>projets professionnels, en équipe</span></li>
                ${team ? `<li><strong>${esc(company)}</strong><span>${esc(team)}</span></li>` : ''}
                <li><strong>${esc(etna.date)}</strong><span>${esc(etna.title)}</span></li>
              </ul>
              <a class="text-link" href="#parcours/devphantom">Voir le parcours${icon('arrow')}</a>`,
    },
  ];
  return `
    <section class="sec story" id="profil" data-route="profil" aria-labelledby="profil-title">
      <div class="wrap">${secHead('profil', '01', 'Profil', 'Qui je suis')}
        <div class="story__grid">
          <nav class="story__rail" aria-label="Chapitres du profil">
            <ol>${chapters.map((c, i) => `<li><a href="#profil-${c.id}"><span>0${i + 1}</span>${esc(c.k)}</a></li>`).join('')}</ol>
          </nav>
          <div class="story__chapters">${chapters.map((c, i) => `
            <article class="chapter" id="profil-${c.id}" aria-labelledby="profil-${c.id}-t">
              <p class="chapter__k" id="profil-${c.id}-t"><span>0${i + 1}</span>${esc(c.k)}</p>
              <p class="chapter__lead">${esc(c.lead)}</p>
              <div class="chapter__more">${c.body}
              </div>
            </article>`).join('')}
          </div>
        </div>
      </div>
    </section>`;
}

// ── Projets : index sémantique complet ──────────────────
// Sans JS (et pour les moteurs) : la liste complète, fiches dépliées.
// Avec JS : src/classic/projects.js en tire l'espace de bulles et la fiche.
function projectCover(p) {
  const img = projectImage(p);
  if (img) {
    return `<div class="pj-cover"><img class="pj-cover__img" src="${esc(img)}" alt="Aperçu du projet ${esc(p.title)}" loading="lazy" decoding="async" width="1280" height="800"></div>`;
  }
  // Pas de capture (projet privé ou visuel à venir) : couverture
  // typographique, jamais d'image inventée.
  return `<div class="pj-cover pj-cover--type" aria-hidden="true"><span>${esc(bubbleName(p))}</span></div>`;
}

function techList(p) {
  return `<ul class="tags" aria-label="Technologies">${(p.tech || []).map(t => {
    const s = skillOfTech(t);
    return s
      ? `<li><a class="tag-link" href="#competences/${s.slug}" data-skill-link="${s.slug}" data-fam="${s.fam.key}">${esc(t)}</a></li>`
      : `<li>${esc(t)}</li>`;
  }).join('')}</ul>`;
}

function projectItem(p) {
  const ctx = contextOf(p);
  const img = projectImage(p);
  const links = (p.links || []).map(l =>
    `<a class="btn btn--sm" href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)}${icon('external', 'ico ico--xs')}</a>`).join('');
  return `
          <li class="pj-item" id="projets/${p.slug}" data-route="projets/${p.slug}" data-slug="${p.slug}"
              data-cat="${esc(p.category)}" data-tier="${tierOf(p)}" data-status="${statusOf(p).tone}"
              data-name="${esc(bubbleName(p))}" data-skills="${projectSkills(p).join(' ')}"${img ? ` data-img="${esc(img)}"` : ''}${p.pick ? ' data-pick' : ''}>
            <article aria-labelledby="p-${p.slug}">
              <div class="pj-item__head">
                <span class="pj-item__orb" aria-hidden="true"></span>
                <h3 class="pj-item__title" id="p-${p.slug}">${esc(p.title)}</h3>
                <p class="pj-item__meta"><span class="chip-cat">${esc(p.category)}</span><span>${esc(p.type)}</span>${ctx ? `<span>${esc(ctx)}</span>` : ''}</p>
                <p class="pj-item__status">${statusBadge(p)}</p>
              </div>
              <div class="pj-item__body">
                ${projectCover(p)}
                <p class="pj-item__desc">${esc(p.desc)}</p>
                ${techList(p)}
                ${p.role ? `<div class="pj-item__role"><h4 class="mini-title">Mon rôle</h4><p>${esc(p.role)}</p></div>` : ''}
                ${links ? `<div class="pj-item__links">${links}</div>` : ''}
              </div>
            </article>
          </li>`;
}

function projectsSection() {
  const counts = `${byCat.Professionnel.length} professionnels (${esc(company)}, en équipe), ${byCat.Personnel.length} personnels, ${plural(byCat.Scolaire.length, 'scolaire', 'scolaires')}.`;
  return `
    <section class="sec pj" id="projets" data-route="projets" aria-labelledby="projets-title">
      <div class="wrap">${secHead('projets', '02', 'Projets', 'Projets', `${plural(projects.length, 'projet', 'projets')} : ${counts} <span class="js-only">Explorez l'espace, ou passez en liste.</span>`)}
        <div class="pj-bar js-only" role="toolbar" aria-label="Affichage des projets">
          <div class="pj-bar__filters" role="group" aria-label="Filtrer par catégorie">
            <button type="button" class="seg" data-filter="all" aria-pressed="true">Tous <span>${projects.length}</span></button>
            ${CATEGORIES.map(c => `<button type="button" class="seg" data-filter="${c}" aria-pressed="false"><i class="cat-dot" data-cat="${c}" aria-hidden="true"></i>${c} <span>${byCat[c].length}</span></button>`).join('\n            ')}
          </div>
          <div class="pj-bar__view" role="group" aria-label="Vue">
            <button type="button" class="seg" data-view="space" aria-pressed="true">${icon('orbit')}Espace</button>
            <button type="button" class="seg" data-view="list" aria-pressed="false">${icon('list')}Liste</button>
          </div>
        </div>
      </div>
      <div class="pj-space js-only" aria-label="Espace des projets"></div>
      <div class="wrap">
        <ol class="pj-index" aria-label="Tous les projets">${projects.map(projectItem).join('')}
        </ol>
        <p class="pj-legend js-only">Taille : <span>grande = à ne pas rater</span><span>moyenne = professionnel</span><span>petite = autre</span></p>
      </div>
    </section>`;
}

// ── Parcours : frise chronologique ──────────────────────
function spanChart() {
  const range = lastYear - firstYear;
  const pct = (v) => ((v - firstYear) / range * 100).toFixed(2);
  const lanes = ['ACADÉMIQUE', 'PROFESSIONNEL'].map(kind => {
    const items = dated.filter(t => t.s.kind === kind).map(({ s, span }) => {
      const left = pct(span.start);
      const width = span.end ? (((span.end - span.start) / range) * 100).toFixed(2) : null;
      return `<a class="span${width ? '' : ' span--point'}${span.fuzzy ? ' span--fuzzy' : ''}${weightOf(s) === 'major' ? ' span--major' : ''}" href="#parcours/${s.slug}" style="--l:${left}%;${width ? ` --w:${width}%;` : ''}" title="${esc(s.title)} · ${esc(s.date)}"><span>${esc(stepLabel(s))}</span></a>`;
    }).join('');
    return `<div class="spans__lane" data-kind="${kind === 'ACADÉMIQUE' ? 'edu' : 'pro'}"><span class="spans__k">${KIND[kind]}</span><div class="spans__track">${items}</div></div>`;
  }).join('');
  const ticks = Array.from({ length: range }, (_, i) => `<span style="--l:${pct(firstYear + i)}%">${firstYear + i}</span>`).join('');
  return `
        <figure class="spans" data-from="${firstYear}" data-to="${lastYear}" aria-label="Vue d'ensemble : formation et expérience de ${firstYear} à ${lastYear - 1}">
          ${lanes}
          <div class="spans__ruler" aria-hidden="true"><span class="spans__k"></span><div class="spans__track">${ticks}</div></div>
          <div class="spans__now" aria-hidden="true"></div>
        </figure>`;
}

function eventItem({ s, span }) {
  const weight = weightOf(s);
  const details = (s.details && s.details.length)
    ? `<ul class="ev__details">${s.details.map(d => `<li>${esc(d)}</li>`).join('')}</ul>` : '';
  const projectsOf = s.slug === 'devphantom' ? byCat.Professionnel : [];
  const chips = projectsOf.length ? `
                <p class="ev__sub">Projets ${esc(company)} (en équipe)</p>
                <ul class="ev__projects">${projectsOf.map(p =>
                  `<li><a href="#projets/${p.slug}" data-project-link="${p.slug}"><strong>${esc(p.title)}</strong><span>${esc(p.type)}</span></a></li>`).join('')}</ul>` : '';
  // Le secondaire (contexte, rôle, détails) se déplie à la demande.
  const more = [
    s.context ? `<p class="ev__text">${esc(s.context)}</p>` : '',
    details,
    s.role && !projectsOf.length ? `<p class="ev__role"><span>Mon rôle</span>${esc(s.role)}</p>` : '',
  ].join('');
  return `
          <li class="ev ev--${weight}" id="parcours/${s.slug}" data-route="parcours/${s.slug}" data-year="${span ? span.year : ''}" data-kind="${s.kind === 'ACADÉMIQUE' ? 'edu' : 'pro'}">
            <span class="ev__dot" aria-hidden="true"></span>
            <div class="ev__card">
              <p class="ev__date"><span>${esc(KIND[s.kind] || s.kind)}</span>${esc(s.date)}</p>
              <h3 class="ev__title">${esc(s.title)}</h3>
              ${s.place ? `<p class="ev__place">${esc(s.place)}</p>` : ''}
              ${s.desc ? `<p class="ev__text">${esc(s.desc)}</p>` : ''}${chips}
              ${more ? `<details class="ev__more"${weight === 'major' ? ' open' : ''}><summary>${weight === 'major' ? 'Le détail' : 'En savoir plus'}${icon('chevron', 'ico ev__chev')}</summary><div class="ev__more-body">${more}</div></details>` : ''}
            </div>
          </li>`;
}

function parcours() {
  const next = bio.seeking ? `
          <li class="ev ev--next" data-year="${seekingYear || ''}">
            <span class="ev__dot" aria-hidden="true"></span>
            <div class="ev__card">
              <p class="ev__date"><span>Et ensuite</span>${seekingYear || ''}</p>
              <h3 class="ev__title">${esc(bio.seeking)}</h3>
              <p class="ev__text">${esc(bio.title)} · ${esc(bio.location)}</p>
              <button type="button" class="text-link" data-contact-cta data-contact-subject="Proposition de CDI — Portfolio">Me contacter${icon('arrow')}</button>
            </div>
          </li>` : '';
  const aside = undated.map(({ s }) => `
        <aside class="ev ev--aside" id="parcours/${s.slug}" data-route="parcours/${s.slug}" aria-labelledby="ev-${s.slug}">
          <p class="ev__date"><span>${esc(KIND[s.kind] || s.kind)}</span>${esc(s.date)}</p>
          <h3 class="ev__title" id="ev-${s.slug}">${esc(s.title)}</h3>
          ${s.desc ? `<p class="ev__text">${esc(s.desc)}</p>` : ''}
          ${s.details && s.details.length ? `<details class="ev__more"><summary>En savoir plus${icon('chevron', 'ico ev__chev')}</summary><ul class="ev__details">${s.details.map(d => `<li>${esc(d)}</li>`).join('')}</ul></details>` : ''}
        </aside>`).join('');
  return `
    <section class="sec tl-sec" id="parcours" data-route="parcours/devphantom" aria-labelledby="parcours-title">
      <div class="wrap">${secHead('parcours', '03', 'Parcours', 'Parcours', `Alternance chez ${esc(company)} (${esc(devphantom.date)}), en parallèle de l'ETNA (${esc(etna.date)}).`)}${spanChart()}
        <div class="tlx">
          <div class="tlx__year" aria-hidden="true"><span class="tlx__year-v">${firstYear}</span></div>
          <ol class="tlx__list">${dated.map(eventItem).join('')}${next}
          </ol>
        </div>${aside}
      </div>
    </section>`;
}

// ── Compétences : écosystème pondéré par les projets ────
function skills() {
  const rows = families.map(f => {
    const sorted = [...f.skills].sort((a, b) => b.used.length - a.used.length || a.i - b.i);
    const used = f.skills.filter(s => s.used.length).length;
    return `
          <div class="fam" data-fam="${f.key}">
            <h3 class="fam__t"><span class="fam__dot" aria-hidden="true"></span>${esc(f.label)}<span class="fam__n">${used}/${f.skills.length} dans les projets</span></h3>
            <ul class="fam__list">${sorted.map(s => {
              const n = s.used.length;
              const w = (n / maxUse).toFixed(3);
              const usedText = n ? `${plural(n, 'projet', 'projets')} : ${s.used.map(p => p.title).join(', ')}` : 'Hors des projets présentés ici';
              return `
              <li class="sk${n ? '' : ' sk--decl'}" id="competences/${s.slug}" data-skill="${s.slug}" data-fam="${f.key}" data-count="${n}" data-projects="${s.used.map(p => p.slug).join(' ')}" style="--w:${w}">
                <button type="button" class="sk__btn"><span class="sk__name">${esc(s.item)}</span><span class="sk__dots" aria-hidden="true">${'<i></i>'.repeat(n)}</span></button>
                <span class="sk__used">${esc(usedText)}</span>
              </li>`;
            }).join('')}
            </ul>
          </div>`;
  }).join('');
  const bars = mainStack.slice(0, 6).map(s =>
    `<li><a href="#competences/${s.slug}" data-skill-link="${s.slug}" data-fam="${s.fam.key}" style="--w:${(s.used.length / maxUse).toFixed(3)}"><span class="bar__l">${esc(s.item)}</span><span class="bar__v">${s.used.length}</span></a></li>`).join('');
  const usedCount = allSkills.filter(s => s.used.length).length;
  return `
    <section class="sec sk-sec" id="competences" data-route="profil" aria-labelledby="competences-title">
      <div class="wrap">${secHead('competences', '04', 'Compétences', 'Écosystème technique', `${plural(allSkills.length, 'compétence', 'compétences')}, ${families.length} familles. Plus une technologie revient dans mes projets, plus elle est grande.`)}
        <p class="sk-legend"><span class="sk-legend__i"><i class="sk-legend__s">Aa</i><i class="sk-legend__l">Aa</i> taille = nombre de projets</span><span class="sk-legend__i"><span class="sk__dots"><i></i><i></i><i></i></span> un point par projet</span><span class="sk-legend__i"><span class="sk-legend__decl">Aa</span> hors des projets présentés</span></p>
        <div class="sk-layout">
          <div class="sk-map">${rows}
          </div>
          <aside class="sk-panel" aria-label="Détail de la compétence">
            <div class="sk-panel__overview">
              <p class="mini-title">Les plus présentes</p>
              <ol class="bars">${bars}</ol>
              <p class="sk-panel__note">${usedCount} compétences sur ${allSkills.length} apparaissent dans au moins un projet présenté. <span class="js-only">Sélectionnez une technologie pour voir ses projets.</span></p>
            </div>
            <div class="sk-panel__detail" aria-live="polite"></div>
          </aside>
        </div>
      </div>
    </section>`;
}

function services() {
  return `
    <section class="sec sec--band" id="services" data-route="portail" aria-labelledby="services-title">
      <div class="wrap">
        <header class="sec-head">
          <h2 class="sec-title" id="services-title">Vous avez un projet ?</h2>
          <p class="sec-lead">Particulier ou professionnel : consultez mes tarifs, ou décrivez votre projet pas à pas.</p>
        </header>
        <div class="services">
          <a class="btn btn--primary" href="devis.html">Construisez votre projet${icon('arrow')}</a>
          <a class="btn btn--ghost" href="tarifs.html">Voir mes tarifs</a>
        </div>
      </div>
    </section>`;
}

function contactSection() {
  const links = contact.links.map(l => {
    const id = /github/i.test(l.label) ? 'github' : /linkedin/i.test(l.label) ? 'linkedin' : /cv/i.test(l.label) ? 'download' : 'external';
    return `<a class="icon-link" href="${esc(l.url)}" target="_blank" rel="noopener">${icon(id)}<span>${esc(l.label)}</span></a>`;
  }).join('\n            ');
  const tel = contact.phone.replace(/[^\d+]/g, '');
  return `
    <section class="sec contact-sec" id="contact" data-route="contact" aria-labelledby="contact-title">
      <div class="wrap">${secHead('contact', '05', 'Contact', 'Contact', bio.seeking ? `${esc(bio.seeking)}. Écrivez-moi ou appelez-moi directement.` : '')}
        <div class="contact">
          <div class="contact__direct">
            <div class="contact__row">
              ${icon('mail')}<a class="contact__value" href="mailto:${esc(contact.email)}">${esc(contact.email)}</a>
              <button type="button" class="copy" data-copy="${esc(contact.email)}" aria-label="Copier l'adresse e-mail">Copier</button>
            </div>
            <div class="contact__row">
              ${icon('phone')}
              <span class="contact__value" data-phone="${esc(tel)}">${esc(contact.phone)}</span>
              <button type="button" class="copy" data-copy="${esc(contact.phone)}" aria-label="Copier le numéro de téléphone">Copier</button>
            </div>
            <div class="contact__links">
            ${links}
            </div>
          </div>
          <form class="card contact__form" id="classic-contact-form">
            <h3 class="mini-title">Envoyer un message</h3>
            <label>Votre nom<input type="text" name="from_name" autocomplete="name" required></label>
            <label>Votre email<input type="email" name="from_email" autocomplete="email" required></label>
            <label>Votre message<textarea name="message" rows="5" required></textarea></label>
            <button type="submit" class="btn btn--primary">Envoyer</button>
            <p class="form-status" role="status" aria-live="polite"></p>
          </form>
        </div>
      </div>
    </section>`;
}

// ── Écran de sélection : bloc identité ──────────────────
function identity() {
  return `
        ${bio.seeking ? `<p class="pill sel-status"><span class="pulse" aria-hidden="true"></span>${esc(bio.seeking)}</p>` : ''}
        <h1 class="sel-name">${esc(displayName)}</h1>
        <p class="sel-title">${esc(bio.title)} <span>· ${esc(bio.location)}</span></p>
        `;
}

// ── JSON-LD ────────────────────────────────────────────
function person() {
  return {
    '@type': 'Person',
    '@id': `${SITE_URL}#person`,
    name: displayName,
    jobTitle: bio.title,
    description: `${bio.title} en ${bio.location}. ${bio.seeking || ''}`.trim(),
    url: SITE_URL,
    image: `${SITE_URL}assets/img/og.jpg`,
    email: `mailto:${contact.email}`,
    address: { '@type': 'PostalAddress', addressRegion: bio.location, addressCountry: 'FR' },
    sameAs: bio.socials.map(s => s.url),
    knowsLanguage: bio.languages.map(l => l.label),
    knowsAbout: [...new Set(profile.skillGroups.flatMap(g => g.items))],
    alumniOf: { '@type': 'CollegeOrUniversity', name: 'ETNA' },
    worksFor: { '@type': 'Organization', name: 'DevPhantom' },
  };
}
const ld = (data) => `\n  <script type="application/ld+json">\n${JSON.stringify(data, null, 2).replace(/</g, '\\u003c')}\n  </script>\n  `;

// ── Écriture ───────────────────────────────────────────
function write(fileName, parts) {
  const file = join(ROOT, fileName);
  let html = readFileSync(file, 'utf8');
  for (const [name, body] of Object.entries(parts)) {
    const re = new RegExp(`(<!-- build:${name} -->)[\\s\\S]*?(<!-- /build:${name} -->)`);
    if (!re.test(html)) throw new Error(`Marqueur build:${name} introuvable dans ${fileName}`);
    html = html.replace(re, () => `<!-- build:${name} -->${body}<!-- /build:${name} -->`);
  }
  writeFileSync(file, html);
}

write('classique.html', {
  content: [hero(), story(), projectsSection(), parcours(), skills(), services(), contactSection()].join('\n') + '\n    ',
  jsonld: ld({
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    url: `${SITE_URL}classique`,
    inLanguage: 'fr',
    mainEntity: person(),
  }),
});

write('index.html', {
  identity: identity(),
  jsonld: ld({
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'WebSite', '@id': `${SITE_URL}#site`, name: 'Arphan Drame — Portfolio', url: SITE_URL, inLanguage: 'fr', author: { '@id': `${SITE_URL}#person` } },
      person(),
    ],
  }),
});

const withImg = projects.filter(projectImage).length;
console.log(`classique.html + index.html régénérés — ${projects.length} projets (${withImg} miniature${withImg > 1 ? 's' : ''}), ${steps.length} étapes, ${allSkills.length} compétences (${mainStack.length} dans 2 projets ou plus).`);
