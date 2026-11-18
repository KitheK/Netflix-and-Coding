import type { ClaimMeta, Provenance } from "./provenance";

export const SCHEMA_VERSION = 1;

/** Product manual title suffix (`<Project Name> Guide`). */
export const MANUAL_TITLE_SUFFIX = " Guide";

export const PLATFORM_ATTRIBUTION = "Made with Scorecard";

export type FeatureStatus = "works" | "partial" | "stubbed" | "cut";

export type Size = "lite" | "standard" | "full";

export type ProjectKind =
  | "personal"
  | "coursework"
  | "hackathon"
  | "team"
  | "work"
  | "oss"
  | "research"
  | "other";

export type ThemeScheme = "libretto" | "plate" | "poster" | "plain" | "custom";
export type FrameVariant = "coins46" | "pavot30" | "lys33" | "halo01" | "none";
export type FriezeVariant = "lys33" | "pavot30" | "none";
export type RailVariant = "pavot30" | "band01" | "none";

export type BuiltinFontPackId = "libretto-default" | "editorial-plain" | "making-software" | "custom";

export type FontRole = "display" | "body" | "ui" | "mono";

/** Self-hosted catalog face (§4.4 extension, WS5). */
export type FontFaceId =
  | "paleologue-poster"
  | "paleologue"
  | "newsreader"
  | "literata"
  | "fraunces"
  | "source-serif-4"
  | "lora"
  | "source-sans-3"
  | "inter"
  | "ibm-plex-sans"
  | "departure"
  | "jetbrains-mono"
  | "ibm-plex-mono";

export type ThemeFontRoles = Partial<Record<FontRole, FontFaceId>>;

export type FontSubstitutionNote = {
  intended: string;
  bundledFaceId: FontFaceId;
  reason: string;
};

export type FontProprietarySlot = {
  intended: string;
  dropPath: string;
  instructions: string;
};

export type FontFaceRef = {
  family: string;
  woff2: string;
  weight?: number | string;
  style?: "normal" | "italic";
};

/** `content/font-pack.json` or `font-packs/<packId>/manifest.json` (§4.4). */
export type FontPackManifest = {
  schemaVersion: number;
  packId: string;
  label: string;
  license: string;
  faces: {
    display: FontFaceRef;
    body: FontFaceRef;
    ui: FontFaceRef;
    mono: FontFaceRef;
  };
  /** Preferred catalog ids per role (overridable via `theme.fontRoles`). */
  defaultFaceIds?: Partial<Record<FontRole, FontFaceId>>;
  /** When bundled faces stand in for proprietary sources (e.g. Making Software). */
  substitutions?: Partial<Record<FontRole, FontSubstitutionNote>>;
  /** Where licensees may drop vendor WOFF2 files. */
  proprietarySlots?: Partial<Record<FontRole, FontProprietarySlot>>;
};

/** On-disk layout for a traced custom pack (§4.5). */
export type FontTracePackPaths = {
  packId: string;
  rootDir: string;
  manifest: string;
  reference?: string;
  sourceDir?: string;
  woff2: string[];
  license: string;
};

export const FONT_PACK_DIR_LAYOUT = {
  manifest: "manifest.json",
  reference: "reference.png",
  source: "source",
  license: "LICENSE",
} as const;

export function fontTracePackPaths(packId: string, rootDir = "font-packs"): FontTracePackPaths {
  const base = `${rootDir}/${packId}`;
  return {
    packId,
    rootDir: base,
    manifest: `${base}/${FONT_PACK_DIR_LAYOUT.manifest}`,
    reference: `${base}/${FONT_PACK_DIR_LAYOUT.reference}`,
    sourceDir: `${base}/${FONT_PACK_DIR_LAYOUT.source}`,
    woff2: [],
    license: `${base}/${FONT_PACK_DIR_LAYOUT.license}`,
  };
}

