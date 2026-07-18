# Errores y operación

Un consumidor externo debe tratar cada respuesta como parte de un contrato operativo: código HTTP, cuerpo JSON, trazabilidad y política de reintentos.

## Formato de respuesta

| Caso | Forma esperada |
| --- | --- |
| Consulta exitosa | `{ "data": [...] }` |
| Render exitoso | Binario PDF con `content-type: application/pdf` |
| Error de autenticación | `{ "message": "API key invalida." }` |
| Error de render | `{ "message": "..." }` |

## Códigos HTTP

| Código | Significado | Reintento automático |
| --- | --- | --- |
| `200` | Solicitud completada. | No aplica. |
| `400` | JSON inválido o body incompleto. | No. |
| `401` | API key ausente, inválida, expirada o bloqueada por origen. | No. |
| `404` | Recurso no encontrado. | No, salvo sincronización de catálogo. |
| `409` | Conflicto de estado o unicidad. | No. |
| `5xx` | Error inesperado del servidor. | Sí, con backoff y límite. |

## `401` autenticación

```json
{
  "message": "API key invalida."
}
```

Diagnóstico recomendado:

| Revisión | Qué confirmar |
| --- | --- |
| Header | Debe llamarse exactamente `x-api-key`. |
| Valor | Debe ser la `rawKey` completa mostrada al crear la clave. |
| Estado | La clave debe estar activa. |
| Expiración | `expiresAt` no debe estar vencido. |
| Origen | Si hay `allowedOrigins`, el origen del request debe estar permitido. |

No registres la API key completa. Si necesitas correlación, guarda solo un prefijo seguro como `pk_live_abcd...`.

## `400` render rechazado

```json
{
  "message": "Faltan variables requeridas para renderizar la plantilla.",
  "missingVariables": ["nro_documento"]
}
```

Esta respuesta indica que la API key fue aceptada, pero el payload no cumple el contrato de la plantilla. Corrige el `input` antes de reenviar.

## Logging seguro

| Dato | Registrar | No registrar | Nota |
| --- | --- | --- | --- |
| `templateCode` | Sí | No aplica. | Permite ubicar el contrato usado. |
| HTTP status | Sí | No aplica. | Permite diagnóstico rápido. |
| `message` | Sí | No aplica. | Explica el rechazo sin exponer secretos. |
| Correlation ID interno | Sí | No aplica. | Une logs del consumidor con logs del backend. |
| Variables enviadas | Solo si la política lo permite. | DNI, emails, teléfonos o datos sensibles innecesarios. | Registra nombres de campos si no puedes guardar valores. |
| API key | Solo prefijo seguro o alias. | Clave completa. | Nunca guardar la `rawKey` completa en logs. |
| Tiempo de respuesta | Sí | No aplica. | Ayuda a detectar latencia o timeouts. |

## Reintentos

| Error | Política sugerida |
| --- | --- |
| `400` | Corregir payload antes de reenviar. |
| `401` | Revisar clave, expiración u origen. |
| `404` | Resincronizar catálogo y validar `templateCode`. |
| Timeout | Reintentar con backoff exponencial. |
| `5xx` | Reintentar pocas veces y abrir alerta si persiste. |

## Salud del servicio

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

Usa esta ruta para separar problemas de red o despliegue de errores propios de autenticación, plantilla o payload.

## Checklist operativo

| Control | Recomendación |
| --- | --- |
| Ambientes | Usar una API key distinta para desarrollo, staging y producción. |
| Rotación | Crear clave nueva, cambiar consumidor y revocar la anterior. |
| Monitoreo | Alertar por aumentos de `401`, `404`, `5xx` o timeouts. |
| Trazabilidad | Guardar `templateCode`, versión y usuario solicitante. |
| Seguridad | No exponer claves en frontend, URLs, capturas ni logs. |
