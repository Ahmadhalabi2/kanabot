import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { BacklogPage } from './pages/BacklogPage';
import { BoardPage } from './pages/BoardPage';
import { SprintsPage } from './pages/SprintsPage';
import { AiPage } from './pages/AiPage';
import { Spinner } from './components/ui/Spinner';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }
  return user ? <>{children}</> : <Navigate to="/login" replace />;
}

function RedirectIfAuth({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }
  return user ? <Navigate to="/projects" replace /> : <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route
        path="/login"
        element={<RedirectIfAuth><LoginPage /></RedirectIfAuth>}
      />
      <Route
        path="/register"
        element={<RedirectIfAuth><RegisterPage /></RedirectIfAuth>}
      />

      {/* Protected */}
      <Route
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to="/projects" replace />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/projects/:projectId/backlog" element={<BacklogPage />} />
        <Route path="/projects/:projectId/board" element={<BoardPage />} />
        <Route path="/projects/:projectId/sprints" element={<SprintsPage />} />
        <Route path="/projects/:projectId/ai" element={<AiPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/projects" replace />} />
    </Routes>
  );
}
