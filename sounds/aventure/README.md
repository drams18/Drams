# Musiques du mode aventure

Un fichier par univers, lu en boucle quand le son est activé :

| Fichier     | Univers       | Esprit recherché                                   |
|-------------|---------------|----------------------------------------------------|
| `ville.mp3` | VILLE         | piano élégant, posé, un rien de mystère            |
| `hero.mp3`  | HAUTE VOLTIGE | fanfare de cuivres lumineuse, pulsation électrique |
| `club.mp3`  | LE PALAIS     | orgue, chœurs, cordes lentes, solennel             |

Tant qu'un fichier manque, l'ambiance synthétisée de l'univers joue à sa place.

- Format : MP3, 128 à 160 kb/s, de préférence un morceau qui boucle proprement.
- Volume : `trackGain` dans `src/aventure/universes/<id>/theme.js` (0.5 par défaut).
- Droits : uniquement des morceaux sous licence ou libres de droits. Si la
  licence demande un crédit (CC BY), l'ajouter au site.
