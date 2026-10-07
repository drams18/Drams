#!/bin/sh
# Photographie les 6 écrans de stories.html en PNG 1080×1920 et les 4 couvertures de covers.html
# en PNG 1080×1080 (Google Chrome requis).
#   sh instagram/stories/render.sh
cd "$(dirname "$0")" || exit 1
CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
shot() { # shot <page> <hauteur> <noms…>
  page=$1; h=$2; shift 2
  i=1
  for name in "$@"; do
    "$CHROME" --headless=new --hide-scrollbars --force-device-scale-factor=1 --window-size=1080,"$h" \
      --virtual-time-budget=8000 --screenshot="$PWD/$name.png" "file://$PWD/$page?s=$i" >/dev/null 2>&1
    echo "$name.png"
    i=$((i+1))
  done
}
shot stories.html 1920 projets-01-site projets-02-islaah projets-03-skywalk echange-offert methode contact
shot covers.html 1080 couverture-projets couverture-echange-offert couverture-process couverture-contact
