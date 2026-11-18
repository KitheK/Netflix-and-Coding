# Scorecard overhaul plan

**Status:** Planning only (this document).  
**Design bar:** [Libretto](https://github.com/KitheK/libretto) — reference source in `uploads/libretto-reference.zip` (extracted for this audit at `libretto-ref/libretto/`) and seven runtime screenshots under `libretto-work/verify/`.  
**Owner intent:** Generated guides must feel like Libretto; onboarding must engage via a local web form; architecture diagrams are mandatory; platform branding stays “Scorecard,” product title is “&lt;Project Name&gt; Guide”; font packs beyond Paléologue + Departure.

---

## 1. Audit — how Scorecard works today

### 1.1 Generation pipeline (agent + JSON)

| Stage | Current behaviour | Primary files |
|--------|-------------------|---------------|
| Launch | Agent reads skill; no kit UI for onboarding. CLI `npx scorecard-kit dev` opens **Write mode** at `/write`, not an interview. | `skills/scorecard/SKILL.md`, `bin/scorecard.js` (`cmdDev` → `/write`) |
| Interview | Markdown script: infer-first, batches of 3–5 **chat** questions; answers should land in `content/interview.json`. | `skills/scorecard/interview.md` |
| Repo scan | Bounded read of tree, README, manifests; architecture nodes must have valid paths. | `skills/scorecard/references/analysis.md` |
| Content fill | Agent writes `content/*.json` (never `confirmed`). Generators exist in kit but are **not invoked by CLI** — agents must import/call manually. | `src/generators/architecture.ts`, `timeline.ts`, `references/schema.md` |
| Validate | `npx scorecard-kit check` | `bin/scorecard.js` |
| Preview | Vite app loads JSON bundle | `src/lib/loadContent.ts`, `ContentContext.tsx` |

**Reproduced (this environment, 2026-11-17):**

- `npm install` + `vitest run` — 12 tests pass (`generators.test.ts`, `provenance.test.ts`).
- `npx vite --host 127.0.0.1 --port 5199` — site serves; default route is summary, not interview.
- `node bin/scorecard.js check` — passes; warns architecture paths like `scorecard/package.json` missing when running kit **as** the repo root (paths assume scaffolded `scorecard/` subfolder).
- Dogfood demos (`loadDogfood.ts`) inject **empty** `architecture: { nodes: [], edges: [] }` — no diagram in demo packs.

### 1.2 Generated site UX (kit UI)

| Area | Observation | Files |
|------|-------------|-------|
| **Routing** | `/` = single “Scorecard summary”; optional `/contents` + `/chapters/:slug`. No Libretto-style home essay, FAQ, or shot strip. | `src/App.tsx` |
| **Chrome** | Top bar brand **“SCORECARD”**; nav links only. No persistent sidebar TOC, scroll ruler, or mobile contents drawer. | `src/components/Layout.tsx` |
| **Summary page** | Hero `h1.display` = **“SCORECARD”**; sections as dashed-border `.panel` stacks (job, features, run, etc.). Functional but generic docs layout. | `src/pages/ScorecardPage.tsx`, `src/theme/theme.css` |
| **Contents** | Plain list inside panels; no word counts, row hover, or editorial standfirst. | `src/pages/ContentsPage.tsx` |
| **Chapters** | Blocks: `h2`, `p`, `architecture`, `timeline`, `status`, `run` only. Schema also defines `figure`, `live`, `decision`, etc. — **not rendered**. Prose is plain text (no link/italic parsing). | `src/pages/ChapterPage.tsx`, `src/lib/schemas.ts` |
| **Architecture** | `ArchitecturePlate` = bordered box + bullet list + **Mermaid in `<pre>`**; frame variant shown as text label only. **NouveauFrame never imported in app.** | `src/components/ArchitecturePlate.tsx` |
| **Timeline** | Plain text list in a mono box. | `src/components/TimelinePlate.tsx` |
| **Ornaments** | `FootFrieze` uses **static PNG** previews, not live `NouveauFrieze` SVG. Rail unused (`theme.ornaments.rail: "none"`). | `src/components/FootFrieze.tsx`, `src/components/nouveau/*` |
| **Naming** | `content/manual.json` title `"Scorecard"`; `index.html` title `Scorecard`; layout wordmark SCORECARD. | `content/manual.json`, `index.html` |

### 1.3 Interview & engagement

- `content/interview.json` in repo: profile filled, **`answers: {}`** — no captured Q&A.
- Skill text is thorough but **procedural** (Stage A–E codes), not narrative or project-specific hooks.
- No `/interview` route, no form UI, no POST handler for interview saves (only Write save plugin lists fixed JSON files: `vite-plugin-scorecard-save.ts`).
- Stage E “look” points at `look-gallery.html` and PNG specimens; not integrated into first-run flow.

### 1.4 Architecture diagrams

- `buildArchitecture()` produces validated nodes/edges + mermaid string (`src/generators/architecture.ts`).
- **No** SVG/React plate, no interactive picks, no `FIG_###` registry.
- Skill does not require a minimum node count or a dedicated architecture chapter block.
- Libretto counterpart: hand-authored `figures/plates.tsx` + `InteractivePlate` + `TopologyPanel` (~1200 lines of SVG).

### 1.5 Fonts & theme

- Single hard-coded stack: Paléologue (display), Newsreader, Source Sans 3, Departure (`theme.json`, `applyTheme.ts`, `schemas.ts` enums).
- Write → Look toggles scheme + two display variants + ornament IDs; **no font pack abstraction**.
- No path to add custom `@font-face` bundles or generated display faces.

### 1.6 Gap summary (maps to owner feedback)

1. **Formatting / design** — Kit is a narrow centered column with UI-sans section headers; Libretto is manual layout with sidebar, ruler, plates, mono labels, RichText, and motion fallbacks.
2. **Engaging launch** — Opens Write; interview is chat-only markdown.
3. **Web form** — Missing entirely.
4. **Naming** — Product titled “Scorecard” everywhere instead of “&lt;Project&gt; Guide”.
5. **Architecture diagrams** — Mermaid pre Block; demos empty; no framed FIG-style plates.
6. **Font packs** — Not modeled.

---

## 2. Libretto analysis — what to port

Screenshots (design bar):

| File | Shows |
|------|--------|
| `libretto-work/verify/01-home-live-light.png` | Home hero: pixel LIBRETTO wordmark, kicker, lede columns, compact architecture plate, stats band |
| `libretto-work/verify/03-home-live-assistant.png` | Desk interactives (theme toggle toy, assistant UI) |
| `libretto-work/verify/04-home-clips.png` | MotionClip figures with mono labels (THEME, ASSISTANT) |
| `libretto-work/verify/05-chapter02-live.png` | Sidebar TOC, scroll ruler readout, live embed frame with LIGHT/DARK chrome |
| `libretto-work/verify/06-chapter05-agent-think.png` | Chapter prose + assistant embed + blue mono figure label |
| `libretto-work/verify/07-chapter05-reduced-motion.png` | Static GIF fallback when motion reduced |

### 2.1 Layout & navigation

| Pattern | Libretto implementation | Scorecard today |
|---------|-------------------------|-----------------|
| Persistent sidebar TOC | `ManualLayout.tsx` — Roman parts, chapter links, `PixelWordmark`, mobile drawer | Top nav only |
| Contents page | Editorial header, word counts per chapter, `contents-row` grid | Minimal `ContentsPage` |
| Chapter chrome | Crumb mono line, WORDS count, standfirst, `hr.rule`, pager prev/next | Single column, mono part/number only |
| Scroll ruler | Fixed `.ruler` + `.ruler-readout` (`ChapterPage.tsx`) | None |
| Page enter | `PageEnter` wrapper | None |
| Home vs summary | `HomePage.tsx` — essay + plate + ShotStrip + DeskInteractives + inline contents | N/A (summary only) |

**CSS:** `libretto-ref/libretto/src/styles.css` — `--sidebar`, `.shell`, `.chapter`, `.plate`, `.shot`, `.desk-*`, reduced-motion rules.

### 2.2 Content blocks & richness

Libretto `Block` union (`content/manual.ts`):

- `p` with `RichText` (markdown links + `*emphasis*`)
- `figure` → `Plate` (numbered `FIG_###`, framed canvas, caption)
- `shot` → screenshot figure
- `desk` → `ThemeDeskToy` / `AssistantDeskToy` (project-specific; Scorecard may use generic embed/motion slots)
- `walk` → walkthrough component
- `h2` section breaks
- Per-chapter `sources[]` list

Scorecard `ManualBlock` is a superset but renderer implements ~half.

### 2.3 Dynamic / interactive behaviour

| Component | Role | Reference |
|-----------|------|-----------|
| `InteractivePlate` | Click-to-select parts; `DetailRail` + `TopologyPanel` | `figures/InteractivePlate.tsx` |
| `Plate` | Fig index, named sheet, figcaption | `components/Plate.tsx` |
| `MotionClip` | video → gif fallback; respects reduced motion | `desk/MotionClip.tsx` |
| `DeskInteractives` | Try-the-desk section on home | `desk/DeskInteractives.tsx` |
| Live embed chrome | Theme tabs, route label, RESET / FULL PAGE | Screenshots ch.02 |
| `ScrollStage` | Home scroll-linked staging | `components/ScrollStage.tsx` |

**Porting strategy for Scorecard:** Do not copy Conductor-specific desk toys. Port the **patterns**: framed plates, mono figure labels, motion with fallback, **framed screenshot/clip** “live” blocks (no real iframes in v1), **interactive** architecture plates, and **generic Nouveau ornament** desk pieces (not per-project UI assets).

### 2.4 Typography & colour

- Paper `#fbfbfb`, action `#103dff`, serif body (Newsreader), UI in Departure Mono at 11px for labels — matches Scorecard `theme.json` scheme `libretto` but **not** applied with Libretto spacing/line-height (`line-height: 1.8`, `--measure: 38rem`).

### 2.5 Architecture figure (FIG_001 bar)

`figures/plates.tsx` `Assembly` / `InteractivePlate`: uniform LR spine, blue wash boxes, legend, click for service detail. This is the target for **generated** architecture — not raw Mermaid text.

---

## 3. Numbered issues (16 total, prioritised)

Priority: **P0** = most visible / owner-critical; **P1** = important; **P2** = enables roadmap. Normative owner choices are in **§5**.

### P0 — Visual manual system (Libretto parity)

**Issue 1 — Manual shell layout**  
- **Problem:** Top-bar blog layout; no sidebar TOC, ruler, or chapter pager.  
- **Outcome:** Libretto-style `ManualLayout` for Standard/Full; Lite keeps simple summary.  
- **Acceptance:** Roman-part sidebar; active chapter highlight; scroll ruler on chapter routes; responsive contents drawer.  
- **Files:** New `src/components/ManualLayout.tsx` (port/adapt), `Layout.tsx`, `theme.css` / split `manual.css`, `App.tsx`.  
- **Deps:** Issue 8 (project name for `PixelWordmark` in sidebar).

**Issue 2 — Contents & chapter typography**  
- **Problem:** Contents and chapters lack editorial hierarchy (standfirst, rule, word counts, contents rows).  
- **Outcome:** Match Libretto `ContentsPage` / `ChapterPage` header patterns.  
- **Acceptance:** Contents shows per-chapter word counts; chapters have crumbs, standfirst, prev/next pager, optional sources.  
- **Files:** `ContentsPage.tsx`, `ChapterPage.tsx`, `schemas.ts` (optional `sources` on chapters).  
- **Deps:** Issue 1.

**Issue 3 — Rich block renderer**  
- **Problem:** `ManualBlock` types unused; paragraphs lack links; no figures or media frames.  
- **Outcome:** Render `figure`, `live` (§4.6 screenshot/clip), `shot`, `motion`, `desk`, `decision`, `requirement`, `contribution`; RichText for `p`.  
- **Acceptance:** Dogfood manual uses `figure` + one media block; links render; unknown types fail `check`; no iframe elements in DOM.  
- **Files:** `ChapterPage.tsx`, `RichText.tsx`, `schemas.ts`, skill `references/schema.md`.  
- **Deps:** Issues 4–5, 15–16.

**Issue 4 — Wire Nouveau SVG ornaments into plates**  
- **Problem:** `NouveauFrame` / `NouveauFrieze` exist but UI uses PNG footers and CSS border on architecture.  
- **Outcome:** Plates and architecture use `NouveauFrame` with `theme.ornaments.plateFrame`.  
- **Acceptance:** Architecture and install/run sections show coins46-style frame (configurable); foot uses SVG frieze when not `plain`.  
- **Files:** `ArchitecturePlate.tsx`, `FootFrieze.tsx`, import nouveau in pages.  
- **Deps:** None.

**Issue 5 — Interactive architecture diagram plates (v1)**  
- **Problem:** No real diagrams; Mermaid `<pre>` only; no Libretto FIG-style interaction.  
- **Outcome:** Generate `architecture.json` from repo scan; render **framed SVG plate** inside `NouveauFrame` with **clickable/animated nodes** (select toggles detail rail or panel; subtle motion on active node; `prefers-reduced-motion` static). Mermaid remains print/export fallback only.  
- **Acceptance:** Every Standard/Full generated site has ≥3 nodes, ≥2 edges; clicking a node shows label, path evidence, and edge summary; home/summary + architecture chapter both show plate; paths validated.  
- **Files:** `src/generators/architecture.ts`, `src/components/plates/` (`ArchitectureDiagram.tsx`, port patterns from Libretto `InteractivePlate`, `DetailRail`, `TopologyPanel`), `figures/kit.tsx`, skill `analysis.md`, `architecture.json` schema (§4.3).  
- **Deps:** Contract §4.3; Issue 4 (frame).

**Issue 6 — Web interview form + agent handoff**  
- **Problem:** No local engagement surface; answers not structured.  
- **Outcome:** `/interview` multi-step form (Stages A–E) on **127.0.0.1 only**; persists `content/interview.json` via existing save plugin; optional `interview-handoff.json` snapshot for agents; CLI opens interview when `answers` empty. **No auth tokens** — trust model: local dev server, user-owned machine; agent **decides relevance** of answers when generating (infer-first still applies).  
- **Acceptance:** User completes form without chat; reloading page shows saved answers; agent skill documents handoff read order; `check` validates schema.  
- **Files:** New `src/interview/*`, `vite-plugin-scorecard-save.ts`, `bin/scorecard.js` (`interview` command; `dev` routes to interview if incomplete), `schemas.ts`, skills.  
- **Deps:** Contract §4.1; Decision §5.7.

### P1 — Onboarding, naming, content quality

**Issue 7 — Engaging interview content (skill)**  
- **Problem:** Questions read like a checklist (A1, B3…).  
- **Outcome:** Mirror form copy: hooks tied to project kind, concrete examples, optional “story” prompts; still infer-first.  
- **Acceptance:** `interview.md` + form strings reviewed; at least one engaging prompt per stage; skip still valid.  
- **Files:** `skills/scorecard/interview.md`, mirrored `.github`/`.claude` skills, form UI copy.  
- **Deps:** Issue 6.

**Issue 8 — Product naming + dual wordmark**  
- **Problem:** SCORECARD branding on generated sites; no Libretto-style pixel title.  
- **Outcome:** `manual.projectName` + `manual.title` = `"${projectName} Guide"`; hero shows **PixelWordmark** (project name, truncated sensibly) **and** Paléologue display for kicker/headings; “Scorecard” only in platform/footer credit.  
- **Acceptance:** Fresh generate from `my-app` shows pixel + serif pairing on home/sidebar; grep user-visible “Scorecard” only in platform attribution.  
- **Files:** `schemas.ts`, `Layout.tsx`, new `PixelWordmark.tsx` (port), `HomePage.tsx`, skill SKILL.md, content templates.  
- **Deps:** Contract §4.2 (early).

**Issue 9 — Full Libretto-style home essay (generated Full only)**  
- **Problem:** No Libretto-style orientation home.  
- **Outcome:** **Owner decision:** every **`size: full`** generated guide gets the **complete** Libretto-style `/` home: essay lede, hero architecture plate, stats band, contents preview, generic desk section (Issue 16), optional shot/motion strip. Summary moves to `/scorecard` (or anchored section). Standard/Lite unchanged.  
- **Acceptance:** Full dogfood matches screenshot bar (`01-home-live-light` structure); Lite still one page.  
- **Files:** `HomePage.tsx`, `App.tsx`, `manual.json`, skill `project-profiles.md` gates.  
- **Deps:** Issues 1, 5, 8, 16.

**Issue 10 — Agent pipeline: mandatory architecture + manual blocks**  
- **Problem:** Skill doesn't require diagram or rich manual.  
- **Outcome:** SKILL workflow step: run `buildArchitecture` from scan; emit `figure` block referencing `ARCH_001`; gate Full on plate presence.  
- **Acceptance:** RED fixture includes architecture nodes; skill text names generator import path.  
- **Files:** `skills/scorecard/SKILL.md`, `references/analysis.md`, `fixtures/`.  
- **Deps:** Issue 5.

**Issue 11 — Motion / reduced-motion pattern**  
- **Problem:** No motion clips or reduced-motion fallback.  
- **Outcome:** Optional `motion` block type with webm/gif/poster; static fallback per Libretto.  
- **Acceptance:** One demo clip; `prefers-reduced-motion` shows poster/gif only.  
- **Files:** New `MotionClip.tsx` (port), `schemas.ts`, `ChapterPage.tsx`.  
- **Deps:** Issue 3.

### P2 — Font packs & extensibility

**Issue 12 — Font pack manifest**  
- **Problem:** Fonts enum-fixed; no swapping packs.  
- **Outcome:** `content/font-pack.json` or embedded in `theme.json`: `packId`, `display`, `body`, `ui`, `mono` with file paths; built-in `libretto-default` + stub `custom`.  
- **Acceptance:** Switching pack in Write/Look updates CSS vars; check validates files exist.  
- **Files:** `schemas.ts`, `applyTheme.ts`, `public/fonts/README`, `theme-presets.md`.  
- **Deps:** Contract §4.4.

**Issue 13 — Additional built-in font packs**  
- **Problem:** Only Paléologue pairing documented.  
- **Outcome:** At least one alternate pack (e.g. plain editorial: Newsreader display + same mono).  
- **Acceptance:** `look-gallery` and interview Stage E show pack previews.  
- **Files:** `public/fonts/`, `look-gallery.html`, presets doc.  
- **Deps:** Issue 12.

**Issue 14 — Font trace pipeline (reference image → letterforms)**  
- **Problem:** Only hand-maintained Paléologue; no way to create new display faces from a reference sheet.  
- **Outcome:** **Owner decision:** real pipeline modeled on Paléologue creation: ingest reference image → guided trace/spec steps (agent + optional local script) → export WOFF2 + OFL sidecar → register in font-pack manifest. Includes docs, `scripts/font-trace/` (or kit CLI subcommand), validation in `check`.  
- **Acceptance:** Doc walks through one exemplar (Paléologue); adding a second display face from a user-supplied **PD or owned** reference produces loadable pack without editing `applyTheme` by hand.  
- **Files:** `scripts/font-trace/*`, `docs/fonts/trace-pipeline.md`, skill Stage E, `schemas.ts`, `bin/scorecard.js` (`fonts trace` or similar), `LICENSES/FONTS.txt` pattern.  
- **Deps:** Issue 12; Contract §4.5.

**Issue 15 — Framed screenshot / clip blocks (no iframe v1)**  
- **Problem:** `live` block type unused; owner does not want real iframes in v1.  
- **Outcome:** **`live` / `shot` / `motion` blocks** render Libretto-style chrome around **static screenshots** and **video/GIF clips** (with poster + reduced-motion fallback). Optional link-out button to real deploy URL in caption — not an embedded app.  
- **Acceptance:** Chapter can show framed PNG sequence or `MotionClip`; no `<iframe>` in v1; caption states provenance (screenshot vs recording).  
- **Files:** `ChapterPage.tsx`, `ShotFigure.tsx`, `MotionClip.tsx`, `LiveFrame.tsx` (chrome only), skill guidance.  
- **Deps:** Issues 1, 3, 11.

**Issue 16 — Generic Nouveau desk section (not project UI)**  
- **Problem:** Libretto desk toys are Conductor-specific; Scorecard must not require project frontend assets.  
- **Outcome:** Home “try the desk” section uses **generic Nouveau interactives**: e.g. theme token toggle on sample plate, frieze/rail animation demo, frame variant picker — all from existing `src/components/nouveau/*`.  
- **Acceptance:** Full home desk section works with zero project screenshots; uses ornaments only.  
- **Files:** `src/components/desk/GenericDesk.tsx`, `HomePage.tsx`, `manual.json` block type `desk` → `kind: "nouveau"`.  
- **Deps:** Issues 1, 4, 9.

---

## 4. Workstreams (parallel cloud agents)

Six workstreams. **WS0 must merge first.** Each brief below is intended to be **copied wholesale** to a build agent (scope, contracts, acceptance, no-go files).

```
                         ┌──────────────────────────────┐
                         │ WS0: Contracts + schema types │
                         └──────────────┬───────────────┘
        ┌──────────────────────────────┼──────────────────────────────┐
        ▼                              ▼                              ▼
 ┌─────────────┐                ┌─────────────┐                ┌─────────────┐
 │ WS1: Shell  │                │ WS2: Interview│              │ WS3: Arch    │
 │ + ornaments │                │ form + CLI    │              │ interactive  │
 └──────┬──────┘                └──────────────┘                └──────┬──────┘
        │                                                              │
        └──────────────────────────┬───────────────────────────────────┘
                                   ▼
                          ┌─────────────────┐
                          │ WS4: Blocks +   │
                          │ Full home       │
                          └────────┬────────┘
                                   │
                          ┌────────┴────────┐
                          ▼                 ▼
                   ┌─────────────┐   ┌─────────────┐
                   │ WS5: Fonts  │   │ (WS4 owns   │
                   │ packs+trace │   │  naming)    │
                   └─────────────┘   └─────────────┘
```

**Build order:** WS0 → (WS1 ∥ WS2 ∥ WS3 ∥ WS5) → WS4 → sync skills/README.

**Documentation (do not land on `master`):** Performance audits, timing studies, and other “how we built this workstream” notes stay on that workstream’s feature branch (for example `Agent/ws1-workstream-notes-*`), not in stacked PRs that eventually merge to `master`. Normative cross-stream contracts remain in `docs/contracts/`.

---

### WS0 — Contracts & schema types (gatekeeper)

| Field | Value |
|-------|--------|
| **Mission** | Land shared JSON/TypeScript contracts so parallel agents do not diverge. |
| **Issues** | Underpins all; implements §4.1–§4.6 types in `schemas.ts` + `docs/contracts/*.md`. |
| **In scope** | `docs/contracts/`, `src/lib/schemas.ts` (types + validators only), `skills/scorecard/references/schema.md`. |
| **Out of scope** | React pages, generators, CLI behaviour, CSS. |
| **Depends on** | None. |
| **Blocks** | WS1–WS5. |
| **Acceptance** | `npm test` + `npx scorecard-kit check` still pass; new types documented; no UI imports broken. |

**Deliverable:** One small PR; owners review contracts before parallel work starts.

---

### WS1 — Manual shell, typography, Nouveau chrome

| Field | Value |
|-------|--------|
| **Mission** | Libretto navigation shell: sidebar TOC, ruler, contents/chapter chrome, SVG ornaments, `PixelWordmark` in sidebar (project name from §4.2). |
| **Owner decisions** | Dual wordmark (§5.4); generic ornaments visible in chrome (§5.6). |
| **Issues** | 1, 2, 4, 8 (layout/wordmark only). |
| **Contracts** | §4.2 `manual.projectName`; read-only `theme.json` / font pack id (do not implement pack switching). |
| **In scope** | `ManualLayout.tsx`, `Layout.tsx`, `ContentsPage.tsx`, chapter header styles in `ChapterPage.tsx` (chrome only, not block switch), `FootFrieze.tsx`, `theme.css` / `manual.css`, `PixelWordmark.tsx`, `App.tsx` route wrapper. |
| **Out of scope** | `HomePage` body, architecture plate, interview routes, block types beyond existing, font trace scripts. |
| **Depends on** | WS0 merged. |
| **Parallel with** | WS2, WS3, WS5. |
| **Acceptance** | Standard manual shows sidebar + ruler on `/chapters/*`; contents rows styled; `NouveauFrieze`/`NouveauFrame` used in footer/plate wrapper smoke route; sidebar wordmark uses `projectName`. |

---

### WS2 — Interview web form, CLI entry, skill copy

| Field | Value |
|-------|--------|
| **Mission** | Engaging local interview form; first-run CLI path; agent handoff file. |
| **Owner decisions** | Local trust model (§5.7). |
| **Issues** | 6, 7, 8 (`projectName` field on form only). |
| **Contracts** | §4.1 interview + handoff JSON. |
| **In scope** | `src/interview/*`, `vite-plugin-scorecard-save.ts` (allowlist `interview.json`, optional handoff), `bin/scorecard.js` (`interview`, `dev` redirect logic), mirrored `skills/*/interview.md` + form string tables, `content/interview.json` example. |
| **Out of scope** | Manual layout, architecture, home page, font pipeline. |
| **Depends on** | WS0. |
| **Parallel with** | WS1, WS3, WS5. |
| **Acceptance** | `npx scorecard-kit dev` with empty answers opens `/interview` on 127.0.0.1; submit persists JSON; reload shows data; handoff file generated on “Done”; skill tells agent to read handoff then infer/scan. |

---

### WS3 — Architecture scan, interactive SVG plates, agent gates

| Field | Value |
|-------|--------|
| **Mission** | Mandatory project architecture diagrams with **v1 interactivity** (click nodes, detail rail, reduced motion). |
| **Owner decisions** | Interactive required in v1 (§5.2). |
| **Issues** | 5, 10, 4 (plate frame integration in `ArchitecturePlate` only). |
| **Contracts** | §4.3 extended `architecture.json` with `details` per node. |
| **In scope** | `src/generators/architecture.ts`, layout helper, `src/components/plates/*`, refactor `ArchitecturePlate.tsx`, tests, `skills/scorecard/SKILL.md` + `analysis.md`, dogfood architecture JSON with real nodes. |
| **Out of scope** | `HomePage`, interview, global CSS shell, font trace. |
| **Depends on** | WS0; soft dependency on WS1 for shell CSS class names (use BEM/stable classes agreed in contract doc). |
| **Parallel with** | WS1, WS2, WS5. |
| **Acceptance** | `buildArchitecture` + layout produces coordinates; plate renders ≥3 nodes; click updates detail panel; mermaid hidden in UI but present in JSON; skill mandates generator step. |

**Public component API (for WS4):** export `ArchitecturePlate` / `InteractiveArchitectureDiagram` accepting `ArchitectureFile` from context.

---

### WS4 — Block renderer, Full home essay, media frames, generic desk

| Field | Value |
|-------|--------|
| **Mission** | Rich manual content, **Full-only** Libretto home, framed screenshots/clips, generic Nouveau desk. |
| **Owner decisions** | Full home essay (§5.1); no iframe embeds (§5.3); generic desk (§5.6). |
| **Issues** | 3, 9, 11, 15, 16; naming copy polish for 8. |
| **Contracts** | §4.2, §4.6 media blocks; consume WS3 plate API + WS1 layout. |
| **In scope** | `ChapterPage.tsx` block switch, `RichText.tsx`, `HomePage.tsx`, `GenericDesk.tsx`, `MotionClip.tsx`, `ShotFigure.tsx`, `LiveFrame.tsx`, `manual.json` + full dogfood, `ScorecardPage` route move (`/scorecard`), `schemas.ts` block unions if not done in WS0. |
| **Out of scope** | Generator algorithms, interview form, font trace scripts. |
| **Depends on** | WS0, WS1 (shell), WS3 (architecture component). WS2 optional for `projectName` population. |
| **Parallel with** | WS5 (avoid `applyTheme` unless coordinating). |
| **Acceptance** | Full dogfood `/` matches Libretto home structure; `live` uses screenshot/clip only; desk section uses Nouveau demos; all `ManualBlock` types in schema render or `check` errors; Lite unchanged. |

---

### WS5 — Font packs + trace pipeline

| Field | Value |
|-------|--------|
| **Mission** | Swapable font packs **and** reference-image → letterform pipeline (Paléologue-class). |
| **Owner decisions** | Real trace pipeline (§5.5). |
| **Issues** | 12, 13, 14. |
| **Contracts** | §4.4 manifest, §4.5 trace artifact layout. |
| **In scope** | `applyTheme.ts`, `theme.json`, `WritePage` Look panel, `look-gallery.html`, `public/fonts/`, `scripts/font-trace/`, CLI subcommand, `docs/fonts/trace-pipeline.md`, `check` validation, one alternate built-in pack. |
| **Out of scope** | Manual layout, interview, architecture UI. |
| **Depends on** | WS0. |
| **Parallel with** | WS1–WS3. |
| **Acceptance** | Switch pack in Look updates faces; trace doc runs end-to-end on sample reference; new pack registers via manifest without code changes to enums. |

---

### Shared interfaces (detail)

#### 4.1 Interview answers / handoff JSON

```json
{
  "schemaVersion": 1,
  "submittedAt": "ISO-8601",
  "depth": "quick | standard | deep",
  "profile": {
    "kind": "team",
    "builders": "small team",
    "purpose": "handoff",
    "readerGoal": "run",
    "scale": "weeks",
    "projectName": "Conductor"
  },
  "answers": {
    "A1": { "value": "team", "provenance": "confirmed" },
    "B1": { "value": "One sentence job…", "provenance": "confirmed" },
    "E_scheme": { "value": "libretto", "provenance": "confirmed" }
  },
  "narrative": {
    "hook": "optional free text",
    "proudMoment": "optional"
  },
  "agentNotes": "Displayed only in handoff export"
}
```

- Form writes `content/interview.json` on the user’s machine via `POST /__scorecard/save` (Vite dev plugin, **127.0.0.1** bind only — same as existing `HOST` in `bin/scorecard.js`).  
- **Trust model (planning decision):** no login/session token. Anyone who can reach the loopback port can POST; acceptable because the kit is local authoring tooling, not a shared host. Agents must treat answers as **hints** — still infer-first, redact secrets, never auto-`confirmed` except fields the user explicitly submitted in the form (tag `confirmed` only for those keys).  
- `interview-handoff.json` = slim export for agent (profile + non-empty answers + narrative; omit empty skips).

#### 4.2 Naming contract

- `manual.projectName`: string (required on generate)  
- `manual.title`: always `"${projectName} Guide"`  
- `scorecard.json` may add `projectName` duplicate for summary hero.  
- Platform string: footer e.g. `Made with Scorecard` (mono, muted).

#### 4.3 Architecture plate data (interactive v1)

Extend `architecture.json`:

```json
{
  "schemaVersion": 1,
  "figureId": "ARCH_001",
  "layout": "spine-lr | layered | radial",
  "nodes": [
    {
      "id": "api",
      "label": "API",
      "group": "runtime",
      "path": "src/server.ts",
      "tone": "service",
      "detail": {
        "role": "HTTP entry",
        "evidence": "package.json scripts",
        "ports": ["3000"]
      }
    }
  ],
  "edges": [{ "from": "api", "to": "db", "label": "queries" }],
  "groups": [{ "id": "runtime", "title": "Runtime", "tone": "service" }],
  "mermaid": "fallback for export/print only — not primary UI"
}
```

- Generator fills nodes from repo scan; layout engine assigns `x`/`y` if omitted.  
- Renderer: SVG inside `NouveauFrame`; **required v1:** click/double-tap selects node; `DetailRail` or side panel shows `detail`; active node may use subtle CSS/SVG motion; honour `prefers-reduced-motion`.  
- Export PDF may use `mermaid` snapshot.

#### 4.4 Font pack manifest

```json
{
  "schemaVersion": 1,
  "packId": "libretto-default",
  "label": "Paléologue · Departure",
  "license": "LICENSES/FONTS.txt",
  "faces": {
    "display": { "family": "Libretto Paléologue Poster", "woff2": "/fonts/..." },
    "body": { "family": "Newsreader", "woff2": "/fonts/..." },
    "ui": { "family": "Source Sans 3", "woff2": "/fonts/..." },
    "mono": { "family": "Departure Mono", "woff2": "/fonts/..." }
  }
}
```

- `theme.json` references `fontPackId` instead of inline enums (enums kept as shortcuts mapping to packs).

#### 4.5 Font trace pipeline artifacts

```
font-packs/
  <packId>/
    manifest.json       # §4.4
    reference.png       # user-supplied sheet (gitignored in user projects if desired)
    source/             # intermediate (SVG glyphs or .glyphs.json)
    *.woff2
    LICENSE
```

- CLI: `npx scorecard-kit fonts trace --reference ./sheet.png --packId my-display --label "My Display"`  
- Pipeline stages (documented, at least stages 1–3 automated or semi-automated): ingest → trace/normalize → build WOFF2 → validate with `check`.  
- Agent skill Stage E may invoke trace for **user-owned or PD** references only; refuse unknown licensing.

#### 4.6 Media / live block data (no iframe v1)

```json
{
  "type": "live",
  "mode": "screenshot | clip",
  "src": "/media/demo-dashboard.png",
  "poster": "/media/demo-dashboard.png",
  "webm": "/media/demo.webm",
  "gif": "/media/demo.gif",
  "chrome": { "routeLabel": "app/dashboard", "tabs": ["A", "B"] },
  "linkOut": "https://deploy.example.com",
  "caption": "Screenshot of the real UI; not live in page.",
  "provenance": "inferred",
  "source": "generated"
}
```

- Renderer draws Libretto-style frame (from screenshot §5.3); **no `<iframe>`** in v1.  
- `linkOut` optional; opens in new tab from chrome button.

---

## 5. Owner decisions (resolved)

| # | Topic | Decision |
|---|--------|----------|
| 5.1 | Home page | **`size: full`** generated guides get the **full** Libretto-style home essay at `/` (hero, plate, stats, desk, contents preview). Standard/Lite not expanded in v1. |
| 5.2 | Architecture | **Interactive in v1** — clickable/animated nodes inside framed SVG plates with detail rail; not static-only. |
| 5.3 | Live embeds | **Framed screenshots and clips only** in v1 — no embedded iframes; honest captions + optional link-out. |
| 5.4 | Title lettering | **Pixel wordmark + Paléologue** together (sidebar and/or home hero). |
| 5.5 | Custom fonts | **Font packs plus trace pipeline** from reference image (Paléologue-style), not merely picking Google Fonts. |
| 5.6 | Desk section | **Generic Nouveau ornament interactives**, not project-specific Conductor toys. |
| 5.7 | Interview trust | **Planning decision:** loopback-only form → `content/interview.json` → agent reads handoff and **decides relevance**; no session auth (see §4.1). |

*Former open questions are closed; implementation agents should treat this table as normative.*

---

## 6. Suggested verification (post-implementation)

| Check | Command / action |
|-------|------------------|
| Content validity | `npx scorecard-kit check` |
| Unit tests | `npm test` (extend plate + interview schema tests) |
| Visual | Compare side-by-side with Libretto screenshots; Playwright snapshots optional |
| Agent E2E | RED fixture: interview handoff → generate → architecture nodes ≥ 3 + interactive plate |
| Naming | Assert no `SCORECARD` hero; pixel wordmark shows `projectName` |
| Full home | Full dogfood `/` includes essay + ARCH plate + generic desk |
| Fonts | Trace pipeline doc smoke test on PD sample |

---

## 7. References (quick index)

| Scorecard | Libretto (zip) |
|-----------|----------------|
| `src/pages/ScorecardPage.tsx` | `src/components/HomePage.tsx` |
| `src/components/Layout.tsx` | `src/components/ManualLayout.tsx` |
| `src/pages/ContentsPage.tsx` | `src/components/ContentsPage.tsx` |
| `src/pages/ChapterPage.tsx` | `src/components/ChapterPage.tsx` |
| `src/components/ArchitecturePlate.tsx` | `src/figures/plates.tsx`, `InteractivePlate.tsx` |
| `skills/scorecard/interview.md` | _(product interview is form + prose — no equivalent file)_ |
| `src/components/nouveau/NouveauFrame.tsx` | ornaments used in plates/frame CSS in `styles.css` |

---

*Plan authored by planning agent; no application code changed except this document.*