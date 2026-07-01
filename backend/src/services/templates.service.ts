import { Prisma } from '@prisma/client';

import { prisma } from '../prisma.js';

const DEFAULT_DESIGNER_JSON = { schemas: [] };
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

async function buildUniqueCode(name: string) {
  const base = slugifyCode(name);
  let code = base;
  let suffix = 1;

  while (await prisma.template.findUnique({ where: { code }, select: { id: true } })) {
    suffix += 1;
    code = `${base}_${suffix}`;
  }

  return code;
}

function mapTemplate(template: Prisma.TemplateGetPayload<{
  include: {
    versions: { include: { pages: true } };
    tags: { include: { tag: true } };
  };
}>) {
  const currentVersion = template.versions[0];
  const firstPage = currentVersion?.pages[0];

  return {
    id: template.id,
    name: template.name,
    code: template.code,
    description: template.description,
    thumbnailUrl: template.thumbnailUrl,
    status: template.status,
    lastPublishedAt: template.lastPublishedAt?.toISOString() ?? null,
    versionNumber: currentVersion?.versionNumber ?? 0,
    versionId: currentVersion?.id ?? null,
    isPublished: currentVersion?.isPublished ?? false,
    pageCount: currentVersion?.pages.length ?? 0,
    pageFormat: firstPage?.pageFormat ?? 'A4',
    pageOrientation: firstPage?.pageOrientation ?? 'PORTRAIT',
    pageWidthMm: firstPage?.pageWidthMm ?? 210,
    pageHeightMm: firstPage?.pageHeightMm ?? 297,
    paddingVerticalMm: firstPage?.paddingVerticalMm ?? 12,
    paddingHorizontalMm: firstPage?.paddingHorizontalMm ?? 12,
    tags: template.tags.map((entry) => entry.tag.name),
    createdAt: template.createdAt.toISOString(),
    updatedAt: template.updatedAt.toISOString(),
  };
}

const templateInclude = {
  versions: {
    where: { isCurrent: true },
    include: { pages: { orderBy: { pageNumber: 'asc' as const } } },
  },
  tags: { include: { tag: true } },
};

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
  description?: string | null;
  tagNames?: string[];
  createdById?: string | null;
}) {
  const code = await buildUniqueCode(input.name);
  const normalizedTags = Array.from(new Set((input.tagNames ?? []).map((tag) => tag.trim()).filter(Boolean)));

  const template = await prisma.template.create({
    data: {
      name: input.name,
      code,
      description: input.description ?? null,
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
