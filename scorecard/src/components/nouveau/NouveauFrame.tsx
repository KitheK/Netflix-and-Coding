import { useRef, type CSSProperties, type ReactNode } from "react";
import { MotifDefs, MotifUse, Overlay, rootProps, useInView, useSize, useSvgId, type Palette } from "./core";
import { circleD, star6, taper, type Pt } from "./geometry";
import { useMotifs, type Motif } from "./useMotif";
import { FRIEZE_TILES } from "./NouveauFrieze";

export type FrameVariant = "pavot30" | "lys33" | "halo01" | "coins46";

export type NouveauFrameProps = {
  variant?: FrameVariant;
  palette?: Palette;
  animate?: boolean;
  /** overall ornament scale (1 = default edge sizes) */
  scale?: number;
  /** halo01 only: put the plate-01 woodcut band down the left edge */
  band?: boolean;
  /** extra inner padding around the content, px */
  gap?: number;
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
};

const v = (d: number, t?: number) => ({ "--d": `${d.toFixed(2)}s`, ...(t ? { "--t": `${t}s` } : {}) }) as CSSProperties;
const INK = "var(--nv-ink, #222416)";

/** whole repeats of a module of length `unit` along `len`; returns count and actual pitch */
function repeats(len: number, unit: number, min = 1) {
  const n = Math.max(min, Math.round(len / unit));
  return { n, pitch: len / n };
}

/** a line drawn in with stroke-dashoffset */
function Line({ d, w, color, t, dur = 1.4, cap = "butt" }: { d: string; w: number; color: string; t: number; dur?: number; cap?: "butt" | "round" }) {
  return <path d={d} pathLength={1} className="nv-line" fill="none" style={{ stroke: color, ...v(t, dur) }} strokeWidth={w} strokeLinecap={cap} />;
}

/* =============================== coins46 =============================== */
// Plate 46: the tile-and-pendant corner (TL, BR) and the red Solomon's-knot corner (TR, BL),
// joined by gold rods with single cross-tile studs at whole spacings.
function Coins46({ W, H, k, id, ms }: { W: number; H: number; k: number; id: string; ms: Record<"p46-corner" | "p46-knot", Motif> }) {
  const c = coinsC(W, H, k);
  const s = c / 532;
  const sk = s * 0.78; // the knot corner is heavier; keep it a little smaller
  const cw = 399 * s, kw = 453 * sk, kh = 566 * sk;
  const off = 50 * s; // rod runs down the middle of the tile band
  const rod = Math.max(3.5, 9 * s);
  const tileW = 80 * s;
  const tile = [102 - 5, 10, 80, 80] as [number, number, number, number];
  const studs: { x: number; y: number }[] = [];
  const edge = (x0: number, y0: number, x1: number, y1: number) => {
    const len = Math.hypot(x1 - x0, y1 - y0);
    const { n } = repeats(len, 170, 0);
    for (let i = 1; i <= n - 1; i++) studs.push({ x: x0 + ((x1 - x0) * i) / n, y: y0 + ((y1 - y0) * i) / n });
  };
  edge(cw * 0.9, off, W - kw * 0.85, off);
  edge(W - off, kh * 0.9, W - off, H - c * 0.9);
  edge(W - cw * 0.9, H - off, kw * 0.85, H - off);
  edge(off, H - kh * 0.9, off, c * 0.9);
  const rodD = `M${off} ${off}H${W - off}V${H - off}H${off}Z`;
  return (
    <Overlay w={W} h={H}>
      <defs>
        <MotifDefs id={`${id}-c`} m={ms["p46-corner"]} name="p46-corner" />
        <MotifDefs id={`${id}-k`} m={ms["p46-knot"]} name="p46-knot" />
      </defs>
      <Line d={rodD} w={rod + 3} color={INK} t={0.2} dur={2.4} />
      <Line d={rodD} w={rod - 1} color="var(--nv-gold, #c9bc66)" t={0.2} dur={2.4} />
      {studs.map((p, i) => (
        <g key={i} className="nv-pop" style={v(1.0 + i * 0.1)}>
          <MotifUse id={`${id}-s${i}`} defs={`${id}-c`} name="p46-corner" m={ms["p46-corner"]} view={tile} place={{ x: p.x - tileW / 2, y: p.y - tileW / 2, w: tileW, h: tileW }} timing={{ draw: false, t0: 1 + i * 0.1 }} overlap={0} />
        </g>
      ))}
      <MotifUse id={`${id}-tl`} defs={`${id}-c`} name="p46-corner" m={ms["p46-corner"]} place={{ x: 0, y: 0, w: cw, h: c }} timing={{ t0: 0, dur: 2.6 }} />
      <MotifUse id={`${id}-br`} defs={`${id}-c`} name="p46-corner" m={ms["p46-corner"]} place={{ x: W - cw, y: H - c, w: cw, h: c, rot: 180 }} timing={{ t0: 0.5, dur: 2.6 }} />
      <MotifUse id={`${id}-tr`} defs={`${id}-k`} name="p46-knot" m={ms["p46-knot"]} place={{ x: W - kw, y: 0, w: kw, h: kh }} timing={{ t0: 0.3, dur: 3.4 }} />
      <MotifUse id={`${id}-bl`} defs={`${id}-k`} name="p46-knot" m={ms["p46-knot"]} place={{ x: 0, y: H - kh, w: kw, h: kh, rot: 180 }} timing={{ t0: 0.8, dur: 3.4 }} />
    </Overlay>
  );
}
const coinsC = (W: number, H: number, k: number) => Math.max(80, Math.min(190, 0.36 * Math.min(W, H))) * k;
const coinsPad = (W: number, H: number, k: number) => coinsC(W, H, k) * (190 / 532);

