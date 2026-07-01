import { Router } from 'express';

import { authenticateApiKey, hasApiPermission } from '../services/api-credentials.service.js';

export const renderRouter = Router();

renderRouter.post('/v1/render', async (request, response) => {
  const credential = await authenticateApiKey(String(request.header('x-api-key') ?? ''));

  if (!credential) {
    response.status(401).json({ message: 'API key invalida.' });
    return;
  }

  if (!hasApiPermission(credential, 'documents.generate')) {
    response.status(403).json({ message: 'La clave no tiene permiso para generar documentos.' });
    return;
  }

  response.status(501).json({
    ok: false,
    message: 'Render reservado. Falta conectar pdfme generator al TemplateVersion actual.',
    received: request.body,
  });
});
