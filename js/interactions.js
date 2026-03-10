/* =================================================
   INTERACTIONS.JS — Modals, content, progress, tutorial, quick nav
   ================================================= */

// ---- Portfolio content for each section -------------------------

const SECTION_CONTENT = {

  about: {
    title: 'À PROPOS',
    emoji: '🏠',
    html: `
    <div class="mc-section-header">
      <h2>🧑‍💻 ARPHAN DRAME</h2>
      <p>Développeur Full Stack passionné</p>
    </div>
    <div class="mc-profile">
      <img src="assets/img/moi-rond.png" class="mc-avatar" alt="Arphan DRAME" onerror="this.style.display='none'">
      <div class="mc-bio">
        <div class="mc-avail-badge">
          <span class="mc-avail-dot"></span>
          Disponible immédiatement
        </div>
        <p>
          Développeur Web Full Stack en cours de Master Architecte de Systèmes
          d'Informations à l'ETNA, je conçois et développe des applications web
          et mobiles de bout en bout. Passionné par les nouvelles technologies,
          j'aime relever des défis techniques et livrer des produits soignés,
          performants et maintenables.
        </p>
      </div>
    </div>
    <div class="mc-info-grid">
      <div class="mc-info-item">
        <span>👤</span>
        <div><div class="mc-info-label">NOM</div><div class="mc-info-value">Arphan DRAME</div></div>
      </div>
      <div class="mc-info-item">
        <span>📧</span>
        <div><div class="mc-info-label">EMAIL</div><div class="mc-info-value">arphandrame0@gmail.com</div></div>
      </div>
      <div class="mc-info-item">
        <span>📱</span>
        <div><div class="mc-info-label">TÉLÉPHONE</div><div class="mc-info-value">07 67 31 84 26</div></div>
      </div>
      <div class="mc-info-item">
        <span>📍</span>
        <div><div class="mc-info-label">LOCALISATION</div><div class="mc-info-value">Paris, Île-de-France</div></div>
      </div>
      <div class="mc-info-item">
        <span>🎓</span>
        <div><div class="mc-info-label">FORMATION</div><div class="mc-info-value">Master ASI — ETNA</div></div>
      </div>
      <div class="mc-info-item">
        <span>🌐</span>
        <div><div class="mc-info-label">GITHUB</div><div class="mc-info-value">github.com/drams18</div></div>
      </div>
    </div>
    <div style="margin-top:16px">
      <div class="mc-info-label" style="margin-bottom:10px;font-family:'Press Start 2P',monospace;font-size:8px;color:#00e5ff">LANGUES</div>
      <div class="mc-lang-row">
        <span class="mc-tag">🇫🇷 Français — Natif</span>
        <span class="mc-tag">🇬🇧 Anglais — B2</span>
        <span class="mc-tag">🇪🇸 Espagnol — A2</span>
        <span class="mc-tag">🕌 Arabe littéraire — A2</span>
      </div>
    </div>
    <div style="margin-top:20px">
      <div class="mc-social-row">
        <a href="https://github.com/drams18" target="_blank" class="mc-social-btn">⌨ GitHub</a>
        <a href="https://www.linkedin.com/in/arphan-drame-b29259258/" target="_blank" class="mc-social-btn">💼 LinkedIn</a>
        <a href="https://twitter.com/drams_18" target="_blank" class="mc-social-btn">🐦 Twitter</a>
        <a href="https://www.instagram.com/dramsss18/" target="_blank" class="mc-social-btn">📸 Instagram</a>
      </div>
    </div>
    `,
  },

  skills: {
    title: 'COMPÉTENCES',
    emoji: '⚙️',
    html: `
    <div class="mc-section-header">
      <h2>⚙️ STACK TECHNIQUE</h2>
      <p>Savoir-faire acquis à travers projets et formations</p>
    </div>

    <div class="mc-skill-cat">
      <div class="mc-cat-header">
        <span class="mc-cat-icon">🖥️</span>
        <h4 style="color:#00e5ff">FRONTEND</h4>
      </div>
      <div class="mc-tags-row">
        <span class="mc-tag tag-frontend">React</span>
        <span class="mc-tag tag-frontend">React Native</span>
        <span class="mc-tag tag-frontend">TypeScript</span>
        <span class="mc-tag tag-frontend">HTML / CSS</span>
        <span class="mc-tag tag-frontend">Expo (EAS)</span>
      </div>
    </div>

    <div class="mc-skill-cat">
      <div class="mc-cat-header">
        <span class="mc-cat-icon">🖧</span>
        <h4 style="color:#00ff88">BACKEND</h4>
      </div>
      <div class="mc-tags-row">
        <span class="mc-tag tag-backend">Symfony</span>
        <span class="mc-tag tag-backend">NestJS</span>
        <span class="mc-tag tag-backend">Node.js</span>
        <span class="mc-tag tag-backend">Laravel</span>
        <span class="mc-tag tag-backend">Python</span>
        <span class="mc-tag tag-backend">API REST</span>
        <span class="mc-tag tag-backend">JWT</span>
      </div>
    </div>

    <div class="mc-skill-cat">
      <div class="mc-cat-header">
        <span class="mc-cat-icon">🗄️</span>
        <h4 style="color:#ff8888">BASE DE DONNÉES</h4>
      </div>
      <div class="mc-tags-row">
        <span class="mc-tag tag-db">MySQL</span>
        <span class="mc-tag tag-db">PostgreSQL</span>
        <span class="mc-tag tag-db">MongoDB</span>
      </div>
    </div>

    <div class="mc-skill-cat">
      <div class="mc-cat-header">
        <span class="mc-cat-icon">🔧</span>
        <h4 style="color:#cc44ff">DEVOPS &amp; OUTILS</h4>
      </div>
      <div class="mc-tags-row">
        <span class="mc-tag tag-devops">Docker</span>
        <span class="mc-tag tag-devops">Git</span>
        <span class="mc-tag tag-devops">Railway</span>
        <span class="mc-tag tag-devops">Cloudflare</span>
        <span class="mc-tag tag-devops">Nginx</span>
        <span class="mc-tag tag-devops">Web Scraping</span>
        <span class="mc-tag tag-devops">Jira</span>
        <span class="mc-tag tag-devops">Trello</span>
      </div>
    </div>

    <div class="mc-skill-cat">
      <div class="mc-cat-header">
        <span class="mc-cat-icon">🤝</span>
        <h4 style="color:#ffd700">SOFT SKILLS</h4>
      </div>
      <div class="mc-tags-row">
        <span class="mc-tag tag-soft">Résolution de problèmes</span>
        <span class="mc-tag tag-soft">Autonomie</span>
        <span class="mc-tag tag-soft">Esprit d'analyse</span>
        <span class="mc-tag tag-soft">Apprentissage rapide</span>
        <span class="mc-tag tag-soft">Travail d'équipe</span>
      </div>
    </div>
    `,
  },

  projects: {
    title: 'PROJETS',
    emoji: '🕹️',
    html: `
    <div class="mc-section-header">
      <h2>🕹️ PROJETS & EXPÉRIENCES</h2>
      <p>Réalisations récentes</p>
    </div>

    <div class="mc-project-card">
      <div class="mc-project-header">
        <div>
          <div class="mc-project-title">ISLAAH</div>
          <div class="mc-project-subtitle">Application mobile interactive autour du Coran</div>
        </div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:flex-start">
          <span class="mc-badge mc-badge-personal">Projet perso</span>
          <span class="mc-badge" style="border-color:rgba(255,215,0,0.4);color:#ffd700">2026</span>
        </div>
      </div>
      <ul class="mc-project-list">
        <li>App mobile de quiz/blind test pour identifier les sourates du Coran à partir d'extraits audio.</li>
        <li>API REST Symfony : gestion utilisateurs, scores, progression et authentification JWT.</li>
        <li>Système de gamification : XP, streaks, classements et notifications.</li>
        <li>Intégration audio via Cloudflare, publication sur l'Apple Store via EAS.</li>
        <li>Conception BDD MySQL et gestion complète des données utilisateurs.</li>
      </ul>
      <div class="mc-tags-row" style="margin-bottom:12px">
        <span class="mc-tag tag-stack">React Native</span>
        <span class="mc-tag tag-stack">Symfony</span>
        <span class="mc-tag tag-stack">MySQL</span>
        <span class="mc-tag tag-stack">JWT</span>
        <span class="mc-tag tag-stack">Cloudflare</span>
        <span class="mc-tag tag-stack">Docker</span>
        <span class="mc-tag tag-stack">Railway</span>
        <span class="mc-tag tag-stack">EAS</span>
      </div>
      <a href="https://apps.apple.com/us/app/islaah/id6758726142" target="_blank" class="mc-appstore-btn">
        🍎 Disponible sur l'App Store
      </a>
    </div>

    <div class="mc-project-card">
      <div class="mc-project-header">
        <div>
          <div class="mc-project-title">SKYWALK</div>
          <div class="mc-project-subtitle">Plateforme d'aide à l'expatriation</div>
        </div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:flex-start">
          <span class="mc-badge mc-badge-school">ETNA — GPE</span>
          <span class="mc-badge" style="border-color:rgba(255,215,0,0.4);color:#ffd700">2025—2026</span>
        </div>
      </div>
      <ul class="mc-project-list">
        <li>Collecte de données internationales via API externes (Adzuna, OECD) et web scraping.</li>
        <li>Structuration PostgreSQL : procédures administratives, comparateurs, dashboard.</li>
        <li>API REST NestJS avec authentification JWT (access + refresh token).</li>
        <li>Comparateur de pays, dashboard et projets d'expatriation.</li>
        <li>Infrastructure Docker multi-stage + Nginx pour dev &amp; prod.</li>
      </ul>
      <div class="mc-tags-row">
        <span class="mc-tag tag-stack">React</span>
        <span class="mc-tag tag-stack">TypeScript</span>
        <span class="mc-tag tag-stack">NestJS</span>
        <span class="mc-tag tag-stack">PostgreSQL</span>
        <span class="mc-tag tag-stack">JWT</span>
        <span class="mc-tag tag-stack">Docker</span>
        <span class="mc-tag tag-stack">Nginx</span>
        <span class="mc-tag tag-stack">Web Scraping</span>
        <span class="mc-tag tag-stack">Jira</span>
      </div>
    </div>
    `,
  },

  formation: {
    title: 'FORMATION',
    emoji: '📚',
    html: `
    <div class="mc-section-header">
      <h2>📚 PARCOURS ACADÉMIQUE</h2>
      <p>Formations et diplômes obtenus</p>
    </div>

    <div class="mc-timeline">

      <div class="mc-timeline-item">
        <div class="mc-timeline-dot"></div>
        <div class="mc-timeline-date">2023 — 2026</div>
        <div class="mc-timeline-content">
          <h3>Master Architecte de Systèmes d'Informations</h3>
          <h4>🏛 ETNA — École des Technologies Numériques Avancées</h4>
          <ul>
            <li><strong>Front :</strong> React Native, TypeScript</li>
            <li><strong>Back :</strong> Symfony, Laravel, Node.js, NestJS, Python</li>
            <li><strong>Plateformes :</strong> iOS, Android, Web</li>
          </ul>
        </div>
      </div>

      <div class="mc-timeline-item">
        <div class="mc-timeline-dot"></div>
        <div class="mc-timeline-date">2023</div>
        <div class="mc-timeline-content">
          <h3>Formation Développeur Web Full Stack</h3>
          <h4>🏛 Le Réacteur — Bootcamp intensif</h4>
          <ul>
            <li>HTML, CSS, JavaScript, React, Node.js, MongoDB</li>
            <li>Développement de projets fullstack de bout en bout</li>
          </ul>
        </div>
      </div>

      <div class="mc-timeline-item">
        <div class="mc-timeline-dot"></div>
        <div class="mc-timeline-date">2020 — 2022</div>
        <div class="mc-timeline-content">
          <h3>BTS Systèmes Numériques — option Électronique</h3>
          <h4>🏛 Lycée Jules Ferry — Versailles</h4>
          <ul>
            <li>BTS SN option B obtenu + Certification Pix</li>
            <li>Projet de fin d'études : Jardin connecté</li>
          </ul>
        </div>
      </div>

      <div class="mc-timeline-item">
        <div class="mc-timeline-dot"></div>
        <div class="mc-timeline-date">2017 — 2020</div>
        <div class="mc-timeline-content">
          <h3>Baccalauréat STI2D</h3>
          <h4>🏛 Lycée Dorian — Paris 11e</h4>
          <ul>
            <li>Sciences et Technologies de l'Industrie et du Développement Durable</li>
            <li>Baccalauréat obtenu</li>
          </ul>
        </div>
      </div>

    </div>
    `,
  },

  interests: {
    title: "CENTRES D'INTÉRÊT",
    emoji: '🌿',
    html: `
    <div class="mc-section-header">
      <h2>🌿 CE QUI ME DÉFINIT</h2>
      <p>En dehors du code</p>
    </div>

    <div class="mc-interests-grid">
      <div class="mc-interest-card">
        <div class="mc-interest-icon">💻</div>
        <h4>DÉVELOPPEMENT PERSO</h4>
        <p>Toujours en train d'explorer de nouvelles technologies et de construire de nouveaux projets perso.</p>
      </div>
      <div class="mc-interest-card">
        <div class="mc-interest-icon">💡</div>
        <h4>TECH &amp; INNOVATION</h4>
        <p>Passionné par les dernières avancées tech, l'IA et les nouvelles manières de résoudre des problèmes.</p>
      </div>
      <div class="mc-interest-card">
        <div class="mc-interest-icon">🏀</div>
        <h4>BASKET-BALL</h4>
        <p>Sport découvert au collège, rapidement devenu une passion pour le jeu et l'esprit d'équipe.</p>
      </div>
      <div class="mc-interest-card">
        <div class="mc-interest-icon">🇯🇵</div>
        <h4>CULTURE JAPONAISE</h4>
        <p>Fan de manga et d'animé — une source d'inspiration créative et de storytelling.</p>
      </div>
      <div class="mc-interest-card">
        <div class="mc-interest-icon">🎮</div>
        <h4>JEUX VIDÉO</h4>
        <p>Les jeux vidéo ont éveillé en moi la curiosité pour l'informatique et la création numérique.</p>
      </div>
    </div>
    `,
  },

  contact: {
    title: 'CONTACT',
    emoji: '📬',
    html: `
    <div class="mc-section-header">
      <h2>📬 ME CONTACTER</h2>
      <p>Une opportunité, un projet, une question ?</p>
    </div>

    <div class="mc-contact-grid">
      <div>
        <div class="mc-contact-info-item">
          <div class="mc-contact-icon">📍</div>
          <div>
            <h4>LOCALISATION</h4>
            <p>Paris, Île-de-France</p>
          </div>
        </div>
        <div class="mc-contact-info-item">
          <div class="mc-contact-icon">📧</div>
          <div>
            <h4>EMAIL</h4>
            <p><a href="mailto:arphandrame0@gmail.com">arphandrame0@gmail.com</a></p>
          </div>
        </div>
        <div class="mc-contact-info-item">
          <div class="mc-contact-icon">📱</div>
          <div>
            <h4>TÉLÉPHONE</h4>
            <p>07 67 31 84 26</p>
          </div>
        </div>
        <div class="mc-contact-info-item">
          <div class="mc-contact-icon">⌨</div>
          <div>
            <h4>GITHUB</h4>
            <p><a href="https://github.com/drams18" target="_blank">github.com/drams18</a></p>
          </div>
        </div>
        <div class="mc-contact-info-item">
          <div class="mc-contact-icon">💼</div>
          <div>
            <h4>LINKEDIN</h4>
            <p><a href="https://www.linkedin.com/in/arphan-drame-b29259258/" target="_blank">Arphan DRAME</a></p>
          </div>
        </div>
      </div>

      <div>
        <form id="mc-contact-form" class="mc-form">
          <div class="mc-form-row">
            <div class="mc-form-group">
              <label for="mc-name">NOM</label>
              <input type="text" id="mc-name" name="name" required>
            </div>
            <div class="mc-form-group">
              <label for="mc-email">EMAIL</label>
              <input type="email" id="mc-email" name="email" required>
            </div>
          </div>
          <div class="mc-form-group">
            <label for="mc-subject">OBJET</label>
            <input type="text" id="mc-subject" name="subject" required>
          </div>
          <div class="mc-form-group">
            <label for="mc-message">MESSAGE</label>
            <textarea id="mc-message" name="message" rows="5" required></textarea>
          </div>
          <div class="mc-form-msg" id="mc-form-success">✓ Message envoyé avec succès !</div>
          <div class="mc-form-msg" id="mc-form-error">✗ Erreur lors de l'envoi. Réessayez ou contactez directement par email.</div>
          <button type="submit" class="mc-form-submit">▶ ENVOYER LE MESSAGE</button>
        </form>
      </div>
    </div>
    `,
  },
};

