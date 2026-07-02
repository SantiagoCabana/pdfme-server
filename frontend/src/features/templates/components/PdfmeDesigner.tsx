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

const plugins = {
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

    const designer = new Designer({
      domContainer: containerRef.current,
      template,
      plugins,
      options: {
        lang: 'es',
      },
    });

    designer.onChangeTemplate((nextTemplate) => onChange(nextTemplate));
    designerRef.current = designer;

    return () => {
      designer.destroy();
      designerRef.current = null;
    };
  }, []);

  useEffect(() => {
    designerRef.current?.updateTemplate(template);
  }, [template]);

  return <div ref={containerRef} style={{ height: '100%', minHeight: 680, width: '100%' }} />;
}
