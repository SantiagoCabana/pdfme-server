import { prisma } from '../prisma.js';

type TagWithTemplates = Awaited<ReturnType<typeof findTags>>[number];

function mapTag(tag: TagWithTemplates) {
  return {
    id: tag.id,
    name: tag.name,
    templateCount: tag.templates.length,
    createdAt: tag.createdAt.toISOString(),
    updatedAt: tag.updatedAt.toISOString(),
  };
}

function findTags() {
  return prisma.tag.findMany({
    orderBy: { name: 'asc' },
    include: { templates: { select: { templateId: true } } },
  });
}

export async function listTags() {
  return (await findTags()).map(mapTag);
}

export async function createTag(name: string) {
  const normalized = name.trim();
  const tag = await prisma.tag.upsert({
    where: { name: normalized },
    update: {},
    create: { name: normalized },
    include: { templates: { select: { templateId: true } } },
  });

  return mapTag(tag);
}

export async function deleteTag(id: string) {
  await prisma.tag.delete({ where: { id } });
}
