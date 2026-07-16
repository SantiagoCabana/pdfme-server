import { useEffect, useState } from 'react';
import { KeyOutlined, StopOutlined } from '@ant-design/icons';
import { Alert, Box, Button, Card, Chip, Stack, TextField, MenuItem, Typography } from '@mui/material';
import { DataTable, PaginationBar } from '../../shared/components/DataTable';
import { LoadingState } from '../../shared/components/LoadingState';

import { buildExpiryDate, formatDate, statusLabel } from '../../app/session';
import type { ApiCredential } from '../../app/types';
import { useAppContext } from '../../app/AppContext';
import { apiRequest } from '../../shared/api/client';

export function ApiKeysPage() {
  const { setHeaderAction, closeHeaderAction } = useAppContext();
  const [credentials, setCredentials] = useState<ApiCredential[]>([]);
  const [name, setName] = useState('Servicio de documentos');
  const [expiryMode, setExpiryMode] = useState('never');
  const [rawKey, setRawKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [revokingId, setRevokingId] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(0);

  async function load() {
    setLoading(true);
    try {
      const payload = await apiRequest<{ data: ApiCredential[] }>('/api/api-credentials');
      setCredentials(payload.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load().catch((err) => setError(err instanceof Error ? err.message : 'No se pudo cargar.')); }, []);

  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRawKey('');
    setCreating(true);
    try {
      const payload = await apiRequest<{ rawKey: string }>('/api/api-credentials', { method: 'POST', body: JSON.stringify({ name, expiresAt: buildExpiryDate(expiryMode) }) });
      setRawKey(payload.rawKey);
      await load();
      closeHeaderAction();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear la clave.');
    } finally {
      setCreating(false);
    }
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
          <Button disabled={creating} startIcon={<KeyOutlined />} type="submit" variant="contained">{creating ? 'Creando...' : 'Crear clave'}</Button>
        </Stack>
      ),
    });

    return () => setHeaderAction(null);
  }, [closeHeaderAction, creating, expiryMode, name, setHeaderAction]);

  async function revoke(id: string) {
    setError('');
    setRevokingId(id);
    try {
      await apiRequest(`/api/api-credentials/${id}/revoke`, { method: 'PATCH' });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo revocar la clave.');
    } finally {
      setRevokingId('');
    }
  }



  return (
    <Stack spacing={2} sx={{ flexGrow: 1, minHeight: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
      {error ? <Alert severity="error">{error}</Alert> : null}
      {rawKey ? <Alert severity="info"><strong>Clave generada:</strong> <code>{rawKey}</code>. Guardala ahora; no se volvera a mostrar completa.</Alert> : null}
      <Card sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minHeight: 0, p: 0 }}>
        {loading ? (
          <LoadingState label="Cargando claves API..." minHeight="100%" />
        ) : credentials.length === 0 ? (
          <Box sx={{ display: 'grid', placeItems: 'center', py: 6, flexGrow: 1 }}>
            <Typography>No hay claves.</Typography>
          </Box>
        ) : (
          <Box sx={{ flexGrow: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            <DataTable
              columns={['Nombre', 'Identificador', 'Estado', 'Expira', 'Último uso', { name: 'Acciones', sort: false }]}
              data={credentials.slice(page * rowsPerPage, (page + 1) * rowsPerPage).map((credential) => [
                credential.name,
                credential.prefix,
                <Chip key="s" label={statusLabel(credential.status)} size="small" />,
                formatDate(credential.expiresAt),
                formatDate(credential.lastUsedAt),
                <Box key="a" sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  {credential.status === 'ACTIVE' ? (
                    <Button color="error" disabled={revokingId === credential.id} onClick={() => void revoke(credential.id)} size="small" startIcon={<StopOutlined />}>
                      {revokingId === credential.id ? 'Revocando...' : 'Revocar'}
                    </Button>
                  ) : null}
                </Box>,
              ])}
            />
            <PaginationBar page={page} setPage={setPage} rowsPerPage={rowsPerPage} setRowsPerPage={setRowsPerPage} total={credentials.length} />
          </Box>
        )}
      </Card>
    </Stack>
  );
}
