import type { NextFunction, Request, Response } from 'express';

import { hasPermission, type AdminSessionUser } from '../auth/admin-auth.js';

function getAdminUser(request: Request) {
  return (request.session as { adminUser?: AdminSessionUser } | undefined)?.adminUser;
}

export function requireAdminPermission(permission: string) {
  return (request: Request, response: Response, next: NextFunction) => {
    const adminUser = getAdminUser(request);

    if (!adminUser) {
      response.status(401).json({ message: 'No autenticado.' });
      return;
    }

    if (!hasPermission(adminUser, permission)) {
      response.status(403).json({ message: 'No tienes permisos para esta accion.' });
      return;
    }

    next();
  };
}
