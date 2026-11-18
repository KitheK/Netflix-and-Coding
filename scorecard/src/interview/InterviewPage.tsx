import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useContent } from "../lib/ContentContext";
import {
  buildInterviewHandoff,
  interviewNeedsForm,
  normalizeInterviewAnswer,
  type InterviewAnswer,
  type InterviewDepth,
  type InterviewFile,
} from "../lib/schemas";
import { assembleInterviewFile, readAnswerValue } from "./merge";
import {
  INTERVIEW_STAGES,
  questionsForStage,
  visibleStageList,
  type QuestionField,
} from "./questions";
import { saveContentFile } from "./save";
import "./interview.css";

function confirmed(value: string | boolean): InterviewAnswer {
  return { value, provenance: "confirmed" };
}

function initialValue(file: InterviewFile, key: string): string {
  if (key === "projectName") {
    return file.profile.projectName ?? readAnswerValue(file.answers, "projectName");
  }
  const fromProfile =
    key === "A1"
      ? file.profile.kind
      : key === "A2"
        ? file.profile.builders
        : key === "A3"
          ? file.profile.purpose
          : key === "A4"
            ? file.profile.readerGoal
            : key === "A5"
              ? file.profile.scale
              : key === "A6"
                ? file.depth
                : undefined;
  if (fromProfile) return String(fromProfile);
  if (key === "narrative_hook") return file.narrative?.hook ?? "";
  if (key === "narrative_proud") return file.narrative?.proudMoment ?? "";
  return readAnswerValue(file.answers, key);
}

function provenanceHint(file: InterviewFile, key: string): string | null {
  const raw = file.answers[key];
  const norm = normalizeInterviewAnswer(raw);
  if (!norm) return null;
  if (norm.provenance === "inferred") return "We inferred this from the repo — change it if we got it wrong.";
  if (norm.provenance === "draft") return "Draft from a prior pass — confirm or edit.";
  return null;
}

export function InterviewPage() {
  const { interview, replaceBundle, ...rest } = useContent();
  const navigate = useNavigate();
  const [depth, setDepth] = useState<InterviewDepth>(interview.depth);
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const stage of INTERVIEW_STAGES) {
      for (const q of stage.questions) {
        init[q.key] = initialValue(interview, q.key);
        init[`${q.key}_label`] = readAnswerValue(interview.answers, `${q.key}_label`);
      }
    }
    return init;
  });
  const [saveState, setSaveState] = useState("Ready");
  const [error, setError] = useState<string | null>(null);

  const stages = useMemo(() => visibleStageList(depth), [depth]);
  const current = stages[step];
  const questions = useMemo(
    () => (current ? questionsForStage(current, depth) : []),
    [current, depth],
  );

  useEffect(() => {
    const d = (draft.A6 as InterviewDepth) || interview.depth;
    if (d !== depth && (d === "quick" || d === "standard" || d === "deep")) {
      setDepth(d);
    }
  }, [draft.A6, depth, interview.depth]);

  const persist = useCallback(
    async (partial: Record<string, InterviewAnswer>, markSubmitted = false) => {
      const answers: Record<string, InterviewAnswer> = {};
      for (const [k, v] of Object.entries(partial)) {
        if (v.value === "" || v.value === null) continue;
        answers[k] = v;
      }
      for (const [k, text] of Object.entries(draft)) {
        if (answers[k]) continue;
        const trimmed = text.trim();
        if (!trimmed) continue;
        answers[k] = confirmed(trimmed);
      }
      const next = assembleInterviewFile(interview, answers, { markSubmitted });
      setSaveState("Saving…");
      setError(null);
      try {
        await saveContentFile("interview.json", next);
        replaceBundle({ ...rest, interview: next });
        setSaveState("Saved locally");
        return next;
      } catch (e) {
        setError(String(e));
        setSaveState("Error");
        return null;
      }
    },
    [draft, interview, replaceBundle, rest],
  );

  async function handleNext() {
    const nextFile = await persist({});
    if (!nextFile) return;
    if (step < stages.length - 1) {
      setStep(step + 1);
    }
  }

  async function handleBack() {
    await persist({});
    if (step > 0) setStep(step - 1);
  }

  async function handleDone() {
    const nextFile = await persist({}, true);
    if (!nextFile) return;
    const handoff = buildInterviewHandoff(nextFile);
    try {
      await saveContentFile("interview-handoff.json", handoff);
      setSaveState("Handoff written");
      navigate("/write", { replace: true });
    } catch (e) {
      setError(String(e));
    }
  }

  const complete = !interviewNeedsForm(interview) && Boolean(interview.submittedAt);

  return (
    <main className="page interview-shell">
      <header className="interview-hero">
        <p className="mono interview-kicker">LOCAL AUTHORING · 127.0.0.1</p>
        <h1 className="display interview-title">Tell us about your project</h1>
        <p className="lede">
          A short interview before the agent writes your <strong>Guide</strong>. Answers save to{" "}
          <code className="mono">content/interview.json</code> on this machine only — no accounts, no cloud.
        </p>
        {interview.profile.projectName ? (
          <p className="mono interview-subtitle">
            Guide title: <span className="interview-project">{interview.profile.projectName} Guide</span>
          </p>
        ) : null}
      </header>

      {complete ? (
        <div className="interview-banner panel" role="status">
          <p>
            You have already completed this interview. You can revise answers below or continue to{" "}
            <Link to="/write">Write mode</Link>.
          </p>
        </div>
      ) : null}

      <div className="interview-progress mono" aria-live="polite">
        Step {step + 1} of {stages.length} · {current?.mono ?? ""}
        <span className="interview-save">{saveState}</span>
      </div>

      {error ? (
        <p className="interview-error" role="alert">
          {error}
        </p>
      ) : null}

      {current ? (
        <section className="interview-stage panel" aria-labelledby="stage-title">
          <h2 id="stage-title" className="interview-stage-title">
            {current.title}
          </h2>
          <p className="interview-standfirst">{current.standfirst}</p>

          <div className="interview-fields">
            {questions.map((q) => (
              <InterviewField
                key={q.key}
                field={q}
                value={draft[q.key] ?? ""}
                labelValue={draft[`${q.key}_label`] ?? ""}
                hint={provenanceHint(interview, q.key)}
                onChange={(v, label) =>
                  setDraft((d) => ({
                    ...d,
                    [q.key]: v,
                    ...(label ? { [`${q.key}_label`]: label } : {}),
                  }))
                }
              />
            ))}
          </div>
        </section>
      ) : null}

      <div className="interview-actions">
        <button type="button" className="interview-btn" disabled={step === 0} onClick={() => void handleBack()}>
          Back
        </button>
        {step < stages.length - 1 ? (
          <button type="button" className="interview-btn interview-btn-primary" onClick={() => void handleNext()}>
            Save & continue
          </button>
        ) : (
          <button type="button" className="interview-btn interview-btn-primary" onClick={() => void handleDone()}>
            Done — open Write mode
          </button>
        )}
        <button type="button" className="interview-btn interview-btn-ghost" onClick={() => void persist({})}>
          Save draft
        </button>
      </div>

      <p className="mono interview-footer-note">
        Skip optional questions — the agent still infers from the repo. Only confirmed fields from this form are
        trusted as author answers.
      </p>
    </main>
  );
}

