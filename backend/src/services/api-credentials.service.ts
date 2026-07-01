import crypto from 'node:crypto';

import { env } from '../env.js';
import { prisma } from '../prisma.js';

const DEFAULT_API_PERMISSION_CODES = [
  'templates.read',
  'templates.write',
  'templates.publish',
  'documents.generate',
];

function hashApiKey(rawKey: string) {
  return crypto.createHmac('sha256', env.API_KEY_SECRET).update(rawKey).digest('hex');
}

export function createRawApiKey() {
  const prefix = `pms_${crypto.randomBytes(4).toString('hex')}`;
  const secret = crypto.randomBytes(28).toString('hex');
  const rawKey = `${prefix}.${secret}`;

  return {
    rawKey,
    prefix,
    secretPreview: `${secret.slice(0, 4)}...${secret.slice(-4)}`,
    keyHash: hashApiKey(rawKey),
  };
}

function toApiCredentialResponse(credential: {
  id: string;
  name: string;
  prefix: string;
  secretPreview: string;
  status: string;
  allowedOrigin: unknown;
  expiresAt: Date | null;
  lastUsedAt: Date | null;
  createdById: string | null;
  createdAt: Date;
  updatedAt: Date;
  permissions?: Array<{ accessPermission: { code: string; name: string; category: string } }>;
}) {
  return {
    id: credential.id,
    name: credential.name,
    prefix: credential.prefix,
    secretPreview: credential.secretPreview,
    status: credential.status,
    allowedOrigin: credential.allowedOrigin,
    expiresAt: credential.expiresAt?.toISOString() ?? null,
    lastUsedAt: credential.lastUsedAt?.toISOString() ?? null,
    createdById: credential.createdById,
    createdAt: credential.createdAt.toISOString(),
    updatedAt: credential.updatedAt.toISOString(),
    permissions: credential.permissions?.map((entry) => entry.accessPermission) ?? [],
  };
}

export async function listApiCredentials() {
  const credentials = await prisma.apiCredential.findMany({
    orderBy: { createdAt: 'desc' },
    include: { permissions: { include: { accessPermission: true } } },
  });

  return credentials.map(toApiCredentialResponse);
}

export async function createApiCredential(input: {
  name: string;
  expiresAt?: Date | null;
  createdById?: string | null;
  permissionCodes?: string[];
}) {
  const key = createRawApiKey();
  const permissionCodes = input.permissionCodes?.length ? input.permissionCodes : DEFAULT_API_PERMISSION_CODES;
  const permissions = await prisma.accessPermission.findMany({
    where: { code: { in: permissionCodes } },
    select: { id: true },
  });

  const credential = await prisma.apiCredential.create({
    data: {
      name: input.name,
      prefix: key.prefix,
      secretPreview: key.secretPreview,
      keyHash: key.keyHash,
      expiresAt: input.expiresAt ?? null,
      createdById: input.createdById ?? null,
      permissions: {
        create: permissions.map((permission) => ({ accessPermissionId: permission.id })),
      },
    },
    include: { permissions: { include: { accessPermission: true } } },
  });

  return { rawKey: key.rawKey, credential: toApiCredentialResponse(credential) };
}

export async function revokeApiCredential(id: string) {
  const credential = await prisma.apiCredential.update({
    where: { id },
    data: { status: 'REVOKED' },
    include: { permissions: { include: { accessPermission: true } } },
  });

  return toApiCredentialResponse(credential);
}

export async function authenticateApiKey(rawKey: string) {
  const prefix = rawKey.split('.')[0];

  if (!prefix) {
    return null;
  }

  const credential = await prisma.apiCredential.findUnique({
    where: { prefix },
    include: { permissions: { include: { accessPermission: true } } },
  });

  if (!credential || credential.status !== 'ACTIVE') {
    return null;
  }

  if (credential.expiresAt && credential.expiresAt.getTime() < Date.now()) {
    await prisma.apiCredential.update({ where: { id: credential.id }, data: { status: 'EXPIRED' } }).catch(() => undefined);
    return null;
  }

  if (credential.keyHash !== hashApiKey(rawKey)) {
    return null;
  }

  await prisma.apiCredential.update({ where: { id: credential.id }, data: { lastUsedAt: new Date() } }).catch(() => undefined);

  return {
    id: credential.id,
    prefix: credential.prefix,
    permissions: credential.permissions.map((entry) => entry.accessPermission.code),
  };
}

export function hasApiPermission(credential: { permissions: string[] } | null, permission: string) {
  return Boolean(credential?.permissions.includes(permission) || credential?.permissions.includes('*'));
}
