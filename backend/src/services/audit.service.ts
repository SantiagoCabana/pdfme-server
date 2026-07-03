import { prisma } from '../prisma.js';

export interface LogAuditInput {
  actorId?: string | null;
  apiCredentialId?: string | null;
  action: string;
  entityType: 'USER' | 'TEMPLATE' | 'API_KEY';
  entityId?: string | null;
  metadata?: any;
}

export function getSpanishRole(roles: string[] | undefined, isSuperAdmin?: boolean) {
  if (isSuperAdmin) return 'Superadministrador';
  if (!roles || roles.length === 0) return 'Usuario';
  const role = roles[0].toUpperCase();
  if (role === 'ADMIN') return 'Administrador';
  if (role === 'MANAGER') return 'Manager';
  if (role === 'EDITOR') return 'Editor';
  if (role === 'VIEWER') return 'Lector';
  return role;
}

export async function logAuditEvent(input: LogAuditInput) {
  try {
    return await prisma.auditEvent.create({
      data: {
        actorId: input.actorId ?? null,
        apiCredentialId: input.apiCredentialId ?? null,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId ?? null,
        metadata: input.metadata ?? {},
      },
    });
  } catch (error) {
    console.error('Failed to log audit event:', error);
  }
}

export async function listAuditEvents() {
  const events = await prisma.auditEvent.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      actor: {
        include: {
          roles: {
            include: {
              accessRole: true,
            },
          },
        },
      },
    },
  });

  return events.map((event) => {
    let actorName = event.actor?.displayName || (event.metadata as any)?.actorName || 'Sistema';
    let actorRole = 'Usuario';

    if (event.actor) {
      if (event.actor.isSuperAdmin) {
        actorRole = 'Superadministrador';
      } else {
        const roleCode = event.actor.roles[0]?.accessRole.code;
        if (roleCode === 'ADMIN') actorRole = 'Administrador';
        else if (roleCode === 'MANAGER') actorRole = 'Manager';
        else if (roleCode === 'EDITOR') actorRole = 'Editor';
        else if (roleCode === 'VIEWER') actorRole = 'Lector';
      }
    } else if ((event.metadata as any)?.actorRole) {
      actorRole = (event.metadata as any).actorRole;
    }

    return {
      id: event.id,
      action: event.action,
      entityType: event.entityType,
      entityId: event.entityId,
      actorId: event.actorId,
      actorName,
      actorRole,
      createdAt: event.createdAt.toISOString(),
      metadata: event.metadata,
    };
  });
}
