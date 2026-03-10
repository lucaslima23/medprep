// ============================================
// MEDPREP LMS - APP COMPONENT
// ============================================

import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { StudyProvider } from './contexts/StudyContext';
import { LoadingScreen } from './components/common';
import { AdminImport } from './components/admin/AdminImport';
import { ScheduleEditorPage } from './components/admin/ScheduleEditorPage';
import { UsersManagerPage } from './components/admin/UsersManagerPage';
import { AdminFlashcards } from './components/admin/AdminFlashcards';
export function RouteChangeTracker() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Remove qualquer overlay ou bloqueio de scroll residual no mobile
    document.body.style.overflow = 'unset';
    const backdrops = document.querySelectorAll('.fixed.inset-0');
    backdrops.forEach(el => (el as HTMLElement).style.display = 'none');
  }, [pathname]);

  return null;
}
// Lazy load pages for better performance
const LoginPage = lazy(() => import('./components/auth/LoginPage'));
const MainLayout = lazy(() => import('./components/layout/MainLayout'));
const Dashboard = lazy(() => import('./components/dashboard/Dashboard'));
const RankingsPage = lazy(() => import('./components/rankings/RankingsPage'));
const QuestionsPage = lazy(() => import('./components/questions/QuestionsPage'));
const AnalyticsPage = lazy(() => import('./components/analytics/AnalyticsPage'));
const SimuladoPage = lazy(() => import('./components/simulado/SimuladoPage'));

const FlashcardsPage = lazy(() => import('./components/flashcards/FlashcardsPage'));

const ReviewPage = lazy(() => import('./components/review/ReviewPage'));



const SettingsPage = lazy(() => import('./components/settings/SettingsPage'));

// Protected Route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <StudyProvider>{children}</StudyProvider>;
}

// Admin Route wrapper (requires role === 'admin')
function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  // Se for admin, já sabemos que está autenticado, mas podemos envolver também no StudyProvider se necessário.
  // Pelo AppRoutes, as rotas /admin já estão filhas de ProtectedRoute na estrutura principal (dentro de MainLayout).
  // Então aqui podemospenas retornar {children}.
  return <>{children}</>;
}

// Public Route wrapper (redirect if logged in)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

// Main App Component
function AppRoutes() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <RouteChangeTracker />
      <Routes>
        {/* Public Routes */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />

        {/* Protected Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/rankings" replace />} />
          <Route path="rankings" element={<RankingsPage />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="questoes" element={<QuestionsPage />} />
          <Route path="flashcards" element={<FlashcardsPage />} />
          <Route path="revisao" element={<ReviewPage />} />
          <Route path="simulado" element={<SimuladoPage />} />
          <Route path="desempenho" element={<AnalyticsPage />} />
          <Route path="configuracoes" element={<SettingsPage />} />

          <Route path="admin-import" element={
            <AdminRoute>
              <AdminImport />
            </AdminRoute>
          } />
          <Route path="/admin/schedule-editor" element={
            <AdminRoute>
              <ScheduleEditorPage />
            </AdminRoute>
          } />
          <Route path="/admin/flashcards" element={
            <AdminRoute>
              <AdminFlashcards />
            </AdminRoute>
          } />
          <Route path="/admin/users" element={
            <AdminRoute>
              <UsersManagerPage />
            </AdminRoute>
          } />
        </Route>

        {/* Catch all - redirect to rankings */}
        <Route path="*" element={<Navigate to="/rankings" replace />} />
      </Routes>
    </Suspense>
  );
}

// App with Providers
export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
