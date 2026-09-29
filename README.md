# Hello guys, My name is Drame Arphan and I'm 21. This is my portfolio and I would like to let you see who I am. I say anything more, Enjoy !!


https://portfolio-3kx.pages.dev/

## Un portfolio, deux façons de le découvrir

| URL | Fichier | Rôle |
|---|---|---|
| `/` | `index.html` | **Écran de sélection** — « Comment souhaitez-vous me découvrir ? » |
| `/classique` | `classique.html` | **Mode classique** — portfolio professionnel (jour / nuit selon l'heure locale) |
| `/aventure` | `aventure.html` | **Mode aventure** — la ville interactive (canvas) |
| `/tarifs`, `/construire-projet` | | Pages clients, communes aux deux modes |
| `/cv`, `/contact`, `/projets` | `_redirects` | Liens courts |

- **Contenu : une seule source**, `js/museum.js`. Le mode aventure le lit directement ; le HTML
  du mode classique (et l'identité de l'écran de sélection) en est **généré** :

  ```sh
  npm run dev       # serveur local (Vite), rechargement à chaud
  npm run content   # régénère seulement le HTML depuis js/museum.js
  npm run build     # content + build Vite → dist/ (ce que sert Cloudflare Pages)
  npm run capture   # régénère les miniatures de l'écran de sélection + og.jpg
  ```

- **Liens profonds communs** (`js/deeplink.js`) : `#profil`, `#parcours/<slug>`,
  `#projets/<slug>`, `#contact`, `#portail`. Le même fragment ouvre le même contenu dans les
  deux modes (`/classique#projets/skywalk` ⇄ `/aventure#projets/skywalk`).
- **Ambiance jour / nuit** : `js/theme.js` (07 h → 20 h = jour ; `?theme=day|night` pour forcer).
- **DA partagée** : `css/tokens.css` (palette, police pixel auto-hébergée).
- **Formulaires** : `js/contact-form.js` (EmailJS chargé à la demande).

Aucun framework : HTML / CSS / JS vanilla. **Vite** assemble le site dans `dist/` (Cloudflare Pages :
commande `npm run build`, dossier `dist`) ; les scripts classiques `js/*.js` et les médias y sont
copiés tels quels. **GSAP + ScrollTrigger** animent le mode classique (`src/classic-motion.js`) :
entrée du hero, parallaxe de la ville, révélations au défilement, tracé du parcours. La page reste
complète sans ce module, et rien n'est animé si le visiteur préfère réduire les animations.
L'adresse du site est définie dans `scripts/build-classic.mjs` (`SITE_URL`) et dans les `<head>`.
