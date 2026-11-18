import { describe, expect, it } from "vitest";
import {
  SCHEMA_VERSION,
  buildInterviewHandoff,
  interviewNeedsForm,
  validateInterview,
  validateInterviewHandoff,
  type InterviewFile,
} from "../lib/schemas";
import { assembleInterviewFile, depthFromAnswers, profileFromAnswers } from "./merge";
import { INTERVIEW_STAGES, questionsForStage, visibleStageList } from "./questions";

describe("WS2 interview", () => {
  it("sliders expose discrete stops for team size and time", () => {
    const stageA = INTERVIEW_STAGES.find((s) => s.id === "A")!;
    const a2 = stageA.questions.find((q) => q.key === "A2");
    const a5 = stageA.questions.find((q) => q.key === "A5");
    expect(a2?.kind).toBe("slider");
    expect(a5?.kind).toBe("slider");
    if (a2?.kind === "slider") expect(a2.stops.length).toBeGreaterThanOrEqual(5);
    if (a5?.kind === "slider") expect(a5.stops.length).toBe(5);
  });

  it("visible stages respect depth", () => {
    expect(visibleStageList("quick").map((s) => s.id)).toEqual(["A", "B", "E", "N"]);
    expect(visibleStageList("deep").map((s) => s.id)).toContain("D");
    const bQuick = questionsForStage(visibleStageList("quick").find((s) => s.id === "B")!, "quick");
    expect(bQuick.map((q) => q.key)).toEqual(["B1", "B2", "B3"]);
  });

  it("assembleInterviewFile maps profile and narrative", () => {
    const base: InterviewFile = {
      schemaVersion: SCHEMA_VERSION,
      depth: "standard",
      profile: { kind: "oss" },
      answers: {},
    };
    const next = assembleInterviewFile(
      base,
      {
        projectName: { value: "Northstar", provenance: "confirmed" },
        A6: { value: "quick", provenance: "confirmed" },
        B1: { value: "Does things.", provenance: "confirmed" },
        narrative_hook: { value: "We shipped.", provenance: "confirmed" },
      },
      { markSubmitted: true },
    );
    expect(next.profile.projectName).toBe("Northstar");
    expect(next.depth).toBe("quick");
    expect(next.narrative?.hook).toBe("We shipped.");
    expect(next.submittedAt).toBeTruthy();
    expect(validateInterview(next, { requireProjectName: true })).toEqual([]);
    expect(interviewNeedsForm(next)).toBe(false);
  });

  it("buildInterviewHandoff from assembled file matches contract", () => {
    const base: InterviewFile = {
      schemaVersion: SCHEMA_VERSION,
      depth: "standard",
      profile: { projectName: "Acme" },
      answers: {
        B1: { value: "Ship widgets.", provenance: "confirmed" },
        B_skip: { value: "", provenance: "confirmed" },
      },
    };
    const handoff = buildInterviewHandoff(base);
    expect(handoff.answers.B1).toBeDefined();
    expect(handoff.answers.B_skip).toBeUndefined();
    expect(validateInterviewHandoff(handoff)).toEqual([]);
  });

  it("profileFromAnswers reads A* keys", () => {
    const profile = profileFromAnswers(
      {
        A1: { value: "team", provenance: "confirmed" },
        A4: { value: "run", provenance: "confirmed" },
      },
      {},
    );
    expect(profile.kind).toBe("team");
    expect(profile.readerGoal).toBe("run");
    expect(depthFromAnswers({ A6: { value: "deep", provenance: "confirmed" } }, "quick")).toBe("deep");
  });
});