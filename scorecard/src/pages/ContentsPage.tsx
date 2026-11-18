import { Link } from "react-router-dom";
import { chapterWordCount, manualTotalWords } from "../lib/manualStats";
import { manualTitleFromProjectName } from "../lib/schemas";
import { useContent } from "../lib/ContentContext";

export function ContentsPage() {
  const { manual, scorecard } = useContent();
  if (scorecard.size === "lite") {
    return (
      <main className="page">
        <p>Lite Scorecards are a single page. Return to the summary.</p>
        <Link to="/">Summary</Link>
      </main>
    );
  }

  const projectName = manual.projectName?.trim() || scorecard.projectName?.trim() || "Project";
  const guideTitle = manual.title?.trim() || manualTitleFromProjectName(projectName);
  const totalWords = manualTotalWords(manual);

  return (
    <main className="contents-page">
      <header className="chapter-head">
        <p className="mono">SCORECARD KIT / CONTENTS</p>
        <h1>Chapters in this guide.</h1>
        <p className="standfirst lede">
          This Standard specimen shows how <strong>{guideTitle}</strong> will read once an agent scaffolds the kit into a
          target repo ({manual.chapters.length} chapters, {totalWords.toLocaleString("en-US")} words here). Use the{" "}
          <strong>Contents</strong> menu (☰) in the header to open the table of contents without crowding the page.
        </p>
        <hr className="rule" />
      </header>
      {manual.parts.map((part) => (
        <section className="part-block" key={part.id} aria-labelledby={`part-${part.id}`}>
          <h2 className="part-name" id={`part-${part.id}`}>
            {part.id}. {part.title}
          </h2>
          {part.blurb ? <p className="part-blurb">{part.blurb}</p> : null}
          {manual.chapters
            .filter((chapter) => chapter.part === part.id)
            .map((chapter) => (
              <Link className="contents-row" key={chapter.slug} to={`/chapters/${chapter.slug}`}>
                <span className="mono">{chapter.number}</span>
                <span className="contents-title">{chapter.title}</span>
                <span className="mono">{chapterWordCount(chapter)} words</span>
              </Link>
            ))}
        </section>
      ))}
    </main>
  );
}