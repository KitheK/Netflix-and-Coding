# Making Software font pack

Typography on [makingsoftware.com](https://www.makingsoftware.com) (Dan Hollick) per public CSS/design audits (Fudge DESIGN.md, 2026-08-10):

| Role on site | Intended face | License | Bundled in kit |
|--------------|---------------|---------|----------------|
| Section titles, body prose | **ABC Arizona Mix** | Commercial (Dinamo) | **Literata** (OFL) |
| Nav, labels, wordmark grid | **Departure Mono** | OFL | **Departure Mono** (same file) |
| Fallback (unused in UI) | New York, system-ui | Apple / generic | **Source Sans 3** for UI slot |

We do **not** redistribute Arizona Mix or New York. Use `substitutions` in `manifest.json` for attribution. Licensees may drop vendor files under `vendor/` as described in `proprietarySlots.display`.