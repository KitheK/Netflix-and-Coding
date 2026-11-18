import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ManualBlock } from "../components/ManualBlock";
import { chapterWordCount } from "../lib/manualStats";
import { manualTitleFromProjectName } from "../lib/schemas";
import { useContent } from "../lib/ContentContext";
import { ScorecardPage } from "./ScorecardPage";

export function ChapterPage() {
  const { slug = "" } = useParams();
  const { manual, scorecard } = useContent();
  const [progress, setProgress] = useState(0);

  const chapter = manual.chapters.find((c) => c.slug === slug);
  const index = manual.chapters.findIndex((c) => c.slug === slug);
  const projectName = manual.projectName?.trim() || scorecard.projectName?.trim() || "Project";
  const guideTitle = manual.title?.trim() || manualTitleFromProjectName(projectName);

  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? window.scrollY / max : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [slug]);

  useEffect(() => {
    if (!chapter) return;
    document.title = `${chapter.number} ${chapter.title} — ${guideTitle}`;
    window.scrollTo(0, 0);
  }, [chapter, guideTitle]);

  if (scorecard.size === "lite") return <ScorecardPage />;

  if (!chapter) {
    return (
      <main className="missing">
        <h1>That chapter is not in the guide.</h1>
        <p>
          <Link to="/contents">Return to the contents.</Link>
        </p>
      </main>
    );
  }

  const previous = index > 0 ? manual.chapters[index - 1] : undefined;
  const next = index < manual.chapters.length - 1 ? manual.chapters[index + 1] : undefined;

  return (
    <>
      <p className="ruler-readout" aria-hidden="true">
        {progress.toFixed(2)}
      </p>
      <div className="ruler" aria-hidden="true" />
      <main className="chapter">
        <header className="chapter-head">
          <p className="mono">
            <Link className="crumb" to="/">
              {scorecard.size === "full" ? projectName : "Summary"}
            </Link>
            {" / "}
            <Link className="crumb" to="/contents">
              {chapter.number}
            </Link>
          </p>
          <p className="mono">{chapterWordCount(chapter)} WORDS</p>
          <h1>{chapter.title}</h1>
          {chapter.standfirst ? <p className="standfirst lede">{chapter.standfirst}</p> : null}
          <hr className="rule" />
        </header>
        <div className="prose">
          {chapter.blocks.map((b, i) => (
            <ManualBlock key={`${chapter.slug}-${i}-${b.type}`} block={b} index={i} />
          ))}
        </div>
        {chapter.sources && chapter.sources.length > 0 ? (
          <>
            <p className="section-label" style={{ maxWidth: "var(--measure)", margin: "2rem auto 0" }}>
              SOURCE
            </p>
            <ul className="sources">
              {chapter.sources.map((source) => (
                <li key={source}>{source}</li>
              ))}
            </ul>
          </>
        ) : null}
        <nav className="pager" aria-label="Chapters">
          {previous ? (
            <Link to={`/chapters/${previous.slug}`}>
              {previous.number} {previous.title}
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link to={`/chapters/${next.slug}`}>
              {next.number} {next.title}
            </Link>
          ) : (
            <Link to="/contents">Contents</Link>
          )}
        </nav>
      </main>
    </>
  );
}