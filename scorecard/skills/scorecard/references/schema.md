# Content schemas

`schemaVersion: 1` on every file.

Normative overhaul contracts: `docs/contracts/` (WS0). TypeScript types and `validate*` helpers: `src/lib/schemas.ts`.

## Core files

| File | Role |
|------|------|
| scorecard.json | job, brief, outcome, features, built/borrowed, proof, next; optional `projectName` |
| run.json | steps, envNames, demoScript |
| decisions.json | decisions / dead ends |
| requirements.json | rubric map (no grades) |
| team.json | people |
| interview.json | profile, answers (`InterviewAnswer` objects), narrative, optional `submittedAt` |
| interview-handoff.json | slim agent export (`buildInterviewHandoff`) |
| manual.json | `projectName`, `title` = ``${projectName} Guide``, parts, chapters, blocks |
| stack.json / apis.json / architecture.json / branches.json | plates |
| theme.json | scheme, tokens, fonts, ornaments, tone; optional `fontPackId` |
| font-pack.json | `FontPackManifest` (optional until font packs land) |

## Manual blocks

| type | Notes |
|------|--------|
| h2, p | prose (`RichText` in WS4) |
| figure | `id`, optional caption |
| status, run, architecture, timeline | embed plates |
| decision, requirement, contribution | chapter hooks |
| live | `mode` screenshot \| clip; no iframe v1 |
| shot, motion | framed stills and clips |
| desk | `kind: "nouveau"` for generic ornament desk |

## Architecture (`architecture.json`)

`figureId`, `layout`, `nodes` (with optional `detail`, `tone`, `x`/`y`), `groups`, `edges`, `mermaid` (export only).

Standard/Full: ≥3 nodes, ≥2 edges; every node needs `detail` for the interactive plate. Primary UI is SVG in `ArchitecturePlate` — not the mermaid string.

## Provenance

- `confirmed` | `inferred` | `draft`
- `source`: `generated` | `authored`
- Agent never sets `confirmed`
- `inferred` needs `evidence` (path or commit)
- Interview form may set `confirmed` on submitted answer keys only