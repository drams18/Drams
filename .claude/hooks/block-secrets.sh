#!/usr/bin/env bash
# PreToolUse hook (Write|Edit|MultiEdit) : bloque l'écriture de secrets probables dans le dépôt
# et l'écriture de fichiers .env réels. Code de sortie 2 = blocage, le message stderr est renvoyé à Claude.
set -euo pipefail

payload="$(cat)"
file_path="$(printf '%s' "$payload" | jq -r '.tool_input.file_path // ""')"
content="$(printf '%s' "$payload" | jq -r '[.tool_input.content, .tool_input.new_string, (.tool_input.edits // [] | map(.new_string) | join("\n"))] | map(select(. != null)) | join("\n")')"

base="$(basename "$file_path")"
if [[ "$base" == ".env" || "$base" == .env.* && "$base" != ".env.example" ]]; then
  echo "Bloqué : les fichiers .env réels ne doivent pas être écrits par Claude. Utilisez .env.example (valeurs factices)." >&2
  exit 2
fi

patterns=(
  'AKIA[0-9A-Z]{16}'                          # clé d'accès AWS
  '-----BEGIN [A-Z ]*PRIVATE KEY-----'        # clé privée PEM
  'gh[pousr]_[A-Za-z0-9]{36,}'                # jeton GitHub
  'xox[baprs]-[A-Za-z0-9-]{10,}'              # jeton Slack
  'sk_live_[A-Za-z0-9]{16,}'                  # clé Stripe live
  'SG\.[A-Za-z0-9_-]{22}\.[A-Za-z0-9_-]{43}'  # clé SendGrid
  'xkeysib-[a-f0-9]{64}'                      # clé Brevo
)
for p in "${patterns[@]}"; do
  if printf '%s' "$content" | grep -Eq -- "$p"; then
    echo "Bloqué : contenu ressemblant à un secret (motif « $p ») dans $file_path. Utilisez une variable d'environnement et une valeur factice dans .env.example." >&2
    exit 2
  fi
done
exit 0
