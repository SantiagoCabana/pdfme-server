import type { Schema, Template as PdfmeTemplate } from '@pdfme/common';

const familyVariantMap: Record<string, { bold: string; italic: string; boldItalic: string; code: string }> = {
  Poppins: { bold: 'Poppins 700', italic: 'Poppins 400', boldItalic: 'Poppins 700', code: 'Roboto Mono 400' },
  Montserrat: { bold: 'Montserrat 700', italic: 'Montserrat 400', boldItalic: 'Montserrat 700', code: 'Roboto Mono 400' },
  Lora: { bold: 'Lora 700', italic: 'Lora 400', boldItalic: 'Lora 700', code: 'Roboto Mono 400' },
  'Playfair Display': { bold: 'Playfair Display 700', italic: 'Playfair Display 400', boldItalic: 'Playfair Display 700', code: 'Roboto Mono 400' },
  'Roboto Mono': { bold: 'Roboto Mono 700', italic: 'Roboto Mono 400', boldItalic: 'Roboto Mono 700', code: 'Roboto Mono 400' },
  Oswald: { bold: 'Oswald 700', italic: 'Oswald 400', boldItalic: 'Oswald 700', code: 'Roboto Mono 400' },
};

function fontFamilyOf(fontName?: string) {
  if (!fontName) return 'Poppins';

  return Object.keys(familyVariantMap)
    .sort((a, b) => b.length - a.length)
    .find((family) => fontName === family || fontName.startsWith(`${family} `)) ?? 'Poppins';
}

function normalizeTextSchemaFonts(schema: Schema) {
  if (schema.type !== 'text' && schema.type !== 'multiVariableText') return schema;

  const family = fontFamilyOf(schema.fontName as string | undefined);
  const variants = familyVariantMap[family];

  return {
    ...schema,
    fontName: schema.fontName ?? `${family} 400`,
    fontVariantFallback: schema.fontVariantFallback ?? 'plain',
    fontVariants: {
      ...variants,
      ...(typeof schema.fontVariants === 'object' && schema.fontVariants ? schema.fontVariants : {}),
    },
  } as Schema;
}

export function normalizePdfmeTemplateFonts(template: PdfmeTemplate) {
  return {
    ...template,
    schemas: (template.schemas ?? []).map((page) => (
      Array.isArray(page) ? page.map((schema) => normalizeTextSchemaFonts(schema)) : page
    )),
  } as PdfmeTemplate;
}
