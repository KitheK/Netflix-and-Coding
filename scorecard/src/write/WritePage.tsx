import Link from "@tiptap/extension-link";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useMemo, useState } from "react";
import { useContent } from "../lib/ContentContext";
import { authorConfirm, markAuthored } from "../lib/provenance";
import { BUILTIN_FONT_PACKS, FONT_PACK_OPTIONS, withFontPack } from "../lib/fontPacks";
import { FontRolePicker } from "./FontRolePicker";
import { themePresets, type BuiltinFontPackId, type ThemeJson, type ThemeScheme } from "../lib/schemas";

async function saveFile(file: string, data: unknown) {
  const res = await fetch("/__scorecard/save", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ file, data }),
  });
  if (!res.ok) throw new Error(await res.text());
}

export function WritePage() {
  const { scorecard, theme, setTheme, replaceBundle, ...rest } = useContent();
  const [saved, setSaved] = useState("Ready");
  const [tab, setTab] = useState<"edit" | "look" | "review">("edit");

  const editor = useEditor({
    extensions: [StarterKit, Link],
    content: `<p>${scorecard.job.text}</p><p>${scorecard.brief.text}</p><p>${scorecard.outcome.text}</p>`,
  });

  const drafts = useMemo(() => {
    const items: Array<{ key: string; text: string; provenance: string }> = [];
    const push = (key: string, c: { text: string; provenance: string }) => {
      if (c.provenance === "draft" || c.provenance === "inferred") items.push({ key, text: c.text, provenance: c.provenance });
    };
    push("job", scorecard.job);
    push("brief", scorecard.brief);
    push("outcome", scorecard.outcome);
    scorecard.features.forEach((f, i) => {
      if (f.provenance === "draft" || f.provenance === "inferred") {
        items.push({ key: `feature:${i}`, text: f.name, provenance: f.provenance });
      }
    });
    return items;
  }, [scorecard]);

  async function persistTheme(next: ThemeJson) {
    setTheme(next);
    setSaved("Saving…");
    await saveFile("theme.json", next);
    setSaved("Saved Look");
  }

  async function persistScorecardFromEditor() {
    if (!editor) return;
    const text = editor.getText();
    const parts = text.split(/\n+/).map((s) => s.trim()).filter(Boolean);
    const next = {
      ...scorecard,
      job: markAuthored({ ...scorecard.job, text: parts[0] ?? scorecard.job.text, provenance: scorecard.job.provenance }),
      brief: markAuthored({ ...scorecard.brief, text: parts[1] ?? scorecard.brief.text, provenance: scorecard.brief.provenance }),
      outcome: markAuthored({
        ...scorecard.outcome,
        text: parts[2] ?? scorecard.outcome.text,
        provenance: scorecard.outcome.provenance,
      }),
    };
    replaceBundle({ ...rest, scorecard: next, theme });
    setSaved("Saving…");
    await saveFile("scorecard.json", next);
    setSaved("Saved");
  }

  async function confirmItem(key: string) {
    const next = { ...scorecard };
    if (key === "job") next.job = authorConfirm(scorecard.job);
    if (key === "brief") next.brief = authorConfirm(scorecard.brief);
    if (key === "outcome") next.outcome = authorConfirm(scorecard.outcome);
    if (key.startsWith("feature:")) {
      const i = Number(key.split(":")[1]);
      next.features = scorecard.features.map((f, idx) => (idx === i ? { ...authorConfirm(f), name: f.name, status: f.status, note: f.note } : f));
    }
    replaceBundle({ ...rest, scorecard: next, theme });
    await saveFile("scorecard.json", next);
    setSaved("Confirmed");
  }

  return (
    <main className="page write-layout">
      <div>
        <h1>Write</h1>
        <p className="mono">Diary mode — edits save to content/*.json on this machine.</p>
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
          {(["edit", "look", "review"] as const).map((t) => (
            <button key={t} type="button" aria-pressed={tab === t} onClick={() => setTab(t)}>
              {t}
            </button>
          ))}
          <span className="saved">{saved}</span>
        </div>

        {tab === "edit" ? (
          <>
            <div className="write-editor">
              <EditorContent editor={editor} />
            </div>
            <p>
              <button type="button" onClick={() => void persistScorecardFromEditor()}>
                Save prose
              </button>
            </p>
            <p>
              <LinkHome />
            </p>
          </>
        ) : null}

        {tab === "look" ? (
          <LookPanel theme={theme} onChange={(t) => void persistTheme(t)} />
        ) : null}

        {tab === "review" ? (
          <div>
            <h2>Review draft / inferred</h2>
            {drafts.length === 0 ? <p>Nothing left to confirm.</p> : null}
            <ul>
              {drafts.map((d) => (
                <li key={d.key}>
                  <span className="mono">{d.provenance}</span> — {d.text}{" "}
                  <button type="button" onClick={() => void confirmItem(d.key)}>
                    Confirm
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
      <aside className="write-side">
        <h3>Tips</h3>
        <p>Only Confirm promotes provenance to confirmed. Refresh from repo never overwrites authored text.</p>
        <p className="mono">size: {scorecard.size}</p>
      </aside>
    </main>
  );
}

function LinkHome() {
  return (
    <a href="/" data-click="nav">
      View summary
    </a>
  );
}

function LookPanel({ theme, onChange }: { theme: ThemeJson; onChange: (t: ThemeJson) => void }) {
  const schemes: ThemeScheme[] = ["libretto", "plate", "poster", "plain", "custom"];
  const packId = (theme.fontPackId ?? "libretto-default") as BuiltinFontPackId;
  return (
    <div className="look-grid">
      <h2>Look</h2>
      <p>Font pack</p>
      {FONT_PACK_OPTIONS.map((opt) => (
        <button
          key={opt.id}
          type="button"
          aria-pressed={packId === opt.id}
          onClick={() => onChange(withFontPack(themePresets(theme.scheme, theme.tone), opt.id))}
        >
          {BUILTIN_FONT_PACKS[opt.id].label}
          <span className="look-pack-blurb">{opt.blurb}</span>
          <img src={opt.specimen} alt="" width={160} style={{ display: "block", marginTop: "0.25rem" }} />
        </button>
      ))}
      <p>Scheme</p>
      {schemes.map((s) => (
        <button
          key={s}
          type="button"
          aria-pressed={theme.scheme === s}
          onClick={() => onChange({ ...withFontPack(themePresets(s, s === "plain" ? "plain" : theme.tone), packId) })}
        >
          {s}
        </button>
      ))}
      <FontRolePicker theme={theme} onChange={onChange} />
      {packId === "libretto-default" ? (
        <>
          <p>Paléologue variant</p>
          <button
            type="button"
            aria-pressed={theme.fonts.display === "paleologue-poster"}
            onClick={() => onChange({ ...theme, fonts: { ...theme.fonts, display: "paleologue-poster" } })}
          >
            Poster (COLR)
          </button>
          <button
            type="button"
            aria-pressed={theme.fonts.display === "paleologue"}
            onClick={() => onChange({ ...theme, fonts: { ...theme.fonts, display: "paleologue" } })}
          >
            Outline
          </button>
        </>
      ) : null}
      <p>Foot frieze</p>
      {(["lys33", "pavot30", "none"] as const).map((v) => (
        <button
          key={v}
          type="button"
          aria-pressed={theme.ornaments.footFrieze === v}
          onClick={() => onChange({ ...theme, ornaments: { ...theme.ornaments, footFrieze: v } })}
        >
          {v}
          {v !== "none" ? (
            <img src={`/previews/nouveau/frieze-${v === "lys33" ? "lys33" : "pavot30"}.png`} alt="" width={120} style={{ display: "block" }} />
          ) : null}
        </button>
      ))}
      <p>Plate frame</p>
      {(["coins46", "pavot30", "lys33", "halo01", "none"] as const).map((v) => (
        <button
          key={v}
          type="button"
          aria-pressed={theme.ornaments.plateFrame === v}
          onClick={() => onChange({ ...theme, ornaments: { ...theme.ornaments, plateFrame: v } })}
        >
          {v}
        </button>
      ))}
    </div>
  );
}
