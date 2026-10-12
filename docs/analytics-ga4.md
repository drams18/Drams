# Google Analytics 4 et consentement aux cookies

Mise en place du 12 octobre 2026. Ce document décrit ce qui est dans le code, ce qui reste à
régler à la main dans Google Analytics, et ce qui a réellement été testé.

Une bannière ne garantit pas à elle seule la conformité RGPD / CNIL. Les points qui demandent
une décision de votre part sont listés dans [Limites et décisions à valider](#limites-et-décisions-à-valider).

## En bref

- Identifiant de mesure : `G-XYZG9XXTCH`, défini à un seul endroit, en haut de `js/analytics.js`
  (`MEASUREMENT_ID`). Le remettre à `G-XXXXXXXXXX` coupe toute la mesure.
- Rien de Google n'est chargé ni appelé avant un accord explicite.
- Le site est statique (HTML / CSS / JS, build Vite, Cloudflare Pages). Il n'y a pas de PHP :
  les formulaires partent par EmailJS depuis le navigateur.
- **Trois réglages restent à faire dans GA4**, sans quoi les chiffres seront faussés :
  désactiver deux options de la mesure améliorée et marquer `generate_lead` comme événement clé
  (voir [Configuration dans Google Analytics](#configuration-dans-google-analytics)).

## Constats de l'audit

| Point | Constat |
|---|---|
| Architecture | 12 pages HTML. Les 5 pages du mode classique sont générées par `scripts/build-classic.mjs` ; les autres sont écrites à la main. Aucun gabarit serveur. |
| Formulaires | 4 formulaires : contact classique (`js/classic.js`), contact du mode aventure (`src/aventure/ui/PortfolioWindow.js`), devis (`js/devis.js`), devis en mini-jeu (`src/construire/BuildUI.js`). Tous passent par `ContactForm.sendForm()` dans `js/contact-form.js`. |
| Envoi | EmailJS (SDK chargé à la demande depuis jsDelivr). Le succès est la résolution de la promesse `sendForm`. Pas de page de confirmation, pas de redirection. |
| Traceurs existants | Aucun. Ni Google Analytics, ni Tag Manager, ni autre outil. |
| Bannière existante | Aucune. |
| Stockage déjà utilisé | `localStorage` : dernier mode, sauvegarde du jeu, rappel d'avis. `sessionStorage` : thème, brouillon du devis, navigation. Réglages demandés par le visiteur, sans suivi. |
| Content Security Policy | Aucune (`_headers` ne pose que `nosniff` et `Referrer-Policy`). |
| Risques de double comptage | Pages préchargées par `speculationrules`, retour arrière par le cache du navigateur, double clic sur « Envoyer », et la mesure améliorée de GA4. Tous traités, sauf le dernier qui se règle dans GA4. |

## Fichiers

Créés :

| Fichier | Rôle |
|---|---|
| `js/consent.js` | Choix du visiteur : stockage, bandeau, panneau de préférences, accès permanent. Ne charge aucun traceur. |
| `js/analytics.js` | Configuration GA4, chargement de `gtag.js` après accord, arrêt au retrait, page vue. |
| `js/analytics-events.js` | `form_start`, `generate_lead`, `contact_click`. |
| `tests/consent.test.mjs` | Tests des règles de consentement (Node, sans navigateur). |
| `tests/analytics.e2e.mjs` | Tests dans Chrome : scénarios A à F. |
| `docs/analytics-ga4.md` | Ce document. |

Modifiés :

| Fichier | Changement |
|---|---|
| `js/contact-form.js` | Émet `lead:start` (première saisie) et `lead:sent` (envoi confirmé). Un envoi déjà en cours pour le même formulaire est réutilisé. |
| `scripts/build-classic.mjs` | Les trois scripts dans le gabarit des pages classiques, lien « Cookies » dans le pied de page. |
| `classique.html`, `classique/*.html` | Régénérés par `npm run content`. |
| `index.html` | Trois scripts, lien « Cookies » dans le pied de page. |
| `tarifs.html`, `devis.html`, `avis.html`, `aventure.html`, `construire-projet.html`, `404.html` | Trois scripts. `404.html` porte en plus `data-analytics-path="/404"`. |
| `src/aventure/ui/PauseMenu.js` | Entrée « COOKIES » dans le menu du jeu. |
| `css/classic.css`, `src/construire/construire.css` | Une variable (`--ck-lift`) pour placer le bouton d'accès au-dessus des barres fixes sur mobile. |
| `tests/cdp.mjs` | `page.on()` pour écouter le réseau. |
| `package.json` | `consent.test.mjs` ajouté à `npm test`, nouveau script `test:analytics`. |

## Architecture

```
js/consent.js ── « consent:change » ──▶ js/analytics.js ──▶ gtag.js (après accord seulement)
                                              ▲
js/contact-form.js ── « lead:start » / « lead:sent » ──▶ js/analytics-events.js
clics sur les liens de contact ───────────────────────▶ js/analytics-events.js
```

Chaque fichier a un seul rôle. `analytics-events.js` n'envoie rien lui-même : il appelle
`Analytics.event()`, qui ne laisse rien sortir tant que la mesure n'est pas active. Les
formulaires ne connaissent pas Google Analytics, ils signalent seulement ce qui leur arrive.

Les trois scripts sont chargés avec `defer` sur chaque page. Vite leur ajoute `?v=<empreinte>`
au build, comme aux autres fichiers de `js/`.

La mesure ne tourne que sur `arphandrame.fr` et `www.arphandrame.fr` (`HOSTS` dans
`js/analytics.js`). En local et sur les aperçus `*.pages.dev`, le bandeau fonctionne mais rien
n'est envoyé, sauf si vous posez ce drapeau dans la console du navigateur :

```js
localStorage.setItem('drame.analytics.debug', '1')   // active la mesure + debug_mode (DebugView)
localStorage.removeItem('drame.analytics.debug')     // pour l'enlever
```

## Consentement

### Ce que voit le visiteur

- **Bandeau** en bas de page à la première visite : « Tout refuser », « Tout accepter »,
  « Personnaliser ». Les deux premiers boutons ont la même taille et le même style. Le bandeau
  ne bloque pas la page.
- **Panneau de préférences** : catégorie « Nécessaires » (toujours active, expliquée) et
  « Mesure d'audience » (case décochée par défaut). « Fermer », Échap ou un clic à côté ne
  décident de rien.
- **Accès permanent** : lien « Cookies » dans les pieds de page (accueil, profil), entrée
  « COOKIES » dans le menu du mode aventure, et sur les autres pages un petit bouton rond en bas
  à gauche, qui apparaît une fois le choix fait.

Le bandeau reprend les couleurs, la police et les boutons du site (variables de `css/site.css`),
en thème clair comme en thème sombre. Ses styles sont injectés par `js/consent.js`, comme le fait
déjà `js/contact.js`, parce que le mode aventure ne charge pas `css/site.css`.

### Règles techniques

| Règle | Mise en œuvre |
|---|---|
| Refusé par défaut | `Consent.allows('analytics')` ne renvoie `true` que pour un accord enregistré et encore valide. |
| Pas d'accord implicite | Ni la navigation, ni le défilement, ni la fermeture du panneau n'enregistrent quoi que ce soit. |
| Avant accord | `gtag.js` n'est pas téléchargé, `dataLayer` n'existe pas, aucun cookie `_ga`. |
| Refus | Rien n'est chargé. Les cookies `_ga` qui traîneraient sont supprimés. |
| Retrait | Immédiat : `window['ga-disable-G-XYZG9XXTCH'] = true` (coupe tout envoi, même avec `gtag.js` déjà en mémoire), consentement repassé à `denied`, cookies `_ga` et `_ga_*` supprimés. Aux pages suivantes, rien n'est chargé. |
| Autres onglets | Un choix modifié dans un onglet est appliqué dans les autres (événement `storage`). |
| Durée | Le choix, accord comme refus, est conservé 6 mois (`MAX_AGE_DAYS = 182`), puis redemandé. |
| Renouvellement forcé | Incrémenter `VERSION` dans `js/consent.js` redemande le choix à tout le monde. À faire si vous ajoutez une finalité ou un outil. |
| Stockage bloqué | Si `localStorage` est inaccessible, le choix ne vaut que pour la page en cours. Le bandeau revient à la page suivante, rien n'est activé d'office. |
| Captures | Avec `?capture` (miniatures de `scripts/capture.mjs`), le bandeau n'est pas affiché. |

Le choix est stocké dans `localStorage`, clé `drame.consent` : `{ v, analytics, t }`. Aucun
identifiant, aucune donnée personnelle.

### Google Consent Mode : mode de base

Google propose deux modes. En mode avancé, `gtag.js` est chargé dès l'ouverture de la page et
envoie des mesures sans cookie tant que le visiteur n'a pas répondu. En mode de base, rien n'est
chargé avant la réponse, et d'après la documentation de Google aucune donnée n'est transmise,
pas même l'état du consentement.

Le site utilise le **mode de base**. Le mode avancé n'a pas été retenu : il transmet des signaux
à Google avant tout accord, ce qui demanderait une analyse juridique que ce travail ne fait pas.

Après accord, `js/analytics.js` déclare :

```js
gtag('consent', 'default', { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'denied' });
gtag('consent', 'update',  { analytics_storage: 'granted' });
```

Les trois signaux publicitaires restent toujours refusés. `allow_google_signals` et
`allow_ad_personalization_signals` sont à `false`. Les tests le confirment dans les appels
réels : `gcs=G101` (publicité refusée, mesure accordée) et `npa=1`.

Les cookies `_ga` sont limités à 13 mois, sans prolongation à chaque visite
(`cookie_expires`, `cookie_update: false`).

### Exemption de consentement

Non activée. La CNIL exempte certains outils de mesure d'audience sous conditions strictes.
Google Analytics dans sa configuration standard n'est pas présenté ici comme exempté, et le site
reste sur le modèle du consentement préalable.

## Événements

| Événement | Déclenchement | Paramètres |
|---|---|---|
| `page_view` | Une fois par page, à l'initialisation de GA4. Aussi au retour arrière servi par le cache du navigateur. Jamais pour une page seulement préchargée. | `page_location` nettoyée |
| `form_start` | Première saisie dans un formulaire (pas au simple focus). Une fois par formulaire et par page. | `form_type`, `site_mode` |
| `generate_lead` | Quand EmailJS confirme l'envoi. Jamais au clic sur « Envoyer », jamais sur un formulaire invalide ou un envoi échoué. | `form_type`, `site_mode` |
| `contact_click` | Clic sur un lien `mailto:`, `tel:`, `sms:`, sur Gmail ou Outlook dans la fenêtre de contact, sur un bouton « Copier » ou sur le profil LinkedIn. | `method`, `link_type`, `site_mode` |

Valeurs possibles, toutes écrites en dur dans `js/analytics-events.js` :

- `form_type` : `contact`, `devis`
- `site_mode` : `classique`, `aventure`
- `method` : `email`, `phone`, `sms`, `linkedin`
- `link_type` : `app`, `webmail`, `copy`, `profile`

Aucune valeur monétaire n'est envoyée avec `generate_lead` : il n'existe pas d'estimation fiable
de ce que vaut une demande.

### Données personnelles

- Aucun paramètre ne vient d'un champ de formulaire. Les événements `lead:start` et `lead:sent`
  ne portent que le type de formulaire.
- L'adresse de page envoyée à GA4 est réduite au chemin, plus les paramètres `utm_*`. Le
  fragment (`#…`) et tous les autres paramètres sont retirés.
- La page 404 envoie toujours `/404`, jamais l'adresse saisie.
- `contact_click` déduit le moyen de contact de la forme du lien, sans transmettre l'adresse ni
  le numéro.

### Dédoublonnage

- Double clic ou double appel : un envoi déjà en cours pour le même formulaire est réutilisé,
  donc un seul e-mail et un seul `generate_lead`.
- Rechargement : la confirmation s'affiche sans changer de page ni d'adresse, et rien n'est
  rejoué au rechargement.
- `gtag.js` n'est injecté qu'une fois par page, quel que soit le nombre de changements de choix.

## Configuration dans Google Analytics

Rien de ce qui suit n'a été fait : ce travail n'a pas accès à votre compte Google. Les libellés
de l'interface évoluent, cherchez l'équivalent s'ils ont changé.

### 1. Mesure améliorée (à faire en premier)

Admin → Flux de données → votre flux Web → Mesure améliorée (roue dentée).

Les tests montrent que la mesure améliorée est active sur ce flux : GA4 envoie de lui-même
`scroll`, `click`, `form_start` et `user_engagement`.

| Option | Réglage conseillé | Pourquoi |
|---|---|---|
| Interactions avec les formulaires | **Désactiver** | GA4 envoie son propre `form_start`, qui s'ajoute au nôtre (constaté sur le devis : 2 événements au lieu de 1). Il enverrait aussi un `form_submit` au clic, avant toute confirmation. |
| Clics sortants | **Désactiver** | L'événement `click` transmet l'adresse complète du lien. Pour Gmail et Outlook, elle contient l'objet du message et, depuis la page Tarifs, un texte prérempli à partir de ce que le visiteur a cherché. Google masque l'adresse e-mail, pas le reste. `contact_click` couvre déjà ces clics. |
| Modifications de page selon l'historique du navigateur | Désactiver par précaution | Aucun doublon constaté pendant les tests, mais plusieurs pages modifient l'adresse sans recharger. |
| Défilement, téléchargements de fichiers | Au choix | Les téléchargements comptent les ouvertures du CV. |

### 2. Événement clé

`generate_lead` doit être marqué comme événement clé (ancien nom : conversion). Dans
Admin → Affichage des données → Événements, repérez `generate_lead` et marquez-le comme
événement clé. L'événement n'apparaît dans la liste qu'après avoir été reçu au moins une fois :
envoyez d'abord une vraie demande depuis le site, puis revenez. Selon la version de
l'interface, vous pouvez aussi le créer directement par son nom dans la section des événements
clés.

### 3. Dimensions personnalisées

Pour voir `form_type`, `site_mode`, `method` et `link_type` dans les rapports :
Admin → Affichage des données → Définitions personnalisées → Créer une dimension, portée
« Événement », une par paramètre.

### 4. À vérifier aussi

- Conservation des données (Admin → Collecte et modification des données → Conservation des
  données) : choisissez la durée la plus courte qui vous suffit.
- Google Signals : laissez désactivé. Le code le refuse déjà.
- Associations de produits (Google Ads) : aucune n'est nécessaire.

## Tests

### Commandes

```sh
npm test                                              # dont tests/consent.test.mjs
npm run dev                                           # dans un autre terminal
BASE=http://localhost:5173 npm run test:analytics     # Chrome headless
```

Pendant `test:analytics`, rien ne sort vraiment : les appels de collecte de GA4 sont
interceptés, lus, puis répondus par le test, et EmailJS est remplacé par un faux SDK (aucun
e-mail envoyé). Seul `gtag.js` est réellement téléchargé chez Google, ce qui permet de vérifier
le comportement réel de la bibliothèque avec votre identifiant.

### Résultats du 12 octobre 2026

- `npm test` : réussi, y compris les règles de consentement (défaut, refus, accord, retrait,
  expiration à 6 mois, données illisibles, stockage bloqué).
- `npm run build` : réussi, les trois scripts sont présents et versionnés dans les 12 pages.
- `test:analytics` sur le site construit (`vite preview`) : **155 vérifications réussies, 0 échec**.
  Même résultat sur le serveur de développement.

| Scénario | Vérifié |
|---|---|
| A. Première visite | Bandeau affiché, aucun choix enregistré, `gtag.js` absent, aucun appel vers Google, aucun cookie `_ga`, y compris après défilement, navigation, ouverture puis fermeture du panneau. Case non précochée. Boutons refuser et accepter de même taille et de même style. |
| B. Refus | Bandeau retiré, refus conservé au rechargement et d'une page à l'autre, aucun appel vers Google. |
| C. Acceptation | `gtag.js` chargé une fois, une `page_view` par page, adresse réduite au chemin et aux `utm_*`, `/404` fixe, signaux publicitaires refusés, `contact_click` pour e-mail, téléphone et webmail. |
| D. Retrait | État mis à jour, `ga-disable` posé, cookies `_ga` supprimés, plus aucun appel de collecte ensuite, retrait conservé à la visite suivante, nouvel accord pris en compte tout de suite. Avec un refus, un formulaire envoyé avec succès ne déclenche aucun appel vers Google. |
| E. Formulaires | Contact classique et devis : formulaire vide ou invalide, puis envoi refusé par le service, sans `generate_lead`. Envoi réussi : un seul `generate_lead`, même avec deux soumissions d'affilée. Pas de nouveau lead au rechargement. Nom, e-mail, téléphone et message de test absents de tous les appels, événements automatiques compris. |
| F. Qualité | Console sans erreur sur 11 pages, en refus et en accord. Mobile 360 px : bandeau et panneau dans l'écran, boutons de 42 px. Clavier : premier arrêt sur « Tout refuser », focus dans le panneau, Échap le ferme, focus rendu au lien d'ouverture. Dans le jeu, Échap ferme le panneau sans ouvrir le menu pause. |

Contrôles visuels faits sur captures : accueil, profil, projets, parcours, devis, mode aventure,
mini-jeu, en thème sombre et clair, ordinateur et mobile.

Écart relevé pendant les tests : le `form_start` automatique de GA4 en double du nôtre sur le
devis. Il vient du réglage de la propriété, pas du code (voir Mesure améliorée).

### Non testé

- La réception réelle des événements dans votre propriété (les appels étaient interceptés).
- Le formulaire de contact du mode aventure et celui du mini-jeu : ils utilisent le même
  `ContactForm.sendForm()` que les deux formulaires testés, mais leur parcours n'a pas été
  automatisé.
- La page 404 servie par Cloudflare pour une adresse inconnue (testée ici en ouvrant
  `404.html` directement).
- Les pages préchargées (`speculationrules`) et le retour par le cache du navigateur : le code
  les traite, sans test automatique.
- Safari, Firefox, un vrai téléphone, un lecteur d'écran. Les tests tournent dans Chrome.
- Les erreurs PHP : sans objet, le site n'en contient pas.

## Vérification en production

1. Déployer, puis ouvrir le site en navigation privée avec les outils de développement, onglet
   Réseau, filtre `google`.
2. Avant tout clic : aucune requête, et aucun cookie `_ga` dans l'onglet Application.
3. « Tout refuser » : toujours aucune requête, y compris en changeant de page.
4. Effacer les données du site, recharger, « Tout accepter » : une requête `gtag/js`, puis des
   requêtes `collect` avec `en=page_view`. La page vue peut partir quelques secondes après
   l'affichage.
5. Dans GA4, Rapports → Temps réel : votre visite apparaît. Pour le détail événement par
   événement, posez le drapeau `drame.analytics.debug` (voir Architecture) et ouvrez
   Admin → DebugView.
6. Envoyer une vraie demande par le formulaire de contact puis par le devis : un
   `generate_lead` à chaque fois, avec `form_type` `contact` puis `devis`. Faire de même une fois
   depuis le mode aventure et le mini-jeu.
7. Rouvrir « Cookies », désactiver la mesure, enregistrer : les cookies `_ga` disparaissent et
   plus aucune requête `collect` ne part.
8. Ouvrir une adresse qui n'existe pas : la page vue doit porter `/404`.
9. Après les réglages de mesure améliorée, vérifier dans DebugView qu'il n'y a plus qu'un
   `form_start` par formulaire.

## Limites et décisions à valider

1. **Pas de page d'information.** Le site n'a ni politique de confidentialité ni mentions
   légales. Le panneau de préférences donne l'essentiel (finalité, prestataire, durée, retrait),
   mais une page dédiée est attendue : identité du responsable, base légale, durées, droits des
   personnes, contact. Elle devrait aussi couvrir les formulaires, dont les données passent par
   EmailJS. Je ne l'ai pas rédigée : son contenu dépend de votre statut et engage votre
   responsabilité.
2. **Google Analytics et transferts hors UE.** Les données sont traitées par Google et peuvent
   l'être aux États-Unis. Le panneau le mentionne. Le cadre juridique de ces transferts a déjà
   changé plusieurs fois : à suivre.
3. **Durées.** 6 mois pour le choix et 13 mois pour les cookies sont des valeurs alignées sur les
   recommandations de la CNIL telles que je les connais. La page de la CNIL consultée pendant ce
   travail confirme les principes (refuser aussi simplement qu'accepter, retrait possible à tout
   moment, cookie du choix dispensé de consentement) mais ne donne pas ces chiffres : vérifiez-les
   dans la recommandation « cookies et autres traceurs » avant de vous y fier.
4. **Preuve du consentement.** Le choix est gardé dans le navigateur du visiteur, pas sur un
   serveur. Vous ne pouvez donc pas prouver individuellement qui a consenti. Pour un site
   vitrine sans compte utilisateur c'est un choix courant, mais c'est un choix.
5. **Mesure améliorée.** Tant que les réglages de la section 1 ne sont pas faits, GA4 reçoit un
   `form_start` en double et l'adresse des liens sortants.
6. **Autres services tiers.** EmailJS et jsDelivr sont appelés quand un visiteur utilise un
   formulaire. Ils ne déposent pas de traceur de mesure, mais ils reçoivent son adresse IP et,
   pour EmailJS, le contenu du message. Hors du périmètre de la bannière, à mentionner dans la
   page d'information.
7. **Si une Content Security Policy est ajoutée un jour**, autoriser
   `https://www.googletagmanager.com` (`script-src`) et `https://*.google-analytics.com`,
   `https://*.analytics.google.com`, `https://www.googletagmanager.com` (`connect-src`,
   `img-src`).

## Sources consultées

- CNIL, « Cookies et traceurs : que dit la loi ? » : <https://www.cnil.fr/fr/cookies-et-autres-traceurs/regles/cookies/que-dit-la-loi>
- Google, « Consent mode overview » : <https://developers.google.com/tag-platform/security/concepts/consent-mode>
- Google Analytics, aide sur les événements clés : <https://support.google.com/analytics/answer/9267568?hl=fr>
