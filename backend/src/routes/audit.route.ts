import { Router } from 'express';
import { requirePermission } from '../middleware/session-auth.js';
import { listAuditEvents } from '../services/audit.service.js';

export const auditRouter = Router();

auditRouter.get('/audit-logs', requirePermission('audit.view'), async (_request, response) => {
  try {
    const data = await listAuditEvents();
    response.json({ data });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    response.status(500).json({ message: 'No se pudieron obtener los registros de auditoría.' });
  }
});