/* =============================== pavot30 =============================== */
// Plate 30: the pod-and-band register as top/bottom borders, sage stems down the sides
// with wild-roses at whole spacings, a large rose on each corner.
function Pavot30({ W, H, k, id, ms }: { W: number; H: number; k: number; id: string; ms: Record<"p30-frieze" | "p30-blossom", Motif> }) {
  const view = [...FRIEZE_TILES.pavot30.band] as [number, number, number, number];
  const E = pavotEdge(k);
  const cs = E * 1.25; // corner rose size
  const inner = W - 2 * cs * 0.55;
  const { n, pitch } = repeats(inner, (view[2] * E) / view[3]);
  const th = (view[3] * pitch) / view[2];
  const x0 = cs * 0.55;
  const sideX = E * 0.34;
  const stems: string[] = [];
  const roses: { x: number; y: number; r: number }[] = [];
  for (const side of [0, 1]) {
    const x = side ? W - sideX : sideX;
    const y0 = th * 0.75, y1 = H - th * 0.75;
    const { n: m } = repeats(y1 - y0, 150, 1);
    for (let i = 0; i < m; i++) {
      const a = y0 + ((y1 - y0) * i) / m, b = y0 + ((y1 - y0) * (i + 1)) / m;
      const bend = (i % 2 ? 1 : -1) * E * 0.16 * (side ? -1 : 1);
      const P: Pt[] = [[x, a], [x + bend, a + (b - a) * 0.35], [x - bend, a + (b - a) * 0.65], [x, b]];
      stems.push(taper(P, E * 0.13, E * 0.13));
      if (i > 0) roses.push({ x, y: a, r: E * 0.5 });
    }
  }
  return (
    <Overlay w={W} h={H}>
      <defs>
        <MotifDefs id={`${id}-f`} m={ms["p30-frieze"]} name="p30-frieze" />
        <MotifDefs id={`${id}-b`} m={ms["p30-blossom"]} name="p30-blossom" />
      </defs>
      <g className="nv-wipe" style={v(0.6, 1.6)}>
        {stems.map((d, i) => <path key={i} d={d} style={{ fill: "var(--nv-sage, #a3a35d)", stroke: INK }} strokeWidth={1.4} />)}
      </g>
      {[0, 1].map((row) =>
        Array.from({ length: n }, (_, i) => (
          <MotifUse key={`${row}-${i}`} id={`${id}-${row}-${i}`} defs={`${id}-f`} name="p30-frieze" m={ms["p30-frieze"]} view={view}
            place={{ x: x0 + i * pitch, y: row ? H - th : 0, w: pitch, h: th, flipY: row === 1 }}
            timing={{ t0: row * 0.4 + i * 0.12, dur: 2, swayDelay: i * 0.25 }} />
        )),
      )}
      {[...roses, { x: cs * 0.5, y: cs * 0.5, r: cs / 2 }, { x: W - cs * 0.5, y: cs * 0.5, r: cs / 2 }, { x: cs * 0.5, y: H - cs * 0.5, r: cs / 2 }, { x: W - cs * 0.5, y: H - cs * 0.5, r: cs / 2 }].map((r, i) => (
        <g key={i} transform={`translate(${r.x} ${r.y})`}>
          <g className="nv-sway" style={{ "--a": "6deg", "--t": `${6 + (i % 3)}s`, ...v(2.6 + i * 0.1) } as CSSProperties}>
            <g className="nv-unfurl" style={{ ...v(1.2 + i * 0.12), "--nv-rot": "-80deg" } as CSSProperties}>
              <MotifUse id={`${id}-r${i}`} defs={`${id}-b`} name="p30-blossom" m={ms["p30-blossom"]} place={{ x: -r.r, y: -r.r * (105 / 110), w: 2 * r.r, h: 2 * r.r * (105 / 110) }} timing={{ draw: false, t0: 1.2 + i * 0.12 }} overlap={0} />
            </g>
          </g>
        </g>
      ))}
    </Overlay>
  );
}
const pavotEdge = (k: number) => 56 * k;