export type ThemeJson = {
  schemaVersion: number;
  scheme: ThemeScheme;
  tone: "manual" | "plain" | "poster";
  /** When set, `fonts` enums are shortcuts resolved via the pack manifest. */
  fontPackId?: BuiltinFontPackId | (string & {});
  /** Per-role face picks from the kit catalog; overrides pack defaults. */
  fontRoles?: ThemeFontRoles;
  tokens: { canvas: string; ink: string; action: string; rule: string; muted: string };
  fonts: {
    display: "paleologue" | "paleologue-poster";
    body: "newsreader";
    ui: "source-sans";
    mono: "departure";
  };
  ornaments: {
    plateFrame: FrameVariant;
    demoFrame: FrameVariant;
    footFrieze: FriezeVariant;
    footCrop: "full" | "band";
    footAnimate: boolean;
    rail: RailVariant;
    ornamentPalette: "plate" | "libretto" | "theme";
  };
};

export type ScorecardJson = {
  schemaVersion: number;
  size: Size;
  job: string & ClaimMeta;
  brief: string & ClaimMeta;
  outcome: string & ClaimMeta;
  features: Array<{ name: string; status: FeatureStatus; note?: string } & ClaimMeta>;
  knownGap?: string & ClaimMeta;
  built: string & ClaimMeta;
  borrowed: string & ClaimMeta;
  proof?: string & ClaimMeta;
  next?: string & ClaimMeta;
};

export type TextClaim = { text: string } & ClaimMeta;

export type ScorecardFile = {
  schemaVersion: number;
  size: Size;
  /** Duplicate of `manual.projectName` for summary hero (§4.2). */
  projectName?: string;
  job: TextClaim;
  brief: TextClaim;
  outcome: TextClaim;
  features: Array<{ name: string; status: FeatureStatus; note?: string } & ClaimMeta>;
  knownGap?: TextClaim;
  built: TextClaim;
  borrowed: TextClaim;
  proof?: TextClaim;
  next?: TextClaim;
};

export type RunFile = {
  schemaVersion: number;
  steps: Array<{ title: string; command?: string; body?: string } & ClaimMeta>;
  envNames: string[];
  deployUrl?: string;
  demoScript: TextClaim;
};

export type DecisionFile = {
  schemaVersion: number;
  decisions: Array<{
    id: string;
    decision: string;
    alternatives?: string;
    reason?: string;
    outcome?: string;
    deadEnd?: boolean;
  } & ClaimMeta>;
};

export type RequirementsFile = {
  schemaVersion: number;
  items: Array<{ id: string; text: string; where?: string; evidence?: string } & ClaimMeta>;
};

export type TeamFile = {
  schemaVersion: number;
  people: Array<{ name: string; role?: string; areas?: string[] } & ClaimMeta>;
};

// —— §4.1 Interview ——

export type InterviewDepth = "quick" | "standard" | "deep";

export type InterviewProfile = {
  kind?: ProjectKind;
  builders?: string;
  purpose?: string;
  readerGoal?: string;
  scale?: string;
  /** Required when a site is generated (§4.2); collected in Stage A. */
  projectName?: string;
};

export type InterviewAnswerValue = string | number | boolean | null;

export type InterviewAnswer = {
  value: InterviewAnswerValue;
  provenance: Provenance;
  evidence?: string;
};

export type InterviewNarrative = {
  hook?: string;
  proudMoment?: string;
};

/** Persisted at `content/interview.json` (form + agent edits). */
export type InterviewFile = {
  schemaVersion: number;
  submittedAt?: string;
  depth: InterviewDepth;
  profile: InterviewProfile;
  /** Legacy entries may be bare values; validators normalize where possible. */
  answers: Record<string, InterviewAnswer | InterviewAnswerValue | unknown>;
  narrative?: InterviewNarrative;
  /** Shown only in handoff export, not in the public form. */
  agentNotes?: string;
  look?: Partial<ThemeJson>;
};

/** Slim agent snapshot at `content/interview-handoff.json`. */
export type InterviewHandoffFile = {
  schemaVersion: number;
  exportedAt?: string;
  depth: InterviewDepth;
  profile: InterviewProfile;
  answers: Record<string, InterviewAnswer>;
  narrative?: InterviewNarrative;
  agentNotes?: string;
};

// —— §4.2 Manual naming + §4.6 blocks ——

export type MediaChrome = {
  routeLabel?: string;
  tabs?: string[];
};

export type LiveBlockMode = "screenshot" | "clip";

export type FigureBlock = {
  type: "figure";
  id: string;
  caption?: string;
} & ClaimMeta;