// ---- InteractionManager -----------------------------------------

class InteractionManager {
  constructor(map) {
    this._map = map;
    this._visitedSections = new Set();
    this._modalOpen = false;
    this._currentBuilding = null;
    this._lastInteract = false;
    this._onVisitCallback = null;

    this._setupUI();
  }

  // Called each game frame
  update(player, interactPressed) {
    if (this._modalOpen) return;

    const nearby = this._map.getNearbyBuilding(player.x, player.y);
    const prompt = document.getElementById('interact-prompt');

    if (nearby) {
      prompt.classList.remove('hidden');
      this._currentBuilding = nearby;

      if (interactPressed && !this._lastInteract) {
        this.openSection(nearby.id, player);
      }
    } else {
      prompt.classList.add('hidden');
      this._currentBuilding = null;
    }

    this._lastInteract = interactPressed;
  }

  // Called when user clicks on the canvas (world coords)
  handleCanvasClick(worldX, worldY, player) {
    if (this._modalOpen) return;
    const b = this._map.getBuildingAtPoint(worldX, worldY);
    if (b) {
      this.openSection(b.id, player);
    }
  }

  openSection(id, player = null) {
    const section = SECTION_CONTENT[id];
    if (!section) return;

    if (player) player.triggerEnterAnimation();

    this._modalOpen = true;
    this._markVisited(id);

    const modal   = document.getElementById('section-modal');
    const icon    = document.getElementById('modal-icon');
    const title   = document.getElementById('modal-title');
    const content = document.getElementById('modal-content');

    icon.textContent  = section.emoji;
    title.textContent = section.title;
    content.innerHTML = section.html;

    modal.classList.remove('hidden');

    // Wire up contact form if it's in this section
    if (id === 'contact') {
      this._setupContactForm();
    }

    // Focus trap — scroll to top
    document.getElementById('modal-body').scrollTop = 0;
  }

