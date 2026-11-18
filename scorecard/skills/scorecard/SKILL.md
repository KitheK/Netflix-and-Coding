---
name: scorecard
description: >
  Use when asked to summarise, document, present, or build a Scorecard / project
  manual / diary site for what a repository built; when the user wants Lite,
  Standard, or Full descriptive docs with Write mode; or when scaffolding a
  scorecard app from an interview. Also use when they mention provenance,
  built-vs-borrowed, or npx scorecard-kit. Works in Claude Code, Codex, Copilot,
  Cursor, and any agent that can load this skill folder.
---

# Scorecard

Descriptive project manuals only. Never grade. Never invent metrics or contributions. Never set `provenance: confirmed` (only the author via the local **interview form** or Write → Review).

## Hard rules

- Infer first, ask second (confirm-or-correct).
- Batches of 3–5 questions; skip is valid → tag `draft` / `inferred`.
- Content is JSON under `content/`, never hand-written TypeScript manuals.
- Honour “no ornaments” via the **plain** scheme — do not abandon the kit for Inter.
- “Just fill it in, I trust you” → still `draft`.
- Re-runs update only `generated`; propose diffs for `authored`.
- Run redaction before writing files; env **names** only, never values.

## Ordered workflow

1. **Infer-first seed** — write `content/interview.json` (`profile` + `inferred` answers with `evidence` where you can). Do not chat-interview unless the form is unreachable.
2. **Author interview** — `npx scorecard-kit dev` opens `/interview` when `answers` are empty; otherwise Write mode. After **Done**, read `content/interview-handoff.json` (see `interview.md`).
3. Bounded repo scan — see `references/analysis.md`; **must** run architecture generator (see `references/analysis.md` § Architecture)
4. Generate at chosen **depth** using handoff + scan — stages B–E in `interview.md`
5. Stage E look & feel — link specimens / `npx scorecard-kit look`; or defer via `E_noPreference`
6. Propose size Lite|Standard|Full; apply module gates from `references/project-profiles.md`
7. **Scaffold the kit** into the target project (no host monorepo required):
   ```bash
   git clone --depth 1 https://github.com/KitheK/scorecard.git /tmp/scorecard-kit
   cp -R /tmp/scorecard-kit ./scorecard
   cd scorecard && npm install
   ```
   Windows: clone to `$env:TEMP\scorecard-kit`, then `Copy-Item -Recurse` into `.\scorecard`.
   If `./scorecard` already exists, reuse it — do not wipe `authored` content.
   Write `theme.json` from Stage E / `references/theme-presets.md`.
8. Fill `scorecard/content/*.json` with provenance tags (`confirmed` only via interview form or Write → Review). Set `manual.projectName` + `manual.title` (`"<Project> Guide"`) from handoff. Before writing `architecture.json`, call `scanArchitectureGraph` + `buildArchitecture` from `src/generators/architecture.ts` (≥3 nodes, ≥2 edges, every node has `detail` and valid `path`); set `figureId` `ARCH_001` and add a manual `figure` or `architecture` block referencing it on Standard/Full.
9. Redaction pass + `npx scorecard-kit check`
10. Hand off: `cd scorecard && npx scorecard-kit dev` → Write mode after interview complete. Point the author at `/demos` for specimen repo shapes if helpful.

## Dogfood specimens (in the kit)

After scaffold, `npx scorecard-kit demos` shows in-app packs: hackathon, personal-cli, assignment, team, no-readme. Match the user’s repo to the closest pack when proposing size and tone.

## References

- `interview.md`
- `references/schema.md`
- `references/theme-presets.md`
- `references/project-profiles.md`
- `references/analysis.md`

## Reference Full manual

[Libretto](https://github.com/KitheK/libretto) / [499team1.com/make](https://499team1.com/make) — example Full site, not a dependency.
