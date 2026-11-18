import { Link, useParams } from "react-router-dom";
import { useEffect } from "react";
import { ScorecardPage } from "./ScorecardPage";
import { useContent } from "../lib/ContentContext";
import { DOGFOOD_DEMOS, bundleForDemo, getDogfoodDemo } from "../lib/loadDogfood";
import { loadContent } from "../lib/loadContent";
import { Claim } from "../components/Claim";

export function DemosIndexPage() {
  return (
    <main className="page">
      <header className="scorecard-hero">
        <h1 className="display">DEMOS</h1>
        <p>
          In-app Scorecards for specific repo shapes. Open one to see what the site looks like for that
          kind of project — not a marketplace pitch, a working specimen.
        </p>
      </header>

      <section className="panel" aria-labelledby="packs">
        <h2 id="packs">Dogfood packs</h2>
        <ul className="demo-list">
          {DOGFOOD_DEMOS.map((d) => (
            <li key={d.id}>
              <Link to={`/demos/${d.id}`}>
                <strong>{d.title}</strong>
              </Link>
              <p className="mono" style={{ opacity: 0.75, margin: "0.25rem 0" }}>
                {d.repoShape}
              </p>
              <p>{d.summary}</p>
              <p>
                <em>For:</em> {d.audience}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="panel" aria-labelledby="full">
        <h2 id="full">Full reference</h2>
        <p>
          <a href="https://499team1.com/make" target="_blank" rel="noreferrer">
            Libretto /make
          </a>{" "}
          — live Full Scorecard-shaped manual for a real product (Conductor).
        </p>
      </section>
    </main>
  );
}

export function DemoPackPage() {
  const { id = "" } = useParams();
  const demo = getDogfoodDemo(id);
  const { replaceBundle, scorecard, team, requirements } = useContent();

  useEffect(() => {
    if (!demo) return;
    replaceBundle(bundleForDemo(demo));
    return () => {
      replaceBundle(loadContent());
    };
  }, [demo, replaceBundle]);

  if (!demo) {
    return (
      <main className="page">
        <p>Unknown demo.</p>
        <Link to="/demos">Back to demos</Link>
      </main>
    );
  }

  return (
    <>
      <div className="page no-print" style={{ paddingBottom: 0 }}>
        <p className="mono">
          <Link to="/demos">← Demos</Link> · {demo.id} · {scorecard.size}
        </p>
        <p>{demo.summary}</p>
      </div>
      <ScorecardPage />
      {demo.requirements && requirements.items.length > 0 ? (
        <section className="page panel" aria-labelledby="req">
          <h2 id="req">Requirements map</h2>
          <ul>
            {requirements.items.map((item) => (
              <li key={item.id} data-provenance={item.provenance}>
                <strong>{item.text}</strong>
                {item.where ? ` — ${item.where}` : ""}
                {item.evidence ? (
                  <span className="mono"> ({item.evidence})</span>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {demo.team && team.people.length > 0 ? (
        <section className="page panel" aria-labelledby="team">
          <h2 id="team">Team</h2>
          <ul>
            {team.people.map((p) => (
              <li key={p.name} data-provenance={p.provenance}>
                <strong>{p.name}</strong> — {p.role}
                {p.areas?.length ? ` (${p.areas.join(", ")})` : ""}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {demo.notesPath ? (
        <section className="page panel">
          <h2>Agent note</h2>
          <p className="mono">{demo.notesPath}</p>
          <Claim
            claim={{
              text: "Scan should infer from entrypoints, keep draft/inferred tags, and ask before sounding sure.",
              provenance: "draft",
              source: "generated",
            }}
          />
        </section>
      ) : null}
    </>
  );
}
