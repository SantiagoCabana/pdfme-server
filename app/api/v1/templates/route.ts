import { NextResponse } from 'next/server';

import {
  authenticateApiCredential,
  hasApiPermission,
} from '@/features/api-credentials/server/api-credentials.service';
import { listTemplatesForApi } from '@/features/templates/server/templates.service';

export async function GET(request: Request) {
  const apiKey = request.headers.get('x-api-key') ?? '';
  const credential = await authenticateApiCredential(apiKey);

  if (!credential) {
    return NextResponse.json({ message: 'API key invalida.' }, { status: 401 });
  }

  if (!hasApiPermission(credential, 'templates.read')) {
    return NextResponse.json({ message: 'La clave no tiene acceso a plantillas.' }, { status: 403 });
  }

  return NextResponse.json({
    data: await listTemplatesForApi(),
    meta: {
      credentialPrefix: credential.prefix,
    },
  });
}
