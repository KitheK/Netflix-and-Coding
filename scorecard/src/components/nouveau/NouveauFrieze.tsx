import { useRef, type CSSProperties } from "react";
import { MotifDefs, MotifUse, Overlay, rootProps, useInView, useSize, useSvgId, type Palette } from "./core";
import { useMotifs } from "./useMotif";

export type FriezeVariant = "lys33" | "pavot30";

export type NouveauFriezeProps = {
  variant?: FriezeVariant;
  /** target height in px; the real height shifts a little so only whole repeats are laid out */
  height?: number;
  /** "full" = the plate's whole register; "band" = the slim band with rings / pods only */
  crop?: "full" | "band";
  palette?: Palette;
  /** show the plate's painted ground (sky / ochre) behind the motifs */
  ground?: boolean;
  animate?: boolean;
  /** flip vertically, for a footer */
  flip?: boolean;
  className?: string;
  style?: CSSProperties;
};

// Tile views in plate pixels. Both registers are seamless horizontal periods
// measured by autocorrelation (plate 33: 271 px, plate 30: 291 px = two pods).
export const FRIEZE_TILES = {
  lys33: { name: "p33-frieze", full: [0, 0, 271, 348], band: [0, 224, 271, 114] },
  pavot30: { name: "p30-frieze", full: [0, 0, 291, 393], band: [0, 240, 291, 155] },
} as const;

/** A horizontal border that repeats a traced plate register; lilies / pods unfurl, then a breeze passes along. */
export function NouveauFrieze({
  variant = "lys33", height = 120, crop = "full", palette = "plate", ground = true, animate = true, flip = false, className, style,
}: NouveauFriezeProps) {
  const ref = useRef<HTMLDivElement>(null);
  const size = useSize(ref);
  useInView(ref);
  const id = useSvgId("nvf");
  const T = FRIEZE_TILES[variant];
  const ms = useMotifs([T.name]);
  const view = [...T[crop]] as [number, number, number, number];
  const W = size?.w ?? 0;
  const s0 = height / view[3];
  const n = Math.max(1, Math.round(W / (view[2] * s0)));
  const tw = W / n, th = (view[3] * tw) / view[2];
  return (
    <div ref={ref} {...rootProps("frieze", palette, animate, className, { minHeight: ms && W ? undefined : height, ...style })} data-ground={ground ? undefined : "none"}>
      {ms && W > 0 && (
        <Overlay w={W} h={th}>
          <defs><MotifDefs id={id} m={ms[T.name]} name={T.name} /></defs>
          {Array.from({ length: n }, (_, i) => (
            <MotifUse key={i} id={`${id}-t${i}`} defs={id} name={T.name} m={ms[T.name]} view={view}
              place={{ x: i * tw, y: 0, w: tw, h: th, flipY: flip }}
              timing={{ t0: i * 0.14, dur: 2.6, swayDelay: i * 0.22 }} />
          ))}
        </Overlay>
      )}
    </div>
  );
}