export type LiveBlock = {
  type: "live";
  mode?: LiveBlockMode;
  src?: string;
  poster?: string;
  webm?: string;
  gif?: string;
  chrome?: MediaChrome;
  linkOut?: string;
  caption?: string;
  /** Legacy v0 field; prefer `linkOut`. */
  url?: string;
} & ClaimMeta;

export type ShotBlock = {
  type: "shot";
  src: string;
  label?: string;
  caption?: string;
  chrome?: MediaChrome;
  linkOut?: string;
} & ClaimMeta;

export type MotionBlock = {
  type: "motion";
  webm?: string;
  gif: string;
  poster: string;
  caption?: string;
  label?: string;
} & ClaimMeta;

export type DeskBlock = {
  type: "desk";
  kind: "nouveau" | (string & {});
  title?: string;
} & ClaimMeta;

export type ManualBlock =
  | { type: "h2"; text: string } & ClaimMeta
  | { type: "p"; text: string } & ClaimMeta
  | FigureBlock
  | { type: "status" } & ClaimMeta
  | { type: "run" } & ClaimMeta
  | { type: "decision"; id?: string } & ClaimMeta
  | { type: "requirement" } & ClaimMeta
  | { type: "contribution" } & ClaimMeta
  | { type: "architecture" } & ClaimMeta
  | { type: "timeline" } & ClaimMeta
  | LiveBlock
  | ShotBlock
  | MotionBlock
  | DeskBlock;

export type ManualChapter = {
  slug: string;
  number: string;
  part: string;
  title: string;
  standfirst?: string;
  sources?: string[];
  blocks: ManualBlock[];
};

export type ManualFile = {
  schemaVersion: number;
  /** Pixel wordmark + Paléologue pairing uses this (§4.2). */
  projectName?: string;
  /** Must equal `${projectName} Guide` when `projectName` is set. */
  title: string;
  parts: Array<{ id: string; title: string; blurb?: string }>;
  chapters: ManualChapter[];
  faqs?: Array<{ question: string; answer: string } & ClaimMeta>;
};

// —— §4.3 Architecture plate ——

export type ArchitectureLayout = "spine-lr" | "layered" | "radial";

export type ArchitectureNodeTone = "service" | "data" | "client" | "external" | "runtime" | (string & {});

export type ArchitectureNodeDetail = {
  role?: string;
  evidence?: string;
  ports?: string[];
  summary?: string;
};

export type ArchitectureNode = {
  id: string;
  label: string;
  path?: string;
  group?: string;
  tone?: ArchitectureNodeTone;
  x?: number;
  y?: number;
  detail?: ArchitectureNodeDetail;
};

export type ArchitectureGroup = {
  id: string;
  title: string;
  tone?: ArchitectureNodeTone;
};

export type ArchitectureEdge = { from: string; to: string; label?: string };

export type ArchitectureFile = {
  schemaVersion: number;
  figureId?: string;
  layout?: ArchitectureLayout;
  overview?: TextClaim;
  nodes: ArchitectureNode[];
  edges: ArchitectureEdge[];
  groups?: ArchitectureGroup[];
  /** Print/PDF export fallback only — not primary UI. */
  mermaid?: string;
};

export type BranchesFile = {
  schemaVersion: number;
  form: "river" | "build-log" | "hourly";
  events: Array<{ id: string; label: string; t: number; blurb?: string; branch?: string } & ClaimMeta>;
};

export type StackFile = {
  schemaVersion: number;
  parts: Array<{ id: string; title: string; role?: string; why?: string; path?: string } & ClaimMeta>;
};

export type ApisFile = {
  schemaVersion: number;
  routes: Array<{
    id: string;
    path: string;
    methodHint?: string;
    upstream?: string;
    contract?: string;
  } & ClaimMeta>;
};

const SCHEMES: Record<Exclude<ThemeScheme, "custom">, ThemeJson["tokens"]> = {
  libretto: { canvas: "#fbfbfb", ink: "#000000", action: "#103dff", rule: "#d0d0d0", muted: "#666666" },
  plate: { canvas: "#f3ebdd", ink: "#12141c", action: "#2a7a66", rule: "#c9bfa8", muted: "#5c5648" },
  poster: { canvas: "#fbf7f2", ink: "#1a120c", action: "#e87a3a", rule: "#e0d2c4", muted: "#7a6558" },
  plain: { canvas: "#ffffff", ink: "#111111", action: "#222222", rule: "#e5e5e5", muted: "#666666" },
};

