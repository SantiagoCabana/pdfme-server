import { Router } from 'express';
import { z } from 'zod';

import {
  createApiCredential,
  listApiCredentials,
  revokeApiCredential,
} from '../services/api-credentials.service.js';
import { requirePermission } from '../middleware/session-auth.js';

export const apiCredentialsRouter = Router();

const createCredentialSchema = z.object({
  name: z.string().min(3),
  expiresAt: z.string().datetime().nullish(),
  allowedOrigins: z.array(z.string().url()).optional(),
});

apiCredentialsRouter.get('/api-credentials', requirePermission('api_keys.manage'), async (_request, response) => {
  const credentials = await listApiCredentials();
  response.json({ data: credentials });
});

apiCredentialsRouter.post('/api-credentials', requirePermission('api_keys.manage'), async (request, response) => {
  const parsed = createCredentialSchema.safeParse(request.body);

  if (!parsed.success) {
    response.status(400).json({ message: 'Datos invalidos para crear la clave.' });
    return;
  }

  const result = await createApiCredential({
    name: parsed.data.name,
    expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null,
    allowedOrigins: parsed.data.allowedOrigins ?? null,
    createdById: response.locals.user?.id === 'bootstrap-admin' ? null : response.locals.user?.id ?? null,
  });

  response.status(201).json({ ok: true, credential: result.credential, rawKey: result.rawKey });
});

apiCredentialsRouter.patch('/api-credentials/:id/revoke', requirePermission('api_keys.manage'), async (request, response) => {
  try {
    const credential = await revokeApiCredential(request.params.id, response.locals.user?.id ?? null);
    response.json({ ok: true, credential });
  } catch {
    response.status(404).json({ message: 'No se encontro la clave API.' });
  }
});
