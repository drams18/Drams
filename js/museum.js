/* ══════════════════════════════════════════════════════
   MUSÉE DE DRAMS — museum.js
   Portfolio interactif d'Arphan DRAME
   ══════════════════════════════════════════════════════ */

'use strict';

// ── Avatars ─────────────────────────────────────────────
const AVATARS = [
  { id: 'spiderman', name: 'Spider-Man',   emoji: '🕷️' },
  { id: 'batman',    name: 'Batman',        emoji: '🦇' },
  { id: 'flash',     name: 'Flash',         emoji: '⚡' },
  { id: 'superman',  name: 'Superman',      emoji: '🦸' },
  { id: 'naruto',    name: 'Naruto',        emoji: '🍥' },
  { id: 'goku',      name: 'Goku',          emoji: '🐉' },
  { id: 'sonic',     name: 'Sonic',         emoji: '💨' },
  { id: 'link',      name: 'Link',          emoji: '🗡️' },
  { id: 'mario',     name: 'Mario',         emoji: '🍄' },
  { id: 'harry',     name: 'Harry Potter',  emoji: '🧙' },
];

// ── Museum rooms ─────────────────────────────────────────
const ROOMS = [
  {
    id: 'hall',
    label: 'HALL D\'ENTRÉE',
    emoji: '🏛️',
    accent: '#d4af37',
    rgb: '212,175,55',
    type: 'profile',
    data: {
      roomTitle: 'HALL D\'ENTRÉE',
      roomSub: 'Bienvenue au Musée de drams',
      plaqueName: 'ARPHAN DRAME',
      plaqueDate: '2001 — aujourd\'hui',
      story: 'Bienvenue dans ce musée interactif dédié au parcours d\'Arphan DRAME, développeur Full Stack basé à Paris. Cette visite vous guidera à travers les moments fondateurs, les défis techniques surmontés et les créations qui ont façonné ce développeur complet et polyvalent.',
      badges: ['🟢 Disponible immédiatement', '📍 Paris, Île-de-France', '🎓 Master ASI — ETNA'],
      socials: [
        { icon: '⌨', label: 'GitHub',   url: 'https://github.com/drams18' },
        { icon: '💼', label: 'LinkedIn', url: 'https://www.linkedin.com/in/arphan-drame-b29259258/' },
        { icon: '🐦', label: 'Twitter',  url: 'https://twitter.com/drams_18' },
        { icon: '📸', label: 'Instagram', url: 'https://www.instagram.com/dramsss18/' },
      ],
      langs: ['🇫🇷 Français — Natif', '🇬🇧 Anglais — B2', '🇪🇸 Espagnol — A2', '🕌 Arabe — A2'],
    },
  },
  {
    id: 'origines',
    label: 'SALLE I — LES ORIGINES',
    emoji: '🔭',
    accent: '#8888ff',
    rgb: '136,136,255',
    type: 'timeline',
    data: {
      roomTitle: 'LES ORIGINES',
      roomSub: 'Le chemin vers le code — 2017 · 2022',
      plaqueName: 'FORMATION INITIALE',
      plaqueDate: '2017 — 2022',
      story: 'Avant d\'écrire la première ligne de code, il fallait comprendre comment les systèmes fonctionnent. C\'est par la voie des technologies numériques et de l\'électronique que le voyage a commencé.',
      challenge: 'Trouver sa vraie voie dans un domaine vaste et technique. Passer de l\'électronique au développement web demandait de reconnaître ses passions profondes et d\'avoir le courage de pivoter.',
      solution: 'Deux années de BTS SN (Systèmes Numériques) ont fourni des bases solides sur le fonctionnement des systèmes. Comprendre le hardware avant le software. Le projet final « Jardin connecté » a été la première rencontre concrète avec l\'informatique embarquée.',
      timeline: [
        { date: '2017', title: 'BAC STI2D', desc: 'Lycée Dorian — Paris 11e. Sciences et Technologies de l\'Industrie et du Développement Durable. Baccalauréat obtenu avec mention.' },
        { date: '2020 — 2022', title: 'BTS SYSTÈMES NUMÉRIQUES', desc: 'Lycée Jules Ferry — Versailles. Option Électronique (SN option B). BTS obtenu + Certification Pix. Projet de fin d\'études : Jardin connecté (IoT).' },
      ],
    },
  },
  {
    id: 'eveil',
    label: 'SALLE II — L\'ÉVEIL',
    emoji: '💡',
    accent: '#ffaa00',
    rgb: '255,170,0',
    type: 'story',
    data: {
      roomTitle: 'L\'ÉVEIL',
      roomSub: 'Le déclic du code — Le Réacteur, 2023',
      plaqueName: 'BOOTCAMP INTENSIF',
      plaqueDate: '2023',
      story: 'En 2023, une décision radicale : quitter l\'électronique et plonger tête première dans le développement web full stack. Le Réacteur, bootcamp d\'excellence à Paris, allait changer le cours des choses.',
      challenge: 'Apprendre à coder de zéro jusqu\'à la maîtrise full stack en moins de 3 mois. Comprendre non seulement la syntaxe, mais les architectures, les patterns, et la logique de pensée du développeur moderne.',
      solution: '3 mois d\'immersion totale : HTML, CSS, JavaScript, React, Node.js, MongoDB. Des projets fullstack de bout en bout livrés en conditions réelles. La sortie du bootcamp marque la naissance d\'un développeur.',
      tags: ['HTML/CSS', 'JavaScript', 'React', 'Node.js', 'MongoDB', 'API REST', 'Fullstack'],
    },
  },
  {
    id: 'academie',
    label: 'SALLE III — L\'ACADÉMIE',
    emoji: '🏛️',
    accent: '#44aaff',
    rgb: '68,170,255',
    type: 'story',
    data: {
      roomTitle: 'L\'ACADÉMIE',
      roomSub: 'Master ASI — ETNA 2023 · 2026',
      plaqueName: 'MASTER ARCHITECTE DE SYSTÈMES D\'INFORMATIONS',
      plaqueDate: '2023 — 2026',
      story: 'Après le bootcamp, l\'ambition était claire : aller plus loin. Le Master Architecte de Systèmes d\'Informations à l\'ETNA (École des Technologies Numériques Avancées) ouvre les portes d\'une expertise plus profonde et plus rigoureuse.',
      challenge: 'Passer du statut de développeur à celui d\'architecte. Comprendre les systèmes dans leur globalité, maîtriser les architectures complexes, les microservices, les plateformes mobiles et les pratiques DevOps de production.',
      solution: 'Un cursus rigoureux couvrant React Native, TypeScript, Symfony, Laravel, NestJS, Python, Docker, PostgreSQL. Des projets ambitieux en équipe qui simulent des conditions réelles de production. Un vrai saut vers l\'expertise technique d\'architecte.',
      tags: ['React Native', 'TypeScript', 'Symfony', 'Laravel', 'NestJS', 'Python', 'Docker', 'PostgreSQL', 'Architecture'],
    },
  },
  {
    id: 'arsenal',
    label: 'SALLE IV — L\'ARSENAL',
    emoji: '⚔️',
    accent: '#ff7744',
    rgb: '255,119,68',
    type: 'skills',
    data: {
      roomTitle: 'L\'ARSENAL',
      roomSub: 'Stack technique complète forgée en conditions réelles',
      plaqueName: 'ARMES DU DÉVELOPPEUR',
      plaqueDate: '2023 — Aujourd\'hui',
      story: 'Chaque outil est une arme forgée à travers des projets réels, des défis techniques et des heures de pratique. Voici l\'arsenal complet d\'un développeur Full Stack moderne.',
      categories: [
        { label: 'FRONTEND',          color: '#44aaff', rgb: '68,170,255',    skills: ['React', 'React Native', 'TypeScript', 'HTML / CSS', 'Expo EAS'] },
        { label: 'BACKEND',           color: '#44ee88', rgb: '68,238,136',    skills: ['Symfony', 'NestJS', 'Node.js', 'Laravel', 'Python', 'API REST', 'JWT'] },
        { label: 'BASE DE DONNÉES',   color: '#ff8844', rgb: '255,136,68',    skills: ['MySQL', 'PostgreSQL', 'MongoDB'] },
        { label: 'DEVOPS & OUTILS',   color: '#cc88ff', rgb: '204,136,255',   skills: ['Docker', 'Git', 'Railway', 'Cloudflare', 'Nginx', 'Web Scraping', 'Jira'] },
        { label: 'SOFT SKILLS',       color: '#ffd700', rgb: '255,215,0',     skills: ['Résolution de problèmes', 'Autonomie', 'Esprit d\'analyse', 'Apprentissage rapide', 'Travail d\'équipe'] },
      ],
    },
  },
  {
    id: 'islaah',
    label: 'SALLE V — ISLAAH',
    emoji: '📱',
    accent: '#00ddaa',
    rgb: '0,221,170',
    type: 'project',
    data: {
      roomTitle: 'ISLAAH',
      roomSub: 'Application mobile publiée sur l\'App Store — 2026',
      plaqueName: 'PREMIÈRE GRANDE CRÉATION',
      plaqueDate: '2026',
      story: 'ISLAAH est la première grande réalisation en solo : une application mobile de quiz et blind test autour du Coran. L\'idée : identifier les sourates à partir d\'extraits audio. Du concept à l\'App Store en quelques mois, entièrement en solo.',
      challenge: 'Développer une application mobile complète en autonomie totale — de l\'architecture backend à la publication sur l\'App Store — en intégrant du streaming audio, un système de gamification complet et une infrastructure cloud robuste et économique.',
      solution: 'API REST Symfony complète, app React Native avec Expo/EAS, gamification (XP, streaks, classements, notifications), streaming audio via Cloudflare, base MySQL structurée, déploiement Railway, et publication réussie sur l\'Apple Store.',
      tags: ['React Native', 'Symfony', 'MySQL', 'JWT', 'Cloudflare', 'Docker', 'Railway', 'EAS', 'App Store'],
      impact: 'Publié sur l\'Apple Store · Disponible mondialement · Gamification complète · Architecture solo',
      link: { label: '🍎 Voir sur l\'App Store', url: 'https://apps.apple.com/us/app/islaah/id6758726142' },
    },
  },
  {
    id: 'skywalk',
    label: 'SALLE VI — SKYWALK',
    emoji: '🌍',
    accent: '#6688ff',
    rgb: '102,136,255',
    type: 'project',
    data: {
      roomTitle: 'SKYWALK',
      roomSub: 'Plateforme d\'expatriation — ETNA GPE 2025 · 2026',
      plaqueName: 'PROJET D\'ÉQUIPE — ARCHITECTURE COMPLEXE',
      plaqueDate: '2025 — 2026',
      story: 'SKYWALK est un projet d\'équipe ambitieux : une plateforme complète d\'aide à l\'expatriation. Données internationales, comparateur de pays, dashboard de projets, authentification robuste, tout orchestré en architecture Docker multi-stage.',
      challenge: 'Concevoir et développer une plateforme full stack complexe en équipe, avec collecte automatisée de données via API externes et web scraping, architecture microservices, et une infrastructure de production solide gérée avec Jira.',
      solution: 'API REST NestJS avec authentification JWT (access + refresh tokens), base PostgreSQL structurée avec procédures, collecte de données Adzuna/OECD, web scraping, comparateur de pays, infrastructure Docker multi-stage + Nginx pour dev & prod.',
      tags: ['React', 'TypeScript', 'NestJS', 'PostgreSQL', 'JWT', 'Docker', 'Nginx', 'Web Scraping', 'Jira', 'API REST'],
      impact: 'Architecture microservices · Infrastructure Docker de production · Équipe de développement · Agile/Jira',
    },
  },
  {
    id: 'ame',
    label: 'SALLE VII — L\'ÂME',
    emoji: '🌿',
    accent: '#88ee88',
    rgb: '136,238,136',
    type: 'interests',
    data: {
      roomTitle: 'L\'ÂME',
      roomSub: 'Ce qui anime drams au-delà du code',
      plaqueName: 'PASSIONS & CENTRES D\'INTÉRÊT',
      plaqueDate: 'Depuis toujours',
      story: 'Derrière le développeur se cache une personne curieuse, passionnée et en perpétuel mouvement. Ces passions nourrissent la créativité, la discipline et l\'approche unique portée dans chaque projet.',
      interests: [
        { icon: '🏀', name: 'BASKET-BALL',      desc: 'Découvert au collège, rapidement devenu une passion. L\'esprit d\'équipe et la stratégie du jeu.' },
        { icon: '🇯🇵', name: 'MANGA & ANIMÉ',   desc: 'Fan de culture japonaise — une source d\'inspiration créative et de storytelling profond.' },
        { icon: '🎮', name: 'JEUX VIDÉO',        desc: 'Les jeux vidéo ont éveillé la curiosité pour l\'informatique et la création numérique dès l\'enfance.' },
        { icon: '💡', name: 'TECH & IA',          desc: 'Passionné par les dernières avancées tech, l\'intelligence artificielle et les nouvelles façons de résoudre des problèmes.' },
        { icon: '💻', name: 'PROJETS PERSO',      desc: 'Toujours en train d\'explorer une nouvelle technologie ou de construire un nouveau projet en dehors des heures de travail.' },
      ],
    },
  },
  {
    id: 'contact',
    label: 'SALLE VIII — CONTACT',
    emoji: '📬',
    accent: '#ff88cc',
    rgb: '255,136,204',
    type: 'contact',
    data: {
      roomTitle: 'CONTACT',
      roomSub: 'La prochaine étape commence ici',
      plaqueName: 'ME REJOINDRE',
      plaqueDate: 'Disponible immédiatement',
      story: 'La visite touche à sa fin. Si ce parcours vous a convaincu ou si vous souhaitez en discuter, toutes les voies sont ouvertes.',
      contacts: [
        { icon: '📧', label: 'EMAIL',       value: 'arphandrame0@gmail.com', href: 'mailto:arphandrame0@gmail.com' },
        { icon: '📱', label: 'TÉLÉPHONE',   value: '07 67 31 84 26',        href: 'tel:+33767318426' },
        { icon: '📍', label: 'LOCALISATION', value: 'Paris, Île-de-France',  href: null },
        { icon: '⌨',  label: 'GITHUB',      value: 'github.com/drams18',    href: 'https://github.com/drams18' },
        { icon: '💼', label: 'LINKEDIN',    value: 'Arphan DRAME',          href: 'https://www.linkedin.com/in/arphan-drame-b29259258/' },
        { icon: '🟢', label: 'STATUT',      value: 'Disponible immédiatement', href: null },
      ],
    },
  },
  {
    id: 'exit',
    label: 'SORTIE — FIN DE VISITE',
    emoji: '🏆',
    accent: '#ffd700',
    rgb: '255,215,0',
    type: 'completion',
    data: {
      roomTitle: 'VISITE TERMINÉE',
      roomSub: 'Merci d\'avoir exploré le Musée de drams',
    },
  },
];

