import { useEffect, useState } from 'react';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Chip, CircularProgress, Dialog, DialogContent, DialogTitle, MenuItem, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, TextField } from '@mui/material';

import { formatDate, statusLabel } from '../../app/session';
import type { InternalUser } from '../../app/types';
import { useAppContext } from '../../app/AppContext';
import { apiRequest } from '../../shared/api/client';

const roleOptions = ['VIEWER', 'EDITOR', 'MANAGER', 'ADMIN'];
const statusOptions = ['ACTIVE', 'INVITED', 'SUSPENDED'];

export function UsersPage() {
  const { setHeaderAction, closeHeaderAction } = useAppContext();
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
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  async function load() {
    setLoading(true);
    try {
      const payload = await apiRequest<{ data: InternalUser[] }>('/api/users');
      setUsers(payload.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load().catch((err) => setError(err instanceof Error ? err.message : 'No se pudo cargar.')); }, []);

  const visibleUsers = users.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setCreating(true);
    try {
      await apiRequest('/api/users', { method: 'POST', body: JSON.stringify({ displayName, email, password, roleCode }) });
      setDisplayName(''); setEmail(''); setPassword(''); setRoleCode('VIEWER');
      await load();
      closeHeaderAction();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear el usuario.');
    } finally {
      setCreating(false);
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
    setError('');
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
      setError(err instanceof Error ? err.message : 'No se pudo actualizar el usuario.');
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    setError('');
    setDeletingId(id);
    try {
      await apiRequest('/api/users/' + id, { method: 'DELETE' });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar el usuario.');
    } finally {
      setDeletingId('');
    }
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
          <Button disabled={creating} startIcon={<PlusOutlined />} type="submit" variant="contained">{creating ? 'Creando...' : 'Crear usuario'}</Button>
        </Stack>
      ),
    });

    return () => setHeaderAction(null);
  }, [closeHeaderAction, creating, displayName, email, password, roleCode, setHeaderAction]);

  return (
    <Stack spacing={2}>
      {error ? <Alert severity="error">{error}</Alert> : null}
      <Card>
        <TableContainer>
          <Table>
            <TableHead><TableRow><TableCell>Usuario</TableCell><TableCell>Rol</TableCell><TableCell>Estado</TableCell><TableCell>Ultimo acceso</TableCell><TableCell align="right">Acciones</TableCell></TableRow></TableHead>
            <TableBody>
              {loading ? <TableRow><TableCell colSpan={5} align="center"><CircularProgress size={24} /></TableCell></TableRow> : null}
              {!loading && users.length === 0 ? <TableRow><TableCell colSpan={5}>No hay usuarios.</TableCell></TableRow> : null}
              {!loading ? visibleUsers.map((item) => (
                <TableRow key={item.id}>
                  <TableCell><strong>{item.displayName}</strong><br /><small>{item.email}</small></TableCell>
                  <TableCell>{item.roles.join(', ') || 'Sin rol'}</TableCell>
                  <TableCell><Chip label={statusLabel(item.status)} size="small" /></TableCell>
                  <TableCell>{formatDate(item.lastLoginAt)}</TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
                      <Button onClick={() => openEdit(item)} size="small" startIcon={<EditOutlined />}>Editar</Button>
                      <Button color="error" disabled={deletingId === item.id} onClick={() => void remove(item.id)} size="small" startIcon={<DeleteOutlined />}>{deletingId === item.id ? 'Eliminando...' : 'Eliminar'}</Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              )) : null}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={users.length}
          labelRowsPerPage="Filas por pagina"
          onPageChange={(_event, nextPage) => setPage(nextPage)}
          onRowsPerPageChange={(event) => { setRowsPerPage(Number(event.target.value)); setPage(0); }}
          page={page}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={[10, 25, 50]}
        />
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
            <Button disabled={saving} startIcon={<EditOutlined />} type="submit" variant="contained">{saving ? 'Guardando...' : 'Guardar cambios'}</Button>
          </Stack>
        </DialogContent>
      </Dialog>
    </Stack>
  );
}
