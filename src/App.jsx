import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ProjectPage from './pages/ProjectPage';
import PlanDetailPage from './pages/PlanDetailPage';
import CompletedMediaPage from './pages/CompletedMediaPage';
import SavedNotesPage from './pages/SavedNotesPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/project/:id" element={<ProjectPage />} />
        <Route path="/plan/:id" element={<PlanDetailPage />} />
        <Route path="/media/completed" element={<CompletedMediaPage />} />
        <Route path="/notes" element={<SavedNotesPage />} />
      </Routes>
    </BrowserRouter>
  );
}
