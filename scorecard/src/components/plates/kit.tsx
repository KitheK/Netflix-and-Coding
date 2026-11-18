import type { KeyboardEvent, MouseEvent, ReactNode } from "react";

export const BLUE = "var(--action, #103DFF)";
export const INK = "var(--ink, #000000)";
export const PAPER = "var(--canvas, #FBFBFB)";

export type ToneId = "client" | "edge" | "service" | "agent" | "bus" | "store" | "outside" | "paper";

export type Tone = { fill: string; stroke: string; title: string; body: string };

export const tones: Record<ToneId, Tone> = {
  client: { fill: "#D6E6FF", stroke: "#0A2FCC", title: "#061F99", body: "#0C1A4A" },
  edge: { fill: "#E4DFFF", stroke: "#4A2FD6", title: "#2A1580", body: "#1A1240" },
  service: { fill: "#D4F2E8", stroke: "#0A6B4F", title: "#064C38", body: "#0A2E24" },
  agent: { fill: "#FFE4C2", stroke: "#8A4500", title: "#7A3A00", body: "#3D2200" },
  bus: { fill: "#FFF0B8", stroke: "#8A6A00", title: "#5C4700", body: "#2E2500" },
  store: { fill: "#F0E2D4", stroke: "#7A4E2A", title: "#5A3418", body: "#2E1A0C" },
  outside: { fill: "#E8E8EC", stroke: "#4A4A55", title: "#2A2A33", body: "#1A1A22" },
  paper: { fill: PAPER, stroke: BLUE, title: BLUE, body: INK },
};

const MONO = "var(--font-mono, ui-monospace, monospace)";

/** Approximate char capacity for a box inner width — avoids Libretto-style overflow on long parens. */
export function fitLines(text: string, maxWidthPx: number, size = 10): { lines: string[]; size: number } {
  const approxChar = size * 0.58;
  const maxChars = Math.max(8, Math.floor(maxWidthPx / approxChar));
  if (text.length <= maxChars) return { lines: [text], size };

  const words = text.split(/(\s+)/).filter(Boolean);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const next = cur + w;
    if (next.length > maxChars && cur) {
      lines.push(cur.trim());
      cur = w.trimStart();
    } else {
      cur = next;
    }
  }
  if (cur.trim()) lines.push(cur.trim());

  const longest = Math.max(...lines.map((l) => l.length));
  const shrunk = longest > maxChars + 4 ? Math.max(8, size - 1) : size;
  return { lines: lines.slice(0, 3), size: shrunk };
}

export function Diagram({
  label,
  children,
  viewBox = "0 0 720 400",
  className,
  preserveAspectRatio = "xMidYMid meet",
}: {
  label: string;
  children: ReactNode;
  viewBox?: string;
  className?: string;
  preserveAspectRatio?: string;
}) {
  return (
    <svg
      viewBox={viewBox}
      preserveAspectRatio={preserveAspectRatio}
      role="img"
      aria-label={label}
      className={className ? `arch-diagram ${className}` : "arch-diagram"}
    >
      <defs>
        <filter id="arch-select-glow" x="-35%" y="-35%" width="170%" height="170%" colorInterpolationFilters="sRGB">
          <feDropShadow dx="0" dy="0" stdDeviation="2.2" floodColor="#103DFF" floodOpacity="0.28" />
        </filter>
      </defs>
      {children}
    </svg>
  );
}

export function T({
  x,
  y,
  children,
  fill = INK,
  size = 11,
  anchor = "start",
  className,
}: {
  x: number;
  y: number;
  children: string;
  fill?: string;
  size?: number;
  anchor?: "start" | "middle" | "end";
  className?: string;
}) {
  return (
    <text x={x} y={y} fill={fill} fontSize={size} textAnchor={anchor} fontFamily={MONO} className={className}>
      {children}
    </text>
  );
}

type HitProps = {
  partId?: string;
  selected?: boolean;
  onSelect?: (id: string) => void;
};

function hitHandlers(partId: string | undefined, onSelect: ((id: string) => void) | undefined) {
  if (!partId || !onSelect) return {};
  return {
    role: "button" as const,
    tabIndex: 0,
    style: { cursor: "pointer" },
    onClick: (event: MouseEvent) => {
      event.stopPropagation();
      onSelect(partId);
    },
    onKeyDown: (event: KeyboardEvent) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onSelect(partId);
      }
    },
  };
}

export function VBand({
  x,
  y,
  h,
  w = 26,
  name,
  tone = "edge",
  size = 11,
}: {
  x: number;
  y: number;
  h: number;
  w?: number;
  name: string;
  tone?: ToneId;
  size?: number;
}) {
  const t = tones[tone];
  const cx = x + w / 2;
  return (
    <g className="arch-diagram__band" aria-hidden="true">
      <rect x={x} y={y} width={w} height={h} rx={2} fill={t.fill} stroke={t.stroke} strokeWidth="1.25" />
      <text
        x={cx}
        y={y + h / 2}
        fill={t.title}
        fontSize={size}
        textAnchor="middle"
        fontFamily={MONO}
        transform={`rotate(-90 ${cx} ${y + h / 2})`}
      >
        {name}
      </text>
    </g>
  );
}

export function Legend({
  x,
  y,
  items,
  size = 11,
}: {
  x: number;
  y: number;
  items: Array<{ tone: ToneId; label: string }>;
  size?: number;
}) {
  return (
    <g>
      {items.map((item, index) => {
        const t = tones[item.tone];
        const lx = x + index * 108;
        return (
          <g key={item.tone + item.label}>
            <rect x={lx} y={y} width={14} height={14} fill={t.fill} stroke={t.stroke} strokeWidth="1.25" />
            <T x={lx + 20} y={y + 11} fill={t.body} size={size}>
              {item.label}
            </T>
          </g>
        );
      })}
    </g>
  );
}

