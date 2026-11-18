import type { Palette } from "./nouveau/core";
import { NouveauFrieze, type FriezeVariant } from "./nouveau";
import { useContent } from "../lib/ContentContext";

export function FootFrieze() {
  const { theme } = useContent();
  const v = theme.ornaments.footFrieze;
  if (v === "none" || theme.scheme === "plain") return null;

  const variant = v as FriezeVariant;
  const palette: Palette = theme.ornaments.ornamentPalette === "plate" ? "plate" : "libretto";

  return (
    <div className="foot-frieze" aria-hidden="true">
      <NouveauFrieze
        variant={variant}
        height={theme.ornaments.footCrop === "band" ? 72 : 120}
        crop={theme.ornaments.footCrop}
        palette={palette}
        animate={theme.ornaments.footAnimate}
        flip
      />
    </div>
  );
}