function InterviewField({
  field,
  value,
  labelValue = "",
  hint,
  onChange,
}: {
  field: QuestionField;
  value: string;
  labelValue?: string;
  hint: string | null;
  onChange: (v: string, label?: string) => void;
}) {
  const id = `iq-${field.key}`;
  return (
    <div className="interview-field">
      <label htmlFor={id} className="interview-field-label">
        {field.label}
        {field.optional ? <span className="interview-optional"> · optional</span> : null}
      </label>
      <p className="interview-field-prompt">{field.prompt}</p>
      {field.example ? <p className="mono interview-field-example">e.g. {field.example}</p> : null}
      {hint ? <p className="interview-inferred">{hint}</p> : null}
      {field.kind === "choice" ? (
        <ChoiceGroup id={id} field={field} value={value} onChange={onChange} />
      ) : field.kind === "slider" ? (
        <SliderGroup id={id} field={field} value={value} label={labelValue} onChange={onChange} />
      ) : field.kind === "textarea" ? (
        <textarea
          id={id}
          className="interview-input interview-textarea"
          rows={4}
          value={value}
          placeholder={"placeholder" in field ? field.placeholder : undefined}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          id={id}
          className="interview-input"
          type="text"
          value={value}
          placeholder={"placeholder" in field ? field.placeholder : undefined}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  );
}

function SliderGroup({
  id,
  field,
  value,
  label,
  onChange,
}: {
  id: string;
  field: Extract<QuestionField, { kind: "slider" }>;
  value: string;
  label: string;
  onChange: (v: string, label?: string) => void;
}) {
  const { stops } = field;
  let index = 0;
  if (label) {
    const byLabel = stops.findIndex((s) => s.label === label);
    if (byLabel >= 0) index = byLabel;
  } else if (value) {
    const byValue = stops.findIndex((s) => s.value === value);
    if (byValue >= 0) index = byValue;
  }
  index = Math.min(Math.max(index, 0), stops.length - 1);
  const current = stops[index] ?? stops[0];

  return (
    <div className="interview-slider" role="group" aria-labelledby={id}>
      <p className="interview-slider-readout mono" aria-live="polite">
        {current.label}
      </p>
      <input
        id={id}
        type="range"
        className="interview-range"
        min={0}
        max={stops.length - 1}
        step={1}
        value={index}
        onChange={(e) => {
          const next = stops[Number(e.target.value)];
          if (next) onChange(next.value, next.label);
        }}
        aria-valuetext={current.label}
      />
      <div className="interview-slider-ticks mono" aria-hidden>
        {stops.map((s, i) => (
          <span key={`${s.value}-${i}`} className={i === index ? "is-active" : undefined}>
            {i + 1}
          </span>
        ))}
      </div>
    </div>
  );
}

function ChoiceGroup({
  id,
  field,
  value,
  onChange,
}: {
  id: string;
  field: Extract<QuestionField, { kind: "choice" }>;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="interview-choices" role="radiogroup" aria-labelledby={id}>
      {field.options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="radio"
          aria-checked={value === opt.value}
          className="interview-choice"
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}