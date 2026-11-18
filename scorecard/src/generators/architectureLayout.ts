import type { ArchitectureFile, ArchitectureGroup, ArchitectureNode } from "../lib/schemas";

export type PlateMetrics = {
  boxW: number;
  boxH: number;
  storeH: number;
  colGap: number;
  rowGap: number;
  bandW: number;
  marginX: number;
  marginY: number;
  legendY: number;
  titleSize: number;
  subSize: number;
};

const MIN_BOX_W = 120;
const TITLE_CHAR_RATIO = 0.72;
const BOX_PAD_X = 28;

const BASE_SMALL = {
  boxW: 152,
  boxH: 54,
  storeH: 60,
  colGap: 56,
  rowGap: 18,
  bandW: 28,
  marginX: 8,
  marginY: 24,
  legendY: 0,
  titleSize: 12,
  subSize: 11,
};

const BASE_MED = {
  boxW: 132,
  boxH: 52,
  storeH: 58,
  colGap: 48,
  rowGap: 16,
  bandW: 28,
  marginX: 8,
  marginY: 24,
  legendY: 0,
  titleSize: 12,
  subSize: 11,
};

const BASE_LARGE = {
  boxW: 120,
  boxH: 50,
  storeH: 56,
  colGap: 44,
  rowGap: 14,
  bandW: 26,
  marginX: 8,
  marginY: 24,
  legendY: 0,
  titleSize: 12,
  subSize: 11,
};

export function plateLayoutMetrics(nodeCount: number): PlateMetrics {
  if (nodeCount <= 4) return { ...BASE_SMALL };
  if (nodeCount <= 8) return { ...BASE_MED };
  return { ...BASE_LARGE };
}

/** Width required to show the full uppercased title (no ellipsis). */
export function boxWidthForLabel(label: string, titleSize = 12): number {
  const title = label.toUpperCase();
  const inner = title.length * titleSize * TITLE_CHAR_RATIO + BOX_PAD_X;
  return Math.max(MIN_BOX_W, Math.ceil(inner));
}

type LayoutNode = ArchitectureNode & { layoutW?: number };

export function nodeBoxW(node: ArchitectureNode, m: PlateMetrics): number {
  const lw = (node as LayoutNode).layoutW;
  if (lw && lw > 0) return lw;
  return Math.max(m.boxW, boxWidthForLabel(node.label, m.titleSize));
}

export function estimateSpineWidth(file: ArchitectureFile, m: PlateMetrics): number {
  const nodes = applyArchitectureLayout(file, m).nodes as LayoutNode[];
  let maxX = 0;
  for (const n of nodes) {
    const w = nodeBoxW(n, m);
    maxX = Math.max(maxX, (n.x ?? 0) + w);
  }
  return maxX + m.marginX + m.bandW + 24;
}

function columnWidth(list: ArchitectureNode[], m: PlateMetrics): number {
  return Math.max(...list.map((n) => boxWidthForLabel(n.label, m.titleSize)), MIN_BOX_W);
}

/** Keep rendered titles ≥11px by raising SVG font-size on narrow viewports (not by shrinking boxes). */
export function metricsForCanvas(file: ArchitectureFile, canvasWidthPx: number): PlateMetrics {
  const base = plateLayoutMetrics(file.nodes.length);
  const narrow = canvasWidthPx > 0 && canvasWidthPx < 520;
  let m: PlateMetrics = { ...base, titleSize: 12, subSize: 11 };
  const target = Math.max(120, canvasWidthPx - 8);

  for (let pass = 0; pass < 5; pass++) {
    const laid = applyArchitectureLayout(file, m, { narrowStack: narrow });
    const vbParts = tightViewBox(laid.nodes, m).split(/\s+/).map(Number);
    const vbW = vbParts[2];
    const meet = target / Math.max(vbW, 1);
    if (m.titleSize * meet >= 11.18) break;
    const bumped = Math.min(26, Math.ceil(11.55 / Math.max(meet, 0.001)));
    m = { ...m, titleSize: bumped, subSize: Math.max(10, bumped - 1) };
  }

  if (!narrow && canvasWidthPx >= 520) {
    const laid = applyArchitectureLayout(file, m, { narrowStack: false });
    const vbParts = tightViewBox(laid.nodes, m).split(/\s+/).map(Number);
    const contentW = vbParts[2];
    const minTarget = canvasWidthPx * 0.72;
    if (contentW > 0 && contentW < minTarget) {
      const order = [...new Set(laid.nodes.map((n) => n.group ?? "_ungrouped"))];
      const gaps = Math.max(1, order.length - 1);
      const extraGap = (minTarget - contentW) / gaps;
      m = { ...m, colGap: m.colGap + extraGap };
    }
  }

  const verifyLayout = applyArchitectureLayout(file, m, { narrowStack: narrow });
  const vbW = tightViewBox(verifyLayout.nodes, m).split(/\s+/).map(Number)[2];
  const meet = target / Math.max(vbW, 1);
  if (meet > 0 && m.titleSize * meet < 11.02) {
    m = {
      ...m,
      titleSize: Math.min(26, Math.ceil(11.2 / meet)),
      subSize: Math.max(10, Math.min(25, Math.ceil(11.2 / meet) - 1)),
    };
  }

  return m;
}

/** @deprecated */
export const PLATE_BOX_W = 132;
export const PLATE_BOX_H = 56;
export const PLATE_STORE_H = 68;

export function boxHeight(node: ArchitectureNode, m: PlateMetrics): number {
  return node.tone === "data" ? m.storeH : m.boxH;
}

