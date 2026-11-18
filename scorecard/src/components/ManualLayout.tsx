import { useEffect, useState, type ReactNode } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { manualTitleFromProjectName, PLATFORM_ATTRIBUTION } from "../lib/schemas";
import { wordmarkTextFromProjectName } from "../lib/pixelGlyphs";
import { useContent } from "../lib/ContentContext";
import { PageEnter } from "./PageEnter";
import { PixelWordmark } from "./PixelWordmark";

function HamburgerIcon() {
  return (
    <svg width="18" height="14" viewBox="0 0 18 14" aria-hidden="true" className="toc-icon">
      <path d="M0 1h18M0 7h18M0 13h18" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export function ManualLayout({ children }: { children: ReactNode }) {
  const { manual, scorecard, readingTheme, setReadingTheme } = useContent();
  const { pathname } = useLocation();
  const [tocOpen, setTocOpen] = useState(false);

  const projectName = manual.projectName?.trim() || scorecard.projectName?.trim() || "Project";
  const manualTitle = manual.title?.trim() || manualTitleFromProjectName(projectName);
  const wordmark = wordmarkTextFromProjectName(projectName);

  useEffect(() => {
    setTocOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!tocOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setTocOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [tocOpen]);

  return (
    <div className={`shell manual-shell${tocOpen ? " toc-open" : ""}`}>
      <a className="skip" href="#manual-main">
        Skip to content
      </a>
      {tocOpen ? (
        <button
          className="backdrop no-print"
          type="button"
          aria-label="Close table of contents"
          onClick={() => setTocOpen(false)}
        />
      ) : null}
      <aside className="sidebar" aria-label="Table of contents" aria-hidden={!tocOpen}>
        <Link className="mark" to="/" onClick={() => setTocOpen(false)}>
          <PixelWordmark text={wordmark} cell={3} />
          <span className="mark-title display">{manualTitle}</span>
        </Link>
        <p className="sidebar-kicker mono">Generated guide · open menu to return to reading</p>
        <nav aria-label="Chapters">
          {manual.parts.map((part) => (
            <div className="nav-part" key={part.id}>
              <p>
                {part.id} {part.title}
              </p>
              {manual.chapters
                .filter((chapter) => chapter.part === part.id)
                .map((chapter) => {
                  const href = `/chapters/${chapter.slug}`;
                  return (
                    <Link
                      key={chapter.slug}
                      className="nav-link"
                      to={href}
                      aria-current={pathname === href ? "page" : undefined}
                      onClick={() => setTocOpen(false)}
                      tabIndex={tocOpen ? undefined : -1}
                    >
                      <span>{chapter.number}</span>
                      {chapter.title}
                    </Link>
                  );
                })}
            </div>
          ))}
        </nav>
        <nav className="sidebar-util mono no-print" aria-label="Guide utilities">
          {scorecard.size === "full" ? (
            <NavLink to="/" end tabIndex={tocOpen ? undefined : -1} onClick={() => setTocOpen(false)}>
              Home
            </NavLink>
          ) : (
            <NavLink to="/" end tabIndex={tocOpen ? undefined : -1} onClick={() => setTocOpen(false)}>
              Kit overview
            </NavLink>
          )}
          {scorecard.size === "full" ? (
            <NavLink to="/scorecard" tabIndex={tocOpen ? undefined : -1} onClick={() => setTocOpen(false)}>
              Summary
            </NavLink>
          ) : null}
          <NavLink to="/contents" tabIndex={tocOpen ? undefined : -1} onClick={() => setTocOpen(false)}>
            Contents
          </NavLink>
          <NavLink to="/demos" tabIndex={tocOpen ? undefined : -1} onClick={() => setTocOpen(false)}>
            Demos
          </NavLink>
          <NavLink to="/export" tabIndex={tocOpen ? undefined : -1} onClick={() => setTocOpen(false)}>
            Export
          </NavLink>
          {import.meta.env.DEV ? (
            <NavLink to="/interview" tabIndex={tocOpen ? undefined : -1} onClick={() => setTocOpen(false)}>
              Interview
            </NavLink>
          ) : null}
          {import.meta.env.DEV ? (
            <NavLink to="/write" tabIndex={tocOpen ? undefined : -1} onClick={() => setTocOpen(false)}>
              Write
            </NavLink>
          ) : null}
          {import.meta.env.DEV ? (
            <NavLink to="/dev/desk" tabIndex={tocOpen ? undefined : -1} onClick={() => setTocOpen(false)}>
              Desk lab
            </NavLink>
          ) : null}
        </nav>
      </aside>
      <div className="sheet">
        <div className="manual-chrome-bar no-print" aria-label="Reading chrome">
          <div className="chrome-leading">
            <button
              type="button"
              className="toc-toggle mono"
              aria-expanded={tocOpen}
              aria-controls="manual-toc"
              onClick={() => setTocOpen((v) => !v)}
            >
              <HamburgerIcon />
              <span>{tocOpen ? "Close" : "Contents"}</span>
            </button>
            <span className="mono manual-path">{pathname.replace(/^\//, "") || "overview"}</span>
          </div>
          <div className="chrome-tabs mono" role="group" aria-label="Reading theme">
            <button
              type="button"
              className={readingTheme === "light" ? "is-on" : ""}
              aria-pressed={readingTheme === "light"}
              onClick={() => setReadingTheme("light")}
            >
              LIGHT
            </button>
            <button
              type="button"
              className={readingTheme === "dark" ? "is-on" : ""}
              aria-pressed={readingTheme === "dark"}
              onClick={() => setReadingTheme("dark")}
            >
              DARK
            </button>
          </div>
        </div>
        <div id="manual-main">
          <PageEnter>{children}</PageEnter>
        </div>
        {pathname === "/" && scorecard.size === "full" ? null : (
          <footer className="manual-colophon mono no-print">
            {PLATFORM_ATTRIBUTION} · {manualTitle}
          </footer>
        )}
      </div>
      <div id="manual-toc" className="sr-only">
        Table of contents drawer
      </div>
    </div>
  );
}