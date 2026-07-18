<div align="center">

# pdfme-server

**Plataforma para administrar plantillas pdfme y exponer una API protegida para integraciones externas.**

[![Built with pdfme](https://img.shields.io/badge/Built%20with-pdfme-blue)](https://github.com/pdfme/pdfme)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Prisma-31648c)](https://www.prisma.io/)

</div>

---

## Objetivo

`pdfme-server` es un monorepo con frontend y backend en un solo repositorio. La app permite administrar plantillas PDF, controlar usuarios/permisos, crear API keys y exponer endpoints para que sistemas externos consulten plantillas y soliciten generación de documentos.

La documentación funcional para integradores vive dentro del frontend autenticado en:

```txt
/documentation/{ruta}
```

---

## Estructura

```txt
pdfme-server/
├── backend/          # Express API + Prisma + PostgreSQL
├── frontend/         # React/Vite + MUI + pdfme UI
├── .env.example      # Variables base para frontend y backend
├── INSTALL.md        # Instalación local y despliegue por Dockerfiles separados
├── package.json      # Metadatos raíz del monorepo
└── README.md
```

---

## Servicios

| Servicio | Ruta | Puerto local | Descripción |
| --- | --- | --- | --- |
| Frontend | `frontend/` | `5173` | Aplicación web, editor, vista previa, usuarios, permisos y documentación. |
| Backend | `backend/` | `4000` | API, autenticación, sesiones, plantillas, API keys y endpoints externos. |
| PostgreSQL | Externo/local | Según instalación | Base de datos usada por Prisma. |

URLs locales habituales:

```txt
Frontend:      http://localhost:5173
Backend API:   http://localhost:4000/api
Health check:  http://localhost:4000/api/health
Documentación: http://localhost:5173/documentation/getting-started
```

En desarrollo, el frontend usa `VITE_BACKEND_API_URL` para apuntar al backend. El valor local recomendado es `http://localhost:4000/api`.

---

## Stack

| Área | Tecnología |
| --- | --- |
| Frontend | React 19, Vite, MUI, Ant Design Icons |
| Documentación interna | React Markdown + Remark GFM dentro del frontend |
| Tablas | TanStack Table / Grid.js según módulo |
| Backend | Express sobre Node.js |
| Validación | Zod |
| Base de datos | PostgreSQL |
| ORM | Prisma |
| PDF | pdfme |
| Sesión | Cookie HTTP + almacenamiento en base de datos |
| API externa | Header `x-api-key` con clave hasheada |

---

## Requisitos

- Node.js `>=18.20.8`.
- PostgreSQL accesible desde el backend.
- npm.

---

## Variables de entorno

Puedes usar el archivo raíz como referencia general:

```bash
cp .env.example .env
```

Para desarrollo por carpetas, normalmente se crea cada archivo según el servicio:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Variables principales:

Backend - API HTTP:

| Variable | Descripción |
| --- | --- |
| `DATABASE_URL` | Conexión PostgreSQL usada por Prisma. |
| `API_PORT` | Puerto HTTP del backend. Por defecto `4000`. |
| `WEB_APP_URL` | URL principal del frontend permitida para cookies/CORS. |
| `CORS_ALLOWED_ORIGINS` | Lista separada por comas de orígenes adicionales permitidos. |

Backend - usuario administrador inicial para seed/bootstrap:

| Variable | Descripción |
| --- | --- |
| `INITIAL_ADMIN_EMAIL` | Email del administrador inicial cuando aún no existe ningún usuario en la base de datos. |
| `INITIAL_ADMIN_PASSWORD` | Contraseña del administrador inicial para el seed/bootstrap. |

Backend - autenticación y claves externas:

| Variable | Descripción |
| --- | --- |
| `AUTH_SECRET` | Secreto largo para firmar tokens de sesión. |
| `AUTH_COOKIE_NAME` | Nombre de cookie de sesión. |
| `AUTH_COOKIE_MAX_AGE_SECONDS` | Duración de la cookie de sesión en segundos. |
| `API_KEY_SECRET` | Secreto largo para hashear API keys externas. |

Frontend - build y conexión con backend:

| Variable | Descripción |
| --- | --- |
| `VITE_APP_NAME` | Nombre visible de la aplicación usado en el logo y en el título de la pestaña. |
| `VITE_BACKEND_API_URL` | Base URL del backend que consume el frontend. En local: `http://localhost:4000/api`. |

---

## Instalación

Guía completa: [INSTALL.md](./INSTALL.md).

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

## Scripts

Backend:

| Comando | Uso |
| --- | --- |
| `npm run dev` | Ejecuta `src/server.ts` con tsx. |
| `npm run dev:watch` | Ejecuta backend con watch. |
| `npm run build` | Compila TypeScript a `dist/`. |
| `npm run start` | Ejecuta `dist/server.js`. |
| `npm run check` | Valida TypeScript sin emitir archivos. |
| `npm run prisma:generate` | Genera Prisma Client. |
| `npm run prisma:push` | Sincroniza schema con base de datos. |
| `npm run prisma:migrate` | Crea/aplica migración de desarrollo. |
| `npm run prisma:seed` | Crea datos iniciales. |

Frontend:

| Comando | Uso |
| --- | --- |
| `npm run dev` | Levanta Vite en `5173`. |
| `npm run build` | Compila TypeScript y genera `dist/`. |
| `npm run preview` | Sirve el build de producción localmente. |
| `npm run check` | Valida TypeScript sin emitir archivos. |

---

## Endpoints principales

Autenticación interna por sesión:

```http
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
```

Administración interna:

```http
GET    /api/templates
POST   /api/templates
PATCH  /api/templates/:id/page-settings
DELETE /api/templates/:id

GET    /api/tags
POST   /api/tags

GET    /api/api-credentials
POST   /api/api-credentials
PATCH  /api/api-credentials/:id/revoke

GET    /api/users
GET    /api/permissions
GET    /api/audit-logs
```

API externa con `x-api-key`:

```http
GET  /api/v1/templates
POST /api/v1/render
```

Estado del backend:

```http
GET /api/health
```

---

## Documentación para integradores

La documentación integrada está protegida por sesión y enfocada en consumo externo de API:

```txt
/documentation/getting-started
/documentation/authentication
/documentation/templates
/documentation/api
/documentation/responses
```

Contenido cubierto:

- URLs locales y producción para consumir la API.
- Cómo obtener una API key desde la app con permiso `api_keys.manage`.
- Uso de `templateCode` como contrato externo.
- Formato del payload `input`.
- Ejemplos `curl` y TypeScript.
- Respuestas, códigos HTTP, logging seguro y reintentos.

---

## Estado del render externo

El endpoint `POST /api/v1/render` ya valida API key y recibe el payload. Actualmente responde `501` hasta conectar la generación final con pdfme sobre la versión actual de la plantilla.

---

## Modelo de datos

Núcleo de plantillas:

```txt
template -> template_version -> template_page
```

Reglas principales:

- `template` representa la entidad de negocio.
- `template_version` guarda una versión completa de la plantilla.
- `template_page` guarda diseño y configuración de página.
- `template_version.is_current` define la versión vigente.
- Los PDFs generados no se almacenan por defecto.
- La generación se solicita bajo demanda por API.

---

## Librerías y referencias

Principales librerías usadas o tomadas como referencia para construir la aplicación:

| Área | Librería / referencia | Uso en el proyecto | Repositorio |
| --- | --- | --- | --- |
| PDF | pdfme | Diseño, esquemas y generación de PDFs. | [pdfme/pdfme](https://github.com/pdfme/pdfme) |
| UI base | MUI | Componentes visuales, layout, drawers, tablas y formularios. | [mui/material-ui](https://github.com/mui/material-ui) |
| Inspiración visual | Mantis UI | Referencia de estructura visual tipo dashboard MUI. | [codedthemes/mantis-free-react-admin-template](https://github.com/codedthemes/mantis-free-react-admin-template) |
| Frontend | React | Render de la aplicación web. | [facebook/react](https://github.com/facebook/react) |
| Build frontend | Vite | Servidor dev y build de producción. | [vitejs/vite](https://github.com/vitejs/vite) |
| Rutas frontend | React Router | Navegación interna de la app. | [remix-run/react-router](https://github.com/remix-run/react-router) |
| Data fetching | TanStack Query | Estado de requests y cache cliente. | [TanStack/query](https://github.com/TanStack/query) |
| Tablas | TanStack Table | Tablas tipadas y controladas en frontend. | [TanStack/table](https://github.com/TanStack/table) |
| Tablas | Grid.js | Tablas rápidas para vistas administrativas. | [grid-js/gridjs](https://github.com/grid-js/gridjs) |
| Markdown | React Markdown | Render de documentación interna. | [remarkjs/react-markdown](https://github.com/remarkjs/react-markdown) |
| Markdown GFM | Remark GFM | Tablas, listas y formato GitHub Flavored Markdown. | [remarkjs/remark-gfm](https://github.com/remarkjs/remark-gfm) |
| Scroll | SimpleBar | Scrollbars personalizados y consistentes. | [Grsmto/simplebar](https://github.com/Grsmto/simplebar) |
| Iconos | Ant Design Icons | Iconografía principal del sidebar y acciones. | [ant-design/ant-design-icons](https://github.com/ant-design/ant-design-icons) |
| Iconos | Lucide | Iconos complementarios. | [lucide-icons/lucide](https://github.com/lucide-icons/lucide) |
| Alertas | SweetAlert2 | Diálogos y confirmaciones. | [sweetalert2/sweetalert2](https://github.com/sweetalert2/sweetalert2) |
| Backend | Express | Servidor HTTP y rutas API. | [expressjs/express](https://github.com/expressjs/express) |
| ORM | Prisma | Modelo de datos y cliente PostgreSQL. | [prisma/prisma](https://github.com/prisma/prisma) |
| Validación | Zod | Validación de payloads y DTOs. | [colinhacks/zod](https://github.com/colinhacks/zod) |
| TypeScript runtime | tsx | Ejecución TypeScript en desarrollo. | [privatenumber/tsx](https://github.com/privatenumber/tsx) |
