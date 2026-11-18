import type { ContentBundle } from "./loadContent";
import { loadContent } from "./loadContent";
import type { RequirementsFile, RunFile, ScorecardFile, TeamFile } from "./schemas";

import hackathonScorecard from "../../content/dogfood/hackathon-scorecard.json";
import hackathonRun from "../../content/dogfood/hackathon-run.json";
import personalScorecard from "../../content/dogfood/personal-cli.json";
import personalRun from "../../content/dogfood/personal-cli-run.json";
import assignmentScorecard from "../../content/dogfood/assignment-scorecard.json";
import assignmentRun from "../../content/dogfood/assignment-run.json";
import assignmentRequirements from "../../content/dogfood/assignment-requirements.json";
import teamScorecard from "../../content/dogfood/team-scorecard.json";
import teamRun from "../../content/dogfood/team-run.json";
import teamPeople from "../../content/dogfood/team.json";
import teamArchitecture from "../../content/dogfood/team-architecture.json";
import noReadmeScorecard from "../../content/dogfood/no-readme-scorecard.json";
import noReadmeRun from "../../content/dogfood/no-readme-run.json";

export type DogfoodDemo = {
  id: string;
  title: string;
  audience: string;
  repoShape: string;
  summary: string;
  scorecard: ScorecardFile;
  run: RunFile;
  team?: TeamFile;
  requirements?: RequirementsFile;
  notesPath?: string;
};

export const DOGFOOD_DEMOS: DogfoodDemo[] = [
  {
    id: "hackathon",
    title: "Hackathon weekend",
    audience: "Builders who need a 90-second judge story",
    repoShape: "Greenfield weekend repo, mocked integrations OK",
    summary: "Lite page: works vs stubbed, biggest gap, demo script — no empty chapters.",
    scorecard: hackathonScorecard as ScorecardFile,
    run: hackathonRun as RunFile,
  },
  {
    id: "personal-cli",
    title: "Personal CLI",
    audience: "Solo tools and scripts",
    repoShape: "Small CLI with brittle edges",
    summary: "Honest partials (dry-run, Windows paths) without grading the author.",
    scorecard: personalScorecard as ScorecardFile,
    run: personalRun as RunFile,
  },
  {
    id: "assignment",
    title: "Course assignment",
    audience: "Students mapping work to a rubric",
    repoShape: "Starter + required features with evidence paths",
    summary: "Requirements map stays visible; partial persistence stays partial.",
    scorecard: assignmentScorecard as ScorecardFile,
    run: assignmentRun as RunFile,
    requirements: assignmentRequirements as RequirementsFile,
  },
  {
    id: "team",
    title: "Team product",
    audience: "Multi-person projects",
    repoShape: "Shared ownership across UI and tooling",
    summary: "People and areas listed; no invented individual metrics.",
    scorecard: teamScorecard as ScorecardFile,
    run: teamRun as RunFile,
    team: teamPeople as TeamFile,
  },
  {
    id: "no-readme",
    title: "No README",
    audience: "Agents scanning sparse repos",
    repoShape: "Entrypoints only — purpose unclear",
    summary: "Draft-heavy Lite scaffold; agent must ask before sounding sure.",
    scorecard: noReadmeScorecard as ScorecardFile,
    run: noReadmeRun as RunFile,
    notesPath: "content/dogfood/no-readme-notes.md",
  },
];

export function getDogfoodDemo(id: string): DogfoodDemo | undefined {
  return DOGFOOD_DEMOS.find((d) => d.id === id);
}

/** Overlay a dogfood pack onto the default kit bundle for in-app demos. */
export function bundleForDemo(demo: DogfoodDemo): ContentBundle {
  const base = loadContent();
  return {
    ...base,
    scorecard: demo.scorecard,
    run: demo.run,
    team: demo.team ?? { schemaVersion: 1, people: [] },
    requirements: demo.requirements ?? { schemaVersion: 1, items: [] },
    decisions: { schemaVersion: 1, decisions: [] },
    manual: { schemaVersion: 1, title: demo.title, parts: [], chapters: [] },
    architecture:
      demo.id === "team"
        ? (teamArchitecture as ContentBundle["architecture"])
        : { schemaVersion: 1, nodes: [], edges: [] },
    branches: { schemaVersion: 1, form: "river", events: [] },
    stack: { schemaVersion: 1, parts: [] },
    apis: { schemaVersion: 1, routes: [] },
  };
}
