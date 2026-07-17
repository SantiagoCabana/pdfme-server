import { useEffect, useState } from 'react';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { Box, Button, Card, Chip, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, TextField, Typography } from '@mui/material';
import Swal from 'sweetalert2';
import { DataTable, PaginationBar } from '../../shared/components/DataTable';
import { LoadingState } from '../../shared/components/LoadingState';

import { formatDate, statusLabel } from '../../app/session';
import type { InternalUser } from '../../app/types';
import { useAppContext } from '../../app/AppContext';
import { apiRequest } from '../../shared/api/client';
import { notifyError } from '../../shared/notifications';

const roleOptions = ['VIEWER', 'EDITOR', 'MANAGER', 'ADMIN'];
const statusOptions = ['ACTIVE', 'INVITED', 'SUSPENDED'];

export function UsersPage() {
  const { setHeaderAction, closeHeaderAction, setOperationLabel, clearOperationLabel } = useAppContext();
  const [users, setUsers] = useState<InternalUser[]>([]);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [roleCode, setRoleCode] = useState('VIEWER');
  const [editingUser, setEditingUser] = useState<InternalUser | null>(null);
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editRoleCode, setEditRoleCode] = useState('VIEWER');
  const [editStatus, setEditStatus] = useState('ACTIVE');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(0);

  async function load() {
    if (users.length === 0) setLoading(true);
    try {
      const payload = await apiRequest<{ data: InternalUser[] }>('/api/users');
      setUsers(payload.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load().catch((err) => notifyError(err, 'No se pudo cargar.')); }, []);

  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreating(true);
    setOperationLabel('Creando usuario...');
    try {
      await apiRequest('/api/users', { method: 'POST', body: JSON.stringify({ displayName, email, password, roleCode }) });
      setDisplayName(''); setEmail(''); setPassword(''); setRoleCode('VIEWER');
      await load();
      closeHeaderAction();
    } catch (err) {
      notifyError(err, 'No se pudo crear el usuario.');
    } finally {
      setCreating(false);
      clearOperationLabel();
    }
  }

  function openEdit(user: InternalUser) {
    setEditingUser(user);
    setEditDisplayName(user.displayName);
    setEditPassword('');
    setEditRoleCode(user.roles[0] ?? 'VIEWER');
    setEditStatus(user.status);
  }

  async function update(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingUser) return;
    setSaving(true);
    setOperationLabel('Guardando usuario...');
    try {
      await apiRequest('/api/users/' + editingUser.id, {
        method: 'PATCH',
        body: JSON.stringify({
          displayName: editDisplayName,
          status: editStatus,
          roleCode: editRoleCode,
          ...(editPassword ? { password: editPassword } : {}),
        }),
      });
      setEditingUser(null);
      await load();
    } catch (err) {
      notifyError(err, 'No se pudo actualizar el usuario.');
    } finally {
      setSaving(false);
      clearOperationLabel();
    }
  }

  async function remove(id: string, passwordVal: string) {
    setDeletingId(id);
    setOperationLabel('Eliminando usuario...');
    try {
      await apiRequest('/api/users/' + id, {
        method: 'DELETE',
        body: JSON.stringify({ password: passwordVal }),
      });
      setUsers((current) => current.filter((user) => user.id !== id));
    } catch (err) {
      notifyError(err, 'No se pudo eliminar el usuario.');
    } finally {
      setDeletingId('');
      clearOperationLabel();
    }
  }

  async function confirmRemove(user: InternalUser) {
    const result = await Swal.fire({
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d33',
      confirmButtonText: 'Eliminar',
      icon: 'warning',
      input: 'password',
      inputAttributes: {
        autocapitalize: 'off',
        autocomplete: 'current-password',
      },
      inputPlaceholder: 'Contraseña',
      inputValidator: (value) => (value ? null : 'Ingresa tu contraseña.'),
      showCancelButton: true,
      text: `Para eliminar el usuario "${user.displayName}", valida tu identidad.`,
      title: 'Confirmar eliminación',
    });

    if (result.isConfirmed && result.value) await remove(user.id, result.value);
  }

  useEffect(() => {
    setHeaderAction({
      label: 'Agregar',
      title: 'Nuevo usuario',
      maxWidth: 'sm',
      content: (
        <Stack component="form" spacing={2} onSubmit={create}>
          <TextField autoFocus fullWidth label="Nombre" onChange={(event) => setDisplayName(event.target.value)} value={displayName} />
          <TextField fullWidth label="Correo" onChange={(event) => setEmail(event.target.value)} type="email" value={email} />
          <TextField fullWidth label="Contrasena inicial" onChange={(event) => setPassword(event.target.value)} type="password" value={password} />
          <TextField fullWidth label="Rol" onChange={(event) => setRoleCode(event.target.value)} select value={roleCode}>
            {roleOptions.map((role) => <MenuItem key={role} value={role}>{role}</MenuItem>)}
          </TextField>
          <Button disabled={creating} startIcon={<PlusOutlined />} type="submit" variant="contained">Crear usuario</Button>
        </Stack>
      ),
    });

    return () => setHeaderAction(null);
  }, [clearOperationLabel, closeHeaderAction, creating, displayName, email, password, roleCode, setHeaderAction, setOperationLabel]);

  return (
    <Stack spacing={2} sx={{ flexGrow: 1, minHeight: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Card sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minHeight: 0, p: 0 }}>
        {loading ? (
          <LoadingState label="Cargando usuarios..." minHeight="100%" />
        ) : users.length === 0 ? (
          <Box sx={{ display: 'grid', placeItems: 'center', py: 6, flexGrow: 1 }}>
            <Typography>No hay usuarios.</Typography>
          </Box>
        ) : (
          <Box sx={{ flexGrow: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            <DataTable
              columns={['Usuario', 'Rol', 'Estado', 'Último acceso', { name: 'Acciones', sort: false }]}
              data={users.slice(page * rowsPerPage, (page + 1) * rowsPerPage).map((item) => [
                <div key="u"><strong>{item.displayName}</strong><br /><small>{item.email}</small></div>,
                item.roles.join(', ') || 'Sin rol',
                <Chip key="s" label={statusLabel(item.status)} size="small" />,
                formatDate(item.lastLoginAt),
                <Stack key="a" direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
                  <Button onClick={() => openEdit(item)} size="small" startIcon={<EditOutlined />}>Editar</Button>
                  <Button color="error" disabled={deletingId === item.id} onClick={() => void confirmRemove(item)} size="small" startIcon={<DeleteOutlined />}>Eliminar</Button>
                </Stack>,
              ])}
            />
            <PaginationBar page={page} setPage={setPage} rowsPerPage={rowsPerPage} setRowsPerPage={setRowsPerPage} total={users.length} />
          </Box>
        )}
      </Card>

      <Dialog fullWidth maxWidth="sm" onClose={() => setEditingUser(null)} open={Boolean(editingUser)}>
        <DialogTitle>Editar usuario</DialogTitle>
        <DialogContent dividers>
          <Stack component="form" spacing={2} onSubmit={update}>
            <TextField autoFocus fullWidth label="Nombre" onChange={(event) => setEditDisplayName(event.target.value)} value={editDisplayName} />
            <TextField fullWidth label="Nueva contrasena" helperText="Dejalo vacio si no quieres cambiarla." onChange={(event) => setEditPassword(event.target.value)} type="password" value={editPassword} />
            <TextField fullWidth label="Rol" onChange={(event) => setEditRoleCode(event.target.value)} select value={editRoleCode}>
              {roleOptions.map((role) => <MenuItem key={role} value={role}>{role}</MenuItem>)}
            </TextField>
            <TextField fullWidth label="Estado" onChange={(event) => setEditStatus(event.target.value)} select value={editStatus}>
              {statusOptions.map((status) => <MenuItem key={status} value={status}>{statusLabel(status)}</MenuItem>)}
            </TextField>
            <Button disabled={saving} startIcon={<EditOutlined />} type="submit" variant="contained">Guardar cambios</Button>
          </Stack>
        </DialogContent>
      </Dialog>
    </Stack>
  );
}