// ── State ────────────────────────────────────────────────
const state = {
  avatar: null,
  room: 0,
  visited: new Set(),
};

// ── Init ─────────────────────────────────────────────────
function init() {
  buildAvatarGrid();
  buildMapList();
  buildProgressDots();
  document.getElementById('room-tot').textContent = ROOMS.length;

  // Welcome
  document.getElementById('btn-start-visit').addEventListener('click', () => switchTo('welcome', 'avatar'));
  document.getElementById('btn-back-welcome').addEventListener('click', () => switchTo('avatar', 'welcome'));
  document.getElementById('btn-enter-museum').addEventListener('click', onEnterMuseum);

  // Museum nav
  document.getElementById('nav-prev').addEventListener('click', () => navigate(-1));
  document.getElementById('nav-next').addEventListener('click', () => navigate(1));
  document.getElementById('btn-plan').addEventListener('click', openMap);
  document.getElementById('btn-close-map').addEventListener('click', closeMap);

  // Keyboard
  document.addEventListener('keydown', onKey);

  // Particles
  buildParticles();
}

// ── Screen transitions ────────────────────────────────────
function switchTo(from, to) {
  const fromEl = document.getElementById('screen-' + from);
  const toEl   = document.getElementById('screen-' + to);
  fromEl.classList.add('exiting');
  setTimeout(() => {
    fromEl.classList.remove('active', 'exiting');
    toEl.classList.add('active');
  }, 500);
}

