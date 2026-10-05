# Hello guys, My name is Drame Arphan and I'm 21. This is my portfolio and I would like to let you see who I am. I say anything more, Enjoy !!


https://arphandrame.fr/

## Un portfolio, deux façons de le découvrir

| URL | Fichier | Rôle |
|---|---|---|
| `/` | `index.html` | **Écran de sélection** · « Comment souhaitez-vous me découvrir ? » |
| `/classique` | `classique.html` | **Mode classique** · page d'entrée : Profil (jour / nuit selon l'heure locale) |
| `/classique/projets` | `classique/projets.html` | Mode classique · Projets (espace de bulles) |
| `/classique/parcours` | `classique/parcours.html` | Mode classique · Parcours (frise horizontale) |
| `/classique/competences` | `classique/competences.html` | Mode classique · Compétences (écosystème) |
| `/classique/contact` | `classique/contact.html` | Mode classique · Contact |
| `/aventure` | `aventure.html` | **Mode aventure** · trois univers à explorer (canvas + interface DOM) |
| `/tarifs` | `tarifs.html` | Grille tarifaire + recherche (style classique, commune aux deux modes) |
| `/devis` | `devis.html` | « Construisez votre projet » · formulaire par étapes (site classique) |
| `/construire-projet` | `construire-projet.html` | « Construisez votre projet » · mini-jeu (mode aventure) |
| `/cv`, `/contact`, `/projets`, `/parcours`, `/competences` | `_redirects` | Liens courts |

- **Contenu : une seule source**, `js/museum.js`. Le mode aventure le lit directement ; les cinq
  pages du mode classique (et l'identité de l'écran de sélection) en sont **générées en entier**
  par `scripts/build-classic.mjs` (ne pas éditer `classique.html` ni `classique/*.html` à la main) :

  ```sh
  npm run dev       # serveur local (Vite), rechargement à chaud
  npm run content   # régénère seulement le HTML depuis js/museum.js
  npm run build     # content + build Vite → dist/ (ce que sert Cloudflare Pages)
  npm run capture   # (après build) régénère les miniatures de l'accueil + og.jpg
  ```

- **Liens profonds communs** (`js/deeplink.js`) : `#profil`, `#parcours/<slug>`,
  `#projets/<slug>`, `#contact`, `#portail`. Le même fragment ouvre le même contenu dans les
  deux modes : `/classique#projets/skywalk` (ancien format, redirigé vers
  `/classique/projets#skywalk`) ⇄ `/aventure#projets/skywalk`. Le mode aventure ajoute
  `#aventure/ville`, `#aventure/hero`, `#aventure/club` (l'univers, directement).
- **Ambiance jour / nuit** : `js/theme.js` (07 h → 20 h = jour ; `?theme=day|night` pour forcer).
- **Deux styles distincts** : l'accueil, le mode classique, les tarifs, le devis et la 404 sont un
  site web sobre et professionnel (`css/site.css` : thèmes clair/sombre, police Inter ;
  `css/classic.css`, `css/annexe.css`). Le mode aventure a sa propre interface, habillée par
  l'univers choisi (`src/aventure/styles/aventure.css`) ; le mini-jeu `construire-projet` garde la
  DA comics / néon / pixel (`css/tokens.css`, `style.css`).
- **Devis ⇄ mini-jeu** : `js/devis.js` et `js/build-project.js` posent les mêmes questions, envoient
  le même e-mail et partagent la même session. Depuis les tarifs, « Construisez votre projet » mène au
  mini-jeu pour un visiteur du mode aventure, au formulaire pour les autres.
- **Formulaires** : `js/contact-form.js` (EmailJS chargé à la demande).

Aucun framework : HTML / CSS / JS vanilla. **Vite** assemble le site dans `dist/` (Cloudflare Pages :
commande `npm run build`, dossier `dist`) ; les scripts classiques `js/*.js` et les médias y sont
copiés tels quels.

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

**Mode classique : cinq pages, cinq environnements** (`src/classic-app.js` charge seulement
l'expérience de la page courante) :

- Profil, `src/classic/profile.js` (**GSAP**) : le nom au centre, puis métier → contexte → accès.
- Projets, `src/classic/projects.js` : espace sans bord couvrant l'écran (deux couches en
  parallaxe, répétition virtuelle), filtres, vue liste, fiche immersive (`#<projet>`,
  `#tech/<compétence>`). Miniatures : déposer `assets/img/projets/<slug>.webp` (16:10) puis `npm run build`.
- Parcours, `src/classic/timeline.js` : frise horizontale en bas (glisser, molette, clavier),
  l'étape choisie au-dessus (`#<étape>`).
- Compétences, `src/classic/skills.js` : écosystème « globe » (glisser + inertie), panneau détail,
  lien projet ↔ technologie dans les deux sens (`#<compétence>`, `#projet/<slug>`).
- `src/classic/space.js` : moteur commun aux espaces (caméra, gestes, répétition par copies réutilisées).
- Navigation : barre du haut, portes latérales, flèches ← → du clavier ; transitions entre pages
  par View Transitions (sens avant / arrière), pages voisines préchargées au survol.

Statut, taille des bulles, liens compétence ↔ projet et chronologie sont **dérivés** de
`js/museum.js` par `scripts/build-classic.mjs`, jamais saisis à la main. Chaque page reste complète
sans JavaScript, et rien n'est animé si le visiteur préfère réduire les animations.
L'adresse du site est définie dans `scripts/build-classic.mjs` (`SITE_URL`) et dans les `<head>`.
