#!/bin/sh
# Photographie les 6 écrans de stories.html en PNG 1080×1920 (Google Chrome requis).
#   sh instagram/stories/render.sh
cd "$(dirname "$0")" || exit 1
CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
i=1
for name in projets-01-site projets-02-islaah projets-03-skywalk echange-offert methode contact; do
  "$CHROME" --headless=new --hide-scrollbars --force-device-scale-factor=1 --window-size=1080,1920 \
    --virtual-time-budget=8000 --screenshot="$PWD/$name.png" "file://$PWD/stories.html?s=$i" >/dev/null 2>&1
  echo "$name.png"
  i=$((i+1))
done
