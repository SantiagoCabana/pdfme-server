import { Router } from 'express';
import { z } from 'zod';

import { requirePermission } from '../middleware/session-auth.js';
import { createUser, deleteUser, listRoles, listUsers, updateUser } from '../services/users.service.js';
import { setAuthCookie } from '../auth/session-token.js';
import { loadUserSession } from '../auth/auth.service.js';
import { prisma } from '../prisma.js';
import { logAuditEvent, getSpanishRole } from '../services/audit.service.js';
import { env } from '../env.js';
import { verifyPassword } from '../auth/password.js';

export const usersRouter = Router();

const roleCodeSchema = z.enum(['VIEWER', 'EDITOR', 'MANAGER', 'ADMIN']);

const createUserSchema = z.object({
  email: z.string().email(),
  displayName: z.string().min(2),
  password: z.string().min(8),
  roleCode: roleCodeSchema,
});

const updateUserSchema = z.object({
  displayName: z.string().min(2).optional(),
  status: z.enum(['ACTIVE', 'INVITED', 'SUSPENDED']).optional(),
  roleCode: roleCodeSchema.optional(),
  password: z.string().min(8).optional(),
});

usersRouter.get('/users', requirePermission('users.manage'), async (_request, response) => {
  response.json({ data: await listUsers(), roles: await listRoles() });
});

usersRouter.post('/users', requirePermission('users.manage'), async (request, response) => {
  const parsed = createUserSchema.safeParse(request.body);

  if (!parsed.success) {
    response.status(400).json({ message: 'Datos invalidos para crear usuario.' });
    return;
  }

  try {
    const user = await createUser(parsed.data);
    if (user) {
      const actor = response.locals.user;
      const actorRole = getSpanishRole(actor?.roles, actor?.isSuperAdmin);
      const detail = `El ${actorRole.toLowerCase()} ${actor?.displayName || 'Desconocido'} ha creado el Usuario ${user.displayName}`;
      await logAuditEvent({
        actorId: actor?.id ?? null,
        action: 'Crear usuario',
        entityType: 'USER',
        entityId: user.id,
        metadata: {
          detail,
          actorName: actor?.displayName || 'Desconocido',
          actorRole,
          targetName: user.displayName,
          targetEmail: user.email,
          targetRole: parsed.data.roleCode,
        }
      });
    }
    response.status(201).json({ ok: true, user });
  } catch {
    response.status(409).json({ message: 'No se pudo crear el usuario. Revisa si el correo ya existe.' });
  }
});

usersRouter.patch('/users/:id', requirePermission('users.manage'), async (request, response) => {
  const parsed = updateUserSchema.safeParse(request.body);

  if (!parsed.success) {
    response.status(400).json({ message: 'Datos invalidos para actualizar usuario.' });
    return;
  }

  try {
    const originalUser = await prisma.userAccount.findUnique({
      where: { id: request.params.id },
      include: { roles: { include: { accessRole: true } } }
    });

    const user = await updateUser({ id: request.params.id, ...parsed.data });
    
    if (originalUser && user) {
      const actor = response.locals.user;
      const actorRole = getSpanishRole(actor?.roles, actor?.isSuperAdmin);
      const changes: string[] = [];
      const changeMeta: any = {};

      if (parsed.data.password) {
        changes.push('contraseña');
        changeMeta.password = true;
      }
      if (parsed.data.displayName && parsed.data.displayName !== originalUser.displayName) {
        changes.push(`nombre a "${parsed.data.displayName}"`);
        changeMeta.displayName = { old: originalUser.displayName, new: parsed.data.displayName };
      }
      if (parsed.data.status && parsed.data.status !== originalUser.status) {
        changes.push(`estado a "${parsed.data.status}"`);
        changeMeta.status = { old: originalUser.status, new: parsed.data.status };
      }
      const oldRole = originalUser.roles.map((r) => r.accessRole.code)[0] || '';
      if (parsed.data.roleCode && parsed.data.roleCode !== oldRole) {
        changes.push(`rol a "${parsed.data.roleCode}"`);
        changeMeta.roleCode = { old: oldRole, new: parsed.data.roleCode };
      }

      if (changes.length > 0) {
        let detail = `El ${actorRole.toLowerCase()} ${actor?.displayName || 'Desconocido'} ha actualizado el Usuario ${originalUser.displayName}`;
        if (parsed.data.password && changes.length === 1) {
          detail = `El ${actorRole.toLowerCase()} ${actor?.displayName || 'Desconocido'} ha cambiado la contraseña del Usuario ${originalUser.displayName}`;
        } else {
          detail = `El ${actorRole.toLowerCase()} ${actor?.displayName || 'Desconocido'} ha cambiado ${changes.join(', ')} del Usuario ${originalUser.displayName}`;
        }

        await logAuditEvent({
          actorId: actor?.id ?? null,
          action: 'Actualizar usuario',
          entityType: 'USER',
          entityId: user.id,
          metadata: {
            detail,
            actorName: actor?.displayName || 'Desconocido',
            actorRole,
            targetName: originalUser.displayName,
            targetEmail: originalUser.email,
            changes: changeMeta
          }
        });
      }
    }

    if (user && response.locals.user && user.id === response.locals.user.id) {
      const sessionUser = await loadUserSession(user.id);
      if (sessionUser) {
        setAuthCookie(response, sessionUser);
      }
    }
    response.json({ ok: true, user });
  } catch {
    response.status(404).json({ message: 'No se encontro el usuario.' });
  }
});

usersRouter.delete('/users/:id', requirePermission('users.manage'), async (request, response) => {
  if (request.params.id === response.locals.user?.id) {
    response.status(400).json({ message: 'No puedes eliminar tu propio usuario.' });
    return;
  }

  const { password } = request.body;
  if (!password) {
    response.status(400).json({ message: 'La contraseña de verificación es requerida.' });
    return;
  }

  const currentUser = response.locals.user;
  if (!currentUser) {
    response.status(401).json({ message: 'No autenticado.' });
    return;
  }

  let isValid = false;
  if (currentUser.id === 'bootstrap-admin') {
    isValid = Boolean(env.INITIAL_ADMIN_PASSWORD && password === env.INITIAL_ADMIN_PASSWORD);
  } else {
    const actor = await prisma.userAccount.findUnique({
      where: { id: currentUser.id }
    });
    if (actor) {
      isValid = await verifyPassword(password, actor.passwordHash);
    }
  }

  if (!isValid) {
    response.status(400).json({ message: 'La contraseña ingresada es incorrecta.' });
    return;
  }

  try {
    const targetUser = await prisma.userAccount.findUnique({
      where: { id: request.params.id }
    });

    await deleteUser(request.params.id);

    if (targetUser) {
      const actor = response.locals.user;
      const actorRole = getSpanishRole(actor?.roles, actor?.isSuperAdmin);
      const detail = `El ${actorRole.toLowerCase()} ${actor?.displayName || 'Desconocido'} ha eliminado el Usuario ${targetUser.displayName}`;
      await logAuditEvent({
        actorId: actor?.id ?? null,
        action: 'Eliminar usuario',
        entityType: 'USER',
        entityId: request.params.id,
        metadata: {
          detail,
          actorName: actor?.displayName || 'Desconocido',
          actorRole,
          targetName: targetUser.displayName,
          targetEmail: targetUser.email
        }
      });
    }

    response.json({ ok: true });
  } catch {
    response.status(404).json({ message: 'No se encontro el usuario.' });
  }
});
