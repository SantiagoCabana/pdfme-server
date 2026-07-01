import { redirect } from 'next/navigation';

import { env } from '@/lib/env';
import { prisma } from '@/lib/prisma';

import { getSession, type SessionPayload } from '../session';
import { verifyPassword } from './password';

function unique(values: string[]) {
  return Array.from(new Set(values));
}

export async function authenticateInternalUser(email: string, password: string): Promise<SessionPayload | null> {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedPassword = String(password ?? '');

  if (!normalizedEmail || !normalizedPassword) {
    return null;
  }

  if (
    normalizedEmail === env.ADMIN_EMAIL.toLowerCase() &&
    normalizedPassword === env.ADMIN_PASSWORD
  ) {
    return {
      userId: 'bootstrap-admin',
      email: env.ADMIN_EMAIL,
      displayName: 'Bootstrap Admin',
      roles: ['SUPER_ADMIN'],
      permissions: ['*'],
      isSuperAdmin: true,
    };
  }

  try {
    const user = await prisma.userAccount.findUnique({
      where: { email: normalizedEmail },
      include: {
        roles: {
          include: {
            accessRole: {
              include: {
                permissions: {
                  include: {
                    accessPermission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user || user.status !== 'ACTIVE') {
      return null;
    }

    const isValid = await verifyPassword(normalizedPassword, user.passwordHash);

    if (!isValid) {
      return null;
    }

    const roles = unique(user.roles.map((entry) => entry.accessRole.code));
    const permissions = unique(
      user.roles.flatMap((entry) =>
        entry.accessRole.permissions.map((permission) => permission.accessPermission.code),
      ),
    );

    return {
      userId: user.id,
      email: user.email,
      displayName: user.displayName,
      roles,
      permissions: user.isSuperAdmin ? ['*', ...permissions] : permissions,
      isSuperAdmin: user.isSuperAdmin,
    };
  } catch {
    return null;
  }
}

export async function requireInternalSession() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  return session;
}

export function hasInternalPermission(session: SessionPayload, permission: string) {
  return session.isSuperAdmin || session.permissions.includes('*') || session.permissions.includes(permission);
}
