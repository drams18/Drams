# Google Analytics 4 et consentement aux cookies

Mise en place du 12 octobre 2026, suivie le même jour d'un audit de confidentialité (filtrage des
adresses et des événements, retrait, formulaires du mode aventure). Ce document décrit ce qui est
dans le code, ce qui reste à régler à la main dans Google Analytics, et ce qui a réellement été
testé.

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
  Aucun de ces réglages n'a été fait : ce travail n'a pas accès à votre compte Google.
- Le site n'a pas de page de confidentialité. Une structure à compléter est proposée dans
  `docs/politique-confidentialite-structure.md`.

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
| `js/analytics.js` | Configuration GA4, chargement de `gtag.js` après accord, arrêt au retrait, page vue. Tous les filtres de ce qui part chez Google. |
| `js/analytics-events.js` | `form_start`, `generate_lead`, `contact_click`. |
| `tests/consent.test.mjs` | Tests des règles de consentement (Node, sans navigateur). |
| `tests/analytics.test.mjs` | Tests des filtres (adresses, page d'origine, événements, cookies), avec des données personnelles en entrée. |
| `tests/analytics.e2e.mjs` | Tests dans Chrome : scénarios A à I. |
| `docs/analytics-ga4.md` | Ce document. |
| `docs/politique-confidentialite-structure.md` | Plan d'une page de confidentialité, avec les informations manquantes. Non publié. |

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
| `tests/aventure.e2e.mjs` | Le menu pause compte une entrée de plus (« COOKIES »). |
| `package.json` | `consent.test.mjs` et `analytics.test.mjs` ajoutés à `npm test`, nouveau script `test:analytics`. |

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
| Retrait | Voir [Retrait du consentement](#retrait-du-consentement). |
| Accord relu à chaque envoi | `Analytics.event()` relit le choix au moment d'envoyer. Un accord expiré, ou retiré sans que la page le sache, coupe la collecte à cet instant. |
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

### Retrait du consentement

Au retrait (panneau de préférences, autre onglet, ou accord arrivé à expiration) :

1. `window['ga-disable-G-XYZG9XXTCH'] = true` : `gtag.js` n'enregistre plus aucun événement.
2. Les appels de collecte encore en attente sont arrêtés. `gtag.js` regroupe ses envois pendant
   quelques secondes et les expédie au plus tard quand on quitte la page ; `ga-disable` ne vide
   pas ce lot. `js/analytics.js` intercepte donc `fetch` et `sendBeacon` vers les serveurs de
   collecte de Google tant que le retrait est en vigueur. Sans cela, les tests montraient un
   événement `scroll` envoyé juste après un retrait.
3. Le consentement transmis à `gtag.js` repasse à `denied`.
4. Les cookies `_ga` et `_ga_*` sont supprimés, sur le chemin `/` et pour chaque domaine où
   `gtag.js` a pu les poser : `.arphandrame.fr`, `.www.arphandrame.fr`, et l'hôte seul.
5. Aux pages suivantes, rien n'est chargé.

Un nouvel accord sur la même page rouvre la collecte sans recharger `gtag.js` ni recompter la
page. Une page reprise par le cache arrière du navigateur relit le choix avant toute chose.

Limites techniques, à connaître :

- **Les données déjà reçues par Google ne sont pas effacées.** Rien ne permet de le faire depuis
  le navigateur. Une suppression se demande dans GA4 (Admin → Demandes de suppression de
  données) ou via les réglages de conservation.
- Le site ne peut supprimer que les cookies qu'il peut lire. Les cookies `_ga` posés par
  `gtag.js` le sont (ni `HttpOnly`, ni tiers). Un cookie posé autrement, par exemple par un
  serveur, ne le serait pas ; le site n'en pose aucun.
- L'interception du lot en attente couvre `fetch` et `sendBeacon`, les deux moyens d'envoi
  observés. Si une future version de `gtag.js` en utilisait un autre, le test « retrait puis
  départ immédiat » le signalerait.
- Un événement déjà parti sur le réseau au moment du clic ne peut pas être rattrapé.

### Durées

| Élément | Durée | Où c'est réglé | Vérifié |
|---|---|---|---|
| Choix du visiteur (accord ou refus) | 182 jours, puis redemandé | `MAX_AGE_DAYS` dans `js/consent.js` | Tests unitaires et test navigateur (accord expiré) |
| Cookies `_ga` et `_ga_XYZG9XXTCH` | 395 jours à partir du dépôt, sans prolongation aux visites suivantes | `COOKIE_MAX_AGE`, `cookie_update: false` dans `js/analytics.js` | Lu dans Chrome : 395,0 jours pour les deux, inchangé après une autre page |
| Données dans GA4 | Selon le réglage du compte | Admin → Conservation des données | Non vérifiable depuis le code |

Le consentement est redemandé dans trois cas : au bout de 182 jours, quand `VERSION` change dans
`js/consent.js` (à incrémenter si vous ajoutez une finalité ou un outil), ou quand le visiteur
efface les données du site.

Ces durées ne valent pas conformité à elles seules. La CNIL attend aussi une information
complète, un refus aussi simple que l'accord, et une conservation des données proportionnée
côté Google. Deux précisions :

- Certains navigateurs raccourcissent d'eux-mêmes les cookies posés en JavaScript (Safari : 7
  jours ; Chrome plafonne à 400 jours). La durée réelle peut donc être plus courte que 395 jours,
  jamais plus longue.
- 13 mois pour les cookies et 6 mois pour le choix sont les repères que j'attribue aux
  recommandations de la CNIL. La page consultée pendant ce travail n'en donne pas le détail :
  vérifiez-les à la source avant de les citer dans une page de confidentialité.

### Exemption de consentement

Non activée. La CNIL exempte certains outils de mesure d'audience sous conditions strictes.
Google Analytics dans sa configuration standard n'est pas présenté ici comme exempté, et le site
reste sur le modèle du consentement préalable.

## Événements

| Événement | Déclenchement | Paramètres |
|---|---|---|
| `page_view` | Une fois par page, à l'initialisation de GA4. Aussi au retour arrière servi par le cache du navigateur. Jamais pour une page seulement préchargée. | Adresse et page d'origine filtrées |
| `form_start` | Première saisie dans un formulaire (pas au simple focus). Une fois par formulaire et par page. | `form_type`, `site_mode` |
| `generate_lead` | Quand EmailJS confirme l'envoi. Jamais au clic sur « Envoyer », jamais sur un formulaire invalide ou un envoi échoué. | `form_type`, `site_mode` |
| `contact_click` | Clic sur un lien `mailto:`, `tel:`, `sms:`, sur Gmail ou Outlook dans la fenêtre de contact, sur un bouton « Copier » ou sur le profil LinkedIn. | `method`, `link_type`, `site_mode` |

Aucune valeur monétaire n'est envoyée avec `generate_lead` : il n'existe pas d'estimation fiable
de ce que vaut une demande.

Les quatre formulaires (contact classique, contact du mode aventure, devis, mini-jeu) passent par
le même `ContactForm.sendForm()`. `generate_lead` est émis dans la suite de la promesse EmailJS,
donc seulement après une réponse positive.

### Ce qui peut partir chez Google

Tout est filtré dans `js/analytics.js`, par des fonctions testées une à une
(`tests/analytics.test.mjs`).

| Donnée | Filtre | Règle |
|---|---|---|
| Adresse de la page (`page_location`) | `cleanUrl` | Chemin seul. Le fragment (`#…`) et tous les paramètres sont retirés, sauf ceux de la liste ci-dessous. Un chemin inattendu devient `/`. La page 404 envoie toujours `/404`. |
| Paramètres de campagne | `cleanQuery` | Liste d'autorisation : `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_id`. `utm_term` est exclu (mots saisis dans un moteur de recherche). Chaque valeur doit être un mot-clé de 50 caractères au plus (lettres, chiffres, `.`, `_`, `-`) ; sinon le paramètre est retiré. |
| Page d'origine (`page_referrer`) | `cleanReferrer` | Même site : chemin seul. Autre site : domaine seul. |
| Titre de la page | Aucun filtre nécessaire | Les titres sont fixes. Seule la page Tarifs change le sien, avec des libellés prédéfinis (« Recherche », nom d'une catégorie), jamais le texte cherché. |
| Événements du site | `safeEvent` | Liste fermée : trois noms d'événement, quatre paramètres, et pour chacun une liste de valeurs. Un nom inconnu, un paramètre manquant ou une valeur hors liste, et l'événement n'est pas envoyé. Un paramètre en trop est retiré. |
| Adresse contenant une donnée personnelle | `looksPersonal` | Si l'adresse réelle de la page contient un `@` ou un numéro de téléphone français, **la page n'est pas mesurée du tout**. Raison : `gtag.js` lit aussi l'adresse réelle pour ses événements automatiques, hors de portée des filtres ci-dessus. |

Valeurs des paramètres : `form_type` (`contact`, `devis`), `site_mode` (`classique`, `aventure`),
`method` (`email`, `phone`, `sms`, `linkedin`), `link_type` (`app`, `webmail`, `copy`, `profile`).

**Liens de contact.** `contact_click` déduit le moyen de contact de la forme du lien et n'envoie
ni son adresse, ni le destinataire, ni l'objet, ni le corps. Mais la mesure améliorée de GA4,
tant qu'elle est active, envoie d'elle-même l'adresse complète de tout lien sortant cliqué. Pour
Gmail et Outlook, cette adresse contient l'objet du message, et depuis la page Tarifs le texte que
le visiteur a tapé dans la recherche. Le code empêche donc ces clics d'atteindre l'écouteur de
`gtag.js` (`js/analytics-events.js`, fin du fichier). Le lien s'ouvre normalement. Les tests
confirment qu'aucun événement `click` automatique ne part plus pour ces liens. Cette protection
dépend du fonctionnement interne de `gtag.js` : le réglage dans GA4 reste nécessaire.

**Redirections.** Les redirections de `_redirects` sont fixes. Les deux redirections en
JavaScript (anciens liens `#…` de l'accueil et du profil) se font avant le chargement de la
mesure et ne transmettent rien.

**Ce que le code ne maîtrise pas.** Les événements automatiques de la mesure améliorée (`scroll`,
`form_start`, `click`, téléchargements) sont construits par Google. Constaté pendant les tests :
le `form_start` automatique contient le nom technique du premier champ (`client_prenom`, pas sa
valeur) et l'adresse réelle de la page. D'où la règle « page non mesurée » ci-dessus, et les
réglages à faire dans GA4.

### Dédoublonnage

- Double clic ou double appel : un envoi déjà en cours pour le même formulaire est réutilisé,
  donc un seul e-mail et un seul `generate_lead`.
- Nouvelle tentative après un échec : l'échec n'émet rien, la tentative réussie émet un seul
  `generate_lead`.
- Rechargement : la confirmation s'affiche sans changer de page ni d'adresse, et rien n'est
  rejoué au rechargement.
- `gtag.js` n'est injecté qu'une fois par page, quel que soit le nombre de changements de choix.
- Deux demandes réellement envoyées l'une après l'autre comptent pour deux : c'est voulu.

## Configuration dans Google Analytics

Rien de ce qui suit n'a été fait : ce travail n'a pas accès à votre compte Google. Les libellés
de l'interface évoluent, cherchez l'équivalent s'ils ont changé.

### 1. Mesure améliorée (à faire en premier)

Admin → Flux de données → votre flux Web → Mesure améliorée (roue dentée).

**Ces réglages se font uniquement dans l'interface de Google Analytics. Ils n'ont pas été
modifiés par ce travail**, et le code ne peut pas les modifier. Les tests du 12 octobre 2026
montrent que la mesure améliorée est active sur ce flux : GA4 envoie de lui-même `scroll`,
`click`, `form_start` et `user_engagement`.

| Option | Réglage à faire | Pourquoi |
|---|---|---|
| Interactions avec les formulaires | **Désactiver** | GA4 envoie son propre `form_start`, qui s'ajoute au nôtre : doublon constaté sur le devis. Il enverrait aussi un `form_submit` au clic, avant toute confirmation d'envoi. |
| Clics sortants | **Désactiver** | L'événement `click` transmet l'adresse complète du lien cliqué. Le code bloque déjà ce cas pour les liens de contact, mais cette protection repose sur le fonctionnement interne de `gtag.js`. `contact_click` couvre ces clics sans rien exposer. |
| Modifications de page selon l'historique du navigateur | Désactiver par précaution | Aucun doublon constaté pendant les tests, mais plusieurs pages modifient l'adresse sans recharger. |
| Recherche sur le site | Désactiver | Sans objet (la recherche des tarifs ne passe pas par l'adresse), et évite toute capture de texte saisi si cela changeait. |
| Défilement, téléchargements de fichiers | Au choix | Les téléchargements comptent les ouvertures du CV. |

Pour vérifier après coup : relancer `npm run test:analytics`. La ligne « INFO événements
automatiques » ne doit plus citer `form_start` ni `click`, et l'avertissement doit disparaître.

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

### Résultats du 12 octobre 2026 (après l'audit de confidentialité)

- `npm test` : réussi. Il inclut les règles de consentement et les filtres de `js/analytics.js`.
- `npm run build` : réussi, les trois scripts sont présents et versionnés dans les 12 pages.
- `test:analytics` sur le site construit (`vite preview`) : **217 vérifications réussies, 0 échec**.
  Même résultat sur le serveur de développement.
- `test:e2e` (mode aventure, suite existante) : 120 sur 120, console sans erreur.

| Scénario | Vérifié |
|---|---|
| A. Première visite | Bandeau affiché, aucun choix enregistré, `gtag.js` absent, aucun appel vers Google, aucun cookie `_ga`, y compris après défilement, navigation, ouverture puis fermeture du panneau. Case non précochée. Boutons refuser et accepter de même taille et de même style. |
| B. Refus | Bandeau retiré, refus conservé au rechargement et d'une page à l'autre, aucun appel vers Google. |
| C. Acceptation | `gtag.js` chargé une fois, une `page_view` par page, adresse réduite au chemin et aux `utm_*` autorisés, `/404` fixe, signaux publicitaires refusés, `contact_click` pour e-mail, téléphone et webmail. |
| D. Retrait | État mis à jour, `ga-disable` posé, cookies supprimés, plus aucun appel de collecte, retrait conservé à la visite suivante, nouvel accord pris en compte tout de suite. Avec un refus, un formulaire envoyé avec succès ne déclenche aucun appel vers Google. |
| E. Formulaires classiques | Contact et devis : formulaire vide ou invalide, puis envoi refusé par le service, sans `generate_lead`. Envoi réussi : un seul `generate_lead`, même avec deux soumissions d'affilée. Pas de nouveau lead au rechargement. |
| F. Qualité | Console sans erreur sur 11 pages, en refus et en accord. Mobile 360 px : bandeau et panneau dans l'écran. Clavier : premier arrêt sur « Tout refuser », focus dans le panneau, Échap le ferme, focus rendu au lien d'ouverture. |
| G. Confidentialité | Paramètres de campagne invalides ou hors liste absents de tous les appels. Trois adresses contenant un e-mail ou un téléphone : page non mesurée. Page d'origine réduite au chemin. Liens Gmail, Outlook et `mailto:` ouverts depuis une recherche sur la page Tarifs : ni le texte cherché, ni l'objet, ni le corps, ni l'adresse du lien, ni le destinataire dans aucun appel, et aucun `click` automatique. Événement à valeur libre ou à nom inconnu : refusé. |
| H. Retrait, compléments | Durée des cookies lue dans Chrome : 395 jours, non prolongée. Cookies effacés au retrait. Retrait suivi d'un départ immédiat : aucun envoi différé. Nouvel accord sur la même page, puis accords et retraits répétés : une seule balise, une seule page vue. Accord retiré ou expiré à l'insu de la page : événement non envoyé. Retour arrière, simulé et réel (page reprise en mémoire par Chrome) : choix relu, rien d'envoyé après un refus. |
| I. Mode aventure et mini-jeu | Pour chacun : formulaire vide ou invalide, puis échec EmailJS, sans `generate_lead`. Nouvelle tentative réussie avec double envoi : un e-mail, un `generate_lead`, un `form_start`. `site_mode=aventure`. Accord retiré pendant l'envoi : l'e-mail part, aucun appel vers Google. Aucune donnée saisie transmise. |

Bilan sur l'ensemble du passage : aucune des données de test saisies (nom, e-mail, téléphone,
message) dans aucun appel, événements automatiques de Google compris.

Écart qui subsiste : le `form_start` automatique de GA4, en double du nôtre. Il vient du réglage
de la propriété et disparaîtra une fois « Interactions avec les formulaires » désactivé.

Problèmes trouvés par ces tests et corrigés dans le code :

- un événement `scroll` partait juste après un retrait (lot en attente de `gtag.js`) ;
- l'adresse complète des liens Gmail et Outlook, avec l'objet et le texte cherché, partait dans
  l'événement `click` automatique ;
- les paramètres `utm_*` étaient gardés sans contrôle de leur valeur ;
- la page d'origine était transmise avec ses paramètres ;
- un retour arrière vers une page jamais mesurée aurait compté deux pages vues (repéré à la
  relecture du code, pas par un test).

### Non testé

- La réception réelle des événements dans votre propriété (les appels étaient interceptés).
- La page 404 servie par Cloudflare pour une adresse inconnue (testée ici en ouvrant
  `404.html` directement).
- Les pages préchargées (`speculationrules`) : le code les traite, sans test automatique.
- La suppression des cookies sur le domaine `.arphandrame.fr` : en local, `gtag.js` les pose sur
  `localhost`. La liste des domaines essayés est testée, pas l'effacement réel en production.
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
7. Rouvrir « Cookies », désactiver la mesure, enregistrer : les cookies `_ga` disparaissent
   (onglet Application, domaine `.arphandrame.fr`) et plus aucune requête `collect` ne part, y
   compris en quittant la page aussitôt.
8. Ouvrir une adresse qui n'existe pas : la page vue doit porter `/404`.
9. Ouvrir `https://arphandrame.fr/tarifs?email=test@example.com` avec la mesure acceptée :
   aucune requête vers Google sur cette page.
10. Sur la page Tarifs, chercher un mot sans résultat, cliquer « Me contacter » puis « Gmail » :
    la seule requête `collect` porte `en=contact_click`, sans adresse de lien.
11. Après les réglages de mesure améliorée, vérifier dans DebugView qu'il n'y a plus qu'un
   `form_start` par formulaire.

## Limites et décisions à valider

1. **Pas de page d'information.** Voir `docs/politique-confidentialite-structure.md` pour un
   plan et la liste des informations à fournir. Le site n'a ni politique de confidentialité ni
   mentions légales. Le panneau de préférences donne l'essentiel (finalité, prestataire, durée, retrait),
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
   `form_start` en double, et l'adresse des liens sortants autres que les liens de contact.
6. **Données déjà collectées.** Le retrait n'efface rien chez Google. Si un visiteur demande la
   suppression de ses données, la demande se traite dans GA4, pas sur le site.
7. **Détection des données personnelles dans les adresses.** Elle reconnaît un `@` et les numéros
   de téléphone français. Un nom, une adresse postale ou un numéro étranger dans l'adresse d'une
   page ne seraient pas reconnus. Le site ne produit aucune adresse de ce genre ; le risque vient
   de liens fabriqués par un outil tiers (campagne d'e-mails qui ajouterait un paramètre, par
   exemple).
8. **Autres services tiers.** EmailJS et jsDelivr sont appelés quand un visiteur utilise un
   formulaire. Ils ne déposent pas de traceur de mesure, mais ils reçoivent son adresse IP et,
   pour EmailJS, le contenu du message. Hors du périmètre de la bannière, à mentionner dans la
   page d'information.
9. **Si une Content Security Policy est ajoutée un jour**, autoriser
   `https://www.googletagmanager.com` (`script-src`) et `https://*.google-analytics.com`,
   `https://*.analytics.google.com`, `https://www.googletagmanager.com` (`connect-src`,
   `img-src`).

## Sources consultées

- CNIL, « Cookies et traceurs : que dit la loi ? » : <https://www.cnil.fr/fr/cookies-et-autres-traceurs/regles/cookies/que-dit-la-loi>
- Google, « Consent mode overview » : <https://developers.google.com/tag-platform/security/concepts/consent-mode>
- Google Analytics, aide sur les événements clés : <https://support.google.com/analytics/answer/9267568?hl=fr>
