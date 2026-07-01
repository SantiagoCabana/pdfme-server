import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Navigate, RouterProvider, createBrowserRouter } from 'react-router-dom';
import { CssBaseline, ThemeProvider } from '@mui/material';
import '@fontsource/public-sans/400.css';
import '@fontsource/public-sans/500.css';
import '@fontsource/public-sans/600.css';
import '@fontsource/public-sans/700.css';

import { AppContext } from './app/AppContext';
import type { SessionUser } from './app/types';
import { LoginPage } from './features/auth/LoginPage';
import { ApiKeysPage } from './features/api-keys/ApiKeysPage';
import { TemplatesPage } from './features/templates/TemplatesPage';
import { UsersPage } from './features/users/UsersPage';
import { TagsPage } from './features/tags/TagsPage';
import { PrivateLayout } from './layout/PrivateLayout';
import { apiRequest } from './shared/api/client';
import { createMantisTheme, type ThemeMode } from './theme/mantisTheme';
import './App.css';

export default function App() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [reloadDataToken, setReloadDataToken] = useState(0);
  const [headerAction, setHeaderAction] = useState<{ label: string; title?: string; content: ReactNode; maxWidth?: 'xs' | 'sm' | 'md' | 'lg' } | null>(null);
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
  const contextValue = useMemo(() => ({
    user,
    setUser,
    reloadDataToken,
    bumpReloadDataToken: () => setReloadDataToken((value) => value + 1),
    mode,
    toggleMode: () => setMode((value) => value === 'dark' ? 'light' : 'dark'),
    headerAction,
    setHeaderAction,
  }), [headerAction, mode, reloadDataToken, user]);

  const router = useMemo(() => createBrowserRouter([
    { path: '/login', element: <LoginPage /> },
    {
      path: '/',
      element: <PrivateLayout />,
      children: [
        { index: true, element: <Navigate to="/templates" replace /> },
        { path: 'templates', element: <TemplatesPage /> },
        { path: 'api-keys', element: <ApiKeysPage /> },
        { path: 'tags', element: <TagsPage /> },
        { path: 'users', element: <UsersPage /> },
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
