import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Navigate, RouterProvider, createBrowserRouter } from 'react-router-dom';
import { CssBaseline, ThemeProvider } from '@mui/material';
import '@fontsource/public-sans/400.css';
import '@fontsource/public-sans/500.css';
import '@fontsource/public-sans/600.css';
import '@fontsource/public-sans/700.css';

import { AppContext, type HeaderAction } from './app/AppContext';
import type { SessionUser } from './app/types';
import { LoginPage } from './features/auth/LoginPage';
import { ApiKeysPage } from './features/api-keys/ApiKeysPage';
import { TemplatesPage } from './features/templates/TemplatesPage';
import { UsersPage } from './features/users/UsersPage';
import { TagsPage } from './features/tags/TagsPage';
import { PermissionsPage } from './features/permissions/PermissionsPage';
import { AuditLogsPage } from './features/audit-logs/AuditLogsPage';
import { PrivateLayout } from './layout/PrivateLayout';
import { apiRequest } from './shared/api/client';
import { createMantisTheme, type ThemeMode } from './theme/mantisTheme';
import 'gridjs/dist/theme/mermaid.css';
import './styles/app.css';

export default function App() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [reloadDataToken, setReloadDataToken] = useState(0);
  const [headerAction, setHeaderAction] = useState<HeaderAction>(null);
  const [headerActionOpen, setHeaderActionOpen] = useState(false);
  const [headerControls, setHeaderControls] = useState<ReactNode>(null);
  const [mode, setMode] = useState<ThemeMode>(() => localStorage.getItem('pdfme-theme') === 'dark' ? 'dark' : 'light');

  useEffect(() => {
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
    { path: '/login', element: <LoginPage /> },
    {
      path: '/',
      element: <PrivateLayout />,
      children: [
        { index: true, element: <Navigate to="/templates" replace /> },
        { path: 'templates', element: <TemplatesPage /> },
        { path: 'templates/edit/:code', element: <TemplatesPage /> },
        { path: 'templates/preview/:code', element: <TemplatesPage /> },
        { path: 'api-keys', element: <ApiKeysPage /> },
        { path: 'tags', element: <TagsPage /> },
        { path: 'users', element: <UsersPage /> },
        { path: 'permissions', element: <PermissionsPage /> },
        { path: 'audit-logs', element: <AuditLogsPage /> },
      ],
    },
    { path: '*', element: <Navigate to={user ? '/templates' : '/login'} replace /> },
  ]), [user]);

  if (loading) return null;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppContext.Provider value={contextValue}>
        <RouterProvider router={router} />
      </AppContext.Provider>
    </ThemeProvider>
  );
}
