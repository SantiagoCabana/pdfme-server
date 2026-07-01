import AdminJS, { ComponentLoader, type ActionContext, type CurrentAdmin, type ResourceOptions } from 'adminjs';
import { Database, Resource, getModelByName } from '@adminjs/prisma';

import { hasPermission, type AdminSessionUser } from '../auth/admin-auth.js';
import { prisma } from '../prisma.js';

AdminJS.registerAdapter({ Database, Resource });

const componentLoader = new ComponentLoader();
const TemplatesPage = componentLoader.add('TemplatesPage', './components/templates-page');

type NavigationGroup = {
  name: string;
  icon: string;
};

const navigation = {
  access: { name: 'Accesos', icon: 'User' },
  api: { name: 'API', icon: 'Key' },
  system: { name: 'Sistema', icon: 'Settings' },
} satisfies Record<string, NavigationGroup>;

function getAdminUser(currentAdmin: CurrentAdmin | AdminSessionUser | undefined) {
  return currentAdmin as AdminSessionUser | undefined;
}

function can(permission: string) {
  return (context: ActionContext) => hasPermission(getAdminUser(context.currentAdmin), permission);
}

const readonlyActions = {
  new: { isAccessible: false },
  edit: { isAccessible: false },
  delete: { isAccessible: false },
  bulkDelete: { isAccessible: false },
};

const noDeleteActions = {
  delete: { isAccessible: false },
  bulkDelete: { isAccessible: false },
};

function isNotSystemRecord(context: ActionContext) {
  return context.record?.params?.isSystem !== true && context.record?.params?.isSystem !== 'true';
}

function resource(modelName: string, options: ResourceOptions) {
  return {
    resource: { model: getModelByName(modelName), client: prisma },
    options,
  };
}

