import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeftOutlined,
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  RetweetOutlined,
  SaveOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  InputAdornment,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import type { Template as PdfmeTemplate } from '@pdfme/common';

import { can, statusLabel } from '../../app/session';
import type { TemplateItem } from '../../app/types';
import { useAppContext } from '../../app/AppContext';
import { apiRequest } from '../../shared/api/client';

const PdfmeDesigner = lazy(() => import('./components/PdfmeDesigner').then((module) => ({ default: module.PdfmeDesigner })));

const pageFormats = [
  { value: 'A4', label: 'A4', width: 210, height: 297 },
  { value: 'LETTER', label: 'Carta', width: 216, height: 279 },
  { value: 'LEGAL', label: 'Legal', width: 216, height: 356 },
  { value: 'CUSTOM', label: 'Personalizado', width: 210, height: 297 },
];

function randomSuffix() {
  const values = new Uint8Array(4);
  crypto.getRandomValues(values);
  return Array.from(values).map((value) => value.toString(16).padStart(2, '0')).join('');
}

function slugifyCode(value: string) {
  const base = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 48);

  return base || 'template';
}

function buildCode(name: string, suffix: string) {
  return `${slugifyCode(name)}_${suffix}`;
}

function buildPdfmeTemplate(template: TemplateItem, options?: { pageWidthMm?: number; pageHeightMm?: number }) {
  const storedTemplate = template.designerJson ?? {};
  const storedBasePdf = typeof storedTemplate.basePdf === 'object' && storedTemplate.basePdf && !Array.isArray(storedTemplate.basePdf)
    ? storedTemplate.basePdf
    : {};

  return {
    ...storedTemplate,
    schemas: Array.isArray(storedTemplate.schemas) ? storedTemplate.schemas : [[]],
    basePdf: {
      ...storedBasePdf,
      width: options?.pageWidthMm ?? template.pageWidthMm,
      height: options?.pageHeightMm ?? template.pageHeightMm,
      padding: [0, 0, 0, 0],
    },
  } as PdfmeTemplate;
}

function updatePdfmeBasePdf(current: PdfmeTemplate | null, patch: { width?: number; height?: number }) {
  if (!current) return current;
  const basePdf = typeof current.basePdf === 'object' && current.basePdf && 'width' in current.basePdf && 'height' in current.basePdf
    ? current.basePdf
    : { width: 210, height: 297, padding: [0, 0, 0, 0] as [number, number, number, number] };

  return {
    ...current,
    basePdf: {
      ...basePdf,
      ...patch,
      padding: basePdf.padding ?? [0, 0, 0, 0],
    },
  };
}

