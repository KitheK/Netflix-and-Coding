// Per-motif animation metadata, in each traced motif's own units (plate pixels).
//  pen    : width of the draw-in pen that follows the skeleton strokes
//  panel  : roles that form the painted ground (fade in first, not drawn)
//  blooms : flower heads / pods / pendants: soft-masked copies that unfurl from
//           their base (px,py) and then sway
export type Bloom = { x: number; y: number; rx: number; ry: number; px: number; py: number; s0?: [number, number] };
export type MotifMeta = { pen: number; panel: string[]; blooms: Bloom[]; sway: number };

export type MotifName =
  | "p30-frieze" | "p30-cap" | "p30-lyre" | "p30-blossom" | "p33-frieze" | "p46-corner" | "p46-knot"
  | "b01-tile" | "b01-cap" | "b01-foot";

const pod = (x: number, y: number, up = true): Bloom => ({ x, y, rx: 34, ry: 44, px: x, py: up ? y + 44 : y - 42 });
const pend = (x: number, y: number, dx: number, dy: number): Bloom => ({ x, y, rx: 21, ry: 21, px: x + dx, py: y + dy });

export const META: Record<MotifName, MotifMeta> = {
  "p30-frieze": { pen: 30, panel: ["ground", "band", "taupe", "paper"], sway: 2.4, blooms: [pod(30, 293, false), pod(172, 293, false), pod(321, 293, false)] },
  "p33-frieze": { pen: 24, panel: ["ground", "band", "violet"], sway: 1.3, blooms: [{ x: 135, y: 110, rx: 150, ry: 128, px: 142, py: 248, s0: [0.6, 0.2] }] },
  "p30-cap": { pen: 22, panel: [], sway: 3, blooms: [pod(25, 188), pod(147, 180), pod(262, 181)] },
  "p30-lyre": { pen: 34, panel: [], sway: 2, blooms: [{ x: 150, y: 105, rx: 48, ry: 74, px: 150, py: 186 }] },
  "p30-blossom": { pen: 0, panel: [], sway: 0, blooms: [] },
  "p46-corner": { pen: 18, panel: [], sway: 4, blooms: [pend(100, 100, 0, 24), pend(190, 103, 0, 24), pend(285, 107, 0, 24), pend(97, 188, 22, 6), pend(97, 280, 22, 6)] },
  "p46-knot": { pen: 26, panel: ["green", "sage", "yellow"], sway: 0, blooms: [] },
  "b01-tile": { pen: 0, panel: [], sway: 0, blooms: [] },
  "b01-cap": { pen: 0, panel: [], sway: 0, blooms: [] },
  "b01-foot": { pen: 0, panel: [], sway: 0, blooms: [] },
};
