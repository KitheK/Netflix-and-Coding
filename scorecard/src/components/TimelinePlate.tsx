import { useContent } from "../lib/ContentContext";

export function TimelinePlate() {
  const { branches } = useContent();
  return (
    <div className="timeline" role="list" aria-label={`Timeline (${branches.form})`}>
      {branches.events.map((e) => (
        <div key={e.id} role="listitem" data-provenance={e.provenance}>
          <strong>{e.label}</strong>
          {e.blurb ? ` — ${e.blurb}` : ""}
        </div>
      ))}
    </div>
  );
}
