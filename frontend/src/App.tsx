import { lazy, Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useState, type ReactNode } from 'react';
import { Navigate, RouterProvider, createBrowserRouter } from 'react-router-dom';
import { CssBaseline, ThemeProvider } from '@mui/material';
import '@fontsource/public-sans/400.css';
import '@fontsource/public-sans/500.css';
import '@fontsource/public-sans/600.css';
import '@fontsource/public-sans/700.css';

import { AppContext, type HeaderAction } from './app/AppContext';
import type { SessionUser } from './app/types';
import { apiRequest } from './shared/api/client';
import { AppBootLoader, LoadingState } from './shared/components/LoadingState';
import { createMantisTheme, type ThemeMode } from './theme/mantisTheme';
import 'gridjs/dist/theme/mermaid.css';
import './styles/app.css';

const LoginPage = lazy(() => import('./features/auth/LoginPage').then((module) => ({ default: module.LoginPage })));
const ApiKeysPage = lazy(() => import('./features/api-keys/ApiKeysPage').then((module) => ({ default: module.ApiKeysPage })));
const TemplatesPage = lazy(() => import('./features/templates/TemplatesPage').then((module) => ({ default: module.TemplatesPage })));
const UsersPage = lazy(() => import('./features/users/UsersPage').then((module) => ({ default: module.UsersPage })));
const TagsPage = lazy(() => import('./features/tags/TagsPage').then((module) => ({ default: module.TagsPage })));
const PermissionsPage = lazy(() => import('./features/permissions/PermissionsPage').then((module) => ({ default: module.PermissionsPage })));
const AuditLogsPage = lazy(() => import('./features/audit-logs/AuditLogsPage').then((module) => ({ default: module.AuditLogsPage })));
const PrivateLayout = lazy(() => import('./layout/PrivateLayout').then((module) => ({ default: module.PrivateLayout })));

function withRouteLoader(element: ReactNode) {
  return (
    <Suspense fallback={<LoadingState label="Cargando modulo..." minHeight="100%" />}>
      {element}
    </Suspense>
  );
}

export default function App() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [reloadDataToken, setReloadDataToken] = useState(0);
  const [headerAction, setHeaderAction] = useState<HeaderAction>(null);
  const [headerActionOpen, setHeaderActionOpen] = useState(false);
  const [headerControls, setHeaderControls] = useState<ReactNode>(null);
  const [mode, setMode] = useState<ThemeMode>(() => localStorage.getItem('pdfme-theme') === 'dark' ? 'dark' : 'light');

  useLayoutEffect(() => {
    document.documentElement.dataset.theme = mode;
    localStorage.setItem('pdfme-theme', mode);
  }, [mode]);

  useEffect(() => {
    apiRequest<{ user: SessionUser }>('/api/auth/me')
      .then((payload) => setUser(payload.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const theme = useMemo(() => createMantisTheme(mode), [mode]);
  const bumpReloadDataToken = useCallback(() => setReloadDataToken((value) => value + 1), []);
  const toggleMode = useCallback(() => setMode((value) => value === 'dark' ? 'light' : 'dark'), []);
  const openHeaderAction = useCallback(() => setHeaderActionOpen(true), []);
  const closeHeaderAction = useCallback(() => setHeaderActionOpen(false), []);

  const contextValue = useMemo(() => ({
    user,
    setUser,
    reloadDataToken,
    bumpReloadDataToken,
    mode,
    toggleMode,
    headerAction,
    setHeaderAction,
    headerActionOpen,
    openHeaderAction,
    closeHeaderAction,
    headerControls,
    setHeaderControls,
  }), [bumpReloadDataToken, closeHeaderAction, headerAction, headerActionOpen, headerControls, mode, openHeaderAction, reloadDataToken, toggleMode, user]);

  const router = useMemo(() => createBrowserRouter([
    { path: '/login', element: withRouteLoader(<LoginPage />) },
    {
      path: '/',
      element: withRouteLoader(<PrivateLayout />),
      children: [
        { index: true, element: <Navigate to="/templates" replace /> },
        { path: 'templates', element: withRouteLoader(<TemplatesPage />) },
        { path: 'templates/edit/:code', element: withRouteLoader(<TemplatesPage />) },
        { path: 'templates/preview/:code', element: withRouteLoader(<TemplatesPage />) },
        { path: 'api-keys', element: withRouteLoader(<ApiKeysPage />) },
        { path: 'tags', element: withRouteLoader(<TagsPage />) },
        { path: 'users', element: withRouteLoader(<UsersPage />) },
        { path: 'permissions', element: withRouteLoader(<PermissionsPage />) },
        { path: 'audit-logs', element: withRouteLoader(<AuditLogsPage />) },
      ],
    },
    { path: '*', element: <Navigate to={user ? '/templates' : '/login'} replace /> },
  ]), [user]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {loading ? (
        <AppBootLoader />
      ) : (
        <AppContext.Provider value={contextValue}>
          <RouterProvider router={router} />
        </AppContext.Provider>
      )}
    </ThemeProvider>
  );
}
