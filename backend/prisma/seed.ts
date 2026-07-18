import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const permissionSeed = [
  ['templates.view', 'Ver plantillas', 'templates'],
  ['templates.edit', 'Editar plantillas', 'templates'],
  ['templates.create', 'Crear plantillas', 'templates'],
  ['templates.delete', 'Eliminar plantillas', 'templates'],
  ['api_keys.manage', 'Gestionar claves API', 'api'],
  ['users.manage', 'Gestionar usuarios', 'access'],
  ['audit.view', 'Registro de auditoría', 'audit'],
] as const;

const roleSeed = {
  VIEWER: ['templates.view'],
  EDITOR: ['templates.view', 'templates.edit'],
  MANAGER: ['templates.view', 'templates.edit', 'templates.create', 'templates.delete', 'api_keys.manage', 'audit.view'],
  ADMIN: permissionSeed.map(([code]) => code),
};

async function main() {
  const removedPermissionCodes = ['templates.publish'];

  const removedPermissions = await prisma.accessPermission.findMany({
    where: { code: { in: removedPermissionCodes } },
    select: { id: true },
  });

  if (removedPermissions.length > 0) {
    await prisma.accessRolePermission.deleteMany({
      where: { accessPermissionId: { in: removedPermissions.map((permission) => permission.id) } },
    });
    await prisma.accessPermission.deleteMany({ where: { code: { in: removedPermissionCodes } } });
  }

  for (const [code, name, category] of permissionSeed) {
    await prisma.accessPermission.upsert({
      where: { code },
      update: { name, category, status: true },
      create: { code, name, category, status: true },
    });
  }

  for (const [code, permissionCodes] of Object.entries(roleSeed)) {
    const role = await prisma.accessRole.upsert({
      where: { code },
      update: { name: code, isSystem: true, status: true },
      create: { code, name: code, isSystem: true, status: true },
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

  const initialAdminEmail = process.env.INITIAL_ADMIN_EMAIL;
  const initialAdminPassword = process.env.INITIAL_ADMIN_PASSWORD;

  if (!initialAdminEmail || !initialAdminPassword) {
    return;
  }

  const adminEmail = initialAdminEmail.toLowerCase();
  const existingAdminUser = await prisma.userAccount.findUnique({
    where: { email: adminEmail },
  });

  if (existingAdminUser) {
    return;
  }

  const adminUser = await prisma.userAccount.create({
    data: {
      email: adminEmail,
      displayName: 'Administrador',
      passwordHash: await bcrypt.hash(initialAdminPassword, 10),
      isSuperAdmin: true,
      status: 'ACTIVE',
    },
  });

  const adminRole = await prisma.accessRole.findUnique({ where: { code: 'ADMIN' } });

  if (adminRole) {
    await prisma.userAccountRole.upsert({
      where: { userAccountId_accessRoleId: { userAccountId: adminUser.id, accessRoleId: adminRole.id } },
      update: {},
      create: { userAccountId: adminUser.id, accessRoleId: adminRole.id },
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
