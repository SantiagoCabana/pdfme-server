# Frontend documentation route

## Objetivo

Se agrego una vista separada de documentacion para usuarios internos y desarrolladores que integran la API de `pdfme-server`.

## Ruta

```txt
/documentation/{rutas}
```

Rutas actuales:

- `/documentation/getting-started`
- `/documentation/templates`
- `/documentation/api`
- `/documentation/access-control`

## Comportamiento

- La vista **no usa el sidebar** de `PrivateLayout`.
- La vista sí depende de la **sesión activa** del frontend.
- Si no existe sesión cargada en `AppContext`, redirige a `/login`.

## Implementación

Ubicación principal:

```txt
frontend/src/features/documentation/
```

Piezas:

- `DocumentationPage.tsx`: shell y navegación propia.
- `docsRegistry.ts`: registro de slugs y contenido.
- `content/*.md`: artículos markdown renderizados en runtime.

## Render

Se usa:

- `react-markdown`
- `remark-gfm`
- tema visual del frontend vía MUI + `app.css`

## Contenido documentado

- Uso de la aplicacion para crear y preparar plantillas.
- Como crear y entregar claves API.
- Header de autenticacion `x-api-key`.
- Ejemplos `curl` y JavaScript.
- Formato de respuesta de `GET /api/v1/templates`.
- Estado actual de `POST /api/v1/render`, que valida API key pero responde `501`.
- Errores frecuentes y codigos HTTP esperados.

## Acceso desde la app

Se añadió la entrada **Documentación** en el sidebar principal. Esa opción navega a la ruta externa de documentación, por lo que al entrar desaparece el sidebar y se monta la shell específica.

## Estado del backend

Con base en los logs mostrados durante esta implementacion, el backend respondio correctamente al flujo principal que consume el frontend:

- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/templates`
- `GET /api/tags`
- `GET /api/templates/by-code/:code`
- `PATCH /api/templates/:id/page-settings`

La ruta externa `POST /api/v1/render` existe, pero por codigo responde `501` con el mensaje:

```json
{
  "ok": false,
  "message": "Render reservado. Falta conectar pdfme generator al TemplateVersion actual."
}
```
