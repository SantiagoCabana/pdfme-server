import { Router } from 'express';
import { z } from 'zod';

import { requirePermission } from '../middleware/session-auth.js';
import { createUser, listRoles, listUsers, updateUser } from '../services/users.service.js';

export const usersRouter = Router();

const createUserSchema = z.object({
  email: z.string().email(),
  displayName: z.string().min(2),
  password: z.string().min(8),
  roleCode: z.enum(['VIEWER', 'EDITOR', 'MANAGER', 'ADMIN']),
});

const updateUserSchema = z.object({
  displayName: z.string().min(2).optional(),
  status: z.enum(['ACTIVE', 'INVITED', 'SUSPENDED']).optional(),
  roleCode: z.enum(['VIEWER', 'EDITOR', 'MANAGER', 'ADMIN']).optional(),
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
    const user = await updateUser({ id: request.params.id, ...parsed.data });
    response.json({ ok: true, user });
  } catch {
    response.status(404).json({ message: 'No se encontro el usuario.' });
  }
});
