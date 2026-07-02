import crypto from 'node:crypto';
import type { Response } from 'express';

import { env } from '../env.js';
import type { SessionUser } from './auth.service.js';

type TokenPayload = SessionUser & {
  tokenVersion: number;
  exp: number;
};

function encode(value: unknown) {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

function decode<T>(value: string): T {
  return JSON.parse(Buffer.from(value, 'base64url').toString('utf8')) as T;
}

function sign(data: string) {
  return crypto.createHmac('sha256', env.AUTH_SECRET).update(data).digest('base64url');
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

export function createAuthToken(user: SessionUser) {
  const payload: TokenPayload = {
    ...user,
    exp: Math.floor(Date.now() / 1000) + env.AUTH_COOKIE_MAX_AGE_SECONDS,
  };
  const data = encode(payload);
  const signature = sign(data);

  return `${data}.${signature}`;
}

export function verifyAuthToken(token: string): TokenPayload | null {
  const [data, signature] = token.split('.');

  if (!data || !signature || !safeEqual(sign(data), signature)) {
    return null;
  }

  try {
    const payload = decode<TokenPayload>(data);

    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export function setAuthCookie(response: Response, user: SessionUser) {
  response.cookie(env.AUTH_COOKIE_NAME, createAuthToken(user), {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: env.AUTH_COOKIE_MAX_AGE_SECONDS * 1000,
  });
}

export function clearAuthCookie(response: Response) {
  response.clearCookie(env.AUTH_COOKIE_NAME, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });
}
