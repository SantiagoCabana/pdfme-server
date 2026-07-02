import { useEffect, useMemo, useState } from 'react';
import { SaveOutlined } from '@ant-design/icons';
import { Alert, Box, Button, Card, Checkbox, Chip, CircularProgress, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';

import type { AccessPermissionItem, AccessRoleItem } from '../../app/types';
import { apiRequest } from '../../shared/api/client';

type PermissionMatrix = {
  roles: AccessRoleItem[];
  permissions: AccessPermissionItem[];
};

export function PermissionsPage() {
  const [roles, setRoles] = useState<AccessRoleItem[]>([]);
  const [permissions, setPermissions] = useState<AccessPermissionItem[]>([]);
  const [draft, setDraft] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [savingRoleId, setSavingRoleId] = useState('');
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

  async function save(role: AccessRoleItem) {
    setError('');
    setSavingRoleId(role.id);
    try {
      const payload = await apiRequest<PermissionMatrix>('/api/roles/' + role.id + '/permissions', {
        method: 'PATCH',
        body: JSON.stringify({ permissionCodes: draft[role.id] ?? [] }),
      });
      setRoles(payload.roles);
      setPermissions(payload.permissions);
      setDraft(Object.fromEntries(payload.roles.map((entry) => [entry.id, entry.permissions])));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron actualizar los permisos.');
    } finally {
      setSavingRoleId('');
    }
  }

  return (
    <Stack spacing={2}>
      {error ? <Alert severity="error">{error}</Alert> : null}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Rol</TableCell>
                <TableCell>Permisos</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? <TableRow><TableCell align="center" colSpan={3}><CircularProgress size={24} /></TableCell></TableRow> : null}
              {!loading && roles.length === 0 ? <TableRow><TableCell colSpan={3}>No hay roles.</TableCell></TableRow> : null}
              {!loading ? roles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell sx={{ minWidth: 180, verticalAlign: 'top' }}>
                    <Typography variant="subtitle2">{role.name}</Typography>
                    <Typography color="text.secondary" variant="caption">{role.code}</Typography>
                  </TableCell>
                  <TableCell>
                    <Stack spacing={1.5}>
                      {Object.entries(groupedPermissions).map(([category, categoryPermissions]) => (
                        <Box key={category}>
                          <Typography color="text.secondary" sx={{ mb: 0.5, textTransform: 'uppercase' }} variant="caption">{category}</Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {categoryPermissions.map((permission) => {
                              const checked = draft[role.id]?.includes(permission.code) ?? false;
                              return (
                                <Chip
                                  color={checked ? 'primary' : 'default'}
                                  icon={<Checkbox checked={checked} onChange={() => togglePermission(role.id, permission.code)} size="small" sx={{ p: 0, ml: 0.5 }} />}
                                  key={permission.code}
                                  label={permission.name}
                                  variant={checked ? 'filled' : 'outlined'}
                                />
                              );
                            })}
                          </Box>
                        </Box>
                      ))}
                    </Stack>
                  </TableCell>
                  <TableCell align="right" sx={{ verticalAlign: 'top' }}>
                    <Button disabled={savingRoleId === role.id} onClick={() => void save(role)} size="small" startIcon={<SaveOutlined />} variant="outlined">
                      {savingRoleId === role.id ? 'Guardando...' : 'Guardar'}
                    </Button>
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
