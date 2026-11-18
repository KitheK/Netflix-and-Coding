import { NouveauFrame, NouveauMedallion, NouveauRail } from "../components/nouveau";
import { useContent } from "../lib/ContentContext";

/** Dev-only ornament wiring check (WS1 acceptance). */
export function OrnamentSmokePage() {
  const { theme } = useContent();
  const palette = theme.ornaments.ornamentPalette === "plate" ? "plate" : "libretto";

  return (
    <main className="chapter">
      <header className="chapter-head">
        <p className="mono">DEV / ORNAMENTS</p>
        <h1>Nouveau smoke plate</h1>
        <p className="standfirst">SVG frieze, frame, rail, and medallion wired for manual chrome.</p>
        <hr className="rule" />
      </header>
      <div className="prose">
        <NouveauRail variant="pavot30" palette={palette} width={56} side="left" style={{ marginBottom: "1.5rem", minHeight: "12rem" }} />
        <NouveauFrame variant="coins46" palette={palette} className="architecture-plate-frame">
          <p>Framed sample content inside NouveauFrame.</p>
        </NouveauFrame>
        <div style={{ marginTop: "1.5rem", maxWidth: "6rem" }}>
          <NouveauMedallion palette={palette} size={120} />
        </div>
      </div>
    </main>
  );
}