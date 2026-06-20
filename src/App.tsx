import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import Layout from './components/Layout';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const KnowledgeBase = lazy(() => import('./pages/KnowledgeBase'));
const DailyJournal = lazy(() => import('./pages/DailyJournal'));
const CodeVault = lazy(() => import('./pages/CodeVault'));
const ResearchPapers = lazy(() => import('./pages/ResearchPapers'));
const Projects = lazy(() => import('./pages/Projects'));
const LearningRoadmap = lazy(() => import('./pages/LearningRoadmap'));
const Bookmarks = lazy(() => import('./pages/Bookmarks'));
const QuickNotes = lazy(() => import('./pages/QuickNotes'));
const Search = lazy(() => import('./pages/Search'));
const Settings = lazy(() => import('./pages/Settings'));
const RecycleBin = lazy(() => import('./pages/RecycleBin'));
const SyllabusGenerator = lazy(() => import('./pages/SyllabusGenerator'));
const BackupCenter = lazy(() => import('./pages/BackupCenter'));

function Loading() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
    </div>
  );
}

function VaultRoutes() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/knowledge" element={<KnowledgeBase />} />
        <Route path="/syllabus-generator" element={<SyllabusGenerator />} />
        <Route path="/journal" element={<DailyJournal />} />
        <Route path="/code" element={<CodeVault />} />
        <Route path="/papers" element={<ResearchPapers />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/roadmap" element={<LearningRoadmap />} />
        <Route path="/bookmarks" element={<Bookmarks />} />
        <Route path="/quick-notes" element={<QuickNotes />} />
        <Route path="/search" element={<Search />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/backup-center" element={<BackupCenter />} />
        <Route path="/recycle-bin" element={<RecycleBin />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <VaultRoutes />
      </Layout>
    </BrowserRouter>
  );
}
