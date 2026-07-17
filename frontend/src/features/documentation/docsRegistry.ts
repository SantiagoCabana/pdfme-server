import gettingStartedContent from './content/getting-started.md?raw';
import templatesContent from './content/templates.md?raw';
import apiContent from './content/api.md?raw';
import accessControlContent from './content/access-control.md?raw';

export type DocumentationArticle = {
  slug: string;
  title: string;
  description: string;
  category: string;
  content: string;
};

export const documentationArticles: DocumentationArticle[] = [
  {
    slug: 'getting-started',
    title: 'Guia rapida',
    description: 'Uso de la aplicacion, flujo recomendado y datos necesarios antes de consumir la API.',
    category: 'Usuarios',
    content: gettingStartedContent,
  },
  {
    slug: 'templates',
    title: 'Plantillas',
    description: 'Como crear, editar y preparar una plantilla para integraciones externas.',
    category: 'Usuarios',
    content: templatesContent,
  },
  {
    slug: 'api',
    title: 'API externa',
    description: 'Autenticacion con API key, endpoints publicos, ejemplos y formatos de respuesta.',
    category: 'Desarrolladores',
    content: apiContent,
  },
  {
    slug: 'access-control',
    title: 'Respuestas y errores',
    description: 'Codigos HTTP, errores frecuentes y estados actuales de la plataforma.',
    category: 'Desarrolladores',
    content: accessControlContent,
  },
];

export const defaultDocumentationSlug = documentationArticles[0]?.slug ?? 'getting-started';

export function findDocumentationArticle(slug: string) {
  return documentationArticles.find((article) => article.slug === slug) ?? null;
}
