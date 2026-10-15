---
name: close-phase
description: Clôture une phase de la roadmap Hearth - vérifie, met à jour docs/ROADMAP.md en distinguant implémenté/testé/simulé/restant, met à jour README et DECISIONS, puis produit le résumé de fin de phase.
---

# Clôture de phase

1. Exécuter la skill `verify` (tests backend + frontend). Ne pas continuer tant qu'il reste des échecs non
   expliqués.
2. Ouvrir `docs/ROADMAP.md` :
   - `[x]` uniquement si le code existe **et** qu'un test exécuté le couvre ;
   - `[~]` si partiel ou simulé, avec une note courte (ex. « simulé : adaptateur email `log` ») ;
   - ne jamais cocher une fonctionnalité partiellement implémentée.
3. Vérifier que `docs/DECISIONS.md` contient les décisions prises pendant la phase, et que `README.md`
   reflète les commandes de démarrage réelles.
4. Résumé à l'utilisateur :
   - fichiers créés/modifiés (regroupés) ;
   - tests exécutés et résultats réels ;
   - ce qui est opérationnel / simulé / restant ;
   - blocages et prochaine étape concrète.