  closeModal() {
    const modal = document.getElementById('section-modal');
    modal.classList.add('hidden');
    this._modalOpen = false;
  }

  isModalOpen() {
    return this._modalOpen;
  }

  onVisit(callback) {
    this._onVisitCallback = callback;
  }

  _markVisited(id) {
    if (!this._visitedSections.has(id)) {
      this._visitedSections.add(id);
      this._updateProgress();
      showToast(`🗺️ Lieu découvert : ${SECTION_CONTENT[id].title}`);
      if (this._onVisitCallback) this._onVisitCallback(id, this._visitedSections.size);
    }
  }

  _updateProgress() {
    const count = this._visitedSections.size;
    const total = Object.keys(SECTION_CONTENT).length;
    const pct   = (count / total) * 100;

    // Progress bar
    document.getElementById('hud-progress-bar').style.width = pct + '%';
    document.getElementById('visited-count').textContent = count;

    // HUD dots
    const dotsEl = document.getElementById('hud-dots');
    dotsEl.innerHTML = '';
    for (const key of Object.keys(SECTION_CONTENT)) {
      const dot = document.createElement('span');
      dot.className = 'hud-dot' + (this._visitedSections.has(key) ? ' visited' : '');
      dot.title = SECTION_CONTENT[key].title;
      dotsEl.appendChild(dot);
    }

    // Quick nav status marks
    for (const key of Object.keys(SECTION_CONTENT)) {
      const statusEl = document.querySelector(`.qn-status[data-for="${key}"]`);
      const itemEl   = document.querySelector(`.quick-nav-item[data-section="${key}"]`);
      if (statusEl && this._visitedSections.has(key)) {
        statusEl.textContent = '★';
        statusEl.classList.add('visited-mark');
        itemEl && itemEl.classList.add('visited');
      }
    }

    // All visited!
    if (count === total) {
      setTimeout(() => {
        showToast('🏆 FÉLICITATIONS ! Vous avez exploré tout le portfolio !');
      }, 800);
    }
  }

