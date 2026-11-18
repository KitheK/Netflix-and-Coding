import type { FontPackManifest, ThemeJson } from "../lib/schemas";
import { resolvedFaceIds, resolveThemeFaces, stackCssFamily } from "../lib/fontCatalog";
import { resolveFontPack } from "../lib/fontPacks";

export type ReadingTheme = "light" | "dark";

export const READING_THEME_STORAGE_KEY = "scorecard.readingTheme";

const STYLE_ID = "scorecard-font-pack-faces";

const DARK_READING_TOKENS: ThemeJson["tokens"] = {
  canvas: "#0b1118",
  ink: "#f1f3f6",
  action: "#5b8cff",
  rule: "rgba(241, 243, 246, 0.22)",
  muted: "#9aa3ad",
};

export function readStoredReadingTheme(): ReadingTheme {
  if (typeof window === "undefined") return "light";
  const stored = window.sessionStorage.getItem(READING_THEME_STORAGE_KEY);
  return stored === "dark" ? "dark" : "light";
}

function faceRule(face: FontPackManifest["faces"]["display"], url: string): string {
  const weight = face.weight != null ? `font-weight: ${face.weight};\n` : "";
  const style = face.style ? `font-style: ${face.style};\n` : "";
  return `@font-face {
  font-family: "${face.family}";
  src: url("${url}") format("woff2");
  font-display: swap;
  ${weight}${style}}`;
}

export function applyFontPackFaces(faces: FontPackManifest["faces"]) {
  const unique = new Map<string, FontPackManifest["faces"]["display"]>();
  for (const face of Object.values(faces)) {
    unique.set(face.woff2, face);
  }
  const rules = [...unique.values()].map((face) => faceRule(face, face.woff2)).join("\n");
  let el = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
  if (!el) {
    el = document.createElement("style");
    el.id = STYLE_ID;
    document.head.appendChild(el);
  }
  el.textContent = rules;
}

export function applyTheme(
  theme: ThemeJson,
  reading: ReadingTheme = "light",
  packOverride?: FontPackManifest,
) {
  const root = document.documentElement;
  const pack = packOverride ?? resolveFontPack(theme);
  const faces = resolveThemeFaces(theme, pack);
  const faceIds = resolvedFaceIds(theme, pack);
  applyFontPackFaces(faces);

  const tokens = reading === "dark" ? { ...theme.tokens, ...DARK_READING_TOKENS } : theme.tokens;
  root.style.setProperty("--canvas", tokens.canvas);
  root.style.setProperty("--ink", tokens.ink);
  root.style.setProperty("--action", tokens.action);
  root.style.setProperty("--rule", tokens.rule);
  root.style.setProperty("--muted", tokens.muted);
  root.style.setProperty("--font-display", stackCssFamily(faceIds.display));
  root.style.setProperty("--font-body", stackCssFamily(faceIds.body));
  root.style.setProperty("--font-ui", stackCssFamily(faceIds.ui));
  root.style.setProperty("--font-mono", stackCssFamily(faceIds.mono));
  root.dataset.scheme = theme.scheme;
  root.dataset.tone = theme.tone;
  root.dataset.fontPack = pack.packId;
  root.dataset.ornamentPalette = theme.ornaments.ornamentPalette;
  root.dataset.theme = reading;
}