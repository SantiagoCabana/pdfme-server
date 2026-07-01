<div align="center">

# pdfme-server

**Self-hosted PDF template platform with React, Express, Prisma, PostgreSQL and pdfme.**

Frontend and backend are separated: the frontend is the user-facing application, and the backend is only an API/runtime service.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Built with pdfme](https://img.shields.io/badge/Built%20with-pdfme-blue)](https://github.com/pdfme/pdfme)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Prisma-31648c)](https://www.prisma.io/)

</div>

---

## Objective

Build an internal platform to manage pdfme templates and expose protected APIs for external systems that need to generate PDFs.

The platform has two independent apps:

- `frontend/`: React + Vite user interface.
- `backend/`: Express API, Prisma, PostgreSQL, auth, API keys and pdfme generation.

The backend does not serve an admin panel. It only exposes API endpoints and business logic.

---

## Current Features

- Login from the React frontend using backend sessions.
- Protected API with PostgreSQL-backed sessions.
- Template catalog API.
- Template creation as a business entity.
- Automatic creation of initial `template_version` and `template_page`.
- API key creation with hash, prefix, expiration and revocation.
- External API-key protected endpoints.
- Prisma schema for users, roles, permissions, templates, versions, pages, tags, audit and sessions.

---

## Project Structure

```txt
pdfme-server/
├── backend/       # Express API + Prisma + pdfme runtime
├── frontend/      # React/Vite application
├── docs/          # Project status and architecture notes
├── README.md
├── LICENSE
└── package.json   # repository metadata only
```

---

## Stack

| Area | Tool |
| --- | --- |
| Frontend | React + Vite |
| Frontend data | TanStack Query planned |
| Backend | Express on Node.js |
| Database | PostgreSQL |
| ORM | Prisma |
| Auth | Express session + PostgreSQL session store |
| API credentials | Prefix + hashed secret + expiration + scopes |
| PDF generation | pdfme |

---

## Development URLs

```txt
Frontend UI: http://localhost:5173
Backend API: http://localhost:4000
Health:      http://localhost:4000/api/health
```

The browser-facing application is the frontend URL. The backend URL is for API calls and health checks.

---

## Backend Environment

Create `backend/.env` from `backend/.env.example`:

```bash
cp backend/.env.example backend/.env
```

Required variables:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE
BACKEND_PORT=4000
FRONTEND_URL=http://localhost:5173
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=change-this-admin-password
SESSION_SECRET=change-this-session-secret
SESSION_COOKIE_NAME=pdfme_session
API_KEY_SECRET=change-this-api-key-secret
```

`ADMIN_EMAIL` and `ADMIN_PASSWORD` are used only to bootstrap the first internal admin user/session.

---

## Frontend Environment

Create `frontend/.env` from `frontend/.env.example` when needed:

```env
VITE_API_BASE_URL=
VITE_APP_NAME=Pdfme Server
```

In development, leaving `VITE_API_BASE_URL` empty makes Vite proxy `/api` to `http://localhost:4000`.

---

## Install

Backend:

```bash
cd backend
npm install
npm run prisma:generate
npm run prisma:push
npm run prisma:seed
npm run dev
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

---

## API Routes

Internal session API:

```http
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
```

Templates:

```http
GET    /api/templates
POST   /api/templates
DELETE /api/templates/:id
```

API credentials:

```http
GET   /api/api-credentials
POST  /api/api-credentials
PATCH /api/api-credentials/:id/revoke
```

External API-key endpoints:

```http
GET  /api/v1/templates
POST /api/v1/render
```

---

## Database Model

The approved v1 core remains:

```txt
template -> template_version -> template_page
```

Rules:

- `template` is the business-level template.
- `template_version` is a complete version of that template.
- `template_page` stores each page design and page configuration.
- `template_version.is_current` defines the current/default version.
- Generated PDFs are not stored in v1.
- PDF generation happens on demand.

Technical tables:

- `session` is used by `connect-pg-simple` for backend sessions.
- `_prisma_migrations` is managed by Prisma and is not modeled.

---

## Roadmap

- [x] Separate frontend and backend folders.
- [x] Backend as API-only service.
- [x] React/Vite frontend as user-facing app.
- [x] PostgreSQL + Prisma schema.
- [x] Login/session API.
- [x] Template catalog create/list/delete.
- [x] API key create/list/revoke.
- [ ] User management UI.
- [ ] Template edit UI.
- [ ] pdfme Designer integration in frontend.
- [ ] Real PDF preview.
- [ ] Real `POST /api/v1/render` PDF generation.
- [ ] Docker support.

---

## License

MIT. See [LICENSE](./LICENSE).
