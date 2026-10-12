# Page de confidentialité : proposition de structure

**Ceci est un plan de travail, pas une politique de confidentialité.** Rien ici n'est publié sur
le site. Chaque `[À COMPLÉTER]` est une information qui n'existe pas dans le projet et que vous
seul pouvez fournir. Tant qu'il en reste, le texte ne doit pas être mis en ligne comme document
définitif. Une relecture par un juriste ou par votre interlocuteur habituel est conseillée, en
particulier pour les bases légales et les durées.

Les faits techniques ci-dessous (quels outils, quelles données, quels cookies) viennent du code
du site et sont exacts à la date du 12 octobre 2026. Les mentions juridiques ne sont pas
rédigées : elles dépendent de votre statut.

## Informations manquantes dans le projet

| Information | Pourquoi elle est nécessaire | État |
|---|---|---|
| Identité juridique de l'éditeur : nom, statut (micro-entrepreneur, société…), numéro SIREN / SIRET | Identifier le responsable du traitement ; aussi exigée par les mentions légales | Absente. Le site affiche « Arphan Drame · Développeur web freelance · Île-de-France », et « DevPhantom » comme employeur dans les données structurées. Lequel édite le site n'est écrit nulle part. |
| Adresse postale de contact | Mentions légales, exercice des droits par courrier | Absente |
| Adresse e-mail dédiée aux demandes sur les données | Exercice des droits | Seule `arphandrame0@gmail.com` (contact général) figure dans le projet. À confirmer ou remplacer. |
| Directeur de la publication | Mentions légales | Absent |
| Hébergeur : raison sociale, adresse, téléphone | Mentions légales | Le projet indique seulement « Cloudflare Pages ». Les coordonnées légales de l'entité Cloudflare concernée ne sont pas dans le projet. |
| Bases légales retenues pour chaque traitement | Information obligatoire | Non décidées (propositions à valider plus bas) |
| Durée de conservation des messages reçus | Information obligatoire | Non définie : combien de temps gardez-vous les e-mails de contact et de devis ? |
| Durée de conservation réglée dans GA4 | Information obligatoire | Non vérifiable depuis le code (Admin → Conservation des données) |
| Contrats avec les prestataires | Sous-traitance (article 28 du RGPD) | Non vérifiable : conditions acceptées chez Google, EmailJS, Cloudflare |
| Compte EmailJS : où sont stockés les messages, combien de temps | Information sur les destinataires et les transferts | Non vérifiable depuis le code (réglage « historique » du compte EmailJS) |
| Transferts hors Union européenne et leurs garanties | Information obligatoire | À établir pour chaque prestataire à partir de leurs documents |
| Délégué à la protection des données | À mentionner s'il y en a un | Probablement sans objet, à confirmer |

## Structure proposée

### 1. Qui est responsable de vos données
`[À COMPLÉTER : identité juridique, statut, SIREN/SIRET, adresse, e-mail de contact]`

### 2. Les données que le site traite, et pourquoi

Un tableau, une ligne par traitement. Les colonnes « Données » et « Quand » viennent du code ;
les autres sont à valider.

| Traitement | Données | Quand | Base légale | Durée |
|---|---|---|---|---|
| Répondre à un message de contact | Nom, e-mail, message | Envoi du formulaire de contact (mode classique et mode aventure) | `[À VALIDER : par exemple mesures précontractuelles ou intérêt légitime]` | `[À COMPLÉTER]` |
| Étudier une demande de projet | Prénom, nom, e-mail, téléphone (facultatif), message, réponses aux cinq questions (type de projet, profil, besoin, fonctionnalités, budget) | Envoi du formulaire « Construisez votre projet » (formulaire et mini-jeu) | `[À VALIDER]` | `[À COMPLÉTER]` |
| Mesurer l'audience | Pages vues, événements (début de formulaire, demande envoyée, clic sur un moyen de contact), identifiant de cookie, données techniques du navigateur, adresse IP traitée par Google | Seulement après accord dans le bandeau | Consentement | Cookies : 13 mois au plus. Données dans GA4 : `[À COMPLÉTER selon le réglage du compte]` |
| Faire fonctionner le site | Réglages enregistrés dans le navigateur : thème, dernier mode, progression du jeu, brouillon de demande, choix sur les cookies | Dès la visite | Pas de consentement requis (strictement nécessaires) `[À VALIDER]` | Voir section 5 |