/* =============================== lys33 =============================== */
// Plate 33: the brown band with banded rings top and bottom, lily stems with the
// star garland down the sides, a knot of three banded rings on each corner.
function Lys33({ W, H, k, id, ms }: { W: number; H: number; k: number; id: string; ms: Record<"p33-frieze", Motif> }) {
  const view = [...FRIEZE_TILES.lys33.band] as [number, number, number, number];
  const E = lysEdge(k);
  const R = E * 0.5; // corner ring radius
  const inset = R * 1.3;
  const { n, pitch } = repeats(W - 2 * inset, (view[2] * E) / view[3]);
  const th = (view[3] * pitch) / view[2];
  const stars: { x: number; y: number; r: number }[] = [];
  const stems: string[] = [];
  for (const side of [0, 1]) {
    const x = side ? W - E * 0.42 : E * 0.42;
    const y0 = th + R * 0.4, y1 = H - th - R * 0.4;
    stems.push(taper([[x, y0], [x, y0 + (y1 - y0) * 0.3], [x, y0 + (y1 - y0) * 0.7], [x, y1]], E * 0.11, E * 0.11));
    const { n: m, pitch: p } = repeats(y1 - y0, E * 0.55, 2);
    for (let i = 0; i <= m; i++) {
      const y = y0 + i * p;
      const dx = Math.sin(i * 1.3) * E * 0.2;
      stars.push({ x: x + dx, y, r: E * (i % 2 ? 0.13 : 0.18) });
    }
  }
  const corners: [number, number][] = [[R * 1.05, R * 1.05], [W - R * 1.05, R * 1.05], [R * 1.05, H - R * 1.05], [W - R * 1.05, H - R * 1.05]];
  return (
    <Overlay w={W} h={H}>
      <defs><MotifDefs id={`${id}-f`} m={ms["p33-frieze"]} name="p33-frieze" /></defs>
      <g className="nv-wipe" style={v(0.5, 1.8)}>
        {stems.map((d, i) => <path key={i} d={d} style={{ fill: "var(--nv-leaf, #506c30)", stroke: INK }} strokeWidth={1.2} />)}
      </g>
      {stars.map((s, i) => (
        <g key={i} className="nv-pop" style={v(1.0 + (i % 40) * 0.05)}>
          <path d={star6(s.x, s.y, s.r)} className="nv-twinkle" style={{ fill: "var(--nv-paper, #f2ecd8)", stroke: INK, ...v(2.5 + (i % 7) * 0.4) }} strokeWidth={1} strokeLinejoin="round" />
        </g>
      ))}
      {[0, 1].map((row) =>
        Array.from({ length: n }, (_, i) => (
          <MotifUse key={`${row}-${i}`} id={`${id}-${row}-${i}`} defs={`${id}-f`} name="p33-frieze" m={ms["p33-frieze"]} view={view}
            place={{ x: inset + i * pitch, y: row ? H - th : 0, w: pitch, h: th, flipY: row === 1 }}
            timing={{ t0: row * 0.3 + i * 0.1, dur: 1.6 }} />
        )),
      )}
      {corners.map(([cx, cy], i) => (
        <g key={i}>
          {[[-0.42, 0.18], [0.42, 0.18], [0, -0.3]].map(([dx, dy], j) => {
            const d = circleD(cx + dx * R, cy + dy * R, R * 0.62, j * 120 + i * 90);
            const t = 0.4 + i * 0.2 + j * 0.25;
            return (
              <g key={j}>
                <Line d={d} w={R * 0.24} color={INK} t={t} dur={1.1} />
                <Line d={d} w={R * 0.15} color="var(--nv-rose, #d99a8f)" t={t + 0.04} dur={1.1} />
                <Line d={d} w={R * 0.03} color="var(--nv-paper, #f2ecd8)" t={t + 0.1} dur={1.1} />
              </g>
            );
          })}
        </g>
      ))}
    </Overlay>
  );
}
const lysEdge = (k: number) => 44 * k;

