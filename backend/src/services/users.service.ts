import { prisma } from '../prisma.js';
import { hashPassword } from '../auth/password.js';

export async function listUsers() {
  const users = await prisma.userAccount.findMany({
    orderBy: { createdAt: 'desc' },
    include: { roles: { include: { accessRole: true } } },
  });

  return users.map((user) => ({
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    status: user.status,
    isSuperAdmin: user.isSuperAdmin,
    roles: user.roles.map((entry) => entry.accessRole.code),
    lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  }));
}

export async function listRoles() {
  const roles = await prisma.accessRole.findMany({ where: { status: true }, orderBy: { code: 'asc' } });

  return roles.map((role) => ({ id: role.id, code: role.code, name: role.name, description: role.description }));
}

async function replaceUserRoles(userId: string, roleCodes: string[]) {
  const roles = await prisma.accessRole.findMany({ where: { code: { in: roleCodes } }, select: { id: true } });

  await prisma.userAccountRole.deleteMany({ where: { userAccountId: userId } });

  if (roles.length > 0) {
    await prisma.userAccountRole.createMany({
      data: roles.map((role) => ({ userAccountId: userId, accessRoleId: role.id })),
      skipDuplicates: true,
    });
  }
}

export async function createUser(input: {
  email: string;
  displayName: string;
  password: string;
  roleCode: string;
}) {
  const user = await prisma.userAccount.create({
    data: {
      email: input.email.toLowerCase(),
      displayName: input.displayName,
      passwordHash: await hashPassword(input.password),
      status: 'ACTIVE',
    },
  });

  await replaceUserRoles(user.id, [input.roleCode]);

  return (await listUsers()).find((entry) => entry.id === user.id);
}

export async function updateUser(input: {
  id: string;
  displayName?: string;
  status?: 'ACTIVE' | 'INVITED' | 'SUSPENDED';
  roleCode?: string;
  password?: string;
}) {
  await prisma.userAccount.update({
    where: { id: input.id },
    data: {
      displayName: input.displayName,
      status: input.status,
      passwordHash: input.password ? await hashPassword(input.password) : undefined,
      tokenVersion: { increment: 1 },
    },
  });

  if (input.roleCode) {
    await replaceUserRoles(input.id, [input.roleCode]);
  }

  return (await listUsers()).find((entry) => entry.id === input.id);
}

export async function deleteUser(id: string) {
  await prisma.userAccount.delete({ where: { id } });
}
