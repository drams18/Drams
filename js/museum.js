/* ══════════════════════════════════════════════════════
   MUSEUM.JS — Portfolio data (sections content)
   Arphan DRAME — Développeur Full Stack
   ══════════════════════════════════════════════════════ */

'use strict';

const SECTIONS = {
  profile: {
    id: 'profile',
    label: 'PROFIL & SKILLS',
    accent: '#4fc3f7',
    emoji: '🏠',
    bio: {
      name: 'Arphan DRAME',
      title: 'Développeur Full Stack',
      location: 'Paris, Île-de-France',
      availability: '🟢 Disponible immédiatement',
      description: 'Développeur Full Stack passionné, spécialisé en React, React Native et Symfony. Curieux, autonome, j\'aime construire des produits qui ont du sens — des apps mobiles aux plateformes web complexes.',
      photo: 'assets/img/profile.jpg',
      languages: [
        { label: 'Français', level: 'Natif', flag: '🇫🇷' },
        { label: 'Anglais', level: 'B2', flag: '🇬🇧' },
        { label: 'Espagnol', level: 'A2', flag: '🇪🇸' },
        { label: 'Arabe', level: 'A2', flag: '🕌' },
      ],
      socials: [
        { icon: '⌨', label: 'GitHub', url: 'https://github.com/drams18' },
        { icon: '💼', label: 'LinkedIn', url: 'https://www.linkedin.com/in/arphan-drame-b29259258/' },
      ],
    },
    skills: [
      { name: 'React / React Native', level: 90, color: '#61dafb' },
      { name: 'TypeScript', level: 85, color: '#3178c6' },
      { name: 'Symfony', level: 80, color: '#000' },
      { name: 'NestJS', level: 75, color: '#e0234e' },
      { name: 'Node.js', level: 80, color: '#3c873a' },
      { name: 'Docker', level: 70, color: '#2496ed' },
      { name: 'PostgreSQL / MySQL', level: 75, color: '#336791' },
      { name: 'Python', level: 40, color: '#ffd43b' },
    ],
  },

  parcours: {
    id: 'parcours',
    label: 'PARCOURS',
    accent: '#81c784',
    emoji: '🎓',
    timeline: [
      {
        date: '2017',
        title: 'BAC STI2D',
        place: 'Lycée Dorian — Paris 11e',
        desc: 'Baccalauréat Sciences et Technologies de l\'Industrie et du Développement Durable, obtenu avec mention.',
        icon: '🎓',
      },
      {
        date: '2020 — 2022',
        title: 'BTS Systèmes Numériques',
        place: 'Lycée Jules Ferry — Versailles',
        desc: 'Option Électronique (SN option B). BTS obtenu + Certification Pix. Projet de fin d\'études : Jardin connecté (IoT).',
        icon: '⚡',
      },
      {
        date: '2023',
        title: 'Bootcamp Full Stack — Le Réacteur',
        place: 'Paris',
        desc: 'Formation intensive full stack web & mobile. Plongée dans React, Node.js, React Native et les bonnes pratiques du développement moderne.',
        icon: '🚀',
      },
      {
        date: '2023 — Présent',
        title: 'Master ASI',
        place: 'ETNA / YNOV — Paris',
        desc: 'Architecture des Systèmes d\'Information. Approfondissement des architectures logicielles, microservices, cloud et DevOps.',
        icon: '🏛️',
      },
    ],
    experiences: [
      {
        date: '2023 — Présent',
        title: 'Développeur Full Stack Freelance',
        desc: 'Développement d\'applications web et mobiles. Projets : ISLAAH (app mobile), SKYWALK (plateforme SaaS).',
        icon: '💻',
      },
    ],
  },

  passions: {
    id: 'passions',
    label: 'PASSIONS',
    accent: '#ff8a65',
    emoji: '🎯',
    items: [
      { emoji: '⚽', title: 'Sport', desc: 'Football, musculation — l\'esprit d\'équipe et la discipline comme moteurs.' },
      { emoji: '🎮', title: 'Gaming', desc: 'Jeux vidéo depuis l\'enfance. Source d\'inspiration créative pour mes projets interactifs.' },
      { emoji: '📱', title: 'Tech & Veille', desc: 'Suivi des dernières tendances en dev mobile, IA et architecture logicielle.' },
      { emoji: '🕌', title: 'Culture', desc: 'Ouverture sur le monde, diversité culturelle, apprentissage des langues.' },
      { emoji: '🎵', title: 'Musique', desc: 'Hip-hop, R&B — la musique comme compagne de code et de concentration.' },
      { emoji: '✈️', title: 'Voyages', desc: 'Explorer de nouvelles villes, découvrir d\'autres façons de penser et de vivre.' },
    ],
  },

  contact: {
    id: 'contact',
    label: 'CONTACT',
    accent: '#ce93d8',
    emoji: '📬',
    email: 'arphandrame0@gmail.com',
    phone: '07 67 31 84 26',
    links: [
      { icon: '⌨', label: 'GitHub', url: 'https://github.com/drams18', color: '#f0f0f0' },
      { icon: '💼', label: 'LinkedIn', url: 'https://www.linkedin.com/in/arphan-drame-b29259258/', color: '#0a66c2' },
      { icon: '🐦', label: 'Twitter / X', url: 'https://twitter.com/drams_18', color: '#1da1f2' },
      { icon: '📸', label: 'Instagram', url: 'https://www.instagram.com/dramsss18/', color: '#e1306c' },
    ],
    emailjs: {
      serviceId: 'service_portfolio',
      templateId: 'template_contact',
      publicKey: 'YOUR_PUBLIC_KEY',
    },
  },

  projets: {
    id: 'projets',
    label: 'GALERIE PROJETS',
    accent: '#ffd54f',
    emoji: '🎮',
    items: [
      {
        title: 'ISLAAH',
        type: 'Application Mobile',
        tech: ['React Native', 'Symfony', 'MySQL'],
        desc: 'Application mobile dédiée à la pratique islamique : prières, lecture du Coran, rappels quotidiens. Disponible sur l\'App Store.',
        links: [
          { label: '📱 App Store', url: 'https://apps.apple.com/us/app/islaah/id6758726142' },
          { label: '⌨ GitHub', url: 'https://github.com/drams18' },
        ],
        accent: '#81c784',
        emoji: '📱',
      },
      {
        title: 'SKYWALK',
        type: 'Plateforme Web SaaS',
        tech: ['React', 'NestJS', 'PostgreSQL', 'Docker'],
        desc: 'Plateforme de gestion SaaS. Interface React moderne, API NestJS robuste, déployée avec Docker et Nginx.',
        links: [
          { label: '⌨ GitHub', url: 'https://github.com/drams18' },
        ],
        accent: '#4fc3f7',
        emoji: '🌐',
      },
      {
        title: 'Jardin Connecté',
        type: 'Projet IoT — BTS',
        tech: ['Arduino', 'Python', 'Raspberry Pi'],
        desc: 'Système de gestion automatisée d\'un jardin : capteurs d\'humidité, température, arrosage automatique contrôlé à distance.',
        links: [],
        accent: '#a5d6a7',
        emoji: '🌱',
      },
    ],
  },
};
