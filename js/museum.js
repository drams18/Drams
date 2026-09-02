/* ══════════════════════════════════════════════════════
   MUSEUM.JS — Portfolio data (sections content)
   Arphan DRAME — Développeur Web Full Stack

   Données réelles. Ne pas exagérer les expériences :
     • SkyWalk = projet de groupe (équipe de 7).
     • Crowdin (clone) = projet scolaire ETNA en binôme.
     • Pool Party Experience = projet EN COURS.
     • Wild Kédougou / Prospectly / ISLAAH / OneDay = projets PERSONNELS.
     • Projets DevPhantom = travail d'équipe (~4 personnes).
   ══════════════════════════════════════════════════════ */

'use strict';

// Couleur dédiée à chaque catégorie de projet (galerie : carte + onglet).
const CATEGORY_ACCENT = {
  'Professionnel': '#19e8ff', // cyan
  'Personnel':     '#ff2bb0', // magenta
  'Scolaire':      '#8a3bff', // violet
};

const SECTIONS = {
  profile: {
    id: 'profile',
    label: 'PROFIL & SKILLS',
    accent: '#19e8ff',
    bio: {
      name: 'Arphan DRAME',
      title: 'Développeur Web Full Stack',
      location: 'Île-de-France',
      availability: 'Alternance chez DevPhantom',
      description: 'Développeur Web Full Stack. Je pars d\'un besoin métier, je le comprends, et je le transforme en solution concrète — du frontend au backend. Je m\'intègre vite à une base de code existante et j\'apprends les outils nécessaires au projet.',
      photo: 'assets/img/profile.jpg',
      languages: [
        { label: 'Français', level: 'Natif' },
        { label: 'Anglais', level: 'B2' },
        { label: 'Espagnol', level: 'A2' },
        { label: 'Arabe', level: 'A2' },
      ],
      socials: [
        { label: 'GitHub', url: 'https://github.com/drams18' },
        { label: 'LinkedIn', url: 'https://www.linkedin.com/in/arphan-drame/' },
      ],
    },

    // Message principal affiché en avant du bloc compétences.
    positioning: 'Je peux m\'adapter à un environnement technique existant, comprendre rapidement un projet et apprendre les outils nécessaires pour répondre au besoin.',

    qualities: [
      'Adaptabilité',
      'Apprentissage rapide',
      'Autonomie',
      'Résolution de problèmes',
      'Esprit d\'analyse',
      'Travail d\'équipe',
      'Comprendre un besoin métier',
      'Frontend & Backend',
    ],

    // Compétences organisées par catégorie (pas de barres de pourcentage).
    skillGroups: [
      { label: 'Frontend', items: ['React', 'React Native', 'Next.js', 'TypeScript', 'JavaScript', 'Vite', 'Tailwind CSS', 'Redux / Zustand'] },
      { label: 'Backend', items: ['Node.js', 'Express', 'NestJS', 'Symfony', 'Laravel', 'PHP', 'Python', 'REST API', 'GraphQL'] },
      { label: 'Bases de données', items: ['MySQL', 'PostgreSQL', 'Supabase', 'Prisma', 'TypeORM'] },
      { label: 'DevOps / Infrastructure', items: ['Docker', 'Git', 'GitHub', 'GitLab', 'CI/CD', 'Nginx', 'AWS', 'GCP', 'Cloudflare'] },
      { label: 'Tests', items: ['Jest', 'Cypress', 'Vitest', 'Playwright'] },
      { label: 'Outils / conception', items: ['Figma', 'Jira', 'Bruno', 'API REST'] },
      { label: 'IA / LLM', items: ['Intégration IA / LLM', 'Modèles locaux & API IA selon les projets'] },
    ],
  },

  parcours: {
    id: 'parcours',
    label: 'PARCOURS',
    accent: '#8a3bff',
    // Une entrée = un onglet du carrousel : BAC · BTS · ETNA · DEVPHANTOM · AUTRES
    steps: [
      {
        short: 'BAC',
        kind: 'ACADÉMIQUE',
        date: '2020',
        title: 'Baccalauréat STI2D',
        place: 'Sciences et Technologies de l\'Industrie et du Développement Durable',
        desc: 'Bac technologique à dominante sciences de l\'ingénieur : premières bases en électronique, programmation et démarche de projet.',
      },
      {
        short: 'BTS',
        kind: 'ACADÉMIQUE',
        date: '2021 — début 2022',
        title: 'BTS Systèmes Numériques — option B Électronique et Communication',
        context: 'Projet de fin d\'études réalisé en équipe : « Jardin connecté » — permettre à un jardinier de surveiller et contrôler à distance l\'humidité de son sol depuis une interface sur téléphone.',
        desc: 'Formation orientée systèmes embarqués, électronique et communication numérique.',
        role: 'Ma contribution : travail sur le capteur d\'humidité, Arduino Uno, programmation en C / C++. Le câblage, le prototype et certains composants ont été réalisés avec l\'équipe.',
      },
      {
        short: 'ETNA',
        kind: 'ACADÉMIQUE',
        date: '2023 — 2026',
        title: 'ETNA — Bachelor puis Master',
        details: [
          'Bachelor Concepteur Développeur d\'Applications Web (2023 → 2024)',
          'Master Architecte de Systèmes d\'Information (2024 → 2026)',
        ],
        desc: 'Une formation qui m\'a permis de travailler sur des projets techniques en équipe et de développer une approche orientée architecture, développement et résolution de problèmes.',
      },
      {
        short: 'DEVPHANTOM',
        kind: 'PROFESSIONNEL',
        date: '01/2024 — 10/2026',
        title: 'Développeur Web Full Stack — Alternance',
        place: 'DevPhantom · en parallèle de l\'ETNA · équipe d\'environ 4 personnes',
        context: 'Après les rendez-vous clients : compréhension du besoin, récupération des idées et fonctionnalités, définition de la solution, développement ou reprise de projets, création de fonctionnalités et de SaaS. Travail avec Jira, méthodologie Agile, adaptation aux contraintes techniques et métier.',
        desc: 'Une caractéristique importante de mon profil ici : m\'adapter rapidement à un nouveau projet et apprendre les technologies nécessaires au besoin.',
        role: 'Projets clients : Infinitia, Allsab-MS, Hexagon, GEXP. Projets internes (applications mobiles) : BADN, Ilamiria. Détail dans la Galerie.',
      },
      {
        short: 'AUTRES',
        kind: 'PROFESSIONNEL',
        date: 'Avant / pendant le parcours informatique',
        title: 'Autres expériences',
        desc: 'Un parcours varié, à l\'aise dans la relation avec le public, avant de me consacrer au développement. Ces expériences restent secondaires par rapport au développement informatique.',
        details: [
          'City One — RATP : accueil et accompagnement des voyageurs dans le métro, vente de titres de transport, assistance aux usagers.',
          'City One — missions d\'accueil : accueil du public, standard téléphonique, orientation des visiteurs, dans différents environnements professionnels (dont La Poste Mobile).',
          'Super U : expérience de vente pendant environ un mois.',
        ],
      },
    ],
  },

  contact: {
    id: 'contact',
    label: 'CONTACT',
    accent: '#ff2bb0',
    email: 'arphandrame0@gmail.com',
    phone: '07 67 31 84 26',
    links: [
      { label: 'GitHub', url: 'https://github.com/drams18', color: '#f0f0f0' },
      { label: 'LinkedIn', url: 'https://www.linkedin.com/in/arphan-drame/', color: '#0a66c2' },
      { label: 'Voir mon CV en PDF', url: 'assets/CV.pdf', color: '#1da1f2' },
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
    accent: '#ff123d',
    // Triés Professionnel → Personnel → Scolaire.
    // pick: true → projet mis en avant (« à ne pas rater ») : repère discret
    // sur l'onglet + mention sur la carte.
    items: [
      {
        short: 'INFINITIA',
        title: 'Infinitia',
        type: 'Plateforme Web',
        category: 'Professionnel',
        tech: ['Symfony', 'Node.js', 'NestJS', 'MySQL'],
        role: 'Projet DevPhantom, en équipe. J\'ai participé à la création à partir de zéro après un échange avec le client : conception de la base de données, développement du backend, préparation de l\'architecture du projet.',
        desc: 'Plateforme facilitant la gestion de flottes automobiles. Le client souhaitait une refonte de son site existant ; la partie frontend n\'a finalement pas été terminée, le client ayant cessé de répondre.',
        links: [],
        accent: '#19e8ff',
      },
      {
        short: 'ALLSAB-MS',
        title: 'Allsab-MS',
        type: 'Intranet',
        category: 'Professionnel',
        pick: true,
        tech: ['PHP', 'Symfony', 'MySQL'],
        role: 'Projet DevPhantom, en équipe — l\'un des premiers projets que j\'ai repris en arrivant. Travail principalement côté backend : authentification, gestion des rôles, espace administrateur, gestion des factures, des travailleurs et des déplacements / trajets.',
        desc: 'Intranet spécialisé dans la mise à disposition de techniciens pour des opérations de maintenance spécialisées.',
        links: [
          { label: 'Voir le site', url: 'https://allsab-ms.com/' },
        ],
        accent: '#8a3bff',
      },
      {
        short: 'HEXAGON',
        title: 'Hexagon',
        type: 'Plateforme Web',
        category: 'Professionnel',
        tech: ['PHP', 'Symfony', 'JavaScript', 'MySQL'],
        role: 'Projet DevPhantom, en équipe. Développement de plusieurs CRUD, de fonctionnalités liées à la communication interne, et participation à l\'évolution de la plateforme.',
        desc: 'Plateforme destinée à faciliter le travail opérationnel et la communication interne.',
        links: [],
        accent: '#ff2bb0',
      },
      {
        short: 'GEXP',
        title: 'GEXP',
        type: 'Plateforme Web',
        category: 'Professionnel',
        tech: ['PHP', 'Symfony', 'MySQL'],
        role: 'Projet DevPhantom, en équipe. Développement de CRUD, génération de rapports, exports PDF, Excel et CSV.',
        desc: 'Plateforme destinée à faciliter la génération de rapports et la communication interne.',
        links: [],
        accent: '#19e8ff',
      },
      {
        short: 'ILAMIRIA',
        title: 'Ilamiria',
        type: 'Application Mobile',
        category: 'Professionnel',
        tech: ['React Native'],
        role: 'Projet interne DevPhantom, réalisé en équipe.',
        desc: 'Application mobile développée chez DevPhantom et publiée sur l\'App Store.',
        links: [
          { label: 'App Store', url: 'https://apps.apple.com/fr/app/ilamiria/id6749936753' },
        ],
        accent: '#8a3bff',
      },
      {
        short: 'BADN',
        title: 'BADN',
        type: 'Application Mobile',
        category: 'Professionnel',
        pick: true,
        tech: ['React Native', 'Node.js'],
        role: 'Projet interne DevPhantom, en équipe. J\'étais principalement impliqué sur le développement backend.',
        desc: 'Application pour organiser des sorties entre amis : définition d\'un budget, choix d\'un lieu et d\'une date, répartition de ce que chacun apporte, et possibilité pour des personnes seules de rejoindre un groupe pour sortir avec d\'autres.',
        links: [],
        accent: '#ff123d',
      },
      {
        short: 'KÉDOUGOU',
        title: 'Wild Kédougou Experience',
        type: 'Plateforme de réservation',
        category: 'Personnel',
        pick: true,
        tech: ['React', 'TypeScript', 'Vite', 'Tailwind CSS', 'Framer Motion', 'Supabase', 'Google Calendar API', 'Brevo', 'Cloudflare Workers', 'PWA', 'SEO'],
        role: 'Projet personnel — conception et développement complets (frontend, backend serverless, intégrations).',
        desc: 'Site / plateforme de réservation pour une activité touristique au Sénégal : présentation de l\'activité, réservation, gestion des disponibilités, intégration calendrier, notifications e-mail, interface responsive et optimisation SEO / données structurées.',
        links: [
          { label: 'Voir le projet', url: 'https://wild-kedougou-experience.hitmind-pro.workers.dev/' },
        ],
        accent: '#19e8ff',
      },
      {
        short: 'POOL PARTY',
        title: 'Pool Party Experience',
        type: 'Site vitrine WordPress',
        category: 'Personnel',
        tech: ['WordPress', 'PHP', 'CSS'],
        role: 'Projet en cours, réalisé pour un ami — création et intégration d\'un site vitrine WordPress.',
        desc: 'Site vitrine WordPress. Projet en cours : ni livré ni terminé à ce jour.',
        links: [
          { label: 'Voir le site', url: 'https://poolparty-experience.fr/' },
        ],
        accent: '#ff2bb0',
      },
      {
        short: 'ISLAAH',
        title: 'ISLAAH',
        type: 'Application Mobile',
        category: 'Personnel',
        pick: true,
        tech: ['React Native', 'Symfony', 'MySQL', 'Cloudflare', 'Railway', 'Expo'],
        role: 'Projet personnel — conception et développement complet : app mobile, API et mise en production.',
        desc: 'Application mobile dédiée à la pratique islamique : prières, lecture du Coran, rappels quotidiens. Disponible sur l\'App Store.',
        links: [
          { label: 'Télécharger', url: 'https://apps.apple.com/us/app/islaah/id6758726142' },
        ],
        accent: '#8a3bff',
      },
      {
        short: 'PROSPECTLY',
        title: 'Plateforme de recherche de prospects',
        type: 'Projet personnel',
        category: 'Personnel',
        tech: ['Node.js', 'Railway', 'HTML', 'CSS', 'JavaScript', 'NoSQL'],
        role: 'Projet personnel — idée, conception et développement réalisés seul.',
        desc: 'Plateforme permettant de rechercher une enseigne qui a besoin d\'un site web ou d\'une mise à jour.',
        links: [
          { label: 'Accéder', url: 'https://prospectly.hitmind-pro.workers.dev/' },
        ],
        accent: '#ff123d',
      },
      {
        short: 'ONEDAY',
        title: 'OneDay',
        type: 'PWA de planification',
        category: 'Personnel',
        tech: ['React', 'TypeScript', 'Vite', 'Tailwind CSS', 'React Router', 'Supabase', 'PostgreSQL', 'PWA', 'Web Push', 'Cloudflare Pages', 'Cloudflare Workers'],
        role: 'Projet personnel — conception et développement complets (frontend, backend serverless, notifications push). PWA que j\'ai construite pour organiser mes journées, mieux travailler et m\'installer des habitudes.',
        desc: 'Planificateur quotidien minimaliste, à usage strictement personnel (compte unique, pas d\'inscription), pensé pour organiser mes journées et ancrer des habitudes de travail. Chaque soir on prépare la journée du lendemain ; chaque matin on ne voit que les tâches restantes du jour. Tâches horodatées avec description et suivi d\'avancement, modèles de journée réutilisables (« programmes ») applicables à n\'importe quelle date, reprise de la veille en un clic. Application installable sur iPhone (PWA), utilisable hors ligne, avec des rappels par notification push déclenchés chaque minute par un cron Cloudflare Worker (Web Push / VAPID). Données isolées par utilisateur via les policies RLS de Supabase.',
        links: [
          { label: 'Voir le projet', url: 'https://oneday-5s9.pages.dev/' },
        ],
        accent: '#19e8ff',
      },
      {
        short: 'SKYWALK',
        title: 'SkyWalk',
        type: 'Plateforme Web',
        category: 'Scolaire',
        pick: true,
        tech: ['React', 'TypeScript', 'Vite', 'Tailwind', 'React Query', 'NestJS', 'PostgreSQL', 'TypeORM', 'JWT', 'Docker', 'Nginx', 'GitLab CI'],
        role: 'Projet réalisé en équipe de 7 (ETNA — Grand Projet d\'Étude). J\'ai principalement contribué au backend et à la base de données : modération du forum (mots interdits, système d\'avertissement utilisateur), migrations PostgreSQL, recherche full-text PostgreSQL, enrichissement des données pays, participation à l\'architecture technique et à la documentation / au diagramme d\'architecture.',
        desc: 'Plateforme web destinée à accompagner les personnes dans leurs projets d\'expatriation : checklist personnalisée, sources gouvernementales officielles, comparaison du coût de la vie et des villes, forum modéré, réseau d\'experts, messagerie privée, coffre-fort documentaire, dashboard personnalisable et administration.',
        links: [
          { label: 'Accéder', url: 'https://skywalk-chi.vercel.app/' },
        ],
        accent: '#ff2bb0',
      },
      {
        short: 'CROWDIN',
        title: 'Crowdin (clone)',
        type: 'Plateforme de localisation',
        category: 'Scolaire',
        tech: ['Symfony 7', 'PHP 8', 'Doctrine ORM', 'PostgreSQL', 'Twig', 'Docker', 'Bootstrap'],
        role: 'Projet scolaire ETNA réalisé en binôme (déc. 2024 – janv. 2025) ; j\'ai porté la majeure partie du développement : modélisation Doctrine et migrations, CRUD projets / langues / sources / traductions, import et export CSV, verrouillage des chaînes sources, inscription avec vérification d\'e-mail, contrôle d\'accès par voter.',
        desc: 'Reproduction de Crowdin : plateforme collaborative de gestion de traductions (localisation). Un propriétaire crée un projet avec une langue source et plusieurs langues cibles, y ajoute des chaînes à traduire à la main ou par import CSV en masse, puis les traducteurs produisent et suivent les traductions par langue. Comptes avec vérification d\'e-mail, profils (langues parlées, statut traducteur), verrouillage des chaînes sources (seul le propriétaire modifie une source verrouillée), statuts de traduction, export CSV, pagination et contrôle d\'accès par rôles.',
        links: [],
        accent: '#8a3bff',
      },
    ],
  },
};
