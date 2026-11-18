import type { ArchitectureEdge, ArchitectureFile, ArchitectureNode } from "../../lib/schemas";
import { tones, type ToneId } from "./kit";

function toneForNode(node: ArchitectureNode | undefined): ToneId {
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
  return map[node?.tone ?? ""] ?? "service";
}

function edgesForNode(id: string, edges: ArchitectureEdge[]): ArchitectureEdge[] {
  return edges.filter((e) => e.from === id || e.to === id);
}

export function DetailRail({
  file,
  partId,
  hint = "Click a node for its role, evidence path, and connections.",
}: {
  file: ArchitectureFile;
  partId: string | null;
  hint?: string;
}) {
  const node = partId ? file.nodes.find((n) => n.id === partId) : undefined;
  if (!node) {
    return (
      <aside className="detail-rail" aria-live="polite">
        <p className="detail-hint mono">{hint}</p>
      </aside>
    );
  }

  const tone = tones[toneForNode(node)];
  const related = edgesForNode(node.id, file.edges);

  return (
    <aside key={node.id} className="detail-rail detail-rail--active" aria-live="polite" style={{ borderTopColor: tone.stroke }}>
      <p className="detail-kicker mono" style={{ color: tone.title }}>
        <span className="detail-swatch" style={{ background: tone.fill, borderColor: tone.stroke }} />
        {node.id.toUpperCase()}
      </p>
      <h3 className="detail-title" style={{ color: tone.title }}>
        {node.label}
      </h3>
      {node.detail?.role ? <p className="detail-role">{node.detail.role}</p> : null}
      {node.path ? (
        <>
          <p className="detail-label mono">PATH</p>
          <p className="mono detail-ports">{node.path}</p>
        </>
      ) : null}
      {node.detail?.evidence ? (
        <>
          <p className="detail-label mono">EVIDENCE</p>
          <p>{node.detail.evidence}</p>
        </>
      ) : null}
      {node.detail?.summary ? <p>{node.detail.summary}</p> : null}
      {node.detail?.ports?.length ? (
        <>
          <p className="detail-label mono">PORTS</p>
          <p className="mono detail-ports">{node.detail.ports.join(", ")}</p>
        </>
      ) : null}
      {related.length ? (
        <>
          <p className="detail-label mono">EDGES</p>
          <ul className="detail-facts">
            {related.map((e) => (
              <li key={`${e.from}-${e.to}-${e.label ?? ""}`}>
                {e.from === node.id ? `→ ${e.to}` : `← ${e.from}`}
                {e.label ? ` (${e.label})` : ""}
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </aside>
  );
}