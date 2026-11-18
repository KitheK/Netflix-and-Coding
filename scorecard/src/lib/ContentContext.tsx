import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { applyTheme, readStoredReadingTheme, READING_THEME_STORAGE_KEY, type ReadingTheme } from "../theme/applyTheme";
import { loadContent, type ContentBundle } from "./loadContent";
import { loadFontPackForTheme } from "./loadFontPack";
import type { ThemeJson } from "./schemas";

type Ctx = ContentBundle & {
  setTheme: (t: ThemeJson) => void;
  replaceBundle: (b: ContentBundle) => void;
  readingTheme: ReadingTheme;
  setReadingTheme: (mode: ReadingTheme) => void;
};

const ContentContext = createContext<Ctx | null>(null);

export function ContentProvider({ children }: { children: ReactNode }) {
  const [bundle, setBundle] = useState(loadContent);
  const [readingTheme, setReadingThemeState] = useState<ReadingTheme>(readStoredReadingTheme);

  useEffect(() => {
    let cancelled = false;
    void loadFontPackForTheme(bundle.theme).then((pack) => {
      if (!cancelled) applyTheme(bundle.theme, readingTheme, pack);
    });
    return () => {
      cancelled = true;
    };
  }, [bundle.theme, readingTheme]);

  const setReadingTheme = useCallback((mode: ReadingTheme) => {
    setReadingThemeState(mode);
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(READING_THEME_STORAGE_KEY, mode);
    }
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      ...bundle,
      setTheme: (theme) => setBundle((b) => ({ ...b, theme })),
      replaceBundle: setBundle,
      readingTheme,
      setReadingTheme,
    }),
    [bundle, readingTheme, setReadingTheme],
  );

  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>;
}

export function useContent() {
  const ctx = useContext(ContentContext);
  if (!ctx) throw new Error("useContent outside provider");
  return ctx;
}