// ── Avatar ────────────────────────────────────────────────
function buildAvatarGrid() {
  const grid = document.getElementById('avatar-grid');
  grid.innerHTML = AVATARS.map(a => `
    <div class="avatar-card" data-id="${a.id}" onclick="selectAvatar('${a.id}')">
      <div class="avatar-emoji">${a.emoji}</div>
      <div class="avatar-name">${a.name}</div>
    </div>
  `).join('');
}

function selectAvatar(id) {
  state.avatar = id;
  const a = AVATARS.find(x => x.id === id);
  document.querySelectorAll('.avatar-card').forEach(c =>
    c.classList.toggle('selected', c.dataset.id === id)
  );
  document.getElementById('sel-emoji').textContent = a.emoji;
  document.getElementById('sel-name').textContent = a.name + ' sélectionné·e';
  document.getElementById('btn-enter-museum').disabled = false;
}

function onEnterMuseum() {
  if (!state.avatar) return;
  const a = AVATARS.find(x => x.id === state.avatar);
  document.getElementById('topbar-avatar').textContent = a.emoji;
  document.getElementById('topbar-name').textContent = a.name;
  switchTo('avatar', 'museum');
  state.room = 0;
  state.visited.clear();
  renderRoom(0, null);
  setTimeout(() => toast(`🏛️ Bienvenue, ${a.name} ! La visite commence…`), 800);
}

