# Configuration Claude Code du dépôt

| Fichier | Rôle |
|---|---|
| `settings.json` | Permissions partagées (versionnées) : autorise les opérations courantes de développement dans le dépôt (édition des dossiers du projet, Maven wrapper, npm, Docker Compose, git local, `terraform validate`), demande confirmation pour `git push`, `terraform plan`, `kubectl apply/delete`, `rm -rf`, `docker compose down -v`, et **interdit** `terraform apply/destroy`, la CLI `aws`, les `push --force` et la lecture des `.env`/clés. Déclare aussi le hook ci-dessous. |
| `hooks/block-secrets.sh` | Hook `PreToolUse` sur Write/Edit : bloque l'écriture d'un fichier `.env` réel et de contenus ressemblant à des secrets (clés AWS, clés privées, jetons GitHub/Slack/Stripe/SendGrid/Brevo). Nécessite `jq`. |
| `skills/verify/SKILL.md` | Procédure de vérification complète (backend + frontend) avec résumé des résultats réels. |
| `skills/close-phase/SKILL.md` | Procédure de clôture de phase et mise à jour de la roadmap. |
| `settings.local.json` | (non versionné) préférences personnelles ; ignoré par Git. |

Ces fichiers **ne remplacent pas** les permissions effectives : les politiques gérées et les réglages
utilisateur de Claude Code restent prioritaires. Les opérations sensibles (déploiement, ressources payantes,
secrets réels, emails réels, suppression massive) doivent toujours être validées par l'utilisateur.
