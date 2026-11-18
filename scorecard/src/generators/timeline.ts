import { SCHEMA_VERSION, type BranchesFile } from "../lib/schemas";

export type TimelineEvent = { id: string; label: string; t: number; blurb?: string; branch?: string };

export function buildTimeline(
  form: BranchesFile["form"],
  events: TimelineEvent[],
): BranchesFile {
  return {
    schemaVersion: SCHEMA_VERSION,
    form,
    events: events.map((e) => ({
      ...e,
      provenance: "inferred" as const,
      source: "generated" as const,
      evidence: e.branch ? `git:${e.branch}` : "git-log",
    })),
  };
}

/** Pick timeline form from crude history signals. */
export function chooseTimelineForm(opts: {
  mergeCount: number;
  commitCount: number;
  spanDays: number;
}): BranchesFile["form"] {
  if (opts.mergeCount >= 2 && opts.spanDays >= 14) return "river";
  if (opts.spanDays <= 3 && opts.commitCount > 0) return "hourly";
  return "build-log";
}
