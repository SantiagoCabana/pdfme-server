import { useEffect, useState, type ReactNode } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  AppBar,
  Avatar,
  Box,
  Divider,
  Drawer,
  IconButton,
  InputAdornment,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  TextField,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  DesktopOutlined,
  GithubOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  MoonOutlined,
  SearchOutlined,
  SunOutlined,
} from '@ant-design/icons';

import type { SessionUser } from '../../app/types';
import type { ThemeMode, ThemePreference } from '../../theme/appTheme';
import { AppScrollbar } from '../../shared/components/AppScrollbar';
import { AppLogo } from '../../layout/AppLogo';
import { documentationArticles, type DocumentationArticle } from './docsRegistry';

const drawerWidth = 260;
const miniDrawerWidth = 72;

type DocumentationLayoutProps = {
  user: SessionUser;
  mode: ThemeMode;
  themePreference: ThemePreference;
  activeArticle: DocumentationArticle;
  filteredArticles: DocumentationArticle[];
  previousArticle?: DocumentationArticle;
  nextArticle?: DocumentationArticle;
  query: string;
  onQueryChange: (query: string) => void;
  onToggleMode: () => void;
  children: ReactNode;
};

export function DocumentationLayout({
  user,
  mode,
  themePreference,
  activeArticle,
  filteredArticles,
  previousArticle,
  nextArticle,
  query,
  onQueryChange,
  onToggleMode,
  children,
}: DocumentationLayoutProps) {
  const theme = useTheme();
  const downLg = useMediaQuery(theme.breakpoints.down('lg'));
  const [open, setOpen] = useState(!downLg);

  useEffect(() => {
    setOpen(!downLg);
  }, [downLg]);

  const collapsed = !open && !downLg;
  const currentDrawerWidth = collapsed ? miniDrawerWidth : drawerWidth;
  const sidebarTransition = theme.transitions.create(['width', 'margin', 'opacity', 'padding'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  });

  const themeLabel = themePreference === 'system'
    ? `Sistema (${mode === 'dark' ? 'oscuro' : 'claro'})`
    : themePreference === 'dark' ? 'Oscuro' : 'Claro';
  const themeIcon = themePreference === 'system' ? <DesktopOutlined /> : themePreference === 'dark' ? <MoonOutlined /> : <SunOutlined />;
  const returnButtonSx = {
    borderRadius: 1.25,
    minHeight: 38,
    width: '100%',
    px: collapsed ? 0 : 1.25,
    justifyContent: collapsed ? 'center' : 'flex-start',
    color: 'text.secondary',
    border: `1px solid ${theme.palette.divider}`,
    bgcolor: 'transparent',
    '&:hover': { bgcolor: 'action.hover' },
    '& .MuiListItemIcon-root': { color: 'inherit' },
  };

  const drawer = (
    <Box sx={{ height: '100%', width: currentDrawerWidth, bgcolor: 'background.paper', display: 'flex', flexDirection: 'column', overflowX: 'hidden', transition: sidebarTransition }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          height: 58,
          px: collapsed ? 0 : 3,
          justifyContent: collapsed ? 'center' : 'space-between',
          gap: collapsed ? 0 : 1.5,
          transition: sidebarTransition,
        }}
      >
        {collapsed ? (
          <Tooltip title="Mostrar sidebar">
            <Box
              aria-label="Mostrar sidebar"
              component="button"
              onClick={() => setOpen(true)}
              sx={{
                display: { xs: 'none', lg: 'grid' },
                placeItems: 'center',
                width: 40,
                height: 40,
                p: 0,
                border: 0,
                color: 'primary.dark',
                bgcolor: 'transparent',
                cursor: 'pointer',
                overflow: 'hidden',
                position: 'relative',
                transition: sidebarTransition,
                '& .logoMark': { opacity: 1, transform: 'scale(1)', transition: theme.transitions.create(['opacity', 'transform'], { duration: theme.transitions.duration.shorter }) },
                '& .toggleMark': { opacity: 0, transform: 'scale(0.86)', transition: theme.transitions.create(['opacity', 'transform'], { duration: theme.transitions.duration.shorter }) },
                '&:hover .logoMark, &:focus-visible .logoMark': { opacity: 0, transform: 'scale(0.86)' },
                '&:hover .toggleMark, &:focus-visible .toggleMark': { opacity: 1, transform: 'scale(1)' },
              }}
              type="button"
            >
              <Box className="logoMark" sx={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}><AppLogo showText={false} /></Box>
              <Box className="toggleMark" sx={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', fontSize: 20 }}><MenuUnfoldOutlined /></Box>
            </Box>
          </Tooltip>
        ) : (
          <>
            <RouterLink aria-label="Logo" to="/documentation/getting-started" className="logo-link">
              <Box sx={{ display: 'grid', placeItems: 'start', width: 178, overflow: 'hidden', transition: sidebarTransition }}><AppLogo /></Box>
            </RouterLink>
            <Tooltip title={downLg ? 'Cerrar sidebar' : 'Ocultar sidebar'}>
              <IconButton onClick={() => setOpen(false)} color="secondary" size="small" aria-label={downLg ? 'Cerrar sidebar' : 'Ocultar sidebar'} sx={{ display: { xs: 'inline-flex', lg: 'inline-flex' }, flexShrink: 0, mr: -0.5 }}>
                <MenuFoldOutlined />
              </IconButton>
            </Tooltip>
          </>
        )}
      </Box>
      <Divider />
      <AppScrollbar sx={{ flex: 1 }}>
        <List sx={{ py: 0.5 }}>
          {filteredArticles.map((article) => {
            const step = documentationArticles.findIndex((item) => item.slug === article.slug) + 1;
            const selected = article.slug === activeArticle.slug;
            return (
              <Tooltip disableHoverListener={!collapsed} key={article.slug} placement="right" title={article.title}>
                <ListItemButton
                  component={RouterLink}
                  selected={selected}
                  target="_self"
                  to={`/documentation/${article.slug}`}
                  onClick={() => downLg && setOpen(false)}
                  sx={{
                    borderRadius: 0,
                    minHeight: 40,
                    mb: 0,
                    width: '100%',
                    px: collapsed ? 0 : 2,
                    pl: collapsed ? 0 : 3.5,
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    color: selected ? 'primary.main' : 'text.secondary',
                    borderRight: '2px solid transparent',
                    '&:hover': { bgcolor: 'action.hover' },
                    '&.Mui-selected': {
                      bgcolor: 'rgba(22, 119, 255, 0.09)',
                      borderRightColor: 'primary.main',
                      color: 'primary.main',
                    },
                    '&.Mui-selected:hover': { bgcolor: 'rgba(22, 119, 255, 0.09)' },
                    '& .MuiListItemIcon-root': { color: 'inherit' },
                    '& .MuiTypography-root': { color: 'inherit', fontWeight: selected ? 500 : 400 },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: collapsed ? 0 : 36, width: 36, color: 'inherit', justifyContent: 'center', mx: collapsed ? 'auto' : 0, transition: sidebarTransition }}>
                    <Box component="span" sx={{ fontSize: 12, fontWeight: 700, lineHeight: 1 }}>{String(step).padStart(2, '0')}</Box>
                  </ListItemIcon>
                  {!collapsed ? (
                    <ListItemText
                      primary={<Typography variant="h6" color="inherit" noWrap>{article.title}</Typography>}
                      sx={{
                        m: 0,
                        width: 160,
                        minWidth: 0,
                        transformOrigin: 'left center',
                        overflow: 'hidden',
                        textAlign: 'left',
                        whiteSpace: 'nowrap',
                        transition: sidebarTransition,
                        '& .MuiTypography-root': { textAlign: 'left' },
                      }}
                    />
                  ) : null}
                </ListItemButton>
              </Tooltip>
            );
          })}
          {filteredArticles.length === 0 && !collapsed ? (
            <Typography sx={{ px: 3.5, py: 1.5, color: 'text.secondary', fontSize: 13 }}>Sin resultados para "{query}".</Typography>
          ) : null}
        </List>
      </AppScrollbar>
      <Divider />
      <Box sx={{ p: collapsed ? 1 : 1.5, transition: sidebarTransition }}>
        <Tooltip disableHoverListener={!collapsed} placement="right" title="Volver a la app">
          <ListItemButton
            component={RouterLink}
            target="_self"
            to="/templates"
            sx={{ ...returnButtonSx, mb: 1 }}
            aria-label="Volver a la app"
          >
            <ListItemIcon sx={{ minWidth: collapsed ? 0 : 34, width: 34, color: 'inherit', fontSize: 16, justifyContent: 'center', mx: collapsed ? 'auto' : 0 }}><ArrowLeftOutlined /></ListItemIcon>
            {!collapsed ? (
              <ListItemText primary={<Typography variant="h6" color="inherit" noWrap>Volver a la app</Typography>} sx={{ m: 0, minWidth: 0, '& .MuiTypography-root': { color: 'inherit', fontWeight: 400 } }} />
            ) : null}
          </ListItemButton>
        </Tooltip>
        <Tooltip disableHoverListener={!collapsed} placement="right" title="Repositorio">
          <ListItemButton
            component="a"
            href="https://github.com/SantiagoCabana/pdfme-server"
            rel="noreferrer"
            target="_blank"
            sx={{ ...returnButtonSx, mb: 1 }}
            aria-label="Repositorio"
          >
            <ListItemIcon sx={{ minWidth: collapsed ? 0 : 34, width: 34, color: 'inherit', fontSize: 16, justifyContent: 'center', mx: collapsed ? 'auto' : 0 }}><GithubOutlined /></ListItemIcon>
            {!collapsed ? (
              <ListItemText primary={<Typography variant="h6" color="inherit" noWrap>pdfme Server</Typography>} sx={{ m: 0, minWidth: 0, '& .MuiTypography-root': { color: 'inherit', fontWeight: 400 } }} />
            ) : null}
          </ListItemButton>
        </Tooltip>
        {collapsed ? (
          <Box sx={{ display: 'grid', gap: 1, justifyItems: 'center' }}>
            <Tooltip placement="right" title={`Modo ${themeLabel}`}>
              <IconButton onClick={onToggleMode} color="secondary" sx={{ width: 40, height: 40 }}>{themeIcon}</IconButton>
            </Tooltip>
            <Tooltip placement="right" title={user.email}>
              <Avatar sx={{ width: 34, height: 34 }}>{user.displayName.slice(0, 1).toUpperCase()}</Avatar>
            </Tooltip>
          </Box>
        ) : (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'auto minmax(0, 1fr) auto',
              alignItems: 'center',
              gap: 1,
              minHeight: 52,
              p: 1,
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 1.5,
              bgcolor: 'background.default',
            }}
          >
            <Avatar sx={{ width: 34, height: 34 }}>{user.displayName.slice(0, 1).toUpperCase()}</Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="subtitle2" noWrap>{user.displayName}</Typography>
              <Typography variant="caption" color="text.secondary" noWrap>{user.roles.join(', ') || user.email}</Typography>
            </Box>
            <Tooltip title={`Modo ${themeLabel}`}>
              <IconButton onClick={onToggleMode} color="secondary" size="small">{themeIcon}</IconButton>
            </Tooltip>
          </Box>
        )}
      </Box>
    </Box>
  );

  return (
    <Box className="docs-shell">
      <AppBar
        color="inherit"
        elevation={0}
        position="fixed"
        className="docs-header"
        sx={{ ml: { lg: `${currentDrawerWidth}px` }, width: { lg: `calc(100% - ${currentDrawerWidth}px)` }, transition: sidebarTransition }}
      >
        <Toolbar className="docs-headerInner">
          <IconButton aria-label="Abrir documentación" color="secondary" edge="start" onClick={() => setOpen((value) => !value)} sx={{ display: { lg: 'none' } }}>
            {open ? <MenuFoldOutlined /> : <MenuUnfoldOutlined />}
          </IconButton>
          <Typography className="docs-headerTitle" noWrap>{activeArticle.title}</Typography>
          <Box sx={{ flexGrow: 1 }} />
          <Box className="docs-headerActions">
            <TextField
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Buscar en documentación..."
              size="small"
              className="docs-headerSearch"
              slotProps={{
                htmlInput: { 'aria-label': 'Buscar en la documentación' },
                input: { startAdornment: <InputAdornment position="start"><SearchOutlined /></InputAdornment> },
              }}
            />
          </Box>
        </Toolbar>
      </AppBar>

      <Box component="nav" className="docs-navShell" sx={{ width: { lg: currentDrawerWidth }, transition: sidebarTransition }}>
        <Drawer
          ModalProps={{ keepMounted: true }}
          onClose={() => setOpen(false)}
          open={downLg ? open : true}
          variant={downLg ? 'temporary' : 'permanent'}
          className="docs-drawer"
          slotProps={{ paper: { elevation: 0, sx: { width: currentDrawerWidth, transition: sidebarTransition } } }}
        >
          {drawer}
        </Drawer>
      </Box>

      <Box component="main" className="docs-frame">
        <Box className="docs-main">
          <Box component="article" className="docs-article">
            {children}
          </Box>
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
        </Box>
      </Box>
    </Box>
  );
}
