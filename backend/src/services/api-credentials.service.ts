import crypto from 'node:crypto';

import { env } from '../env.js';
import { prisma } from '../prisma.js';

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
  allowedOrigins: unknown;
  expiresAt: Date | null;
  lastUsedAt: Date | null;
  lastUsedIp: string | null;
  createdById: string | null;
  revokedById: string | null;
  revokedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: credential.id,
    name: credential.name,
    prefix: credential.prefix,
    secretPreview: credential.secretPreview,
    status: credential.status,
    allowedOrigins: credential.allowedOrigins,
    expiresAt: credential.expiresAt?.toISOString() ?? null,
    lastUsedAt: credential.lastUsedAt?.toISOString() ?? null,
    lastUsedIp: credential.lastUsedIp,
    createdById: credential.createdById,
    revokedById: credential.revokedById,
    revokedAt: credential.revokedAt?.toISOString() ?? null,
    createdAt: credential.createdAt.toISOString(),
    updatedAt: credential.updatedAt.toISOString(),
  };
}

export async function listApiCredentials() {
  const credentials = await prisma.apiCredential.findMany({ orderBy: { createdAt: 'desc' } });
  return credentials.map(toApiCredentialResponse);
}

export async function createApiCredential(input: {
  name: string;
  expiresAt?: Date | null;
  createdById?: string | null;
  allowedOrigins?: string[] | null;
}) {
  const key = createRawApiKey();
  const credential = await prisma.apiCredential.create({
    data: {
      name: input.name,
      prefix: key.prefix,
      secretPreview: key.secretPreview,
      keyHash: key.keyHash,
      expiresAt: input.expiresAt ?? null,
      createdById: input.createdById ?? null,
      allowedOrigins: input.allowedOrigins ?? undefined,
    },
  });

  return { rawKey: key.rawKey, credential: toApiCredentialResponse(credential) };
}

export async function revokeApiCredential(id: string, revokedById?: string | null) {
  const credential = await prisma.apiCredential.update({
    where: { id },
    data: {
      status: 'REVOKED',
      revokedAt: new Date(),
      revokedById: revokedById === 'bootstrap-admin' ? null : revokedById ?? null,
    },
  });

  return toApiCredentialResponse(credential);
}

export async function authenticateApiKey(rawKey: string, requestMeta?: { origin?: string | null; ip?: string | null }) {
  const prefix = rawKey.split('.')[0];

  if (!prefix) {
    return null;
  }

  const credential = await prisma.apiCredential.findUnique({ where: { prefix } });

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

  const allowedOrigins = Array.isArray(credential.allowedOrigins) ? credential.allowedOrigins as string[] : [];
  const origin = requestMeta?.origin ?? null;

  if (allowedOrigins.length > 0 && (!origin || !allowedOrigins.includes(origin))) {
    return null;
  }

  await prisma.apiCredential.update({
    where: { id: credential.id },
    data: { lastUsedAt: new Date(), lastUsedIp: requestMeta?.ip ?? null },
  }).catch(() => undefined);

  return { id: credential.id, prefix: credential.prefix };
}
