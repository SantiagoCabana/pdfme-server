import { useMemo, type ReactNode } from 'react';
import { Link as RouterLink, Navigate, useLocation, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Avatar,
  Box,
  Button,
  Chip,
  Container,
  Divider,
  IconButton,
  Paper,
  Typography,
} from '@mui/material';
import {
  ArrowLeftOutlined,
  DesktopOutlined,
  LogoutOutlined,
  MoonOutlined,
  SunOutlined,
} from '@ant-design/icons';

import { useAppContext } from '../../app/AppContext';
import { apiRequest } from '../../shared/api/client';
import { AppLogo } from '../../layout/AppLogo';
import { defaultDocumentationSlug, documentationArticles, findDocumentationArticle } from './docsRegistry';

function markdownComponents() {
  return {
    h1: ({ children }: { children?: ReactNode }) => <Typography component="h1" variant="h2" className="docs-markdown-h1">{children}</Typography>,
    h2: ({ children }: { children?: ReactNode }) => <Typography component="h2" variant="h4" className="docs-markdown-h2">{children}</Typography>,
    h3: ({ children }: { children?: ReactNode }) => <Typography component="h3" variant="h5" className="docs-markdown-h3">{children}</Typography>,
    p: ({ children }: { children?: ReactNode }) => <Typography component="p" variant="body1" className="docs-markdown-p">{children}</Typography>,
    ul: ({ children }: { children?: ReactNode }) => <Box component="ul" className="docs-markdown-list">{children}</Box>,
    ol: ({ children }: { children?: ReactNode }) => <Box component="ol" className="docs-markdown-list">{children}</Box>,
    li: ({ children }: { children?: ReactNode }) => <Typography component="li" variant="body1" className="docs-markdown-li">{children}</Typography>,
    hr: () => <Divider sx={{ my: 4 }} />,
    table: ({ children }: { children?: ReactNode }) => (
      <Box className="docs-markdown-tableWrap">
        <table className="docs-markdown-table">{children}</table>
      </Box>
    ),
    th: ({ children }: { children?: ReactNode }) => <th className="docs-markdown-th">{children}</th>,
    td: ({ children }: { children?: ReactNode }) => <td className="docs-markdown-td">{children}</td>,
    a: ({ href, children }: { href?: string; children?: ReactNode }) => (
      <Box component="a" href={href} target={href?.startsWith('http') ? '_blank' : undefined} rel="noreferrer" className="docs-markdown-link">
        {children}
      </Box>
    ),
    code: ({ className, children }: { className?: string; children?: ReactNode }) => {
      const isBlock = Boolean(className);
      return isBlock ? (
        <code className={className}>{children}</code>
      ) : (
        <Box component="code" className="docs-markdown-inlineCode">{children}</Box>
      );
    },
    pre: ({ children }: { children?: ReactNode }) => (
      <Paper component="pre" variant="outlined" className="docs-markdown-pre">
        {children}
      </Paper>
    ),
    blockquote: ({ children }: { children?: ReactNode }) => (
      <Paper variant="outlined" className="docs-markdown-quote">
        {children}
      </Paper>
    ),
  };
}

export function DocumentationPage() {
  const { user, setUser, mode, themePreference, toggleMode } = useAppContext();
  const location = useLocation();
  const navigate = useNavigate();

  const slug = useMemo(() => {
    const trimmed = location.pathname.replace(/^\/documentation\/?/, '').replace(/\/+$/, '');
    return trimmed || defaultDocumentationSlug;
  }, [location.pathname]);

  const activeArticle = useMemo(() => findDocumentationArticle(slug), [slug]);

  if (!user) return <Navigate to="/login" replace />;
  if (!activeArticle) return <Navigate to={`/documentation/${defaultDocumentationSlug}`} replace />;

  const themeModeLabel = themePreference === 'system' ? `Sistema (${mode === 'dark' ? 'oscuro' : 'claro'})` : themePreference === 'dark' ? 'Oscuro' : 'Claro';
  const themeModeIcon = themePreference === 'system' ? <DesktopOutlined /> : themePreference === 'dark' ? <MoonOutlined /> : <SunOutlined />;

  async function logout() {
    await apiRequest('/api/auth/logout', { method: 'POST' }).catch(() => undefined);
    setUser(null);
    navigate('/login', { replace: true });
  }

  return (
    <Box className="docs-shell">
      <Box component="header" className="docs-topbar">
        <Container maxWidth="xl" className="docs-topbarInner">
          <RouterLink to="/templates" className="logo-link docs-logoLink">
            <AppLogo />
          </RouterLink>

          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }} className="docs-topbarActions">
            <Button component={RouterLink} to="/templates" startIcon={<ArrowLeftOutlined />} color="inherit" variant="text">
              Volver
            </Button>
            <IconButton color="secondary" onClick={toggleMode} size="small" title={`Modo ${themeModeLabel}`}>
              {themeModeIcon}
            </IconButton>
            <Avatar sx={{ width: 34, height: 34 }}>{user.displayName.slice(0, 1).toUpperCase()}</Avatar>
            <IconButton color="secondary" onClick={logout} size="small" title="Cerrar sesión">
              <LogoutOutlined />
            </IconButton>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ py: { xs: 3, md: 5 } }}>
        <Box className="docs-pageHeader">
          <Box>
            <Typography variant="overline" color="text.secondary">Documentacion</Typography>
            <Typography variant="h3" className="docs-title">Uso de la aplicacion y API</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 820 }}>
              Guias para usuarios internos y desarrolladores que integran plantillas por API.
            </Typography>
          </Box>
          <Chip label={`/documentation/${activeArticle.slug}`} variant="outlined" />
        </Box>
        <Box className="docs-layout">
          <Paper variant="outlined" className="docs-navPanel">
            <Typography variant="subtitle2" className="docs-navCaption">
              Contenido
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {documentationArticles.map((article) => {
                const selected = article.slug === activeArticle.slug;
                return (
                  <Box
                    component={RouterLink}
                    key={article.slug}
                    to={`/documentation/${article.slug}`}
                    className={`docs-navLink${selected ? ' is-active' : ''}`}
                  >
                    <Typography variant="subtitle2">{article.title}</Typography>
                    <Typography variant="caption" color="text.secondary">{article.category}</Typography>
                  </Box>
                );
              })}
            </Box>
          </Paper>

          <Paper variant="outlined" className="docs-content">
            <Box className="docs-markdown">
              <ReactMarkdown components={markdownComponents()} remarkPlugins={[remarkGfm]}>
                {activeArticle.content}
              </ReactMarkdown>
            </Box>
          </Paper>
        </Box>
      </Container>
    </Box>
  );
}

export default DocumentationPage;
