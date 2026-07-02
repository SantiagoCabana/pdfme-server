import { useEffect, useMemo, useState } from 'react';
import { SettingOutlined, EditOutlined, EyeOutlined, UserOutlined } from '@ant-design/icons';
import { Alert, Box, Card, CircularProgress, Dialog, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';

import type { AccessPermissionItem, AccessRoleItem } from '../../app/types';
import { apiRequest } from '../../shared/api/client';
import { useAppContext } from '../../app/AppContext';

type PermissionMatrix = {
  roles: AccessRoleItem[];
  permissions: AccessPermissionItem[];
};

const roleOrder: Record<string, number> = {
  SUPERADMIN: 1,
  ADMIN: 2,
  MANAGER: 3,
  EDITOR: 4,
  VIEWER: 5
};

const getRoleIcon = (code: string) => {
  const iconStyle = { fontSize: '1.05rem', marginRight: '6px', opacity: 0.8 };
  switch (code) {
    case 'SUPERADMIN':
      return <SettingOutlined style={{ ...iconStyle, color: '#f5222d' }} />;
    case 'ADMIN':
      return <SettingOutlined style={iconStyle} />;
    case 'EDITOR':
      return <EditOutlined style={iconStyle} />;
    case 'VIEWER':
      return <EyeOutlined style={iconStyle} />;
    default:
      return <UserOutlined style={iconStyle} />;
  }
};

interface CustomToggleSwitchProps {
  checked: boolean;
  onChange: () => void;
}

export function CustomToggleSwitch({ checked, onChange }: CustomToggleSwitchProps) {
  return (
    <Box
      onClick={onChange}
      sx={{
        position: 'relative',
        width: 74,
        height: 36,
        borderRadius: '100px',
        bgcolor: checked 
          ? 'rgba(22, 119, 255, 0.12)' 
          : 'rgba(211, 47, 47, 0.12)', 
        cursor: 'pointer',
        userSelect: 'none',
        transition: '0.3s ease all',
        overflow: 'hidden',
        border: '1px solid',
        borderColor: checked ? 'rgba(22, 119, 255, 0.3)' : 'rgba(211, 47, 47, 0.3)',
        display: 'flex',
        alignItems: 'center',
        '&:hover': {
          transform: 'scale(1.03)',
          boxShadow: checked ? '0 2px 8px rgba(22, 119, 255, 0.2)' : '0 2px 8px rgba(211, 47, 47, 0.2)',
        }
      }}
    >
      {/* Background Text */}
      <Typography
        sx={{
          position: 'absolute',
          left: checked ? 12 : 'auto',
          right: checked ? 'auto' : 12,
          color: checked ? '#1677ff' : '#d32f2f',
          fontSize: '0.6875rem', 
          fontWeight: 800,
          pointerEvents: 'none',
          textTransform: 'uppercase',
          transition: 'all 0.3s ease',
        }}
      >
        {checked ? 'SÍ' : 'NO'}
      </Typography>

      {/* Slider Knob */}
      <Box
        sx={{
          position: 'absolute',
          top: 3,
          left: checked ? 41 : 3, 
          width: 28,
          height: 28,
          borderRadius: '50%',
          bgcolor: checked ? '#1677ff' : '#d32f2f',
          transition: '0.3s cubic-bezier(0.18, 0.89, 0.35, 1.15) all, left 0.3s cubic-bezier(0.18, 0.89, 0.35, 1.15)',
          boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
        }}
      />
    </Box>
  );
}

export function CustomActionsButton({ onClick }: { onClick: () => void }) {
  return (
    <Box
      onClick={onClick}
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '10px 24px',
        border: '0',
        borderRadius: '100px',
        bgcolor: '#1677ff',
        color: '#ffffff',
        fontWeight: 'bold',
        fontSize: '0.8125rem',
        cursor: 'pointer',
        userSelect: 'none',
        transition: 'all 0.5s ease',
        '&:hover': {
          bgcolor: '#6fc5ff',
          boxShadow: '0 0 20px rgba(111, 197, 255, 0.5)',
          transform: 'scale(1.1)',
        },
        '&:active': {
          bgcolor: '#0958d9',
          boxShadow: 'none',
          transform: 'scale(0.98)',
          transition: 'all 0.25s ease',
        }
      }}
    >
      Ver acciones
    </Box>
  );
}

