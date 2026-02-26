import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { PublicStreams } from './pages/PublicStreams';
import { Dashboard } from './pages/Dashboard';
import { Cameras } from './pages/Cameras';
import { CameraDetail } from './pages/CameraDetail';
import { CameraConfig } from './pages/CameraConfig';
import { Config } from './pages/Config';
import { Storage } from './pages/Storage';
import { Events } from './pages/Events';
import { EventDetail } from './pages/EventDetail';
import { Files } from './pages/Files';
import { Account } from './pages/Account';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10 * 1000,
      retry: 1,
    },
  },
});

function HomeOrRedirect() {
  const { credentials } = useAuth();
  if (credentials) return <Navigate to="/dashboard" replace />;
  return <PublicStreams />;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { credentials } = useAuth();
  if (!credentials) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomeOrRedirect />} />
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="cameras" element={<Cameras />} />
        <Route path="cameras/:id" element={<CameraDetail />} />
        <Route path="cameras/:id/config" element={<CameraConfig />} />
        <Route path="config" element={<Config />} />
        <Route path="storage" element={<Storage />} />
        <Route path="events" element={<Events />} />
        <Route path="events/:id" element={<EventDetail />} />
        <Route path="files" element={<Files />} />
        <Route path="account" element={<Account />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
