import { useContent } from "../lib/ContentContext";
import { HomePage } from "./HomePage";
import { ScorecardPage } from "./ScorecardPage";

/** Full guides get Libretto home at `/`; other sizes keep the summary. */
export function FullHomeRouter() {
  const { scorecard } = useContent();
  if (scorecard.size === "full") return <HomePage />;
  return <ScorecardPage />;
}