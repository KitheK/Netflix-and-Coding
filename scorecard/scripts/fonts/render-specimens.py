#!/usr/bin/env python3
"""Render pack specimen PNGs for docs/PR."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "public/previews/fonts"
FONTS = ROOT / "public/fonts"


def load_font(path: Path, size: int):
    try:
        return ImageFont.truetype(str(path), size)
    except OSError:
        return ImageFont.load_default()


def specimen_ms():
    img = Image.new("RGB", (800, 360), (251, 251, 251))
    d = ImageDraw.Draw(img)
    d.rectangle((16, 16, 784, 344), outline=(225, 225, 225))
    lit = load_font(FONTS / "catalog/literata.woff2", 42)
    dep = load_font(FONTS / "DepartureMono-Regular.woff2", 14)
    d.text((40, 40), "How touch screens work", fill=(0, 0, 0), font=lit)
    d.text((40, 110), "The electrodes are laid out on a grid...", fill=(16, 16, 16), font=load_font(FONTS / "catalog/literata.woff2", 20))
    d.text((40, 200), "WORDS 3500 · DAN HOLLICK", fill=(102, 102, 102), font=dep)
    d.text((40, 240), "FIG_001", fill=(16, 61, 255), font=dep)
    d.text((40, 300), "making-software pack · Literata + Departure", fill=(120, 120, 120), font=dep)
    img.save(OUT / "pack-making-software.png")


def specimen_picker():
    img = Image.new("RGB", (800, 420), (251, 251, 251))
    d = ImageDraw.Draw(img)
    y = 24
    d.text((24, y), "Per-role font picker", fill=(0, 0, 0), font=load_font(FONTS / "SourceSans3-Variable.woff2", 22))
    y += 48
    for label, text, font_path, size in [
        ("Display", "Project Guide", FONTS / "LibrettoPaleologuePoster-Regular.woff2", 28),
        ("Body", "Scorecard manual prose.", FONTS / "Newsreader-Variable.woff2", 18),
        ("Mono", "FIG_001 · npm test", FONTS / "DepartureMono-Regular.woff2", 14),
    ]:
        d.text((24, y), label, fill=(102, 102, 102), font=load_font(FONTS / "SourceSans3-Variable.woff2", 12))
        y += 20
        d.rectangle((24, y, 776, y + 48), outline=(208, 208, 208))
        d.text((36, y + 12), text, fill=(0, 0, 0), font=load_font(font_path, size))
        y += 64
    img.save(OUT / "pack-role-picker.png")


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    specimen_ms()
    specimen_picker()
    print("wrote specimens")