export function applyArchitectureLayout(
  file: ArchitectureFile,
  m = plateLayoutMetrics(file.nodes.length),
  opts?: { narrowStack?: boolean },
): ArchitectureFile {
  const layout = file.layout ?? "spine-lr";
  const nodes = file.nodes.map((n) => ({ ...n })) as LayoutNode[];
  const narrowStack = opts?.narrowStack ?? false;

  if (layout === "spine-lr" && narrowStack) {
    const order: string[] = [];
    const byGroup = new Map<string, LayoutNode[]>();
    for (const n of nodes) {
      const g = n.group ?? "_ungrouped";
      if (!byGroup.has(g)) {
        byGroup.set(g, []);
        order.push(g);
      }
      byGroup.get(g)!.push(n);
    }
    let y = m.marginY;
    for (const gid of order) {
      const list = byGroup.get(gid)!;
      const colW = columnWidth(list, m);
      let nodeY = y;
      for (const n of list) {
        n.layoutW = colW;
        n.x = m.marginX + m.bandW + 18;
        n.y = nodeY;
        nodeY += boxHeight(n, m) + m.rowGap;
      }
      y = nodeY + m.rowGap;
    }
  } else if (layout === "spine-lr") {
    const order: string[] = [];
    const byGroup = new Map<string, LayoutNode[]>();
    for (const n of nodes) {
      const g = n.group ?? "_ungrouped";
      if (!byGroup.has(g)) {
        byGroup.set(g, []);
        order.push(g);
      }
      byGroup.get(g)!.push(n);
    }

    const colWidths = order.map((gid) => columnWidth(byGroup.get(gid)!, m));
    const colHeights = order.map((gid) => {
      const list = byGroup.get(gid)!;
      return list.reduce((sum, n, i) => sum + boxHeight(n, m) + (i > 0 ? m.rowGap : 0), 0);
    });
    const maxColH = Math.max(...colHeights, m.boxH);

    let colX = m.marginX + m.bandW + 18;
    for (let gi = 0; gi < order.length; gi++) {
      const gid = order[gi];
      const list = byGroup.get(gid)!;
      const colW = colWidths[gi] ?? MIN_BOX_W;
      const colH = colHeights[gi] ?? m.boxH;
      let y = m.marginY + Math.max(0, (maxColH - colH) / 2);
      for (const n of list) {
        n.layoutW = colW;
        const h = boxHeight(n, m);
        n.x = colX;
        n.y = y;
        y += h + m.rowGap;
      }
      colX += colW + m.colGap;
    }
  } else if (layout === "layered") {
    const layers: Record<string, number> = { client: 0, edge: 1, runtime: 2, service: 2, data: 3, external: 4 };
    const byLayer = new Map<number, LayoutNode[]>();
    for (const n of nodes) {
      const tone = n.tone ?? "service";
      const layer = layers[tone] ?? 2;
      if (!byLayer.has(layer)) byLayer.set(layer, []);
      byLayer.get(layer)!.push(n);
    }
    const layerKeys = [...byLayer.keys()].sort((a, b) => a - b);
    let y = m.marginY;
    for (const layer of layerKeys) {
      const list = byLayer.get(layer)!;
      let x = m.marginX + m.bandW + 18;
      const rowH = Math.max(...list.map((n) => boxHeight(n, m)));
      for (const n of list) {
        const w = boxWidthForLabel(n.label, m.titleSize);
        n.layoutW = w;
        n.x = n.x ?? x;
        n.y = n.y ?? y;
        x += w + m.colGap;
      }
      y += rowH + m.rowGap * 2;
    }
  } else if (layout === "radial") {
    const cx = 400;
    const cy = 240;
    const r = Math.min(160, 48 + nodes.length * 20);
    nodes.forEach((n, i) => {
      const w = boxWidthForLabel(n.label, m.titleSize);
      n.layoutW = w;
      const a = (2 * Math.PI * i) / nodes.length - Math.PI / 2;
      const h = boxHeight(n, m);
      n.x = n.x ?? Math.round(cx + r * Math.cos(a) - w / 2);
      n.y = n.y ?? Math.round(cy + r * Math.sin(a) - h / 2);
    });
  }

  return { ...file, nodes, layout };
}

const PAD = { left: 8, right: 16, top: 4, bottom: 20 };

export function tightViewBox(nodes: ArchitectureNode[], m: PlateMetrics): string {
  if (!nodes.length) return "0 0 640 280";
  let minX = Infinity;
  let minY = Infinity;
  let maxX = 0;
  let maxY = 0;
  for (const n of nodes) {
    const x = n.x ?? 0;
    const y = n.y ?? 0;
    const w = nodeBoxW(n, m);
    const h = boxHeight(n, m);
    minX = Math.min(minX, x - m.bandW - PAD.left - 10);
    minY = Math.min(minY, y - 4);
    maxX = Math.max(maxX, x + w + PAD.right);
    maxY = Math.max(maxY, y + h + PAD.bottom);
  }
  const w = maxX - minX;
  const h = maxY - minY;
  return `${minX} ${minY} ${w} ${h}`;
}

export function viewBoxForNodes(nodes: ArchitectureNode[]): string {
  return tightViewBox(nodes, plateLayoutMetrics(nodes.length));
}

export function inferGroupsFromNodes(nodes: ArchitectureNode[]): ArchitectureGroup[] {
  const seen = new Map<string, ArchitectureGroup>();
  for (const n of nodes) {
    if (!n.group || seen.has(n.group)) continue;
    const title = n.group.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    seen.set(n.group, { id: n.group, title, tone: n.tone });
  }
  return [...seen.values()];
}