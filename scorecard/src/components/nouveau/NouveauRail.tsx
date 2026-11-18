import { useRef, type CSSProperties } from "react";
import { MotifDefs, MotifUse, Overlay, rootProps, useInView, useSize, useSvgId, type Palette } from "./core";
import { taper, cubicD, type Pt } from "./geometry";
import { useMotifs, type Motif } from "./useMotif";

export type RailVariant = "pavot30" | "band01";

export type NouveauRailProps = {
  variant?: RailVariant;
  side?: "left" | "right";
  /** target width in px; the real width moves a little so whole modules fill the height exactly */
  width?: number;
  palette?: Palette;
  animate?: boolean;
  /** modules grow in as they scroll into view (CSS scroll-driven animations, where supported) */
  scroll?: boolean;
  className?: string;
  style?: CSSProperties;
};

const v = (d: number) => ({ "--d": `${d.toFixed(2)}s` }) as CSSProperties;

/* ---------- plate 30: pod cap + lyre modules joined by stems gathered under a wild-rose ---------- */
const P30 = { W: 300, CAP: 576, MOD: 470, LYRE: 400, FOOT: 150 };

function Gather({ y, id, m, defs, t, end }: { y: number; id: string; m: Motif; defs: string; t: number; end?: boolean }) {
  // lyre module ends with three stem groups (x≈78, 148, 218); bring them under a blossom
  const L: Pt[] = [[78, y - 2], [78, y + 26], [108, y + 42], [140, y + 46]];
  const R: Pt[] = L.map(([x, yy]) => [300 - x, yy]);
  const XL: Pt[] = [[128, y - 2], [134, y + 16], [142, y + 30], [150, y + 40]];
  const XR: Pt[] = XL.map(([x, yy]) => [300 - x, yy]);
  const C: Pt[] = end ? [[150, y - 2], [150, y + 40], [152, y + 84], [158, y + 118]] : [[150, y - 2], [150, y + 24], [150, y + 48], [150, y + 72]];
  const stems = [taper(L, 30, 9), taper(R, 30, 9), taper(XL, 18, 8), taper(XR, 18, 8), taper(C, 16, end ? 3 : 16)];
  const cy = y + 40, bw = 92, bh = (bw * 105) / 110;
  return (
    <g>
      <g className="nv-wipe" style={{ ...v(t), "--t": "0.7s" } as CSSProperties}>
        {stems.map((d, i) => <path key={i} d={d} style={{ fill: "var(--nv-sage, #a9b07a)", stroke: "var(--nv-ink, #2c2d1c)" }} strokeWidth={2.6} strokeLinejoin="round" />)}
        <path d={cubicD(C)} style={{ stroke: "var(--nv-leaf, #69754a)" }} strokeWidth={3} fill="none" opacity={0.55} />
      </g>
      <g transform={`translate(150 ${cy})`}>
        <g className="nv-sway" style={{ "--a": "5deg", "--t": "7s", ...v(t + 1.6) } as CSSProperties}>
          <g className="nv-unfurl" style={{ ...v(t + 0.35), "--nv-rot": "-70deg" } as CSSProperties}>
            <MotifUse id={id} defs={defs} name="p30-blossom" m={m} place={{ x: -bw / 2, y: -bh / 2, w: bw, h: bh }} timing={{ t0: t + 0.3, draw: false }} overlap={0} />
          </g>
        </g>
      </g>
    </g>
  );
}

function PavotRail({ H, wantW, id, ms, scroll }: { H: number; wantW: number; id: string; ms: Record<"p30-cap" | "p30-lyre" | "p30-blossom", Motif>; scroll: boolean }) {
  const s0 = wantW / P30.W;
  const n = Math.max(0, Math.round((H / s0 - P30.CAP - P30.FOOT) / P30.MOD));
  const units = P30.CAP + n * P30.MOD + P30.FOOT;
  const s = H / units;
  const W = P30.W * s;
  const drawMods = !scroll;
  return (
    <Overlay w={W} h={H}>
      <defs>
        <MotifDefs id={`${id}-cap`} m={ms["p30-cap"]} name="p30-cap" />
        <MotifDefs id={`${id}-lyre`} m={ms["p30-lyre"]} name="p30-lyre" />
        <MotifDefs id={`${id}-bl`} m={ms["p30-blossom"]} name="p30-blossom" />
      </defs>
      <g transform={`scale(${s})`}>
        <MotifUse id={`${id}-c`} defs={`${id}-cap`} name="p30-cap" m={ms["p30-cap"]} place={{ x: 0, y: 0, w: 300, h: 576 }} timing={{ t0: 0, dur: 2.4 }} />
        {Array.from({ length: n }, (_, k) => {
          const y = P30.CAP + k * P30.MOD;
          const t = 1.2 + k * 0.9;
          return (
            <g key={k} className={scroll ? "nv-grow" : undefined}>
              <MotifUse id={`${id}-l${k}`} defs={`${id}-lyre`} name="p30-lyre" m={ms["p30-lyre"]} place={{ x: 0, y, w: 300, h: 400 }} timing={{ t0: t, dur: 1.8, draw: drawMods, swayDelay: k * 0.4 }} />
              <Gather y={y + P30.LYRE} id={`${id}-g${k}`} m={ms["p30-blossom"]} defs={`${id}-bl`} t={t + 1.4} end={k === n - 1} />
            </g>
          );
        })}
        {n === 0 && <Gather y={P30.CAP - 2} id={`${id}-g0`} m={ms["p30-blossom"]} defs={`${id}-bl`} t={1.6} end />}
      </g>
    </Overlay>
  );
}

