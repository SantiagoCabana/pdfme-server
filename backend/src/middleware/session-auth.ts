import type { NextFunction, Request, Response } from 'express';

import { hasPermission, type SessionUser } from '../auth/auth.service.js';

export function getSessionUser(request: Request) {
  return (request.session as { user?: SessionUser } | undefined)?.user;
}

export function requireSession(request: Request, response: Response, next: NextFunction) {
  if (!getSessionUser(request)) {
    response.status(401).json({ message: 'No autenticado.' });
    return;
  }

  next();
}

export function requirePermission(permission: string) {
  return (request: Request, response: Response, next: NextFunction) => {
    const user = getSessionUser(request);

    if (!user) {
      response.status(401).json({ message: 'No autenticado.' });
      return;
    }

    if (!hasPermission(user, permission)) {
      response.status(403).json({ message: 'No tienes permisos para esta accion.' });
      return;
    }

    next();
  };
}
