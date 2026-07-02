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
  tokenVersion: number;
};

const SESSION_CACHE_TTL_MS = 30_000;
const sessionCache = new Map<string, { expiresAt: number; user: SessionUser | null }>();

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

function mapUserSession(user: Awaited<ReturnType<typeof findUserWithRoles>>): SessionUser | null {
  if (!user || user.status !== 'ACTIVE') {
    return null;
  }

  const roles = unique(user.roles.map((entry) => entry.accessRole.code));
  const permissions = unique(
    user.roles.flatMap((entry) => entry.accessRole.permissions.map((permission) => permission.accessPermission.code)),
  );

  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    roles,
    permissions: user.isSuperAdmin ? ['*', ...permissions] : permissions,
    isSuperAdmin: user.isSuperAdmin,
    tokenVersion: user.tokenVersion,
  };
}

function findUserWithRoles(emailOrId: string, by: 'email' | 'id' = 'email') {
  return prisma.userAccount.findUnique({
    where: by === 'email' ? { email: emailOrId } : { id: emailOrId },
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
}

export async function loadUserSession(userId: string) {
  const cached = sessionCache.get(userId);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.user;
  }

  const user = mapUserSession(await findUserWithRoles(userId, 'id'));

  sessionCache.set(userId, {
    expiresAt: Date.now() + SESSION_CACHE_TTL_MS,
    user,
  });

  return user;
}

export function invalidateSessionCache(userId: string) {
  sessionCache.delete(userId);
}

export async function authenticateUser(email: string, password: string): Promise<SessionUser | null> {
  const normalizedEmail = email.trim().toLowerCase();

  if (normalizedEmail === env.ADMIN_EMAIL.toLowerCase() && password === env.ADMIN_PASSWORD) {
    return {
      id: 'bootstrap-admin',
      email: env.ADMIN_EMAIL,
      displayName: 'Bootstrap Admin',
      roles: ['ADMIN'],
      permissions: ['*'],
      isSuperAdmin: true,
      tokenVersion: 0,
    };
  }

  const user = await findUserWithRoles(normalizedEmail);

  if (!user || user.status !== 'ACTIVE') {
    return null;
  }

  const valid = await verifyPassword(password, user.passwordHash);

  if (!valid) {
    return null;
  }

  await prisma.userAccount.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  }).catch(() => undefined);

  invalidateSessionCache(user.id);

  return mapUserSession(user);
}