/* ---------- plate 01: the woodcut band (cap · whole 237-px periods · foot) ---------- */
const B01 = { W: 276, CAP: 589, TILE: 237, FOOT: 369, TX: 13, TW: 168 };

function BandRail({ H, wantW, id, ms, scroll }: { H: number; wantW: number; id: string; ms: Record<"b01-cap" | "b01-tile" | "b01-foot", Motif>; scroll: boolean }) {
  const s0 = wantW / B01.W;
  const n = Math.max(1, Math.round((H / s0 - B01.CAP - B01.FOOT) / B01.TILE));
  const units = B01.CAP + n * B01.TILE + B01.FOOT;
  const s = H / units;
  const W = B01.W * s;
  const ink = { fill: "var(--nv-ink, #141414)" };
  const yFoot = B01.CAP + n * B01.TILE;
  return (
    <Overlay w={W} h={H}>
      <defs>
        <path id={`${id}-tile`} d={ms["b01-tile"].layers[0].d} fillRule="evenodd" />
        <clipPath id={`${id}-clip`}>
          {Array.from({ length: n }, (_, k) => <use key={k} href={`#${id}-tile`} x={B01.TX} y={B01.CAP + k * B01.TILE} />)}
        </clipPath>
        <linearGradient id={`${id}-sh`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--nv-accent, #2a7a66)" stopOpacity="0" />
          <stop offset="0.5" stopColor="var(--nv-accent, #2a7a66)" stopOpacity="0.9" />
          <stop offset="1" stopColor="var(--nv-accent, #2a7a66)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <g transform={`scale(${s})`}>
        <rect x={B01.TX - 4} y={0} width={B01.TW + 8} height={units} style={{ fill: "var(--nv-backing, transparent)" }} />
        <g className="nv-wipe" style={{ ...v(0), "--t": "1.4s" } as CSSProperties}>
          <path d={ms["b01-cap"].layers[0].d} fillRule="evenodd" style={ink} />
        </g>
        {Array.from({ length: n }, (_, k) => (
          <g key={k} className={scroll ? "nv-grow" : "nv-wipe"} style={{ ...v(1.0 + k * 0.32), "--t": "0.6s" } as CSSProperties}>
            <use href={`#${id}-tile`} x={B01.TX} y={B01.CAP + k * B01.TILE} style={ink} />
            {/* a 1.5-unit bleed so anti-aliased tile seams don't show as hairlines */}
            <use href={`#${id}-tile`} x={B01.TX} y={B01.CAP + k * B01.TILE + 1.5} style={ink} />
          </g>
        ))}
        <g className="nv-wipe" style={{ ...v(1.0 + n * 0.32), "--t": "1.1s" } as CSSProperties}>
          <path d={ms["b01-foot"].layers[0].d} fillRule="evenodd" style={ink} transform={`translate(0 ${yFoot})`} />
        </g>
        {/* a slow coloured sheen travels down the black ground of the band */}
        <g clipPath={`url(#${id}-clip)`}>
          <rect className="nv-sheen" x={B01.TX} y={0} width={B01.TW} height={260} fill={`url(#${id}-sh)`}
            style={{ "--from": `${B01.CAP - 300}px`, "--to": `${yFoot + 40}px`, "--t": `${6 + n * 1.2}s`, ...v(2.2 + n * 0.32) } as CSSProperties} />
        </g>
      </g>
    </Overlay>
  );
}

/** Side ornament that fills its parent's height with whole modules (never stretched). */
export function NouveauRail({ variant = "pavot30", side = "left", width = 110, palette = "plate", animate = true, scroll = false, className, style }: NouveauRailProps) {
  const ref = useRef<HTMLDivElement>(null);
  const size = useSize(ref);
  useInView(ref);
  const id = useSvgId("nvr");
  const names = variant === "pavot30" ? (["p30-cap", "p30-lyre", "p30-blossom"] as const) : (["b01-cap", "b01-tile", "b01-foot"] as const);
  const ms = useMotifs(names as readonly ("p30-cap" | "p30-lyre" | "p30-blossom" | "b01-cap" | "b01-tile" | "b01-foot")[]);
  const H = size?.h ?? 0;
  const flip = side === "right" ? { transform: "scaleX(-1)" } : undefined;
  return (
    <div ref={ref} {...rootProps("rail", palette, animate, `${scroll ? "nv-scroll " : ""}${className ?? ""}`.trim(), { minWidth: width, ...style })} data-side={side} data-variant={variant}>
      {ms && H > 0 && (
        <div style={flip}>
          {variant === "pavot30"
            ? <PavotRail H={H} wantW={width} id={id} ms={ms as Record<"p30-cap" | "p30-lyre" | "p30-blossom", Motif>} scroll={scroll} />
            : <BandRail H={H} wantW={width} id={id} ms={ms as Record<"b01-cap" | "b01-tile" | "b01-foot", Motif>} scroll={scroll} />}
        </div>
      )}
    </div>
  );
}
