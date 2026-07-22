import { useMemo, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import { useAppContext } from '../../app/AppContext';
import { DocumentationLayout } from './DocumentationLayout';
import { DocumentationMarkdown } from './DocumentationMarkdown';
import { defaultDocumentationSlug, documentationArticles, findDocumentationArticle } from './docsRegistry';

function parseDocumentationSlug(pathname: string) {
  return pathname.replace(/^\/documentation\/?/, '').replace(/\/+$/, '') || defaultDocumentationSlug;
}

export function DocumentationPage() {
  const { user, mode, themePreference, toggleMode } = useAppContext();
  const location = useLocation();
  const [query, setQuery] = useState('');
  const slug = useMemo(() => parseDocumentationSlug(location.pathname), [location.pathname]);
  const activeArticle = useMemo(() => findDocumentationArticle(slug), [slug]);
  const filteredArticles = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('es');
    if (!normalized) return documentationArticles;
    return documentationArticles.filter((article) =>
      `${article.title} ${article.description} ${article.content}`.toLocaleLowerCase('es').includes(normalized),
    );
  }, [query]);

  if (!activeArticle) {
    return <Navigate to={`/documentation/${defaultDocumentationSlug}`} replace />;
  }

  const articleIndex = documentationArticles.findIndex((article) => article.slug === activeArticle.slug);
  const previousArticle = documentationArticles[articleIndex - 1];
  const nextArticle = documentationArticles[articleIndex + 1];

  return (
    <DocumentationLayout
      user={user}
      mode={mode}
      themePreference={themePreference}
      activeArticle={activeArticle}
      filteredArticles={filteredArticles}
      previousArticle={previousArticle}
      nextArticle={nextArticle}
      query={query}
      onQueryChange={setQuery}
      onToggleMode={toggleMode}
    >
      <DocumentationMarkdown content={activeArticle.content} query={query} />
    </DocumentationLayout>
  );
}

export default DocumentationPage;
