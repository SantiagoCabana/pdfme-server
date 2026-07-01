import { PrismaClient } from '@prisma/client';

import { hashPassword } from '../features/auth/server/password';

const prisma = new PrismaClient();

const permissionSeed = [
  ['users.read', 'Usuarios lectura', 'access'],
  ['users.write', 'Usuarios escritura', 'access'],
  ['roles.read', 'Roles lectura', 'access'],
  ['roles.write', 'Roles escritura', 'access'],
  ['api-credentials.read', 'Credenciales API lectura', 'api'],
  ['api-credentials.write', 'Credenciales API escritura', 'api'],
  ['templates.read', 'Plantillas lectura', 'templates'],
  ['templates.write', 'Plantillas escritura', 'templates'],
  ['templates.publish', 'Plantillas publicar', 'templates'],
  ['documents.generate', 'Documentos generar', 'documents'],
  ['audit.read', 'Auditoria lectura', 'audit'],
] as const;

const roleSeed = {
  SUPER_ADMIN: permissionSeed.map(([code]) => code),
  ACCESS_ADMIN: ['users.read', 'users.write', 'roles.read', 'roles.write', 'audit.read'],
  TEMPLATE_MANAGER: ['templates.read', 'templates.write', 'templates.publish', 'documents.generate'],
  API_OPERATOR: ['api-credentials.read', 'api-credentials.write', 'templates.read', 'documents.generate'],
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
      create: {
        code,
        name: code.replaceAll('_', ' '),
        isSystem: true,
      },
    });

    await prisma.accessRolePermission.deleteMany({ where: { accessRoleId: role.id } });

    const permissions = await prisma.accessPermission.findMany({
      where: { code: { in: permissionCodes } },
      select: { id: true },
    });

    if (permissions.length > 0) {
      await prisma.accessRolePermission.createMany({
        data: permissions.map((permission) => ({
          accessRoleId: role.id,
          accessPermissionId: permission.id,
        })),
        skipDuplicates: true,
      });
    }
  }

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    return;
  }

  const passwordHash = await hashPassword(adminPassword);

  const adminUser = await prisma.userAccount.upsert({
    where: { email: adminEmail.toLowerCase() },
    update: {
      displayName: 'Bootstrap Admin',
      passwordHash,
      isSuperAdmin: true,
      status: 'ACTIVE',
    },
    create: {
      email: adminEmail.toLowerCase(),
      displayName: 'Bootstrap Admin',
      passwordHash,
      isSuperAdmin: true,
      status: 'ACTIVE',
    },
  });

  const superAdminRole = await prisma.accessRole.findUnique({ where: { code: 'SUPER_ADMIN' } });

  if (superAdminRole) {
    await prisma.userAccountRole.upsert({
      where: {
        userAccountId_accessRoleId: {
          userAccountId: adminUser.id,
          accessRoleId: superAdminRole.id,
        },
      },
      update: {},
      create: {
        userAccountId: adminUser.id,
        accessRoleId: superAdminRole.id,
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
