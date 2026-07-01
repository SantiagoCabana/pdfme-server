import { NextResponse } from 'next/server';
import { z } from 'zod';

import { hasInternalPermission } from '@/features/auth/server/auth.service';
import { getSession } from '@/features/auth/session';
import {
  createApiCredential,
  getApiCredentialOverview,
} from '@/features/api-credentials/server/api-credentials.service';

const createCredentialSchema = z.object({
  name: z.string().min(3),
  expiresAt: z.string().datetime().nullish(),
});

export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ message: 'No autenticado.' }, { status: 401 });
  }

  if (!hasInternalPermission(session, 'api-credentials.read')) {
    return NextResponse.json({ message: 'No tienes permisos para ver claves de acceso.' }, { status: 403 });
  }

  return NextResponse.json(await getApiCredentialOverview());
}

export async function POST(request: Request) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ message: 'No autenticado.' }, { status: 401 });
  }

  if (!hasInternalPermission(session, 'api-credentials.write')) {
    return NextResponse.json({ message: 'No tienes permisos para crear claves de acceso.' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createCredentialSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ message: 'Datos invalidos para crear la clave.' }, { status: 400 });
  }

  try {
    const result = await createApiCredential({
      name: parsed.data.name,
      createdById: session.userId === 'bootstrap-admin' ? undefined : session.userId,
      expiresAt: parsed.data.expiresAt ?? null,
    });

    return NextResponse.json({ ok: true, credential: result.credential, rawKey: result.rawKey });
  } catch {
    return NextResponse.json(
      { message: 'No se pudo crear la clave. Verifica la conexion de datos.' },
      { status: 503 },
    );
  }
}
