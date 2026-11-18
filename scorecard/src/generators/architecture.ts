import { existsSync } from "node:fs";
import { join } from "node:path";
import { SCHEMA_VERSION, type ArchitectureFile, type ArchitectureNodeTone } from "../lib/schemas";
import { applyArchitectureLayout, inferGroupsFromNodes } from "./architectureLayout";

export type GraphInput = {
  overview?: string;
  nodes: Array<{
    id: string;
    label: string;
    path?: string;
    group?: string;
    tone?: ArchitectureNodeTone;
    detail?: { role?: string; evidence?: string; ports?: string[]; summary?: string };
  }>;
  edges: Array<{ from: string; to: string; label?: string }>;
  root?: string;
  layout?: ArchitectureFile["layout"];
  figureId?: string;
};

function defaultDetail(label: string, path?: string): NonNullable<GraphInput["nodes"][0]["detail"]> {
  return {
    role: label,
    evidence: path ?? "repo-scan",
    summary: path ? `Evidence path: ${path}` : undefined,
  };
}

function mermaidFromGraph(
  nodes: Array<{ id: string; label: string }>,
  edges: Array<{ from: string; to: string; label?: string }>,
): string {
  return [
    "flowchart LR",
    ...nodes.map((n) => `  ${n.id}["${n.label.replace(/"/g, "'")}"]`),
    ...edges.map((e) => {
      const lbl = (e.label ?? "").replace(/\|/g, "/");
      return lbl ? `  ${e.from} -->|${lbl}| ${e.to}` : `  ${e.from} --> ${e.to}`;
    }),
  ].join("\n");
}

function stripHtml(text: string): string {
  return text
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Build architecture.json; drop nodes whose paths do not exist. */
export function buildArchitecture(input: GraphInput): ArchitectureFile {
  const root = input.root ?? process.cwd();
  const nodes = input.nodes
    .filter((n) => !n.path || existsSync(join(root, n.path)))
    .map((n) => ({
      ...n,
      detail: n.detail ?? defaultDetail(n.label, n.path),
    }));
  const ids = new Set(nodes.map((n) => n.id));
  const edges = input.edges.filter((e) => ids.has(e.from) && ids.has(e.to));

  let file: ArchitectureFile = {
    schemaVersion: SCHEMA_VERSION,
    figureId: input.figureId ?? "ARCH_001",
    layout: input.layout ?? "spine-lr",
    overview: input.overview
      ? {
          text: stripHtml(input.overview),
          provenance: "inferred",
          source: "generated",
          evidence: "repo-scan",
        }
      : undefined,
    nodes,
    edges,
    groups: inferGroupsFromNodes(nodes),
    mermaid: mermaidFromGraph(nodes, edges),
  };

  file = applyArchitectureLayout(file);
  return file;
}

export { applyArchitectureLayout, inferGroupsFromNodes } from "./architectureLayout";
export { scanArchitectureGraph, MAX_ARCHITECTURE_NODES, MIN_ARCHITECTURE_NODES } from "./architectureScan";