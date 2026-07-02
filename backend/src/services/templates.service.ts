import { Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';

import { prisma } from '../prisma.js';

const DEFAULT_DESIGNER_JSON = { schemas: [[]] };
const DEFAULT_INPUT = {};

function slugifyCode(value: string) {
  const base = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 48);

  return base || 'template';
}

function buildTemplateCode(name: string) {
  return `${slugifyCode(name)}_${randomUUID().replace(/-/g, '').slice(0, 8)}`;
}

function mapTemplate(template: Prisma.TemplateGetPayload<{
  include: {
    versions: { include: { pages: true } };
    tags: { include: { tag: true } };
  };
}>) {
  const currentVersion = template.versions.find((version) => version.isCurrent) ?? template.versions[0];
  const firstPage = currentVersion?.pages[0];
  const designerJson = currentVersion ? composeDesignerJson(currentVersion.pages) : DEFAULT_DESIGNER_JSON;

  return {
    id: template.id,
    name: template.name,
    code: template.code,
    thumbnailUrl: template.thumbnailUrl,
    status: template.status,
    lastPublishedAt: template.lastPublishedAt?.toISOString() ?? null,
    versionNumber: currentVersion?.versionNumber ?? 0,
    versionId: currentVersion?.id ?? null,
    versions: template.versions.map((version) => ({
      id: version.id,
      versionNumber: version.versionNumber,
      isCurrent: version.isCurrent,
      isPublished: version.isPublished,
      pageCount: version.pages.length,
      createdAt: version.createdAt.toISOString(),
      updatedAt: version.updatedAt.toISOString(),
    })),
    isPublished: currentVersion?.isPublished ?? false,
    pageCount: currentVersion?.pages.length ?? 0,
    pageFormat: firstPage?.pageFormat ?? 'A4',
    pageOrientation: firstPage?.pageOrientation ?? 'PORTRAIT',
    pageWidthMm: firstPage?.pageWidthMm ?? 210,
    pageHeightMm: firstPage?.pageHeightMm ?? 297,
    paddingVerticalMm: firstPage?.paddingVerticalMm ?? 12,
    paddingHorizontalMm: firstPage?.paddingHorizontalMm ?? 12,
    designerJson,
    tags: template.tags.map((entry) => entry.tag.name),
    createdAt: template.createdAt.toISOString(),
    updatedAt: template.updatedAt.toISOString(),
  };
}

