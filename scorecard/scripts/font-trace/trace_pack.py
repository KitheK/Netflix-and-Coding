#!/usr/bin/env python3
"""Scorecard font trace CLI — reference sheet → §4.5 pack layout + manifest."""
from __future__ import annotations

import argparse
import json
import re
import shutil
import subprocess
import sys
from pathlib import Path

KIT_ROOT = Path(__file__).resolve().parents[2]
LIB = Path(__file__).resolve().parent / "lib"
OFL_TEMPLATE = Path(__file__).resolve().parent / "paleologue" / "OFL.txt"

sys.path.insert(0, str(LIB))


def slugify(name: str) -> str:
    s = re.sub(r"[^a-zA-Z0-9]+", "", name.title())
    return s[:32] or "Display"


def pub_path(pack_id: str, filename: str) -> str:
    return f"/font-packs/{pack_id}/{filename}"


def main() -> None:
    ap = argparse.ArgumentParser(description="Trace a caps specimen into a Scorecard font pack")
    ap.add_argument("--reference", type=Path, required=True, help="Specimen sheet (A–Z, 3 rows)")
    ap.add_argument("--pack-id", required=True, help="Pack id (folder name)")
    ap.add_argument("--label", required=True, help="Human label for manifest")
    ap.add_argument("--family", help="OpenType family name (default from label)")
    ap.add_argument("--rows", type=int, default=3, help="Rows of capitals on the sheet")
    ap.add_argument("--kit-root", type=Path, default=KIT_ROOT)
    ap.add_argument("--skip-publish", action="store_true", help="Do not copy woff2 to public/")
    args = ap.parse_args()

    pack_root = args.kit_root / "font-packs" / args.pack_id
    source_dir = pack_root / "source"
    public_dir = args.kit_root / "public" / "font-packs" / args.pack_id
    source_dir.mkdir(parents=True, exist_ok=True)

    ref_name = "reference.png"
    ref_dest = pack_root / ref_name
    if args.reference.suffix.lower() in {".png", ".jpg", ".jpeg", ".webp"}:
        shutil.copy2(args.reference, ref_dest)
    else:
        raise SystemExit("reference must be .png or .jpg")

    traced = source_dir / "traced.json"
    from trace_caps import trace_caps_sheet

    trace_caps_sheet(ref_dest, traced, args.rows)

    family = args.family or args.label
    ps_name = slugify(family) + "Regular"
    woff_name = f"{ps_name}.woff2"

    from build_minimal import build_font, to_woff2

    ttf = pack_root / f"{ps_name}.ttf"
    woff2 = pack_root / woff_name
    build_font(traced, family, ps_name, ttf)
    to_woff2(ttf, woff2)

    specimens = pack_root / "specimens"
    specimens.mkdir(exist_ok=True)
    try:
        from specimen_preview import render_specimen

        render_specimen(ttf, specimens / "specimen-preview.png")
    except Exception as exc:  # noqa: BLE001
        print(f"specimen preview skipped: {exc}", file=sys.stderr)

    license_dest = pack_root / "LICENSE"
    if OFL_TEMPLATE.is_file():
        text = OFL_TEMPLATE.read_text().replace("Libretto Paléologue", family)
        license_dest.write_text(text)
    else:
        license_dest.write_text("SIL Open Font License 1.1 — replace with traced-family OFL.\n")

    manifest = {
        "schemaVersion": 1,
        "packId": args.pack_id,
        "label": args.label,
        "license": f"font-packs/{args.pack_id}/LICENSE",
        "faces": {
            "display": {"family": family, "woff2": pub_path(args.pack_id, woff_name)},
            "body": {
                "family": "Newsreader",
                "woff2": "/fonts/Newsreader-Variable.woff2",
                "weight": "200 800",
                "style": "normal",
            },
            "ui": {
                "family": "Source Sans 3",
                "woff2": "/fonts/SourceSans3-Variable.woff2",
                "weight": "200 900",
                "style": "normal",
            },
            "mono": {"family": "Departure Mono", "woff2": "/fonts/DepartureMono-Regular.woff2"},
        },
    }
    (pack_root / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")

    if not args.skip_publish:
        public_dir.mkdir(parents=True, exist_ok=True)
        shutil.copy2(woff2, public_dir / woff_name)
        shutil.copy2(pack_root / "manifest.json", public_dir / "manifest.json")
        if (specimens / "specimen-preview.png").is_file():
            shutil.copy2(specimens / "specimen-preview.png", public_dir / "specimen-preview.png")

    print(json.dumps({"packDir": str(pack_root), "manifest": str(pack_root / "manifest.json")}, indent=2))


if __name__ == "__main__":
    main()