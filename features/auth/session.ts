import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import { cookies } from 'next/headers';

export const AUTH_COOKIE_NAME = process.env.AUTH_COOKIE_NAME ?? 'company_session';
const AUTH_SECRET = process.env.AUTH_SECRET ?? 'company-next-auth-secret-2026';
const SESSION_MAX_AGE = 60 * 60 * 12;
const sessionSecret = new TextEncoder().encode(AUTH_SECRET);

export type SessionPayload = JWTPayload & {
  userId: string;
  email: string;
  displayName: string;
  roles: string[];
  permissions: string[];
  isSuperAdmin: boolean;
};

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: SESSION_MAX_AGE,
};

export async function createSessionToken(payload: Omit<SessionPayload, 'iat' | 'exp'>) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(sessionSecret);
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, sessionSecret);
    return payload as SessionPayload;
  } catch {
    return null;
  }
}

export async function getSession() {
  const store = await cookies();
  const token = store.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  return verifySessionToken(token);
}
