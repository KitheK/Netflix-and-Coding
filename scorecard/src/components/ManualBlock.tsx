import { Link } from "react-router-dom";
import type { ManualBlock as ManualBlockType } from "../lib/schemas";
import { useContent } from "../lib/ContentContext";
import { ArchitecturePlate } from "./ArchitecturePlate";
import { TimelinePlate } from "./TimelinePlate";
import { RichText } from "./RichText";
import { ShotFigure } from "./ShotFigure";
import { MotionClip } from "./MotionClip";
import { LiveFrame } from "./LiveFrame";
import { GenericDesk } from "./desk/GenericDesk";

export function ManualBlock({ block, index }: { block: ManualBlockType; index: number }) {
  const { decisions, requirements, team, scorecard, architecture } = useContent();

  if (block.type === "h2") {
    return <h2 key={index}>{block.text}</h2>;
  }
  if (block.type === "p") {
    return (
      <p key={index} className="claim" data-provenance={block.provenance}>
        <RichText text={block.text} />
      </p>
    );
  }
  if (block.type === "architecture") {
    return <ArchitecturePlate key={index} />;
  }
  if (block.type === "timeline") {
    return <TimelinePlate key={index} />;
  }
  if (block.type === "status") {
    return (
      <p key={index} className="mono block-hook">
        See{" "}
        <Link to={scorecard.size === "full" ? "/scorecard" : "/"}>feature status</Link> for the current table.
      </p>
    );
  }
  if (block.type === "run") {
    return (
      <p key={index} className="block-hook">
        <Link to={scorecard.size === "full" ? "/scorecard#run" : "/#run"}>Open Run it</Link> for commands and the demo script.
      </p>
    );
  }
  if (block.type === "decision") {
    const items = block.id
      ? decisions.decisions.filter((d) => d.id === block.id)
      : decisions.decisions;
    return (
      <div key={index} className="block-decisions panel" data-provenance={block.provenance}>
        {items.map((d) => (
          <div key={d.id}>
            <p>
              <strong>{d.decision}</strong>
            </p>
            {d.alternatives ? (
              <p className="mono block-meta">
                Alternatives: {d.alternatives}
              </p>
            ) : null}
            {d.reason ? <p>{d.reason}</p> : null}
            {d.outcome ? <p>{d.outcome}</p> : null}
          </div>
        ))}
      </div>
    );
  }
  if (block.type === "requirement") {
    return (
      <ul key={index} className="block-requirements" data-provenance={block.provenance}>
        {requirements.items.map((item) => (
          <li key={item.id}>
            <strong className="mono">{item.id}</strong> {item.text}
            {item.where ? <span className="mono block-meta"> — {item.where}</span> : null}
          </li>
        ))}
      </ul>
    );
  }
  if (block.type === "contribution") {
    return (
      <ul key={index} className="block-team" data-provenance={block.provenance}>
        {team.people.map((person) => (
          <li key={person.name}>
            <strong>{person.name}</strong>
            {person.role ? ` — ${person.role}` : ""}
            {person.areas?.length ? (
              <span className="mono block-meta"> ({person.areas.join(", ")})</span>
            ) : null}
          </li>
        ))}
      </ul>
    );
  }
  if (block.type === "figure") {
    if (block.id.startsWith("ARCH")) {
      return <ArchitecturePlate key={index} compact showTopology={false} />;
    }
    return (
      <figure key={index} className="plate figure-block" data-provenance={block.provenance}>
        <p className="mono">{block.id}</p>
        {block.caption ? <figcaption>{block.caption}</figcaption> : null}
      </figure>
    );
  }
  if (block.type === "shot") {
    return <ShotFigure key={index} block={block} />;
  }
  if (block.type === "motion") {
    return <MotionClip key={index} block={block} />;
  }
  if (block.type === "desk") {
    if (block.kind === "nouveau") {
      return <GenericDesk key={index} title={block.title} />;
    }
    return (
      <p key={index} className="mono">
        Desk kind “{block.kind}” is not available in this kit build.
      </p>
    );
  }
  if (block.type === "live") {
    const mode = block.mode ?? (block.src || block.poster ? "screenshot" : block.webm || block.gif ? "clip" : "screenshot");
    const linkOut = block.linkOut ?? block.url;
    if (mode === "clip") {
      return (
        <MotionClip
          key={index}
          block={{
            webm: block.webm,
            gif: block.gif ?? block.poster ?? "",
            poster: block.poster ?? block.src ?? "",
            caption: block.caption,
            label: block.caption ? "LIVE" : undefined,
          }}
        />
      );
    }
    const src = block.src ?? block.poster;
    if (!src) {
      return (
        <p key={index} className="mono">
          Live block missing media source.
        </p>
      );
    }
    return (
      <LiveFrame
        key={index}
        chrome={block.chrome}
        linkOut={linkOut}
        caption={block.caption}
        mode="screenshot"
        statusLine={
          architecture.figureId ? `LIVE · ${architecture.figureId} · ${mode}` : `LIVE · ${mode}`
        }
      >
        <img className="shot-figure__img" src={src} alt={block.caption ?? "UI screenshot"} loading="lazy" decoding="async" />
      </LiveFrame>
    );
  }

  return null;
}