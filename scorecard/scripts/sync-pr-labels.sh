#!/usr/bin/env bash
# Create the Scorecard PR label taxonomy (requires gh auth with label write access).
set -euo pipefail
repo="${1:-KitheK/scorecard}"

create() {
  gh label create "$1" --repo "$repo" --color "$2" --description "$3" --force
}

create "workstream:WS0" "1e3a5f" "WS0 contracts and shared schemas"
create "workstream:WS2" "0e8a16" "WS2 interview and CLI"
create "workstream:WS3" "5319e7" "WS3 architecture plates"
create "workstream:WS4" "7057ff" "WS4 home and block renderer"
create "workstream:WS5" "bfdadc" "WS5 fonts and trace"
create "workstream:meta" "d4c5f9" "Planning docs and agent process"
create "area:frontend" "0ea5e9" "UI renderer components styles e2e"
create "area:backend" "1d76db" "Schemas generators CLI contracts"
create "testing:unit" "cfd3d7" "Vitest unit tests in PR"
create "testing:e2e" "c2e0c6" "Playwright e2e in PR"
create "testing:visual" "fbca04" "Screenshot visual regression"
create "testing:manual" "ededed" "Manual QA only no automated gate"

echo "Labels synced on $repo"