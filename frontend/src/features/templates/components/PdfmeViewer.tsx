import { useEffect, useMemo, useRef } from 'react';
import type { Template as PdfmeTemplate } from '@pdfme/common';
import { Viewer } from '@pdfme/ui';

import type { ThemeMode } from '../../../theme/appTheme';
import { notifyError } from '../../../shared/notifications';
import { pdfmePlugins } from './PdfmeDesigner';
import { loadPdfmeFonts } from './pdfmeFonts';
import { normalizePdfmeTemplateFonts } from './pdfmeTemplateFonts';
import { createPdfmeTheme } from './pdfmeTheme';

type PdfmeViewerProps = {
  mode: ThemeMode;
  template: PdfmeTemplate;
};

export function PdfmeViewer({ mode, template }: PdfmeViewerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewerRef = useRef<Viewer | null>(null);
  const modeRef = useRef(mode);
  const previewTemplate = useMemo<PdfmeTemplate>(() => {
    return normalizePdfmeTemplateFonts(template);
  }, [template]);
  const previewInputs = useMemo(() => {
    const input: Record<string, string> = {};

    for (const page of previewTemplate.schemas ?? []) {
      for (const schema of page ?? []) {
        if (schema.name) input[schema.name] = schema.content ?? '';
      }
    }

    return [input];
  }, [previewTemplate]);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    if (!containerRef.current) return undefined;

    let isMounted = true;

    loadPdfmeFonts().then((font) => {
      if (!isMounted || !containerRef.current) return;

      const viewer = new Viewer({
        domContainer: containerRef.current,
        template: previewTemplate,
        inputs: previewInputs,
        plugins: pdfmePlugins,
        options: {
          font,
          lang: 'es',
          theme: createPdfmeTheme(modeRef.current),
        },
      });

      viewerRef.current = viewer;
    }).catch(() => {
      if (isMounted) notifyError('No se pudo cargar la vista previa.');
    });

    return () => {
      isMounted = false;
      viewerRef.current?.destroy();
      viewerRef.current = null;
    };
  }, []);

  useEffect(() => {
    viewerRef.current?.updateOptions({
      font: viewerRef.current.getOptions().font,
      lang: 'es',
      theme: createPdfmeTheme(mode),
    });
  }, [mode]);

  useEffect(() => {
    viewerRef.current?.updateTemplate(previewTemplate);
    viewerRef.current?.setInputs(previewInputs);
  }, [previewInputs, previewTemplate]);

  return (
    <>
      <div ref={containerRef} className="pdfme-container" />
    </>
  );
}
