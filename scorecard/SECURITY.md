# Security

Scorecard helps authors describe repos honestly. It must not leak secrets.

## Redaction

Before writing `content/*.json` or committing a scaffold, the skill runs a
redaction pass:

- Never copy API keys, tokens, passwords, or private URLs into content.
- Env **names** (e.g. `DATABASE_URL`) are fine; **values** are not.
- Prefer public paths and commit SHAs as evidence pointers.

## Write / save endpoint

`npx scorecard-kit dev` exposes a local save endpoint for Write mode. Do not expose
that process to the public internet. Production builds (`npx scorecard-kit build`)
ship **without** Write / save.

## Reporting

If you find a security issue in Scorecard, open a private advisory on
[github.com/KitheK/scorecard](https://github.com/KitheK/scorecard) or contact
the author via GitHub (@KitheK).