// ── Navigation ────────────────────────────────────────────
function navigate(dir) {
  const next = state.room + dir;
  if (next < 0 || next >= ROOMS.length) return;
  renderRoom(next, dir > 0 ? 'next' : 'prev');
}

function goToRoom(index) {
  if (index < 0 || index >= ROOMS.length) return;
  const dir = index > state.room ? 'next' : index < state.room ? 'prev' : null;
  closeMap();
  renderRoom(index, dir);
}

function onKey(e) {
  const mapOpen = !document.getElementById('map-overlay').classList.contains('hidden');
  if (mapOpen) {
    if (e.key === 'Escape') closeMap();
    return;
  }
  if (document.getElementById('screen-museum').classList.contains('active')) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') navigate(1);
    if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   navigate(-1);
    if (e.key === 'Escape') openMap();
  }
}

// ── Room rendering ────────────────────────────────────────
function renderRoom(index, dir) {
  const room = ROOMS[index];
  const wrapper = document.getElementById('room-wrapper');
  const isFirst = !dir;
  const firstVisit = !state.visited.has(room.id);

  state.room = index;
  state.visited.add(room.id);

  // Spotlight color
  document.getElementById('hall-spotlight').style.background =
    `radial-gradient(ellipse 65% 55% at 50% 42%, rgba(${room.rgb}, 0.07) 0%, transparent 65%)`;

  // Room HTML
  const html = `<div class="room-exhibit" style="--ra:${room.accent};--ra-rgb:${room.rgb}">
    ${buildRoom(room)}
  </div>`;

  if (isFirst) {
    wrapper.innerHTML = html;
  } else {
    // Slide out, then slide in
    wrapper.style.opacity = '0';
    wrapper.style.transform = dir === 'next' ? 'translateX(-40px)' : 'translateX(40px)';
    wrapper.style.transition = 'opacity 0.28s ease, transform 0.28s ease';
    setTimeout(() => {
      wrapper.innerHTML = html;
      wrapper.style.transition = 'none';
      wrapper.style.transform = dir === 'next' ? 'translateX(40px)' : 'translateX(-40px)';
      wrapper.style.opacity = '0';
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          wrapper.style.transition = 'opacity 0.38s ease, transform 0.38s ease';
          wrapper.style.opacity = '1';
          wrapper.style.transform = 'translateX(0)';
        });
      });
    }, 280);
  }

  wrapper.scrollTop = 0;

  updateHUD(room);
  buildProgressDots();
  updateNavBtns();
  updateMapState();

  if (dir && firstVisit) {
    setTimeout(() => toast(`🏛️ ${room.label}`), 320);
  }

  // Completion fanfare
  if (room.type === 'completion' && firstVisit) {
    setTimeout(() => toast('🏆 Vous avez exploré le musée en entier !'), 1000);
  }
}

