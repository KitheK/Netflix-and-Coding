import { useEffect, useMemo } from "react";
import { catalogFacesForRole, FONT_CATALOG, resolvedFaceIds, stackCssFamily } from "../lib/fontCatalog";
import { BUILTIN_FONT_PACKS, resolveFontPack } from "../lib/fontPacks";
import type { FontFaceId, FontRole, ThemeJson } from "../lib/schemas";

const ROLE_COPY: Record<FontRole, { title: string; sample: string }> = {
  display: { title: "Display / title", sample: "Project Guide" },
  body: { title: "Body", sample: "Long-form manual prose with links and emphasis." },
  ui: { title: "UI sans", sample: "Navigation · metadata · buttons" },
  mono: { title: "Mono / code", sample: "FIG_001 · WORDS 842 · npm test" },
};

export function FontRolePicker({ theme, onChange }: { theme: ThemeJson; onChange: (t: ThemeJson) => void }) {
  const pack = resolveFontPack(theme);
  const active = resolvedFaceIds(theme, pack);

  useEffect(() => {
    const el = document.documentElement;
    el.style.setProperty("--preview-display", stackCssFamily(active.display));
    el.style.setProperty("--preview-body", stackCssFamily(active.body));
    el.style.setProperty("--preview-ui", stackCssFamily(active.ui));
    el.style.setProperty("--preview-mono", stackCssFamily(active.mono));
  }, [active]);

  const sub = useMemo(() => BUILTIN_FONT_PACKS[pack.packId as keyof typeof BUILTIN_FONT_PACKS]?.substitutions, [pack.packId]);

  return (
    <div className="font-role-picker">
      <p className="font-role-intro">
        Start from a pack, then override individual roles. Changes preview live below and save to <code>theme.fontRoles</code>.
      </p>
      {(["display", "body", "ui", "mono"] as const).map((role) => (
        <section key={role} className="font-role-section">
          <h3>{ROLE_COPY[role].title}</h3>
          {sub?.[role] ? (
            <p className="font-role-sub">
              Stands in for <strong>{sub[role].intended}</strong> ({sub[role].reason})
            </p>
          ) : null}
          <div className="font-role-options">
            {catalogFacesForRole(role).map((face) => (
              <button
                key={face.id}
                type="button"
                className="font-role-opt"
                aria-pressed={active[role] === face.id}
                onClick={() =>
                  onChange({
                    ...theme,
                    fontRoles: { ...theme.fontRoles, [role]: face.id },
                  })
                }
              >
                {face.label}
              </button>
            ))}
          </div>
          <div className={`font-role-sample font-role-sample--${role}`}>{ROLE_COPY[role].sample}</div>
        </section>
      ))}
      <button
        type="button"
        className="font-role-reset"
        onClick={() => onChange({ ...theme, fontRoles: undefined })}
      >
        Reset to pack defaults
      </button>
      <details className="font-role-json">
        <summary>Active face ids</summary>
        <pre>{JSON.stringify(active, null, 2)}</pre>
        <p className="font-role-lic">
          {Object.values(active).map((id) => `${FONT_CATALOG[id as FontFaceId].label} (${FONT_CATALOG[id as FontFaceId].license})`).join(" · ")}
        </p>
      </details>
    </div>
  );
}