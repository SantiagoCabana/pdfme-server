<div align="center">

# pdfme-server

**Self-hosted dashboard and API server for managing pdfme templates and generating PDFs.**

Manage reusable PDF templates, protect internal access, issue API keys, and prepare documents for generation with [pdfme](https://github.com/pdfme/pdfme).

<br />

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Built with pdfme](https://img.shields.io/badge/Built%20with-pdfme-blue)](https://github.com/pdfme/pdfme)
[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20.19%2B-green)](https://nodejs.org/)
[![Self Hosted](https://img.shields.io/badge/Self--Hosted-Ready-black)](#self-hosting)

<br />

<a href="#overview">Overview</a>
· <a href="#features">Features</a>
· <a href="#getting-started">Getting Started</a>
· <a href="#api">API</a>
· <a href="#roadmap">Roadmap</a>
· <a href="#disclaimer">Disclaimer</a>

</div>

---

## Overview

**pdfme-server** is a self-hosted Next.js application for operating a PDF template service on top of [pdfme](https://github.com/pdfme/pdfme).

It provides an internal dashboard for managing templates, users, and API keys, plus external API endpoints that other systems can use to list templates and request document generation.

The current implementation is a **single Next.js monolith** with App Router, Prisma, PostgreSQL, internal authentication, API key authentication, and a feature-based code structure.

> This project is independent from pdfme. It uses pdfme as an open-source dependency and is not maintained by the pdfme team.

---

## Features

### Implemented

- Internal login with signed HTTP-only cookies.
- Protected dashboard routes.
- PostgreSQL data model managed with Prisma.
- Internal users with simple `Admin` / `User` ranges.
- Simplified access management for:
  - template creation/editing,
  - template deletion,
  - API key management.
- API key creation with optional expiration:
  - never,
  - 7 days,
  - 30 days,
  - 90 days,
  - 1 year.
- API key validation with prefix + SHA-256 hash.
- Template catalog page with first-page visual preview placeholder.
- Light/dark mode persisted locally in the browser.
- shadcn-style local UI components.
- External API foundation:
  - `GET /api/v1/templates`,
  - `POST /api/v1/render` reserved for pdfme generation.

### In progress

- Real pdfme Designer integration in the template editor.
- CRUD for templates, versions, and pages from the UI.
- Real PDF generation in `POST /api/v1/render`.
- API key revocation endpoint.
- User creation flow.
- Real PDF preview from stored template pages.

---

## Why pdfme-server?

[pdfme](https://github.com/pdfme/pdfme) is a powerful TypeScript library for building and generating PDFs from templates. Many teams, however, need more than a library.

| Need | What pdfme-server provides |
| --- | --- |
| Store templates | Template/version/page data model |
| Manage templates visually | Internal dashboard foundation |
| Protect internal tools | Login, sessions, users, access ranges |
| Generate PDFs from other systems | API key protected endpoints |
| Self-host PDF generation | One deployable Next.js app |
| Avoid building backend glue from scratch | Prisma + PostgreSQL + API routes |

---

## Built with

- [pdfme](https://github.com/pdfme/pdfme) — PDF template and generation engine.
- [Next.js](https://nextjs.org/) — Full-stack App Router framework.
- [React](https://react.dev/) — User interface.
- [TypeScript](https://www.typescriptlang.org/) — Typed JavaScript.
- [PostgreSQL](https://www.postgresql.org/) — Database.
- [Prisma](https://www.prisma.io/) — Data access and schema management.
- [Tailwind CSS](https://tailwindcss.com/) — Styling foundation.
- [shadcn/ui](https://ui.shadcn.com/) style components — Local, editable UI primitives.
- [jose](https://github.com/panva/jose) — JWT sessions.
- [bcryptjs](https://github.com/dcodeIO/bcrypt.js) — Password hashing.

---

## How it works

```mermaid
flowchart LR
    A[Internal User] --> B[Dashboard]
    B --> C[Templates]
    B --> D[Users]
    B --> E[API Keys]

    F[External System] --> G[x-api-key]
    G --> H[pdfme-server API]
    H --> I[Load Template]
    H --> J[Validate Input]
    I --> K[pdfme Generator]
    J --> K
    K --> L[PDF Response]
```

---

## Getting Started

### Requirements

- Node.js `20.19.5+`
- npm
- PostgreSQL

> Tailwind 4 requires Node 20+. Do not install/build this project with Node 18.

### 1. Clone

```bash
git clone https://github.com/your-org/pdfme-server.git
cd pdfme-server
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create `.env` from `.env.example`:

```bash
cp .env.example .env
```

Required variables:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE
AUTH_SECRET=change-this-auth-secret
AUTH_COOKIE_NAME=company_session
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=change-this-admin-password
NEXT_PUBLIC_APP_NAME=Pdfme Server
```

### 4. Generate Prisma client

```bash
npm run prisma:generate
```

### 5. Apply database schema

```bash
npm run prisma:push
```

The project also includes a manual SQL index for ensuring one current template version per template:

```txt
prisma/sql/template_version_one_current_per_template.sql
```

### 6. Seed the initial admin and access data

```bash
npm run prisma:seed
```

### 7. Run development server

```bash
npm run dev
```

Open:

```txt
http://localhost:3000
```

---

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start Next.js in development mode. |
| `npm run build` | Build the production app. |
| `npm run start` | Start the production build. |
| `npm run check` | Run TypeScript checks. |
| `npm run prisma:generate` | Generate Prisma client. |
| `npm run prisma:push` | Push Prisma schema to the database. |
| `npm run prisma:migrate` | Run Prisma migrate dev. |
| `npm run prisma:seed` | Seed roles, permissions, and admin user. |

---

## App Routes

| Route | Purpose |
| --- | --- |
| `/login` | Internal login. |
| `/templates` | Template catalog and preview table. |
| `/access` | Internal users, ranges, and simple access controls. |
| `/api-credentials` | API key table and key creation modal. |
| `/dashboard` | Alias that renders the template catalog. |

---

## API

### Health check

```http
GET /api/health
```

### List templates

```http
GET /api/v1/templates
x-api-key: YOUR_API_KEY
```

Returns the template catalog available to external systems.

### Render document

```http
POST /api/v1/render
x-api-key: YOUR_API_KEY
Content-Type: application/json
```

Current status: endpoint reserved. Real pdfme rendering is planned but not connected yet.

Expected future payload shape:

```json
{
  "templateId": "template-id",
  "inputs": {
    "fullName": "Jane Doe",
    "documentId": "DOC-001"
  }
}
```

---

## Project Structure

```txt
pdfme-server/
├── app/                    # Next.js routes and API handlers
│   ├── api/                # Internal and external API endpoints
│   ├── login/              # Login page
│   ├── templates/          # Template catalog
│   ├── access/             # User/access management
│   └── api-credentials/    # API key management
├── components/ui/          # Local shadcn-style UI primitives
├── features/               # Feature-based application modules
│   ├── auth/
│   ├── dashboard/
│   ├── templates/
│   ├── access/
│   └── api-credentials/
├── lib/                    # Shared infrastructure helpers
├── prisma/                 # Prisma schema, seed, and SQL helpers
├── README.md
├── LICENSE
└── package.json
```

---

## Architecture

This project intentionally uses a **single Next.js app** instead of separate frontend/backend services.

The backend lives in `app/api/*`, while business logic lives in `features/*/server/*`. This keeps routes thin and feature code close to the UI it supports.

Benefits:

- one deployable app,
- one auth/session layer,
- direct Prisma access from server routes,
- simpler pdfme integration,
- easier self-hosting.

---

## Database Model

The Prisma schema uses PostgreSQL with `snake_case` table and column mappings.

Main entities:

- `UserAccount` → `user_account`
- `AccessRole` → `access_role`
- `AccessPermission` → `access_permission`
- `ApiCredential` → `api_credential`
- `Template` → `template`
- `TemplateVersion` → `template_version`
- `TemplatePage` → `template_page`
- `Tag` → `tag`
- `AuditEvent` → `audit_event`

Template model:

- one `Template` has many `TemplateVersion`,
- one `TemplateVersion` has many `TemplatePage`,
- current version is marked with `isCurrent`,
- pages store pdfme designer JSON, format, orientation, size, padding, and optional base PDF metadata.

No generated PDF history is stored by design.

---

## Self Hosting

The app is designed to run anywhere a Next.js server and PostgreSQL are available:

- VPS
- Docker
- Coolify
- Railway
- Render
- Fly.io
- Vercel with PostgreSQL-compatible database
- AWS / DigitalOcean

Docker support is planned.

---

## Roadmap

- [x] Next.js monolith base
- [x] Login and protected dashboard routes
- [x] PostgreSQL + Prisma schema
- [x] Internal users and simplified access UI
- [x] API key creation with expiration
- [x] Template catalog table
- [x] External API key validation
- [ ] Template CRUD UI
- [ ] pdfme Designer integration
- [ ] Store pdfme designer JSON from the UI
- [ ] Real PDF preview
- [ ] Real `POST /api/v1/render` PDF generation
- [ ] API key revocation
- [ ] User creation flow
- [ ] Docker support
- [ ] Public API documentation

---

## Screenshots

> Screenshots will be added later.

<div align="center">

| Template Catalog | API Keys |
| --- | --- |
| Coming soon | Coming soon |

</div>

---

## Related Projects

- [pdfme](https://github.com/pdfme/pdfme) — TypeScript-based PDF generation library.
- [pdfme documentation](https://pdfme.com/docs) — Official pdfme documentation.
- [pdfme website](https://pdfme.com/) — Official pdfme website.
- [shadcn/ui](https://ui.shadcn.com/) — UI component approach used for local primitives.

---

## Disclaimer

**pdfme-server** is an independent community project built on top of [pdfme](https://github.com/pdfme/pdfme).

This project is **not affiliated with, endorsed by, sponsored by, or officially maintained by the pdfme team**.

The name **pdfme** belongs to its respective owners.

This project only uses pdfme as an open-source dependency.

---

## License

This project is licensed under the [MIT License](./LICENSE).

pdfme is also released under the MIT License. See the original project here:

- [pdfme GitHub repository](https://github.com/pdfme/pdfme)

---

<div align="center">

Built with [pdfme](https://github.com/pdfme/pdfme) for self-hosted PDF template automation.

</div>
