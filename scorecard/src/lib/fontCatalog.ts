import type { FontFaceId, FontFaceRef, FontPackManifest, FontRole, ThemeJson } from "./schemas";

export type CatalogFace = FontFaceRef & {
  id: FontFaceId;
  label: string;
  roles: FontRole[];
  license: string;
};

export const FONT_CATALOG: Record<FontFaceId, CatalogFace> = {
  "paleologue-poster": {
    id: "paleologue-poster",
    label: "Libretto Paléologue Poster",
    family: "Libretto Paléologue Poster",
    woff2: "/fonts/LibrettoPaleologuePoster-Regular.woff2",
    roles: ["display"],
    license: "OFL",
  },
  paleologue: {
    id: "paleologue",
    label: "Libretto Paléologue",
    family: "Libretto Paléologue",
    woff2: "/fonts/LibrettoPaleologue-Regular.woff2",
    roles: ["display"],
    license: "OFL",
  },
  newsreader: {
    id: "newsreader",
    label: "Newsreader",
    family: "Newsreader",
    woff2: "/fonts/Newsreader-Variable.woff2",
    weight: "200 800",
    style: "normal",
    roles: ["display", "body"],
    license: "OFL",
  },
  literata: {
    id: "literata",
    label: "Literata",
    family: "Literata",
    woff2: "/fonts/catalog/literata.woff2",
    weight: "200 900",
    roles: ["display", "body"],
    license: "OFL",
  },
  fraunces: {
    id: "fraunces",
    label: "Fraunces",
    family: "Fraunces",
    woff2: "/fonts/catalog/fraunces.woff2",
    weight: "100 900",
    roles: ["display"],
    license: "OFL",
  },
  "source-serif-4": {
    id: "source-serif-4",
    label: "Source Serif 4",
    family: "Source Serif 4",
    woff2: "/fonts/catalog/source-serif-4.woff2",
    weight: "200 900",
    roles: ["display", "body"],
    license: "OFL",
  },
  lora: {
    id: "lora",
    label: "Lora",
    family: "Lora",
    woff2: "/fonts/catalog/lora.woff2",
    weight: "400 700",
    roles: ["display", "body"],
    license: "OFL",
  },
  "source-sans-3": {
    id: "source-sans-3",
    label: "Source Sans 3",
    family: "Source Sans 3",
    woff2: "/fonts/SourceSans3-Variable.woff2",
    weight: "200 900",
    style: "normal",
    roles: ["ui"],
    license: "OFL",
  },
  inter: {
    id: "inter",
    label: "Inter",
    family: "Inter",
    woff2: "/fonts/catalog/inter.woff2",
    weight: "100 900",
    roles: ["ui"],
    license: "OFL",
  },
  "ibm-plex-sans": {
    id: "ibm-plex-sans",
    label: "IBM Plex Sans",
    family: "IBM Plex Sans",
    woff2: "/fonts/catalog/ibm-plex-sans.woff2",
    weight: "400",
    roles: ["ui"],
    license: "OFL",
  },
  departure: {
    id: "departure",
    label: "Departure Mono",
    family: "Departure Mono",
    woff2: "/fonts/DepartureMono-Regular.woff2",
    roles: ["mono", "display"],
    license: "OFL",
  },
  "jetbrains-mono": {
    id: "jetbrains-mono",
    label: "JetBrains Mono",
    family: "JetBrains Mono",
    woff2: "/fonts/catalog/jetbrains-mono.woff2",
    weight: "100 800",
    roles: ["mono"],
    license: "OFL",
  },
  "ibm-plex-mono": {
    id: "ibm-plex-mono",
    label: "IBM Plex Mono",
    family: "IBM Plex Mono",
    woff2: "/fonts/catalog/ibm-plex-mono.woff2",
    weight: "400",
    roles: ["mono"],
    license: "OFL",
  },
};

const ROLES: FontRole[] = ["display", "body", "ui", "mono"];

export function catalogFacesForRole(role: FontRole): CatalogFace[] {
  return Object.values(FONT_CATALOG).filter((f) => f.roles.includes(role));
}

function faceRef(faceId: FontFaceId): FontFaceRef {
  const c = FONT_CATALOG[faceId];
  return { family: c.family, woff2: c.woff2, weight: c.weight, style: c.style };
}

function legacyDisplayFaceId(theme: ThemeJson): FontFaceId {
  if (theme.fonts.display === "paleologue") return "paleologue";
  return "paleologue-poster";
}

function packDefaultFaceId(pack: FontPackManifest, role: FontRole, theme: ThemeJson): FontFaceId {
  if (pack.defaultFaceIds?.[role]) return pack.defaultFaceIds[role]!;
  if (role === "display" && pack.packId === "libretto-default") return legacyDisplayFaceId(theme);
  if (role === "display" && pack.packId === "editorial-plain") return "newsreader";
  if (role === "body") return "newsreader";
  if (role === "ui") return "source-sans-3";
  if (role === "mono") return "departure";
  return "newsreader";
}

export function resolveThemeFaces(theme: ThemeJson, pack: FontPackManifest): FontPackManifest["faces"] {
  const faces = {} as FontPackManifest["faces"];
  for (const role of ROLES) {
    let faceId = theme.fontRoles?.[role] ?? packDefaultFaceId(pack, role, theme);
    if (role === "display" && !theme.fontRoles?.display && pack.packId === "libretto-default") {
      faceId = legacyDisplayFaceId(theme);
    }
    faces[role] = faceRef(faceId);
  }
  return faces;
}

export function resolvedFaceIds(theme: ThemeJson, pack: FontPackManifest): Record<FontRole, FontFaceId> {
  const out = {} as Record<FontRole, FontFaceId>;
  for (const role of ROLES) {
    if (role === "display" && !theme.fontRoles?.display && pack.packId === "libretto-default") {
      out.display = legacyDisplayFaceId(theme);
    } else {
      out[role] = theme.fontRoles?.[role] ?? packDefaultFaceId(pack, role, theme);
    }
  }
  return out;
}

export function stackCssFamily(faceId: FontFaceId): string {
  const c = FONT_CATALOG[faceId];
  const fallbacks =
    faceId === "departure" || faceId === "jetbrains-mono" || faceId === "ibm-plex-mono"
      ? "ui-monospace, monospace"
      : faceId === "source-sans-3" || faceId === "inter" || faceId === "ibm-plex-sans"
        ? "system-ui, sans-serif"
        : "Georgia, serif";
  return `"${c.family}", ${fallbacks}`;
}