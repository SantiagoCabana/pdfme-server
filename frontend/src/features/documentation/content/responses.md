# Errores y operación

La API devuelve JSON para consultas y errores. El render exitoso devuelve un PDF binario.

## Formato por caso

| Caso | Código | Respuesta |
| --- | --- | --- |
| Catálogo exitoso | `200` | `{ "data": [...] }` |
| Inspección exitosa | `200` | `{ "template": {...}, "inputs": {...}, "conventions": {...} }` |
| Render exitoso | `200` | Binario PDF con `content-type: application/pdf` |
| Error validado | `4xx` | `{ "message": "..." }` o `{ "ok": false, "message": "..." }` |
| Error inesperado | `500` | `{ "ok": false, "message": "..." }` |

## Códigos HTTP

| Código | Significado | Reintento automático |
| --- | --- | --- |
| `200` | Solicitud completada. | No aplica. |
| `400` | JSON inválido, body incompleto o faltan variables requeridas. | No. |
| `401` | API key ausente, inválida, expirada o bloqueada por origen. | No. |
| `404` | Plantilla no encontrada o archivada. | No, salvo resincronización de catálogo. |
| `409` | Conflicto en rutas administrativas. | No. |
| `500` | Error no esperado renderizando o procesando. | Sí, con backoff y límite. |

## `401` API key inválida

```json
{
  "message": "API key invalida."
}
```

Revisa:

| Punto | Qué confirmar |
| --- | --- |
| Header | Debe llamarse exactamente `x-api-key`. |
| Valor | Debe ser la `rawKey` completa que se mostró al crear la clave. |
| Estado | La clave debe estar activa. |
| Expiración | `expiresAt` no debe estar vencido. |
| Origen | Si hay `allowedOrigins`, el origen del request debe estar permitido. |

## `400` payload inválido

```json
{
  "message": "Payload invalido para renderizar."
}
```

Ocurre cuando el body no cumple la forma mínima:

```json
{
  "templateCode": "codigo_de_plantilla",
  "input": {}
}
```

## `400` faltan variables

```json
{
  "ok": false,
  "message": "Faltan variables requeridas para renderizar la plantilla.",
  "missingVariables": ["nombre_completo", "nro_documento"]
}
```

Esta validación aplica a variables de texto detectadas en `{variable}`. Los objetos cambiables con `#` son reemplazables si los envías, pero no se consideran variables de texto requeridas.

## `404` plantilla no encontrada

```json
{
  "message": "No se encontro la plantilla solicitada."
}
```

Puede ocurrir si el `templateCode` no existe, fue archivado o el consumidor está usando un código antiguo.

## Render exitoso

El render exitoso no devuelve JSON. Devuelve el archivo PDF.

| Header | Uso |
| --- | --- |
| `content-type: application/pdf` | Confirma que la respuesta es PDF. |
| `content-disposition` | Nombre sugerido del archivo. |
| `x-template-code` | Plantilla usada. |
| `x-template-version` | Versión usada. |

## Logging seguro

| Dato | Registrar | Evitar |
| --- | --- | --- |
| `templateCode` | Sí | No aplica. |
| `x-template-version` | Sí | No aplica. |
| Código HTTP | Sí | No aplica. |
| `message` | Sí | No aplica. |
| `missingVariables` | Sí | No aplica. |
| Valores de `input` | Solo si tu política lo permite. | DNI, emails, teléfonos o datos sensibles innecesarios. |
| API key | Solo alias o prefijo seguro. | Clave completa. |
| Tiempo de respuesta | Sí | No aplica. |

## Reintentos

| Error | Política sugerida |
| --- | --- |
| `400` | Corregir payload antes de reenviar. |
| `401` | Revisar clave, expiración u origen. |
| `404` | Resincronizar catálogo y validar `templateCode`. |
| Timeout | Reintentar con backoff exponencial. |
| `500` | Reintentar pocas veces y abrir alerta si persiste. |

## Salud del backend

```http
GET /api/health
```

Respuesta esperada:

```json
{
  "ok": true,
  "service": "pdfme-server-backend"
}
```
