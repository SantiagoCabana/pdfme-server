import { useEffect, useRef } from 'react';
import type { Template as PdfmeTemplate } from '@pdfme/common';
import { Designer } from '@pdfme/ui';
import {
  barcodes,
  checkbox,
  date,
  dateTime,
  ellipse,
  image,
  line,
  multiVariableText,
  radioGroup,
  rectangle,
  select,
  signature,
  table,
  text,
  time,
} from '@pdfme/schemas';

import { loadPdfmeFonts } from './pdfmeFonts';

export const pdfmePlugins = {
  text,
  multiVariableText,
  image,
  signature,
  table,
  qrcode: barcodes.qrcode,
  code128: barcodes.code128,
  line,
  rectangle,
  ellipse,
  date,
  dateTime,
  time,
  select,
  radioGroup,
  checkbox,
};

type PdfmeDesignerProps = {
  template: PdfmeTemplate;
  onChange: (template: PdfmeTemplate) => void;
};

export function PdfmeDesigner({ template, onChange }: PdfmeDesignerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const designerRef = useRef<Designer | null>(null);

  useEffect(() => {
    if (!containerRef.current) return undefined;

    let isMounted = true;
    let removeDeselectListener: (() => void) | undefined;

    loadPdfmeFonts().then((font) => {
      if (!isMounted || !containerRef.current) return;

      const designer = new Designer({
        domContainer: containerRef.current,
        template,
        plugins: pdfmePlugins,
        options: {
          font,
          lang: 'es',
        },
      });

      const deselectWhenOutsideDesigner = (event: PointerEvent) => {
        const target = event.target;

        if (target instanceof Node && containerRef.current?.contains(target)) {
          return;
        }

        designer.selectSchemas([]);
      };

      document.addEventListener('pointerdown', deselectWhenOutsideDesigner, true);
      removeDeselectListener = () => document.removeEventListener('pointerdown', deselectWhenOutsideDesigner, true);

      designer.onChangeTemplate((nextTemplate) => onChange(nextTemplate));
      designerRef.current = designer;
    });

    return () => {
      isMounted = false;
      removeDeselectListener?.();
      designerRef.current?.destroy();
      designerRef.current = null;
    };
  }, []);

  useEffect(() => {
    designerRef.current?.updateTemplate(template);
  }, [template]);

  return <div ref={containerRef} style={{ height: '100%', minHeight: 0, width: '100%' }} />;
}
