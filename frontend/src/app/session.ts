import type { SessionUser } from './types';

export function can(user: SessionUser | null, permission: string) {
  return Boolean(user?.permissions.includes('*') || user?.permissions.includes(permission));
}

export function formatDate(value: string | null) {
  if (!value) return 'Nunca';
  return new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

export function statusLabel(value: string) {
  if (value === 'ACTIVE') return 'Activa';
  if (value === 'DRAFT') return 'Borrador';
  if (value === 'REVOKED') return 'Revocada';
  if (value === 'SUSPENDED') return 'Suspendido';
  return value;
}

export function buildExpiryDate(mode: string) {
  if (mode === 'never') return null;
  const date = new Date();
  date.setDate(date.getDate() + Number(mode));
  return date.toISOString();
}
