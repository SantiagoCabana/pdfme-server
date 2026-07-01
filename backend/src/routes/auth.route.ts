import { Router } from 'express';
import { z } from 'zod';

import { authenticateUser } from '../auth/auth.service.js';
import { clearAuthCookie, setAuthCookie } from '../auth/session-token.js';
import { getSessionUser } from '../middleware/session-auth.js';

export const authRouter = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

authRouter.get('/auth/me', async (request, response) => {
  const user = await getSessionUser(request);

  if (!user) {
    response.status(401).json({ message: 'No autenticado.' });
    return;
  }

  response.json({ user });
});

authRouter.post('/auth/login', async (request, response) => {
  const parsed = loginSchema.safeParse(request.body);

  if (!parsed.success) {
    response.status(400).json({ message: 'Correo y contrasena son obligatorios.' });
    return;
  }

  const user = await authenticateUser(parsed.data.email, parsed.data.password);

  if (!user) {
    response.status(401).json({ message: 'Credenciales invalidas.' });
    return;
  }

  setAuthCookie(response, user);
  response.json({ ok: true, user });
});

authRouter.post('/auth/logout', (_request, response) => {
  clearAuthCookie(response);
  response.json({ ok: true });
});
