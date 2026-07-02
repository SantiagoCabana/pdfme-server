import { useEffect, useMemo, useState } from 'react';
import { DeleteOutlined, PlusOutlined, SearchOutlined, SendOutlined } from '@ant-design/icons';
import { Alert, Box, Button, Card, Chip, CircularProgress, InputAdornment, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, TextField } from '@mui/material';

import { can, statusLabel } from '../../app/session';
import type { TemplateItem } from '../../app/types';
import { useAppContext } from '../../app/AppContext';
import { apiRequest } from '../../shared/api/client';

export function TemplatesPage() {
  const { user, setHeaderAction, closeHeaderAction } = useAppContext();
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [name, setName] = useState('');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [publishingId, setPublishingId] = useState('');
  const [deletingId, setDeletingId] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  async function load() {
    setLoading(true);
    try {
      const payload = await apiRequest<{ data: TemplateItem[] }>('/api/templates');
      setTemplates(payload.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load().catch((err) => setError(err instanceof Error ? err.message : 'No se pudo cargar.')); }, []);

  const filteredTemplates = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return templates;
    return templates.filter((template) => (
      template.name.toLowerCase().includes(query) ||
      template.code.toLowerCase().includes(query)
    ));
  }, [search, templates]);

  const visibleTemplates = filteredTemplates.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  useEffect(() => {
    setPage(0);
  }, [search]);

  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setCreating(true);
    try {
      await apiRequest('/api/templates', { method: 'POST', body: JSON.stringify({ name }) });
      setName('');
      await load();
      closeHeaderAction();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear la plantilla.');
    } finally {
      setCreating(false);
    }
  }


  useEffect(() => {
    if (!can(user, 'templates.create')) {
      setHeaderAction(null);
      return;
    }

    setHeaderAction({
      label: 'Agregar',
      title: 'Nueva plantilla',
      maxWidth: 'sm',
      content: (
        <Stack component="form" spacing={2} onSubmit={create}>
          <TextField autoFocus fullWidth label="Nombre" onChange={(event) => setName(event.target.value)} value={name} />
          <Button disabled={creating} startIcon={<PlusOutlined />} type="submit" variant="contained">{creating ? 'Creando...' : 'Crear plantilla'}</Button>
        </Stack>
      ),
    });

    return () => setHeaderAction(null);
  }, [closeHeaderAction, creating, name, setHeaderAction, user]);

  async function publish(id: string) {
    setError('');
    setPublishingId(id);
    try {
      await apiRequest(`/api/templates/${id}/publish`, { method: 'PATCH' });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo publicar la plantilla.');
    } finally {
      setPublishingId('');
    }
  }

  async function remove(id: string) {
    setError('');
    setDeletingId(id);
    try {
      await apiRequest(`/api/templates/${id}`, { method: 'DELETE' });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar la plantilla.');
    } finally {
      setDeletingId('');
    }
  }

  return (
    <Stack spacing={2}>
      {error ? <Alert severity="error">{error}</Alert> : null}
      <Card>
        <Box sx={{ p: 2, pb: 0 }}>
          <TextField
            fullWidth
            label="Buscar plantilla"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Nombre o codigo"
            size="small"
            slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchOutlined /></InputAdornment> } }}
            value={search}
          />
        </Box>
        <TableContainer>
          <Table>
            <TableHead><TableRow><TableCell>Plantilla</TableCell><TableCell>Estado</TableCell><TableCell>Version</TableCell><TableCell>Hoja</TableCell><TableCell>Tags</TableCell><TableCell align="right">Acciones</TableCell></TableRow></TableHead>
            <TableBody>
              {loading ? <TableRow><TableCell align="center" colSpan={6}><CircularProgress size={24} /></TableCell></TableRow> : null}
              {!loading && filteredTemplates.length === 0 ? <TableRow><TableCell colSpan={6}>No hay plantillas.</TableCell></TableRow> : null}
              {!loading ? visibleTemplates.map((template) => <TableRow key={template.id}><TableCell><Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}><Box sx={{ width: template.pageOrientation === 'LANDSCAPE' ? 58 : 38, height: template.pageOrientation === 'LANDSCAPE' ? 34 : 52, border: '1px solid', borderColor: 'divider', borderRadius: 1, bgcolor: 'background.default' }} /><Box><strong>{template.name}</strong><br /><small>{template.code}</small></Box></Stack></TableCell><TableCell><Chip label={statusLabel(template.status)} size="small" /></TableCell><TableCell>v{template.versionNumber}{template.isPublished ? ' publicada' : ''}</TableCell><TableCell>{template.pageFormat} {template.pageOrientation === 'LANDSCAPE' ? 'Horizontal' : 'Vertical'}</TableCell><TableCell>{template.tags.join(', ') || 'Sin etiquetas'}</TableCell><TableCell align="right"><Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>{can(user, 'templates.publish') ? <Button disabled={publishingId === template.id} onClick={() => void publish(template.id)} size="small" startIcon={<SendOutlined />}>{publishingId === template.id ? 'Publicando...' : 'Publicar'}</Button> : null}{can(user, 'templates.delete') ? <Button color="error" disabled={deletingId === template.id} onClick={() => void remove(template.id)} size="small" startIcon={<DeleteOutlined />}>{deletingId === template.id ? 'Eliminando...' : 'Eliminar'}</Button> : null}</Stack></TableCell></TableRow>) : null}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={filteredTemplates.length}
          labelRowsPerPage="Filas por pagina"
          onPageChange={(_event, nextPage) => setPage(nextPage)}
          onRowsPerPageChange={(event) => { setRowsPerPage(Number(event.target.value)); setPage(0); }}
          page={page}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={[10, 25, 50]}
        />
      </Card>
    </Stack>
  );
}
