import { describe, expect, it } from "vitest";
import { validateArchitecture } from "../lib/schemas";
import { applyArchitectureLayout, metricsForCanvas, tightViewBox, plateLayoutMetrics } from "./architectureLayout";
import { buildArchitecture, scanArchitectureGraph } from "./architecture";
import { MAX_ARCHITECTURE_NODES, MIN_ARCHITECTURE_NODES } from "./architectureScan";
import { fitLines } from "../components/plates/kit";

describe("architecture layout", () => {
  it("assigns coordinates on spine-lr", () => {
    const arch = buildArchitecture({
      nodes: [
        { id: "a", label: "A", group: "g1" },
        { id: "b", label: "B", group: "g1" },
        { id: "c", label: "C", group: "g2" },
      ],
      edges: [
        { from: "a", to: "b" },
        { from: "b", to: "c" },
      ],
    });
    expect(arch.nodes.every((n) => n.x !== undefined && n.y !== undefined)).toBe(true);
    expect(validateArchitecture(arch, () => true, { minNodes: 3, minEdges: 2, requireInteractiveFields: true })).toEqual(
      [],
    );
  });

  it("tight viewBox wraps content", () => {
    const arch = applyArchitectureLayout(
      buildArchitecture({
        nodes: [
          { id: "a", label: "A", group: "client" },
          { id: "b", label: "B", group: "runtime" },
          { id: "c", label: "C", group: "data", tone: "data" },
        ],
        edges: [
          { from: "a", to: "b" },
          { from: "b", to: "c" },
        ],
      }),
    );
    const m = metricsForCanvas(arch, 880);
    const vb = tightViewBox(arch.nodes, m).split(/\s+/).map(Number);
    expect(vb[2]).toBeLessThan(950);
    expect(vb[2] / vb[3]).toBeGreaterThan(1.2);
  });

  it("scan + build from this repo uses system components", () => {
    const arch = buildArchitecture(scanArchitectureGraph(process.cwd()));
    expect(arch.nodes.length).toBeGreaterThanOrEqual(MIN_ARCHITECTURE_NODES);
    expect(arch.nodes.length).toBeLessThanOrEqual(MAX_ARCHITECTURE_NODES);
    expect(arch.nodes.length).toBe(8);
    expect(arch.nodes.some((n) => n.id === "skill")).toBe(true);
    expect(arch.nodes.some((n) => n.id === "schemas")).toBe(false);
    expect(arch.nodes.some((n) => n.label === "architecture.test.ts")).toBe(false);
    expect(arch.overview?.text.includes("<br")).toBe(false);
    expect(arch.mermaid).toContain("flowchart");
  });
});

describe("label fitting", () => {
  it("wraps long parenthetical labels", () => {
    const { lines } = fitLines("(OpenAI API)", 72, 11);
    expect(lines.join(" ")).toContain("OpenAI");
  });
});