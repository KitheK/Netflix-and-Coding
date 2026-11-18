#!/usr/bin/env bash
# Rebuild Libretto Paléologue from the source renders. Needs: python3 numpy opencv pillow fonttools skia-pathops brotli potracer
set -euo pipefail
cd "$(dirname "$0")"
export PYTHONPATH=src
mkdir -p work dist specimens
cp sources/caps-specimen-approved.jpg work/sheet-caps.jpg
cp sources/lowercase-render-mulier-style.jpg work/sheet-lower.jpg
cp sources/figures-punct-render.jpg work/sheet-figs.jpg
cp sources/pal-standard-crop.png work/poster-standard.png
python3 src/trace.py      # segment + potrace + Schneider refit -> work/traced.json
python3 src/build.py      # glyph assembly, spacing, kerning, features -> dist/LibrettoPaleologue-Regular.{ttf,woff2}
python3 src/colr.py       # COLRv0 poster family -> dist/LibrettoPaleologuePoster-Regular.{ttf,woff2}
python3 src/specimen.py   # specimens/*.png
