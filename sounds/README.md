# sounds/ — Effets sonores (SFX) du portfolio

Dossier dédié aux petits effets sonores du mini-jeu. La musique de fond
reste, elle, dans `assets/audio/bg-music.mp3` (inchangée).

## Fichiers attendus

| Fichier            | Déclenché quand…                                              |
|--------------------|--------------------------------------------------------------|
| `click.mp3`        | Clic sur un bouton important (C'est parti, liens accueil…)   |
| `open.mp3`         | Réouverture d'une section déjà visitée                        |
| `close.mp3`        | Fermeture d'une fenêtre / retour à l'accueil                  |
| `transition.mp3`   | Entrée dans une nouvelle pièce (maison jamais visitée)        |
| `success.mp3`      | Ouverture d'un projet, message de contact envoyé              |

## Recommandations

- Format : `.mp3` (compatibilité Chrome / Safari / Firefox, desktop + mobile).
- Durée : très court, 80–400 ms. Style pixel-art / 8-bit, discret.
- Poids : quelques Ko chacun. Éviter les fichiers lourds : ils sont préchargés.
- Volume déjà géré côté code (SFX ~40–60 %, sous la musique) — pas besoin de
  normaliser fort à la production.

## Ajouter / retirer un son

Tout passe par `js/audio.js` (objet `CONFIG.sfx`). Poser le fichier ici avec le
bon nom suffit. Si un fichier est absent, le système le détecte et reste
silencieux pour ce son : **aucune erreur JavaScript**, le reste fonctionne
normalement.
