import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  SCHEMA_VERSION,
  buildInterviewHandoff,
  fontTracePackPaths,
  interviewNeedsForm,
  manualTitleFromProjectName,
  validateArchitecture,
  validateFontPackManifest,
  validateFontTracePack,
  validateInterview,
  validateInterviewHandoff,
  validateManual,
  validateManualBlock,
  type ArchitectureFile,
  type FontPackManifest,
  type InterviewFile,
  type InterviewHandoffFile,
  type ManualBlock,
  type ManualFile,
} from "./schemas";

const fixtureRoot = join(import.meta.dirname, "../../docs/contracts/fixtures");

function loadJson<T>(name: string): T {
  return JSON.parse(readFileSync(join(fixtureRoot, name), "utf8")) as T;
}

describe("WS0 contracts", () => {
  it("manualTitleFromProjectName", () => {
    expect(manualTitleFromProjectName("Conductor")).toBe("Conductor Guide");
    expect(manualTitleFromProjectName("Conductor Guide")).toBe("Conductor Guide");
  });

  it("validates interview fixture", () => {
    const interview = loadJson<InterviewFile>("interview.sample.json");
    expect(validateInterview(interview)).toEqual([]);
    expect(interviewNeedsForm(interview)).toBe(false);
  });

  it("buildInterviewHandoff drops empty answers", () => {
    const interview = loadJson<InterviewFile>("interview.sample.json");
    const handoff = buildInterviewHandoff(interview);
    expect(handoff.answers.B1).toBeDefined();
    expect(validateInterviewHandoff(handoff)).toEqual([]);
  });

  it("validates interview-handoff fixture", () => {
    const handoff = loadJson<InterviewHandoffFile>("interview-handoff.sample.json");
    expect(validateInterviewHandoff(handoff)).toEqual([]);
  });

  it("validates interactive architecture fixture", () => {
    const arch = loadJson<ArchitectureFile>("architecture.interactive.sample.json");
    const exists = (p: string) => p === "package.json";
    expect(
      validateArchitecture(arch, exists, { minNodes: 3, minEdges: 2, requireInteractiveFields: true }),
    ).toEqual([]);
  });

  it("validates font pack fixture (paths optional)", () => {
    const pack = loadJson<FontPackManifest>("font-pack.libretto-default.json");
    expect(validateFontPackManifest(pack)).toEqual([]);
    expect(validateFontPackManifest(pack, () => false).length).toBeGreaterThan(0);
  });

  it("font trace pack path helper", () => {
    const paths = fontTracePackPaths("my-display");
    expect(paths.manifest).toContain("font-packs/my-display/manifest.json");
    const errs = validateFontTracePack(
      { ...paths, woff2: ["/fonts/LibrettoPaleologue-Regular.woff2"] },
      (p) => p === "/fonts/LibrettoPaleologue-Regular.woff2",
    );
    expect(errs.some((e) => e.includes("manifest"))).toBe(true);
  });

  it("validates media manual blocks fixture", () => {
    const blocks = loadJson<ManualBlock[]>("manual-blocks.media.sample.json");
    for (const [i, b] of blocks.entries()) {
      expect(validateManualBlock(b, `block[${i}]`)).toEqual([]);
    }
  });

  it("validateManual enforces title when projectName set", () => {
    const manual: ManualFile = {
      schemaVersion: SCHEMA_VERSION,
      projectName: "Acme",
      title: "Wrong",
      parts: [],
      chapters: [],
    };
    expect(validateManual(manual).some((e) => e.includes("manual.title"))).toBe(true);
    manual.title = manualTitleFromProjectName("Acme");
    expect(validateManual(manual)).toEqual([]);
  });

  it("interviewNeedsForm when answers empty", () => {
    const empty: InterviewFile = {
      schemaVersion: SCHEMA_VERSION,
      depth: "quick",
      profile: {},
      answers: {},
    };
    expect(interviewNeedsForm(empty)).toBe(true);
  });
});