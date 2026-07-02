import { useEffect, useMemo, useState } from 'react';
import { SettingOutlined, EditOutlined, EyeOutlined, UserOutlined } from '@ant-design/icons';
import { Alert, Box, Card, Chip, CircularProgress, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';

import type { AccessPermissionItem, AccessRoleItem } from '../../app/types';
import { apiRequest } from '../../shared/api/client';
import { useAppContext } from '../../app/AppContext';

type PermissionMatrix = {
  roles: AccessRoleItem[];
  permissions: AccessPermissionItem[];
};

const getRoleIcon = (code: string) => {
  const iconStyle = { fontSize: '1.05rem', marginRight: '6px', opacity: 0.8 };
  switch (code) {
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

export function PermissionsPage() {
  const { setHeaderAction } = useAppContext();
  const [roles, setRoles] = useState<AccessRoleItem[]>([]);
  const [permissions, setPermissions] = useState<AccessPermissionItem[]>([]);
  const [draft, setDraft] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

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

  const groupedPermissions = useMemo(() => {
    return permissions.reduce<Record<string, AccessPermissionItem[]>>((groups, permission) => {
      groups[permission.category] = [...(groups[permission.category] ?? []), permission];
      return groups;
    }, {});
  }, [permissions]);

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
                <TableCell sx={{ fontSize: '0.875rem', fontWeight: 800, letterSpacing: '0.05em', pb: 2.5, pt: 3, minWidth: 200 }}>ROL</TableCell>
                <TableCell sx={{ fontSize: '0.875rem', fontWeight: 800, letterSpacing: '0.05em', pb: 2.5, pt: 3, minWidth: 280 }}>ACCESS</TableCell>
                <TableCell sx={{ fontSize: '0.875rem', fontWeight: 800, letterSpacing: '0.05em', pb: 2.5, pt: 3, minWidth: 280 }}>API</TableCell>
                <TableCell sx={{ fontSize: '0.875rem', fontWeight: 800, letterSpacing: '0.05em', pb: 2.5, pt: 3, minWidth: 650 }}>TEMPLATES</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? <TableRow><TableCell align="center" colSpan={4}><CircularProgress size={24} /></TableCell></TableRow> : null}
              {!loading && roles.length === 0 ? <TableRow><TableCell colSpan={4}>No hay roles.</TableCell></TableRow> : null}
              {!loading ? roles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell sx={{ minWidth: 200, py: 4.5, verticalAlign: 'middle' }}>
                    <Box
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        py: 0.5,
                        pr: 2.5,
                        pl: 0.5,
                        borderRight: '3px solid',
                        borderColor: 'primary.light',
                        color: 'text.primary',
                      }}
                    >
                      {getRoleIcon(role.code)}
                      <Typography
                        sx={{
                          fontWeight: 700,
                          fontSize: '0.9rem',
                          letterSpacing: '0.05em',
                          textTransform: 'uppercase',
                        }}
                      >
                        {role.name}
                      </Typography>
                    </Box>
                  </TableCell>
                  
                  {/* ACCESS Column */}
                  <TableCell sx={{ py: 4.5, verticalAlign: 'middle' }}>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                      {(groupedPermissions['access'] ?? []).map((permission) => {
                        const checked = draft[role.id]?.includes(permission.code) ?? false;
                        return (
                          <Chip
                            color={checked ? 'primary' : 'default'}
                            key={permission.code}
                            label={permission.name}
                            onClick={() => togglePermission(role.id, permission.code)}
                            variant={checked ? 'filled' : 'outlined'}
                            sx={{
                              cursor: 'pointer',
                              fontWeight: checked ? 600 : 500,
                              fontSize: '0.8125rem',
                              borderRadius: '6px',
                              px: 0.5,
                              height: '32px',
                              border: checked ? '1px solid transparent' : '1px solid',
                              borderColor: checked ? 'transparent' : 'divider',
                              bgcolor: checked ? 'primary.main' : 'background.default',
                              color: checked ? '#ffffff' : 'text.secondary',
                              boxShadow: checked ? '0 2px 4px rgba(22, 119, 255, 0.25)' : 'none',
                              transition: 'all 0.2s ease-in-out',
                              '&:hover': {
                                transform: 'translateY(-1px)',
                                bgcolor: checked ? 'primary.dark' : 'action.hover',
                                boxShadow: checked ? '0 4px 8px rgba(22, 119, 255, 0.35)' : '0 2px 4px rgba(0,0,0,0.05)',
                                color: checked ? '#ffffff' : 'text.primary',
                              },
                              '&:active': {
                                transform: 'translateY(0)',
                              }
                            }}
                          />
                        );
                      })}
                    </Box>
                  </TableCell>

                  {/* API Column */}
                  <TableCell sx={{ py: 4.5, verticalAlign: 'middle' }}>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                      {(groupedPermissions['api'] ?? []).map((permission) => {
                        const checked = draft[role.id]?.includes(permission.code) ?? false;
                        return (
                          <Chip
                            color={checked ? 'primary' : 'default'}
                            key={permission.code}
                            label={permission.name}
                            onClick={() => togglePermission(role.id, permission.code)}
                            variant={checked ? 'filled' : 'outlined'}
                            sx={{
                              cursor: 'pointer',
                              fontWeight: checked ? 600 : 500,
                              fontSize: '0.8125rem',
                              borderRadius: '6px',
                              px: 0.5,
                              height: '32px',
                              border: checked ? '1px solid transparent' : '1px solid',
                              borderColor: checked ? 'transparent' : 'divider',
                              bgcolor: checked ? 'primary.main' : 'background.default',
                              color: checked ? '#ffffff' : 'text.secondary',
                              boxShadow: checked ? '0 2px 4px rgba(22, 119, 255, 0.25)' : 'none',
                              transition: 'all 0.2s ease-in-out',
                              '&:hover': {
                                transform: 'translateY(-1px)',
                                bgcolor: checked ? 'primary.dark' : 'action.hover',
                                boxShadow: checked ? '0 4px 8px rgba(22, 119, 255, 0.35)' : '0 2px 4px rgba(0,0,0,0.05)',
                                color: checked ? '#ffffff' : 'text.primary',
                              },
                              '&:active': {
                                transform: 'translateY(0)',
                              }
                            }}
                          />
                        );
                      })}
                    </Box>
                  </TableCell>

                  {/* TEMPLATES Column */}
                  <TableCell sx={{ py: 4.5, verticalAlign: 'middle' }}>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.75, maxWidth: 750 }}>
                      {(groupedPermissions['templates'] ?? []).map((permission) => {
                        const checked = draft[role.id]?.includes(permission.code) ?? false;
                        return (
                          <Chip
                            color={checked ? 'primary' : 'default'}
                            key={permission.code}
                            label={permission.name}
                            onClick={() => togglePermission(role.id, permission.code)}
                            variant={checked ? 'filled' : 'outlined'}
                            sx={{
                              cursor: 'pointer',
                              fontWeight: checked ? 600 : 500,
                              fontSize: '0.8125rem',
                              borderRadius: '6px',
                              px: 0.5,
                              height: '32px',
                              border: checked ? '1px solid transparent' : '1px solid',
                              borderColor: checked ? 'transparent' : 'divider',
                              bgcolor: checked ? 'primary.main' : 'background.default',
                              color: checked ? '#ffffff' : 'text.secondary',
                              boxShadow: checked ? '0 2px 4px rgba(22, 119, 255, 0.25)' : 'none',
                              transition: 'all 0.2s ease-in-out',
                              '&:hover': {
                                transform: 'translateY(-1px)',
                                bgcolor: checked ? 'primary.dark' : 'action.hover',
                                boxShadow: checked ? '0 4px 8px rgba(22, 119, 255, 0.35)' : '0 2px 4px rgba(0,0,0,0.05)',
                                color: checked ? '#ffffff' : 'text.primary',
                              },
                              '&:active': {
                                transform: 'translateY(0)',
                              }
                            }}
                          />
                        );
                      })}
                    </Box>
                  </TableCell>
                </TableRow>
              )) : null}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Stack>
  );
}
