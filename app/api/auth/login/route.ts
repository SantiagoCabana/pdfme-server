import { NextResponse } from 'next/server';

import { authenticateInternalUser } from '@/features/auth/server/auth.service';
import { AUTH_COOKIE_NAME, createSessionToken, sessionCookieOptions } from '@/features/auth/session';

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { email?: string; password?: string } | null;

  if (!body?.email || !body.password) {
    return NextResponse.json({ message: 'Correo y contrasena son obligatorios.' }, { status: 400 });
  }

  const session = await authenticateInternalUser(body.email, body.password);

  if (!session) {
    return NextResponse.json({ message: 'Credenciales invalidas.' }, { status: 401 });
  }

  const token = await createSessionToken(session);
  const response = NextResponse.json({ ok: true, user: { email: session.email, displayName: session.displayName } });

  response.cookies.set(AUTH_COOKIE_NAME, token, sessionCookieOptions);

  return response;
}
