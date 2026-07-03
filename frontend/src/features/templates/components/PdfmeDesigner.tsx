import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
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

export type PdfmeDesignerHandle = {
  getTemplate: () => PdfmeTemplate | null;
};

export const PdfmeDesigner = forwardRef<PdfmeDesignerHandle, PdfmeDesignerProps>(function PdfmeDesigner({ template, onChange }, ref) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const designerRef = useRef<Designer | null>(null);
  const internalTemplateRef = useRef<PdfmeTemplate | null>(null);
  const skipNextTemplateSyncRef = useRef(false);

  useImperativeHandle(ref, () => ({
    getTemplate: () => designerRef.current?.getTemplate() ?? internalTemplateRef.current,
  }), []);

  useEffect(() => {
    if (!containerRef.current) return undefined;

    let isMounted = true;

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

      designer.onChangeTemplate((nextTemplate) => {
        internalTemplateRef.current = nextTemplate;
        skipNextTemplateSyncRef.current = true;
        onChange(nextTemplate);
      });
      designerRef.current = designer;
    });

    return () => {
      isMounted = false;
      designerRef.current?.destroy();
      designerRef.current = null;
      internalTemplateRef.current = null;
      skipNextTemplateSyncRef.current = false;
    };
  }, []);

  const lastSchemasLengthRef = useRef(template.schemas.length);

  useEffect(() => {
    const schemasLengthChanged = lastSchemasLengthRef.current !== template.schemas.length;
    lastSchemasLengthRef.current = template.schemas.length;

    if (!schemasLengthChanged && skipNextTemplateSyncRef.current && internalTemplateRef.current === template) {
      skipNextTemplateSyncRef.current = false;
      return;
    }

    designerRef.current?.updateTemplate(template);
    skipNextTemplateSyncRef.current = false;
  }, [template]);

  return <div ref={containerRef} className="pdfme-container" />;
});