export function manualTitleFromProjectName(projectName: string): string {
  const trimmed = projectName.trim();
  if (trimmed.endsWith(MANUAL_TITLE_SUFFIX)) return trimmed;
  return `${trimmed}${MANUAL_TITLE_SUFFIX}`;
}

export function isInterviewAnswer(entry: unknown): entry is InterviewAnswer {
  if (!entry || typeof entry !== "object" || Array.isArray(entry)) return false;
  const o = entry as InterviewAnswer;
  return "value" in o && "provenance" in o && typeof o.provenance === "string";
}

export function normalizeInterviewAnswer(entry: unknown, defaultProvenance: Provenance = "draft"): InterviewAnswer | null {
  if (isInterviewAnswer(entry)) return entry;
  if (entry === undefined) return null;
  return { value: entry as InterviewAnswerValue, provenance: defaultProvenance };
}

export function buildInterviewHandoff(interview: InterviewFile): InterviewHandoffFile {
  const answers: Record<string, InterviewAnswer> = {};
  for (const [key, raw] of Object.entries(interview.answers ?? {})) {
    const norm = normalizeInterviewAnswer(raw, "confirmed");
    if (!norm) continue;
    const empty =
      norm.value === null ||
      norm.value === "" ||
      (typeof norm.value === "string" && !norm.value.trim());
    if (empty) continue;
    answers[key] = norm;
  }
  return {
    schemaVersion: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    depth: interview.depth,
    profile: interview.profile,
    answers,
    narrative: interview.narrative,
    agentNotes: interview.agentNotes,
  };
}

/** True when the author has not submitted structured answers (WS2 CLI gate). */
export function interviewNeedsForm(interview: InterviewFile): boolean {
  const keys = Object.keys(interview.answers ?? {});
  if (keys.length === 0) return true;
  return !keys.some((k) => {
    const norm = normalizeInterviewAnswer(interview.answers[k]);
    if (!norm) return false;
    if (norm.value === null || norm.value === "") return false;
    return true;
  });
}

export function themePresets(scheme: ThemeScheme, tone: ThemeJson["tone"] = "manual"): ThemeJson {
  const tokens = scheme === "custom" ? SCHEMES.libretto : SCHEMES[scheme];
  const plainOrnaments = scheme === "plain" || tone === "plain";
  return {
    schemaVersion: SCHEMA_VERSION,
    scheme,
    tone,
    fontPackId: "libretto-default",
    tokens,
    fonts: {
      display: tone === "poster" ? "paleologue-poster" : "paleologue-poster",
      body: "newsreader",
      ui: "source-sans",
      mono: "departure",
    },
    ornaments: {
      plateFrame: plainOrnaments ? "none" : "coins46",
      demoFrame: plainOrnaments ? "none" : "pavot30",
      footFrieze: plainOrnaments ? "none" : "lys33",
      footCrop: "full",
      footAnimate: !plainOrnaments,
      rail: "none",
      ornamentPalette: "theme",
    },
  };
}

function isIso8601(s: string): boolean {
  return !Number.isNaN(Date.parse(s));
}

export const FONT_FACE_IDS: FontFaceId[] = [
  "paleologue-poster",
  "paleologue",
  "newsreader",
  "literata",
  "fraunces",
  "source-serif-4",
  "lora",
  "source-sans-3",
  "inter",
  "ibm-plex-sans",
  "departure",
  "jetbrains-mono",
  "ibm-plex-mono",
];

export function validateTheme(t: ThemeJson): string[] {
  const errors: string[] = [];
  if (t.schemaVersion !== SCHEMA_VERSION) errors.push(`theme schemaVersion ${t.schemaVersion}`);
  if (!t.tokens?.canvas || !t.tokens?.ink || !t.tokens?.action) errors.push("theme.tokens incomplete");
  for (const [role, faceId] of Object.entries(t.fontRoles ?? {})) {
    if (!FONT_FACE_IDS.includes(faceId as FontFaceId)) {
      errors.push(`theme.fontRoles.${role}: unknown face ${faceId}`);
    }
  }
  return errors;
}

