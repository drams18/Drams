/* ══════════════════════════════════════════════════════
   MUSÉE DE DRAMS — museum.js  (game version)
   Portfolio interactif d'Arphan DRAME
   ══════════════════════════════════════════════════════ */

'use strict';

// ── Avatars ─────────────────────────────────────────────
const AVATARS = [
  { id: 'spiderman', name: 'Spider-Man',  emoji: '🕷️' },
  { id: 'batman',    name: 'Batman',       emoji: '🦇' },
  { id: 'flash',     name: 'Flash',        emoji: '⚡' },
  { id: 'superman',  name: 'Superman',     emoji: '🦸' },
  { id: 'naruto',    name: 'Naruto',       emoji: '🍥' },
  { id: 'goku',      name: 'Goku',         emoji: '🐉' },
  { id: 'sonic',     name: 'Sonic',        emoji: '💨' },
  { id: 'link',      name: 'Link',         emoji: '🗡️' },
  { id: 'mario',     name: 'Mario',        emoji: '🍄' },
  { id: 'harry',     name: 'Harry Potter', emoji: '🧙' },
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
        { icon: '⌨', label: 'GitHub',    url: 'https://github.com/drams18' },
        { icon: '💼', label: 'LinkedIn',  url: 'https://www.linkedin.com/in/arphan-drame-b29259258/' },
        { icon: '🐦', label: 'Twitter',   url: 'https://twitter.com/drams_18' },
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
        { label: 'FRONTEND',        color: '#44aaff', rgb: '68,170,255',  skills: ['React', 'React Native', 'TypeScript', 'HTML / CSS', 'Expo EAS'] },
        { label: 'BACKEND',         color: '#44ee88', rgb: '68,238,136',  skills: ['Symfony', 'NestJS', 'Node.js', 'Laravel', 'Python', 'API REST', 'JWT'] },
        { label: 'BASE DE DONNÉES', color: '#ff8844', rgb: '255,136,68',  skills: ['MySQL', 'PostgreSQL', 'MongoDB'] },
        { label: 'DEVOPS & OUTILS', color: '#cc88ff', rgb: '204,136,255', skills: ['Docker', 'Git', 'Railway', 'Cloudflare', 'Nginx', 'Web Scraping', 'Jira'] },
        { label: 'SOFT SKILLS',     color: '#ffd700', rgb: '255,215,0',   skills: ['Résolution de problèmes', 'Autonomie', 'Esprit d\'analyse', 'Apprentissage rapide', 'Travail d\'équipe'] },
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
        { icon: '🏀', name: 'BASKET-BALL',  desc: 'Découvert au collège, rapidement devenu une passion. L\'esprit d\'équipe et la stratégie du jeu.' },
        { icon: '🇯🇵', name: 'MANGA & ANIMÉ', desc: 'Fan de culture japonaise — une source d\'inspiration créative et de storytelling profond.' },
        { icon: '🎮', name: 'JEUX VIDÉO',   desc: 'Les jeux vidéo ont éveillé la curiosité pour l\'informatique et la création numérique dès l\'enfance.' },
        { icon: '💡', name: 'TECH & IA',     desc: 'Passionné par les dernières avancées tech, l\'intelligence artificielle et les nouvelles façons de résoudre des problèmes.' },
        { icon: '💻', name: 'PROJETS PERSO', desc: 'Toujours en train d\'explorer une nouvelle technologie ou de construire un nouveau projet en dehors des heures de travail.' },
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
        { icon: '📧', label: 'EMAIL',        value: 'arphandrame0@gmail.com',  href: 'mailto:arphandrame0@gmail.com' },
        { icon: '📱', label: 'TÉLÉPHONE',    value: '07 67 31 84 26',          href: 'tel:+33767318426' },
        { icon: '📍', label: 'LOCALISATION', value: 'Paris, Île-de-France',    href: null },
        { icon: '⌨',  label: 'GITHUB',       value: 'github.com/drams18',      href: 'https://github.com/drams18' },
        { icon: '💼', label: 'LINKEDIN',     value: 'Arphan DRAME',            href: 'https://www.linkedin.com/in/arphan-drame-b29259258/' },
        { icon: '🟢', label: 'STATUT',       value: 'Disponible immédiatement', href: null },
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

// ── Screen state ──────────────────────────────────────────
const state = {
  avatar: null,
  room: 0,
  visited: new Set(),
};

// ── Game state ────────────────────────────────────────────
const DOOR_SPACING  = 220;   // px between door centers in corridor
const CORRIDOR_PAD  = 160;   // left/right padding
const CHAR_W        = 52;
const CHAR_H        = 80;
const CHAR_SPEED    = 5.5;
const NEAR_THRESH   = 70;    // px radius to highlight door
const CORRIDOR_W    = ROOMS.length * DOOR_SPACING + CORRIDOR_PAD * 2;

const gst = {
  running: false,
  char: { x: 0, vx: 0, facing: 1 },
  nearDoor: -1,
  inRoom: -1,
  frameId: null,
  keys: {},
};

function getDoorX(i) { return CORRIDOR_PAD + i * DOOR_SPACING; }

// ── Init ──────────────────────────────────────────────────
function init() {
  buildAvatarGrid();
  buildMapList();

  document.getElementById('btn-start-visit').addEventListener('click', () => switchTo('welcome', 'avatar'));
  document.getElementById('btn-back-welcome').addEventListener('click', () => switchTo('avatar', 'welcome'));
  document.getElementById('btn-enter-museum').addEventListener('click', onEnterMuseum);
  document.getElementById('btn-plan').addEventListener('click', openMap);
  document.getElementById('btn-close-map').addEventListener('click', closeMap);
  document.getElementById('btn-exit-room').addEventListener('click', exitGameRoom);
  document.getElementById('room-nav-prev').addEventListener('click', () => navigateRoom(-1));
  document.getElementById('room-nav-next').addEventListener('click', () => navigateRoom(1));

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

// ── Avatar screen ─────────────────────────────────────────
function buildAvatarGrid() {
  const grid = document.getElementById('avatar-grid');
  grid.innerHTML = AVATARS.map(a => `
    <div class="avatar-card" data-id="${a.id}" onclick="selectAvatar('${a.id}')">
      <div class="avatar-sprite-wrap">
        <img class="avatar-img"
             src="assets/img/avatars/${a.id}.png"
             alt="${a.name}"
             onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
        <div class="avatar-emoji-fb">${a.emoji}</div>
      </div>
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

  const preview = document.getElementById('sel-avatar-preview');
  preview.innerHTML = `
    <img src="assets/img/avatars/${a.id}.png" alt="${a.name}"
         onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
    <span class="sel-emoji-fb">${a.emoji}</span>
  `;
  document.getElementById('sel-name').textContent = a.name + ' sélectionné·e';
  document.getElementById('btn-enter-museum').disabled = false;
}

function onEnterMuseum() {
  if (!state.avatar) return;
  const a = AVATARS.find(x => x.id === state.avatar);

  // HUD avatar
  const icon = document.getElementById('hud-char-icon');
  icon.innerHTML = `
    <img src="assets/img/avatars/${a.id}.png" alt="${a.name}"
         onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
    <span class="hud-emoji-fb">${a.emoji}</span>
  `;
  document.getElementById('hud-char-name').textContent = a.name;

  switchTo('avatar', 'museum');
  state.room = 0;
  state.visited.clear();

  setTimeout(() => {
    initGame(a);
    toast(`🏛️ Bienvenue, ${a.name} ! Déplacez-vous avec ← →`);
  }, 550);
}

// ══════════════════════════════════════════════════════════
// GAME ENGINE
// ══════════════════════════════════════════════════════════

function initGame(avatar) {
  buildCorridor(avatar);
  buildMinimapRooms();
  buildProgressDots();
  setupGameInput();

  gst.char.x = getDoorX(0) - CHAR_W / 2;
  gst.nearDoor = 0;
  gst.inRoom = -1;
  gst.running = true;

  // Show controls hint
  const hint = document.getElementById('controls-hint');
  hint.classList.add('visible');
  setTimeout(() => hint.classList.remove('visible'), 5000);

  if (gst.frameId) cancelAnimationFrame(gst.frameId);
  gameLoop();
}

function buildCorridor(avatar) {
  const scene = document.getElementById('corridor-scene');
  scene.style.width = CORRIDOR_W + 'px';

  // Build doors
  const doorsEl = document.getElementById('corridor-doors');
  doorsEl.innerHTML = ROOMS.map((room, i) => {
    const x = getDoorX(i);
    const shortLabel = room.label.includes('—')
      ? room.label.split('—')[1].trim()
      : room.label;
    return `
      <div class="game-door" data-i="${i}" style="left:${x - 55}px" onclick="tapDoor(${i})">
        <div class="door-num">${String(i + 1).padStart(2, '0')}</div>
        <div class="door-emoji">${room.emoji}</div>
        <div class="door-label">${shortLabel}</div>
        <div class="door-hint">↑ ENTRER</div>
        <div class="door-glow"></div>
      </div>
    `;
  }).join('');

  // Build character sprite
  const inner = document.getElementById('char-sprite-inner');
  inner.innerHTML = `
    <img src="assets/img/avatars/${avatar.id}.png" alt="${avatar.name}"
         onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
    <div class="char-emoji-fb">${avatar.emoji}</div>
  `;
}

function buildMinimapRooms() {
  const el = document.getElementById('minimap-rooms');
  el.innerHTML = ROOMS.map((r, i) => `
    <div class="mm-room" data-i="${i}" title="${r.label}"
         style="left:${(getDoorX(i) / CORRIDOR_W) * 100}%"
         onclick="tapDoor(${i})"></div>
  `).join('');
}

function buildProgressDots() {
  // We don't have topbar-dots anymore, minimap handles it
  updateMinimapState();
}

function updateMinimapState() {
  document.querySelectorAll('.mm-room').forEach((el, i) => {
    const r = ROOMS[i];
    el.classList.remove('current', 'visited');
    if (i === state.room) {
      el.classList.add('current');
      el.style.background = r.accent;
      el.style.boxShadow  = `0 0 6px ${r.accent}`;
    } else if (state.visited.has(r.id)) {
      el.classList.add('visited');
      el.style.background = '';
      el.style.boxShadow  = '';
    } else {
      el.style.background = '';
      el.style.boxShadow  = '';
    }
  });
}

function setupGameInput() {
  document.addEventListener('keydown', onGameKey);
  document.addEventListener('keyup',   e => { gst.keys[e.code] = false; });

  // Mobile d-pad
  const btnL = document.getElementById('btn-dpad-left');
  const btnR = document.getElementById('btn-dpad-right');
  const btnE = document.getElementById('btn-dpad-enter');

  const hold = (btn, code) => {
    btn.addEventListener('touchstart', e => { e.preventDefault(); gst.keys[code] = true; },  { passive: false });
    btn.addEventListener('touchend',   e => { e.preventDefault(); gst.keys[code] = false; }, { passive: false });
    btn.addEventListener('mousedown',  () => { gst.keys[code] = true; });
    btn.addEventListener('mouseup',    () => { gst.keys[code] = false; });
    btn.addEventListener('mouseleave', () => { gst.keys[code] = false; });
  };
  hold(btnL, 'ArrowLeft');
  hold(btnR, 'ArrowRight');
  btnE.addEventListener('click', () => {
    if (gst.nearDoor >= 0 && gst.inRoom < 0) enterGameRoom(gst.nearDoor);
  });
}

function onGameKey(e) {
  gst.keys[e.code] = true;

  const mapOpen = !document.getElementById('map-overlay').classList.contains('hidden');
  if (mapOpen) {
    if (e.code === 'Escape') closeMap();
    return;
  }

  if (!document.getElementById('screen-museum').classList.contains('active')) return;

  if (gst.inRoom >= 0) {
    // Inside a room
    if (e.code === 'Escape' || e.code === 'KeyQ') exitGameRoom();
    if (e.code === 'ArrowRight' || e.code === 'KeyD') navigateRoom(1);
    if (e.code === 'ArrowLeft'  || e.code === 'KeyA') navigateRoom(-1);
    return;
  }

  // In corridor
  if (e.code === 'Escape') { openMap(); return; }
  if ((e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Enter') && gst.nearDoor >= 0) {
    e.preventDefault();
    enterGameRoom(gst.nearDoor);
  }
}

function gameLoop() {
  if (!gst.running) return;

  if (gst.inRoom < 0) {
    // Movement
    if (gst.keys.ArrowRight || gst.keys.KeyD) {
      gst.char.vx = Math.min(gst.char.vx + 0.9, CHAR_SPEED);
    } else if (gst.keys.ArrowLeft || gst.keys.KeyA) {
      gst.char.vx = Math.max(gst.char.vx - 0.9, -CHAR_SPEED);
    } else {
      gst.char.vx *= 0.72;
      if (Math.abs(gst.char.vx) < 0.08) gst.char.vx = 0;
    }

    gst.char.x = Math.max(0, Math.min(gst.char.x + gst.char.vx, CORRIDOR_W - CHAR_W));

    if (gst.char.vx > 0.2)       gst.char.facing = 1;
    else if (gst.char.vx < -0.2) gst.char.facing = -1;

    // Nearest door
    const charCenter = gst.char.x + CHAR_W / 2;
    let bestI = -1, bestD = Infinity;
    for (let i = 0; i < ROOMS.length; i++) {
      const d = Math.abs(charCenter - getDoorX(i));
      if (d < NEAR_THRESH && d < bestD) { bestI = i; bestD = d; }
    }
    if (bestI !== gst.nearDoor) {
      gst.nearDoor = bestI;
      if (bestI >= 0) {
        state.room = bestI;
        updateMinimapState();
      }
    }

    renderCorridorFrame();
  }

  gst.frameId = requestAnimationFrame(gameLoop);
}

function renderCorridorFrame() {
  const viewport = document.getElementById('corridor-viewport');
  const scene    = document.getElementById('corridor-scene');
  const charEl   = document.getElementById('game-character');
  if (!viewport || !scene || !charEl) return;

  // Camera — smooth follow
  const vw      = viewport.clientWidth;
  const targetX = gst.char.x + CHAR_W / 2 - vw / 2;
  const camX    = Math.max(0, Math.min(targetX, CORRIDOR_W - vw));
  scene.style.transform = `translateX(${-camX}px)`;

  // Character
  charEl.style.left = gst.char.x + 'px';
  const flip = gst.char.facing === -1 ? 'scaleX(-1)' : 'scaleX(1)';
  charEl.style.transform = flip;
  charEl.classList.toggle('walking', Math.abs(gst.char.vx) > 0.4);

  // Door highlights
  document.querySelectorAll('.game-door').forEach((el, i) => {
    el.classList.toggle('near', i === gst.nearDoor);
  });

  // Minimap character dot
  const dot = document.getElementById('minimap-char-dot');
  if (dot) {
    const pct = (gst.char.x / (CORRIDOR_W - CHAR_W)) * 100;
    dot.style.left = pct + '%';
  }
}

// ── Enter / Exit room ─────────────────────────────────────
function enterGameRoom(i) {
  if (gst.inRoom >= 0) return;
  gst.inRoom   = i;
  state.room   = i;
  const firstVisit = !state.visited.has(ROOMS[i].id);
  state.visited.add(ROOMS[i].id);

  renderRoomOverlay(i);
  updateMinimapState();

  if (firstVisit && ROOMS[i].type === 'completion') {
    setTimeout(() => toast('🏆 Vous avez exploré le musée en entier !'), 900);
  }
}

function renderRoomOverlay(i) {
  const room    = ROOMS[i];
  const overlay = document.getElementById('room-overlay');
  const wrapper = document.getElementById('room-wrapper');
  const nameEl  = document.getElementById('room-overlay-room-name');
  const counter = document.getElementById('room-nav-counter');
  const spotlight = document.getElementById('hall-spotlight');
  const prevBtn = document.getElementById('room-nav-prev');
  const nextBtn = document.getElementById('room-nav-next');

  nameEl.textContent  = room.label;
  counter.textContent = `${i + 1} / ${ROOMS.length}`;
  prevBtn.disabled    = i === 0;
  nextBtn.disabled    = i >= ROOMS.length - 1;

  if (spotlight) {
    spotlight.style.background =
      `radial-gradient(ellipse 65% 55% at 50% 42%, rgba(${room.rgb},0.07) 0%, transparent 65%)`;
  }

  wrapper.innerHTML = `
    <div class="room-exhibit" style="--ra:${room.accent};--ra-rgb:${room.rgb}">
      ${buildRoom(room)}
    </div>
  `;
  wrapper.scrollTop = 0;

  overlay.classList.remove('hidden', 'exiting');
  void overlay.offsetWidth; // reflow
  overlay.classList.add('entering');
  setTimeout(() => overlay.classList.remove('entering'), 450);
}

function exitGameRoom() {
  gst.inRoom = -1;
  const overlay = document.getElementById('room-overlay');
  overlay.classList.add('exiting');
  setTimeout(() => {
    overlay.classList.add('hidden');
    overlay.classList.remove('exiting');
  }, 380);
}

function navigateRoom(dir) {
  const next = gst.inRoom + dir;
  if (next < 0 || next >= ROOMS.length) return;
  gst.inRoom   = next;
  state.room   = next;
  state.visited.add(ROOMS[next].id);

  // Move character to match
  gst.char.x = getDoorX(next) - CHAR_W / 2;

  renderRoomOverlay(next);
  updateMinimapState();
}

function tapDoor(i) {
  // Mobile / click: teleport char & enter
  gst.char.x    = getDoorX(i) - CHAR_W / 2;
  gst.char.vx   = 0;
  gst.nearDoor  = i;
  state.room    = i;
  enterGameRoom(i);
}

function goToRoom(i) {
  if (i < 0 || i >= ROOMS.length) return;
  closeMap();
  tapDoor(i);
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

function openMap()  {
  updateMapState();
  document.getElementById('map-overlay').classList.remove('hidden');
}
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
  }, 3400);
}

// ── Particle background ───────────────────────────────────
function buildParticles() {
  const container = document.getElementById('welcome-particles');
  for (let i = 0; i < 60; i++) {
    const el = document.createElement('div');
    const size  = Math.random() * 2 + 1;
    const dur   = 3 + Math.random() * 4;
    const delay = Math.random() * 5;
    el.style.cssText = `
      position:absolute;
      width:${size}px; height:${size}px; border-radius:50%;
      left:${Math.random()*100}%; top:${Math.random()*100}%;
      background:rgba(212,175,55,${0.1 + Math.random()*0.3});
      animation:particleFade ${dur}s ${delay}s ease-in-out infinite alternate;
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
// ROOM BUILDERS (unchanged from original)
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

function buildCompletion(room) {
  const a    = AVATARS.find(x => x.id === state.avatar);
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
      <button class="completion-restart" onclick="goToRoom(0)">↩ Retour au début</button>
    </div>
  `;
}

function handleImgError(el) {
  el.outerHTML = '<div class="profile-placeholder">🧑‍💻</div>';
}

// ── Start ─────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', init);
