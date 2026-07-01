import { NextResponse } from 'next/server';
import { z } from 'zod';

import { hasInternalPermission } from '@/features/auth/server/auth.service';
import { getSession } from '@/features/auth/session';
import { updateUserAccess } from '@/features/access/server/access.service';

const updateUserAccessSchema = z.object({
  rank: z.enum(['ADMIN', 'USER']),
  permissionIds: z.array(z.enum(['templatesManage', 'templatesDelete', 'apiKeys'])),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ message: 'No autenticado.' }, { status: 401 });
  }

  if (!hasInternalPermission(session, 'users.write')) {
    return NextResponse.json({ message: 'No tienes permisos para editar usuarios.' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = updateUserAccessSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ message: 'Datos invalidos para actualizar usuario.' }, { status: 400 });
  }

  const { id } = await params;

  if (id === 'bootstrap-admin') {
    return NextResponse.json({ message: 'Este usuario inicial no se puede editar desde la interfaz.' }, { status: 400 });
  }

  try {
    const user = await updateUserAccess({
      userId: id,
      rank: parsed.data.rank,
      permissionIds: parsed.data.permissionIds,
    });

    return NextResponse.json({ ok: true, user });
  } catch {
    return NextResponse.json({ message: 'No se pudo actualizar el usuario.' }, { status: 503 });
  }
}
