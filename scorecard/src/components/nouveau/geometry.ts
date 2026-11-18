// Small vector helpers for the procedural parts (stems, rings, stars).
export type Pt = [number, number];

const f = (v: number) => (Math.round(v * 10) / 10).toString();

/** Point on a cubic Bézier. */
export function bez(p: Pt[], t: number): Pt {
  const u = 1 - t;
  const a = u * u * u, b = 3 * u * u * t, c = 3 * u * t * t, d = t * t * t;
  return [a * p[0][0] + b * p[1][0] + c * p[2][0] + d * p[3][0], a * p[0][1] + b * p[1][1] + c * p[2][1] + d * p[3][1]];
}

/** Centre line of a cubic as an SVG path (used for draw-in masks). */
export function cubicD(p: Pt[]): string {
  return `M${f(p[0][0])} ${f(p[0][1])}C${p.slice(1).map((q) => `${f(q[0])} ${f(q[1])}`).join(" ")}`;
}

/**
 * A thick-to-thin stem: the cubic `p` swept with a width that eases from w0 to
 * w1 (Mucha's whiplash taper), closed with a round-ish tip. Returns a filled path.
 */
export function taper(p: Pt[], w0: number, w1: number, steps = 28): string {
  const L: Pt[] = [], R: Pt[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const a = bez(p, Math.max(0, t - 0.01)), b = bez(p, Math.min(1, t + 0.01));
    let nx = -(b[1] - a[1]), ny = b[0] - a[0];
    const n = Math.hypot(nx, ny) || 1;
    nx /= n; ny /= n;
    const e = t * t * (3 - 2 * t);
    const w = (w0 + (w1 - w0) * e) / 2;
    const c = bez(p, t);
    L.push([c[0] + nx * w, c[1] + ny * w]);
    R.push([c[0] - nx * w, c[1] - ny * w]);
  }
  const pts = [...L, ...R.reverse()];
  return "M" + pts.map((q) => `${f(q[0])} ${f(q[1])}`).join("L") + "Z";
}

/** Six-pointed star (plate 33's garland), points up. */
export function star6(cx: number, cy: number, r: number, inner = 0.5): string {
  const pts: string[] = [];
  for (let i = 0; i < 12; i++) {
    const a = (Math.PI / 6) * i - Math.PI / 2;
    const rr = i % 2 ? r * inner : r;
    pts.push(`${f(cx + Math.cos(a) * rr)} ${f(cy + Math.sin(a) * rr)}`);
  }
  return "M" + pts.join("L") + "Z";
}

/** Circle as a path starting at angle a0 (deg, 0 = top, clockwise), for stroke draw-in. */
export function circleD(cx: number, cy: number, r: number, a0 = 0): string {
  const rad = ((a0 - 90) * Math.PI) / 180;
  const x0 = cx + Math.cos(rad) * r, y0 = cy + Math.sin(rad) * r;
  const x1 = cx - Math.cos(rad) * r, y1 = cy - Math.sin(rad) * r;
  return `M${f(x0)} ${f(y0)}A${f(r)} ${f(r)} 0 1 1 ${f(x1)} ${f(y1)}A${f(r)} ${f(r)} 0 1 1 ${f(x0)} ${f(y0)}`;
}

/** Five-lobed blossom outline (plate 30's wild-rose), lobes notched at the tip. */
export function blossom5(cx: number, cy: number, r: number, rot = 0): string {
  let d = "";
  for (let i = 0; i < 5; i++) {
    const a0 = rot + (i * 2 * Math.PI) / 5 - Math.PI / 2 - Math.PI / 5;
    const a1 = a0 + (2 * Math.PI) / 5;
    const am = (a0 + a1) / 2;
    const P = (a: number, rr: number): Pt => [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr];
    const s = P(a0, r * 0.32), e = P(a1, r * 0.32);
    const c1 = P(a0 - 0.12, r * 1.08), c2 = P(am - 0.18, r * 1.12), tip = P(am, r * 0.92), c3 = P(am + 0.18, r * 1.12), c4 = P(a1 + 0.12, r * 1.08);
    d += (i ? "L" : "M") + `${f(s[0])} ${f(s[1])}`;
    d += `C${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(tip[0])} ${f(tip[1])}`;
    d += `C${f(c3[0])} ${f(c3[1])} ${f(c4[0])} ${f(c4[1])} ${f(e[0])} ${f(e[1])}`;
  }
  return d + "Z";
}
