import { env } from '../env.js';
import { prisma } from '../prisma.js';
import { verifyPassword } from './password.js';

export type SessionUser = {
  id: string;
  email: string;
  displayName: string;
  roles: string[];
  permissions: string[];
  isSuperAdmin: boolean;
};

function unique(values: string[]) {
  return Array.from(new Set(values));
}

export function hasPermission(user: Partial<SessionUser> | undefined, permission: string) {
  const permissions = Array.isArray(user?.permissions) ? user.permissions : [];

  return Boolean(
    user?.id === 'bootstrap-admin' ||
    user?.isSuperAdmin ||
    permissions.includes('*') ||
    permissions.includes(permission),
  );
}

export async function authenticateUser(email: string, password: string): Promise<SessionUser | null> {
  const normalizedEmail = email.trim().toLowerCase();

  if (normalizedEmail === env.ADMIN_EMAIL.toLowerCase() && password === env.ADMIN_PASSWORD) {
    return {
      id: 'bootstrap-admin',
      email: env.ADMIN_EMAIL,
      displayName: 'Bootstrap Admin',
      roles: ['SUPER_ADMIN'],
      permissions: ['*'],
      isSuperAdmin: true,
    };
  }

  const user = await prisma.userAccount.findUnique({
    where: { email: normalizedEmail },
    include: {
      roles: {
        include: {
          accessRole: {
            include: {
              permissions: {
                include: { accessPermission: true },
              },
            },
          },
        },
      },
    },
  }).catch(() => null);

  if (!user || user.status !== 'ACTIVE') {
    return null;
  }

  const valid = await verifyPassword(password, user.passwordHash);

  if (!valid) {
    return null;
  }

  const roles = unique(user.roles.map((entry) => entry.accessRole.code));
  const permissions = unique(user.roles.flatMap((entry) => entry.accessRole.permissions.map((permission) => permission.accessPermission.code)));

  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    roles,
    permissions: user.isSuperAdmin ? ['*', ...permissions] : permissions,
    isSuperAdmin: user.isSuperAdmin,
  };
}
