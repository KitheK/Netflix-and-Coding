import type { BuiltinFontPackId, FontPackManifest, ThemeJson } from "./schemas";
import { BUILTIN_FONT_PACKS, inferFontPackId } from "./fontPacks";

export function isBuiltinFontPackId(id: string): id is BuiltinFontPackId {
  return id in BUILTIN_FONT_PACKS;
}

export async function loadFontPackForTheme(theme: ThemeJson): Promise<FontPackManifest> {
  const id = inferFontPackId(theme);
  if (isBuiltinFontPackId(id)) return BUILTIN_FONT_PACKS[id];
  const res = await fetch(`/font-packs/${id}/manifest.json`);
  if (!res.ok) return { ...BUILTIN_FONT_PACKS.custom, packId: id, label: id };
  return (await res.json()) as FontPackManifest;
}