# Font trace scripts

| Path | Role |
|------|------|
| `trace_pack.py` | Kit entry: caps sheet → `font-packs/<packId>/` |
| `lib/trace_caps.py` | Segment + potrace + curve refit |
| `lib/build_minimal.py` | fontTools WOFF2 (A–Z display) |
| `lib/specimen_preview.py` | Simple PNG preview |
| `paleologue/` | Full Libretto Paléologue rebuild (`./build.sh`) |
| `requirements.txt` | Python deps |

Invoked by `npx scorecard-kit fonts trace` — see [`docs/fonts/trace-pipeline.md`](../../docs/fonts/trace-pipeline.md).