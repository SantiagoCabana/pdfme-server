import gettingStartedContent from './content/getting-started.md?raw';
import authenticationContent from './content/authentication.md?raw';
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
    title: 'Visión general',
    description: 'Flujo completo para generar PDFs desde sistemas externos.',
    category: 'Integración',
    content: gettingStartedContent,
  },
  {
    slug: 'authentication',
    title: 'Autenticación',
    description: 'API keys, rotación, restricciones de origen y diagnóstico de acceso.',
    category: 'Integración',
    content: authenticationContent,
  },
  {
    slug: 'templates',
    title: 'Catálogo y plantillas',
    description: 'Cómo usar templateCode, variables de texto y objetos cambiables.',
    category: 'Integración',
    content: templatesContent,
  },
  {
    slug: 'api',
    title: 'Endpoints y ejemplos',
    description: 'Catálogo, inspección de entradas y render con ejemplos curl y TypeScript.',
    category: 'Integración',
    content: apiContent,
  },
  {
    slug: 'responses',
    title: 'Errores y operación',
    description: 'Códigos HTTP, respuestas, logging seguro, reintentos y salud del servicio.',
    category: 'Integración',
    content: responsesContent,
  },
];

export const defaultDocumentationSlug = documentationArticles[0]?.slug ?? 'getting-started';

export function findDocumentationArticle(slug: string) {
  return documentationArticles.find((article) => article.slug === slug) ?? null;
}
