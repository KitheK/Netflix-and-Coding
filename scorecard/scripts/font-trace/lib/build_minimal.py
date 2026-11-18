"""Build a minimal display font (A–Z + space) from traced.json — OFL-friendly custom pack."""
from __future__ import annotations

import json
import string
import sys
from pathlib import Path

import pathops
from fontTools.fontBuilder import FontBuilder
from fontTools.pens.cu2quPen import Cu2QuPen
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.pens.transformPen import TransformPen

ROOT = Path(__file__).resolve().parent
PAL_SRC = ROOT.parent / "paleologue" / "src"
sys.path.insert(0, str(PAL_SRC))
from geomutil import to_path  # noqa: E402

UPM = 1000
CAP = 700


def glyph_pen(contours):
    p = to_path(contours)
    p = pathops.Path(p) if not isinstance(p, pathops.Path) else p
    p.simplify(fix_winding=True)
    pen = TTGlyphPen(None)
    q = Cu2QuPen(pen, max_err=1.0)
    p.draw(q)
    return pen.glyph()


def build_font(traced_path: Path, family: str, ps_name: str, out_ttf: Path) -> None:
    data = json.loads(traced_path.read_text())
    fb = FontBuilder(UPM, isTTF=True)
    fb.setupGlyphOrder([".notdef", "space"] + list(string.ascii_uppercase))
    glyphs = {".notdef": TTGlyphPen(None).glyph(), "space": TTGlyphPen(None).glyph()}
    advance = 620
    for ch in string.ascii_uppercase:
        if ch not in data:
            raise SystemExit(f"Missing traced glyph: {ch}")
        glyphs[ch] = glyph_pen(data[ch]["contours"])
    fb.setupGlyf(glyphs)
    fb.setupHorizontalMetrics({g: (advance if g != "space" else 280, 0) for g in glyphs})
    fb.setupHorizontalHeader(ascent=900, descent=-200)
    cmap = {ord(g): g for g in glyphs if len(g) == 1}
    fb.setupCharacterMap(cmap)
    fb.setupNameTable(
        {
            "familyName": family,
            "styleName": "Regular",
            "uniqueFontIdentifier": f"{ps_name} 1.000",
            "fullName": f"{family} Regular",
            "psName": ps_name,
        }
    )
    fb.setupOS2(sTypoAscender=750, sTypoDescender=-200, usWinAscent=950, usWinDescent=260)
    fb.setupPost()
    fb.save(out_ttf)
    print(f"Wrote {out_ttf}")


def to_woff2(ttf: Path, woff2: Path) -> None:
    from fontTools.ttLib import TTFont

    font = TTFont(ttf)
    font.flavor = "woff2"
    font.save(woff2)
    print(f"Wrote {woff2}")


if __name__ == "__main__":
    import argparse

    ap = argparse.ArgumentParser()
    ap.add_argument("traced", type=Path)
    ap.add_argument("--family", required=True)
    ap.add_argument("--ps-name", required=True)
    ap.add_argument("-o", "--out-dir", type=Path, default=Path("."))
    args = ap.parse_args()
    stem = args.ps_name
    ttf = args.out_dir / f"{stem}.ttf"
    woff2 = args.out_dir / f"{stem}.woff2"
    build_font(args.traced, args.family, args.ps_name, ttf)
    to_woff2(ttf, woff2)