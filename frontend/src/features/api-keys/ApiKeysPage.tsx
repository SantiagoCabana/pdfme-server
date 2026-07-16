import { useEffect, useState } from 'react';
import { CopyOutlined, DeleteOutlined, KeyOutlined } from '@ant-design/icons';
import { Box, Button, Card, Chip, IconButton, Stack, Switch, TextField, MenuItem, Tooltip, Typography } from '@mui/material';
import Swal from 'sweetalert2';
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
  const [customExpiresAt, setCustomExpiresAt] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [togglingId, setTogglingId] = useState('');
  const [deletingId, setDeletingId] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(0);

  const toast = Swal.mixin({
    toast: true,
    position: 'top-start',
    showConfirmButton: false,
    timer: 1800,
    timerProgressBar: true,
  });

  function showError(message: string) {
    void Swal.fire({ icon: 'error', title: message, confirmButtonText: 'Cerrar' });
  }

  async function copyText(value: string, message = 'Copiado') {
    await navigator.clipboard.writeText(value);
    await toast.fire({ icon: 'success', title: message });
  }

  function shortCode(value: string) {
    if (value.length <= 12) return value;

    const visibleLength = Math.max(4, Math.ceil(value.length * 0.1));
    return `${value.slice(0, visibleLength)}...`;
  }

  function resolveExpiresAt() {
    if (expiryMode === 'custom') {
      return customExpiresAt ? new Date(customExpiresAt).toISOString() : null;
    }

    return buildExpiryDate(expiryMode);
  }

  function isVisuallyActive(credential: ApiCredential) {
    return credential.status === 'ACTIVE' || credential.status === 'EXPIRED';
  }

  async function load() {
    setLoading(true);
    try {
      const payload = await apiRequest<{ data: ApiCredential[] }>('/api/api-credentials');
      setCredentials(payload.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load().catch((err) => showError(err instanceof Error ? err.message : 'No se pudo cargar.')); }, []);

  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreating(true);
    try {
      const payload = await apiRequest<{ rawKey: string }>('/api/api-credentials', { method: 'POST', body: JSON.stringify({ name, expiresAt: resolveExpiresAt() }) });
      await load();
      closeHeaderAction();
      const result = await Swal.fire({
        icon: 'success',
        title: 'Clave creada',
        html: `<code style="display:block;word-break:break-all;padding:10px;border-radius:6px;background:#f5f5f5">${payload.rawKey}</code>`,
        confirmButtonText: 'Copiar',
        showCancelButton: true,
        cancelButtonText: 'Cerrar',
      });

      if (result.isConfirmed) {
        await copyText(payload.rawKey, 'Clave copiada');
      }
    } catch (err) {
      showError(err instanceof Error ? err.message : 'No se pudo crear.');
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
            <MenuItem value="custom">Personalizado</MenuItem>
          </TextField>
          {expiryMode === 'custom' ? (
            <TextField
              fullWidth
              label="Fecha y hora"
              onChange={(event) => setCustomExpiresAt(event.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              type="datetime-local"
              value={customExpiresAt}
            />
          ) : null}
          <Button disabled={creating || (expiryMode === 'custom' && !customExpiresAt)} startIcon={<KeyOutlined />} type="submit" variant="contained">{creating ? 'Creando...' : 'Crear clave'}</Button>
        </Stack>
      ),
    });

    return () => setHeaderAction(null);
  }, [closeHeaderAction, creating, customExpiresAt, expiryMode, name, setHeaderAction]);

  async function toggleStatus(credential: ApiCredential) {
    if (credential.status === 'EXPIRED') return;

    const isActive = credential.status === 'ACTIVE';
    const nextAction = isActive ? 'disable' : 'activate';

    const result = await Swal.fire({
      icon: isActive ? 'warning' : 'question',
      title: isActive ? 'Deshabilitar clave' : 'Activar clave',
      text: credential.name,
      confirmButtonText: isActive ? 'Deshabilitar' : 'Activar',
      cancelButtonText: 'Cancelar',
      showCancelButton: true,
      confirmButtonColor: isActive ? '#d32f2f' : '#1677ff',
    });

    if (!result.isConfirmed) return;

    setTogglingId(credential.id);
    try {
      const payload = await apiRequest<{ credential: ApiCredential }>(`/api/api-credentials/${credential.id}/${nextAction}`, { method: 'PATCH' });
      setCredentials((current) => current.map((entry) => entry.id === credential.id ? payload.credential : entry));
      await toast.fire({ icon: 'success', title: isActive ? 'Clave deshabilitada' : 'Clave activada' });
    } catch (err) {
      showError(err instanceof Error ? err.message : 'No se pudo actualizar.');
    } finally {
      setTogglingId('');
    }
  }

  async function remove(id: string, name: string) {
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Eliminar clave',
      text: name,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
      showCancelButton: true,
      confirmButtonColor: '#d32f2f',
    });

    if (!result.isConfirmed) return;

    setDeletingId(id);
    try {
      await apiRequest(`/api/api-credentials/${id}`, { method: 'DELETE' });
      setCredentials((current) => current.filter((credential) => credential.id !== id));
      await toast.fire({ icon: 'success', title: 'Clave eliminada' });
    } catch (err) {
      showError(err instanceof Error ? err.message : 'No se pudo eliminar.');
    } finally {
      setDeletingId('');
    }
  }

  return (
    <Stack spacing={2} sx={{ flexGrow: 1, minHeight: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
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
              columns={['Nombre', 'Codigo', 'Estado', { name: 'Activo', sort: false }, 'Expira', 'Ultimo uso', { name: 'Acciones', sort: false }]}
              data={credentials.slice(page * rowsPerPage, (page + 1) * rowsPerPage).map((credential) => [
                <Stack key="name" spacing={0.25}>
                  <Typography sx={{ fontWeight: 700, fontSize: '0.85rem' }}>{credential.name}</Typography>
                  <Typography color="text.secondary" variant="caption">Creada: {formatDate(credential.createdAt)}</Typography>
                </Stack>,
                <Stack key="code" spacing={0.25}>
                  <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                    <Box component="code" sx={{ bgcolor: 'action.hover', borderRadius: 1, display: 'inline-flex', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.03em', px: 1, py: 0.5, width: 'fit-content' }}>
                      {shortCode(credential.prefix)}
                    </Box>
                    <Tooltip title="Copiar codigo">
                      <IconButton onClick={() => void copyText(credential.prefix, 'Codigo copiado')} size="small">
                        <CopyOutlined />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Stack>,
                <Chip key="s" label={statusLabel(credential.status)} size="small" />,
                <Tooltip key="enabled" title={credential.status === 'EXPIRED' ? 'Expirada' : credential.status === 'ACTIVE' ? 'Deshabilitar' : 'Activar'}>
                  <span>
                    <Switch
                      checked={isVisuallyActive(credential)}
                      disabled={credential.status === 'EXPIRED' || togglingId === credential.id}
                      onChange={() => void toggleStatus(credential)}
                      size="small"
                      sx={credential.status === 'EXPIRED' ? { opacity: 0.45, pointerEvents: 'none' } : undefined}
                    />
                  </span>
                </Tooltip>,
                formatDate(credential.expiresAt),
                <Stack key="used" spacing={0.25}>
                  <Typography sx={{ fontSize: '0.82rem' }}>{formatDate(credential.lastUsedAt)}</Typography>
                  {credential.lastUsedIp ? <Typography color="text.secondary" variant="caption">IP: {credential.lastUsedIp}</Typography> : null}
                </Stack>,
                <Box key="a" sx={{ display: 'flex', gap: 0.75, alignItems: 'center', justifyContent: 'flex-end' }}>
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
