# Schema v1 Decisions

## Decision

The database schema is approved as `v1 stable` for implementation.

The business core is:

```text
template -> template_version -> template_page
```

Meaning:

- `template` is the general template concept and public name.
- `template_version` is a complete version of that template.
- `template_page` stores each page that belongs to a version.
- `template_version.is_current` defines the default version used by the system.
- Recency or `updated_at` must not decide the current version.
- Generated PDFs are not stored in v1.
- `render_job` and `generated_file` are not part of v1.

## Business tables

These tables belong to the product domain:

```text
api_credential
api_credential_permission
audit_event
tag
template
template_page
template_tag
template_version
```

## Access tables

These tables are required to operate internal access:

```text
access_permission
access_role
access_role_permission
user_account
user_account_role
```

## Technical tables

These tables are infrastructure/tooling tables:

```text
session
_prisma_migrations
```

`session` is mapped in Prisma as `AppSession` because it is created and used by `express-session` with `connect-pg-simple`.

`_prisma_migrations` is managed by Prisma Migrate and must not be modeled, renamed, edited manually or deleted.

## Final choices

- `ApiCredentialPermission` stays in v1 to allow future API key scopes.
- `Template.code` stays as an internal stable identifier; UI can hide it from normal users.
- `TemplatePage.baseFileUrl` is enough for v1; no `file_asset` table yet.
- `TemplatePage.designerJson` remains the official design source per page.
- `AuditEvent` stays because it tracks important operational actions, not generated PDF history.
- The frontend/backend split does not define database architecture; Prisma models remain the source of truth for API services.

## Required SQL outside Prisma schema

Prisma cannot fully express the required partial unique index for one current version per template. The database must keep this index:

```sql
CREATE UNIQUE INDEX template_version_one_current_per_template
ON template_version (template_id)
WHERE is_current = true;
```

This index is already present in the remote PostgreSQL database.
