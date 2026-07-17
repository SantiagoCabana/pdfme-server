import { lazy, Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useState, type ReactNode } from 'react';
import { Navigate, RouterProvider, createBrowserRouter } from 'react-router-dom';
import { CssBaseline, ThemeProvider } from '@mui/material';
import '@fontsource/public-sans/400.css';
import '@fontsource/public-sans/500.css';
import '@fontsource/public-sans/600.css';
import '@fontsource/public-sans/700.css';
import 'simplebar-react/dist/simplebar.min.css';

import { AppContext, type HeaderAction } from './app/AppContext';
import type { SessionUser } from './app/types';
import { apiRequest } from './shared/api/client';
import { AppBootLoader } from './shared/components/LoadingState';
import { createAppTheme, type ThemeMode, type ThemePreference } from './theme/appTheme';
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

function readThemePreference(): ThemePreference {
  const saved = localStorage.getItem('pdfme-theme');
  return saved === 'light' || saved === 'dark' ? saved : 'system';
}

function resolveSystemMode(): ThemeMode {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function withRouteLoader(element: ReactNode) {
  return (
    <Suspense fallback={null}>
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
  const [operationLabel, setOperationLabelState] = useState('');
  const [themePreference, setThemePreference] = useState<ThemePreference>(readThemePreference);
  const [systemMode, setSystemMode] = useState<ThemeMode>(resolveSystemMode);
  const mode = themePreference === 'system' ? systemMode : themePreference;

  useLayoutEffect(() => {
    document.documentElement.dataset.theme = mode;
  }, [mode]);

  useEffect(() => {
    if (themePreference === 'system') {
      localStorage.removeItem('pdfme-theme');
    } else {
      localStorage.setItem('pdfme-theme', themePreference);
    }
  }, [themePreference]);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const update = () => setSystemMode(media.matches ? 'dark' : 'light');

    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    apiRequest<{ user: SessionUser }>('/api/auth/me')
      .then((payload) => setUser(payload.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const theme = useMemo(() => createAppTheme(mode), [mode]);
  const bumpReloadDataToken = useCallback(() => setReloadDataToken((value) => value + 1), []);
  const toggleMode = useCallback(() => {
    setThemePreference((value) => {
      if (value === 'system') return 'light';
      if (value === 'light') return 'dark';
      return 'system';
    });
  }, []);
  const openHeaderAction = useCallback(() => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    setHeaderActionOpen(true);
  }, []);
  const closeHeaderAction = useCallback(() => setHeaderActionOpen(false), []);
  const setOperationLabel = useCallback((label: string) => setOperationLabelState(label), []);
  const clearOperationLabel = useCallback(() => setOperationLabelState(''), []);

  const contextValue = useMemo(() => ({
    user,
    setUser,
    reloadDataToken,
    bumpReloadDataToken,
    mode,
    themePreference,
    toggleMode,
    headerAction,
    setHeaderAction,
    headerActionOpen,
    openHeaderAction,
    closeHeaderAction,
    headerControls,
    setHeaderControls,
    operationLabel,
    setOperationLabel,
    clearOperationLabel,
  }), [bumpReloadDataToken, clearOperationLabel, closeHeaderAction, headerAction, headerActionOpen, headerControls, mode, openHeaderAction, operationLabel, reloadDataToken, setOperationLabel, themePreference, toggleMode, user]);

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
          <RouterProvider future={{ v7_startTransition: true }} router={router} />
        </AppContext.Provider>
      )}
    </ThemeProvider>
  );
}
