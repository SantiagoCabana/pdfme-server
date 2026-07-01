# Project Status - 2026-07-01

## Objetivo

Construir una plataforma interna para administrar plantillas pdfme y generar PDFs desde API.

El resultado final debe tener:

- Una sola app backend con Express, AdminJS, Prisma, PostgreSQL y API protegida.
- AdminJS como panel principal.
- Paginas custom de AdminJS para flujos de negocio como plantillas.
- Gestion de usuarios internos con rangos simples: Admin y User.
- Gestion de credenciales API con expiracion, scopes y revocacion.
- Plantillas versionadas con paginas, formato, orientacion, padding y JSON de pdfme.
- Endpoint externo para generar PDF con datos dinamicos, QR y campos variables.

## Estado Actual

Avance estimado: 60%.

La base Next monolito fue reemplazada por una sola app `backend/` con AdminJS como panel principal.

## Avanzado

- Repositorio limpiado de archivos Next que ya no se usaran.
- Frontend conservado como proyecto auxiliar React/Vite; redirige al panel principal y no es una segunda experiencia para usuarios finales.
- Raiz dejada solo para presentacion y metadatos.
- Variables de entorno consolidadas en `backend/.env`.
- `backend/package.json` independiente creado.
- Prisma movido a `backend/prisma`.
- Seed backend creado para roles, permisos y admin inicial.
- Backend Express creado.
- AdminJS montado en `/` como panel principal.
- AdminJS tiene pagina custom `Plantillas`.
- Sesiones AdminJS preparadas con PostgreSQL.
- API base creada:
  - `GET /api/health`
  - `GET /api/templates`
  - `POST /api/templates`
  - `DELETE /api/templates/:id`
  - `GET /api/v1/templates`
  - `POST /api/v1/render`
  - `GET /api/api-credentials`
  - `POST /api/api-credentials`
  - `PATCH /api/api-credentials/:id/revoke`
- README actualizado: AdminJS es panel principal y frontend queda como fuente de UI integrable.
- Dependencias instaladas solo en `backend/`.
- `npm run check` validado correctamente en backend.
- Backend `npm run dev` ajustado sin watcher obligatorio para evitar `ENOSPC`.
- AdminJS `admin.watch()` desactivado para evitar watchers de Rollup sobre `.adminjs`.
- Schema aplicado en PostgreSQL remoto con `prisma:push`.
- Seed aplicado: usuarios, roles y permisos iniciales.
- AdminJS configurado con recursos explicitos y propiedades por accion.
- Campos sensibles ocultos en AdminJS: passwordHash, keyHash y secretPreview.
- AuditEvent y AdminSession quedaron como recursos de solo lectura.
- Reglas AdminJS/DB documentadas en `docs/ADMINJS_DATABASE_RULES.md`.
- Schema aprobado como v1 estable y documentado en `docs/SCHEMA_V1_DECISIONS.md`.
- Indice parcial `template_version_one_current_per_template` verificado en PostgreSQL remoto.
- Base nueva en puerto 5450 inicializada con schema, seed e indice parcial.
- Backend API keys validado funcionalmente: crear, listar, usar contra templates y revocar.
- AdminJS no expone Template/TemplateVersion/TemplatePage como CRUD visible.
- Backend interno `/api/templates` crea plantillas como una sola entidad y genera version/pagina inicial automaticamente.
- La pagina custom de AdminJS usa `/api/templates` para manejar plantillas como entidad unica.
- Frontend auxiliar apunta al panel principal de AdminJS para evitar dos vistas separadas.
- Endpoints externos validan scopes desde `api_credential_permission`.

## Faltante Para Probar Bien

1. Ejecutar backend desde `backend/` con `npm run dev`.
2. Validar login AdminJS con las credenciales configuradas.
3. Validar pagina AdminJS `Plantillas` en `http://localhost:4000/pages/templates`.
4. Crear y eliminar una plantilla desde el panel AdminJS.
5. Confirmar que la base remota acepta conexiones estables desde el entorno local.

## Proximas Fases

### Fase 1 - Validacion tecnica

- Confirmar login de AdminJS.
- Confirmar conexion a PostgreSQL desde AdminJS.
- Confirmar que la pagina custom `Plantillas` opera correctamente.

### Fase 2 - Plantillas

- Expandir endpoints de plantillas para edicion completa.
- Convertir creacion de plantilla a modal empresarial dentro de AdminJS.
- Agregar editor de metadatos: nombre, etiquetas, formato, orientacion y padding.
- Agregar vista de edicion que cargue la plantilla sin exponer recursos tecnicos.

### Fase 3 - pdfme Designer

- Integrar pdfme Designer dentro de una pagina custom de AdminJS.
- Guardar `designerJson` por pagina.
- Soportar A4, Letter, Legal y Custom.
- Soportar vertical/horizontal sin recargar toda la vista.
- Mostrar JSON backend despues de guardar.

### Fase 4 - Generacion PDF

- Cargar version actual de la plantilla.
- Combinar inputs guardados con inputs recibidos.
- Generar PDF real con pdfme generator.
- Responder `application/pdf` desde `POST /api/v1/render`.
- Validar QR dinamico y campos variables.

### Fase 5 - Seguridad operativa

- Registrar ultimo uso de API keys.
- Definir permisos finales Admin/User.
- Agregar auditoria minima para acciones importantes.

## Riesgos Actuales

- No deben existir dos experiencias visuales separadas para el usuario final; las vistas de negocio deben integrarse en AdminJS.

- Falta validar manualmente la pagina custom de AdminJS en navegador.
- El endpoint de render valida API key y scope `documents.generate`, pero aun no genera PDF real.
- El editor pdfme todavia no esta integrado.
- El schema v1 ya esta aplicado; los siguientes cambios de base deben hacerse como migraciones revisadas.
