import type { Template as PdfmeTemplate } from '@pdfme/common';

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
  versionId: string | null;
  versions: {
    id: string;
    versionNumber: number;
    isCurrent: boolean;
    isPublished: boolean;
    pageCount: number;
    createdAt: string;
    updatedAt: string;
  }[];
  isPublished: boolean;
  pageCount: number;
  pageFormat: string;
  pageOrientation: string;
  pageWidthMm: number;
  pageHeightMm: number;
  paddingVerticalMm: number;
  paddingHorizontalMm: number;
  designerJson?: Partial<PdfmeTemplate>;
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

export type TagItem = {
  id: string;
  name: string;
  templateCount: number;
  createdAt: string;
  updatedAt: string;
};

export type AccessPermissionItem = {
  id: string;
  code: string;
  name: string;
  category: string;
  description: string | null;
};

export type AccessRoleItem = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  permissions: string[];
};
