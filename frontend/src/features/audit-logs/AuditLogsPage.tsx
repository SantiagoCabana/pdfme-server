import { useEffect, useState } from 'react';
import { EyeOutlined } from '@ant-design/icons';
import {
  Alert,
  Box,
  Card,
  CircularProgress,
  Dialog,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';

import { apiRequest } from '../../shared/api/client';
import { useAppContext } from '../../app/AppContext';
import '../../styles/audit-logs.css';

interface AuditEventItem {
  id: string;
  action: string;
  entityType: 'USER' | 'TEMPLATE' | 'API_KEY';
  entityId: string | null;
  actorId: string | null;
  actorName: string;
  actorRole: string;
  createdAt: string;
  metadata: {
    detail?: string;
    actorName?: string;
    actorRole?: string;
    targetName?: string;
    targetEmail?: string;
    targetRole?: string;
    templateName?: string;
    templateCode?: string;
    credentialName?: string;
    credentialPrefix?: string;
    versionNumber?: number;
    expiresAt?: string | null;
    changes?: Record<string, any>;
  };
}

function cleanActivityText(text: string): string {
  return text
    .replace(/\s*\(Versión\s+\d+\)/gi, '')
    .replace(/\s*a la Versión\s+\d+/gi, '');
}

export function AuditLogsPage() {
  const { mode } = useAppContext();
  const [events, setEvents] = useState<AuditEventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<AuditEventItem | null>(null);

  async function loadLogs() {
    setLoading(true);
    setError('');
    try {
      const payload = await apiRequest<{ data: AuditEventItem[] }>('/api/audit-logs');
      setEvents(payload.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar los registros de auditoría.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadLogs();
  }, []);

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const formatDateOnly = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const getBadgeClass = (role: string) => {
    const r = role.toLowerCase().trim();
    if (r === 'superadministrador') return 'audit-badge-superadmin';
    if (r === 'administrador') return 'audit-badge-administrador';
    if (r === 'manager') return 'audit-badge-manager';
    if (r === 'editor') return 'audit-badge-editor';
    if (r === 'lector') return 'audit-badge-lector';
    return 'audit-badge-default';
  };

  const renderChanges = (changes: any) => {
    if (!changes || typeof changes !== 'object' || Object.keys(changes).length === 0) return null;

    return (
      <Box className="audit-changes-box">
        <Typography className="audit-changes-title">Detalles del cambio</Typography>
        <div className="audit-change-list">
          {Object.entries(changes).map(([field, value]: [string, any]) => {
            if (field === 'password') {
              return (
                <div key={field} className="audit-change-item">
                  <span className="audit-change-field">Contraseña</span>
                  <div className="audit-diff-container">
                    <span className="audit-diff-new">Actualizada (Nueva contraseña establecida)</span>
                  </div>
                </div>
              );
            }

            if (value && typeof value === 'object' && 'old' in value && 'new' in value) {
              return (
                <div key={field} className="audit-change-item">
                  <span className="audit-change-field">
                    {field === 'displayName'
                      ? 'Nombre completo'
                      : field === 'roleCode'
                      ? 'Rol de acceso'
                      : field === 'status'
                      ? 'Estado de cuenta'
                      : field}
                  </span>
                  <div className="audit-diff-container">
                    <span className="audit-diff-old">{String(value.old || '(vacío)')}</span>
                    <span className="audit-diff-arrow">→</span>
                    <span className="audit-diff-new">{String(value.new || '(vacío)')}</span>
                  </div>
                </div>
              );
            }

            return (
              <div key={field} className="audit-change-item">
                <span className="audit-change-field">{field}</span>
                <div className="audit-diff-container">
                  <span className="audit-diff-new">{String(value)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </Box>
    );
  };

  return (
    <Stack spacing={2} sx={{ flexGrow: 1, minHeight: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
      {error ? <Alert severity="error">{error}</Alert> : null}
      <Card sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <TableContainer sx={{ flexGrow: 1, overflowY: 'auto' }} className="audit-table-container">
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', width: 140 }}>FECHA</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>ACTIVIDAD</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', width: 100, textAlign: 'center' }}>ACCIONES</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell align="center" colSpan={3} sx={{ py: 6 }}>
                    <CircularProgress size={24} />
                  </TableCell>
                </TableRow>
              ) : null}
              {!loading && events.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} sx={{ py: 6, textAlign: 'center' }}>
                    No hay registros de auditoría disponibles.
                  </TableCell>
                </TableRow>
              ) : null}
              {!loading
                ? events.map((event) => (
                    <TableRow key={event.id} hover>
                      <TableCell sx={{ py: 2, fontSize: '0.8125rem' }}>{formatDateOnly(event.createdAt)}</TableCell>
                      <TableCell sx={{ py: 2, fontSize: '0.8125rem' }}>
                        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                          <span>{cleanActivityText(event.metadata?.detail || event.action)}</span>
                          {event.entityType === 'TEMPLATE' && event.metadata?.versionNumber && (
                            <span className="audit-table-version-badge">
                              v{event.metadata.versionNumber}
                            </span>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell sx={{ py: 2, textAlign: 'center' }}>
                        <button
                          className="audit-detail-btn"
                          title="Ver detalles"
                          onClick={() => setSelectedEvent(event)}
                        >
                          <EyeOutlined />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))
                : null}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog
        open={Boolean(selectedEvent)}
        onClose={() => setSelectedEvent(null)}
        sx={{
          '& .MuiDialog-paper': {
            width: '100%',
            maxWidth: 520,
            borderRadius: '12px',
            p: 3.5,
          },
        }}
      >
        {selectedEvent && (
          <Stack spacing={3}>
            <Box className="audit-modal-header">
              <Typography className="audit-modal-title">Detalle de Actividad</Typography>
            </Box>

            <Box className="audit-detail-grid">
              <div className="audit-detail-label">Actividad</div>
              <div className="audit-detail-value audit-detail-value-bold">
                {cleanActivityText(selectedEvent.metadata?.detail || selectedEvent.action)}
              </div>

              <div className="audit-detail-label">Usuario</div>
              <div className="audit-detail-value">{selectedEvent.actorName}</div>

              <div className="audit-detail-label">Rol</div>
              <div className="audit-detail-value">
                <span className={`audit-badge ${getBadgeClass(selectedEvent.actorRole)}`}>
                  {selectedEvent.actorRole}
                </span>
              </div>

              <div className="audit-detail-label">Fecha y Hora</div>
              <div className="audit-detail-value">{formatDate(selectedEvent.createdAt)}</div>

              {selectedEvent.entityType && (
                <>
                  <div className="audit-detail-label">Módulo</div>
                  <div className="audit-detail-value audit-detail-value-capitalize">
                    {selectedEvent.entityType === 'TEMPLATE'
                      ? 'Plantilla'
                      : selectedEvent.entityType === 'API_KEY'
                      ? 'Clave API'
                      : 'Usuario'}
                  </div>
                </>
              )}

              {selectedEvent.entityType === 'TEMPLATE' && selectedEvent.metadata?.versionNumber && (
                <>
                  <div className="audit-detail-label">Versión</div>
                  <div className="audit-detail-value audit-detail-value-bold">
                    v{selectedEvent.metadata.versionNumber}
                  </div>
                </>
              )}

              {selectedEvent.entityType === 'API_KEY' && (
                <>
                  <div className="audit-detail-label">Expiración</div>
                  <div className="audit-detail-value audit-detail-value-bold">
                    {selectedEvent.metadata?.expiresAt
                      ? new Date(selectedEvent.metadata.expiresAt).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })
                      : 'Nunca expira'}
                  </div>
                </>
              )}
            </Box>

            {renderChanges(selectedEvent.metadata?.changes)}

            <Box className="audit-modal-footer">
              <button
                onClick={() => setSelectedEvent(null)}
                className="audit-modal-close-btn"
              >
                Cerrar
              </button>
            </Box>
          </Stack>
        )}
      </Dialog>
    </Stack>
  );
}
