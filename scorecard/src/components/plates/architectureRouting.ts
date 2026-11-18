import type { ArchitectureNode } from "../../lib/schemas";
import type { PlateMetrics } from "../../generators/architectureLayout";
import { boxHeight, nodeBoxW } from "../../generators/architectureLayout";

export function nodeRect(node: ArchitectureNode, m: PlateMetrics) {
  const h = boxHeight(node, m);
  return { x: node.x ?? 0, y: node.y ?? 0, w: nodeBoxW(node, m), h };
}

/** Orthogonal spine routing so lines run in column gutters, not through boxes. */
export function edgeRoute(
  from: ArchitectureNode,
  to: ArchitectureNode,
  m: PlateMetrics,
): { points: Array<[number, number]>; labelAt: [number, number] } {
  const a = nodeRect(from, m);
  const b = nodeRect(to, m);
  const dx = b.x - a.x;

  let points: Array<[number, number]>;

  const refW = Math.min(a.w, b.w);
  if (dx > refW * 0.35) {
    const gutter = a.x + a.w + (b.x - (a.x + a.w)) / 2;
  const y1 = a.y + a.h / 2;
  const y2 = b.y + b.h / 2;
    points = [
      [a.x + a.w, y1],
      [gutter, y1],
      [gutter, y2],
      [b.x, y2],
    ];
  } else if (dx < -refW * 0.35) {
    const gutter = b.x + b.w + (a.x - (b.x + b.w)) / 2;
    const y1 = a.y + a.h / 2;
    const y2 = b.y + b.h / 2;
    points = [
      [a.x, y1],
      [gutter, y1],
      [gutter, y2],
      [b.x + b.w, y2],
    ];
  } else if (b.y > a.y + a.h * 0.5) {
    points = [
      [a.x + a.w / 2, a.y + a.h],
      [a.x + a.w / 2, b.y - 6],
      [b.x + b.w / 2, b.y - 6],
      [b.x + b.w / 2, b.y],
    ];
  } else {
    points = [
      [a.x + a.w / 2, a.y],
      [a.x + a.w / 2, b.y + b.h + 6],
      [b.x + b.w / 2, b.y + b.h + 6],
      [b.x + b.w / 2, b.y + b.h],
    ];
  }

  const midIdx = Math.floor(points.length / 2);
  const mid = points[midIdx];
  const next = points[midIdx + 1] ?? points[midIdx];
  const ex = next[0] - mid[0];
  const ey = next[1] - mid[1];
  const len = Math.hypot(ex, ey) || 1;
  const off = 0;
  const labelAt: [number, number] = [mid[0] + (-ey / len) * off, mid[1] + (ex / len) * off];

  return { points, labelAt };
}