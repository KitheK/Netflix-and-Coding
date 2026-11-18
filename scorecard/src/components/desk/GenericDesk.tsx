import { useState } from "react";
import { useContent } from "../../lib/ContentContext";
import { themePresets } from "../../lib/schemas";
import {
  NouveauFrame,
  NouveauFrieze,
  NouveauRail,
  type FrameVariant as NouveauFrameVariant,
  type FriezeVariant as NouveauFriezeVariant,
  type RailVariant as NouveauRailVariant,
} from "../nouveau";

const FRAMES: NouveauFrameVariant[] = ["coins46", "pavot30", "lys33", "halo01"];
const FRIEZES: NouveauFriezeVariant[] = ["lys33", "pavot30"];
const RAILS: NouveauRailVariant[] = ["pavot30", "band01"];

function pickFrame(raw: string): NouveauFrameVariant {
  return FRAMES.includes(raw as NouveauFrameVariant) ? (raw as NouveauFrameVariant) : "coins46";
}

function pickFrieze(raw: string): NouveauFriezeVariant {
  return FRIEZES.includes(raw as NouveauFriezeVariant) ? (raw as NouveauFriezeVariant) : "lys33";
}

function pickRail(raw: string): NouveauRailVariant {
  return RAILS.includes(raw as NouveauRailVariant) ? (raw as NouveauRailVariant) : "pavot30";
}

export function GenericDesk({ title = "Try the ornament desk" }: { title?: string }) {
  const { theme, setTheme } = useContent();
  const [frame, setFrame] = useState<NouveauFrameVariant>(pickFrame(theme.ornaments.plateFrame));
  const [frieze, setFrieze] = useState<NouveauFriezeVariant>(pickFrieze(theme.ornaments.footFrieze));
  const [rail, setRail] = useState<NouveauRailVariant>(pickRail(theme.ornaments.rail));

  return (
    <section className="desk-interactives generic-desk" aria-labelledby="desk-play-label">
      <h2 id="desk-play-label" className="section-label">
        {title.toUpperCase()}
      </h2>
      <p className="desk-interactives-lede">
        Generic Art Nouveau desk pieces — swap frame variants, frieze bands, and reading rails without project-specific UI
        assets.
      </p>
      <div className="desk-interactives-grid">
        <div className="desk-panel">
          <p className="mono">TOKEN SWATCH</p>
          <div className="desk-swatch-grid" aria-hidden="true">
            <span style={{ background: theme.tokens.canvas, border: `1px solid ${theme.tokens.rule}` }} title="canvas" />
            <span style={{ background: theme.tokens.ink }} title="ink" />
            <span style={{ background: theme.tokens.action }} title="action" />
            <span style={{ background: theme.tokens.rule }} title="rule" />
          </div>
          <div className="desk-scheme-row mono">
            {(["libretto", "plate", "plain"] as const).map((s) => (
              <button
                key={s}
                type="button"
                className={theme.scheme === s ? "is-on" : undefined}
                onClick={() => setTheme(themePresets(s, theme.tone))}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="desk-panel">
          <p className="mono">FRAME VARIANT</p>
          <div className="desk-picker-row">
            {FRAMES.map((v) => (
              <button key={v} type="button" className={frame === v ? "is-on mono" : "mono"} onClick={() => setFrame(v)}>
                {v}
              </button>
            ))}
          </div>
          <NouveauFrame variant={frame} animate className="desk-frame-demo" gap={8}>
            <div className="desk-frame-sample">
              <p className="mono">Sample plate</p>
              <p>Click a variant to preview the Nouveau border.</p>
            </div>
          </NouveauFrame>
        </div>
      </div>

      <div className="desk-interactives-grid">
        <div className="desk-panel">
          <p className="mono">FRIEZE</p>
          <div className="desk-picker-row">
            {FRIEZES.map((v) => (
              <button key={v} type="button" className={frieze === v ? "is-on mono" : "mono"} onClick={() => setFrieze(v)}>
                {v}
              </button>
            ))}
          </div>
          <NouveauFrieze variant={frieze} animate className="desk-frieze-demo" />
        </div>

        <div className="desk-panel">
          <p className="mono">RAIL</p>
          <div className="desk-picker-row">
            {RAILS.map((v) => (
              <button key={v} type="button" className={rail === v ? "is-on mono" : "mono"} onClick={() => setRail(v)}>
                {v}
              </button>
            ))}
          </div>
          <div className="desk-rail-demo">
            <NouveauRail variant={rail} />
          </div>
        </div>
      </div>
    </section>
  );
}