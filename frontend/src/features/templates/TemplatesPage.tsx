import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeftOutlined,
  DeleteOutlined,
  EditOutlined,
  EllipsisOutlined,
  EyeOutlined,
  PictureOutlined,
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
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  List,
  ListItemButton,
  ListItemText,
  Menu,
  MenuItem,
  Divider,
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
import type { Schema, Template as PdfmeTemplate } from '@pdfme/common';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { can } from '../../app/session';
import type { TemplateItem } from '../../app/types';
import { useAppContext } from '../../app/AppContext';
import { apiRequest } from '../../shared/api/client';
import type { PdfmeDesignerHandle } from './components/PdfmeDesigner';

const PdfmeDesigner = lazy(() => import('./components/PdfmeDesigner').then((module) => ({ default: module.PdfmeDesigner })));
const PdfmeViewer = lazy(() => import('./components/PdfmeViewer').then((module) => ({ default: module.PdfmeViewer })));

const pageFormats = [
  { value: 'A4', label: 'A4', width: 210, height: 297 },
  { value: 'LETTER', label: 'Carta', width: 216, height: 279 },
  { value: 'LEGAL', label: 'Legal', width: 216, height: 356 },
  { value: 'CUSTOM', label: 'Personalizado', width: 210, height: 297 },
];

const backgroundSchemaName = '__page_background';
type BlankBasePdf = {
  width: number;
  height: number;
  padding: [number, number, number, number];
  staticSchema?: Schema[];
};

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
    ? storedTemplate.basePdf as Record<string, unknown>
    : {} as Record<string, unknown>;
  const width = options?.pageWidthMm ?? template.pageWidthMm;
  const height = options?.pageHeightMm ?? template.pageHeightMm;

  return {
    ...storedTemplate,
    schemas: Array.isArray(storedTemplate.schemas) ? storedTemplate.schemas : [[]],
    basePdf: {
      ...storedBasePdf,
      width,
      height,
      padding: [0, 0, 0, 0],
      staticSchema: syncBackgroundSchemaSize(storedBasePdf.staticSchema, width, height),
    },
  } as PdfmeTemplate;
}

function syncBackgroundSchemaSize(staticSchema: unknown, width: number, height: number): Schema[] | undefined {
  if (!Array.isArray(staticSchema)) return undefined;

  return (staticSchema as any[]).map((schema) => {
    if (schema?.name !== backgroundSchemaName) {
      return schema;
    }

    return {
      ...schema,
      position: { x: 0, y: 0 },
      width,
      height,
    };
  });
}

function updatePdfmeBasePdf(current: PdfmeTemplate | null, patch: { width?: number; height?: number }) {
  if (!current) return current;
  const basePdf = typeof current.basePdf === 'object' && current.basePdf && 'width' in current.basePdf && 'height' in current.basePdf
    ? current.basePdf as BlankBasePdf
    : { width: 210, height: 297, padding: [0, 0, 0, 0] as [number, number, number, number] };
  const nextWidth = patch.width ?? basePdf.width;
  const nextHeight = patch.height ?? basePdf.height;

  return {
    ...current,
    basePdf: {
      ...basePdf,
      ...patch,
      width: nextWidth,
      height: nextHeight,
      padding: basePdf.padding ?? [0, 0, 0, 0],
      staticSchema: syncBackgroundSchemaSize(basePdf.staticSchema, nextWidth, nextHeight),
    },
  } as PdfmeTemplate;
}

function updatePdfmeBackground(current: PdfmeTemplate | null, dataUrl: string, width: number, height: number) {
  if (!current) return current;

  const currentBasePdf = typeof current.basePdf === 'object' && current.basePdf && !Array.isArray(current.basePdf)
    ? current.basePdf as Record<string, unknown>
    : {};
  const staticSchema = Array.isArray(currentBasePdf.staticSchema) ? currentBasePdf.staticSchema : [];
  const backgroundSchema = {
    name: backgroundSchemaName,
    type: 'image',
    content: dataUrl,
    position: { x: 0, y: 0 },
    width,
    height,
    readOnly: true,
  };

  return {
    ...current,
    basePdf: {
      ...currentBasePdf,
      width,
      height,
      padding: currentBasePdf.padding ?? [0, 0, 0, 0],
      staticSchema: [
        backgroundSchema,
        ...staticSchema.filter((schema: any) => schema?.name !== backgroundSchemaName),
      ],
    },
  } as unknown as PdfmeTemplate;
}

