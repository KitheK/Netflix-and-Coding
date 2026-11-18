import type { InterviewDepth } from "../lib/schemas";

export type QuestionField =
  | {
      kind: "choice";
      key: string;
      label: string;
      prompt: string;
      example?: string;
      options: Array<{ value: string; label: string }>;
      optional?: boolean;
    }
  | {
      kind: "slider";
      key: string;
      label: string;
      prompt: string;
      example?: string;
      stops: Array<{ value: string; label: string }>;
      optional?: boolean;
    }
  | {
      kind: "text" | "textarea";
      key: string;
      label: string;
      prompt: string;
      example?: string;
      placeholder?: string;
      optional?: boolean;
    };

export type InterviewStage = {
  id: string;
  mono: string;
  title: string;
  standfirst: string;
  minDepth: InterviewDepth;
  /** When set, only these question keys appear for quick depth in this stage. */
  quickKeys?: string[];
  questions: QuestionField[];
};

const depthRank: Record<InterviewDepth, number> = { quick: 0, standard: 1, deep: 2 };

export const INTERVIEW_STAGES: InterviewStage[] = [
  {
    id: "A",
    mono: "STAGE A",
    title: "Who is this guide for?",
    standfirst:
      "Before we open the repo, tell us how you think about the project — like a commissioning editor sizing up a manuscript.",
    minDepth: "quick",
    questions: [
      {
        kind: "text",
        key: "projectName",
        label: "Guide title",
        prompt: "What should we call your documentation guide?",
        example:
          'The name readers see on the manual — repo name, product name, or “Northstar API”. We publish it as “<Name> Guide”.',
        placeholder: "e.g. Conductor",
      },
      {
        kind: "choice",
        key: "A1",
        label: "Shape of the work",
        prompt: "Which shelf does this project sit on?",
        example: "A hackathon spike reads differently from a team handoff.",
        options: [
          { value: "personal", label: "Personal experiment" },
          { value: "coursework", label: "Coursework / assignment" },
          { value: "hackathon", label: "Hackathon or jam" },
          { value: "team", label: "Team product" },
          { value: "work", label: "Day job / client" },
          { value: "oss", label: "Open source" },
          { value: "research", label: "Research" },
          { value: "other", label: "Something else" },
        ],
      },
      {
        kind: "slider",
        key: "A2",
        label: "Who built it",
        prompt: "Slide to the team size that matches how you actually worked.",
        example: "Stops map to profile size bands the agent uses for tone and attribution.",
        stops: [
          { value: "solo", label: "Just me" },
          { value: "small team", label: "Pair · about 2" },
          { value: "small team", label: "Small team · 3–4" },
          { value: "small team", label: "Team · 5–6" },
          { value: "larger", label: "Larger · 7 or more" },
          { value: "solo-in-team", label: "Mostly me inside a bigger org" },
        ],
      },
      {
        kind: "choice",
        key: "A3",
        label: "Why this exists",
        prompt: "What job is this guide doing for you — and who asked for it?",
        example:
          "This choice steers story vs runbook vs pitch. Future exports (memo, slide deck, short pitch) will reuse the same answer.",
        options: [
          { value: "submission", label: "Submit for grading / review" },
          { value: "portfolio", label: "Portfolio piece" },
          { value: "handoff", label: "Hand off to the next maintainer" },
          { value: "demo", label: "Demo or pitch" },
          { value: "personal", label: "Personal archive" },
          { value: "stakeholder", label: "Stakeholder update" },
        ],
      },
      {
        kind: "choice",
        key: "A4",
        label: "Reader in the chair",
        prompt: "Picture one reader. What do they need to walk away able to do?",
        options: [
          { value: "understand", label: "Understand what we built" },
          { value: "run", label: "Run it locally" },
          { value: "maintain", label: "Maintain or extend it" },
          { value: "judge", label: "Judge quality / scope" },
          { value: "fund", label: "Decide to fund or adopt" },
        ],
      },
      {
        kind: "slider",
        key: "A5",
        label: "Time horizon",
        prompt: "How long were you in build mode for this version?",
        example: "Rough is fine — the slider snaps to sensible bands.",
        stops: [
          { value: "day", label: "About a day" },
          { value: "weekend-week", label: "A weekend" },
          { value: "weekend-week", label: "About a week" },
          { value: "weeks", label: "Several weeks" },
          { value: "months+", label: "Months or longer" },
        ],
      },
      {
        kind: "choice",
        key: "A6",
        label: "Interview depth",
        prompt: "How much time do you have for questions right now?",
        example: "Quick is enough to launch; you can always deepen answers later in Write mode.",
        options: [
          { value: "quick", label: "Quick — essentials only" },
          { value: "standard", label: "Standard — core + context" },
          { value: "deep", label: "Deep — technical evidence too" },
        ],
      },
    ],
  },
  {
    id: "B",
    mono: "STAGE B",
    title: "The heart of the story",
    standfirst: "Answer in your own voice. Short is fine — we are after the sentence you would say at stand-up, not marketing copy.",
    minDepth: "quick",
    quickKeys: ["B1", "B2", "B3"],
    questions: [
      {
        kind: "textarea",
        key: "B1",
        label: "One-sentence job",
        prompt: "If a stranger read only one sentence, what should they know this project does?",
        example: '"Conductor keeps multi-agent dev sessions in sync" or "Grades CS assignments without storing student code."',
        placeholder: "This project…",
      },
      {
        kind: "textarea",
        key: "B2",
        label: "Success in plain terms",
        prompt: "What did “done” look like for you?",
        example: "Shipped to prod, demo won the room, assignment spec met — be honest about partial wins too.",
      },
      {
        kind: "textarea",
        key: "B3",
        label: "Honest status",
        prompt: "What works today, what is stubbed, and what would you warn a reader about?",
        example: "Great for happy-path demos; auth is mocked; tests are thin on edge cases.",
      },
      {
        kind: "textarea",
        key: "B4",
        label: "Built vs borrowed",
        prompt: "What did you write yourself versus lean on libraries, templates, or teammates?",
        optional: true,
      },
      {
        kind: "textarea",
        key: "B5",
        label: "Hardest problem",
        prompt: "What kept you up at night — the bug, the design fork, or the scope call?",
        optional: true,
      },
      {
        kind: "textarea",
        key: "B6",
        label: "Defend vs abandon",
        prompt: "Name one decision you would make again, and one you would undo with hindsight.",
        optional: true,
      },
      {
        kind: "textarea",
        key: "B7",
        label: "What is next",
        prompt: "If someone picked this up Monday morning, what is the sensible next milestone?",
        optional: true,
      },
      {
        kind: "textarea",
        key: "B8",
        label: "Proof it exists",
        prompt: "Where should a skeptical reader look — demo URL, screenshot, test output, commit?",
        optional: true,
      },
      {
        kind: "textarea",
        key: "B9",
        label: "Public vs private",
        prompt: "Anything that must never appear in the guide (secrets, names, unreleased features)?",
        example: "We only need topic names — never paste env values.",
        optional: true,
      },
    ],
  },
  {
    id: "C",
    mono: "STAGE C",
    title: "Context for your kind of project",
    standfirst: "These questions adapt to how you described the work in Stage A — skip any that do not fit.",
    minDepth: "standard",
    questions: [
      {
        kind: "textarea",
        key: "C_story",
        label: "Opening hook",
        prompt: "What is the human story behind this repo?",
        example: "Why you cared, what changed mid-flight, or the constraint that shaped everything.",
        optional: true,
      },
      {
        kind: "textarea",
        key: "C_audience",
        label: "Audience specifics",
        prompt: "Who specifically will read this — role, skill level, patience?",
        optional: true,
      },
      {
        kind: "textarea",
        key: "C_constraints",
        label: "Constraints you lived with",
        prompt: "Time box, grading rubric, compliance, hardware, team skill mix…",
        optional: true,
      },
      {
        kind: "textarea",
        key: "C_collab",
        label: "How you worked together",
        prompt: "Stand-ups, pairings, async notes, design docs — whatever was real.",
        optional: true,
      },
    ],
  },
  {
    id: "D",
    mono: "STAGE D",
    title: "Technical evidence",
    standfirst: "Point us at files and behaviours — the agent will verify against the tree. Guesses are fine; we tag them inferred until confirmed.",
    minDepth: "deep",
    questions: [
      {
        kind: "textarea",
        key: "D_entry",
        label: "Where execution starts",
        prompt: "Main entrypoints, CLIs, or deploy targets a reader should open first.",
        example: "bin/scorecard.js, src/main.tsx, docker-compose.yml",
        optional: true,
      },
      {
        kind: "textarea",
        key: "D_flow",
        label: "Happy-path flow",
        prompt: "Describe the request or user journey in 3–5 beats.",
        optional: true,
      },
      {
        kind: "textarea",
        key: "D_deps",
        label: "Dependencies that matter",
        prompt: "Services, APIs, databases, queues — and what breaks if they are down.",
        optional: true,
      },
      {
        kind: "textarea",
        key: "D_failures",
        label: "Known failure modes",
        prompt: "Errors, edge cases, or ops surprises you have already seen.",
        optional: true,
      },
      {
        kind: "textarea",
        key: "D_decisions",
        label: "Decisions worth a sidebar",
        prompt: "Forks in the road that should become decision records in the guide.",
        optional: true,
      },
    ],
  },
  {
    id: "E",
    mono: "STAGE E",
    title: "Look and feel",
    standfirst: "The manual should feel like a crafted artifact. Pick a direction — or defer and we will propose Libretto defaults.",
    minDepth: "quick",
    quickKeys: ["E_scheme", "E_tone"],
    questions: [
      {
        kind: "choice",
        key: "E_tone",
        label: "Tone",
        prompt: "How editorial should the voice feel?",
        options: [
          { value: "manual", label: "Manual — measured, teaching" },
          { value: "poster", label: "Poster — bolder display type" },
          { value: "plain", label: "Plain — minimal ornament" },
        ],
      },
      {
        kind: "choice",
        key: "E_scheme",
        label: "Colour scheme",
        prompt: "Paper and ink palette for the site.",
        example: "Open specimens with npx scorecard-kit look",
        options: [
          { value: "libretto", label: "Libretto — cool paper, blue action" },
          { value: "plate", label: "Plate — warm, green accent" },
          { value: "poster", label: "Poster — apricot accent" },
          { value: "plain", label: "Plain — no Nouveau ornaments" },
        ],
      },
      {
        kind: "choice",
        key: "E_display",
        label: "Display face",
        prompt: "Headline lettering on the guide.",
        options: [
          { value: "paleologue-poster", label: "Paléologue Poster" },
          { value: "paleologue", label: "Paléologue Regular" },
        ],
        optional: true,
      },
      {
        kind: "choice",
        key: "E_plateFrame",
        label: "Plate frame",
        prompt: "Nouveau frame around diagrams and plates.",
        options: [
          { value: "coins46", label: "Coins 46" },
          { value: "pavot30", label: "Pavot 30" },
          { value: "lys33", label: "Lys 33" },
          { value: "none", label: "None" },
        ],
        optional: true,
      },
      {
        kind: "choice",
        key: "E_footFrieze",
        label: "Foot frieze",
        prompt: "Footer ornament band.",
        options: [
          { value: "lys33", label: "Lys 33" },
          { value: "pavot30", label: "Pavot 30" },
          { value: "none", label: "None" },
        ],
        optional: true,
      },
      {
        kind: "choice",
        key: "E_noPreference",
        label: "Defer look choices",
        prompt: "Prefer the agent to propose defaults from your purpose (Stage A)?",
        options: [
          { value: "no", label: "No — use my picks above" },
          { value: "yes", label: "Yes — propose defaults for me" },
        ],
      },
    ],
  },
  {
    id: "N",
    mono: "CLOSING",
    title: "Parting lines",
    standfirst: "Optional colour for the agent — never shown on the public site.",
    minDepth: "quick",
    questions: [
      {
        kind: "textarea",
        key: "narrative_hook",
        label: "Hook",
        prompt: "A line you are proud to open the guide with.",
        optional: true,
      },
      {
        kind: "textarea",
        key: "narrative_proud",
        label: "Proud moment",
        prompt: "When did you know the thing was going to work?",
        optional: true,
      },
    ],
  },
];

export function stageVisible(stage: InterviewStage, depth: InterviewDepth): boolean {
  return depthRank[depth] >= depthRank[stage.minDepth];
}

export function questionsForStage(stage: InterviewStage, depth: InterviewDepth): QuestionField[] {
  if (!stageVisible(stage, depth)) return [];
  if (depth === "quick" && stage.quickKeys?.length) {
    return stage.questions.filter((q) => stage.quickKeys!.includes(q.key));
  }
  return stage.questions;
}

export function visibleStageList(depth: InterviewDepth): InterviewStage[] {
  return INTERVIEW_STAGES.filter((s) => stageVisible(s, depth));
}