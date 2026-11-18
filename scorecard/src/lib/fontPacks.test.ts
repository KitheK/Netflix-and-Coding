import { describe, expect, it } from "vitest";
import { applyFontPackFaces } from "../theme/applyTheme";
import { resolveThemeFaces } from "./fontCatalog";
import { BUILTIN_FONT_PACKS, resolveFontPack, withFontPack } from "./fontPacks";
import { themePresets, validateTheme } from "./schemas";

describe("font packs", () => {
  it("resolves built-in libretto-default", () => {
    const theme = themePresets("libretto");
    const pack = resolveFontPack({ ...theme, fontPackId: "libretto-default" });
    expect(pack.packId).toBe("libretto-default");
    expect(pack.faces.display.woff2).toContain("Libretto");
  });

  it("withFontPack switches editorial-plain", () => {
    const next = withFontPack(themePresets("libretto"), "editorial-plain");
    expect(next.fontPackId).toBe("editorial-plain");
    expect(BUILTIN_FONT_PACKS["editorial-plain"].faces.display.family).toBe("Newsreader");
  });

  it("applyFontPackFaces emits @font-face rules", () => {
    if (typeof document === "undefined") return;
    const pack = BUILTIN_FONT_PACKS["editorial-plain"];
    applyFontPackFaces(resolveThemeFaces(themePresets("libretto"), pack));
    const el = document.getElementById("scorecard-font-pack-faces");
    expect(el?.textContent).toContain("Newsreader");
    expect(el?.textContent).toContain("woff2");
  });

  it("making-software pack defaults to literata", () => {
    const pack = BUILTIN_FONT_PACKS["making-software"];
    const faces = resolveThemeFaces(themePresets("libretto", "manual"), pack);
    expect(faces.body.family).toBe("Literata");
    expect(pack.substitutions?.display?.intended).toContain("Arizona");
  });

  it("fontRoles override body", () => {
    const pack = resolveFontPack(themePresets("libretto"));
    const faces = resolveThemeFaces({ ...themePresets("libretto"), fontRoles: { body: "lora" } }, pack);
    expect(faces.body.family).toBe("Lora");
    expect(validateTheme({ ...themePresets("libretto"), fontRoles: { body: "lora" } })).toEqual([]);
  });
});