import { useEffect, useMemo, useRef, useState } from 'react';
import type { Schema, Template as PdfmeTemplate } from '@pdfme/common';
import { Form } from '@pdfme/ui';
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
  const formRef = useRef<Form | null>(null);
  const modeRef = useRef(mode);
  const [error, setError] = useState('');
  const previewTemplate = useMemo<PdfmeTemplate>(() => ({
    ...template,
    schemas: (template.schemas ?? []).map((page) => page.map((schema) => ({ ...schema, readOnly: true }) as Schema)),
  }), [template]);
  const previewInputs = useMemo(() => {
    const input: Record<string, string> = {};

    for (const page of template.schemas ?? []) {
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

      const form = new Form({
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

      formRef.current = form;
      setError('');
    }).catch(() => {
      if (isMounted) setError('No se pudo cargar la vista previa.');
    });

    return () => {
      isMounted = false;
      formRef.current?.destroy();
      formRef.current = null;
    };
  }, []);

  useEffect(() => {
    formRef.current?.updateOptions({
      font: formRef.current.getOptions().font,
      lang: 'es',
      theme: createPdfmeTheme(mode),
    });
  }, [mode]);

  useEffect(() => {
    formRef.current?.updateTemplate(previewTemplate);
    formRef.current?.setInputs(previewInputs);
  }, [previewInputs, previewTemplate]);

  return (
    <>
      {error ? <Alert severity="error">{error}</Alert> : null}
      <div ref={containerRef} className="pdfme-container" />
    </>
  );
}
