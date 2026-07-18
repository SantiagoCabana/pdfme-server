import { useEffect, useMemo, useState } from 'react';
import { Link as RouterLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Avatar,
  Backdrop,
  Box,
  Button,
  CircularProgress,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  ApiOutlined,
  FileTextOutlined,
  HistoryOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  MoonOutlined,
  ReadOutlined,
  DesktopOutlined,
  SafetyCertificateOutlined,
  SunOutlined,
  TagsOutlined,
  UserOutlined,
} from '@ant-design/icons';

import { useAppContext } from '../app/AppContext';
import { can } from '../app/session';
import { apiRequest } from '../shared/api/client';
import { AppScrollbar } from '../shared/components/AppScrollbar';
import { AppFormDialog } from '../shared/components/AppFormDialog';
import { AppLogo } from './AppLogo';

const drawerWidth = 260;
const miniDrawerWidth = 72;

export function PrivateLayout() {
  const { user, setUser, mode, themePreference, toggleMode, headerAction, headerActionOpen, openHeaderAction, closeHeaderAction, headerControls, setHeaderControls, operationLabel } = useAppContext();
  const theme = useTheme();
  const downLg = useMediaQuery(theme.breakpoints.down('lg'));
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(!downLg);

  const items = useMemo(() => [
    { path: '/templates', label: 'Plantillas', icon: <FileTextOutlined />, visible: can(user, 'templates.view') },
    { path: '/api-keys', label: 'Claves API', icon: <ApiOutlined />, visible: can(user, 'api_keys.manage') },
    { path: '/tags', label: 'Tags', icon: <TagsOutlined />, visible: can(user, 'templates.edit') },
    { path: '/users', label: 'Usuarios', icon: <UserOutlined />, visible: can(user, 'users.manage') },
    { path: '/audit-logs', label: 'Auditoría', icon: <HistoryOutlined />, visible: can(user, 'audit.view') },
    { path: '/permissions', label: 'Permisos', icon: <SafetyCertificateOutlined />, visible: can(user, 'users.manage') },
  ], [user]);

  const currentSegment = location.pathname.split('/')[1] || '';

  useEffect(() => {
    closeHeaderAction();
  }, [closeHeaderAction, location.pathname]);

  useEffect(() => {
    setHeaderControls(null);
  }, [currentSegment, setHeaderControls]);

  const activeItem = items.find((item) => (
    location.pathname === item.path || location.pathname.startsWith(`${item.path}/`) || (location.pathname === '/' && item.path === '/templates')
  ));
  const isTemplateWorkspace = location.pathname.startsWith('/templates/edit/') || location.pathname.startsWith('/templates/preview/');

  if (!user) return <Navigate to="/login" replace />;

  const collapsed = !open && !downLg;
  const currentDrawerWidth = collapsed ? miniDrawerWidth : drawerWidth;
  const sidebarTransition = theme.transitions.create(['width', 'margin', 'opacity', 'padding'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  });

  async function logout() {
    await apiRequest('/api/auth/logout', { method: 'POST' }).catch(() => undefined);
    setUser(null);
    navigate('/login', { replace: true });
  }

  const themeModeLabel = themePreference === 'system' ? `Sistema (${mode === 'dark' ? 'oscuro' : 'claro'})` : themePreference === 'dark' ? 'Oscuro' : 'Claro';
  const themeModeIcon = themePreference === 'system' ? <DesktopOutlined /> : themePreference === 'dark' ? <MoonOutlined /> : <SunOutlined />;
  const documentationSelected = location.pathname.startsWith('/documentation');
  const documentationButtonSx = {
    borderRadius: 1.25,
    minHeight: 38,
    width: '100%',
    px: collapsed ? 0 : 1.25,
    justifyContent: collapsed ? 'center' : 'flex-start',
    color: documentationSelected ? 'primary.main' : 'text.secondary',
    border: `1px solid ${documentationSelected ? theme.palette.primary.main : theme.palette.divider}`,
    bgcolor: documentationSelected ? 'rgba(22, 119, 255, 0.09)' : 'transparent',
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
            <RouterLink aria-label="Logo" to="/templates" className="logo-link">
              <Box sx={{ display: 'grid', placeItems: 'start', width: 178, overflow: 'hidden', transition: sidebarTransition }}><AppLogo /></Box>
            </RouterLink>
            <Tooltip title="Ocultar sidebar">
              <IconButton color="secondary" onClick={() => setOpen(false)} size="small" sx={{ display: { xs: 'none', lg: 'inline-flex' }, flexShrink: 0, mr: -0.5 }}>
                <MenuFoldOutlined />
              </IconButton>
            </Tooltip>
          </>
        )}
      </Box>
      <Divider />
      <AppScrollbar sx={{ flex: 1 }}>
        <List sx={{ py: 0.5 }}>
          {items.filter((item) => item.visible).map((item) => {
            const selected = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`) || (location.pathname === '/' && item.path === '/templates');
            return (
              <Tooltip disableHoverListener={!collapsed} key={item.path} placement="right" title={item.label}>
                <ListItemButton
                  component={RouterLink}
                  selected={selected}
                  target="_self"
                  to={item.path}
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
                    '&.Mui-selected:hover': {
                      bgcolor: 'rgba(22, 119, 255, 0.09)',
                    },
                    '& .MuiListItemIcon-root': { color: 'inherit' },
                    '& .MuiTypography-root': { color: 'inherit', fontWeight: selected ? 500 : 400 },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: collapsed ? 0 : 36, width: collapsed ? 36 : 36, color: 'inherit', fontSize: 16, justifyContent: 'center', mx: collapsed ? 'auto' : 0, transition: sidebarTransition }}>{item.icon}</ListItemIcon>
                  {!collapsed ? (
                    <ListItemText
                      primary={<Typography variant="h6" color="inherit" noWrap>{item.label}</Typography>}
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
        </List>
      </AppScrollbar>

      <Divider />
      <Box sx={{ p: collapsed ? 1 : 1.5, transition: sidebarTransition }}>
        <Tooltip disableHoverListener={!collapsed} placement="right" title="Documentación">
          <ListItemButton
            component={RouterLink}
            selected={documentationSelected}
            target="_self"
            to="/documentation/getting-started"
            sx={{ ...documentationButtonSx, mb: 1 }}
          >
            <ListItemIcon sx={{ minWidth: collapsed ? 0 : 34, width: 34, color: 'inherit', fontSize: 16, justifyContent: 'center', mx: collapsed ? 'auto' : 0 }}>
              <ReadOutlined />
            </ListItemIcon>
            {!collapsed ? (
              <ListItemText
                primary={<Typography variant="h6" color="inherit" noWrap>Documentación</Typography>}
                sx={{ m: 0, minWidth: 0, '& .MuiTypography-root': { color: 'inherit', fontWeight: documentationSelected ? 500 : 400 } }}
              />
            ) : null}
          </ListItemButton>
        </Tooltip>
        {collapsed ? (
          <Box sx={{ display: 'grid', gap: 1, justifyItems: 'center' }}>
            <Tooltip placement="right" title={`Modo ${themeModeLabel}`}>
              <IconButton color="secondary" onClick={toggleMode} sx={{ width: 40, height: 40 }}>
                {themeModeIcon}
              </IconButton>
            </Tooltip>
            <Tooltip placement="right" title={user.email}>
              <Avatar sx={{ width: 34, height: 34 }}>{user.displayName.slice(0, 1).toUpperCase()}</Avatar>
            </Tooltip>
          </Box>
        ) : (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'auto minmax(0, 1fr) auto auto',
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
            <Tooltip title={`Modo ${themeModeLabel}`}>
              <IconButton color="secondary" onClick={toggleMode} size="small">
                {themeModeIcon}
              </IconButton>
            </Tooltip>
            <Tooltip title="Cerrar sesion">
              <IconButton color="secondary" onClick={logout} size="small"><LogoutOutlined /></IconButton>
            </Tooltip>
          </Box>
        )}
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar
        color="inherit"
        elevation={0}
        position="fixed"
        sx={{
          borderBottom: `1px solid ${theme.palette.divider}`,
          ml: { lg: `${currentDrawerWidth}px` },
          width: { lg: `calc(100% - ${currentDrawerWidth}px)` },
          transition: sidebarTransition,
        }}
      >
        <Toolbar sx={{ minHeight: '58px !important', gap: 1.25, px: { xs: 2, md: 2.5 } }}>
          <IconButton aria-label="open drawer" color="secondary" edge="start" onClick={() => setOpen((value) => !value)} sx={{ display: { xs: 'inline-flex', lg: 'none' } }}>
            {open ? <MenuFoldOutlined /> : <MenuUnfoldOutlined />}
          </IconButton>
          {headerControls ? <Box sx={{ display: 'flex', flex: 1, minWidth: 0, width: '100%' }}>{headerControls}</Box> : (
            <>
              <Typography
                color="text.primary"
                noWrap
                sx={{
                  fontWeight: 700,
                  fontSize: '1.45rem',
                  minWidth: { xs: 0, md: 180 },
                  display: { xs: 'none', sm: 'block' },
                  letterSpacing: '-0.02em',
                }}
              >
                {activeItem?.label ?? 'Plantillas'}
              </Typography>
              <Box sx={{ flexGrow: 1 }} />
              {headerAction ? (
                <Button
                  disabled={headerAction.disabled}
                  onClick={headerAction.onClick ? headerAction.onClick : openHeaderAction}
                  size="medium"
                  variant="contained"
                  sx={{
                    borderRadius: '6px',
                    px: 3,
                    py: 0.75,
                    fontWeight: 600,
                    boxShadow: '0 2px 4px rgba(22, 119, 255, 0.2)',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      transform: 'translateY(-1px)',
                      boxShadow: '0 4px 8px rgba(22, 119, 255, 0.3)',
                    }
                  }}
                >
                  {headerAction.label}
                </Button>
              ) : null}
            </>
          )}
        </Toolbar>
      </AppBar>
      <AppFormDialog
        actions={headerAction?.contentActions}
        maxWidth={headerAction?.maxWidth ?? 'sm'}
        onClose={closeHeaderAction}
        open={Boolean(headerAction && headerActionOpen)}
        title={headerAction?.title}
      >
        {headerAction?.content}
      </AppFormDialog>
      <Backdrop
        open={Boolean(operationLabel)}
        sx={{
          bgcolor: 'rgba(0, 0, 0, 0.68)',
          color: '#fff',
          zIndex: (theme) => theme.zIndex.modal + 20,
        }}
      >
        <Box sx={{ alignItems: 'center', display: 'grid', gap: 1.5, justifyItems: 'center' }}>
          <CircularProgress color="inherit" size={34} thickness={4} />
          <Typography sx={{ fontSize: '0.875rem', fontWeight: 700 }}>{operationLabel}</Typography>
        </Box>
      </Backdrop>
      <Box component="nav" sx={{ width: { lg: currentDrawerWidth }, flexShrink: { lg: 0 }, transition: sidebarTransition }}>
        <Drawer
          ModalProps={{ keepMounted: true }}
          onClose={() => setOpen(false)}
          open={downLg ? open : true}
          variant={downLg ? 'temporary' : 'permanent'}
          slotProps={{ paper: { elevation: 0, sx: { width: currentDrawerWidth, overflowX: 'hidden', borderRight: `1px solid ${theme.palette.divider}`, transition: sidebarTransition } } }}
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minWidth: 0,
          px: isTemplateWorkspace ? 0 : { xs: 1.25, sm: 1.5, md: 2 },
          pb: isTemplateWorkspace ? 0 : { xs: 1.25, sm: 1.5, md: 2 },
          pt: isTemplateWorkspace ? '58px' : { xs: '70px', md: '74px' },
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box',
          overflow: 'hidden',
          transition: sidebarTransition,
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}
