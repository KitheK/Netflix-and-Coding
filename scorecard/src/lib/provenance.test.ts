import { describe, expect, it } from "vitest";
import { agentClaim, assertAgentCannotConfirm, authorConfirm } from "./provenance";
import { SCHEMA_VERSION, themePresets, validateArchitecture, validateScorecard, type ScorecardFile } from "./schemas";

describe("provenance", () => {
  it("agentClaim never returns confirmed", () => {
    const c = agentClaim({ source: "generated", provenance: "draft" });
    expect(c.provenance).not.toBe("confirmed");
  });

  it("inferred without evidence becomes draft", () => {
    const c = agentClaim({ source: "generated", provenance: "inferred" });
    expect(c.provenance).toBe("draft");
  });

  it("authorConfirm sets confirmed+authored", () => {
    const c = authorConfirm(agentClaim({ source: "generated", provenance: "draft" }));
    expect(c.provenance).toBe("confirmed");
    expect(c.source).toBe("authored");
  });

  it("rejects generated+confirmed", () => {
    expect(() =>
      assertAgentCannotConfirm({ provenance: "confirmed", source: "generated" }),
    ).toThrow();
  });
});

describe("schemas", () => {
  it("themePresets plain disables ornaments", () => {
    const t = themePresets("plain", "plain");
    expect(t.ornaments.plateFrame).toBe("none");
    expect(t.ornaments.footFrieze).toBe("none");
  });

  it("validateScorecard catches agent confirm", () => {
    const bad: ScorecardFile = {
      schemaVersion: SCHEMA_VERSION,
      size: "lite",
      job: { text: "x", provenance: "draft", source: "generated" },
      brief: { text: "b", provenance: "draft", source: "generated" },
      outcome: { text: "o", provenance: "draft", source: "generated" },
      features: [{ name: "A", status: "works", provenance: "confirmed", source: "generated" }],
      built: { text: "me", provenance: "draft", source: "generated" },
      borrowed: { text: "lib", provenance: "draft", source: "generated" },
    };
    expect(validateScorecard(bad).some((e) => e.includes("cannot confirm"))).toBe(true);
  });

  it("validateArchitecture drops bad paths via errors", () => {
    const errs = validateArchitecture(
      {
        schemaVersion: SCHEMA_VERSION,
        nodes: [
          { id: "a", label: "A", path: "src/ok.ts" },
          { id: "b", label: "B", path: "missing.ts" },
        ],
        edges: [],
      },
      (p) => p === "src/ok.ts",
    );
    expect(errs).toHaveLength(1);
    expect(errs[0]).toContain("missing.ts");
  });
});
