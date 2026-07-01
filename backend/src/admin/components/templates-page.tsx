import React, { useEffect, useState } from 'react';
import { Box, Button, H2, H3, Input, Label, Loader, MessageBox, Table, TableBody, TableCell, TableHead, TableRow, Text } from '@adminjs/design-system';

type TemplateItem = {
  id: string;
  name: string;
  code: string;
  status: string;
  versionNumber: number;
  pageCount: number;
  pageFormat: string;
  pageOrientation: string;
  tags: string[];
};

type TemplateListResponse = {
  data: TemplateItem[];
};

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { message?: string } | null;
    throw new Error(payload?.message ?? `Error ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [name, setName] = useState('');
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function loadTemplates() {
    setLoading(true);
    setError('');

    try {
      const payload = await apiRequest<TemplateListResponse>('/api/templates');
      setTemplates(payload.data);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudo cargar plantillas.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadTemplates();
  }, []);

  async function createTemplate() {
    const trimmedName = name.trim();

    if (!trimmedName) {
      setError('Ingresa el nombre de la plantilla.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      await apiRequest('/api/templates', {
        method: 'POST',
        body: JSON.stringify({
          name: trimmedName,
          tagNames: tags.split(',').map((tag) => tag.trim()).filter(Boolean),
        }),
      });
      setName('');
      setTags('');
      await loadTemplates();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudo crear la plantilla.');
    } finally {
      setSaving(false);
    }
  }

  async function deleteTemplate(id: string) {
    setError('');

    try {
      await apiRequest(`/api/templates/${id}`, { method: 'DELETE' });
      await loadTemplates();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudo eliminar la plantilla.');
    }
  }

  return (
    <Box variant="grey" minHeight="100vh" p="xl">
      <Box bg="white" p="xl" mb="lg" boxShadow="card" borderRadius="default">
        <H2>Plantillas PDF</H2>
        <Text mt="sm">Administra plantillas como una sola entidad. El sistema crea version y pagina inicial automaticamente.</Text>
      </Box>

      <Box bg="white" p="xl" mb="lg" boxShadow="card" borderRadius="default">
        <H3>Nueva plantilla</H3>
        <Box display="grid" gridTemplateColumns={["1fr", "1fr 1fr auto"]} gridGap="lg" alignItems="end" mt="lg">
          <Box>
            <Label>Nombre</Label>
            <Input value={name} onChange={(event: React.ChangeEvent<HTMLInputElement>) => setName(event.target.value)} placeholder="Ej. Certificado de asistencia" />
          </Box>
          <Box>
            <Label>Etiquetas</Label>
            <Input value={tags} onChange={(event: React.ChangeEvent<HTMLInputElement>) => setTags(event.target.value)} placeholder="certificado, rrhh" />
          </Box>
          <Button variant="primary" disabled={saving} onClick={createTemplate}>{saving ? 'Creando...' : 'Crear'}</Button>
        </Box>
      </Box>

      {error ? <MessageBox mb="lg" message={error} variant="danger" /> : null}

      <Box bg="white" p="xl" boxShadow="card" borderRadius="default">
        <Box display="flex" justifyContent="space-between" alignItems="center" mb="lg">
          <H3>Catalogo</H3>
          <Text>{templates.length} plantillas</Text>
        </Box>

        {loading ? (
          <Loader />
        ) : templates.length === 0 ? (
          <MessageBox message="No hay plantillas registradas." variant="info" />
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nombre</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Version</TableCell>
                <TableCell>Hoja</TableCell>
                <TableCell>Paginas</TableCell>
                <TableCell>Etiquetas</TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {templates.map((template) => (
                <TableRow key={template.id}>
                  <TableCell>
                    <Text fontWeight="bold">{template.name}</Text>
                    <Text variant="sm">{template.code}</Text>
                  </TableCell>
                  <TableCell>{template.status}</TableCell>
                  <TableCell>v{template.versionNumber}</TableCell>
                  <TableCell>{template.pageFormat} {template.pageOrientation === 'LANDSCAPE' ? 'Horizontal' : 'Vertical'}</TableCell>
                  <TableCell>{template.pageCount}</TableCell>
                  <TableCell>{template.tags.join(', ') || 'Sin etiquetas'}</TableCell>
                  <TableCell>
                    <Button size="sm" variant="danger" onClick={() => deleteTemplate(template.id)}>Eliminar</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Box>
    </Box>
  );
}
