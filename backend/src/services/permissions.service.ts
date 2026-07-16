import { prisma } from '../prisma.js';

export async function listPermissionMatrix() {
  const roles = await prisma.accessRole.findMany({
    where: { status: true },
    orderBy: { code: 'asc' },
    include: {
      permissions: {
        include: { accessPermission: true },
      },
    },
  });
  const permissions = await prisma.accessPermission.findMany({
    where: { status: true },
    orderBy: [{ category: 'asc' }, { code: 'asc' }],
  });

  return {
    roles: roles.map((role) => ({
      id: role.id,
      code: role.code,
      name: role.name,
      description: role.description,
      isSystem: role.isSystem,
      permissions: role.permissions.map((entry) => entry.accessPermission.code),
    })),
    permissions: permissions.map((permission) => ({
      id: permission.id,
      code: permission.code,
      name: permission.name,
      category: permission.category,
      description: permission.description,
    })),
  };
}

export async function updateRolePermissions(roleId: string, permissionCodes: string[]) {
  const permissions = await prisma.accessPermission.findMany({
    where: { code: { in: permissionCodes }, status: true },
    select: { id: true },
  });

  await prisma.$transaction([
    prisma.accessRolePermission.deleteMany({ where: { accessRoleId: roleId } }),
    prisma.accessRolePermission.createMany({
      data: permissions.map((permission) => ({
        accessRoleId: roleId,
        accessPermissionId: permission.id,
      })),
      skipDuplicates: true,
    }),
  ]);

  return listPermissionMatrix();
}