/* =============================== halo01 =============================== */
// Plate 01: the heavy black rule with its inner line, a heavy ring on each corner
// (the portrait ring in miniature) and, optionally, the woodcut band down the left.
function Halo01({ W, H, k, id, band, ms }: { W: number; H: number; k: number; id: string; band: boolean; ms: Record<"b01-tile", Motif> | null }) {
  const R = 15 * k, heavy = 4.5 * k, thin = 1.2 * k, gap = 3.2 * k;
  const o = R; // rule inset = ring centre
  const bw = band ? 34 * k : 0;
  const ox = o + bw * 0.5;
  const outer = `M${ox} ${o}H${W - o}V${H - o}H${ox}Z`;
  const io = o + heavy / 2 + gap + thin / 2;
  const inner = `M${ox + heavy / 2 + gap + thin / 2} ${io}H${W - io}V${H - io}H${ox + heavy / 2 + gap + thin / 2}Z`;
  const corners: [number, number][] = [[ox, o], [W - o, o], [W - o, H - o], [ox, H - o]];
  let bandEls = null;
  if (band && ms) {
    const tile = ms["b01-tile"];
    const s = bw / tile.w;
    const th = tile.h * s;
    const y0 = o + R + 4 * k, y1 = H - o - R - 4 * k;
    const n = Math.max(1, Math.ceil((y1 - y0) / th));
    const top = y0;
    bandEls = (
      <g>
        <defs>
          <path id={`${id}-bt`} d={tile.layers[0].d} fillRule="evenodd" />
          <clipPath id={`${id}-bc`}><rect x={ox - bw / 2} y={y0} width={bw} height={y1 - y0} /></clipPath>
        </defs>
        <g clipPath={`url(#${id}-bc)`}>
          {Array.from({ length: n }, (_, i) => (
            <g key={i} className="nv-wipe" style={v(0.8 + i * 0.25, 0.6)}>
              <rect x={ox - bw / 2} y={top + i * th} width={bw} height={th} style={{ fill: "var(--nv-backing, transparent)" }} />
              <use href={`#${id}-bt`} transform={`translate(${ox - bw / 2} ${top + i * th}) scale(${s})`} style={{ fill: INK }} />
              <use href={`#${id}-bt`} transform={`translate(${ox - bw / 2} ${top + i * th + 0.6}) scale(${s})`} style={{ fill: INK }} />
            </g>
          ))}
        </g>
      </g>
    );
  }
  return (
    <Overlay w={W} h={H}>
      <Line d={outer} w={heavy} color="var(--nv-rule, #1d1d16)" t={0.1} dur={2.2} />
      <Line d={inner} w={thin} color="var(--nv-rule, #1d1d16)" t={0.5} dur={2.2} />
      {bandEls}
      {corners.map(([cx, cy], i) => (
        <g key={i}>
          <circle cx={cx} cy={cy} r={R + heavy / 2} className="nv-pop" style={{ fill: "var(--nv-paper-bg, var(--nv-page, #fffdf7))", ...v(0.4 + i * 0.5) }} />
          <Line d={circleD(cx, cy, R, i * 90)} w={heavy} color="var(--nv-ring, #141410)" t={0.4 + i * 0.5} dur={0.9} />
          <Line d={circleD(cx, cy, R - heavy / 2 - gap, i * 90 + 180)} w={thin} color="var(--nv-ring, #141410)" t={0.7 + i * 0.5} dur={0.9} />
          <circle cx={cx} cy={cy} r={R * 0.28} className="nv-pop" style={{ fill: "var(--nv-accent, #2a7a66)", ...v(1.1 + i * 0.5) }} />
          <g transform={`translate(${cx} ${cy})`}>
            <g className="nv-orbit" style={{ "--t": `${9 + i}s`, ...v(2.2 + i * 0.5) } as CSSProperties}>
              <path d={`M0 ${-R}A${R} ${R} 0 0 1 ${R * Math.sin(0.7)} ${-R * Math.cos(0.7)}`} fill="none" strokeWidth={heavy * 0.35} strokeLinecap="round" style={{ stroke: "var(--nv-glint, rgba(255,255,255,.75))" }} />
            </g>
          </g>
        </g>
      ))}
    </Overlay>
  );
}

