import { Link } from "react-router-dom";
import { Claim } from "../components/Claim";
import { ArchitecturePlate } from "../components/ArchitecturePlate";
import { manualTitleFromProjectName } from "../lib/schemas";
import { useContent } from "../lib/ContentContext";

export function ScorecardPage() {
  const { scorecard, run, decisions, architecture, manual } = useContent();
  const showArch = scorecard.size !== "lite" && architecture.nodes.length >= 3;
  const projectName = manual.projectName?.trim() || scorecard.projectName?.trim() || "Project";
  const guideTitle = manual.title?.trim() || manualTitleFromProjectName(projectName);
  const pageClass = scorecard.size === "lite" ? "page" : "manual-summary page";
  const isManualShell = scorecard.size !== "lite";

  return (
    <main className={pageClass}>
      {isManualShell ? (
        <section className="panel platform-intro" aria-labelledby="platform">
          <h2 id="platform">Scorecard kit — platform overview</h2>
          <p className="lede">
            You are previewing the <strong>Scorecard</strong> authoring kit (agent scaffold + local Write mode). This
            page is the project summary; your generated manual uses the title <strong>{guideTitle}</strong> in the
            sidebar. Use <strong>LIGHT / DARK</strong> for reading contrast and the <strong>Contents</strong> menu (☰) to
            open chapters without losing focus on the page.
          </p>
          <ul className="platform-features">
            <li>
              <strong>Key commands:</strong> <span className="mono">npx scorecard-kit dev</span>,{" "}
              <span className="mono">check</span>, <span className="mono">demos</span>, <span className="mono">build</span>
            </li>
            <li>
              <Link to="/demos">Dogfood demos</Link> — specimen Lite / Standard / Full packs
            </li>
            <li>
              <Link to="/contents">Manual chapters</Link> — Libretto-style layout for Standard and Full
            </li>
            {import.meta.env.DEV ? (
              <li>
                <Link to="/write">Write mode</Link> — confirm claims and look tokens on loopback only
              </li>
            ) : null}
            {scorecard.size === "full" ? (
              <li>
                <Link to="/">Guide home</Link> — Libretto-style essay and architecture figure
              </li>
            ) : null}
          </ul>
        </section>
      ) : null}
      <header className="scorecard-hero">
        <h1 className="display">{projectName}</h1>
        <p className="lede">
          <Claim claim={scorecard.job} as="span" />
        </p>
      </header>

      <section className="panel" aria-labelledby="brief">
        <h2 id="brief">Brief and outcome</h2>
        <Claim claim={scorecard.brief} />
        <Claim claim={scorecard.outcome} />
      </section>

      <section className="panel" aria-labelledby="status">
        <h2 id="status">Status per feature</h2>
        {scorecard.features.map((f) => (
          <div className="feature-row" key={f.name} data-provenance={f.provenance}>
            <span className="badge" data-status={f.status}>
              {f.status}
            </span>
            <span>
              {f.name}
              {f.note ? ` — ${f.note}` : ""}
            </span>
          </div>
        ))}
        {scorecard.knownGap ? (
          <p>
            <strong>Biggest gap:</strong> <Claim claim={scorecard.knownGap} as="span" />
          </p>
        ) : null}
      </section>

      <section className="panel" aria-labelledby="built">
        <h2 id="built">Built vs borrowed</h2>
        <p>
          <strong>Built:</strong> <Claim claim={scorecard.built} as="span" />
        </p>
        <p>
          <strong>Borrowed:</strong> <Claim claim={scorecard.borrowed} as="span" />
        </p>
      </section>

      {scorecard.proof ? (
        <section className="panel" aria-labelledby="proof">
          <h2 id="proof">Proof</h2>
          <Claim claim={scorecard.proof} />
        </section>
      ) : null}

      <section className="panel" aria-labelledby="run">
        <h2 id="run">Run it</h2>
        <ol>
          {run.steps.map((s, i) => (
            <li key={i} data-provenance={s.provenance}>
              <strong>{s.title}</strong>
              {s.command ? <pre className="mono">{s.command}</pre> : null}
              {s.body ? <p>{s.body}</p> : null}
            </li>
          ))}
        </ol>
        <Claim claim={run.demoScript} />
      </section>

      {decisions.decisions.length > 0 && scorecard.size !== "lite" ? (
        <section className="panel" aria-labelledby="decisions">
          <h2 id="decisions">Decisions</h2>
          {decisions.decisions.map((d) => (
            <div key={d.id} data-provenance={d.provenance}>
              <p>
                <strong>{d.decision}</strong>
              </p>
              {d.reason ? <p>{d.reason}</p> : null}
            </div>
          ))}
        </section>
      ) : null}

      {showArch ? (
        <section className="panel" id="arch" aria-labelledby="arch-heading">
          <h2 id="arch-heading">How it fits together</h2>
          <ArchitecturePlate />
        </section>
      ) : null}

      {scorecard.next ? (
        <section className="panel" aria-labelledby="next">
          <h2 id="next">Next</h2>
          <Claim claim={scorecard.next} />
        </section>
      ) : null}
    </main>
  );
}