export function validateFontPackManifest(m: FontPackManifest, exists?: (path: string) => boolean): string[] {
  const errors: string[] = [];
  if (m.schemaVersion !== SCHEMA_VERSION) errors.push("font-pack schemaVersion");
  if (!m.packId?.trim()) errors.push("font-pack.packId required");
  if (!m.label?.trim()) errors.push("font-pack.label required");
  if (!m.license?.trim()) errors.push("font-pack.license required");
  const roles = ["display", "body", "ui", "mono"] as const;
  for (const role of roles) {
    const face = m.faces?.[role];
    if (!face?.family || !face.woff2) errors.push(`font-pack.faces.${role} incomplete`);
    else if (exists && !exists(face.woff2)) errors.push(`font-pack.faces.${role}: missing ${face.woff2}`);
  }
  return errors;
}

export function validateFontTracePack(paths: FontTracePackPaths, exists: (path: string) => boolean): string[] {
  const errors: string[] = [];
  if (!exists(paths.manifest)) errors.push(`font-trace: missing manifest ${paths.manifest}`);
  if (!exists(paths.license)) errors.push(`font-trace: missing license ${paths.license}`);
  if (paths.woff2.length === 0) errors.push("font-trace: at least one .woff2 required");
  for (const f of paths.woff2) {
    if (!exists(f)) errors.push(`font-trace: missing ${f}`);
  }
  return errors;
}

export function validateInterview(i: InterviewFile, opts?: { requireProjectName?: boolean }): string[] {
  const errors: string[] = [];
  if (i.schemaVersion !== SCHEMA_VERSION) errors.push("interview schemaVersion");
  if (!["quick", "standard", "deep"].includes(i.depth)) errors.push("interview.depth invalid");
  if (i.submittedAt && !isIso8601(i.submittedAt)) errors.push("interview.submittedAt not ISO-8601");
  if (opts?.requireProjectName && !i.profile?.projectName?.trim()) {
    errors.push("interview.profile.projectName required");
  }
  for (const [key, raw] of Object.entries(i.answers ?? {})) {
    if (isInterviewAnswer(raw)) {
      if (raw.provenance === "confirmed" && raw.evidence === undefined && key.startsWith("E_")) {
        // look fields may be confirmed without path evidence
      }
      if (raw.provenance === "inferred" && !raw.evidence) {
        errors.push(`interview.answers.${key}: inferred requires evidence`);
      }
    }
  }
  return errors;
}

export function validateInterviewHandoff(h: InterviewHandoffFile): string[] {
  const errors: string[] = [];
  if (h.schemaVersion !== SCHEMA_VERSION) errors.push("interview-handoff schemaVersion");
  if (h.exportedAt && !isIso8601(h.exportedAt)) errors.push("interview-handoff.exportedAt not ISO-8601");
  if (!h.profile || typeof h.profile !== "object") errors.push("interview-handoff.profile required");
  for (const [key, a] of Object.entries(h.answers ?? {})) {
    if (!isInterviewAnswer(a)) errors.push(`interview-handoff.answers.${key}: not an InterviewAnswer`);
    else if (a.provenance === "inferred" && !a.evidence) {
      errors.push(`interview-handoff.answers.${key}: inferred requires evidence`);
    }
  }
  return errors;
}

export function validateManual(m: ManualFile, opts?: { requireProjectName?: boolean }): string[] {
  const errors: string[] = [];
  if (m.schemaVersion !== SCHEMA_VERSION) errors.push("manual schemaVersion");
  if (opts?.requireProjectName && !m.projectName?.trim()) errors.push("manual.projectName required");
  if (m.projectName?.trim()) {
    const expected = manualTitleFromProjectName(m.projectName);
    if (m.title !== expected) errors.push(`manual.title must be "${expected}"`);
  }
  for (const ch of m.chapters ?? []) {
    for (const [bi, b] of ch.blocks.entries()) {
      errors.push(...validateManualBlock(b, `${ch.slug}[${bi}]`));
    }
  }
  return errors;
}

