import { GenericDesk } from "../components/desk/GenericDesk";

/** Dev-only ornament picker panels (moved off the home essay). */
export function DevDeskPage() {
  return (
    <main className="chapter">
      <header className="chapter-head">
        <p className="mono">DEV / DESK</p>
        <h1>Try the ornament desk</h1>
        <p className="standfirst">Interactive frame, frieze, rail, and token pickers for authoring — not shown on the reader home.</p>
        <hr className="rule" />
      </header>
      <div className="prose">
        <GenericDesk title="Scorecard · try the desk" />
      </div>
    </main>
  );
}