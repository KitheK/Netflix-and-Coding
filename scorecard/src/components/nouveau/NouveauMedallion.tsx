import { useRef, type CSSProperties, type ReactNode } from "react";
import { Overlay, rootProps, useInView, useSvgId, type Palette } from "./core";
import { circleD } from "./geometry";

export type NouveauMedallionProps = {
  /** outer diameter in px */
  size?: number;
  palette?: Palette;
  animate?: boolean;
  /** draw the plate's rule through the ring's equator, out to `ruleWidth` */
  rule?: boolean;
  ruleWidth?: number;
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
};

const v = (d: number, t?: number) => ({ "--d": `${d}s`, ...(t ? { "--t": `${t}s` } : {}) }) as CSSProperties;

/**
 * Plate 01's heavy portrait ring: a thick black ring, a white gap and its fine inner
 * line, an outer hairline, optional rule joints. The ring draws itself, the inner line
 * follows the other way, then a glint orbits slowly.
 */
export function NouveauMedallion({ size = 240, palette = "plate", animate = true, rule = false, ruleWidth = 560, children, className, style }: NouveauMedallionProps) {
  const ref = useRef<HTMLDivElement>(null);
  useInView(ref);
  const id = useSvgId("nvm");
  const W = rule ? Math.max(ruleWidth, size) : size;
  const H = size;
  const cx = W / 2, cy = H / 2;
  const heavy = size * 0.05, gap = size * 0.018, thin = size * 0.007;
  const R = size / 2 - heavy / 2 - size * 0.02;
  const rIn = R - heavy / 2 - gap - thin / 2;
  const rOut = R + heavy / 2 + size * 0.012;
  const body = rIn - thin / 2;
  const ring = { stroke: "var(--nv-ring, #141410)" };
  const line = (d: string, w: number, t: number, dur: number) => <path d={d} pathLength={1} className="nv-line" fill="none" strokeWidth={w} style={{ ...ring, ...v(t, dur) }} />;
  return (
    <div ref={ref} {...rootProps("medallion", palette, animate, className, { width: W, height: H, ...style })}>
      <Overlay w={W} h={H}>
        <defs>
          <linearGradient id={`${id}-g`} x1="0" x2="1">
            <stop offset="0" stopColor="#fff" stopOpacity="0" /><stop offset="0.5" stopColor="#fff" stopOpacity="0.95" /><stop offset="1" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
        </defs>
        {rule && (
          <g>
            {line(`M${cx - rOut} ${cy}H${heavy}`, heavy * 0.55, 1.2, 1.0)}
            {line(`M${cx + rOut} ${cy}H${W - heavy}`, heavy * 0.55, 1.2, 1.0)}
            {line(`M${cx - rOut} ${cy + heavy * 0.75}H${heavy * 2}`, thin, 1.45, 1.0)}
            {line(`M${cx + rOut} ${cy + heavy * 0.75}H${W - heavy * 2}`, thin, 1.45, 1.0)}
            {/* rule-joint terminals: the plate's lobed ends */}
            {[heavy * 1.4, W - heavy * 1.4].map((x, i) => (
              <circle key={i} cx={x} cy={cy + heavy * 0.2} r={heavy * 0.9} className="nv-pop" style={{ fill: "var(--nv-ring, #141410)", ...v(2.1) }} />
            ))}
          </g>
        )}
        {line(circleD(cx, cy, rOut, 200), thin, 0.0, 1.6)}
        {line(circleD(cx, cy, R, 0), heavy, 0.15, 1.5)}
        <g transform={`translate(${cx} ${cy}) scale(-1 1) translate(${-cx} ${-cy})`}>{line(circleD(cx, cy, rIn, 0), thin, 0.55, 1.4)}</g>
        <g transform={`translate(${cx} ${cy})`}>
          <g className="nv-orbit" style={{ "--t": "12s", ...v(2) } as CSSProperties}>
            <path d={`M${-R * Math.sin(0.5)} ${-R * Math.cos(0.5)}A${R} ${R} 0 0 1 ${R * Math.sin(0.5)} ${-R * Math.cos(0.5)}`} fill="none" stroke={`url(#${id}-g)`} strokeWidth={heavy * 0.32} strokeLinecap="round" opacity={0.85} />
          </g>
        </g>
      </Overlay>
      <div className="nv-medallion__body" style={{ left: cx - body, top: cy - body, width: body * 2, height: body * 2 }}>{children}</div>
    </div>
  );
}
