import crypto from 'node:crypto';

import { prisma } from '@/lib/prisma';

export type PermissionOption = {
  code: string;
  name: string;
  category: string;
};

export type ApiCredentialItem = {
  id: string;
  name: string;
  prefix: string;
  secretPreview: string;
  status: string;
  permissionCodes: string[];
  createdAt: string;
  expiresAt: string | null;
  lastUsedAt: string | null;
};

function hashApiCredential(rawKey: string) {
  return crypto.createHash('sha256').update(rawKey).digest('hex');
}

function buildApiCredentialSecret() {
  const prefix = `cmp${crypto.randomBytes(4).toString('hex')}`;
  const secret = crypto.randomBytes(24).toString('hex');
  const rawKey = `${prefix}.${secret}`;

  return {
    rawKey,
    prefix,
    secretPreview: `${secret.slice(0, 4)}...${secret.slice(-4)}`,
    keyHash: hashApiCredential(rawKey),
  };
}

export async function getApiCredentialOverview() {
  try {
    const [credentials, permissions] = await Promise.all([
      prisma.apiCredential.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          permissions: {
            include: {
              accessPermission: true,
            },
          },
        },
      }),
      prisma.accessPermission.findMany({ orderBy: [{ category: 'asc' }, { code: 'asc' }] }),
    ]);

    return {
      fallback: false,
      credentials: credentials.map<ApiCredentialItem>((credential) => ({
        id: credential.id,
        name: credential.name,
        prefix: credential.prefix,
        secretPreview: credential.secretPreview,
        status: credential.status,
        permissionCodes: credential.permissions.map((entry) => entry.accessPermission.code),
        createdAt: credential.createdAt.toISOString(),
        expiresAt: credential.expiresAt?.toISOString() ?? null,
        lastUsedAt: credential.lastUsedAt?.toISOString() ?? null,
      })),
      permissions: permissions.map<PermissionOption>((permission) => ({
        code: permission.code,
        name: permission.name,
        category: permission.category,
      })),
    };
  } catch {
    return {
      fallback: true,
      credentials: [],
      permissions: [
        { code: 'templates.read', name: 'Plantillas lectura', category: 'templates' },
        { code: 'documents.generate', name: 'Documentos generar', category: 'documents' },
      ],
    };
  }
}

export async function createApiCredential(input: {
  name: string;
  permissionCodes?: string[];
  createdById?: string;
  expiresAt?: string | null;
}) {
  const blueprint = buildApiCredentialSecret();
  const permissions = await prisma.accessPermission.findMany({
    where: {
      code: {
        in: input.permissionCodes ?? ['templates.read', 'templates.write', 'templates.publish', 'documents.generate'],
      },
    },
    select: { id: true },
  });

  const credential = await prisma.apiCredential.create({
    data: {
      name: input.name,
      prefix: blueprint.prefix,
      secretPreview: blueprint.secretPreview,
      keyHash: blueprint.keyHash,
      createdById: input.createdById,
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
      permissions: {
        create: permissions.map((permission) => ({
          accessPermissionId: permission.id,
        })),
      },
    },
    include: {
      permissions: {
        include: {
          accessPermission: true,
        },
      },
    },
  });

  return {
    rawKey: blueprint.rawKey,
    credential: {
      id: credential.id,
      name: credential.name,
      prefix: credential.prefix,
      secretPreview: credential.secretPreview,
      status: credential.status,
      permissionCodes: credential.permissions.map((entry) => entry.accessPermission.code),
      createdAt: credential.createdAt.toISOString(),
      expiresAt: credential.expiresAt?.toISOString() ?? null,
      lastUsedAt: credential.lastUsedAt?.toISOString() ?? null,
    } satisfies ApiCredentialItem,
  };
}

export async function authenticateApiCredential(rawKey: string) {
  const separatorIndex = rawKey.indexOf('.');

  if (separatorIndex < 1) {
    return null;
  }

  const prefix = rawKey.slice(0, separatorIndex);

  try {
    const credential = await prisma.apiCredential.findUnique({
      where: { prefix },
      include: {
        permissions: {
          include: {
            accessPermission: true,
          },
        },
      },
    });

    if (!credential || credential.status !== 'ACTIVE') {
      return null;
    }

    if (credential.expiresAt && credential.expiresAt.getTime() < Date.now()) {
      return null;
    }

    if (credential.keyHash !== hashApiCredential(rawKey)) {
      return null;
    }

    await prisma.apiCredential
      .update({
        where: { id: credential.id },
        data: { lastUsedAt: new Date() },
      })
      .catch(() => undefined);

    return {
      id: credential.id,
      prefix: credential.prefix,
      permissionCodes: credential.permissions.map((entry) => entry.accessPermission.code),
    };
  } catch {
    return null;
  }
}

export function hasApiPermission(
  credential: { permissionCodes: string[] } | null,
  requiredPermission: string,
) {
  if (!credential) {
    return false;
  }

  return credential.permissionCodes.includes(requiredPermission) || credential.permissionCodes.includes('*');
}
