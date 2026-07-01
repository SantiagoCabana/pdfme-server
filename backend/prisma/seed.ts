import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const permissionSeed = [
  ['users.read', 'Usuarios lectura', 'access'],
  ['users.write', 'Usuarios escritura', 'access'],
  ['api-credentials.read', 'Credenciales API lectura', 'api'],
  ['api-credentials.write', 'Credenciales API escritura', 'api'],
  ['templates.read', 'Plantillas lectura', 'templates'],
  ['templates.write', 'Plantillas escritura', 'templates'],
  ['templates.delete', 'Plantillas eliminar', 'templates'],
  ['documents.generate', 'Documentos generar', 'documents'],
] as const;

const roleSeed = {
  SUPER_ADMIN: permissionSeed.map(([code]) => code),
  ADMIN: ['users.read', 'users.write', 'api-credentials.read', 'api-credentials.write', 'templates.read', 'templates.write', 'templates.delete', 'documents.generate'],
  USER: ['templates.read', 'templates.write', 'documents.generate'],
};

async function main() {
  for (const [code, name, category] of permissionSeed) {
    await prisma.accessPermission.upsert({
      where: { code },
      update: { name, category },
      create: { code, name, category },
    });
  }

  for (const [code, permissionCodes] of Object.entries(roleSeed)) {
    const role = await prisma.accessRole.upsert({
      where: { code },
      update: { name: code.replaceAll('_', ' '), isSystem: true },
      create: { code, name: code.replaceAll('_', ' '), isSystem: true },
    });

    await prisma.accessRolePermission.deleteMany({ where: { accessRoleId: role.id } });

    const permissions = await prisma.accessPermission.findMany({
      where: { code: { in: permissionCodes } },
      select: { id: true },
    });

    await prisma.accessRolePermission.createMany({
      data: permissions.map((permission) => ({ accessRoleId: role.id, accessPermissionId: permission.id })),
      skipDuplicates: true,
    });
  }

  if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
    return;
  }

  const adminUser = await prisma.userAccount.upsert({
    where: { email: process.env.ADMIN_EMAIL.toLowerCase() },
    update: {
      displayName: 'Bootstrap Admin',
      passwordHash: await bcrypt.hash(process.env.ADMIN_PASSWORD, 10),
      isSuperAdmin: true,
      status: 'ACTIVE',
    },
    create: {
      email: process.env.ADMIN_EMAIL.toLowerCase(),
      displayName: 'Bootstrap Admin',
      passwordHash: await bcrypt.hash(process.env.ADMIN_PASSWORD, 10),
      isSuperAdmin: true,
      status: 'ACTIVE',
    },
  });

  const superAdminRole = await prisma.accessRole.findUnique({ where: { code: 'SUPER_ADMIN' } });

  if (superAdminRole) {
    await prisma.userAccountRole.upsert({
      where: { userAccountId_accessRoleId: { userAccountId: adminUser.id, accessRoleId: superAdminRole.id } },
      update: {},
      create: { userAccountId: adminUser.id, accessRoleId: superAdminRole.id },
    });
  }
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
