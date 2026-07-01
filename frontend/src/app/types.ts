export type SessionUser = {
  id: string;
  email: string;
  displayName: string;
  permissions: string[];
  roles: string[];
};

export type TemplateItem = {
  id: string;
  name: string;
  code: string;
  status: string;
  versionNumber: number;
  isPublished: boolean;
  pageCount: number;
  pageFormat: string;
  pageOrientation: string;
  pageWidthMm: number;
  pageHeightMm: number;
  tags: string[];
  updatedAt: string;
};

export type ApiCredential = {
  id: string;
  name: string;
  prefix: string;
  status: string;
  expiresAt: string | null;
  lastUsedAt: string | null;
  revokedAt: string | null;
};

export type InternalUser = {
  id: string;
  email: string;
  displayName: string;
  status: string;
  roles: string[];
  lastLoginAt: string | null;
};
