import { useEffect, useState } from "react";
import type { MotifName } from "./meta";

export type Layer = { r: string; c: string; d: string };
export type Motif = { w: number; h: number; src: string; box: number[]; layers: Layer[]; skel: { d: string; l: number }[] };

// Each traced motif is a separate JSON chunk, loaded on first use (they are
// 12–320 KB raw, ~4x smaller gzipped), so a page only pays for what it shows.
const loaders = import.meta.glob<Motif>("./motifs/*.json", { import: "default" });
const cache = new Map<string, Motif>();
const pending = new Map<string, Promise<Motif>>();

export function loadMotif(name: MotifName): Promise<Motif> {
  const hit = cache.get(name);
  if (hit) return Promise.resolve(hit);
  let p = pending.get(name);
  if (!p) {
    const load = loaders[`./motifs/${name}.json`];
    if (!load) return Promise.reject(new Error(`unknown motif ${name}`));
    p = load().then((m) => (cache.set(name, m), m));
    pending.set(name, p);
  }
  return p;
}

/** Load several motifs; returns null until all are ready. */
export function useMotifs<N extends MotifName>(names: readonly N[]): Record<N, Motif> | null {
  const key = names.join(",");
  const [got, setGot] = useState<Record<N, Motif> | null>(() =>
    names.every((n) => cache.has(n)) ? (Object.fromEntries(names.map((n) => [n, cache.get(n)!])) as Record<N, Motif>) : null,
  );
  useEffect(() => {
    let live = true;
    Promise.all(names.map((n) => loadMotif(n))).then((ms) => {
      if (live) setGot(Object.fromEntries(names.map((n, i) => [n, ms[i]])) as Record<N, Motif>);
    });
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return got;
}
