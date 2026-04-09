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
    bio: {
      name: 'Arphan DRAME',
      title: 'Développeur Full Stack',
      location: 'Paris, Île-de-France',
      availability: 'Disponible immédiatement',
      description: 'Développeur Full Stack passionné, spécialisé en React, React Native et Symfony. Curieux, autonome, j\'aime construire des produits qui ont du sens — des apps mobiles aux plateformes web complexes.',
      photo: 'assets/img/profile.jpg',
      languages: [
        { label: 'Français', level: 'Natif' },
        { label: 'Anglais', level: 'B2' },
        { label: 'Espagnol', level: 'A2' },
        { label: 'Arabe', level: 'A2' },
      ],
      socials: [
        { label: 'GitHub', url: 'https://github.com/drams18' },
        { label: 'LinkedIn', url: 'https://www.linkedin.com/in/arphan-drame-b29259258/' },
      ],
    },
    skills: [
      { name: 'React Native', level: 92, color: '#61dafb' },
      { name: 'Symfony', level: 88, color: '#5656b1' },
      { name: 'MySQL', level: 85, color: '#f29111' },
      { name: 'Expo', level: 85, color: '#895e89' },
      { name: 'Node.js', level: 85, color: '#3c873a' },
      { name: 'React', level: 88, color: '#00d8ff' },
      { name: 'TypeScript', level: 85, color: '#3178c6' },
      { name: 'NestJS', level: 75, color: '#e0234e' },
      { name: 'Docker', level: 70, color: '#2496ed' },
      { name: 'PostgreSQL', level: 72, color: '#336791' },
      { name: 'Python', level: 40, color: '#ffd43b' },
    ],
  },

  parcours: {
    id: 'parcours',
    label: 'PARCOURS',
    accent: '#81c784',
    timeline: [
      {
        date: '2020 — 2022',
        title: 'BTS Systèmes Numériques',
        place: 'Lycée Jules Ferry — Versailles',
        desc: 'Option Électronique (SN option B). BTS obtenu + Certification Pix. Projet de fin d\'études : Jardin connecté (IoT).',
      },
      {
        date: '2022 — 2023',
        title: 'Formation Développeur Web Full Stack',
        place: 'Doranco — Paris',
        desc: 'Formation complète au développement web : Front-end (HTML5, CSS3, JS, React, Angular, responsive/UX), Back-end (Node.js, PHP, API REST/GraphQL), bases de données SQL/NoSQL, sécurité web (XSS, CSRF, auth), DevOps (Git, CI/CD, Docker) et méthodes Agile/Scrum.',
      },
      {
        date: '2023',
        title: 'Bootcamp Full Stack — Le Réacteur',
        place: 'Paris',
        desc: 'Formation intensive full stack web & mobile. Plongée dans React, Node.js, React Native et les bonnes pratiques du développement moderne.',
      },
      {
        date: '2023 — Présent',
        title: 'Master ASI',
        place: 'ETNA / YNOV — Paris',
        desc: 'Architecture des Systèmes d\'Information. Approfondissement des architectures logicielles, microservices, cloud et DevOps.',
      },
    ],
    experiences: [
      {
        date: '2023 — Présent',
        title: 'Développeur Full Stack Freelance',
        desc: 'Développement d\'applications web et mobiles. Projets : ISLAAH (app mobile), SKYWALK (plateforme SaaS).',
      },
    ],
  },

  passions: {
    id: 'passions',
    label: 'PASSIONS',
    accent: '#ff8a65',
    items: [
      { title: 'Sport', desc: 'Football, musculation — l\'esprit d\'équipe et la discipline comme moteurs.' },
      { title: 'Gaming', desc: 'Jeux vidéo depuis l\'enfance. Source d\'inspiration créative pour mes projets interactifs.' },
      { title: 'Tech & Veille', desc: 'Suivi des dernières tendances en dev mobile, IA et architecture logicielle.' },
      { title: 'Culture', desc: 'Ouverture sur le monde, diversité culturelle, apprentissage des langues.' },
      { title: 'Voyages', desc: 'Explorer de nouvelles villes, découvrir d\'autres façons de penser et de vivre.' },
    ],
  },

  contact: {
    id: 'contact',
    label: 'CONTACT',
    accent: '#ce93d8',
    email: 'arphandrame0@gmail.com',
    phone: '07 67 31 84 26',
    links: [
      { label: 'GitHub', url: 'https://github.com/drams18', color: '#f0f0f0' },
      { label: 'LinkedIn', url: 'https://www.linkedin.com/in/arphan-drame-b29259258/', color: '#0a66c2' },
      { label: 'Twitter / X', url: 'https://twitter.com/drams_18', color: '#1da1f2' },
      { label: 'Instagram', url: 'https://www.instagram.com/dramsss18/', color: '#e1306c' },
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
    items: [
      {
        title: 'ISLAAH',
        type: 'Application Mobile',
        tech: ['React Native', 'Symfony', 'MySQL', 'Cloudflare', 'Railway', 'Expo'],
        desc: 'Application mobile dédiée à la pratique islamique : prières, lecture du Coran, rappels quotidiens. Disponible sur l\'App Store.',
        links: [
          { label: 'Télécharger', url: 'https://apps.apple.com/us/app/islaah/id6758726142' },
          { label: 'GitHub', url: 'https://github.com/drams18' },
        ],
        accent: '#81c784',
      },
      {
        title: 'SKYWALK',
        type: 'Plateforme Web SaaS',
        tech: ['React', 'NestJS', 'PostgreSQL', 'Docker'],
        desc: 'Plateforme de gestion SaaS. Interface React moderne, API NestJS robuste, déployée avec Docker et Nginx.',
        links: [
          { label: 'GitHub', url: 'https://github.com/drams18' },
        ],
        accent: '#4fc3f7',
      },
      {
        title: 'Jardin Connecté',
        type: 'Projet IoT — BTS',
        tech: ['Arduino', 'Python', 'Raspberry Pi'],
        desc: 'Système de gestion automatisée d\'un jardin : capteurs d\'humidité, température, arrosage automatique contrôlé à distance.',
        links: [],
        accent: '#a5d6a7',
      },
    ],
  },
};
