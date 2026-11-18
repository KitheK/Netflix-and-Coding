import {
  SCHEMA_VERSION,
  buildInterviewHandoff,
  interviewNeedsForm,
  manualTitleFromProjectName,
  normalizeInterviewAnswer,
  type InterviewAnswer,
  type InterviewDepth,
  type InterviewFile,
  type InterviewProfile,
} from "../lib/schemas";

const PROFILE_KEYS: Record<string, keyof InterviewProfile> = {
  projectName: "projectName",
  A1: "kind",
  A2: "builders",
  A3: "purpose",
  A4: "readerGoal",
  A5: "scale",
};

export function readAnswerValue(answers: InterviewFile["answers"], key: string): string {
  const raw = answers[key];
  const norm = normalizeInterviewAnswer(raw);
  if (!norm || norm.value === null) return "";
  return String(norm.value);
}

export function profileFromAnswers(answers: InterviewFile["answers"], prev: InterviewProfile): InterviewProfile {
  const next: InterviewProfile = { ...prev };
  for (const [key, field] of Object.entries(PROFILE_KEYS)) {
    const v = readAnswerValue(answers, key === "projectName" ? "projectName" : key);
    if (v) (next as Record<string, string>)[field] = v;
  }
  if (readAnswerValue(answers, "projectName")) {
    next.projectName = readAnswerValue(answers, "projectName").trim();
  }
  return next;
}

export function depthFromAnswers(answers: InterviewFile["answers"], fallback: InterviewDepth): InterviewDepth {
  const d = readAnswerValue(answers, "A6");
  if (d === "quick" || d === "standard" || d === "deep") return d;
  return fallback;
}

export function narrativeFromAnswers(answers: InterviewFile["answers"]): InterviewFile["narrative"] {
  const hook = readAnswerValue(answers, "narrative_hook");
  const proudMoment = readAnswerValue(answers, "narrative_proud");
  if (!hook && !proudMoment) return undefined;
  return { hook: hook || undefined, proudMoment: proudMoment || undefined };
}

export function assembleInterviewFile(
  base: InterviewFile,
  answers: Record<string, InterviewAnswer>,
  opts?: { markSubmitted?: boolean },
): InterviewFile {
  const mergedAnswers = { ...base.answers, ...answers };
  const depth = depthFromAnswers(mergedAnswers, base.depth);
  const profile = profileFromAnswers(mergedAnswers, base.profile);
  const narrative = narrativeFromAnswers(mergedAnswers);
  return {
    ...base,
    schemaVersion: SCHEMA_VERSION,
    depth,
    profile,
    answers: mergedAnswers,
    narrative,
    submittedAt: opts?.markSubmitted ? new Date().toISOString() : base.submittedAt,
  };
}

export { buildInterviewHandoff, interviewNeedsForm, manualTitleFromProjectName };