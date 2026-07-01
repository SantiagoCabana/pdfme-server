import { Router } from 'express';
import { z } from 'zod';

import {
  createApiCredential,
  listApiCredentials,
  revokeApiCredential,
} from '../services/api-credentials.service.js';
import { requireAdminPermission } from '../middleware/admin-session.js';

export const apiCredentialsRouter = Router();

const createCredentialSchema = z.object({
  name: z.string().min(3),
  expiresAt: z.string().datetime().nullish(),
  permissionCodes: z.array(z.string().min(1)).optional(),
});

apiCredentialsRouter.get('/api-credentials', requireAdminPermission('api-credentials.read'), async (_request, response) => {
  const credentials = await listApiCredentials();
  response.json({ data: credentials });
});

apiCredentialsRouter.post('/api-credentials', requireAdminPermission('api-credentials.write'), async (request, response) => {
  const parsed = createCredentialSchema.safeParse(request.body);

  if (!parsed.success) {
    response.status(400).json({ message: 'Datos invalidos para crear la clave.' });
    return;
  }

  const result = await createApiCredential({
    name: parsed.data.name,
    expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null,
    permissionCodes: parsed.data.permissionCodes,
  });

  response.status(201).json({ ok: true, credential: result.credential, rawKey: result.rawKey });
});

apiCredentialsRouter.patch('/api-credentials/:id/revoke', requireAdminPermission('api-credentials.write'), async (request, response) => {
  try {
    const credential = await revokeApiCredential(request.params.id);
    response.json({ ok: true, credential });
  } catch {
    response.status(404).json({ message: 'No se encontro la clave API.' });
  }
});
