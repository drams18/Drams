/* ══════════════════════════════════════════════════════
   INTERACTIONS.JS — Section modals & content rendering
   Opens/closes overlay panels with portfolio content
   ══════════════════════════════════════════════════════ */

'use strict';

class InteractionManager {
  constructor() {
    this._visited = new Set();
    this._currentSection = null;
    this._carouselCleanups = [];
    this._activeCarousel = null;

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

    // Ouvrir un projet (lien de la galerie) = action importante.
    this._body?.addEventListener('click', (e) => {
      if (e.target.closest('.proj-link') && window.AudioManager) {
        window.AudioManager.play('success');
      }
    });
    // Échap ferme la fenêtre (comme le clic sur le fond), y compris Contact
    document.addEventListener('keydown', (e) => {
      if ((e.key === 'Escape' || e.keyCode === 27) && this.isOpen()) {
        e.preventDefault();
        this.close();
        return;
      }
      // Flèches ← / → = navigation dans le carrousel de la section ouverte
      if (!this.isOpen() || !this._activeCarousel) return;
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        this._activeCarousel.go(this._activeCarousel.index - 1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        this._activeCarousel.go(this._activeCarousel.index + 1);
      }
    });
  }

  isOpen() { return this._currentSection !== null; }
  currentSection() { return this._currentSection; }

  open(buildingId) {
    const section = SECTIONS[buildingId];
    if (!section) return;

    const firstVisit = !this._visited.has(buildingId);
    this._currentSection = buildingId;
    this._visited.add(buildingId);

    const b = BUILDINGS_DATA.find(b => b.id === buildingId);
    if (b) b.visited = true;

    document.documentElement.style.setProperty('--modal-accent', section.accent);
    this._title.textContent = section.label;
    this._teardownCarousels();
    this._body.innerHTML = this._renderSection(section);

    this._modal.classList.remove('hidden');
    this._backdrop.classList.remove('hidden');
    document.body.classList.add('modal-open');

    // Carrousels (Parcours / Galerie) — initialisés une fois la modale visible
    this._initCarousels();

    // 1re entrée dans la maison = nouvelle pièce ; retour = simple ouverture.
    if (window.AudioManager) {
      window.AudioManager.play(firstVisit ? 'transition' : 'open');
    }

    if (buildingId === 'contact') this._bindContactForm();
  }

  close() {
    if (!this._currentSection) return;
    this._currentSection = null;
    this._teardownCarousels();
    this._modal.classList.add('hidden');
    this._backdrop.classList.add('hidden');
    document.body.classList.remove('modal-open');
    if (window.AudioManager) window.AudioManager.play('close');
    // Music keeps playing — only game exit stops it
  }

  // ── Contact form ────────────────────────────────────

