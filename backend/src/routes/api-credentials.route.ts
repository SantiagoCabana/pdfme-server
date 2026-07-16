import { Router } from 'express';
import { z } from 'zod';

import {
  createApiCredential,
  deleteApiCredential,
  listApiCredentials,
  revokeApiCredential,
} from '../services/api-credentials.service.js';
import { requirePermission } from '../middleware/session-auth.js';
import { prisma } from '../prisma.js';
import { logAuditEvent, getSpanishRole } from '../services/audit.service.js';

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

  const actor = response.locals.user;
  const actorRole = getSpanishRole(actor?.roles, actor?.isSuperAdmin);
  const detail = `El ${actorRole.toLowerCase()} ${actor?.displayName || 'Desconocido'} ha creado una clave API con nombre "${result.credential.name}"`;
  await logAuditEvent({
    actorId: actor?.id ?? null,
    action: 'Crear clave API',
    entityType: 'API_KEY',
    entityId: result.credential.id,
    metadata: {
      detail,
      actorName: actor?.displayName || 'Desconocido',
      actorRole,
      credentialName: result.credential.name,
      credentialPrefix: result.credential.prefix,
      expiresAt: result.credential.expiresAt,
    }
  });

  response.status(201).json({ ok: true, credential: result.credential, rawKey: result.rawKey });
});

apiCredentialsRouter.patch('/api-credentials/:id/revoke', requirePermission('api_keys.manage'), async (request, response) => {
  try {
    const credential = await revokeApiCredential(request.params.id, response.locals.user?.id ?? null);

    const actor = response.locals.user;
    const actorRole = getSpanishRole(actor?.roles, actor?.isSuperAdmin);
    const detail = `El ${actorRole.toLowerCase()} ${actor?.displayName || 'Desconocido'} ha revocado la clave API "${credential.name}"`;
    await logAuditEvent({
      actorId: actor?.id ?? null,
      action: 'Revocar clave API',
      entityType: 'API_KEY',
      entityId: credential.id,
      metadata: {
        detail,
        actorName: actor?.displayName || 'Desconocido',
        actorRole,
        credentialName: credential.name,
        credentialPrefix: credential.prefix,
      }
    });

    response.json({ ok: true, credential });
  } catch {
    response.status(404).json({ message: 'No se encontro la clave API.' });
  }
});

apiCredentialsRouter.delete('/api-credentials/:id', requirePermission('api_keys.manage'), async (request, response) => {
  try {
    const credential = await deleteApiCredential(request.params.id);

    const actor = response.locals.user;
    const actorRole = getSpanishRole(actor?.roles, actor?.isSuperAdmin);
    const detail = `El ${actorRole.toLowerCase()} ${actor?.displayName || 'Desconocido'} ha eliminado la clave API "${credential.name}"`;
    await logAuditEvent({
      actorId: actor?.id ?? null,
      action: 'Eliminar clave API',
      entityType: 'API_KEY',
      entityId: credential.id,
      metadata: {
        detail,
        actorName: actor?.displayName || 'Desconocido',
        actorRole,
        credentialName: credential.name,
        credentialPrefix: credential.prefix,
      }
    });

    response.json({ ok: true, credential });
  } catch {
    response.status(404).json({ message: 'No se encontro la clave API.' });
  }
});
