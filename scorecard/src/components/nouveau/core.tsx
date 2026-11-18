import { useEffect, useId, useLayoutEffect, useState, type CSSProperties, type ReactNode, type RefObject } from "react";
import { META, type MotifName } from "./meta";
import type { Motif } from "./useMotif";

export type Palette = "plate" | "libretto";

/** CSS-safe unique id prefix for SVG defs. */
export function useSvgId(prefix: string) {
  return prefix + useId().replace(/[^a-zA-Z0-9]/g, "");
}

/** Observe an element's border-box size (ResizeObserver). */
export function useSize(ref: RefObject<HTMLElement | null>) {
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      const b = e.borderBoxSize?.[0];
      const w = b ? b.inlineSize : e.contentRect.width, h = b ? b.blockSize : e.contentRect.height;
      setSize((s) => (s && Math.abs(s.w - w) < 0.5 && Math.abs(s.h - h) < 0.5 ? s : { w, h }));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return size;
}

/**
 * Pause every animation inside `ref` while it is off-screen. Writes a data
 * attribute straight to the DOM (CSS does the pausing), so nothing re-renders.
 * Animations start paused and so begin when the ornament first scrolls in.
 */
export function useInView(ref: RefObject<Element | null>) {
  useEffect(() => {
    const el = ref.current as HTMLElement | null;
    if (!el || typeof IntersectionObserver === "undefined") {
      if (el) el.dataset.nvInview = "true";
      return;
    }
    const io = new IntersectionObserver(([e]) => { el.dataset.nvInview = e.isIntersecting ? "true" : "false"; }, { rootMargin: "40px" });
    io.observe(el);
    return () => io.disconnect();
  }, [ref]);
}

/** Common root props: class, palette, static switch. */
export function rootProps(kind: string, palette: Palette, animate: boolean, className?: string, style?: CSSProperties) {
  return {
    className: `nv nv-${kind}${className ? " " + className : ""}`,
    "data-palette": palette,
    "data-nv-inview": "false",
    ...(animate ? {} : { "data-nv-static": "" }),
    "aria-hidden": true as const,
    style,
  };
}

const fill = (r: string, c: string): CSSProperties => ({ fill: `var(--nv-${r}, ${c})` });

/** One <g> per motif split into its painted ground (panel) and its figure. Put inside <defs>. */
export function MotifDefs({ id, m, name }: { id: string; m: Motif; name: MotifName }) {
  const panel = META[name].panel;
  const P = m.layers.filter((l) => panel.includes(l.r));
  const F = m.layers.filter((l) => !panel.includes(l.r));
  return (
    <>
      <g id={`${id}-panel`}>{P.map((l, i) => <path key={i} d={l.d} style={fill(l.r, l.c)} fillRule="evenodd" className={`nv-r-${l.r}`} />)}</g>
      <g id={`${id}-fig`}>{F.map((l, i) => <path key={i} d={l.d} style={fill(l.r, l.c)} fillRule="evenodd" className={`nv-r-${l.r}`} />)}</g>
    </>
  );
}

export type Place = { x: number; y: number; w: number; h: number; rot?: 0 | 90 | 180 | 270; flipX?: boolean; flipY?: boolean };

/** transform for placing a (w,h) box rotated/flipped; returns inner (iw,ih) for the nested viewport. */
export function placeTransform({ x, y, w, h, rot = 0, flipX, flipY }: Place) {
  let t = `translate(${x} ${y})`;
  if (flipX) t += ` translate(${w} 0) scale(-1 1)`;
  if (flipY) t += ` translate(0 ${h}) scale(1 -1)`;
  if (rot === 90) t += ` translate(${w} 0) rotate(90)`;
  if (rot === 180) t += ` translate(${w} ${h}) rotate(180)`;
  if (rot === 270) t += ` translate(0 ${h}) rotate(-90)`;
  const swap = rot === 90 || rot === 270;
  return { t, iw: swap ? h : w, ih: swap ? w : h };
}

export type Timing = { t0?: number; dur?: number; sway?: number; swayDelay?: number; draw?: boolean };

const sec = (v: number) => `${v.toFixed(3)}s`;

/**
 * Place one traced motif (by reference to its defs) with the movement:
 *  1. painted ground fades in,
 *  2. a pen follows the skeleton strokes and reveals the stems (stroke-dashoffset in a mask),
 *  3. whatever the pen didn't cover fades up behind it,
 *  4. flower heads / pods / pendants unfurl from their base, then sway forever.
 */
