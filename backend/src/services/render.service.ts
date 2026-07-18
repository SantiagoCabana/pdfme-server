import { BLANK_PDF } from '@pdfme/common';
import { generate } from '@pdfme/generator';
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
import type { Prisma } from '@prisma/client';

import { prisma } from '../prisma.js';
import { loadPdfmeFonts } from './pdfme-fonts.service.js';

type JsonRecord = Record<string, unknown>;

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

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getSchemaPages(designerJson: unknown) {
  if (!isRecord(designerJson) || !Array.isArray(designerJson.schemas)) return [[]];
  return designerJson.schemas.length > 0 ? designerJson.schemas : [[]];
}

function composeDesignerJson(pages: Prisma.TemplatePageGetPayload<Record<string, never>>[]) {
  const firstPageJson = pages[0]?.designerJson;
  const base = isRecord(firstPageJson) ? firstPageJson : {};

  return {
    ...base,
    schemas: pages.map((page) => getSchemaPages(page.designerJson)[0] ?? []),
  };
}

function normalizeSchemaPages(schemas: unknown[]): JsonRecord[][] {
  return schemas.map((pageSchemas) => {
    if (Array.isArray(pageSchemas)) return pageSchemas.filter(isRecord);
    if (!isRecord(pageSchemas)) return [];

    return Object.entries(pageSchemas).filter((entry): entry is [string, JsonRecord] => isRecord(entry[1])).map(([name, schema]) => ({
      ...schema,
      name,
    }));
  });
}

function stringifyInputValue(value: unknown) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return JSON.stringify(value);
}

function parseObjectContent(value: unknown) {
  if (isRecord(value)) return value;
  if (typeof value !== 'string' || !value.trim()) return {};

  try {
    const parsed = JSON.parse(value) as unknown;
    return isRecord(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function extractPlaceholders(value: unknown) {
  if (typeof value !== 'string') return [];

  const matches = value.matchAll(/\{([a-zA-Z0-9_]+)\}/g);
  return Array.from(matches, (match) => match[1]).filter(Boolean);
}

function interpolate(value: unknown, input: JsonRecord) {
  if (typeof value !== 'string') return stringifyInputValue(value);

  return value.replace(/\{([a-zA-Z0-9_]+)\}/g, (_match, key: string) => stringifyInputValue(input[key]));
}

function collectRequiredVariables(schemaPages: JsonRecord[][]) {
  const requiredVariables = new Set<string>();

  for (const page of schemaPages) {
    for (const schema of page) {
      if (Array.isArray(schema.variables)) {
        for (const variable of schema.variables) {
          if (typeof variable === 'string' && variable) requiredVariables.add(variable);
        }
      }

      for (const variable of extractPlaceholders(schema.text)) requiredVariables.add(variable);
      for (const variable of extractPlaceholders(schema.content)) requiredVariables.add(variable);
    }
  }

  return Array.from(requiredVariables);
}

function buildPdfmeInput(schemaPages: JsonRecord[][], input: JsonRecord) {
  const pdfmeInput: Record<string, string> = {};

  for (const page of schemaPages) {
    for (const schema of page) {
      const fieldName = typeof schema.name === 'string' ? schema.name : '';
      if (!fieldName) continue;

      if (Object.prototype.hasOwnProperty.call(input, fieldName)) {
        pdfmeInput[fieldName] = stringifyInputValue(input[fieldName]);
        continue;
      }

      if (schema.type === 'multiVariableText') {
        const defaults = parseObjectContent(schema.content);
        const values = { ...defaults };

        if (Array.isArray(schema.variables)) {
          for (const variable of schema.variables) {
            if (typeof variable === 'string' && Object.prototype.hasOwnProperty.call(input, variable)) {
              values[variable] = stringifyInputValue(input[variable]);
            }
          }
        }

        pdfmeInput[fieldName] = JSON.stringify(values);
        continue;
      }

      if (typeof schema.content === 'string') {
        pdfmeInput[fieldName] = interpolate(schema.content, input);
        continue;
      }

      pdfmeInput[fieldName] = '';
    }
  }

  return pdfmeInput;
}

export async function renderTemplatePdf(input: {
  templateCode: string;
  values: JsonRecord;
}) {
  const template = await prisma.template.findFirst({
    where: { code: input.templateCode, status: { not: 'ARCHIVED' } },
    include: {
      versions: {
        where: { isCurrent: true, status: true },
        include: { pages: { orderBy: { pageNumber: 'asc' } } },
        take: 1,
      },
    },
  });

  const currentVersion = template?.versions[0];

  if (!template || !currentVersion) {
    return { ok: false as const, status: 404, message: 'No se encontro la plantilla solicitada.' };
  }

  const designerJson = composeDesignerJson(currentVersion.pages);
  const schemaPages = normalizeSchemaPages(getSchemaPages(designerJson));
  const requiredVariables = collectRequiredVariables(schemaPages);
  const missingVariables = requiredVariables.filter((variable) => {
    const value = input.values[variable];
    return value === undefined || value === null || value === '';
  });

  if (missingVariables.length > 0) {
    return {
      ok: false as const,
      status: 400,
      message: 'Faltan variables requeridas para renderizar la plantilla.',
      missingVariables,
    };
  }

  const pdfmeInput = buildPdfmeInput(schemaPages, input.values);
  const basePdf = isRecord(designerJson) && 'basePdf' in designerJson && designerJson.basePdf
    ? designerJson.basePdf
    : BLANK_PDF;
  const font = await loadPdfmeFonts();

  const pdf = await generate({
    template: {
      basePdf: basePdf as never,
      schemas: schemaPages as never,
    },
    inputs: [pdfmeInput],
    plugins,
    options: {
      font,
      lang: 'es',
    },
  });

  return {
    ok: true as const,
    pdf,
    template: {
      code: template.code,
      name: template.name,
      versionNumber: currentVersion.versionNumber,
      pageCount: currentVersion.pages.length,
    },
  };
}