// ── HUD update ────────────────────────────────────────────
function updateHUD(room) {
  document.getElementById('topbar-room-name').textContent = room.label;
  document.getElementById('room-num').textContent = state.room + 1;
  const pct = (state.visited.size / ROOMS.length) * 100;
  document.getElementById('topbar-fill').style.width = pct + '%';
}

function buildProgressDots() {
  const container = document.getElementById('topbar-dots');
  if (!container) return;
  container.innerHTML = ROOMS.map((r, i) => {
    let cls = 't-dot';
    if (i === state.room) cls += ' current';
    else if (state.visited.has(r.id)) cls += ' visited';
    const style = i === state.room ? `background:${r.accent};box-shadow:0 0 5px ${r.accent};border-color:${r.accent}` : '';
    return `<div class="${cls}" title="${r.label}" style="${style}" onclick="goToRoom(${i})"></div>`;
  }).join('');
}

function updateNavBtns() {
  document.getElementById('nav-prev').disabled = state.room === 0;
  document.getElementById('nav-next').disabled = state.room >= ROOMS.length - 1;
  const prev = ROOMS[state.room - 1];
  const next = ROOMS[state.room + 1];
  document.getElementById('nav-prev-hint').textContent = prev ? prev.emoji : '';
  document.getElementById('nav-next-hint').textContent = next ? next.emoji : '';
}

