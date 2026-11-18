import { useContent } from "../../lib/ContentContext";
import { NouveauFrieze, NouveauMedallion, NouveauRail } from "../nouveau";

/** Reader-facing desk decoration — ornaments only, no pickers. */
export function HomeDeskOrnaments() {
  const { theme } = useContent();
  const palette = theme.ornaments.ornamentPalette === "plate" ? "plate" : "libretto";
  const frieze = theme.ornaments.footFrieze === "pavot30" ? "pavot30" : "lys33";

  return (
    <section className="home-desk-ornaments" aria-label="Desk ornaments">
      <div className="home-desk-ornaments__rule">
        <NouveauMedallion palette={palette} size={72} className="home-desk-ornaments__medallion" />
        <NouveauRail variant="pavot30" palette={palette} width={48} side="left" className="home-desk-ornaments__rail" />
        <NouveauRail variant="band01" palette={palette} width={36} side="right" className="home-desk-ornaments__rail home-desk-ornaments__rail--short" />
      </div>
      <NouveauFrieze variant={frieze === "pavot30" ? "pavot30" : "lys33"} animate className="home-desk-ornaments__frieze" />
    </section>
  );
}