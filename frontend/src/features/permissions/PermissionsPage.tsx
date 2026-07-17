import { useEffect, useMemo, useState } from 'react';
import { ApiOutlined, AuditOutlined, EditOutlined, EyeOutlined, FileTextOutlined, SettingOutlined, TeamOutlined, UnorderedListOutlined, UserOutlined } from '@ant-design/icons';
import { Box, Button, Card, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Switch, Typography } from '@mui/material';
import Swal from 'sweetalert2';

import type { AccessPermissionItem, AccessRoleItem } from '../../app/types';
import { apiRequest } from '../../shared/api/client';
import { useAppContext } from '../../app/AppContext';
import { DataTable } from '../../shared/components/DataTable';
import { LoadingState } from '../../shared/components/LoadingState';
import { AppFormDialog } from '../../shared/components/AppFormDialog';
import { notifyError, notifySuccess } from '../../shared/notifications';

type PermissionMatrix = {
  roles: AccessRoleItem[];
  permissions: AccessPermissionItem[];
};

const roleOrder: Record<string, number> = {
  SUPERADMIN: 1,
  ADMIN: 2,
  MANAGER: 3,
  EDITOR: 4,
  VIEWER: 5,
};

const templateActions = [
  { label: 'Crear', code: 'templates.create' },
  { label: 'Editar', code: 'templates.edit' },
  { label: 'Eliminar', code: 'templates.delete' },
  { label: 'Ver', code: 'templates.view' },
];

const moduleRows = [
  { key: 'access', label: 'Usuarios', description: 'Gestionar usuarios internos', permissionCode: 'users.manage', icon: <TeamOutlined /> },
  { key: 'api', label: 'Claves API', description: 'Crear y administrar accesos API', permissionCode: 'api_keys.manage', icon: <ApiOutlined /> },
  { key: 'audit', label: 'Auditoria', description: 'Consultar registros del sistema', permissionCode: 'audit.view', icon: <AuditOutlined /> },
  { key: 'templates', label: 'Plantillas', description: 'Acciones sobre documentos pdfme', icon: <FileTextOutlined /> },
];

function roleIcon(code: string) {
  if (code === 'SUPERADMIN' || code === 'ADMIN') return <SettingOutlined />;
  if (code === 'EDITOR') return <EditOutlined />;
  if (code === 'VIEWER') return <EyeOutlined />;
  return <UserOutlined />;
}

