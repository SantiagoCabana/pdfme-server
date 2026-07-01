import { prisma } from '@/lib/prisma';

export type AccessUserRank = 'ADMIN' | 'USER';
export type SimplePermissionId = 'templatesManage' | 'templatesDelete' | 'apiKeys';

export type SimplePermissionItem = {
  id: SimplePermissionId;
  label: string;
  description: string;
};

export type AccessUserItem = {
  id: string;
  displayName: string;
  email: string;
  status: string;
  rank: AccessUserRank;
  permissions: SimplePermissionItem[];
};

const ADMIN_ROLE_CODES = new Set(['SUPER_ADMIN', 'ACCESS_ADMIN']);
const TEMPLATE_ROLE_CODES = new Set(['TEMPLATE_MANAGER']);
const API_KEY_ROLE_CODES = new Set(['API_OPERATOR']);

export const SIMPLE_PERMISSIONS: SimplePermissionItem[] = [
  {
    id: 'templatesManage',
    label: 'Crear y editar plantillas',
    description: 'Puede crear nuevas plantillas y modificar las existentes.',
  },
  {
    id: 'templatesDelete',
    label: 'Eliminar plantillas',
    description: 'Puede retirar plantillas que ya no deben usarse.',
  },
  {
    id: 'apiKeys',
    label: 'Gestionar claves API',
    description: 'Puede crear y cortar claves de integracion externa.',
  },
];

function getUserRank(roleCodes: string[], isSuperAdmin: boolean): AccessUserRank {
  if (isSuperAdmin || roleCodes.some((roleCode) => ADMIN_ROLE_CODES.has(roleCode))) {
    return 'ADMIN';
  }

  return 'USER';
}

function buildSimplePermissions(roleCodes: string[]) {
  const hasTemplates = roleCodes.some((code) => TEMPLATE_ROLE_CODES.has(code)) || roleCodes.includes('SUPER_ADMIN');
  const hasApiKeys = roleCodes.some((code) => API_KEY_ROLE_CODES.has(code)) || roleCodes.includes('SUPER_ADMIN');

  return SIMPLE_PERMISSIONS.filter((permission) => {
    if (permission.id === 'apiKeys') {
      return hasApiKeys;
    }

    return hasTemplates;
  });
}

export async function getAccessOverview() {
  try {
    const users = await prisma.userAccount.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        roles: {
          include: {
            accessRole: true,
          },
        },
      },
    });

    return {
      fallback: false,
      permissions: SIMPLE_PERMISSIONS,
      users: users.map<AccessUserItem>((user) => {
        const roleCodes = user.roles.map((entry) => entry.accessRole.code);

        return {
          id: user.id,
          displayName: user.displayName,
          email: user.email,
          status: user.status,
          rank: getUserRank(roleCodes, user.isSuperAdmin),
          permissions: buildSimplePermissions(roleCodes),
        };
      }),
    };
  } catch {
    return {
      fallback: true,
      permissions: SIMPLE_PERMISSIONS,
      users: [
        {
          id: 'bootstrap-admin',
          displayName: 'Bootstrap Admin',
          email: 'practisac.cursos@gmail.com',
          status: 'ACTIVE',
          rank: 'ADMIN' as const,
          permissions: SIMPLE_PERMISSIONS,
        },
      ],
    };
  }
}

export async function updateUserAccess(input: {
  userId: string;
  rank: AccessUserRank;
  permissionIds: SimplePermissionId[];
}) {
  const roleCodes = new Set<string>();

  if (input.rank === 'ADMIN') {
    roleCodes.add('ACCESS_ADMIN');
  }

  if (input.permissionIds.includes('templatesManage') || input.permissionIds.includes('templatesDelete')) {
    roleCodes.add('TEMPLATE_MANAGER');
  }

  if (input.permissionIds.includes('apiKeys')) {
    roleCodes.add('API_OPERATOR');
  }

  const roles = await prisma.accessRole.findMany({
    where: { code: { in: Array.from(roleCodes) } },
    select: { id: true, code: true },
  });

  await prisma.$transaction([
    prisma.userAccount.update({
      where: { id: input.userId },
      data: { isSuperAdmin: false },
    }),
    prisma.userAccountRole.deleteMany({ where: { userAccountId: input.userId } }),
    prisma.userAccountRole.createMany({
      data: roles.map((role) => ({
        userAccountId: input.userId,
        accessRoleId: role.id,
      })),
      skipDuplicates: true,
    }),
  ]);

  const updatedUser = await prisma.userAccount.findUniqueOrThrow({
    where: { id: input.userId },
    include: {
      roles: {
        include: {
          accessRole: true,
        },
      },
    },
  });

  const updatedRoleCodes = updatedUser.roles.map((entry) => entry.accessRole.code);

  return {
    id: updatedUser.id,
    displayName: updatedUser.displayName,
    email: updatedUser.email,
    status: updatedUser.status,
    rank: getUserRank(updatedRoleCodes, updatedUser.isSuperAdmin),
    permissions: buildSimplePermissions(updatedRoleCodes),
  } satisfies AccessUserItem;
}
