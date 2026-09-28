# Hello guys, My name is Drame Arphan and I'm 21. This is my portfolio and I would like to let you see who I am. I say anything more, Enjoy !!


https://drams18.github.io/Drams/

## Deux modes, un seul site

| Page | Rôle |
|---|---|
| `index.html` | **Mode classique** — portfolio lisible en 2 minutes (le haut de page propose aussi le mode aventure) |
| `aventure.html` | **Mode aventure** — la ville interactive (canvas) |
| `tarifs.html`, `construire-projet.html` | Pages clients, communes aux deux modes |

- **Contenu : une seule source**, `js/museum.js`. Le mode aventure le lit directement ; le
  HTML du mode classique en est **généré** :

  ```sh
  npm run build     # après toute modification de js/museum.js
  ```

- **Liens profonds communs** (`js/deeplink.js`) : `#profil`, `#parcours/<slug>`,
  `#projets/<slug>`, `#contact`, `#portail`. Le même fragment ouvre le même contenu
  dans les deux modes (`index.html#projets/skywalk` ⇄ `aventure.html#projets/skywalk`).
- **DA partagée** : `css/tokens.css` (chargé par toutes les pages).
- **Formulaires** : `js/contact-form.js` (EmailJS chargé à la demande).
- **Image de partage** : `assets/img/og.png`, générée depuis `scripts/og.html`.

Aucune dépendance, aucun framework : HTML / CSS / JS vanilla, servi tel quel par GitHub Pages.
