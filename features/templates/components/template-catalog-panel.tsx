import { FileText, Plus } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { TemplateCatalogItem } from '../server/templates.service';

type TemplateCatalogPanelProps = {
  templates: TemplateCatalogItem[];
};

function getOrientationLabel(orientation: string) {
  return orientation === 'LANDSCAPE' ? 'Horizontal' : 'Vertical';
}

function getStatusLabel(status: string) {
  if (status === 'ACTIVE') return 'Activa';
  if (status === 'ARCHIVED') return 'Archivada';
  return 'Borrador';
}

function TemplatePreview({ template }: { template: TemplateCatalogItem }) {
  const isLandscape = template.orientation === 'LANDSCAPE' || template.pageWidthMm > template.pageHeightMm;

  return (
    <div className="templatePreviewFrame" aria-label={`Vista previa de ${template.name}`}>
      <div className={isLandscape ? 'templatePreviewPage isLandscape' : 'templatePreviewPage'}>
        <div className="templatePreviewLine isWide" />
        <div className="templatePreviewLine" />
        <div className="templatePreviewQr" />
      </div>
    </div>
  );
}

export function TemplateCatalogPanel({ templates }: TemplateCatalogPanelProps) {
  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Plantillas</CardTitle>
          <CardDescription>Administra el catalogo de documentos disponibles.</CardDescription>
        </div>
        <Button disabled>
          <Plus size={15} />
          Nueva plantilla
        </Button>
      </CardHeader>
      <CardContent>
        <div className="overflow-auto">
          <table className="dataTable min-w-[900px]">
            <thead>
              <tr>
                <th>Vista previa</th>
                <th>Nombre</th>
                <th>Estado</th>
                <th>Formato</th>
                <th>Orientacion</th>
                <th>Paginas</th>
                <th>Etiquetas</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {templates.length === 0 ? (
                <tr>
                  <td colSpan={8}>No hay plantillas registradas.</td>
                </tr>
              ) : (
                templates.map((template) => (
                  <tr key={template.id}>
                    <td>
                      <TemplatePreview template={template} />
                    </td>
                    <td>
                      <div className="templateNameCell">
                        <FileText size={16} />
                        <strong>{template.name}</strong>
                      </div>
                    </td>
                    <td>
                      <Badge variant={template.status === 'ACTIVE' ? 'success' : 'secondary'}>
                        {getStatusLabel(template.status)}
                      </Badge>
                    </td>
                    <td>{template.pageFormat}</td>
                    <td>{getOrientationLabel(template.orientation)}</td>
                    <td>{template.pageCount}</td>
                    <td>{template.tags.join(', ') || 'Sin etiquetas'}</td>
                    <td>
                      <Button disabled size="sm" type="button" variant="outline">
                        Editar
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
