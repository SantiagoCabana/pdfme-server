import { useEffect, useState } from 'react';
import { CheckOutlined, CopyOutlined, DeleteOutlined, KeyOutlined, StopOutlined } from '@ant-design/icons';
import { Alert, Box, Button, Card, Chip, IconButton, Stack, TextField, MenuItem, Tooltip, Typography } from '@mui/material';
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
  const [deletingId, setDeletingId] = useState('');
  const [copied, setCopied] = useState(false);
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
      setCopied(false);
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

  async function remove(id: string, name: string) {
    if (!window.confirm(`Eliminar la clave API "${name}"? Esta accion no se puede deshacer.`)) return;

    setError('');
    setDeletingId(id);
    try {
      await apiRequest(`/api/api-credentials/${id}`, { method: 'DELETE' });
      setCredentials((current) => current.filter((credential) => credential.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar la clave.');
    } finally {
      setDeletingId('');
    }
  }

  async function copyRawKey() {
    if (!rawKey) return;

    await navigator.clipboard.writeText(rawKey);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }



  return (
    <Stack spacing={2} sx={{ flexGrow: 1, minHeight: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
      {error ? <Alert severity="error">{error}</Alert> : null}
      {rawKey ? (
        <Alert
          action={(
            <Button color="inherit" onClick={() => void copyRawKey()} size="small" startIcon={copied ? <CheckOutlined /> : <CopyOutlined />}>
              {copied ? 'Copiada' : 'Copiar'}
            </Button>
          )}
          severity="info"
        >
          <Stack spacing={0.5}>
            <Typography component="strong" sx={{ fontWeight: 700 }}>Clave generada</Typography>
            <Box component="code" sx={{ display: 'block', fontSize: '0.8rem', overflowWrap: 'anywhere' }}>{rawKey}</Box>
            <Typography variant="caption">Guardala ahora; no se volvera a mostrar completa.</Typography>
          </Stack>
        </Alert>
      ) : null}
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
              columns={['Nombre', 'Codigo', 'Estado', 'Expira', 'Ultimo uso', { name: 'Acciones', sort: false }]}
              data={credentials.slice(page * rowsPerPage, (page + 1) * rowsPerPage).map((credential) => [
                <Stack key="name" spacing={0.25}>
                  <Typography sx={{ fontWeight: 700, fontSize: '0.85rem' }}>{credential.name}</Typography>
                  <Typography color="text.secondary" variant="caption">Creada: {formatDate(credential.createdAt)}</Typography>
                </Stack>,
                <Stack key="code" spacing={0.25}>
                  <Box component="code" sx={{ bgcolor: 'action.hover', borderRadius: 1, display: 'inline-flex', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.03em', px: 1, py: 0.5, width: 'fit-content' }}>
                    {credential.prefix}
                  </Box>
                  <Typography color="text.secondary" variant="caption">Secreto: {credential.secretPreview}</Typography>
                </Stack>,
                <Chip key="s" label={statusLabel(credential.status)} size="small" />,
                formatDate(credential.expiresAt),
                <Stack key="used" spacing={0.25}>
                  <Typography sx={{ fontSize: '0.82rem' }}>{formatDate(credential.lastUsedAt)}</Typography>
                  {credential.lastUsedIp ? <Typography color="text.secondary" variant="caption">IP: {credential.lastUsedIp}</Typography> : null}
                </Stack>,
                <Box key="a" sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                  {credential.status === 'ACTIVE' ? (
                    <Button color="error" disabled={revokingId === credential.id} onClick={() => void revoke(credential.id)} size="small" startIcon={<StopOutlined />}>
                      {revokingId === credential.id ? 'Revocando...' : 'Revocar'}
                    </Button>
                  ) : null}
                  <Tooltip title="Eliminar clave">
                    <span>
                      <IconButton color="error" disabled={deletingId === credential.id} onClick={() => void remove(credential.id, credential.name)} size="small">
                        <DeleteOutlined />
                      </IconButton>
                    </span>
                  </Tooltip>
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
