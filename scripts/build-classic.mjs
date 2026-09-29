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

   Résultat : HTML lisible sans JavaScript et indexable.
   Aucune dépendance.
   ══════════════════════════════════════════════════════ */

import { readFileSync, writeFileSync } from 'node:fs';
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
const experience = steps.filter(s => s.kind === 'PROFESSIONNEL');           // DevPhantom, autres
const academic   = steps.filter(s => s.kind === 'ACADÉMIQUE').reverse();    // plus récent d'abord

const CATEGORIES = ['Professionnel', 'Personnel', 'Scolaire'];
const byCat = Object.fromEntries(CATEGORIES.map(c => [c, projects.filter(p => p.category === c)]));
const featured = projects.filter(p => p.pick);
const others   = projects.filter(p => !p.pick);

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
const allSkills = profile.skillGroups.flatMap(g => g.items.map(item => ({ item, group: g.label, used: projectsUsing(item) })));
const mainStack = allSkills.filter(s => s.used.length >= 2).sort((a, b) => b.used.length - a.used.length);

// ── Fragments ──────────────────────────────────────────
function secHead(id, title, lead) {
  return `
      <header class="sec-head">
        <h2 class="sec-title" id="${id}-title">${esc(title)}</h2>
        ${lead ? `<p class="sec-lead">${esc(lead)}</p>` : ''}
      </header>`;
}

const linkList = (links, cls) => (links && links.length)
  ? links.map(l => `<a class="${cls}" href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)}${icon('external', 'ico ico--xs')}</a>`).join('')
  : `<span class="${cls} ${cls}--off" aria-disabled="true">Indisponible</span>`;

function hero() {
  const stack = mainStack.slice(0, 8).map(s => `<li>${esc(s.item)}</li>`).join('');
  const social = bio.socials.map(s => {
    const id = /github/i.test(s.label) ? 'github' : /linkedin/i.test(s.label) ? 'linkedin' : 'external';
    return `<a class="icon-link" href="${esc(s.url)}" target="_blank" rel="noopener">${icon(id)}<span>${esc(s.label)}</span></a>`;
  }).join('');
  return `
    <section class="hero" id="top" data-route="ville" aria-labelledby="hero-name">
      <div class="hero__bg" aria-hidden="true"><div class="hero__glow"></div></div>
      <div class="wrap hero__inner">
        <div class="hero__id">
          ${bio.seeking ? `<p class="pill"><span class="pulse" aria-hidden="true"></span>${esc(bio.seeking)}</p>` : ''}
          <h1 class="hero__name" id="hero-name">${esc(displayName)}</h1>
          <p class="hero__title">${esc(bio.title)}</p>
          <p class="hero__pitch">${esc(profile.positioning)}</p>
          <p class="hero__meta">${esc(bio.location)} · ${esc(bio.availability)} · Frontend &amp; Backend</p>
          <div class="hero__cta">
            <a class="btn btn--primary" href="#projets">Voir mes projets${icon('arrow')}</a>
            <a class="btn btn--ghost" href="assets/CV.pdf" target="_blank" rel="noopener">${icon('download')}Télécharger le CV</a>
            <button type="button" class="btn btn--ghost" data-contact-cta data-contact-subject="Prise de contact — Portfolio">${icon('mail')}Me contacter</button>
          </div>
          <div class="hero__social">${social}</div>
        </div>
      </div>
      <div class="wrap">
        <div class="stack-strip">
          <span class="stack-strip__k">Stack principale</span>
          <ul>${stack}</ul>
        </div>
      </div>
    </section>`;
}

function projectCover(p) {
  if (p.image) {
    return `<img class="proj__img" src="${esc(p.image)}" alt="Capture d'écran — ${esc(p.title)}" loading="lazy" width="640" height="360">`;
  }
  // Pas de capture (projet client privé ou visuel à venir) : couverture
  // typographique, jamais d'image inventée.
  return `<div class="proj__cover" aria-hidden="true"><span class="proj__cover-type">${esc(p.type)}</span><span class="proj__cover-name">${esc(p.short || p.title)}</span></div>`;
}

