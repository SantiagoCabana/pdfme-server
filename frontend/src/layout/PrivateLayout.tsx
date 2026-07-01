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
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  OutlinedInput,
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
const miniDrawerWidth = 72;

export function PrivateLayout() {
  const { user, setUser, mode, toggleMode } = useAppContext();
  const theme = useTheme();
  const downLg = useMediaQuery(theme.breakpoints.down('lg'));
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(!downLg);
  const [profileAnchor, setProfileAnchor] = useState<HTMLElement | null>(null);

  const items = useMemo(() => [
    { path: '/templates', label: 'Plantillas', icon: <FileTextOutlined />, visible: can(user, 'templates.view') },
    { path: '/api-keys', label: 'Claves API', icon: <ApiOutlined />, visible: can(user, 'api_keys.manage') },
    { path: '/users', label: 'Usuarios', icon: <UserOutlined />, visible: can(user, 'users.manage') },
  ], [user]);

  const activeItem = items.find((item) => (
    location.pathname === item.path || (location.pathname === '/' && item.path === '/templates')
  ));

  if (!user) return <Navigate to="/login" replace />;

  const collapsed = !open && !downLg;
  const currentDrawerWidth = collapsed ? miniDrawerWidth : drawerWidth;

  async function logout() {
    await apiRequest('/api/auth/logout', { method: 'POST' }).catch(() => undefined);
    setUser(null);
    setProfileAnchor(null);
    navigate('/login', { replace: true });
  }

  const drawer = (
    <Box sx={{ height: '100%', bgcolor: 'background.paper', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', height: 74, px: collapsed ? 0 : 3, justifyContent: collapsed ? 'center' : 'flex-start' }}>
        <RouterLink aria-label="Logo" to="/templates" style={{ textDecoration: 'none' }}>
          {collapsed ? <Avatar variant="rounded" sx={{ bgcolor: 'primary.main', fontWeight: 700, width: 35, height: 35 }}>M</Avatar> : <MantisLogo />}
        </RouterLink>
      </Box>
      <Divider />
      <Box sx={{ flex: 1, overflowY: 'auto', py: 1.5, scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } }}>
        <List sx={{ py: 0.5 }}>
          {items.filter((item) => item.visible).map((item) => {
            const selected = location.pathname === item.path || (location.pathname === '/' && item.path === '/templates');
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
                  <ListItemIcon sx={{ minWidth: collapsed ? 0 : 36, color: 'inherit', fontSize: 16, justifyContent: 'center' }}>{item.icon}</ListItemIcon>
                  {!collapsed ? <ListItemText primary={<Typography variant="h6" color="inherit">{item.label}</Typography>} /> : null}
                </ListItemButton>
              </Tooltip>
            );
          })}
        </List>
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
          transition: theme.transitions.create(['margin', 'width'], { duration: theme.transitions.duration.shorter }),
        }}
      >
        <Toolbar sx={{ minHeight: '74px !important', gap: 1.5 }}>
          <IconButton aria-label="open drawer" color="secondary" edge="start" onClick={() => setOpen((value) => !value)}>
            {open ? <MenuFoldOutlined /> : <MenuUnfoldOutlined />}
          </IconButton>
          <Typography variant="h4" color="text.primary" sx={{ minWidth: { xs: 0, md: 180 }, display: { xs: 'none', sm: 'block' } }} noWrap>
            {activeItem?.label ?? 'Plantillas'}
          </Typography>
          <Box sx={{ width: { xs: 1, sm: 260 }, display: { xs: 'none', md: 'block' } }}>
            <OutlinedInput
              fullWidth
              id="header-search"
              placeholder="Ctrl + K"
              size="small"
              startAdornment={<InputAdornment position="start"><SearchOutlined /></InputAdornment>}
            />
          </Box>
          <Box sx={{ flexGrow: 1 }} />
          <Tooltip title="Tema"><IconButton color="secondary" onClick={toggleMode}>{mode === 'dark' ? <MoonOutlined /> : <SunOutlined />}</IconButton></Tooltip>
          <Tooltip title="Notificaciones"><IconButton color="secondary"><Badge badgeContent={2} color="primary"><BellOutlined /></Badge></IconButton></Tooltip>
          <Tooltip title={user.email}>
            <IconButton aria-label="open profile" color="secondary" onClick={(event) => setProfileAnchor(event.currentTarget)}>
              <Avatar sx={{ width: 32, height: 32 }}>{user.displayName.slice(0, 1).toUpperCase()}</Avatar>
            </IconButton>
          </Tooltip>
          <Menu anchorEl={profileAnchor} onClose={() => setProfileAnchor(null)} open={Boolean(profileAnchor)}>
            <MenuItem disabled>{user.displayName}</MenuItem>
            <MenuItem onClick={logout}><LogoutOutlined style={{ marginRight: 8 }} />Cerrar sesion</MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      <Box component="nav" sx={{ width: { lg: currentDrawerWidth }, flexShrink: { lg: 0 } }}>
        <Drawer
          ModalProps={{ keepMounted: true }}
          onClose={() => setOpen(false)}
          open={downLg ? open : true}
          variant={downLg ? 'temporary' : 'permanent'}
          slotProps={{ paper: { elevation: 0, sx: { width: currentDrawerWidth, overflowX: 'hidden', borderRight: `1px solid ${theme.palette.divider}`, transition: theme.transitions.create('width', { duration: theme.transitions.duration.shorter }) } } }}
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
