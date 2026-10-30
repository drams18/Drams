# Hello guys, My name is Drame Arphan and I'm 21. This is my portfolio and I would like to let you see who I am. I say anything more, Enjoy !!


https://arphandrame.fr/

## Le site : développeur web freelance, plus un mode aventure

| URL | Fichier | Rôle |
|---|---|---|
| `/` | `index.html` | **Accueil** : promesse, problèmes réglés, offres, réalisations, méthode, qui je suis, FAQ, contact |
| `/realisations` | `realisations.html` | Réalisations (filtres par type) |
| `/realisations/<projet>` | `realisations/<projet>.html` | Un projet : le besoin, ce que j'ai fait, ce que ça permet |
| `/tarifs` | `tarifs.html` | 6 offres principales, puis la grille complète (HTML, recherche en JS) |
| `/a-propos` | `a-propos.html` | Présentation, parcours, CV |
| `/contact` | `contact.html` | Téléphone, WhatsApp, Instagram, e-mail, LinkedIn, formulaire |
| `/devis` | `devis.html` | Demande de devis par étapes (`js/devis.js`) |
| `/avis` | `avis.html` | Avis Google (lien envoyé aux clients) |
| `/mentions-legales`, `/confidentialite` | | Pages légales |
| `/aventure` | `aventure.html` | **Mode aventure** (bonus) : trois univers à explorer |
| `/construire-projet` | `construire-projet.html` | Devis en mini-jeu (mode aventure) |

Anciennes adresses (`/classique/*`, liens courts) : redirections 301 dans `_redirects`.

- **Contenu : deux sources.** `js/museum.js` (profil, contact, activité légale `business`, projets
  et leur texte client `projets.cases`) et `js/tarifs-data.js` (prix, offres principales). Toutes
  les pages du site en sont **générées en entier** par `scripts/build-site.mjs` (ne pas éditer le
  HTML à la main, sauf `aventure.html` et `construire-projet.html`) :

  ```sh
  npm run dev       # serveur local (Vite)
  npm run content   # régénère seulement le HTML
  npm run build     # content + sitemap + build Vite → dist/ (ce que sert Cloudflare Pages)
  npm run capture   # (après build) régénère l'image de partage assets/img/og.jpg
  npm run logo      # régénère le logo, le favicon et leurs PNG (scripts/logo.mjs)
  ```

- **Règles des pages** : complètes sans JavaScript et sans animation (rien n'est masqué en
  attendant un défilement), un seul `<h1>`, titre et description propres, JSON-LD
  `ProfessionalService`. Le générateur refuse un second `<h1>` ou un tiret cadratin.
- **Styles** : `css/site.css` (thèmes jour / nuit selon l'heure, `js/theme.js`, police Inter) +
  `css/vitrine.css` (pages du site, barre de contact mobile). `css/annexe.css` : devis et avis.
- **Scripts** : `js/site.js` (menu, filtres, formulaire de contact), `js/tarifs.js` (recherche),
  `js/contact-form.js` (EmailJS chargé à la demande), `js/devis.js`.
- **Passage aventure → site** (`js/deeplink.js`, `siteHref`) : `#projets/skywalk` →
  `/realisations/skywalk`, `#contact` → `/contact`, etc.
- **Logo** : `scripts/logo.mjs` dessine trois anneaux d'argent entrelacés (bande aux nuages
  gravés, contours : `scripts/logo-nuages.json`, et anneau intérieur aux sept pierres).
  `npm run logo` produit `assets/img/logo.svg`, `favicon.svg`, `logo-1024.png`, `favicon.png` et
  `apple-touch-icon.png` (Google Chrome et `sips` requis).
- **Mesure d'audience** : Google Analytics 4, chargé seulement après accord (`js/consent.js`,
  `js/analytics.js`, `js/analytics-events.js`). Détails : `docs/analytics-ga4.md`.
- **Documents administratifs** : jamais dans `assets/` publié. Le build ne copie aucun PDF de
  `assets/` sauf `CV.pdf`, et `assets/avis-*.pdf` est ignoré par Git.

Aucun framework : HTML / CSS / JS vanilla. **Vite** assemble le site dans `dist/` (Cloudflare Pages :
commande `npm run build`, dossier `dist`).

**Mode aventure : un moteur, trois univers** (`src/aventure/`, modules ES assemblés par Vite) :

- Déroulé : choix de l'expérience (VILLE · urbain, HAUTE VOLTIGE · héroïque, LE PALAIS · mature) →
  briefing → exploration. Quatre lieux (profil, parcours, contact, galerie), huit compétences à
  trouver, un portail vers `construire-projet`. Rien d'essentiel n'est verrouillé : tout le contenu
  est aussi accessible par les onglets de la fenêtre, le menu (Échap) et les liens profonds.
- `core/` : `GameLoop` (requestAnimationFrame + deltaTime, pas de simulation ≤ 1/60 s, même jeu de
  30 à 165 Hz), `Camera` (zone morte, anticipation, zoom, secousse, travelling), `Collision`
  (sol, murs, plafonds, plateformes traversables), `Input` (clavier + tactile), `SaveManager`
  (sauvegarde v2, migration de la v1), `Game` (machine à états).
- `player/` : `Character` (état), `CharacterController` (physique), `CharacterAnimator` (pose),
  `CharacterRenderer` (dessin). `world/` : niveau, lieux, collectibles, passants, plateformes.
- `universes/<id>/` : un univers ne fournit que `theme.js` (palette, typographie, vocabulaire,
  caméra, physique, audio), `world.js` (niveau), `character.js` (apparence), `renderer.js` (décor).
  Le contrat est dans `universes/theme.js` ; ajouter un univers = un dossier + une ligne dans
  `UniverseManager.js`.
- `portfolio/` : lit `js/museum.js` ; les projets associés à une compétence sont dérivés des
  technologies de chaque projet. `ui/` : sélecteur, briefing, HUD, pause, fin, fenêtre portfolio
  (tout en DOM). `audio/` : ambiances et bruitages synthétisés (WebAudio), son coupé par défaut.
- Tests : `npm test` (physique à 30 / 60 / 90 / 120 / 144 / 165 Hz, collisions, sauvegarde, données)
  et `BASE=http://localhost:5173 npm run test:e2e` (parcours complet dans Chrome headless, serveur
  `npm run dev` ou `npm run preview` lancé).
