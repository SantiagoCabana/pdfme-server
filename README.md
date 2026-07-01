<div align="center">

# pdfme-server

**Self-hosted PDF template platform with AdminJS, Prisma, PostgreSQL and pdfme.**

AdminJS is the main panel. The backend owns runtime routes and APIs; the frontend folder is kept as a source area for reusable React UI/components that can be integrated into AdminJS workflows.

<br />

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Built with pdfme](https://img.shields.io/badge/Built%20with-pdfme-blue)](https://github.com/pdfme/pdfme)
[![AdminJS](https://img.shields.io/badge/AdminJS-main%20panel-black)](https://adminjs.co/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Prisma-31648c)](https://www.prisma.io/)

</div>

---

## Objective

`pdfme-server` is an internal platform for operating dynamic PDF templates with pdfme.

The goal is to provide:

- one AdminJS main panel for internal users,
- custom AdminJS pages for business workflows such as template catalog,
- technical AdminJS resources for access, API keys, audit and sessions,
- backend APIs for template operations and external PDF generation,
- PostgreSQL storage for users, roles, credentials, templates, versions and pages,
- API keys for external systems that need to generate PDFs.

This project is independent from pdfme. It uses pdfme as an open-source dependency.

---

## Current Architecture

The project keeps backend and frontend folders, but AdminJS is the only main panel. The frontend folder is not a separate user-facing route strategy; it is a workspace for reusable UI that can be integrated into AdminJS custom pages:

```txt
pdfme-server/
├── backend/       # Express + AdminJS main panel + Prisma + pdfme API
├── frontend/      # React UI source for components/views integrated into AdminJS
├── docs/          # Project status and implementation notes
├── README.md
├── LICENSE
└── package.json   # repository metadata only
```

### Backend

- Express server.
- AdminJS main panel mounted at `/admin`.
- Custom AdminJS page `templates` for business template management.
- Prisma as the main data layer.
- PostgreSQL as the database.
- API key foundation with hashed secrets and scopes.
- Reserved pdfme render endpoint.

### AdminJS Role

AdminJS is the principal UI. It has two responsibilities:

- business pages: custom pages such as `Plantillas`, backed by our own services and APIs;
- technical resources: users, roles, permissions, API credentials, audit and sessions.

`Template`, `TemplateVersion` and `TemplatePage` are not exposed as direct AdminJS CRUD resources. The user works with a single template catalog, while backend services create the required `template -> template_version -> template_page` records.

### Frontend Folder

The frontend folder is retained for React UI work, reusable views and future pdfme Designer components. It should not become a second independent panel for users. Business screens must be surfaced through AdminJS custom pages.

---

## Stack

| Area | Tool |
| --- | --- |
| Main panel | AdminJS |
| UI source | React + Vite |
| Admin UI system | `@adminjs/design-system` |
| Backend | Express on Node.js |
| Database | PostgreSQL |
| ORM | Prisma |
| PDF generation | pdfme |
| Auth base | AdminJS authenticated router + PostgreSQL sessions |
| API credentials | Prefix + hashed secret + expiration + scopes |

AdminJS v7 is ESM-only, so the backend uses `type: module` and TypeScript `NodeNext` module resolution.

---

## Environment

The backend has its own environment file:

```bash
cp backend/.env.example backend/.env
```

Required backend variables:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE
BACKEND_PORT=4000
ADMIN_ROOT_PATH=/admin
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=change-this-admin-password
SESSION_SECRET=change-this-session-secret
ADMIN_COOKIE_NAME=pdfme_admin
API_KEY_SECRET=change-this-api-key-secret
```

---

## Development

Install backend dependencies:

```bash
cd backend
npm install
```

Generate Prisma client:

```bash
npm run prisma:generate
```

Apply schema to PostgreSQL:

```bash
npm run prisma:push
```

Seed initial roles and admin user:

```bash
npm run prisma:seed
```

Run backend:

```bash
npm run dev
```

Open:

```txt
AdminJS:  http://localhost:4000/admin
Health:   http://localhost:4000/api/health
```

---

## Database Model

The Prisma schema lives in:

```txt
backend/prisma/schema.prisma
```

Main tables:

- `user_account`
- `access_role`
- `access_permission`
- `api_credential`
- `template`
- `template_version`
- `template_page`
- `tag`
- `audit_event`
- `session`

Template structure:

- one `template` has many `template_version`,
- one `template_version` has many `template_page`,
- current version is marked with `is_current`,
- pages store pdfme designer JSON, page format, orientation, size, padding and optional base PDF metadata,
- generated PDFs are not stored by design.

Manual SQL helper:

```txt
backend/prisma/sql/template_version_one_current_per_template.sql
```

---

## API Base

### Health

```http
GET /api/health
```

### Internal Template Catalog

Used by the AdminJS custom page:

```http
GET /api/templates
POST /api/templates
DELETE /api/templates/:id
```

### List Templates For External Systems

```http
GET /api/v1/templates
x-api-key: YOUR_API_KEY
```

### Render PDF

```http
POST /api/v1/render
x-api-key: YOUR_API_KEY
Content-Type: application/json
```

Current status: endpoint validates API key and scope, but real pdfme rendering is still pending.

---

## Project Status

See:

```txt
docs/PROJECT_STATUS.md
docs/ADMINJS_DATABASE_RULES.md
docs/SCHEMA_V1_DECISIONS.md
```

---

## Roadmap

- [x] Single backend/AdminJS app base
- [x] AdminJS authenticated main panel
- [x] PostgreSQL + Prisma schema
- [x] Internal users and simplified access data
- [x] API key creation, scopes and revocation
- [x] Template catalog custom page inside AdminJS
- [x] External API key validation
- [ ] Template edit page inside AdminJS custom workflow
- [ ] pdfme Designer integration inside AdminJS custom page
- [ ] Store pdfme designer JSON from the custom UI
- [ ] Real PDF preview
- [ ] Real `POST /api/v1/render` PDF generation
- [ ] User management workflow
- [ ] Docker support

---

## Disclaimer

`pdfme-server` is not affiliated with, endorsed by, sponsored by, or officially maintained by the pdfme team.

The name `pdfme` belongs to its respective owners. This project uses pdfme as an open-source dependency.

---

## License

This project is licensed under the [MIT License](./LICENSE).