export function TemplatesPage() {
  const { user, setHeaderAction, closeHeaderAction, setHeaderControls } = useAppContext();
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [editingTemplate, setEditingTemplate] = useState<TemplateItem | null>(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState(() => buildCode('', randomSuffix()));
  const [codeTouched, setCodeTouched] = useState(false);
  const [codeSuffix, setCodeSuffix] = useState(() => randomSuffix());
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingVersion, setSavingVersion] = useState(false);
  const [deletingId, setDeletingId] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [pageFormat, setPageFormat] = useState('A4');
  const [pageOrientation, setPageOrientation] = useState<'PORTRAIT' | 'LANDSCAPE'>('PORTRAIT');
  const [pageWidthMm, setPageWidthMm] = useState(210);
  const [pageHeightMm, setPageHeightMm] = useState(297);
  const [designerTemplate, setDesignerTemplate] = useState<PdfmeTemplate | null>(null);

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

  function resetCreateForm() {
    const suffix = randomSuffix();
    setName('');
    setCodeSuffix(suffix);
    setCode(buildCode('', suffix));
    setCodeTouched(false);
  }

  function openEditor(template: TemplateItem) {
    setEditingTemplate(template);
    setPageFormat(template.pageFormat);
    setPageOrientation(template.pageOrientation === 'LANDSCAPE' ? 'LANDSCAPE' : 'PORTRAIT');
    setPageWidthMm(template.pageWidthMm);
    setPageHeightMm(template.pageHeightMm);
    setDesignerTemplate(buildPdfmeTemplate(template));
    setError('');
  }

  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setCreating(true);
    try {
      const payload = await apiRequest<{ template: TemplateItem }>('/api/templates', {
        method: 'POST',
        body: JSON.stringify({ name, code }),
      });
      resetCreateForm();
      await load();
      closeHeaderAction();
      openEditor(payload.template);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear la plantilla.');
    } finally {
      setCreating(false);
    }
  }

  useEffect(() => {
    if (editingTemplate || !can(user, 'templates.create')) {
      setHeaderAction(null);
      return;
    }

    setHeaderAction({
      label: 'Agregar',
      title: 'Nueva plantilla',
      maxWidth: 'sm',
      content: (
        <Stack component="form" spacing={2} onSubmit={create}>
          <TextField
            autoFocus
            fullWidth
            label="Nombre"
            onChange={(event) => {
              const nextName = event.target.value;
              setName(nextName);
              if (!codeTouched) setCode(buildCode(nextName, codeSuffix));
            }}
            value={name}
          />
          <TextField
            fullWidth
            helperText="Identificador usado por las apps y APIs para referirse a esta plantilla."
            label="Codigo"
            onChange={(event) => { setCode(event.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_')); setCodeTouched(true); }}
            value={code}
          />
          <Button disabled={creating} startIcon={<PlusOutlined />} type="submit" variant="contained">{creating ? 'Creando...' : 'Crear plantilla'}</Button>
        </Stack>
      ),
    });

    return () => setHeaderAction(null);
  }, [closeHeaderAction, code, codeSuffix, codeTouched, creating, editingTemplate, name, setHeaderAction, user]);

  async function saveSettings() {
    if (!editingTemplate) return;
    setError('');
    setSaving(true);
    try {
      const payload = await apiRequest<{ template: TemplateItem }>('/api/templates/' + editingTemplate.id + '/page-settings', {
        method: 'PATCH',
        body: JSON.stringify({ pageFormat, pageOrientation, pageWidthMm, pageHeightMm, designerJson: designerTemplate }),
      });
      setEditingTemplate(payload.template);
      setDesignerTemplate(buildPdfmeTemplate(payload.template));
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar la plantilla.');
    } finally {
      setSaving(false);
    }
  }

  async function saveVersion() {
    if (!editingTemplate) return;
    setError('');
    setSavingVersion(true);
    try {
      await saveSettings();
      const payload = await apiRequest<{ template: TemplateItem }>('/api/templates/' + editingTemplate.id + '/versions', { method: 'POST' });
      setEditingTemplate(payload.template);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar una nueva version.');
    } finally {
      setSavingVersion(false);
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

  function setFormat(format: string) {
    setPageFormat(format);
    if (format === 'CUSTOM') return;
    const selectedFormat = pageFormats.find((item) => item.value === format);
    if (!selectedFormat) return;
    if (pageOrientation === 'LANDSCAPE') {
      setPageWidthMm(selectedFormat.height);
      setPageHeightMm(selectedFormat.width);
      setDesignerTemplate((current) => updatePdfmeBasePdf(current, { width: selectedFormat.height, height: selectedFormat.width }));
    } else {
      setPageWidthMm(selectedFormat.width);
      setPageHeightMm(selectedFormat.height);
      setDesignerTemplate((current) => updatePdfmeBasePdf(current, { width: selectedFormat.width, height: selectedFormat.height }));
    }
  }

  function toggleOrientation() {
    setPageOrientation((value) => value === 'PORTRAIT' ? 'LANDSCAPE' : 'PORTRAIT');
    setPageWidthMm(pageHeightMm);
    setPageHeightMm(pageWidthMm);
    setDesignerTemplate((current) => updatePdfmeBasePdf(current, { width: pageHeightMm, height: pageWidthMm }));
  }

  useEffect(() => {
    if (!editingTemplate) {
      setHeaderControls(null);
      return;
    }

    setHeaderAction(null);
    setHeaderControls(
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        <TextField label="Formato" onChange={(event) => setFormat(event.target.value)} select size="small" sx={{ width: 120 }} value={pageFormat}>
          {pageFormats.map((format) => <MenuItem key={format.value} value={format.value}>{format.label}</MenuItem>)}
        </TextField>
        <TextField label="Ancho mm" onChange={(event) => { const next = Number(event.target.value); setPageWidthMm(next); setDesignerTemplate((current) => updatePdfmeBasePdf(current, { width: next })); }} size="small" sx={{ width: 110 }} type="number" value={pageWidthMm} />
        <TextField label="Alto mm" onChange={(event) => { const next = Number(event.target.value); setPageHeightMm(next); setDesignerTemplate((current) => updatePdfmeBasePdf(current, { height: next })); }} size="small" sx={{ width: 110 }} type="number" value={pageHeightMm} />
        <Button onClick={toggleOrientation} size="small" startIcon={<RetweetOutlined />} variant="outlined">
          {pageOrientation === 'LANDSCAPE' ? 'Horizontal' : 'Vertical'}
        </Button>
        <Button disabled={saving} onClick={() => void saveSettings()} size="small" startIcon={<SaveOutlined />} variant="contained">
          {saving ? 'Guardando...' : 'Guardar'}
        </Button>
        <Button disabled={savingVersion} onClick={() => void saveVersion()} size="small" startIcon={<CopyOutlined />} variant="outlined">
          {savingVersion ? 'Creando...' : 'Guardar version'}
        </Button>
      </Stack>,
    );

    return () => setHeaderControls(null);
  }, [editingTemplate, pageFormat, pageHeightMm, pageOrientation, pageWidthMm, saving, savingVersion, setHeaderAction, setHeaderControls]);

  if (editingTemplate) {
    return (
      <Stack spacing={2}>
        {error ? <Alert severity="error">{error}</Alert> : null}
        <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <Button onClick={() => setEditingTemplate(null)} startIcon={<ArrowLeftOutlined />}>Volver a plantillas</Button>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="subtitle2">{editingTemplate.name}</Typography>
            <Typography color="text.secondary" variant="caption">{editingTemplate.code} · v{editingTemplate.versionNumber}</Typography>
          </Box>
        </Stack>
        <Box sx={{ minHeight: 'calc(100vh - 170px)' }}>
          <Card sx={{ minWidth: 0, overflow: 'hidden', bgcolor: 'background.default' }}>
            {designerTemplate ? (
              <Suspense fallback={<Box sx={{ display: 'grid', minHeight: 680, placeItems: 'center' }}><CircularProgress size={24} /></Box>}>
                <PdfmeDesigner onChange={setDesignerTemplate} template={designerTemplate} />
              </Suspense>
            ) : <Box sx={{ display: 'grid', minHeight: 680, placeItems: 'center' }}><CircularProgress size={24} /></Box>}
          </Card>
        </Box>
      </Stack>
    );
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
              {!loading ? visibleTemplates.map((template) => <TableRow key={template.id}><TableCell><Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}><Box sx={{ width: template.pageOrientation === 'LANDSCAPE' ? 58 : 38, height: template.pageOrientation === 'LANDSCAPE' ? 34 : 52, border: '1px solid', borderColor: 'divider', borderRadius: 1, bgcolor: 'background.default' }} /><Box><strong>{template.name}</strong><br /><small>{template.code}</small></Box></Stack></TableCell><TableCell><Chip label={statusLabel(template.status)} size="small" /></TableCell><TableCell>v{template.versionNumber}</TableCell><TableCell>{template.pageFormat} {template.pageOrientation === 'LANDSCAPE' ? 'Horizontal' : 'Vertical'}</TableCell><TableCell>{template.tags.join(', ') || 'Sin etiquetas'}</TableCell><TableCell align="right"><Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}><Button onClick={() => openEditor(template)} size="small" startIcon={<EditOutlined />}>Editar</Button>{can(user, 'templates.delete') ? <Button color="error" disabled={deletingId === template.id} onClick={() => void remove(template.id)} size="small" startIcon={<DeleteOutlined />}>{deletingId === template.id ? 'Eliminando...' : 'Eliminar'}</Button> : null}</Stack></TableCell></TableRow>) : null}
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
