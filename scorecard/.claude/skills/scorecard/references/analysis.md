# Repo analysis

Read-only and bounded: tree, README, manifests, config, tests, CI, licence, sample sources, git stats.

## Robustness

| Case | Behaviour |
|------|-----------|
| No README | Infer; tag draft; ask B1 first |
| One commit / squash | Skip branch river; build-log or interview timeline |
| Monorepo | Ask which package |
| Non-JS | Use that ecosystem’s manifests |
| Large repo | Fixed sample limits; state what was skipped |
| Vendor/generated | Borrowed, not built |
| Secrets | Redaction pass before write |

## Architecture

**Mandatory on Standard/Full.** Agents must not ship empty `architecture.nodes`.

1. Import from the kit: `scanArchitectureGraph(root)` then `buildArchitecture({ ...scan, nodes: [...] })` (`src/generators/architecture.ts`).
2. Every node needs a **real repo path** (drop if missing), `detail.role`, and `detail.evidence`.
3. Output must pass `validateArchitecture(file, exists, { minNodes: 3, minEdges: 2, requireInteractiveFields: true })`.
4. UI renders **interactive SVG** inside `NouveauFrame`; `mermaid` is export/print only — still include it in JSON.
5. Optional: `npx vite-node src/scripts/generate-architecture.ts` when authoring inside the kit repo.

Validate every node path. Drop invalid. No runtime gitdiagram.com dependency.

## Redaction

Scan secrets, tokens, private URLs, emails, B9 names. Author approves. Env names only.
