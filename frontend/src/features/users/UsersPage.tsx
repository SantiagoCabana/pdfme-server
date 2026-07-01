import { useEffect, useState } from 'react';
import { PlusOutlined } from '@ant-design/icons';
import { Alert, Button, Card, CardContent, Chip, MenuItem, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField } from '@mui/material';

import { formatDate, statusLabel } from '../../app/session';
import type { InternalUser } from '../../app/types';
import { PageHeader } from '../../layout/PageHeader';
import { apiRequest } from '../../shared/api/client';

export function UsersPage() {
  const [users, setUsers] = useState<InternalUser[]>([]);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [roleCode, setRoleCode] = useState('VIEWER');
  const [error, setError] = useState('');

  async function load() {
    const payload = await apiRequest<{ data: InternalUser[] }>('/api/users');
    setUsers(payload.data);
  }

  useEffect(() => { void load().catch((err) => setError(err instanceof Error ? err.message : 'No se pudo cargar.')); }, []);

  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await apiRequest('/api/users', { method: 'POST', body: JSON.stringify({ displayName, email, password, roleCode }) });
    setDisplayName(''); setEmail(''); setPassword(''); setRoleCode('VIEWER');
    await load();
  }

  return (
    <Stack spacing={2}>
      <PageHeader title="Usuarios" subtitle="Accesos internos. No hay registro publico." />
      {error ? <Alert severity="error">{error}</Alert> : null}
      <Card><CardContent><Stack component="form" direction={{ xs: 'column', lg: 'row' }} spacing={1.5} onSubmit={create}><TextField label="Nombre" onChange={(event) => setDisplayName(event.target.value)} value={displayName} /><TextField label="Correo" onChange={(event) => setEmail(event.target.value)} type="email" value={email} /><TextField label="Contrasena inicial" onChange={(event) => setPassword(event.target.value)} type="password" value={password} /><TextField label="Rol" onChange={(event) => setRoleCode(event.target.value)} select value={roleCode} sx={{ minWidth: 160 }}><MenuItem value="VIEWER">Viewer</MenuItem><MenuItem value="EDITOR">Editor</MenuItem><MenuItem value="MANAGER">Manager</MenuItem><MenuItem value="ADMIN">Admin</MenuItem></TextField><Button startIcon={<PlusOutlined />} type="submit" variant="contained">Crear usuario</Button></Stack></CardContent></Card>
      <Card><TableContainer><Table><TableHead><TableRow><TableCell>Usuario</TableCell><TableCell>Rol</TableCell><TableCell>Estado</TableCell><TableCell>Ultimo acceso</TableCell></TableRow></TableHead><TableBody>{users.length === 0 ? <TableRow><TableCell colSpan={4}>No hay usuarios.</TableCell></TableRow> : users.map((item) => <TableRow key={item.id}><TableCell><strong>{item.displayName}</strong><br /><small>{item.email}</small></TableCell><TableCell>{item.roles.join(', ') || 'Sin rol'}</TableCell><TableCell><Chip label={statusLabel(item.status)} size="small" /></TableCell><TableCell>{formatDate(item.lastLoginAt)}</TableCell></TableRow>)}</TableBody></Table></TableContainer></Card>
    </Stack>
  );
}
