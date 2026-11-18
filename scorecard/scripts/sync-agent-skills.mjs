#!/usr/bin/env node
/** Copy canonical skills/scorecard → Claude, Codex, Copilot, and Cursor plugin paths. */
import { cpSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "skills", "scorecard");
const dests = [
  join(root, ".claude", "skills", "scorecard"),
  join(root, ".agents", "skills", "scorecard"),
  join(root, ".github", "skills", "scorecard"),
];

for (const dest of dests) {
  rmSync(dest, { recursive: true, force: true });
  mkdirSync(dirname(dest), { recursive: true });
  cpSync(src, dest, { recursive: true });
  console.log("synced", dest);
}

const agentMd = `---
name: scorecard
description: >
  Build a descriptive Scorecard / project manual for a repository — what was
  built, what works, what does not, how to run it. Never grades. Use when the
  user wants Lite, Standard, or Full docs with Write mode or provenance.
---

Follow the Scorecard skill in \`.github/skills/scorecard/SKILL.md\` (same content
as \`skills/scorecard/SKILL.md\`). Infer first, confirm with the author, scaffold
the kit, never set provenance to confirmed, never invent metrics.
`;

const agentPath = join(root, ".github", "agents", "scorecard.agent.md");
mkdirSync(dirname(agentPath), { recursive: true });
writeFileSync(agentPath, agentMd, "utf8");
console.log("wrote", agentPath);
