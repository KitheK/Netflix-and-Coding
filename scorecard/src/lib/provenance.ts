export type Provenance = "confirmed" | "inferred" | "draft";
export type Source = "generated" | "authored";

export type ClaimMeta = {
  provenance: Provenance;
  source: Source;
  evidence?: string;
};

/** Agent may never set confirmed — only Write mode can. */
export function agentClaim(partial: Omit<ClaimMeta, "provenance"> & { provenance?: Exclude<Provenance, "confirmed"> }): ClaimMeta {
  const p = partial.provenance ?? "draft";
  if (p === "inferred" && !partial.evidence) {
    return { provenance: "draft", source: partial.source, evidence: partial.evidence };
  }
  return { provenance: p, source: partial.source, evidence: partial.evidence };
}

export function authorConfirm<T extends ClaimMeta>(meta: T): T {
  return { ...meta, provenance: "confirmed", source: "authored" };
}

export function markAuthored<T extends ClaimMeta>(meta: T): T {
  return { ...meta, source: "authored" };
}

export function assertAgentCannotConfirm(meta: ClaimMeta): void {
  if (meta.provenance === "confirmed" && meta.source === "generated") {
    throw new Error("Agent cannot set provenance to confirmed");
  }
}
