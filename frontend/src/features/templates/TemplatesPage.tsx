import { useEffect, useState } from 'react';
import { DeleteOutlined, PlusOutlined, SendOutlined } from '@ant-design/icons';
import { Alert, Box, Button, Card, Chip, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField } from '@mui/material';

import { can, statusLabel } from '../../app/session';
import type { TemplateItem } from '../../app/types';
import { useAppContext } from '../../app/AppContext';
import { apiRequest } from '../../shared/api/client';

export function TemplatesPage() {
  const { user, setHeaderAction } = useAppContext();
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [error, setError] = useState('');

  async function load() {
    const payload = await apiRequest<{ data: TemplateItem[] }>('/api/templates');
    setTemplates(payload.data);
  }

  useEffect(() => { void load().catch((err) => setError(err instanceof Error ? err.message : 'No se pudo cargar.')); }, []);

  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    await apiRequest('/api/templates', { method: 'POST', body: JSON.stringify({ name, description: description || null, tagNames: tags.split(',').map((tag) => tag.trim()).filter(Boolean) }) });
    setName(''); setDescription(''); setTags('');
    await load();
  }


  useEffect(() => {
    if (!can(user, 'templates.create')) {
      setHeaderAction(null);
      return;
    }

    setHeaderAction({
      label: 'Agregar',
      content: (
        <Stack component="form" direction={{ xs: 'column', md: 'row' }} spacing={1.5} onSubmit={create}>
          <TextField label="Nombre" onChange={(event) => setName(event.target.value)} value={name} />
          <TextField label="Descripcion" onChange={(event) => setDescription(event.target.value)} value={description} />
          <TextField label="Etiquetas" onChange={(event) => setTags(event.target.value)} value={tags} />
          <Button startIcon={<PlusOutlined />} type="submit" variant="contained">Crear</Button>
        </Stack>
      ),
    });

    return () => setHeaderAction(null);
  }, [description, name, setHeaderAction, tags, user]);

  async function publish(id: string) { await apiRequest(`/api/templates/${id}/publish`, { method: 'PATCH' }); await load(); }
  async function remove(id: string) { await apiRequest(`/api/templates/${id}`, { method: 'DELETE' }); await load(); }

  return (
    <Stack spacing={2}>
      {error ? <Alert severity="error">{error}</Alert> : null}
      <Card><TableContainer><Table><TableHead><TableRow><TableCell>Plantilla</TableCell><TableCell>Estado</TableCell><TableCell>Version</TableCell><TableCell>Hoja</TableCell><TableCell>Tags</TableCell><TableCell align="right">Acciones</TableCell></TableRow></TableHead><TableBody>{templates.length === 0 ? <TableRow><TableCell colSpan={6}>No hay plantillas.</TableCell></TableRow> : templates.map((template) => <TableRow key={template.id}><TableCell><Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}><Box sx={{ width: template.pageOrientation === 'LANDSCAPE' ? 58 : 38, height: template.pageOrientation === 'LANDSCAPE' ? 34 : 52, border: '1px solid', borderColor: 'divider', borderRadius: 1, bgcolor: 'background.default' }} /><Box><strong>{template.name}</strong><br /><small>{template.code}</small></Box></Stack></TableCell><TableCell><Chip label={statusLabel(template.status)} size="small" /></TableCell><TableCell>v{template.versionNumber}{template.isPublished ? ' publicada' : ''}</TableCell><TableCell>{template.pageFormat} {template.pageOrientation === 'LANDSCAPE' ? 'Horizontal' : 'Vertical'}</TableCell><TableCell>{template.tags.join(', ') || 'Sin etiquetas'}</TableCell><TableCell align="right"><Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>{can(user, 'templates.publish') ? <Button onClick={() => void publish(template.id)} size="small" startIcon={<SendOutlined />}>Publicar</Button> : null}{can(user, 'templates.delete') ? <Button color="error" onClick={() => void remove(template.id)} size="small" startIcon={<DeleteOutlined />}>Eliminar</Button> : null}</Stack></TableCell></TableRow>)}</TableBody></Table></TableContainer></Card>
    </Stack>
  );
}