À préciser dans le texte : le contenu des formulaires n'est jamais envoyé à Google Analytics.

### 3. Qui reçoit ces données

Faits tirés du code. Les informations sur chaque société (entité contractante, pays, garanties)
sont à reprendre de leurs propres documents.

| Prestataire | Rôle sur le site | Données concernées | À compléter |
|---|---|---|---|
| EmailJS | Achemine les messages des formulaires vers votre boîte e-mail | Tout le contenu des formulaires, adresse IP | `[Entité, pays, durée de stockage chez eux, garanties de transfert]` |
| jsDelivr | Fournit le fichier du SDK EmailJS, chargé quand un visiteur commence un formulaire | Adresse IP, données techniques | `[Entité, pays]` |
| Fournisseur de votre messagerie (Gmail) | Reçoit et conserve les messages | Contenu des formulaires | `[À confirmer]` |
| Google Analytics (Google Ireland Ltd selon la documentation Google) | Mesure d'audience, après accord | Voir section 2 | `[Garanties de transfert hors UE, durée de conservation réglée]` |
| Cloudflare | Hébergement et distribution du site | Adresse IP, journaux techniques | `[Entité, pays, durée des journaux]` |

Le site ne charge aucune police ni aucun script depuis Google en dehors de Google Analytics
après accord (la police Inter est hébergée sur le site).

### 4. Transferts hors de l'Union européenne
`[À COMPLÉTER pour chaque prestataire : pays, mécanisme (décision d'adéquation, clauses contractuelles types…)]`

### 5. Cookies et stockage local

Tableau exact à la date de ce document.

| Nom | Type | Rôle | Durée | Accord requis |
|---|---|---|---|---|
| `drame.consent` | localStorage | Votre choix sur les cookies | 6 mois, puis redemandé | Non |
| `drame.portfolio.mode` | localStorage | Dernier mode utilisé (classique ou aventure) | Jusqu'à effacement | Non |
| `drame.aventure.save` | localStorage | Progression du mode aventure | Jusqu'à effacement | Non |
| `drame.reviews` | localStorage | Rappel discret pour un client invité à laisser un avis | Jusqu'à effacement | Non `[À VALIDER]` |
| `drame.portfolio.theme`, `drame.buildproject`, `drame.classic.from`, `drame.classic.seen`, `drame.aventure.session`, `drame.reviews.session` | sessionStorage | Thème choisi, brouillon de demande, navigation, projets déjà vus, session de jeu | Fermeture de l'onglet | Non |
| `_ga`, `_ga_XYZG9XXTCH` | Cookies | Mesure d'audience Google Analytics | 13 mois au plus | **Oui** |

Expliquer aussi comment changer d'avis : lien « Cookies » en bas de page, entrée « COOKIES »
du menu en mode aventure, ou bouton rond en bas à gauche.

### 6. Vos droits
Accès, rectification, effacement, opposition, limitation, portabilité, retrait du consentement,
directives après décès. `[À COMPLÉTER : comment exercer ces droits, à quelle adresse, sous quel délai vous répondez]`
Mentionner le droit de saisir la CNIL (cnil.fr).

### 7. Sécurité
`[À COMPLÉTER, sobrement : site servi en HTTPS, pas de base de données côté site, accès à la boîte e-mail]`

### 8. Mineurs
`[À COMPLÉTER si pertinent]`

### 9. Modifications de cette page
Date de dernière mise à jour. Si une finalité ou un outil est ajouté, incrémenter `VERSION` dans
`js/consent.js` pour redemander le consentement.

## Mentions légales

Page distincte, ou section de la même page. Elle n'existe pas non plus sur le site.
`[À COMPLÉTER : éditeur, statut, SIREN/SIRET, adresse, contact, directeur de la publication, hébergeur]`

## Une fois la page rédigée

1. La créer comme page du site et l'ajouter à `vite.config.js` (`PAGES`) et au sitemap.
2. Ajouter un lien dans les pieds de page (`index.html`, `footer()` de `scripts/build-classic.mjs`).
3. Ajouter un lien « En savoir plus » dans le bandeau et le panneau de `js/consent.js`.
4. Vérifier que la page elle-même reste lisible sans avoir accepté les cookies.
