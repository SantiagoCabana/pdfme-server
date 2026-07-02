import { useEffect, useState } from 'react';
import { DeleteOutlined, EditOutlined, TagsOutlined } from '@ant-design/icons';
import { Alert, Button, Card, CircularProgress, Dialog, DialogContent, DialogTitle, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, TextField } from '@mui/material';

import type { TagItem } from '../../app/types';
import { useAppContext } from '../../app/AppContext';
import { apiRequest } from '../../shared/api/client';

export function TagsPage() {
  const { setHeaderAction, closeHeaderAction } = useAppContext();
  const [tags, setTags] = useState<TagItem[]>([]);
  const [name, setName] = useState('');
  const [editingTag, setEditingTag] = useState<TagItem | null>(null);
  const [editName, setEditName] = useState('');
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
      const payload = await apiRequest<{ data: TagItem[] }>('/api/tags');
      setTags(payload.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load().catch((err) => setError(err instanceof Error ? err.message : 'No se pudo cargar.')); }, []);

  const visibleTags = tags.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setCreating(true);
    try {
      await apiRequest('/api/tags', { method: 'POST', body: JSON.stringify({ name }) });
      setName('');
      await load();
      closeHeaderAction();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear el tag.');
    } finally {
      setCreating(false);
    }
  }

  function openEdit(tag: TagItem) {
    setEditingTag(tag);
    setEditName(tag.name);
  }

  async function update(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingTag) return;
    setSaving(true);
    setError('');
    try {
      await apiRequest('/api/tags/' + editingTag.id, { method: 'PATCH', body: JSON.stringify({ name: editName }) });
      setEditingTag(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar el tag.');
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    setError('');
    setDeletingId(id);
    try {
      await apiRequest('/api/tags/' + id, { method: 'DELETE' });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar el tag.');
    } finally {
      setDeletingId('');
    }
  }

  useEffect(() => {
    setHeaderAction({
      label: 'Agregar',
      title: 'Nuevo tag',
      maxWidth: 'xs',
      content: (
        <Stack component="form" spacing={2} onSubmit={create}>
          <TextField autoFocus fullWidth label="Nombre" onChange={(event) => setName(event.target.value)} value={name} />
          <Button disabled={creating} startIcon={<TagsOutlined />} type="submit" variant="contained">{creating ? 'Creando...' : 'Crear tag'}</Button>
        </Stack>
      ),
    });

    return () => setHeaderAction(null);
  }, [closeHeaderAction, creating, name, setHeaderAction]);

  return (
    <Stack spacing={2}>
      {error ? <Alert severity="error">{error}</Alert> : null}
      <Card>
        <TableContainer>
          <Table>
            <TableHead><TableRow><TableCell>Tag</TableCell><TableCell>Plantillas</TableCell><TableCell align="right">Acciones</TableCell></TableRow></TableHead>
            <TableBody>
              {loading ? <TableRow><TableCell colSpan={3} align="center"><CircularProgress size={24} /></TableCell></TableRow> : null}
              {!loading && tags.length === 0 ? <TableRow><TableCell colSpan={3}>No hay tags.</TableCell></TableRow> : null}
              {!loading ? visibleTags.map((tag) => (
                <TableRow key={tag.id}>
                  <TableCell><strong>{tag.name}</strong></TableCell>
                  <TableCell>{tag.templateCount}</TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
                      <Button onClick={() => openEdit(tag)} size="small" startIcon={<EditOutlined />}>Editar</Button>
                      <Button color="error" disabled={deletingId === tag.id} onClick={() => void remove(tag.id)} size="small" startIcon={<DeleteOutlined />}>{deletingId === tag.id ? 'Eliminando...' : 'Eliminar'}</Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              )) : null}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={tags.length}
          labelRowsPerPage="Filas por pagina"
          onPageChange={(_event, nextPage) => setPage(nextPage)}
          onRowsPerPageChange={(event) => { setRowsPerPage(Number(event.target.value)); setPage(0); }}
          page={page}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={[10, 25, 50]}
        />
      </Card>

      <Dialog fullWidth maxWidth="xs" onClose={() => setEditingTag(null)} open={Boolean(editingTag)}>
        <DialogTitle>Editar tag</DialogTitle>
        <DialogContent dividers>
          <Stack component="form" spacing={2} onSubmit={update}>
            <TextField autoFocus fullWidth label="Nombre" onChange={(event) => setEditName(event.target.value)} value={editName} />
            <Button disabled={saving} startIcon={<EditOutlined />} type="submit" variant="contained">{saving ? 'Guardando...' : 'Guardar cambios'}</Button>
          </Stack>
        </DialogContent>
      </Dialog>
    </Stack>
  );
}
