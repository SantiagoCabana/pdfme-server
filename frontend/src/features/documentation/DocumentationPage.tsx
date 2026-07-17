import { useMemo, useState, type ReactNode } from 'react';
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
  InputAdornment,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  DesktopOutlined,
  LogoutOutlined,
  MoonOutlined,
  SearchOutlined,
  SunOutlined,
} from '@ant-design/icons';

import { useAppContext } from '../../app/AppContext';
import { AppLogo } from '../../layout/AppLogo';
import { apiRequest } from '../../shared/api/client';
import { defaultDocumentationSlug, documentationArticles, findDocumentationArticle } from './docsRegistry';

function markdownComponents() {
  return {
    h1: ({ children }: { children?: ReactNode }) => <Typography component="h1" className="docs-md-h1">{children}</Typography>,
    h2: ({ children }: { children?: ReactNode }) => <Typography component="h2" className="docs-md-h2">{children}</Typography>,
    h3: ({ children }: { children?: ReactNode }) => <Typography component="h3" className="docs-md-h3">{children}</Typography>,
    p: ({ children }: { children?: ReactNode }) => <Typography component="p" className="docs-md-p">{children}</Typography>,
    ul: ({ children }: { children?: ReactNode }) => <Box component="ul" className="docs-md-list">{children}</Box>,
    ol: ({ children }: { children?: ReactNode }) => <Box component="ol" className="docs-md-list">{children}</Box>,
    li: ({ children }: { children?: ReactNode }) => <Typography component="li" className="docs-md-li">{children}</Typography>,
    hr: () => <Divider className="docs-md-divider" />,
    table: ({ children }: { children?: ReactNode }) => <Box className="docs-md-tableWrap"><table className="docs-md-table">{children}</table></Box>,
    th: ({ children }: { children?: ReactNode }) => <th>{children}</th>,
    td: ({ children }: { children?: ReactNode }) => <td>{children}</td>,
    a: ({ href, children }: { href?: string; children?: ReactNode }) => href?.startsWith('/')
      ? <RouterLink to={href} className="docs-md-link">{children}</RouterLink>
      : <a href={href} className="docs-md-link">{children}</a>,
    code: ({ className, children }: { className?: string; children?: ReactNode }) => className
      ? <code className={className}>{children}</code>
      : <code className="docs-md-inlineCode">{children}</code>,
    pre: ({ children }: { children?: ReactNode }) => <pre className="docs-md-pre">{children}</pre>,
    blockquote: ({ children }: { children?: ReactNode }) => <aside className="docs-md-callout">{children}</aside>,
  };
}

export function DocumentationPage() {
  const { user, setUser, mode, themePreference, toggleMode } = useAppContext();
  const location = useLocation();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const slug = useMemo(() => {
    const value = location.pathname.replace(/^\/documentation\/?/, '').replace(/\/+$/, '');
    return value || defaultDocumentationSlug;
  }, [location.pathname]);

  const activeArticle = useMemo(() => findDocumentationArticle(slug), [slug]);
  const filteredArticles = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('es');
    if (!normalized) return documentationArticles;
    return documentationArticles.filter((article) =>
      `${article.title} ${article.description} ${article.content}`.toLocaleLowerCase('es').includes(normalized),
    );
  }, [query]);

  if (!user) return <Navigate to="/login" replace />;
  if (!activeArticle) return <Navigate to={`/documentation/${defaultDocumentationSlug}`} replace />;

  const articleIndex = documentationArticles.findIndex((article) => article.slug === activeArticle.slug);
  const previousArticle = documentationArticles[articleIndex - 1];
  const nextArticle = documentationArticles[articleIndex + 1];
  const themeLabel = themePreference === 'system' ? `Sistema (${mode})` : themePreference;
  const themeIcon = themePreference === 'system' ? <DesktopOutlined /> : themePreference === 'dark' ? <MoonOutlined /> : <SunOutlined />;

  async function logout() {
    await apiRequest('/api/auth/logout', { method: 'POST' }).catch(() => undefined);
    setUser(null);
    navigate('/login', { replace: true });
  }

  return (
    <Box className="docs-shell">
      <Box component="header" className="docs-header">
        <Container maxWidth={false} className="docs-headerInner">
          <RouterLink to="/documentation/getting-started" className="docs-brand">
            <AppLogo />
            <Chip label="Docs" size="small" color="primary" variant="outlined" />
          </RouterLink>
          <Box className="docs-headerActions">
            <Button component={RouterLink} to="/templates" color="inherit" startIcon={<ArrowLeftOutlined />} aria-label="Volver a la aplicación">
              Volver a la app
            </Button>
            <IconButton onClick={toggleMode} title={`Tema: ${themeLabel}`} color="inherit">{themeIcon}</IconButton>
            <Avatar className="docs-avatar">{user.displayName.slice(0, 1).toUpperCase()}</Avatar>
            <IconButton onClick={logout} title="Cerrar sesión" color="inherit"><LogoutOutlined /></IconButton>
          </Box>
        </Container>
      </Box>

      <Container maxWidth={false} className="docs-frame">
        <aside className="docs-sidebar" aria-label="Navegación de documentación">
          <TextField
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar..."
            size="small"
            fullWidth
            slotProps={{
              htmlInput: { 'aria-label': 'Buscar en la documentación' },
              input: { startAdornment: <InputAdornment position="start"><SearchOutlined /></InputAdornment> },
            }}
          />
          <Typography className="docs-sidebarLabel">Contenido</Typography>
          <nav className="docs-nav">
            {filteredArticles.map((article) => (
              <RouterLink
                key={article.slug}
                to={`/documentation/${article.slug}`}
                className={`docs-navItem${article.slug === activeArticle.slug ? ' is-active' : ''}`}
              >
                <span className="docs-navCategory">{article.category}</span>
                <strong>{article.title}</strong>
                <small>{article.description}</small>
              </RouterLink>
            ))}
            {filteredArticles.length === 0 && <Typography className="docs-emptySearch">Sin resultados para “{query}”.</Typography>}
          </nav>
        </aside>

        <main className="docs-main">
          <Box className="docs-breadcrumb">
            <span>Documentación</span><span>/</span><strong>{activeArticle.title}</strong>
          </Box>
          <Paper component="article" variant="outlined" className="docs-article">
            <ReactMarkdown components={markdownComponents()} remarkPlugins={[remarkGfm]}>
              {activeArticle.content}
            </ReactMarkdown>
          </Paper>

          <nav className="docs-pagination" aria-label="Paginación de documentación">
            {previousArticle ? (
              <RouterLink to={`/documentation/${previousArticle.slug}`} className="docs-pageLink docs-pageLink--previous">
                <ArrowLeftOutlined /><span><small>Anterior</small><strong>{previousArticle.title}</strong></span>
              </RouterLink>
            ) : <span />}
            {nextArticle ? (
              <RouterLink to={`/documentation/${nextArticle.slug}`} className="docs-pageLink docs-pageLink--next">
                <span><small>Siguiente</small><strong>{nextArticle.title}</strong></span><ArrowRightOutlined />
              </RouterLink>
            ) : <span />}
          </nav>
        </main>
      </Container>
    </Box>
  );
}

export default DocumentationPage;