function featuredCard(p) {
  return `
          <article class="card proj proj--feat" id="projets/${p.slug}" data-route="projets/${p.slug}"
                   data-cat="${esc(p.category)}" data-pick aria-labelledby="p-${p.slug}">
            ${projectCover(p)}
            <div class="proj__body">
              <p class="proj__meta"><span class="chip-cat">${esc(p.category)}</span><span>${esc(p.type)}</span></p>
              <h3 class="proj__title" id="p-${p.slug}">${esc(p.title)}</h3>
              <p class="proj__desc" data-clamp>${esc(p.desc)}</p>
              ${p.role ? `<p class="role"><span class="role__k">Mon rôle</span>${esc(p.role)}</p>` : ''}
              <ul class="tags" aria-label="Technologies">${p.tech.map(t => `<li>${esc(t)}</li>`).join('')}</ul>
              <div class="proj__links">${linkList(p.links, 'proj__link')}</div>
            </div>
          </article>`;
}

function projectRow(p) {
  return `
          <li>
            <details class="card proj proj--row" id="projets/${p.slug}" data-route="projets/${p.slug}"
                     data-cat="${esc(p.category)}">
              <summary>
                <span class="row__main"><span class="proj__title">${esc(p.title)}</span><span class="row__type">${esc(p.type)}</span></span>
                <span class="chip-cat">${esc(p.category)}</span>
                <span class="row__tech">${p.tech.slice(0, 3).map(esc).join(' · ')}</span>
              </summary>
              <div class="row__body">
                <p class="proj__desc">${esc(p.desc)}</p>
                ${p.role ? `<p class="role"><span class="role__k">Mon rôle</span>${esc(p.role)}</p>` : ''}
                <ul class="tags" aria-label="Technologies">${p.tech.map(t => `<li>${esc(t)}</li>`).join('')}</ul>
                <div class="proj__links">${linkList(p.links, 'proj__link')}</div>
              </div>
            </details>
          </li>`;
}

function projectsSection() {
  const filters = [
    { f: 'all', label: 'Tous', n: projects.length },
    ...CATEGORIES.map(c => ({ f: c, label: c, n: byCat[c].length })),
  ];
  const counts = `${byCat.Professionnel.length} professionnels (DevPhantom, en équipe), ${byCat.Personnel.length} personnels, ${plural(byCat.Scolaire.length, 'scolaire', 'scolaires')}.`;
  return `
    <section class="sec" id="projets" data-route="projets" aria-labelledby="projets-title">
      <div class="wrap">${secHead('projets', 'Projets', `${plural(projects.length, 'projet', 'projets')} : ${counts} Pour chacun, mon rôle exact.`)}
        <div class="filters" role="group" aria-label="Filtrer les projets par catégorie">
          ${filters.map((x, i) => `<button type="button" class="filter" data-filter="${esc(x.f)}" aria-pressed="${i === 0}">${esc(x.label)} <span>${x.n}</span></button>`).join('\n          ')}
        </div>
        <h3 class="group-title" data-group="feat">À ne pas rater</h3>
        <div class="feat-grid">${featured.map(featuredCard).join('')}
        </div>
        <h3 class="group-title" data-group="rows">Les autres projets</h3>
        <ul class="proj-list">${others.map(projectRow).join('')}
        </ul>
      </div>
    </section>`;
}

function tlItem(s, extra = '') {
  const details = (s.details && s.details.length)
    ? `<ul class="tl__details">${s.details.map(d => `<li>${esc(d)}</li>`).join('')}</ul>` : '';
  return `
            <li class="tl__item card" id="parcours/${s.slug}" data-route="parcours/${s.slug}">
              <p class="tl__date">${esc(s.date)}</p>
              <h4 class="tl__title">${esc(s.title)}</h4>
              ${s.place ? `<p class="tl__place">${esc(s.place)}</p>` : ''}
              ${s.context ? `<p class="tl__text">${esc(s.context)}</p>` : ''}
              ${s.desc ? `<p class="tl__text">${esc(s.desc)}</p>` : ''}
              ${details}
              ${s.role && !extra ? `<p class="role"><span class="role__k">Mon rôle</span>${esc(s.role)}</p>` : ''}
              ${extra}
            </li>`;
}

