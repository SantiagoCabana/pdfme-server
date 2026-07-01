# AdminJS and Database Rules

## AdminJS role

AdminJS is the main internal panel. It includes custom pages for business workflows and CRUD resources for technical administration. It is not the pdfme Designer UI itself.

Use AdminJS for:

- users, roles and permissions,
- API credentials technical review and revocation data,
- tags,
- audit events,
- AdminJS sessions.

Do not use AdminJS for:

- direct Template, TemplateVersion or TemplatePage CRUD,

- visual pdfme template design,
- PDF preview,
- final PDF generation flows,
- business-facing workflow UI.

## Database rules

- Project-owned tables stay in Prisma and PostgreSQL `snake_case`.
- Dependency-owned tables are preserved when useful. `session` is mapped as `AdminSession` because it is created by `connect-pg-simple` for AdminJS auth.
- Never run `prisma db push --accept-data-loss` without explicit approval.
- Before applying schema changes, map any existing external table in Prisma or intentionally exclude it after review.

## AdminJS resource rules

- Resources must be explicit, not auto-loaded from the full database.
- Sensitive fields stay hidden from AdminJS forms and show pages:
  - `passwordHash`,
  - `keyHash`,
  - `secretPreview`.
- System records should not be deleted from AdminJS.
- API credentials are created by backend services, not manually from AdminJS, because the raw key is only shown once.
- Audit events and sessions are read-only.
- pdfme Designer JSON can be inspected technically, but editing should happen from AdminJS custom workflow pages.

## Template management rule

Template, TemplateVersion and TemplatePage are intentionally not exposed as AdminJS CRUD resources. The user works with a single template catalog inside an AdminJS custom page. Backend services translate that user action into the required `template -> template_version -> template_page` records.