export function PermissionsPage() {
  const { setHeaderAction, setOperationLabel, clearOperationLabel } = useAppContext();
  const [roles, setRoles] = useState<AccessRoleItem[]>([]);
  const [permissions, setPermissions] = useState<AccessPermissionItem[]>([]);
  const [draft, setDraft] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeRoleId, setActiveRoleId] = useState<string | null>(null);

  function isFixedRole(role: AccessRoleItem) {
    return role.code === 'ADMIN' || role.code === 'SUPERADMIN';
  }

  async function load() {
    if (roles.length === 0) setLoading(true);
    try {
      const payload = await apiRequest<PermissionMatrix>('/api/permissions');
      setRoles(payload.roles);
      setPermissions(payload.permissions);
      setDraft(Object.fromEntries(payload.roles.map((role) => [role.id, role.permissions])));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load().catch((err) => notifyError(err, 'No se pudo cargar.')); }, []);

  const sortedRoles = useMemo(() => (
    [...roles].sort((a, b) => (roleOrder[a.code] ?? 99) - (roleOrder[b.code] ?? 99))
  ), [roles]);

  const activeRole = useMemo(() => (
    roles.find((role) => role.id === activeRoleId) ?? null
  ), [activeRoleId, roles]);

  const availableCodes = useMemo(() => new Set(permissions.map((permission) => permission.code)), [permissions]);

  const visibleRows = useMemo(() => moduleRows.filter((row) => {
    if (row.key === 'templates') return templateActions.some((action) => availableCodes.has(action.code));
    return row.permissionCode ? availableCodes.has(row.permissionCode) : true;
  }), [availableCodes]);

  function roleHasPermission(role: AccessRoleItem, permissionCode: string) {
    return isFixedRole(role) || (draft[role.id]?.includes(permissionCode) ?? false);
  }

  function togglePermission(roleId: string, permissionCode: string) {
    const role = roles.find((entry) => entry.id === roleId);
    if (!role || isFixedRole(role)) return;

    setDraft((current) => {
      const values = new Set(current[roleId] ?? []);
      if (values.has(permissionCode)) values.delete(permissionCode);
      else values.add(permissionCode);
      return { ...current, [roleId]: Array.from(values) };
    });
  }

  const hasChanges = useMemo(() => roles.some((role) => {
    if (isFixedRole(role)) return false;

    const original = role.permissions;
    const current = draft[role.id] ?? [];
    if (original.length !== current.length) return true;

    const originalSet = new Set(original);
    return current.some((code) => !originalSet.has(code));
  }), [draft, roles]);

  async function saveAll() {
    const confirmed = await Swal.fire({
      cancelButtonText: 'Cancelar',
      confirmButtonText: 'Guardar',
      icon: 'question',
      showCancelButton: true,
      text: 'Se aplicaran los cambios de permisos a los roles modificados.',
      title: 'Guardar permisos',
    });

    if (!confirmed.isConfirmed) return;

    setSaving(true);
    setOperationLabel('Guardando permisos...');
    try {
      const changedRoles = roles.filter((role) => {
        if (isFixedRole(role)) return false;

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

      await notifySuccess('Permisos guardados');
    } catch (err) {
      notifyError(err, 'No se pudieron actualizar los permisos.');
    } finally {
      setSaving(false);
      clearOperationLabel();
    }
  }

  useEffect(() => {
    setHeaderAction({
      disabled: saving || !hasChanges,
      label: 'Guardar',
      onClick: () => { void saveAll(); },
    });
    return () => setHeaderAction(null);
  }, [clearOperationLabel, draft, hasChanges, roles, saving, setHeaderAction, setOperationLabel]);

  const tableData = visibleRows.map((row) => [
    <Stack key="module" direction="row" spacing={1.25} sx={{ alignItems: 'center', minWidth: 210 }}>
      <Box sx={{ color: 'primary.main', display: 'grid', fontSize: '1.1rem', placeItems: 'center' }}>{row.icon}</Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontSize: '0.86rem', fontWeight: 700 }}>{row.label}</Typography>
        <Typography color="text.secondary" noWrap sx={{ fontSize: '0.74rem', maxWidth: 230 }}>{row.description}</Typography>
      </Box>
    </Stack>,
    ...sortedRoles.map((role) => {
      if (row.key === 'templates') {
        const enabledCount = templateActions.filter((action) => roleHasPermission(role, action.code)).length;
        return (
          <Button
            disabled={isFixedRole(role)}
            key={role.id}
            onClick={() => setActiveRoleId(role.id)}
            size="small"
            sx={{
              alignItems: 'center',
              display: 'inline-flex',
              justifyContent: 'center',
              minWidth: 74,
              px: 1,
              py: 0.45,
            }}
            variant={enabledCount > 0 ? 'contained' : 'outlined'}
          >
            <Box
              component="span"
              sx={{
                alignItems: 'center',
                display: 'inline-flex',
                gap: 0.75,
                justifyContent: 'center',
                lineHeight: 1,
              }}
            >
              <UnorderedListOutlined style={{ fontSize: '0.95rem', lineHeight: 1 }} />
              <Box component="span" sx={{ display: 'inline-block', fontSize: '0.78rem', fontWeight: 700, lineHeight: 1 }}>
                {enabledCount}/{templateActions.length}
              </Box>
            </Box>
          </Button>
        );
      }

      const permissionCode = row.permissionCode ?? '';
      const checked = roleHasPermission(role, permissionCode);
      return (
        <Switch
          checked={checked}
          disabled={isFixedRole(role)}
          key={role.id}
          onChange={() => togglePermission(role.id, permissionCode)}
          size="small"
        />
      );
    }),
  ]);

  return (
    <Stack spacing={2} sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, height: '100%', minHeight: 0 }}>
      <Card sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, minHeight: 0, p: 0 }}>
        {loading ? (
          <LoadingState label="Cargando permisos..." minHeight="100%" />
        ) : (
          <DataTable
            columns={[
              { name: 'Modulo', sort: false },
              ...sortedRoles.map((role) => role.name),
            ]}
            data={tableData}
          />
        )}
      </Card>

      <AppFormDialog
        actions={<Button onClick={() => setActiveRoleId(null)}>Cerrar</Button>}
        description="Activa o desactiva acciones especificas del modulo."
        maxWidth="sm"
        onClose={() => setActiveRoleId(null)}
        open={Boolean(activeRole)}
        title="Permisos de plantillas"
      >
          {activeRole ? (
            <Stack spacing={2}>
              <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
                <Box sx={{ color: 'primary.main', display: 'grid', fontSize: '1.05rem', placeItems: 'center' }}>{roleIcon(activeRole.code)}</Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontSize: '0.92rem', fontWeight: 700 }}>{activeRole.name}</Typography>
                  <Typography color="text.secondary" sx={{ fontSize: '0.75rem' }}>Acciones disponibles para plantillas.</Typography>
                </Box>
                {isFixedRole(activeRole) ? <Chip color="primary" label="Fijo" size="small" variant="outlined" /> : null}
              </Stack>

              {templateActions.map((action) => (
                <Stack
                  direction="row"
                  key={action.code}
                  spacing={2}
                  sx={{
                    alignItems: 'center',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    justifyContent: 'space-between',
                    px: 1.75,
                    py: 1.1,
                  }}
                >
                  <Typography sx={{ fontSize: '0.86rem', fontWeight: 600 }}>{action.label}</Typography>
                  <Switch
                    checked={roleHasPermission(activeRole, action.code)}
                    disabled={isFixedRole(activeRole)}
                    onChange={() => togglePermission(activeRole.id, action.code)}
                    size="small"
                  />
                </Stack>
              ))}
            </Stack>
          ) : null}
      </AppFormDialog>
    </Stack>
  );
}
