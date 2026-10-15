---
name: verify
description: Lance la vérification complète du dépôt Hearth (tests backend avec Testcontainers, tests et build Angular) et résume les résultats réels. À utiliser en fin de tâche ou de phase, ou quand l'utilisateur demande de « tout vérifier ».
---

# Vérification complète Hearth

1. Vérifier que Docker répond : `docker info --format '{{.ServerVersion}}'`. S'il ne répond pas, le signaler
   (les tests d'intégration Testcontainers ne peuvent pas tourner) au lieu de les sauter silencieusement.
2. Backend :
   ```bash
   export JAVA_HOME=/opt/homebrew/opt/openjdk@21
   cd backend && ./mvnw -q verify
   ```
   En cas d'échec, lire les rapports `*/target/surefire-reports/*.txt` et `failsafe-reports`, chercher la
   cause racine, corriger, relancer. Ne jamais ajouter `@Disabled` ni `-DskipTests`.
3. Frontend :
   ```bash
   cd frontend && npm run lint && npm run lint:format && npm run test:ci && npm run build
   ```
4. Si la stack tourne (`docker compose --profile app up -d --build`) : `scripts/smoke-test.sh` puis
   `cd frontend && E2E_BASE_URL=http://localhost:8080 npm run e2e`. Sinon, le dire explicitement.
5. Résumer : nombre de tests exécutés/échoués par module (chiffres réels issus de la sortie), avertissements
   notables, prochaines actions.
