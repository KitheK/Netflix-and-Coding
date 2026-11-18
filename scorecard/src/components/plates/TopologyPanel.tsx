import type { ArchitectureFile } from "../../lib/schemas";

/** Mermaid export fallback — hidden from primary plate UI unless expanded. */
export function TopologyPanel({ file }: { file: ArchitectureFile }) {
  if (!file.mermaid?.trim()) return null;
  const title = file.figureId ?? "ARCH_001";
  return (
    <details className="topology-panel">
      <summary className="mono">Topology · {title} (export)</summary>
      <pre className="topology-mermaid mono" tabIndex={0}>
        {file.mermaid.trim()}
      </pre>
    </details>
  );
}