const resources = [
  resource('UserAccount', {
    actions: {
      list: { isAccessible: can('users.read') },
      show: { isAccessible: can('users.read') },
      edit: { isAccessible: can('users.write') },
      new: { isAccessible: false },
      delete: { isAccessible: false },
      bulkDelete: { isAccessible: false },
    },
    navigation: navigation.access,
    listProperties: ['displayName', 'email', 'status', 'isSuperAdmin', 'updatedAt'],
    filterProperties: ['email', 'displayName', 'status', 'isInternal', 'isSuperAdmin'],
    showProperties: ['id', 'email', 'displayName', 'status', 'isInternal', 'isSuperAdmin', 'createdAt', 'updatedAt'],
    editProperties: ['email', 'displayName', 'status', 'isInternal', 'isSuperAdmin'],
    properties: {
      passwordHash: { isVisible: false },
    },
  }),
  resource('AccessRole', {
    actions: {
      list: { isAccessible: can('users.read') },
      show: { isAccessible: can('users.read') },
      edit: { isAccessible: can('users.write') },
      new: { isAccessible: can('users.write') },
      delete: { isAccessible: (context) => can('users.write')(context) && isNotSystemRecord(context) },
      bulkDelete: { isAccessible: false },
    },
    navigation: navigation.access,
    listProperties: ['code', 'name', 'isSystem', 'updatedAt'],
    filterProperties: ['code', 'name', 'isSystem'],
    showProperties: ['id', 'code', 'name', 'description', 'isSystem', 'createdAt', 'updatedAt'],
    editProperties: ['code', 'name', 'description', 'isSystem'],
  }),
  resource('AccessPermission', {
    actions: {
      list: { isAccessible: can('users.read') },
      show: { isAccessible: can('users.read') },
      edit: { isAccessible: can('users.write') },
      new: { isAccessible: can('users.write') },
      delete: { isAccessible: false },
      bulkDelete: { isAccessible: false },
    },
    navigation: navigation.access,
    listProperties: ['code', 'name', 'category', 'updatedAt'],
    filterProperties: ['code', 'name', 'category'],
    showProperties: ['id', 'code', 'name', 'category', 'description', 'createdAt', 'updatedAt'],
    editProperties: ['code', 'name', 'category', 'description'],
  }),
  resource('UserAccountRole', {
    actions: {
      list: { isAccessible: can('users.read') },
      show: { isAccessible: can('users.read') },
      edit: { isAccessible: can('users.write') },
      new: { isAccessible: can('users.write') },
      delete: { isAccessible: can('users.write') },
      bulkDelete: { isAccessible: false },
    },
    navigation: navigation.access,
    listProperties: ['userAccountId', 'accessRoleId', 'assignedAt'],
    filterProperties: ['userAccountId', 'accessRoleId'],
    showProperties: ['userAccountId', 'accessRoleId', 'assignedAt'],
    editProperties: ['userAccountId', 'accessRoleId'],
  }),
  resource('AccessRolePermission', {
    actions: {
      list: { isAccessible: can('users.read') },
      show: { isAccessible: can('users.read') },
      edit: { isAccessible: can('users.write') },
      new: { isAccessible: can('users.write') },
      delete: { isAccessible: can('users.write') },
      bulkDelete: { isAccessible: false },
    },
    navigation: navigation.access,
    listProperties: ['accessRoleId', 'accessPermissionId'],
    filterProperties: ['accessRoleId', 'accessPermissionId'],
    showProperties: ['accessRoleId', 'accessPermissionId'],
    editProperties: ['accessRoleId', 'accessPermissionId'],
  }),

  resource('ApiCredential', {
    actions: {
      list: { isAccessible: can('api-credentials.read') },
      show: { isAccessible: can('api-credentials.read') },
      edit: { isAccessible: can('api-credentials.write') },
      new: { isAccessible: false },
      delete: { isAccessible: false },
      bulkDelete: { isAccessible: false },
    },
    navigation: navigation.api,
    listProperties: ['name', 'prefix', 'status', 'expiresAt', 'lastUsedAt', 'updatedAt'],
    filterProperties: ['name', 'prefix', 'status', 'expiresAt', 'lastUsedAt'],
    showProperties: ['id', 'name', 'prefix', 'status', 'allowedOrigin', 'expiresAt', 'lastUsedAt', 'createdById', 'createdAt', 'updatedAt'],
    editProperties: ['name', 'status', 'allowedOrigin', 'expiresAt', 'createdById'],
    properties: {
      keyHash: { isVisible: false },
      secretPreview: { isVisible: false },
    },
  }),
  resource('ApiCredentialPermission', {
    actions: {
      list: { isAccessible: can('api-credentials.read') },
      show: { isAccessible: can('api-credentials.read') },
      edit: { isAccessible: can('api-credentials.write') },
      new: { isAccessible: can('api-credentials.write') },
      delete: { isAccessible: can('api-credentials.write') },
      bulkDelete: { isAccessible: false },
    },
    navigation: navigation.api,
    listProperties: ['apiCredentialId', 'accessPermissionId'],
    filterProperties: ['apiCredentialId', 'accessPermissionId'],
    showProperties: ['apiCredentialId', 'accessPermissionId'],
    editProperties: ['apiCredentialId', 'accessPermissionId'],
  }),

  resource('AuditEvent', {
    navigation: navigation.system,
    listProperties: ['action', 'entityType', 'entityId', 'actorId', 'apiCredentialId', 'createdAt'],
    filterProperties: ['action', 'entityType', 'entityId', 'actorId', 'apiCredentialId', 'createdAt'],
    showProperties: ['id', 'actorId', 'apiCredentialId', 'action', 'entityType', 'entityId', 'metadata', 'createdAt'],
    actions: readonlyActions,
  }),
  resource('AdminSession', {
    navigation: navigation.system,
    listProperties: ['sid', 'expire'],
    filterProperties: ['sid', 'expire'],
    showProperties: ['sid', 'sess', 'expire'],
    actions: readonlyActions,
  }),
];

export function createAdmin() {
  const rootPath = process.env.ADMIN_ROOT_PATH ?? '/';
  const adminPaths = {
    rootPath,
    loginPath: rootPath === '/' ? '/login' : `${rootPath}/login`,
    logoutPath: rootPath === '/' ? '/logout' : `${rootPath}/logout`,
    refreshTokenPath: rootPath === '/' ? '/refresh-token' : `${rootPath}/refresh-token`,
  };

  const admin = new AdminJS({
    ...adminPaths,
    branding: {
      companyName: 'Pdfme Server',
      withMadeWithLove: false,
    },
    componentLoader,
    dashboard: {
      component: TemplatesPage,
    },
    pages: {
      templates: {
        icon: 'FileText',
        component: TemplatesPage,
      },
    },
    resources,
  });

  const renderLogin = admin.renderLogin.bind(admin);
  admin.renderLogin = async (props) => {
    const html = await renderLogin(props);
    return html.replace(/\"paths\":\{[^}]*\}/, `\"paths\":${JSON.stringify(adminPaths)}`);
  };

  return admin;
}
