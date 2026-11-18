import type { ShotBlock } from "../lib/schemas";
import { LiveFrame } from "./LiveFrame";

export function ShotFigure({ block }: { block: ShotBlock }) {
  return (
    <LiveFrame
      chrome={block.chrome}
      linkOut={block.linkOut}
      caption={block.caption}
      mode="screenshot"
      statusLine={block.label}
    >
      <img
        className="shot-figure__img"
        src={block.src}
        alt={block.caption ?? block.label ?? "UI screenshot"}
        loading="lazy"
        decoding="async"
      />
    </LiveFrame>
  );
}