const templateInclude = {
  versions: {
    orderBy: { versionNumber: 'asc' as const },
    include: { pages: { orderBy: { pageNumber: 'asc' as const } } },
  },
  tags: { include: { tag: true } },
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getSchemaPages(designerJson: unknown) {
  if (!isRecord(designerJson) || !Array.isArray(designerJson.schemas)) return [[]];

  const schemas = designerJson.schemas;

  if (schemas.length === 0) return [[]];

  return schemas.map((pageSchemas) => Array.isArray(pageSchemas) ? pageSchemas : []);
}

function buildPageDesignerJson(designerJson: unknown, pageSchemas: unknown[]) {
  if (!isRecord(designerJson)) {
    return { schemas: [pageSchemas] } as Prisma.InputJsonValue;
  }

  return {
    ...designerJson,
    schemas: [pageSchemas],
  } as Prisma.InputJsonValue;
}

function composeDesignerJson(pages: Prisma.TemplatePageGetPayload<Record<string, never>>[]) {
  const firstPageJson = pages[0]?.designerJson;
  const base = isRecord(firstPageJson) ? firstPageJson : DEFAULT_DESIGNER_JSON;

  return {
    ...base,
    schemas: pages.map((page) => getSchemaPages(page.designerJson)[0] ?? []),
  };
}

export async function listTemplateCatalog(options?: { publishedOnly?: boolean }) {
  const templates = await prisma.template.findMany({
    where: options?.publishedOnly ? { status: 'ACTIVE', versions: { some: { isCurrent: true, isPublished: true } } } : undefined,
    orderBy: { updatedAt: 'desc' },
    include: templateInclude,
  });

  return templates.map(mapTemplate);
}

export async function createTemplate(input: {
  name: string;
  code?: string;
  tagNames?: string[];
  createdById?: string | null;
}) {
  const code = input.code?.trim() || buildTemplateCode(input.name);
  const normalizedTags = Array.from(new Set((input.tagNames ?? []).map((tag) => tag.trim()).filter(Boolean)));

  const template = await prisma.template.create({
    data: {
      name: input.name,
      code,
      status: 'DRAFT',
      createdById: input.createdById ?? null,
      tags: {
        create: normalizedTags.map((name) => ({
          tag: {
            connectOrCreate: {
              where: { name },
              create: { name },
            },
          },
        })),
      },
      versions: {
        create: {
          versionNumber: 1,
          defaultInput: DEFAULT_INPUT,
          inputExample: DEFAULT_INPUT,
          isCurrent: true,
          createdById: input.createdById ?? null,
          pages: {
            create: {
              pageNumber: 1,
              designerJson: DEFAULT_DESIGNER_JSON,
              pageFormat: 'A4',
              pageOrientation: 'PORTRAIT',
              pageWidthMm: 210,
              pageHeightMm: 297,
              paddingVerticalMm: 12,
              paddingHorizontalMm: 12,
              sourceMode: 'BLANK',
            },
          },
        },
      },
    },
    include: templateInclude,
  });

  return mapTemplate(template);
}

export async function updateTemplatePageSettings(id: string, input: {
  pageFormat: 'A4' | 'LETTER' | 'LEGAL' | 'CUSTOM';
  pageOrientation: 'PORTRAIT' | 'LANDSCAPE';
  pageWidthMm: number;
  pageHeightMm: number;
  designerJson?: Prisma.InputJsonValue;
}) {
  const currentVersion = await prisma.templateVersion.findFirstOrThrow({
    where: { templateId: id, isCurrent: true },
    include: { pages: { orderBy: { pageNumber: 'asc' } } },
  });
  const schemaPages = input.designerJson ? getSchemaPages(input.designerJson) : currentVersion.pages.map((page) => getSchemaPages(page.designerJson)[0] ?? []);
  const safeSchemaPages = schemaPages.length > 0 ? schemaPages : [[]];

  await prisma.$transaction([
    ...safeSchemaPages.map((pageSchemas, index) => prisma.templatePage.upsert({
      where: {
        templateVersionId_pageNumber: {
          templateVersionId: currentVersion.id,
          pageNumber: index + 1,
        },
      },
      update: {
        pageFormat: input.pageFormat,
        pageOrientation: input.pageOrientation,
        pageWidthMm: input.pageWidthMm,
        pageHeightMm: input.pageHeightMm,
        designerJson: input.designerJson ? buildPageDesignerJson(input.designerJson, pageSchemas) : undefined,
      },
      create: {
        templateVersionId: currentVersion.id,
        pageNumber: index + 1,
        designerJson: input.designerJson ? buildPageDesignerJson(input.designerJson, pageSchemas) : DEFAULT_DESIGNER_JSON,
        pageFormat: input.pageFormat,
        pageOrientation: input.pageOrientation,
        pageWidthMm: input.pageWidthMm,
        pageHeightMm: input.pageHeightMm,
        paddingVerticalMm: 12,
        paddingHorizontalMm: 12,
        sourceMode: 'BLANK',
      },
    })),
    prisma.templatePage.deleteMany({
      where: {
        templateVersionId: currentVersion.id,
        pageNumber: { gt: safeSchemaPages.length },
      },
    }),
  ]);

  const template = await prisma.template.findUniqueOrThrow({ where: { id }, include: templateInclude });
  return mapTemplate(template);
}

export async function setCurrentTemplateVersion(id: string, versionId: string) {
  await prisma.templateVersion.findFirstOrThrow({
    where: { id: versionId, templateId: id },
    select: { id: true },
  });

  await prisma.$transaction([
    prisma.templateVersion.updateMany({ where: { templateId: id }, data: { isCurrent: false } }),
    prisma.templateVersion.update({ where: { id: versionId }, data: { isCurrent: true } }),
  ]);

  const template = await prisma.template.findUniqueOrThrow({ where: { id }, include: templateInclude });
  return mapTemplate(template);
}

export async function createTemplateVersion(id: string, createdById?: string | null) {
  const currentVersion = await prisma.templateVersion.findFirstOrThrow({
    where: { templateId: id, isCurrent: true },
    include: { pages: { orderBy: { pageNumber: 'asc' } } },
  });
  const lastVersion = await prisma.templateVersion.findFirst({
    where: { templateId: id },
    orderBy: { versionNumber: 'desc' },
    select: { versionNumber: true },
  });

  await prisma.$transaction([
    prisma.templateVersion.updateMany({ where: { templateId: id }, data: { isCurrent: false } }),
    prisma.templateVersion.create({
      data: {
        templateId: id,
        versionNumber: (lastVersion?.versionNumber ?? 0) + 1,
        notes: currentVersion.notes,
        defaultInput: currentVersion.defaultInput ?? DEFAULT_INPUT,
        inputExample: currentVersion.inputExample ?? DEFAULT_INPUT,
        isCurrent: true,
        createdById: createdById === 'bootstrap-admin' ? null : createdById ?? null,
        pages: {
          create: currentVersion.pages.map((page) => ({
            pageNumber: page.pageNumber,
            designerJson: page.designerJson ?? DEFAULT_DESIGNER_JSON,
            pageFormat: page.pageFormat,
            pageOrientation: page.pageOrientation,
            pageWidthMm: page.pageWidthMm,
            pageHeightMm: page.pageHeightMm,
            paddingVerticalMm: page.paddingVerticalMm,
            paddingHorizontalMm: page.paddingHorizontalMm,
            sourceMode: page.sourceMode,
            baseFileName: page.baseFileName,
            baseFileUrl: page.baseFileUrl,
            previewImageUrl: page.previewImageUrl,
          })),
        },
      },
    }),
  ]);

  const template = await prisma.template.findUniqueOrThrow({ where: { id }, include: templateInclude });
  return mapTemplate(template);
}

export async function publishTemplate(id: string, publishedById?: string | null) {
  const currentVersion = await prisma.templateVersion.findFirstOrThrow({
    where: { templateId: id, isCurrent: true },
    select: { id: true },
  });

  const now = new Date();

  await prisma.$transaction([
    prisma.template.update({ where: { id }, data: { status: 'ACTIVE', lastPublishedAt: now } }),
    prisma.templateVersion.update({
      where: { id: currentVersion.id },
      data: {
        isPublished: true,
        publishedAt: now,
        publishedById: publishedById === 'bootstrap-admin' ? null : publishedById ?? null,
      },
    }),
  ]);

  const template = await prisma.template.findUniqueOrThrow({ where: { id }, include: templateInclude });
  return mapTemplate(template);
}

export async function deleteTemplate(id: string) {
  await prisma.template.delete({ where: { id } });
}
