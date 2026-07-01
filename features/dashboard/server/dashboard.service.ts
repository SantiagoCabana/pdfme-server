import { prisma } from '@/lib/prisma';

export async function getDashboardSummary() {
  try {
    const [users, templates, templateVersions, apiCredentials] = await Promise.all([
      prisma.userAccount.count(),
      prisma.template.count(),
      prisma.templateVersion.count(),
      prisma.apiCredential.count(),
    ]);

    const currentVersions = await prisma.templateVersion.findMany({
      where: { isCurrent: true },
      take: 5,
      orderBy: { updatedAt: 'desc' },
      include: {
        template: true,
        pages: {
          orderBy: { pageNumber: 'asc' },
          take: 1,
        },
      },
    });

    return {
      fallback: false,
      cards: [
        { label: 'Usuarios', value: String(users), note: 'Accesos centralizados.' },
        { label: 'Plantillas', value: String(templates), note: 'Formatos disponibles para documentos.' },
        { label: 'Versiones', value: String(templateVersions), note: 'Historial de cambios de cada plantilla.' },
        { label: 'Claves de acceso', value: String(apiCredentials), note: 'Limitadas para sistemas autorizados.' },
      ],
      currentVersions: currentVersions.map((version) => ({
        id: version.id,
        templateName: version.template.name,
        versionNumber: version.versionNumber,
        pageCount: version.pages.length,
        updatedAt: version.updatedAt.toISOString(),
      })),
    };
  } catch {
    return {
      fallback: true,
      cards: [
        { label: 'Usuarios', value: '0', note: 'Pendiente conectar datos.' },
        { label: 'Plantillas', value: '0', note: 'Listas para registrar formatos.' },
        { label: 'Versiones', value: '0', note: 'Listas para organizar paginas.' },
        { label: 'Claves de acceso', value: '0', note: 'Listo para crear claves.' },
      ],
      currentVersions: [],
    };
  }
}
