import { useEffect, useMemo, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import { useAppContext } from '../../app/AppContext';
import { apiRequest } from '../../shared/api/client';
import { notifyError, notifySuccess } from '../../shared/notifications';
import { DocumentationLayout } from './DocumentationLayout';
import { DocumentationMarkdown } from './DocumentationMarkdown';
import { defaultDocumentationSlug, documentationArticles, findDocumentationArticle } from './docsRegistry';

type DocumentationShareResponse = {
  share: DocumentationPublicShare;
};

type DocumentationShareStatus = {
  ok: boolean;
  share: DocumentationPublicShare;
};

type DocumentationPublicShare = {
  enabled: boolean;
  publicId: string;
  createdAt: string;
  updatedAt: string;
};

function parseDocumentationPath(pathname: string) {
  const path = pathname.replace(/^\/documentation\/?/, '').replace(/\/+$/, '');
  const segments = path.split('/').filter(Boolean);

  if (segments[0] === 'share') {
    return {
      isPublicShare: true,
      shareToken: segments[1] ?? '',
      slug: segments.slice(2).join('/') || defaultDocumentationSlug,
    };
  }

  return {
    isPublicShare: false,
    shareToken: '',
    slug: path || defaultDocumentationSlug,
  };
}

export function DocumentationPage() {
  const { user, mode, themePreference, toggleMode } = useAppContext();
  const location = useLocation();
  const [query, setQuery] = useState('');
  const [shareStatus, setShareStatus] = useState<'idle' | 'validating' | 'valid' | 'invalid'>('idle');
  const [publicShare, setPublicShare] = useState<DocumentationPublicShare | null>(null);
  const [shareLoading, setShareLoading] = useState(false);

  const { isPublicShare, shareToken, slug } = useMemo(() => parseDocumentationPath(location.pathname), [location.pathname]);

  const activeArticle = useMemo(() => findDocumentationArticle(slug), [slug]);
  const filteredArticles = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('es');
    if (!normalized) return documentationArticles;
    return documentationArticles.filter((article) =>
      `${article.title} ${article.description} ${article.content}`.toLocaleLowerCase('es').includes(normalized),
    );
  }, [query]);

  useEffect(() => {
    if (!isPublicShare) {
      setShareStatus('idle');
      return;
    }

    if (!shareToken) {
      setShareStatus('invalid');
      return;
    }

    let active = true;
    setShareStatus('validating');

    apiRequest<DocumentationShareStatus>(`/api/documentation/share/${shareToken}`)
      .then(() => {
        if (active) setShareStatus('valid');
      })
      .catch(() => {
        if (active) setShareStatus('invalid');
      });

    return () => {
      active = false;
    };
  }, [isPublicShare, shareToken]);

  useEffect(() => {
    if (isPublicShare || !user) return;

    let active = true;

    apiRequest<DocumentationShareResponse>('/api/documentation/share')
      .then((response) => {
        if (active) setPublicShare(response.share);
      })
      .catch(() => {
        if (active) setPublicShare(null);
      });

    return () => {
      active = false;
    };
  }, [isPublicShare, user]);

  const copyPublicUrl = async (share: DocumentationPublicShare) => {
    if (!activeArticle) return;
    const url = `${window.location.origin}/documentation/share/${share.publicId}/${activeArticle.slug}`;
    await navigator.clipboard.writeText(url);
    await notifySuccess('Enlace publico copiado');
  };

  const copyShareLink = async () => {
    if (!activeArticle) return;

    setShareLoading(true);
    try {
      const response = publicShare?.enabled
        ? { share: publicShare }
        : await apiRequest<DocumentationShareResponse>('/api/documentation/share', { method: 'POST', body: '{}' });
      setPublicShare(response.share);
      await copyPublicUrl(response.share);
    } catch (error) {
      notifyError(error, 'No se pudo generar el enlace publico.');
    } finally {
      setShareLoading(false);
    }
  };

  const togglePublicShare = async (enabled: boolean) => {
    setShareLoading(true);
    try {
      const response = await apiRequest<DocumentationShareResponse>('/api/documentation/share', {
        method: 'PATCH',
        body: JSON.stringify({ enabled }),
      });
      setPublicShare(response.share);
      await notifySuccess(enabled ? 'Documentacion publica activada' : 'Documentacion publica desactivada');
    } catch (error) {
      notifyError(error, 'No se pudo actualizar el enlace publico.');
    } finally {
      setShareLoading(false);
    }
  };

  const resetPublicShare = async () => {
    setShareLoading(true);
    try {
      const response = await apiRequest<DocumentationShareResponse>('/api/documentation/share/reset', { method: 'POST', body: '{}' });
      setPublicShare(response.share);
      await copyPublicUrl(response.share);
    } catch (error) {
      notifyError(error, 'No se pudo reiniciar el enlace publico.');
    } finally {
      setShareLoading(false);
    }
  };

  if (!isPublicShare && !user) return <Navigate to="/login" replace />;
  if (isPublicShare && shareStatus === 'invalid') return <Navigate to="/login" replace />;
  if (isPublicShare && shareStatus !== 'valid') return null;
  if (!activeArticle) {
    const basePath = isPublicShare ? `/documentation/share/${shareToken}` : '/documentation';
    return <Navigate to={`${basePath}/${defaultDocumentationSlug}`} replace />;
  }

  const articleIndex = documentationArticles.findIndex((article) => article.slug === activeArticle.slug);
  const previousArticle = documentationArticles[articleIndex - 1];
  const nextArticle = documentationArticles[articleIndex + 1];

  return (
    <DocumentationLayout
      user={user}
      mode={mode}
      themePreference={themePreference}
      isPublicShare={isPublicShare}
      shareToken={shareToken}
      publicShare={publicShare}
      shareLoading={shareLoading}
      activeArticle={activeArticle}
      filteredArticles={filteredArticles}
      previousArticle={previousArticle}
      nextArticle={nextArticle}
      query={query}
      onQueryChange={setQuery}
      onToggleMode={toggleMode}
      onCopyShareLink={!isPublicShare ? copyShareLink : undefined}
      onTogglePublicShare={!isPublicShare ? togglePublicShare : undefined}
      onResetPublicShare={!isPublicShare ? resetPublicShare : undefined}
    >
      <DocumentationMarkdown content={activeArticle.content} query={query} />
    </DocumentationLayout>
  );
}

export default DocumentationPage;
