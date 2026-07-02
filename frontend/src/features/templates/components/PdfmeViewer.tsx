import { useEffect, useMemo, useRef, useState } from 'react';
import type { Template as PdfmeTemplate } from '@pdfme/common';
import { Viewer } from '@pdfme/ui';
import { Alert } from '@mui/material';

import { pdfmePlugins } from './PdfmeDesigner';
import { loadPdfmeFonts } from './pdfmeFonts';

type PdfmeViewerProps = {
  template: PdfmeTemplate;
};

export function PdfmeViewer({ template }: PdfmeViewerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewerRef = useRef<Viewer | null>(null);
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
    viewerRef.current?.updateTemplate(template);
    viewerRef.current?.setInputs(previewInputs);
  }, [previewInputs, template]);

  return (
    <>
      {error ? <Alert severity="error">{error}</Alert> : null}
      <div ref={containerRef} style={{ height: '100%', minHeight: 0, width: '100%' }} />
    </>
  );
}
