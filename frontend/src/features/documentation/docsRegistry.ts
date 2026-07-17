import gettingStartedContent from './content/getting-started.md?raw';
import templatesContent from './content/templates.md?raw';
import apiContent from './content/api.md?raw';
import responsesContent from './content/responses.md?raw';

export type DocumentationArticle = {
  slug: string;
  title: string;
  description: string;
  category: 'Aplicación' | 'Integración';
  content: string;
};

export const documentationArticles: DocumentationArticle[] = [
  {
    slug: 'getting-started',
    title: 'Primeros pasos',
    description: 'Recorrido para iniciar sesión, administrar plantillas y preparar una integración.',
    category: 'Aplicación',
    content: gettingStartedContent,
  },
  {
    slug: 'templates',
    title: 'Plantillas y variables',
    description: 'Edición, vista previa, variables, Markdown y versiones activas.',
    category: 'Aplicación',
    content: templatesContent,
  },
  {
    slug: 'api',
    title: 'API externa',
    description: 'Autenticación, endpoints públicos y ejemplos listos para ejecutar.',
    category: 'Integración',
    content: apiContent,
  },
  {
    slug: 'responses',
    title: 'Respuestas y errores',
    description: 'Códigos HTTP, cuerpos de respuesta y diagnóstico de errores frecuentes.',
    category: 'Integración',
    content: responsesContent,
  },
];

export const defaultDocumentationSlug = documentationArticles[0]?.slug ?? 'getting-started';

export function findDocumentationArticle(slug: string) {
  return documentationArticles.find((article) => article.slug === slug) ?? null;
}
