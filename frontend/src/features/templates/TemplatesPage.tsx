import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeftOutlined,
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  EllipsisOutlined,
  EyeOutlined,
  PictureOutlined,
  PlusOutlined,
  SaveOutlined,
  SearchOutlined,
  LockOutlined,
  UnlockOutlined,
  UnorderedListOutlined,
  BarcodeOutlined,
  FileTextOutlined,
  ColumnHeightOutlined,
  ColumnWidthOutlined,
} from '@ant-design/icons';
import {
  Autocomplete,
  Backdrop,
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
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { DataTable, PaginationBar } from '../../shared/components/DataTable';
import { LoadingState } from '../../shared/components/LoadingState';
import { AppFormDialog, FormFieldStack } from '../../shared/components/AppFormDialog';
import type { Schema, Template as PdfmeTemplate } from '@pdfme/common';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { can } from '../../app/session';
import type { TagItem, TemplateItem } from '../../app/types';
import { useAppContext } from '../../app/AppContext';
import { apiRequest } from '../../shared/api/client';
import { confirmDanger, notifyError } from '../../shared/notifications';
import type { PdfmeDesignerHandle } from './components/PdfmeDesigner';
import { normalizePdfmeTemplateFonts } from './components/pdfmeTemplateFonts';

const PdfmeDesigner = lazy(() => import('./components/PdfmeDesigner').then((module) => ({ default: module.PdfmeDesigner })));
const PdfmeViewer = lazy(() => import('./components/PdfmeViewer').then((module) => ({ default: module.PdfmeViewer })));

const pageFormats = [
  { value: 'A4', label: 'A4', width: 210, height: 297 },
  { value: 'LETTER', label: 'Carta', width: 216, height: 279 },
  { value: 'LEGAL', label: 'Legal', width: 216, height: 356 },
  { value: 'CUSTOM', label: 'Personalizado', width: 210, height: 297 },
];

type BlankBasePdf = {
  width: number;
  height: number;
  padding: [number, number, number, number];
};

type EditorHeaderControlsProps = {
  editingTemplate: TemplateItem;
  hasMultipleVersions: boolean;
  isPreviewRoute: boolean;
  pageFormat: string;
  pageHeightMm: number;
  pageOrientation: 'PORTRAIT' | 'LANDSCAPE';
  pageWidthMm: number;
  saving: boolean;
  savingDetails: boolean;
  savingVersion: boolean;
  switchingVersion: boolean;
  onBack: () => void;
  onEditPreview: () => void;
  onFormatChange: (format: string) => void;
  onHeightChange: (height: number) => void;
  onOpenDetails: () => void;
  onOpenVersions: () => void;
  onSave: () => void;
  onSaveVersion: () => void;
  onToggleOrientation: () => void;
  onWidthChange: (width: number) => void;
};

function EditorHeaderControls({
  editingTemplate,
  hasMultipleVersions,
  isPreviewRoute,
  pageFormat,
  pageHeightMm,
  pageOrientation,
  pageWidthMm,
  saving,
  savingDetails,
  savingVersion,
  switchingVersion,
  onBack,
  onEditPreview,
  onFormatChange,
  onHeightChange,
  onOpenDetails,
  onOpenVersions,
  onSave,
  onSaveVersion,
  onToggleOrientation,
  onWidthChange,
}: EditorHeaderControlsProps) {
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const closeMenu = () => setMenuAnchor(null);

  return (
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
      <Button onClick={onBack} startIcon={<ArrowLeftOutlined />} sx={{ flexShrink: 0 }}>Volver</Button>
      <Divider flexItem orientation="vertical" sx={{ display: { xs: 'none', md: 'block' } }} />
      <Box sx={{ alignItems: 'center', display: { xs: 'none', sm: 'flex' }, gap: 1.25, minWidth: 0 }}>
        <Typography sx={{ fontWeight: 600, maxWidth: { xs: 110, sm: 180, md: 240 } }} variant="subtitle2" noWrap>{editingTemplate.name}</Typography>
        <Chip color="primary" label={`v${editingTemplate.versionNumber}`} size="small" sx={{ flexShrink: 0 }} variant="outlined" />
      </Box>
      {isPreviewRoute ? (
        <Button onClick={onEditPreview} size="small" startIcon={<EditOutlined />} sx={{ ml: 'auto' }} variant="outlined">Editar</Button>
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
            <TextField label="Formato" onChange={(event) => onFormatChange(event.target.value)} select size="small" sx={{ width: 100 }} value={pageFormat}>
              {pageFormats.map((format) => <MenuItem key={format.value} value={format.value}>{format.label}</MenuItem>)}
            </TextField>
            <TextField label="Ancho" onChange={(event) => onWidthChange(Number(event.target.value))} size="small" sx={{ width: 86 }} type="number" value={pageWidthMm} />
            <TextField label="Alto" onChange={(event) => onHeightChange(Number(event.target.value))} size="small" sx={{ width: 86 }} type="number" value={pageHeightMm} />
            <Tooltip title={pageOrientation === 'LANDSCAPE' ? 'Cambiar a Vertical' : 'Cambiar a Horizontal'}>
              <IconButton onClick={onToggleOrientation} color="primary" sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5, p: 0, width: 40, height: 40, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                {pageOrientation === 'LANDSCAPE' ? <ColumnHeightOutlined /> : <ColumnWidthOutlined />}
              </IconButton>
            </Tooltip>
          </Box>
          <Button disabled={saving || switchingVersion} onClick={onSave} size="small" startIcon={<SaveOutlined />} variant="contained">
            Guardar
          </Button>
          <IconButton disabled={saving || savingVersion || switchingVersion || savingDetails} onClick={(event) => setMenuAnchor(event.currentTarget)} size="small">
            <EllipsisOutlined />
          </IconButton>
          <Menu anchorEl={menuAnchor} onClose={closeMenu} open={Boolean(menuAnchor)} transitionDuration={120}>
            <MenuItem disabled={savingVersion} onClick={() => { closeMenu(); onSaveVersion(); }}>
              Guardar version
            </MenuItem>
            <MenuItem disabled={!hasMultipleVersions} onClick={() => { closeMenu(); onOpenVersions(); }}>
              Cambiar version
            </MenuItem>
            <MenuItem onClick={() => { closeMenu(); onOpenDetails(); }}>Propiedades</MenuItem>
          </Menu>
        </Stack>
      )}
    </Box>
  );
}

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

  return normalizePdfmeTemplateFonts({
    ...storedTemplate,
    schemas: Array.isArray(storedTemplate.schemas) ? storedTemplate.schemas : [[]],
    basePdf: {
      ...storedBasePdf,
      width,
      height,
      padding: [0, 0, 0, 0],
    },
  } as PdfmeTemplate);
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
    },
  } as PdfmeTemplate;
}