// ── Map ───────────────────────────────────────────────────
function buildMapList() {
  const list = document.getElementById('map-list');
  list.innerHTML = ROOMS.map((r, i) => `
    <button class="map-item" data-i="${i}" onclick="goToRoom(${i})">
      <span class="map-num">${String(i + 1).padStart(2, '0')}</span>
      <span class="map-emoji">${r.emoji}</span>
      <span class="map-name">${r.label}</span>
      <span class="map-status">○</span>
    </button>
  `).join('');
}

function updateMapState() {
  document.querySelectorAll('.map-item').forEach((el, i) => {
    const r = ROOMS[i];
    el.classList.remove('current', 'visited');
    const s = el.querySelector('.map-status');
    if (i === state.room) {
      el.classList.add('current');
      s.textContent = '●';
      s.style.color = r.accent;
    } else if (state.visited.has(r.id)) {
      el.classList.add('visited');
      s.textContent = '✓';
      s.style.color = '';
    } else {
      s.textContent = '○';
      s.style.color = '';
    }
  });
}

function openMap()  { document.getElementById('map-overlay').classList.remove('hidden'); updateMapState(); }
function closeMap() { document.getElementById('map-overlay').classList.add('hidden'); }

// ── Toast ─────────────────────────────────────────────────
function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.remove('hidden', 'show');
  void el.offsetWidth;
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => el.classList.add('hidden'), 350);
  }, 3200);
}

// ── Particle background (welcome) ─────────────────────────
function buildParticles() {
  const container = document.getElementById('welcome-particles');
  const count = 60;
  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    const size  = Math.random() * 2 + 1;
    const x     = Math.random() * 100;
    const y     = Math.random() * 100;
    const delay = Math.random() * 5;
    const dur   = 3 + Math.random() * 4;
    const alpha = 0.1 + Math.random() * 0.3;
    el.style.cssText = `
      position:absolute;
      width:${size}px; height:${size}px;
      border-radius:50%;
      left:${x}%; top:${y}%;
      background:rgba(212,175,55,${alpha});
      animation: particleFade ${dur}s ${delay}s ease-in-out infinite alternate;
    `;
    container.appendChild(el);
  }
  if (!document.getElementById('particle-style')) {
    const s = document.createElement('style');
    s.id = 'particle-style';
    s.textContent = `
      @keyframes particleFade {
        from { opacity:0; transform:translateY(0) scale(1); }
        to   { opacity:1; transform:translateY(-12px) scale(1.2); }
      }
    `;
    document.head.appendChild(s);
  }
}

// ══════════════════════════════════════════════════════════
// ROOM BUILDERS
// ══════════════════════════════════════════════════════════

function buildRoom(room) {
  const header = `
    <div class="room-nameplate">
      <div class="room-label-tag">${room.label}</div>
      <h2 class="room-title">${room.data.roomTitle}</h2>
      <p class="room-subtitle">${room.data.roomSub}</p>
    </div>
    <div class="gold-rule"></div>
  `;
  let body = '';
  switch (room.type) {
    case 'profile':    body = buildProfile(room);    break;
    case 'timeline':   body = buildTimeline(room);   break;
    case 'story':      body = buildStory(room);      break;
    case 'skills':     body = buildSkills(room);     break;
    case 'project':    body = buildProject(room);    break;
    case 'interests':  body = buildInterests(room);  break;
    case 'contact':    body = buildContact(room);    break;
    case 'completion': body = buildCompletion(room); break;
  }
  return header + body;
}