export function PermissionsPage() {
  const { setHeaderAction, mode } = useAppContext();
  const [roles, setRoles] = useState<AccessRoleItem[]>([]);
  const [permissions, setPermissions] = useState<AccessPermissionItem[]>([]);
  const [draft, setDraft] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [activeModalRoleId, setActiveModalRoleId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const payload = await apiRequest<PermissionMatrix>('/api/permissions');
      setRoles(payload.roles);
      setPermissions(payload.permissions);
      setDraft(Object.fromEntries(payload.roles.map((role) => [role.id, role.permissions])));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load().catch((err) => setError(err instanceof Error ? err.message : 'No se pudo cargar.')); }, []);

  const sortedRoles = useMemo(() => {
    return [...roles].sort((a, b) => {
      return (roleOrder[a.code] ?? 99) - (roleOrder[b.code] ?? 99);
    });
  }, [roles]);

  const activeModalRole = useMemo(() => {
    return roles.find((r) => r.id === activeModalRoleId) ?? null;
  }, [roles, activeModalRoleId]);

  const groupedPermissions = useMemo(() => {
    return permissions.reduce<Record<string, AccessPermissionItem[]>>((groups, permission) => {
      groups[permission.category] = [...(groups[permission.category] ?? []), permission];
      return groups;
    }, {});
  }, [permissions]);

  const categories = useMemo(() => {
    return [
      { key: 'access', label: 'GESTIONAR USUARIOS' },
      { key: 'api', label: 'GESTIONAR CLAVES API' },
      { key: 'templates', label: 'TEMPLATES' },
    ].filter((cat) => (groupedPermissions[cat.key]?.length ?? 0) > 0);
  }, [groupedPermissions]);

  function togglePermission(roleId: string, permissionCode: string) {
    setDraft((current) => {
      const values = new Set(current[roleId] ?? []);
      if (values.has(permissionCode)) {
        values.delete(permissionCode);
      } else {
        values.add(permissionCode);
      }

      return { ...current, [roleId]: Array.from(values) };
    });
  }

  const hasChanges = useMemo(() => {
    return roles.some((role) => {
      const original = role.permissions;
      const current = draft[role.id] ?? [];
      if (original.length !== current.length) return true;
      const originalSet = new Set(original);
      return current.some((code) => !originalSet.has(code));
    });
  }, [roles, draft]);

  async function saveAll() {
    setError('');
    setSaving(true);
    try {
      const changedRoles = roles.filter((role) => {
        const original = role.permissions;
        const current = draft[role.id] ?? [];
        if (original.length !== current.length) return true;
        const originalSet = new Set(original);
        return current.some((code) => !originalSet.has(code));
      });

      let lastPayload: PermissionMatrix | null = null;
      for (const role of changedRoles) {
        lastPayload = await apiRequest<PermissionMatrix>('/api/roles/' + role.id + '/permissions', {
          method: 'PATCH',
          body: JSON.stringify({ permissionCodes: draft[role.id] ?? [] }),
        });
      }

      if (lastPayload) {
        setRoles(lastPayload.roles);
        setPermissions(lastPayload.permissions);
        setDraft(Object.fromEntries(lastPayload.roles.map((entry) => [entry.id, entry.permissions])));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron actualizar los permisos.');
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    setHeaderAction({
      label: saving ? 'Guardando...' : 'Guardar',
      onClick: () => { void saveAll(); },
      disabled: saving || !hasChanges,
    });
    return () => setHeaderAction(null);
  }, [setHeaderAction, saving, hasChanges]);

  return (
    <Stack spacing={2} sx={{ flexGrow: 1, minHeight: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
      {error ? <Alert severity="error">{error}</Alert> : null}
      <Card sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <TableContainer sx={{ flexGrow: 1, overflowY: 'auto' }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ pb: 2.5, pt: 3, minWidth: 230 }}>PERMISO</TableCell>
                {sortedRoles.map((role) => (
                  <TableCell key={role.id} sx={{ pb: 2.5, pt: 3, minWidth: 320 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {getRoleIcon(role.code)}
                      <Typography sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>
                        {role.name}
                      </Typography>
                    </Box>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell align="center" colSpan={roles.length + 1}>
                    <CircularProgress size={24} />
                  </TableCell>
                </TableRow>
              ) : null}
              {!loading && roles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5}>No hay roles.</TableCell>
                </TableRow>
              ) : null}
              {!loading
                ? categories.map((category) => (
                    <TableRow key={category.key}>
                      <TableCell sx={{ minWidth: 230, py: 4.5, verticalAlign: 'middle' }}>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            width: '190px',
                            pr: 2,
                            borderRight: '3px solid',
                            borderColor: 'primary.light',
                            color: 'text.primary',
                          }}
                        >
                          <Typography
                            sx={{
                              fontWeight: 700,
                              fontSize: '0.75rem',
                              letterSpacing: '0.05em',
                              textTransform: 'uppercase',
                            }}
                          >
                            {category.label}
                          </Typography>
                        </Box>
                      </TableCell>
                      {sortedRoles.map((role) => {
                        if (category.key === 'access') {
                          const permissionCode = 'users.manage';
                          const checked = draft[role.id]?.includes(permissionCode) ?? false;
                          return (
                            <TableCell key={role.id} sx={{ py: 4.5, verticalAlign: 'middle' }}>
                              <CustomToggleSwitch
                                checked={checked}
                                onChange={() => togglePermission(role.id, permissionCode)}
                              />
                            </TableCell>
                          );
                        } else if (category.key === 'api') {
                          const permissionCode = 'api_keys.manage';
                          const checked = draft[role.id]?.includes(permissionCode) ?? false;
                          return (
                            <TableCell key={role.id} sx={{ py: 4.5, verticalAlign: 'middle' }}>
                              <CustomToggleSwitch
                                checked={checked}
                                onChange={() => togglePermission(role.id, permissionCode)}
                              />
                            </TableCell>
                          );
                        } else {
                          return (
                            <TableCell key={role.id} sx={{ py: 4.5, verticalAlign: 'middle' }}>
                              <CustomActionsButton onClick={() => setActiveModalRoleId(role.id)} />
                            </TableCell>
                          );
                        }
                      })}
                    </TableRow>
                  ))
                : null}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog
        open={Boolean(activeModalRoleId)}
        onClose={() => setActiveModalRoleId(null)}
        sx={{
          '& .MuiDialog-paper': {
            width: '100%',
            maxWidth: 480,
            borderRadius: '12px',
            p: 3.5,
          }
        }}
      >
        {activeModalRole && (
          <Stack spacing={3.5}>
            <Box sx={{ borderBottom: '2px solid', borderColor: 'primary.main', pb: 1.5 }}>
              <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: 'primary.main', letterSpacing: '0.05em' }}>
                TEMPLATES - {activeModalRole.name}
              </Typography>
            </Box>

            <Stack spacing={2.5}>
              {[
                { label: 'CREAR', code: 'templates.create' },
                { label: 'EDITAR', code: 'templates.edit' },
                { label: 'ELIMINAR', code: 'templates.delete' },
                { label: 'VER', code: 'templates.view' },
              ].map((item) => {
                const checked = draft[activeModalRole.id]?.includes(item.code) ?? false;
                return (
                  <Box
                    key={item.code}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      p: 2,
                      borderRadius: '8px',
                      bgcolor: mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                      border: '1px solid',
                      borderColor: 'divider',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        borderColor: 'primary.main',
                        bgcolor: mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(240,242,248,0.5)',
                      }
                    }}
                  >
                    <Typography sx={{ fontWeight: 700, fontSize: '0.8125rem', letterSpacing: '0.02em', color: 'text.primary' }}>
                      {item.label}
                    </Typography>
                    <CustomToggleSwitch
                      checked={checked}
                      onChange={() => togglePermission(activeModalRole.id, item.code)}
                    />
                  </Box>
                );
              })}
            </Stack>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 1.5 }}>
              <Box
                onClick={() => setActiveModalRoleId(null)}
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  px: 4,
                  py: 1.25,
                  cursor: 'pointer',
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                  color: '#ffffff',
                  bgcolor: '#1677ff',
                  borderRadius: '6px',
                  userSelect: 'none',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: '#0958d9',
                    transform: 'translateY(-1px)',
                  },
                  '&:active': {
                    transform: 'translateY(0)',
                  }
                }}
              >
                Aceptar
              </Box>
            </Box>
          </Stack>
        )}
      </Dialog>
    </Stack>
  );
}
