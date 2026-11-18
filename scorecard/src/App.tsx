import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { ContentProvider } from "./lib/ContentContext";
import { ChapterPage } from "./pages/ChapterPage";
import { ContentsPage } from "./pages/ContentsPage";
import { ExportPage } from "./pages/ExportPage";
import { DemoPackPage, DemosIndexPage } from "./pages/DemosPage";
import { FullHomeRouter } from "./pages/FullHomeRouter";
import { ScorecardPage } from "./pages/ScorecardPage";
import { InterviewPage } from "./interview/InterviewPage";
import { WritePage } from "./write/WritePage";
import { OrnamentSmokePage } from "./pages/OrnamentSmokePage";
import { DevDeskPage } from "./pages/DevDeskPage";

export function App() {
  return (
    <ContentProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<FullHomeRouter />} />
            <Route path="/scorecard" element={<ScorecardPage />} />
            <Route path="/demos" element={<DemosIndexPage />} />
            <Route path="/demos/:id" element={<DemoPackPage />} />
            <Route path="/contents" element={<ContentsPage />} />
            <Route path="/chapters/:slug" element={<ChapterPage />} />
            <Route path="/export" element={<ExportPage />} />
            {import.meta.env.DEV ? <Route path="/interview" element={<InterviewPage />} /> : null}
            {import.meta.env.DEV ? <Route path="/write/*" element={<WritePage />} /> : null}
            {import.meta.env.DEV ? <Route path="/dev/ornaments" element={<OrnamentSmokePage />} /> : null}
            {import.meta.env.DEV ? <Route path="/dev/desk" element={<DevDeskPage />} /> : null}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ContentProvider>
  );
}
