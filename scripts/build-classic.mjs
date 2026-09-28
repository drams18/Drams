/* ══════════════════════════════════════════════════════
   BUILD-CLASSIC.MJS — Génère le contenu du MODE CLASSIQUE
   à partir de js/museum.js (source unique, partagée avec
   le mode aventure).

     npm run build        (ou : node scripts/build-classic.mjs)

   Réécrit, dans index.html, uniquement ce qui se trouve entre
   les marqueurs :
     <!-- build:content -->  …  <!-- /build:content -->
     <!-- build:jsonld -->   …  <!-- /build:jsonld -->
   Le reste de la page (head, header, footer) s'édite à la main.

   Résultat : HTML statique, lisible sans JavaScript et
   indexable. Aucune dépendance.
   ══════════════════════════════════════════════════════ */

import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const { SECTIONS, CATEGORY_ACCENT } = require('../js/museum.js');

const SITE_URL = 'https://drams18.github.io/Drams/';

// ── Helpers ────────────────────────────────────────────
const esc = (v) => String(v ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const plural = (n, one, many) => `${n} ${n > 1 ? many : one}`;

// Maison de la ville correspondant à chaque section (même couleur que
// dans le mode aventure — js/map.js BUILDINGS_DATA / SPECIAL_DOOR).
const HOUSES = {
  profil:   { label: 'PROFIL',   color: '#19e8ff' },
  parcours: { label: 'PARCOURS', color: '#8a3bff' },
  projets:  { label: 'GALERIE',  color: '#ff123d' },
  contact:  { label: 'CONTACT',  color: '#ff2bb0' },
  portail:  { label: 'CONSTRUISEZ VOTRE PROJET', color: '#19e8ff' },
};

// ── Données ────────────────────────────────────────────
const profile  = SECTIONS.profile;
const bio      = profile.bio;
const steps    = SECTIONS.parcours.steps;
const projects = SECTIONS.projets.items;
const contact  = SECTIONS.contact;

const step = (slug) => steps.find(s => s.slug === slug);
const devphantom = step('devphantom');
const autres     = step('autres');
const academic   = steps.filter(s => s.kind === 'ACADÉMIQUE');
const etna       = step('etna');

const CATEGORIES = ['Professionnel', 'Personnel', 'Scolaire'];
const byCat = Object.fromEntries(CATEGORIES.map(c => [c, projects.filter(p => p.category === c)]));
const picks = projects.filter(p => p.pick);
const appStore = projects.filter(p => (p.links || []).some(l => /apps\.apple\.com/.test(l.url)));

// Compétence ↔ projets : une compétence est « utilisée » si elle figure
// dans la stack d'au moins un projet du portfolio (aucune invention :
// simple croisement des données existantes).
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

// ── Fragments ──────────────────────────────────────────
const houseIcon = `<svg class="house-ico" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><use href="#i-house"/></svg>`;

function secHead(route, id, title, lead) {
  const h = HOUSES[route];
  return `
      <header class="sec-head">
        <h2 class="sec-title" id="${id}-title">${esc(title)}</h2>
        <a class="sec-house" href="aventure.html#${route}" data-switch-adventure
           title="Voir cette section dans le mode aventure">
          ${houseIcon}<span>Maison ${esc(h.label)}</span>
        </a>
        ${lead ? `<p class="sec-lead">${esc(lead)}</p>` : ''}
      </header>`;
}

function facts() {
  const n = (c) => byCat[c].length;
  const counts = `${n('Professionnel')} pro · ${n('Personnel')} perso · ${plural(n('Scolaire'), 'scolaire', 'scolaires')}`;
  const apps = appStore.map(p => `${p.title} (${p.category === 'Professionnel' ? 'en équipe' : 'projet perso'})`).join(' · ');
  const items = [
    { k: 'Expérience', v: 'DevPhantom', m: `Alternance Full Stack · ${devphantom.date}` },
    { k: 'Formation', v: etna.title, m: etna.date },
    { k: 'Projets', v: plural(projects.length, 'projet', 'projets'), m: counts },
    { k: 'App Store', v: plural(appStore.length, 'application publiée', 'applications publiées'), m: apps },
  ];
  return `
        <dl class="facts">
          ${items.map(f => `<div class="fact">
            <dt>${esc(f.k)}</dt>
            <dd><strong>${esc(f.v)}</strong><span>${esc(f.m)}</span></dd>
          </div>`).join('\n          ')}
        </dl>`;
}

function hero() {
  const socials = bio.socials.map(s =>
    `<a class="btn btn--small" href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.label)}</a>`).join('\n            ');
  return `
    <section class="hero" id="top" data-route="ville" aria-labelledby="hero-name">
      <div class="hero__bg" aria-hidden="true"></div>
      <div class="wrap hero__inner">
        <div class="hero__id">
          <p class="eyebrow">Portfolio</p>
          <h1 class="hero__name" id="hero-name">${esc(bio.name.toUpperCase())}</h1>
          <p class="hero__title">${esc(bio.title)}</p>
          <p class="hero__loc">Frontend &amp; Backend · s'adapte vite à une nouvelle stack — ${esc(bio.location)}</p>
          ${bio.seeking ? `<p class="hero__seeking"><span class="pulse" aria-hidden="true"></span>${esc(bio.seeking)}</p>` : ''}
          <div class="hero__cta">
            <a class="btn btn--primary" href="assets/CV.pdf" target="_blank" rel="noopener">Voir mon CV</a>
            <button type="button" class="btn btn--ghost" data-contact-cta data-contact-subject="Prise de contact — Portfolio">Me contacter</button>
          </div>
          <div class="hero__social">
            ${socials}
          </div>
        </div>

        <div class="choice" aria-labelledby="choice-title">
          <h2 class="choice__title" id="choice-title">Deux façons de me découvrir</h2>
          <p class="choice__lead">Le même parcours, les mêmes projets : à lire, ou à explorer.</p>
          <div class="choice__grid">
            <a class="mode-card mode-card--classic" href="#profil">
              <span class="mode-card__preview" aria-hidden="true">
                <span class="pv-page">
                  <span class="pv-bar pv-bar--name"></span>
                  <span class="pv-bar pv-bar--sub"></span>
                  <span class="pv-cards">
                    <span class="pv-card" style="--c:#19e8ff"></span>
                    <span class="pv-card" style="--c:#ff2bb0"></span>
                    <span class="pv-card" style="--c:#8a3bff"></span>
                  </span>
                  <span class="pv-chips"><i></i><i></i><i></i><i></i></span>
                </span>
              </span>
              <span class="mode-card__body">
                <span class="mode-card__k">${iconBriefcase()}Mode classique</span>
                <span class="mode-card__t">Découvrez mon parcours, mes compétences et mes projets.</span>
                <span class="mode-card__meta">L'essentiel en 2 minutes · vous y êtes</span>
                <span class="mode-card__go">Lire le portfolio</span>
              </span>
            </a>
            <a class="mode-card mode-card--adventure" href="aventure.html#ville" data-switch-adventure data-fixed-route>
              <span class="mode-card__preview" aria-hidden="true">${cityPreview()}</span>
              <span class="mode-card__body">
                <span class="mode-card__k">${iconGamepad()}Mode aventure</span>
                <span class="mode-card__t">Explorez mon univers et découvrez mon parcours autrement.</span>
                <span class="mode-card__meta">Environ 5 minutes · son recommandé · clavier ou boutons tactiles</span>
                <span class="mode-card__go" data-resume="Reprendre la balade">Entrer dans la ville</span>
              </span>
            </a>
          </div>
        </div>
      </div>
    </section>`;
}

function iconBriefcase() {
  return `<svg class="mode-ico" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M8 7V5h8v2M3 8h18v11H3zM3 13h18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="miter"/></svg>`;
}
function iconGamepad() {
  return `<svg class="mode-ico" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 8h16l2 9h-5l-2-3H9l-2 3H2zM7 10v4M5 12h4" fill="none" stroke="currentColor" stroke-width="2.2"/><rect x="15" y="10.5" width="2" height="2" fill="currentColor"/></svg>`;
}

// Miniature de la ville — mêmes maisons, mêmes couleurs que le jeu.
function cityPreview() {
  const houses = [
    { x: 30,  w: 46, c: '#19e8ff' },
    { x: 84,  w: 46, c: '#8a3bff' },
    { x: 186, w: 46, c: '#ff2bb0' },
    { x: 240, w: 70, c: '#ff123d' },
  ];
  const win = (h) => [0, 1, 2].map(r => [0, 1].map(col =>
    `<rect x="${h.x + 9 + col * (h.w - 26)}" y="${104 + r * 14}" width="8" height="7" fill="${h.c}" opacity="${0.35 + ((r + col) % 2) * 0.4}"/>`).join('')).join('');
  return `<svg class="pv-city" viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice">
    <defs>
      <linearGradient id="pv-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1b1c44"/><stop offset="1" stop-color="#0e1630"/></linearGradient>
      <radialGradient id="pv-portal"><stop offset="0" stop-color="#19e8ff" stop-opacity=".9"/><stop offset=".6" stop-color="#8a3bff" stop-opacity=".5"/><stop offset="1" stop-color="#8a3bff" stop-opacity="0"/></radialGradient>
    </defs>
    <rect width="320" height="180" fill="url(#pv-sky)"/>
    <g fill="#fff" opacity=".6"><circle cx="24" cy="18" r="1"/><circle cx="96" cy="30" r="1"/><circle cx="170" cy="14" r="1.2"/><circle cx="250" cy="26" r="1"/><circle cx="300" cy="12" r="1"/></g>
    <path class="pv-far" fill="#131d3a" d="M0 96h18V70h12v18h14V56h10v30h16V64h14v22h20V50h8v36h18V60h14v28h16V46h10v40h20V66h14v24h18V58h12v30h20V70h16v26h20v84H0z"/>
    ${houses.map(h => `<g>
      <rect x="${h.x}" y="90" width="${h.w}" height="62" fill="#16223f" stroke="#01010a" stroke-width="2"/>
      <rect x="${h.x - 3}" y="84" width="${h.w + 6}" height="8" fill="#0c1428" stroke="${h.c}" stroke-width="1.5"/>
      ${win(h)}
      <rect x="${h.x + h.w / 2 - 6}" y="134" width="12" height="18" fill="#0c1428" stroke="${h.c}" stroke-width="1.5"/>
    </g>`).join('')}
    <ellipse class="pv-portal" cx="158" cy="128" rx="18" ry="26" fill="url(#pv-portal)"/>
    <ellipse cx="158" cy="128" rx="11" ry="20" fill="none" stroke="#19e8ff" stroke-width="2"/>
    <rect y="152" width="320" height="28" fill="#131d33"/>
    <rect y="152" width="320" height="2" fill="#19e8ff" opacity=".55"/>
    <g class="pv-hero"><rect x="118" y="134" width="8" height="12" fill="#ff123d" stroke="#01010a"/><rect x="118" y="127" width="8" height="7" fill="#f5f6ff" stroke="#01010a"/><rect x="118" y="146" width="3" height="6" fill="#01010a"/><rect x="123" y="146" width="3" height="6" fill="#01010a"/></g>
  </svg>`;
}

function about() {
  const langs = bio.languages.map(l => `<li><strong>${esc(l.label)}</strong> ${esc(l.level)}</li>`).join('');
  const quals = profile.qualities.map(q => `<li>${esc(q)}</li>`).join('');
  return `
    <section class="sec" id="profil" data-route="profil" style="--sec:${HOUSES.profil.color}" aria-labelledby="profil-title">
      <div class="wrap">${secHead('profil', 'profil', 'À propos')}
        <div class="about">
          <div class="about__text">
            <p class="about__bio">${esc(bio.description)}</p>
            ${profile.positioning ? `<p class="about__pos">${esc(profile.positioning)}</p>` : ''}
          </div>
          ${facts()}
        </div>
        <div class="about__meta">
          <div><h3 class="mini-title">Qualités</h3><ul class="inline-list">${quals}</ul></div>
          <div><h3 class="mini-title">Langues</h3><ul class="inline-list inline-list--langs">${langs}</ul></div>
        </div>
      </div>
    </section>`;
}

function stepBody(s, { skipRole = false } = {}) {
  const details = (s.details && s.details.length)
    ? `<ul class="step__details">${s.details.map(d => `<li>${esc(d)}</li>`).join('')}</ul>` : '';
  return `
          <p class="step__date">${esc(s.date)}</p>
          <h3 class="step__title">${esc(s.title)}</h3>
          ${s.place ? `<p class="step__place">${esc(s.place)}</p>` : ''}
          ${s.context ? `<p class="step__context">${esc(s.context)}</p>` : ''}
          ${s.desc ? `<p class="step__desc">${esc(s.desc)}</p>` : ''}
          ${details}
          ${s.role && !skipRole ? `<p class="role"><span class="role__k">Mon rôle</span>${esc(s.role)}</p>` : ''}`;
}

function experience() {
  const pro = byCat.Professionnel.map(p => `
            <li><a href="#projets/${p.slug}"><strong>${esc(p.title)}</strong><span>${esc(p.type)}</span></a></li>`).join('');
  return `
    <section class="sec" id="parcours" data-route="parcours/devphantom" style="--sec:${HOUSES.parcours.color}" aria-labelledby="parcours-title">
      <div class="wrap">${secHead('parcours', 'parcours', 'Expérience')}
        <article class="card step step--main" id="parcours/devphantom" data-route="parcours/devphantom">
          <p class="step__kind">${esc(devphantom.kind)}</p>${stepBody(devphantom, { skipRole: true })}
          <h4 class="mini-title">Projets réalisés chez DevPhantom (en équipe)</h4>
          <ul class="step__projects">${pro}
          </ul>
        </article>
        <details class="card step step--more" id="parcours/autres" data-route="parcours/autres">
          <summary><span class="step__kind">${esc(autres.kind)}</span><span class="step__title">${esc(autres.title)}</span><span class="step__date">${esc(autres.date)}</span></summary>
          ${autres.desc ? `<p class="step__desc">${esc(autres.desc)}</p>` : ''}
          <ul class="step__details">${(autres.details || []).map(d => `<li>${esc(d)}</li>`).join('')}</ul>
        </details>
      </div>
    </section>`;
}

function projectCard(p) {
  const accent = CATEGORY_ACCENT[p.category] || p.accent;
  const links = (p.links && p.links.length)
    ? p.links.map(l => `<a class="proj__link" href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)}</a>`).join('')
    : '<span class="proj__link proj__link--off" aria-disabled="true">Indisponible</span>';
  return `
          <article class="card proj${p.pick ? ' is-pick' : ''}" id="projets/${p.slug}" data-route="projets/${p.slug}"
                   data-cat="${esc(p.category)}"${p.pick ? ' data-pick' : ''} style="--acc:${accent}" aria-labelledby="p-${p.slug}">
            <p class="proj__meta"><span class="proj__cat">${esc(p.category)}</span><span>${esc(p.type)}</span>${p.pick ? '<span class="proj__pick">★ À ne pas rater</span>' : ''}</p>
            <h3 class="proj__title" id="p-${p.slug}">${esc(p.title)}</h3>
            <p class="proj__desc" data-clamp>${esc(p.desc)}</p>
            ${p.role ? `<p class="role"><span class="role__k">Mon rôle</span>${esc(p.role)}</p>` : ''}
            <ul class="tags">${p.tech.map(t => `<li>${esc(t)}</li>`).join('')}</ul>
            <div class="proj__links">${links}</div>
          </article>`;
}

function projectsSection() {
  const filters = [
    { f: 'all', label: 'Tous', n: projects.length },
    { f: 'pick', label: '★ À ne pas rater', n: picks.length },
    ...CATEGORIES.map(c => ({ f: c, label: c, n: byCat[c].length, acc: CATEGORY_ACCENT[c] })),
  ];
  return `
    <section class="sec" id="projets" data-route="projets" style="--sec:${HOUSES.projets.color}" aria-labelledby="projets-title">
      <div class="wrap">${secHead('projets', 'projets', 'Projets', 'Projets rangés par catégorie et par couleur : professionnels (DevPhantom), personnels et scolaires.')}
        <div class="filters" role="group" aria-label="Filtrer les projets">
          ${filters.map((x, i) => `<button type="button" class="filter" data-filter="${esc(x.f)}" aria-pressed="${i === 0}"${x.acc ? ` style="--acc:${x.acc}"` : ''}>${esc(x.label)} <span>${x.n}</span></button>`).join('\n          ')}
        </div>
        <div class="proj-grid">${projects.map(projectCard).join('')}
        </div>
      </div>
    </section>`;
}

function skills() {
  const groups = profile.skillGroups.map(g => `
          <div class="skill-group">
            <h3 class="mini-title">${esc(g.label)}</h3>
            <ul class="skills">${g.items.map(item => {
              const used = projectsUsing(item);
              if (!used.length) return `<li>${esc(item)}</li>`;
              const names = used.map(p => p.title).join(', ');
              return `<li class="is-used" title="Utilisé dans : ${esc(names)}">${esc(item)}<span class="skills__n" aria-label="${esc(plural(used.length, 'projet', 'projets'))} : ${esc(names)}">${used.length}</span></li>`;
            }).join('')}</ul>
          </div>`).join('');
  return `
    <section class="sec" id="competences" data-route="profil" style="--sec:${HOUSES.profil.color}" aria-labelledby="competences-title">
      <div class="wrap">${secHead('profil', 'competences', 'Compétences', 'Le chiffre indique dans combien de projets de ce portfolio la technologie est utilisée (survolez pour voir lesquels).')}
        <div class="skill-grid">${groups}
        </div>
      </div>
    </section>`;
}

function formation() {
  return `
    <section class="sec" id="formation" data-route="parcours/etna" style="--sec:${HOUSES.parcours.color}" aria-labelledby="formation-title">
      <div class="wrap">${secHead('parcours', 'formation', 'Formation')}
        <ol class="timeline">${academic.map(s => `
          <li class="card step" id="parcours/${s.slug}" data-route="parcours/${s.slug}">${stepBody(s)}
          </li>`).join('')}
        </ol>
      </div>
    </section>`;
}

function services() {
  return `
    <section class="sec sec--band" id="services" data-route="portail" style="--sec:${HOUSES.portail.color}" aria-labelledby="services-title">
      <div class="wrap">${secHead('portail', 'services', 'Vous avez un projet ?', 'Particulier ou professionnel : consultez mes tarifs, ou décrivez votre projet pas à pas.')}
        <div class="services">
          <a class="btn btn--primary" href="construire-projet.html">Construisez votre projet</a>
          <a class="btn btn--ghost" href="tarifs.html">Voir mes tarifs</a>
        </div>
      </div>
    </section>`;
}

function contactSection() {
  const links = contact.links.map(l =>
    `<a class="btn btn--small" href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)}</a>`).join('\n            ');
  const tel = contact.phone.replace(/[^\d+]/g, '');
  return `
    <section class="sec" id="contact" data-route="contact" style="--sec:${HOUSES.contact.color}" aria-labelledby="contact-title">
      <div class="wrap">${secHead('contact', 'contact', 'Contact')}
        <div class="contact">
          <div class="contact__direct">
            <div class="contact__row">
              <a class="contact__value" href="mailto:${esc(contact.email)}">${esc(contact.email)}</a>
              <button type="button" class="copy" data-copy="${esc(contact.email)}" aria-label="Copier l'adresse e-mail">Copier</button>
            </div>
            <div class="contact__row">
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

function jsonLd() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: bio.name.replace(/DRAME/, 'Drame'),
    jobTitle: bio.title,
    url: SITE_URL,
    email: `mailto:${contact.email}`,
    address: { '@type': 'PostalAddress', addressRegion: bio.location, addressCountry: 'FR' },
    sameAs: bio.socials.map(s => s.url),
    knowsLanguage: bio.languages.map(l => l.label),
    knowsAbout: [...new Set(profile.skillGroups.flatMap(g => g.items))],
    alumniOf: { '@type': 'CollegeOrUniversity', name: 'ETNA' },
    worksFor: { '@type': 'Organization', name: 'DevPhantom' },
  };
  return `\n  <script type="application/ld+json">\n${JSON.stringify(data, null, 2).replace(/</g, '\\u003c')}\n  </script>\n  `;
}

// ── Écriture ───────────────────────────────────────────
const content = [hero(), about(), experience(), projectsSection(), skills(), formation(), services(), contactSection()].join('\n');

const file = join(ROOT, 'index.html');
let html = readFileSync(file, 'utf8');
const put = (name, body) => {
  const re = new RegExp(`(<!-- build:${name} -->)[\\s\\S]*?(<!-- /build:${name} -->)`);
  if (!re.test(html)) throw new Error(`Marqueur build:${name} introuvable dans index.html`);
  html = html.replace(re, `$1${body}$2`);
};
put('content', content + '\n    ');
put('jsonld', jsonLd());
writeFileSync(file, html);
console.log(`index.html régénéré — ${projects.length} projets, ${steps.length} étapes, ${profile.skillGroups.length} groupes de compétences.`);