export function Store({
  x,
  y,
  w,
  h,
  title,
  lines = [],
  partId,
  selected = false,
  onSelect,
  tone = "store",
  titleSize = 12,
  subSize = 11,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  title: string;
  lines?: string[];
  tone?: ToneId;
  titleSize?: number;
  subSize?: number;
} & HitProps) {
  const t = tones[tone];
  const ry = 9;
  const stroke = selected ? BLUE : t.stroke;
  const width = selected ? 2 : 1.75;
  const innerW = w - 28;
  return (
    <g
      className={partId ? `diagram-hit${selected ? " is-selected" : ""}` : undefined}
      filter={selected ? "url(#arch-select-glow)" : undefined}
      {...hitHandlers(partId, onSelect)}
    >
      <rect x={x} y={y + ry} width={w} height={Math.max(0, h - ry * 2)} fill={t.fill} stroke="none" />
      <path
        d={`M${x} ${y + ry} V${y + h - ry} A${w / 2} ${ry} 0 0 0 ${x + w} ${y + h - ry} V${y + ry}`}
        fill="none"
        stroke={stroke}
        strokeWidth={width}
      />
      <ellipse cx={x + w / 2} cy={y + ry} rx={w / 2} ry={ry} fill={t.fill} stroke={stroke} strokeWidth={width} />
      <T x={x + 14} y={y + 32} fill={t.title} size={titleSize} className="diagram-hit__title">
        {title}
      </T>
      {lines.flatMap((line, index) => {
        const { lines: fitted, size } = fitLines(line, innerW, subSize);
        return fitted.map((fl, fi) => (
          <T key={`${line}-${index}-${fi}`} x={x + 14} y={y + 50 + index * 16 + fi * 14} fill={t.body} size={size}>
            {fl}
          </T>
        ));
      })}
    </g>
  );
}

export function Box({
  x,
  y,
  w,
  h,
  title,
  lines = [],
  partId,
  selected = false,
  onSelect,
  tone = "paper",
  titleSize = 12,
  subSize = 11,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  title: string;
  lines?: string[];
  tone?: ToneId;
  titleSize?: number;
  subSize?: number;
} & HitProps) {
  const t = tones[tone];
  const stroke = selected ? BLUE : t.stroke;
  const innerW = w - 24;
  return (
    <g
      className={partId ? `diagram-hit${selected ? " is-selected" : ""}` : undefined}
      filter={selected ? "url(#arch-select-glow)" : undefined}
      {...hitHandlers(partId, onSelect)}
    >
      <rect x={x} y={y} width={w} height={h} fill={t.fill} stroke={stroke} strokeWidth={selected ? 2 : 1.75} />
      <T x={x + 12} y={y + 22} fill={t.title} size={titleSize} className="diagram-hit__title">
        {title}
      </T>
      {lines.flatMap((line, index) => {
        const { lines: fitted, size } = fitLines(line, innerW, subSize);
        return fitted.map((fl, fi) => (
          <T key={`${line}-${index}-${fi}`} x={x + 12} y={y + 38 + index * 14 + fi * 13} fill={t.body} size={size}>
            {fl}
          </T>
        ));
      })}
    </g>
  );
}

export function Flow({
  points,
  dashed = false,
  head = true,
  color = "#103DFF",
  duration = 3,
  delay = 0,
  packets = 1,
  label,
  labelAt,
  animate = true,
  labelSize = 11,
}: {
  points: Array<[number, number]>;
  dashed?: boolean;
  head?: boolean;
  color?: string;
  duration?: number;
  delay?: number;
  packets?: number;
  label?: string;
  labelAt?: [number, number];
  animate?: boolean;
  labelSize?: number;
}) {
  const d = points.map((point, index) => `${index === 0 ? "M" : "L"}${point[0]} ${point[1]}`).join(" ");
  const uid = points.map((p) => p.join("-")).join("_");
  const endId = `arch-flow-end-${uid}`;
  const showPackets = animate && packets > 0;
  return (
    <g className="diagram-flow" aria-hidden>
      <defs>
        <marker id={endId} markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto" markerUnits="userSpaceOnUse">
          <path d="M0.4 0.6 L6 3.5 L0.4 6.4 Z" fill={color} fillOpacity="0.85" />
        </marker>
      </defs>
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth="1.35"
        strokeOpacity="0.55"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={dashed ? "5 4" : "7 9"}
        markerEnd={head ? `url(#${endId})` : undefined}
        className="flow-track"
      />
      {showPackets
        ? Array.from({ length: packets }, (_, index) => (
            <circle key={index} r="2.4" fill={color} fillOpacity="0.8" className="flow-packet">
              <animateMotion
                dur={`${duration}s`}
                repeatCount="indefinite"
                begin={`${delay + index * (duration / Math.max(packets, 1))}s`}
                path={d}
              />
            </circle>
          ))
        : null}
      {label && labelAt ? (
        <text
          x={labelAt[0]}
          y={labelAt[1]}
          fill={color}
          fontSize={labelSize}
          fontFamily={MONO}
          opacity="0.9"
          stroke={PAPER}
          strokeWidth="3"
          paintOrder="stroke fill"
        >
          {label.length > 18 ? `${label.slice(0, 17)}…` : label}
        </text>
      ) : null}
    </g>
  );
}