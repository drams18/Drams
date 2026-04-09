/* ══════════════════════════════════════════════════════
   INTERACTIONS.JS — Section modals & content rendering
   Opens/closes overlay panels with portfolio content
   ══════════════════════════════════════════════════════ */

'use strict';

class InteractionManager {
  constructor() {
    this._visited = new Set();
    this._currentSection = null;

    this._modal    = document.getElementById('section-modal');
    this._backdrop = document.getElementById('modal-backdrop');
    this._body     = document.getElementById('modal-body');
    this._title    = document.getElementById('modal-title');
    this._closeBtn = document.getElementById('modal-close');

    this._bind();
  }

  _bind() {
    this._closeBtn?.addEventListener('click', () => this.close());
    this._backdrop?.addEventListener('click', () => this.close());
  }

  isOpen() { return this._currentSection !== null; }

  open(buildingId) {
    const section = SECTIONS[buildingId];
    if (!section) return;

    this._currentSection = buildingId;
    this._visited.add(buildingId);

    const b = BUILDINGS_DATA.find(b => b.id === buildingId);
    if (b) b.visited = true;

    document.documentElement.style.setProperty('--modal-accent', section.accent);
    this._title.textContent = section.label;
    this._body.innerHTML = this._renderSection(section);

    this._modal.classList.remove('hidden');
    this._backdrop.classList.remove('hidden');
    document.body.classList.add('modal-open');

    if (buildingId === 'contact') this._bindContactForm();
  }

  close() {
    if (!this._currentSection) return;
    this._currentSection = null;
    this._modal.classList.add('hidden');
    this._backdrop.classList.add('hidden');
    document.body.classList.remove('modal-open');
    // Music keeps playing — only game exit stops it
  }

  // ── Contact form ────────────────────────────────────

