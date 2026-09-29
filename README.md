# Hello guys, My name is Drame Arphan and I'm 21. This is my portfolio and I would like to let you see who I am. I say anything more, Enjoy !!


https://portfolio-3kx.pages.dev/

## Un portfolio, deux façons de le découvrir

| URL | Fichier | Rôle |
|---|---|---|
| `/` | `index.html` | **Écran de sélection** — « Comment souhaitez-vous me découvrir ? » |
| `/classique` | `classique.html` | **Mode classique** — portfolio professionnel (jour / nuit selon l'heure locale) |
| `/aventure` | `aventure.html` | **Mode aventure** — la ville interactive (canvas) |
| `/tarifs` | `tarifs.html` | Grille tarifaire + recherche (style classique, commune aux deux modes) |
| `/devis` | `devis.html` | « Construisez votre projet » — formulaire par étapes (site classique) |
| `/construire-projet` | `construire-projet.html` | « Construisez votre projet » — mini-jeu (mode aventure) |
| `/cv`, `/contact`, `/projets` | `_redirects` | Liens courts |

- **Contenu : une seule source**, `js/museum.js`. Le mode aventure le lit directement ; le HTML
  du mode classique (et l'identité de l'écran de sélection) en est **généré** :

  ```sh
  npm run dev       # serveur local (Vite), rechargement à chaud
  npm run content   # régénère seulement le HTML depuis js/museum.js
  npm run build     # content + build Vite → dist/ (ce que sert Cloudflare Pages)
  npm run capture   # (après build) régénère les miniatures de l'accueil + og.jpg
  ```

- **Liens profonds communs** (`js/deeplink.js`) : `#profil`, `#parcours/<slug>`,
  `#projets/<slug>`, `#contact`, `#portail`. Le même fragment ouvre le même contenu dans les
  deux modes (`/classique#projets/skywalk` ⇄ `/aventure#projets/skywalk`).
- **Ambiance jour / nuit** : `js/theme.js` (07 h → 20 h = jour ; `?theme=day|night` pour forcer).
- **Deux styles distincts** : l'accueil, le mode classique, les tarifs, le devis et la 404 sont un
  site web sobre et professionnel (`css/site.css` : thèmes clair/sombre, police Inter ;
  `css/classic.css`, `css/annexe.css`). Le mode aventure et son mini-jeu `construire-projet`
  gardent la DA jeu comics / néon / pixel (`css/tokens.css`, `style.css`).
- **Devis ⇄ mini-jeu** : `js/devis.js` et `js/build-project.js` posent les mêmes questions, envoient
  le même e-mail et partagent la même session. Depuis les tarifs, « Construisez votre projet » mène au
  mini-jeu pour un visiteur du mode aventure, au formulaire pour les autres.
- **Formulaires** : `js/contact-form.js` (EmailJS chargé à la demande).

Aucun framework : HTML / CSS / JS vanilla. **Vite** assemble le site dans `dist/` (Cloudflare Pages :
commande `npm run build`, dossier `dist`) ; les scripts classiques `js/*.js` et les médias y sont
copiés tels quels. **GSAP + ScrollTrigger** animent le mode classique (`src/classic-motion.js`) :
entrée du hero, parallaxe du halo, révélations au défilement, tracé du parcours. La page reste
complète sans ce module, et rien n'est animé si le visiteur préfère réduire les animations.
L'adresse du site est définie dans `scripts/build-classic.mjs` (`SITE_URL`) et dans les `<head>`.
