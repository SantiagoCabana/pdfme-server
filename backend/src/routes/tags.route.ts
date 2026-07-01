import { Router } from 'express';
import { z } from 'zod';

import { requirePermission } from '../middleware/session-auth.js';
import { createTag, deleteTag, listTags } from '../services/tags.service.js';

export const tagsRouter = Router();

const createTagSchema = z.object({
  name: z.string().min(1),
});

tagsRouter.get('/tags', requirePermission('templates.edit'), async (_request, response) => {
  response.json({ data: await listTags() });
});

tagsRouter.post('/tags', requirePermission('templates.edit'), async (request, response) => {
  const parsed = createTagSchema.safeParse(request.body);

  if (!parsed.success) {
    response.status(400).json({ message: 'Datos invalidos para crear el tag.' });
    return;
  }

  response.status(201).json({ ok: true, tag: await createTag(parsed.data.name) });
});

tagsRouter.delete('/tags/:id', requirePermission('templates.edit'), async (request, response) => {
  try {
    await deleteTag(request.params.id);
    response.json({ ok: true });
  } catch {
    response.status(404).json({ message: 'No se encontro el tag.' });
  }
});
