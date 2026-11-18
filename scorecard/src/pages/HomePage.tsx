import { useState } from "react";
import { Link } from "react-router-dom";
import { ArchitecturePlate } from "../components/ArchitecturePlate";
import { HomeDeskOrnaments } from "../components/desk/HomeDeskOrnaments";
import { PageEnter } from "../components/PageEnter";
import { PixelWordmark } from "../components/PixelWordmark";
import { ScrollStage } from "../components/ScrollStage";
import { MotionClip } from "../components/MotionClip";
import { ShotFigure } from "../components/ShotFigure";
import { chapterWordCount, manualTotalWords } from "../lib/manualStats";
import { wordmarkTextFromProjectName } from "../lib/pixelGlyphs";
import { manualTitleFromProjectName, PLATFORM_ATTRIBUTION } from "../lib/schemas";
import { useContent } from "../lib/ContentContext";

export function HomePage() {
  const { manual, scorecard, architecture } = useContent();
  const [selected, setSelected] = useState(0);
  const faqs = manual.faqs ?? [];
  const faq = faqs[selected] ?? faqs[0];
  const words = manualTotalWords(manual);
  const projectName = manual.projectName?.trim() || scorecard.projectName?.trim() || "Project";
  const guideTitle = manual.title?.trim() || manualTitleFromProjectName(projectName);
  const wordmark = wordmarkTextFromProjectName(projectName);
  return (
    <PageEnter>
      <ScrollStage>
        <main className="home">
          <a className="skip" href="#essay">
            Skip to the essay
          </a>
          <nav className="home-nav" aria-label="Manual">
            <Link to="/contents">Contents</Link>
            <Link to="/scorecard" className="mono">
              Scorecard summary
            </Link>
          </nav>

          <header className="home-hero">
            <div className="home-copy" id="essay">
              <PixelWordmark text={wordmark} cell={11} />
              <p className="kicker display">{guideTitle.toUpperCase()}</p>
              <p className="lede">
                {scorecard.job.text} This guide is the readable surface — chapters, plates, and honest status rows pulled
                from JSON the agent and author maintain together.
              </p>
              <p className="lede">
                Scorecard never grades. It describes what works, what is partial, and how to run the project. The
                architecture plate on this page is generated from repo evidence; click a node to read paths and
                connections.
              </p>
              <p className="lede">
                Below: the architecture figure, sample clips, and a contents preview. For the full status table and run
                steps, open the <Link to="/scorecard">scorecard summary</Link>.
              </p>
            </div>
          </header>

          <section className="home-plate" aria-labelledby="home-plate-label">
            <h2 id="home-plate-label" className="section-label">
              {architecture.figureId ?? "ARCH_001"}
            </h2>
            <ArchitecturePlate showOverview showTopology={false} />
          </section>

          <section className="shot-strip" aria-labelledby="shot-strip-label">
            <h2 id="shot-strip-label" className="section-label">
              FRAMED MEDIA
            </h2>
            <p className="shot-strip-lede">Screenshots and clips use Nouveau chrome — no iframes in v1.</p>
            <div className="shot-strip-grid">
              <ShotFigure
                block={{
                  type: "shot",
                  src: "/media/home-plate-light.png",
                  label: "PLATE",
                  caption: "Compact architecture plate on the home hero.",
                  chrome: { routeLabel: "scorecard/" },
                  provenance: "draft",
                  source: "authored",
                }}
              />
              <MotionClip
                compact
                block={{
                  gif: "/media/home-plate-light.png",
                  poster: "/media/home-plate-light.png",
                  label: "SCROLL",
                  caption: "Reduced-motion readers see a poster; others can pause clips.",
                }}
              />
            </div>
          </section>

          <HomeDeskOrnaments />

          <section className="stats" aria-label="Manual statistics">
            <p className="mono">
              CHAPTERS
              <strong>{String(manual.chapters.length).padStart(2, "0")}</strong>
            </p>
            <p className="mono">
              FIGURES
              <strong>{architecture.figureId ? "01" : "00"}</strong>
            </p>
            <p className="mono">
              WORDS
              <strong>{words.toLocaleString("en-US")}</strong>
            </p>
            <p className="mono">
              PARTS
              <strong>{String(manual.parts.length).padStart(2, "0")}</strong>
            </p>
          </section>

          <section aria-labelledby="contents-label">
            <h2 id="contents-label" className="section-label">
              CONTENTS
            </h2>
            {manual.parts.map((part) => (
              <div className="part-block" key={part.id}>
                <h3 className="part-name">
                  {part.id}. {part.title}
                </h3>
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
              </div>
            ))}
          </section>

          {faqs.length > 0 ? (
            <section aria-labelledby="faq-label">
              <h2 id="faq-label" className="section-label">
                COMMON QUESTIONS
              </h2>
              <div className="faq">
                <div className="faq-list" role="listbox" aria-label="Questions">
                  {faqs.map((item, index) => (
                    <button
                      key={item.question}
                      type="button"
                      role="option"
                      aria-selected={index === selected}
                      onClick={() => setSelected(index)}
                    >
                      {item.question}
                    </button>
                  ))}
                </div>
                {faq ? (
                  <div className="faq-panel">
                    <p className="io">IN</p>
                    <p>{faq.question}</p>
                    <p className="io">OUT</p>
                    <p>{faq.answer}</p>
                  </div>
                ) : null}
              </div>
            </section>
          ) : null}

          <footer className="colophon mono">{PLATFORM_ATTRIBUTION}</footer>
        </main>
      </ScrollStage>
    </PageEnter>
  );
}