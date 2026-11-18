# Scorecard interview

The author answers on **127.0.0.1** in the local web form (`/interview`), not in chat. Your job is infer-first: pre-fill `content/interview.json` from the repo, then let the form confirm or correct.

## Launch order

1. If `content/interview.json` has empty `answers`, run `npx scorecard-kit dev` — it opens `/interview`.
2. After the author clicks **Done**, read `content/interview-handoff.json` (or `buildInterviewHandoff(interview)`).
3. Bounded repo scan (`references/analysis.md`) — still required; handoff answers are **hints**, not gospel.
4. Continue stages B–E in the skill using confirmed keys only; everything else stays `draft` / `inferred` until Write → Review.

## Principles

- **Infer first, ask second** — seed `profile` and `answers` with `provenance: "inferred"` + `evidence` (path or observation) when you can.
- **Never** set `provenance: "confirmed"` yourself — only the form (or Write → Review) may confirm.
- **Depth** comes from the form (`quick` · `standard` · `deep`); respect it when choosing how many chapters to propose.
- **`profile.projectName`** drives §4.2 naming: generated `manual.title` must be `"${projectName} Guide"`.
- Skip is valid — empty answers are omitted from handoff.

## Stages (form copy mirrors this)

### Stage A — Profile

Warm profiling, not a checklist. Capture **project name** for the guide title.

- **A1** kind · **A2** builders · **A3** purpose · **A4** reader goal · **A5** scale · **A6** depth (quick / standard / deep)

### Stage B — Core story

- **B1** one-sentence job · **B2** success · **B3** honest status  
- Standard+: **B4** built vs borrowed · **B5–B9** hardest problem, defend/abandon, next, proof, redaction

### Stage C — Adaptive context (standard+)

Free-text: hook, audience, constraints, collaboration — tie prose to A1/A3.

### Stage D — Technical evidence (deep only)

Entrypoints, flow, dependencies, failure modes, decision candidates — point at paths; you verify.

### Stage E — Look

- **E_tone** · **E_scheme** · optional display / frames · **E_noPreference** to defer  
- Specimens: `npx scorecard-kit look` and `public/previews/`

### Closing narrative (optional)

`narrative.hook`, `narrative.proudMoment` — colour for the manual lede, not required.

## Agent handoff consumption

```ts
import handoff from "../content/interview-handoff.json";
// or buildInterviewHandoff(interview)
```

Read order:

1. `profile` — especially `projectName`, `purpose`, `readerGoal`
2. `answers` — only `confirmed` entries; cross-check repo
3. `narrative` — optional tone for summary / home (Full)
4. `agentNotes` — if present on full `interview.json`, included in handoff

Then: scan → size (Lite/Standard/Full) → fill `content/*.json` → `npx scorecard-kit check` → hand off Write mode.

## Persistence

| File | Purpose |
|------|---------|
| `content/interview.json` | Full form state |
| `content/interview-handoff.json` | Slim export on **Done** |

Local trust model (§5.7): no auth on loopback; redact secrets before writing any JSON.