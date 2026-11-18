import { ScorecardPage } from "./ScorecardPage";

export function ExportPage() {
  return (
    <div>
      <p className="page mono no-print">Print this page (Ctrl+P) for a one-page Scorecard PDF.</p>
      <ScorecardPage />
    </div>
  );
}
