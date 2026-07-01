import { env } from '../env.js';
import { prisma } from '../prisma.js';
import { verifyPassword } from './password.js';

export type AdminSessionUser = {
  email: string;
  title: string;
  id: string;
  roles: string[];
  permissions: string[];
  isSuperAdmin: boolean;
};

function unique(values: string[]) {
  return Array.from(new Set(values));
}

export function hasPermission(currentAdmin: Partial<AdminSessionUser> | undefined, permission: string) {
  const permissions = Array.isArray(currentAdmin?.permissions) ? currentAdmin.permissions : [];

  return Boolean(
    currentAdmin?.id === 'bootstrap-admin' ||
    currentAdmin?.isSuperAdmin ||
    permissions.includes('*') ||
    permissions.includes(permission),
  );
}

export async function authenticateAdmin(email: string, password: string): Promise<AdminSessionUser | null> {
  const normalizedEmail = email.trim().toLowerCase();

  if (normalizedEmail === env.ADMIN_EMAIL.toLowerCase() && password === env.ADMIN_PASSWORD) {
    return {
      id: 'bootstrap-admin',
      email: env.ADMIN_EMAIL,
      title: 'Bootstrap Admin',
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
    title: user.displayName,
    roles,
    permissions: user.isSuperAdmin ? ['*', ...permissions] : permissions,
    isSuperAdmin: user.isSuperAdmin,
  };
}