export function MotifUse({
  id, defs, name, m, place, view, timing = {}, overlap = 0.5, className,
}: {
  id: string; defs: string; name: MotifName; m: Motif; place: Place; view?: [number, number, number, number];
  timing?: Timing; overlap?: number; className?: string;
}) {
  const meta = META[name];
  const { t0 = 0, dur = 2.4, sway = meta.sway, swayDelay = 0, draw = true } = timing;
  const [vx, vy, vw, vh] = view ?? [0, 0, m.w, m.h];
  const { t, iw, ih } = placeTransform(place);
  const total = m.skel.reduce((a, s) => a + s.l, 0) || 1;
  let acc = 0;
  const drawStart = t0 + 0.25;
  const pens = draw && meta.pen > 0
    ? m.skel.map((s, i) => {
        const d = drawStart + (acc / total) * dur;
        acc += s.l;
        const len = Math.max(0.12, (s.l / total) * dur);
        return <path key={i} d={s.d} pathLength={1} className="nv-pen" style={{ "--d": sec(d), "--t": sec(len) } as CSSProperties} />;
      })
    : null;
  const blooms = meta.blooms.filter((b) => b.x + b.rx > vx && b.x - b.rx < vx + vw && b.y + b.ry > vy && b.y - b.ry < vy + vh);
  const restAt = draw && pens ? drawStart + dur * 0.8 : t0 + 0.1;
  return (
    <g transform={t} className={className}>
      <svg x={0} y={0} width={iw + overlap} height={ih + overlap} viewBox={`${vx} ${vy} ${vw} ${vh}`} preserveAspectRatio="none" overflow="hidden">
        <defs>
          <radialGradient id={`${id}-sw`}><stop offset="0.72" stopColor="#fff" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></radialGradient>
          <radialGradient id={`${id}-sb`}><stop offset="0.72" stopColor="#000" /><stop offset="1" stopColor="#000" stopOpacity="0" /></radialGradient>
          <mask id={`${id}-body`} maskUnits="userSpaceOnUse" x={vx - 10} y={vy - 10} width={vw + 20} height={vh + 20}>
            {pens && <g fill="none" stroke="#fff" strokeWidth={meta.pen} strokeLinejoin="round">{pens}</g>}
            <rect className="nv-fade" x={vx - 10} y={vy - 10} width={vw + 20} height={vh + 20} fill="#fff" style={{ "--d": sec(restAt), "--t": "0.9s" } as CSSProperties} />
            {blooms.map((b, i) => <ellipse key={i} cx={b.x} cy={b.y} rx={b.rx} ry={b.ry} fill={`url(#${id}-sb)`} />)}
          </mask>
          {blooms.map((b, i) => (
            <mask key={i} id={`${id}-b${i}`} maskUnits="userSpaceOnUse" x={vx - 40} y={vy - 40} width={vw + 80} height={vh + 80}>
              <ellipse cx={b.x} cy={b.y} rx={b.rx} ry={b.ry} fill={`url(#${id}-sw)`} />
            </mask>
          ))}
        </defs>
        <use href={`#${defs}-panel`} className="nv-fade" style={{ "--d": sec(t0), "--t": "0.7s" } as CSSProperties} />
        <use href={`#${defs}-fig`} mask={`url(#${id}-body)`} />
        {blooms.map((b, i) => {
          const at = drawStart + dur * (0.35 + 0.5 * ((b.y - vy) / vh) * 0.6) + i * 0.08;
          return (
            <g key={i} transform={`translate(${b.px} ${b.py})`}>
              <g className={sway ? "nv-sway" : undefined} style={{ "--a": `${sway}deg`, "--d": sec(at + 1.2 + swayDelay), "--t": `${4.6 + (i % 3) * 0.7}s` } as CSSProperties}>
                <g className="nv-unfurl" style={{ "--d": sec(at), "--nv-rot": `${(i % 2 ? 22 : -22) * (b.s0 ? 0.25 : 1)}deg`, ...(b.s0 ? { "--nv-sx0": b.s0[0], "--nv-sy0": b.s0[1] } : {}) } as CSSProperties}>
                  <g transform={`translate(${-b.px} ${-b.py})`}>
                    <use href={`#${defs}-fig`} mask={`url(#${id}-b${i})`} />
                  </g>
                </g>
              </g>
            </g>
          );
        })}
      </svg>
    </g>
  );
}

/** Wrapper for an absolutely positioned decorative SVG. */
export function Overlay({ w, h, children, style }: { w: number; h: number; children: ReactNode; style?: CSSProperties }) {
  return (
    <svg className="nv-svg" width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={style} aria-hidden="true" focusable="false">
      {children}
    </svg>
  );
}

/** Deterministic seeking for screenshots / recordings. */
if (typeof window !== "undefined") {
  (window as unknown as { __nouveau: unknown }).__nouveau = {
    seek(t: number) {
      document.querySelectorAll<HTMLElement>(".nv").forEach((n) => (n.dataset.nvInview = "true"));
      for (const a of document.getAnimations()) {
        if (!(a.timeline instanceof DocumentTimeline)) continue; // scroll-driven ones follow the scroll
        a.pause();
        a.currentTime = t * 1000;
      }
    },
  };
}
