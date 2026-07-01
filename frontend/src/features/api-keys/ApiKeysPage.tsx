import { useEffect, useState } from 'react';
import { KeyOutlined, StopOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Chip, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, MenuItem } from '@mui/material';

import { buildExpiryDate, formatDate, statusLabel } from '../../app/session';
import type { ApiCredential } from '../../app/types';
import { useAppContext } from '../../app/AppContext';
import { apiRequest } from '../../shared/api/client';

export function ApiKeysPage() {
  const { setHeaderAction } = useAppContext();
  const [credentials, setCredentials] = useState<ApiCredential[]>([]);
  const [name, setName] = useState('Servicio de documentos');
  const [expiryMode, setExpiryMode] = useState('never');
  const [rawKey, setRawKey] = useState('');
  const [error, setError] = useState('');

  async function load() {
    const payload = await apiRequest<{ data: ApiCredential[] }>('/api/api-credentials');
    setCredentials(payload.data);
  }

  useEffect(() => { void load().catch((err) => setError(err instanceof Error ? err.message : 'No se pudo cargar.')); }, []);

  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRawKey('');
    const payload = await apiRequest<{ rawKey: string }>('/api/api-credentials', { method: 'POST', body: JSON.stringify({ name, expiresAt: buildExpiryDate(expiryMode) }) });
    setRawKey(payload.rawKey);
    await load();
  }


  useEffect(() => {
    setHeaderAction({
      label: 'Agregar',
      title: 'Nueva clave API',
      maxWidth: 'sm',
      content: (
        <Stack component="form" spacing={2} onSubmit={create}>
          <TextField autoFocus fullWidth label="Nombre" onChange={(event) => setName(event.target.value)} value={name} />
          <TextField fullWidth label="Expiracion" onChange={(event) => setExpiryMode(event.target.value)} select value={expiryMode}>
            <MenuItem value="never">Nunca expira</MenuItem>
            <MenuItem value="7">7 dias</MenuItem>
            <MenuItem value="30">30 dias</MenuItem>
            <MenuItem value="90">90 dias</MenuItem>
            <MenuItem value="365">1 ano</MenuItem>
          </TextField>
          <Button startIcon={<KeyOutlined />} type="submit" variant="contained">Crear clave</Button>
        </Stack>
      ),
    });

    return () => setHeaderAction(null);
  }, [expiryMode, name, setHeaderAction]);

  async function revoke(id: string) { await apiRequest(`/api/api-credentials/${id}/revoke`, { method: 'PATCH' }); await load(); }

  return (
    <Stack spacing={2}>
      {error ? <Alert severity="error">{error}</Alert> : null}
      {rawKey ? <Alert severity="info"><strong>Clave generada:</strong> <code>{rawKey}</code>. Guardala ahora; no se volvera a mostrar completa.</Alert> : null}
      <Card><TableContainer><Table><TableHead><TableRow><TableCell>Nombre</TableCell><TableCell>Identificador</TableCell><TableCell>Estado</TableCell><TableCell>Expira</TableCell><TableCell>Ultimo uso</TableCell><TableCell align="right"></TableCell></TableRow></TableHead><TableBody>{credentials.length === 0 ? <TableRow><TableCell colSpan={6}>No hay claves.</TableCell></TableRow> : credentials.map((credential) => <TableRow key={credential.id}><TableCell>{credential.name}</TableCell><TableCell>{credential.prefix}</TableCell><TableCell><Chip label={statusLabel(credential.status)} size="small" /></TableCell><TableCell>{formatDate(credential.expiresAt)}</TableCell><TableCell>{formatDate(credential.lastUsedAt)}</TableCell><TableCell align="right">{credential.status === 'ACTIVE' ? <Button color="error" onClick={() => void revoke(credential.id)} size="small" startIcon={<StopOutlined />}>Revocar</Button> : null}</TableCell></TableRow>)}</TableBody></Table></TableContainer></Card>
    </Stack>
  );
}
