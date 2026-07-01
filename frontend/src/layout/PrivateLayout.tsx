import { useMemo, useState } from 'react';
import { Link as RouterLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Avatar,
  Badge,
  Box,
  Divider,
  Drawer,
  IconButton,
  InputAdornment,
  Link,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  OutlinedInput,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  ApiOutlined,
  BellOutlined,
  FileTextOutlined,
  GithubOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  MoonOutlined,
  SearchOutlined,
  SunOutlined,
  UserOutlined,
} from '@ant-design/icons';

import { useAppContext } from '../app/AppContext';
import { can } from '../app/session';
import { apiRequest } from '../shared/api/client';
import { MantisLogo } from './MantisLogo';

const drawerWidth = 260;

export function PrivateLayout() {
  const { user, setUser, mode, toggleMode } = useAppContext();
  const theme = useTheme();
  const downLg = useMediaQuery(theme.breakpoints.down('lg'));
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(!downLg);

  const groups = useMemo(() => [
    {
      title: 'Navigation',
      items: [
        { path: '/templates', label: 'Plantillas', icon: <FileTextOutlined />, visible: can(user, 'templates.view') },
      ],
    },
    {
      title: 'Management',
      items: [
        { path: '/api-keys', label: 'Claves API', icon: <ApiOutlined />, visible: can(user, 'api_keys.manage') },
        { path: '/users', label: 'Usuarios', icon: <UserOutlined />, visible: can(user, 'users.manage') },
      ],
    },
  ], [user]);

  if (!user) return <Navigate to="/login" replace />;

  async function logout() {
    await apiRequest('/api/auth/logout', { method: 'POST' }).catch(() => undefined);
    setUser(null);
    navigate('/login', { replace: true });
  }

  const drawer = (
    <Box sx={{ height: '100%', bgcolor: 'background.paper', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', height: 74, px: 3 }}>
        <RouterLink aria-label="Logo" to="/templates" style={{ textDecoration: 'none' }}><MantisLogo /></RouterLink>
      </Box>
      <Divider />
      <Box sx={{ flex: 1, overflowY: 'auto', px: 2, py: 1.5, scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } }}>
        {groups.map((group) => {
          const visibleItems = group.items.filter((item) => item.visible);
          if (visibleItems.length === 0) return null;
          return (
            <List key={group.title} subheader={<Typography variant="subtitle2" color="text.secondary" sx={{ px: 1.25, py: 1, fontSize: 12 }}>{group.title}</Typography>} sx={{ py: 0.5 }}>
              {visibleItems.map((item) => {
                const selected = location.pathname === item.path || (location.pathname === '/' && item.path === '/templates');
                return (
                  <ListItemButton
                    component={RouterLink}
                    key={item.path}
                    selected={selected}
                    target="_self"
                    to={item.path}
                    sx={{
                      borderRadius: 1.25,
                      minHeight: 44,
                      mb: 0.25,
                      color: selected ? 'primary.main' : 'text.secondary',
                      '&.Mui-selected': { bgcolor: 'primary.lighter', color: 'primary.main' },
                      '&.Mui-selected:hover': { bgcolor: 'primary.lighter' },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 36, color: 'inherit', fontSize: 16 }}>{item.icon}</ListItemIcon>
                    <ListItemText primary={<Typography variant="h6" color="inherit">{item.label}</Typography>} />
                  </ListItemButton>
                );
              })}
            </List>
          );
        })}
      </Box>
      <Divider />
      <Box sx={{ p: 2 }}>
        <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
          <Avatar sx={{ width: 36, height: 36 }}>{user.displayName.slice(0, 1).toUpperCase()}</Avatar>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="subtitle2" noWrap>{user.displayName}</Typography>
            <Typography variant="caption" color="text.secondary" noWrap>{user.roles.join(', ') || user.email}</Typography>
          </Box>
          <Tooltip title="Cerrar sesion"><IconButton color="secondary" onClick={logout} size="small"><LogoutOutlined /></IconButton></Tooltip>
        </Stack>
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
          ml: { lg: open ? `${drawerWidth}px` : 0 },
          width: { lg: open ? `calc(100% - ${drawerWidth}px)` : '100%' },
          transition: theme.transitions.create(['margin', 'width'], { duration: theme.transitions.duration.shorter }),
        }}
      >
        <Toolbar sx={{ minHeight: '74px !important', gap: 1.5 }}>
          <IconButton aria-label="open drawer" color="secondary" edge="start" onClick={() => setOpen((value) => !value)}>
            {open ? <MenuFoldOutlined /> : <MenuUnfoldOutlined />}
          </IconButton>
          <Box sx={{ width: { xs: 1, sm: 260 }, display: { xs: 'none', sm: 'block' } }}>
            <OutlinedInput
              fullWidth
              id="header-search"
              placeholder="Ctrl + K"
              size="small"
              startAdornment={<InputAdornment position="start"><SearchOutlined /></InputAdornment>}
            />
          </Box>
          <Box sx={{ flexGrow: 1 }} />
          <Tooltip title="Repositorio Mantis"><IconButton color="secondary" component={Link} href="https://github.com/codedthemes/mantis-free-react-admin-template" target="_blank"><GithubOutlined /></IconButton></Tooltip>
          <Tooltip title="Tema"><IconButton color="secondary" onClick={toggleMode}>{mode === 'dark' ? <MoonOutlined /> : <SunOutlined />}</IconButton></Tooltip>
          <Tooltip title="Notificaciones"><IconButton color="secondary"><Badge badgeContent={2} color="primary"><BellOutlined /></Badge></IconButton></Tooltip>
          <Tooltip title={user.email}><IconButton aria-label="open profile" color="secondary"><Avatar sx={{ width: 32, height: 32 }}>{user.displayName.slice(0, 1).toUpperCase()}</Avatar></IconButton></Tooltip>
        </Toolbar>
      </AppBar>
      <Box component="nav" sx={{ width: { lg: open ? drawerWidth : 0 }, flexShrink: { lg: 0 } }}>
        <Drawer
          ModalProps={{ keepMounted: true }}
          onClose={() => setOpen(false)}
          open={open}
          variant={downLg ? 'temporary' : 'persistent'}
          slotProps={{ paper: { elevation: 0, sx: { width: drawerWidth, borderRight: `1px solid ${theme.palette.divider}` } } }}
        >
          {drawer}
        </Drawer>
      </Box>
      <Box component="main" sx={{ flexGrow: 1, minWidth: 0, p: { xs: 2, md: 3 }, pt: { xs: 11, md: 12 }, transition: theme.transitions.create('margin', { duration: theme.transitions.duration.shorter }) }}>
        <Outlet />
      </Box>
    </Box>
  );
}
