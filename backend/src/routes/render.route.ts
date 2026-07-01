import { Router } from 'express';

import { authenticateApiKey } from '../services/api-credentials.service.js';

export const renderRouter = Router();

renderRouter.post('/v1/render', async (request, response) => {
  const credential = await authenticateApiKey(String(request.header('x-api-key') ?? ''), {
    origin: request.header('origin'),
    ip: request.ip,
  });

  if (!credential) {
    response.status(401).json({ message: 'API key invalida.' });
    return;
  }

  response.status(501).json({
    ok: false,
    message: 'Render reservado. Falta conectar pdfme generator al TemplateVersion actual.',
    received: request.body,
  });
});
