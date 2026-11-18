import { Link, NavLink, Outlet } from "react-router-dom";
import { PLATFORM_ATTRIBUTION } from "../lib/schemas";
import { useContent } from "../lib/ContentContext";
import { FootFrieze } from "./FootFrieze";
import { ManualLayout } from "./ManualLayout";

function LiteLayout() {
  const { theme } = useContent();
  return (
    <div className="shell">
      <header className="topbar no-print">
        <Link to="/" className="display" style={{ fontSize: "1.25rem", textDecoration: "none", color: "inherit" }}>
          Guide
        </Link>
        <nav aria-label="Primary">
          <NavLink to="/" end>
            Summary
          </NavLink>
          <NavLink to="/demos">Demos</NavLink>
          <NavLink to="/export">Export</NavLink>
          {import.meta.env.DEV ? <NavLink to="/interview">Interview</NavLink> : null}
          {import.meta.env.DEV ? <NavLink to="/write">Write</NavLink> : null}
        </nav>
        <span className="mono">{theme.scheme}</span>
      </header>
      <Outlet />
      <FootFrieze />
      <footer className="page mono" style={{ opacity: 0.7, paddingTop: 0 }}>
        {PLATFORM_ATTRIBUTION} · descriptive only — never a grade
      </footer>
    </div>
  );
}

export function Layout() {
  const { scorecard } = useContent();
  if (scorecard.size === "lite") {
    return <LiteLayout />;
  }
  return (
    <ManualLayout>
      <Outlet />
      <FootFrieze />
    </ManualLayout>
  );
}