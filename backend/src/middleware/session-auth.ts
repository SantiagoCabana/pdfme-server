import type { NextFunction, Request, Response } from 'express';

import { env } from '../env.js';
import { hasPermission, loadUserSession } from '../auth/auth.service.js';
import { verifyAuthToken } from '../auth/session-token.js';

function getCookie(request: Request, name: string) {
  const header = request.header('cookie');

  if (!header) {
    return null;
  }

  const cookies = header.split(';').map((cookie) => cookie.trim());
  const match = cookies.find((cookie) => cookie.startsWith(`${name}=`));

  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}

export async function getSessionUser(request: Request) {
  const token = getCookie(request, env.AUTH_COOKIE_NAME);

  if (!token) {
    return null;
  }

  const payload = verifyAuthToken(token);

  if (!payload) {
    return null;
  }

  if (payload.id === 'bootstrap-admin') {
    return payload;
  }

  const user = await loadUserSession(payload.id);

  if (!user || user.tokenVersion !== payload.tokenVersion) {
    return null;
  }

  return user;
}

export async function requireSession(request: Request, response: Response, next: NextFunction) {
  const user = await getSessionUser(request);

  if (!user) {
    response.status(401).json({ message: 'No autenticado.' });
    return;
  }

  response.locals.user = user;
  next();
}

export function requirePermission(permission: string) {
  return async (request: Request, response: Response, next: NextFunction) => {
    const user = await getSessionUser(request);

    if (!user) {
      response.status(401).json({ message: 'No autenticado.' });
      return;
    }

    if (!hasPermission(user, permission)) {
      response.status(403).json({ message: 'No tienes permisos para esta accion.' });
      return;
    }

    response.locals.user = user;
    next();
  };
}
