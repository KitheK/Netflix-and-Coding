import { useState } from "react";
import { LiveFrame } from "./LiveFrame";
import type { MotionBlock } from "../lib/schemas";

export type MotionClipProps = {
  block: Pick<MotionBlock, "webm" | "gif" | "poster" | "caption" | "label">;
  compact?: boolean;
};

export function MotionClip({ block, compact }: MotionClipProps) {
  const [playing, setPlaying] = useState(true);
  const [videoOk, setVideoOk] = useState(Boolean(block.webm));
  const reduced =
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const media = (
    <>
      {!reduced && videoOk && block.webm && playing ? (
        <video
          className="motion-clip__video"
          autoPlay
          loop
          muted
          playsInline
          poster={block.poster}
          onError={() => setVideoOk(false)}
        >
          <source src={block.webm} type="video/webm" />
        </video>
      ) : (
        <img
          className="motion-clip__poster"
          src={block.gif || block.poster}
          alt={block.caption ?? block.label ?? "Motion clip"}
          loading="lazy"
          decoding="async"
        />
      )}
    </>
  );

  const footer = !reduced && block.webm ? (
    <button
      type="button"
      className="motion-clip__toggle mono"
      aria-pressed={playing}
      onClick={() => setPlaying((v) => !v)}
    >
      {playing ? "PAUSE" : "PLAY"}
    </button>
  ) : null;

  if (compact) {
    return (
      <figure className="desk-motion">
        <div className="desk-motion-media-wrap">{media}</div>
        {footer}
        <figcaption>
          <span className="mono">{block.label ?? "MOTION"}</span>
          <span>{block.caption}</span>
        </figcaption>
      </figure>
    );
  }

  return (
    <LiveFrame mode="clip" caption={block.caption} footer={footer}>
      {media}
    </LiveFrame>
  );
}