#!/usr/bin/env bash
# Screenshot this repo's landing page and app.
#
#   scripts/shot.sh app        # -> docs/assets/app-desktop.png, app-mobile.png
#   scripts/shot.sh landing    # -> docs/assets/landing-desktop.png, landing-mobile.png
#   scripts/shot.sh all
#
# The real work is in shot.py: the landing page embeds the app in a same-origin
# iframe, and from file:// that iframe never paints in headless Chromium — so
# the repo is served over a throwaway local HTTP server for the shot instead.
set -euo pipefail
exec python3 "$(dirname "${BASH_SOURCE[0]}")/shot.py" "${1:-all}"