function removePdfmeBackground(current: PdfmeTemplate | null) {
  if (!current) return current;

  const currentBasePdf = typeof current.basePdf === 'object' && current.basePdf && !Array.isArray(current.basePdf)
    ? current.basePdf as Record<string, unknown>
    : {};
  const staticSchema = Array.isArray(currentBasePdf.staticSchema) ? currentBasePdf.staticSchema : [];

  return {
    ...current,
    basePdf: {
      ...currentBasePdf,
      padding: currentBasePdf.padding ?? [0, 0, 0, 0],
      staticSchema: staticSchema.filter((schema: any) => schema?.name !== backgroundSchemaName),
    },
  } as unknown as PdfmeTemplate;
}

export function TemplatesPage() {
  const { user, setHeaderAction, closeHeaderAction, openHeaderAction, setHeaderControls } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();
  const { code: routeCode } = useParams();
  const isPreviewRoute = location.pathname.includes('/templates/preview/');
  const isEditRoute = location.pathname.includes('/templates/edit/');
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [editingTemplate, setEditingTemplate] = useState<TemplateItem | null>(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState(() => buildCode('', randomSuffix()));
  const [codeTouched, setCodeTouched] = useState(false);
  const [codeSuffix, setCodeSuffix] = useState(() => randomSuffix());
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingVersion, setSavingVersion] = useState(false);
  const [switchingVersion, setSwitchingVersion] = useState(false);
  const [deletingId, setDeletingId] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [pageFormat, setPageFormat] = useState('A4');
  const [pageOrientation, setPageOrientation] = useState<'PORTRAIT' | 'LANDSCAPE'>('PORTRAIT');
  const [pageWidthMm, setPageWidthMm] = useState(210);
  const [pageHeightMm, setPageHeightMm] = useState(297);
  const [designerTemplate, setDesignerTemplate] = useState<PdfmeTemplate | null>(null);
  const [versionMenuAnchor, setVersionMenuAnchor] = useState<HTMLElement | null>(null);
  const [versionsDialogOpen, setVersionsDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [detailsName, setDetailsName] = useState('');
  const [detailsCode, setDetailsCode] = useState('');
  const [detailsTags, setDetailsTags] = useState('');
  const [savingDetails, setSavingDetails] = useState(false);
  const [loadingBackground, setLoadingBackground] = useState(false);
  const designerRef = useRef<PdfmeDesignerHandle | null>(null);
  const backgroundInputRef = useRef<HTMLInputElement | null>(null);

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

  useEffect(() => {
    if (!routeCode) {
      setEditingTemplate(null);
      setDesignerTemplate(null);
      setLoadingTemplate(false);
      return;
    }

    let active = true;

    setLoadingTemplate(true);
    setError('');
    apiRequest<{ template: TemplateItem }>(`/api/templates/by-code/${routeCode}`)
      .then((payload) => {
        if (!active) return;
        openEditor(payload.template);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'No se encontro la plantilla solicitada.');
        setEditingTemplate(null);
        setDesignerTemplate(null);
      })
      .finally(() => {
        if (active) setLoadingTemplate(false);
      });

    return () => { active = false; };
  }, [routeCode]);

  const filteredTemplates = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return templates;
    return templates.filter((template) => (
      template.name.toLowerCase().includes(query) ||
      template.code.toLowerCase().includes(query)
    ));
  }, [search, templates]);

  const visibleTemplates = filteredTemplates.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  const editingTemplateVersions = editingTemplate?.versions ?? [];
  const hasMultipleVersions = editingTemplateVersions.length > 1;
  const designerWorkspaceKey = editingTemplate
    ? [
      editingTemplate.id,
      editingTemplate.versionId,
      pageFormat,
      pageOrientation,
      pageWidthMm,
      pageHeightMm,
      isPreviewRoute ? 'preview' : 'edit',
    ].join(':')
    : 'empty';

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
    setDetailsName(template.name);
    setDetailsCode(template.code);
    setDetailsTags(template.tags.join(', '));
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
      navigate(`/templates/edit/${payload.template.code}`);
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
  }, [closeHeaderAction, code, codeSuffix, codeTouched, creating, editingTemplate, name, navigate, setHeaderAction, user]);

  async function saveSettings() {
    if (!editingTemplate) return null;
    const designerCurrentTemplate = designerRef.current?.getTemplate();
    const currentDesignerTemplate = designerTemplate && designerCurrentTemplate
      ? { ...designerCurrentTemplate, basePdf: designerTemplate.basePdf }
      : designerCurrentTemplate ?? designerTemplate;
    setError('');
    setSaving(true);
    try {
      const payload = await apiRequest<{ template: TemplateItem }>('/api/templates/' + editingTemplate.id + '/page-settings', {
        method: 'PATCH',
        body: JSON.stringify({ pageFormat, pageOrientation, pageWidthMm, pageHeightMm, designerJson: currentDesignerTemplate }),
      });
      setEditingTemplate(payload.template);
      setDesignerTemplate(buildPdfmeTemplate(payload.template));
      await load();
      return payload.template;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar la plantilla.');
      return null;
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
      setDesignerTemplate(buildPdfmeTemplate(payload.template));
      setVersionMenuAnchor(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar una nueva version.');
    } finally {
      setSavingVersion(false);
    }
  }

  async function switchVersion(versionId: string) {
    if (!editingTemplate || versionId === editingTemplate.versionId) return;
    setError('');
    setSwitchingVersion(true);
    try {
      const savedTemplate = await saveSettings();
      const templateId = savedTemplate?.id ?? editingTemplate.id;
      const payload = await apiRequest<{ template: TemplateItem }>(`/api/templates/${templateId}/versions/${versionId}/current`, { method: 'PATCH' });
      setEditingTemplate(payload.template);
      setPageFormat(payload.template.pageFormat);
      setPageOrientation(payload.template.pageOrientation === 'LANDSCAPE' ? 'LANDSCAPE' : 'PORTRAIT');
      setPageWidthMm(payload.template.pageWidthMm);
      setPageHeightMm(payload.template.pageHeightMm);
      setDesignerTemplate(buildPdfmeTemplate(payload.template));
      setVersionMenuAnchor(null);
      setVersionsDialogOpen(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cambiar de version.');
    } finally {
      setSwitchingVersion(false);
    }
  }

  function openDetailsDialog() {
    if (!editingTemplate) return;
    setDetailsName(editingTemplate.name);
    setDetailsCode(editingTemplate.code);
    setDetailsTags(editingTemplate.tags.join(', '));
    setVersionMenuAnchor(null);
    setDetailsDialogOpen(true);
  }

  async function saveDetails() {
    if (!editingTemplate) return;
    setError('');
    setSavingDetails(true);
    try {
      const tagNames = detailsTags.split(',').map((tag) => tag.trim()).filter(Boolean);
      const payload = await apiRequest<{ template: TemplateItem }>('/api/templates/' + editingTemplate.id, {
        method: 'PATCH',
        body: JSON.stringify({
          name: detailsName,
          code: detailsCode.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
          tagNames,
        }),
      });
      setEditingTemplate(payload.template);
      setDetailsDialogOpen(false);
      if (payload.template.code !== routeCode) {
        navigate(`/templates/edit/${payload.template.code}`, { replace: true });
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar la plantilla.');
    } finally {
      setSavingDetails(false);
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

  function uploadBackground(file: File) {
    setError('');
    setLoadingBackground(true);

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      if (!result.startsWith('data:image/')) {
        setError('El fondo debe ser una imagen PNG, JPG o WebP.');
        setLoadingBackground(false);
        return;
      }

      setDesignerTemplate((current) => updatePdfmeBackground(current, result, pageWidthMm, pageHeightMm));
      setLoadingBackground(false);
    };
    reader.onerror = () => {
      setError('No se pudo leer la imagen de fondo.');
      setLoadingBackground(false);
    };
    reader.readAsDataURL(file);
  }

  function clearBackground() {
    setDesignerTemplate((current) => removePdfmeBackground(current));
    setVersionMenuAnchor(null);
  }

  useEffect(() => {
    if (routeCode && !editingTemplate) {
      setHeaderAction(null);
      setHeaderControls(null);
      return;
    }

    if (!editingTemplate) {
      setHeaderControls(
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', flex: 1, minWidth: 0 }}>
          <Typography variant="h5" color="text.primary" sx={{ minWidth: { xs: 0, md: 160 }, display: { xs: 'none', sm: 'block' } }} noWrap>
            Plantillas
          </Typography>
          <TextField
            fullWidth
            label="Buscar plantilla"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Nombre o codigo"
            size="small"
            slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchOutlined /></InputAdornment> } }}
            sx={{ maxWidth: 360 }}
            value={search}
          />
          <Box sx={{ flexGrow: 1 }} />
          {can(user, 'templates.create') ? <Button onClick={openHeaderAction} size="small" variant="contained">Agregar</Button> : null}
        </Stack>,
      );
      return;
    }

    setHeaderAction(null);
    setHeaderControls(
      <Box
        sx={{
          alignItems: 'center',
          columnGap: 1.5,
          display: 'grid',
          flex: 1,
          gridTemplateColumns: {
            xs: 'minmax(0, 1fr) auto',
            md: 'auto auto minmax(120px, 1fr) auto',
          },
          minWidth: 0,
          width: '100%',
        }}
      >
        <Button onClick={() => navigate('/templates')} startIcon={<ArrowLeftOutlined />} sx={{ flexShrink: 0 }}>Volver</Button>
        <Divider flexItem orientation="vertical" sx={{ display: { xs: 'none', md: 'block' } }} />
        <Box sx={{ alignItems: 'center', display: { xs: 'none', sm: 'flex' }, gap: 1.25, minWidth: 0 }}>
          <Typography sx={{ fontWeight: 600, maxWidth: { xs: 110, sm: 180, md: 240 } }} variant="subtitle2" noWrap>{editingTemplate.name}</Typography>
          <Chip color="primary" label={`v${editingTemplate.versionNumber}`} size="small" sx={{ flexShrink: 0 }} variant="outlined" />
        </Box>
        {isPreviewRoute ? (
          <Button onClick={() => navigate(`/templates/edit/${editingTemplate.code}`)} size="small" startIcon={<EditOutlined />} sx={{ ml: 'auto' }} variant="outlined">Editar</Button>
        ) : (
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'flex-end', justifySelf: 'end', minWidth: 0 }}>
            <Box
              sx={{
                alignItems: 'center',
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1.5,
                display: 'flex',
                gap: 0.75,
                maxWidth: '100%',
                px: 0.75,
                py: 0.5,
              }}
            >
              <TextField label="Formato" onChange={(event) => setFormat(event.target.value)} select size="small" sx={{ width: 100 }} value={pageFormat}>
                {pageFormats.map((format) => <MenuItem key={format.value} value={format.value}>{format.label}</MenuItem>)}
              </TextField>
              <TextField label="Ancho" onChange={(event) => { const next = Number(event.target.value); setPageWidthMm(next); setDesignerTemplate((current) => updatePdfmeBasePdf(current, { width: next })); }} size="small" sx={{ width: 86 }} type="number" value={pageWidthMm} />
              <TextField label="Alto" onChange={(event) => { const next = Number(event.target.value); setPageHeightMm(next); setDesignerTemplate((current) => updatePdfmeBasePdf(current, { height: next })); }} size="small" sx={{ width: 86 }} type="number" value={pageHeightMm} />
              <Button onClick={toggleOrientation} size="small" startIcon={<RetweetOutlined />} sx={{ minWidth: 112, whiteSpace: 'nowrap' }} variant="outlined">
                {pageOrientation === 'LANDSCAPE' ? 'Horizontal' : 'Vertical'}
              </Button>
              <Button disabled={loadingBackground || saving || switchingVersion} onClick={() => backgroundInputRef.current?.click()} size="small" startIcon={<PictureOutlined />} sx={{ minWidth: 96, whiteSpace: 'nowrap' }} variant="outlined">
                {loadingBackground ? 'Cargando...' : 'Fondo'}
              </Button>
            </Box>
            <Button disabled={saving || switchingVersion} onClick={() => void saveSettings()} size="small" startIcon={<SaveOutlined />} variant="contained">
              {saving ? 'Guardando...' : 'Guardar'}
            </Button>
            <IconButton disabled={saving || savingVersion || switchingVersion || savingDetails} onClick={(event) => setVersionMenuAnchor(event.currentTarget)} size="small">
              <EllipsisOutlined />
            </IconButton>
            <Menu anchorEl={versionMenuAnchor} onClose={() => setVersionMenuAnchor(null)} open={Boolean(versionMenuAnchor)}>
              <MenuItem disabled={savingVersion} onClick={() => void saveVersion()}>
                {savingVersion ? 'Creando version...' : 'Guardar version'}
              </MenuItem>
              <MenuItem disabled={!hasMultipleVersions} onClick={() => { setVersionMenuAnchor(null); setVersionsDialogOpen(true); }}>
                Cambiar version
              </MenuItem>
              <MenuItem onClick={openDetailsDialog}>Propiedades</MenuItem>
              <MenuItem onClick={clearBackground}>Quitar fondo</MenuItem>
            </Menu>
          </Stack>
        )}
      </Box>,
    );

    return () => setHeaderControls(null);
  }, [editingTemplate, hasMultipleVersions, isPreviewRoute, loadingBackground, navigate, openHeaderAction, pageFormat, pageHeightMm, pageOrientation, pageWidthMm, routeCode, saving, savingDetails, savingVersion, search, setHeaderAction, setHeaderControls, switchingVersion, user, versionMenuAnchor]);

  if (routeCode && (loadingTemplate || !editingTemplate)) {
    return (
      <Box sx={{ display: 'grid', height: '100%', minHeight: 0, placeItems: 'center', width: '100%' }}>
        {error ? <Alert severity="error">{error}</Alert> : <CircularProgress size={24} />}
      </Box>
    );
  }

  if (editingTemplate) {
    return (
      <Box sx={{ height: '100%', minHeight: 0, position: 'relative', width: '100%' }}>
        <input
          accept="image/png,image/jpeg,image/webp"
          hidden
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = '';
            if (file) uploadBackground(file);
          }}
          ref={backgroundInputRef}
          type="file"
        />
        {error ? <Alert severity="error" sx={{ left: 16, position: 'absolute', right: 16, top: 16, zIndex: 2 }}>{error}</Alert> : null}
        <Dialog fullWidth maxWidth="sm" onClose={() => setVersionsDialogOpen(false)} open={versionsDialogOpen}>
          <DialogTitle>Cambiar version</DialogTitle>
          <DialogContent dividers sx={{ maxHeight: '70vh', p: 0 }}>
            <List disablePadding>
              {editingTemplateVersions.map((version) => (
                <ListItemButton
                  disabled={version.id === editingTemplate.versionId || switchingVersion}
                  key={version.id}
                  onClick={() => void switchVersion(version.id)}
                  selected={version.id === editingTemplate.versionId}
                >
                  <ListItemText
                    primary={`Version ${version.versionNumber}`}
                    secondary={`${version.pageCount} hoja${version.pageCount === 1 ? '' : 's'} · ${new Date(version.updatedAt).toLocaleString()}`}
                  />
                </ListItemButton>
              ))}
            </List>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setVersionsDialogOpen(false)}>Cerrar</Button>
          </DialogActions>
        </Dialog>
        <Dialog fullWidth maxWidth="sm" onClose={() => setDetailsDialogOpen(false)} open={detailsDialogOpen}>
          <DialogTitle>Datos de plantilla</DialogTitle>
          <DialogContent dividers>
            <Stack spacing={2} sx={{ pt: 1 }}>
              <TextField fullWidth label="Nombre" onChange={(event) => setDetailsName(event.target.value)} value={detailsName} />
              <TextField fullWidth helperText="Identificador usado por apps/API." label="Codigo" onChange={(event) => setDetailsCode(event.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))} value={detailsCode} />
              <TextField fullWidth helperText="Separados por coma." label="Tags" onChange={(event) => setDetailsTags(event.target.value)} value={detailsTags} />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDetailsDialogOpen(false)}>Cancelar</Button>
            <Button disabled={savingDetails} onClick={() => void saveDetails()} variant="contained">
              {savingDetails ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogActions>
        </Dialog>
        <Box className="pdfme-workspace" sx={{ height: '100%', minHeight: 0, width: '100%' }}>
          <Card sx={{ bgcolor: 'background.default', borderRadius: 0, boxShadow: 'none', height: '100%', minWidth: 0, overflow: 'hidden' }}>
            {designerTemplate ? (
              <Suspense fallback={<Box sx={{ display: 'grid', minHeight: 680, placeItems: 'center' }}><CircularProgress size={24} /></Box>}>
                {isPreviewRoute ? <PdfmeViewer key={designerWorkspaceKey} template={designerTemplate} /> : <PdfmeDesigner key={designerWorkspaceKey} onChange={setDesignerTemplate} ref={designerRef} template={designerTemplate} />}
              </Suspense>
            ) : <Box sx={{ display: 'grid', minHeight: 680, placeItems: 'center' }}><CircularProgress size={24} /></Box>}
          </Card>
        </Box>
      </Box>
    );
  }

  return (
    <Stack spacing={2} sx={{ flexGrow: 1, minHeight: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
      {error ? <Alert severity="error">{error}</Alert> : null}
      <Card sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <TableContainer sx={{ flexGrow: 1, overflowY: 'auto' }}>
          <Table stickyHeader>
            <TableHead><TableRow><TableCell sx={{ py: 2 }}>Plantilla</TableCell><TableCell sx={{ py: 2 }}>Version</TableCell><TableCell sx={{ py: 2 }}>Hoja</TableCell><TableCell sx={{ py: 2 }}>Tags</TableCell><TableCell align="right" sx={{ py: 2 }}>Acciones</TableCell></TableRow></TableHead>
            <TableBody>
              {loading ? <TableRow><TableCell align="center" colSpan={5}><CircularProgress size={24} /></TableCell></TableRow> : null}
              {!loading && filteredTemplates.length === 0 ? <TableRow><TableCell colSpan={5}>No hay plantillas.</TableCell></TableRow> : null}
              {!loading ? visibleTemplates.map((template) => <TableRow key={template.id}><TableCell><Box><strong>{template.name}</strong><br /><small>{template.code}</small></Box></TableCell><TableCell>v{template.versionNumber}</TableCell><TableCell>{template.pageFormat} {template.pageOrientation === 'LANDSCAPE' ? 'Horizontal' : 'Vertical'}</TableCell><TableCell>{template.tags.join(', ') || 'Sin etiquetas'}</TableCell><TableCell align="right"><Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}><Button onClick={() => navigate(`/templates/preview/${template.code}`)} size="small" startIcon={<EyeOutlined />}>Preview</Button><Button onClick={() => navigate(`/templates/edit/${template.code}`)} size="small" startIcon={<EditOutlined />}>Editar</Button>{can(user, 'templates.delete') ? <Button color="error" disabled={deletingId === template.id} onClick={() => void remove(template.id)} size="small" startIcon={<DeleteOutlined />}>{deletingId === template.id ? 'Eliminando...' : 'Eliminar'}</Button> : null}</Stack></TableCell></TableRow>) : null}
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
