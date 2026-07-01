# Project Status - 2026-07-01

## Objetivo

Construir una plataforma interna para administrar plantillas pdfme y generar PDFs desde API.

La arquitectura queda separada:

- `frontend/`: React + Vite, interfaz principal del usuario.
- `backend/`: Express API, Prisma, PostgreSQL, sesiones, API keys y generacion PDF.

El backend no debe servir panel visual. Solo expone API y logica de negocio.

## Estado Actual

Avance estimado: 62%.

## Avanzado

- Backend convertido a API-only.
- AdminJS eliminado del backend y de dependencias.
- Frontend React/Vite queda como unica interfaz de usuario.
- Login frontend contra `/api/auth/login`.
- Sesion backend con `express-session` y `connect-pg-simple`.
- Rutas internas protegidas por permisos de sesion:
  - `templates.read`
  - `templates.write`
  - `templates.delete`
  - `api-credentials.read`
  - `api-credentials.write`
- Catalogo de plantillas funcional desde frontend.
- Creacion de plantilla crea automaticamente version y pagina base.
- Claves API funcionales: crear, listar y revocar.
- API externa con `x-api-key` para listar plantillas.
- Schema v1 mantiene `template -> template_version -> template_page`.
- Base remota en puerto 5450 inicializada previamente con schema, seed e indice parcial.

## URLs de desarrollo

```txt
Frontend UI: http://localhost:5173
Backend API: http://localhost:4000
Health:      http://localhost:4000/api/health
```

## Faltante Para Probar Bien

1. Ejecutar `backend` con `npm run dev`.
2. Ejecutar `frontend` con `npm run dev`.
3. Iniciar sesion desde `http://localhost:5173`.
4. Crear y eliminar una plantilla desde frontend.
5. Crear y revocar una API key desde frontend.

## Proximas Fases

### Fase 1 - Usuarios

- Crear UI de usuarios.
- Crear endpoints para alta/edicion de usuarios.
- Asignar roles `ADMIN` y `USER` desde frontend.

### Fase 2 - Plantillas

- Expandir edicion de plantilla.
- Soportar formato A4, Letter, Legal y Custom.
- Soportar orientacion vertical/horizontal.
- Soportar padding vertical/horizontal.
- Mostrar preview de primera pagina.

### Fase 3 - pdfme Designer

- Integrar pdfme Designer en frontend.
- Guardar `designerJson` por pagina.
- Cargar version actual para edicion.
- Mostrar JSON backend despues de guardar.

### Fase 4 - Generacion PDF

- Cargar version actual de la plantilla.
- Combinar inputs guardados con inputs recibidos.
- Generar PDF real con pdfme generator.
- Responder `application/pdf` desde `POST /api/v1/render`.

## Riesgos Actuales

- El frontend actual es base funcional, no diseno final.
- Falta integrar pdfme Designer.
- El endpoint render valida API key y scope, pero aun no genera PDF real.
- Los siguientes cambios de base deben hacerse como migraciones revisadas.
