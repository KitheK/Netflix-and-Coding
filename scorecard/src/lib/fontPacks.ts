import type { BuiltinFontPackId, FontPackManifest, ThemeJson } from "./schemas";

import editorialPlain from "../../font-packs/editorial-plain/manifest.json";
import librettoDefault from "../../font-packs/libretto-default/manifest.json";
import makingSoftware from "../../font-packs/making-software/manifest.json";

export const BUILTIN_FONT_PACKS: Record<BuiltinFontPackId, FontPackManifest> = {
  "libretto-default": librettoDefault as FontPackManifest,
  "editorial-plain": editorialPlain as FontPackManifest,
  "making-software": makingSoftware as FontPackManifest,
  custom: {
    schemaVersion: 1,
    packId: "custom",
    label: "Custom traced pack",
    license: "font-packs/custom/LICENSE",
    faces: {
      display: { family: "Custom Display", woff2: "/font-packs/custom/CustomDisplay-Regular.woff2" },
      body: { family: "Newsreader", woff2: "/fonts/Newsreader-Variable.woff2" },
      ui: { family: "Source Sans 3", woff2: "/fonts/SourceSans3-Variable.woff2" },
      mono: { family: "Departure Mono", woff2: "/fonts/DepartureMono-Regular.woff2" },
    },
  },
};

export const FONT_PACK_OPTIONS: { id: BuiltinFontPackId; blurb: string; specimen: string }[] = [
  { id: "libretto-default", blurb: "Paléologue · Departure", specimen: "/previews/fonts/specimen-AZ.png" },
  { id: "editorial-plain", blurb: "Newsreader · Departure", specimen: "/previews/fonts/pack-editorial-plain.png" },
  { id: "making-software", blurb: "Literata · Departure (MS editorial)", specimen: "/previews/fonts/pack-making-software.png" },
];

export function resolveFontPack(theme: ThemeJson): FontPackManifest {
  const id = theme.fontPackId ?? "libretto-default";
  const builtin = BUILTIN_FONT_PACKS[id as BuiltinFontPackId];
  if (builtin) return builtin;
  return { ...BUILTIN_FONT_PACKS.custom, packId: id, label: id };
}

export function inferFontPackId(theme: ThemeJson): string {
  if (theme.fontPackId) return theme.fontPackId;
  if (theme.fonts.display === "paleologue" || theme.fonts.display === "paleologue-poster") {
    return "libretto-default";
  }
  return "libretto-default";
}

export function withFontPack(theme: ThemeJson, packId: BuiltinFontPackId): ThemeJson {
  const display =
    packId === "libretto-default"
      ? theme.fonts.display === "paleologue"
        ? "paleologue"
        : "paleologue-poster"
      : theme.fonts.display;
  return {
    ...theme,
    fontPackId: packId,
    fontRoles: undefined,
    fonts: {
      display,
      body: "newsreader",
      ui: "source-sans",
      mono: "departure",
    },
  };
}