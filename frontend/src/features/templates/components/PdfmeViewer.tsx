import { useEffect, useMemo, useRef, useState } from 'react';
import type { Template as PdfmeTemplate } from '@pdfme/common';
import { Viewer } from '@pdfme/ui';
import { Alert } from '@mui/material';

import type { ThemeMode } from '../../../theme/mantisTheme';
import { pdfmePlugins } from './PdfmeDesigner';
import { loadPdfmeFonts } from './pdfmeFonts';
import { createPdfmeTheme } from './pdfmeTheme';

type PdfmeViewerProps = {
  mode: ThemeMode;
  template: PdfmeTemplate;
};

export function PdfmeViewer({ mode, template }: PdfmeViewerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewerRef = useRef<Viewer | null>(null);
  const modeRef = useRef(mode);
  const [error, setError] = useState('');
  const previewInputs = useMemo(() => {
    const input: Record<string, string> = {};

    for (const page of template.schemas ?? []) {
      for (const schema of page ?? []) {
        if (schema.name) input[schema.name] = schema.content ?? '';
      }
    }

    return [input];
  }, [template]);

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
        template,
        inputs: previewInputs,
        plugins: pdfmePlugins,
        options: {
          font,
          lang: 'es',
          theme: createPdfmeTheme(modeRef.current),
        },
      });

      viewerRef.current = viewer;
      setError('');
    }).catch(() => {
      if (isMounted) setError('No se pudo cargar la vista previa.');
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
    viewerRef.current?.updateTemplate(template);
    viewerRef.current?.setInputs(previewInputs);
  }, [previewInputs, template]);

  return (
    <>
      {error ? <Alert severity="error">{error}</Alert> : null}
      <div ref={containerRef} className="pdfme-container" />
    </>
  );
}
