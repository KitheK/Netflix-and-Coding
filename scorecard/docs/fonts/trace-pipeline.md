# Font trace pipeline (WS5)

Scorecard can **swap built-in font packs** via `theme.json` → `fontPackId`, and **create new display packs** from a reference specimen sheet (public domain or owned art only).

## Built-in packs

| `packId` | Display | Notes |
|----------|---------|--------|
| `libretto-default` | Libretto Paléologue Poster (+ outline variant in Look) | Default kit stack |
| `editorial-plain` | Newsreader | Same body / UI / mono as Libretto |
| `making-software` | Literata (Arizona Mix substitute) | Departure mono; see `font-packs/making-software/README.md` |

Manifests live in `font-packs/<packId>/manifest.json` (§4.4). Web assets stay in `public/fonts/` or `public/font-packs/`.

### Per-role overrides

Set individual roles without changing the whole pack:

```json
{
  "fontPackId": "libretto-default",
  "fontRoles": { "body": "source-serif-4", "mono": "jetbrains-mono" }
}
```

Use Write → Look for a live preview; ids must appear in `public/fonts/catalog.json`.

## Create a pack from a reference sheet

**Prereqs:** Python 3.10+, `pip install -r scripts/font-trace/requirements.txt`, and a **clean A–Z capitals sheet** (three rows of letters on paper-toned background — see exemplar below).

```bash
npx scorecard-kit fonts trace \
  --reference scripts/font-trace/paleologue/sources/caps-specimen-approved.jpg \
  --pack-id paleologue-caps-demo \
  --label "Paléologue caps demo"
```

This writes the §4.5 tree:

```
font-packs/<packId>/
  manifest.json
  reference.png
  source/traced.json
  <PsName>.woff2
  LICENSE          # OFL from traced output
  specimens/specimen-preview.png
```

and publishes the WOFF2 under `public/font-packs/<packId>/` for the Vite dev server.

Point `content/theme.json` at the new pack:

```json
{ "fontPackId": "paleologue-caps-demo", ... }
```

Run `npx scorecard-kit check` — it validates manifest paths and bundled licences.

## Paléologue exemplar (full pipeline)

The production Libretto Paléologue family (lowercase, figures, COLR poster face, kerning) is reproduced from `scripts/font-trace/paleologue/`:

```bash
cd scripts/font-trace/paleologue
pip install -r ../requirements.txt
./build.sh
```

Stages (also documented in `paleologue/src/`):

1. **segment.py** — ink map + component isolation per sheet row  
2. **trace.py** — potrace + Schneider refit (`work/traced.json`)  
3. **build.py** — fontTools assembly → `dist/LibrettoPaleologue-Regular.woff2`  
4. **colr.py** — COLRv0 poster family  
5. **specimen.py** — PNG specimens  

The **kit CLI trace** path uses the same potrace/refit stack via `lib/trace_caps.py` + `lib/build_minimal.py` for a **caps-only display pack** suitable for new projects without hand-maintaining `applyTheme.ts`.

## Licensing

- Traced outlines from your own or **PD** reference → ship **OFL** in the pack `LICENSE`.  
- Do **not** trace third-party lettering with unclear rights.  
- Bundled Newsreader, Source Sans 3, and Departure Mono keep their existing `public/fonts/*-OFL.txt` files; see `LICENSES/FONTS.txt`.