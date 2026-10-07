#!/bin/sh
# Photographie les 6 slides de 001-presentation.html en PNG 1080×1350 (Google Chrome requis).
#   sh instagram/001/render.sh
cd "$(dirname "$0")" || exit 1
CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
for i in 1 2 3 4 5 6; do
  "$CHROME" --headless=new --hide-scrollbars --force-device-scale-factor=1 --window-size=1080,1350 \
    --virtual-time-budget=8000 --screenshot="$PWD/001-presentation-$i.png" "file://$PWD/001-presentation.html?s=$i" >/dev/null 2>&1
  echo "001-presentation-$i.png"
done
