import { Router } from 'express';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';

import { authenticateApiKey } from '../services/api-credentials.service.js';
import { createTemplate, createTemplateVersion, deleteTemplate, listTemplateCatalog, setCurrentTemplateVersion, updateTemplateDetails, updateTemplatePageSettings } from '../services/templates.service.js';
import { requirePermission } from '../middleware/session-auth.js';

export const templatesRouter = Router();

const createTemplateSchema = z.object({
  name: z.string().min(2),
  code: z.string().min(3).regex(/^[a-z0-9_]+$/).optional(),
  tagNames: z.array(z.string().min(1)).optional(),
});

const updatePageSettingsSchema = z.object({
  pageFormat: z.enum(['A4', 'LETTER', 'LEGAL', 'CUSTOM']),
  pageOrientation: z.enum(['PORTRAIT', 'LANDSCAPE']),
  pageWidthMm: z.number().positive(),
  pageHeightMm: z.number().positive(),
  designerJson: z.unknown().optional(),
});

const updateTemplateDetailsSchema = z.object({
  name: z.string().min(2).optional(),
  code: z.string().min(3).regex(/^[a-z0-9_]+$/).optional(),
  tagNames: z.array(z.string().min(1)).optional(),
});

templatesRouter.get('/templates', requirePermission('templates.view'), async (_request, response) => {
  response.json({ data: await listTemplateCatalog() });
});

templatesRouter.post('/templates', requirePermission('templates.create'), async (request, response) => {
  const parsed = createTemplateSchema.safeParse(request.body);

  if (!parsed.success) {
    response.status(400).json({ message: 'Datos invalidos para crear la plantilla.' });
    return;
  }

  try {
    const template = await createTemplate({
      name: parsed.data.name,
      code: parsed.data.code,
      tagNames: parsed.data.tagNames,
      createdById: response.locals.user?.id === 'bootstrap-admin' ? null : response.locals.user?.id ?? null,
    });

    response.status(201).json({ ok: true, template });
  } catch {
    response.status(409).json({ message: 'No se pudo crear la plantilla. Revisa que el codigo no exista.' });
  }
});

templatesRouter.patch('/templates/:id', requirePermission('templates.edit'), async (request, response) => {
  const parsed = updateTemplateDetailsSchema.safeParse(request.body);

  if (!parsed.success) {
    response.status(400).json({ message: 'Datos invalidos para actualizar la plantilla.' });
    return;
  }

  try {
    const template = await updateTemplateDetails(request.params.id, parsed.data);
    response.json({ ok: true, template });
  } catch {
    response.status(409).json({ message: 'No se pudo actualizar la plantilla. Revisa que el codigo no exista.' });
  }
});

templatesRouter.patch('/templates/:id/page-settings', requirePermission('templates.edit'), async (request, response) => {
  const parsed = updatePageSettingsSchema.safeParse(request.body);

  if (!parsed.success) {
    response.status(400).json({ message: 'Datos invalidos para guardar la hoja.' });
    return;
  }

  try {
    const template = await updateTemplatePageSettings(request.params.id, {
      ...parsed.data,
      designerJson: parsed.data.designerJson as Prisma.InputJsonValue | undefined,
    });
    response.json({ ok: true, template });
  } catch {
    response.status(404).json({ message: 'No se encontro la plantilla actual.' });
  }
});

templatesRouter.post('/templates/:id/versions', requirePermission('templates.edit'), async (request, response) => {
  try {
    const template = await createTemplateVersion(request.params.id, response.locals.user?.id ?? null);
    response.status(201).json({ ok: true, template });
  } catch {
    response.status(404).json({ message: 'No se encontro la plantilla actual.' });
  }
});

templatesRouter.patch('/templates/:id/versions/:versionId/current', requirePermission('templates.edit'), async (request, response) => {
  try {
    const template = await setCurrentTemplateVersion(request.params.id, request.params.versionId);
    response.json({ ok: true, template });
  } catch {
    response.status(404).json({ message: 'No se encontro la version solicitada.' });
  }
});

templatesRouter.delete('/templates/:id', requirePermission('templates.delete'), async (request, response) => {
  try {
    await deleteTemplate(request.params.id);
    response.json({ ok: true });
  } catch {
    response.status(404).json({ message: 'No se encontro la plantilla.' });
  }
});

templatesRouter.get('/v1/templates', async (request, response) => {
  const credential = await authenticateApiKey(String(request.header('x-api-key') ?? ''), {
    origin: request.header('origin'),
    ip: request.ip,
  });

  if (!credential) {
    response.status(401).json({ message: 'API key invalida.' });
    return;
  }

  response.json({ data: await listTemplateCatalog() });
});
