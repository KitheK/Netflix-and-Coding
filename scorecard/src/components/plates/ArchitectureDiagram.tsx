import { useLayoutEffect, useMemo, useRef, useState } from "react";
import type { ArchitectureFile, ArchitectureGroup, ArchitectureNode } from "../../lib/schemas";
import {
  applyArchitectureLayout,
  boxHeight,
  metricsForCanvas,
  nodeBoxW,
  plateLayoutMetrics,
  tightViewBox,
} from "../../generators/architectureLayout";
import { edgeRoute } from "./architectureRouting";
import { Box, Diagram, Flow, Store, VBand, tones, type ToneId } from "./kit";

function toneId(tone?: string): ToneId {
  const map: Record<string, ToneId> = {
    client: "client",
    edge: "edge",
    service: "service",
    agent: "agent",
    data: "store",
    store: "store",
    bus: "bus",
    external: "outside",
    runtime: "service",
  };
  return map[tone ?? ""] ?? "service";
}

function groupColumns(
  nodes: ArchitectureNode[],
  groups: ArchitectureGroup[] | undefined,
  m: ReturnType<typeof plateLayoutMetrics>,
): Array<{ group: ArchitectureGroup | { id: string; title: string; tone?: string }; x: number; y: number; h: number }> {
  const order: string[] = [];
  const byGroup = new Map<string, ArchitectureNode[]>();
  for (const n of nodes) {
    const g = n.group ?? "_ungrouped";
    if (!byGroup.has(g)) {
      byGroup.set(g, []);
      order.push(g);
    }
    byGroup.get(g)!.push(n);
  }
  const meta = new Map((groups ?? []).map((g) => [g.id, g]));
  const bandGap = 10;
  return order.map((gid) => {
    const list = byGroup.get(gid)!;
    const minX = Math.min(...list.map((n) => n.x ?? 0));
    const minY = Math.min(...list.map((n) => n.y ?? 0));
    const maxY = Math.max(...list.map((n) => (n.y ?? 0) + boxHeight(n, m)));
    const g =
      meta.get(gid) ??
      ({
        id: gid,
        title: gid === "_ungrouped" ? "Stack" : gid.replace(/[-_]/g, " "),
        tone: list[0]?.tone,
      } as ArchitectureGroup);
    return {
      group: g,
      x: minX - m.bandW - bandGap,
      y: minY - 4,
      h: maxY - minY + 8,
    };
  });
}

const TONE_LABELS: Record<ToneId, string> = {
  client: "client",
  edge: "edge",
  service: "service",
  agent: "agent",
  bus: "bus",
  store: "store",
  outside: "external",
  paper: "paper",
};

function DiagramChrome({ figureId, legendTones }: { figureId?: string; legendTones: ToneId[] }) {
  return (
    <div className="arch-diagram-chrome" aria-hidden="true">
      <div className="arch-diagram-chrome__legend" data-testid="arch-legend">
        {legendTones.map((tone) => {
          const t = tones[tone];
          return (
            <span key={tone} className="arch-diagram-chrome__legend-item">
              <span className="arch-diagram-chrome__swatch" style={{ background: t.fill, borderColor: t.stroke }} />
              <span>{TONE_LABELS[tone] ?? tone}</span>
            </span>
          );
        })}
      </div>
      {figureId ? (
        <span className="arch-diagram-chrome__tag" data-testid="arch-figure-id">
          {figureId}
        </span>
      ) : null}
    </div>
  );
}

export function ArchitectureDiagramSvg({
  file,
  pick,
  selected,
  animateEdges = true,
}: {
  file: ArchitectureFile;
  pick?: (id: string) => void;
  selected?: (id: string) => boolean;
  selectedId?: string | null;
  animateEdges?: boolean;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [canvasW, setCanvasW] = useState(0);

  useLayoutEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    const measure = () => {
      const raw = el.getBoundingClientRect().width;
      const cap = typeof window !== "undefined" ? Math.max(160, window.innerWidth - 32) : raw;
      const w = Math.min(raw, cap);
      if (w > 48) setCanvasW(Math.round(w));
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => measure());
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const narrow = canvasW > 0 && canvasW < 560;
  const m = useMemo(() => {
    const fallback =
      typeof window !== "undefined" ? Math.min(720, Math.max(200, window.innerWidth - 32)) : 640;
    return metricsForCanvas(file, canvasW > 48 ? canvasW : fallback);
  }, [file, canvasW]);
  const laidOut = useMemo(() => applyArchitectureLayout(file, m, { narrowStack: narrow }), [file, m, narrow]);
  const nodes = laidOut.nodes;
  const viewBox = tightViewBox(nodes, m);
  const legendTones = [...new Set(nodes.map((n) => toneId(n.tone)))].slice(0, 6);
  const vbParts = viewBox.split(/\s+/).map(Number);
  const wide = vbParts[2] > canvasW * 1.05;

  return (
    <div className="arch-diagram-stack">
      <DiagramChrome figureId={file.figureId} legendTones={legendTones} />
      <div
        ref={hostRef}
        className={wide ? "arch-diagram-viewport arch-diagram-viewport--scroll" : "arch-diagram-viewport"}
        data-testid="arch-diagram-viewport"
      >
        <Diagram label={`Architecture ${file.figureId ?? "diagram"}`} viewBox={viewBox} preserveAspectRatio="xMidYMid meet">
          {groupColumns(nodes, laidOut.groups, m).map(({ group, x, y, h }, i) => (
            <VBand
              key={group.id + i}
              x={x}
              y={y}
              h={h}
              w={m.bandW}
              name={group.title.toUpperCase()}
              tone={toneId(group.tone)}
              size={m.titleSize - 1}
            />
          ))}

          <g className="arch-diagram__edges">
            {laidOut.edges.map((edge, i) => {
              const from = nodes.find((n) => n.id === edge.from);
              const to = nodes.find((n) => n.id === edge.to);
              if (!from || !to) return null;
              const { points } = edgeRoute(from, to, m);
              return <Flow key={`${edge.from}-${edge.to}-${i}`} points={points} animate={animateEdges} delay={i * 0.15} />;
            })}
          </g>

          <g className="arch-diagram__nodes">
            {nodes.map((node) => {
              const h = boxHeight(node, m);
              const w = nodeBoxW(node, m);
              const partId = pick ? node.id : undefined;
              const isData = node.tone === "data";
              const common = {
                x: node.x ?? 0,
                y: node.y ?? 0,
                w,
                h,
                title: node.label.toUpperCase(),
                lines: [] as string[],
                partId,
                selected: selected?.(node.id),
                onSelect: pick,
                tone: toneId(node.tone),
                titleSize: m.titleSize,
                subSize: m.subSize,
              };
              return isData ? <Store key={node.id} {...common} /> : <Box key={node.id} {...common} />;
            })}
          </g>
        </Diagram>
      </div>
    </div>
  );
}