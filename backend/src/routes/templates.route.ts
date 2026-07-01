import { Router } from 'express';
import { z } from 'zod';

import { authenticateApiKey, hasApiPermission } from '../services/api-credentials.service.js';
import { createTemplate, deleteTemplate, listTemplateCatalog } from '../services/templates.service.js';

export const templatesRouter = Router();

const createTemplateSchema = z.object({
  name: z.string().min(2),
  description: z.string().nullish(),
  tagNames: z.array(z.string().min(1)).optional(),
});

templatesRouter.get('/templates', async (_request, response) => {
  response.json({ data: await listTemplateCatalog() });
});

templatesRouter.post('/templates', async (request, response) => {
  const parsed = createTemplateSchema.safeParse(request.body);

  if (!parsed.success) {
    response.status(400).json({ message: 'Datos invalidos para crear la plantilla.' });
    return;
  }

  const template = await createTemplate({
    name: parsed.data.name,
    description: parsed.data.description ?? null,
    tagNames: parsed.data.tagNames,
  });

  response.status(201).json({ ok: true, template });
});

templatesRouter.delete('/templates/:id', async (request, response) => {
  try {
    await deleteTemplate(request.params.id);
    response.json({ ok: true });
  } catch {
    response.status(404).json({ message: 'No se encontro la plantilla.' });
  }
});

templatesRouter.get('/v1/templates', async (request, response) => {
  const credential = await authenticateApiKey(String(request.header('x-api-key') ?? ''));

  if (!credential) {
    response.status(401).json({ message: 'API key invalida.' });
    return;
  }

  if (!hasApiPermission(credential, 'templates.read')) {
    response.status(403).json({ message: 'La clave no tiene permiso para consultar plantillas.' });
    return;
  }

  response.json({ data: await listTemplateCatalog() });
});
