# Pull request labels

Use a consistent **three-axis** label set on every open PR:

1. **Workstream** — which overhaul track the change belongs to.
2. **Area** — primary surface (frontend vs backend).
3. **Testing** — how reviewers should verify the PR.

## Workstream labels

| Label | Scope |
|-------|--------|
| `workstream:WS0` | Shared contracts (`§4.x`), schemas, `check` |
| `workstream:WS2` | Interview web form, CLI entry, agent handoff |
| `workstream:WS3` | Architecture SVG plates, generator, Playwright |
| `workstream:WS4` | Libretto home, block renderer, media frames |
| `workstream:WS5` | Font packs, trace pipeline |
| `workstream:meta` | Planning docs, agent/review automation |

## Area labels

| Label | Scope |
|-------|--------|
| `area:frontend` | `src/components`, theme CSS, client routes, e2e |
| `area:backend` | `src/generators`, `src/lib/schemas`, CLI, `content/` contracts |

A PR may carry **both** when it touches shared types and UI; pick the axis reviewers should focus on first.

## Testing labels

| Label | Meaning |
|-------|---------|
| `testing:unit` | Includes Vitest changes or relies on unit coverage |
| `testing:e2e` | Includes or updates Playwright specs |
| `testing:visual` | Screenshot / visual proof in the PR body |
| `testing:manual` | No automated test gate — describe manual steps |

## Suggested labels per open overhaul PR

| PR | Title prefix | Workstream | Area | Testing |
|----|--------------|------------|------|---------|
| #2 | WS0 | `workstream:WS0` | `area:backend` | `testing:unit` |
| #3 | WS2 | `workstream:WS2` | `area:frontend` | `testing:unit` |
| #5 | WS5 | `workstream:WS5` | `area:frontend` | `testing:manual` |
| #6 | (review) | `workstream:meta` | `area:backend` | `testing:manual` |
| #7 | WS3 | `workstream:WS3` | `area:frontend` | `testing:e2e`, `testing:visual` |
| #8 | WS4 | `workstream:WS4` | `area:frontend` | `testing:unit`, `testing:visual` |

## Bootstrap labels on GitHub

The cloud agent token cannot create repo labels. A maintainer with `admin` on the repo can run:

```bash
./scripts/sync-pr-labels.sh
```

Then apply labels in the GitHub UI or with `gh pr edit <n> --add-label "workstream:WS3,area:frontend,testing:e2e"`.