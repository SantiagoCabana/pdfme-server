# Guia rapida

Esta documentacion explica como usar la aplicacion y como consumirla desde sistemas externos por API.

## Flujo recomendado

1. Inicia sesion en el frontend.
2. Crea o edita una plantilla en **Plantillas**.
3. Revisa la vista previa para confirmar que textos, imagenes, QR y variables se muestran como esperas.
4. Crea una clave en **Claves API** si un sistema externo va a consultar plantillas o solicitar render.
5. Entrega al desarrollador el `code` de la plantilla y la `rawKey` de la clave API.

## URLs de desarrollo

| Servicio | URL |
| --- | --- |
| Frontend | `http://localhost:5173` |
| Backend API | `http://localhost:4000` |
| Documentacion | `http://localhost:5173/documentation/getting-started` |

## Roles dentro de la app

| Accion | Permiso necesario |
| --- | --- |
| Ver plantillas | `templates.view` |
| Crear plantillas | `templates.create` |
| Editar plantillas | `templates.edit` |
| Eliminar plantillas | `templates.delete` |
| Gestionar claves API | `api_keys.manage` |
| Ver auditoria | `audit.view` |

## Datos que necesita un desarrollador

Para integrar un sistema externo, entrega estos datos:

| Dato | Ejemplo | Donde se obtiene |
| --- | --- | --- |
| Base URL | `https://dominio.com/api` | Configuracion del despliegue |
| API key | `pk_live_xxxxx` | Se muestra una sola vez al crear la clave |
| Template code | `c1_docencia_en_salud_a9d8a3d7` | Listado o detalle de plantilla |
| Variables esperadas | `nombre_completo`, `nro_documento` | Campos de texto en el editor |

> La `rawKey` no se puede recuperar despues. Si se pierde, crea una clave nueva y revoca la anterior.

## Estado actual

La API externa ya autentica por `x-api-key` y lista plantillas. El endpoint de render existe, valida la API key y responde `501` porque el generador pdfme final aun no esta conectado.
