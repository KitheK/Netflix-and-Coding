import type { ReactNode } from "react";
import type { MediaChrome } from "../lib/schemas";
import { NouveauFrame } from "./nouveau";
import { useContent } from "../lib/ContentContext";

export type LiveFrameProps = {
  chrome?: MediaChrome;
  linkOut?: string;
  caption?: string;
  mode?: "screenshot" | "clip";
  statusLine?: string;
  children: ReactNode;
  footer?: ReactNode;
  /** Lite frames keep the screenshot as hero; ornate adds full Nouveau border. */
  weight?: "lite" | "ornate";
};

export function LiveFrame({
  chrome,
  linkOut,
  caption,
  mode = "screenshot",
  statusLine,
  children,
  footer,
  weight = "lite",
}: LiveFrameProps) {
  const { theme } = useContent();
  const frame = theme.ornaments.demoFrame === "none" ? "pavot30" : theme.ornaments.demoFrame;
  const route = chrome?.routeLabel ?? "app/preview";
  const tabs = chrome?.tabs ?? [];

  const chromeBody = (
    <div className="live-frame__chrome">
      <div className="live-frame__titlebar" aria-hidden="true">
        <span className="live-frame__dots">
          <span />
          <span />
          <span />
        </span>
        <span className="live-frame__route mono">{route}</span>
        {tabs.length ? (
          <div className="live-frame__tabs mono" role="presentation">
            {tabs.map((tab, i) => (
              <span key={tab} className={i === 0 ? "is-on" : undefined}>
                {tab}
              </span>
            ))}
          </div>
        ) : null}
      </div>
      <div className="live-frame__media" data-mode={mode}>
        {children}
      </div>
      {footer}
      <div className="live-frame__toolbar mono" aria-label="Frame controls">
        {linkOut ? (
          <a className="live-frame__link-out" href={linkOut} target="_blank" rel="noreferrer noopener">
            Open deploy ↗
          </a>
        ) : (
          <span className="live-frame__hint">Screenshot in page — not a live embed</span>
        )}
      </div>
    </div>
  );

  return (
    <figure className={`live-frame${weight === "lite" ? " live-frame--lite" : ""}`}>
      {weight === "ornate" ? (
        <NouveauFrame variant={frame} className="live-frame__nouveau" gap={8} animate={false}>
          {chromeBody}
        </NouveauFrame>
      ) : (
        chromeBody
      )}
      {statusLine ? <p className="live-frame__status mono">{statusLine}</p> : null}
      {caption ? (
        <figcaption className="live-frame__caption">
          <span className="mono">{mode === "clip" ? "CLIP" : "SHOT"}</span>
          <span>{caption}</span>
        </figcaption>
      ) : null}
    </figure>
  );
}