import { useMemo } from 'react';
import { Link as RouterLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { ApiOutlined, FileTextOutlined, LogoutOutlined, MoonOutlined, SunOutlined, UserOutlined } from '@ant-design/icons';

import { useAppContext } from '../app/AppContext';
import { can } from '../app/session';
import { apiRequest } from '../shared/api/client';

const drawerWidth = 280;

export function PrivateLayout() {
  const { user, setUser, mode, toggleMode } = useAppContext();
  const theme = useTheme();
  const downLg = useMediaQuery(theme.breakpoints.down('lg'));
  const location = useLocation();
  const navigate = useNavigate();

  const items = useMemo(() => [
    { path: '/templates', label: 'Plantillas', icon: <FileTextOutlined />, visible: can(user, 'templates.view') },
    { path: '/api-keys', label: 'Claves API', icon: <ApiOutlined />, visible: can(user, 'api_keys.manage') },
    { path: '/users', label: 'Usuarios', icon: <UserOutlined />, visible: can(user, 'users.manage') },
  ], [user]);

  if (!user) return <Navigate to="/login" replace />;

  async function logout() {
    await apiRequest('/api/auth/logout', { method: 'POST' }).catch(() => undefined);
    setUser(null);
    navigate('/login', { replace: true });
  }

  const drawer = (
    <Stack sx={{ height: '100%', bgcolor: 'background.paper' }}>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', px: 3, py: 2.5 }}>
        <Avatar variant="rounded" sx={{ bgcolor: 'primary.main', fontWeight: 700 }}>PS</Avatar>
        <Box>
          <Typography variant="h5">Pdfme Server</Typography>
          <Typography variant="caption" color="text.secondary">Panel operativo</Typography>
        </Box>
      </Stack>
      <Divider />
      <List sx={{ px: 2, py: 2 }}>
        {items.filter((item) => item.visible).map((item) => {
          const selected = location.pathname === item.path || (location.pathname === '/' && item.path === '/templates');
          return (
            <ListItemButton
              component={RouterLink}
              key={item.path}
              selected={selected}
              to={item.path}
              sx={{ borderRadius: 1.5, mb: 0.5 }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          );
        })}
      </List>
      <Box sx={{ flexGrow: 1 }} />
      <Box sx={{ p: 2 }}>
        <Stack spacing={1.5} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 2, p: 1.5 }}>
          <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
            <Avatar sx={{ width: 34, height: 34 }}>{user.displayName.slice(0, 1).toUpperCase()}</Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="subtitle2" noWrap>{user.displayName}</Typography>
              <Typography variant="caption" color="text.secondary" noWrap>{user.email}</Typography>
            </Box>
          </Stack>
          <Button color="secondary" onClick={logout} startIcon={<LogoutOutlined />} variant="outlined">Cerrar sesion</Button>
        </Stack>
      </Box>
    </Stack>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar color="inherit" elevation={0} position="fixed" sx={{ borderBottom: `1px solid ${theme.palette.divider}`, ml: { lg: `${drawerWidth}px` }, width: { lg: `calc(100% - ${drawerWidth}px)` } }}>
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h6" color="text.primary">Operacion interna</Typography>
            <Typography variant="caption" color="text.secondary">Plantillas, usuarios y credenciales API</Typography>
          </Box>
          <IconButton color="primary" onClick={toggleMode}>{mode === 'dark' ? <MoonOutlined /> : <SunOutlined />}</IconButton>
        </Toolbar>
      </AppBar>
      <Box component="nav" sx={{ width: { lg: drawerWidth }, flexShrink: { lg: 0 } }}>
        <Drawer
          open
          variant={downLg ? 'temporary' : 'permanent'}
          slotProps={{ paper: { sx: { width: drawerWidth, borderRight: `1px solid ${theme.palette.divider}` } } }}
        >
          {drawer}
        </Drawer>
      </Box>
      <Box component="main" sx={{ flexGrow: 1, minWidth: 0, p: { xs: 2, md: 3 }, pt: { xs: 11, md: 12 } }}>
        <Outlet />
      </Box>
    </Box>
  );
}
