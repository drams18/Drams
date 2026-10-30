/* ══════════════════════════════════════════════════════
   MUSEUM.JS : Portfolio data (sections content)
   Arphan DRAME : Développeur Web Full Stack

   Source UNIQUE du contenu, lue par les deux modes :
     • mode aventure  → fenêtres des lieux (src/aventure/portfolio/data.js)
     • mode classique → HTML généré par scripts/build-classic.mjs
       (npm run build après toute modification de ce fichier)
   `slug` = identifiant stable utilisé dans les liens (#projets/skywalk).

   Données réelles. Ne pas exagérer les expériences :
     • SkyWalk = projet PERSONNEL : démarré à plusieurs à l'ETNA, repris et
       poursuivi seul (l'essentiel du travail). Ne pas écrire « équipe de 7 ».
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
      title: 'Développeur web freelance',
      location: 'Île-de-France',
      availability: 'Disponible pour vos projets',
      // Badge du mode aventure : ce que je propose (plus de recherche d'emploi).
      seeking: 'Disponible pour vos projets · devis gratuit',
      description: 'Développeur web freelance en Île-de-France. Je pars de votre besoin, je le comprends, et je le transforme en site ou en outil concret, de la page d\'accueil jusqu\'au serveur. Je vous explique chaque étape simplement.',
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
        { label: 'Instagram', url: 'https://www.instagram.com/nahpra.dev/' },
      ],
    },

    // Message principal affiché en avant du bloc compétences.
    positioning: 'Je crée des sites et des outils qui aident les commerces, artisans et indépendants à trouver des clients et à gagner du temps.',

    // Expérience en une phrase (mode aventure). Symfony / PHP / MySQL = projets
    // DevPhantom (en équipe) ; React / TypeScript = projets personnels.
    aboutStack: 'Près de 3 ans en entreprise chez DevPhantom, en alternance : plateformes web et applications mobiles, en équipe. En projet personnel, j\'ai publié une application sur l\'App Store.',

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
      { label: 'Outils / conception', items: ['Figma', 'Jira', 'Bruno', 'API REST'] },
      { label: 'IA / LLM', items: ['Intégration IA / LLM', 'Modèles locaux & API IA selon les projets'] },
    ],
  },

  parcours: {
    id: 'parcours',
    label: 'PARCOURS',
    accent: '#8a3bff',
    // Une entrée = un onglet du carrousel : BAC · BTS · DORANCO · ETNA · DEVPHANTOM · AUTRES
    steps: [
      {
        short: 'BAC',
        slug: 'bac',
        kind: 'ACADÉMIQUE',
        date: '2020',
        title: 'Baccalauréat STI2D',
        place: 'Sciences et Technologies de l\'Industrie et du Développement Durable',
        desc: 'Bac technologique à dominante sciences de l\'ingénieur : premières bases en électronique, programmation et démarche de projet.',
      },
      {
        short: 'BTS',
        slug: 'bts',
        kind: 'ACADÉMIQUE',
        date: '2021 - début 2022',
        title: 'BTS Systèmes Numériques, option B Électronique et Communication',
        context: 'Projet de fin d\'études réalisé en équipe : « Jardin connecté », pour permettre à un jardinier de surveiller et contrôler à distance l\'humidité de son sol depuis une interface sur téléphone.',
        desc: 'Formation orientée systèmes embarqués, électronique et communication numérique.',
        role: 'Ma contribution : travail sur le capteur d\'humidité, carte Teensy 3.6 et Arduino Uno, programmation en C / C++ (carte) et C# (interface). Le câblage, le prototype et certains composants ont été réalisés avec l\'équipe.',
        photos: [
          { file: 'jardin-connecte-montage', alt: 'Banc de test du capteur capacitif d\'humidité du sol, avec le logiciel Arduino' },
          { file: 'jardin-connecte-materiel', alt: 'Matériel nécessaire à ma partie du projet' },
        ],
      },
      {
        short: 'DORANCO',
        slug: 'doranco',
        kind: 'ACADÉMIQUE',
        date: '01/2023 - 06/2023',
        title: 'Formation Développeur Web Full Stack',
        place: 'Doranco',
        logo: 'doranco-logo',
        desc: 'Six mois de formation au développement web full stack, avant l\'entrée à l\'ETNA.',
      },
      {
        short: 'ETNA',
        slug: 'etna',
        kind: 'ACADÉMIQUE',
        date: '10/2023 - 10/2026',
        title: 'ETNA, Bachelor puis Master',
        logo: 'etna-logo',
        details: [
          'Bachelor Concepteur Développeur d\'Applications Web (2023 → 2024)',
          'Master Architecte de Systèmes d\'Information (2024 → 2026)',
        ],
        desc: 'Une formation qui m\'a permis de travailler sur des projets techniques en équipe et de développer une approche orientée architecture, développement et résolution de problèmes.',
      },
      {
        short: 'DEVPHANTOM',
        slug: 'devphantom',
        kind: 'PROFESSIONNEL',
        date: '01/2024 - 10/2026',
        title: 'Développeur Web Full Stack en alternance',
        logo: 'devphantom-logo-recadre',
        place: 'DevPhantom · en parallèle de l\'ETNA · équipe d\'environ 4 personnes',
        context: 'Après les rendez-vous clients : compréhension du besoin, récupération des idées et fonctionnalités, définition de la solution, développement ou reprise de projets, création de fonctionnalités et de SaaS. Travail avec Jira, méthodologie Agile, adaptation aux contraintes techniques et métier.',
        desc: 'Une caractéristique importante de mon profil ici : m\'adapter rapidement à un nouveau projet et apprendre les technologies nécessaires au besoin.',
        role: 'Projets clients : Infinitia, Allsab-MS, Hexagon, GEXP. Projets internes (applications mobiles) : BADN, Ilamiria. Détail dans la Galerie.',
      },
      {
        short: 'AUTRES',
        slug: 'autres',
        kind: 'PROFESSIONNEL',
        date: 'Avant / pendant le parcours informatique',
        title: 'Autres expériences',
        desc: 'Un parcours varié, à l\'aise dans la relation avec le public, avant de me consacrer au développement. Ces expériences restent secondaires par rapport au développement informatique.',
        details: [
          'City One, RATP : accueil et accompagnement des voyageurs dans le métro, vente de titres de transport, assistance aux usagers.',
          'City One, missions d\'accueil : accueil du public, standard téléphonique, orientation des visiteurs, dans différents environnements professionnels (dont La Poste Mobile).',
          'Super U : expérience de vente pendant environ un mois.',
        ],
      },
    ],
    // Images (mode classique, converties par npm run images depuis assets/img/_raw/) :
    //   logo   → logo de l'école / l'entreprise, en tête du panneau
    //   photos → illustrations de l'étape (`file` sans extension, `alt` = légende)
    // Jalons ponctuels (mode classique : petits points sur la frise).
    // `step` = l'étape pendant laquelle le jalon a eu lieu. Les projets datés
    // (`date` dans SECTIONS.projets.items) s'y ajoutent automatiquement.
    milestones: [
      { slug: 'bts-diplome', kind: 'DIPLÔME', date: '2022', title: 'BTS Systèmes Numériques obtenu', step: 'bts' },
      { slug: 'pix', kind: 'CERTIFICATION', date: '2022', title: 'Certification Pix', desc: 'Certification des compétences numériques.', logo: 'pix-logo' },
      { slug: 'piscine-etna', kind: 'ÉTAPE', date: '10/2023', title: 'Piscine ETNA', desc: 'Période intensive d\'admission, point de départ du cursus ETNA.', step: 'etna' },
      { slug: 'bachelor', kind: 'DIPLÔME', date: '2024', title: 'Bachelor Concepteur Développeur d\'Applications Web', step: 'etna' },
      { slug: 'master', kind: 'DIPLÔME', date: '10/2026', title: 'Master Architecte de Systèmes d\'Information', step: 'etna' },
    ],
  },

  contact: {
    id: 'contact',
    label: 'CONTACT',
    accent: '#ff2bb0',
    email: 'arphandrame0@gmail.com',
    phone: '07 67 31 84 26',
    // Même numéro pour WhatsApp (wa.me attend le numéro international, sans +).
    whatsapp: '33767318426',
    whatsappText: 'Bonjour Arphan, je vous contacte depuis votre site au sujet d\'un projet.',
    instagram: 'https://www.instagram.com/nahpra.dev/',
    tiktok: 'https://www.tiktok.com/@nahpra.dev',
    links: [
      { label: 'GitHub', url: 'https://github.com/drams18', color: '#f0f0f0' },
      { label: 'LinkedIn', url: 'https://www.linkedin.com/in/arphan-drame/', color: '#0a66c2' },
      { label: 'Instagram', url: 'https://www.instagram.com/nahpra.dev/', color: '#e1306c' },
      { label: 'Voir mon CV en PDF', url: 'assets/CV.pdf', color: '#1da1f2' },
    ],
  },

  // Activité freelance : identité légale (mentions légales, données
  // structurées). Source : avis de situation SIRENE du 27/10/2026.
  business: {
    legalName: 'Arphan Drame',
    status: 'Entrepreneur individuel (micro-entreprise)',
    siren: '109 307 629',
    siret: '109 307 629 00013',
    ape: '62.01Z, Programmation informatique',
    since: '01/09/2026',
    address: ['4 rue Firmin Gémier, Hall 9', '75018 Paris'],
    street: '4 rue Firmin Gémier, Hall 9',
    postalCode: '75018',
    city: 'Paris',
    vat: 'TVA non applicable, article 293 B du CGI',
    area: 'Île-de-France',
    priceRange: '€€',
  },

  projets: {
    id: 'projets',
    label: 'GALERIE PROJETS',
    accent: '#ff123d',
    // Triés Professionnel → Personnel → Scolaire.
    // pick: true → projet mis en avant (« à ne pas rater ») : repère discret
    // sur l'onglet + mention sur la carte.
    // Champs optionnels lus par le mode classique seulement :
    //   status → disponibilité affichée telle quelle (sinon : « En ligne »
    //            s'il y a un lien, « Indisponible » sinon)
    //   shots  → captures : `file` = nom dans assets/img/_raw/ (sans extension),
    //            `alt` = légende. La première sert de couverture (bulle,
    //            info-bulle, liste). npm run images les convertit en webp.
    //   device → 'mobile' : captures de téléphone (cadre portrait)
    // Site (pages Réalisations) : projets à la une, dans cet ordre (avec
    // captures et lien en ligne), puis les autres. Un slug absent d'ici
    // passe en fin de liste.
    featured: ['wild-kedougou', 'islaah', 'oneday', 'allsab-ms'],
    // Page Réalisations du site : un carrousel par groupe (3 au plus), dans
    // cet ordre. Seuls ces projets ont une page sur le site ; les autres
    // restent dans le mode aventure (leurs anciennes adresses /realisations/…
    // sont redirigées dans _redirects).
    groups: [
      { id: 'sites', title: 'Sites et applications web', lead: 'Réservation, comptes, outils métier : des sites et des applications web complets, en ligne.',
        slugs: ['immoconnect', 'wild-kedougou', 'orlena', 'skywalk'] },
      { id: 'apps', title: 'Applications mobiles', lead: 'Des applications qu’on installe sur son téléphone, dont deux publiées sur l’App Store.',
        slugs: ['islaah', 'oneday', 'ilamiria'] },
      { id: 'outils', title: 'Outils pour les entreprises', lead: 'Plannings, factures, rapports : des outils de gestion réalisés en équipe pour des entreprises.',
        slugs: ['allsab-ms', 'gexp'] },
    ],
    order: [
      'immoconnect', 'wild-kedougou', 'orlena', 'islaah', 'oneday', 'allsab-ms', 'ilamiria', 'badn', 'pool-party',
      'skywalk', 'gexp', 'hexagon', 'prospectly', 'infinitia', 'crowdin',
    ],
    // Types de projet (plus lus par le site depuis les carrousels par groupe).
    kinds: {
      vitrine:     'Site vitrine',
      reservation: 'Réservation',
      mobile:      'Application mobile',
      interne:     'Outil interne',
      plateforme:  'Plateforme web',
    },
    // Chaque projet raconté pour un client, sans jargon : le besoin, ce que
    // j'ai fait, ce que ça permet. Mêmes faits que `role` / `desc` plus bas,
    // rien d'ajouté (cadre réel : personnel, en équipe, scolaire).
    cases: {
      immoconnect: {
        kind: 'interne', label: 'Outil de gestion', frame: 'Pour un client',
        need: 'Un conseiller immobilier voulait suivre ses biens, ses vendeurs, ses acquéreurs et ses visites au même endroit, depuis son téléphone.',
        did: 'Conçu et développé seul : l\'application, les e-mails automatiques, la carte des biens et des prospects, le bon de visite à signer sur l\'écran, et la mise en ligne.',
        result: 'Le conseiller planifie une visite en quelques gestes : l\'acquéreur reçoit la confirmation, un rappel avant le rendez-vous puis une demande d\'avis. Le vendeur consulte les comptes rendus dans son espace.',
      },
      orlena: {
        kind: 'plateforme', label: 'Plateforme web', frame: 'Projet personnel, bénévole',
        need: 'Permettre aux lycéens de réviser le bac en petits groupes avec des personnes qui maîtrisent les matières, en bibliothèque ou à distance.',
        did: 'Réalisé seul et bénévolement : le site, le serveur, les comptes lycéens et organisateurs, les notifications et la mise en ligne.',
        result: 'Le lycéen trouve une séance dans ses matières et s\'inscrit en un clic. L\'organisateur crée ses séances, partage ses documents et voit qui participe. Les écrans se mettent à jour en direct.',
      },
      'wild-kedougou': {
        kind: 'reservation', label: 'Site de réservation', frame: 'Projet personnel',
        need: 'Présenter une activité touristique au Sénégal et permettre de réserver en ligne, sans échanges de messages.',
        did: 'Conçu et développé seul : le site, la réservation, le calendrier des disponibilités, les e-mails de confirmation et le référencement Google.',
        result: 'Le visiteur découvre les formules, choisit une date libre et réserve depuis son téléphone. Les disponibilités se mettent à jour dans le calendrier et une confirmation part par e-mail.',
      },
      islaah: {
        kind: 'mobile', label: 'Application iPhone', frame: 'Projet personnel',
        need: 'S\'entraîner à reconnaître les versets du Coran, de façon ludique, sur son téléphone.',
        did: 'Réalisé seul : l\'application iPhone, le serveur qui l\'alimente et la publication sur l\'App Store.',
        result: 'On écoute des récitations, on joue à plusieurs modes de quiz et on suit sa progression. L\'application se télécharge sur l\'App Store.',
      },
      oneday: {
        kind: 'mobile', label: 'Application installable', frame: 'Projet personnel',
        need: 'Organiser ses journées et tenir ses habitudes, avec des rappels sur iPhone.',
        did: 'Réalisé seul : une application qui s\'installe depuis le navigateur, fonctionne sans connexion et envoie des rappels.',
        result: 'La veille, on prépare sa journée. Le matin, on ne voit que ce qui reste à faire, avec un rappel à l\'heure de chaque tâche.',
      },
      'allsab-ms': {
        kind: 'interne', label: 'Outil interne', frame: 'En équipe chez DevPhantom',
        need: 'Une entreprise qui met des techniciens à disposition pour des opérations de maintenance devait gérer ses équipes au même endroit.',
        did: 'Surtout la partie serveur : connexion et droits d\'accès, espace administrateur, factures, techniciens, déplacements.',
        result: 'Pointages, congés, remboursements et planning se gèrent dans un seul outil en ligne.',
      },
      ilamiria: {
        kind: 'mobile', label: 'Application iPhone', frame: 'En équipe chez DevPhantom',
        need: 'Une application mobile créée chez DevPhantom.',
        did: 'Participation au développement, en équipe.',
        result: 'Elle est publiée sur l\'App Store. Ses écrans présentent des alertes sur les sujets tendance et des idées de contenu proposées par l\'IA.',
      },
      badn: {
        kind: 'mobile', label: 'Application mobile', frame: 'En équipe chez DevPhantom',
        need: 'Organiser une sortie entre amis sans se perdre dans les messages : budget, lieu, date, qui apporte quoi.',
        did: 'Surtout la partie serveur de l\'application.',
        result: 'Le groupe vote pour la date, suit ses sorties à venir, et une personne seule peut rejoindre un groupe.',
      },
      'pool-party': {
        kind: 'vitrine', label: 'Site vitrine', frame: 'Pour un ami',
        need: 'Un site vitrine pour présenter une activité.',
        did: 'Création du site sur WordPress.',
        result: 'Projet en cours : il n\'est pas encore terminé.',
      },
      skywalk: {
        kind: 'plateforme', label: 'Plateforme web', frame: 'Projet personnel',
        need: 'Préparer une expatriation oblige à croiser des informations dispersées : visa, démarches, budget, emploi.',
        did: 'Démarré à plusieurs à l\'ETNA, repris et poursuivi seul : j\'en ai réalisé l\'essentiel.',
        result: 'Une liste de démarches personnalisée avec rappels, une carte des destinations, le coût de la vie comparé, des offres d\'emploi et une communauté pour échanger. En français et en anglais.',
      },
      gexp: {
        kind: 'interne', label: 'Outil interne', frame: 'En équipe chez DevPhantom',
        need: 'Une entreprise voulait produire ses rapports plus facilement.',
        did: 'Écrans de gestion, génération de rapports, exports PDF, Excel et CSV.',
        result: 'Chiffre d\'affaires, commandes et facturation se consultent et s\'exportent depuis l\'outil.',
      },
      hexagon: {
        kind: 'interne', label: 'Outil interne', frame: 'En équipe chez DevPhantom',
        need: 'Faciliter le travail au quotidien et la communication interne d\'une équipe.',
        did: 'Plusieurs écrans de gestion et des fonctions de communication interne.',
        result: 'Un espace privé où l\'équipe retrouve ses informations et communique.',
      },
      prospectly: {
        kind: 'interne', label: 'Outil de recherche', frame: 'Projet personnel',
        need: 'Repérer les commerces qui n\'ont pas de site, ou un site à refaire.',
        did: 'Réalisé seul : idée, conception et développement.',
        result: 'Une recherche affiche la fiche d\'un commerce et indique s\'il a besoin d\'un site.',
      },
      infinitia: {
        kind: 'interne', label: 'Outil de gestion', frame: 'En équipe chez DevPhantom',
        need: 'Une entreprise de gestion de flottes automobiles voulait refaire son site.',
        did: 'Organisation des données, partie serveur et structure du projet, à partir d\'un échange avec le client.',
        result: 'Projet arrêté : le client a cessé de répondre avant la fin de la partie visible.',
      },
      crowdin: {
        kind: 'plateforme', label: 'Projet d\'école', frame: 'En binôme à l\'ETNA',
        need: 'Exercice d\'école : reproduire Crowdin, un outil pour traduire un site ou une application à plusieurs.',
        did: 'J\'ai réalisé la majeure partie du développement.',
        result: 'Un propriétaire crée un projet, ajoute les textes à traduire, et des traducteurs les traduisent langue par langue.',
      },
    },
    items: [
      {
        short: 'IMMOCONNECT',
        slug: 'immoconnect',
        date: '10/2026',
        title: 'ImmoConnect',
        type: 'Application web',
        category: 'Professionnel',
        pick: true,
        tech: ['React', 'TypeScript', 'Vite', 'Tailwind CSS', 'React Router', 'Leaflet', 'Hono', 'Cloudflare Workers', 'Cloudflare D1', 'Cloudflare R2', 'Brevo', 'PWA'],
        role: 'Projet freelance réalisé seul pour un client, conseiller immobilier : conception, interface, API, base de données, e-mails automatiques et mise en ligne.',
        desc: 'Application web de suivi des visites immobilières, installable sur le téléphone. Le conseiller gère ses biens, vendeurs, acquéreurs, visites, comptes rendus et tâches ; chaque conseiller ne voit que ses propres données. Les acquéreurs, sans compte, reçoivent confirmation, rappel et demande d\'avis par e-mail et répondent par un lien personnel ; les vendeurs consultent les comptes rendus publiés pour eux. Carte des biens et des prospects vendeurs avec le DPE trouvé automatiquement dans la base de l\'ADEME, saisie d\'adresse assistée (Base Adresse Nationale), bon de visite prérempli à signer au doigt ou à imprimer, historique de chaque fiche, rappels envoyés par une tâche planifiée toutes les 5 minutes.',
        links: [
          { label: 'Voir l\'application', url: 'https://immoconnect.fr/' },
        ],
        device: 'mobile',
        shots: [
          { file: 'immoconnect-accueil', alt: 'Accueil du conseiller : visites à venir et chiffres du jour' },
          { file: 'immoconnect-carte', alt: 'Carte des biens en vente et des prospects, avec la classe DPE' },
          { file: 'immoconnect-visite', alt: 'Fiche d\'une visite : rappel et demande d\'avis programmés' },
          { file: 'immoconnect-prospects', alt: 'Prospects vendeurs à suivre jusqu\'au mandat' },
        ],
        accent: '#19e8ff',
      },
      {
        short: 'INFINITIA',
        slug: 'infinitia',
        title: 'Infinitia',
        type: 'Plateforme Web',
        category: 'Professionnel',
        tech: ['Symfony', 'Node.js', 'NestJS', 'MySQL'],
        role: 'Projet DevPhantom, en équipe. J\'ai participé à la création à partir de zéro après un échange avec le client : conception de la base de données, développement du backend, préparation de l\'architecture du projet.',
        desc: 'Plateforme facilitant la gestion de flottes automobiles. Le client souhaitait une refonte de son site existant ; la partie frontend n\'a finalement pas été terminée, le client ayant cessé de répondre.',
        links: [],
        shots: [
          { file: 'infinitia-database-schema', alt: 'Schéma de la base de données conçu pour la plateforme' },
        ],
        accent: '#19e8ff',
      },
      {
        short: 'ALLSAB-MS',
        slug: 'allsab-ms',
        title: 'Allsab-MS',
        type: 'Intranet',
        category: 'Professionnel',
        pick: true,
        tech: ['PHP', 'Symfony', 'MySQL'],
        role: 'Projet DevPhantom, en équipe : l\'un des premiers projets que j\'ai repris en arrivant. Travail principalement côté backend : authentification, gestion des rôles, espace administrateur, gestion des factures, des travailleurs et des déplacements / trajets.',
        desc: 'Intranet spécialisé dans la mise à disposition de techniciens pour des opérations de maintenance spécialisées.',
        links: [
          { label: 'Voir le site', url: 'https://allsab-ms.com/' },
        ],
        shots: [
          { file: 'allsab-ms-admin', alt: 'Tableau de bord de l\'intranet : pointages, congés, remboursements, planning' },
        ],
        accent: '#8a3bff',
      },
      {
        short: 'HEXAGON',
        slug: 'hexagon',
        title: 'Hexagon',
        type: 'Plateforme Web',
        category: 'Professionnel',
        tech: ['PHP', 'Symfony', 'JavaScript', 'MySQL'],
        role: 'Projet DevPhantom, en équipe. Développement de plusieurs CRUD, de fonctionnalités liées à la communication interne, et participation à l\'évolution de la plateforme.',
        desc: 'Plateforme destinée à faciliter le travail opérationnel et la communication interne.',
        links: [],
        shots: [
          { file: 'hexagon-login', alt: 'Page de connexion de l\'intranet' },
          { file: 'hexagon-home', alt: 'Tableau de bord administrateur' },
        ],
        accent: '#ff2bb0',
      },
      {
        short: 'GEXP',
        slug: 'gexp',
        title: 'GEXP',
        type: 'Plateforme Web',
        category: 'Professionnel',
        tech: ['PHP', 'Symfony', 'MySQL'],
        role: 'Projet DevPhantom, en équipe. Développement de CRUD, génération de rapports, exports PDF, Excel et CSV.',
        desc: 'Plateforme destinée à faciliter la génération de rapports et la communication interne.',
        links: [],
        shots: [
          { file: 'gexp-dashboard', alt: 'Tableau de bord : chiffre d\'affaires, commandes et facturation' },
        ],
        accent: '#19e8ff',
      },
      {
        short: 'ILAMIRIA',
        slug: 'ilamiria',
        title: 'Ilamiria',
        type: 'Application Mobile',
        category: 'Professionnel',
        tech: ['React Native'],
        role: 'Projet interne DevPhantom, réalisé en équipe.',
        desc: 'Application mobile développée chez DevPhantom et publiée sur l\'App Store.',
        links: [
          { label: 'App Store', url: 'https://apps.apple.com/fr/app/ilamiria/id6749936753' },
        ],
        device: 'mobile',
        shots: [
          { file: 'ilamiria-onboarding-2', alt: 'Notification d\'un sujet tendance' },
          { file: 'ilamiria-onboarding-4', alt: 'Idées de contenu personnalisées par l\'IA' },
          { file: 'ilamiria-onboarding-1', alt: 'Présentation des alertes tendances' },
          { file: 'ilamiria-onboarding-3', alt: 'Présentation des idées générées par IA' },
        ],
        accent: '#8a3bff',
      },
      {
        short: 'BADN',
        slug: 'badn',
        title: 'BADN',
        type: 'Application Mobile',
        category: 'Professionnel',
        pick: true,
        tech: ['React Native', 'Node.js'],
        role: 'Projet interne DevPhantom, en équipe. J\'étais principalement impliqué sur le développement backend.',
        desc: 'Application pour organiser des sorties entre amis : définition d\'un budget, choix d\'un lieu et d\'une date, répartition de ce que chacun apporte, et possibilité pour des personnes seules de rejoindre un groupe pour sortir avec d\'autres.',
        links: [],
        device: 'mobile',
        shots: [
          { file: 'badn-onboarding-1', alt: 'Suggestions de sorties' },
          { file: 'badn-onboarding-2', alt: 'Choix de la date par vote du groupe' },
          { file: 'badn-onboarding-3', alt: 'Sorties à venir' },
          { file: 'badn-contacts', alt: 'Contacts, groupes et amis' },
          { file: 'badn-profil', alt: 'Profil et paramètres' },
        ],
        accent: '#ff123d',
      },
      {
        short: 'ORLENA',
        slug: 'orlena',
        date: '10/2026',
        title: 'Orlena',
        type: 'Plateforme web',
        category: 'Personnel',
        pick: true,
        tech: ['React', 'TypeScript', 'Vite', 'Mantine', 'Hono', 'Cloudflare Workers', 'Cloudflare D1', 'Cloudflare R2', 'Durable Objects', 'WebSocket', 'Web Push', 'PWA', 'Vitest'],
        role: 'Projet personnel et bénévole, réalisé seul : conception, interface React, API sur Cloudflare Workers, base de données, tests et mise en ligne. L\'API, d\'abord écrite en Java / Spring Boot avec PostgreSQL, a été réécrite pour tourner entièrement chez Cloudflare, avec les mêmes adresses et les mêmes règles.',
        desc: 'Plateforme pour organiser et rejoindre des séances de révision du bac, en bibliothèque, à distance ou en mode hybride, pour que les lycéens profitent des connaissances de personnes qui maîtrisent les matières. Les lycéens (15 ans et plus) s\'inscrivent en un formulaire, filtrent le catalogue et réservent leur place en un clic, ou proposent une séance quand rien n\'est prévu. Les organisateurs, sur invitation, créent leurs séances, partagent des documents PDF et suivent les participants. Fiches de 526 lieux publics issus d\'OpenStreetMap, rappel la veille par notification, écrans mis à jour en direct, application installable et consultable hors ligne, export et suppression des données, administration des comptes, des lieux et des signalements.',
        links: [
          { label: 'Voir le projet', url: 'https://orlena.hitmind-pro.workers.dev/' },
        ],
        device: 'mobile',
        shots: [
          { file: 'orlena-seances', alt: 'Catalogue des séances de révision' },
          { file: 'orlena-seance', alt: 'Fiche d\'une séance : lieu, horaire, places libres' },
          { file: 'orlena-lieu', alt: 'Fiche d\'un lieu : affluence en temps réel, horaires, wifi' },
          { file: 'orlena-mes-seances', alt: 'Mes séances : les inscriptions du lycéen' },
        ],
        accent: '#ff2bb0',
      },
      {
        short: 'KÉDOUGOU',
        slug: 'wild-kedougou',
        date: '05/2026',
        title: 'Wild Kédougou Experience',
        type: 'Plateforme de réservation',
        category: 'Personnel',
        pick: true,
        tech: ['React', 'TypeScript', 'Vite', 'Tailwind CSS', 'Framer Motion', 'Supabase', 'Google Calendar API', 'Brevo', 'Cloudflare Workers', 'PWA', 'SEO'],
        role: 'Projet personnel : conception et développement complets (frontend, backend serverless, intégrations).',
        desc: 'Site / plateforme de réservation pour une activité touristique au Sénégal : présentation de l\'activité, réservation, gestion des disponibilités, intégration calendrier, notifications e-mail, interface responsive et optimisation SEO / données structurées.',
        links: [
          { label: 'Voir le projet', url: 'https://wild-kedougou-experience.hitmind-pro.workers.dev/' },
        ],
        shots: [
          { file: 'wild-kedougou-home', alt: 'Page d\'accueil' },
          { file: 'wild-kedougou-reserver', alt: 'Formulaire de réservation' },
        ],
        accent: '#19e8ff',
      },
      {
        short: 'POOL PARTY',
        slug: 'pool-party',
        date: '08/2026',
        title: 'Pool Party Experience',
        type: 'Site vitrine WordPress',
        category: 'Personnel',
        tech: ['WordPress', 'PHP', 'CSS'],
        role: 'Projet en cours, réalisé pour un ami : création et intégration d\'un site vitrine WordPress.',
        desc: 'Site vitrine WordPress. Projet en cours : ni livré ni terminé à ce jour.',
        status: 'En cours',
        links: [
          { label: 'Voir le site', url: 'https://poolparty-experience.fr/' },
        ],
        accent: '#ff2bb0',
      },
      {
        short: 'ISLAAH',
        slug: 'islaah',
        date: '06/2025',
        title: 'ISLAAH',
        type: 'Application Mobile',
        category: 'Personnel',
        pick: true,
        tech: ['React Native', 'Symfony', 'MySQL', 'Cloudflare', 'Railway', 'Expo'],
        role: 'Projet personnel, conception et développement complet : app mobile, API et mise en production.',
        desc: 'Teste ta connaissance du Coran : application mobile pour s\'entraîner à reconnaître les versets, avec écoute de récitations, plusieurs modes de quiz et suivi de progression. Disponible sur l\'App Store.',
        links: [
          { label: 'Télécharger', url: 'https://apps.apple.com/us/app/islaah/id6758726142' },
        ],
        device: 'mobile',
        shots: [
          { file: 'islaah-home-logged-in', alt: 'Accueil : les modes de jeu' },
          { file: 'islaah-onboarding', alt: 'Écran de bienvenue' },
          { file: 'islaah-audio-listening', alt: 'Écoute d\'un verset et choix de la sourate' },
          { file: 'islaah-bad-answer', alt: 'Correction après une mauvaise réponse' },
          { file: 'islaas-levels', alt: 'Système de rangs' },
          { file: 'islaah-home-logged-out', alt: 'Accueil sans compte' },
        ],
        accent: '#8a3bff',
      },
      {
        short: 'PROSPECTLY',
        slug: 'prospectly',
        date: '09/2025',
        title: 'Plateforme de recherche de prospects',
        type: 'Projet personnel',
        category: 'Personnel',
        tech: ['Node.js', 'Railway', 'HTML', 'CSS', 'JavaScript', 'NoSQL'],
        role: 'Projet personnel : idée, conception et développement réalisés seul.',
        desc: 'Plateforme permettant de rechercher une enseigne qui a besoin d\'un site web ou d\'une mise à jour.',
        links: [
          { label: 'Accéder', url: 'https://prospectly.hitmind-pro.workers.dev/' },
        ],
        shots: [
          { file: 'prospectly-search', alt: 'Recherche d\'enseignes : fiche d\'un commerce' },
        ],
        accent: '#ff123d',
      },
      {
        short: 'ONEDAY',
        slug: 'oneday',
        date: '01/2026',
        title: 'OneDay',
        type: 'PWA de planification',
        category: 'Personnel',
        tech: ['React', 'TypeScript', 'Vite', 'Tailwind CSS', 'React Router', 'Supabase', 'PostgreSQL', 'PWA', 'Web Push', 'Cloudflare Pages', 'Cloudflare Workers'],
        role: 'Projet personnel : conception et développement complets (frontend, backend serverless, notifications push). PWA que j\'ai construite pour organiser mes journées, mieux travailler et m\'installer des habitudes.',
        desc: 'Planificateur quotidien minimaliste, à usage strictement personnel (compte unique, pas d\'inscription), pensé pour organiser mes journées et ancrer des habitudes de travail. Chaque soir on prépare la journée du lendemain ; chaque matin on ne voit que les tâches restantes du jour. Tâches horodatées avec description et suivi d\'avancement, modèles de journée réutilisables (« programmes ») applicables à n\'importe quelle date, reprise de la veille en un clic. Application installable sur iPhone (PWA), utilisable hors ligne, avec des rappels par notification push déclenchés chaque minute par un cron Cloudflare Worker (Web Push / VAPID). Données isolées par utilisateur via les policies RLS de Supabase.',
        links: [
          { label: 'Voir le projet', url: 'https://oneday-5s9.pages.dev/' },
        ],
        device: 'mobile',
        shots: [
          { file: 'oneday-home-program', alt: 'Journée du jour avec un programme appliqué' },
          { file: 'oneday-home-without-program', alt: 'Journée vide : ajout d\'une tâche' },
        ],
        accent: '#19e8ff',
      },
      {
        short: 'SKYWALK',
        slug: 'skywalk',
        date: '01/2025',
        title: 'SkyWalk',
        type: 'Plateforme Web',
        category: 'Personnel',
        pick: true,
        tech: ['React', 'TypeScript', 'Vite', 'Tailwind', 'React Query', 'i18next', 'NestJS', 'PostgreSQL', 'TypeORM', 'JWT', 'OpenAI API', 'Jest', 'Vitest', 'Playwright', 'Docker', 'Nginx', 'GitHub Actions', 'GitLab CI'],
        role: 'Projet personnel que je mène seul sur toute la chaîne. Démarré à plusieurs à l\'ETNA, je l\'ai repris et poursuivi seul, avec l\'aide ponctuelle de camarades, et j\'en ai réalisé l\'essentiel : conception et architecture du monorepo, frontend React, API REST NestJS, modèle de données et migrations PostgreSQL, authentification JWT, fonctionnalités métier, tests unitaires et de bout en bout, documentation, conteneurisation Docker et pipeline d\'intégration continue.',
        desc: 'Plateforme web full-stack qui accompagne un projet d\'expatriation de bout en bout, en français et en anglais. Partir à l\'étranger oblige à croiser des informations dispersées (visa, démarches, budget, emploi) : SkyWalk les réunit. Après un onboarding, l\'utilisateur crée son projet et obtient une checklist personnalisée avec suivi des démarches et rappels d\'échéance, explore les destinations sur une carte du monde, compare le coût de la vie entre villes, consulte des offres d\'emploi et échange avec la communauté : forum, messagerie privée, buddies et experts vérifiés. Côté technique : API REST NestJS documentée avec Swagger, recherche full-text PostgreSQL, forum modéré par filtre local et modération OpenAI, liens gouvernementaux officiels trouvés par recherche web, classés par un LLM puis validés par un administrateur, coffre-fort documentaire chiffré, dashboard à widgets réorganisables, back-office d\'administration et données externes (Adzuna, REST Countries, OCDE).',
        links: [
          { label: 'Accéder', url: 'https://skywalk-chi.vercel.app/' },
        ],
        shots: [
          { file: 'skywalk-home-logged-out', alt: 'Page d\'accueil' },
          { file: 'skywalk-home', alt: 'Tableau de bord' },
          { file: 'skywalk-search-destination', alt: 'Exploration des destinations' },
          { file: 'skywalk-create-project', alt: 'Création d\'un projet d\'expatriation' },
        ],
        accent: '#ff2bb0',
      },
      {
        short: 'CROWDIN',
        slug: 'crowdin',
        date: '08/2026',
        title: 'Crowdin (clone)',
        type: 'Plateforme de localisation',
        category: 'Scolaire',
        tech: ['Symfony 7', 'PHP 8', 'Doctrine ORM', 'PostgreSQL', 'Twig', 'Docker', 'Bootstrap'],
        role: 'Projet scolaire ETNA réalisé en binôme (déc. 2024 – janv. 2025) ; j\'ai porté la majeure partie du développement : modélisation Doctrine et migrations, CRUD projets / langues / sources / traductions, import et export CSV, verrouillage des chaînes sources, inscription avec vérification d\'e-mail, contrôle d\'accès par voter.',
        desc: 'Reproduction de Crowdin : plateforme collaborative de gestion de traductions (localisation). Un propriétaire crée un projet avec une langue source et plusieurs langues cibles, y ajoute des chaînes à traduire à la main ou par import CSV en masse, puis les traducteurs produisent et suivent les traductions par langue. Comptes avec vérification d\'e-mail, profils (langues parlées, statut traducteur), verrouillage des chaînes sources (seul le propriétaire modifie une source verrouillée), statuts de traduction, export CSV, pagination et contrôle d\'accès par rôles.',
        links: [],
        shots: [
          { file: 'crowdin-home', alt: 'Page d\'accueil' },
          { file: 'crowdin-dashboard', alt: 'Tableau de bord : projets et avancement des traductions' },
        ],
        accent: '#8a3bff',
      },
    ],
  },
};

// Lecture côté Node (scripts/build-classic.mjs), sans effet dans le navigateur.
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SECTIONS, CATEGORY_ACCENT };
}