  _setupUI() {
    // Close button
    document.getElementById('modal-close').addEventListener('click', () => {
      this.closeModal();
    });

    // Backdrop click
    document.getElementById('modal-backdrop').addEventListener('click', () => {
      this.closeModal();
    });

    // ESC via custom event
    document.addEventListener('closeModal', () => this.closeModal());

    // Quick nav toggle
    document.getElementById('quick-nav-toggle').addEventListener('click', () => {
      const panel = document.getElementById('quick-nav-panel');
      panel.classList.toggle('hidden');
    });

    document.getElementById('quick-nav-close').addEventListener('click', () => {
      document.getElementById('quick-nav-panel').classList.add('hidden');
    });

    // Quick nav items
    document.querySelectorAll('.quick-nav-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.section;
        document.getElementById('quick-nav-panel').classList.add('hidden');
        this.openSection(id);
      });
    });

    // Tutorial start
    document.getElementById('tutorial-start').addEventListener('click', () => {
      document.getElementById('tutorial-overlay').classList.add('hidden');
    });
  }

  _setupContactForm() {
    const form = document.getElementById('mc-contact-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const successMsg = document.getElementById('mc-form-success');
      const errorMsg   = document.getElementById('mc-form-error');
      const submitBtn  = form.querySelector('.mc-form-submit');

      successMsg.style.display = 'none';
      errorMsg.style.display   = 'none';
      submitBtn.textContent = '⏳ ENVOI...';
      submitBtn.disabled = true;

      const params = {
        from_name:  form.querySelector('[name="name"]').value,
        from_email: form.querySelector('[name="email"]').value,
        subject:    form.querySelector('[name="subject"]').value,
        message:    form.querySelector('[name="message"]').value,
      };

      // Use EmailJS if available, otherwise show a nice fallback
      if (typeof emailjs !== 'undefined') {
        const EMAILJS_SERVICE_ID  = 'service_kju3n28';
        const EMAILJS_TEMPLATE_ID = 'template_pili6gr';
        const EMAILJS_PUBLIC_KEY  = 'a8mKuHS56bPD-ydT0';

        emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
        emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, params)
          .then(() => {
            successMsg.style.display = 'block';
            form.reset();
          })
          .catch(() => {
            errorMsg.style.display = 'block';
          })
          .finally(() => {
            submitBtn.textContent = '▶ ENVOYER LE MESSAGE';
            submitBtn.disabled = false;
          });
      } else {
        // Fallback: open mailto
        const mailtoUrl = `mailto:arphandrame0@gmail.com?subject=${encodeURIComponent(params.subject)}&body=${encodeURIComponent(
          `De: ${params.from_name} (${params.from_email})\n\n${params.message}`
        )}`;
        window.open(mailtoUrl);
        successMsg.style.display = 'block';
        form.reset();
        submitBtn.textContent = '▶ ENVOYER LE MESSAGE';
        submitBtn.disabled = false;
      }
    });
  }
}

// ---- Toast notification -----------------------------------------

function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.remove('hidden');
  toast.classList.add('show');

  clearTimeout(toast._hideTimer);
  toast._hideTimer = setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.classList.add('hidden'), 400);
  }, 3000);
}
