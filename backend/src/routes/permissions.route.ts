import { Router } from 'express';
import { z } from 'zod';

import { requirePermission } from '../middleware/session-auth.js';
import { listPermissionMatrix, updateRolePermissions } from '../services/permissions.service.js';

export const permissionsRouter = Router();

const updatePermissionsSchema = z.object({
  permissionCodes: z.array(z.string().min(1)),
});

permissionsRouter.get('/permissions', requirePermission('users.manage'), async (_request, response) => {
  try {
    response.json(await listPermissionMatrix());
  } catch (error) {
    console.error('No se pudo cargar la matriz de permisos.', error);
    response.status(503).json({ message: 'No se pudo cargar permisos. Revisa la conexion de base de datos.' });
  }
});

permissionsRouter.patch('/roles/:id/permissions', requirePermission('users.manage'), async (request, response) => {
  const parsed = updatePermissionsSchema.safeParse(request.body);

  if (!parsed.success) {
    response.status(400).json({ message: 'Datos invalidos para actualizar permisos.' });
    return;
  }

  try {
    response.json(await updateRolePermissions(request.params.id, parsed.data.permissionCodes));
  } catch (error) {
    if (error instanceof Error && error.message === 'ADMIN_ROLE_LOCKED') {
      response.status(400).json({ message: 'El rol ADMIN siempre conserva todos los permisos.' });
      return;
    }

    response.status(404).json({ message: 'No se encontro el rol.' });
  }
});
