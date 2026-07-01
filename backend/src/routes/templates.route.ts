import { Router } from 'express';
import { z } from 'zod';

import { authenticateApiKey } from '../services/api-credentials.service.js';
import { createTemplate, deleteTemplate, listTemplateCatalog, publishTemplate } from '../services/templates.service.js';
import { requirePermission } from '../middleware/session-auth.js';

export const templatesRouter = Router();

const createTemplateSchema = z.object({
  name: z.string().min(2),
  description: z.string().nullish(),
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

  const template = await createTemplate({
    name: parsed.data.name,
    description: parsed.data.description ?? null,
    tagNames: parsed.data.tagNames,
    createdById: response.locals.user?.id === 'bootstrap-admin' ? null : response.locals.user?.id ?? null,
  });

  response.status(201).json({ ok: true, template });
});

templatesRouter.patch('/templates/:id/publish', requirePermission('templates.publish'), async (request, response) => {
  try {
    const template = await publishTemplate(request.params.id, response.locals.user?.id ?? null);
    response.json({ ok: true, template });
  } catch {
    response.status(404).json({ message: 'No se encontro la plantilla actual.' });
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

  response.json({ data: await listTemplateCatalog({ publishedOnly: true }) });
});