export function TemplatesPage() {
  const { user, mode, setHeaderAction, closeHeaderAction, openHeaderAction, setHeaderControls, setOperationLabel, clearOperationLabel } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();
  const { code: routeCode } = useParams();
  const isPreviewRoute = location.pathname.includes('/templates/preview/');
  const isEditRoute = location.pathname.includes('/templates/edit/');
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [availableTags, setAvailableTags] = useState<TagItem[]>([]);
  const [editingTemplate, setEditingTemplate] = useState<TemplateItem | null>(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState(() => buildCode('', randomSuffix()));
  const [codeTouched, setCodeTouched] = useState(false);
  const [codeSuffix, setCodeSuffix] = useState(() => randomSuffix());
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingVersion, setSavingVersion] = useState(false);
  const [switchingVersion, setSwitchingVersion] = useState(false);
  const [duplicatingId, setDuplicatingId] = useState('');
  const [deletingId, setDeletingId] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(0);
  const [pageFormat, setPageFormat] = useState('A4');
  const [pageOrientation, setPageOrientation] = useState<'PORTRAIT' | 'LANDSCAPE'>('PORTRAIT');
  const [pageWidthMm, setPageWidthMm] = useState(210);
  const [pageHeightMm, setPageHeightMm] = useState(297);
  const [designerTemplate, setDesignerTemplate] = useState<PdfmeTemplate | null>(null);
  const [lockedSchemaNames, setLockedSchemaNames] = useState<string[]>([]);
  const [versionsDialogOpen, setVersionsDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [detailsName, setDetailsName] = useState('');
  const [detailsCode, setDetailsCode] = useState('');
  const [detailsTags, setDetailsTags] = useState<string[]>([]);
  const [savingDetails, setSavingDetails] = useState(false);
  const designerRef = useRef<PdfmeDesignerHandle | null>(null);
  const getSchemaLockKey = (pageIndex: number, schemaName: string) => `${pageIndex}::${schemaName.trim()}`;
  const getSchemaPositionKey = (pageIndex: number, schemaIndex: number) => `${pageIndex}::${schemaIndex}`;
  const previousSchemaLockKeyByPositionRef = useRef<Record<string, string>>({});
  const isSchemaLocked = (pageIndex: number, schemaName: string, schemaIndex?: number) => {
    const lockKey = getSchemaLockKey(pageIndex, schemaName);
    if (lockedSchemaNames.includes(lockKey)) return true;
    if (typeof schemaIndex !== 'number') return false;
    const previousLockKey = previousSchemaLockKeyByPositionRef.current[getSchemaPositionKey(pageIndex, schemaIndex)];
    return previousLockKey ? lockedSchemaNames.includes(previousLockKey) : false;
  };
  const editorBusy = saving || savingVersion || savingDetails || switchingVersion;
  const editorBusyLabel = switchingVersion
    ? 'Cambiando version...'
    : savingVersion
      ? 'Creando version...'
      : savingDetails
        ? 'Guardando datos...'
        : 'Guardando plantilla...';

  async function load() {
    if (templates.length === 0) setLoading(true);
    try {
      const [payload, tagsPayload] = await Promise.all([
        apiRequest<{ data: TemplateItem[] }>('/api/templates'),
        apiRequest<{ data: TagItem[] }>('/api/tags').catch(() => ({ data: [] })),
      ]);
      setTemplates(payload.data);
      setAvailableTags(tagsPayload.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (routeCode) return;
    void load().catch((err) => notifyError(err, 'No se pudo cargar.'));
  }, [routeCode]);

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
        setError('No se encontro la plantilla solicitada.');
        notifyError(err, 'No se encontro la plantilla solicitada.');
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


  const editingTemplateVersions = editingTemplate?.versions ?? [];
  const hasMultipleVersions = editingTemplateVersions.length > 1;
  const designerWorkspaceKey = editingTemplate
    ? [
      editingTemplate.id,
      editingTemplate.versionId,
      isPreviewRoute ? 'preview' : 'edit',
    ].join(':')
    : 'empty';


  function resetCreateForm() {
    const suffix = randomSuffix();
    setName('');
    setCodeSuffix(suffix);
    setCode(buildCode('', suffix));
    setCodeTouched(false);
    setSelectedTags([]);
  }

  function openEditor(template: TemplateItem) {
    setEditingTemplate(template);
    setDetailsName(template.name);
    setDetailsCode(template.code);
    setDetailsTags(template.tags);
    setPageFormat(template.pageFormat);
    setPageOrientation(template.pageOrientation === 'LANDSCAPE' ? 'LANDSCAPE' : 'PORTRAIT');
    setPageWidthMm(template.pageWidthMm);
    setPageHeightMm(template.pageHeightMm);
    setDesignerTemplate(buildPdfmeTemplate(template));
    setError('');
  }

  async function create() {
    const nextName = name.trim();
    const nextCode = code.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');

    if (nextName.length < 2) {
      notifyError('Ingresa un nombre para la plantilla.');
      return;
    }

    if (!nextCode) {
      notifyError('Ingresa el codigo de la plantilla.');
      return;
    }

    setError('');
    setCreating(true);
    setOperationLabel('Creando plantilla...');
    try {
      const payload = await apiRequest<{ template: TemplateItem }>('/api/templates', {
        method: 'POST',
        body: JSON.stringify({ name: nextName, code: nextCode, tagNames: selectedTags }),
      });
      resetCreateForm();
      closeHeaderAction();
      navigate(`/templates/edit/${payload.template.code}`);
    } catch (err) {
      notifyError(err, 'No se pudo crear la plantilla.');
    } finally {
      setCreating(false);
      clearOperationLabel();
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
        <FormFieldStack
          id="create-template-form"
          onSubmit={(event) => {
            event.preventDefault();
            void create();
          }}
        >
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
            helperText="Identificador usado por apps/API."
            label="Codigo"
            onChange={(event) => { setCode(event.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_')); setCodeTouched(true); }}
            value={code}
          />
          <Autocomplete
            freeSolo
            multiple
            onChange={(_event, value) => setSelectedTags(Array.from(new Set(value.map((tag) => tag.trim()).filter(Boolean))))}
            options={availableTags.map((tag) => tag.name)}
            renderInput={(params) => <TextField {...params} helperText="Selecciona o escribe tags." label="Tags" />}
            value={selectedTags}
          />
        </FormFieldStack>
      ),
      contentActions: (
        <>
          <Button onClick={closeHeaderAction}>Cancelar</Button>
          <Button disabled={creating || name.trim().length < 2 || !code.trim()} form="create-template-form" startIcon={<PlusOutlined />} type="submit" variant="contained">Crear</Button>
        </>
      ),
    });

    return () => setHeaderAction(null);
  }, [availableTags, clearOperationLabel, closeHeaderAction, code, codeSuffix, codeTouched, creating, editingTemplate, name, navigate, selectedTags, setHeaderAction, setOperationLabel, user]);

  async function saveSettings() {
    if (!editingTemplate) return null;
    const designerCurrentTemplate = designerRef.current?.getTemplate();
    let currentDesignerTemplate = designerTemplate && designerCurrentTemplate
      ? { ...designerCurrentTemplate, basePdf: designerTemplate.basePdf }
      : designerCurrentTemplate ?? designerTemplate;
    currentDesignerTemplate = currentDesignerTemplate ? normalizePdfmeTemplateFonts(currentDesignerTemplate) : currentDesignerTemplate;

    if (currentDesignerTemplate && currentDesignerTemplate.schemas) {
      currentDesignerTemplate = {
        ...currentDesignerTemplate,
        schemas: currentDesignerTemplate.schemas.map((pageSchemas, pageIndex) => {
          if (!Array.isArray(pageSchemas)) return pageSchemas;
          return pageSchemas.map((schema, schemaIndex) => {
            const schemaName = schema.name?.trim() || '';
            const isLocked = schemaName ? isSchemaLocked(pageIndex, schemaName, schemaIndex) : false;
            return {
              ...schema,
              __isLocked: isLocked
            };
          });
        }) as any
      };
    }

    setError('');
    setSaving(true);
    try {
      const payload = await apiRequest<{ template: TemplateItem }>('/api/templates/' + editingTemplate.id + '/page-settings', {
        method: 'PATCH',
        body: JSON.stringify({ pageFormat, pageOrientation, pageWidthMm, pageHeightMm, designerJson: currentDesignerTemplate }),
      });
      if (currentDesignerTemplate) {
        setDesignerTemplate(currentDesignerTemplate);
        const nextLockedSchemaNames: string[] = [];
        const nextSchemaLockKeyByPosition: Record<string, string> = {};
        currentDesignerTemplate.schemas.forEach((pageSchemas, pageIndex) => {
          if (!Array.isArray(pageSchemas)) return;
          pageSchemas.forEach((schema, schemaIndex) => {
            if (!schema?.name) return;
            const lockKey = getSchemaLockKey(pageIndex, schema.name);
            nextSchemaLockKeyByPosition[getSchemaPositionKey(pageIndex, schemaIndex)] = lockKey;
            if (schema.__isLocked) nextLockedSchemaNames.push(lockKey);
          });
        });
        previousSchemaLockKeyByPositionRef.current = nextSchemaLockKeyByPosition;
        setLockedSchemaNames(nextLockedSchemaNames);
      }
      setEditingTemplate(payload.template);
      if (!routeCode) await load();
      return payload.template;
    } catch (err) {
      notifyError(err, 'No se pudo guardar la plantilla.');
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
      if (!routeCode) await load();
    } catch (err) {
      notifyError(err, 'No se pudo guardar una nueva version.');
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
      setVersionsDialogOpen(false);
      if (!routeCode) await load();
    } catch (err) {
      notifyError(err, 'No se pudo cambiar de version.');
    } finally {
      setSwitchingVersion(false);
    }
  }

  function openDetailsDialog() {
    if (!editingTemplate) return;
    setDetailsName(editingTemplate.name);
    setDetailsCode(editingTemplate.code);
    setDetailsTags(editingTemplate.tags);
    setDetailsDialogOpen(true);
  }

  async function saveDetails() {
    if (!editingTemplate) return;
    const nextName = detailsName.trim();
    const nextCode = detailsCode.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');

    if (nextName.length < 2) {
      notifyError('Ingresa un nombre para la plantilla.');
      return;
    }

    if (!nextCode) {
      notifyError('Ingresa el codigo de la plantilla.');
      return;
    }

    setError('');
    setSavingDetails(true);
    try {
      const tagNames = detailsTags.map((tag) => tag.trim()).filter(Boolean);
      const payload = await apiRequest<{ template: TemplateItem }>('/api/templates/' + editingTemplate.id, {
        method: 'PATCH',
        body: JSON.stringify({
          name: nextName,
          code: nextCode,
          tagNames,
        }),
      });
      setEditingTemplate(payload.template);
      setDetailsDialogOpen(false);
      if (payload.template.code !== routeCode) {
        navigate(`/templates/edit/${payload.template.code}`, { replace: true });
      }
      if (!routeCode) await load();
    } catch (err) {
      notifyError(err, 'No se pudo actualizar la plantilla.');
    } finally {
      setSavingDetails(false);
    }
  }

  async function remove(id: string) {
    setError('');
    setDeletingId(id);
    setOperationLabel('Eliminando plantilla...');
    try {
      await apiRequest(`/api/templates/${id}`, { method: 'DELETE' });
      setTemplates((current) => current.filter((template) => template.id !== id));
    } catch (err) {
      notifyError(err, 'No se pudo eliminar la plantilla.');
    } finally {
      setDeletingId('');
      clearOperationLabel();
    }
  }

  async function confirmRemove(template: TemplateItem) {
    const confirmed = await confirmDanger({ text: `¿Estás seguro que quieres eliminar la plantilla "${template.name}"?` });
    if (confirmed) await remove(template.id);
  }

  async function duplicate(template: TemplateItem) {
    setError('');
    setDuplicatingId(template.id);
    setOperationLabel('Duplicando plantilla...');
    try {
      const payload = await apiRequest<{ template: TemplateItem }>(`/api/templates/${template.id}/duplicate`, { method: 'POST' });
      setTemplates((current) => [payload.template, ...current]);
      navigate(`/templates/edit/${payload.template.code}`);
    } catch (err) {
      notifyError(err, 'No se pudo duplicar la plantilla.');
    } finally {
      setDuplicatingId('');
      clearOperationLabel();
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

  const prevSchemasRef = useRef<Record<string, string>>({});
  const lastLoadedTemplateIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!designerTemplate) {
      if (lockedSchemaNames.length > 0) {
        setLockedSchemaNames([]);
      }
      prevSchemasRef.current = {};
      lastLoadedTemplateIdRef.current = null;
      return;
    }
    const locked: string[] = [];
    const currentSchemas: Record<string, string> = {};
    const currentSchemaLockKeyByPosition: Record<string, string> = {};

    designerTemplate.schemas.forEach((pageSchemas, pageIndex) => {
      if (!Array.isArray(pageSchemas)) return;
      pageSchemas.forEach((schema, schemaIndex) => {
        if (!schema || !schema.name) return;
        const lockKey = getSchemaLockKey(pageIndex, schema.name);
        currentSchemas[lockKey] = schema.type || 'unknown';
        currentSchemaLockKeyByPosition[getSchemaPositionKey(pageIndex, schemaIndex)] = lockKey;
        if (schema.__isLocked) {
          locked.push(lockKey);
        }
      });
    });

    const currentTemplateId = editingTemplate?.id + '-' + editingTemplate?.versionId;
    if (lastLoadedTemplateIdRef.current !== currentTemplateId) {
      lastLoadedTemplateIdRef.current = currentTemplateId;
      setLockedSchemaNames(locked);
    }

    const prevSchemas = prevSchemasRef.current;
    prevSchemasRef.current = currentSchemas;
    previousSchemaLockKeyByPositionRef.current = currentSchemaLockKeyByPosition;

    // Apply the locking/unlocking styles and sidebar buttons
    const handleDOMUpdate = () => {
      const container = document.querySelector('.pdfme-workspace');
      if (!container) return;
      const liveTemplate = designerRef.current?.getTemplate() ?? designerTemplate;

      // 1. Mark locked canvas elements without mutating pdfme's internal selectable class.
      // pdfme uses `.selectable` for drag/measurement; removing it during pointer moves can
      // trigger an updateRect -> setState loop in its internal resize observer.
      liveTemplate.schemas.forEach((pageSchemas, pageIndex) => {
        if (!Array.isArray(pageSchemas)) return;
        pageSchemas.forEach((schema, schemaIndex) => {
          if (!schema || !schema.name) return;
          const el = container.querySelector(`div[title="${schema.name}"]`) as HTMLElement | null;
          if (!el) return;

          const isLocked = isSchemaLocked(pageIndex, schema.name, schemaIndex);

          if (isLocked) {
            if (!el.classList.contains('selectable-locked')) {
              el.classList.add('selectable-locked');
            }
          } else {
            if (el.classList.contains('selectable-locked')) {
              el.classList.remove('selectable-locked');
            }
          }

          const legacyBtn = el.querySelector('.canvas-lock-btn');
          if (legacyBtn) legacyBtn.remove();
        });
      });

      // 2. Render lock/unlock buttons in the visible sidebar element list.
      // pdfme reuses this DOM when switching pages, so handlers and metadata must be
      // refreshed every pass instead of only when the button is first created.
      const parent = container.parentElement || document;
      const listItems = parent.querySelectorAll('ul > li');
      const rows = Array.from(listItems).map((li) => {
        const rowDiv = li.firstElementChild as HTMLDivElement | null;
        const span = (rowDiv?.querySelector('span[title="Editar"]') || rowDiv?.querySelector('span[title="Edit"]')) as HTMLSpanElement | null;
        const schemaName = span?.textContent?.trim() || '';
        return { rowDiv, schemaName };
      }).filter((row): row is { rowDiv: HTMLDivElement; schemaName: string } => Boolean(row.rowDiv && row.schemaName));

      const visibleNames = new Set(rows.map((row) => row.schemaName));
      let activePageIndex = 0;
      let activePageMatches = -1;
      liveTemplate.schemas.forEach((pageSchemas, pageIndex) => {
        if (!Array.isArray(pageSchemas)) return;
        const matches = pageSchemas.reduce((count, schema) => count + (schema.name && visibleNames.has(schema.name) ? 1 : 0), 0);
        if (matches > activePageMatches) {
          activePageMatches = matches;
          activePageIndex = pageIndex;
        }
      });

      rows.forEach(({ rowDiv, schemaName }) => {
        const activePageSchemas = liveTemplate.schemas[activePageIndex];
        let foundSchemaIndex = Array.isArray(activePageSchemas) ? activePageSchemas.findIndex((schema) => schema.name === schemaName) : -1;
        let foundPageIndex = foundSchemaIndex !== -1
          ? activePageIndex
          : -1;

        if (foundPageIndex === -1) {
          liveTemplate.schemas.forEach((pageSchemas, pageIndex) => {
            if (foundPageIndex !== -1 || !Array.isArray(pageSchemas)) return;
            const schemaIndex = pageSchemas.findIndex((schema) => schema.name === schemaName);
            if (schemaIndex !== -1) {
              foundPageIndex = pageIndex;
              foundSchemaIndex = schemaIndex;
            }
          });
        }

        if (foundPageIndex === -1) return;

        const lockKey = getSchemaLockKey(foundPageIndex, schemaName);
        const isLocked = isSchemaLocked(foundPageIndex, schemaName, foundSchemaIndex);
        const desiredTitle = isLocked ? 'Desbloquear' : 'Bloquear';
        const deseadoState = isLocked ? 'locked' : 'unlocked';

        rowDiv.dataset.schemaLocked = isLocked ? 'true' : 'false';
        const blockLockedRowAction = (event: MouseEvent) => {
          if (rowDiv.dataset.schemaLocked !== 'true') return;
          if ((event.target as HTMLElement | null)?.closest('.sidebar-lock-btn')) return;
          event.stopPropagation();
          event.preventDefault();
        };
        rowDiv.onmousedown = blockLockedRowAction;
        rowDiv.onmouseup = blockLockedRowAction;
        rowDiv.onclick = blockLockedRowAction;

        let lockBtn = rowDiv.querySelector('.sidebar-lock-btn') as HTMLButtonElement | null;
        if (!lockBtn) {
          lockBtn = document.createElement('button');
          lockBtn.className = 'sidebar-lock-btn';
          lockBtn.style.background = 'none';
          lockBtn.style.border = 'none';
          lockBtn.style.cursor = 'pointer';
          lockBtn.style.padding = '4px';
          lockBtn.style.display = 'flex';
          lockBtn.style.alignItems = 'center';
          lockBtn.style.justifyContent = 'center';
          lockBtn.style.marginLeft = 'auto';
          lockBtn.style.outline = 'none';
          lockBtn.style.transition = 'transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)';

          lockBtn.style.setProperty('pointer-events', 'auto', 'important');

          lockBtn.addEventListener('mouseenter', () => {
            if (lockBtn) lockBtn.style.transform = 'scale(1.2)';
          });
          lockBtn.addEventListener('mouseleave', () => {
            if (lockBtn) lockBtn.style.transform = 'scale(1)';
          });

          rowDiv.appendChild(lockBtn);
        }

        lockBtn.dataset.pageIndex = String(foundPageIndex);
        lockBtn.dataset.schemaName = schemaName;
        lockBtn.onmousedown = (event) => {
          event.stopPropagation();
          event.preventDefault();
          toggleLockSchema(foundPageIndex, schemaName, foundSchemaIndex);
        };
        lockBtn.onmouseup = (event) => {
          event.stopPropagation();
          event.preventDefault();
        };
        lockBtn.onclick = (event) => {
          event.stopPropagation();
          event.preventDefault();
        };

        if (lockBtn.getAttribute('data-state') !== deseadoState || !lockBtn.innerHTML.trim()) {
          lockBtn.setAttribute('data-state', deseadoState);
          lockBtn.title = desiredTitle;
          if (isLocked) {
            lockBtn.style.color = '#ff4d4f';
            lockBtn.innerHTML = `
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
              </svg>
            `;
          } else {
            lockBtn.style.color = '#ffffff';
            lockBtn.innerHTML = `
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                <path d="M12 17c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm6-9h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6h1.9c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm0 12H6V10h12v10z"/>
              </svg>
            `;
          }
        }
      });
    };

    handleDOMUpdate();
    const t1 = setTimeout(handleDOMUpdate, 50);
    const t2 = setTimeout(handleDOMUpdate, 200);

    let frameId: number;
    const observer = new MutationObserver(() => {
      cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(() => {
        handleDOMUpdate();
      });
    });

    const workspaceEl = document.querySelector('.pdfme-workspace');
    const observedEl = workspaceEl?.parentElement || workspaceEl;
    if (observedEl) {
      observer.observe(observedEl, {
        childList: true,
        subtree: true,
      });
    }

    const scheduleDOMUpdate = () => {
      cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(() => {
        handleDOMUpdate();
      });
    };

    observedEl?.addEventListener('click', scheduleDOMUpdate, true);
    observedEl?.addEventListener('pointerup', scheduleDOMUpdate, true);
    observedEl?.addEventListener('keyup', scheduleDOMUpdate, true);

    const blockLockedCanvasAction = (event: Event) => {
      const target = event.target as HTMLElement | null;
      if (!target || target.closest('.sidebar-lock-btn')) return;
      const lockedEl = target.closest('.selectable-locked');
      if (!lockedEl) return;
      event.stopPropagation();
      if ('stopImmediatePropagation' in event) event.stopImmediatePropagation();
      event.preventDefault();
    };

    const lockedCanvasEvents = ['pointerdown', 'mousedown', 'click', 'dblclick', 'touchstart', 'dragstart'];
    lockedCanvasEvents.forEach((eventName) => {
      window.addEventListener(eventName, blockLockedCanvasAction, true);
    });

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      cancelAnimationFrame(frameId);
      observedEl?.removeEventListener('click', scheduleDOMUpdate, true);
      observedEl?.removeEventListener('pointerup', scheduleDOMUpdate, true);
      observedEl?.removeEventListener('keyup', scheduleDOMUpdate, true);
      lockedCanvasEvents.forEach((eventName) => {
        window.removeEventListener(eventName, blockLockedCanvasAction, true);
      });
      observer.disconnect();
    };
  }, [designerTemplate, lockedSchemaNames, editingTemplate]);

  function toggleLockSchema(pageIndex: number, schemaName: string, schemaIndex?: number) {
    const lockKey = getSchemaLockKey(pageIndex, schemaName);
    const previousLockKey = typeof schemaIndex === 'number'
      ? previousSchemaLockKeyByPositionRef.current[getSchemaPositionKey(pageIndex, schemaIndex)]
      : undefined;
    setLockedSchemaNames((current) => {
      const exists = current.includes(lockKey) || Boolean(previousLockKey && current.includes(previousLockKey));
      if (exists) {
        return current.filter((name) => name !== lockKey && name !== previousLockKey);
      }
      return [...current, lockKey];
    });
  }

  function getSchemaIcon(type: string) {
    switch (type) {
      case 'text':
        return <span className="schema-type-icon schema-type-icon-text">T</span>;
      case 'image':
        return <PictureOutlined className="schema-type-icon" />;
      case 'qrcode':
      case 'code128':
        return <BarcodeOutlined className="schema-type-icon" />;
      default:
        return <FileTextOutlined className="schema-type-icon" />;
    }
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
            onChange={(event) => { setSearch(event.target.value); setPage(0); }}
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
      <EditorHeaderControls
        editingTemplate={editingTemplate}
        hasMultipleVersions={hasMultipleVersions}
        isPreviewRoute={isPreviewRoute}
        onBack={() => navigate('/templates')}
        onEditPreview={() => navigate(`/templates/edit/${editingTemplate.code}`)}
        onFormatChange={setFormat}
        onHeightChange={(next) => { setPageHeightMm(next); setDesignerTemplate((current) => updatePdfmeBasePdf(current, { height: next })); }}
        onOpenDetails={openDetailsDialog}
        onOpenVersions={() => setVersionsDialogOpen(true)}
        onSave={() => { void saveSettings(); }}
        onSaveVersion={() => { void saveVersion(); }}
        onToggleOrientation={toggleOrientation}
        onWidthChange={(next) => { setPageWidthMm(next); setDesignerTemplate((current) => updatePdfmeBasePdf(current, { width: next })); }}
        pageFormat={pageFormat}
        pageHeightMm={pageHeightMm}
        pageOrientation={pageOrientation}
        pageWidthMm={pageWidthMm}
        saving={saving}
        savingDetails={savingDetails}
        savingVersion={savingVersion}
        switchingVersion={switchingVersion}
      />,
    );

    return () => setHeaderControls(null);
  }, [editingTemplate, hasMultipleVersions, isPreviewRoute, navigate, pageFormat, pageHeightMm, pageOrientation, pageWidthMm, saving, savingDetails, savingVersion, setHeaderControls, switchingVersion, user]);

  useEffect(() => {
    const originalConfirm = window.confirm;
    window.confirm = (message) => {
      const msg = message ? message.toLowerCase() : '';
      if (msg.includes('page') || msg.includes('página') || msg.includes('delete') || msg.includes('eliminar')) {
        return true;
      }
      return originalConfirm(message);
    };
    return () => {
      window.confirm = originalConfirm;
    };
  }, []);



  if (routeCode && (loadingTemplate || !editingTemplate)) {
    return (
      <Box sx={{ display: 'grid', height: '100%', minHeight: 0, placeItems: 'center', width: '100%' }}>
        {error ? <Typography color="text.secondary">{error}</Typography> : <LoadingState label="Cargando plantilla..." minHeight="100%" />}
      </Box>
    );
  }

  if (editingTemplate) {
    return (
      <Box sx={{ height: '100%', minHeight: 0, position: 'relative', width: '100%' }}>
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
        <AppFormDialog
          actions={(
            <>
              <Button onClick={() => setDetailsDialogOpen(false)}>Cancelar</Button>
              <Button disabled={savingDetails || detailsName.trim().length < 2 || !detailsCode.trim()} onClick={() => void saveDetails()} variant="contained">
                Guardar
              </Button>
            </>
          )}
          maxWidth="sm"
          onClose={() => setDetailsDialogOpen(false)}
          open={detailsDialogOpen}
          title="Datos de plantilla"
        >
            <Stack spacing={2}>
              <TextField fullWidth label="Nombre" onChange={(event) => setDetailsName(event.target.value)} value={detailsName} />
              <TextField fullWidth helperText="Identificador usado por apps/API." label="Codigo" onChange={(event) => setDetailsCode(event.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))} value={detailsCode} />
              <Autocomplete
                freeSolo
                multiple
                onChange={(_event, value) => setDetailsTags(Array.from(new Set(value.map((tag) => tag.trim()).filter(Boolean))))}
                options={availableTags.map((tag) => tag.name)}
                renderInput={(params) => <TextField {...params} helperText="Selecciona o escribe tags." label="Tags" />}
                value={detailsTags}
              />
            </Stack>
        </AppFormDialog>
        <Backdrop
          open={editorBusy}
          sx={{
            bgcolor: 'rgba(0, 0, 0, 0.72)',
            color: '#ffffff',
            display: 'grid',
            placeItems: 'center',
            zIndex: (theme) => theme.zIndex.modal + 10,
          }}
        >
          <Stack spacing={1.5} sx={{ alignItems: 'center' }}>
            <CircularProgress color="inherit" size={34} thickness={4} />
            <Typography sx={{ fontSize: '0.875rem', fontWeight: 600 }}>{editorBusyLabel}</Typography>
          </Stack>
        </Backdrop>
        <Box className="pdfme-workspace" sx={{ height: '100%', minHeight: 0, width: '100%' }}>
          <Card sx={{ bgcolor: 'background.default', borderRadius: 0, boxShadow: 'none', height: '100%', minWidth: 0, overflow: 'hidden' }}>
            {designerTemplate ? (
              <Suspense fallback={null}>
                {isPreviewRoute ? <PdfmeViewer key={designerWorkspaceKey} mode={mode} template={designerTemplate} /> : <PdfmeDesigner key={designerWorkspaceKey} mode={mode} ref={designerRef} template={designerTemplate} />}
              </Suspense>
            ) : <LoadingState label="Preparando plantilla..." minHeight="100%" />}
          </Card>
        </Box>
      </Box>
    );
  }

  return (
    <Stack spacing={2} sx={{ flexGrow: 1, minHeight: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Card sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minHeight: 0, p: 0 }}>
        {loading ? (
          <LoadingState label="Cargando plantillas..." minHeight="100%" />
        ) : filteredTemplates.length === 0 ? (
          <Box sx={{ display: 'grid', placeItems: 'center', py: 6, flexGrow: 1 }}>
            <Typography>No hay plantillas.</Typography>
          </Box>
        ) : (
          <Box sx={{ flexGrow: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            <DataTable
              columns={['Plantilla', 'Version', 'Hoja', 'Tags', { name: 'Acciones', sort: false }]}
              data={filteredTemplates.slice(page * rowsPerPage, (page + 1) * rowsPerPage).map((template) => [
                <Box key="n"><strong>{template.name}</strong><br /><small>{template.code}</small></Box>,
                `v${template.versionNumber}`,
                `${template.pageFormat} ${template.pageOrientation === 'LANDSCAPE' ? 'Horizontal' : 'Vertical'}`,
                template.tags.join(', ') || 'Sin etiquetas',
                <Stack key="a" direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
                  <Button onClick={() => navigate(`/templates/preview/${template.code}`)} size="small" startIcon={<EyeOutlined />}>Preview</Button>
                  <Button onClick={() => navigate(`/templates/edit/${template.code}`)} size="small" startIcon={<EditOutlined />}>Editar</Button>
                  {can(user, 'templates.create') ? (
                    <Button disabled={duplicatingId === template.id} onClick={() => void duplicate(template)} size="small" startIcon={<CopyOutlined />}>Duplicar</Button>
                  ) : null}
                  {can(user, 'templates.delete') ? (
                    <Button color="error" disabled={deletingId === template.id} onClick={() => void confirmRemove(template)} size="small" startIcon={<DeleteOutlined />}>
                      Eliminar
                    </Button>
                  ) : null}
                </Stack>,
              ])}
            />
            <PaginationBar page={page} setPage={setPage} rowsPerPage={rowsPerPage} setRowsPerPage={setRowsPerPage} total={filteredTemplates.length} />
          </Box>
        )}
      </Card>
    </Stack>
  );
}
