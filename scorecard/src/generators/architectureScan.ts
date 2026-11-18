import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { GraphInput } from "./architecture";

export const MAX_ARCHITECTURE_NODES = 14;
export const MIN_ARCHITECTURE_NODES = 6;

type ComponentSpec = {
  id: string;
  label: string;
  path: string;
  group: string;
  tone: NonNullable<GraphInput["nodes"][0]["tone"]>;
  role: string;
  evidence?: string;
  summary?: string;
  required?: boolean;
};

const SCORECARD_COMPONENTS: ComponentSpec[] = [
  {
    id: "skill",
    label: "Agent skill",
    path: "skills/scorecard/SKILL.md",
    group: "authoring",
    tone: "agent",
    role: "Interview, scan, content workflow",
    evidence: "skills/scorecard/SKILL.md",
  },
  {
    id: "cli",
    label: "CLI",
    path: "bin/scorecard.js",
    group: "delivery",
    tone: "runtime",
    role: "dev, build, check commands",
    evidence: "bin/scorecard.js",
  },
  {
    id: "dev-server",
    label: "Vite dev",
    path: "vite.config.ts",
    group: "delivery",
    tone: "edge",
    role: "Local dev server and Write saves",
    evidence: "vite.config.ts · vite-plugin-scorecard-save.ts",
  },
  {
    id: "build",
    label: "Build output",
    path: "package.json",
    group: "delivery",
    tone: "runtime",
    role: "Production bundle to dist/",
    evidence: "npm run build",
  },
  {
    id: "renderer",
    label: "Guide renderer",
    path: "src/App.tsx",
    group: "application",
    tone: "client",
    role: "React manual and scorecard pages",
    evidence: "src/App.tsx",
  },
  {
    id: "plates",
    label: "Interactive plates",
    path: "src/components/plates/kit.tsx",
    group: "application",
    tone: "service",
    role: "SVG architecture figures in NouveauFrame",
    evidence: "src/components/plates/",
  },
  {
    id: "generators",
    label: "Generators",
    path: "src/generators/architecture.ts",
    group: "application",
    tone: "service",
    role: "Architecture, timeline, contracts",
    evidence: "src/generators/ · src/lib/schemas.ts",
  },
  {
    id: "content",
    label: "Content JSON",
    path: "content/manual.json",
    group: "data",
    tone: "data",
    role: "Authoritative content bundle",
    evidence: "content/*.json",
  },
];

function stripHtml(text: string): string {
  return text
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function overviewFromReadme(root: string): string | undefined {
  try {
    const readme = readFileSync(join(root, "README.md"), "utf8").slice(0, 2400);
    const line = readme
      .split(/\n+/)
      .map((l) => stripHtml(l.trim()))
      .find(
        (l) =>
          l &&
          !l.startsWith("#") &&
          !l.startsWith("!") &&
          !/^[\[(]/.test(l) &&
          !l.includes("align=") &&
          l.length > 24,
      );
    if (line) return line.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").slice(0, 220);
  } catch {
    /* no readme */
  }
  return "System components inferred from repository layout.";
}

/** Bounded repo scan → system components (not per-file nodes). */
export function scanArchitectureGraph(root: string = process.cwd()): GraphInput {
  const nodes: GraphInput["nodes"] = [];

  for (const spec of SCORECARD_COMPONENTS) {
    if (nodes.length >= MAX_ARCHITECTURE_NODES) break;
    if (!existsSync(join(root, spec.path))) continue;
    nodes.push({
      id: spec.id,
      label: spec.label,
      path: spec.path,
      group: spec.group,
      tone: spec.tone,
      detail: {
        role: spec.role,
        evidence: spec.evidence ?? spec.path,
        summary: spec.summary,
      },
    });
  }

  const byId = new Set(nodes.map((n) => n.id));
  const edges: GraphInput["edges"] = [];
  const link = (from: string, to: string, label?: string) => {
    if (byId.has(from) && byId.has(to)) edges.push({ from, to, label });
  };

  link("skill", "content", "fills");
  link("skill", "generators", "invokes");
  link("generators", "content", "writes");
  link("cli", "dev-server", "serves");
  link("dev-server", "renderer", "hosts");
  link("content", "renderer", "drives");
  link("generators", "plates", "layout");
  link("plates", "renderer", "embeds");
  link("cli", "build", "builds");

  return {
    root,
    overview: overviewFromReadme(root),
    nodes,
    edges,
  };
}