  _bindContactForm() {
    document.querySelectorAll('.copy-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const value = btn.dataset.copy;
        await navigator.clipboard.writeText(value);
        const prev = btn.textContent;
        btn.textContent = 'OK';
        btn.classList.add('copy-btn--ok');
        setTimeout(() => { btn.textContent = prev; btn.classList.remove('copy-btn--ok'); }, 1500);
      });
    });

    const form   = document.getElementById('contact-form');
    const btn    = document.getElementById('form-submit');
    const status = document.getElementById('form-status');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      btn.disabled    = true;
      btn.textContent = 'ENVOI...';
      status.textContent = '';
      status.className   = 'form-status';

      try {
        // Remplacer 'YOUR_SERVICE_ID' et 'YOUR_TEMPLATE_ID' par vos valeurs EmailJS
        await emailjs.sendForm('service_kju3n28', 'template_pili6gr', form);
        status.textContent = 'Message envoyé !';
        status.classList.add('success');
        setTimeout(() => this.close(), 1500);
      } catch (err) {
        console.error('EmailJS error:', err);
        status.textContent = 'Erreur lors de l\'envoi. Réessayez.';
        status.classList.add('error');
        btn.disabled    = false;
        btn.textContent = 'ENVOYER';
      }
    });
  }

  // ── Section renderers ───────────────────────────────

  _renderSection(section) {
    switch (section.id) {
      case 'profile':  return this._renderProfile(section);
      case 'parcours': return this._renderParcours(section);
      case 'passions': return this._renderPassions(section);
      case 'contact':  return this._renderContact(section);
      case 'projets':  return this._renderProjets(section);
      default:         return '<p>Contenu à venir.</p>';
    }
  }

  _renderProfile(section) {
    const { bio, skills } = section;

    const socialsHTML = bio.socials.map(s => `
      <a href="${s.url}" target="_blank" rel="noopener" class="social-link">
        ${s.label}
      </a>
    `).join('');

    const langsHTML = bio.languages.map(l => `
      <div class="lang-item">
        <span class="lang-name">${l.label}</span>
        <span class="lang-level">${l.level}</span>
      </div>
    `).join('');

    // Skills as colored badges (no progress bars)
    const skillsHTML = skills.map(s => `
      <span class="skill-badge" style="border-color:${s.color};color:${s.color}">${s.name}</span>
    `).join('');

    return `
      <div class="profile-header">
        <div class="profile-info">
          <h2 class="profile-name">${bio.name}</h2>
          <div class="profile-title">${bio.title}</div>
          <div class="profile-tags">
            <span class="tag">${bio.availability}</span>
            <span class="tag">${bio.location}</span>
          </div>
        </div>
      </div>
      <p class="profile-bio">${bio.description}</p>
      <div class="social-links">${socialsHTML}</div>
      <div class="section-divider"></div>
      <h3 class="sub-title">COMPETENCES</h3>
      <div class="skills-badges">${skillsHTML}</div>
      <div class="section-divider"></div>
      <h3 class="sub-title">LANGUES</h3>
      <div class="langs-list">${langsHTML}</div>
    `;
  }

  _renderParcours(section) {
    const { timeline, experiences } = section;

    const timelineHTML = timeline.map(t => `
      <div class="timeline-item">
        <div class="timeline-card">
          <div class="timeline-date">${t.date}</div>
          <div class="timeline-title">${t.title}</div>
          <div class="timeline-place">${t.place}</div>
          <p class="timeline-desc">${t.desc}</p>
        </div>
      </div>
    `).join('');

    const expHTML = experiences.map(e => `
      <div class="exp-item">
        <div>
          <div class="exp-date">${e.date}</div>
          <div class="exp-title">${e.title}</div>
          <p class="exp-desc">${e.desc}</p>
        </div>
      </div>
    `).join('');

    return `
      <h3 class="sub-title">FORMATION</h3>
      <div class="timeline">${timelineHTML}</div>
      <div class="section-divider"></div>
      <h3 class="sub-title">EXPERIENCES</h3>
      <div class="exp-list">${expHTML}</div>
    `;
  }

  _renderPassions(section) {
    const cardsHTML = section.items.map(item => `
      <div class="passion-card">
        <div class="passion-title">${item.title}</div>
        <p class="passion-desc">${item.desc}</p>
      </div>
    `).join('');

    return `
      <h3 class="sub-title">MES PASSIONS</h3>
      <p class="section-intro">Ce qui me fait bouger, penser, créer.</p>
      <div class="passions-grid">${cardsHTML}</div>
    `;
  }

  _renderContact(section) {
    const linksHTML = section.links.map(l => `
      <a href="${l.url}" target="_blank" rel="noopener" class="contact-link" style="--link-color:${l.color}">
        <span>${l.label}</span>
      </a>
    `).join('');

    return `
      <h3 class="sub-title">CONTACTEZ-MOI</h3>
      <div class="contact-info">
        <div class="contact-row">
          <a href="mailto:${section.email}" class="contact-direct">
            ${section.email}
          </a>
          <button class="copy-btn" data-copy="${section.email}" title="Copier l'email">COPIER</button>
        </div>
        <div class="contact-row">
          <a href="tel:${section.phone.replace(/\s/g,'')}" class="contact-direct">
            ${section.phone}
          </a>
          <button class="copy-btn" data-copy="${section.phone}" title="Copier le numéro">COPIER</button>
        </div>
      </div>
      <div class="contact-links">${linksHTML}</div>
      <div class="section-divider"></div>
      <h3 class="sub-title">ENVOYER UN MESSAGE</h3>
      <form class="contact-form" id="contact-form">
        <input type="text"  name="from_name"  placeholder="Votre nom"     class="form-input" required>
        <input type="email" name="from_email" placeholder="Votre email"   class="form-input" required>
        <textarea           name="message"    placeholder="Votre message" class="form-input form-textarea" required></textarea>
        <button type="submit" class="form-btn" id="form-submit">ENVOYER</button>
        <div class="form-status" id="form-status"></div>
      </form>
    `;
  }

  _renderProjets(section) {
    const cardsHTML = section.items.map(p => {
      const techHTML  = p.tech.map(t => `<span class="tech-tag">${t}</span>`).join('');
      const linksHTML = p.links.map(l => `
        <a href="${l.url}" target="_blank" rel="noopener" class="proj-link">${l.label}</a>
      `).join('');

      return `
        <div class="proj-card" style="--proj-accent:${p.accent}">
          <div class="proj-type">${p.type}</div>
          <h3 class="proj-title">${p.title}</h3>
          <p class="proj-desc">${p.desc}</p>
          <div class="proj-tech">${techHTML}</div>
          <div class="proj-links">${linksHTML}</div>
        </div>
      `;
    }).join('');

    return `
      <h3 class="sub-title">GALERIE PROJETS</h3>
      <p class="section-intro">Applications mobiles, plateformes web, projets IoT.</p>
      <div class="projets-grid">${cardsHTML}</div>
    `;
  }
}
