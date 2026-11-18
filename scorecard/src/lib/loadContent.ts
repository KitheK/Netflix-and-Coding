import type {
  ApisFile,
  ArchitectureFile,
  BranchesFile,
  DecisionFile,
  ManualFile,
  RequirementsFile,
  RunFile,
  ScorecardFile,
  StackFile,
  TeamFile,
  ThemeJson,
  InterviewFile,
} from "./schemas";

import theme from "../../content/theme.json";
import scorecard from "../../content/scorecard.json";
import run from "../../content/run.json";
import decisions from "../../content/decisions.json";
import manual from "../../content/manual.json";
import architecture from "../../content/architecture.json";
import branches from "../../content/branches.json";
import stack from "../../content/stack.json";
import apis from "../../content/apis.json";
import requirements from "../../content/requirements.json";
import team from "../../content/team.json";
import interview from "../../content/interview.json";

export type ContentBundle = {
  theme: ThemeJson;
  scorecard: ScorecardFile;
  run: RunFile;
  decisions: DecisionFile;
  manual: ManualFile;
  architecture: ArchitectureFile;
  branches: BranchesFile;
  stack: StackFile;
  apis: ApisFile;
  requirements: RequirementsFile;
  team: TeamFile;
  interview: InterviewFile;
};

export function loadContent(): ContentBundle {
  return {
    theme: theme as ThemeJson,
    scorecard: scorecard as ScorecardFile,
    run: run as RunFile,
    decisions: decisions as DecisionFile,
    manual: manual as ManualFile,
    architecture: architecture as ArchitectureFile,
    branches: branches as BranchesFile,
    stack: stack as StackFile,
    apis: apis as ApisFile,
    requirements: requirements as RequirementsFile,
    team: team as TeamFile,
    interview: interview as InterviewFile,
  };
}
