# Visión general

PDF Server expone plantillas PDF mediante una API autenticada para que otros sistemas generen documentos con datos propios. La integración se basa en tres piezas: una API key, un `templateCode` y un objeto `input` con las variables que reemplazará la plantilla.

## Modelo de integración

| Pieza | La entrega | La usa | Propósito |
| --- | --- | --- | --- |
| API key | Administrador de PDF Server | Backend consumidor | Autorizar requests externos. |
| `templateCode` | Administrador o catálogo API | Backend consumidor | Identificar la plantilla estable. |
| Variables | Documentación de la plantilla | Backend consumidor | Completar textos dinámicos. |
| Respuesta API | PDF Server | Backend consumidor | Confirmar resultado o diagnosticar error. |

## URLs usadas en los ejemplos

En local hay dos servicios levantados al mismo tiempo. El frontend sirve la interfaz y el backend expone la API que consumen otros sistemas.

| Servicio | URL local | Uso |
| --- | --- | --- |
| Frontend de administración | `http://localhost:5173` | Iniciar sesión, revisar plantillas y crear claves API. |
| Backend API | `http://localhost:4000/api` | Consumir endpoints externos como `/api/v1/templates`. |
| Documentación | `http://localhost:5173/documentation/getting-started` | Consultar esta guía desde la misma app autenticada. |
| Producción | `https://dominio.com/api` | Reemplaza `dominio.com` por el dominio real publicado. |

Ejemplo local directo contra backend:

```bash
curl -sS "http://localhost:4000/api/v1/templates" \
  -H "x-api-key: $PDFME_API_KEY"
```

Ejemplo en producción:

```bash
curl -sS "https://dominio.com/api/v1/templates" \
  -H "x-api-key: $PDFME_API_KEY"
```

## Flujo recomendado

1. Solicita una API key para tu sistema o entorno.
2. Consulta el catálogo con `GET /api/v1/templates`.
3. Selecciona y guarda el `code` de la plantilla que vas a consumir.
4. Prepara el payload `input` con los nombres exactos de variables.
5. Envía el request de render desde tu backend, no desde frontend público.
6. Registra código HTTP, `templateCode`, usuario solicitante y `message` si ocurre un error.

## Datos mínimos que debes recibir

| Dato | Ejemplo | Observación |
| --- | --- | --- |
| Base URL | `http://localhost:4000/api` o `https://dominio.com/api` | Backend API según ambiente. |
| API key | `pk_live_xxxxxxxxx` | Se muestra una sola vez al crearla. |
| Template code | `certificado_nutricion_a9d8a3d7` | No uses el ID interno como contrato. |
| Variables obligatorias | `nombre_completo`, `nro_documento` | Deben coincidir exactamente con la plantilla. |
| Formato de fechas | `30 de septiembre del 2025` | Envíalas ya formateadas para el documento final. |

## Responsabilidades del sistema consumidor

- Guardar la API key como secreto de servidor.
- Validar campos obligatorios antes de llamar a PDF Server.
- Enviar valores ya normalizados y listos para impresión.
- No depender del texto visual de la plantilla para lógica de negocio.
- Manejar explícitamente errores `400`, `401`, `404`, `409` y `5xx`.
- Mantener trazabilidad del request sin exponer datos sensibles innecesarios.

## Qué no debe hacer una integración

| Evitar | Motivo |
| --- | --- |
| Enviar API key desde navegador público. | Cualquier usuario podría extraerla. |
| Guardar solo el `id` de plantilla. | Es un identificador interno, no contrato externo. |
| Inventar nombres de variables. | Los nombres deben existir en el diseño. |
| Mandar fechas sin formato final. | La plantilla no debe resolver localización ni redacción. |
| Reintentar indefinidamente errores `4xx`. | Indican problema de contrato, autenticación o permisos. |

> Trata el `templateCode` y la lista de variables como un contrato de integración. Si el administrador cambia variables o estructura del documento, el consumidor debe actualizar su payload y volver a probar.
