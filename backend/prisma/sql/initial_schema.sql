-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "user_status" AS ENUM ('ACTIVE', 'INVITED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "template_status" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "template_page_format" AS ENUM ('A4', 'LETTER', 'LEGAL', 'CUSTOM');

-- CreateEnum
CREATE TYPE "page_orientation" AS ENUM ('PORTRAIT', 'LANDSCAPE');

-- CreateEnum
CREATE TYPE "template_source_mode" AS ENUM ('BLANK', 'BASE_PDF');

-- CreateEnum
CREATE TYPE "api_credential_status" AS ENUM ('ACTIVE', 'REVOKED', 'EXPIRED');

-- CreateTable
CREATE TABLE "user_account" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "status" "user_status" NOT NULL DEFAULT 'ACTIVE',
    "is_internal" BOOLEAN NOT NULL DEFAULT true,
    "is_super_admin" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_role" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "access_role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_permission" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "access_permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_account_role" (
    "user_account_id" TEXT NOT NULL,
    "access_role_id" TEXT NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_account_role_pkey" PRIMARY KEY ("user_account_id","access_role_id")
);

-- CreateTable
CREATE TABLE "access_role_permission" (
    "access_role_id" TEXT NOT NULL,
    "access_permission_id" TEXT NOT NULL,

    CONSTRAINT "access_role_permission_pkey" PRIMARY KEY ("access_role_id","access_permission_id")
);

-- CreateTable
CREATE TABLE "api_credential" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "secret_preview" TEXT NOT NULL,
    "key_hash" TEXT NOT NULL,
    "status" "api_credential_status" NOT NULL DEFAULT 'ACTIVE',
    "allowed_origin" JSONB,
    "expires_at" TIMESTAMP(3),
    "last_used_at" TIMESTAMP(3),
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "api_credential_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_credential_permission" (
    "api_credential_id" TEXT NOT NULL,
    "access_permission_id" TEXT NOT NULL,

    CONSTRAINT "api_credential_permission_pkey" PRIMARY KEY ("api_credential_id","access_permission_id")
);

-- CreateTable
CREATE TABLE "template" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "status" "template_status" NOT NULL DEFAULT 'DRAFT',
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "template_version" (
    "id" TEXT NOT NULL,
    "template_id" TEXT NOT NULL,
    "version_number" INTEGER NOT NULL,
    "default_input" JSONB NOT NULL,
    "input_example" JSONB,
    "is_current" BOOLEAN NOT NULL DEFAULT false,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "published_at" TIMESTAMP(3),
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "template_version_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "template_page" (
    "id" TEXT NOT NULL,
    "template_version_id" TEXT NOT NULL,
    "page_number" INTEGER NOT NULL,
    "designer_json" JSONB NOT NULL,
    "page_format" "template_page_format" NOT NULL DEFAULT 'A4',
    "page_orientation" "page_orientation" NOT NULL DEFAULT 'PORTRAIT',
    "page_width_mm" DOUBLE PRECISION NOT NULL DEFAULT 210,
    "page_height_mm" DOUBLE PRECISION NOT NULL DEFAULT 297,
    "padding_vertical_mm" DOUBLE PRECISION NOT NULL DEFAULT 12,
    "padding_horizontal_mm" DOUBLE PRECISION NOT NULL DEFAULT 12,
    "source_mode" "template_source_mode" NOT NULL DEFAULT 'BLANK',
    "base_file_name" TEXT,
    "base_file_url" TEXT,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "template_page_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "template_tag" (
    "template_id" TEXT NOT NULL,
    "tag_id" TEXT NOT NULL,

    CONSTRAINT "template_tag_pkey" PRIMARY KEY ("template_id","tag_id")
);

-- CreateTable
CREATE TABLE "audit_event" (
    "id" TEXT NOT NULL,
    "actor_id" TEXT,
    "api_credential_id" TEXT,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_event_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_account_email_key" ON "user_account"("email");

-- CreateIndex
CREATE UNIQUE INDEX "access_role_code_key" ON "access_role"("code");

-- CreateIndex
CREATE UNIQUE INDEX "access_permission_code_key" ON "access_permission"("code");

-- CreateIndex
CREATE UNIQUE INDEX "api_credential_prefix_key" ON "api_credential"("prefix");

-- CreateIndex
CREATE UNIQUE INDEX "template_code_key" ON "template"("code");

-- CreateIndex
CREATE UNIQUE INDEX "template_version_template_id_version_number_key" ON "template_version"("template_id", "version_number");

-- CreateIndex
CREATE UNIQUE INDEX "template_page_template_version_id_page_number_key" ON "template_page"("template_version_id", "page_number");

-- CreateIndex
CREATE UNIQUE INDEX "tag_name_key" ON "tag"("name");

-- AddForeignKey
ALTER TABLE "user_account_role" ADD CONSTRAINT "user_account_role_user_account_id_fkey" FOREIGN KEY ("user_account_id") REFERENCES "user_account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_account_role" ADD CONSTRAINT "user_account_role_access_role_id_fkey" FOREIGN KEY ("access_role_id") REFERENCES "access_role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_role_permission" ADD CONSTRAINT "access_role_permission_access_role_id_fkey" FOREIGN KEY ("access_role_id") REFERENCES "access_role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_role_permission" ADD CONSTRAINT "access_role_permission_access_permission_id_fkey" FOREIGN KEY ("access_permission_id") REFERENCES "access_permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_credential" ADD CONSTRAINT "api_credential_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "user_account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_credential_permission" ADD CONSTRAINT "api_credential_permission_api_credential_id_fkey" FOREIGN KEY ("api_credential_id") REFERENCES "api_credential"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_credential_permission" ADD CONSTRAINT "api_credential_permission_access_permission_id_fkey" FOREIGN KEY ("access_permission_id") REFERENCES "access_permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "template" ADD CONSTRAINT "template_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "user_account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "template_version" ADD CONSTRAINT "template_version_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "template"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "template_version" ADD CONSTRAINT "template_version_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "user_account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "template_page" ADD CONSTRAINT "template_page_template_version_id_fkey" FOREIGN KEY ("template_version_id") REFERENCES "template_version"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "template_tag" ADD CONSTRAINT "template_tag_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "template"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "template_tag" ADD CONSTRAINT "template_tag_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_event" ADD CONSTRAINT "audit_event_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "user_account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_event" ADD CONSTRAINT "audit_event_api_credential_id_fkey" FOREIGN KEY ("api_credential_id") REFERENCES "api_credential"("id") ON DELETE SET NULL ON UPDATE CASCADE;

