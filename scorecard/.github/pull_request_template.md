## Summary

<!-- What changed and why (1–3 sentences). -->

## Workstream & area

Apply **all** labels that apply (create once per repo via `scripts/sync-pr-labels.sh`):

| Label | When |
|-------|------|
| `workstream:WS0` … `workstream:WS5`, `workstream:meta` | Matches the overhaul workstream in the branch/PR title |
| `area:frontend` | React UI, styles, plates, Playwright |
| `area:backend` | Schemas, generators, CLI, contracts, `check` |
| `testing:unit` | `npm test` / Vitest coverage included |
| `testing:e2e` | Playwright specs included |
| `testing:visual` | Screenshot or visual regression artifacts |
| `testing:manual` | Human QA only — no automated gate in this PR |

**Branch naming:** `Agent/<short-slug>-<suffix>` with PR title prefix `WSn:` when part of the Libretto overhaul.

## Test plan

- [ ] `npm test`
- [ ] `npm run check`
- [ ] `npm run build`
- [ ] Other: <!-- e.g. npm run test:e2e -->

## Screenshots

<!-- Light + dark when UI changes. Attach kit/team architecture plates when touching WS3. -->