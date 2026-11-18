"""Render a simple A–Z specimen PNG for a freshly built TTF."""
from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


def render_specimen(ttf: Path, out_png: Path, sample: str = "ABCDEFGHIJKLMNOPQRSTUVWXYZ") -> None:
    w, h = 1200, 320
    img = Image.new("RGB", (w, h), (251, 251, 251))
    draw = ImageDraw.Draw(img)
    draw.rectangle((24, 24, w - 24, h - 24), outline=(208, 208, 208), width=1)
    font = None
    try:
        font = ImageFont.truetype(str(ttf), 64)
    except OSError:
        font = ImageFont.load_default()
    rows = [sample[:13], sample[13:26]]
    y = 80
    for row in rows:
        draw.text((48, y), row, fill=(17, 17, 17), font=font, spacing=12)
        y += 100
    draw.text((48, 24), ttf.stem, fill=(102, 102, 102), font=ImageFont.load_default())
    out_png.parent.mkdir(parents=True, exist_ok=True)
    img.save(out_png)
    print(f"Wrote {out_png}")