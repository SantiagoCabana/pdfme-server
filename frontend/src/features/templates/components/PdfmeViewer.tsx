import { useEffect, useRef } from 'react';
import type { Template as PdfmeTemplate } from '@pdfme/common';
import { Viewer } from '@pdfme/ui';

import { pdfmePlugins } from './PdfmeDesigner';
import { loadPdfmeFonts } from './pdfmeFonts';

type PdfmeViewerProps = {
  template: PdfmeTemplate;
};

export function PdfmeViewer({ template }: PdfmeViewerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewerRef = useRef<Viewer | null>(null);

  useEffect(() => {
    if (!containerRef.current) return undefined;

    let isMounted = true;

    loadPdfmeFonts().then((font) => {
      if (!isMounted || !containerRef.current) return;

      const viewer = new Viewer({
        domContainer: containerRef.current,
        template,
        inputs: [{}],
        plugins: pdfmePlugins,
        options: {
          font,
          lang: 'es',
        },
      });

      viewerRef.current = viewer;
    });

    return () => {
      isMounted = false;
      viewerRef.current?.destroy();
      viewerRef.current = null;
    };
  }, []);

  useEffect(() => {
    viewerRef.current?.updateTemplate(template);
  }, [template]);

  return <div ref={containerRef} style={{ height: '100%', minHeight: 0, width: '100%' }} />;
}