// ── Profile room ──────────────────────────────────────────
function buildProfile(room) {
  const d = room.data;
  return `
    <div class="exhibit-frame">
      <div class="exhibit-plaque">
        <div class="plaque-name">${d.plaqueName}</div>
        <div class="plaque-date">${d.plaqueDate}</div>
      </div>
      <div class="profile-row">
        <img src="assets/img/moi-rond.png" class="profile-img" alt="Arphan DRAME"
             onerror="handleImgError(this)">
        <div class="profile-info">
          <div class="profile-name">${d.plaqueName}</div>
          <div class="profile-role">Développeur Full Stack · Paris, Île-de-France</div>
          <div class="profile-badges">
            ${d.badges.map(b => `<span class="e-tag">${b}</span>`).join('')}
          </div>
        </div>
      </div>
      <p class="exhibit-story">${d.story}</p>
      <div class="exhibit-tags">
        ${d.langs.map(l => `<span class="e-tag">${l}</span>`).join('')}
      </div>
      <div class="profile-social">
        ${d.socials.map(s => `<a href="${s.url}" target="_blank">${s.icon} ${s.label}</a>`).join('')}
      </div>
    </div>
  `;
}

// ── Timeline room ─────────────────────────────────────────
function buildTimeline(room) {
  const d = room.data;
  return `
    <div class="exhibit-frame">
      <div class="exhibit-plaque">
        <div class="plaque-name">${d.plaqueName}</div>
        <div class="plaque-date">${d.plaqueDate}</div>
      </div>
      <p class="exhibit-story">${d.story}</p>
      <div class="exhibit-block exhibit-block-challenge">
        <div class="block-label block-label-challenge">⚠ DÉFI</div>
        <div class="block-text">${d.challenge}</div>
      </div>
      <div class="exhibit-block exhibit-block-solution">
        <div class="block-label block-label-solution">✓ RÉSULTAT</div>
        <div class="block-text">${d.solution}</div>
      </div>
      <div class="exhibit-timeline">
        ${d.timeline.map(t => `
          <div class="tl-item">
            <div class="tl-date">${t.date}</div>
            <div class="tl-title">${t.title}</div>
            <div class="tl-desc">${t.desc}</div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// ── Story room ────────────────────────────────────────────
function buildStory(room) {
  const d = room.data;
  const tags = d.tags ? `
    <div class="exhibit-tags">
      ${d.tags.map(t => `<span class="e-tag">${t}</span>`).join('')}
    </div>` : '';
  return `
    <div class="exhibit-frame">
      <div class="exhibit-plaque">
        <div class="plaque-name">${d.plaqueName}</div>
        <div class="plaque-date">${d.plaqueDate}</div>
      </div>
      <p class="exhibit-story">${d.story}</p>
      <div class="exhibit-block exhibit-block-challenge">
        <div class="block-label block-label-challenge">⚠ DÉFI</div>
        <div class="block-text">${d.challenge}</div>
      </div>
      <div class="exhibit-block exhibit-block-solution">
        <div class="block-label block-label-solution">✓ RÉSULTAT</div>
        <div class="block-text">${d.solution}</div>
      </div>
      ${tags}
    </div>
  `;
}

// ── Skills room ───────────────────────────────────────────
function buildSkills(room) {
  const d = room.data;
  return `
    <div class="exhibit-frame">
      <div class="exhibit-plaque">
        <div class="plaque-name">${d.plaqueName}</div>
        <div class="plaque-date">${d.plaqueDate}</div>
      </div>
      <p class="exhibit-story">${d.story}</p>
      ${d.categories.map(cat => `
        <div class="skill-section">
          <div class="skill-category" style="color:${cat.color}">${cat.label}</div>
          <div class="skill-grid">
            ${cat.skills.map(s => `
              <div class="skill-chip" style="--chip-rgb:${cat.rgb}">${s}</div>
            `).join('')}
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

// ── Project room ──────────────────────────────────────────
function buildProject(room) {
  const d = room.data;
  const impact = d.impact ? `
    <div class="exhibit-impact">
      <div class="impact-label">IMPACT</div>
      <div class="impact-text">${d.impact}</div>
    </div>` : '';
  const link = d.link ? `
    <a href="${d.link.url}" target="_blank" class="exhibit-link">${d.link.label}</a>` : '';
  return `
    <div class="exhibit-frame">
      <div class="exhibit-plaque">
        <div class="plaque-name">${d.plaqueName}</div>
        <div class="plaque-date">${d.plaqueDate}</div>
      </div>
      <p class="exhibit-story">${d.story}</p>
      <div class="exhibit-block exhibit-block-challenge">
        <div class="block-label block-label-challenge">⚠ DÉFI</div>
        <div class="block-text">${d.challenge}</div>
      </div>
      <div class="exhibit-block exhibit-block-solution">
        <div class="block-label block-label-solution">✓ RÉSULTAT</div>
        <div class="block-text">${d.solution}</div>
      </div>
      <div class="exhibit-tags">
        ${d.tags.map(t => `<span class="e-tag">${t}</span>`).join('')}
      </div>
      ${impact}
      ${link}
    </div>
  `;
}

// ── Interests room ────────────────────────────────────────
function buildInterests(room) {
  const d = room.data;
  return `
    <div class="exhibit-frame">
      <div class="exhibit-plaque">
        <div class="plaque-name">${d.plaqueName}</div>
        <div class="plaque-date">${d.plaqueDate}</div>
      </div>
      <p class="exhibit-story">${d.story}</p>
      <div class="interests-grid">
        ${d.interests.map(i => `
          <div class="interest-card">
            <div class="interest-icon">${i.icon}</div>
            <div class="interest-name">${i.name}</div>
            <div class="interest-desc">${i.desc}</div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// ── Contact room ──────────────────────────────────────────
function buildContact(room) {
  const d = room.data;
  return `
    <div class="exhibit-frame">
      <div class="exhibit-plaque">
        <div class="plaque-name">${d.plaqueName}</div>
        <div class="plaque-date">${d.plaqueDate}</div>
      </div>
      <p class="exhibit-story">${d.story}</p>
      <div class="contact-grid">
        ${d.contacts.map(c => `
          <div class="contact-item">
            <div class="contact-item-icon">${c.icon}</div>
            <div>
              <div class="contact-item-label">${c.label}</div>
              <div class="contact-item-value">
                ${c.href
                  ? `<a href="${c.href}" ${c.href.startsWith('http') ? 'target="_blank"' : ''}>${c.value}</a>`
                  : c.value}
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// ── Completion room ───────────────────────────────────────
function buildCompletion(room) {
  const a = AVATARS.find(x => x.id === state.avatar);
  const name = a ? a.name : 'Vous';
  return `
    <div class="completion-wrap">
      <div class="completion-trophy">🏆</div>
      <div class="completion-title">VISITE TERMINÉE !</div>
      <div class="completion-sub">${name} a exploré les ${ROOMS.length} salles du Musée de drams</div>
      <p class="exhibit-story" style="max-width:480px;margin:0 auto 24px">
        Merci d'avoir pris le temps de découvrir le parcours d'Arphan DRAME.
        Si quelque chose a retenu votre attention, la prochaine étape n'attend que vous.
      </p>
      <div class="gold-rule" style="margin-bottom:24px"></div>
      <div class="completion-links">
        <a href="https://github.com/drams18" target="_blank" class="exhibit-link">⌨ GitHub</a>
        <a href="https://www.linkedin.com/in/arphan-drame-b29259258/" target="_blank" class="exhibit-link">💼 LinkedIn</a>
        <a href="mailto:arphandrame0@gmail.com" class="exhibit-link">📧 Email</a>
      </div>
      <button class="completion-restart" onclick="goToRoom(0)">↩ Recommencer la visite</button>
    </div>
  `;
}

// ── Utilities ─────────────────────────────────────────────
function handleImgError(el) {
  el.outerHTML = '<div class="profile-placeholder">🧑‍💻</div>';
}

// ── Start ─────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', init);
