import { useEffect, useState } from 'react';
import { DeleteOutlined, EditOutlined, TagsOutlined } from '@ant-design/icons';
import { Box, Button, Card, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField, Typography } from '@mui/material';
import { DataTable, PaginationBar } from '../../shared/components/DataTable';
import { LoadingState } from '../../shared/components/LoadingState';
import { AppFormDialog, FormFieldStack } from '../../shared/components/AppFormDialog';

import type { TagItem } from '../../app/types';
import { useAppContext } from '../../app/AppContext';
import { apiRequest } from '../../shared/api/client';
import { confirmDanger, notifyError } from '../../shared/notifications';

export function TagsPage() {
  const { setHeaderAction, closeHeaderAction, setOperationLabel, clearOperationLabel } = useAppContext();
  const [tags, setTags] = useState<TagItem[]>([]);
  const [name, setName] = useState('');
  const [editingTag, setEditingTag] = useState<TagItem | null>(null);
  const [editName, setEditName] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(0);

  async function load() {
    if (tags.length === 0) setLoading(true);
    try {
      const payload = await apiRequest<{ data: TagItem[] }>('/api/tags');
      setTags(payload.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load().catch((err) => notifyError(err, 'No se pudo cargar.')); }, []);

  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextName = name.trim();
    if (!nextName) {
      notifyError('Ingresa el nombre del tag.');
      return;
    }

    setCreating(true);
    setOperationLabel('Creando tag...');
    try {
      await apiRequest('/api/tags', { method: 'POST', body: JSON.stringify({ name: nextName }) });
      setName('');
      await load();
      closeHeaderAction();
    } catch (err) {
      notifyError(err, 'No se pudo crear el tag.');
    } finally {
      setCreating(false);
      clearOperationLabel();
    }
  }

  function openEdit(tag: TagItem) {
    setEditingTag(tag);
    setEditName(tag.name);
  }

  async function update(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingTag) return;
    const nextName = editName.trim();
    if (!nextName) {
      notifyError('Ingresa el nombre del tag.');
      return;
    }

    setSaving(true);
    setOperationLabel('Guardando tag...');
    try {
      await apiRequest('/api/tags/' + editingTag.id, { method: 'PATCH', body: JSON.stringify({ name: nextName }) });
      setEditingTag(null);
      await load();
    } catch (err) {
      notifyError(err, 'No se pudo actualizar el tag.');
    } finally {
      setSaving(false);
      clearOperationLabel();
    }
  }

  async function remove(id: string) {
    setDeletingId(id);
    setOperationLabel('Eliminando tag...');
    try {
      await apiRequest('/api/tags/' + id, { method: 'DELETE' });
      setTags((current) => current.filter((tag) => tag.id !== id));
    } catch (err) {
      notifyError(err, 'No se pudo eliminar el tag.');
    } finally {
      setDeletingId('');
      clearOperationLabel();
    }
  }

  async function confirmRemove(tag: TagItem) {
    const confirmed = await confirmDanger({ text: `¿Estás seguro que quieres eliminar el tag "${tag.name}"?` });
    if (confirmed) await remove(tag.id);
  }

  useEffect(() => {
    setHeaderAction({
      label: 'Agregar',
      title: 'Nuevo tag',
      maxWidth: 'xs',
      content: (
        <FormFieldStack id="create-tag-form" onSubmit={create}>
          <TextField autoFocus fullWidth label="Nombre" onChange={(event) => setName(event.target.value)} value={name} />
        </FormFieldStack>
      ),
      contentActions: (
        <>
          <Button onClick={closeHeaderAction}>Cancelar</Button>
          <Button disabled={creating || !name.trim()} form="create-tag-form" startIcon={<TagsOutlined />} type="submit" variant="contained">Crear</Button>
        </>
      ),
    });

    return () => setHeaderAction(null);
  }, [clearOperationLabel, closeHeaderAction, creating, name, setHeaderAction, setOperationLabel]);

  return (
    <Stack spacing={2} sx={{ flexGrow: 1, minHeight: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Card sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minHeight: 0, p: 0 }}>
        {loading ? (
          <LoadingState label="Cargando tags..." minHeight="100%" />
        ) : tags.length === 0 ? (
          <Box sx={{ display: 'grid', placeItems: 'center', py: 6, flexGrow: 1 }}>
            <Typography>No hay tags.</Typography>
          </Box>
        ) : (
          <Box sx={{ flexGrow: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            <DataTable
              columns={['Tag', 'Plantillas', { name: 'Acciones', sort: false }]}
              data={tags.slice(page * rowsPerPage, (page + 1) * rowsPerPage).map((tag) => [
                <strong key="n">{tag.name}</strong>,
                tag.templateCount,
                <Stack key="a" direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
                  <Button onClick={() => openEdit(tag)} size="small" startIcon={<EditOutlined />}>Editar</Button>
                  <Button color="error" disabled={deletingId === tag.id} onClick={() => void confirmRemove(tag)} size="small" startIcon={<DeleteOutlined />}>Eliminar</Button>
                </Stack>,
              ])}
            />
            <PaginationBar page={page} setPage={setPage} rowsPerPage={rowsPerPage} setRowsPerPage={setRowsPerPage} total={tags.length} />
          </Box>
        )}
      </Card>

      <AppFormDialog
        actions={(
          <>
            <Button onClick={() => setEditingTag(null)}>Cancelar</Button>
            <Button disabled={saving || !editName.trim()} form="edit-tag-form" startIcon={<EditOutlined />} type="submit" variant="contained">Guardar</Button>
          </>
        )}
        maxWidth="xs"
        onClose={() => setEditingTag(null)}
        open={Boolean(editingTag)}
        title="Editar tag"
      >
          <FormFieldStack id="edit-tag-form" onSubmit={update}>
            <TextField autoFocus fullWidth label="Nombre" onChange={(event) => setEditName(event.target.value)} value={editName} />
          </FormFieldStack>
      </AppFormDialog>
    </Stack>
  );
}
