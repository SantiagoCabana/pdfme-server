import { prisma } from '@/lib/prisma';

export type TemplateCatalogItem = {
  id: string;
  name: string;
  code: string;
  status: string;
  versionNumber: number;
  pageFormat: string;
  orientation: string;
  pageCount: number;
  pageWidthMm: number;
  pageHeightMm: number;
  tags: string[];
  updatedAt: string;
};

export async function getTemplateOverview() {
  try {
    const templates = await prisma.template.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        versions: {
          where: { isCurrent: true },
          take: 1,
          include: {
            pages: {
              orderBy: { pageNumber: 'asc' },
            },
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    return {
      fallback: false,
      templates: templates.map<TemplateCatalogItem>((template) => {
        const currentVersion = template.versions[0];
        const firstPage = currentVersion?.pages[0];

        return {
          id: template.id,
          name: template.name,
          code: template.code,
          status: template.status,
          versionNumber: currentVersion?.versionNumber ?? 0,
          pageFormat: firstPage?.pageFormat ?? 'A4',
          orientation: firstPage?.pageOrientation ?? 'PORTRAIT',
          pageCount: currentVersion?.pages.length ?? 0,
          pageWidthMm: firstPage?.pageWidthMm ?? 210,
          pageHeightMm: firstPage?.pageHeightMm ?? 297,
          tags: template.tags.map((entry) => entry.tag.name),
          updatedAt: template.updatedAt.toISOString(),
        };
      }),
    };
  } catch {
    return {
      fallback: true,
      templates: [
        {
          id: 'template-base',
          name: 'Plantilla credencial base',
          code: 'credential-base',
          status: 'DRAFT',
          versionNumber: 1,
          pageFormat: 'A4',
          orientation: 'PORTRAIT',
          pageCount: 1,
          pageWidthMm: 210,
          pageHeightMm: 297,
          tags: ['credencial', 'rrhh'],
          updatedAt: new Date().toISOString(),
        },
      ],
    };
  }
}

export async function listTemplatesForApi() {
  const overview = await getTemplateOverview();
  return overview.templates.map((template) => ({
    id: template.id,
    name: template.name,
    code: template.code,
    status: template.status,
    versionNumber: template.versionNumber,
    pageFormat: template.pageFormat,
    orientation: template.orientation,
    pageCount: template.pageCount,
  }));
}