  _bindContactForm() {
    document.querySelectorAll('.copy-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (window.AudioManager) window.AudioManager.play('click');
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
        if (window.AudioManager) window.AudioManager.play('success');
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

    // Chaque étape (formations + expériences) devient une slide du carrousel.
    const slides = [
      ...timeline.map(t => ({ ...t, kind: 'FORMATION' })),
      ...experiences.map(e => ({ ...e, kind: 'EXPÉRIENCE' })),
    ];

    const slideHTML = (s) => `
      <div class="timeline-card carousel-card">
        <div class="carousel-card__kind">${s.kind}</div>
        <div class="timeline-date">${s.date}</div>
        <div class="timeline-title">${s.title}</div>
        ${s.place ? `<div class="timeline-place">${s.place}</div>` : ''}
        <p class="timeline-desc">${s.desc}</p>
      </div>
    `;

    return `
      <h3 class="sub-title">PARCOURS</h3>
      ${this._renderCarousel({ slides, tabLabel: s => s.short || s.title, slideHTML })}
    `;
  }

  _renderContact(section) {
    const linksHTML = section.links.map(l => `
      <a href="${l.url}" target="_blank" rel="noopener" class="contact-link" style="--link-color:${l.color}">
        <span>${l.label}</span>
      </a>
    `).join('');

    // Composant de contact commun (js/contact.js) : source unique des
    // coordonnées + règle mobile/desktop pour le numéro de téléphone.
    const CW      = window.ContactWidget;
    const email   = (CW && CW.EMAIL) || section.email;
    const phone   = (CW && CW.PHONE) || section.phone;
    const telHref = (CW && CW.PHONE_TEL) || phone.replace(/\s/g, '');
    const mobile  = CW ? CW.isMobile() : /Mobi|Android/i.test(navigator.userAgent);

    // Mobile : tel: cliquable pour appeler. Desktop : texte non cliquable.
    const phoneCell = mobile
      ? `<a href="tel:${telHref}" class="contact-direct">${phone}</a>`
      : `<span class="contact-direct contact-direct--static">${phone}</span>`;

    return `
      <h3 class="sub-title">CONTACTEZ-MOI</h3>
      <div class="contact-info">
        <div class="contact-row">
          <a href="mailto:${email}" class="contact-direct">
            ${email}
          </a>
          <button class="copy-btn" data-copy="${email}" title="Copier l'email">COPIER</button>
        </div>
        <div class="contact-row">
          ${phoneCell}
          <button class="copy-btn" data-copy="${phone}" title="Copier le numéro">COPIER</button>
        </div>
      </div>
      <div class="contact-links">${linksHTML}</div>
      <div class="section-divider"></div>
      <div class="contact-notice">[ ! ] Commandes désactivées — cliquez sur FERMER pour quitter</div>
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
    const slideHTML = (p) => {
      const techHTML  = p.tech.map(t => `<span class="tech-tag">${t}</span>`).join('');
      const linksHTML = p.links.map(l => `
        <a href="${l.url}" target="_blank" rel="noopener" class="proj-link">${l.label}</a>
      `).join('');

      const roleHTML = p.role
        ? `<p class="proj-role"><span class="proj-role__k">Mon rôle</span>${p.role}</p>`
        : '';

      return `
        <div class="proj-card carousel-card" style="--proj-accent:${p.accent}">
          <div class="proj-type">${p.type}</div>
          <h3 class="proj-title">${p.title}</h3>
          <p class="proj-desc">${p.desc}</p>
          ${roleHTML}
          <div class="proj-tech">${techHTML}</div>
          <div class="proj-links">${linksHTML}</div>
        </div>
      `;
    };

    return `
      <h3 class="sub-title">GALERIE PROJETS</h3>
      <p class="section-intro">Applications mobiles, plateformes web, projets personnels.</p>
      ${this._renderCarousel({ slides: section.items, tabLabel: s => s.short || s.title, slideHTML })}
    `;
  }

  // ── Carrousel (Parcours & Galerie) ──────────────────

  _renderCarousel({ slides, tabLabel, slideHTML }) {
    const tabs = slides.map((s, i) => `
      <button type="button" class="carousel-tab${i === 0 ? ' is-active' : ''}"
              role="tab" aria-selected="${i === 0 ? 'true' : 'false'}" data-index="${i}">
        ${tabLabel(s)}
      </button>
    `).join('');

    const panels = slides.map((s, i) => `
      <div class="carousel-slide${i === 0 ? ' is-active' : ''}" role="tabpanel"
           data-index="${i}" aria-hidden="${i === 0 ? 'false' : 'true'}">
        ${slideHTML(s)}
      </div>
    `).join('');

    return `
      <div class="carousel" data-carousel>
        <div class="carousel-tabs" role="tablist">${tabs}</div>
        <p class="carousel-hint">
          <span class="carousel-hint__keys" aria-hidden="true">&lsaquo; &rsaquo;</span>
          <span class="carousel-hint__desktop">Utilisez les flèches du clavier (ou les boutons) pour naviguer — ou cliquez sur un titre</span>
          <span class="carousel-hint__touch">Glissez de gauche à droite — ou touchez un titre pour naviguer</span>
        </p>
        <div class="carousel-viewport">
          <div class="carousel-track">${panels}</div>
        </div>
        <div class="carousel-nav">
          <button type="button" class="carousel-btn carousel-prev" aria-label="Étape précédente">
            <span class="carousel-btn__arrow" aria-hidden="true">&lsaquo;</span>
            <span class="carousel-btn__txt">PRÉCÉDENT</span>
          </button>
          <span class="carousel-count"><span class="carousel-cur">1</span> / ${slides.length}</span>
          <button type="button" class="carousel-btn carousel-next" aria-label="Étape suivante">
            <span class="carousel-btn__txt">SUIVANT</span>
            <span class="carousel-btn__arrow" aria-hidden="true">&rsaquo;</span>
          </button>
        </div>
      </div>
    `;
  }

  _initCarousels() {
    this._activeCarousel = null;
    this._body.querySelectorAll('[data-carousel]').forEach(root => this._setupCarousel(root));
  }

  _teardownCarousels() {
    this._carouselCleanups.forEach(fn => { try { fn(); } catch (_) {} });
    this._carouselCleanups = [];
    this._activeCarousel = null;
  }

  _setupCarousel(root) {
    const tabsWrap = root.querySelector('.carousel-tabs');
    const track    = root.querySelector('.carousel-track');
    const view     = root.querySelector('.carousel-viewport');
    const slides   = Array.from(root.querySelectorAll('.carousel-slide'));
    const tabs     = Array.from(root.querySelectorAll('.carousel-tab'));
    const prevBtn  = root.querySelector('.carousel-prev');
    const nextBtn  = root.querySelector('.carousel-next');
    const curEl    = root.querySelector('.carousel-cur');
    if (!slides.length) return;

    let index = 0;
    const last = slides.length - 1;
    const clamp = (i) => Math.max(0, Math.min(last, i));

    const syncHeight = () => {
      view.style.height = slides[index].offsetHeight + 'px';
    };

    const centerTab = (smooth) => {
      const t = tabs[index];
      if (!t) return;
      const target = t.offsetLeft - (tabsWrap.clientWidth - t.offsetWidth) / 2;
      tabsWrap.scrollTo({ left: Math.max(0, target), behavior: smooth ? 'smooth' : 'auto' });
    };

    const render = (smooth) => {
      track.style.transform = `translateX(${-index * 100}%)`;
      tabs.forEach((t, i) => {
        const on = i === index;
        t.classList.toggle('is-active', on);
        t.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      slides.forEach((s, i) => {
        const on = i === index;
        s.classList.toggle('is-active', on);
        s.setAttribute('aria-hidden', on ? 'false' : 'true');
        // Empêche le focus clavier sur les slides hors écran (navigateurs récents)
        if (on) s.removeAttribute('inert');
        else s.setAttribute('inert', '');
      });
      if (curEl) curEl.textContent = String(index + 1);
      prevBtn.disabled = index === 0;
      nextBtn.disabled = index === last;
      syncHeight();
      centerTab(smooth);
    };

    const go = (i) => {
      const ni = clamp(i);
      if (ni === index) return;
      index = ni;
      if (window.AudioManager) window.AudioManager.play('click');
      render(true);
    };

    tabs.forEach(t => t.addEventListener('click', () => go(parseInt(t.dataset.index, 10))));
    prevBtn.addEventListener('click', () => go(index - 1));
    nextBtn.addEventListener('click', () => go(index + 1));

    // Swipe tactile (le desktop utilise onglets / flèches / clavier)
    let downX = 0, downY = 0, tracking = false;
    const onDown = (e) => {
      if (e.pointerType === 'mouse') return;
      tracking = true; downX = e.clientX; downY = e.clientY;
    };
    const onUp = (e) => {
      if (!tracking) return;
      tracking = false;
      const dx = e.clientX - downX;
      const dy = e.clientY - downY;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        go(index + (dx < 0 ? 1 : -1));
      }
    };
    const onCancel = () => { tracking = false; };
    view.addEventListener('pointerdown', onDown);
    view.addEventListener('pointerup', onUp);
    view.addEventListener('pointercancel', onCancel);

    const onResize = () => { view.style.transition = 'none'; syncHeight(); requestAnimationFrame(() => { view.style.transition = ''; }); };
    window.addEventListener('resize', onResize);

    const imgs = Array.from(root.querySelectorAll('img'));
    imgs.forEach(img => img.addEventListener('load', syncHeight));

    this._carouselCleanups.push(() => {
      window.removeEventListener('resize', onResize);
      view.removeEventListener('pointerdown', onDown);
      view.removeEventListener('pointerup', onUp);
      view.removeEventListener('pointercancel', onCancel);
    });

    this._activeCarousel = {
      go,
      get index() { return index; },
      count: slides.length,
    };

    render(false);
    requestAnimationFrame(() => syncHeight());
  }
}