/** Wraps content in a plate frame. Sizes itself with ResizeObserver; edges are whole repeats so corners meet. */
export function NouveauFrame({ variant = "coins46", palette = "plate", animate = true, scale = 1, band = true, gap = 14, children, className, style }: NouveauFrameProps) {
  const ref = useRef<HTMLDivElement>(null);
  const size = useSize(ref);
  useInView(ref);
  const id = useSvgId("nvfr");
  const names =
    variant === "coins46" ? (["p46-corner", "p46-knot"] as const)
      : variant === "pavot30" ? (["p30-frieze", "p30-blossom"] as const)
        : variant === "lys33" ? (["p33-frieze"] as const)
          : (["b01-tile"] as const);
  const ms = useMotifs(names as readonly ("p46-corner" | "p46-knot" | "p30-frieze" | "p30-blossom" | "p33-frieze" | "b01-tile")[]);
  const W = size?.w ?? 0, H = size?.h ?? 0;
  const k = scale;
  // padding so content clears the ornament
  const pad =
    variant === "coins46" ? { t: coinsPad(W || 600, H || 400, k), r: coinsPad(W || 600, H || 400, k), b: coinsPad(W || 600, H || 400, k), l: coinsPad(W || 600, H || 400, k) }
      : variant === "pavot30" ? { t: pavotEdge(k) * 0.95, b: pavotEdge(k) * 0.95, l: pavotEdge(k) * 0.6, r: pavotEdge(k) * 0.6 }
        : variant === "lys33" ? { t: lysEdge(k) * 1.0, b: lysEdge(k) * 1.0, l: lysEdge(k) * 0.75, r: lysEdge(k) * 0.75 }
          : { t: 26 * k, b: 26 * k, r: 26 * k, l: 26 * k + (band ? 34 * k : 0) };
  const bodyStyle: CSSProperties = { padding: `${pad.t + gap}px ${pad.r + gap}px ${pad.b + gap}px ${pad.l + gap}px` };
  return (
    <div ref={ref} {...rootProps("frame", palette, animate, className, style)} data-variant={variant} aria-hidden={undefined}>
      <div className="nv-frame__art" aria-hidden="true">
        {W > 0 && H > 0 && ms && variant === "coins46" && <Coins46 W={W} H={H} k={k} id={id} ms={ms as Record<"p46-corner" | "p46-knot", Motif>} />}
        {W > 0 && H > 0 && ms && variant === "pavot30" && <Pavot30 W={W} H={H} k={k} id={id} ms={ms as Record<"p30-frieze" | "p30-blossom", Motif>} />}
        {W > 0 && H > 0 && ms && variant === "lys33" && <Lys33 W={W} H={H} k={k} id={id} ms={ms as Record<"p33-frieze", Motif>} />}
        {W > 0 && H > 0 && variant === "halo01" && <Halo01 W={W} H={H} k={k} id={id} band={band} ms={ms as Record<"b01-tile", Motif> | null} />}
      </div>
      <div className="nv-frame__body" style={bodyStyle}>{children}</div>
    </div>
  );
}
