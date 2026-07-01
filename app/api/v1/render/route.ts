import { NextResponse } from 'next/server';

import {
  authenticateApiCredential,
  hasApiPermission,
} from '@/features/api-credentials/server/api-credentials.service';

export async function POST(request: Request) {
  const apiKey = request.headers.get('x-api-key') ?? '';
  const credential = await authenticateApiCredential(apiKey);

  if (!credential) {
    return NextResponse.json({ message: 'API key invalida.' }, { status: 401 });
  }

  if (!hasApiPermission(credential, 'documents.generate')) {
    return NextResponse.json({ message: 'La clave no tiene acceso a generacion de documentos.' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);

  return NextResponse.json(
    {
      ok: false,
      message: 'El endpoint de render ya esta reservado en la arquitectura, pero falta conectar pdfme al flujo real.',
      received: body,
      credentialPrefix: credential.prefix,
    },
    { status: 501 },
  );
}
