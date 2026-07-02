import { useEffect, useState } from 'react';
import { KeyOutlined, StopOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Chip, CircularProgress, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, TextField, MenuItem } from '@mui/material';

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
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

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

  const visibleCredentials = credentials.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Stack spacing={2} sx={{ flexGrow: 1, minHeight: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
      {error ? <Alert severity="error">{error}</Alert> : null}
      {rawKey ? <Alert severity="info"><strong>Clave generada:</strong> <code>{rawKey}</code>. Guardala ahora; no se volvera a mostrar completa.</Alert> : null}
      <Card sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <TableContainer sx={{ flexGrow: 1, overflowY: 'auto' }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Nombre</TableCell>
                <TableCell>Identificador</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Expira</TableCell>
                <TableCell>Ultimo uso</TableCell>
                <TableCell align="right"></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell align="center" colSpan={6}>
                    <CircularProgress size={24} />
                  </TableCell>
                </TableRow>
              ) : null}
              {!loading && credentials.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6}>No hay claves.</TableCell>
                </TableRow>
              ) : null}
              {!loading
                ? visibleCredentials.map((credential) => (
                    <TableRow key={credential.id}>
                      <TableCell>{credential.name}</TableCell>
                      <TableCell>{credential.prefix}</TableCell>
                      <TableCell>
                        <Chip label={statusLabel(credential.status)} size="small" />
                      </TableCell>
                      <TableCell>{formatDate(credential.expiresAt)}</TableCell>
                      <TableCell>{formatDate(credential.lastUsedAt)}</TableCell>
                      <TableCell align="right">
                        {credential.status === 'ACTIVE' ? (
                          <Button
                            color="error"
                            disabled={revokingId === credential.id}
                            onClick={() => void revoke(credential.id)}
                            size="small"
                            startIcon={<StopOutlined />}
                          >
                            {revokingId === credential.id ? 'Revocando...' : 'Revocar'}
                          </Button>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))
                : null}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={credentials.length}
          labelRowsPerPage="Filas por pagina"
          onPageChange={(_event, nextPage) => setPage(nextPage)}
          onRowsPerPageChange={(event) => {
            setRowsPerPage(Number(event.target.value));
            setPage(0);
          }}
          page={page}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={[10, 25, 50]}
        />
      </Card>
    </Stack>
  );
}
