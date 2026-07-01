import { useEffect, useState } from 'react';
import { DeleteOutlined, TagsOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField } from '@mui/material';

import type { TagItem } from '../../app/types';
import { useAppContext } from '../../app/AppContext';
import { apiRequest } from '../../shared/api/client';

export function TagsPage() {
  const { setHeaderAction, closeHeaderAction } = useAppContext();
  const [tags, setTags] = useState<TagItem[]>([]);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);

  async function load() {
    const payload = await apiRequest<{ data: TagItem[] }>('/api/tags');
    setTags(payload.data);
  }

  useEffect(() => { void load().catch((err) => setError(err instanceof Error ? err.message : 'No se pudo cargar.')); }, []);

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

  async function remove(id: string) {
    setError('');
    await apiRequest(`/api/tags/${id}`, { method: 'DELETE' });
    await load();
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
              {tags.length === 0 ? <TableRow><TableCell colSpan={3}>No hay tags.</TableCell></TableRow> : tags.map((tag) => (
                <TableRow key={tag.id}>
                  <TableCell><strong>{tag.name}</strong></TableCell>
                  <TableCell>{tag.templateCount}</TableCell>
                  <TableCell align="right"><Button color="error" onClick={() => void remove(tag.id)} size="small" startIcon={<DeleteOutlined />}>Eliminar</Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Stack>
  );
}
