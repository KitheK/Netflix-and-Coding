import { describe, expect, it } from "vitest";
import { buildArchitecture } from "./architecture";
import { chooseTimelineForm, buildTimeline } from "./timeline";
import { redactEnvValues, scanForSecrets } from "./redaction";

describe("architecture", () => {
  it("drops missing paths", () => {
    const arch = buildArchitecture({
      root: process.cwd(),
      nodes: [
        { id: "pkg", label: "pkg", path: "package.json" },
        { id: "gone", label: "gone", path: "nope-missing.ts" },
      ],
      edges: [
        { from: "pkg", to: "gone" },
        { from: "pkg", to: "pkg" },
      ],
    });
    expect(arch.nodes.map((n) => n.id)).toEqual(["pkg"]);
    expect(arch.edges).toEqual([{ from: "pkg", to: "pkg" }]);
  });
});

describe("timeline", () => {
  it("chooses river for merges over weeks", () => {
    expect(chooseTimelineForm({ mergeCount: 3, commitCount: 40, spanDays: 30 })).toBe("river");
  });

  it("tags events inferred", () => {
    const t = buildTimeline("build-log", [{ id: "1", label: "Start", t: 0 }]);
    expect(t.events[0].provenance).toBe("inferred");
  });
});

describe("redaction", () => {
  it("catches planted secrets", () => {
    const hits = scanForSecrets('API_KEY="sk-supersecrettokenvalue"\nAKIAIOSFODNN7EXAMPLE');
    expect(hits.length).toBeGreaterThan(0);
  });

  it("redacts env values not names", () => {
    expect(redactEnvValues("SECRET_TOKEN=abc123\nPATH=/usr")).toContain("SECRET_TOKEN=<redacted>");
    expect(redactEnvValues("SECRET_TOKEN=abc123")).not.toContain("abc123");
  });
});