function parcours() {
  const pro = byCat.Professionnel.map(p =>
    `<li><a href="#projets/${p.slug}"><strong>${esc(p.title)}</strong><span>${esc(p.type)}</span></a></li>`).join('');
  const devExtra = `
              <p class="tl__sub">Projets réalisés chez DevPhantom (en équipe)</p>
              <ul class="tl__projects">${pro}</ul>`;
  const expItems = experience.map(s => s.slug === 'devphantom' ? tlItem(s, devExtra) : tlItem(s)).join('');
  return `
    <section class="sec" id="parcours" data-route="parcours/devphantom" aria-labelledby="parcours-title">
      <div class="wrap">${secHead('parcours', 'Parcours', `Alternance chez DevPhantom (${devphantom.date}), en parallèle de l'ETNA (${etna.date}).`)}
        <div class="tracks">
          <div class="track">
            <h3 class="track__title">${icon('briefcase')}Expérience</h3>
            <ol class="tl">${expItems}
            </ol>
          </div>
          <div class="track">
            <h3 class="track__title">${icon('school')}Formation</h3>
            <ol class="tl">${academic.map(s => tlItem(s)).join('')}
            </ol>
          </div>
        </div>
      </div>
    </section>`;
}

function skills() {
  const main = mainStack.map(s => `
            <li class="stack-card">
              <span class="stack-card__name">${esc(s.item)}</span>
              <span class="stack-card__n">${plural(s.used.length, 'projet', 'projets')}</span>
              <span class="stack-card__p">${esc(s.used.map(p => p.title).join(' · '))}</span>
            </li>`).join('');
  const groups = profile.skillGroups.map(g => `
          <div class="skill-group">
            <h4 class="skill-group__t">${esc(g.label)}</h4>
            <ul class="skills">${g.items.map(item => {
              const used = projectsUsing(item);
              return used.length
                ? `<li class="is-used" title="Utilisé dans : ${esc(used.map(p => p.title).join(', '))}">${esc(item)}</li>`
                : `<li>${esc(item)}</li>`;
            }).join('')}</ul>
          </div>`).join('');
  return `
    <section class="sec" id="competences" data-route="profil" aria-labelledby="competences-title">
      <div class="wrap">${secHead('competences', 'Compétences')}
        <h3 class="group-title">Stack principale <small>utilisée dans plusieurs projets de ce portfolio</small></h3>
        <ul class="stack-grid">${main}
        </ul>
        <h3 class="group-title">Toutes les compétences <small><span class="dot" aria-hidden="true"></span> = utilisée dans au moins un projet présenté</small></h3>
        <div class="skill-grid">${groups}
        </div>
      </div>
    </section>`;
}

function about() {
  const langs = bio.languages.map(l => `<li><strong>${esc(l.label)}</strong> ${esc(l.level)}</li>`).join('');
  const quals = profile.qualities.map(q => `<li>${esc(q)}</li>`).join('');
  return `
    <section class="sec" id="profil" data-route="profil" aria-labelledby="profil-title">
      <div class="wrap">${secHead('profil', 'À propos')}
        <div class="about">
          <p class="about__bio">${esc(bio.description)}</p>
          <div class="about__meta">
            <div><h3 class="mini-title">Qualités</h3><ul class="inline-list">${quals}</ul></div>
            <div><h3 class="mini-title">Langues</h3><ul class="inline-list">${langs}</ul></div>
          </div>
        </div>
      </div>
    </section>`;
}

function services() {
  return `
    <section class="sec sec--band" id="services" data-route="portail" aria-labelledby="services-title">
      <div class="wrap">${secHead('services', 'Vous avez un projet ?', 'Particulier ou professionnel : consultez mes tarifs, ou décrivez votre projet pas à pas.')}
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
    <section class="sec" id="contact" data-route="contact" aria-labelledby="contact-title">
      <div class="wrap">${secHead('contact', 'Contact', bio.seeking ? `${bio.seeking}. Écrivez-moi ou appelez-moi directement.` : '')}
        <div class="contact">
          <div class="contact__direct">
            <div class="contact__row">
              ${icon('mail')}<a class="contact__value" href="mailto:${esc(contact.email)}">${esc(contact.email)}</a>
              <button type="button" class="copy" data-copy="${esc(contact.email)}" aria-label="Copier l'adresse e-mail">Copier</button>
            </div>
            <div class="contact__row">
              <svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2z" fill="none" stroke="currentColor" stroke-width="2"/></svg>
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
  content: [hero(), projectsSection(), parcours(), skills(), about(), services(), contactSection()].join('\n') + '\n    ',
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

console.log(`classique.html + index.html régénérés — ${projects.length} projets (${featured.length} à la une), ${steps.length} étapes, ${mainStack.length} technos en stack principale.`);
