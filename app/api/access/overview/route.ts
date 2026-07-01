import { NextResponse } from 'next/server';

import { getAccessOverview } from '@/features/access/server/access.service';
import { hasInternalPermission } from '@/features/auth/server/auth.service';
import { getSession } from '@/features/auth/session';

export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ message: 'No autenticado.' }, { status: 401 });
  }

  if (!hasInternalPermission(session, 'users.read') && !hasInternalPermission(session, 'roles.read')) {
    return NextResponse.json({ message: 'Sin permisos para consultar accesos.' }, { status: 403 });
  }

  return NextResponse.json(await getAccessOverview());
}