const KNOWN_BLOCK_TYPES = new Set([
  "h2",
  "p",
  "figure",
  "status",
  "run",
  "decision",
  "requirement",
  "contribution",
  "architecture",
  "timeline",
  "live",
  "shot",
  "motion",
  "desk",
]);

export function validateManualBlock(block: ManualBlock, path = "block"): string[] {
  const errors: string[] = [];
  if (!KNOWN_BLOCK_TYPES.has(block.type)) {
    errors.push(`${path}: unknown block type ${(block as { type: string }).type}`);
    return errors;
  }
  if (block.provenance === "confirmed" && block.source === "generated") {
    errors.push(`${path}: agent cannot confirm`);
  }
  if (block.type === "live") {
    const legacy = block.url && !block.src;
    const mode = block.mode ?? (legacy ? "screenshot" : undefined);
    if (!mode) errors.push(`${path}: live.mode required`);
    if (mode === "screenshot" && !block.src && !legacy) errors.push(`${path}: live.src required for screenshot`);
    if (mode === "clip" && !block.src && !block.webm && !block.gif) {
      errors.push(`${path}: live clip requires src, webm, or gif`);
    }
  }
  if (block.type === "shot" && !block.src) errors.push(`${path}: shot.src required`);
  if (block.type === "motion") {
    if (!block.gif) errors.push(`${path}: motion.gif required`);
    if (!block.poster) errors.push(`${path}: motion.poster required`);
  }
  if (block.type === "desk" && !block.kind) errors.push(`${path}: desk.kind required`);
  if (block.type === "figure" && !block.id) errors.push(`${path}: figure.id required`);
  return errors;
}

export function validateScorecard(s: ScorecardFile): string[] {
  const errors: string[] = [];
  if (s.schemaVersion !== SCHEMA_VERSION) errors.push("scorecard schemaVersion");
  if (!s.job?.text) errors.push("scorecard.job required");
  if (!["lite", "standard", "full"].includes(s.size)) errors.push("scorecard.size invalid");
  for (const f of s.features ?? []) {
    if (f.provenance === "confirmed" && f.source === "generated") {
      errors.push(`feature ${f.name}: agent cannot confirm`);
    }
  }
  return errors;
}

export function validateArchitecture(
  a: ArchitectureFile,
  exists: (path: string) => boolean,
  opts?: { minNodes?: number; minEdges?: number; requireInteractiveFields?: boolean },
): string[] {
  const errors: string[] = [];
  if (a.schemaVersion !== SCHEMA_VERSION) errors.push("architecture schemaVersion");
  if (a.layout && !["spine-lr", "layered", "radial"].includes(a.layout)) {
    errors.push("architecture.layout invalid");
  }
  if (a.figureId && !/^ARCH_\d{3}$/.test(a.figureId)) {
    errors.push("architecture.figureId must match ARCH_###");
  }
  const ids = new Set<string>();
  for (const n of a.nodes) {
    if (ids.has(n.id)) errors.push(`architecture duplicate node id ${n.id}`);
    ids.add(n.id);
    if (n.path && !exists(n.path)) errors.push(`architecture node ${n.id}: missing path ${n.path}`);
    if (opts?.requireInteractiveFields && !n.detail) {
      errors.push(`architecture node ${n.id}: detail required for interactive v1`);
    }
  }
  for (const e of a.edges) {
    if (!ids.has(e.from)) errors.push(`architecture edge: unknown from ${e.from}`);
    if (!ids.has(e.to)) errors.push(`architecture edge: unknown to ${e.to}`);
  }
  const groupIds = new Set((a.groups ?? []).map((g) => g.id));
  for (const n of a.nodes) {
    if (n.group && groupIds.size > 0 && !groupIds.has(n.group)) {
      errors.push(`architecture node ${n.id}: unknown group ${n.group}`);
    }
  }
  if (opts?.minNodes !== undefined && a.nodes.length < opts.minNodes) {
    errors.push(`architecture requires at least ${opts.minNodes} nodes`);
  }
  if (opts?.minEdges !== undefined && a.edges.length < opts.minEdges) {
    errors.push(`architecture requires at least ${opts.minEdges} edges`);
  }
  return errors;
}